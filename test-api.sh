#!/bin/bash
export PATH="/usr/local/bin:/Users/yu/.npm-global/bin:$PATH"

echo "========== API 测试 =========="

# 1. 测试艺人列表
echo ""
echo "1. 测试艺人列表..."
curl -s http://localhost:3001/api/artists | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功获取 {len(d)} 个艺人')"

# 2. 测试演唱会列表
echo ""
echo "2. 测试演唱会列表..."
curl -s http://localhost:3001/api/concerts | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功获取 {len(d)} 场演唱会')"

# 3. 测试用户注册
echo ""
echo "3. 测试用户注册..."
REG_RESULT=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"api_test","password":"123456","nickname":"API测试","city":"深圳"}')
echo "  注册结果: $REG_RESULT"

# 4. 测试用户登录
echo ""
echo "4. 测试用户登录..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"api_test","password":"123456"}')
USER_TOKEN=$(echo $LOGIN_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "  登录成功，Token: ${USER_TOKEN:0:30}..."

# 5. 测试关注艺人
echo ""
echo "5. 测试关注艺人..."
curl -s -X POST http://localhost:3001/api/user/artists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"artistIds":[1,2,6]}'
echo ""
echo "  获取已关注艺人..."
curl -s http://localhost:3001/api/user/artists \
  -H "Authorization: Bearer $USER_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功关注 {len(d)} 个艺人')"

# 6. 测试发布动态
echo ""
echo "6. 测试发布动态..."
POST_RESULT=$(curl -s -X POST http://localhost:3001/api/posts \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "content=API测试发布的动态！" \
  -F "concertId=1" \
  -F "tags=[\"测试\",\"周杰伦\"]")
echo "  发布结果: $POST_RESULT"
POST_ID=$(echo $POST_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['postId'])")

# 7. 测试获取动态流
echo ""
echo "7. 测试获取动态流..."
curl -s http://localhost:3001/api/feed \
  -H "Authorization: Bearer $USER_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功获取 {len(d)} 条动态')"

# 8. 测试点赞
echo ""
echo "8. 测试点赞..."
curl -s -X POST http://localhost:3001/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $USER_TOKEN"
echo ""

# 9. 测试评论
echo ""
echo "9. 测试评论..."
curl -s -X POST http://localhost:3001/api/posts/$POST_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"content":"API测试评论！"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  评论成功，ID: {d[\"id\"]}')"

# 10. 测试转发
echo ""
echo "10. 测试转发..."
curl -s -X POST http://localhost:3001/api/posts/$POST_ID/repost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"content":"API测试转发！"}'
echo ""

# 11. 测试发布二手票
echo ""
echo "11. 测试发布二手票..."
TICKET_RESULT=$(curl -s -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"concertId":1,"title":"API测试转让门票","description":"因事转让","price":1800,"originalPrice":1680,"seatInfo":"A区1排1号"}')
echo "  发布结果: $TICKET_RESULT"
TICKET_ID=$(echo $TICKET_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['ticketId'])")

# 12. 测试二手票列表
echo ""
echo "12. 测试二手票列表..."
curl -s http://localhost:3001/api/tickets | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功获取 {len(d)} 条票务信息')"

# 13. 测试管理员登录
echo ""
echo "13. 测试管理员登录..."
ADMIN_RESULT=$(curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "  管理员登录成功，Token: ${ADMIN_TOKEN:0:30}..."

# 14. 测试管理员统计
echo ""
echo "14. 测试管理员统计..."
curl -s http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  总用户: {d[\"totalUsers\"]}, 总动态: {d[\"totalPosts\"]}, 今日发帖: {d[\"todayPosts\"]}')"

# 15. 测试管理员获取待审核动态
echo ""
echo "15. 测试管理员获取动态列表..."
curl -s "http://localhost:3001/api/admin/posts?status=approved" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  成功获取 {len(d)} 条已通过动态')"

echo ""
echo "========== API 测试完成 =========="
