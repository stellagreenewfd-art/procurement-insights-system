import { useEffect, useState } from 'react'
import { framework } from '../data/framework.js'

/**
 * 加载状态组件 - 展示分析进度
 */
export default function LoadingState({ currentStep }) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => Math.min(prev + 1, framework.length - 1))
    }, 700)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto">
      {/* Spinner */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-ink-600/50"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl transition-all duration-300">
          {framework[activeIdx]?.icon || '⏳'}
        </div>
      </div>

      {/* Step message */}
      <p className="text-slate-200 text-lg font-medium mb-1.5">{currentStep || '正在分析...'}</p>
      <p className="text-slate-500 text-sm text-center">AI基于12维度框架深度分析 · 预计30-60秒 · 请勿关闭页面</p>

      {/* Dimension progress */}
      <div className="mt-10 w-full space-y-1">
        {framework.map((dim, i) => (
          <div
            key={dim.id}
            className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
              i <= activeIdx ? 'text-slate-400' : 'text-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i <= activeIdx ? 'bg-blue-500 scale-125' : 'bg-ink-500'
            }`}></span>
            <span className="text-sm">{dim.icon}</span>
            <span>{dim.title}</span>
            {i <= activeIdx && i < framework.length - 1 && (
              <span className="ml-auto text-blue-500/60 text-[10px]">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
