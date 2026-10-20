import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('public/models/cybercats.parts.json'));const name=n=>p.names[p.tree[n][0]];
for(let n=0;n<p.tree.length;n++)if(/dye|rotor|pinion|up.feed|new wall|hook|spline|main pulley/i.test(name(n)))console.log(JSON.stringify({node:n,name:name(n),parent:p.tree[n][1],pid:p.partNode.indexOf(n)}));
console.log('V2 subtree');for(let n=1433;n<1605;n++){let pid=p.partNode.indexOf(n);console.log(n,name(n),pid,pid>0?p.boxes.slice(pid*6,pid*6+6):'');}
