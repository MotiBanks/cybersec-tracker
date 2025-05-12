-- Supabase Schema for Cybersecurity Learning Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_active_date TIMESTAMP WITH TIME ZONE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  recurring_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Reflections table
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Moods table
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_type TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- XP Tracker table
CREATE TABLE IF NOT EXISTS public.xp_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT
);

-- User Languages table
CREATE TABLE IF NOT EXISTS public.user_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  proficiency INTEGER NOT NULL DEFAULT 1,
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, language_id)
);

-- Language Practice History
CREATE TABLE IF NOT EXISTS public.language_practice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_language_id UUID NOT NULL REFERENCES public.user_languages(id) ON DELETE CASCADE,
  practice_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  duration_minutes INTEGER,
  xp_earned INTEGER
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Weekly Exports table
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  xp_gained INTEGER,
  tasks_completed INTEGER,
  reflections_count INTEGER,
  languages_practiced TEXT[],
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  report_data JSONB,
  markdown_content TEXT,
  csv_content TEXT
);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  requirement TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User Badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Mood Suggestions table
CREATE TABLE IF NOT EXISTS public.mood_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_type TEXT NOT NULL,
  suggestion TEXT NOT NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Hack Challenges table
CREATE TABLE IF NOT EXISTS public.hack_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  code_snippet TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Policies

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Tasks table policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON public.tasks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- Reflections table policies
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections" 
  ON public.reflections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reflections" 
  ON public.reflections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" 
  ON public.reflections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections" 
  ON public.reflections FOR DELETE 
  USING (auth.uid() = user_id);

-- Moods table policies
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own moods" 
  ON public.moods FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own moods" 
  ON public.moods FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- XP Tracker table policies
ALTER TABLE public.xp_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP records" 
  ON public.xp_tracker FOR SELECT 
  USING (auth.uid() = user_id);

-- User Languages table policies
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own language records" 
  ON public.user_languages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own language records" 
  ON public.user_languages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language records" 
  ON public.user_languages FOR UPDATE 
  USING (auth.uid() = user_id);

-- Language Practice History table policies
ALTER TABLE public.language_practice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own language practice history" 
  ON public.language_practice_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_languages ul 
    WHERE ul.id = language_practice_history.user_language_id 
    AND ul.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own language practice history" 
  ON public.language_practice_history FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_languages ul 
    WHERE ul.id = language_practice_history.user_language_id 
    AND ul.user_id = auth.uid()
  ));

-- Notifications table policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Weekly Reports table policies
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly reports" 
  ON public.weekly_reports FOR SELECT 
  USING (auth.uid() = user_id);

-- User Badges table policies
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges" 
  ON public.user_badges FOR SELECT 
  USING (auth.uid() = user_id);

-- Calendar Events table policies
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events" 
  ON public.calendar_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" 
  ON public.calendar_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
  ON public.calendar_events FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
  ON public.calendar_events FOR DELETE 
  USING (auth.uid() = user_id);

-- Courses table policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own courses" 
  ON public.courses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
  ON public.courses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
  ON public.courses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" 
  ON public.courses FOR DELETE 
  USING (auth.uid() = user_id);

-- Public tables (no user_id)
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view languages" ON public.languages FOR SELECT USING (true);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

ALTER TABLE public.mood_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mood suggestions" ON public.mood_suggestions FOR SELECT USING (true);

ALTER TABLE public.hack_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hack challenges" ON public.hack_challenges FOR SELECT USING (true);

-- Database Functions

