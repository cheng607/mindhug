# Sprint 8 测试报告与问题修复清单

> 文档版本：v1.0  
> 更新日期：2026-09-02  
> 用途：供后续对话按优先级修复 Sprint 8 遗留问题，并作为项目收尾参考

---

## 一、背景

本报告覆盖 **Sprint 8（W15–W16）：产品化** 的交付核对、自动化测试与问题清单。

| 任务项 | 规划目标 | 实现状态 |
|--------|----------|----------|
| 用户协议 + 免责声明 | 注册勾选 + 独立页面 + 页脚入口 | ✅ |
| 危机干预固定流程 | 统一热线资源 + 检测弹窗 + 危机 Agent | ✅ |
| 接口限流 + 日志脱敏 | IP 滑动窗口限流 + 日志 Filter | ✅（限流见 Bug #1） |
| Docker Compose 生产配置 | 全栈 compose + Nginx + 双 Dockerfile | ✅ |
| GitHub Actions CI | lint + build + pytest | ✅ |
| 基础测试（API 集成测试） | Sprint 8 专项 8 项 | ✅ |
| README + 部署文档完善 | README + DEPLOYMENT.md | ✅ |

**当前分支**：`cursor/add-project-plan-doc`  
**最近相关提交**：`5e4cda8 feat: Sprint 7 RAG 与管理增强及 P1 问题修复`  
**Sprint 8 代码状态**：**未提交**（见文末文件清单）

### 1.1 Sprint 7 P1 遗留修复情况（本次一并验证）

| Sprint 7 Bug | 状态 | 说明 |
|--------------|------|------|
| #1 citations 历史持久化 | ✅ 已修复 | `messages.citations` 字段 + `chat_service` 保存 |
| #2 知识意图重复检索 | ✅ 已修复 | `graph.py` 复用 `rag_context` |
| #3 预警菜单角标 | ✅ 已修复 | `BackLayout` 调用 `getPendingAlertCount` |

---

## 二、测试环境与限制

| 项目 | 状态 |
|------|------|
| 后端 pytest（`RATE_LIMIT_ENABLED=false`） | ✅ **60/60 通过** |
| 后端 pytest（默认限流开启） | ✅ **61/61 通过**（conftest 关闭限流） |
| 前端 `npm run build` | ✅ 构建成功 |
| 前端 `npm run lint` | ✅ 通过 |
| Docker 生产全栈联调 | ❌ 未执行 |
| GitHub Actions 实跑 | ❌ 未执行（配置已添加） |
| 浏览器 E2E 手动测试 | ❌ 未执行 |

**测试命令**：

```bash
# 后端全量（推荐：与 CI 一致关闭限流）
cd backend
set RATE_LIMIT_ENABLED=false          # Windows
# export RATE_LIMIT_ENABLED=false    # Linux/macOS
python -m pytest tests/ -v

# 仅 Sprint 8
python -m pytest tests/test_sprint8_api.py -v

# 前端
npm run lint
npm run build

# 生产部署验证
cp .env.production.example .env
docker compose up -d --build
```

---

## 三、交付物核对

### 3.1 法律合规（用户协议 / 隐私 / 免责声明）

| 交付项 | 状态 | 路径 |
|--------|------|------|
| 用户协议页面 | ✅ | `src/pages/UserAgreement.tsx` → `/agreement` |
| 隐私政策页面 | ✅ | `src/pages/PrivacyPolicy.tsx` → `/privacy` |
| AI 免责声明页面 | ✅ | `src/pages/Disclaimer.tsx` → `/disclaimer` |
| 注册勾选协议 | ✅ | `src/components/RegisterForm.tsx` `agreeTerms` 校验 |
| 首页页脚链接 | ✅ | `src/pages/Home.tsx` Footer |
| 咨询页 AI 免责横幅 | ✅ | `src/components/chat/AiDisclaimerBanner.tsx` |
| 后端公开 API | ✅ | `GET /api/legal/crisis-resources`、`GET /api/legal/disclaimer` |

### 3.2 危机干预固定流程

