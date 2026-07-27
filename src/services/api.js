/**
 * API 调用层 v3 — 后端代理模式
 * 所有 DeepSeek API 调用走服务端 /api/search，API Key 不暴露前端
 * 框架定义保留用于 DimensionCard 渲染，实际分析由后端完成
 */
import { framework } from '../data/framework.js'

const API_BASE = '/api/search'
const REQUEST_TIMEOUT = 60000 // 60秒超时（后端处理3个shard）

/**
 * 生成采购品类洞察报告
 * @param {string} category - 品类名称
 * @param {string} apiKey - 已废弃（v3不再需要前端传key）
 * @param {function} onProgress - 进度回调
 */
export async function generateInsights(category, apiKey, onProgress) {
  if (!category || !category.trim()) {
    throw new Error('请提供品类名称')
  }

  if (onProgress) onProgress('正在连接分析服务器...')
  if (onProgress) onProgress('AI并行分析中，预计15-25秒...')

  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: category.trim() }),
      signal: controller.signal,
    })

    clearTimeout(tid)

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}))
      throw new Error('RATE:' + (data.msg || '请求过于频繁，请稍后再试'))
    }

    if (response.status === 401) {
      throw new Error('KEY')
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `服务器错误 (${response.status})`)
    }

    const data = await response.json()
    if (!data.success || !data.data) {
      throw new Error('分析结果异常，请重试')
    }

    if (onProgress) onProgress('正在合并分析结果...')
    if (onProgress) onProgress('分析完成，正在渲染报告...')

    // 构建与之前兼容的返回格式
    const result = {
      category: data.data.category,
      generatedAt: data.data.generatedAt,
      dimensions: data.data.dimensions || {},
    }
    return result

  } catch (err) {
    clearTimeout(tid)
    if (err.name === 'AbortError') throw new Error('TIMEOUT')
    if (err.message?.startsWith('RATE:')) throw err
    throw err
  }
}
