import { Component } from 'react'
import { colorMap } from '../data/framework.js'

/** 安全渲染包装：类型不匹配时优雅降级 */
function safeArray(v, fieldName) {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v ? [v] : []
  return []
}

function safeObject(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v
  return {}
}

function safeString(v) {
  if (v == null) return ''
  return String(v)
}

/** React Error Boundary — 防止单个维度崩溃导致全屏黑屏 */
class DimensionErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-red-500/30 bg-ink-700/40 overflow-hidden">
          <div className="px-5 py-8 text-center">
            <p className="text-red-400 text-sm">此维度渲染异常，请刷新页面重试</p>
          </div>
        </section>
      )
    }
    return this.props.children
  }
}

export default function DimensionCard({ dimension, data, index }) {
  const colors = colorMap[dimension.color] || colorMap.blue

  return (
    <DimensionErrorBoundary>
      <section id={dimension.id} className="section-anchor animate-slide-up">
        <div className={`rounded-xl border ${colors.border} bg-ink-700/40 overflow-hidden`}>
          <div className={`flex items-center gap-3 px-5 py-4 border-b ${colors.border} ${colors.bg}`}>
            <span className="text-2xl flex-shrink-0">{dimension.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate">{dimension.title}</h3>
              <p className="text-xs text-slate-500">{dimension.titleEn}</p>
            </div>
            <span className={`text-xs ${colors.text} ${colors.bg} px-2 py-0.5 rounded font-mono flex-shrink-0`}>
              {String(index + 1).padStart(2, '0')} / 12
            </span>
          </div>
          <div className="px-5 py-4 space-y-5">
            {dimension.fields.map(field => (
              <FieldRenderer key={field.key} field={field} value={data?.[field.key]} />
            ))}
          </div>
        </div>
      </section>
    </DimensionErrorBoundary>
  )
}

function FieldRenderer({ field, value }) {
  try {
    const isEmpty =
      value === undefined || value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)

    if (isEmpty) {
      return (
        <div>
          <label className="text-xs text-slate-600 uppercase tracking-wider font-medium">{field.label}</label>
          <p className="text-slate-700 text-sm mt-1.5">—</p>
        </div>
      )
    }

    return (
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2">{field.label}</label>
        {renderValueSafe(field, value)}
      </div>
    )
  } catch {
    return (
      <div>
        <label className="text-xs text-slate-600 uppercase tracking-wider font-medium">{field.label}</label>
        <p className="text-red-400/60 text-xs mt-1">渲染错误</p>
      </div>
    )
  }
}

function renderValueSafe(field, value) {
  try {
    switch (field.type) {
      case 'text':
        return <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{safeString(value)}</p>

      case 'tags': {
        const arr = safeArray(value, field.key)
        return (
          <div className="flex flex-wrap gap-2">
            {arr.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium border border-blue-500/20">
                {safeString(tag)}
              </span>
            ))}
          </div>
        )
      }

      case 'list': {
        const arr = safeArray(value, field.key)
        return (
          <ul className="space-y-1.5">
            {arr.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-blue-400 mt-0.5 flex-shrink-0 text-xs">▸</span>
                <span className="leading-relaxed">{safeString(item)}</span>
              </li>
            ))}
          </ul>
        )
      }

      case 'table':
        return <TableView field={field} value={value} />

      case 'keyvalue': {
        const obj = safeObject(value)
        return (
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="bg-ink-600/30 rounded-lg px-3.5 py-2.5 border border-ink-500/40">
                <dt className="text-xs text-slate-500 mb-0.5">{k}</dt>
                <dd className="text-sm text-slate-200 font-medium">{safeString(v)}</dd>
              </div>
            ))}
          </div>
        )
      }

      case 'formula':
        return (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-200/90 leading-relaxed whitespace-pre-line font-mono">
              {safeString(value)}
            </p>
          </div>
        )

      case 'chart':
        return <ChartView value={value} />

      default:
        return <p className="text-slate-300 text-sm">{safeString(value)}</p>
    }
  } catch {
    return <p className="text-slate-300 text-sm">{safeString(value)}</p>
  }
}

