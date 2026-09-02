# Sprint 4–6 测试报告与问题修复清单

> 文档版本：v1.0  
> 更新日期：2026-09-02  
> 用途：供后续对话按优先级修复 Sprint 4–6 遗留问题

---

## 一、背景

本报告覆盖 Sprint 4、5、6 三个阶段的交付与测试：

| Sprint | 周期 | 目标 |
|--------|------|------|
| **Sprint 4** | W7–W8 | 前端重构：组件拆分、`useChatStream`、个人中心、ErrorBoundary、登录守卫 |
| **Sprint 5** | W9–W10 | AI 单 Agent：LLM 调用层、流式输出、情绪分析 Pipeline、日记异步分析 |
| **Sprint 6** | W11–W12 | 多 Agent 基础：意图路由、倾听/咨询/危机/知识 Agent、执行日志 |

**当前分支**：`cursor/add-project-plan-doc`  
**最近相关提交**：`f0f8e50 feat: Sprint 3–6 业务模块、前端重构与 AI 多 Agent 能力`

---

## 二、测试环境与限制

| 项目 | 状态 |
|------|------|
| 后端 pytest 全量 | ✅ **45/45 通过** |
| 前端 `npm run build` | ✅ 构建成功 |
| Docker 全栈联调 | ❌ 未执行（需本地启动 Docker） |
| 真实 LLM API 联调 | ❌ 未执行（默认 `LLM_PROVIDER=mock`） |
| 浏览器 E2E 手动测试 | ❌ 未执行 |

**测试命令**：

```bash
# 后端全量测试
cd backend
python -m pytest tests/ -v

# 前端构建
cd ..
npm run build

# 全栈启动（联调验证用）
docker compose -f docker-compose.dev.yml up -d
npm run dev
```

---

## 三、交付物核对

### 3.1 Sprint 4：前端重构

| 任务项 | 状态 | 说明 |
|--------|------|------|
| `Consultation.tsx` 拆分为子组件 | ✅ | `chat/` 目录 6 个组件 + `useChatStream` |
| 抽取 `useChatStream` hook | ✅ | `src/hooks/useChatStream.ts` |
| 首页 CTA 跳转修复 | ✅ | `Default.tsx` 支持登录引导 |
| 个人中心页面 | ✅ | `src/pages/Profile.tsx` |
| ErrorBoundary + 全局 Loading | ✅ | `main.tsx` 挂载 |
| 咨询/日记登录守卫 | ✅ | `router/index.tsx` 包裹 `RequireAuth` |
| 管理端对接新后端 | ✅ | Sprint 3 已完成 |

**新增/重构文件**：

```
src/hooks/useChatStream.ts
src/utils/stream.ts
src/utils/emotion.ts
src/components/chat/AgentCard.tsx
src/components/chat/ChatHeader.tsx
src/components/chat/ChatWindow.tsx
src/components/chat/EmotionGarden.tsx
src/components/chat/MessageInput.tsx
src/components/chat/SessionList.tsx
src/components/common/ErrorBoundary.tsx
src/components/common/GlobalLoadingOverlay.tsx
src/components/common/Loading.tsx
src/components/common/Empty.tsx
src/pages/Profile.tsx
```

### 3.2 Sprint 5：AI 单 Agent

| 任务项 | 状态 | 说明 |
|--------|------|------|
| LLM 调用层封装 | ✅ | `backend/app/services/llm_service.py` |
| 心理咨询 System Prompt | ✅ | `backend/app/prompts/counselor.py` |
| SSE 流式输出 | ✅ | `chat_service.py` + `llm_service.chat_stream` |
| 上下文管理（滑动窗口） | ✅ | `LLM_MAX_CONTEXT_MESSAGES=20` |
| 情绪分析 Pipeline | ✅ | `emotion_service.py`（LLM + 规则兜底） |
| 日记 AI 异步分析 | ✅ | `BackgroundTasks` + `run_diary_analysis_task` |

**新增文件**：

```
backend/app/services/llm_service.py
backend/app/services/chat_service.py
backend/app/services/emotion_service.py
backend/app/prompts/counselor.py
backend/app/prompts/emotion.py
backend/tests/test_sprint5_api.py
```

### 3.3 Sprint 6：多 Agent 基础

| 任务项 | 状态 | 说明 |
|--------|------|------|
| Agent 编排状态机 | ✅ | `backend/app/agents/graph.py`（轻量实现，非 LangGraph 库） |
| Router Agent 意图分类 | ✅ | `backend/app/agents/router.py` |
| 倾听 / 咨询 / 危机 / 知识 Agent | ✅ | 不同 Prompt + mock 回复策略 |
| Agent 执行日志 | ✅ | `agent_execution_logs` 表 + 写入逻辑 |
| 前端展示当前 Agent | ✅ | `ChatHeader` 显示 `activeAgent` |