-- Function to increment user XP
CREATE OR REPLACE FUNCTION public.increment_user_xp(user_id UUID, xp_amount INTEGER, source TEXT DEFAULT 'task', source_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Update user's total XP
  UPDATE public.users
  SET xp = xp + xp_amount,
      level = GREATEST(1, FLOOR(POWER((xp + xp_amount) / 100.0, 0.4))::INTEGER)
  WHERE id = user_id;
  
  -- Record the XP transaction
  INSERT INTO public.xp_tracker (user_id, xp_amount, source, source_id)
  VALUES (user_id, xp_amount, source, source_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_id UUID)
RETURNS void AS $$
DECLARE
  last_active TIMESTAMP WITH TIME ZONE;
  current_date TIMESTAMP WITH TIME ZONE := NOW();
  streak_count INTEGER;
BEGIN
  -- Get the user's last active date and current streak
  SELECT u.last_active_date, u.streak_count
  INTO last_active, streak_count
  FROM public.users u
  WHERE u.id = user_id;
  
  -- If first activity or no previous activity
  IF last_active IS NULL THEN
    UPDATE public.users
    SET streak_count = 1,
        last_active_date = current_date
    WHERE id = user_id;
  ELSE
    -- Check if the last activity was yesterday
    IF (EXTRACT(EPOCH FROM current_date) - EXTRACT(EPOCH FROM last_active)) <= 172800 -- 48 hours in seconds
       AND DATE_TRUNC('day', current_date) > DATE_TRUNC('day', last_active) THEN
      -- Increment streak
      UPDATE public.users
      SET streak_count = streak_count + 1,
          last_active_date = current_date
      WHERE id = user_id;
    -- Check if the last activity was today
    ELSIF DATE_TRUNC('day', current_date) = DATE_TRUNC('day', last_active) THEN
      -- Just update the timestamp, don't change streak
      UPDATE public.users
      SET last_active_date = current_date
      WHERE id = user_id;
    ELSE
      -- Reset streak if more than a day has been missed
      UPDATE public.users
      SET streak_count = 1,
          last_active_date = current_date
      WHERE id = user_id;
    END IF;
  END IF;
  
  -- Check for streak milestone and create notification if needed
  IF MOD(streak_count, 5) = 0 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      user_id, 
      'Streak Milestone!', 
      'Congratulations! You''ve reached a ' || streak_count || ' day streak!', 
      'achievement'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for burnout (too many tasks completed in a short period)
CREATE OR REPLACE FUNCTION public.check_for_burnout()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT 
      u.id, 
      COUNT(t.id) as task_count
    FROM 
      public.users u
      JOIN public.tasks t ON u.id = t.user_id
    WHERE 
      t.completed = true 
      AND t.completed_at > NOW() - INTERVAL '24 hours'
    GROUP BY 
      u.id
    HAVING 
      COUNT(t.id) > 10
  LOOP
    -- Create a burnout warning notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      user_record.id,
      'Potential Burnout Warning',
      'You''ve completed ' || user_record.task_count || ' tasks in the last 24 hours. Consider taking a break!',
      'warning'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for missed streaks
CREATE OR REPLACE FUNCTION public.check_for_missed_streaks()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT 
      u.id,
      u.streak_count,
      u.last_active_date
    FROM 
      public.users u
    WHERE 
      u.last_active_date < NOW() - INTERVAL '20 hours'
      AND u.last_active_date > NOW() - INTERVAL '30 hours'
      AND u.streak_count > 2
  LOOP
    -- Create a streak warning notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      user_record.id,
      'Streak at Risk!',
      'Your ' || user_record.streak_count || ' day streak will be lost if you don''t complete a task today!',
      'warning'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly summary
CREATE OR REPLACE FUNCTION public.generate_weekly_summary(user_id UUID, week_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
  xp_gained INTEGER := 0;
  tasks_completed INTEGER := 0;
  reflections_count INTEGER := 0;
  languages_practiced TEXT[] := '{}';
  report_data JSONB;
  report_id UUID;
  markdown_content TEXT;
  csv_content TEXT;
BEGIN
  -- Set default week start to beginning of current week if not provided
  IF week_start_date IS NULL THEN
    start_date := DATE_TRUNC('week', NOW());
  ELSE
    start_date := DATE_TRUNC('week', week_start_date);
  END IF;
  
  end_date := start_date + INTERVAL '6 days 23 hours 59 minutes 59 seconds';
  
  -- Calculate XP gained during the week
  SELECT COALESCE(SUM(xp_amount), 0)
  INTO xp_gained
  FROM public.xp_tracker
  WHERE user_id = generate_weekly_summary.user_id
    AND earned_at BETWEEN start_date AND end_date;
  
  -- Count completed tasks
  SELECT COUNT(*)
  INTO tasks_completed
  FROM public.tasks
  WHERE user_id = generate_weekly_summary.user_id
    AND completed = true
    AND completed_at BETWEEN start_date AND end_date;
  
  -- Count reflections
  SELECT COUNT(*)
  INTO reflections_count
  FROM public.reflections
  WHERE user_id = generate_weekly_summary.user_id
    AND created_at BETWEEN start_date AND end_date;
  
  -- Get languages practiced
  SELECT ARRAY_AGG(DISTINCT l.name)
  INTO languages_practiced
  FROM public.language_practice_history lph
  JOIN public.user_languages ul ON lph.user_language_id = ul.id
  JOIN public.languages l ON ul.language_id = l.id
  WHERE ul.user_id = generate_weekly_summary.user_id
    AND lph.practice_date BETWEEN start_date AND end_date;
  
  -- Build report data JSON
  report_data := jsonb_build_object(
    'xp_gained', xp_gained,
    'tasks_completed', tasks_completed,
    'reflections_count', reflections_count,
    'languages_practiced', languages_practiced,
    'start_date', start_date,
    'end_date', end_date
  );
  
  -- Generate markdown content
  markdown_content := '# Weekly Progress Report' || E'\n\n' ||
                     'Week of ' || TO_CHAR(start_date, 'Mon DD, YYYY') || ' to ' || TO_CHAR(end_date, 'Mon DD, YYYY') || E'\n\n' ||
                     '## Summary' || E'\n\n' ||
                     '- XP Gained: ' || xp_gained || E'\n' ||
                     '- Tasks Completed: ' || tasks_completed || E'\n' ||
                     '- Reflections Written: ' || reflections_count || E'\n' ||
                     '- Languages Practiced: ' || COALESCE(ARRAY_TO_STRING(languages_practiced, ', '), 'None') || E'\n\n';
  
  -- Generate CSV content
  csv_content := 'Metric,Value' || E'\n' ||
                'XP Gained,' || xp_gained || E'\n' ||
                'Tasks Completed,' || tasks_completed || E'\n' ||
                'Reflections Written,' || reflections_count || E'\n' ||
                'Languages Practiced,"' || COALESCE(ARRAY_TO_STRING(languages_practiced, ', '), 'None') || '"' || E'\n';
  
  -- Insert or update weekly report
  INSERT INTO public.weekly_reports (
    user_id, 
    week_start, 
    week_end, 
    xp_gained, 
    tasks_completed, 
    reflections_count, 
    languages_practiced, 
    report_data,
    markdown_content,
    csv_content
  )
  VALUES (
    generate_weekly_summary.user_id,
    start_date,
    end_date,
    xp_gained,
    tasks_completed,
    reflections_count,
    languages_practiced,
    report_data,
    markdown_content,
    csv_content
  )
  ON CONFLICT (user_id, week_start) 
  DO UPDATE SET
    xp_gained = EXCLUDED.xp_gained,
    tasks_completed = EXCLUDED.tasks_completed,
    reflections_count = EXCLUDED.reflections_count,
    languages_practiced = EXCLUDED.languages_practiced,
    generated_at = NOW(),
    report_data = EXCLUDED.report_data,
    markdown_content = EXCLUDED.markdown_content,
    csv_content = EXCLUDED.csv_content
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Trigger to update streak when a task is completed
CREATE OR REPLACE FUNCTION public.task_completion_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    -- Update user streak
    PERFORM public.update_user_streak(NEW.user_id);
    
    -- Add XP for task completion
    PERFORM public.increment_user_xp(NEW.user_id, NEW.xp_reward, 'task', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_completed_trigger
AFTER UPDATE ON public.tasks
FOR EACH ROW
WHEN (NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL))
EXECUTE FUNCTION public.task_completion_trigger();

-- Trigger to update streak when a mood is recorded
CREATE OR REPLACE FUNCTION public.mood_recorded_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user streak
  PERFORM public.update_user_streak(NEW.user_id);
  
  -- Add XP for mood recording
  PERFORM public.increment_user_xp(NEW.user_id, 5, 'mood', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mood_recorded_trigger
AFTER INSERT ON public.moods
FOR EACH ROW
EXECUTE FUNCTION public.mood_recorded_trigger();

-- Trigger to update streak when a reflection is created
CREATE OR REPLACE FUNCTION public.reflection_created_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user streak
  PERFORM public.update_user_streak(NEW.user_id);
  
  -- Add XP for reflection
  PERFORM public.increment_user_xp(NEW.user_id, 15, 'reflection', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reflection_created_trigger
AFTER INSERT ON public.reflections
FOR EACH ROW
EXECUTE FUNCTION public.reflection_created_trigger();

-- Trigger to update streak when language practice is recorded
CREATE OR REPLACE FUNCTION public.language_practice_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from the user_language record
  SELECT ul.user_id INTO user_id
  FROM public.user_languages ul
  WHERE ul.id = NEW.user_language_id;
  
  -- Update user streak
  PERFORM public.update_user_streak(user_id);
  
  -- Add XP for language practice
  PERFORM public.increment_user_xp(user_id, COALESCE(NEW.xp_earned, 10), 'language', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER language_practice_trigger
AFTER INSERT ON public.language_practice_history
FOR EACH ROW
EXECUTE FUNCTION public.language_practice_trigger();

-- Seed data for mood suggestions
INSERT INTO public.mood_suggestions (mood_type, suggestion)
VALUES
  ('happy', 'Great job! Try tackling that challenging task you''ve been putting off.'),
  ('happy', 'Your positive energy is perfect for learning something new today!'),
  ('happy', 'Consider helping someone else with a problem - teaching reinforces learning.'),
  ('neutral', 'How about setting a small, achievable goal for today?'),
  ('neutral', 'Try a quick 5-minute learning sprint to build momentum.'),
  ('neutral', 'Review something you learned last week to strengthen your knowledge.'),
  ('tired', 'Take a short break and come back to a simple task.'),
  ('tired', 'Consider passive learning - watch a cybersecurity video instead of hands-on practice.'),
  ('tired', 'It''s okay to rest. Schedule your next session and get some recovery time.'),
  ('stressed', 'Break down your next task into smaller, manageable pieces.'),
  ('stressed', 'Try a 5-minute breathing exercise before continuing your work.'),
  ('stressed', 'Consider switching to a different type of task that uses different mental muscles.')
ON CONFLICT DO NOTHING;

-- Seed data for badges
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES
  ('First Steps', 'Complete your first cybersecurity task', '🔰', 'Complete 1 task', 50),
  ('Consistency Champion', 'Maintain a 7-day streak', '🔄', 'Maintain a 7-day streak', 100),
  ('Reflection Master', 'Write 10 reflections', '📝', 'Write 10 reflections', 75),
  ('Polyglot Programmer', 'Practice 3 different programming languages', '👨‍💻', 'Practice 3 different languages', 100),
  ('Mood Tracker', 'Record your mood for 5 consecutive days', '😊', 'Record mood for 5 consecutive days', 50)
ON CONFLICT DO NOTHING;

-- Seed data for languages
INSERT INTO public.languages (name, icon)
VALUES
  ('Python', '🐍'),
  ('JavaScript', '🟨'),
  ('Bash', '💻'),
  ('PowerShell', '🔷'),
  ('SQL', '🗄️'),
  ('C', '©️'),
  ('C++', '➕'),
  ('Go', '🔵'),
  ('Rust', '🦀'),
  ('Ruby', '💎')
ON CONFLICT DO NOTHING;
