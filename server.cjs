/**
 * procurement-insights API 代理服务器
 * 功能: 隐藏 DeepSeek API Key、速率限制、请求日志、Token 统计
 */
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== DeepSeek API Key（仅存服务端，不暴露前端） ======
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-dac7c21fcb434c35aa548a159de0f32d';
const DEEPSEEK_API_HOST = 'api.deepseek.com';
const DEEPSEEK_API_PATH = '/chat/completions';

app.use(express.json({ limit: '2mb' }));

// ====== 速率限制 ======
const rateMap = new Map(); // IP -> { count, resetTime }
const RATE_LIMIT = 30; // 每IP每小时最多30次搜索（每次3个shard = 90个实际API调用）
const RATE_WINDOW = 60 * 60 * 1000;

function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  const now = Date.now();
  let entry = rateMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_WINDOW };
    rateMap.set(ip, entry);
  }
  
  entry.count++;
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - entry.count));
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
  
  if (entry.count > RATE_LIMIT) {
    console.log(`[RATE] ${ip} 超过限制 (${entry.count}/${RATE_LIMIT})`);
    return res.status(429).json({ 
      error: 'RATE', 
      msg: `请求过于频繁，每IP每小时限制${RATE_LIMIT}次，请稍后再试`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000 / 60) + '分钟'
    });
  }
  next();
}

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetTime) rateMap.delete(ip);
  }
}, 10 * 60 * 1000);

