# Sprint 2 测试报告与问题修复清单

> 文档版本：v1.0  
> 更新日期：2026-09-01  
> 用途：供后续对话按优先级修复 Sprint 2 遗留问题

---

## 一、背景

Sprint 2（W3–W4）目标为会话核心功能：

- 数据库模型：`chat_sessions`、`messages`
- 会话 CRUD API（对齐前端 types）
- SSE 流式接口（mock 响应）
- 情绪分析接口（mock 响应）
- 前端 `Consultation.tsx` 对接新后端
- 消息历史加载验证

**当前分支**：`cursor/add-project-plan-doc`（Sprint 2 代码尚未 commit）

**依赖**：Sprint 1 已完成（JWT 认证、环境变量、Docker 配置）

---

## 二、测试环境与限制

| 项目 | 状态 |
|------|------|
| 后端 pytest（Sprint 1 + 2） | ✅ 20/20 通过 |
| 前端 `npm run build` | ✅ 构建成功 |
| 额外边界/安全测试 | ✅ 已手动执行（见第五节） |
| Docker Compose 全栈联调 | ❌ 未执行（Docker Desktop 未运行） |
| 浏览器 E2E 手动测试 | ❌ 未执行 |

**启动全栈环境命令**（修复后验证用）：

```bash
# 1. 启动基础设施 + 后端
docker compose -f docker-compose.dev.yml up -d

# 2. 数据库迁移（PostgreSQL）
cd backend && alembic upgrade head

# 3. 启动前端
npm install
npm run dev

# 4. 健康检查
curl http://localhost:8000/health
```

---

## 三、Sprint 2 交付物核对

| 任务项 | 状态 | 说明 |
|--------|------|------|
| `ChatSession` / `Message` 模型 | ✅ | `backend/app/models/` |
| Alembic 迁移 `002_chat_session_message.py` | ✅ | 已创建 |
| 会话列表 API | ✅ | `GET /api/psychological-chat/sessions` |
| 创建会话 API | ✅ | `POST /api/psychological-chat/session/start` |
| 消息历史 API | ✅ | `GET /api/psychological-chat/sessions/{id}/messages` |
| 删除会话 API | ✅ | `DELETE /api/psychological-chat/sessions/{id}` |
| SSE 流式对话（mock） | ✅ | `POST /api/psychological-chat/stream` |
| 情绪分析（mock） | ✅ | `GET /api/psychological-chat/session/{id}/emotion` |
| 前端 Consultation 对接 | ✅ | 流式路径已修正，首条消息不重复保存 |
| API 文档更新 | ✅ | `docs/API_CONTRACT.md` Sprint 2 章节 |
| 集成测试 | ✅ | `backend/tests/test_sprint2_api.py`（7 项） |

---

## 四、自动化测试结果

### 4.1 运行命令

```bash
cd backend
python -m pytest tests/test_sprint1_api.py tests/test_sprint2_api.py -v

cd ..
npm run build
```

### 4.2 Sprint 1 回归（11/11 通过）

| # | 测试项 | 结果 |
|---|--------|------|
| 1 | `GET /health` | ✅ |
| 2 | 用户注册 | ✅ |
| 3 | 重复用户名注册 → 400 | ✅ |
| 4 | 密码不一致 → 422 | ✅ |
| 5 | 注册忽略 admin userType | ✅ |
| 6 | 用户名登录 | ✅ |
| 7 | 邮箱登录 | ✅ |
| 8 | 错误密码 → 400 | ✅ |
| 9 | 无 Token 登出 → 401 | ✅ |
| 10 | 有 Token 登出 → 200 | ✅ |
| 11 | 登录响应字段完整性 | ✅ |

### 4.3 Sprint 2 会话 API（9/9 通过）

| # | 测试项 | 结果 |
|---|--------|------|
| 1 | 未登录访问会话列表 → 401 | ✅ |
| 2 | 创建会话 + 分页列表 | ✅ |
| 3 | 获取消息历史 | ✅ |
| 4 | 删除会话 | ✅ |
| 5 | SSE mock 流式 + 消息持久化（用户+AI 各 1 条） | ✅ |
| 6 | 情绪分析（`session_` 前缀 ID） | ✅ |
| 7 | 危机关键词情绪分析（riskLevel=3） | ✅ |
| 8 | 无效 session ID → 400 | ✅ |
| 9 | 流式请求不存在 session → 404 | ✅ |

### 4.4 前端构建

```
npm run build → ✅ 成功（tsc + vite build）
```

---

