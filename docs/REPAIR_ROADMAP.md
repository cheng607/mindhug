# MindHug 修复推进文档

> 文档版本：v2.0  
> 更新日期：2026-09-02  
> 用途：汇总当前已知问题、未完成项与修复任务，供后续按优先级推进  
> 关联文档：`docs/FULL_PROJECT_TEST_AND_ISSUES.md`、`docs/PROJECT_PLAN.md`

---

## 一、当前状态快照

| 维度 | 最新状态 | 说明 |
|------|----------|------|
| 后端 pytest | ✅ **111 passed, 3 skipped (llm)** | 含忘记密码、导出、对话质量 |
| 前端 lint / build | ✅ 通过 | |
| 前端 Vitest | ✅ 12 passed | `npm run test` |
| Playwright E2E | ✅ 19/19 | 含知识发布/下架 + 多轮对话 |
| API 冒烟 | ✅ 19/19 | `backend/scripts/integration_smoke.py` |
| Sprint 1–8 主干 | ✅ 已实现 | P1/P2 清单项代码层面已闭合 |
| Docker 生产全栈 | ❌ 未实测 | 需 Docker Desktop + `.env` |
| 真实 LLM 对话 | ⚠️ 已配置 DeepSeek | 需重启后端 + 新会话；测试环境应隔离 |

**验证命令**：

```bash
cd backend && python -m pytest tests/ -v --tb=short
cd .. && npm run lint && npm run build
node e2e/browser-checklist.mjs          # 需前后端已启动
python backend/scripts/integration_smoke.py
```

---

## 二、🔴 P0 — 当前阻塞（测试失败，优先修）

> 以下 3 项导致 CI/本地全量 pytest 无法全绿，应最先处理。

### P0-1：测试环境未强制 Mock LLM

| 项 | 内容 |
|----|------|
| **现象** | 本地 `backend/.env` 配置 `LLM_PROVIDER=deepseek` 后，pytest 走真实 LLM，结果不稳定 |
| **失败用例** | 见 P0-2 ~ P0-4 |
| **根因** | `tests/conftest.py` 仅关闭限流，未 `os.environ["LLM_PROVIDER"] = "mock"` |
| **修复方案** | 在 `conftest.py` 最顶部强制测试环境变量：`LLM_PROVIDER=mock`、`LLM_API_KEY=""` |
| **涉及文件** | `backend/tests/conftest.py` |
| **验收** | 无 `.env` 干扰时 `pytest tests/ -q` 全绿 |

---

### P0-2：`test_emotion_analysis_with_session_prefix` 失败

| 项 | 内容 |
|----|------|
| **文件** | `backend/tests/test_sprint2_api.py:194` |
| **断言** | `riskLevel == 2` |
| **实际** | `riskLevel == 1`（LLM 返回与规则引擎不一致） |
| **修复方案** | 同 P0-1；或 `emotion_service` 在测试中 monkeypatch `llm_service.enabled = False` |
| **验收** | 规则引擎对「焦虑、失眠」返回 `riskLevel=2` |

---

### P0-3：`test_emotion_analysis_creates_risk_alert` 失败

| 项 | 内容 |
|----|------|
| **文件** | `backend/tests/test_sprint7_api.py:217` |
| **断言** | `riskLevel >= 2` 且 DB 存在 `trigger_reason="情绪分析预警"` |
| **实际** | LLM 返回 `riskLevel=1`，未触发预警写入 |
| **修复方案** | 同 P0-1；或放宽测试为 mock 模式专用 fixture |
| **验收** | mock 模式下预警记录 ≥ 1 |

---

### P0-4：`test_crisis_message_routes_to_crisis_agent` 失败

