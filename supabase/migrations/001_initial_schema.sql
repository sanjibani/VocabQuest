-- WPMAE Gamified Vocabulary Web MVP
-- Database Schema Migration

-- ============================================
-- CONTENT TABLES (Public Read)
-- ============================================

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  title TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, session_number)
);

-- Words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, session_id, term)
);

-- Exercise items table (quest prompts)
CREATE TABLE IF NOT EXISTS exercise_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_chapter_id ON sessions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_words_session_id ON words(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_items_session_id ON exercise_items(session_id);

-- ============================================
-- USER TABLES (RLS Protected)
-- ============================================

-- User profile table
CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total INT DEFAULT 0,
  level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User session progress table
CREATE TABLE IF NOT EXISTS user_session_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- User word state table (SM-2 state)
CREATE TABLE IF NOT EXISTS user_word_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  repetitions INT DEFAULT 0,
  interval_days INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  due_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  lapses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, word_id)
);

-- Create indexes for user tables
CREATE INDEX IF NOT EXISTS idx_user_word_state_due_at ON user_word_state(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_user_session_progress_user_id ON user_session_progress(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user tables
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_state ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profile FOR DELETE
  USING (auth.uid() = user_id);

-- User session progress policies
CREATE POLICY "Users can view own session progress"
  ON user_session_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session progress"
  ON user_session_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session progress"
  ON user_session_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session progress"
  ON user_session_progress FOR DELETE
  USING (auth.uid() = user_id);

-- User word state policies
CREATE POLICY "Users can view own word state"
  ON user_word_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word state"
  ON user_word_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word state"
  ON user_word_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own word state"
  ON user_word_state FOR DELETE
  USING (auth.uid() = user_id);