## 五、额外边界与安全测试（手动）

| 测试项 | 结果 | 说明 |
|--------|------|------|
| 用户 A 访问用户 B 的会话消息 | ✅ 404 | 权限隔离正常 |
| 无效 session ID（`abc`） | ✅ 400 | 返回「无效的会话 ID」 |
| 流式请求不存在的 session | ✅ 404 | HTTP 404，不再在 SSE 体内返回 error |

---

## 六、功能效果评估

| 模块 | API 层 | 前端层 | 备注 |
|------|--------|--------|------|
| 会话创建 | ✅ 正常 | ✅ 已对接 | 支持 `initialMessage` |
| 会话列表 | ✅ 正常 | ✅ 已对接 | 仅返回当前用户会话 |
| 消息历史 | ✅ 正常 | ✅ 已对接 | 点击历史会话可加载 |
| 删除会话 | ✅ 正常 | ✅ 已对接 | 级联删除 messages |
| SSE 流式对话 | ✅ mock 正常 | ✅ 已对接 | 分片合并逻辑保留 |
| 情绪花园 | ✅ mock 正常 | ✅ 已对接 | 支持危机/焦虑/平静三档 |
| 新建会话（+ 按钮） | ✅ API 正常 | ✅ 已修复 | 新建时清空聊天区与情绪花园 |
| 管理端咨询记录 | ⚠️ 仅当前用户 | ⚠️ 功能受限 | 无跨用户查询 API（Bug #8，Sprint 3） |
| 咨询页登录保护 | — | ✅ 已修复 | `/consultation` 已加 RequireAuth |

---

## 七、问题清单（按优先级）

### 🔴 P0 — 影响核心体验

#### Bug #1：点击「新建会话」后聊天区未清空

- **文件**：`src/components/Consultation.tsx`
- **位置**：`handleNew`（约第 340 行）、`createNewSession`（约第 130 行）
- **问题**：点击右上角 `+` 创建新会话后，`currentSession` 已更新为新会话，但 `chatList` 仍显示上一个会话的消息
- **现象**：用户在新会话里看到旧消息；发送新消息后 UI 新旧消息混在一起
- **修复方案**：

```tsx
const handleNew = async () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort()
    }
    setIsAiTyping(false)
    setChatList([])           // 新增：清空聊天区
    setCurrentEmotion(undefined)  // 建议：清空情绪花园
    await createNewSession()
    await getSessionsList()
}
```

---

#### Bug #2：SSE 流式错误时前端未处理 `error` 字段

- **文件**：`src/components/Consultation.tsx`
- **位置**：`sendMessageToAI` → `onmessage`（约第 175–205 行）
- **问题**：后端在会话不存在时通过 SSE 返回 `{"error": "会话不存在或无权访问"}`，前端只处理 `content` 字段
- **现象**：会话异常时 AI 气泡空白，用户不知道失败原因
- **后端行为**（`session_service.py` `stream_mock_chat`）：

```python
payload = json.dumps({"error": str(exc)}, ensure_ascii=False)
yield f"data: {payload}\n\n"
yield "data: [DONE]\n\n"
```

- **修复方案**：

```tsx
const payload = JSON.parse(event.data)
if (payload.error) {
    message.error(payload.error)
    setIsAiTyping(false)
    return
}
const chunk = payload.content ?? payload.data?.content
```

---

### 🟡 P1 — 建议修复

#### Bug #3：无效 session ID 暴露 Python 内部错误

- **文件**：`backend/app/api/sessions.py`
- **位置**：`get_session_messages`、`delete_session`、`get_session_emotion`
- **问题**：`parse_session_id("abc")` 抛出 `ValueError`，被 `except ValueError` 捕获后直接 `str(exc)` 返回给前端
- **现象**：前端显示 `invalid literal for int() with base 10: 'abc'`
- **修复方案**：在 API 层区分业务错误与解析错误

```python
try:
    sid = parse_session_id(session_id)
except ValueError:
    return error_response("400", "无效的会话 ID", status_code=400)
```

---

#### Bug #4：流式接口会话不存在时 HTTP 仍返回 200

- **文件**：`backend/app/api/sessions.py`、`backend/app/services/session_service.py`
- **问题**：`stream_chat` 无论会话是否存在都返回 `StreamingResponse(status=200)`，错误信息在 SSE 体内
- **影响**：前端/监控难以按 HTTP 状态码判断失败；与 REST 接口风格不一致
- **修复方案（二选一）**：
  1. 在 `stream_chat` 路由中先校验 session 是否存在，不存在直接 `return error_response("404", ...)`
  2. 或保持 SSE 风格，但确保前端处理 `error` 字段（Bug #2）

