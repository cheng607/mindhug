# Sprint 7 测试报告与问题修复清单

> 文档版本：v1.0  
> 更新日期：2026-09-02  
> 用途：供后续对话按优先级修复 Sprint 7 遗留问题，并作为 Sprint 8 起点参考

---

## 一、背景

本报告覆盖 **Sprint 7（W13–W14）：RAG + 管理增强** 的交付核对、自动化测试与问题清单。

| 任务项 | 规划目标 | 实现状态 |
|--------|----------|----------|
| 文章向量化 + 检索 | pgvector 向量检索 | ⚠️ **部分实现**（见说明） |
| 知识 RAG Agent | 检索知识库并生成带引用回答 | ✅ |
| 管理端：风险预警中心 | 列表、筛选、处理、去重 | ✅ |
| 管理端：Prompt 配置页面 | 4 个 Agent Prompt CRUD + 重建索引 | ✅ |
| 前端：AI 回答引用标注 | SSE citations + ChatWindow 展示 | ✅ |

**当前分支**：`cursor/add-project-plan-doc`  
**Sprint 7 代码状态**：**未提交**（见文末文件清单）  
**最近相关提交**：`b3f790f fix: 修复 Sprint 4–6 遗留 P1 体验问题（Bug #1–#6）`

### 1.1 与 PROJECT_PLAN 的差异说明

`docs/PROJECT_PLAN.md` Sprint 7 勾选为「pgvector 检索」，但**实际实现**为：

- 向量存储：`article_chunks.embedding` 字段存 **JSON 字符串**（非 PostgreSQL `vector` 类型）
- 相似度计算：Python 内存 **余弦相似度**（`embedding_service.cosine_similarity`）
- Embedding 来源：默认 **mock 确定性伪向量**；配置 `LLM_API_KEY` 后可调用 OpenAI 兼容 Embedding API
- Docker：`docker-compose.dev.yml` 已换 `pgvector/pgvector:pg15` 镜像，但**应用层尚未使用 pgvector 扩展**

结论：功能上 RAG 链路已通，但技术方案为「轻量 JSON + 内存检索」，与规划文档描述不完全一致。简历/对外描述建议写「RAG 知识检索（分块 + 向量相似度）」，避免仅写 pgvector。

---

## 二、测试环境与限制

| 项目 | 状态 |
|------|------|
| 后端 pytest 全量 | ✅ **52/52 通过**（含 Sprint 7 新增 7 项） |
| 前端 `npm run build` | ✅ 构建成功 |
| Docker 全栈联调 | ❌ 未执行（Docker Desktop 未启动） |
| 真实 LLM / Embedding API | ❌ 未执行（默认 `LLM_PROVIDER=mock`） |
| 浏览器 E2E 手动测试 | ❌ 未执行 |
| Alembic 迁移验证 | ⚠️ 测试使用 `Base.metadata.create_all`，未单独跑 `alembic upgrade` |

**测试命令**：

```bash
# 后端全量测试
cd backend
python -m pytest tests/ -v

# 仅 Sprint 7
python -m pytest tests/test_sprint7_api.py -v

# 前端构建
cd ..
npm run build

# 全栈启动（联调验证用）
docker compose -f docker-compose.dev.yml up -d
npm run dev
```

---

## 三、交付物核对

### 3.1 后端新增/修改

