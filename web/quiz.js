import {showQuizScene,restoreStudyScene} from './app.js';
const main=document.querySelector('main');
const nav=document.createElement('nav');nav.className='app-nav';nav.setAttribute('aria-label','Secciones del simulador');nav.innerHTML='<button data-screen="study" aria-current="page">Explorar</button><button data-screen="test">Hacer un test</button><button data-screen="history">Mis resultados</button>';document.querySelector('header').after(nav);
const page=document.createElement('section');page.className='quiz-page';page.hidden=true;nav.after(page);
const panel=document.createElement('section');panel.className='quiz-panel';panel.hidden=true;document.querySelector('.views').after(panel);
const letters=['A','B','C','D'];let attempt=null,selected=null,busy=false,historyItems=[],nextOffset=null,reviewAttempt=null;
const labelMode=mode=>mode==='boat'?'Luces con barco':'Solo luces';
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function btn(label,fn,cls=''){const b=el('button',cls,label);b.type='button';b.onclick=fn;return b;}
function message(container,text,error=false){const p=el('p',error?'quiz-error':'hint',text);p.setAttribute('role',error?'alert':'status');container.append(p);return p;}
function screen(name){restoreStudyScene();document.body.classList.remove('test-scene');panel.hidden=true;main.hidden=name!=='study';page.hidden=name==='study';page.replaceChildren();nav.querySelectorAll('button').forEach(b=>{if(b.dataset.screen===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
async function api(path,body){const response=await fetch('/api/quiz/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store'});let value;try{value=await response.json();}catch{throw Error('No se puede conectar con el historial. Recarga e inicia sesión de nuevo si es necesario.');}if(!response.ok)throw Error(value.error||'No se ha podido completar la operación.');return value;}
function heading(title,subtitle){page.append(el('div','eyebrow','ENTRENAMIENTO · UT 06'),el('h1','',title));if(subtitle)page.append(el('p','quiz-intro',subtitle));}
function navLock(lock){nav.querySelectorAll('button').forEach(b=>b.disabled=lock);}
async function home(){screen('test');heading('Reconoce las luces.','10 preguntas · cuatro respuestas A–D · una sola correcta. Los resultados se guardan en tu cuenta.');
 const cards=el('div','quiz-modes');for(const [mode,title,description]of [['lights','Solo luces','Identifica la embarcación sin ver el casco. Puedes girar y acercarte.'],['boat','Luces con barco','Observa la embarcación en 3D junto a sus luces de navegación.']]){const card=el('article','quiz-mode');card.append(el('span','eyebrow',mode==='lights'?'MODO 01':'MODO 02'),el('h2','',title),el('p','',description),btn('Empezar test',()=>start(mode),'primary'));cards.append(card);}page.append(cards);
 message(page,'Se pregunta por el tipo o la condición de la embarcación, no por su eslora exacta. Los casos con luces indistinguibles se agrupan o se excluyen. Gira la escena antes de decidir: una sola vista puede no ser suficiente.');
 const resume=el('div','quiz-resume');page.append(resume);message(resume,'Buscando tests pendientes…');try{const h=await api('history');resume.replaceChildren();if(h.active){resume.append(el('p','',`Tienes un test de ${labelMode(h.active.mode).toLowerCase()} pendiente: ${h.active.answers.length}/10 respuestas guardadas.`),btn('Continuar test',()=>{attempt=h.active;showQuestion();}));}}catch(e){resume.replaceChildren();message(resume,e.message,true);}
}
async function start(mode){if(busy)return;busy=true;navLock(true);page.querySelectorAll('button').forEach(b=>b.disabled=true);const status=message(page,'Preparando y guardando tu test…');try{attempt=await api('start',{mode});showQuestion();}catch(e){status.textContent=e.message;status.className='quiz-error';page.querySelectorAll('button').forEach(b=>b.disabled=false);}finally{busy=false;navLock(false);}}
function openScene(q,withBoat){page.hidden=true;main.hidden=false;document.body.classList.add('test-scene');panel.hidden=false;showQuizScene(q,withBoat);}
function showQuestion(){if(attempt.completedAt){results(attempt);return;}selected=null;const index=attempt.answers.length,q=attempt.questions[index];openScene(q,attempt.mode==='boat');panel.replaceChildren();
 const top=el('div','quiz-question-head');top.append(el('div','eyebrow',`${labelMode(attempt.mode).toUpperCase()} · PREGUNTA ${index+1} DE 10`),btn('Pausar test',()=>home(),'text-button'));panel.append(top);
 const progress=el('progress');progress.max=10;progress.value=index;progress.setAttribute('aria-label',`${index} de 10 respuestas guardadas`);panel.append(progress,el('h2','','¿Qué tipo de embarcación muestran estas luces?'));
 const choices=el('div','quiz-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Elige una respuesta');
 const confirm=btn(index===9?'Finalizar y guardar resultado':'Confirmar y continuar',()=>answer(index),'primary');confirm.disabled=true;confirm.id='confirmQuiz';
 q.choices.forEach((choice,i)=>{const b=btn('',()=>{if(busy)return;selected=i;choices.querySelectorAll('button').forEach((x,j)=>x.setAttribute('aria-pressed',String(i===j)));confirm.disabled=false;});b.setAttribute('aria-pressed','false');b.append(el('span','answer-letter',letters[i]),el('span','',choice.label));choices.append(b);});panel.append(choices);
 const actions=el('div','quiz-actions');actions.append(confirm,el('span','hint','Cada respuesta se guarda al confirmarla.'));panel.append(actions,el('div','quiz-feedback'));panel.querySelector('h2').tabIndex=-1;panel.querySelector('h2').focus({preventScroll:true});
}
async function answer(index){if(busy||selected===null)return;busy=true;navLock(true);panel.querySelectorAll('button').forEach(b=>b.disabled=true);const feedback=panel.querySelector('.quiz-feedback');feedback.replaceChildren();message(feedback,'Guardando respuesta…');
 try{attempt=await api('answer',{id:attempt.id,index,choice:selected});showQuestion();}
 catch(e){
  // A dropped response may follow a successful commit. Read back before offering retry.
  try{const latest=await api('attempt/'+attempt.id);if(latest.answers.length>index){attempt=latest;showQuestion();return;}}catch{}
  feedback.replaceChildren();message(feedback,e.message,true);panel.querySelectorAll('button').forEach(b=>b.disabled=false);
 }finally{busy=false;navLock(false);}
}
function results(record){reviewAttempt=record;screen('history');heading('Resultado del test',labelMode(record.mode)+' · '+new Date(record.completedAt).toLocaleString('es-ES'));
 const score=el('div','quiz-score');score.append(el('strong','',record.score+'/10'),el('span','',`${record.score} aciertos · ${10-record.score} errores`),el('span','saved-tag','Guardado en tu cuenta'));page.append(score);
 const actions=el('div','quiz-actions');actions.append(btn('Nuevo test',()=>home(),'primary'),btn('Ver historial',()=>history()));page.append(actions,el('h2','','Repasa tus respuestas'));
 record.questions.forEach((q,i)=>{const chosen=record.answers[i],correct=chosen===q.correct,card=el('article','review-question '+(correct?'correct':'incorrect'));card.append(el('div','eyebrow',`PREGUNTA ${i+1} · ${correct?'CORRECTA':'INCORRECTA'}`),el('h3','',q.choices[q.correct].label));const list=el('div','review-options');q.choices.forEach((c,j)=>{const item=el('p',j===q.correct?'answer-correct':j===chosen?'answer-wrong':'',`${letters[j]}. ${c.label}${j===chosen?' — Tu respuesta':''}${j===q.correct?' — Correcta':''}`);list.append(item);});card.append(list,el('p','',q.explanation),btn('Ver la escena de esta pregunta',()=>reviewScene(record,i)));page.append(card);});
 window.scrollTo({top:0,behavior:'instant'});
}
function reviewScene(record,index){const q=record.questions[index];openScene(q,record.mode==='boat');panel.replaceChildren();panel.append(el('div','eyebrow',`REPASO · PREGUNTA ${index+1} DE 10`),el('h2','',q.choices[q.correct].label),el('p','',q.explanation),btn('Volver al resultado',()=>results(record),'primary'));}
async function history(more=false){if(!more){screen('history');heading('Mis resultados','Historial personal, guardado con tu cuenta. Abre un test para revisar las diez preguntas y sus respuestas.');historyItems=[];nextOffset=null;}
 const status=message(page,'Cargando resultados…');try{const data=await api('history'+(more?'?offset='+nextOffset:''));status.remove();historyItems.push(...data.items);nextOffset=data.nextOffset;page.querySelector('.history-list')?.remove();page.querySelector('.load-more')?.remove();
 const list=el('div','history-list');if(!historyItems.length)message(list,'Aún no has terminado ningún test. Tus resultados aparecerán aquí al completar las 10 preguntas.');for(const item of historyItems){const row=btn('',async()=>{row.disabled=true;try{results(await api('attempt/'+item.id));}catch(e){message(page,e.message,true);row.disabled=false;}},'history-row');const copy=el('span');copy.append(el('strong','',labelMode(item.mode)),el('small','',new Date(item.completed_at).toLocaleString('es-ES')));row.append(copy,el('span','history-score',item.score+'/10'),el('span','','Repasar'));list.append(row);}page.append(list);if(nextOffset!==null)page.append(btn('Cargar más resultados',()=>history(true),'load-more'));
 }catch(e){status.textContent=e.message;status.className='quiz-error';page.append(btn('Reintentar',()=>history()));}
}
nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(busy)return;if(b.dataset.screen==='study')screen('study');else if(b.dataset.screen==='test')home();else history();});
