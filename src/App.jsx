import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { framework } from './data/framework.js'
import { mockData } from './data/mockData.js'
import { generateInsights } from './services/api.js'
import { exportToPDF } from './utils/export.js'
import { useAuth } from './services/auth'
import { getUserSearchHistory } from './services/storage'
import SearchBar from './components/SearchBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import DimensionCard from './components/DimensionCard.jsx'
import LoadingState from './components/LoadingState.jsx'

export default function App() {
  const navigate = useNavigate()
  const { user, logout, trackSearch } = useAuth()

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [activeSection, setActiveSection] = useState('definition')
  const [isDemoMode, setIsDemoMode] = useState(false)

  // 搜索处理
  const handleSearch = useCallback(async (category) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setIsDemoMode(false)
    setLoadingStep('正在初始化分析引擎...')

    try {
      const data = await generateInsights(category, null, (step) => {
        setLoadingStep(step)
      })
      setResult(data)
      setActiveSection('definition')
      // 记录搜索历史
      const summary = data.dimensions?.definition?.definition || category
      trackSearch(category, summary)
    } catch (err) {
      setError(err.message === 'NO_API_KEY' ? 'NO_API_KEY' : err.message)
    } finally {
      setLoading(false)
    }
  }, [trackSearch])

  // Demo模式
  const handleDemo = useCallback(() => {
    setResult(mockData)
    setIsDemoMode(true)
    setError(null)
    setActiveSection('definition')
    trackSearch('食用油（示例数据）', '食用油品类示例数据')
  }, [trackSearch])

  // 导航
  const handleNavigate = useCallback((sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(sectionId)
  }, [])

  // 导出
  const handleExport = useCallback(() => {
    if (result) exportToPDF(result)
  }, [result])

  // 登出
  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  // 滚动监听
  useEffect(() => {
    if (!result) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    framework.forEach(dim => {
      const el = document.getElementById(dim.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [result])

  // ====== Landing Page ======
  if (!result && !loading && !error) {
    return <LandingPage user={user} onSearch={handleSearch} onDemo={handleDemo} onLogout={handleLogout} loading={loading} />
  }

  // ====== Loading ======
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <LoadingState currentStep={loadingStep} />
      </div>
    )
  }

  // ====== Error ======
  if (error && !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">分析失败</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setError(null) }}
              className="px-5 py-2.5 bg-ink-600 hover:bg-ink-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              返回首页
            </button>
          </div>
          {error.includes('超时') && (
            <div className="mt-6 text-left bg-ink-700/40 rounded-lg p-4 border border-ink-600">
              <p className="text-xs text-slate-400 leading-relaxed">
                💡 <span className="text-amber-400">手机端建议</span>：弱网环境下AI分析可能超时，建议切换WiFi重试，或尝试更精确的品类关键词（如"5L装大豆油"而非"食用油"）。
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ====== Result View ======
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-ink-700/50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <button
            onClick={() => { setResult(null); setIsDemoMode(false) }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="text-lg">🎯</span>
            <span className="font-bold text-white text-sm hidden md:inline">采购品类洞察</span>
          </button>
          <div className="flex-1 max-w-md mx-auto">
            <SearchBar onSearch={handleSearch} disabled={loading} compact />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-ink-600/50 hover:bg-ink-500 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>📄</span>
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-ink-600/50 hover:bg-ink-500 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-5">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-16">
            <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Category banner */}
          <div className="rounded-xl bg-gradient-to-r from-ink-700/60 to-ink-700/30 border border-ink-600 px-5 py-4 mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{result.category}</h2>
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/20">
                    示例数据
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                生成于 {result.generatedAt} · 12维度标准分析框架
              </p>
            </div>
            {!isDemoMode && (
              <div className="text-right">
                <div className="text-xs text-slate-500">分析引擎</div>
                <div className="text-sm text-emerald-400 font-medium">DeepSeek AI</div>
              </div>
            )}
          </div>

          {/* Mobile dimension selector */}
          <div className="lg:hidden mb-5">
            <select
              value={activeSection}
              onChange={(e) => handleNavigate(e.target.value)}
              className="w-full px-4 py-2.5 bg-ink-700 border border-ink-500 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {framework.map((dim, i) => (
                <option key={dim.id} value={dim.id}>
                  {String(i + 1).padStart(2, '0')}. {dim.icon} {dim.title}
                </option>
              ))}
            </select>
          </div>

          {/* Dimension cards */}
          <div className="space-y-4">
            {framework.map((dim, i) => (
              <DimensionCard
                key={dim.id}
                dimension={dim}
                data={result.dimensions?.[dim.id]}
                index={i}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 mb-4 text-center">
            <p className="text-xs text-slate-600">
              采购品类洞察系统 · 基于采购12维度标准框架 · {result.category}分析报告
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

// ====== Landing Page Component ======
function LandingPage({ user, onSearch, onDemo, onLogout, loading }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (user?.id) {
      getUserSearchHistory(user.id).then(all => {
        const seen = new Set()
        const recent = (all || []).reverse().filter(item => {
          if (seen.has(item.category)) return false
          seen.add(item.category)
          return true
        }).slice(0, 10)
        setHistory(recent)
      })
    }
  }, [user?.id])

  const formatTime = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-ink-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="font-bold text-white text-sm">采购品类洞察</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">{user?.username || '用户'}</div>
            <div className="text-xs text-slate-600">{user?.industry || ''}</div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-ink-700/50 hover:bg-ink-600 text-slate-300 rounded-lg text-xs transition-colors"
          >
            退出
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-3">
            采购品类洞察
          </h1>
          <p className="text-slate-400 text-base md:text-lg">Procurement Category Insights</p>
          <p className="text-slate-500 text-sm mt-3">
            输入品类名称 · 一键生成标准化采购专业分析 · 帮助新人快速理解行业
          </p>
        </div>

        <SearchBar onSearch={onSearch} disabled={loading} />

        {/* Framework preview */}
        <div className="mt-14 w-full max-w-4xl animate-slide-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-ink-700"></div>
            <span className="text-xs text-slate-600 uppercase tracking-widest font-medium">12维度标准分析框架</span>
            <div className="flex-1 h-px bg-ink-700"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {framework.map((dim) => (
              <div
                key={dim.id}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-ink-700/30 border border-ink-600/50 hover:border-ink-500 hover:bg-ink-700/50 transition-all"
              >
                <span className="text-2xl">{dim.icon}</span>
                <span className="text-xs text-slate-400 text-center leading-tight">{dim.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-10 w-full max-w-xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-ink-700"></div>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                历史查询
              </span>
              <div className="flex-1 h-px bg-ink-700"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSearch(item.category)}
                  className="group flex flex-col items-start gap-1 px-3 py-2.5 bg-ink-800/40 hover:bg-ink-700/60 border border-ink-700/50 hover:border-blue-500/30 rounded-lg text-left transition-all"
                >
                  <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 truncate w-full">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-600">{formatTime(item.searchedAt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Demo */}
        <div className="mt-8 text-center">
          <button
            onClick={onDemo}
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
          >
            查看示例数据（食用油品类） →
          </button>
          <p className="text-xs text-slate-600 mt-3">
            AI引擎就绪 · 输入品类名称即可深度分析 · 手机端已优化
          </p>
        </div>
      </div>
    </div>
  )
}