| 模块 | 文件 | 说明 |
|------|------|------|
| RAG 核心 | `backend/app/services/rag_service.py` | 分块（400 字 / 80 重叠）、索引、检索、引用构建 |
| Embedding | `backend/app/services/embedding_service.py` | mock 向量 + API 回退 |
| 知识 Agent | `backend/app/agents/knowledge.py` | `retrieve_knowledge`、Prompt 拼装、mock 回复 |
| 风险预警 | `backend/app/services/risk_alert_service.py` | 创建、列表、更新、去重、待处理计数 |
| Prompt 配置 | `backend/app/services/prompt_config_service.py` | 种子数据、读取、更新 |
| API | `backend/app/api/rag.py` | `POST /api/admin/rag/reindex` |
| API | `backend/app/api/risk_alerts.py` | 列表 / 待处理数 / 更新 |
| API | `backend/app/api/agent_config.py` | 列表 / 按 agentKey 更新 |
| 模型 | `article_chunk.py`, `risk_alert.py`, `agent_prompt_config.py` | 三张新表 |
| 迁移 | `alembic/versions/005_sprint7_rag_admin.py` | 建表迁移 |
| 编排集成 | `backend/app/agents/graph.py` | 知识意图 RAG、citations SSE、风险预警触发 |
| 文章发布 | `backend/app/api/knowledge.py` | 发布/更新已发布文章时自动 `index_article` |
| 情绪预警 | `backend/app/api/sessions.py` | `riskLevel >= 2` 时创建预警 |
| 启动种子 | `backend/app/main.py` | 启动时 `seed_rag_index()` 索引已发布文章 |
| 测试 | `backend/tests/test_sprint7_api.py` | 7 项专项测试 |

### 3.2 前端新增/修改

| 模块 | 文件 | 说明 |
|------|------|------|
| 风险预警中心 | `src/components/RiskAlertCenter.tsx` | 筛选、分页、处理弹窗 |
| Agent 配置 | `src/components/AgentConfig.tsx` | Tab 切换 4 Agent、保存 Prompt、重建索引 |
| API 封装 | `src/apis/admin.ts` | 预警 / 配置 / RAG 接口 |
| 类型 | `src/types/adminType.ts` | 管理端类型定义 |
| 引用展示 | `src/components/chat/ChatWindow.tsx` | 「参考来源」链接到 `/article/:id` |
| SSE 处理 | `src/hooks/useChatStream.ts` | 解析 `citations` 事件写入消息 |
| 类型 | `src/types/sessionsType.ts` | `CitationType` |
| 路由 | `src/router/index.tsx` | `/back/risk-alerts`、`/back/agent-config` |
| 菜单 | `src/pages/BackLayout.tsx` | 新增「风险预警」「Agent 配置」菜单项 |

---

## 四、自动化测试结果

### 4.1 全量回归（52/52 通过）

| 套件 | 用例数 | 结果 |
|------|--------|------|
| `test_sprint1_api.py` | 11 | ✅ |
| `test_sprint2_api.py` | 9 | ✅ |
| `test_sprint3_api.py` | 8 | ✅ |
| `test_sprint3_edge.py` | 5 | ✅ |
| `test_sprint5_api.py` | 6 | ✅ |
| `test_sprint6_api.py` | 6 | ✅ |
| `test_sprint7_api.py` | 7 | ✅ |
| **合计** | **52** | **✅ 全部通过** |

### 4.2 Sprint 7 专项（7/7）

| # | 测试项 | 结果 | 验证点 |
|---|--------|------|--------|
| 1 | `test_rag_index_and_search` | ✅ | 索引分块 > 0，检索「焦虑症」有结果 |
| 2 | `test_knowledge_stream_includes_citations` | ✅ | 知识意图 SSE 含 `citations` 且含 `title` |
| 3 | `test_crisis_creates_risk_alert` | ✅ | 危机消息触发 `riskLevel=3` 预警 |
| 4 | `test_agent_config_crud` | ✅ | 4 个 Agent 配置可读可写 |
| 5 | `test_rag_reindex_admin` | ✅ | 管理员重建索引 `chunkCount > 0` |
| 6 | `test_risk_alert_requires_admin` | ✅ | 普通用户访问预警列表 403 |
| 7 | `test_emotion_analysis_creates_risk_alert` | ✅ | 情绪分析 `riskLevel>=2` 写入预警表 |

### 4.3 前端构建

```
npm run build → ✅ 成功
产物体积警告：主包约 3.4MB（gzip 1.1MB），与 Sprint 4–6 相同量级
```

---

## 五、功能效果评估

### 5.1 RAG 知识检索链路

```
用户提问（知识意图）
  → router 分类 knowledge
  → RAGService.search() 余弦相似度 Top-K
  → SSE 推送 citations 元数据
  → LLM/mock 基于 context 生成回答
  → ChatWindow 展示「参考来源」链接
```

