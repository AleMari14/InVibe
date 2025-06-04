# Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required Variables

\`\`\`env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps API (server-side only)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001
PORT=3000
\`\`\`

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Maps JavaScript API and Places API
4. Create an API key
5. Add the API key as `GOOGLE_MAPS_API_KEY` in your environment variables

**Important**: Do NOT use the `NEXT_PUBLIC_` prefix for the Google Maps API key as it contains sensitive information that should not be exposed to the client.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Create OAuth 2.0 Client IDs
4. Add your domain to authorized origins
5. Add the client ID and secret to your environment variables

### MongoDB Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Add it as `MONGODB_URI` in your environment variables

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Production Deployment

Make sure to set all environment variables in your hosting platform (Vercel, etc.) before deploying.
