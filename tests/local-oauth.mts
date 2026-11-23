import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { GET as standardStart } from '../app/api/meta/oauth/start/route'
import { GET as standardCallback } from '../app/api/meta/oauth/callback/route'
import { GET as businessStart } from '../app/api/meta/business-login/start/route'
import { POST as businessStore } from '../app/api/meta/business-login/store-token/route'
import { saveMetaAccounts } from '../lib/save-meta-accounts'
import { supabaseAdmin } from '../lib/supabase'

const key = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const jwt = await new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject('user-a')
  .setIssuer(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`).setAudience('authenticated').setExpirationTime('1h').sign(key)
const server = createServer(async (req,res) => {
  try {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.from(chunk))
    const bytes = Buffer.concat(chunks)
    const request = new NextRequest(`http://${req.headers.host}${req.url}`, {
      method:req.method, headers:req.headers as HeadersInit, ...(bytes.length ? {body:bytes} : {}),
    })
    const response = req.url?.startsWith('/standard-start') ? await standardStart(request)
      : req.url?.startsWith('/standard-callback') ? await standardCallback(request)
      : req.url?.startsWith('/business-start') ? await businessStart(request)
      : req.url?.startsWith('/business-store') ? await businessStore(request)
      : NextResponse.json({error:'not found'},{status:404})
    for (const [name,value] of response.headers.entries()) {
      if (name.toLowerCase() !== 'set-cookie') res.setHeader(name,value)
    }
    const cookies = response.headers.getSetCookie()
    if (cookies.length) res.setHeader('set-cookie',cookies)
    res.writeHead(response.status);res.end(await response.text())
  } catch {res.writeHead(500);res.end('handler failed')}
})
server.listen(0,'127.0.0.1');await once(server,'listening')
try {
  const addr=server.address();if (!addr || typeof addr==='string') throw new Error('No listener')
  const base=`http://127.0.0.1:${addr.port}`, session=`auth_token=${jwt}`
  const call=(path:string, init:RequestInit={})=>fetch(base+path,{...init,redirect:'manual'})
  delete process.env.METACOACH_META_OAUTH_ENABLED
  assert.equal((await call('/standard-start')).status,401)
  assert.equal((await call('/standard-start',{headers:{cookie:session}})).status,503)
  const invalid=await call('/standard-callback?state=local-state&code=local-code',{headers:{cookie:'oauth_state=local-state; auth_token=invalid'}})
  assert.equal(invalid.status,307);assert.match(invalid.headers.get('location')!,/authentication_required/)
  assert.equal((await call('/standard-callback?state=local-state&code=local-code',{headers:{cookie:`oauth_state=local-state; ${session}`}})).status,503)
  assert.equal((await call('/business-start',{headers:{cookie:session}})).status,503)
  process.env.METACOACH_META_OAUTH_ENABLED='1'
  const start=await call('/business-start',{headers:{cookie:session}})
  assert.equal(start.status,200)
  const state=start.headers.get('set-cookie')?.match(/business_oauth_state=([^;]+)/)?.[1]
  assert.ok(state)
  const post=(stateValue:string, origin:string=base)=>call('/business-store',{method:'POST',headers:{
    cookie:`${session}; business_oauth_state=${state}`,origin,'content-type':'application/json',
  },body:JSON.stringify({longLivedToken:'local-test-token',expiresIn:60,state:stateValue})})
  assert.equal((await post(state,'https://other.example')).status,401)
  assert.equal((await post('different-state')).status,403)
  assert.equal((await call('/business-store',{method:'POST',headers:{origin:base,'content-type':'application/json'},
    body:JSON.stringify({longLivedToken:'local-test-token',expiresIn:60,state})})).status,401)
  assert.equal((await call('/business-store',{method:'POST',headers:{cookie:`${session}; business_oauth_state=${state}`,
    origin:base,'content-type':'application/json'},body:JSON.stringify({longLivedToken:'local-test-token',expiresIn:-1,state})})).status,400)
  const stored=await post(state);assert.equal(stored.status,200)
  assert.ok(stored.headers.getSetCookie().some(cookie=>cookie.startsWith('meta_access_token=')))

  const db=supabaseAdmin()
  await assert.rejects(saveMetaAccounts('user-b',[{id:'account-a',name:'Wrong owner'}],'local-new','2030-01-01T00:00:00Z'))
  const before=await db.from('meta_accounts').select('user_id,account_name,access_token').eq('id','account-a').single()
  assert.equal(before.data.user_id,'user-a');assert.equal(before.data.account_name,'Account A');assert.equal(before.data.access_token,'local-original')
  await saveMetaAccounts('user-a',[{id:'account-a',name:'Updated A'}],'local-updated','2030-01-01T00:00:00Z')
  await saveMetaAccounts('user-b',[{id:'account-new',name:'New account'}],'local-new','2030-01-01T00:00:00Z')
  const after=await db.from('meta_accounts').select('id,user_id,account_name,access_token').in('id',['account-a','account-new']).order('id')
  assert.deepEqual(after.data.map((row:any)=>[row.id,row.user_id,row.account_name]),[['account-a','user-a','Updated A'],['account-new','user-b','New account']])
  console.log('PASS: OAuth default-off/auth/state checks, same-origin token storage, and account-owner-safe database writes')
} finally {await new Promise<void>(resolve=>server.close(()=>resolve()))}
