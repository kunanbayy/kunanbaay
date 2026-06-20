CREATE TABLE IF NOT EXISTS Universities (
  id INTEGER PRIMARY KEY,
  name_kz TEXT NOT NULL,
  name_ru TEXT,
  name_en TEXT,
  short_name TEXT,
  city TEXT,
  official_website TEXT,
  logo_url TEXT,
  logo_source_url TEXT,
  description TEXT,
  university_type TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
