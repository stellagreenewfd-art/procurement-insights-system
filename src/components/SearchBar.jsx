import { useState } from 'react'
import { exampleCategories } from '../data/framework.js'

/**
 * 搜索栏组件
 * compact: 紧凑模式（用于header中）
 */
export default function SearchBar({ onSearch, disabled, compact }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && !disabled) onSearch(query.trim())
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入品类名称..."
          className="w-full px-3 py-2 bg-ink-600/50 border border-ink-500 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          分析
        </button>
      </form>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none">
          🔍
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入品类名称，如：食用油、纸尿裤、不锈钢管材..."
          className="w-full pl-14 pr-32 py-4 bg-ink-700/60 border border-ink-500 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          disabled={disabled}
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          开始分析 →
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs text-slate-500">示例品类：</span>
        {exampleCategories.map(cat => (
          <button
            key={cat}
            onClick={() => { setQuery(cat); onSearch(cat) }}
            disabled={disabled}
            className="px-3 py-1 bg-ink-600/40 hover:bg-ink-500/60 text-slate-400 hover:text-slate-200 rounded-full text-xs transition-all border border-ink-500/60 disabled:opacity-40"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
