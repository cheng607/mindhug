# Sprint 1 测试报告与问题修复清单

> 文档版本：v1.0  
> 更新日期：2026-09-01  
> 用途：供后续对话按优先级修复 Sprint 1 遗留问题

---

## 一、背景

Sprint 1 目标为搭建项目地基，包括：

- 创建 `backend/` FastAPI 后端
- Docker Compose（PostgreSQL + Redis + Backend）
- 用户认证 API（login / register / logout）
- 前端 `.env` 环境变量改造，移除硬编码 IP
- 编写 `docs/API_CONTRACT.md` 接口对照文档

**当前分支**：`cursor/add-project-plan-doc`（Sprint 1 代码尚未提交）

---

## 二、测试环境与限制

| 项目 | 状态 |
|------|------|
| 后端 API 脚本测试 | ✅ 已执行（SQLite 内存库） |
| 前端 `npm run build` | ✅ 构建通过 |
| Docker Compose 启动 | ❌ 未执行（本机 Docker Desktop 未运行） |
| 前后端联调 | ❌ 未执行 |

**启动全栈环境命令**（修复后验证用）：

```bash
# 1. 启动后端基础设施
docker compose -f docker-compose.dev.yml up -d

# 2. 启动前端
npm install
npm run dev

# 3. 验证后端健康检查
curl http://localhost:8000/health
```

---

## 三、后端 API 测试结果

测试脚本：`backend/tests/test_sprint1_api.py`（临时创建，可保留并正式化）

运行方式：

```bash
cd backend
python tests/test_sprint1_api.py
```

**结果：11/11 通过**（含 userType=2 注册被忽略测试）

| # | 测试项 | 结果 |
|---|--------|------|
| 1 | `GET /health` | ✅ |
| 2 | `POST /api/user/add` 注册 | ✅ |
| 3 | 重复用户名注册 → 400 | ✅ |
| 4 | 密码不一致 → 422 | ✅ |
| 5 | `POST /api/user/login` 用户名登录 | ✅ |
| 6 | `POST /api/user/login` 邮箱登录 | ✅ |
| 7 | 错误密码 → 400 | ✅ |
| 8 | `POST /api/user/logout` 无 Token → 401 | ✅ |
| 9 | `POST /api/user/logout` 有 Token → 200 | ✅ |
| 10 | 登录响应 `userInfo` 字段完整性 | ✅ |

---

## 四、问题清单（按优先级）

### 🔴 P0 — 必须立即修复（阻塞联调/构建）

#### Bug #1：登录成功后跳转到不存在的路由

- **文件**：`src/components/LoginForm.tsx`
- **行号**：约第 26 行
- **问题**：普通用户登录成功后 `navigate('/front')`，但路由配置中不存在 `/front`
- **现象**：用户登录后进入 404 页面
- **修复方案**：将 `/front` 改为 `/` 或 `/consultation`

```tsx
// 当前（错误）
} else if (res.data.roleType == '1') {
    navigate('/front')
}

// 修复为
} else if (res.data.roleType == '1') {
    navigate('/')
}
```

**关联**：`docs/API_CONTRACT.md` 第 70 行也写了 `跳转 /front`，需同步修改。

---

#### Bug #2：`KnowledgeBase.tsx` 重复 import 导致构建失败

- **文件**：`src/components/KnowledgeBase.tsx`
- **行号**：第 7-8 行
- **问题**：`fileBaseUrl` 被 import 了两次
- **现象**：`npm run build` 报错 `TS2300: Duplicate identifier 'fileBaseUrl'`
- **修复方案**：删除重复的一行 import

```tsx
// 当前（错误）
import { fileBaseUrl } from '../config';
import { fileBaseUrl } from '../config';

// 修复为
import { fileBaseUrl } from '../config';
```

---

#### Bug #3：`BackLayout.tsx` 重复 import 导致构建失败

- **文件**：`src/pages/BackLayout.tsx`
- **行号**：第 16-17 行
- **问题**：同 Bug #2
- **修复方案**：删除重复的一行 import

---

#### Bug #4：注册接口允许任意用户注册为管理员（安全漏洞）

