async page => {
  const base = "http://127.0.0.1:8765";
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const task = health.task_id, action = {3:"predict",4:"explore",5:"forecast",6:"insights"}[task];
  const context = await page.context().browser().newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:"reduce"});
  const phone = await context.newPage();
  const checks=[], errors=[];
  phone.on("pageerror", e=>errors.push(e.message));
  const check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label);};
  const visit=async route=>{
    await phone.goto(`${base}/${route}`);
    await phone.locator("main h1").waitFor();
    if(task!==3 || !["overview","methodology"].includes(route)) await phone.locator(".run-stamp").waitFor();
    await phone.evaluate(()=>document.fonts.ready);
  };
  const capture=name=>phone.screenshot({path:`output/playwright/mobile/task-0${task}/${name}.png`,fullPage:true,animations:"disabled"});
  try {
    check(health.artifact_ready,"Active task model is ready");
    const sizes=[{width:320,height:740},{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:768,height:1024}];
    for(const size of sizes){
      await phone.setViewportSize(size);
      for(const route of ["overview","dataset",action,"evaluation","methodology"]){
        await visit(route);
        const prefix=`${size.width}x${size.height} ${route}`;
        check(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${prefix}: no page overflow`);
        check(await phone.locator('.section-nav a[aria-current="page"]').evaluate(e=>{
          const a=e.getBoundingClientRect(),n=e.closest("nav").getBoundingClientRect();
          return a.left>=n.left-1 && a.right<=n.right+1;
        }),`${prefix}: active section is visible on direct URL`);
        const small=await phone.locator("button,.button,summary").evaluateAll(es=>es.filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=="hidden").filter(e=>{const r=e.getBoundingClientRect();return r.width<43.9 || r.height<43.9;}).map(e=>e.textContent));
        check(small.length===0,`${prefix}: touch controls have at least 44px targets`);
        check(await phone.locator('input:not([type="radio"]):not([type="checkbox"]),select,textarea').evaluateAll(es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)),`${prefix}: form text is at least 16px`);
        check(await phone.locator(".pipeline-strip").evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)),`${prefix}: workflow steps fit without hidden horizontal content`);
        const charts=await phone.locator(".distribution-chart,.analytics-chart-tall").count();
        if(size.width<=430 && charts){
          for(const chart of await phone.locator(".distribution-chart,.analytics-chart-tall").all()) {
            check(await chart.evaluate(e=>e.scrollWidth>e.clientWidth && getComputedStyle(e).overflowX==="auto"),`${prefix}: dense labels use local chart scrolling`);
            await chart.evaluate(e=>{e.scrollLeft=e.scrollWidth;});
            check(await chart.evaluate(e=>e.scrollLeft>0),`${prefix}: full dense chart can be reached`);
            await chart.evaluate(e=>{e.scrollLeft=0;});
          }
        }
        if(size.width===320) await capture(`320px-${route}`);
      }
    }
    await phone.setViewportSize({width:390,height:844});
    await visit("methodology");
    await phone.setViewportSize({width:844,height:390});
    check(await phone.locator('.section-nav a[aria-current="page"]').evaluate(e=>{const a=e.getBoundingClientRect(),n=e.parentElement.getBoundingClientRect();return a.left>=n.left-1 && a.right<=n.right+1;}),"Rotation keeps the active navigation item visible");
    await phone.setViewportSize({width:390,height:844});
    await visit("overview");
    await phone.getByRole("navigation",{name:"Project sections"}).getByRole("link",{name:/Methodology/}).tap();
    await phone.waitForURL("**/methodology");
    check(true,"Touch navigation changes the actual route");
    await visit(action);
    if(task===3){
      for(const kind of ["Movie","TV show"]){
        await phone.getByRole("button",{name:kind,exact:true}).tap();
        const response=phone.waitForResponse(r=>r.url().endsWith("/tasks/3/predict"));
        await phone.getByRole("button",{name:"Predict audience rating",exact:true}).tap();
        check((await response).status()===200,`${kind}: real prediction works by touch`);
        await phone.locator(".rating-label").waitFor();
        await capture(kind==="Movie"?"390px-movie-result":"390px-tv-result");
      }
      await phone.locator('.type-picker label').filter({hasText:"Movie"}).tap();
      check(await phone.getByRole("spinbutton",{name:"Duration (minutes)"}).inputValue()==="","Content-type switch clears incompatible duration on mobile");
      await phone.getByRole("button",{name:"Predict audience rating",exact:true}).tap();
      check(await phone.locator(".field-error").count()>0,"Mobile invalid input produces field feedback");
    } else if(task===4){
      await phone.getByRole("button",{name:"C9",exact:true}).tap();
      await phone.waitForURL("**cluster=9");
      await phone.waitForFunction(()=>document.querySelector('.cluster-chip-list button[aria-pressed="true"]')?.textContent.trim()==="C9");
      check(await phone.getByRole("button",{name:"C9",exact:true}).getAttribute("aria-pressed")==="true","Cluster filter works with touch");
      await phone.getByRole("textbox",{name:"Search titles",exact:true}).fill("NoSuchMobileTitle_123456");
      await phone.getByRole("button",{name:"Search titles",exact:true}).tap();
      await phone.getByText("No titles match these filters.",{exact:false}).waitFor();
      check(true,"Search empty state works on mobile");
      await capture("390px-filtered-explorer");
    } else if(task===5){
      await phone.getByRole("combobox",{name:"Time target",exact:true}).selectOption("additions");
      await phone.getByRole("combobox",{name:"Content scope",exact:true}).selectOption("tv");
      await phone.getByRole("combobox",{name:"Forecast horizon",exact:true}).selectOption("3");
      await phone.waitForFunction(()=>document.querySelectorAll('.forecast-output tbody tr').length===3);
      check(phone.url().includes("group=tv"),"Mobile forecast selection and horizon use real data and URLs");
      const download=phone.waitForEvent("download");
      await phone.getByRole("button",{name:"Export CSV",exact:true}).tap();
      check((await download).suggestedFilename().endsWith(".csv"),"CSV export works on touch devices");
      await capture("390px-forecast");
    } else if(task===6){
      await phone.getByRole("spinbutton",{name:"Duration (minutes)"}).fill("100");
      await phone.getByRole("listbox",{name:/^Countries/}).selectOption("United States");
      await phone.getByRole("listbox",{name:"Genres",exact:true}).selectOption("Dramas");
      const response=phone.waitForResponse(r=>r.url().endsWith("/tasks/6/predict"));
      await phone.getByRole("button",{name:"Estimate year difference"}).tap();
      check((await response).status()===200,"Catalog estimate works through the real API by touch");
      await phone.locator(".analytics-estimate-number").waitFor();
      await capture("390px-estimate");
      await visit("overview");
      await phone.locator("summary").first().tap();
      check(await phone.locator("details").first().getAttribute("open")!==null,"Distribution disclosure opens by touch");
    }
    await visit("evaluation");
    const table=phone.locator(".table-scroll").first();
    if(await table.count()){
      await table.evaluate(e=>{e.scrollLeft=e.scrollWidth;});
      check(await table.evaluate(e=>e.scrollWidth<=e.clientWidth || e.scrollLeft>0),"Wide result tables remain locally scrollable");
    }
    await capture("390px-evaluation");
    check(errors.length===0,"No uncaught browser exceptions on mobile");
    return {passed:true,task_id:task,run_id:health.run_id,checks,errors,devices:"Chromium touch/mobile emulation at DPR 2",viewports:sizes};
  } finally { await context.close(); }
}
