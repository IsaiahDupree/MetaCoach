import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { GET as accounts } from '../app/api/meta/accounts/route'
import { GET as dashboard } from '../app/api/meta/dashboard/route'
import { GET as generate, POST as generatePost } from '../app/api/recommendations/generate/route'
import { GET as sync } from '../app/api/meta/sync/campaigns/route'
import { GET as metrics } from '../app/api/meta/metrics/fetch/route'

const key = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const jwt = await new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject('user-a')
  .setIssuer(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`).setAudience('authenticated').setExpirationTime('1h').sign(key)
const server = createServer(async (req,res) => {
  try {
    const r = new NextRequest(`http://${req.headers.host}${req.url}`, {method:req.method,headers:req.headers as HeadersInit})
    const result = req.url?.startsWith('/accounts') ? await accounts(r)
      : req.url?.startsWith('/dashboard') ? await dashboard(r)
      : req.url?.startsWith('/sync') ? await sync(r)
      : req.url?.startsWith('/metrics') ? await metrics(r)
      : req.url?.startsWith('/generate') ? await (req.method === 'POST' ? generatePost(r) : generate(r))
      : NextResponse.json({error:'not found'},{status:404})
    res.writeHead(result.status,{'content-type':'application/json'});res.end(await result.text())
  } catch (err) {res.writeHead(500);res.end(String(err))}
})
server.listen(0,'127.0.0.1');await once(server,'listening')
try {
  const addr=server.address();if (!addr || typeof addr === 'string') throw new Error('No listener')
  const base=`http://127.0.0.1:${addr.port}`, cookie=`auth_token=${jwt}`
  const call=async (path:string,options:RequestInit={}) => {
    const res=await fetch(base+path,{...options,headers:{cookie,...options.headers}})
    return {status:res.status,data:await res.json()}
  }
  const list=await call('/accounts?cached=1')
  assert.equal(list.status,200);assert.deepEqual(list.data.data.map((a:any)=>a.id).sort(),['account-a','account-c','account-d'])
  const a=await call('/dashboard?account_id=account-a&period=30d')
  assert.equal(a.status,200,JSON.stringify(a.data));assert.equal(a.data.summary.spend,100)
  assert.equal(a.data.summary.impressions,1000);assert.equal(a.data.summary.ctr,.02);assert.equal(a.data.summary.roas,3)
  assert.deepEqual(a.data.campaigns.map((c:any)=>c.id),['campaign-a']);assert.equal(a.data.truncated,false)
  assert.equal((await call('/dashboard?account_id=account-b&period=30d')).status,404)
  const c=await call('/dashboard?account_id=account-c&period=30d')
  assert.equal(c.status,200);assert.equal(c.data.summary,null);assert.deepEqual(c.data.campaigns,[])
  const d=await call('/dashboard?account_id=account-d&period=30d')
  assert.equal(d.status,200);assert.equal(d.data.truncated,true);assert.equal(d.data.summary,null)
  assert.equal((await call('/dashboard?account_id=account-a&period=all')).status,400)
  assert.equal((await call('/generate?account_id=account-a')).status,405)
  assert.equal((await call('/sync?account_id=account-a')).status,405)
  assert.equal((await call('/metrics?account_id=account-a')).status,405)
  assert.equal((await call('/generate?account_id=account-a',{method:'POST'})).status,401)
  assert.equal((await call('/generate?account_id=account-a',{method:'POST',headers:{origin:'https://unrelated.example'}})).status,401)
  const sameOrigin = await call('/generate?account_id=account-a',{method:'POST',headers:{origin:base}})
  assert.equal(sameOrigin.status,200,JSON.stringify(sameOrigin.data))
  console.log('PASS: signed cookie, saved account/dashboard reads, cross-account denial, empty data and write-origin checks')
} finally {await new Promise<void>(resolve=>server.close(()=>resolve()))}
