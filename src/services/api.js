/**
 * API 调用层 — 分片并行：3组×4维度并行调用，每组 ~15s，总耗时不超 20s
 * type hint schema + json_object 保证内容质量
 */
import { framework } from '../data/framework.js'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const SHARD_TIMEOUT = 35000

function shardFramework() {
  const groups = [[], [], []]
  framework.forEach((dim, i) => groups[i % 3].push(dim))
  return groups
}

function buildShardPrompt(dims) {
  const schemas = dims.map(dim => {
    const fields = dim.fields.map(f => {
      let t
      switch (f.type) {
        case 'text': t = 'string'; break
        case 'tags': case 'list': t = 'string[]'; break
        case 'keyvalue': t = 'object'; break
        case 'table': t = `object[${f.columns?.join(',')}]`; break
        case 'formula': t = 'string'; break
        case 'chart': t = '{labels,series[{name,color,data}],unit}'; break
        default: t = 'string'
      }
      return `"${f.key}":${t}`
    }).join(',')
    return `"${dim.id}":{${fields}}`
  }).join(',')

  return `资深采购总监。输出纯JSON：{"dimensions":{${schemas}}}。每字段填真实数据（带数字），表格至少2行。数据2025-2026。`
}

async function callShard(category, dims, key) {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), SHARD_TIMEOUT)

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: buildShardPrompt(dims) },
          { role: 'user', content: `分析品类「${category}」的${dims.map(d => d.title).join('、')}。每字段至少2句带数字。纯JSON。` },
        ],
        temperature: 0.3,
        max_tokens: 4500,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(tid)

    if (!response.ok) {
      if (response.status === 401) throw new Error('KEY')
      if (response.status === 429) throw new Error('RATE')
      throw new Error('HTTP')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('EMPTY')

    let result
    try { result = JSON.parse(content) } catch {
      const m = content.match(/\{[\s\S]*\}/)
      result = m ? JSON.parse(m[0]) : {}
    }

    return result.dimensions || {}
  } catch (err) {
    clearTimeout(tid)
    if (err.name === 'AbortError') throw new Error('TIMEOUT')
    throw err
  }
}

export async function generateInsights(category, apiKey, onProgress) {
  const key = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  if (!key) throw new Error('NO_API_KEY')

  const shards = shardFramework()

  if (onProgress) onProgress('正在初始化分析引擎（3组并行）...')
  if (onProgress) onProgress('AI并行分析中，预计15-25秒...')

  const results = await Promise.allSettled(
    shards.map(dims => callShard(category, dims, key))
  )

  // 合并
  let allDimensions = {}
  let ok = 0

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      Object.assign(allDimensions, r.value)
      ok++
    } else {
      shards[i].forEach(dim => {
        allDimensions[dim.id] = {}
        dim.fields.forEach(f => {
          allDimensions[dim.id][f.key] = f.type === 'list' || f.type === 'tags' || f.type === 'table' ? [] : f.type === 'keyvalue' ? {} : f.type === 'chart' ? { labels: [], series: [], unit: '' } : ''
        })
      })
    }
  })

  if (ok === 0) throw new Error('所有分析请求均失败（网络或API异常），请检查网络后重试')

  if (onProgress) onProgress('正在合并分析结果...')

  const result = {
    category,
    generatedAt: new Date().toLocaleDateString('zh-CN'),
    dimensions: {}
  }

  framework.forEach(dim => {
    result.dimensions[dim.id] = {}
    dim.fields.forEach(field => {
      const val = allDimensions[dim.id]?.[field.key]
      result.dimensions[dim.id][field.key] = val !== undefined && val !== null ? val : (field.type === 'list' || field.type === 'tags' || field.type === 'table' ? [] : field.type === 'keyvalue' ? {} : field.type === 'chart' ? { labels: [], series: [], unit: '' } : '')
    })
  })

  if (onProgress) onProgress('分析完成，正在渲染报告...')
  return result
}
