async (page) => {
  const base = "http://127.0.0.1:8765";
  const health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const task = health.task_id;
  const checks = [], errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", error => errors.push(error.message));
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  const visit = async (path) => {
    await page.goto(`${base}/${path}`);
    await page.locator("main h1").waitFor();
    if (task !== 3 || !["overview", "methodology"].includes(path)) await page.locator(".run-stamp").waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  const capture = name => page.screenshot({path:`output/playwright/data-colors/task-0${task}/${name}.png`, fullPage:true, animations:"disabled"});
  const fills = locator => locator.evaluateAll(elements => elements.map(e => e.getAttribute("fill")));
  const unique = values => new Set(values).size;
  const rgb = hex => hex.slice(1).match(/../g).map(v=>parseInt(v,16));
  const ratingColor = label => {
    if (["TV-Y","TV-Y7","TV-Y7-FV"].includes(label)) return "#0e7490";
    if (["G","TV-G"].includes(label)) return "#047857";
    if (["PG","TV-PG"].includes(label)) return "#a16207";
    if (["PG-13","TV-14"].includes(label)) return "#2563eb";
    if (["R","NC-17","TV-MA"].includes(label)) return "#a21caf";
    return "#475569";
  };
  check(health.artifact_ready, "Active artifact is ready");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:1440,height:1000});
  if(task===3) {
    await visit("overview");
    const overview=await (await page.request.get(`${base}/api/v1/tasks/3/overview`)).json();
    const bars=await fills(page.locator(".distribution-chart .recharts-rectangle"));
    check(bars.length===14, "All 14 audience labels remain plotted");
    check(bars.every((fill,i)=>fill===ratingColor(Object.keys(overview.rating_counts)[i])), "Distribution bars use documented audience-family colors");
    check(await page.locator(".data-legend li").count()===6, "All six audience families are named in legend");
    await capture("overview");
    await visit("evaluation");
    for (const mode of ["Normalized","Counts"]) {
      await page.getByRole("button",{name:mode,exact:true}).click();
      const contrast=await page.locator(".matrix td").evaluateAll(cells=>cells.map(cell=>{
        const style=getComputedStyle(cell);
        const lum=color=>{
          const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
          return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
        };
        const a=lum(style.color), b=lum(style.backgroundColor);
        return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
      }));
      check(contrast.length===196 && Math.min(...contrast)>=4.5, `${mode}: all 196 matrix cells have AA text contrast`);
      check(await page.locator(".heatmap-scale").count()===1, `${mode}: explicit magnitude scale is visible`);
      await capture(`matrix-${mode.toLowerCase()}`);
    }
    await visit("predict");
    for (const kind of ["Movie","TV show"]) {
      await page.getByRole("button",{name:kind,exact:true}).click();
      const response=page.waitForResponse(r=>r.url().endsWith("/tasks/3/predict"));
      await page.getByRole("button",{name:"Predict audience rating",exact:true}).click();
      const prediction=await (await response).json();
      await page.locator(".rating-label").waitFor();
      await page.waitForFunction(label=>document.querySelector(".rating-label")?.textContent===label,prediction.label);
      const rows=await page.locator(".probability-list > div").evaluateAll(rows=>rows.map(row=>({
        label:row.querySelector("span").textContent, color:getComputedStyle(row.querySelector("i")).backgroundColor,
        width:row.querySelector("i").style.width,
      })));
      check(rows.length===3 && rows.every(r=>r.color===`rgb(${rgb(ratingColor(r.label)).join(", ")})`), `${kind}: probabilities match the same rating colors as Overview`);
      check(rows.every((r,i)=>Math.abs(parseFloat(r.width)-prediction.probabilities[i].probability*100)<0.11), `${kind}: color update preserves probability values`);
      await capture(kind==="Movie"?"movie-prediction":"tv-prediction");
    }
  } else if(task===4) {
    await visit("overview");
    const data=await (await page.request.get(`${base}/api/v1/tasks/4/results`)).json();
    const bars=await fills(page.locator(".cluster-size-chart .recharts-rectangle"));
    check(bars.length===data.k && unique(bars)===data.k, "Every cluster has a unique size-bar color");
    const mapColors=await fills(page.locator(".cluster-map .recharts-scatter-symbol path"));
    check(unique(mapColors)===data.k, "All cluster colors remain visible in the PCA map");
    const swatches=await page.locator(".cluster-swatch").evaluateAll(es=>es.map(e=>({color:getComputedStyle(e).backgroundColor,display:getComputedStyle(e).display})));
    check(swatches.length===data.k && swatches.every((s,i)=>s.display!=="none"&&s.color===`rgb(${rgb(bars[i]).join(", ")})`), "Directory swatches are visible and match cluster size bars");
    await capture("overview");
    await visit("explore");
    const symbols=await page.locator(".cluster-map .recharts-scatter-symbol path").evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute("d")))]);
    check(symbols.length===7, "Cluster plot actually renders all seven symbol shapes");
    const selected=data.profiles.at(-1).id;
    await page.getByRole("button",{name:`C${selected}`,exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll(".cluster-map .recharts-scatter").length===1);
    const filtered=await fills(page.locator(".cluster-map .recharts-scatter-symbol path"));
    check(unique(filtered)===1 && filtered[0]===bars[data.profiles.length-1], "Filtering retains the original cluster color, even for the last ID");
    const chip=page.getByRole("button",{name:`C${selected}`,exact:true});
    check(await chip.locator("i").evaluate(e=>getComputedStyle(e).display!=="none"), "Selected chip retains its visible color swatch");
    await capture("selected-cluster");
    await visit("evaluation");
    const lines=await page.locator(".comparison-curve .recharts-line-curve").evaluateAll(es=>es.map(e=>({stroke:e.getAttribute("stroke"),dash:e.getAttribute("stroke-dasharray")})));
    check(lines.length===3 && unique(lines.map(l=>l.stroke))===3 && unique(lines.map(l=>l.dash))===3, "All algorithms have distinct colors and dash patterns");
    await capture("evaluation");
  } else if(task===5) {
    await visit("forecast");
    for(const target of ["releases","additions"]) {
      await page.getByRole("combobox",{name:"Time target",exact:true}).selectOption(target);
      await page.waitForFunction(target=>document.querySelector('.forecast-chart')?.getAttribute('data-motion-revision')?.startsWith(target),target);
      const lines=await page.locator(".forecast-chart .recharts-line-curve").evaluateAll(es=>es.map(e=>({stroke:e.getAttribute("stroke"),dash:e.getAttribute("stroke-dasharray")})));
      check(lines.some(l=>l.stroke==="#2563eb"&&!l.dash) && lines.some(l=>l.stroke==="#c2410c"&&l.dash), `${target}: observations and forecasts use different color and line style`);
      check((await fills(page.locator(".forecast-chart .recharts-area-area"))).includes("#fed7aa"), `${target}: empirical error band has its own visible fill`);
      check(await page.locator(".forecast-chart .recharts-legend-item").count()===3, `${target}: observations, predictions and error band are labelled`);
      await capture(`forecast-${target}`);
    }
    await visit("evaluation");
    check(unique(await page.locator(".forecast-chart .recharts-line-curve").evaluateAll(es=>es.map(e=>e.getAttribute("stroke"))))===2, "Held-out comparison uses the same observation/prediction colors");
    await capture("evaluation");
  } else if(task===6) {
    await visit("overview");
    check((await fills(page.locator(".analytics-chart .recharts-rectangle"))).every(c=>c==="#0f766e"), "Observed distribution uses a single-measure teal scale");
    await capture("overview");
    await visit("insights");
    const typeBars=await fills(page.locator(".analytics-chart .recharts-rectangle"));
    check(typeBars.length>0 && typeBars.every(c=>["#2563eb","#b45309"].includes(c)), "Insight bars identify Movie versus TV Show");
    check(await page.locator('.data-legend[aria-label="Content type colors"]').count()===2, "Genre and country charts both have explicit type legends");
    await capture("insights");
    await visit("evaluation");
    const data=await (await page.request.get(`${base}/api/v1/tasks/6/results`)).json();
    const points=await fills(page.locator(".analytics-chart .recharts-scatter-symbol path"));
    check(points.length===data.test_points.length, "Residual coloring preserves every held-out scatter point");
    check(unique(points)>=2 && points.every(c=>["#2563eb","#c2410c","#047857"].includes(c)), "Residual direction is encoded by color and point shape");
    const shapes=await page.locator(".analytics-chart .recharts-scatter-symbol path").evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute("d")))]);
    check(shapes.length>=2, "Residual point shapes provide a non-color cue");
    check(await page.locator(".analytics-chart .recharts-legend-item").count()===3, "Residual categories have named legends");
    await capture("evaluation");
  }
  const action={3:"predict",4:"explore",5:"forecast",6:"insights"}[task];
  for(const width of [768,390,320]) {
    await page.setViewportSize({width,height:900});
    for(const route of ["overview",action,"evaluation"]) {
      await visit(route);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${width}px ${route}: chart and legends do not overflow the page`);
    }
    await capture(`${width}px-evaluation`);
  }
  check(errors.length===0,"No uncaught browser errors");
  return {passed:true,task_id:task,run_id:health.run_id,checks,errors};
}