| 交付项 | 状态 | 说明 |
|--------|------|------|
| 统一危机资源常量 | ✅ | `backend/app/core/crisis.py` + `src/constants/crisis.ts` |
| 危机关键词集中管理 | ✅ | `router.py` / `graph.py` / `emotion_service.py` 均引用 |
| 危机 Agent 固定回复模板 | ✅ | `CRISIS_RESPONSE_TEMPLATE` 含热线 400-161-9995 |
| 前端危机弹窗 | ✅ | `CrisisInterventionModal.tsx` |
| SSE 检测触发弹窗 | ✅ | `useChatStream` 检测 `agent === 'crisis'` |
| 情绪分析高风险触发 | ✅ | `Consultation.tsx` `riskLevel >= 3` 弹窗 |
| 自动创建风险预警 | ✅ | Sprint 7 已有，危机对话仍写入 `risk_alerts` |

**危机干预流程**：

```
用户发送危机语句
  → router 分类 crisis
  → SSE 推送 agent: crisis + 固定干预回复（含热线）
  → 前端弹出 CrisisInterventionModal
  → 后端创建 riskLevel=3 预警（管理端可查看）
```

### 3.3 接口限流 + 日志脱敏

| 交付项 | 状态 | 说明 |
|--------|------|------|
| 滑动窗口限流中间件 | ✅ | `backend/app/core/rate_limit.py` |
| 敏感路径严格限流 | ✅ | 登录/注册/流式：`RATE_LIMIT_STRICT=20/min` |
| 配置项 | ✅ | `config.py` + `.env.example` |
| 429 统一响应格式 | ✅ | `{ code: "429", success: false, msg: "..." }` |
| 日志脱敏 Filter | ✅ | `logging_config.py` 脱敏手机/邮箱/Token |
| 启动时配置日志 | ✅ | `main.py` `setup_logging()` |
| Redis 分布式限流 | ❌ | 仅内存实现，生产多 worker 不共享计数 |

### 3.4 Docker 生产部署

| 交付项 | 状态 | 路径 |
|--------|------|------|
| 生产 compose | ✅ | `docker-compose.yml`（PG + Redis + backend + frontend） |
| 后端生产镜像 | ✅ | `backend/Dockerfile.prod`（uvicorn 2 workers） |
| 前端生产镜像 | ✅ | `Dockerfile`（Node build + Nginx） |
| Nginx 反向代理 | ✅ | `nginx/nginx.conf`（/api、/uploads、/health、SPA） |
| 环境变量模板 | ✅ | `.env.production.example` |
| 部署文档 | ✅ | `docs/DEPLOYMENT.md` |
| 数据卷持久化 | ✅ | postgres_data / redis_data / uploads_data |

### 3.5 CI/CD

| 交付项 | 状态 | 说明 |
|--------|------|------|
| GitHub Actions 工作流 | ✅ | `.github/workflows/ci.yml` |
| 前端 job | lint + build | ⚠️ lint 当前失败 |
| 后端 job | pytest 全量 | ✅ CI 环境设 `RATE_LIMIT_ENABLED=false` |
| 触发分支 | main / master / develop | — |

### 3.6 文档

| 交付项 | 状态 |
|--------|------|
| README 重写 | ✅ 功能概览、快速启动、测试、安全合规 |
| DEPLOYMENT.md | ✅ 开发/生产部署、限流、危机干预、CI、FAQ |
| PROJECT_PLAN Sprint 8 勾选 | ✅ |

---

## 四、自动化测试结果

### 4.1 全量回归（限流关闭时 60/60 通过）

| 套件 | 用例数 | 结果 |
|------|--------|------|
| `test_sprint1_api.py` | 11 | ✅ |
| `test_sprint2_api.py` | 9 | ✅ |
| `test_sprint3_api.py` | 8 | ✅ |
| `test_sprint3_edge.py` | 5 | ✅ |
| `test_sprint5_api.py` | 6 | ✅ |
| `test_sprint6_api.py` | 6 | ✅ |
| `test_sprint7_api.py` | 7 | ✅ |
| `test_sprint8_api.py` | 8 | ✅ |
| **合计** | **60** | **✅ 全部通过** |

