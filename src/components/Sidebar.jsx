import { framework, colorMap } from '../data/framework.js'

/**
 * 侧边栏导航 - 10维度快速跳转
 */
export default function Sidebar({ activeSection, onNavigate }) {
  return (
    <nav className="space-y-0.5">
      <div className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-3 px-3">
        分析维度
      </div>
      {framework.map((dim, i) => {
        const colors = colorMap[dim.color] || colorMap.blue
        const isActive = activeSection === dim.id
        return (
          <button
            key={dim.id}
            onClick={() => onNavigate(dim.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group ${
              isActive
                ? `${colors.bg} ${colors.text} border ${colors.border}`
                : 'text-slate-400 hover:bg-ink-600/40 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className={`text-base flex-shrink-0 ${isActive ? '' : 'opacity-60 group-hover:opacity-100'}`}>
              {dim.icon}
            </span>
            <span className="text-left flex-1 truncate text-[13px]">{dim.title}</span>
            <span className={`text-[10px] font-mono flex-shrink-0 ${isActive ? colors.text : 'text-slate-700'}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
