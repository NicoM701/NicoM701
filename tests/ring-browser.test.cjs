const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function browser(source){
 let top=0,frame;const events={},overlays=[];
 const context=()=>({draws:0,setTransform(){},clearRect(){},save(){},restore(){},translate(){},rotate(){},scale(){},fillText(){this.draws++;},measureText(){return {width:8};}});
 const makeCanvas=()=>{const ctx=context();return {ctx,hidden:false,dataset:{},style:{},getContext:()=>ctx,addEventListener(){},setAttribute(){},hasPointerCapture:()=>false};};
 const page={clientWidth:1200,clientHeight:800,addEventListener(){},getBoundingClientRect:()=>({top,left:0})};
 const canvas=makeCanvas();canvas.parentElement=page;
 const hit={dataset:{},style:{}};
 const style={setProperty(){}};
 const document={hidden:false,documentElement:{style},body:{append:c=>overlays.push(c)},addEventListener(){},createElement:makeCanvas,
 querySelector:selector=>selector==='#softbody'?canvas:selector==='#ball-hit-target'?hit:{getBoundingClientRect:()=>({top:top+(selector==='#references'?800:890)})}};
 const env={document,window:{PORTFOLIO:{text:'test ring text'}},innerHeight:800,innerWidth:1200,devicePixelRatio:1,performance:{now:()=>0},matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},requestAnimationFrame:cb=>{frame=cb;},addEventListener:(name,cb)=>{events[name]=cb;}};
 vm.runInNewContext(source,env);
 return {canvas,overlays,tick:time=>frame(time),scroll:y=>{top=-y;events.scroll();}};
}
const source=fs.readFileSync(path.join(__dirname,'../softbody.js'),'utf8');
function scenario(code){
 const b=browser(code);b.tick(0);assert.ok(b.canvas.ctx.draws>0);
 for(let cycle=0;cycle<2;cycle++){
  const t=cycle*100;
  b.scroll(1000);b.tick(t+16);b.tick(t+32);
  assert.equal(b.canvas.dataset.state,'fragments');
  assert.ok(b.overlays[0].ctx.draws>0);assert.equal(b.overlays[0].hidden,false);
  b.scroll(0);b.tick(t+48);
  assert.equal(b.canvas.dataset.state,'intact');assert.equal(b.overlays[0].hidden,true);
  const count=b.canvas.ctx.draws;b.tick(t+64);
  assert.ok(b.canvas.ctx.draws>count,'respawned ring must draw to its main canvas');
 }
}
test('ring draws visibly on its own canvas after repeated burst and respawn cycles',()=>scenario(source));
test('regression catches drawing the respawned ring onto the hidden fragment canvas',()=>{
 const broken=source.replace('drawGlyph(g,p.x,p.y,p.rotation);','drawGlyph(g,p.x,p.y,p.rotation,burstContext);');
 assert.notEqual(broken,source);assert.throws(()=>scenario(broken),/respawned ring must draw/);
});