function TableView({ field, value }) {
  try {
    const rows = safeArray(value, 'table')
    if (rows.length === 0) return <p className="text-slate-600 text-sm">—</p>

    const cols = field.columns || []
    // 如果AI返回的键名与预定义列名不一致，自动使用实际键名
    const actualCols = cols.length > 0 ? cols : (rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : ['内容'])

    return (
      <div className="overflow-x-auto -mx-1 rounded-lg border border-ink-600/40">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-ink-600/40 border-b border-ink-500">
              {actualCols.map(col => (
                <th key={col} className="text-left py-2.5 px-3 text-xs text-slate-300 font-semibold uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowObj = row && typeof row === 'object' ? row : { [actualCols[0] || '内容']: row }
              return (
                <tr key={i} className="border-b border-ink-600/30 hover:bg-ink-600/20 transition-colors">
                  {actualCols.map((col, j) => (
                    <td key={col} className={`py-2.5 px-3 align-top ${j === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                      {safeString(rowObj[col] !== undefined ? rowObj[col] : '')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  } catch {
    return <p className="text-slate-300 text-sm">{safeString(value)}</p>
  }
}

function ChartView({ value }) {
  try {
    if (!value || !value.labels || !value.series || !Array.isArray(value.series) || value.series.length === 0) {
      return <p className="text-slate-600 text-sm">暂无图表数据</p>
    }

    const { labels, series, unit } = value
    const width = 720
    const height = 320
    const padding = { top: 30, right: 100, bottom: 50, left: 70 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const allValues = series.flatMap(s => Array.isArray(s.data) ? s.data.filter(v => v != null && !isNaN(v)) : [])
    if (allValues.length === 0) return <p className="text-slate-600 text-sm">无有效数据</p>

    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const range = maxVal - minVal || 1
    const yMin = minVal - range * 0.1
    const yMax = maxVal + range * 0.1
    const yRange = yMax - yMin

    const xStep = chartW / Math.max(labels.length - 1, 1)
    const xPos = (i) => padding.left + i * xStep
    const yPos = (v) => padding.top + chartH - ((v - yMin) / yRange) * chartH

    const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yRange * i) / 5)

    const buildPath = (data) => {
      if (!Array.isArray(data)) return ''
      return data.map((v, i) => {
        if (v == null || isNaN(v)) return ''
        const cmd = i === 0 ? 'M' : 'L'
        return `${cmd} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`
      }).join(' ')
    }

    const chartUnit = unit || ''
    const displayLabels = Array.isArray(labels) ? labels : []

    return (
      <div className="overflow-x-auto rounded-lg border border-ink-600/40 bg-ink-800/30 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '600px' }}>
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line x1={padding.left} y1={yPos(tick)} x2={width - padding.right} y2={yPos(tick)} stroke="rgba(71,85,105,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding.left - 8} y={yPos(tick) + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                {tick >= 1000 ? (tick / 1000).toFixed(1) + 'k' : tick.toFixed(0)}
              </text>
            </g>
          ))}
          {displayLabels.map((label, i) => {
            if (i % 3 !== 0 && i !== displayLabels.length - 1) return null
            return (
              <text key={i} x={xPos(i)} y={height - padding.bottom + 18} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                {safeString(label)}
              </text>
            )
          })}
          <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(71,85,105,0.4)" strokeWidth="1.5" />
          {series.map((s, si) => {
            if (!s || !Array.isArray(s.data)) return null
            const path = buildPath(s.data)
            if (!path) return null
            const areaPath = path + ` L ${xPos(s.data.length - 1).toFixed(1)} ${(height - padding.bottom).toFixed(1)} L ${xPos(0).toFixed(1)} ${(height - padding.bottom).toFixed(1)} Z`
            const color = s.color || '#64748b'
            return (
              <g key={si}>
                <defs>
                  <linearGradient id={`grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#grad-${si})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {s.data.map((v, i) => {
                  if (v == null || isNaN(v)) return null
                  return <circle key={i} cx={xPos(i)} cy={yPos(v)} r="2.5" fill={color} stroke="#0f172a" strokeWidth="1" />
                })}
                {s.data.filter(v => v != null && !isNaN(v)).length > 0 && (() => {
                  const lastIdx = s.data.reduce((acc, v, i) => v != null && !isNaN(v) ? i : acc, -1)
                  if (lastIdx < 0) return null
                  const lastVal = s.data[lastIdx]
                  return (
                    <g>
                      <circle cx={xPos(lastIdx)} cy={yPos(lastVal)} r="4" fill={color} opacity="0.3" />
                      <text x={xPos(lastIdx) + 8} y={yPos(lastVal) - 8} fill={color} fontSize="11" fontWeight="600" fontFamily="monospace">
                        {lastVal >= 1000 ? (lastVal / 1000).toFixed(2) + 'k' : lastVal.toFixed(1)}{chartUnit}
                      </text>
                    </g>
                  )
                })()}
              </g>
            )
          })}
          {series.map((s, si) => {
            const color = s.color || '#64748b'
            return (
              <g key={si} transform={`translate(${width - padding.right + 10}, ${padding.top + si * 22})`}>
                <line x1="0" y1="0" x2="16" y2="0" stroke={color} strokeWidth="2.5" />
                <circle cx="8" cy="0" r="2.5" fill={color} />
                <text x="22" y="4" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">{safeString(s.name)}</text>
              </g>
            )
          })}
          <text x={padding.left} y={padding.top - 12} fill="#64748b" fontSize="10" fontFamily="monospace">
            {chartUnit ? `单位: ${chartUnit}` : ''}
          </text>
        </svg>
      </div>
    )
  } catch {
    return <p className="text-slate-600 text-sm">图表渲染失败</p>
  }
}