| 项 | 内容 |
|----|------|
| **文件** | `backend/tests/test_sprint8_api.py:114` |
| **断言** | SSE 体含 `"agent": "crisis"` 且含 `"0-16"`、`"1-99"`（热线分片） |
| **实际** | 启用 LLM 时危机回复来自 LLM 流式输出，内容与固定模板 `CRISIS_RESPONSE_TEMPLATE`（400-161-9995）不一致 |
| **修复方案** | ① 测试环境强制 mock（危机走固定模板）；② 或更新断言为 `400-161-9995` / `CRISIS_HOTLINE` 常量，去掉过时的 `0-16` 片段 |
| **涉及文件** | `backend/tests/test_sprint8_api.py`、`backend/app/core/crisis.py` |
| **验收** | mock 模式下危机 SSE 含 crisis agent 标识 + 热线号码片段 |

---

### P0 修复 Checklist

```
- [x] conftest.py 强制 LLM_PROVIDER=mock
- [x] 重跑 pytest，确认 3 个失败用例恢复
- [x] 更新 test_sprint8 危机热线断言（与 crisis.py 常量对齐）
- [x] 同步 docs/FULL_PROJECT_TEST_AND_ISSUES.md 测试总览数字
```

---

## 三、🟡 P1 — 体验与 AI 质量（用户可感知）

### P1-1：对话仍偏套路、上下文连贯性不足

| 项 | 内容 |
|----|------|
| **现象** | 每轮复述用户原话、结构雷同；多轮后仍像模板 |
| **已做** | Prompt v2、对话背景注入、第 2 轮起切换咨询 Agent |
| **仍不足** | 路由仍为关键词；无会话摘要；Agent 配置页 temperature/model 未接入调用 |
| **修复方案** | 见 P1-2 ~ P1-4 |
| **涉及文件** | `backend/app/agents/graph.py`、`router.py`、`prompts.py`、`prompt_config_service.py` |

---

### P1-2：Agent 配置页参数未生效

| 项 | 内容 |
|----|------|
| **现象** | 管理端可改 Prompt / temperature / model，但 `graph.py` 调用 `llm_service.chat_stream` 时用全局 settings |
| **修复方案** | `build_agent_messages` 读取 `AgentPromptConfig` 的 model、temperature、max_tokens 传入 LLM |
| **涉及文件** | `backend/app/agents/graph.py`、`backend/app/services/llm_service.py` |
| **验收** | 管理端改 temperature 后对话风格可感知变化 |

---

### P1-3：意图路由过于粗糙

| 项 | 内容 |
|----|------|
| **现象** | 纯关键词；「告诉我前端技术」曾误判为倾诉；技术/离题问题需特殊规则 |
| **已做** | 离题检测、多轮切 counsel |
| **建议** | ① LLM 轻量意图分类（1 token JSON）；② 或 embedding 相似度匹配意图 |
| **涉及文件** | `backend/app/agents/router.py` |
| **验收** | 测试集 20 条意图样本准确率 > 85% |

---

### P1-4：`.env` 配置易踩坑

| 项 | 内容 |
|----|------|
| **现象** | `LLM_PROVIDER` 重复定义时后者覆盖前者；改 `.env` 后 `--reload` 不生效 |
| **已做** | `.env.example` 增加注释 |
| **建议** | README 醒目说明；可选启动时 log 打印当前 `LLM_PROVIDER` |
| **涉及文件** | `backend/.env.example`、`backend/app/main.py`、`README.md` |

---

### P1-5：聊天消息顺序错乱（已修，需验证）

| 项 | 内容 |
|----|------|
| **现象** | 同秒内 AI 消息排在用户消息上方 |
| **已做** | `ChatWindow` 同秒用户优先；`generateUniqueId` 单调递增 |
| **验收** | 多轮对话 UI 顺序始终 用户 → AI |
| **涉及文件** | `src/components/chat/ChatWindow.tsx`、`src/utils/stream.ts` |

---

### P1-6：全局 Loading 蒙层时机错误（已删除）

| 项 | 内容 |
|----|------|
| **现象** | 流式结束后 `getEmotion` axios 请求触发全屏蒙层 |
| **已做** | 删除 `GlobalLoadingOverlay` 与 axios loading 拦截 |
| **验收** | 发消息全程无全屏半透明 spinner |
| **涉及文件** | 已删 `GlobalLoadingOverlay.tsx`、`loadingStore.ts` |

---

### P1 修复 Checklist

