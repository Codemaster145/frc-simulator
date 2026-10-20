import type {CadMotion} from './cad-rig';
import chain from './cad-chain.json';
import {sprocketSign} from './cad-chain-motion';
import {MAIN_CENTER,UPPER_CENTER,LOWER_CENTER,SHOOTER_AXIS,REST_PITCH} from './ptooey-geometry';
import hood from './hood-calibration.json';
import intake from './intake-calibration.json';
import intakeGroups from './intake-groups.json';
import rotor from './indexer-rotor.json';
import {A,B,C,F,ROLLER_CENTERS} from './intake-linkage';
const intakeMotions:CadMotion[]=(['upper','lower','coupler','pin'] as const).map((body,i)=>({
 id:i===0?'intake':'intake-'+body,name:'Arthritis deployment · estimated limit',subsystem:'intake',
 pivot:[A,B,C,F][i],axis:[1,0,0],parts:intakeGroups[body],intakeBody:body,min:0,max:intake.maximumDegrees,
 hidden:i!==0,drive:i===0?undefined:{id:'intake',ratio:1},states:i===0?{Deployed:0,'Retracted (estimate)':intake.stowedDegrees}:undefined,
}));
intakeGroups.rollers.forEach((r,i)=>intakeMotions.push({id:i===0?'intake-rollers':'intake-roller-'+i,name:'Intake rollers · demo speed',subsystem:'intake',parent:'intake-'+r.body,
 pivot:ROLLER_CENTERS[r.center],axis:[1,0,0],parts:r.parts,min:-180,max:180,continuous:i===0,hidden:i!==0,drive:i===0?undefined:{id:'intake-rollers',ratio:1},
}));
const upper=[1975,1990,2006,2016,2029,2032,2036,2058,2081,2083,2107,2113,2146,2147];
const lower=[1978,2002,2003,2012,2038,2053,2065,2066,2072,2102,2112,2120];
const hoodGear=[1979,1995,2018,2049,2061,2088,2092];
const hoodParts=[...upper,...lower,...hoodGear,1973,1982,1988,1992,2000,2001,2024,2046,2050,2052,2054,2062,2063,2067,2087,2098,2101,2108,2111,2118,2127,2128,2132,2133,2144,2159];

// Measured from the two brass-wheel centers and the shared 9.75-inch hex shaft in this CAD.
// These controls inspect CAD geometry; they do not claim a motor speed or rotation direction.
export const CAD_MOTIONS:CadMotion[]=[...intakeMotions,{
 id:'ptooey-turret',name:'Ptooey turret · demo limits',subsystem:'turrets',
 pivot:[.006337300168955114,.3393053916515788,0],axis:[0,1,0],
 // Team confirmed the upper assembly and camera. AndyMark am-5743 guide steps 1–4
 // plus the matching CAD stack-up establish that the support ring and bearing stacks
 // are bolted to the gear and orbit with it; the wide base plate and external drive stay fixed.
 nodes:[2195,1930,1997,2063,2129],parts:[1666,1684,1686,1705],min:-180,max:180,
},{
 id:'ptooey-flywheel',name:'Flywheel shaft · uncalibrated speed',subsystem:'turrets',parent:'ptooey-turret',
 pivot:[.00615424454760889,.4457745967665693,-.10185383411269096],
 axis:[.999999936866,0,.0003553436],
 parts:[1974,1997,2010,2026,2077,2082,2089,2090,2093,2117,2145,2157],
 min:-180,max:180,continuous:true,
},{
 id:'ptooey-hood',name:'Adjustable hood · relative to CAD pose (demo limits)',subsystem:'turrets',parent:'ptooey-turret',
 pivot:MAIN_CENTER,axis:SHOOTER_AXIS,parts:hoodParts,min:hood.minDegrees-REST_PITCH*180/Math.PI,max:hood.maxDegrees-REST_PITCH*180/Math.PI,
},{
 id:'ptooey-upper',name:'Upper shooter roller bank',subsystem:'turrets',parent:'ptooey-hood',pivot:UPPER_CENTER,axis:SHOOTER_AXIS,parts:upper,min:-180,max:180,hidden:true,
 drive:{id:'ptooey-flywheel',ratio:-.9}, // CAD: 18T/20T belt, then reversing 28T/28T gears
},{
 id:'ptooey-lower',name:'Lower shooter roller bank',subsystem:'turrets',parent:'ptooey-hood',pivot:LOWER_CENTER,axis:SHOOTER_AXIS,parts:lower,min:-180,max:180,hidden:true,
 drive:{id:'ptooey-flywheel',ratio:-.9}, // upper/lower 24T/24T belt
},{
 id:'ptooey-hood-drive',name:'Hood roller drive shaft',subsystem:'turrets',parent:'ptooey-hood',pivot:[-.10957958279693258,.5569033442297954,.03675579199864408],axis:SHOOTER_AXIS,parts:hoodGear,min:-180,max:180,hidden:true,drive:{id:'ptooey-flywheel',ratio:.9},
},{
 id:'dye-drive',name:'Indexer output shaft · demo speed',subsystem:'indexer',
 pivot:chain.shafts.motor.center as [number,number,number],axis:[0,1,0],
 parts:[1234,1271,1274,1305,1332,1499],min:-180,max:180,continuous:true,
},{
 id:'dye-driven',name:'V2 Dye Rotor guide / 42T hub',subsystem:'indexer',
 // Revolute 2 confirmed by the team; original bolted guide/plate stack follows the hub.
 // External motor, idler-bearing mounts and Flopper remain outside this group.
 // Carried roller banks keep their CAD pose; their relative drive is still uncalibrated.
 pivot:chain.shafts.driven.center as [number,number,number],axis:[0,1,0],nodes:[1545],parts:rotor.carrier,min:-180,max:180,hidden:true,
 drive:{id:'dye-drive',ratio:12/42*sprocketSign(chain.shafts.motor.center)/sprocketSign(chain.shafts.driven.center)},
},...([
 ['idler1',[1238,1275,1306,1479]],['idler2',[1245,1272,1297,1484]],
] as const).map(([key,parts]):CadMotion=>({
 id:`dye-${key}`,name:`Indexer ${key}`,subsystem:'indexer',
 pivot:chain.shafts[key].center as [number,number,number],axis:[0,1,0],parts:[...parts],
 drive:{id:'dye-drive',ratio:sprocketSign(chain.shafts.motor.center)/sprocketSign(chain.shafts[key].center)},min:-180,max:180,hidden:true,
})),...chain.links.map((l,index):CadMotion=>({
 id:`dye-link-${l.pid}`,name:'Original indexer chain link',subsystem:'indexer',
 pivot:l.center as [number,number,number],axis:[0,1,0],parts:[l.pid],chainIndex:index,
 drive:{id:'dye-drive',ratio:1},min:-180,max:180,hidden:true,
}))];

export const CAD_REVIEW_AXES={
 turret:{pivot:[.006337300168955114,.3393053916515788,0],axis:[0,1,0]},
 indexer:{pivot:[.006349999825268842,.0846237788209697,0],axis:[0,1,0]},
};
