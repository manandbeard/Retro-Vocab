-- Enum for User Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role user_role NOT NULL,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Tokens Table (for OAuth)
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_course_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments Table (Join table for Students and Classes)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Cards Table (Content Library)
-- Modified to remove mandatory class_id to allow cross-class usage
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word TEXT NOT NULL,
  definition TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who created this content
  question_type TEXT DEFAULT 'vocabulary',
  passage TEXT,
  part_of_speech TEXT,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class Content Table (Join table for Cards and Classes)
CREATE TABLE IF NOT EXISTS class_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, card_id)
);

-- Ensure RLS is enabled and policies are set
ALTER TABLE class_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on class_cards" ON class_cards;
CREATE POLICY "Allow public read/write on class_cards" ON class_cards FOR ALL USING (true) WITH CHECK (true);

-- Review Logs Table
CREATE TABLE IF NOT EXISTS review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  stability NUMERIC NOT NULL,
  retrievability NUMERIC NOT NULL,
  difficulty NUMERIC NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) policies if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for MVP prototype (you should restrict this in production)
DROP POLICY IF EXISTS "Allow public read/write on users" ON users;
CREATE POLICY "Allow public read/write on users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on classes" ON classes;
CREATE POLICY "Allow public read/write on classes" ON classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on enrollments" ON enrollments;
CREATE POLICY "Allow public read/write on enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on cards" ON cards;
CREATE POLICY "Allow public read/write on cards" ON cards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on review_logs" ON review_logs;
CREATE POLICY "Allow public read/write on review_logs" ON review_logs FOR ALL USING (true) WITH CHECK (true);
