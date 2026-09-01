# Sprint 3 测试与修复记录

> 日期：2026-09-01  
> 范围：情绪日记、知识库、文件上传、数据统计

## 测试执行

```bash
cd backend
python -m pytest tests/test_sprint3_api.py -v
python -m pytest tests/ -v   # 全量 28 项通过
```

## 实现摘要

| 模块 | 后端路由 | 前端页面 |
|------|---------|---------|
| 情绪日记 | `diary.py` | `Diary.tsx`（提交）、`Emotional.tsx`（管理） |
| 知识库 | `knowledge.py` | `KnowledgeBase.tsx`、`Knowledge.tsx`、`Article.tsx` |
| 文件上传 | `files.py` | `ArticleDialog.tsx` |
| 数据统计 | `analytics.py` | `DashBoard.tsx` |

## 前端联调修复

- `Emotional.tsx`：删除日记后自动刷新列表并提示
- `ArticleDialog.tsx`：保存成功后回调 `onSuccess` 刷新文章列表

## 种子数据

启动后端时自动写入 4 个知识分类 + 5 篇已发布示例文章，知识库页面开箱可用。

## 本地验证步骤

1. `docker compose -f docker-compose.dev.yml up -d`
2. `cd backend && alembic upgrade head`（可选，lifespan 也会 create_all）
3. `npm run dev`
4. 普通用户：提交情绪日记、浏览知识库
5. 管理员（注册后手动改 role_id=2 或已有 admin 账号）：管理日记、文章、查看仪表盘
