import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=process.argv[2]??process.env.CYBERCATS_CAD;
assert.ok(source,'Pass the original GLB path or set CYBERCATS_CAD');
// Read just the source JSON chunk; the large geometry buffer stays untouched.
const fd=fs.openSync(source,'r');
let gltf;
try{
 const header=Buffer.alloc(20);fs.readSync(fd,header,0,20,0);
 assert.equal(header.toString('ascii',0,4),'glTF');
 assert.equal(header.readUInt32LE(16),0x4e4f534a);
 const json=Buffer.alloc(header.readUInt32LE(12));fs.readSync(fd,json,0,json.length,20);
 gltf=JSON.parse(json.toString('utf8'));
}finally{fs.closeSync(fd);}
const profile=JSON.parse(fs.readFileSync('src/robot-profile.json','utf8'));
const actual=JSON.parse(fs.readFileSync(`public/${profile.assets.parts}`,'utf8'));
const name=s=>(s??'').replace(/^occurrence of\s*/i,'').trim().replace(/\s*<\d+>$/,'').trim()||'Part';
const expected=[[profile.name,-1,0]],ids=[0];let instances=0,wrappers=0;
function visit(index,parent,depth,ancestor){
 const node=gltf.nodes[index],kids=node.children??[],mesh=node.mesh!==undefined;
 const wrapper=!mesh&&kids.length===1&&gltf.nodes[kids[0]].mesh!==undefined&&!(gltf.nodes[kids[0]].children?.length);
 let group=parent;
 if(wrapper)wrappers++;
 if(!mesh&&!wrapper&&depth>0){group=expected.length;expected.push([name(node.name),parent,0]);}
 if(mesh){
  instances++;ids.push(expected.length);
  expected.push([name(/^occurrence of/i.test(ancestor??'')?ancestor:node.name),parent,1]);
 }
 for(const child of kids)visit(child,group,depth+1,node.name);
}
for(const root of gltf.scenes[gltf.scene??0].nodes)visit(root,0,0,null);
assert.deepEqual(actual.tree.map(([n,p,k])=>[actual.names[n],p,k]),expected,'Every named assembly, part and parent relation matches the source after collapsing occurrence wrappers');
assert.deepEqual(actual.partNode,ids,'Every source mesh instance retains its individual selectable part ID');
const result={passed:true,sourceNodes:gltf.nodes.length,sourceMeshInstances:instances,selectableParts:ids.length-1,viewerTreeNodes:expected.length,collapsedOccurrenceWrappers:wrappers,note:'The source root uses the CyberCats display name; redundant one-child occurrence wrappers collapse into their part. Assembly and individual part relationships are preserved in metadata; rendering batches geometry.'};
fs.writeFileSync('test-results/cybercats/hierarchy-results.json',JSON.stringify(result,null,2));
console.log('PASS',JSON.stringify(result));
