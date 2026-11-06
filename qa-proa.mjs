import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {resolve,dirname} from 'node:path';
// Execute the actual shipped Three.js/OrbitControls without a browser or GPU.
const cache=new Map();
async function load(file){file=resolve(file);if(cache.has(file))return cache.get(file);const mod=new vm.SourceTextModule(await readFile(file,'utf8'),{identifier:file});cache.set(file,mod);await mod.link((s,m)=>load(s==='three'?'web/vendor/three.module.js':resolve(dirname(m.identifier),s)));return mod;}
const three=await load('web/vendor/three.module.js');await three.evaluate();
const controls=await load('web/vendor/OrbitControls.js');await controls.evaluate();
const obs=await load('web/observation.js');await obs.evaluate();
const data=await load('web/data.js');await data.evaluate();
const {PerspectiveCamera}=three.namespace,{OrbitControls}=controls.namespace;
const {aimCamera,lightVisible}=obs.namespace,{presets,configuration}=data.namespace;
const camera=new PerspectiveCamera();camera.position.set(20,10,20);
const element={style:{},clientHeight:700,clientWidth:1000,addEventListener(){},removeEventListener(){},getRootNode(){return this;}};
const orbit=new OrbitControls(camera,element);orbit.enableDamping=true;orbit.dampingFactor=.075;orbit.target.set(0,3.7,0);
let checks=0;
for(const drift of [-.2,.2]){
  orbit._rotateLeft(drift);orbit.update();
  aimCamera(camera,orbit,0,8,35);
  for(let frame=0;frame<120;frame++){orbit.update();assert(Math.abs(camera.position.x)<1e-10);checks++;}
}
for(const p of presets){const c=configuration(p);for(const a of [0,.1,.49,359.51,359.9]){const pos={x:35*Math.sin(a*Math.PI/180),z:35*Math.cos(a*Math.PI/180)};for(const l of c.lights.filter(l=>l.width===112.5&&l.originX===0&&l.originZ===0)){assert(lightVisible(l,pos),p.id+':'+a+':'+l.color);checks++;}}}
const pair=configuration(presets.find(p=>p.id==='motor50')).lights.filter(l=>l.width===112.5);
for(const a of [1,45,90,180,270,315,359]){const pos={x:35*Math.sin(a*Math.PI/180),z:35*Math.cos(a*Math.PI/180)};assert.equal(pair.filter(l=>lightVisible(l,pos)).length,a===180?0:1);checks++;}
console.log(`PASS: ${checks} bow-visibility and real OrbitControls inertia regression checks. No GPU/browser render tested.`);
