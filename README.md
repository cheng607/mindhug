# MindHug 心语陪伴

基于 React + FastAPI 的 AI 心理健康陪伴平台，支持多 Agent 编排、情绪分析、知识库 RAG 与管理后台。

## 功能概览

- **用户端**：AI 咨询对话、情绪日记、知识库、个人中心
- **管理端**：数据仪表盘、咨询记录、风险预警、Agent 配置、RAG 管理
- **AI 能力**：轻量多 Agent 编排（倾听/咨询/危机/知识）、流式 SSE、情绪分析
- **产品化**：用户协议、危机干预、接口限流、日志脱敏、Docker 一键部署

## 快速启动

项目由 **前端（Vite）** + **后端（FastAPI）** + **数据库（PostgreSQL，可选 Redis）** 组成。下面两种任选其一。

### 前置要求

| 工具 | 版本建议 | 用途 |
|------|----------|------|
| Node.js | 18+ | 前端 |
| Python | 3.11+ | 后端 |
| Docker Desktop | 最新 | 数据库 / 可选全栈（Windows 需先启动 Docker） |
| Git | — | 克隆代码 |

---

### 方式一：Docker 开发栈（推荐，最少配置）

适合：不想本机装 PostgreSQL，希望一条命令起后端 + 数据库。

```bash
# 在项目根目录 mindHug/

# 1. 首次：准备后端配置
cd backend
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
# 按需编辑 backend/.env（LLM_API_KEY 等）
cd ..

# 2. 启动 PostgreSQL + Redis + 后端（热重载）
docker compose -f docker-compose.dev.yml up -d

# 3. 验证后端
curl http://localhost:8000/health
# 应返回 {"status":"ok"}

# 4. 启动前端（新开一个终端，仍在项目根目录）
npm install
npm run dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |

**推荐端口**：本机开发固定使用 **8000（后端）+ 5173（前端）**。若 5173 被占用，Vite 会自动尝试 5174 等端口；E2E 测试默认使用 **5174 + 1235**。

所有 `docker compose` 命令须在 **项目根目录** `mindHug/` 下执行，不要在 `backend/` 子目录运行生产 compose。

前端通过 `.env.development` 把 `/api` 代理到 `http://localhost:8000`，**无需改前端配置**。

---

### 方式二：本机手动运行（灵活，改代码/LLM 最方便）

适合：不用 Docker 跑后端，或只用 Docker 起数据库。

#### 步骤 1：数据库（二选一）

**A. Docker 只起数据库（推荐）**

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis
```

**B. 轻量本地调试（SQLite，无需 Docker）**

编辑 `backend/.env`：

```env
DATABASE_URL=sqlite:///./mindhug.db
RATE_LIMIT_ENABLED=false
RATE_LIMIT_USE_REDIS=false
```

#### 步骤 2：后端

```bash
cd backend

# 首次：虚拟环境 + 依赖
python -m venv .venv
.venv\Scripts\activate          # Windows PowerShell
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# 首次：复制配置
copy .env.example .env          # Windows
# cp .env.example .env

# 启动（--reload：改 Python 代码自动重载）
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 步骤 3：前端（新开终端，项目根目录）

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。

---

## 日常操作：停止 / 重启

### 重启后端（改完 `backend/.env` 或 LLM 配置后必做）

`.env` 只在进程启动时读取，**改 API Key 后必须重启后端**才会生效。

#### Docker 方式

```bash
# 在项目根目录
docker compose -f docker-compose.dev.yml restart backend

# 若改了 Dockerfile 或 requirements.txt，需重建：
docker compose -f docker-compose.dev.yml up -d --build backend
```

#### 本机 uvicorn 方式

1. 在运行后端的终端按 **`Ctrl + C`** 停止  
2. 再次启动：

```bash
cd backend
.venv\Scripts\activate          # Windows（若使用虚拟环境）
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> 使用 `--reload` 时，**仅改 `.py` 代码**会自动重载；**改 `.env` 不会自动重载**，仍需手动 Ctrl+C 后重启。

### 重启前端

1. 前端终端 **`Ctrl + C`**
2. `npm run dev`

改 `.env.development` 后也需要重启前端。

### 停止整个项目

```bash
# 停止 Docker 栈（数据库 + 后端容器）
docker compose -f docker-compose.dev.yml down

# 前端、本机 uvicorn：各自终端 Ctrl + C
```

### 查看 Docker 服务状态

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f backend   # 看后端日志
```

---

## 启用真实 LLM（对话质量）

默认 `LLM_PROVIDER=mock` 为固定模板，**仅适合测试**。正式体验请配置 API Key：

1. 编辑 `backend/.env`：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-你的密钥
LLM_MODEL=deepseek-chat
```

2. **重启后端**（见上一节「重启后端」）

3. 新开对话测试；支持 `deepseek` / `openai` / `qwen`

---

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

---

## 生产部署

```bash
cp .env.production.example .env
# 编辑 .env，设置 POSTGRES_PASSWORD、JWT_SECRET_KEY 等
docker compose up -d --build
```

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### 创建管理员账号

首次部署后执行（Docker 生产栈）：

```bash
docker compose exec backend python scripts/create_admin.py
```

默认账号（可通过环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` 覆盖）：

| 字段 | 默认值 |
|------|--------|
| 用户名 | `admin` |
| 密码 | `admin123456` |
| 邮箱 | `admin@mindhug.local` |

登录页 `/auth`，管理员会自动进入 `/back/dashboard`。**生产环境请立即修改密码。**

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 前端能开但接口 404/502 | 确认后端已启动；`.env.development` 里 `VITE_API_PROXY_TARGET` 指向 `http://localhost:8000` |
| 改了 LLM Key 对话仍像机器人 | 改的是 `backend/.env`，需 **重启后端**（见上文） |
| Docker 启动失败 | 确认 Docker Desktop 已运行；端口 5432/8000 未被占用 |
| Windows `curl` 不可用 | 浏览器访问 http://localhost:8000/health 或 `Invoke-WebRequest http://localhost:8000/health` |
| pytest 429 | 测试环境在 `backend/tests/conftest.py` 已关闭限流；本地跑测试无需额外配置 |

---

## 测试

```bash
# 前端
npm run lint
npm run test
npm run build

# 后端
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v

# 可选：真实 LLM 集成测试（需 API Key，默认跳过）
# LLM_PROVIDER=deepseek LLM_API_KEY=sk-xxx pytest tests/test_llm_optional.py -v -m llm

# 浏览器联调 Checklist（Playwright，需前后端已启动）
# 终端1: cd backend && uvicorn app.main:app --port 1235
# 终端2: VITE_API_PROXY_TARGET=http://127.0.0.1:1235 npm run dev -- --port 5174
# node e2e/browser-checklist.mjs
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
