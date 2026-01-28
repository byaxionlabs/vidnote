# Theo-Notes 🌹

> Actionable insights from Theo's (@t3dotgg) YouTube videos, powered by Gemini AI.

![Theo-Notes](https://img.shields.io/badge/Theo--Notes-Quantum%20Rose-ff6b9d)

## Features

- 🎬 **Video Processing**: Paste any video from Theo's channel and extract insights
- 🤖 **AI-Powered**: Uses Google Gemini to analyze video content directly
- ✅ **Action Items**: Get clear action items, key takeaways, and insights
- 📊 **Progress Tracking**: Mark items as complete and track your progress
- 🌙 **Dark/Light Mode**: Beautiful Quantum Rose theme with toggle
- 🔐 **Authentication**: Secure user accounts with Better Auth

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth
- **AI**: Google Gemini AI
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

1. [Node.js](https://nodejs.org/) v20 or higher
2. [Neon Database](https://neon.tech) account (free tier available)
3. [Google AI Studio](https://aistudio.google.com/) API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/theo-notes.git
   cd theo-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   # Neon Database URL (get from Neon console)
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

   # Better Auth secret (generate a random 32+ char string)
   BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-chars

   # Google Gemini API Key (get from Google AI Studio)
   GEMINI_API_KEY=your-gemini-api-key

   # App URLs
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Push database schema to Neon**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) 🎉

## Database Commands

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add your environment variables
4. Deploy!

### Environment Variables for Production

Make sure to update these for production:
- `BETTER_AUTH_URL` → Your production URL
- `NEXT_PUBLIC_APP_URL` → Your production URL
- `BETTER_AUTH_SECRET` → A new, secure random string

## Channel Restriction

This app is built exclusively for Theo's YouTube channel (@t3dotgg). Attempting to add videos from other channels will result in funny error messages! 😄

## License

MIT

---

Built with 💖 for the Theo community
