import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

export async function testServer(){
 if(process.env.CYBERCATS_TEST_URL)return {base:process.env.CYBERCATS_TEST_URL,close:async()=>{}};
 // Vite preview applies the dev base ('/'), while the bundle uses '/frc-simulator/'.
 // Serve exactly as GitHub Pages does so a missing production asset fails visibly.
 const port=5188,base=`http://127.0.0.1:${port}/frc-simulator/`;
 const child=spawn(process.execPath,[fileURLToPath(new URL('./preview-pages.mjs',import.meta.url))],{
  cwd:process.cwd(),env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe'],
 });
 let output='';
 child.stdout.on('data',chunk=>{output+=chunk.toString();});
 child.stderr.on('data',chunk=>{output+=chunk.toString();});
 for(let i=0;i<100;i++){
  if(child.exitCode!==null)throw new Error(`Pages preview exited: ${output}`);
  try{if((await fetch(base)).ok)return {base,close:async()=>{child.kill();await delay(50);}};}catch{}
  await delay(50);
 }
 child.kill();
 throw new Error(`Pages preview did not start: ${output}`);
}
