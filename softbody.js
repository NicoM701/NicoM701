(function () {
  const TAU = Math.PI * 2;
  const GRAVITY = .0004, RESTITUTION = .82;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const compressionDepth = (pressure, radius) => radius * .72 * Math.tanh(pressure / (radius * .9));

  function typeset(text, measure, radius, fontSize) {
    const letters = Array.from(text);
    const gap = fontSize * .75;
    const available = TAU * radius - gap;
    const widths = letters.map(measure);
    const total = widths.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, available / Math.max(1, total));
    const tracking = Math.max(0, (available - total * scale) / Math.max(1, letters.length));
    let distance = gap / 2;
    return letters.map((letter, i) => {
      const advance = widths[i] * scale;
      const glyph = { letter, angle: (distance + advance / 2) / radius, scale };
      distance += advance + tracking;
      return glyph;
    });
  }

  function nextTheme(current, count, random = Math.random) {
    return (current + 1 + Math.floor(random() * (count - 1))) % count;
  }
  function shapePoint(a, b, n, angle) {
    const c = Math.cos(angle), t = Math.sin(angle);
    return {x:a*Math.sign(c)*Math.abs(c)**(2/n), y:b*Math.sign(t)*Math.abs(t)**(2/n)};
  }
  function sampleContour(pointAt) {
    const points=Array.from({length:257},(_,i)=>pointAt(i/256*TAU)),lengths=[0];
    for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
    return {points,lengths,total:lengths.at(-1)};
  }
  function contourPose(path, fraction) {
    const at = distance => {
      const d=(distance%path.total+path.total)%path.total;
      let low=0,high=path.lengths.length-1;
      while(high-low>1){const mid=(low+high)>>1;if(path.lengths[mid]<d)low=mid;else high=mid;}
      const a=path.points[low],b=path.points[high],mix=(d-path.lengths[low])/Math.max(.001,path.lengths[high]-path.lengths[low]);
      return {x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix};
    };
    const distance=fraction*path.total,p=at(distance),a=at(distance-2),b=at(distance+2);
    return {...p,rotation:Math.atan2(b.y-a.y,b.x-a.x)};
  }

  const unitCircle=Array.from({length:128},(_,i)=>({x:Math.cos(i/128*TAU),y:Math.sin(i/128*TAU)}));
  function clipPolygon(points,axis,boundary,greater) {
    const result=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const insideA=greater?a[axis]>=boundary:a[axis]<=boundary;
      const insideB=greater?b[axis]>=boundary:b[axis]<=boundary;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=(boundary-a[axis])/(b[axis]-a[axis]);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    return result;
  }
  function polygonArea(points) {
    return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0))/2;
  }
  function roundContact(points) {
    const closed=[...points,points[0]],lengths=[0];
    for(let i=1;i<closed.length;i++)lengths.push(lengths[i-1]+Math.hypot(closed[i].x-closed[i-1].x,closed[i].y-closed[i-1].y));
    const path={points:closed,lengths,total:lengths.at(-1)};
    const samples=Array.from({length:128},(_,i)=>contourPose(path,i/128));
    const weights=Array.from({length:17},(_,i)=>Math.exp(-((i-8)**2)/32));
    const sum=weights.reduce((a,b)=>a+b,0);
    return samples.map((_,i)=>{
      let x=0,y=0;
      weights.forEach((weight,j)=>{const p=samples[(i+j-8+128)%128];x+=p.x*weight;y+=p.y*weight;});
      return {x:x/sum,y:y/sum};
    });
  }
  function contactContour(x,y,radius,pressure,width,height) {
    const depth=p=>compressionDepth(p,radius);
    const cx=x-depth(pressure[0])+depth(pressure[1]),cy=y-depth(pressure[2])+depth(pressure[3]);
    const shape=r=>{
      let points=unitCircle.map(p=>({x:cx+p.x*r,y:cy+p.y*r}));
      for(const [axis,boundary,greater] of [['x',16,true],['x',width-16,false],['y',16,true],['y',height-16,false]])points=clipPolygon(points,axis,boundary,greater);
      return roundContact(points);
    };
    let low=radius,high=radius*3;
    for(let i=0;i<14;i++){
      const mid=(low+high)/2;
      if(polygonArea(shape(mid))<Math.PI*radius*radius)low=mid;else high=mid;
    }
    const raw=shape((low+high)/2);
    const points=raw.filter((p,i)=>{const before=raw[(i+raw.length-1)%raw.length];return Math.hypot(p.x-before.x,p.y-before.y)>.001;});
    points.push(points[0]);const lengths=[0];
    for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
    return {points,lengths,total:lengths.at(-1)};
  }

  class Ring {
    constructor(width, height, radius) {
      this.width = width; this.height = height; this.radius = radius;
      this.x = width / 2; this.y = radius + 20;
      this.vx = 0; this.vy = 0; this.rotation = Math.PI;
      this.shape = {a:radius,b:radius,n:2};
      this.displacement = new Float64Array(64);
      this.speed = new Float64Array(64);
      this.pressure = [0, 0, 0, 0]; this.contactPressure = [0, 0, 0, 0];
      this.drag = null; this.charge = 0; this.chargeSide = -1; this.pop = false;
      this.onImpact = () => {};
    }
    impulse(angle, velocity) {
      const depth = Math.min(this.radius * .08, Math.abs(velocity) * this.radius * .04) * .9;
      for (let i = 0; i < 64; i++) {
        const distance = Math.abs(wrap(i / 64 * TAU - angle));
        this.speed[i] += depth * (-.34 * Math.exp(-distance * distance / .22) + .075 * Math.exp(-((distance - Math.PI / 2) ** 2) / .42));
      }
      if (Math.abs(velocity) > .12) this.onImpact();
    }
    release(time, cancelled) {
      if (!this.drag) return;
      const fresh = !cancelled && time - this.drag.time <= 120;
      this.vx = fresh ? this.drag.vx : 0;
      this.vy = fresh ? this.drag.vy : 0;
      if(!cancelled){
        const compression=this.contactPressure.map(p=>compressionDepth(p,this.radius));
        const spring=Math.sqrt(8*GRAVITY/this.radius)*RESTITUTION;
        const rebound=(velocity,depth)=>{
          if(Math.abs(depth)<.01)return velocity;
          const direction=Math.sign(depth),away=velocity*direction;
          return direction*Math.hypot(Math.max(0,away),Math.min(0,away)*RESTITUTION,depth*spring);
        };
        this.vx=rebound(this.vx,compression[0]-compression[1]);
        this.vy=rebound(this.vy,compression[2]-compression[3]);
      }
      this.drag = null; this.charge = 0; this.chargeSide = -1;
    }
    step(ms, obstacles = [], motion = true) {
      let remaining = Math.min(ms, 1000);
      while (remaining > .00001) {
        const dt = Math.min(remaining, 1000 / 60);
        this.integrate(dt, obstacles, motion);
        remaining -= dt;
      }
    }
    integrate(ms, obstacles, motion) {
      const dt = ms, f = dt / (1000 / 60), r = this.radius + 13;
      this.pressure.fill(0);
      if (this.drag) {
        const targetX = this.drag.x - this.drag.offsetX, targetY = this.drag.y - this.drag.offsetY;
        this.pressure = [Math.max(0, r - targetX), Math.max(0, targetX + r - this.width), Math.max(0, r - targetY), Math.max(0, targetY + r - this.height)];
        this.x = clamp(targetX, r, this.width - r); this.y = clamp(targetY, r, this.height - r);
        this.vx = this.drag.vx; this.vy = this.drag.vy;
        const pressure = Math.max(...this.pressure), side = this.pressure.indexOf(pressure);
        if (pressure < Math.max(30, this.radius * .51)) { this.charge = 0; this.chargeSide = -1; }
        else { this.charge = this.chargeSide === side ? this.charge + dt : dt; this.chargeSide = side; }
        if (this.charge >= 900) this.pop = true;
      } else if (motion) {
        this.charge = 0;
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt; this.y += this.vy * dt;
        const walls = [this.x < r, this.x > this.width - r, this.y < r && this.vy < 0, this.y > this.height - r];
        walls.forEach((hit, side) => {
          if (!hit) return;
          const horizontal = side < 2, velocity = horizontal ? this.vx : this.vy;
          this.impulse([Math.PI, 0, -Math.PI / 2, Math.PI / 2][side], velocity);
          const restitution = RESTITUTION;
          if (horizontal) { this.x = clamp(this.x, r, this.width - r); this.vx = -velocity * restitution; }
          else { this.y = clamp(this.y, r, this.height - r); this.vy = Math.abs(velocity) < .09 ? 0 : -velocity * restitution; this.vx *= .92; }
        });
        this.vx *= Math.pow(.999, f);
        if (Math.abs(this.vx) + Math.abs(this.vy) > .015) this.rotation += TAU * dt / 60000;
      }
      for (const box of obstacles) {
        const nearestX = clamp(this.x, box.x, box.x + box.w), nearestY = clamp(this.y, box.y, box.y + box.h);
        let dx = this.x - nearestX, dy = this.y - nearestY, distance = Math.hypot(dx, dy);
        if (distance >= r || distance < .001) continue;
        dx /= distance; dy /= distance;
        const impact = this.vx * dx + this.vy * dy;
        if (this.drag) {
          const side = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 1) : (dy > 0 ? 2 : 3);
          this.pressure[side] = Math.max(this.pressure[side], r - distance);
        } else {
          this.x += dx * (r - distance); this.y += dy * (r - distance);
          if (impact < 0) { this.vx -= 1.94 * impact * dx; this.vy -= 1.94 * impact * dy; this.impulse(Math.atan2(-dy, -dx), impact); }
        }
      }
      const blend=1-Math.exp(-dt/(this.drag?65:120));
      for(let i=0;i<4;i++)this.contactPressure[i]+=(this.pressure[i]-this.contactPressure[i])*blend;
      this.shape.a=this.shape.b=this.radius;this.shape.n=2;
      this.x=clamp(this.x,r,this.width-r);this.y=clamp(this.y,r,this.height-r);
      const next = new Float64Array(64);
      for (let i = 0; i < 64; i++) {
        const value = this.displacement[i], a = i / 64 * TAU;
        let target = 0;
        const spring = (target - value) * (this.drag ? .19 : .095);
        const wave = (this.displacement[(i + 63) % 64] + this.displacement[(i + 1) % 64] - 2 * value) * .22;
        next[i] = (this.speed[i] + (spring + wave) * f) * Math.pow(.82, f);
      }
      let mean = 0;
      for (let i = 0; i < 64; i++) {
        this.speed[i] = next[i]; this.displacement[i] = clamp(this.displacement[i] + next[i] * f, -this.radius * .65, this.radius * .5); mean += this.displacement[i];
      }
      for (let i = 0; i < 64; i++) this.displacement[i] -= mean / 64;
    }
    point(angle) {
      if(Math.max(...this.contactPressure)>.03){
        const key=[this.x,this.y,this.radius,this.width,this.height,...this.contactPressure].map(n=>n.toFixed(2)).join(',');
        if(this.contactKey!==key){this.contactKey=key;this.contactPath=contactContour(this.x,this.y,this.radius,this.contactPressure,this.width,this.height);}
        const point=contourPose(this.contactPath,angle/TAU);return {x:point.x,y:point.y};
      }
      const index = ((angle / TAU % 1 + 1) % 1) * 64, i = Math.floor(index), mix = index - i;
      const offset=this.drag?0:this.displacement[i]*(1-mix)+this.displacement[(i+1)%64]*mix;
      const p=shapePoint(this.shape.a+offset,this.shape.b+offset,this.shape.n,angle);
      return {x:this.x+p.x,y:this.y+p.y};
    }
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { Ring, typeset, nextTheme, sampleContour, contourPose }; return; }

  const canvas = document.querySelector('#softbody'), ctx = canvas.getContext('2d');
  const hitTarget = document.querySelector('#ball-hit-target');
  const page = canvas.parentElement, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width, height, ring, glyphs, last = 0, burst = null, theme = 0, impactTime = 0;
  const themes = [['#000000','#ffffff'],['#163cff','#ffffff'],['#ff3b30','#ffffff'],['#d7ff00','#111111'],['#7c3aed','#ffffff'],['#00d9ff','#001018'],['#ff6a00','#ffffff'],['#ff4fa3','#19000c']];
  const font = '400 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  const resize = () => {
    width = page.clientWidth; height = page.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    const diameter = Math.min(width - 12, height * .550469);
    const radius = diameter * (width <= 700 ? .3125 : .425);
    if (!ring) ring = new Ring(width, height, radius);
    else { ring.width = width; ring.height = height; ring.radius = radius; ring.x = clamp(ring.x, radius + 16, width - radius - 16); ring.y = clamp(ring.y, radius + 16, height - radius - 16); }
    ctx.font = font;
    glyphs = typeset(window.PORTFOLIO.text, c => ctx.measureText(c).width, radius, 26);
    ring.onImpact = () => {
      const now = performance.now();
      if (reduced.matches || now - impactTime < 250) return;
      impactTime = now; theme = nextTheme(theme, themes.length);
      document.documentElement.style.setProperty('--bg', themes[theme][0]);
      document.documentElement.style.setProperty('--mac-tint', theme === 0 ? '#777a82' : themes[theme][0]);
      document.documentElement.style.setProperty('--ink', themes[theme][1]);
    };
  };
  const local = e => { const b = canvas.getBoundingClientRect(); return { x:e.clientX-b.left, y:e.clientY-b.top }; };
  const release = e => {
    if (!ring.drag || ring.drag.id !== e.pointerId) return;
    ring.release(performance.now(), e.type === 'pointercancel');
    delete hitTarget.dataset.dragging;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  page.addEventListener('pointerdown', e => {
    if (burst || e.button !== 0 || e.target.closest('.scroll-cue')) return;
    const p = local(e);
    if (Math.hypot(p.x - ring.x, p.y - ring.y) > ring.radius + 18) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ring.drag = {id:e.pointerId, ...p, offsetX:p.x-ring.x, offsetY:p.y-ring.y, time:performance.now(), vx:0, vy:0};
    canvas.setPointerCapture(e.pointerId); canvas.dataset.dragging = 'true'; hitTarget.dataset.dragging = 'true';
  }, true);
  canvas.addEventListener('pointermove', e => {
    const d = ring.drag; if (!d || d.id !== e.pointerId) return;
    const p = local(e), now = performance.now(), dt = Math.max(8, now - d.time);
    if (p.x !== d.x || p.y !== d.y) { d.vx = clamp((p.x-d.x)/dt, -3, 3); d.vy = clamp((p.y-d.y)/dt, -3, 3); }
    Object.assign(d, p, {time:now});
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => canvas.addEventListener(type, e => { release(e); delete canvas.dataset.dragging; }));
  canvas.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); ring = null; burst = null; resize(); canvas.dataset.state = 'intact'; } });
  let contour;
  const pose = angle => contourPose(contour || sampleContour(a=>ring.point(a)),angle/TAU);
  const explode = now => {
    canvas.dataset.state = "fragments";
    burst = {time:now, pieces:[]};
    let word = [];
    const flush = () => { if (!word.length) return; const middle=word[Math.floor(word.length/2)], at=pose(middle.angle+ring.rotation); burst.pieces.push({word, x:at.x, y:at.y, rotation:at.rotation, vx:(at.x-ring.x)*.009, vy:(at.y-ring.y)*.009-.5, spin:(Math.random()-.5)*.004}); word=[]; };
    glyphs.forEach(g=>{if(/\s/.test(g.letter)) flush(); else word.push(g);});flush();
    if(ring.drag && canvas.hasPointerCapture(ring.drag.id)) canvas.releasePointerCapture(ring.drag.id);
    ring.drag=null;delete canvas.dataset.dragging;delete hitTarget.dataset.dragging;
  };
  const drawGlyph = (g, x, y, rotation) => {
    if (/\s/.test(g.letter)) return;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(g.scale,1);ctx.fillText(g.letter,0,0);ctx.restore();
  };
  const animate = now => {
    const elapsed = Math.min(1000, now-last || 16.667); last=now;
    const bounds = page.getBoundingClientRect();
    if (bounds.top < innerHeight && bounds.bottom > 0) {
      ctx.clearRect(0,0,width,height); ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=themes[theme][1];
      if (burst) {
        const age=now-burst.time;
        ctx.globalAlpha=clamp(1-(age-1300)/600,0,1);
        burst.pieces.forEach(p=>{
          p.vy+=.00145*elapsed;p.x+=p.vx*elapsed;p.y+=p.vy*elapsed;p.rotation+=p.spin*elapsed;
          const mid=p.word[Math.floor(p.word.length/2)].angle;
          p.word.forEach(g=>{const advance=(g.angle-mid)*ring.radius;drawGlyph(g,p.x+Math.cos(p.rotation)*advance,p.y+Math.sin(p.rotation)*advance,p.rotation);});
        });ctx.globalAlpha=1;
        if(age>2000){ring=null;burst=null;resize();canvas.dataset.state="intact";}
      } else {
        ring.step(elapsed,[],!reduced.matches);
        contour=sampleContour(a=>ring.point(a));
        if(ring.pop) explode(now);
        else glyphs.forEach(g=>{const p=pose(g.angle+ring.rotation);drawGlyph(g,p.x,p.y,p.rotation);});
      }
    }
    hitTarget.hidden = !!burst;
    Object.assign(hitTarget.style, {left:`${ring.x-ring.radius-18}px`,top:`${ring.y-ring.radius-18}px`,width:`${2*(ring.radius+18)}px`,height:`${2*(ring.radius+18)}px`});
    requestAnimationFrame(animate);
  };
  canvas.textRing = { getState: () => ({x:ring.x,y:ring.y,vx:ring.vx,vy:ring.vy,radius:ring.radius,held:!!ring.drag,deformation:Math.max(...ring.displacement.map(Math.abs)),shape:{...ring.shape},pressure:[...ring.contactPressure],width,height}) };
  canvas.dataset.state = "intact";
  resize();new ResizeObserver(resize).observe(page);requestAnimationFrame(animate);
})();
