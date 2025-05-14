-- Function to safely insert a reflection without triggering the problematic trigger
CREATE OR REPLACE FUNCTION public.insert_reflection_safely(
  user_id_param UUID,
  content_param TEXT,
  tags_param TEXT[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  reflection_id UUID;
BEGIN
  -- Insert the reflection directly
  INSERT INTO public.reflections (user_id, content, tags, created_at)
  VALUES (user_id_param, content_param, COALESCE(tags_param, '{}'::TEXT[]), NOW())
  RETURNING id INTO reflection_id;
  
  -- Manually update the user's last_active_date without touching streak_count
  UPDATE public.users
  SET last_active_date = NOW()
  WHERE id = user_id_param;
  
  -- Add XP for the reflection
  INSERT INTO public.xp_tracker (user_id, xp_amount, source, source_id)
  VALUES (user_id_param, 15, 'reflection', reflection_id);
  
  -- Update user's XP
  UPDATE public.users
  SET xp = xp + 15
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely update a reflection's content
CREATE OR REPLACE FUNCTION public.update_reflection_content(
  reflection_id UUID,
  user_id_param UUID,
  new_content TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update the reflection content
  UPDATE public.reflections
  SET content = new_content
  WHERE id = reflection_id AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
