import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {build} from 'esbuild'
import {SignJWT} from 'jose'
import {NextRequest,NextResponse} from 'next/server'
import {webkit} from '/Users/isaiahdupree/Documents/Software/Safari Automation/node_modules/playwright/index.mjs'
import {GET as accounts} from '../app/api/meta/accounts/route'
import {GET as dashboard} from '../app/api/meta/dashboard/route'
import {GET as recommendations} from '../app/api/recommendations/list/route'

const built=await build({
  absWorkingDir:process.cwd(), stdin:{
    contents:"import React from 'react'; import {createRoot} from 'react-dom/client'; import Dashboard from './app/dashboard/page'; createRoot(document.getElementById('root')).render(<Dashboard />)",
    loader:'tsx', resolveDir:process.cwd(), sourcefile:'local-dashboard-entry.tsx',
  },bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',
})
const bundle=built.outputFiles[0].text
const key=new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const jwt=await new SignJWT({role:'authenticated'}).setProtectedHeader({alg:'HS256'}).setSubject('user-a')
  .setIssuer(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`).setAudience('authenticated').setExpirationTime('1h').sign(key)
const paths:string[]=[]
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url||'/',`http://${req.headers.host}`).pathname;paths.push(path)
    if(path==='/'){res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><html><body><div id="root"></div><script src="/ui.js"></script></body></html>');return}
    if(path==='/ui.js'){res.writeHead(200,{'content-type':'text/javascript'});res.end(bundle);return}
    const request=new NextRequest(`http://${req.headers.host}${req.url}`,{headers:req.headers as HeadersInit})
    const response=path==='/api/meta/accounts'?await accounts(request)
      :path==='/api/meta/dashboard'?await dashboard(request)
      :path==='/api/recommendations/list'?await recommendations(request)
      :NextResponse.json({error:'not found'},{status:404})
    res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text())
  }catch{res.writeHead(500);res.end('local handler failed')}
})
server.listen(0,'127.0.0.1');await once(server,'listening')
let browser
try{
  const address=server.address();if(!address||typeof address==='string')throw new Error('No listener')
  const base=`http://127.0.0.1:${address.port}`
  browser=await webkit.launch({headless:true})
  const context=await browser.newContext()
  await context.addCookies([{name:'auth_token',value:jwt,domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'}])
  const denied:string[]=[]
  await context.route('**/*',async route=>{
    if(!route.request().url().startsWith(base+'/')){denied.push(new URL(route.request().url()).origin);await route.abort();return}
    await route.continue()
  })
  const page=await context.newPage()
  const errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base,{waitUntil:'domcontentloaded'})
  await page.locator('select').first().locator('option[value="account-a"]').waitFor({state:'attached'})
  await page.locator('select').first().selectOption('account-a')
  try { await page.getByText('A campaign',{exact:true}).waitFor({timeout:8000}) }
  catch (error) {console.error(JSON.stringify({body:await page.locator('body').innerText(),paths,errors}));throw error}
  assert.equal(await page.getByText('USD 100',{exact:true}).count(),1)
  assert.equal(await page.getByText('3.00x',{exact:true}).count(),1)
  assert.equal(await page.getByText('2.00%',{exact:true}).count(),1)
  await page.getByText('Increase Budget for High-Performing Ad Set',{exact:true}).first().click()
  await page.getByText('Priority unavailable',{exact:true}).waitFor()
  await page.locator('button').filter({has:page.locator('svg.lucide-x')}).click()
  await page.locator('select').first().selectOption('account-c')
  await page.getByText('No saved performance data is available for this period.',{exact:false}).waitFor()
  assert.equal(await page.getByText('A campaign',{exact:true}).count(),0)
  assert.equal(await page.getByText('USD 100',{exact:true}).count(),0)
  await page.locator('select').first().selectOption('account-d')
  await page.getByText('Some saved results were omitted; performance totals are hidden if incomplete.',{exact:false}).waitFor()
  assert.equal(await page.getByText('USD 100',{exact:true}).count(),0)
  assert.ok(!paths.some(path=>path==='/api/meta/metrics/fetch'||path==='/api/meta/ads/campaigns'||path==='/api/meta/sync/campaigns'))
  assert.deepEqual(denied,[])
  await context.close()
  console.log('PASS: rendered dashboard shows scoped saved data, handles missing/truncated data, and starts no live Meta sync')
}finally{
  if(browser)await browser.close()
  await new Promise<void>(resolve=>server.close(()=>resolve()))
}
