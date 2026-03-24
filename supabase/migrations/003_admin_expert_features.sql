-- Supabase Schema Update for Feature 1 (Global Search), Feature 2 (Expert Availability), and Feature 3 (Expert Earnings)

-- -------------------------------------------------------------
-- 1. FEATURE: GLOBAL SEARCH (Admin)
-- -------------------------------------------------------------

-- Enable the trigram extension for lightning-fast fuzzy text searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create an aggressive index to speed up scanning
CREATE INDEX IF NOT EXISTS users_search_idx ON users USING gin (full_name gin_trgm_ops, email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS experts_search_idx ON experts USING gin (specialization gin_trgm_ops, bio gin_trgm_ops);

-- Define the custom type for unified search results
DO $$ BEGIN
    CREATE TYPE global_search_result AS (
        type text,
        id uuid,
        title text,
        subtitle text,
        url_path text
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RPC for the global search execution
CREATE OR REPLACE FUNCTION admin_global_search(search_query text)
RETURNS SETOF global_search_result 
SECURITY DEFINER
AS $$
BEGIN
  -- Strict security check: Ensure the caller is an Admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can perform global searches';
  END IF;

  -- Search Users (Limit 5)
  RETURN QUERY
    SELECT 'user'::text, id, full_name as title, email as subtitle, '/users/' || id as url_path 
    FROM users 
    WHERE full_name ILIKE '%' || search_query || '%' OR email ILIKE '%' || search_query || '%'
    LIMIT 5;

  -- Search Experts (Limit 5)
  RETURN QUERY
    SELECT 'expert'::text, e.id, u.full_name as title, e.specialization as subtitle, '/experts/' || e.id as url_path 
    FROM experts e JOIN users u ON e.id = u.id
    WHERE u.full_name ILIKE '%' || search_query || '%' OR e.specialization ILIKE '%' || search_query || '%'
    LIMIT 5;
    
  -- We can append notifications or appointments later using the same pattern.
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------------
-- 2. FEATURE: EXPERT AVAILABILITY MANAGEMENT
-- -------------------------------------------------------------

-- Enable B-Tree GiST to use Exclude constraints on timestamps
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS expert_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid REFERENCES experts(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent overlapping availability blocks for an expert
  CONSTRAINT prevent_overlapping_availability
    EXCLUDE USING gist (
      expert_id WITH =, 
      tstzrange(start_time, end_time) WITH &&
    ),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- RLS setup for Availability
ALTER TABLE expert_availability ENABLE ROW LEVEL SECURITY;

-- Experts can manage their own availability
CREATE POLICY "Experts can manage their own availability" 
ON expert_availability FOR ALL 
USING (auth.uid() = expert_id);

-- Admins and all authenticated users can read availability to book
CREATE POLICY "Anyone authenticated can view availability" 
ON expert_availability FOR SELECT 
TO authenticated 
USING (true);


-- -------------------------------------------------------------
-- 3. FEATURE: EARNINGS REPORT (Expert)
-- -------------------------------------------------------------

-- Secure RPC to aggregate earnings over a date range directly on the server
CREATE OR REPLACE FUNCTION get_expert_earnings_summary(p_expert_id uuid, p_start_date date, p_end_date date)
RETURNS TABLE(date_group date, daily_earnings bigint, total_sessions integer)
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: Experts can only view their own earnings. Admins can view anyone's.
  IF auth.uid() != p_expert_id AND NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You can only view your own earnings';
  END IF;

  RETURN QUERY
    SELECT 
      DATE(appointment_date) as date_group,
      COALESCE(SUM(expert_base_price), 0)::bigint as daily_earnings,
      COUNT(id)::integer as total_sessions
    FROM appointments
    WHERE expert_id = p_expert_id
      AND status = 'completed'
      AND payment_status = 'paid'
      AND DATE(appointment_date) >= p_start_date
      AND DATE(appointment_date) <= p_end_date
    GROUP BY DATE(appointment_date)
    ORDER BY DATE(appointment_date) ASC;
END;
$$ LANGUAGE plpgsql;
