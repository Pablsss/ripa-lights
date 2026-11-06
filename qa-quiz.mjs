import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from './dist/server/index.js';
import {makeQuestions,families} from './web/quiz-bank.js';
import {presets,configuration} from './web/data.js';
const sqlite=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')))sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
const env={DB:{prepare(sql){return{bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return{results:sqlite.prepare(sql).all(...args)};},async run(){const result=sqlite.prepare(sql).run(...args);return{meta:{changes:Number(result.changes)}};}};}};}}};
async function request(path,user='user-a',body){const headers={'oai-authenticated-user-id':user};if(body)Object.assign(headers,{'Content-Type':'application/json',Origin:'https://ripa.example'});return worker.fetch(new Request('https://ripa.example'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined}),env);}
assert.equal((await request('/api/quiz/history','')).status,401);
assert.equal((await request('/api/quiz/start','user-a',{mode:'bad'})).status,400);
const start=await request('/api/quiz/start','user-a',{mode:'lights'});assert.equal(start.status,201);let attempt=await start.json();assert.equal(attempt.questions.length,10);
assert(attempt.questions.every(q=>q.choices.length===4&&!('correct'in q)&&!('explanation'in q)));
const saved=sqlite.prepare('SELECT * FROM quiz_attempts WHERE id=?').get(attempt.id),qs=JSON.parse(saved.questions_json);
assert.equal((await request('/api/quiz/attempt/'+attempt.id,'user-b')).status,404);
assert.equal((await request('/api/quiz/answer','user-b',{id:attempt.id,index:0,choice:0})).status,404);
assert.equal((await request('/api/quiz/answer','user-a',{id:attempt.id,index:3,choice:0})).status,409);
for(let index=0;index<10;index++){const choice=index<7?qs[index].correct:(qs[index].correct+1)%4;const body={id:attempt.id,index,choice};const r=await request('/api/quiz/answer','user-a',body);assert.equal(r.status,200);attempt=await r.json();assert.equal(attempt.answers.length,index+1);const repeat=await request('/api/quiz/answer','user-a',body);assert.equal(repeat.status,200);assert.equal((await repeat.json()).answers.length,index+1);}
assert.equal(attempt.score,7);assert(attempt.completedAt);assert(attempt.questions.every(q=>Number.isInteger(q.correct)&&q.explanation));
const history=await (await request('/api/quiz/history')).json();assert.equal(history.items.length,1);assert.equal(history.items[0].score,7);assert.equal((await (await request('/api/quiz/history','user-b')).json()).items.length,0);
assert.deepEqual(await (await request('/api/quiz/attempt/'+attempt.id)).json(),attempt);
const boat=await (await request('/api/quiz/start','user-a',{mode:'boat'})).json();assert.equal(boat.mode,'boat');assert.equal((await (await request('/api/quiz/history')).json()).active.id,boat.id);
const before=sqlite.prepare('SELECT count(*) n FROM quiz_attempts').get().n;const cross=await worker.fetch(new Request('https://ripa.example/api/quiz/start',{method:'POST',headers:{'oai-authenticated-user-id':'user-a',Origin:'https://evil.example','Content-Type':'application/json'},body:'{"mode":"lights"}'}),env);assert.equal(cross.status,403);assert.equal(sqlite.prepare('SELECT count(*) n FROM quiz_attempts').get().n,before);
for(let i=0;i<50;i++){const questions=makeQuestions();assert.equal(new Set(questions.map(q=>q.choices[q.correct].id)).size,10);for(const q of questions){assert.equal(new Set(q.choices.map(c=>c.id)).size,4);const family=families.find(f=>f.id===q.choices[q.correct].id);assert(family.presets.includes(q.presetId));assert(configuration(presets.find(p=>p.id===q.presetId)).lights.length>0);}}
for(const file of ['/','/quiz.js','/app.js','/observation.js','/quiz.css','/vendor/three.module.js','/vendor/three.core.min.js'])assert.equal((await request(file)).status,200,file);
assert.equal((await worker.fetch(new Request('https://ripa.example/api/quiz/history',{headers:{'oai-authenticated-user-id':'user-a'}}),{})).status,503);
console.log('PASS: complete 10-question tests, exact scoring, four unique answers, both modes, durable SQLite readback, resumable progress, idempotent retry, private user isolation, origin checks and served 3D assets.');