---

#### Bug #5：删除当前会话时 sessionId 类型比较可能失效

- **文件**：`src/components/Consultation.tsx`
- **位置**：`handleDeleteSession`（约第 326 行）
- **问题**：`currentSession?.sessionId === sessionId`，前者可能为 API 返回的 string，后者为 `item.id.toString()`；若一方带 `session_` 前缀则比较失败
- **现象**：删除当前会话后聊天区未清空
- **修复方案**：统一比较格式

```tsx
const normalizeId = (id: string | number | undefined) =>
    String(id ?? '').replace(/^session_/, '')

if (normalizeId(currentSession?.sessionId) === normalizeId(sessionId)) {
    setCurrentSession(undefined)
    setChatList([])
}
```

---

#### Bug #6：情绪花园 `improvementSuggestions` 缺少空值保护

- **文件**：`src/components/Consultation.tsx`
- **位置**：约第 394 行
- **问题**：`currentEmotion?.improvementSuggestions.map(...)` — 若 `improvementSuggestions` 为 `undefined` 会报错
- **修复方案**：

```tsx
{(currentEmotion?.improvementSuggestions ?? []).map(...)}
```

---

#### Bug #7：咨询页未做登录守卫

- **文件**：`src/router/index.tsx`
- **位置**：`/` 路由下的 `consultation` 子路由（约第 63 行）
- **问题**：未登录用户可直接访问 `/consultation`，API 调用失败后体验差
- **修复方案**：为咨询/日记等需登录页面包裹 `RequireAuth`，或在 `Consultation` 组件内检测 token 并跳转登录

---

### 🟢 P2 — 优化项 / 已知限制

#### Bug #8：管理端咨询记录只能看到当前登录用户的会话

- **文件**：`src/components/Consultations.tsx`、`backend/app/api/sessions.py`
- **问题**：`list_sessions` 仅按 `current_user.id` 过滤，管理员无法查看全部用户咨询
- **说明**：Sprint 2 范围内可接受，Sprint 3+ 需增加 admin 专用接口（如 `GET /api/admin/sessions`）
- **临时方案**：在管理端页面添加提示「当前仅显示您自己的会话记录」

---

#### Bug #9：`getEmotion` 中 sessionId 前缀处理冗余

- **文件**：`src/components/Consultation.tsx`
- **位置**：`getEmotion`（约第 352–355 行）
- **问题**：强制添加 `session_` 前缀；后端 `parse_session_id` 已兼容纯数字和 `session_` 前缀
- **影响**：无功能影响，但增加理解成本
- **修复方案**：统一传纯数字 ID，或抽取 `normalizeSessionId` 工具函数

---

#### Bug #10：会话列表获取失败无用户提示

- **文件**：`src/components/Consultation.tsx`
- **位置**：`getSessionsList`（约第 123–126 行）
- **问题**：`catch` 仅 `console.error` + 置空列表，未登录时用户看到「暂无会话历史」而非「请先登录」
- **修复方案**：`catch` 中根据 401 提示登录

---

#### Bug #11：pytest 产生 asyncio 弃用警告

- **文件**：`backend/pytest.ini`
- **问题**：`asyncio_default_fixture_loop_scope` 未配置
- **修复方案**：在 `pytest.ini` 添加 `asyncio_default_fixture_loop_scope = function`

---

#### 已知限制（非 Bug，Sprint 5 解决）

- AI 回复为固定 mock 文本，非真实 LLM
- 情绪分析基于关键词规则，非 LLM 结构化输出
- `emotion_tag` 筛选字段已预留，创建/分析流程尚未写入该字段

---

## 八、Sprint 2 文件变更清单

### 新增（未 commit）

```
backend/app/models/chat_session.py
backend/app/models/message.py
backend/app/schemas/session.py
backend/app/services/session_service.py
backend/app/api/sessions.py
backend/alembic/versions/002_chat_session_message.py
backend/tests/test_sprint2_api.py
```

### 修改（未 commit）

```
backend/app/main.py              # 注册 sessions 路由
backend/app/models/__init__.py   # 导出新模型
backend/app/models/user.py       # 添加 chat_sessions 关系
src/apis/sessions.ts             # 修正 streamChat 路径
src/components/Consultation.tsx  # 对接新后端，首条消息不重复保存
docs/API_CONTRACT.md             # Sprint 2 接口文档
docs/PROJECT_PLAN.md             # 可能更新了进度
```

