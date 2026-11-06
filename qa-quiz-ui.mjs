import {Window} from 'happy-dom';
import {readFileSync} from 'node:fs';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
import assert from 'node:assert/strict';
import {makeQuestions} from './web/quiz-bank.js';
const window=new Window({url:'https://test.local'});window.document.write(readFileSync('web/index.html','utf8'));const document=window.document;
let saved,sceneCalls=[],restored=0,failNext=false;
const publicRecord=()=>({...saved,questions:saved.questions.map(q=>saved.completedAt?q:({presetId:q.presetId,situation:q.situation,bearing:q.bearing,choices:q.choices}))});
async function fetch(url,opts={}){const body=opts.body?JSON.parse(opts.body):null;let value;
 if(url.endsWith('/history'))value={items:saved?.completedAt?[{id:saved.id,mode:saved.mode,score:saved.score,completed_at:saved.completedAt}]:[],active:saved&&!saved.completedAt?publicRecord():null,nextOffset:null};
 else if(url.endsWith('/start')){saved={id:'test-id',mode:body.mode,startedAt:new Date().toISOString(),completedAt:null,score:null,answers:[],questions:makeQuestions()};value=publicRecord();}
 else if(url.endsWith('/answer')){if(failNext){failNext=false;throw Error('Prueba de desconexión');}saved.answers.push(body.choice);if(saved.answers.length===10){saved.completedAt=new Date().toISOString();saved.score=saved.answers.filter((a,i)=>a===saved.questions[i].correct).length;}value=publicRecord();}
 else if(url.includes('/attempt/'))value=publicRecord();else throw Error(url);
 return{ok:true,json:async()=>structuredClone(value)};
}
const context=createContext({window,document,fetch,console,Date,Error});
const stub=new SyntheticModule(['showQuizScene','restoreStudyScene'],function(){this.setExport('showQuizScene',(q,boat)=>sceneCalls.push({q,boat}));this.setExport('restoreStudyScene',()=>restored++);},{context});
const module=new SourceTextModule(readFileSync('web/quiz.js','utf8'),{context});await module.link(()=>stub);await module.evaluate();
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
button('Hacer un test').click();await settle();assert.equal(document.querySelectorAll('.quiz-mode').length,2);
button('Empezar test').click();await settle();assert.equal(sceneCalls.at(-1).boat,false);assert.equal(document.querySelectorAll('.quiz-choices button').length,4);assert(document.getElementById('confirmQuiz').disabled);
document.querySelector('.quiz-choices button').click();failNext=true;button('Confirmar y continuar').click();await settle();assert.equal(saved.answers.length,0);assert(document.querySelector('.quiz-error'));assert(!document.getElementById('confirmQuiz').disabled);
for(let i=0;i<10;i++){document.querySelectorAll('.quiz-choices button')[i%4].click();document.getElementById('confirmQuiz').click();await settle();assert.equal(saved.answers.length,i+1);}
assert(document.querySelector('.quiz-score').textContent.includes('Guardado'));assert.equal(document.querySelectorAll('.review-question').length,10);
button('Ver la escena de esta pregunta').click();assert(!document.querySelector('main').hidden);assert(document.querySelector('.quiz-panel').textContent.includes('REPASO'));
button('Volver al resultado').click();button('Ver historial').click();await settle();assert.equal(document.querySelectorAll('.history-row').length,1);
document.querySelector('.history-row').click();await settle();assert.equal(document.querySelectorAll('.review-question').length,10);
button('Nuevo test').click();await settle();document.querySelectorAll('.quiz-mode button')[1].click();await settle();assert.equal(sceneCalls.at(-1).boat,true);
button('Pausar test').click();await settle();button('Continuar test').click();assert.equal(sceneCalls.at(-1).boat,true);
button('Explorar').click();assert.equal(document.querySelector('main').hidden,false);assert(!document.body.classList.contains('test-scene'));assert(restored>0);
console.log('PASS: DOM UI flow, both modes, four choices, 10 answers, failed-save retry, result review, scene review, history, pause/resume, restoration. Render/WebGL not tested here.');
await window.happyDOM.close();
