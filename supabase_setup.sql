-- ============================================================
-- procurement-insights 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行
-- v2.1: 修复 company 列缺失、列名大小写一致性问题
-- ============================================================

-- ⚠️ 迁移：如果表已存在，先加缺失的 company 列
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- 添加缺失的 company 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company') THEN
      ALTER TABLE users ADD COLUMN company TEXT DEFAULT '';
      RAISE NOTICE '[MIGRATION] Added company column to users';
    END IF;
  END IF;
END $$;

-- 1. 用户表（新建时使用）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  company TEXT DEFAULT '',
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

-- 4. 策略（如果已存在则跳过）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许读取用户' AND tablename = 'users') THEN
    CREATE POLICY "允许读取用户" ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许注册新用户' AND tablename = 'users') THEN
    CREATE POLICY "允许注册新用户" ON users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许更新用户' AND tablename = 'users') THEN
    CREATE POLICY "允许更新用户" ON users FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许读取搜索记录' AND tablename = 'searchHistory') THEN
    CREATE POLICY "允许读取搜索记录" ON "searchHistory" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许写入搜索记录' AND tablename = 'searchHistory') THEN
    CREATE POLICY "允许写入搜索记录" ON "searchHistory" FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 验证：检查表结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
