/**
 * 存储工具层 — Supabase + localStorage 双模式
 * - Supabase 配置后：所有数据写入共享数据库，管理员可见所有用户
 * - 未配置 Supabase：fallback 到 localStorage（仅本地可见）
 */
import {
  isSupabaseEnabled,
  sbRegisterUser,
  sbLoginUser,
  sbGetAllUsers,
  sbRecordSearch,
  sbGetAllSearchHistory,
  sbGetUserSearchHistory,
} from './supabase'

const DB_KEY = 'procurement_insights_db'

function getDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { users: [], searchHistory: [], currentUser: null }
  } catch {
    return { users: [], searchHistory: [], currentUser: null }
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

// ====== 用户认证 ======

export async function registerUser({ phone, username, password, company, industry }) {
  // Supabase 模式
  if (isSupabaseEnabled()) {
    const result = await sbRegisterUser({ phone, username, password, company, industry })
    if (result?.ok) return result
  }

  // localStorage fallback
  const db = getDB()
  if (db.users.find(u => u.phone === phone)) {
    return { ok: false, msg: '该手机号已注册' }
  }
  const user = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    phone, username, password, company, industry,
    role: 'user',
    created_at: new Date().toISOString(),
    last_login_at: null,
  }
  db.users.push(user)
  db.currentUser = user
  saveDB(db)
  return { ok: true, user }
}

export async function loginUser(phone, password) {
  // Supabase 模式
  if (isSupabaseEnabled()) {
    const result = await sbLoginUser(phone, password)
    if (result?.ok) {
      // 同步当前用户到本地
      const db = getDB()
      db.currentUser = result.user
      saveDB(db)
      return result
    }
  }

  // localStorage fallback
  const db = getDB()
  const user = db.users.find(u => u.phone === phone)
  if (!user) return { ok: false, msg: '手机号未注册' }
  if (user.password !== password) return { ok: false, msg: '密码不正确' }
  user.last_login_at = new Date().toISOString()
  db.currentUser = user
  saveDB(db)
  return { ok: true, user }
}

export function loginAdmin(username, password) {
  const adminUser = import.meta.env.VITE_ADMIN_USER || 'qaq'
  const adminPass = import.meta.env.VITE_ADMIN_PASS || ''
  if (username === adminUser && password === adminPass) {
    const db = getDB()
    const adminInfo = { id: 'admin', username: adminUser, role: 'admin', phone: '' }
    db.currentUser = adminInfo
    saveDB(db)
    return { ok: true, user: adminInfo }
  }
  return { ok: false, msg: '管理员账号或密码错误' }
}

export function getCurrentUser() {
  return getDB().currentUser
}

export function logout() {
  const db = getDB()
  db.currentUser = null
  saveDB(db)
}

// ====== 搜索历史 ======

export async function recordSearch(userId, phone, category, resultSummary) {
  // Supabase 模式 — 写入共享数据库
  if (isSupabaseEnabled()) {
    await sbRecordSearch(userId, phone, category, resultSummary)
  }

  // 同时写 localStorage
  const db = getDB()
  db.searchHistory = db.searchHistory || []
  db.searchHistory.push({
    id: 's_' + Date.now(),
    userId, phone, category,
    resultSummary: resultSummary || '',
    searchedAt: new Date().toISOString(),
  })
  if (db.searchHistory.length > 500) db.searchHistory = db.searchHistory.slice(-500)
  saveDB(db)
}

// ====== 管理后台查询 ======

export async function getAllUsers() {
  const local = getDB().users || []
  // Supabase 模式 — 合并共享数据库 + 本地数据
  if (isSupabaseEnabled()) {
    try {
      const sbUsers = await sbGetAllUsers()
      // 合并去重（按手机号）
      const merged = [...sbUsers]
      for (const u of local) {
        if (!merged.find(m => m.phone === u.phone)) merged.push(u)
      }
      return merged
    } catch { /* Supabase 失败 → 降级到本地 */ }
  }
  return local
}

export async function getAllSearchHistory() {
  const local = getDB().searchHistory || []
  if (isSupabaseEnabled()) {
    try {
      const sbHistory = await sbGetAllSearchHistory()
      // 合并去重
      const ids = new Set(sbHistory.map(h => h.id))
      const merged = [...sbHistory, ...local.filter(h => !ids.has(h.id))]
      return merged.sort((a, b) => new Date(b.searchedAt || 0) - new Date(a.searchedAt || 0))
    } catch { /* Supabase 失败 → 降级 */ }
  }
  return local
}

export async function getUserSearchHistory(userId) {
  const local = (getDB().searchHistory || []).filter(s => s.userId === userId)
  if (isSupabaseEnabled()) {
    try {
      const sbHistory = await sbGetUserSearchHistory(userId)
      const ids = new Set(sbHistory.map(h => h.id))
      return [...sbHistory, ...local.filter(h => !ids.has(h.id))]
        .sort((a, b) => new Date(b.searchedAt || 0) - new Date(a.searchedAt || 0))
    } catch { /* fallback */ }
  }
  return local
}
