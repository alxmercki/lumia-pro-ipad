const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
async function waitSaved(page, check){
  const deadline=Date.now()+10000;
  while(Date.now()<deadline){
    const state=await page.evaluate(async()=>{
      const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('lumia-pro-ipad',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
      const value=await new Promise((resolve,reject)=>{const q=db.transaction('kv').objectStore('kv').get('pads');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
      db.close();return value;
    });
    if(check(state))return;
    await page.waitForTimeout(50);
  }
  throw new Error('O estado esperado não foi persistido');
}
(async()=>{
  for(const [name,engine] of (process.env.TEST_WEBKIT?[['WebKit',webkit]]:[['Chromium',chromium]])){
    const browser=await engine.launch({headless:true,...(name==='Chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
    const page=await browser.newPage({viewport:{width:1180,height:820},hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8476/');
    await page.locator('#audioSettings').click();
    await page.locator('#masterBalanceBox [data-balance-value="-1"]').click();
    assert.equal(await page.locator('#balance-master').inputValue(),'-1');
    assert.equal(await page.locator('#masterBalanceBox output').textContent(),'Left 100%');
    // Wait for the app's IndexedDB debounce, not an arbitrary browser animation.
    await waitSaved(page,state=>state&&state.masterBalance===-1);
    await page.reload();await page.locator('#audioSettings').click();
    assert.equal(await page.locator('#balance-master').inputValue(),'-1');
    await page.locator('#masterBalanceBox [data-balance-value="0"]').click();
    await page.locator('#testLeft').click();
    assert.match(await page.locator('#channelTestStatus').textContent(),/Left/);
    await page.locator('#stopTest').click();
    await page.locator('#testRight').click();
    assert.match(await page.locator('#channelTestStatus').textContent(),/Right/);
    await page.locator('#closeAudioSettings').click();
    assert.equal(await page.locator('#audioSettingsSheet').isVisible(),false);
    // First-run example pads exercise the real editor and its delegated buttons.
    await page.waitForSelector('[data-pad]');
    const pad=page.locator('[data-pad]').first();
    const edit=pad.locator('[data-more]');
    console.log(name,'first pad buttons',await pad.locator('button').count());
    await edit.click();
    await page.locator('#padBalanceBox [data-balance-value="1"]').click();
    assert.equal(await page.locator('#balance-pad').inputValue(),'1');
    await waitSaved(page,state=>state&&state.pads[0].balance===1);
    await page.reload();await page.locator('[data-pad]').first().locator('[data-more]').click();
    assert.equal(await page.locator('#balance-pad').inputValue(),'1');
    await page.locator('#padBalanceBox [data-balance-value="0"]').click();
    await page.locator('#e-close').click();
    const results=await page.evaluate(async()=>{
      const cases=[
        {channels:2,balance:0,masterBalance:-1,expected:[0.25,0]},
        {channels:2,balance:0,masterBalance:1,expected:[0,-0.75]},
        {channels:2,balance:0.5,masterBalance:-0.5,expected:[0.125,-0.375]},
        {channels:2,balance:0,expected:[0.25,-0.75]},
        {channels:2,balance:-1,expected:[0.25,0]},
        {channels:2,balance:1,expected:[0,-0.75]},
        {channels:2,balance:0.5,expected:[0.125,-0.75]},
        {channels:2,balance:-0.5,expected:[0.25,-0.375]},
        {channels:1,balance:0,expected:[0.25,0.25]},
        {channels:1,balance:-1,expected:[0.25,0]},
        {channels:1,balance:1,expected:[0,0.25]},
      ];
      const out=[];
      for(const c of cases){
        const ctx=new OfflineAudioContext(2,2048,44100),source=ctx.createBufferSource();
        const buf=ctx.createBuffer(c.channels,2048,44100);buf.getChannelData(0).fill(0.25);if(c.channels===2)buf.getChannelData(1).fill(-0.75);source.buffer=buf;
        const pad=LumiaStereo.createBalance(ctx,c.balance),deck=LumiaStereo.stereoGain(ctx),master=LumiaStereo.stereoGain(ctx),balance=LumiaStereo.createBalance(ctx,c.masterBalance||0);
        source.connect(pad.input);pad.output.connect(deck);deck.connect(master);master.connect(balance.input);balance.output.connect(ctx.destination);source.start();
        const rendered=await ctx.startRendering();let maxError=0;
        for(let ch=0;ch<2;ch++)for(const v of rendered.getChannelData(ch))maxError=Math.max(maxError,Math.abs(v-c.expected[ch]));
        out.push({...c,maxError});
      }
      return out;
    });
    for(const result of results)assert.ok(result.maxError<1e-6,JSON.stringify(result));
    // Existing projects without balance fields must load centered without losing pads.
    await page.evaluate(async()=>{
      const db=await new Promise(r=>{const q=indexedDB.open('lumia-pro-ipad',1);q.onsuccess=()=>r(q.result)});
      const state=await new Promise(r=>{const q=db.transaction('kv').objectStore('kv').get('pads');q.onsuccess=()=>r(q.result)});
      delete state.masterBalance;state.pads.forEach(p=>delete p.balance);
      await new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(state,'pads');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
    });
    await page.reload();await page.locator('#audioSettings').click();
    assert.equal(await page.locator('#balance-master').inputValue(),'0');
    await page.locator('#closeAudioSettings').click();
    assert.equal(await page.locator('[data-pad]').count(),3);
    await page.locator('[data-pad]').first().locator('[data-more]').click();
    assert.equal(await page.locator('#balance-pad').inputValue(),'0');
    await page.locator('#e-close').click();
    await page.locator('#audioSettings').click();
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'/private/tmp/lumia-'+name.toLowerCase()+'-stereo.png',fullPage:true});
    console.log(name,JSON.stringify(results));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exit(1)});