| 环节 | 状态 | 备注 |
|------|------|------|
| 文章分块 | ✅ | HTML 剥离，400 字块 + 80 重叠 |
| 启动自动索引 | ✅ | `main.py` lifespan 调用 `index_all_published` |
| 发布时增量索引 | ✅ | `update_article` / `update_article_status` 发布态触发 |
| 管理员全量重建 | ✅ | Agent 配置页 + `POST /admin/rag/reindex` |
| Mock 模式检索 | ✅ | 确定性伪向量，测试可重复 |
| 真实 Embedding | ⚠️ | 代码有 API 路径，未实测 |
| pgvector DB 检索 | ❌ | 未实现，全量在 Python 遍历 chunks |

### 5.2 风险预警中心

| 触发源 | 条件 | 状态 |
|--------|------|------|
| 对话流式 | `intent==crisis` 或危机关键词 | ✅ |
| 情绪分析接口 | `riskLevel >= 2` | ✅ |
| 去重逻辑 | 同用户+会话 pending/processing 且等级不更高则跳过 | ✅ |
| 管理端列表/筛选/处理 | 分页、状态、等级筛选、备注 | ✅ |
| 菜单待处理角标 | API 已有 `pending-count` | ❌ 前端未接入 |

### 5.3 Agent Prompt 配置

| 能力 | 状态 |
|------|------|
| 4 Agent 默认种子（listen/counsel/crisis/knowledge） | ✅ |
| 管理端编辑 systemPrompt / model / temperature 等 | ✅ |
| 运行时 `graph.py` 读取 DB Prompt | ✅ |
| `isActive=0` 时回退代码默认 Prompt | ✅ |
| 修改后无需重启（每次请求读库） | ✅ |

### 5.4 前端引用标注

| 场景 | 状态 |
|------|------|
| 流式对话中实时显示 citations | ✅ |
| 链接跳转 `/article/:articleId` | ✅ |
| 刷新页面后历史消息仍显示引用 | ❌ citations 未持久化到 `messages` 表 |
| 历史会话 API 返回 citations | ❌ 后端消息模型无该字段 |

---

## 六、问题清单（按优先级）

### 🔴 P0 — 无阻塞项

当前无导致核心功能不可用的 P0 问题。Sprint 7 可进入联调与演示（mock 模式）。

---

### 🟡 P1 — 建议修复（影响体验或数据一致性）

#### Bug #1：历史消息刷新后引用来源丢失

- **文件**：`backend/app/models/message.py`、`backend/app/agents/graph.py`、`src/hooks/useChatStream.ts`
- **问题**：`citations` 仅通过 SSE 推送到前端内存，未写入数据库；用户刷新咨询页后「参考来源」消失
- **现象**：知识问答当下可见引用，重新进入会话后只有正文
- **修复方案**：
  1. `messages` 表增加 `citations` JSON 字段（或 `metadata` JSON）
  2. 流式结束后将 citations 随 AI 消息一并持久化
  3. 会话历史 API 返回 `citations`，前端 `ChatWindow` 无需改动

---

#### Bug #2：知识意图在 LLM 模式下重复检索两次

- **文件**：`backend/app/agents/graph.py`（约 154–171 行）
- **问题**：`intent == "knowledge"` 时先 `retrieve_knowledge` 推送 citations，LLM 分支内再次 `retrieve_knowledge`
- **影响**：每次知识问答多一次 embedding + 全表扫描，延迟翻倍
- **修复方案**：复用第一次检索的 `citations` 和 `context`：

```python
citations, context = [], ""
if intent == "knowledge":
    citations, context = await retrieve_knowledge(db, user_message)
    if citations:
        yield f"data: {json.dumps({'citations': [...]}, ...)}\n\n"
# LLM 分支
if intent == "knowledge":
    messages = build_knowledge_messages(db, history, user_message, context)
```

---

#### Bug #3：管理端风险预警菜单无待处理数量角标

- **文件**：`src/pages/BackLayout.tsx`、`src/apis/admin.ts`
- **问题**：后端已有 `GET /api/admin/risk-alerts/pending-count`，`getPendingAlertCount()` 已封装，但菜单未调用
- **修复方案**：`BackLayout` 挂载时拉取 `pending-count`，在「风险预警」菜单 label 旁显示 Badge

