/*
  # Disaster Response Platform Database Schema

  1. New Tables
    - `disasters`
      - `id` (uuid, primary key)
      - `title` (text, disaster name)
      - `location_name` (text, human-readable location)
      - `location` (geography, PostGIS point for geospatial queries)
      - `description` (text, disaster description)
      - `tags` (text[], categories like "flood", "earthquake")
      - `owner_id` (text, user who created the disaster)
      - `audit_trail` (jsonb, change tracking)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reports`
      - `id` (uuid, primary key)
      - `disaster_id` (uuid, foreign key to disasters)
      - `user_id` (text, reporting user)
      - `content` (text, report content)
      - `image_url` (text, optional image)
      - `verification_status` (text, verification state)
      - `verification_details` (jsonb, verification data)
      - `created_at` (timestamptz)
    
    - `resources`
      - `id` (uuid, primary key)
      - `disaster_id` (uuid, foreign key to disasters)
      - `name` (text, resource name)
      - `location_name` (text, human-readable location)
      - `location` (geography, PostGIS point)
      - `type` (text, resource type like "shelter", "food")
      - `description` (text, resource details)
      - `capacity` (integer, max capacity if applicable)
      - `contact_info` (jsonb, contact details)
      - `created_by` (text, user who added resource)
      - `created_at` (timestamptz)
    
    - `cache`
      - `key` (text, primary key, cache key)
      - `value` (jsonb, cached data)
      - `expires_at` (timestamptz, expiration time)
    
    - `verification_log`
      - `id` (uuid, primary key)
      - `disaster_id` (uuid, foreign key to disasters)
      - `report_id` (uuid, optional foreign key to reports)
      - `image_url` (text, verified image URL)
      - `verification_result` (jsonb, verification details)
      - `verified_by` (text, user who performed verification)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Create indexes for performance

  3. Geospatial Features
    - PostGIS extension for geography data types
    - Spatial indexes for location-based queries
    - Distance functions for nearby resource lookup
*/

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  owner_id text NOT NULL,
  audit_trail jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  content text NOT NULL,
  image_url text,
  verification_status text DEFAULT 'pending',
  verification_details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  type text NOT NULL,
  description text,
  capacity integer,
  contact_info jsonb,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);

-- Create verification_log table
CREATE TABLE IF NOT EXISTS verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  verification_result jsonb NOT NULL,
  verified_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_at_idx ON disasters (created_at DESC);

CREATE INDEX IF NOT EXISTS reports_disaster_idx ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS reports_user_idx ON reports (user_id);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);

CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_disaster_idx ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources (type);

CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache (expires_at);

CREATE INDEX IF NOT EXISTS verification_disaster_idx ON verification_log (disaster_id);
CREATE INDEX IF NOT EXISTS verification_report_idx ON verification_log (report_id);

-- Create updated_at trigger for disasters
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disasters_updated_at 
  BEFORE UPDATE ON disasters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_log ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since we're using mock auth)
CREATE POLICY "Public read access" ON disasters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON disasters FOR ALL TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public read access" ON reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON reports FOR ALL TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public read access" ON resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON resources FOR ALL TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public read access" ON cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON cache FOR ALL TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public read access" ON verification_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON verification_log FOR ALL TO anon, authenticated WITH CHECK (true);

-- Create function for distance-based resource queries
CREATE OR REPLACE FUNCTION resources_within_distance(
  center_point text,
  radius_meters integer
)
RETURNS TABLE (
  id uuid,
  disaster_id uuid,
  name text,
  location_name text,
  location geography,
  type text,
  description text,
  capacity integer,
  contact_info jsonb,
  created_by text,
  created_at timestamptz,
  distance_meters double precision
)
LANGUAGE sql
AS $$
  SELECT 
    r.id,
    r.disaster_id,
    r.name,
    r.location_name,
    r.location,
    r.type,
    r.description,
    r.capacity,
    r.contact_info,
    r.created_by,
    r.created_at,
    ST_Distance(r.location, ST_GeogFromText(center_point)) as distance_meters
  FROM resources r
  WHERE r.location IS NOT NULL
    AND ST_DWithin(r.location, ST_GeogFromText(center_point), radius_meters)
  ORDER BY distance_meters;
$$;