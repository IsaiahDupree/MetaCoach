import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { boundedMap } from './lib/bounded-map'
import { GET as metricsGet } from './app/api/meta/metrics/fetch/route'
import { GET as syncGet } from './app/api/meta/sync/campaigns/route'
const secret = randomBytes(32).toString('hex')
const key = new TextEncoder().encode(secret)
const issuer = 'http://127.0.0.1:54321/auth/v1'
const jwt = async (sub: string, expiration: string) => new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject(sub).setIssuer(issuer).setAudience('authenticated').setExpirationTime(expiration).sign(key)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
const valid = await jwt('local-user','1h')
const expired = await jwt('local-user','-1s')
let active = 0, peak = 0
const server = createServer(async (req, res) => {
  if (req.url?.startsWith('/work/')) {
    active++; peak = Math.max(peak, active); await delay(35); active--
    res.writeHead(200, {'content-type':'text/plain'}); res.end(req.url.slice(6)); return
  }
  const request = new NextRequest(`http://127.0.0.1${req.url}`, {headers: req.headers as HeadersInit})
  const response = await (req.url?.startsWith('/sync') ? syncGet(request) : metricsGet(request))
  res.writeHead(response.status, {'content-type':'application/json'}); res.end(await response.text())
})
server.listen(0,'127.0.0.1'); await once(server,'listening')
const address = server.address(); if (!address || typeof address === 'string') throw new Error('No TCP address')
const base = `http://127.0.0.1:${address.port}`
const get = async (path:string, token?:string) => fetch(base+path, {headers:token?{authorization:`Bearer ${token}`}:{}})
delete process.env.SUPABASE_JWT_SECRET; delete process.env.METACOACH_META_SYNC_ENABLED
assert.equal((await get('/metrics',valid)).status,401)
process.env.SUPABASE_JWT_SECRET = 'your-secret-key'
assert.equal((await get('/metrics',valid)).status,401)
process.env.SUPABASE_JWT_SECRET = secret
assert.equal((await get('/metrics')).status,401)
assert.equal((await get('/metrics',expired)).status,401)
assert.equal((await get('/metrics',valid+'x')).status,401)
const wrongAudience = await new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject('local-user').setIssuer(issuer).setAudience('other').setExpirationTime('1h').sign(key)
const wrongIssuer = await new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject('local-user').setIssuer('http://wrong/auth/v1').setAudience('authenticated').setExpirationTime('1h').sign(key)
const wrongRole = await new SignJWT({role:'anon'}).setProtectedHeader({alg:'HS256'}).setSubject('local-user').setIssuer(issuer).setAudience('authenticated').setExpirationTime('1h').sign(key)
assert.equal((await get('/metrics',wrongAudience)).status,401)
assert.equal((await get('/metrics',wrongIssuer)).status,401)
assert.equal((await get('/metrics',wrongRole)).status,401)
assert.equal((await get('/metrics',valid)).status,503)
assert.equal((await get('/sync',valid)).status,503)
const result = await boundedMap([0,1,2,3,4,5,6,7],3,async i => Number(await (await fetch(`${base}/work/${i}`)).text()))
assert.deepEqual(result,[0,1,2,3,4,5,6,7]); assert.equal(peak,3)
assert.deepEqual(await boundedMap([],3,async () => 1),[])
await assert.rejects(boundedMap([1],0,async x => x),RangeError)
await new Promise<void>(resolve => server.close(()=>resolve()))
console.log('Real Next route handlers: default-off bulk routes, signed auth and invalid-token denial passed. Real loopback I/O: concurrency 3 and ordered results passed.')
