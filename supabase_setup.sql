-- 在 Supabase SQL Editor 中执行以下全部 SQL --
-- 表名和列名使用 camelCase（前端直接匹配，无需转换）

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  industry TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastLoginAt" TIMESTAMPTZ
);

-- 2. 搜索记录表
CREATE TABLE IF NOT EXISTS "searchHistory" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  phone TEXT,
  category TEXT NOT NULL,
  "resultSummary" TEXT DEFAULT '',
  "searchedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "searchHistory" ENABLE ROW LEVEL SECURITY;

-- 4. 策略
CREATE POLICY "允许读取用户" ON users FOR SELECT USING (true);
CREATE POLICY "允许注册新用户" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "允许更新用户" ON users FOR UPDATE USING (true);

CREATE POLICY "允许读取搜索记录" ON "searchHistory" FOR SELECT USING (true);
CREATE POLICY "允许写入搜索记录" ON "searchHistory" FOR INSERT WITH CHECK (true);
