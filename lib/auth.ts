import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getUserByEmail } from "@/lib/services/userService"
import { compare } from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Demo user for testing
          if (credentials.email.toLowerCase() === "marco@example.com" && credentials.password === "password123") {
            return {
              id: "demo-user-id",
              email: "marco@example.com",
              name: "Marco Rossi",
              image: null,
            }
          }

          const normalizedEmail = credentials.email.toLowerCase().trim()
          const user = await getUserByEmail(normalizedEmail)

          if (user && user.password) {
            const isValidPassword = await compare(credentials.password, user.password)
            if (isValidPassword) {
              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                image: user.image || null,
              }
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
          // Fallback to demo user in case of DB errors
          if (credentials.email.toLowerCase() === "marco@example.com" && credentials.password === "password123") {
            return {
              id: "demo-user-id",
              email: "marco@example.com",
              name: "Marco Rossi",
              image: null,
            }
          }
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const client = await clientPromise
          const db = client.db()
          const users = db.collection("users")

          const normalizedEmail = user.email?.toLowerCase()
          const existingUser = await getUserByEmail(normalizedEmail)

          if (!existingUser) {
            // Create new user from Google login
            const newUser = {
              name: user.name || "",
              email: normalizedEmail || "",
              image: user.image,
              emailVerified: new Date(),
              verified: true,
              rating: 4.8,
              reviewCount: 0,
              joinDate: new Date(),
              favorites: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              provider: "google",
              googleId: profile?.sub || user.id,
            }

            const result = await users.insertOne(newUser)
            user.id = result.insertedId.toString()
          } else {
            user.id = existingUser._id.toString()

            // Update user info if needed
            await users.updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  updatedAt: new Date(),
                },
              },
            )
          }
        } catch (error) {
          console.error("Error handling Google user:", error)
          // Non-blocking error
        }
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, append it to the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // If the URL is already absolute but on the same origin, allow it
      else if (url.startsWith(baseUrl)) {
        return url
      }
      // Otherwise, redirect to the base URL
      return baseUrl
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}
