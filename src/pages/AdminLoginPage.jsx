import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { adminLogin } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = adminLogin(username, password)
    if (result.ok) {
      navigate('/admin')
    } else {
      setError(result.msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-ink-900 via-slate-900 to-ink-800">
      <div className="w-full max-w-sm">
        {/* Migration Banner */}
        <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
          <p className="text-amber-300 text-sm font-medium">📢 系统已迁移至长期地址</p>
          <p className="text-amber-400/70 text-xs mt-1 break-all font-mono">
            procurement-insights.onrender.com
          </p>
          <p className="text-slate-500 text-xs mt-1.5">
            请收藏新地址，当前访问的旧链接即将失效
          </p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">管理后台</h1>
          <p className="text-slate-500 text-sm mt-1">采购品类洞察系统</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-ink-800/60 backdrop-blur-xl border border-ink-700/50 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">管理员账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入管理员账号"
              className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>
          {error && (
            <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            登录管理后台
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              ← 返回用户登录
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
