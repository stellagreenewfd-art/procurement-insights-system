# 采购品类洞察系统 · Procurement Insights

> 输入品类名称，一键生成标准化采购专业分析，帮助新人快速理解行业。

## 核心功能

- **输入品类名称** → AI 自动生成 10 维度采购分析报告
- **固定标准框架** → 所有品类统一使用 10 维度分析模型，确保一致性
- **DeepSeek 驱动** → 基于 DeepSeek API 实时生成结构化洞察
- **一键导出** → 支持导出 Markdown 格式报告

## 10 维度标准分析框架

| # | 维度 | 核心内容 |
|---|------|----------|
| 01 | 📋 品类定义与边界 | 品类范围、子类目、行业分类 |
| 02 | 📊 市场规模与趋势 | TAM/SAM、增长率、生命周期、季节性 |
| 03 | 🔗 产业链结构 | 上游原料→中游制造→下游渠道 |
| 04 | 🏭 供应市场竞争格局 | CR5、头部玩家、竞争类型 |
| 05 | 💰 成本结构拆解 | BOM、各成本项占比、价格驱动因子 |
| 06 | ⚙️ 技术壁垒与工艺路线 | 核心工艺、技术门槛、专利壁垒 |
| 07 | ✅ 质量标准体系 | 国标/行标、认证要求、关键KPI |
| 08 | 🗺️ 寻源地图与策略 | 产业集群、交期/MOQ、切换成本 |
| 09 | ⚠️ 风险矩阵 | 供应/价格/政策/替代品风险 |
| 10 | 🎯 采购策略建议 | 寻源模式、合同策略、降本路径 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key（可选，不配置可使用 Demo 模式）
cp .env.example .env.local
# 编辑 .env.local，填入 DeepSeek API Key

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:5173
```

## API Key 配置

1. 访问 [DeepSeek 平台](https://platform.deepseek.com/) 注册并获取 API Key
2. 在项目根目录创建 `.env.local` 文件
3. 添加内容：`VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx`
4. 重启开发服务器

> 未配置 API Key 时，可点击「查看示例数据」体验完整功能（预置食用油品类数据）。

## 技术栈

- **前端框架**: React 18 + Vite
- **样式**: Tailwind CSS（深色主题）
- **AI 引擎**: DeepSeek Chat API
- **输出格式**: 结构化 JSON → 可视化渲染 + Markdown 导出

## 项目结构

```
├── src/
│   ├── App.jsx              # 主应用
│   ├── components/
│   │   ├── SearchBar.jsx    # 搜索栏
│   │   ├── Sidebar.jsx      # 维度导航侧边栏
│   │   ├── DimensionCard.jsx # 维度内容卡片
│   │   └── LoadingState.jsx # 加载动画
│   ├── data/
│   │   ├── framework.js     # 10维度框架定义（核心）
│   │   └── mockData.js      # 示例数据（食用油）
│   ├── services/
│   │   └── api.js           # DeepSeek API 调用
│   └── utils/
│       └── export.js        # Markdown 导出
├── .env.example             # 环境变量模板
└── package.json
```

## 扩展框架

如需调整分析维度，编辑 `src/data/framework.js`：
- 添加/删除维度
- 调整字段类型（text/tags/list/table/keyvalue）
- 同步修改 `api.js` 中的 prompt 自动适配
