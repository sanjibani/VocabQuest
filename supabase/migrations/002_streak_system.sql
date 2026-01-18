-- Streak System Migration
-- Adds streak tracking and character evolution to user profiles

-- ============================================
-- STREAK FIELDS ON USER PROFILE
-- ============================================

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS streak_current INT DEFAULT 0;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS streak_longest INT DEFAULT 0;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS character_stage INT DEFAULT 1;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS streak_freezes INT DEFAULT 0;

-- ============================================
-- DAILY ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS user_daily_activity (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  sessions_completed INT DEFAULT 0,
  reviews_completed INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user ON user_daily_activity(user_id, activity_date DESC);

-- ============================================
-- ROW LEVEL SECURITY FOR ACTIVITY LOG
-- ============================================

ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON user_daily_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_daily_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON user_daily_activity FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
