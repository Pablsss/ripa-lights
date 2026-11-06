import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {presets,configuration,inSector} from './web/data.js';
const get=(id,state='making',opts={})=>configuration(presets.find(p=>p.id===id),state,opts);
const colorSet=(c,angle)=>c.lights.filter(l=>inSector(angle,l.center,l.width)).map(l=>l.color).sort();
assert.equal(presets.length,33);
assert.deepEqual(colorSet(get('motor50'),0),['green','red','white']);
assert.deepEqual(colorSet(get('motor50'),90),['green','white']);
assert.deepEqual(colorSet(get('motor50'),180),['white']);
assert.deepEqual(colorSet(get('motor50'),270),['red','white']);
assert.deepEqual(colorSet(get('tricolor'),0),['green','red']);
assert.deepEqual(colorSet(get('tricolor'),180),['white']);
assert.equal(inSector(112.5,56.25,112.5),true);
assert.equal(inSector(112.501,56.25,112.5),false);
assert.equal(inSector(247.499,303.75,112.5),false);
assert.equal(inSector(247.5,303.75,112.5),true);
assert.equal(get('towShort').lights.filter(l=>l.width===225).length,2);
assert.equal(get('towLong').lights.filter(l=>l.width===225).length,3);
assert.equal(get('towLong').shapes.length,2);
assert.equal(get('nuc','stopped').lights.length,2);
assert.equal(get('nuc').lights.some(l=>l.width===225),false);
assert.equal(get('ram').lights.some(l=>l.width===225),true);
assert.equal(get('ram','stopped').lights.length,3);
assert.equal(get('pilot','stopped').lights.length,5);
assert.equal(get('mine','stopped').lights.length,7);
assert.equal(get('dredge','anchor').lights.length,7);
assert.equal(get('groundLarge').shapes.filter(s=>s.type==='ball').length,3);
assert.equal(get('anchor100').deck,true);
assert.equal(get('hover').lights.find(l=>l.flash).color,'yellow');
assert.equal(get('wig').lights.find(l=>l.flash).color,'red');
for(const id of ['trawl','trawlLarge','fish','fishGear']){
 const p=presets.find(p=>p.id===id);assert.equal(p.anchor,true);
 assert.equal(get(id,'stopped').lights.length+3,get(id).lights.length);
 assert.deepEqual(get(id,'anchor').lights,get(id,'stopped').lights);
}
for(const p of presets){for(const state of p.states?['making','stopped',...(p.anchor?['anchor']:[])]:['making']){const c=configuration(p,state);assert(c.lights.length>0);for(const l of c.lights){for(const n of ['x','y','z','originX','originZ','center','width'])assert(Number.isFinite(l[n]),p.id+':'+n);assert(l.width>0&&l.width<=360);}if(p.length>=20){const top=c.lights.find(l=>l.name==='Tope de proa');if(top){const sides=c.lights.filter(l=>l.width===112.5&&l.originZ===0);assert(sides.every(l=>l.z<=top.z));}}}}
const d=get('dredge');assert(d.lights.filter(l=>Math.abs(l.x)===3.5).every(l=>l.y<=6.4));assert(d.shapes.filter(l=>Math.abs(l.x)===3.5).every(l=>l.y<=5.7));
const html=readFileSync('web/index.html','utf8');for(const m of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))assert(existsSync('web/'+m[1]),m[1]);
for(const f of ['app.js','data.js','index.html','style.css']){const s=readFileSync('web/'+f,'utf8');assert(!s.includes('password:'));}
console.log('PASS: 33 configurations, all state variants, sectors and boundaries, towing, fishing, special signals, physical ordering, and local assets.');