---

### 🟢 P2 — 优化项 / 已知限制（可推迟到 Sprint 8+）

#### Bug #4：未真正使用 pgvector，大规模知识库性能受限

- **文件**：`rag_service.py`、`article_chunk.py`、`005_sprint7_rag_admin.py`
- **说明**：当前检索为 Python 遍历全部 chunk 计算相似度，文章/分块增多后 O(n) 变慢
- **建议**：迁移 `embedding` 为 `vector(384)` 列，使用 `ORDER BY embedding <=> query_vec LIMIT k`

---

#### Bug #5：文章下架后 chunk 仍留库（仅查询时过滤）

- **文件**：`backend/app/api/knowledge.py`
- **说明**：状态改为草稿时未删除 `article_chunks`，靠 JOIN `status=published` 过滤；长期会产生脏数据
- **建议**：下架时 `DELETE FROM article_chunks WHERE article_id=?`

---

#### Bug #6：新建文章直接发布不触发索引（当前创建默认为草稿）

- **文件**：`backend/app/api/knowledge.py` `create_article`
- **说明**：`create_article` 固定 `STATUS_DRAFT`，需经 `update_article_status` 发布才索引；若未来支持创建即发布会漏索引
- **建议**：创建接口若 `payload.status == PUBLISHED` 则调用 `index_article`

---

#### Bug #7：Agent 执行日志仍无管理端查看（Sprint 4–6 遗留）

- **说明**：Sprint 7 做了风险预警中心，但未做 `agent_execution_logs` 查看页
- **建议**：Sprint 8 或单独迭代增加 `/back/agent-logs`

---

#### Bug #8：管理端咨询记录仍仅显示当前管理员会话（Sprint 4–6 遗留 Bug #10）

- **文件**：`src/components/Consultations.tsx`
- **说明**：未变，需专用 `GET /api/admin/sessions`

---

#### Bug #9：Mock Embedding 语义检索质量有限

- **说明**：mock 向量为 MD5 哈希伪随机，关键词「焦虑症」能命中种子文章主要靠测试数据重合，非真实语义
- **建议**：演示/生产配置真实 Embedding API；或增加关键词 fallback 检索

---

#### Bug #10：`seed_rag_index` 启动失败静默吞掉异常

- **文件**：`backend/app/main.py` `seed_rag_index`
- **说明**：`except Exception: pass` 导致索引失败无日志
- **建议**：至少 `logger.warning` 记录异常

---

#### Bug #11：PROJECT_PLAN 与实现技术描述不一致

- **文件**：`docs/PROJECT_PLAN.md` Sprint 7 小节
- **建议**：将「pgvector 检索」改为「文章分块 + 向量相似度检索（JSON 存储，可演进 pgvector）」

---

#### Bug #12：Sprint 7 代码尚未 git commit

- **说明**：当前工作区有大量未提交变更，下一对话应先 commit 再进入 Sprint 8
- **建议提交范围**：排除 `__pycache__`、`.pytest_cache`、`test_sprint7.db`

---

## 七、Sprint 7 关键文件速查

| 用途 | 路径 |
|------|------|
| RAG 分块与检索 | `backend/app/services/rag_service.py` |
| Embedding（mock/API） | `backend/app/services/embedding_service.py` |
| 知识 Agent | `backend/app/agents/knowledge.py` |
| 编排（RAG + 预警） | `backend/app/agents/graph.py` |
| 风险预警服务 | `backend/app/services/risk_alert_service.py` |
| Prompt 配置服务 | `backend/app/services/prompt_config_service.py` |
| 管理员 RAG 重建 | `backend/app/api/rag.py` |
| 风险预警 API | `backend/app/api/risk_alerts.py` |
| Agent 配置 API | `backend/app/api/agent_config.py` |
| DB 迁移 | `backend/alembic/versions/005_sprint7_rag_admin.py` |
| Sprint 7 测试 | `backend/tests/test_sprint7_api.py` |
| 引用 UI | `src/components/chat/ChatWindow.tsx` |
| SSE citations | `src/hooks/useChatStream.ts` |
| 风险预警页 | `src/components/RiskAlertCenter.tsx` |
| Agent 配置页 | `src/components/AgentConfig.tsx` |
| 管理端 API | `src/apis/admin.ts` |