---

## 九、修复任务 Checklist（供下一个对话使用）

```
Sprint 2 问题修复任务：

P0（必须先做）：
- [x] Bug #1: handleNew 时清空 chatList 和 currentEmotion
- [x] Bug #2: Consultation SSE onmessage 处理 payload.error

P1（建议联调前完成）：
- [x] Bug #3: 无效 session ID 返回友好错误「无效的会话 ID」
- [x] Bug #4: stream 接口会话不存在时先返回 HTTP 404
- [x] Bug #5: 删除会话时统一 sessionId 比较格式
- [x] Bug #6: improvementSuggestions 空值保护
- [x] Bug #7: 咨询页添加 RequireAuth 登录守卫

P2（可选）：
- [ ] Bug #8: 管理端咨询记录说明或 admin API（可推迟到 Sprint 3）
- [x] Bug #9: 统一 sessionId 工具函数（`normalizeSessionId`）
- [x] Bug #10: 会话列表失败时用户提示
- [x] Bug #11: pytest asyncio 警告配置

验证步骤：
- [x] cd backend && python -m pytest tests/ -v  → 20/20 通过
- [x] npm run build 成功
- [ ] docker compose -f docker-compose.dev.yml up -d
- [ ] 浏览器：登录 → 咨询页 → 发送消息 → 看到 mock 流式回复
- [ ] 浏览器：点击 + 新建会话 → 聊天区应清空
- [ ] 浏览器：点击历史会话 → 加载历史消息
- [ ] 浏览器：删除会话 → 列表更新
- [ ] 浏览器：情绪花园显示 mock 分析结果
- [ ] 输入「我不想活了」→ 危机级别风险提示
```

---

## 十、关键文件路径速查

| 用途 | 路径 |
|------|------|
| 咨询页主组件 | `src/components/Consultation.tsx` |
| 会话 API 封装 | `src/apis/sessions.ts` |
| 会话类型定义 | `src/types/sessionsType.ts` |
| 会话 API 路由 | `backend/app/api/sessions.py` |
| 会话业务逻辑 | `backend/app/services/session_service.py` |
| 会话 Schema | `backend/app/schemas/session.py` |
| 会话模型 | `backend/app/models/chat_session.py` |
| 消息模型 | `backend/app/models/message.py` |
| 数据库迁移 | `backend/alembic/versions/002_chat_session_message.py` |
| Sprint 2 测试 | `backend/tests/test_sprint2_api.py` |
| API 契约文档 | `docs/API_CONTRACT.md` |
| 管理端咨询记录 | `src/components/Consultations.tsx` |

---

## 十一、给下一个对话的 Prompt 建议

可直接复制以下内容到新对话：

---

请根据 `docs/SPRINT2_TEST_AND_FIXES.md` 修复 Sprint 2 遗留问题。

要求：
1. 先修复所有 P0 问题（Bug #1、#2），确保新建会话和 SSE 错误处理正常
2. 再修复 P1 问题（Bug #3 ~ #7）
3. 每修复一批后运行验证：
   - `cd backend && python -m pytest tests/ -v`
   - `npm run build`
4. 修复完成后更新本文档 Checklist，将已完成项标记为 `[x]`
5. 不要修改与 Sprint 2 修复无关的代码
6. Bug #8（管理端跨用户查询）可推迟到 Sprint 3，本次可不处理

---

## 十二、Sprint 2 完成标准（修复后应满足）

- [x] 后端会话 CRUD + SSE mock + 情绪分析 API 可用
- [x] pytest 20/20 通过
- [x] `npm run build` 无错误
- [x] 新建会话后聊天区清空（Bug #1 修复后）
- [x] SSE 错误有用户可见提示（Bug #2 修复后）
- [x] 咨询页需登录才能访问（Bug #7 修复后）
- [ ] Docker 全栈可启动并联调通过

---

## 十三、Sprint 2 总体结论

| 维度 | 评分 | 说明 |
|------|------|------|
| 后端完成度 | **95%** | API 完整，错误处理已优化 |
| 前端完成度 | **90%** | 已对接新后端，P0/P1 UX 问题已修复 |
| 测试覆盖 | **良好** | 9 项 Sprint 2 集成测试 + Sprint 1 回归 |
| 可联调状态 | **就绪** | 修 P0/P1 完成，需启动 Docker 做浏览器验证 |
| 整体 Sprint 2 | **✅ 达标，Bug #8 推迟至 Sprint 3** | |
