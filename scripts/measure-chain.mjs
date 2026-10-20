// Extract the existing links; no replacement chain or geometry is generated.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createCadTransform} from './cad-profile.mjs';
const profile=JSON.parse(fs.readFileSync('src/robot-profile.json'));
const tr=createCadTransform(profile.cad);
const source=JSON.parse(fs.readFileSync('../docs/cad-analysis/cad-nodes.json'));
const nodes=JSON.parse(fs.readFileSync('test-results/cybercats/mechanism-nodes.json'));
const bodies=source.filter(n=>n.ownBounds&&n.path.includes('V2 Dye Rotor Assemb.')).map(n=>({node:n.node,name:n.name,c:tr.point(n.ownBounds.center)}));
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const measure=pid=>{
 const part=nodes.find(n=>n.pid===pid),b=part.box,c=b.slice(0,3).map((x,i)=>(x+b[i+3])/2);
 const matches=bodies.filter(n=>n.name===part.name||(part.name==='Part'&&n.name==='(unnamed)')).sort((a,b)=>distance(a.c,c)-distance(b.c,c));
 assert.ok(matches.length&&distance(matches[0].c,c)<.001,`No source match for ${pid}`);
 return {pid,sourceNode:matches[0].node,center:matches[0].c};
};
const links=Array.from({length:107},(_,i)=>measure(1363+i));
const ordered=[links[0]],remaining=links.slice(1);
while(remaining.length){const last=ordered.at(-1);remaining.sort((a,b)=>distance(a.center,last.center)-distance(b.center,last.center));ordered.push(remaining.shift());}
let length=0;
for(let i=0;i<ordered.length;i++){const d=distance(ordered[i].center,ordered[(i+1)%ordered.length].center);assert.ok(d>.007&&d<.011,`Discontinuous chain at ${i}`);length+=d;}
const data={sourceSha256:profile.cad.sourceSha256,note:'107 original chain links, ordered along their CAD centerline. Interpolated path is a display approximation; speed/direction remain demo settings.',length,links:ordered,shafts:{motor:measure(1274),idler1:measure(1275),idler2:measure(1297),driven:measure(1342)}};
fs.writeFileSync('src/cad-chain.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({links:links.length,length,shafts:data.shafts}));
