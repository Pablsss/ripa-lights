import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
const output = 'dist/viewer';
await mkdir(output, {recursive: true});
await cp('web', output, {recursive: true});
const html = await readFile('web/index.html', 'utf8');
await writeFile(output + '/index.html', html.replace('<html lang="es">', '<html lang="es" data-practice="local">'));
await writeFile(output + '/.nojekyll', '');
await cp('LICENSE', output + '/LICENSE');
