import {makeQuestions} from './quiz-bank.js';

const key = 'ripa.practice.v1';

export async function localQuiz(path, body) {
  function handle() {
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    if (path.startsWith('history')) {
      const offset = Number(new URL(path, location.href).searchParams.get('offset')) || 0;
      const finished = attempts.filter(item => item.completedAt);
      return {
        items: finished.slice(offset, offset + 20).map(item => ({...item, completed_at: item.completedAt})),
        nextOffset: finished.length > offset + 20 ? offset + 20 : null,
        active: attempts.find(item => !item.completedAt)
      };
    }
    if (path === 'start') {
      const attempt = {id: crypto.randomUUID(), mode: body.mode, startedAt: new Date().toISOString(),
        completedAt: null, score: null, answers: [], questions: makeQuestions()};
      attempts.unshift(attempt);
      localStorage.setItem(key, JSON.stringify(attempts));
      return attempt;
    }
    const attempt = attempts.find(item => item.id === (body?.id || path.split('/')[1]));
    if (!attempt) throw Error('No se encuentra este test en este navegador.');
    if (path === 'answer') {
      if (body.index === attempt.answers.length && !attempt.completedAt) {
        attempt.answers.push(body.choice);
        if (attempt.answers.length === attempt.questions.length) {
          attempt.completedAt = new Date().toISOString();
          attempt.score = attempt.answers.filter((value,i) => value === attempt.questions[i].correct).length;
        }
        localStorage.setItem(key, JSON.stringify(attempts));
      } else if (attempt.answers[body.index] !== body.choice) {
        throw Error('El test ha cambiado en otra pestaña.');
      }
    }
    return attempt;
  }
  return navigator.locks ? navigator.locks.request(key, handle) : handle();
}
