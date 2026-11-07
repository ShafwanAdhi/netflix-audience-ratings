// Replay with playwright-cli run-code; preview must serve this task at port 8765.
async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.clearBrowserCache");
  await cdp.detach();
  const base = "http://127.0.0.1:8765";
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const task = health.task_id;
  const action = {3:"predict",4:"explore",5:"forecast",6:"insights"}[task];
  const checks = [], errors = [];
  const check = (ok, name) => { if (!ok) throw new Error(name); checks.push(name); };
  page.removeAllListeners("pageerror");
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    if (window.__motionInstrumented) return;
    window.__motionInstrumented = true;
    window.__motionEvents = [];
    const native = Element.prototype.animate;
    Element.prototype.animate = function(frames, options) {
      window.__motionEvents.push({className:this.getAttribute("class"), tag:this.tagName, frames, options});
      return native.call(this, frames, options);
    };
  });
  const events = () => page.evaluate(() => window.__motionEvents);
  const clear = () => page.evaluate(() => { window.__motionEvents = []; });
  const settle = async () => {
    await page.waitForTimeout(80);
    await page.waitForFunction(() => document.getAnimations().filter(a => a.playState === "running").length === 0);
  };
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:1440,height:1000});
  for (const section of ["overview","dataset",action,"evaluation","methodology"]) {
    await page.goto(`${base}/${section}`);
    await page.locator("main h1").waitFor();
    await page.waitForFunction(() => window.__motionEvents.some(e => e.tag === "H1"));
    const motion = await events();
    check(motion.some(e => e.tag === "H1" && e.frames[0].clipPath), `${section}: masked directional heading entrance`);
    await settle();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${section}: motion preserves desktop width`);
    await clear();
    if (section === "dataset") {
      await page.locator(".variable-row").last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => window.__motionEvents.some(e => /variable-row/.test(e.className)));
      check(true, "Dataset evidence reveals on scroll");
    }
    await page.locator("footer").scrollIntoViewIfNeeded();
    await settle();
  }
  await page.goto(`${base}/overview`);
  await page.locator("main h1").waitFor();
  await settle();
  await clear();
  await page.getByRole("navigation").getByRole("link",{name:/About Dataset/}).click();
  await page.waitForURL("**/dataset");
  await page.locator(".variable-row").first().waitFor();
  await settle();
  check((await events()).some(e => /section-nav/.test(e.className || "") || e.tag === "A"), "Navigation click receives press feedback");
  await page.getByRole("navigation").getByRole("link",{name:/Overview/}).click();
  await page.waitForURL("**/overview");
  await page.waitForFunction(() => window.__motionEvents.some(e => e.tag === "H1" && e.frames[0].transform?.includes("-12px")));
  check(true, "Backward navigation reverses heading direction");
  await page.locator(".recharts-wrapper").first().scrollIntoViewIfNeeded();
  await settle();
  check((await events()).some(e => /recharts-(bar|line|scatter)/.test(e.className)), "Chart series has a dedicated evidence reveal");
  await page.goto(`${base}/${action}`);
  await page.locator("main h1").waitFor();
  await settle();
  let control;
  if (task === 3) {
    control = page.getByRole("button",{name:"Movie",exact:true});
    await control.click();
    const submit = page.getByRole("button",{name:"Predict audience rating",exact:true});
    for (let i=0;i<2;i++) {
      await clear();
      const response = page.waitForResponse(r => r.url().endsWith("/tasks/3/predict"));
      await submit.click();
      check((await response).status() === 200, `Prediction ${i+1}: active pipeline responds`);
      await page.locator(".prediction-result").waitFor();
      await page.waitForFunction(() => window.__motionEvents.some(e => e.className === "prediction-result"));
      await settle();
      check((await events()).filter(e => e.tag === "I").length === 3, `Prediction ${i+1}: all three probability bars reveal`);
    }
  } else if (task === 4) {
    const select = page.getByRole("combobox",{name:"Cluster",exact:true});
    await clear();
    await select.selectOption("0");
    await page.waitForFunction(() => window.__motionEvents.some(e => e.className === "cluster-profile"));
    check(true,"Cluster selection animates updated profile");
    control = page.getByRole("button",{name:"Search titles",exact:true});
  } else if (task === 5) {
    await clear();
    await page.getByRole("combobox",{name:"Time target",exact:true}).selectOption("additions");
    await page.waitForFunction(() => window.__motionEvents.some(e => e.className === "forecast-chart"));
    check(true,"Forecast target animates refreshed evidence");
    control = page.getByRole("button",{name:"Export CSV",exact:true});
  } else {
    await page.getByRole("spinbutton",{name:"Duration (minutes)"}).fill("100");
    await page.getByRole("listbox",{name:/^Countries/}).selectOption("United States");
    await page.getByRole("listbox",{name:"Genres",exact:true}).selectOption("Dramas");
    control = page.getByRole("button",{name:"Estimate year difference"});
    await clear();
    const response = page.waitForResponse(r => r.url().endsWith("/tasks/6/predict"));
    await control.click();
    check((await response).status() === 200,"Regression active pipeline responds");
    await page.waitForFunction(() => window.__motionEvents.some(e => e.className === "analytics-estimate"));
    check(true,"Regression result animates after response");
  }
  await control.scrollIntoViewIfNeeded();
  await settle();
  await control.hover();
  await page.waitForTimeout(400);
  check(await control.evaluate(e => getComputedStyle(e).transform !== "none"), "Pointer hover supplies elevation without shadows");
  await control.focus();
  check(await control.evaluate(e => document.activeElement === e), "Animated control remains keyboard focusable");
  await page.mouse.move(0,0);
  await clear();
  await control.press("Enter");
  await page.waitForFunction(() => window.__motionEvents.some(e => e.options.duration === 230));
  check(true,"Keyboard activation receives click feedback");
  await page.emulateMedia({reducedMotion:"reduce"});
  await settle();
  check(await page.evaluate(() => document.getAnimations().length === 0), "Runtime reduced-motion change cancels active motion");
  await clear();
  await page.goto(`${base}/dataset`);
  await page.locator(".variable-row").first().waitFor();
  await page.locator("footer").scrollIntoViewIfNeeded();
  check((await events()).length === 0,"Reduced-motion page and scroll make no animation calls");
  for (const width of [768,390,320]) {
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:"no-preference"});
    await page.goto(`${base}/dataset`);
    await page.locator(".variable-row").first().waitFor();
    await settle();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),`${width}px: animation causes no global overflow`);
    await page.screenshot({path:`output/playwright/motion/task-0${task}/${width}px-dataset.png`,fullPage:true});
  }
  check(errors.length === 0,"No browser exceptions during motion and interactions");
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/overview`);
  await page.locator("main h1").waitFor();
  await settle();
  await page.screenshot({path:`output/playwright/motion/task-0${task}/desktop-overview.png`,fullPage:true});
  return {passed:true,task_id:task,run_id:health.run_id,checks,errors};
}
