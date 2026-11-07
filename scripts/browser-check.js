// Run with playwright-cli run-code --filename=scripts/standalone-browser-check.js.
async (page) => {
  const base = "http://127.0.0.1:8000";
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const task = health.task_id;
  const action = {3:"predict",4:"explore",5:"forecast",6:"insights"}[task];
  const checks = [], errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", e => errors.push(e.message));
  const check = (ok, label) => { if(!ok) throw new Error(label); checks.push(label); };
  const visit = async path => {
    await page.goto(`${base}/${path}`);
    if(task===3 && path==="overview") await page.locator(".summary-strip").waitFor();
    else if(task===3 && path==="methodology") await page.locator("main h1").waitFor();
    else await page.locator(".run-stamp").waitFor();
  };
  const capture = name => page.screenshot({path:`output/playwright/standalone/task-0${task}/${name}.png`,fullPage:true,animations:"disabled"});
  check(health.artifact_ready, "Own artifact is ready");
  const registry = await (await page.request.get(`${base}/api/v1/tasks`)).json();
  check(registry.length===1 && registry[0].id===task, "Only own task is registered");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base);
  await page.waitForURL("**/overview");
  check(true,"Root redirects to own overview");
  for(const section of ["overview","dataset",action,"evaluation","methodology"]){
    await visit(section);
    check(await page.getByRole("navigation",{name:"Project sections"}).getByRole("link").count()===5, `${section}: five own sections without task switcher`);
    if(await page.locator(".run-stamp").count()) check((await page.locator(".run-stamp").innerText()).includes(health.run_id), `${section}: active run identity`);
    check(!(await page.locator("main").innerText()).includes("temporarily unavailable"),`${section}: real content loaded`);
    await capture(`desktop-${section}`);
  }
  await visit(action);
  if(task===3){
    for(const kind of ["Movie","TV show"]){
      await page.getByRole("button",{name:kind,exact:true}).click();
      const response=page.waitForResponse(r=>r.url().endsWith("/tasks/3/predict"));
      await page.getByRole("button",{name:"Predict audience rating",exact:true}).click();
      check((await response).status()===200,`${kind}: actual API prediction`);
      await page.locator(".rating-label").waitFor();
      await capture(kind==="Movie"?"movie-prediction":"tv-prediction");
    }
  }else if(task===4){
    await page.getByRole("textbox",{name:"Search titles",exact:true}).fill("NoSuchTitle_abcdef999");
    await page.getByRole("button",{name:"Search titles",exact:true}).click();
    await page.getByText("No titles match these filters.",{exact:false}).waitFor();
    check(true,"Cluster title search has an honest empty state");
  }else if(task===5){
    await page.getByRole("combobox",{name:"Time target",exact:true}).selectOption("additions");
    await page.waitForFunction(()=>document.querySelectorAll(".forecast-output tbody tr").length===6);
    check(true,"Monthly forecast renders six frozen periods");
    await page.getByRole("combobox",{name:"Content scope",exact:true}).selectOption("tv");
    check(page.url().includes("group=tv"),"Forecast scope has a real URL");
  }else if(task===6){
    await page.getByRole("spinbutton",{name:"Duration (minutes)"}).fill("100");
    await page.getByRole("listbox",{name:/^Countries/}).selectOption("United States");
    await page.getByRole("listbox",{name:"Genres",exact:true}).selectOption("Dramas");
    const response=page.waitForResponse(r=>r.url().endsWith("/tasks/6/predict"));
    await page.getByRole("button",{name:"Estimate year difference"}).click();
    const result=await (await response).json();
    check(result.run_id===health.run_id && result.estimated_years>=0,"Regression prediction uses own active pipeline");
    await page.locator(".analytics-estimate-number").waitFor();
    await capture("regression-prediction");
  }
  for(const width of [768,390]){
    await page.setViewportSize({width,height:900});
    for(const section of ["overview","dataset",action,"evaluation","methodology"]){
      await visit(section);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px ${section}: no global overflow`);
      if(section==="dataset") await capture(`${width}px-dataset`);
    }
  }
  await visit("dataset");
  await page.keyboard.press("Tab");
  check(await page.getByRole("link",{name:"Skip to content"}).evaluate(e=>document.activeElement===e),"Keyboard starts at skip link");
  check(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=="none"),"Visible keyboard focus");
  await page.keyboard.press("Enter");
  check(page.url().endsWith("#main"),"Skip link reaches main");
  check(await page.locator("main").evaluate(e=>getComputedStyle(e).animationName==="none"),"Reduced motion disables page animation");
  await page.route("**/api/v1/dataset",r=>r.fulfill({status:503,contentType:"application/json",body:JSON.stringify({detail:"Controlled dataset evidence unavailable"})}));
  await page.goto(`${base}/dataset`);
  await page.getByRole("alert").waitFor();
  check((await page.locator(".dataset-variable-table").count())===0,"Unavailable dataset has no invented evidence");
  await page.unroute("**/api/v1/dataset");
  await page.goto(`${base}/missing-page`);
  await page.getByRole("heading",{name:"Page not found",exact:true}).waitFor();
  check(true,"Unknown page has not-found state");
  for(const other of [3,4,5,6].filter(n=>n!==task)){
    check((await page.request.get(`${base}/api/v1/tasks/${other}/results`)).status()===404,`Task ${other} API is absent`);
  }
  check(errors.length===0,"No uncaught browser exceptions");
  await page.setViewportSize({width:1440,height:1000});
  await visit("dataset");
  return {passed:true,task_id:task,run_id:health.run_id,checks,errors,viewports:[1440,768,390],visual_status:"Standalone baseline; reference redesign pending"};
}
