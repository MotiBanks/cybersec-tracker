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