---

## 八、手动联调验证步骤

### 8.1 环境准备

```bash
# 终端 1：数据库（可选，默认 SQLite 也能跑）
docker compose -f docker-compose.dev.yml up -d postgres

# 终端 2：后端
cd backend
cp .env.example .env   # 确认 LLM_PROVIDER=mock
uvicorn app.main:app --reload --port 1235

# 终端 3：前端
npm run dev
```

### 8.2 RAG 知识问答（用户端）

1. 登录普通用户 → 进入「AI 咨询」
2. 发送：`什么是焦虑症` 或 `失眠怎么办`
3. **预期**：
   - ChatHeader 显示「知识 Agent 正在服务」（或类似文案）
   - AI 回复下方出现「参考来源」，含可点击文章链接
   - 点击链接打开 `/article/:id` 文章详情

### 8.3 风险预警（管理端）

1. 普通用户发送危机语句：`我不想活了`
2. 或创建会话后访问情绪分析（咨询页情绪花园触发）
3. 管理员登录 → `/back/risk-alerts`
4. **预期**：列表出现新预警，`riskLevel` 为 2 或 3，可筛选、处理、填写备注

### 8.4 Agent 配置（管理端）

1. 管理员 → `/back/agent-config`
2. 切换「知识 Agent」Tab，修改 System Prompt 后保存
3. 点击「重新索引已发布文章」
4. **预期**：保存成功提示；索引完成显示分块数量

### 8.5 权限校验

1. 普通用户访问 `/api/admin/risk-alerts` → 403
2. 普通用户访问 `/back/risk-alerts` → 被路由守卫重定向

---

## 九、修复任务 Checklist（供下一个对话使用）

```
Sprint 7 问题修复任务：

P1（建议联调前完成）：
- [x] Bug #1: citations 持久化到 messages 表并在历史 API 返回
- [x] Bug #2: graph.py 知识意图避免重复 retrieve_knowledge
- [x] Bug #3: BackLayout 风险预警菜单显示 pending-count 角标

P2（可推迟到 Sprint 8）：
- [ ] Bug #4: 真正接入 pgvector 向量索引
- [x] Bug #5: 文章下架时清理 article_chunks
- [ ] Bug #6: create_article 支持创建即发布时自动索引
- [ ] Bug #7: Agent 执行日志管理端查看页
- [ ] Bug #8: 管理端跨用户咨询记录（Sprint 4–6 遗留）
- [ ] Bug #9: 真实 Embedding API 验证 / 关键词 fallback
- [x] Bug #10: seed_rag_index 异常日志
- [x] Bug #11: 更新 PROJECT_PLAN 技术描述
- [ ] Bug #12: 提交 Sprint 7 代码到 git

Sprint 4–6 P2 仍开放（见 SPRINT4_6_TEST_AND_FIXES.md）：
- [x] Bug #7: 知识 Agent 接入 RAG（Sprint 7 已完成）
- [ ] Bug #8 部分: 风险预警中心已完成，执行日志查看仍缺
- [ ] Bug #10–#14: 见 Sprint 4–6 文档

验证步骤：
- [ ] cd backend && python -m pytest tests/ -v  → 52/52 通过
- [ ] npm run build 成功
- [ ] 知识问答 → 实时显示参考来源（Bug #1 修复后还需验证刷新仍可见）
- [ ] 危机消息 → 管理端预警列表可见
- [ ] Agent 配置保存 + 重建索引成功
- [ ] 可选：配置 LLM_API_KEY 验证真实 RAG + 对话
```

---

## 十、给下一个对话的 Prompt 建议

可直接复制以下内容到新对话：

---

请根据 `docs/SPRINT7_TEST_AND_FIXES.md` 处理 Sprint 7 后续工作。

背景：
- Sprint 7（RAG + 管理增强）代码已实现，52/52 pytest 通过，前端 build 成功
- 代码尚未 git commit
- 详细测试结果与 Bug 清单见文档第六节

