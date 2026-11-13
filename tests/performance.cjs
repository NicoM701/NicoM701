const {performance}=require('node:perf_hooks');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const before={exports:{}};
new Function('module',execFileSync('git',['show','baf3f86:softbody.js'],{encoding:'utf8'}))(before);
const after=require('../softbody.js');
for(const held of [false,true]){
 const a=new before.exports.Ring(1200,800,180),b=new after.Ring(1200,800,180);
 if(held)for(const ring of [a,b])ring.drag={x:100,y:400,offsetX:0,offsetY:0,vx:0,vy:0,time:1000};
 for(let frame=0;frame<240;frame++){
  a.step(1000/60);b.step(1000/60);
  for(const key of ['x','y','vx','vy','rotation'])assert.equal(a[key],b[key]);
  for(let j=0;j<256;j++){
   const p=a.point(j/256*Math.PI*2),q=b.point(j/256*Math.PI*2);
   assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<1e-8);
  }
 }
}
function bench(lib){
 const samples=[];
 for(let run=0;run<9;run++){
  const ring=new lib.Ring(1200,800,180);ring.drag={x:100,y:400,offsetX:0,offsetY:0,vx:0,vy:0};
  const start=performance.now();
  for(let i=0;i<120;i++){ring.drag.x=90+Math.sin(i*.1)*20;ring.step(1000/60);lib.sampleContour(a=>ring.point(a));}
  samples.push(performance.now()-start);
 }
 return samples.sort((a,b)=>a-b)[4];
}
bench(before.exports);bench(after);
const beforeMs=bench(before.exports),afterMs=bench(after);
console.log(JSON.stringify({matchingContourPoints:122880,beforeMs,afterMs,speedup:beforeMs/afterMs},null,2));
