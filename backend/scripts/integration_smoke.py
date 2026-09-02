"""全链路 API 联调冒烟测试（对应 FULL_PROJECT_TEST_AND_ISSUES.md 第七节）。"""
import json
import sys
import uuid

import httpx

BASE = "http://127.0.0.1:1235"
PASS = 0
FAIL = 0


def ok(name: str, cond: bool, detail: str = ""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} {detail}")


def main() -> int:
    suffix = uuid.uuid4().hex[:8]
    user = {
        "username": f"smoke_{suffix}",
        "email": f"smoke_{suffix}@test.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    admin_login = {"username": "admin_smoke", "password": "123456"}

    print("=== 用户路径 ===")
    with httpx.Client(base_url=BASE, timeout=60.0) as c:
        # 注册协议校验
        r = c.post("/api/user/add", json={**user, "agreeTerms": False})
        ok("注册不勾选协议应失败", r.status_code == 422 or r.json().get("success") is False)

        r = c.post("/api/user/add", json=user)
        ok("用户注册", r.status_code == 200 and r.json().get("code") == "200")

        r = c.post("/api/user/login", json={"username": user["username"], "password": user["password"]})
        body = r.json()
        ok("用户登录", body.get("code") == "200" and body["data"].get("token"))
        user_token = body["data"]["token"]
        uh = {"token": user_token}

        # 创建管理员（若不存在则注册 admin 类型会被忽略，用 seed 或现有 admin）
        # 使用 analytics 需要 admin - 尝试注册 admin 用户
        admin_user = {
            "username": f"admin_{suffix}",
            "email": f"admin_{suffix}@test.com",
            "password": "123456",
            "confirmPassword": "123456",
            "gender": 1,
            "agreeTerms": True,
            "userType": 2,
        }
        c.post("/api/user/add", json=admin_user)
        r = c.post("/api/user/login", json={"username": admin_user["username"], "password": "123456"})
        ab = r.json()
        admin_token = ab["data"].get("token") if ab.get("code") == "200" else None
        if admin_token:
            from sqlalchemy import create_engine, text
            eng = create_engine("sqlite:///./test_integration.db")
            with eng.begin() as conn:
                conn.execute(
                    text(
                        "UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 2 LIMIT 1) "
                        "WHERE username = :u"
                    ),
                    {"u": admin_user["username"]},
                )
            r = c.post("/api/user/login", json={"username": admin_user["username"], "password": "123456"})
            admin_token = r.json()["data"]["token"]
        ah = {"token": admin_token} if admin_token else {}

        # 会话 + 流式
        r = c.post("/api/psychological-chat/session/start", headers=uh, json={"sessionTitle": "联调测试"})
        sid = r.json()["data"]["sessionId"]
        ok("创建会话", r.status_code == 200)

        # 知识问答
        cite_found = False
        with c.stream(
            "POST",
            "/api/psychological-chat/stream",
            headers={**uh, "Accept": "text/event-stream"},
            json={"sessionId": sid, "userMessage": "什么是焦虑症"},
        ) as stream:
            ok("知识问答 SSE", stream.status_code == 200)
            for line in stream.iter_lines():
                if not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload == "[DONE]":
                    break
                data = json.loads(payload)
                if data.get("citations"):
                    cite_found = True

        ok("知识问答含 citations", cite_found)

        # 刷新后引用仍在
        r = c.get(f"/api/psychological-chat/sessions/{sid}/messages", headers=uh)
        msgs = r.json()["data"]
        persisted = any(m.get("citations") for m in msgs if m.get("senderType") == 2)
        ok("刷新后 citations 持久化", persisted)

        # 危机语句
        r = c.post("/api/psychological-chat/session/start", headers=uh, json={"sessionTitle": "危机测试"})
        crisis_sid = r.json()["data"]["sessionId"]
        crisis_agent = False
        with c.stream(
            "POST",
            "/api/psychological-chat/stream",
            headers={**uh, "Accept": "text/event-stream"},
            json={"sessionId": crisis_sid, "userMessage": "我不想活了"},
        ) as stream:
            for line in stream.iter_lines():
                if not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload == "[DONE]":
                    break
                data = json.loads(payload)
                if data.get("agent") == "crisis":
                    crisis_agent = True
        ok("危机语句路由 crisis Agent", crisis_agent)

        # 情绪日记
        r = c.post(
            "/api/emotion-diary",
            headers=uh,
            json={
                "diaryContent": "联调测试日记",
                "diaryDate": "2026-09-02",
                "dominantEmotion": "anxious",
                "emotionTriggers": "测试",
                "moodScore": 5,
                "sleepQuality": 3,
                "stressLevel": 3,
            },
        )
        ok("提交情绪日记", r.status_code == 200)

        r = c.get("/api/emotion-diary/my/page", headers=uh, params={"currentPage": "1", "size": "5"})
        ok("用户日记历史", r.json()["data"]["total"] >= 1)

        # 知识库公开
        r = c.get("/api/knowledge/article/page", params={"pageNum": "1", "pageSize": "5"})
        ok("知识库文章列表", r.status_code == 200)

        # 合规 API
        r = c.get("/api/legal/disclaimer")
        ok("免责声明 API", "AI" in r.json()["data"].get("content", ""))
        r = c.get("/api/legal/crisis-resources")
        ok("危机资源 API", "400-161-9995" in json.dumps(r.json()))

    print("\n=== 管理路径（需 admin token）===")
    if not admin_token:
        print("  [SKIP] 无 admin 账号，管理路径 API 跳过（pytest 套件已覆盖）")
    else:
        with httpx.Client(base_url=BASE, timeout=60.0) as c:
            r = c.get("/api/data-analytics/overview", headers=ah)
            ok("仪表盘数据", r.status_code == 200)

            r = c.get("/api/admin/sessions", headers=ah, params={"currentPage": "1", "size": "10"})
            ok("管理端跨用户咨询记录", r.json()["data"]["total"] >= 1)

            r = c.get("/api/emotion-diary/admin/page", headers=ah, params={"currentPage": "1", "size": "10"})
            ok("管理端情绪日志", r.json()["data"]["total"] >= 1)

            r = c.get("/api/admin/risk-alerts", headers=ah, params={"pageNum": "1", "pageSize": "10"})
            ok("风险预警列表", r.status_code == 200)

            r = c.get("/api/admin/agent-logs", headers=ah, params={"pageNum": "1", "pageSize": "10"})
            ok("Agent 执行日志", r.json()["data"]["total"] >= 1)

            r = c.get("/api/admin/agent-config", headers=ah)
            ok("Agent 配置列表", len(r.json()["data"]) >= 4)

    print(f"\n=== 结果: {PASS} passed, {FAIL} failed ===")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
