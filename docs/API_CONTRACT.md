# MindHug API 接口对照表

> 版本：v1.0  
> 更新日期：2026-09-01  
> 权威来源：前端 `src/apis/` 与 `src/types/`

---

## 统一约定

### 基础路径

| 环境 | 前端 baseURL | 后端实际路径 |
|------|-------------|-------------|
| 开发 | `/api`（Vite 代理 → `localhost:8000`） | `/api/*` |
| 生产 | `/api` 或 `VITE_API_BASE_URL` | 同左 |

### 统一响应格式

```typescript
interface ApiResponse<T = unknown> {
  code: string;      // '200' 表示成功，'401' 表示未授权
  data: T;
  msg?: string;
  success: boolean;
}
```

### 认证方式

请求头携带 JWT：

```
token: <jwt_token>
```

---

## Sprint 1 已实现

| 模块 | 方法 | 路径 | 认证 | 状态 | 说明 |
|------|------|------|------|------|------|
| 用户 | POST | `/api/user/login` | 否 | ✅ 已实现 | 用户名或邮箱登录 |
| 用户 | POST | `/api/user/add` | 否 | ✅ 已实现 | 用户注册 |
| 用户 | POST | `/api/user/logout` | 是 | ✅ 已实现 | 退出登录 |

### POST `/api/user/login`

**请求体**（`LoginParams`）：

```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应 data**（`LoginResponse`）：

```json
{
  "userInfo": { /* UserInfoType */ },
  "token": "eyJ...",
  "roleType": "1"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| roleType | string | `"1"` 普通用户 → 跳转 `/`；`"2"` 管理员 → 跳转 `/back` |

### POST `/api/user/add`

**请求体**（`RegisterParams`）：

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "confirmPassword": "123456",
  "nickname": "测试用户",
  "phone": "",
  "gender": 1,
  "userType": 1
}
```

**响应 data**：`UserInfoType`

### POST `/api/user/logout`

**响应 data**：`"退出成功"`

### UserInfoType 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户 ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| nickname | string | 昵称 |
| avatar | string | 头像路径 |
| phone | string | 手机号 |
| gender | number | 1=男，2=女 |
| genderDisplayName | string | 性别显示名 |
| birthday | string | 生日 ISO 格式 |
| userType | number | 1=普通用户，2=管理员 |
| userTypeDisplayName | string | 角色显示名 |
| status | number | 1=正常，0=禁用 |
| statusDisplayName | string | 状态显示名 |
| displayName | string | 展示名（昵称优先） |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

---

## Sprint 2+ 待实现

### 会话模块（Sprint 2）

| 方法 | 路径 | 认证 | 前端文件 | 响应类型 |
|------|------|------|---------|---------|
| GET | `/api/psychological-chat/sessions` | 是 | `sessions.ts` | `sessionData` / `sessionListType` |
| POST | `/api/psychological-chat/session/start` | 是 | `sessions.ts` | `newChatResponseType` |
| GET | `/api/psychological-chat/sessions/{id}/messages` | 是 | `sessions.ts` | `sessionDetailType[]` |
| DELETE | `/api/psychological-chat/sessions/{id}` | 是 | `sessions.ts` | `null` |
| POST | `/api/psychological-chat/stream` | 是 | `sessions.ts` | SSE 流式 |
| GET | `/api/psychological-chat/session/{id}/emotion` | 是 | `sessions.ts` | `emotionAnalysType` |

> 注意：前端 `streamChat` 调用路径为 `/api/psychological-chat/stream`（含双重 `/api` 前缀），Sprint 2 需统一修正。

### 情绪日记（Sprint 3）

| 方法 | 路径 | 认证 | 前端文件 | 响应类型 |
|------|------|------|---------|---------|
| POST | `/api/emotion-diary` | 是 | `emotion.ts` | - |
| GET | `/api/emotion-diary/admin/page` | 是 | `emotion.ts` | `diaryData` |
| DELETE | `/api/emotion-diary/admin/{id}` | 是 | `emotion.ts` | - |

### 知识库（Sprint 3）

| 方法 | 路径 | 认证 | 前端文件 | 响应类型 |
|------|------|------|---------|---------|
| GET | `/api/knowledge/category/tree` | 否/是 | `article.ts` | `categoryType[]` |
| GET | `/api/knowledge/article/page` | 否/是 | `article.ts` | `articleData` |
| POST | `/api/knowledge/article` | 是 | `article.ts` | - |
| GET | `/api/knowledge/article/{id}` | 否/是 | `article.ts` | `articleType` |
| PUT | `/api/knowledge/article/{id}` | 是 | `article.ts` | - |
| PUT | `/api/knowledge/article/{id}/status` | 是 | `article.ts` | - |
| DELETE | `/api/knowledge/article/{id}` | 是 | `article.ts` | - |

### 数据统计（Sprint 3）

| 方法 | 路径 | 认证 | 前端文件 | 响应类型 |
|------|------|------|---------|---------|
| GET | `/api/data-analytics/overview` | 是 | `analydata.ts` | `analyticsDataType` |

### 文件上传（Sprint 3）

| 方法 | 路径 | 认证 | 前端文件 | 响应类型 |
|------|------|------|---------|---------|
| POST | `/api/file/upload` | 是 | `other.ts` | `uploadResponseType` |

**请求**：`multipart/form-data`

| 字段 | 说明 |
|------|------|
| file | 文件 |
| businessType | 业务类型，如 `ARTICLE` |
| businessId | 业务 ID |
| businessField | 字段名，如 `cover` |

---

## 数据库模型对照（Sprint 1）

### roles 表

| 列 | 类型 | 说明 |
|----|------|------|
| id | int PK | 自增 |
| name | varchar(50) | `user` / `admin` |
| code | int | 1=普通用户，2=管理员（对应 roleType） |
| description | varchar(200) | 描述 |
| created_at | timestamptz | 创建时间 |

### users 表

| 列 | 类型 | 说明 |
|----|------|------|
| id | int PK | 自增 |
| username | varchar(50) UNIQUE | 用户名 |
| email | varchar(100) UNIQUE | 邮箱 |
| password_hash | varchar(255) | bcrypt 哈希 |
| nickname | varchar(50) | 昵称 |
| avatar | varchar(500) | 头像路径 |
| phone | varchar(20) | 手机号 |
| gender | int | 1=男，2=女 |
| birthday | date | 生日 |
| role_id | int FK → roles.id | 角色 |
| status | int | 1=正常，0=禁用 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

---

## 本地开发启动

```bash
# 1. 启动基础设施 + 后端
docker compose -f docker-compose.dev.yml up -d

# 2. 启动前端
npm install
npm run dev
```

后端健康检查：`GET http://localhost:8000/health`  
API 文档：`http://localhost:8000/docs`