**新增文件**：

```
backend/app/agents/graph.py
backend/app/agents/router.py
backend/app/agents/prompts.py
backend/app/agents/types.py
backend/app/models/agent_execution_log.py
backend/alembic/versions/004_agent_execution_logs.py
backend/tests/test_sprint6_api.py
```

---

## 四、自动化测试结果

### 4.1 全量回归（45/45 通过）

| 套件 | 用例数 | 结果 |
|------|--------|------|
| `test_sprint1_api.py` | 11 | ✅ |
| `test_sprint2_api.py` | 9 | ✅ |
| `test_sprint3_api.py` | 8 | ✅ |
| `test_sprint3_edge.py` | 5 | ✅ |
| `test_sprint5_api.py` | 6 | ✅ |
| `test_sprint6_api.py` | 6 | ✅ |
| **合计** | **45** | **✅ 全部通过** |

### 4.2 Sprint 5 专项（6/6）

| # | 测试项 | 结果 |
|---|--------|------|
| 1 | 危机关键词规则分析 | ✅ |
| 2 | 焦虑关键词规则分析 | ✅ |
| 3 | 日记情绪规则分析 | ✅ |
| 4 | mock 模式流式对话 + 消息持久化 | ✅ |
| 5 | 会话情绪分析接口 | ✅ |
| 6 | 日记异步 AI 分析（BackgroundTask） | ✅ |

### 4.3 Sprint 6 专项（6/6）

| # | 测试项 | 结果 |
|---|--------|------|
| 1 | Router：危机意图 `crisis` | ✅ |
| 2 | Router：咨询意图 `counsel` | ✅ |
| 3 | Router：知识意图 `knowledge` | ✅ |
| 4 | Router：倾诉意图 `listen` | ✅ |
| 5 | SSE 流包含 `agent` / `agentName` 元数据 | ✅ |
| 6 | `agent_execution_logs` 写入成功 | ✅ |

### 4.4 前端构建

```
npm run build → ✅ 成功
产物体积警告：主包约 3.3MB（见 Bug #12）
```

---

## 五、功能效果评估

| 模块 | 后端 | 前端 | 备注 |
|------|------|------|------|
| 咨询页组件化 | — | ✅ | 拆分为 6 个子组件 |
| `useChatStream` | — | ✅ | 支持 agent 元数据、error 处理 |
| 个人中心 | ✅ | ✅ | 展示会话统计与账号信息 |
| 登录守卫 | — | ✅ | `/consultation`、`/diary`、`/profile` |
| LLM 调用层 | ✅ mock | — | 配置 API Key 后启用真实 LLM |
| 情绪分析 Pipeline | ✅ | ✅ | 规则 + LLM 双层 |
| 日记异步分析 | ✅ | ⚠️ | 用户端无历史查看页 |
| 多 Agent 路由 | ✅ | ✅ | 规则分类，非 LLM 路由 |
| Agent 名称展示 | ✅ | ✅ | ChatHeader 实时显示 |
| Agent 执行日志 | ✅ 写入 | ❌ 无管理端查看 | Sprint 7 待做 |
| 知识 Agent | ⚠️ mock | — | 未接入 RAG，Sprint 7 待做 |
| 首页 CTA 登录回流 | — | ⚠️ | 登录后未跳回原页面（Bug #1） |

---

## 六、问题清单（按优先级）

### 🔴 P0 — 无阻塞项

当前无导致核心功能不可用的 P0 问题。Sprint 4–6 可进入联调与演示。

---

### 🟡 P1 — 建议修复（影响体验或数据展示）

#### Bug #1：登录后未跳回 CTA 来源页

- **文件**：`src/components/LoginForm.tsx`
- **问题**：`Default.tsx` 点击 CTA 时传递 `state: { from: { pathname: '/consultation' } }`，但 `LoginForm` 登录成功后固定跳转 `/` 或 `/back`，忽略 `location.state`
- **现象**：未登录用户点「开始倾诉」→ 登录 → 回到首页而非咨询页
- **修复方案**：

```tsx
import { useLocation, useNavigate } from 'react-router-dom';

const location = useLocation();
const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

// 登录成功后
if (res.data.roleType === '2') {
    navigate('/back');
} else {
    navigate(from || '/');
}
```

---

#### Bug #2：个人中心「继续对话」未定位到具体会话

