/**
 * Supabase 客户端 — 共享数据库层
 * 配置后所有用户数据集中存储，管理员可见全局数据
 */
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getClient() {
  if (supabase) return supabase
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key) {
    supabase = createClient(url, key)
  }
  return supabase
}

export function isSupabaseEnabled() {
  return !!getClient()
}

// ====== 用户 ======

export async function sbRegisterUser({ phone, username, password, company, industry }) {
  const client = getClient()
  if (!client) return null
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const { error } = await client.from('users').insert({
    id, phone, username, password, company, industry,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  })
  if (error) {
    if (error.code === '23505') return { ok: false, msg: '该手机号已注册' }
    console.error('Supabase register error:', error)
    return { ok: false, msg: '注册失败' }
  }
  return { ok: true, user: { id, phone, username, company, industry, role: 'user' } }
}

export async function sbLoginUser(phone, password) {
  const client = getClient()
  if (!client) return null
  const { data, error } = await client.from('users')
    .select('*').eq('phone', phone).single()
  if (error || !data) return { ok: false, msg: '手机号未注册' }
  if (data.password !== password) return { ok: false, msg: '密码不正确' }
  // 更新最后登录时间
  await client.from('users').update({ lastLoginAt: new Date().toISOString() }).eq('id', data.id)
  return { ok: true, user: data }
}

export async function sbGetAllUsers() {
  const client = getClient()
  if (!client) return []
  const { data } = await client.from('users').select('*').order('createdAt', { ascending: false })
  return data || []
}

// ====== 搜索记录 ======

export async function sbRecordSearch(userId, phone, category, resultSummary) {
  const client = getClient()
  if (!client) return
  const { error } = await client.from('searchHistory').insert({
    id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    userId,
    phone,
    category,
    resultSummary: resultSummary || '',
    searchedAt: new Date().toISOString(),
  })
  if (error) console.error('Supabase recordSearch error:', error)
}

export async function sbGetAllSearchHistory() {
  const client = getClient()
  if (!client) return []
  const { data } = await client.from('searchHistory')
    .select('*').order('searchedAt', { ascending: false }).limit(500)
  return data || []
}

export async function sbGetUserSearchHistory(userId) {
  const client = getClient()
  if (!client) return []
  const { data } = await client.from('searchHistory')
    .select('*').eq('userId', userId).order('searchedAt', { ascending: false })
  return data || []
}
