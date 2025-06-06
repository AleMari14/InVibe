import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getUserByEmail } from "@/lib/services/userService"
import { compare } from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

/**
 * NextAuth configuration options
 * Handles both Google OAuth and email/password authentication
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth provider configuration
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
    // Email/password credentials provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          // Demo user for testing purposes
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

          if (!user || !user.password || !user._id) {
            throw new Error("Invalid credentials")
          }

          const isValidPassword = await compare(credentials.password, user.password)
          if (!isValidPassword) {
            throw new Error("Invalid credentials")
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image || null,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      }
    }),
  ],
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Custom pages for authentication flows
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
  // Auth callbacks
  callbacks: {
    // JWT callback - adds user info to the token
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    // Session callback - adds user info to the session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        
        // Log the session data for debugging
        console.log("🔑 Session callback - Token:", {
          id: token.id,
          email: token.email,
          name: token.name,
          picture: token.picture
        })
        console.log("🔑 Session callback - Updated session:", {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        })
      }
      return session
    },
    // Sign in callback - handles user creation/update for Google OAuth
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const client = await clientPromise
          const db = client.db()
          const users = db.collection("users")

          const normalizedEmail = user.email?.toLowerCase()
          const existingUser = await getUserByEmail(normalizedEmail || "")

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
          } else if (existingUser._id) {
            user.id = existingUser._id.toString()

            // Update user info if needed
            await users.updateOne(
              { _id: new ObjectId(existingUser._id) },
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
          // Non-blocking error - allow sign in to continue
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