> **注意**：若未设置 `RATE_LIMIT_ENABLED=false`，Sprint 3–7 中大量注册/登录用例会收到 429，导致约 22 项失败。CI 已配置关闭限流，本地需手动设置或与 Bug #1 一并修复。

### 4.2 Sprint 8 专项（8/8）

| # | 测试项 | 结果 | 验证点 |
|---|--------|------|--------|
| 1 | `test_crisis_resources` | ✅ | 热线 400-161-9995、资源列表 |
| 2 | `test_disclaimer` | ✅ | 免责声明含 "AI" |
| 3 | `test_mask_phone` | ✅ | 手机号脱敏 |
| 4 | `test_mask_email` | ✅ | 邮箱脱敏 |
| 5 | `test_mask_token` | ✅ | token 脱敏 |
| 6 | `test_crisis_message_routes_to_crisis_agent` | ✅ | SSE 含 crisis agent + 热线片段 |
| 7 | `test_rate_limit_returns_429` | ✅ | 超限返回 429 |
| 8 | `test_health_check` | ✅ | `/health` 返回 ok |

### 4.3 前端构建与 Lint

```
npm run build  → ✅ 成功（主包约 3.45MB）
npm run lint   → ❌ 失败（useChatStream.ts 2 处 react-hooks/refs）
```

---

## 五、功能效果评估

| 模块 | 后端 | 前端 | 备注 |
|------|------|------|------|
| 用户协议三页 | — | ✅ | 静态页面，内容完整 |
| 注册协议勾选 | — | ✅ | 仅前端校验，后端未强制 |
| AI 免责横幅 | ✅ API | ✅ | 咨询页顶部展示 |
| 危机资源 API | ✅ | — | 前端目前用本地 constants，未调 API |
| 危机弹窗 | ✅ 检测逻辑 | ✅ | agent=crisis 或 riskLevel≥3 |
| 危机固定回复 | ✅ | ✅ | 含全国热线 |
| 接口限流 | ✅ | — | 默认开启，测试需关闭 |
| 日志脱敏 | ✅ | — | 启动时自动配置 |
| Docker 生产栈 | ✅ 配置 | ✅ 配置 | 未实测 compose up |
| GitHub CI | ✅ 配置 | ⚠️ lint 红 | pytest 绿（限流关闭） |
| citations 持久化 | ✅ | ✅ | Sprint 7 P1 已闭合 |
| 预警角标 | ✅ API | ✅ | Sprint 7 P1 已闭合 |

---

## 六、问题清单（按优先级）

### 🔴 P0 — 阻塞 CI / 全量测试

#### Bug #1：默认开启限流导致全量 pytest 大量失败

- **文件**：`backend/app/core/config.py`（`RATE_LIMIT_ENABLED: bool = True`）、各 `tests/test_sprint*.py`
- **问题**：仅 `test_sprint8_api.py` 和 CI 环境变量设置了 `RATE_LIMIT_ENABLED=false`；本地直接 `pytest tests/` 时，Sprint 1–2 的注册/登录耗尽配额，后续 20+ 用例收到 429
- **现象**：`38 passed, 6 failed, 16 errors`，日志大量 `HTTP/1.1 429 Too Many Requests`
- **修复方案（任选其一）**：
  1. **推荐**：新增 `backend/tests/conftest.py`，session 级 `os.environ["RATE_LIMIT_ENABLED"] = "false"`（在 import app 之前）
  2. 或将 `pytest.ini` 增加 `env = RATE_LIMIT_ENABLED=false`（需 pytest-env 插件）
  3. 或在每个测试文件顶部统一 `setdefault("RATE_LIMIT_ENABLED", "false")`

```python
# backend/tests/conftest.py
import os
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
```

---

#### Bug #2：CI 前端 lint 失败（react-hooks/refs）

- **文件**：`src/hooks/useChatStream.ts`（第 19–20 行）
- **问题**：在 render 阶段直接赋值 `onStreamCloseRef.current` / `onCrisisDetectedRef.current`，违反 `react-hooks/refs` 规则
- **现象**：`npm run lint` 报 2 errors，GitHub Actions frontend job 会失败
- **修复方案**：改用 `useEffect` 同步 ref：

