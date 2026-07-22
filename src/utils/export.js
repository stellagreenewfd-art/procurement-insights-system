import html2pdf from 'html2pdf.js'
import { framework } from '../data/framework.js'

export function exportToPDF(result) {
  if (!result) return

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  let body = ''

  // ====== Cover Page ======
  body += `
<div class="cover-page">
  <div class="cover-top-line"></div>
  <div class="cover-content">
    <div class="cover-badge">采购专业洞察报告</div>
    <h1 class="cover-title">${result.category}</h1>
    <div class="cover-subtitle">Category Procurement Insights</div>
    <div class="cover-divider"></div>
    <table class="cover-meta">
      <tr><td class="cover-label">报告日期</td><td>${today}</td></tr>
      <tr><td class="cover-label">分析框架</td><td>12维度资深采购级标准模型</td></tr>
      <tr><td class="cover-label">分析引擎</td><td>DeepSeek AI</td></tr>
      <tr><td class="cover-label">目标读者</td><td>采购团队 · 供应链管理者 · 品类决策者</td></tr>
    </table>
  </div>
  <div class="cover-footer">
    <span>Procurement Intelligence System</span>
    <span>机密 · 仅供内部使用</span>
  </div>
</div>
<div class="page-break"></div>
`

  // ====== TOC ======
  body += `
<div class="toc-page">
  <h2 class="toc-title">目 录</h2>
  <div class="toc-divider"></div>
  <div class="toc-list">
`
  framework.forEach((dim, i) => {
    body += `
    <div class="toc-item">
      <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="toc-text">${dim.icon} ${dim.title}</span>
    </div>`
  })
  body += `</div></div><div class="page-break"></div>`

  // ====== Executive Summary ======
  const defData = result.dimensions?.definition || {}
  const marketData = result.dimensions?.market || {}
  const costData = result.dimensions?.cost || {}
  const riskData = result.dimensions?.risk || {}

  body += `
<div class="exec-summary">
  <h2 class="section-title">
    <span class="section-num">概要</span>
    执行摘要
  </h2>
  <div class="summary-box">
    <p><strong>品类定义：</strong>${defData.definition || `${result.category}品类分析`}</p>
    <p><strong>市场规模：</strong>${typeof marketData.marketSize === 'object' ? Object.values(marketData.marketSize).slice(0, 2).join('；') : (marketData.marketSize || '详见正文')}</p>
    <p><strong>核心洞察：</strong>本报告基于12维度标准框架，从品类定义、市场规模、产业链、竞争格局、成本结构、技术壁垒、质量标准、寻源策略、风险矩阵、采购策略、期货走势、企业财报共12个维度，系统性拆解${result.category}品类采购决策所需全部专业知识。</p>
  </div>
</div>
<div class="page-break"></div>
`

  // ====== 12 Dimensions ======
  framework.forEach((dim, i) => {
    const data = result.dimensions?.[dim.id] || {}
    body += `
<div class="dimension-section">
  <h2 class="section-title">
    <span class="section-num">${String(i + 1).padStart(2, '0')}</span>
    ${dim.title}
  </h2>
  <div class="section-subtitle">${dim.titleEn}</div>
`

    dim.fields.forEach(field => {
      const value = data[field.key]
      if (!value || (Array.isArray(value) && value.length === 0)) return

      body += `<div class="field-block"><h3 class="field-title">${field.label}</h3>`

      switch (field.type) {
        case 'text':
          body += `<p class="field-text">${String(value).replace(/\n/g, '<br>')}</p>`
          break
        case 'tags': {
          const tags = Array.isArray(value) ? value : [value]
          body += `<div class="tags-row">${tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}</div>`
          break
        }
        case 'list': {
          const items = Array.isArray(value) ? value : [value]
          body += `<ul class="report-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`
          break
        }
        case 'table': {
          const rows = Array.isArray(value) ? value : []
          const cols = field.columns || (rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : ['内容'])
          if (rows.length === 0) break
          body += '<div class="table-wrap"><table class="report-table">'
          body += `<thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`
          rows.forEach(row => {
            const rd = row && typeof row === 'object' ? row : {}
            body += `<tr>${cols.map(c => `<td>${rd[c] ?? ''}</td>`).join('')}</tr>`
          })
          body += '</tbody></table></div>'
          break
        }
        case 'keyvalue': {
          const obj = value && typeof value === 'object' ? value : {}
          body += '<div class="kv-grid">'
          Object.entries(obj).forEach(([k, v]) => {
            body += `<div class="kv-card"><span class="kv-key">${k}</span><span class="kv-val">${v}</span></div>`
          })
          body += '</div>'
          break
        }
        case 'formula':
          body += `<div class="formula-block"><span class="formula-label">⚙ 价格联动公式</span><code>${String(value)}</code></div>`
          break
        case 'chart':
          body += `<p class="chart-note">📈 ${String(value?.unit || '')}走势数据已生成，请在系统网页中查看交互式图表</p>`
          break
      }
      body += '</div>'
    })
    body += '</div><div class="page-break"></div>'
  })

  // ====== Full HTML ======
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Noto Sans SC",-apple-system,"Microsoft YaHei","PingFang SC",sans-serif;font-size:11px;color:#1a1a2e;line-height:1.75;background:#fff}
  .page-break{page-break-after:always}

  /* === Cover === */
  .cover-page{height:260mm;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,#f8fafc 0%,#fff 40%,#eff6ff 100%);position:relative;overflow:hidden}
  .cover-page::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:linear-gradient(135deg,#3b82f610,#1e40af08)}
  .cover-top-line{height:4px;background:linear-gradient(90deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)}
  .cover-content{text-align:center;padding:60px 40px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .cover-badge{display:inline-block;background:#1e40af;color:#fff;font-size:12px;font-weight:500;padding:6px 20px;border-radius:20px;letter-spacing:3px;margin-bottom:32px}
  .cover-title{font-size:36px;font-weight:700;color:#0f172a;margin-bottom:8px;letter-spacing:2px}
  .cover-subtitle{font-size:14px;color:#64748b;font-weight:300;letter-spacing:4px;text-transform:uppercase;margin-bottom:28px}
  .cover-divider{width:60px;height:2px;background:#3b82f6;margin-bottom:28px}
  .cover-meta{border-collapse:collapse;margin:0 auto}
  .cover-meta td{padding:6px 16px;font-size:12px}
  .cover-label{text-align:right;color:#64748b;font-weight:500;white-space:nowrap}
  .cover-label+td{text-align:left;color:#334155;padding-left:8px}
  .cover-footer{display:flex;justify-content:space-between;padding:16px 32px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;letter-spacing:1px}

  /* === TOC === */
  .toc-page{padding:32px 40px}
  .toc-title{font-size:22px;font-weight:700;color:#0f172a;text-align:center;letter-spacing:8px;margin-bottom:12px}
  .toc-divider{width:40px;height:2px;background:#3b82f6;margin:0 auto 24px auto}
  .toc-list{max-width:500px;margin:0 auto}
  .toc-item{display:flex;align-items:center;padding:10px 0;border-bottom:1px dotted #e2e8f0}
  .toc-num{width:36px;height:36px;background:#1e40af;color:#fff;font-size:13px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:16px;flex-shrink:0}
  .toc-text{font-size:13px;color:#334155;font-weight:500}

  /* === Sections === */
  .exec-summary{padding:24px 32px}
  .dimension-section{padding:0 32px}
  .section-title{font-size:18px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:12px;margin-bottom:4px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
  .section-num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:#1e40af;color:#fff;font-size:14px;font-weight:700;border-radius:8px;flex-shrink:0}
  .section-subtitle{font-size:11px;color:#94a3b8;margin-bottom:16px;margin-left:44px;letter-spacing:1px}
  .summary-box{background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px 20px;margin-top:8px;border-radius:0 8px 8px 0}
  .summary-box p{margin:6px 0;font-size:12px;color:#334155}

  /* === Fields === */
  .field-block{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dashed #f1f5f9}
  .field-block:last-child{border-bottom:none}
  .field-title{font-size:11px;font-weight:600;color:#1e40af;margin-bottom:6px;display:flex;align-items:center;gap:6px}
  .field-title::before{content:'';width:4px;height:4px;background:#3b82f6;border-radius:50%}
  .field-text{font-size:11px;color:#334155;text-align:justify;line-height:1.8}

  /* === Tags === */
  .tags-row{margin:4px 0 2px 0}
  .tag-badge{display:inline-block;background:#eff6ff;color:#1e40af;padding:3px 10px;border-radius:12px;font-size:10px;margin:2px 4px 4px 0;border:1px solid #bfdbfe}

  /* === Lists === */
  .report-list{margin:4px 0;padding-left:16px}
  .report-list li{font-size:11px;color:#475569;margin:3px 0;padding-left:4px}
  .report-list li::marker{color:#3b82f6}

  /* === Tables === */
  .table-wrap{margin:8px 0 4px 0;overflow-x:auto}
  .report-table{width:100%;border-collapse:collapse;font-size:10px}
  .report-table th{background:#1e40af;color:#fff;text-align:left;padding:7px 8px;font-weight:500;font-size:10px;white-space:nowrap}
  .report-table td{padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#334155;vertical-align:top}
  .report-table tbody tr:nth-child(even) td{background:#f8fafc}
  .report-table tbody tr:hover td{background:#eff6ff}

  /* === Key-Value === */
  .kv-grid{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
  .kv-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:6px 12px;display:flex;gap:8px;align-items:baseline}
  .kv-key{font-size:10px;font-weight:600;color:#64748b;white-space:nowrap}
  .kv-val{font-size:11px;color:#1e293b;font-weight:500}

  /* === Formula === */
  .formula-block{background:linear-gradient(90deg,#fffbeb,#fef3c7);border-left:3px solid #f59e0b;padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0}
  .formula-label{display:block;font-size:10px;color:#92400e;font-weight:600;margin-bottom:4px}
  .formula-block code{font-size:11px;color:#78350f;font-family:"SF Mono","Menlo",monospace;line-height:1.8}

  /* === Chart note === */
  .chart-note{font-size:10px;color:#94a3b8;font-style:italic;margin:4px 0}

  /* === Footer === */
  .report-footer{text-align:center;padding:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:9px}
</style></head><body>
${body}
<div class="report-footer">— 采购品类洞察系统 · 12维度资深采购级分析框架 · ${result.category} —</div>
</body></html>`

  // 渲染并导出
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()

  const startExport = () => {
    html2pdf()
      .set({
        margin: [12, 10, 12, 10],
        filename: `${result.category}_采购洞察报告_${result.generatedAt}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break', avoid: ['.field-block', '.report-table tr'] },
      })
      .from(doc.body)
      .save()
      .finally(() => {
        setTimeout(() => document.body.removeChild(iframe), 300)
      })
  }

  // 等待字体和图片加载
  setTimeout(startExport, 800)
}