```
- [x] Agent 配置 temperature/model 接入 graph.py
- [x] 启动日志打印 LLM_PROVIDER 与 llm_enabled
- [x] 意图路由增强（LLM 分类或规则扩充）
- [x] 用户实测：新建会话多轮对话质量验收（`test_conversation_quality.py` + E2E）
- [x] 确认消息顺序、无全局蒙层
```

---

## 四、🟡 P1 — 部署与运维

### P1-7：Docker 生产全栈未实测

| 项 | 内容 |
|----|------|
| **现象** | `docker compose up -d --build` 未执行；本机 Docker Desktop 常未启动 |
| **风险** | Nginx 反代、健康检查、卷持久化、生产 env 未验证 |
| **修复步骤** | 1. 启动 Docker Desktop  2. 复制 `.env`  3. 项目根目录 `docker compose config`  4. `docker compose up -d --build`  5. 访问 80 端口 |
| **涉及文件** | `docker-compose.yml`、`docs/DEPLOYMENT.md` |
| **验收** | 注册→登录→咨询→管理端 全链路在容器环境可用 |

---

### P1-8：开发/生产环境混用端口

| 项 | 内容 |
|----|------|
| **现象** | 5173/5174/5175 多实例并存；docker compose 命令必须在项目根目录 |
| **建议** | README 固定推荐：本机 `8000 + 5173`；文档写清目录与端口 |
| **涉及文件** | `README.md` |

---

## 五、🟢 P2 — 架构与规划差距（已知，非 Bug）

> 以下为 `PROJECT_PLAN` 与实现的**已知差异**，答辩/简历中需如实描述。

| 规划 | 实际 | 是否要补 |
|------|------|----------|
| LangGraph 库 | 自研 `graph.py` 状态机 | 可选；当前够用 |
| MinIO 对象存储 | 本地 `uploads/` | 上线前可换 S3/MinIO |
| Redis 缓存 | 仅限流 | 可选会话缓存 |
| pgvector | PG 有迁移；SQLite dev 内存检索 | 生产用 PG 即可 |
| 多 Agent 协作 | 单轮选一个 Agent | 可选链式 handoff |

---

## 六、🟢 P2 — 功能完整度缺口

### 用户端

| ID | 缺失 | 建议 |
|----|------|------|
| F-01 | 忘记密码 / 邮箱验证 | ✅ 忘记/重置密码 + SMTP（dev 日志模式） |
| F-02 | 修改资料 / 改密码 | ✅ Profile + `PUT /user/profile`、`PUT /user/password` |
| F-03 | 会话按 emotionTag 筛选 | ✅ SessionList 筛选 + API |
| F-04 | 消息编辑 / 删除 / 重新生成 | ✅ 咨询页消息菜单 + API |
| F-05 | 移动端适配 | ✅ Consultation 响应式布局 |
| F-06 | Profile 展示日记历史摘要 | ✅ 调 `GET /emotion-diary/my/page` |

### 管理端

| ID | 缺失 | 建议 |
|----|------|------|
| F-07 | 用户管理（封禁/角色） | ✅ `/back/users` + admin users API |
| F-08 | 知识文库发布/下架 E2E | ✅ Playwright 发布/下线 + 用户可见性 |
| F-09 | 数据导出 | ✅ 咨询/日记 CSV 导出 API + 管理端按钮 |

---

## 七、🟢 P2 — 工程质量

| ID | 项 | 现状 | 建议 |
|----|-----|------|------|
| Q-01 | 前端单元测试 | ✅ Vitest：`stream.ts`、`chatStreamPayload.ts` |
| Q-02 | E2E 进 CI | ✅ | GitHub Actions Playwright job |
| Q-03 | 真实 LLM 集成测试 | ✅ nightly workflow + `@pytest.mark.llm` |
| Q-04 | vendor 体积 | ✅ ECharts 路由懒加载（DashBoard 动态 import） |
| Q-05 | 文档同步 | ✅ FULL_PROJECT 测试总览已更新 |
| Q-06 | JWT 存 localStorage | ✅ httpOnly Cookie + Header 兼容 |
| Q-07 | RAG mock embedding | ✅ EMBEDDING_* 独立配置 + 启动日志 |

