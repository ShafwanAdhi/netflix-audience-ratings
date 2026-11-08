async page => {
  const base = "http://127.0.0.1:8765";
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const task = health.task_id;
  const name = {3:"Audience Ratings",4:"Content Segmentation",5:"Trend Forecasting",6:"Catalog Analytics"}[task];
  const action = {3:"predict",4:"explore",5:"forecast",6:"insights"}[task];
  const checks = [], errors = [];
  const check = (ok, label) => { if(!ok) throw new Error(label); checks.push(label); };
  page.removeAllListeners("pageerror");
  page.on("pageerror", e => errors.push(e.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    for(const route of ["overview","dataset",action,"evaluation","methodology"]) {
      await page.goto(`${base}/${route}`);
      await page.locator("main h1").waitFor();
      if(task!==3 || !["overview","methodology"].includes(route)) await page.locator(".run-stamp").waitFor();
      await page.evaluate(()=>document.fonts.ready);
      const prefix=`${width}px ${route}`;
      check(!/\btask\s*0?[3-6]\b|internship/i.test(await page.locator("body").innerText()),`${prefix}: no assignment identity in public copy`);
      check(await page.title()===`Netflix ${name}`,`${prefix}: project document title`);
      check((await page.locator(".brand").innerText()).includes(name.toUpperCase()),`${prefix}: project wordmark`);
      check(await page.locator(".brand").getAttribute("aria-label")===`Netflix ${name} home`,`${prefix}: accessible project identity`);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${prefix}: no page overflow`);
      check(await page.locator(".brand-mark img").evaluate(e=>e.complete && e.naturalWidth>0 && e.getBoundingClientRect().width>=40),`${prefix}: loaded legible project symbol`);
    }
    await page.screenshot({path:`output/playwright/portfolio/task-0${task}/${width}px.png`,fullPage:true,animations:"disabled"});
  }
  for(const asset of ["logo.svg","favicon.svg","favicon.ico","apple-touch-icon.png"]) {
    const response = await page.request.get(`${base}/${asset}?v=2`);
    check(response.ok(),`${asset}: accessible asset`);
    check((await response.body()).length>100,`${asset}: nonempty asset`);
    if(asset.endsWith("svg")) {
      const text=await response.text();
      check(text.includes(`<title>${name}</title>`) && !/Task/i.test(text),`${asset}: project title without task number`);
    }
  }
  check(await page.locator('link[rel="icon"]').evaluateAll(es=>es.every(e=>e.href.includes("v=2"))),"Favicon links refresh cached version");
  check((await page.locator('meta[name="description"]').getAttribute("content")).length>40,"Project-specific search description");
  const cold = await page.context().browser().newContext({viewport:{width:768,height:1024},isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  let release;
  const fonts = new Promise(resolve => {release=resolve;});
  await cold.route("**/*.woff2", async route => { await fonts; await route.continue(); });
  const delayed = await cold.newPage();
  try {
    await delayed.goto(`${base}/methodology`, {waitUntil:"domcontentloaded"});
    await delayed.locator("main h1").waitFor();
    release();
    await delayed.evaluate(()=>document.fonts.ready);
    const selectedVisible=()=>{
      const item=document.querySelector('.section-nav a[aria-current="page"]');
      const a=item.getBoundingClientRect(), n=item.parentElement.getBoundingClientRect();
      return a.left>=n.left-1 && a.right<=n.right+1;
    };
    await delayed.waitForFunction(selectedVisible, null, {timeout:5000});
    check(true,"Cold direct URL reveals selected tab after delayed fonts load");
    await delayed.setViewportSize({width:390,height:844});
    await delayed.waitForFunction(selectedVisible, null, {timeout:5000});
    check(true,"Selected tab remains visible after phone rotation from tablet");
  } finally {
    release();
    await cold.close();
  }
  check(errors.length===0,"No uncaught browser errors");
  return {passed:true,task_id:task,project:name,run_id:health.run_id,checks,errors};
}
