-- Fix RLS Policies for Public Access
--
-- Updates RLS policies to allow anonymous access to reference tables

-- Drop all existing policies on elements
DROP POLICY IF EXISTS "Elements are viewable by everyone" ON elements;
DROP POLICY IF EXISTS "Elements are publicly viewable" ON elements;

-- Drop all existing policies on compounds
DROP POLICY IF EXISTS "Compounds are viewable by everyone" ON compounds;
DROP POLICY IF EXISTS "Compounds are publicly viewable" ON compounds;
DROP POLICY IF EXISTS "Authenticated users can create compounds" ON compounds;

-- Drop all existing policies on reactions
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON reactions;
DROP POLICY IF EXISTS "Reactions are publicly viewable" ON reactions;
DROP POLICY IF EXISTS "Authenticated users can create reactions" ON reactions;

-- Drop all existing policies on recipes
DROP POLICY IF EXISTS "Recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Recipes are publicly viewable" ON recipes;

-- Create new public access policies
CREATE POLICY "Public read elements"
  ON elements FOR SELECT
  USING (true);

CREATE POLICY "Public read compounds"
  ON compounds FOR SELECT
  USING (true);

CREATE POLICY "Public read reactions"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Public read recipes"
  ON recipes FOR SELECT
  USING (true);

-- Allow authenticated users to create compounds and reactions
CREATE POLICY "Auth create compounds"
  ON compounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Auth create reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (true);