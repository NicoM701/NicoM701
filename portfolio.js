(() => {
  const collage=document.querySelector('#moodboard');
  const loadCollage=()=>{
    collage.querySelectorAll('[data-src]').forEach(media=>{media.src=media.dataset.src;delete media.dataset.src;});
  };
  const collageObserver=new IntersectionObserver(entries=>{
    const visible=entries.some(entry=>entry.isIntersecting);
    if(visible)loadCollage();
    collage.querySelectorAll('video').forEach(video=>{if(visible)video.play().catch(()=>{});else video.pause();});
  },{rootMargin:'300px'});
  collageObserver.observe(collage);
  const root = document.querySelector('#references');
  const count = Math.ceil(window.PORTFOLIO.references.length / 2);
  const grids = Array.from({length:count}, (_, index) => {
    const page = document.createElement('section');
    page.className = 'reference-page'; page.id = `reference-page-${index+1}`;
    page.setAttribute('aria-label', `Website-Referenzen ${index*2+1} und ${index*2+2}`);
    const grid = document.createElement('div'); grid.className = 'reference-grid';
    const cue = document.createElement('a'); cue.className = 'scroll-cue';
    cue.href = index+1<count ? `#reference-page-${index+2}` : '#about';
    cue.setAttribute('aria-label', index+1<count ? 'Zu den n?chsten Website-Referenzen' : 'Zur Collage');
    cue.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>';
    page.append(grid,cue); root.append(page); return grid;
  });
  window.PORTFOLIO.references.forEach(async (reference, index) => {
    const url = typeof reference === 'string' ? reference : reference?.url;
    const group = document.createElement('article');
    group.className = 'reference';
    group.setAttribute('aria-label', `Referenzplatz ${index + 1}, ${url ? 'Website' : 'noch nicht belegt'}`);
    grids[Math.floor(index/2)].append(group);
    let captures;
    if (reference?.previewManifest) {
      try {
        const response = await fetch(reference.previewManifest);
        if (!response.ok) throw new Error('Preview unavailable');
        captures = (await response.json()).views;
      } catch {
        group.setAttribute('aria-label', `Referenzplatz ${index + 1}, Vorschau konnte nicht geladen werden`);
        return;
      }
    }
    Object.entries(window.PORTFOLIO.frames).forEach(([type, config]) => {
      const device = document.createElement('div');
      device.className = `device ${type}`;
      const screen = document.createElement('div');
      screen.className = 'screen';
      const [top,left,width,height] = config.screen;
      Object.assign(screen.style, {top: `${top}%`,left: `${left}%`,width: `${width}%`,height: `${height}%`});
      const capture = captures?.[type];
      let resize = () => {};
      if (capture) {
        screen.classList.add('captured-screen');
        screen.tabIndex = 0;
        screen.setAttribute('aria-label', `${type}: Minenachten 2026, scrollbare Bildschirmaufnahme`);
        capture.tiles.forEach((tile, i) => {
          const slice = document.createElement('div');
          slice.className = 'capture-slice';
          slice.style.aspectRatio = `${capture.width} / ${tile.height}`;
          const shot = new Image();
          shot.src = tile.src;
          shot.alt = i === 0 ? 'Minenachten 2026' : '';
          shot.loading = i < 2 ? 'eager' : 'lazy';
          shot.draggable = false;
          shot.style.top = `${-tile.cropTop / tile.height * 100}%`;
          slice.append(shot); screen.append(slice);
        });
      } else {
        const frame = document.createElement('iframe');
        frame.title = `${type}, Referenzplatz ${index + 1}${url ? '' : ', noch nicht belegt'}`;
        frame.loading = 'lazy';
        if (url) frame.src = url;
        else { frame.srcdoc = '<!doctype html><html style="background:#080808"><title>Noch nicht belegt</title></html>'; frame.tabIndex = -1; }
        resize = () => {
          const scale = screen.clientWidth / config.viewport;
          if (!scale) return;
          Object.assign(frame.style, {width: `${config.viewport}px`,height: `${screen.clientHeight / scale}px`,transform: `scale(${scale})`,transformOrigin:'top left'});
        };
        screen.append(frame);
      }
      const image = new Image(); image.src = config.src; image.alt = ''; image.onload = resize;
      device.append(screen,image); group.append(device);
      new ResizeObserver(resize).observe(screen);
    });
    dispatchEvent(new Event('portfolio-ready'));
  });

  const cues = [...document.querySelectorAll('.scroll-cue')];
  let scrollTimer, scrolling = false;
  const updateCues = () => {
    cues.forEach(cue => {
      const source = cue.closest('.reference-page,.ball-playground');
      const margin = parseFloat(getComputedStyle(source).scrollMarginTop) || 0;
      const stop = Math.max(0, source.getBoundingClientRect().top + scrollY - margin);
      const active = !scrolling && Math.abs(scrollY - stop) < 12;
      cue.toggleAttribute('data-active', active);
      cue.setAttribute('aria-hidden', String(!active));
      cue.tabIndex = active ? 0 : -1;
    });
  };
  addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    cues.forEach(cue => { cue.removeAttribute('data-active'); cue.tabIndex = -1; cue.setAttribute('aria-hidden','true'); });
    scrollTimer = setTimeout(() => { scrolling = false; updateCues(); }, 140);
  }, {passive:true});
  addEventListener('resize', updateCues);
  new ResizeObserver(updateCues).observe(root);
  updateCues();
})();