- **文件**：`src/pages/Profile.tsx`（约第 92 行）
- **问题**：`<Link to="/consultation">` 仅跳转咨询页，不携带 `sessionId`
- **现象**：用户点击「继续对话」后进入空白新会话，需手动从历史列表选择
- **修复方案**：
  1. 使用 `navigate('/consultation', { state: { sessionId: item.id } })`
  2. `Consultation.tsx` 在 `useEffect` 中读取 `location.state.sessionId` 并自动加载

---

#### Bug #3：管理端情绪强度 Progress 显示错误

- **文件**：`src/components/Emotional.tsx`（约第 240 行）
- **问题**：`emotionScore` 为 0–1 小数（如 `0.72`），直接传给 `Progress percent` 显示为 0.72%
- **修复方案**：

```tsx
<Progress percent={Math.round((aiData?.emotionScore ?? 0) * 100)} />
```

---

#### Bug #4：风险等级展示过于粗糙

- **文件**：`src/components/Emotional.tsx`（约第 242 行）
- **问题**：`riskLevel ? '高风险' : '正常'` —— `riskLevel` 为 1 时也显示「高风险」
- **修复方案**：

```tsx
const riskLabels: Record<number, string> = {
  0: '正常',
  1: '需关注',
  2: '中度风险',
  3: '高风险',
};
// riskLabels[aiData?.riskLevel ?? 0] ?? '未知'
```

---

#### Bug #5：编辑文章时封面图不显示

- **文件**：`src/components/ArticleDialog.tsx`
- **问题**：`uploadImg` 初始值为 `''`，打开编辑弹窗时未根据 `initialValues.coverImage` 设置预览
- **修复方案**：添加 `useEffect`，在 `visible && initialValues?.coverImage` 时：

```tsx
useEffect(() => {
  if (visible && initialValues?.coverImage) {
    const path = initialValues.coverImage;
    setUploadImg(path.startsWith('http') ? path : `${fileBaseUrl}${path}`);
    form.setFieldsValue({ coverImage: path });
  } else if (!visible) {
    setUploadImg('');
  }
}, [visible, initialValues, form]);
```

---

#### Bug #6：头像 URL 拼接可能错误

- **文件**：`src/pages/Profile.tsx`、`src/pages/BackLayout.tsx`
- **问题**：`${fileBaseUrl}/api${userInfo.avatar}` —— 上传文件路径为 `/uploads/xxx`，不应加 `/api` 前缀
- **修复方案**：改为 `${fileBaseUrl}${userInfo.avatar}`（与 `KnowledgeBase` 封面图一致）

---

### 🟢 P2 — 优化项 / 已知限制（可推迟到 Sprint 7+）

#### Bug #7：知识 Agent 未接入真实 RAG

- **文件**：`backend/app/agents/graph.py`
- **说明**：知识意图返回固定 mock 文本，未检索 `knowledge_articles` 表
- **计划**：Sprint 7 实现 pgvector + RAG

---

#### Bug #8：Agent 执行日志无管理端查看

- **说明**：`agent_execution_logs` 表有数据，但无 API 和前端页面
- **计划**：Sprint 7 风险预警中心 / Agent 配置页

---

#### Bug #9：编排实现与文档「LangGraph」命名不一致

- **说明**：`graph.py` 为自研轻量状态机，未使用 `langgraph` Python 包
- **影响**：无功能影响，简历/文档描述需与实际一致
- **建议**：文档改为「轻量多 Agent 编排」或后续真正接入 LangGraph 库

---

#### Bug #10：管理端咨询记录仍仅显示当前管理员自己的会话

- **文件**：`src/components/Consultations.tsx`、`backend/app/api/sessions.py`
- **说明**：Sprint 2 遗留，需 `GET /api/admin/sessions` 专用接口
- **计划**：Sprint 7 或单独迭代

---

#### Bug #11：普通用户无情绪日记历史页

- **说明**：用户可提交日记（`Diary.tsx`），但无法查看自己的历史记录与 AI 分析
- **建议**：新增 `/diary/history` 或并入 `Profile` 页

---

#### Bug #12：前端打包体积过大

- **说明**：`index-*.js` 约 3.3MB（gzip 1.1MB），含 ECharts、wangeditor 等
- **建议**：路由级 `React.lazy` + `manualChunks` 拆分

---

#### Bug #13：真实 LLM 无集成测试

- **说明**：所有 AI 测试在 `LLM_PROVIDER=mock` 下通过，未验证 DeepSeek/OpenAI 真实调用
- **建议**：增加可选的 smoke test（`@pytest.mark.llm` + 环境变量开关）

---

#### Bug #14：`fetchEventSource` 默认重试行为

- **文件**：`src/hooks/useChatStream.ts`
- **说明**：连接失败时 `@microsoft/fetch-event-source` 可能自动重试
- **建议**：在 `onerror` 中 `throw error` 以阻止默认重试（若出现重复请求）

---

