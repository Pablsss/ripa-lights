import {build} from 'esbuild';
import {readFile,readdir,mkdir,cp} from 'node:fs/promises';
import {join} from 'node:path';
const assets={};
async function collect(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const key=prefix+'/'+entry.name;if(entry.isDirectory())await collect(join(dir,entry.name),key);else assets[key]=await readFile(join(dir,entry.name),'utf8');}}
await collect('web');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['server/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',plugins:[{name:'site-assets',setup(b){b.onResolve({filter:/^site-assets$/},()=>({path:'site-assets',namespace:'assets'}));b.onLoad({filter:/.*/,namespace:'assets'},()=>({contents:'export default '+JSON.stringify(assets),loader:'js'}));}}]});
console.log('Built Worker, embedded existing 3D assets and database migrations.');