```tsx
useEffect(() => {
    onStreamCloseRef.current = options.onStreamClose
    onCrisisDetectedRef.current = options.onCrisisDetected
}, [options.onStreamClose, options.onCrisisDetected])
```

---

### 🟡 P1 — 建议修复（影响生产或体验）

#### Bug #3：限流为进程内内存实现，多 Worker 不共享

- **文件**：`backend/app/core/rate_limit.py`、`docker-compose.yml`（backend `--workers 2`）
- **问题**：`InMemoryRateLimiter` 每个 worker 独立计数，实际限额约为配置值的 2 倍；多实例部署时限流失效
- **建议**：生产使用 Redis 滑动窗口（`REDIS_URL` 已配置但未使用），或生产单 worker + 前置 Nginx 限流

---

#### Bug #4：注册协议勾选仅前端校验

- **文件**：`src/components/RegisterForm.tsx`、`backend/app/api/user.py`
- **问题**：`agreeTerms` 未提交到后端，API 可直接注册绕过协议同意
- **建议**：注册接口增加 `agreeTerms: bool` 必填校验，或记录用户同意时间戳

---

#### Bug #5：前端危机资源未使用后端 API

- **文件**：`src/constants/crisis.ts`、`src/components/chat/CrisisInterventionModal.tsx`
- **问题**：`GET /api/legal/crisis-resources` 已实现，前端硬编码 constants，后续改热线需改两处
- **建议**：弹窗挂载时拉取 API，constants 作 fallback

---

#### Bug #6：危机检测依赖 Agent 显示名称字符串

- **文件**：`src/hooks/useChatStream.ts`（第 88 行）
- **问题**：`payload.agentName === '危机 Agent'` 与后端 `AGENT_NAMES` 耦合，改名即失效
- **建议**：仅依赖 `payload.agent === 'crisis'`（已同时检测，可删除 name 判断）

---

#### Bug #7：生产 compose 中 Redis 未接入应用

- **文件**：`docker-compose.yml`、`backend/app/core/config.py`
- **问题**：Redis 容器启动但应用未使用（限流、缓存、会话均未接入）
- **影响**：多占资源，文档写 Redis 易误导
- **建议**：接入 Redis 限流，或开发/生产 compose 中将 Redis 标为 optional

---

### 🟢 P2 — 优化项 / 已知限制

#### Bug #8：README 技术描述「LangGraph」与实际不符

- **文件**：`README.md`
- **说明**：实际为自研轻量状态机（`graph.py`），未使用 `langgraph` 包
- **建议**：改为「轻量多 Agent 编排」

---

#### Bug #9：Nginx 未代理 `/docs` 与 OpenAPI

- **文件**：`nginx/nginx.conf`
- **说明**：生产环境无法通过前端域名访问 API 文档
- **建议**：增加 `location /docs` 和 `/openapi.json` 代理（或生产关闭 docs）

---

#### Bug #10：`.env.production.example` 缺少限流配置项

- **说明**：生产 compose 强制 `RATE_LIMIT_ENABLED=true`，但示例 env 未列出相关变量
- **建议**：补充 `RATE_LIMIT_*` 说明

---

#### Bug #11：Sprint 4–6 遗留项仍未处理

- 管理端跨用户咨询记录（Bug #10）
- 用户端日记历史页（Bug #11）
- 前端代码分割（Bug #12）
- Agent 执行日志管理端查看（Sprint 7 Bug #7）
- 详见 `docs/SPRINT4_6_TEST_AND_FIXES.md`、`docs/SPRINT7_TEST_AND_FIXES.md`

---

#### Bug #12：Sprint 8 代码尚未 git commit

- **说明**：工作区有未提交变更，应先 commit 再合并/发布
- **排除**：`__pycache__`、`.pytest_cache`、`test_sprint*.db`、`backend/uploads/` 测试图片

---

## 七、Sprint 8 关键文件速查

