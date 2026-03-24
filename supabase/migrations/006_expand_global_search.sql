-- -------------------------------------------------------------
-- FEATURE: EXPAND GLOBAL SEARCH
-- -------------------------------------------------------------

-- Replace the existing admin_global_search to include appointments and notifications

CREATE OR REPLACE FUNCTION public.admin_global_search(search_query text)
RETURNS SETOF global_search_result 
SECURITY DEFINER
AS $$
BEGIN
  -- Strict security check: Ensure the caller is an Admin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can perform global searches';
  END IF;

  -- 1. Search Users (Limit 5)
  RETURN QUERY
    SELECT 'user'::text, id, full_name as title, email as subtitle, '/users/' || id as url_path 
    FROM public.users 
    WHERE full_name ILIKE '%' || search_query || '%' OR email ILIKE '%' || search_query || '%'
    LIMIT 5;

  -- 2. Search Experts (Limit 5)
  RETURN QUERY
    SELECT 'expert'::text, e.id, u.full_name as title, e.specialization as subtitle, '/experts/' || e.id as url_path 
    FROM public.experts e JOIN public.users u ON e.id = u.id
    WHERE u.full_name ILIKE '%' || search_query || '%' OR e.specialization ILIKE '%' || search_query || '%'
    LIMIT 5;

  -- 3. Search Appointments (Limit 5)
  -- Search by user notes, cancellation reason, or UUID string match
  RETURN QUERY
    SELECT 'appointment'::text, a.id, 
           'Appointment with ' || COALESCE(eu.full_name, 'Expert') as title, 
           COALESCE(a.status, '') || ' - ' || TO_CHAR(a.appointment_date, 'Mon DD, YYYY') as subtitle, 
           '/appointments/' || a.id as url_path 
    FROM public.appointments a
    LEFT JOIN public.users eu ON a.expert_id = eu.id
    WHERE a.user_notes ILIKE '%' || search_query || '%' 
       OR a.cancellation_reason ILIKE '%' || search_query || '%'
       OR a.id::text ILIKE search_query || '%'
    LIMIT 5;

  -- 4. Search Notifications (Limit 5)
  RETURN QUERY
    SELECT 'notification'::text, n.id, n.title, n.message as subtitle, '/notifications' as url_path 
    FROM public.notifications n
    WHERE n.user_id = auth.uid() -- Admins can only search their own notifications unless we want all system notifications
      AND (n.title ILIKE '%' || search_query || '%' OR n.message ILIKE '%' || search_query || '%')
    LIMIT 5;

END;
$$ LANGUAGE plpgsql;
