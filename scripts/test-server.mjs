import {preview} from 'vite';
export async function testServer(){
 if(process.env.CYBERCATS_TEST_URL)return {base:process.env.CYBERCATS_TEST_URL,close:async()=>{}};
 const server=await preview({preview:{host:'127.0.0.1',port:5188,strictPort:true},logLevel:'warn'});
 return {base:'http://127.0.0.1:5188/frc-simulator/',close:()=>new Promise(resolve=>server.httpServer.close(resolve))};
}
