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

## Sprint 2 已实现

| 模块 | 方法 | 路径 | 认证 | 状态 | 说明 |
|------|------|------|------|------|------|
| 会话 | GET | `/api/psychological-chat/sessions` | 是 | ✅ 已实现 | 分页查询会话列表 |
| 会话 | POST | `/api/psychological-chat/session/start` | 是 | ✅ 已实现 | 创建新会话 |
| 会话 | GET | `/api/psychological-chat/sessions/{id}/messages` | 是 | ✅ 已实现 | 获取消息历史 |
| 会话 | DELETE | `/api/psychological-chat/sessions/{id}` | 是 | ✅ 已实现 | 删除会话 |
| 会话 | POST | `/api/psychological-chat/stream` | 是 | ✅ 已实现 | SSE 流式对话（mock） |
| 会话 | GET | `/api/psychological-chat/session/{id}/emotion` | 是 | ✅ 已实现 | 情绪分析（mock） |

### GET `/api/psychological-chat/sessions`

**Query 参数**（兼容两种命名）：

| 参数 | 类型 | 说明 |
|------|------|------|
| pageNum / currentPage | string | 页码，默认 1 |
| pageSize / size | string | 每页条数，默认 20 |
| emotionTag | string | 可选，按情绪标签筛选 |

**响应 data**（`sessionListType` / `sessionData`）：

```json
{
  "records": [
    {
      "id": 1,
      "sessionTitle": "新会话",
      "userId": 1,
      "userNickname": "测试用户",
      "startedAt": "2026-09-01T12:00:00+00:00",
      "lastMessageTime": "2026-09-01T12:05:00+00:00",
      "lastMessageContent": "你好",
      "messageCount": 2,
      "durationMinutes": 5
    }
  ],
  "total": 1,
  "size": 20,
  "current": 1,
  "pages": 1
}
```

### POST `/api/psychological-chat/session/start`

**请求体**（`newChatParam`）：

```json
{
  "sessionTitle": "新会话",
  "initialMessage": ""
}
```

**响应 data**（`newChatResponseType`）：

```json
{
  "sessionId": "1",
  "status": "ACTIVE",
  "startTime": 1756713600000,
  "expiryTime": 1757318400000,
  "initialMessage": "",
  "messageCount": 0,
  "userHash": 1
}
```

> `sessionId` 支持纯数字（`"1"`）或带前缀（`session_1`），情绪与流式接口均兼容。

### GET `/api/psychological-chat/sessions/{id}/messages`

**响应 data**：`sessionDetailType[]`

| 字段 | 类型 | 说明 |
|------|------|------|
| senderType | number | 1=用户，2=AI |
| messageType | number | 1=文本 |
| contentPreview | string | 内容前 50 字 |

### POST `/api/psychological-chat/stream`

**请求体**：

```json
{
  "sessionId": "1",
  "userMessage": "最近压力很大"
}
```

**响应**：`text/event-stream`，每行格式 `data: {...}`

```json
{"content": "我能感受到"}
```

结束标记：`data: [DONE]`

> Sprint 2 为 mock 流式回复，会自动持久化用户消息与 AI 回复。

### GET `/api/psychological-chat/session/{id}/emotion`

**响应 data**（`emotionAnalysType`）：基于最近用户消息的关键词 mock 分析。

---

## Sprint 3+ 待实现

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

### chat_sessions 表（Sprint 2）

| 列 | 类型 | 说明 |
|----|------|------|
| id | int PK | 自增 |
| user_id | int FK → users.id | 所属用户 |
| session_title | varchar(200) | 会话标题 |
| status | varchar(20) | ACTIVE 等 |
| emotion_tag | varchar(50) | 情绪标签（可选） |
| last_message_content | text | 最后一条消息 |
| last_message_time | timestamptz | 最后消息时间 |
| message_count | int | 消息总数 |
| started_at | timestamptz | 开始时间 |
| updated_at | timestamptz | 更新时间 |

### messages 表（Sprint 2）

| 列 | 类型 | 说明 |
|----|------|------|
| id | int PK | 自增 |
| session_id | int FK → chat_sessions.id | 所属会话 |
| content | text | 消息内容 |
| sender_type | int | 1=用户，2=AI |
| message_type | int | 1=文本 |
| created_at | timestamptz | 创建时间 |

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
