import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { register, login } = useAuth()

  const [mode, setMode] = useState('register')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!phone || !password) {
      setError('请填写手机号和密码')
      return
    }

    if (mode === 'register') {
      if (!username) { setError('请输入用户名'); return }
      if (!company) { setError('请输入公司名称'); return }
      if (!industry) { setError('请输入所属行业'); return }
      if (password.length < 6) { setError('密码至少6位'); return }

      setSubmitting(true)
      register({ phone, username, password, company, industry }).then(result => {
        setSubmitting(false)
        if (result.ok) navigate('/')
        else setError(result.msg)
      })
    } else {
      setSubmitting(true)
      login(phone, password).then(result => {
        setSubmitting(false)
        if (result.ok) navigate('/')
        else setError(result.msg)
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-ink-900 via-slate-900 to-ink-800">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h13M9 5v6h13M3 7h.01M3 12h.01M3 17h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">采购品类洞察系统</h1>
          <p className="text-slate-500 text-sm mt-2">12维度标准分析框架 · 资深采购级深度</p>
        </div>

        {/* Card */}
        <div className="bg-ink-800/60 backdrop-blur-xl border border-ink-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Tab Switch */}
          <div className="flex gap-2 mb-6 p-1 bg-ink-900/50 rounded-xl">
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              注册
            </button>
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              登录
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入11位手机号"
                className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>

            {/* Username (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            )}

            {/* Company (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">公司</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value.slice(0, 50))}
                  placeholder="请输入公司名称"
                  className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            )}

            {/* Industry (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">所属行业</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value.slice(0, 30))}
                  placeholder="请输入所属行业"
                  className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '设置密码（至少6位）' : '请输入密码'}
                className="w-full px-4 py-3 bg-ink-900/60 border border-ink-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm shadow-lg shadow-blue-500/20 transition-all"
            >
              {submitting ? '处理中...' : (mode === 'register' ? '注册并登录' : '登录')}
            </button>
          </form>

          {/* Admin entry */}
          <div className="mt-6 pt-6 border-t border-ink-700/50 text-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              管理后台 →
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          注册即同意《采购品类洞察系统服务条款》
        </p>
      </div>
    </div>
  )
}
