const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Ring, typeset} = require('../softbody.js');

test('glyph placement follows measured widths, including narrow letters', () => {
  const layout = typeset('wiwi', c => c === 'w' ? 20 : 4, 10, 26);
  assert.ok(layout[0].scale < 1);
  const widthW = layout[0].angle - 26 * .75 / 20;
  assert.ok(Number.isFinite(widthW));
  const a = typeset('wii', c => c === 'w' ? 20 : 4, 50, 26);
  assert.ok(a[1].angle - a[0].angle > a[2].angle - a[1].angle);
  assert.ok(a.at(-1).angle < Math.PI * 2);
});

test('free holding does not charge or pop; sustained wall pressure does', () => {
  const ring = new Ring(1200, 800, 180);
  ring.drag = {x:600,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<120;i++) ring.step(16.667);
  assert.equal(ring.pop,false);assert.equal(ring.charge,0);
  ring.drag.x = 0;
  for(let i=0;i<53;i++) ring.step(16.667);
  assert.equal(ring.pop,false);
  for(let i=0;i<2;i++) ring.step(16.667);
  assert.equal(ring.pop,true);
});

test('relieving wall pressure resets the pop timer', () => {
  const ring = new Ring(1200,800,180);
  ring.drag={x:0,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<45;i++)ring.step(16.667);
  ring.drag.x=600;ring.step(16.667);assert.equal(ring.charge,0);
  ring.drag.x=0;for(let i=0;i<45;i++)ring.step(16.667);
  assert.equal(ring.pop,false);
});

test('gravity accelerates and a floor impact rebounds at restitution .82', () => {
  const ring=new Ring(1200,800,180);ring.y=600;ring.vy=.8;
  const before=ring.vy;ring.step(16.667);assert.ok(ring.vy<0);
  assert.ok(Math.abs(ring.vy+(before+.0004*16.667)*.82)<.0001);
});

test('impact waves settle without changing average radius or separating letters', () => {
  const ring=new Ring(1200,800,180);ring.impulse(Math.PI/2,2);
  for(let i=0;i<1000;i++)ring.step(16.667,[],false);
  assert.ok([...ring.displacement].every(Number.isFinite));
  assert.ok(Math.max(...ring.displacement.map(Math.abs))<.001);
  const p=ring.point(0),q=ring.point(Math.PI*2);
  assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<.001);
});

test('objects reflect an approaching circle', () => {
  const ring=new Ring(1200,800,100);ring.x=600;ring.y=190;ring.vy=.5;
  ring.step(16.667,[{x:400,y:300,w:400,h:200}]);
  assert.ok(ring.vy<0);assert.ok(ring.y<=187.001);
});

test('switching to a different wall starts a fresh pressure hold', () => {
  const ring=new Ring(1200,800,180);
  ring.drag={x:0,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<45;i++)ring.step(16.667);
  ring.drag.x=1200;
  for(let i=0;i<20;i++)ring.step(16.667);
  assert.equal(ring.pop,false);
  assert.ok(ring.charge<350);
});

test('30fps and 60fps simulate the same elapsed falling time', () => {
  const a=new Ring(1200,3000,100),b=new Ring(1200,3000,100);
  for(let i=0;i<60;i++)a.step(1000/60);
  for(let i=0;i<30;i++)b.step(1000/30);
  assert.ok(Math.abs(a.y-b.y)<3, `fall differs by ${Math.abs(a.y-b.y)}px`);
});

test('release retains the latest throw even before another animation frame', () => {
  const ring=new Ring(1200,800,180);
  ring.drag={x:600,y:400,offsetX:0,offsetY:0,vx:1.2,vy:-.8,time:1000};
  ring.release(1030,false);
  assert.equal(ring.vx,1.2);assert.equal(ring.vy,-.8);assert.equal(ring.drag,null);
});

