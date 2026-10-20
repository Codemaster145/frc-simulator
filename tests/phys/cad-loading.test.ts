import {expect,test,vi} from 'vitest';
import {Viewer} from '../../src/viewer';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Group} from 'three';

test.each([404,200])('missing or malformed parts metadata prevents readiness (HTTP %s)',async status=>{
  const load=Viewer.prototype.load;
  const model=new Uint8Array([0x67,0x6c,0x54,0x46]); // Header checked before the stubbed GLTF parser.
  const fake={state:null,parts:null,setupRobot:vi.fn()};
  vi.spyOn(GLTFLoader.prototype,'parseAsync').mockResolvedValue({scene:new Group()} as unknown as GLTF);
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url.endsWith('.json'))return new Response(status===200?'broken JSON':'missing',{status});
    return new Response(model,{status:200});
  }));
  try{
    await expect(load.call(fake as unknown as Viewer,'missing.glb','missing.json',()=>{})).rejects.toThrow();
    expect(fake.setupRobot).not.toHaveBeenCalled();
  }finally{vi.unstubAllGlobals();vi.restoreAllMocks();}
});