// ====== 全局请求日志 ======
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms | IP: ${req.ip}`);
    }
  });
  next();
});

// ====== Token 统计（内存） ======
let tokenStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalRequests: 0,
  lastReset: new Date().toISOString(),
};

// ====== DeepSeek API 代理 ======
function callDeepSeekShard(category, dims) {
  return new Promise((resolve, reject) => {
    // 构建 prompt（与前端 api.js 完全一致的逻辑）
    const schemas = dims.map(dim => {
      const fields = dim.fields.map(f => {
        let t;
        switch (f.type) {
          case 'text': t = 'string'; break;
          case 'tags': case 'list': t = 'string[]'; break;
          case 'keyvalue': t = 'object'; break;
          case 'table': t = `object[${(f.columns || []).join(',')}]`; break;
          case 'formula': t = 'string'; break;
          case 'chart': t = '{labels,series[{name,color,data}],unit}'; break;
          default: t = 'string';
        }
        return `"${f.key}":${t}`;
      }).join(',');
      return `"${dim.id}":{${fields}}`;
    }).join(',');
    
    const systemPrompt = `资深采购总监。输出纯JSON：{"dimensions":{${schemas}}}。每字段填真实数据（带数字），表格至少2行。数据2025-2026。`;
    const userMsg = `分析品类「${category}」的${dims.map(d => d.title).join('、')}。每字段至少2句带数字。纯JSON。`;
    
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    });
    
    const options = {
      hostname: DEEPSEEK_API_HOST,
      port: 443,
      path: DEEPSEEK_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 40000,
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'API Error'));
          } else {
            // 记录 token 用量
            if (parsed.usage) {
              tokenStats.totalInputTokens += parsed.usage.prompt_tokens || 0;
              tokenStats.totalOutputTokens += parsed.usage.completion_tokens || 0;
              tokenStats.totalRequests++;
            }
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 200)));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });
}

// ====== API: 搜索分析（核心接口） ======
app.post('/api/search', rateLimiter, async (req, res) => {
  const { category } = req.body;
  if (!category || !category.trim()) {
    return res.status(400).json({ error: '请提供品类名称' });
  }
  
  console.log(`[SEARCH] 品类: "${category}" | IP: ${req.ip}`);
  
  try {
    // 维度分组（与前端一致：12维度 ÷ 3 = 3组并行）
    const framework = require('./src/data/framework_loader');
    // 直接内联框架定义避免模块加载问题
  } catch {}
  
  // 直接内联12维度的分组（避免require ES模块问题）
  const ALL_DIMS = getFrameworkDims();
  const shards = [ALL_DIMS.filter((_, i) => i % 3 === 0), ALL_DIMS.filter((_, i) => i % 3 === 1), ALL_DIMS.filter((_, i) => i % 3 === 2)];
  
  const results = await Promise.allSettled(
    shards.map(dims => callDeepSeekShard(category, dims))
  );
  
  let allDimensions = {};
  let ok = 0;
  
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      try {
        const content = r.value.choices?.[0]?.message?.content;
        if (content) {
          let parsed;
          try { parsed = JSON.parse(content); } catch {
            const m = content.match(/\{[\s\S]*\}/);
            parsed = m ? JSON.parse(m[0]) : {};
          }
          if (parsed.dimensions) {
            Object.assign(allDimensions, parsed.dimensions);
          }
        }
        ok++;
      } catch {}
    }
  });
  
  if (ok === 0) {
    return res.status(502).json({ error: '所有分析请求均失败，请稍后重试' });
  }
  
  // 组装最终结果
  const result = {
    category,
    generatedAt: new Date().toLocaleDateString('zh-CN'),
    dimensions: {}
  };
  
  ALL_DIMS.forEach(dim => {
    result.dimensions[dim.id] = {};
    dim.fields.forEach(field => {
      const val = allDimensions[dim.id]?.[field.key];
      result.dimensions[dim.id][field.key] = val !== undefined && val !== null ? val : 
        (field.type === 'list' || field.type === 'tags' || field.type === 'table' ? [] : 
         field.type === 'keyvalue' ? {} : 
         field.type === 'chart' ? { labels: [], series: [], unit: '' } : '');
    });
  });
  
  console.log(`[SEARCH] 完成: "${category}" | ${ok}/3 shard成功 | 累计input: ${tokenStats.totalInputTokens} output: ${tokenStats.totalOutputTokens}`);
  res.json({ success: true, data: result });
});

// ====== API: 用量统计 ======
app.get('/api/usage', (req, res) => {
  const totalCost = (tokenStats.totalInputTokens / 1000000 * 1.0) + (tokenStats.totalOutputTokens / 1000000 * 2.0);
  res.json({
    ...tokenStats,
    estimatedCost: `¥${totalCost.toFixed(4)}`,
    activeIPs: rateMap.size,
  });
});

// ====== API: 健康检查 ======
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    tokens: tokenStats,
    rateLimited: rateMap.size,
    memory: process.memoryUsage().rss / 1024 / 1024,
  });
});

// ====== 静态文件（Vite build 输出） ======
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ====== 启动 ======
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 procurement-insights API Proxy 启动`);
  console.log(`   端口: ${PORT}`);
  console.log(`   速率限制: ${RATE_LIMIT}次/IP/小时`);
  console.log(`   API Key 已隐藏（仅服务端）\n`);
});

