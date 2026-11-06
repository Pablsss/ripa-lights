export function database(env){if(!env.DB?.prepare)throw Error('Database unavailable');return env.DB;}
export async function findAttempt(env,user,id){return database(env).prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?').bind(id,user).first();}
