import {makeQuestions} from '../web/quiz-bank.js';
import {database,findAttempt} from './db.js';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
function publicAttempt(row){const complete=!!row.completed_at;return {id:row.id,mode:row.mode,startedAt:row.started_at,completedAt:row.completed_at,score:row.score,answers:JSON.parse(row.answers_json),questions:JSON.parse(row.questions_json).map(q=>complete?q:({presetId:q.presetId,situation:q.situation,bearing:q.bearing,choices:q.choices}))};}
export async function api(request,env){
 const user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({error:'Inicia sesión con tu cuenta de ChatGPT para guardar y consultar tus tests.'},401);
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','POST'].includes(request.method))return json({error:'Método no permitido.'},405);
 if(request.method==='POST'){
  const origin=request.headers.get('origin');
  if(origin&&origin!==url.origin)return json({error:'Origen no permitido.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Formato no válido.'},415);
 }
 try{
 const db=database(env);
 if(path==='/api/quiz/history'&&request.method==='GET'){
  const offset=Math.max(0,Math.min(1000000,Number.parseInt(url.searchParams.get('offset')||'0')||0));
  const result=await db.prepare('SELECT id,mode,started_at,completed_at,score FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY started_at DESC,id DESC LIMIT 21 OFFSET ?').bind(user,offset).all();
  const active=offset===0?await db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? AND completed_at IS NULL ORDER BY started_at DESC,id DESC LIMIT 1').bind(user).first():null;
  return json({items:result.results.slice(0,20),nextOffset:result.results.length>20?offset+20:null,active:active?publicAttempt(active):null});
 }
 const match=path.match(/^\/api\/quiz\/attempt\/([0-9a-f-]{36})$/);
 if(match&&request.method==='GET'){const row=await findAttempt(env,user,match[1]);return row?json(publicAttempt(row)):json({error:'Test no encontrado.'},404);}
 let body;
 if(request.method==='POST'){const raw=await request.text();if(raw.length>2048)return json({error:'Petición demasiado grande.'},413);try{body=JSON.parse(raw);}catch{return json({error:'Petición no válida.'},400);}}
 if(path==='/api/quiz/start'&&request.method==='POST'){
  if(!['lights','boat'].includes(body?.mode))return json({error:'Elige un modo de test.'},400);
  const row={id:crypto.randomUUID(),user_id:user,mode:body.mode,started_at:new Date().toISOString(),completed_at:null,score:null,questions_json:JSON.stringify(makeQuestions()),answers_json:'[]'};
  await db.prepare('INSERT INTO quiz_attempts(id,user_id,mode,started_at,questions_json,answers_json) VALUES(?,?,?,?,?,?)').bind(row.id,user,row.mode,row.started_at,row.questions_json,row.answers_json).run();return json(publicAttempt(row),201);
 }
 if(path==='/api/quiz/answer'&&request.method==='POST'){
  if(!body||typeof body.id!=='string'||!Number.isInteger(body.index)||body.index<0||body.index>9||!Number.isInteger(body.choice)||body.choice<0||body.choice>3)return json({error:'Respuesta no válida.'},400);
  const row=await findAttempt(env,user,body.id);if(!row)return json({error:'Test no encontrado.'},404);
  const answers=JSON.parse(row.answers_json),qs=JSON.parse(row.questions_json);
  if(body.index<answers.length){if(answers[body.index]===body.choice)return json(publicAttempt(row));return json({error:'Esa pregunta ya estaba respondida. Recarga el test para continuar.'},409);}
  if(row.completed_at||body.index!==answers.length)return json({error:'Responde las preguntas en orden.'},409);
  answers.push(body.choice);const complete=answers.length===10,score=complete?answers.filter((a,i)=>a===qs[i].correct).length:null;
  const result=await db.prepare('UPDATE quiz_attempts SET answers_json = ?,score = ?,completed_at = ? WHERE id = ? AND user_id = ? AND answers_json = ?').bind(JSON.stringify(answers),score,complete?new Date().toISOString():null,row.id,user,row.answers_json).run();
  if(result.meta.changes!==1)return json({error:'El test cambió en otra pestaña. Recárgalo para continuar.'},409);
  return json(publicAttempt(await findAttempt(env,user,row.id)));
 }
 return json({error:'Ruta no encontrada.'},404);
 }catch(error){console.error('Quiz storage error',error?.message);return json({error:'No se ha podido guardar o cargar el test. Tu respuesta sigue en pantalla; vuelve a intentarlo.'},503);}
}