test('holding a resting ring in empty space leaves its contour circular', () => {
  const ring=new Ring(1200,800,180);
  ring.drag={x:600,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<120;i++)ring.step(16.667);
  for(let i=0;i<64;i++){
    const p=ring.point(i/64*Math.PI*2);
    assert.ok(Math.abs(Math.hypot(p.x-ring.x,p.y-ring.y)-180)<.01);
  }
});

test('the ball has its own playground before mockups, outside the collage', () => {
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const playground=html.indexOf('id="ball-playground"'),references=html.indexOf('id="references"'),collage=html.indexOf('<main');
  const ball=html.indexOf('<canvas id="softbody"');
  assert.ok(playground>0 && playground<ball && ball<references && references<collage);
});

test('slow rendering still advances a full second of physics', () => {
  const a=new Ring(1200,3000,100),b=new Ring(1200,3000,100);
  for(let i=0;i<60;i++)a.step(1000/60);
  for(let i=0;i<5;i++)b.step(200);
  assert.ok(Math.abs(a.y-b.y)<3);
});

test('corner pressure preserves area and never folds the contour', () => {
  const ring=new Ring(1200,800,180);
  ring.drag={x:-40,y:840,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<40;i++)ring.step(16.667);
  const points=Array.from({length:128},(_,i)=>ring.point(i/128*Math.PI*2));
  let area=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%128],c=points[(i+2)%128];
    assert.ok((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>=-.001,'corner contour folded');
    assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>.5,'corner contour collapsed');
    area+=a.x*b.y-b.x*a.y;
  }
  const ratio=Math.abs(area)/2/(Math.PI*180*180);
  assert.ok(ratio>.94&&ratio<1.06,`area ratio ${ratio}`);
});

test('refresh and motionless release from the spawn position have identical physics', () => {
  for(const [width,height,radius,dt] of [[1200,800,180,1000/60],[1440,900,210,1000/30],[390,844,118,1000/60]]){
    const fresh=new Ring(width,height,radius),released=new Ring(width,height,radius);
    released.drag={x:fresh.x,y:fresh.y,offsetX:0,offsetY:0,vx:0,vy:0,time:1000};
    released.step(dt,[],false);released.release(1020,false);
    for(let i=0;i<Math.ceil(8000/dt);i++){
      fresh.step(dt);released.step(dt);
      for(const key of ['x','y','vx','vy','rotation'])assert.ok(Math.abs(fresh[key]-released[key])<1e-8,`${key} differs at frame ${i}`);
      assert.deepEqual(fresh.displacement,released.displacement);
    }
  }
});

test('random theme selection never repeats the current color', () => {
  const {nextTheme}=require('../softbody.js');
  for(let current=0;current<8;current++)for(const random of [0,.15,.4,.75,.99999])assert.notEqual(nextTheme(current,8,()=>random),current);
  assert.ok(new Set([.1,.3,.6,.9].map(n=>nextTheme(0,8,()=>n))).size>2);
});

test('corner text follows arc length without collapsing onto one wall point', () => {
  const {sampleContour,contourPose}=require('../softbody.js');
  const ring=new Ring(1200,800,180);ring.drag={x:-40,y:840,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<40;i++)ring.step(16.667);
  const path=sampleContour(a=>ring.point(a));
  const points=Array.from({length:100},(_,i)=>contourPose(path,i/100));
  for(let i=0;i<100;i++){
    const p=points[i],q=points[(i+1)%100];
    assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>path.total/100*.9);
    assert.ok(Number.isFinite(p.rotation));
  }
});

