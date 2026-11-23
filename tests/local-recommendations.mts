import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import { GET } from '../app/api/recommendations/generate/route'

const secret = process.env.SUPABASE_JWT_SECRET!
const issuer = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
const key = new TextEncoder().encode(secret)
async function token(user: string) {
  return new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'HS256' })
    .setSubject(user).setIssuer(issuer).setAudience('authenticated').setExpirationTime('1h').sign(key)
}

const server = createServer(async (req, res) => {
  try {
    const request = new NextRequest(`http://127.0.0.1${req.url}`, { headers: req.headers as HeadersInit })
    const response = await GET(request)
    res.writeHead(response.status, { 'content-type': 'application/json' })
    res.end(await response.text())
  } catch (error) {
    res.writeHead(500); res.end(String(error))
  }
})
server.listen(0, '127.0.0.1')
await once(server, 'listening')
try {
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('Missing local listener')
  const base = `http://127.0.0.1:${addr.port}/?account_id=`
  const get = async (account: string, user: string) => {
    const r = await fetch(base + account, { headers: { authorization: `Bearer ${await token(user)}` } })
    return { status: r.status, data: await r.json() }
  }
  if (process.env.EXPECT_STORAGE_ERROR === '1' || process.env.EXPECT_INSERT_ERROR === '1') {
    const unavailable = await get('account-a', 'user-a')
    assert.equal(unavailable.status, 500)
    console.log(process.env.EXPECT_INSERT_ERROR === '1'
      ? 'PASS: a failed recommendation insert returns an error rather than reporting success'
      : 'PASS: unavailable performance data returns an error rather than an empty recommendation list')
  } else {
    const forbidden = await get('account-b', 'user-a')
    assert.equal(forbidden.status, 404)
    const a = await get('account-a', 'user-a')
    const b = await get('account-b', 'user-b')
    assert.equal(a.status, 200, JSON.stringify(a.data))
    assert.equal(b.status, 200, JSON.stringify(b.data))
    assert.ok(a.data.recommendations.some((r: any) => r.id === 'budget-increase-set-a'))
    assert.ok(b.data.recommendations.some((r: any) => r.id === 'budget-decrease-set-b'))
    assert.ok(a.data.recommendations.every((r: any) => r.meta_account_id === 'account-a' && !r.id.includes('set-b')))
    assert.ok(b.data.recommendations.every((r: any) => r.meta_account_id === 'account-b' && !r.id.includes('set-a')))
    console.log('PASS: actual handler and isolated database enforce ownership and generate recommendations from each account only')
  }
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