- **文件**：`backend/app/services/user_service.py`、`backend/app/schemas/user.py`
- **问题**：注册请求中的 `userType: 2` 会被接受，任何人可注册为管理员
- **验证方式**：

```bash
# 传入 userType: 2 注册，返回 userType: 2，登录后 roleType: "2"
curl -X POST http://localhost:8000/api/user/add \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","email":"h@t.com","password":"123456","confirmPassword":"123456","gender":1,"userType":2}'
```

- **修复方案（二选一或组合）**：
  1. **后端**：注册时忽略客户端传入的 `userType`，强制设为 `1`
  2. **后端**：从 `RegisterRequest` 中移除 `userType` 字段
  3. **后端**：仅管理员可创建管理员账号（Sprint 1 可先强制为 1）

```python
# backend/app/services/user_service.py create_user 方法中
# 将：
role = self.db.query(Role).filter(Role.code == data.userType).first()
# 改为：
role = self.db.query(Role).filter(Role.code == 1).first()  # 注册强制普通用户
```

---

### 🟡 P1 — 建议修复（影响用户体验）

#### Bug #5：登录/注册失败无用户可见的错误提示

- **文件**：
  - `src/components/LoginForm.tsx`（约第 28-30 行）
  - `src/components/RegisterForm.tsx`（约第 19-21 行）
- **问题**：`catch` 块仅 `console.error`，未调用 `message.error`
- **修复方案**：

```tsx
import { message } from 'antd';

// catch 块中添加
catch (error) {
    message.error((error as Error).message || '操作失败，请重试');
    console.error(error);
}
```

---

#### Bug #6：FastAPI 422 校验错误格式与前端不统一

- **文件**：`backend/app/main.py`（需新增全局异常处理）
- **问题**：Pydantic 校验失败返回 `{"detail": [...]}` 格式，前端 `request.ts` 无法解析，显示「服务器异常」
- **触发场景**：注册时邮箱格式错误、密码过短等
- **修复方案**：在 `main.py` 添加 `RequestValidationError` 处理器，转为统一格式：

```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "参数校验失败") if errors else "参数校验失败"
    return JSONResponse(
        status_code=422,
        content={"code": "422", "data": None, "msg": msg, "success": False},
    )
```

---

#### Bug #7：注册表单初始值含无意义空格

- **文件**：`src/components/RegisterForm.tsx`
- **行号**：约第 29-35 行
- **问题**：`phone: ' '`、`nickname: ' '` 作为 initialValues
- **修复方案**：改为空字符串 `''` 或移除 initialValues 中的这两个字段

---

### 🟢 P2 — 优化项（不阻塞，可后续处理）

#### Bug #8：管理端头像 URL 拼接问题

- **文件**：`src/pages/BackLayout.tsx` 约第 152 行
- **问题**：`${fileBaseUrl}/api${userInfo?.avatar}`，avatar 为空时显示破损图片
- **修复方案**：avatar 为空时使用默认头像或不渲染 `src`

---

#### Bug #9：`.env.development` 未加入 `.gitignore`

- **文件**：`.gitignore`
- **问题**：仅忽略了 `.env` 和 `.env.local`，`.env.development` 可能被误提交
- **修复方案**：在 `.gitignore` 的 Environment 段添加 `.env.development`、`.env.production`（保留 `.env.example` 可提交）

---

#### Bug #10：缺少正式后端测试

- **问题**：`backend/tests/` 仅有临时测试脚本，未集成 pytest
- **修复方案**：
  1. 添加 `pytest`、`httpx` 到 `requirements.txt` 或 `requirements-dev.txt`
  2. 将 `test_sprint1_api.py` 改为 pytest 格式
  3. 添加 `pytest.ini` 或 `pyproject.toml` 配置

---

#### Bug #11：README 缺少 Sprint 1 启动说明

- **文件**：`README.md`
- **问题**：未说明如何启动 Docker、后端、前端进行联调
- **修复方案**：补充「本地开发」章节，包含 Docker 启动、环境变量配置、前后端联调步骤

---

## 五、Sprint 1 未提交的文件清单

以下文件/目录为 Sprint 1 新增或修改，**尚未 git commit**：

### 新增