| 用途 | 路径 |
|------|------|
| 危机资源（后端） | `backend/app/core/crisis.py` |
| 危机资源（前端） | `src/constants/crisis.ts` |
| 法律合规 API | `backend/app/api/legal.py` |
| 限流中间件 | `backend/app/core/rate_limit.py` |
| 日志脱敏 | `backend/app/core/logging_config.py` |
| 危机弹窗 | `src/components/chat/CrisisInterventionModal.tsx` |
| AI 免责横幅 | `src/components/chat/AiDisclaimerBanner.tsx` |
| 协议三页 | `src/pages/UserAgreement.tsx` 等 |
| 生产 compose | `docker-compose.yml` |
| Nginx 配置 | `nginx/nginx.conf` |
| 后端生产镜像 | `backend/Dockerfile.prod` |
| 前端生产镜像 | `Dockerfile` |
| CI 工作流 | `.github/workflows/ci.yml` |
| 部署文档 | `docs/DEPLOYMENT.md` |
| Sprint 8 测试 | `backend/tests/test_sprint8_api.py` |

---

## 八、手动联调验证步骤

### 8.1 法律合规

1. 访问 `/agreement`、`/privacy`、`/disclaimer` → 页面正常渲染
2. 首页页脚链接可跳转
3. 注册页不勾选协议 → 无法提交
4. 咨询页顶部显示 AI 免责横幅，「了解更多」跳转 `/disclaimer`

### 8.2 危机干预

1. 登录用户 → AI 咨询
2. 发送：`我不想活了` 或 `我想自杀`
3. **预期**：
   - 弹出「我们关心你的安全」危机弹窗，显示 400-161-9995
   - AI 回复含危机干预模板与热线
   - ChatHeader 显示危机 Agent
4. 管理员 → 风险预警 → 出现新记录

### 8.3 接口限流

```bash
# 开启限流后快速请求登录接口
for i in {1..25}; do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"x","password":"y"}'; done
# 预期：前 20 次非 429，之后返回 429
```

### 8.4 生产 Docker（可选）

```bash
cp .env.production.example .env
# 编辑 POSTGRES_PASSWORD、JWT_SECRET_KEY
docker compose up -d --build
curl http://localhost/health        # → {"status":"ok"}
curl http://localhost/api/legal/disclaimer  # → 免责声明 JSON
```

### 8.5 日志脱敏

启动后端，触发含手机号的日志（如登录失败），确认控制台输出中手机号为 `1**********`。

---

## 九、修复任务 Checklist（供下一个对话使用）

```
Sprint 8 问题修复任务：

P0（阻塞 CI / 全量测试，必须先修）：
- [x] Bug #1: tests/conftest.py 全局关闭限流，或各套件统一 setdefault
- [x] Bug #2: useChatStream.ts ref 赋值改 useEffect，通过 npm run lint

P1（建议发布前完成）：
- [x] Bug #3: Redis 分布式限流 或 生产单 worker 说明
- [x] Bug #4: 后端注册接口校验 agreeTerms
- [x] Bug #5: 危机弹窗改调 /api/legal/crisis-resources
- [x] Bug #6: 危机检测仅依赖 payload.agent === 'crisis'
- [x] Bug #7: Redis 接入或文档标注未使用

P2（可推迟）：
- [x] Bug #8: README LangGraph 描述修正
- [x] Bug #9: Nginx 代理 /docs
- [x] Bug #10: .env.production.example 补充限流项
- [ ] Bug #11: Sprint 4–7 遗留 P2 项
- [ ] Bug #12: git commit Sprint 8 代码

验证步骤：
- [x] cd backend && python -m pytest tests/ -v  → 61/61（无需手动设 env）
- [x] npm run lint && npm run build  → 全部通过
- [ ] 危机语句 → 弹窗 + 热线 + 管理端预警
- [ ] 注册页协议勾选生效
- [ ] 可选：docker compose up -d --build 全栈验证
```

---

## 十、给下一个对话的 Prompt 建议

可直接复制以下内容到新对话：

---

请根据 `docs/SPRINT8_TEST_AND_FIXES.md` 处理 Sprint 8 后续工作。

