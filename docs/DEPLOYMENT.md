# MindHug 部署文档

> Sprint 8 产品化部署指南

## 一、部署方式概览

| 方式 | 适用场景 | 命令 |
|------|----------|------|
| 开发环境 | 本地开发联调 | `docker compose -f docker-compose.dev.yml up -d` |
| 生产环境 | 一键部署全栈 | `docker compose up -d` |

## 二、生产环境部署

### 2.1 前置条件

- Docker 20.10+ 与 Docker Compose v2
- 至少 2GB 可用内存
- 如需真实 AI 对话，准备 LLM API Key（DeepSeek / 通义千问 / OpenAI）

### 2.2 配置环境变量

```bash
cp .env.production.example .env
```

编辑 `.env`，**必须修改**以下项：

| 变量 | 说明 |
|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 |
| `JWT_SECRET_KEY` | JWT 签名密钥（建议 32+ 位随机字符串） |
| `CORS_ORIGINS` | 前端访问域名，JSON 数组格式 |
| `LLM_PROVIDER` / `LLM_API_KEY` | 可选，启用真实 LLM |

### 2.3 启动服务

**发布前建议先校验 Compose 配置：**

```bash
docker compose config   # 校验语法，不启动容器
docker compose up -d --build
```

服务启动后：

- 前端：http://localhost（或 `HTTP_PORT` 指定端口）
- 后端健康检查：http://localhost/health
- API 文档（需直连后端容器或配置代理）：http://backend:8000/docs

### 2.4 服务架构

```
用户浏览器
    │
    ▼
Nginx (frontend:80)
    ├── /          → React 静态文件
    ├── /api/*     → backend:8000
    └── /uploads/* → backend:8000
         │
         ├── PostgreSQL (pgvector，迁移 `alembic upgrade head` 启用向量列)
         └── Redis
```

### 2.5 数据持久化

Docker volumes 自动创建：

- `postgres_data`：数据库
- `redis_data`：缓存
- `uploads_data`：上传文件

## 三、开发环境

```bash
# 启动 PG + Redis + 后端（热重载）
docker compose -f docker-compose.dev.yml up -d

# 前端
npm install && npm run dev
```

## 四、安全与合规

### 4.1 接口限流

默认启用，可在 `backend/.env` 配置：

```
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=120      # 普通接口每分钟
RATE_LIMIT_STRICT=20        # 登录/注册/流式接口每分钟
RATE_LIMIT_WINDOW_SECONDS=60
```

### 4.2 日志脱敏

后端启动时自动配置，脱敏手机号、邮箱、Token 等敏感信息。

### 4.3 危机干预

- 后端统一危机资源：`backend/app/core/crisis.py`
- 前端危机弹窗：检测到危机 Agent 或 riskLevel ≥ 3 时自动弹出
- 心理援助热线：**400-161-9995**

## 五、CI/CD

GitHub Actions 工作流 `.github/workflows/ci.yml`：

- 前端：lint + build
- 后端：pytest 全量测试

本地运行测试：

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v
```

## 六、常见问题

### 数据库连接失败

确认 `postgres` 容器健康：`docker compose ps`

### 前端 API 404

检查 Nginx 代理配置 `nginx/nginx.conf`，确认 `backend` 服务名可解析。

### CORS 错误

生产环境需在 `.env` 中设置 `CORS_ORIGINS` 包含前端实际访问地址。

### LLM 不响应

默认 `LLM_PROVIDER=mock`，无需 API Key。启用真实 LLM 时配置 `LLM_API_KEY` 并重启 backend。

## 七、升级与备份

```bash
# 备份数据库
docker compose exec postgres pg_dump -U mindhug mindhug > backup.sql

# 拉取新代码后重建
docker compose down
git pull
docker compose up -d --build
```