要求：
1. 先 git commit Sprint 7 变更（排除 `__pycache__`、`.pytest_cache`、`test_sprint7.db`）
2. 修复 P1 问题（Bug #1 ~ #3）
3. 每修复一批后运行：
   - `cd backend && python -m pytest tests/ -v`
   - `npm run build`
4. P2 问题可按 Sprint 8 优先级处理
5. 修复完成后更新 `docs/SPRINT7_TEST_AND_FIXES.md` Checklist
6. 不要修改与本次任务无关的代码

参考文档：
- `docs/SPRINT7_TEST_AND_FIXES.md`（本文档）
- `docs/SPRINT4_6_TEST_AND_FIXES.md`（Sprint 4–6 遗留项）
- `docs/PROJECT_PLAN.md`（Sprint 8 规划）

---

## 十一、Sprint 7 完成标准

| 标准 | 状态 |
|------|------|
| 文章分块 + 向量检索（mock/API） | ✅ |
| 知识 RAG Agent 集成到编排图 | ✅ |
| SSE 推送 citations | ✅ |
| 前端引用来源展示 | ✅（仅当前会话） |
| 风险预警自动创建 + 管理端处理 | ✅ |
| Agent Prompt 可配置 | ✅ |
| 发布/更新文章自动索引 | ✅ |
| pytest 52/52 通过 | ✅ |
| `npm run build` 无错误 | ✅ |
| citations 历史持久化 | ✅ P1 已修 |
| pgvector 真正接入 | ⬜ P2 可演进 |
| 代码已 commit | ⬜ 待提交 |
| 真实 LLM/Embedding 联调 | ⬜ 需配置 API Key |

---

## 十二、未提交文件清单（git status 快照）

**已修改（M）**：

```
backend/.env.example
backend/app/agents/graph.py
backend/app/agents/prompts.py
backend/app/api/knowledge.py
backend/app/api/sessions.py
backend/app/core/config.py
backend/app/main.py
backend/app/models/__init__.py
backend/app/models/knowledge_article.py
docker-compose.dev.yml
docs/PROJECT_PLAN.md
src/components/chat/ChatWindow.tsx
src/hooks/useChatStream.ts
src/pages/BackLayout.tsx
src/router/index.tsx
src/types/sessionsType.ts
```

**新增未跟踪（??）**：

```
backend/alembic/versions/005_sprint7_rag_admin.py
backend/app/agents/knowledge.py
backend/app/api/agent_config.py
backend/app/api/rag.py
backend/app/api/risk_alerts.py
backend/app/models/agent_prompt_config.py
backend/app/models/article_chunk.py
backend/app/models/risk_alert.py
backend/app/schemas/agent_config.py
backend/app/schemas/risk_alert.py
backend/app/services/embedding_service.py
backend/app/services/prompt_config_service.py
backend/app/services/rag_service.py
backend/app/services/risk_alert_service.py
backend/tests/test_sprint7_api.py
src/apis/admin.ts
src/components/AgentConfig.tsx
src/components/RiskAlertCenter.tsx
src/types/adminType.ts
docs/SPRINT7_TEST_AND_FIXES.md  （本文档）
```

---

## 十三、总体结论

| 维度 | 评分 | 说明 |
|------|------|------|
| RAG 知识检索 | **80%** | 链路完整，mock 可用；非 pgvector，大规模待优化 |
| 风险预警中心 | **85%** | 触发源覆盖对话+情绪，管理端可用；缺菜单角标 |
| Agent Prompt 配置 | **90%** | CRUD + 运行时生效 + 重建索引 |
| 前端引用标注 | **75%** | 流式展示 OK，历史持久化缺失 |
| 测试覆盖 | **良好** | 52 项全通过，含 7 项 Sprint 7 专项 |
| 整体 Sprint 7 | **✅ 基本达标** | 可演示；建议修 P1 后 commit，再进 Sprint 8 |

**Sprint 7 相对 Sprint 4–6 的主要进展**：

- ✅ 闭合了 Sprint 4–6 Bug #7（知识 Agent mock → 真实 RAG 检索）
- ✅ 部分闭合 Bug #8（风险预警管理端；执行日志查看仍缺）
- ⚠️ PROJECT_PLAN 中 pgvector 描述需与实现对齐
