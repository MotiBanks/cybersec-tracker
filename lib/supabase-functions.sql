-- Function to manually update user streak without ambiguous column references
CREATE OR REPLACE FUNCTION public.manual_update_user_streak(user_id_param UUID)
RETURNS void AS $$
DECLARE
  last_active TIMESTAMP WITH TIME ZONE;
  current_date TIMESTAMP WITH TIME ZONE := NOW();
  user_streak_count INTEGER;
BEGIN
  -- Get the user's last active date and current streak
  -- Use explicit table aliases and column references to avoid ambiguity
  SELECT users.last_active_date, users.streak_count
  INTO last_active, user_streak_count
  FROM public.users
  WHERE users.id = user_id_param;
  
  -- If first activity or no previous activity
  IF last_active IS NULL THEN
    UPDATE public.users
    SET streak_count = 1,
        last_active_date = current_date
    WHERE id = user_id_param;
  ELSE
    -- Check if the last activity was yesterday
    IF (EXTRACT(EPOCH FROM current_date) - EXTRACT(EPOCH FROM last_active)) <= 172800 -- 48 hours in seconds
       AND DATE_TRUNC('day', current_date) > DATE_TRUNC('day', last_active) THEN
      -- Increment streak
      UPDATE public.users
      SET streak_count = users.streak_count + 1,
          last_active_date = current_date
      WHERE id = user_id_param;
    -- Check if the last activity was today
    ELSIF DATE_TRUNC('day', current_date) = DATE_TRUNC('day', last_active) THEN
      -- Just update the timestamp, don't change streak
      UPDATE public.users
      SET last_active_date = current_date
      WHERE id = user_id_param;
    ELSE
      -- Reset streak if more than a day has been missed
      UPDATE public.users
      SET streak_count = 1,
          last_active_date = current_date
      WHERE id = user_id_param;
    END IF;
  END IF;
  
  -- Check for streak milestone and create notification if needed
  -- Use the updated streak count from the user
  SELECT users.streak_count INTO user_streak_count
  FROM public.users
  WHERE users.id = user_id_param;
  
  IF MOD(user_streak_count, 5) = 0 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      user_id_param, 
      'Streak Milestone!', 
      'Congratulations! You''ve reached a ' || user_streak_count || ' day streak!', 
      'achievement'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually add XP to user without ambiguous column references
CREATE OR REPLACE FUNCTION public.manual_add_user_xp(
  user_id_param UUID,
  xp_amount INTEGER,
  source_type TEXT,
  source_id_param UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Add XP to user
  UPDATE public.users
  SET xp = users.xp + xp_amount
  WHERE id = user_id_param;
  
  -- Record XP gain in tracker
  INSERT INTO public.xp_tracker (user_id, xp_amount, source, source_id)
  VALUES (user_id_param, xp_amount, source_type, source_id_param);
  
  -- Check for level up
  DECLARE
    current_xp INTEGER;
    current_level INTEGER;
    xp_for_next_level INTEGER;
  BEGIN
    -- Get current XP and level
    SELECT users.xp, users.level
    INTO current_xp, current_level
    FROM public.users
    WHERE id = user_id_param;
    
    -- Calculate XP needed for next level (100 * level)
    xp_for_next_level := current_level * 100;
    
    -- Check if user has enough XP to level up
    WHILE current_xp >= xp_for_next_level LOOP
      -- Level up
      UPDATE public.users
      SET level = users.level + 1
      WHERE id = user_id_param;
      
      -- Create notification for level up
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        user_id_param,
        'Level Up!',
        'Congratulations! You''ve reached level ' || (current_level + 1) || '!',
        'achievement'
      );
      
      -- Update variables for next iteration
      current_level := current_level + 1;
      xp_for_next_level := current_level * 100;
    END LOOP;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
