import fs from 'node:fs';
const upper=[643,644,645,655,668,677,679,684,686,689,692,693,697,698,701,703,704,707,709,710,713,715,716,718,723,724,729,730,739,740,741,746,754,777,779,819,821,835,836];
const lower=[650,669,680,682,706,776,778];
const pin=[648,649,672,678,699,702,705,708,738,742,744,753,798,820,855,...Array.from({length:17},(_,i)=>838+i)];
const fixed=[714,720,734,747,756,774];
const assigned=new Set([...upper,...lower,...pin,...fixed]);
const coupler=Array.from({length:855-643+1},(_,i)=>643+i).filter(i=>!assigned.has(i));
const output=[1019,1131,1199,1211];
fs.writeFileSync('src/intake-groups.json',JSON.stringify({note:'Original part IDs. Driver arms and output flanges pivot at A; lower links at B; Coupler closes A-C-D-B. Rear Right Pin supports follow the measured F bearing and E slot. Motor housings travel only with their supporting body; fixed Pivot housing/frame stays stationary. Internal cycloidal eccentric-disc motion is not fabricated.',upper:[...upper,...output],lower,pin,coupler,fixed,rollers:[{parts:[802,808,810,817,818],body:'coupler',center:0},{parts:[757,763,765,767,771],body:'coupler',center:1},{parts:[780,785,786,789,794],body:'coupler',center:2},{parts:[838,839,844,851,852],body:'pin',center:3}]},null,2)+'\n');
