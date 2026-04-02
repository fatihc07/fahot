-- QuizPulse Database Schema

-- 1. Games Table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, in_progress, leaderboard, finished, template, question_ended
  category TEXT DEFAULT 'Genel',
  current_question_index INTEGER DEFAULT 0,
  branding_color TEXT DEFAULT '#6366f1',
  theme_style TEXT DEFAULT 'default', -- default, oled, cyberpunk, retro
  is_betting_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Players Table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  team TEXT DEFAULT 'Bireysel',
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- e.g. ["Ankara", "İstanbul", "İzmir", "Bursa"]
  correct_index INTEGER NOT NULL,
  time_limit INTEGER DEFAULT 20,
  is_poll BOOLEAN DEFAULT FALSE,
  is_super_round BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Responses Table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_option INTEGER NOT NULL,
  bet_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Reactions Table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
