-- -------------------------------------------------------------
-- FEATURE: MOOD TRACKING CRUD & STREAKS
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_mood_entry(
  p_mood_score integer,
  p_note text DEFAULT NULL,
  p_emotion_factors text[] DEFAULT '{}',
  p_tags text[] DEFAULT '{}'
) RETURNS public.mood_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_last_entry_date date;
  v_current_date date := CURRENT_DATE;
  v_streak_count integer;
  v_longest_streak integer;
  v_new_entry public.mood_entries;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Insert the new mood entry
  INSERT INTO public.mood_entries (
    user_id,
    mood_score,
    note,
    emotion_factors,
    tags
  ) VALUES (
    v_user_id,
    p_mood_score,
    p_note,
    p_emotion_factors,
    p_tags
  )
  RETURNING * INTO v_new_entry;

  -- 2. Update Streak Logic
  -- Get the second most recent entry date (the one before the insert we just did)
  SELECT DATE(created_at AT TIME ZONE 'UTC') INTO v_last_entry_date
  FROM public.mood_entries
  WHERE user_id = v_user_id
    AND id != v_new_entry.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Fetch current user streak scores safely
  SELECT streak_count, longest_streak INTO v_streak_count, v_longest_streak
  FROM public.users
  WHERE id = v_user_id FOR UPDATE; -- Use row level lock to prevent race conditions

  -- Calculate new streak
  IF v_last_entry_date IS NULL THEN
    -- First time ever logging mood
    v_streak_count := 1;
  ELSIF v_last_entry_date = v_current_date THEN
    -- Already logged today, streak stays the same 
    v_streak_count := v_streak_count;
  ELSIF v_last_entry_date = (v_current_date - INTERVAL '1 day')::date THEN
    -- Logged yesterday, increment streak
    v_streak_count := v_streak_count + 1;
  ELSE
    -- Missed a day, reset streak
    v_streak_count := 1;
  END IF;

  -- Update longest streak if necessary
  IF v_streak_count > v_longest_streak THEN
    v_longest_streak := v_streak_count;
  END IF;

  -- 3. Save the new streak data to users table
  UPDATE public.users
  SET streak_count = v_streak_count,
      longest_streak = v_longest_streak,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN v_new_entry;
END;
$$;