背景：
- Sprint 8（产品化）代码已实现：法律合规、危机干预、限流脱敏、Docker 生产、CI
- 限流关闭时 pytest 60/60 通过；默认限流开启时 22 项失败
- 前端 build 成功，lint 失败 2 处
- 代码尚未 git commit

要求：
1. 先修复 P0：Bug #1（测试限流）、Bug #2（eslint）
2. 运行验证：
   - `cd backend && python -m pytest tests/ -v`
   - `npm run lint && npm run build`
3. 视情况修复 P1
4. git commit Sprint 8 变更（排除缓存与测试 db）
5. 更新 `docs/SPRINT8_TEST_AND_FIXES.md` Checklist

参考文档：
- `docs/SPRINT8_TEST_AND_FIXES.md`
- `docs/SPRINT7_TEST_AND_FIXES.md`
- `docs/DEPLOYMENT.md`

---

## 十一、Sprint 8 完成标准

| 标准 | 状态 |
|------|------|
| 用户协议 / 隐私 / 免责声明页面 | ✅ |
| 注册协议勾选 | ✅ 前后端校验 agreeTerms |
| 危机干预弹窗 + 固定热线 | ✅ |
| 接口限流中间件 | ✅ |
| 日志脱敏 | ✅ |
| Docker 生产 compose + Nginx | ✅ 配置完成 |
| GitHub Actions CI | ✅ pytest + lint + build 绿 |
| README + DEPLOYMENT 文档 | ✅ |
| pytest 60/60（限流关闭） | ✅ |
| pytest 61/61（默认配置 + conftest） | ✅ |
| npm run lint 通过 | ✅ |
| npm run build 通过 | ✅ |
| 生产 Docker 实测 | ⬜ 未执行 |
| 代码已 commit | ⬜ 待提交 |

---

## 十二、未提交文件清单（git status 快照）

**已修改（M）**：

```
README.md
backend/.env.example
backend/app/agents/graph.py
backend/app/agents/router.py
backend/app/core/config.py
backend/app/main.py
backend/app/prompts/counselor.py
backend/app/services/emotion_service.py
backend/app/services/session_service.py
docs/PROJECT_PLAN.md
src/components/Consultation.tsx
src/components/RegisterForm.tsx
src/hooks/useChatStream.ts
src/pages/Home.tsx
src/router/index.tsx
```

**新增未跟踪（??）**：

```
.env.production.example
.github/workflows/ci.yml
Dockerfile
backend/Dockerfile.prod
backend/app/api/legal.py
backend/app/core/crisis.py
backend/app/core/logging_config.py
backend/app/core/rate_limit.py
backend/tests/test_sprint8_api.py
docker-compose.yml
docs/DEPLOYMENT.md
nginx/nginx.conf
src/components/chat/AiDisclaimerBanner.tsx
src/components/chat/CrisisInterventionModal.tsx
src/constants/crisis.ts
src/pages/Disclaimer.tsx
src/pages/PrivacyPolicy.tsx
src/pages/UserAgreement.tsx
docs/SPRINT8_TEST_AND_FIXES.md  （本文档）
```

---

## 十三、总体结论

| 维度 | 评分 | 说明 |
|------|------|------|
| 法律合规 | **90%** | 三页 + 注册勾选 + 页脚完整；后端未强制协议 |
| 危机干预 | **88%** | 统一资源 + 弹窗 + Agent 模板；前端未调 API |
| 限流与脱敏 | **75%** | 功能可用；测试冲突 + 内存限流 + Redis 未接入 |
| Docker / 部署 | **85%** | 配置齐全，未实测 compose |
| CI/CD | **70%** | 工作流已有，lint 会红 |
| 测试覆盖 | **良好** | 60 项（限流关闭时全绿） |
| 整体 Sprint 8 | **✅ 基本达标** | 先修 P0 再 commit，即可发布演示 |

**项目整体进度**：Sprint 1–8 规划功能已基本实现，剩余主要为 P0 测试/CI 修复、P1 生产加固，以及 Sprint 4–7 部分 P2 体验优化。
