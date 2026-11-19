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
 const colors=[];
 const style={setProperty(name,value){if(name==='--mac-tint')colors.push(value);}};
 const document={hidden:false,documentElement:{style},body:{append:c=>overlays.push(c)},addEventListener(){},createElement:makeCanvas,
 querySelector:selector=>selector==='#softbody'?canvas:selector==='#ball-hit-target'?hit:{getBoundingClientRect:()=>({top:top+(selector==='#references'?800:890)})}};
 const env={document,window:{PORTFOLIO:{text:'test ring text'}},innerHeight:800,innerWidth:1200,devicePixelRatio:1,performance:{now:()=>0},matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},requestAnimationFrame:cb=>{frame=cb;},addEventListener:(name,cb)=>{events[name]=cb;}};
 vm.runInNewContext(source,env);
 return {canvas,overlays,colors,tick:time=>frame(time),scroll:y=>{top=-y;}};
}
const source=fs.readFileSync(path.join(__dirname,'../softbody.js'),'utf8');
test('scrolling past the hero keeps the ring bouncing and changing the Mac tint',()=>{
 const b=browser(source);
 b.tick(0);
 const before=b.canvas.textRing.getState();
 b.scroll(1000);
 for(let time=16;time<=2400;time+=16)b.tick(time);
 const after=b.canvas.textRing.getState();
 assert.equal(after.top,before.top);
 assert.equal(after.bottom,before.bottom);
 assert.notEqual(after.y,before.y);
 assert.equal(after.playable,false);
 assert.equal(b.canvas.dataset.state,'intact');
 assert.equal(b.overlays.length,0);
 assert.ok(b.colors.length>0);
 b.scroll(0);
 b.tick(2416);
 assert.equal(b.canvas.textRing.getState().playable,true);
 assert.equal(b.canvas.dataset.state,'intact');
});