```
backend/                    # 整个后端目录
docker-compose.dev.yml
docs/API_CONTRACT.md
.env.example
.env.development
.env.production
backend/tests/test_sprint1_api.py  # 临时测试脚本
```

### 修改

```
.gitignore
vite.config.ts
src/config/index.ts
src/utils/request.ts
src/components/KnowledgeBase.tsx
src/pages/BackLayout.tsx
```

---

## 六、修复任务 Checklist（供下一个对话使用）

复制以下清单到下一个对话，按顺序处理：

```
Sprint 1 问题修复任务：

P0（必须先做）：
- [x] Bug #2: 删除 KnowledgeBase.tsx 重复 import
- [x] Bug #3: 删除 BackLayout.tsx 重复 import
- [x] Bug #1: LoginForm.tsx 跳转路径 /front → /
- [x] Bug #1: 同步修改 docs/API_CONTRACT.md 中的 /front 描述
- [x] Bug #4: 注册接口禁止 userType=2，强制普通用户
- [x] 验证 npm run build 通过

P1（联调前建议做）：
- [x] Bug #5: LoginForm / RegisterForm 添加 message.error 提示
- [x] Bug #6: 后端添加 422 校验错误统一格式处理
- [x] Bug #7: RegisterForm 初始值空格问题

P2（可选）：
- [x] Bug #8: BackLayout 空头像处理
- [x] Bug #9: .gitignore 补充 .env.development
- [x] Bug #10: 正式化 pytest 测试
- [x] Bug #11: README 补充启动文档

验证步骤：
- [ ] docker compose -f docker-compose.dev.yml up -d（需 Docker Desktop 运行）
- [ ] curl http://localhost:8000/health
- [x] npm run build 成功
- [ ] npm run dev 启动前端
- [ ] 浏览器测试：注册 → 登录 → 跳转首页（非 404）
- [ ] 浏览器测试：退出登录
- [x] pytest backend/tests/test_sprint1_api.py 11/11 通过
- [x] 尝试 userType=2 注册应被忽略（强制 userType=1）
```

---

## 七、关键文件路径速查

| 用途 | 路径 |
|------|------|
| 登录表单 | `src/components/LoginForm.tsx` |
| 注册表单 | `src/components/RegisterForm.tsx` |
| 路由配置 | `src/router/index.tsx` |
| 路由守卫 | `src/router/RouteGuards.tsx` |
| API 请求封装 | `src/utils/request.ts` |
| 环境变量配置 | `src/config/index.ts` |
| 前端环境变量 | `.env.development` |
| Vite 代理配置 | `vite.config.ts` |
| 后端入口 | `backend/app/main.py` |
| 用户 API | `backend/app/api/user.py` |
| 用户服务 | `backend/app/services/user_service.py` |
| 用户模型 | `backend/app/models/user.py` |
| 注册/登录 Schema | `backend/app/schemas/user.py` |
| JWT 鉴权依赖 | `backend/app/core/deps.py` |
| Docker 配置 | `docker-compose.dev.yml` |
| API 契约文档 | `docs/API_CONTRACT.md` |
| 项目总体规划 | `docs/PROJECT_PLAN.md` |

---

## 八、给下一个对话的 Prompt 建议

可直接复制以下内容到新对话：

---

请根据 `docs/SPRINT1_TEST_AND_FIXES.md` 修复 Sprint 1 遗留问题。

要求：
1. 先修复所有 P0 问题（Bug #1 ~ #4），确保 `npm run build` 通过
2. 再修复 P1 问题（Bug #5 ~ #7）
3. 每修复一批后运行验证：`npm run build` 和 `python backend/tests/test_sprint1_api.py`
4. 修复完成后更新本文档，将对应 Checklist 项标记为已完成
5. 不要修改与 Sprint 1 修复无关的代码

---

## 九、Sprint 1 完成标准（修复后应满足）

- [x] `npm run build` 无错误
- [x] `pytest backend/tests/test_sprint1_api.py` 11/11 通过
- [ ] `docker compose -f docker-compose.dev.yml up -d` 可启动（需 Docker Desktop）
- [ ] 用户可注册、登录、退出，登录后跳转正确页面（待浏览器联调）
- [x] 无法通过注册接口获得管理员权限
- [x] 登录/注册失败有明确错误提示