## 七、Sprint 4–6 关键文件速查

| 用途 | 路径 |
|------|------|
| 咨询页主组件 | `src/components/Consultation.tsx` |
| 流式对话 Hook | `src/hooks/useChatStream.ts` |
| 个人中心 | `src/pages/Profile.tsx` |
| 路由与守卫 | `src/router/index.tsx` |
| LLM 服务 | `backend/app/services/llm_service.py` |
| 对话服务 | `backend/app/services/chat_service.py` |
| 情绪分析 | `backend/app/services/emotion_service.py` |
| Agent 编排 | `backend/app/agents/graph.py` |
| 意图路由 | `backend/app/agents/router.py` |
| Agent 日志模型 | `backend/app/models/agent_execution_log.py` |
| LLM 配置 | `backend/.env.example` |
| Sprint 5 测试 | `backend/tests/test_sprint5_api.py` |
| Sprint 6 测试 | `backend/tests/test_sprint6_api.py` |

---

## 八、修复任务 Checklist（供下一个对话使用）

```
Sprint 4–6 问题修复任务：

P1（建议联调前完成）：
- [x] Bug #1: LoginForm 支持 location.state.from 登录回流
- [x] Bug #2: Profile「继续对话」携带 sessionId 并自动加载
- [x] Bug #3: Emotional Progress 情绪强度 * 100
- [x] Bug #4: Emotional 风险等级分级展示
- [x] Bug #5: ArticleDialog 编辑时回显封面图
- [x] Bug #6: Profile/BackLayout 头像 URL 去掉多余 /api

P2（可推迟到 Sprint 7）：
- [ ] Bug #7: 知识 Agent 接入 RAG
- [ ] Bug #8: Agent 执行日志管理端
- [ ] Bug #9: 文档统一编排技术描述
- [ ] Bug #10: 管理端跨用户咨询记录
- [ ] Bug #11: 用户端日记历史页
- [ ] Bug #12: 前端代码分割优化
- [ ] Bug #13: 真实 LLM 可选集成测试
- [ ] Bug #14: fetchEventSource 重试控制

验证步骤：
- [ ] cd backend && python -m pytest tests/ -v  → 45/45 通过
- [ ] npm run build 成功
- [ ] 未登录 → 首页 CTA → 登录 → 自动进入咨询页（Bug #1）
- [ ] 个人中心 → 继续对话 → 加载对应会话（Bug #2）
- [ ] 管理端情绪日志详情 → 情绪强度条显示正常（Bug #3）
- [ ] 发送「什么是焦虑症」→ ChatHeader 显示「知识 Agent 正在服务」
- [ ] 配置 LLM_API_KEY 后真实对话可用（可选）
```

---

## 九、给下一个对话的 Prompt 建议

可直接复制以下内容到新对话：

---

请根据 `docs/SPRINT4_6_TEST_AND_FIXES.md` 修复 Sprint 4–6 遗留问题。

要求：
1. 先修复所有 P1 问题（Bug #1 ~ #6）
2. 每修复一批后运行验证：
   - `cd backend && python -m pytest tests/ -v`
   - `npm run build`
3. P2 问题（Bug #7 ~ #14）属于 Sprint 7 范围，本次可不处理
4. 修复完成后更新本文档 Checklist，将已完成项标记为 `[x]`
5. 不要修改与本次修复无关的代码

---

## 十、Sprint 4–6 完成标准

| 标准 | 状态 |
|------|------|
| 前端咨询页组件化完成 | ✅ |
| `useChatStream` 抽取并支持 Agent 元数据 | ✅ |
| 个人中心、ErrorBoundary、登录守卫 | ✅ |
| LLM 调用层 + mock/真实双模式 | ✅ |
| 情绪分析 Pipeline（会话 + 日记） | ✅ |
| 多 Agent 路由 + 执行日志 | ✅ |
| pytest 45/45 通过 | ✅ |
| `npm run build` 无错误 | ✅ |
| P1 UX 问题修复 | ✅ 已修复 |
| 真实 LLM 联调验证 | ⬜ 需配置 API Key |

---

## 十一、总体结论

| 维度 | 评分 | 说明 |
|------|------|------|
| Sprint 4 前端重构 | **90%** | 架构清晰，少量 UX 回流问题 |
| Sprint 5 AI 能力 | **85%** | mock 模式完整，真实 LLM 待配置验证 |
| Sprint 6 多 Agent | **80%** | 路由 + 日志可用，RAG 与日志查看待 Sprint 7 |
| 测试覆盖 | **良好** | 45 项自动化测试全通过 |
| 整体 Sprint 4–6 | **✅ 基本达标** | 可演示，建议修 P1 后进入 Sprint 7 |
