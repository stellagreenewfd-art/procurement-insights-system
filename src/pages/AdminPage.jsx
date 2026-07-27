import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { getAllUsers, getAllSearchHistory } from '../services/storage'

export default function AdminPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function loadData() {
    setDataLoading(true)
    setLoadError('')
    try {
      const [u, h] = await Promise.all([getAllUsers(), getAllSearchHistory()])
      setUsers(u)
      setHistory(h)
      console.log(`[Admin] 加载完成: ${u.length} 用户, ${h.length} 条搜索记录`)
    } catch (err) {
      console.error('[Admin] 数据加载失败:', err)
      setLoadError(err.message || '数据加载失败，请刷新重试')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchKeyword = !searchKeyword ||
        u.phone.includes(searchKeyword) ||
        u.username.includes(searchKeyword) ||
        (u.company || '').includes(searchKeyword)
      const matchIndustry = industryFilter === 'all' || u.industry === industryFilter
      return matchKeyword && matchIndustry
    })
  }, [users, searchKeyword, industryFilter])

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (!searchKeyword) return true
      return h.category.includes(searchKeyword) || h.phone.includes(searchKeyword)
    }).reverse()
  }, [history, searchKeyword])

  // 统计数据
  const stats = useMemo(() => {
    const industries = {}
    users.forEach(u => {
      industries[u.industry] = (industries[u.industry] || 0) + 1
    })
    const today = new Date().toDateString()
    const todaySearches = history.filter(h => new Date(h.searchedAt).toDateString() === today).length
    return {
      totalUsers: users.length,
      totalSearches: history.length,
      todaySearches,
      industries,
    }
  }, [users, history])

  const industries = [...new Set(users.map(u => u.industry))]

  const formatTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-ink-800/80 backdrop-blur-xl border-b border-ink-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">管理后台</h1>
              <p className="text-slate-500 text-xs">采购品类洞察系统</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-ink-700 hover:bg-ink-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            退出登录
          </button>
          <button
            onClick={loadData}
            disabled={dataLoading}
            className="px-4 py-2 bg-ink-700 hover:bg-ink-600 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {dataLoading ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading State */}
        {dataLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm">正在加载数据...</p>
            <p className="text-slate-600 text-xs mt-1">从 Supabase 共享数据库同步</p>
          </div>
        )}

        {/* Error State */}
        {!dataLoading && loadError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-400 font-medium mb-1">数据加载失败</p>
            <p className="text-red-400/70 text-sm mb-4">{loadError}</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm transition-colors"
            >
              点击重试
            </button>
          </div>
        )}

        {/* Content */}
        {!dataLoading && !loadError && (<>
        {/* Tab Nav */}
        <div className="flex gap-1 mb-6 p-1 bg-ink-800/50 rounded-xl w-fit">
          {[
            { key: 'overview', label: '数据看板' },
            { key: 'users', label: '用户管理' },
            { key: 'history', label: '搜索记录' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchKeyword('') }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="注册用户" value={stats.totalUsers} icon="users" color="blue" />
              <StatCard label="总搜索次数" value={stats.totalSearches} icon="search" color="green" />
              <StatCard label="今日搜索" value={stats.todaySearches} icon="today" color="amber" />
              <StatCard label="覆盖行业" value={Object.keys(stats.industries).length} icon="industry" color="purple" />
            </div>

            {/* Industry Distribution */}
            <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">行业分布</h3>
              {Object.keys(stats.industries).length === 0 ? (
                <p className="text-slate-500 text-sm">暂无用户数据</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.industries)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ind, count]) => {
                      const pct = (count / stats.totalUsers * 100).toFixed(1)
                      return (
                        <div key={ind} className="flex items-center gap-3">
                          <span className="text-slate-300 text-sm w-24 truncate">{ind}</span>
                          <div className="flex-1 h-6 bg-ink-900/60 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-end px-2"
                              style={{ width: `${Math.max(pct, 8)}%` }}
                            >
                              <span className="text-white text-xs font-medium">{count}</span>
                            </div>
                          </div>
                          <span className="text-slate-500 text-xs w-10 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">最近搜索</h3>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm">暂无搜索记录</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(-8).reverse().map(item => {
                    const user = users.find(u => u.id === item.userId)
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-2 px-3 bg-ink-900/40 rounded-lg">
                        <span className="text-blue-400 text-sm font-medium w-28 truncate">{item.category}</span>
                        <span className="text-slate-400 text-xs flex-1 truncate">
                          {user ? user.username : item.phone}
                        </span>
                        <span className="text-slate-600 text-xs">{formatTime(item.searchedAt)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索手机号、用户名或公司"
                className="flex-1 px-4 py-2.5 bg-ink-800/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-amber-500 outline-none transition-colors"
              />
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2.5 bg-ink-800/60 border border-ink-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none transition-colors"
              >
                <option value="all" className="bg-ink-900">全部行业</option>
                {industries.map(ind => (
                  <option key={ind} value={ind} className="bg-ink-900">{ind}</option>
                ))}
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">暂无用户数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-700/50">
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">用户名</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">手机号</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">公司</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">行业</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">注册时间</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">最后登录</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">搜索次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const searchCount = history.filter(h => h.userId === u.id).length
                        return (
                          <tr key={u.id} className="border-b border-ink-700/30 hover:bg-ink-700/20 transition-colors">
                            <td className="px-4 py-3 text-white text-sm font-medium">{u.username}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{u.phone}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{u.company || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">{u.industry}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{formatTime(u.createdAt)}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{formatTime(u.lastLoginAt)}</td>
                            <td className="px-4 py-3 text-amber-400 text-sm font-medium">{searchCount}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索品类名称或手机号"
              className="w-full px-4 py-2.5 bg-ink-800/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-amber-500 outline-none transition-colors"
            />

            <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">暂无搜索记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-700/50">
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">品类名称</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">用户</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">手机号</th>
                        <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium">搜索时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map(item => {
                        const user = users.find(u => u.id === item.userId)
                        return (
                          <tr key={item.id} className="border-b border-ink-700/30 hover:bg-ink-700/20 transition-colors">
                            <td className="px-4 py-3 text-blue-400 text-sm font-medium">{item.category}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{user?.username || '-'}</td>
                            <td className="px-4 py-3 text-slate-400 text-sm">{item.phone}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{formatTime(item.searchedAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }
  const icons = {
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    today: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    industry: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5',
  }
  return (
    <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl p-5">
      <div className={`inline-flex w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-xl items-center justify-center mb-3`}>
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
        </svg>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  )
}
