# Cybersecurity Learning Tracker

A comprehensive application for tracking your cybersecurity learning journey, monitoring progress, and maintaining motivation through gamification.

## Features

- **Task Management**: Schedule and track daily learning tasks
- **Mood Tracking**: Monitor your emotional state during learning
- **Reflection Journal**: Document insights and learning experiences
- **XP & Streaks**: Gamified progress tracking
- **Language Skills**: Track programming language proficiency
- **Weekly Reports**: Export summaries of your learning activities

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Authentication**: Supabase Auth with email/magic link
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Supabase account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cybersec-tracker.git
   cd cybersec-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a Supabase project:
   - Sign up at [Supabase](https://supabase.com)
   - Create a new project
   - Go to Project Settings > API to get your API keys

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `lib/supabase-schema.sql`
   - Run the SQL script to create all tables and functions

6. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Backend Architecture

### Database Tables

- `users` - User profiles and streak information
- `tasks` - Scheduled learning tasks
- `reflections` - Journal entries
- `moods` - Daily mood logs
- `xp_tracker` - Experience points tracking
- `languages` - Programming languages
- `user_languages` - User's language proficiency
- `notifications` - System notifications
- `weekly_reports` - Weekly summary reports

### Authentication

The application uses Supabase Auth with:
- Email/password authentication
- Magic link authentication
- Persistent sessions

### Real-time Updates

The application leverages Supabase's real-time capabilities for:
- Task updates
- Mood tracking
- Reflection entries
- Notifications
- XP and streak changes

### Database Functions

The backend includes PostgreSQL functions for:
- Streak tracking
- XP calculations
- Weekly report generation
- Burnout detection
- Notification creation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