test('wall pressure makes a local flat contact instead of a whole-ring squircle', () => {
  const ring=new Ring(1200,800,180);ring.drag={x:100,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  for(let i=0;i<35;i++)ring.step(16.667);
  const points=Array.from({length:256},(_,i)=>ring.point(i/256*Math.PI*2));
  const contact=points.filter(p=>p.x<16.6);
  assert.ok(contact.length>12,'no extended wall contact');
  assert.ok(Math.max(...contact.map(p=>p.y))-Math.min(...contact.map(p=>p.y))>120,'contact is too small');
  assert.ok(points.every(p=>p.x>=15.99),'letters cross the wall');
});

test('visible wall compression releases spring energy away from every wall', () => {
  for(const [x,y,nx,ny] of [[90,400,1,0],[1110,400,-1,0],[600,90,0,1],[600,710,0,-1]]){
    const ring=new Ring(1200,800,180);
    ring.drag={x,y,offsetX:0,offsetY:0,vx:-nx*.8,vy:-ny*.8,time:1000};
    for(let i=0;i<30;i++)ring.step(1000/60);
    ring.release(1020,false);
    const away=ring.vx*nx+ring.vy*ny;
    assert.ok(away>.25,`compressed ring did not spring away: ${away}`);
    ring.step(1000/60);
    assert.ok(ring.vx*nx+ring.vy*ny>.24);
  }
});

test('deeper compression stores more energy and corners do not double the kick', () => {
  const launch=(x,y,cancelled=false)=>{
    const ring=new Ring(1200,800,180);
    ring.drag={x,y,offsetX:0,offsetY:0,vx:0,vy:0,time:1000};
    for(let i=0;i<30;i++)ring.step(1000/60);
    ring.release(1020,cancelled);return ring;
  };
  const light=launch(160,400),deep=launch(40,400),corner=launch(40,760),cancel=launch(40,400,true);
  assert.ok(deep.vx>light.vx*2);
  assert.ok(corner.vx>0&&corner.vy<0);
  assert.ok(Math.hypot(corner.vx,corner.vy)<=deep.vx*1.42);
  assert.equal(cancel.vx,0);assert.equal(cancel.vy,0);
});

test('the fall settles without a tail of tiny bounces or color-triggering impacts', () => {
  const ring=new Ring(1200,800,180),impacts=[];
  ring.onImpact=velocity=>impacts.push(Math.abs(velocity));
  for(let i=0;i<1200;i++)ring.step(1000/60);
  assert.ok(impacts.length>1&&impacts.length<=7,`too many impacts: ${impacts.length}`);
  assert.ok(impacts.every(v=>v>.22),'tiny impacts still trigger effects');
  for(let i=0;i<120;i++){
    ring.step(1000/60);
    assert.equal(ring.vy,0,'resting ring keeps hopping');
  }
});

test('portfolio text uses German for German locales and English otherwise', () => {
  const vm=require('node:vm'),source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../portfolio-config.js'),'utf8');
  for(const language of ['de','de-DE','de-AT','en-US','fr-FR','']){
    const context={window:{},navigator:{language}};
    vm.runInNewContext(source,context);
    assert.ok(context.window.PORTFOLIO.text.startsWith(language.startsWith('de')?'Hi, das ist':'Hi, this is NicoM701'));
    assert.ok(!context.window.PORTFOLIO.text.includes('finale text'));
  }
});

test('bounce sound is a short bass tone with a hard low peak and silent edges', () => {
  const {bounceSound}=require('../softbody.js');
  for(const velocity of [.23,.7,3,100]){
    const envelope=[],frequencies=[],param=events=>({setValueAtTime:(v,t)=>events.push([v,t]),linearRampToValueAtTime:(v,t)=>events.push([v,t]),exponentialRampToValueAtTime:(v,t)=>events.push([v,t])});
    let stopped;
    const oscillator={frequency:param(frequencies),connect(){},disconnect(){},start(){},stop(t){stopped=t;}};
    const gain={gain:param(envelope),connect(){},disconnect(){}};
    bounceSound({state:'running',currentTime:10,destination:{},createOscillator:()=>oscillator,createGain:()=>gain},velocity);
    assert.equal(oscillator.type,'sine');
    assert.ok(Math.max(...envelope.map(([value])=>value))<=.008);
    assert.equal(envelope[0][0],0);assert.equal(envelope.at(-1)[0],0);
    assert.ok(stopped-10<.15);
    assert.ok(frequencies.every(([hz])=>hz>=50&&hz<=110));
    oscillator.onended();
  }
  bounceSound(null,1);
  bounceSound({state:'suspended',createOscillator(){throw Error('audio must remain silent');}},1);
});
