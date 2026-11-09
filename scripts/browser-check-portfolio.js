async page => {
  const base = "http://127.0.0.1:8765";
  const task = 3;
  const action = "predict";
  const output = "output/playwright/portfolio";
  const checks = [];
  const errors = [];
  const check = (ok, name) => {if (!ok) throw new Error(name); checks.push(name);};
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  check(health.artifact_ready,"Frozen artifact ready");
  const dataset = await (await page.request.get(`${base}/api/v1/dataset`)).json();
  check(dataset.run_id === health.run_id,"Dataset and active run agree");
  check(dataset.provenance.upstream_url === null && dataset.provenance.license === null,"Unverified provenance remains explicit");
  for (const width of [1440,768,390]) {
    await page.setViewportSize({width,height:width===390 ? 844:1000});
    for (const route of ["overview","dataset",action,"evaluation","methodology"]) {
      const response = await page.goto(`${base}/${route}`);
      check(response.status()===200,`${width} ${route}: HTTP 200`);
      await page.locator("main h1").waitFor();
      await page.locator(".state").waitFor({state:"detached"});
      await page.evaluate(()=>document.fonts.ready);
      check(await page.locator("main h1").isVisible(),`${width} ${route}: heading visible`);
      check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`${width} ${route}: no document overflow`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      check(canonical.endsWith(`/${route}`) && canonical.startsWith("https://netflix-"),`${width} ${route}: production canonical`);
      if(route === "overview") {
        check(await page.locator(".case-run").innerText().then(text=>text.includes(health.run_id)),`${width}: case study uses active run`);
        const order=await page.evaluate(()=>document.querySelector(".case-study").compareDocumentPosition(document.querySelector(".summary-strip")) & Node.DOCUMENT_POSITION_FOLLOWING);
        check(Boolean(order),`${width}: finding precedes dataset counts`);
        await page.screenshot({path:`${output}/overview-${width}.png`,fullPage:true,animations:"disabled"});
      }
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  // Client navigation must update metadata without reloading the document.
  await page.goto(`${base}/overview`);
  await page.locator(".case-study").waitFor();
  await page.getByRole("navigation",{name:"Project sections"}).getByRole("link",{name:"Evaluation",exact:true}).click();
  await page.locator("main h1").waitFor();
  check((await page.title()).startsWith("Evaluation ·"),"SPA navigation updates document title");
  check((await page.locator('meta[property="og:url"]').getAttribute("content")).endsWith("/evaluation"),"SPA navigation updates OG URL");

  if(task === 3 || task === 6) {
    await page.goto(`${base}/${action}${task===6 ? "#estimate" : ""}`);
    await page.locator(".run-stamp").waitFor();
    if(task===6) {
      await page.locator("#estimate-heading:focus").waitFor();
      check(true,"Estimator deep link focuses heading after data load");
    }
    const result = task===3 ? ".prediction-result" : ".analytics-estimate-number";
    const submit = task===3 ? "Predict audience rating" : "Estimate year difference";
    let requests=0;
    page.on("request", request=>{if(request.method()==="POST" && request.url().endsWith("/predict"))requests++;});
    for(const example of ["Movie",task===3 ? "TV show":"TV Show"]) {
      const before=requests;
      await page.getByRole("button",{name:example,exact:true}).click();
      check(requests===before,`${example}: loading example does not predict`);
      await page.getByRole("button",{name:submit,exact:true}).click();
      await page.locator(result).waitFor();
      check(await page.locator(result).isVisible(),`${example}: valid prediction displayed`);
      const duration=page.getByRole("spinbutton",{name:"Number of seasons",exact:true});
      if(example!=="Movie") {
        await duration.fill("3");
        check(await page.locator(result).count()===0,"Input changes clear stale prediction");
      }
    }
    await page.getByRole("button",{name:/Countries.*selected/}).click();
    const search=page.getByRole("searchbox",{name:"Search countries",exact:true});
    check(await search.evaluate(element=>element===document.activeElement),"Search receives opening focus");
    await search.fill("INDO");
    const indonesia=page.getByRole("checkbox",{name:"Indonesia",exact:true});
    await indonesia.focus();await page.keyboard.press("Space");
    check(await indonesia.isChecked(),"Keyboard Space selects a searched country");
    await search.fill("no-such-country");
    check(await page.getByText("No matching options.",{exact:true}).isVisible(),"Search empty state visible");
    await page.keyboard.press("Escape");
    check(await page.getByRole("button",{name:/Countries.*selected/}).evaluate(element=>element===document.activeElement),"Escape returns focus to trigger");
    check(await page.getByRole("button",{name:"Remove Indonesia from countries",exact:true}).isVisible(),"Selection survives filter changes");
    await page.getByRole("button",{name:/Countries.*selected/}).click();
    await page.getByRole("button",{name:"Clear countries",exact:true}).click();
    check(await page.getByRole("checkbox",{name:"Unknown",exact:true}).isChecked(),"Clear country restores unknown");
    await page.keyboard.press("Escape");
    await page.getByRole("button",{name:/Genres.*selected/}).click();
    await page.getByRole("button",{name:"Clear genres",exact:true}).click();
    await page.getByRole("button",{name:"Done",exact:true}).click();
    const before=requests;
    await page.getByRole("button",{name:submit,exact:true}).click();
    await page.getByText("Select at least one genre.",{exact:true}).first().waitFor();
    check(requests===before,"Missing genre blocks API submission");
    await page.setViewportSize({width:390,height:844});
    await page.getByRole("button",{name:/Genres.*Select one or more/}).click();
    const popup=page.getByRole("dialog");
    const box=await popup.boundingBox();
    check(box.x>=0 && box.x+box.width<=391,"Mobile popover remains within viewport");
    await page.screenshot({path:`${output}/mobile-selector.png`,animations:"disabled"});
    await page.keyboard.press("Escape");
    for(const example of ["Movie",task===3 ? "TV show":"TV Show"]) {
      await page.getByRole("button",{name:example,exact:true}).click();
      await page.getByRole("button",{name:submit,exact:true}).click();
      await page.locator(result).waitFor();
      check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`${example}: mobile prediction fits viewport`);
    }
  }
  // Simulate unavailable, incompatible and delayed evidence on Overview.
  await page.route("**/api/v1/dataset",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({detail:"Audit simulation: evidence unavailable"})}));
  await page.goto(`${base}/overview`);await page.getByRole("button",{name:"Try again",exact:true}).waitFor();
  check(await page.locator(".case-study").count()===0,"Unavailable evidence never renders result summary");
  await page.unroute("**/api/v1/dataset");
  await page.route("**/api/v1/dataset",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({...dataset,run_id:"mismatched-run"})}));
  await page.goto(`${base}/overview`);await page.getByText(/different runs/).waitFor();
  check(await page.locator(".case-study").count()===0,"Run mismatch never renders combined results");
  await page.unroute("**/api/v1/dataset");
  let release;
  const waitForRelease=new Promise(resolve=>release=resolve);
  await page.route("**/api/v1/dataset",async route=>{await waitForRelease;await route.continue();});
  await page.goto(`${base}/overview`);await page.getByText("Loading verified artifacts",{exact:true}).waitFor();
  check(await page.locator(".case-study").count()===0,"Loading state has no fabricated summary");
  release();await page.locator(".case-study").waitFor();await page.unroute("**/api/v1/dataset");
  check(errors.length===0,`No uncaught JavaScript errors: ${errors.join("; ")}`);
  return {task,run_id:health.run_id,checks,errors,viewportWidths:[390,768,1440],environment:"local production frontend served by FastAPI; not deployed"};
}
