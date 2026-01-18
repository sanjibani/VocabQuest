
-- Migration: Add etymology and details to words table

ALTER TABLE words 
ADD COLUMN IF NOT EXISTS etymology TEXT,
ADD COLUMN IF NOT EXISTS root_words TEXT[],
ADD COLUMN IF NOT EXISTS part_of_speech TEXT,
ADD COLUMN IF NOT EXISTS pronunciation TEXT,
ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

-- Also update the Local Interface in types (for future reference, though we use DB now)
-- No SQL needed for that, just typescript update.