// ====== 框架维度定义（复制自 framework.js） ======
function getFrameworkDims() {
  return [
    { id:'definition',title:'品类定义与产品构成',fields:[{key:'definition',label:'品类定义与范围',type:'text'},{key:'subCategories',label:'子类目与细分规格',type:'tags'},{key:'productComposition',label:'产品物理构成拆解',type:'table',columns:['构成部件','材质','规格参数','功能说明','占重量比']},{key:'specMatrix',label:'规格矩阵与SKU体系',type:'table',columns:['规格维度','常见取值','区分逻辑','采购影响']},{key:'boundaries',label:'与相邻品类边界',type:'text'},{key:'classification',label:'行业分类/HS编码/税则',type:'keyvalue'},{key:'substitutionMap',label:'品类内部替代关系',type:'table',columns:['原品种','替代品种','替代场景','成本差异','性能差异']},{key:'keySpecs',label:'采购关键技术参数',type:'table',columns:['参数项','行业标准','高端范围','低端范围','检测方法']}]},
    { id:'market',title:'市场规模与供需格局',fields:[{key:'marketSize',label:'市场规模与增速',type:'keyvalue'},{key:'segmentBreakdown',label:'细分品类规模',type:'table',columns:['细分品类','市场规模(亿元)','占比','增速','利润率']},{key:'importExport',label:'进出口贸易数据',type:'table',columns:['品类','进口量(万吨)','出口量(万吨)','主要来源国','关税税率']},{key:'priceBand',label:'价格带分布',type:'table',columns:['价格带','占比','代表品牌/产品','渠道特征','毛利率']},{key:'lifecycle',label:'生命周期阶段',type:'tags'},{key:'seasonality',label:'季节性与周期性',type:'text'},{key:'supplyDemand',label:'供需平衡状态',type:'text'},{key:'drivers',label:'核心需求驱动因子',type:'list'},{key:'trends',label:'3-5年趋势预判',type:'list'}]},
    { id:'supplyChain',title:'产业链全景与价值分配',fields:[{key:'upstream',label:'上游原材料供应',type:'table',columns:['原材料','主要产地/来源','供应商集中度','价格波动率','采购策略建议']},{key:'midstream',label:'中游制造环节',type:'table',columns:['制造环节','核心企业','产能(万吨/年)','毛利率','进入壁垒']},{key:'downstream',label:'下游渠道结构',type:'table',columns:['渠道类型','占比','加价率','账期','渠道特征']},{key:'valueDistribution',label:'各环节价值占比与利润分配',type:'text'},{key:'profitPool',label:'产业链利润池分析',type:'table',columns:['环节','收入占比','利润占比','利润率','利润趋势']},{key:'bottleneck',label:'产业链瓶颈与痛点',type:'list'},{key:'keyNodes',label:'关键节点企业画像',type:'table',columns:['企业','环节位置','控制力','议价能力','合作策略']},{key:'chainRisks',label:'产业链断裂风险点',type:'list'}]},
    { id:'competition',title:'供应市场竞争格局与供应商画像',fields:[{key:'concentration',label:'市场集中度指标',type:'keyvalue'},{key:'competitionType',label:'竞争类型与格局',type:'tags'},{key:'topPlayers',label:'头部供应商深度画像',type:'table',columns:['企业','市场份额','产能','核心优势','主要基地','财务健康度']},{key:'supplierMatrix',label:'供应商能力矩阵',type:'table',columns:['供应商','技术能力','成本竞争力','交期可靠性','质量稳定性','合作推荐度']},{key:'capacity',label:'产能分布与利用率',type:'text'},{key:'capacityDetail',label:'主要产能明细',type:'table',columns:['企业','基地','产能(万吨)','利用率','投产年份','技术路线']},{key:'techComparison',label:'技术路线对比',type:'table',columns:['技术路线','代表企业','成本水平','质量水平','适用场景']},{key:'entryBarriers',label:'进入壁垒分析',type:'list'},{key:'mergerTrend',label:'并购整合趋势',type:'text'}]},
    { id:'cost',title:'成本拆解·第一性原理分析与优化',fields:[{key:'bomBreakdown',label:'BOM逐层拆解',type:'table',columns:['层级','成本项','子项构成','占比','绝对值(元/吨)','价格驱动因子']},{key:'costStructure',label:'成本结构总览',type:'table',columns:['成本项','占比','绝对值','变动/固定','可控性','优化难度']},{key:'firstPrinciple',label:'第一性原理成本分析',type:'table',columns:['成本项','构成逻辑','合理性判断','对标行业','优化空间']},{key:'priceDrivers',label:'核心价格驱动因子与敏感性',type:'table',columns:['驱动因子','影响权重','波动范围','传导滞后','监控指标/数据源']},{key:'priceLinkage',label:'价格联动机制',type:'formula'},{key:'costOptimization',label:'成本优化建议矩阵',type:'table',columns:['优化措施','节省幅度','实施难度','投资回报','优先级','实施周期']},{key:'priceTrend',label:'历史价格走势与预测',type:'text'},{key:'tcoModel',label:'TCO总拥有成本模型',type:'keyvalue'},{key:'shouldCost',label:'Should-Cost目标价测算',type:'table',columns:['成本项','当前价格','Should-Cost','差距','达成路径']}]},
    { id:'technology',title:'技术壁垒·工艺路线与设备投资',fields:[{key:'coreProcess',label:'核心工艺流程详解',type:'table',columns:['工序','工艺说明','关键参数','设备类型','单线投资','良率影响']},{key:'techBarriers',label:'技术壁垒与门槛',type:'table',columns:['壁垒类型','具体描述','门槛高度','突破路径','时间周期']},{key:'processParams',label:'关键工艺参数范围',type:'table',columns:['参数项','标准范围','高端控制范围','偏离影响','检测频次']},{key:'equipment',label:'核心设备投资明细',type:'table',columns:['设备','品牌/来源','单台投资','产能','国产化率','替代方案']},{key:'patents',label:'专利与知识产权壁垒',type:'text'},{key:'yieldFactors',label:'良率影响因素',type:'table',columns:['因素','影响程度','控制手段','行业最佳水平','改善路径']},{key:'processTrend',label:'工艺演进趋势',type:'list'},{key:'techRoadmap',label:'技术路线图与迭代方向',type:'text'}]},
    { id:'quality',title:'质量标准·验收与管控体系',fields:[{key:'standards',label:'国家/行业标准体系',type:'table',columns:['标准编号','标准名称','关键要求','适用范围','最新版本']},{key:'certifications',label:'准入认证要求',type:'tags'},{key:'qualityKPIs',label:'关键质量指标与验收标准',type:'table',columns:['指标','国标要求','企业内控标准','检测方法','检测成本','不合格处理']},{key:'defectAnalysis',label:'常见不合格项与根因',type:'table',columns:['缺陷类型','发生频率','根因分析','影响程度','预防措施','行业标杆水平']},{key:'qualityRisks',label:'质量风险清单',type:'list'},{key:'inspectionProtocol',label:'验货与抽检方案',type:'keyvalue'},{key:'traceability',label:'溯源体系建设',type:'text'},{key:'qualityCost',label:'质量成本分析',type:'table',columns:['质量成本项','占比','行业标杆','优化方向']}]},
    { id:'sourcing',title:'寻源地图·供应商筛选与谈判',fields:[{key:'clusters',label:'产业集群与区位优势',type:'table',columns:['产业集群','区位优势','代表企业','物流成本','政策优惠','推荐指数']},{key:'supplierPool',label:'候选供应商池',type:'table',columns:['供应商','所在地','产能','主要客户','认证情况','合作意愿']},{key:'leadTime',label:'开发周期与交期体系',type:'keyvalue'},{key:'moq',label:'MOQ与阶梯报价',type:'table',columns:['订购量','MOQ','单价','折扣率','交期','付款条件']},{key:'quoteStructure',label:'报价结构拆解与对比',type:'table',columns:['报价项','供应商A','供应商B','供应商C','行业基准','差异分析']},{key:'negotiationLever',label:'谈判筹码与杠杆分析',type:'table',columns:['谈判维度','我方优势','供应商痛点','可争取条件','风险点']},{key:'switchingCost',label:'供应商切换成本',type:'table',columns:['成本项','金额估算','时间成本','风险等级','降低策略']},{key:'sourcingTips',label:'寻源实操建议',type:'list'},{key:'newSupplier',label:'新供应商开发路径',type:'text'}]},
    { id:'risk',title:'风险矩阵·预警与对冲',fields:[{key:'riskMatrix',label:'风险等级总览',type:'table',columns:['风险项','发生概率','影响程度','风险等级','量化影响(万元)','应对措施']},{key:'supplyRisk',label:'供应中断风险',type:'text'},{key:'priceRisk',label:'价格波动风险',type:'text'},{key:'policyRisk',label:'政策与合规风险',type:'text'},{key:'substitutionRisk',label:'替代品威胁',type:'text'},{key:'earlyWarning',label:'预警指标体系',type:'table',columns:['预警指标','正常区间','预警阈值','数据来源','监测频次','触发动作']},{key:'hedging',label:'风险对冲方案',type:'table',columns:['风险类型','对冲工具','成本','效果','实施条件']},{key:'blackSwan',label:'黑天鹅场景与应急预案',type:'list'}]},
    { id:'strategy',title:'采购策略·TCO与降本路径',fields:[{key:'sourcingMode',label:'寻源模式建议',type:'text'},{key:'contractStrategy',label:'合同与定价策略',type:'table',columns:['品类特征','推荐合同模式','定价机制','期限','调价触发条件']},{key:'supplierManagement',label:'供应商分级管理',type:'table',columns:['等级','标准','数量建议','管理策略','绩效指标','评审频次']},{key:'costReduction',label:'降本路径与量化目标',type:'table',columns:['降本措施','节省比例','节省金额(万元)','实施难度','时间节点','负责人']},{key:'tcoOptimization',label:'TCO优化方向',type:'table',columns:['TCO维度','当前水平','优化目标','优化手段','预期收益']},{key:'inventoryStrategy',label:'库存策略',type:'keyvalue'},{key:'digitalization',label:'数字化与智能化建议',type:'list'},{key:'actionPlan',label:'90天行动计划',type:'table',columns:['时间','行动项','交付物','负责人','验证指标']},{key:'kpi',label:'采购绩效指标体系',type:'table',columns:['KPI','定义','当前值','目标值','考核频次']}]},
    { id:'futures',title:'期货价格·历史走势与采购时机',fields:[{key:'futuresSnapshot',label:'最新期货价格快照',type:'table',columns:['品种','交易所','合约','最新价','涨跌幅','持仓量','数据日期']},{key:'priceHistory',label:'历史价格走势（24个月）',type:'chart'},{key:'priceSpread',label:'品种间价差与套利分析',type:'table',columns:['价差组合','当前价差','历史均值','历史极值','价差含义','交易建议']},{key:'seasonalPattern',label:'季节性价格规律',type:'table',columns:['月份','价格倾向','驱动因素','历史涨跌概率','采购建议']},{key:'priceForecast',label:'价格预测与趋势判断',type:'text'},{key:'procurementTiming',label:'采购时机建议',type:'text'},{key:'hedgingStrategy',label:'套保策略建议',type:'table',columns:['套保工具','覆盖比例','建仓价位','止损位','预期效果','资金成本']},{key:'keyIndicators',label:'核心监控指标看板',type:'table',columns:['指标','当前值','预警阈值','趋势','数据来源','更新频次']}]},
    { id:'financials',title:'相关企业财报·财务健康度与投资建议',fields:[{key:'financialOverview',label:'头部企业财务概览',type:'table',columns:['企业','营收(亿元)','净利润(亿元)','毛利率','净利率','ROE','资产负债率','数据年份']},{key:'revenueBreakdown',label:'营收结构拆解',type:'table',columns:['企业','业务板块','营收占比','毛利率','增速','战略地位']},{key:'profitabilityTrend',label:'盈利能力变化趋势',type:'table',columns:['企业','2023年毛利率','2024年毛利率','2025年毛利率','变化趋势','驱动因素']},{key:'financialHealth',label:'财务健康度评估',type:'table',columns:['企业','流动比率','速动比率','存货周转天数','应收账款周转天数','经营性现金流(亿元)','健康评级']},{key:'capacityInvestment',label:'产能投资与资本支出',type:'table',columns:['企业','资本支出(亿元)','新建产能','投产时间','投资回报预期','对供应格局影响']},{key:'profitabilityAnalysis',label:'盈利能力深度分析',type:'text'},{key:'riskAlerts',label:'财务风险预警',type:'list'},{key:'investmentSuggestions',label:'基于财报的合作与投资建议',type:'list'}]},
  ];
}
