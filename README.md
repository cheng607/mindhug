# 心语陪伴

基于 React + TypeScript + Vite 的心理咨询与情绪分析前端项目。

- React 19 / TypeScript
- Vite 构建与热更新
- Ant Design 6 UI
- Zustand 状态管理
- Axios + 统一拦截处理
- React Router v7 路由

## 1. 项目概述

MindHug 目标是搭建完整的心理健康服务平台：
- 普通用户：咨询对话、情绪日记、知识库、文章阅读。
- 管理员：后台管理、数据统计、用户咨询记录、情感分析。

主要功能
- 用户注册、登录、会话状态管理
- 角色鉴权与重定向（前台/后台）
- 聊天会话管理、历史会话、实时流式回复
- 情绪分析与统计图表展示
- 文章与知识库管理

## 2. 快速启动

### 2.1 全栈本地开发（推荐）

**前置条件**：Docker Desktop 已启动

```bash
# 1. 启动 PostgreSQL + Redis + 后端
docker compose -f docker-compose.dev.yml up -d

# 2. 验证后端
curl http://localhost:8000/health

# 3. 启动前端
npm install
npm run dev
```

前端默认地址：http://localhost:5173  
后端 API 文档：http://localhost:8000/docs

### 2.2 仅前端开发

```bash
git clone <repo-url> mindHug
cd mindHug
npm install
npm run dev
```

前端通过 Vite 代理将 `/api` 转发到 `VITE_API_PROXY_TARGET`（默认 `http://localhost:8000`）。

### 2.3 仅后端开发

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2.4 环境变量

复制 `.env.example` 为 `.env.development`（前端）或 `backend/.env`（后端）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 前端 API 前缀 | `/api` |
| `VITE_API_PROXY_TARGET` | Vite 开发代理目标 | `http://localhost:8000` |
| `VITE_FILE_BASE_URL` | 静态资源地址 | `http://localhost:8000` |
| `DATABASE_URL` | PostgreSQL 连接串 | 见 `backend/.env.example` |

构建
```bash
npm run build
npm run preview
```

代码检查
```bash
npm run lint
```

### 2.5 后端测试

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/test_sprint1_api.py -v
```

## 3. 目录结构

- `src/App.tsx`：入口，登录态与路由级重定向
- `src/router/index.tsx`：路由定义
- `src/router/RouteGuards.tsx`：路由权限守卫
- `src/pages`：页面容器（`Auth`, `Home`, `BackLayout`, `NotFound`）
- `src/components`：业务组件（更多详细见下）
- `src/apis`：请求接口层封装
- `src/store/userStore.ts`：Zustand 用户状态管理
- `src/utils/request.ts`：Axios 拦截与统一异常处理
- `src/config/index.ts`：静态配置

## 4. 核心功能说明

### 4.1 用户认证

- 登录 `/auth/login`
- 注册 `/auth/register`
- `localStorage` 保存 `token`, `userInfo`, `roleType`
- 401 自动清空登录并跳转登录页

### 4.2 路由与权限控制

- `/`：默认首页
- `/user`：普通用户进入前台
- `/back/*`：仅管理员（`roleType==='2'`）可访问

`RouteGuards`:
- `RequireAuth` 认证 + 角色权限
- `RedirectIfAuth` 登录后重定向避免访问登录页
- `RedirectAdminToBack` 管理员默认进入后台

### 4.3 前台模块

- `/consultation`：咨询对话（`Consultation`）
- `/diary`：情绪日记（`Diary`）
- `/knowledgeBase`：知识库 + 文章（`KnowledgeBase`）
- `/article/:id`：文章详情（`Article`, `ArticleDialog`）

### 4.4 后台模块（管理员）

- `/back/dashboard`：仪表盘（`DashBoard`）
- `/back/Knowledge`：知识管理（`Knowledge`）
- `/back/consultations`：咨询记录（`Consultations`）
- `/back/emotional`：情绪分析（`Emotional`）

### 4.5 数据接口（src/apis）

- `user.ts`：登录、注册、用户信息
- `sessions.ts`：会话列表、创建、详情、删除、流式聊天、分析结果
- `emotion.ts`：情绪标签
- `analydata.ts`：统计分析
- `article.ts`：文章列表、详情
- `other.ts`：工具通用接口

## 5. 配置说明

### 5.1 src/config/index.ts

- `apiBaseUrl`：API 前缀，来自 `VITE_API_BASE_URL`（默认 `/api`）
- `fileBaseUrl`：静态资源地址，来自 `VITE_FILE_BASE_URL`

### 5.2 src/utils/request.ts

- `baseURL` 默认 `/api`
- 自动注入 `token` 到请求头
- 统一错误处理：`code !== '200'` 当失败；`401` 触发退出

## 6. 运行环境与依赖

依赖：
- react, react-dom, react-router-dom, axios, zustand, antd, echarts, react-markdown

开发依赖：
- vite, typescript, eslint, tailwindcss, postcss

## 7. 建议优化

- 补充 E2E 测试
- 设计组件拆分，避免冗长组件
- 规范 API 类型（`ApiResponse<T>` 等）
- 加 `error boundary` 及全局 loading 组件
- 增加 CI/CD (GitHub Actions, lint + test + build)

## 8. 贡献指南

1. Fork -> 新分支 -> Feature -> PR
2. 遵循代码格式，提交前 `npm run lint` 与 `npm run build`
3. 说明修改内容与验证步骤
