/**
 * 浏览器侧手动 Checklist 自动化（Playwright）
 * 对应 docs/FULL_PROJECT_TEST_AND_ISSUES.md 第七节
 *
 * 运行：node e2e/browser-checklist.mjs
 * 环境：前端 http://127.0.0.1:5174，后端 http://127.0.0.1:1235
 */
import { chromium } from 'playwright'
import { randomBytes } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174'
const API = process.env.E2E_API_URL || 'http://127.0.0.1:1235'
const BACKEND_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'backend')

const suffix = randomBytes(4).toString('hex')
const USER = {
  username: `e2e_${suffix}`,
  email: `e2e_${suffix}@test.com`,
  password: '123456',
}
const ADMIN = {
  username: `e2e_admin_${suffix}`,
  email: `e2e_admin_${suffix}@test.com`,
  password: '123456',
}

const results = []

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, pass: true })
    console.log(`[PASS] ${name}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    results.push({ name, pass: false, error: msg })
    console.log(`[FAIL] ${name}: ${msg}`)
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options)
  const json = await res.json()
  return { res, json }
}

async function registerAndLogin(creds) {
  await api('/api/user/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...creds,
      confirmPassword: creds.password,
      gender: 1,
      agreeTerms: true,
    }),
  })
  const { json } = await api('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: creds.username, password: creds.password }),
  })
  return json.data
}

function promoteToAdmin(username) {
  const script = join(BACKEND_DIR, 'scripts', '_promote_admin_tmp.py')
  writeFileSync(
    script,
    `from sqlalchemy import create_engine, text
eng = create_engine("sqlite:///./test_integration.db")
with eng.begin() as c:
    c.execute(text("UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 2 LIMIT 1) WHERE username = :u"), {"u": "${username}"})
`
  )
  execSync(`python "${script}"`, { cwd: BACKEND_DIR, stdio: 'pipe' })
  unlinkSync(script)
}

async function loginViaUI(page, username, password) {
  await page.goto(`${BASE}/auth/login`)
    await page.getByPlaceholder('请输入用户名或邮箱').fill(username)
    await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL(/\/(consultation|back|$)/, { timeout: 15000 })
}

async function setAuthStorage(page, loginData, roleType = '1') {
  await page.goto(BASE)
  await page.evaluate(
    ({ loginData, roleType }) => {
      localStorage.setItem('token', loginData.token)
      localStorage.setItem('roleType', roleType)
      localStorage.setItem('userInfo', JSON.stringify(loginData.userInfo))
    },
    { loginData, roleType }
  )
}

async function sendChatMessage(page, text) {
  const input = page.getByPlaceholder('请输入内容')
  await input.fill(text)
  await page.locator('button').filter({ has: page.locator('.anticon-send') }).click()
}

async function waitForStreamDone(page, timeout = 60000) {
  await page.waitForFunction(
    () => !document.body.innerText.includes('正在输入中'),
    { timeout }
  )
  await page.waitForTimeout(1500)
}

async function main() {
  const userLogin = await registerAndLogin(USER)
  await registerAndLogin(ADMIN)
  promoteToAdmin(ADMIN.username)
  const adminLogin = (await api('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN.username, password: ADMIN.password }),
  })).json.data

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('=== 合规 / 静态页 ===')

  await check('页脚：用户协议链接', async () => {
    await page.goto(BASE)
    await page.locator('footer a[href="/agreement"]').click()
    await page.waitForURL('**/agreement')
    await page.getByRole('heading', { name: '用户服务协议' }).waitFor()
  })

  await check('页脚：隐私政策链接', async () => {
    await page.goto(BASE)
    await page.locator('footer a[href="/privacy"]').click()
    await page.waitForURL('**/privacy')
    await page.getByText('隐私政策').first().waitFor()
  })

  await check('页脚：免责声明链接', async () => {
    await page.goto(BASE)
    await page.locator('footer a[href="/disclaimer"]').click()
    await page.waitForURL('**/disclaimer')
    await page.getByText('免责声明').first().waitFor()
  })

  console.log('\n=== 用户路径 ===')

  await check('注册：未勾选协议无法提交', async () => {
    await page.goto(`${BASE}/auth/register`)
    await page.getByPlaceholder('请输入用户名').fill(`reg_${suffix}`)
    await page.getByPlaceholder('请输入邮箱').fill(`reg_${suffix}@t.com`)
    await page.getByPlaceholder('请输入密码').first().fill('123456')
    await page.getByPlaceholder('请再次输入密码').fill('123456')
    await page.getByRole('button', { name: '创建用户' }).click()
    await page.getByText('请阅读并同意用户协议').waitFor({ timeout: 5000 })
  })

  await check('首页 CTA → 登录后跳转咨询', async () => {
    await setAuthStorage(page, userLogin, '1')
    await page.goto(BASE)
    await page.getByRole('button', { name: '开始倾诉，获得陪伴' }).click()
    await page.waitForURL('**/consultation')
  })

  await check('咨询页：AI 免责横幅', async () => {
    await page.goto(`${BASE}/consultation`)
    await page.getByText('MindHug AI 对话仅用于情绪倾诉').waitFor()
    await page.getByRole('link', { name: '了解更多' }).click()
    await page.waitForURL('**/disclaimer')
  })

  await check('咨询：知识问答含引用 + 刷新后仍在', async () => {
    await setAuthStorage(page, userLogin, '1')
    await page.goto(`${BASE}/consultation`)
    await sendChatMessage(page, '什么是焦虑症')
    await waitForStreamDone(page)
    await page.getByText('参考来源', { exact: true }).first().waitFor({ timeout: 30000 })
    await page.reload()
    await page.waitForTimeout(3000)
    await page.locator('.cursor-pointer').filter({ hasText: /小暖|会话|联调/ }).first().click()
    await page.waitForTimeout(2000)
    await page.getByText('参考来源', { exact: true }).first().waitFor({ timeout: 15000 })
  })

  await check('咨询：危机语句触发弹窗 + 热线', async () => {
    await setAuthStorage(page, userLogin, '1')
    await page.goto(`${BASE}/consultation`)
    await sendChatMessage(page, '我不想活了')
    await page.getByText('我们关心你的安全').waitFor({ timeout: 30000 })
    await page.locator('.ant-modal').getByText('400-161-9995').first().waitFor()
    await page.getByRole('button', { name: '我知道了' }).click()
  })

  await check('情绪日记：提交成功', async () => {
    await setAuthStorage(page, userLogin, '1')
    await page.goto(`${BASE}/diary`)
    await page.locator('.ant-rate-star').nth(4).click()
    await page.getByText('焦虑').click()
    await page.getByPlaceholder('今天什么事情影响了您的情绪？').fill('E2E 测试触发因素')
    await page.getByPlaceholder('写下您今天的想法').fill('E2E 浏览器联调日记')
    await page.locator('select').first().selectOption('3')
    await page.locator('select').nth(1).selectOption('3')
    await page.getByRole('button', { name: '提交记录' }).click()
    await page.getByText('情绪日记提交成功').waitFor({ timeout: 10000 })
    await page.getByText('我的日记历史').waitFor()
  })

  await check('个人中心：继续对话携带 sessionId', async () => {
    await setAuthStorage(page, userLogin, '1')
    await page.goto(`${BASE}/profile`)
    await page.getByText('继续对话').first().waitFor({ timeout: 10000 })
    await page.getByText('继续对话').first().click()
    await page.waitForURL('**/consultation')
    await page.waitForTimeout(2000)
    const hasMessages = await page.locator('.whitespace-pre-wrap, .ant-alert').count()
    if (hasMessages < 1) throw new Error('咨询页未加载会话内容')
  })

  await check('知识库：浏览文章列表', async () => {
    await page.goto(`${BASE}/knowledgeBase`)
    await page.waitForTimeout(2000)
    const titles = page.locator('.text-lg.font-semibold')
    if ((await titles.count()) === 0) throw new Error('知识库无文章展示')
  })

  console.log('\n=== 管理路径 ===')

  await check('管理端：仪表盘加载', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/dashboard`)
    await page.waitForTimeout(3000)
    await page.getByText('数据分析').first().waitFor()
    const body = await page.textContent('body')
    if (!body?.includes('咨询') && !body?.includes('会话')) {
      throw new Error('仪表盘未展示统计数据')
    }
  })

  await check('管理端：知识文库页面', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/Knowledge`)
    await page.waitForTimeout(3000)
    await page.getByRole('button', { name: /查询|搜索|新建|添加/ }).first().waitFor({ timeout: 10000 }).catch(() =>
      page.locator('.ant-table').waitFor()
    )
  })

  await check('管理端：跨用户咨询记录', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/consultations`)
    await page.waitForTimeout(2000)
    await page.locator('main').getByText('咨询记录').waitFor()
    const rows = page.locator('.ant-table-tbody tr')
    if ((await rows.count()) < 1) throw new Error('咨询记录表为空')
    await page.getByRole('button', { name: '详情' }).first().click()
    await page.getByText('对话记录').waitFor()
  })

  await check('管理端：情绪日志可见用户日记', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/emotional`)
    await page.waitForTimeout(2000)
    await page.locator('main').getByText('情绪日志').waitFor()
    const body = await page.textContent('body')
    if (!body?.includes('E2E') && (await page.locator('.ant-table-tbody tr').count()) < 1) {
      throw new Error('未找到情绪日记记录')
    }
  })

  await check('管理端：风险预警列表 + 处理弹窗', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/risk-alerts`)
    await page.waitForTimeout(4000)
    await page.getByText('触发原因', { exact: true }).waitFor({ timeout: 15000 })
    const processBtn = page.getByRole('button', { name: '处理' }).first()
    if ((await processBtn.count()) > 0) {
      await processBtn.click()
      await page.locator('.ant-modal').waitFor({ timeout: 5000 })
      await page.getByText('处理风险预警').waitFor()
      await page.keyboard.press('Escape')
    }
  })

  await check('管理端：Agent 配置 + 重建索引按钮', async () => {
    await setAuthStorage(page, adminLogin, '2')
    await page.goto(`${BASE}/back/agent-config`)
    await page.waitForTimeout(4000)
    await page.getByRole('button', { name: '重新索引已发布文章' }).waitFor({ timeout: 15000 })
  })

  await browser.close()

  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log(`\n=== 浏览器 Checklist: ${passed} passed, ${failed} failed ===`)
  if (failed) {
    results.filter((r) => !r.pass).forEach((r) => console.log(`  - ${r.name}: ${r.error}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
