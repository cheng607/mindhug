# MindHug 心语陪伴

基于 React + FastAPI 的 AI 心理健康陪伴平台，支持多 Agent 编排、情绪分析、知识库 RAG 与管理后台。

## 功能概览

- **用户端**：AI 咨询对话、情绪日记、知识库、个人中心
- **管理端**：数据仪表盘、咨询记录、风险预警、Agent 配置、RAG 管理
- **AI 能力**：轻量多 Agent 编排（倾听/咨询/危机/知识）、流式 SSE、情绪分析
- **产品化**：用户协议、危机干预、接口限流、日志脱敏、Docker 一键部署

## 快速启动

### 开发环境（推荐）

```bash
# 1. 启动 PostgreSQL + Redis + 后端
docker compose -f docker-compose.dev.yml up -d

# 2. 验证后端
curl http://localhost:8000/health

# 3. 启动前端
npm install
npm run dev
```

- 前端：http://localhost:5173
- 后端 API 文档：http://localhost:8000/docs

### 生产部署

```bash
cp .env.production.example .env
# 编辑 .env，设置 POSTGRES_PASSWORD、JWT_SECRET_KEY 等
docker compose up -d --build
```

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 环境变量

### 前端（`.env.development`）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 前缀 | `/api` |
| `VITE_API_PROXY_TARGET` | Vite 代理目标 | `http://localhost:8000` |
| `VITE_FILE_BASE_URL` | 静态资源地址 | `http://localhost:8000` |

### 后端（`backend/.env`）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET_KEY` | JWT 签名密钥 |
| `LLM_PROVIDER` | `mock` / `deepseek` / `openai` / `qwen` |
| `RATE_LIMIT_ENABLED` | 是否启用接口限流 |

完整配置见 `backend/.env.example`

## 测试

```bash
# 前端
npm run lint
npm run build

# 后端
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v

# 可选：真实 LLM 集成测试（需 API Key，默认跳过）
# LLM_PROVIDER=deepseek LLM_API_KEY=sk-xxx pytest tests/test_llm_optional.py -v -m llm
```

CI 工作流：`.github/workflows/ci.yml`（push/PR 自动运行 lint + build + test）

## 项目结构

```
mindHug/
├── src/                    # React 前端
│   ├── components/         # 业务组件（chat/、common/）
│   ├── pages/              # 页面（含协议/隐私/免责声明）
│   ├── hooks/              # useChatStream 等
│   └── apis/               # API 封装
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── agents/         # 多 Agent 编排
│   │   ├── api/            # 路由
│   │   ├── core/           # 配置、限流、脱敏、危机资源
│   │   └── services/       # 业务逻辑
│   └── tests/              # API 集成测试
├── nginx/                  # 生产 Nginx 配置
├── docker-compose.yml      # 生产部署
├── docker-compose.dev.yml  # 开发环境
└── docs/                   # 项目文档
```

## 安全与合规

- **用户协议 / 隐私政策 / AI 免责声明**：注册时需勾选同意，页脚可访问
- **危机干预**：检测到危机信号自动弹出求助弹窗，固定热线 400-161-9995
- **接口限流**：登录/注册/流式接口更严格限流，防滥用
- **日志脱敏**：自动脱敏手机号、邮箱、Token 等敏感信息

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite + Ant Design 6 + Zustand |
| 后端 | Python 3.11 + FastAPI + SQLAlchemy 2.0 |
| 数据库 | PostgreSQL 15 + pgvector（RAG 向量检索，SQLite 测试回退内存检索） |
| 缓存 | Redis 7 |
| AI | 轻量多 Agent 编排 + SSE 流式 |
| 部署 | Docker Compose + Nginx |

## 文档

- [项目规划](docs/PROJECT_PLAN.md)
- [部署指南](docs/DEPLOYMENT.md)
- [API 契约](docs/API_CONTRACT.md)

## 贡献

1. Fork → 新分支 → 提交 PR
2. 提交前运行 `npm run lint && npm run build` 和 `pytest tests/ -v`
3. 说明修改内容与验证步骤
