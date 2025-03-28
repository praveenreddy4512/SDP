# APSRTC Bus Ticketing System

A full-featured bus ticketing system for APSRTC, built with Next.js, Prisma, and PostgreSQL.

## Features

- 🚌 Comprehensive bus management for APSRTC routes
- 🎫 Ticket booking and reservation system
- 🧑‍💼 Vendor POS system for bus operators
- 🔐 Admin dashboard for system management
- 🤖 Self-service kiosk interface
- 📊 Analytics and reporting capabilities

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Deployment on Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (You can use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or any other PostgreSQL provider)
3. Git repository with your code

### Steps to Deploy

1. **Fork or clone this repository**

   ```
   git clone https://github.com/yourusername/apsrtc-bus-ticketing.git
   cd apsrtc-bus-ticketing
   ```

2. **Create a PostgreSQL Database**

   You can create a PostgreSQL database on Vercel:
   
   - Go to the [Vercel Dashboard](https://vercel.com/dashboard)
   - Click on "Storage"
   - Select "Create Postgres Database"
   - Follow the instructions to set up your database

   Or use any other PostgreSQL provider of your choice.

3. **Set up environment variables**

   Create a `.env.local` file with the required environment variables:

   ```
   DATABASE_URL="postgres://username:password@host:5432/database?sslmode=require"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="https://your-vercel-deployment-url.vercel.app"
   ```

4. **Push to GitHub**

   ```
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

5. **Deploy to Vercel**

   - Go to the [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your repository
   - Configure your project:
     - Set the Framework Preset to "Next.js"
     - Add the environment variables from your `.env.local` file
   - Click "Deploy"

6. **Run database migrations**

   After deployment, connect to your PostgreSQL database and run the migrations:

   ```
   npx prisma migrate deploy
   ```

   Alternatively, you can add this command to your build script in `package.json`:

   ```json
   "build": "prisma migrate deploy && next build"
   ```

7. **Seed the database (optional)**

   If you want to seed your database with initial data, you can run:

   ```
   npm run seed
   ```

## Local Development

1. Clone the repository
   ```
   git clone https://github.com/yourusername/apsrtc-bus-ticketing.git
   cd apsrtc-bus-ticketing
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file with your environment variables
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/apsrtc?schema=public"
   NEXTAUTH_SECRET="development-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Run migrations and generate Prisma client
   ```
   npx prisma migrate dev
   ```

5. Start the development server
   ```
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