---

## 八、推荐推进路线（分阶段）

### 阶段 A：稳定基线（1–2 天）

**目标**：测试全绿、本地开发路径清晰

1. 修 P0（conftest 强制 mock + 危机测试断言）
2. 确认 `pytest` 68 passed（含 2 skipped）
3. `npm run lint && npm run build`
4. README 补充：Docker 命令目录、`.env` 重启说明

**完成标志**：`pytest tests/ -q` 无 failed

---

### 阶段 B：AI 体验提升（2–3 天）

**目标**：对话自然、多 Agent 名实相符

1. P1-2 Agent 配置参数接入
2. P1-3 意图路由增强
3. 用户实测 checklist（新建会话 3 轮对话）
4. 可选：管理端微调倾听/咨询 Prompt

**完成标志**：用户主观评价「不再明显套模板」；第 2 轮起显示咨询 Agent

---

### 阶段 C：部署验证（1–2 天）

**目标**：可 Docker 演示

1. P1-7 Docker 全栈 up
2. 生产 `.env` 模板（JWT、POSTGRES、LLM）
3. DEPLOYMENT.md 补实测记录

**完成标志**：仅 Docker 即可访问前后端

**进度（2026-09-02）**：`docker compose up -d --build` 已实测通过，`http://localhost/health` 可达。脚本：`scripts/docker-up-test.ps1`

---

### 阶段 D：产品化补强（按需）

1. F-02 改密码 / F-03 会话筛选 ✅
2. Q-02 E2E 进 CI ✅
3. F-05 移动端 ✅（Consultation 响应式）
4. F-06 Profile 日记摘要 ✅
5. 架构演进（MinIO、Redis 缓存、LangGraph）按答辩需要选做

---

## 九、文件索引（修复时常改）

| 用途 | 路径 |
|------|------|
| 测试环境 | `backend/tests/conftest.py` |
| 多 Agent 编排 | `backend/app/agents/graph.py` |
| 意图路由 | `backend/app/agents/router.py` |
| System Prompt | `backend/app/agents/prompts.py` |
| Prompt DB 同步 | `backend/app/services/prompt_config_service.py` |
| 情绪分析 | `backend/app/services/emotion_service.py` |
| 危机模板 | `backend/app/core/crisis.py` |
| Mock 兜底 | `backend/app/agents/mock_reply.py` |
| 聊天 UI | `src/components/Consultation.tsx`、`src/hooks/useChatStream.ts` |
| 消息排序 | `src/components/chat/ChatWindow.tsx` |
| LLM 配置 | `backend/.env`、`backend/.env.example` |
| Docker 生产 | `docker-compose.yml`、`docs/DEPLOYMENT.md` |
| E2E | `e2e/browser-checklist.mjs` |
| API 冒烟 | `backend/scripts/integration_smoke.py` |

---

## 十、给下一个对话的 Prompt 模板

```
请根据 docs/REPAIR_ROADMAP.md 推进修复。

当前阶段：[A / B / C / D]
优先任务：[例如 P0 conftest 强制 mock]

要求：
1. 修完后运行 pytest tests/ -v 和 npm run lint && npm run build
2. 更新本文档对应 Checklist 为 [x]
3. 不要修改无关代码
```

---

## 十一、总体结论

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整度 | **~90%** | Sprint 1–8 主干齐全 |
| AI 对话体验 | **~80%** | Agent 配置参数已接入；路由规则扩充 |
| 测试稳定性 | **~98%** | pytest 90 passed；conftest 隔离 + 危机固定模板 |
| 部署就绪 | **~90%** | Docker 全栈 up 实测通过（80 端口 + health） |
| 产品化细节 | **~80%** | 改密码/资料、会话筛选、日记摘要、E2E CI |

**一句话**：项目已可演示与答辩；后续优先 **P0 测试隔离 → P1 AI/Agent 深化 → Docker 实测**，再按需做功能与工程化补强。
