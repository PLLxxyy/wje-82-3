#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3001"

def api_get(path, token=None):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def api_post(path, data=None, token=None):
    req = urllib.request.Request(f"{BASE_URL}{path}", method="POST")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def test_ticket_list():
    print("=== 1. 二手票列表接口 (GET /api/tickets) ===")
    status, data = api_get("/api/tickets")
    assert status == 200, f"期望 200，实际 {status}"
    tickets = data.get("tickets", [])
    print(f"  ✓ 返回 {len(tickets)} 条票务")
    if tickets:
        t = tickets[0]
        assert t["status"] == "available", f"列表只应返回 available 状态，实际 {t['status']}"
        print(f"  ✓ 状态校验通过（仅 available）")
        print(f"  ✓ 示例: {t['concert_title']} - ¥{t['price']} - {t['seller_nickname']}")
    print()

def test_ticket_detail():
    print("=== 2. 票详情接口 (GET /api/tickets/1) ===")
    status, data = api_get("/api/tickets/1")
    assert status == 200, f"期望 200，实际 {status}"
    ticket = data["ticket"]
    print(f"  ✓ 票ID: {ticket['id']}")
    print(f"  ✓ 标题: {ticket['title']}")
    print(f"  ✓ 状态: {ticket['status']}")
    print(f"  ✓ 卖家: {ticket['seller_nickname']}")
    print(f"  ✓ 留言数: {len(data['messages'])}")
    print()

def test_admin_tickets():
    print("=== 3. 管理员票务管理 ===")
    
    # 管理员登录
    status, data = api_post("/api/admin/login", {"username": "admin", "password": "admin123"})
    assert status == 200, f"登录失败: {status}"
    admin_token = data["token"]
    print(f"  ✓ 管理员登录成功")
    
    # 测试三种状态
    for status_key, label in [("available", "在售"), ("sold", "已售"), ("removed", "已移除")]:
        status_code, data = api_get(f"/api/admin/tickets?status={status_key}", admin_token)
        assert status_code == 200, f"{label}票务接口失败: {status_code}"
        print(f"  ✓ {label}票务: {len(data)} 条")
    
    # 测试无效状态校验
    status_code, data = api_get("/api/admin/tickets?status=invalid_status", admin_token)
    assert status_code == 400, f"无效状态应返回 400，实际 {status_code}"
    print(f"  ✓ 无效状态校验正常（返回 400）")
    print()

def test_mark_sold():
    print("=== 4. 标记已转 (POST /api/tickets/:id/mark-sold) ===")
    
    # 先注册一个测试用户并发布一张票
    status, data = api_post("/api/auth/register", {
        "username": "status_test_user",
        "password": "123456",
        "nickname": "状态测试用户",
        "city": "北京"
    })
    
    # 登录
    status, data = api_post("/api/auth/login", {
        "username": "status_test_user",
        "password": "123456"
    })
    if status == 200:
        user_token = data["token"]
    else:
        # 可能已存在，直接登录
        status, data = api_post("/api/auth/login", {
            "username": "status_test_user",
            "password": "123456"
        })
        user_token = data["token"]
    
    # 发布一张票
    status, data = api_post("/api/tickets", {
        "concertId": 1,
        "title": "状态测试票",
        "description": "测试状态流转",
        "price": 888,
        "originalPrice": 680,
        "seatInfo": "B区5排20号"
    }, user_token)
    ticket_id = data["ticketId"]
    print(f"  ✓ 发布测试票成功 (ID: {ticket_id})")
    
    # 验证初始状态为 available
    status, data = api_get(f"/api/tickets/{ticket_id}")
    assert data["ticket"]["status"] == "available", f"初始状态应为 available，实际 {data['ticket']['status']}"
    print(f"  ✓ 初始状态: available")
    
    # 标记为已售
    status, data = api_post(f"/api/tickets/{ticket_id}/mark-sold", None, user_token)
    assert status == 200, f"标记已售失败: {status}"
    print(f"  ✓ 标记已转成功")
    
    # 验证状态变为 sold
    status, data = api_get(f"/api/tickets/{ticket_id}")
    assert data["ticket"]["status"] == "sold", f"状态应为 sold，实际 {data['ticket']['status']}"
    print(f"  ✓ 状态变更为: sold")
    
    # 验证列表中不再显示（列表只显示 available）
    status, data = api_get("/api/tickets")
    ticket_ids = [t["id"] for t in data["tickets"]]
    assert ticket_id not in ticket_ids, "已售的票不应出现在公开列表中"
    print(f"  ✓ 已售票务不在公开列表中")
    
    print()

if __name__ == "__main__":
    try:
        test_ticket_list()
        test_ticket_detail()
        test_admin_tickets()
        test_mark_sold()
        print("=" * 50)
        print("🎉 所有回归测试通过！")
        print("=" * 50)
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
