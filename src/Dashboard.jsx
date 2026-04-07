import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

/* ═══ TOKENS ═══ */
const C={bg:"#F3F4F7",surface:"#FFFFFF",surfaceDim:"#F8F9FB",text:"#1A1D2E",textSec:"#4B4F63",textDim:"#9196A8",blue:"#3568B2",blueLight:"#4178C4",blueSoft:"rgba(53,104,178,0.07)",blueMed:"rgba(53,104,178,0.13)",green:"#2A9D5C",greenBright:"#34BB6E",greenSoft:"rgba(42,157,92,0.07)",greenMed:"rgba(42,157,92,0.13)",red:"#D04545",redSoft:"rgba(208,69,69,0.07)",gold:"#C9960C",goldBright:"#E2AE2A",goldSoft:"rgba(201,150,12,0.07)",goldMed:"rgba(201,150,12,0.13)",orange:"#E07A3A",orangeSoft:"rgba(224,122,58,0.08)",purple:"#7B65B0",purpleSoft:"rgba(123,101,176,0.07)"};
const DIFF={easy:{pts:1,label:"Easy",color:C.green,bg:C.greenSoft},medium:{pts:3,label:"Med",color:C.blue,bg:C.blueSoft},hard:{pts:6,label:"Hard",color:C.orange,bg:C.orangeSoft}};
const sMult=s=>s>=30?{m:2,l:"2×"}:s>=14?{m:1.8,l:"1.8×"}:s>=7?{m:1.5,l:"1.5×"}:s>=3?{m:1.2,l:"1.2×"}:{m:1,l:null};
const pC=p=>p>=90?C.goldBright:p>=70?C.greenBright:p>=50?C.green:p>=30?C.gold:C.red;
const gB=p=>p>=80?`linear-gradient(90deg,${C.green},${C.goldBright})`:p>=50?`linear-gradient(90deg,${C.blue},${C.green})`:p>=25?`linear-gradient(90deg,${C.gold},${C.blue})`:`linear-gradient(90deg,${C.red},${C.gold})`;
const dk=d=>{const t=typeof d==="string"?new Date(d):d;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;};
const fd=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const uid=()=>`_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const FN={h:"'Audiowide',sans-serif",b:"'Inter',sans-serif"};

/* ═══ RANKS & LEVELS ═══ */
const RANKS=[{name:"Rookie",min:0,color:"#9196A8",icon:"🌱"},{name:"Bronze",min:5,color:"#CD7F32",icon:"🥉"},{name:"Silver",min:10,color:"#A8A8A8",icon:"🥈"},{name:"Gold",min:18,color:"#E2AE2A",icon:"🥇"},{name:"Diamond",min:28,color:"#4FC3F7",icon:"💎"},{name:"Legend",min:40,color:"#E07A3A",icon:"👑"},{name:"Master",min:55,color:"#9C27B0",icon:"🔮"},{name:"Grandmaster",min:75,color:"#FF1744",icon:"⚔️"},{name:"Immortal",min:100,color:"#FFD700",icon:"🌟"}];
const getLevel=xp=>Math.floor(Math.sqrt(xp/8))+1;
const getXPFor=lvl=>Math.round(Math.pow(lvl-1,2)*8);
const getRank=lv=>{for(let i=RANKS.length-1;i>=0;i--){if(lv>=RANKS[i].min)return RANKS[i];}return RANKS[0];};

/* ═══ TITLES / ACHIEVEMENTS ═══ */
const ACHIEVEMENTS=[
  {id:"early_bird",title:"Early Bird",desc:"Complete all morning tasks 14 days",icon:"🐦",check:(s)=>s.morningPerfect>=14},
  {id:"iron_will",title:"Iron Will",desc:"30-day global streak",icon:"🦾",check:(s)=>s.longestStreak>=30},
  {id:"night_owl",title:"Night Owl",desc:"Complete all night tasks 14 days",icon:"🦉",check:(s)=>s.nightPerfect>=14},
  {id:"photographer",title:"Photographer",desc:"Submit 100 proof photos",icon:"📸",check:(s)=>s.totalPhotos>=100},
  {id:"social",title:"Social Catalyst",desc:"Join 3+ groups",icon:"🤝",check:(s)=>s.groupCount>=3},
  {id:"perfectionist",title:"Perfectionist",desc:"10 perfect days in a month",icon:"✨",check:(s)=>s.perfectDays>=10},
  {id:"grinder",title:"The Grinder",desc:"Earn 1000 lifetime XP",icon:"⚡",check:(s)=>s.lifetimeXP>=1000},
  {id:"consistent",title:"Consistency King",desc:"Complete 80%+ for 30 days",icon:"📊",check:(s)=>s.consistentDays>=30},
  {id:"first_blood",title:"First Blood",desc:"Complete your first task",icon:"🎯",check:(s)=>s.lifetimeXP>0},
  {id:"week_warrior",title:"Week Warrior",desc:"7-day streak",icon:"🗡️",check:(s)=>s.longestStreak>=7},
  {id:"centurion",title:"Centurion",desc:"100-day streak",icon:"🏛️",check:(s)=>s.longestStreak>=100},
  {id:"photo_streak",title:"Proof Machine",desc:"30-day photo streak",icon:"🎞️",check:(s)=>s.photoStreak>=30},
];

/* ═══ DAILY CHALLENGES ═══ */
const CHALLENGE_POOL=[
  {id:"c1",text:"Complete all hard tasks today",xp:15,check:(dc,todos)=>todos.filter(t=>t.diff==="hard").every(t=>dc[t.id])},
  {id:"c2",text:"Submit 3 photo proofs today",xp:12,check:(dc,todos,photoLog,vk)=>(photoLog[vk]||[]).length>=3},
  {id:"c3",text:"Complete 20+ XP worth of tasks",xp:10,check:(dc,todos)=>{let s=0;todos.forEach(t=>{if(dc[t.id])s+=DIFF[t.diff]?.pts||1;});return s>=20;}},
  {id:"c4",text:"Finish all morning tasks by noon",xp:8,check:(dc,todos)=>todos.filter(t=>t.grp==="morning").every(t=>dc[t.id])},
  {id:"c5",text:"Complete at least 15 tasks",xp:10,check:(dc,todos)=>todos.filter(t=>dc[t.id]).length>=15},
  {id:"c6",text:"Perfect day — complete everything",xp:25,check:(dc,todos)=>todos.length>0&&todos.every(t=>dc[t.id])},
];

/* ═══ SHOP ═══ */
const SHOP_ITEMS=[
  {id:"shield",name:"Streak Shield",desc:"Protect streak for 1 missed day",cost:80,icon:"🛡️",cat:"Consumable"},
  {id:"double_xp",name:"Double XP Token",desc:"2× XP for one full day",cost:300,icon:"⚡",cat:"Consumable"},
  {id:"focus_boost",name:"Focus Boost",desc:"Focus tasks worth 1.5× for a day",cost:200,icon:"🎯",cat:"Consumable"},
  {id:"undo",name:"Undo Penalty",desc:"Reverse a missed day's penalty",cost:150,icon:"⏪",cat:"Power-up"},
  {id:"time_warp",name:"Time Warp",desc:"Complete yesterday's tasks at half XP",cost:250,icon:"⏰",cat:"Power-up"},
  {id:"insight",name:"Deep Insight",desc:"Unlock detailed analytics breakdown",cost:180,icon:"🔍",cat:"Power-up"},
  {id:"theme_dark",name:"Dark Mode",desc:"Unlock dark theme",cost:250,icon:"🌙",cat:"Theme"},
  {id:"theme_ocean",name:"Ocean Theme",desc:"Cool blue gradient",cost:200,icon:"🌊",cat:"Theme"},
  {id:"theme_sunset",name:"Sunset Theme",desc:"Warm evening gradient",cost:200,icon:"🌅",cat:"Theme"},
  {id:"badge_fire",name:"Fire Badge",desc:"Custom fire profile icon",cost:120,icon:"🔥",cat:"Badge"},
  {id:"badge_star",name:"Star Badge",desc:"Gold star badge",cost:100,icon:"⭐",cat:"Badge"},
  {id:"badge_diamond",name:"Diamond Badge",desc:"Exclusive diamond icon",cost:400,icon:"💠",cat:"Badge"},
  {id:"anim_sparkle",name:"Sparkle Effect",desc:"Sparkle on task complete",cost:150,icon:"✨",cat:"Cosmetic"},
  {id:"anim_pulse",name:"Pulse Effect",desc:"Pulse glow on completion",cost:150,icon:"💫",cat:"Cosmetic"},
  {id:"gold_check",name:"Gold Checkmark",desc:"Golden ✓ on completed tasks",cost:350,icon:"☑️",cat:"Cosmetic"},
  {id:"name_glow",name:"Name Glow",desc:"Animated glow on your name in groups",cost:500,icon:"💡",cat:"Flex"},
];

const card={background:C.surface,borderRadius:16,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"};
const lbl={fontFamily:FN.b,fontSize:13,fontWeight:700,color:C.text,marginBottom:14};
const inp={background:C.surfaceDim,border:"1px solid rgba(0,0,0,0.06)",borderRadius:10,padding:"11px 14px",color:C.text,fontSize:13,fontFamily:FN.b,fontWeight:500,outline:"none",width:"100%"};
const numI={...inp,textAlign:"center",fontWeight:600};
const btnB={background:C.blue,border:"none",borderRadius:10,padding:"11px 20px",color:"#fff",fontSize:13,fontFamily:FN.b,fontWeight:600,cursor:"pointer",transition:"all 0.15s ease"};
const btnG={background:C.surfaceDim,border:"none",borderRadius:10,padding:"9px 16px",color:C.textSec,fontSize:12,fontFamily:FN.b,fontWeight:500,cursor:"pointer",transition:"all 0.15s ease"};
const pill=(on,clr)=>({background:on?(clr||C.blue):C.surfaceDim,border:"none",borderRadius:20,padding:"6px 16px",color:on?"#fff":C.textDim,fontSize:12,fontFamily:FN.b,fontWeight:600,cursor:"pointer",transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)"});

const Tip=({active,payload,label:lb})=>{if(!active||!payload?.length)return null;return(<div style={{background:"#fff",borderRadius:10,padding:"8px 14px",fontSize:12,fontFamily:FN.b,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}><div style={{color:C.textDim,marginBottom:3,fontSize:11}}>{lb}</div>{payload.map((p,i)=>(<div key={i} style={{color:p.color||C.text,fontWeight:600}}>{p.name}: {typeof p.value==="number"?Math.round(p.value*10)/10:p.value}</div>))}</div>);};

const CSS=`
@keyframes checkPop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes xpFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-28px)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes milestoneIn{0%{opacity:0;transform:scale(0.7)}50%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes lootDrop{0%{opacity:0;transform:scale(0.5) rotate(-10deg)}50%{transform:scale(1.2) rotate(5deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.task-row{transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}.task-row:active{transform:scale(0.97)}
.hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{scrollbar-width:none}
.tab-content{animation:slideUp 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
.pill-btn{transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}.pill-btn:active{transform:scale(0.95)}
.nav-btn{transition:all 0.15s ease}.nav-btn:active{transform:scale(0.93)}
.press{transition:all 0.15s ease}.press:active{transform:scale(0.96)}
.overlay-bg{animation:overlayIn 0.2s ease}
.modal-box{animation:modalIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)}
.card-enter{animation:scaleIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}
.loot{animation:lootDrop 0.5s cubic-bezier(0.25,0.46,0.45,0.94)}
`;

/* ═══ DATA ═══ */
const defTodos=[{id:"m1",text:"Bed Made",diff:"easy",cat:"routine",grp:"morning",proof:false},{id:"m2",text:"Teeth Brushed",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"m3",text:"Face Cleaned",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"m4",text:"No Phone",diff:"medium",cat:"personal",grp:"morning",proof:false},{id:"m5",text:"Minoxidil",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"m6",text:"Vaseline",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"m7",text:"Shower",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"n1",text:"To-Do List",diff:"easy",cat:"personal",grp:"night",proof:false},{id:"n2",text:"Calendar Done",diff:"easy",cat:"personal",grp:"night",proof:false},{id:"n3",text:"Budgeting",diff:"medium",cat:"personal",grp:"night",proof:false},{id:"n4",text:"Journal",diff:"medium",cat:"personal",grp:"night",proof:false},{id:"n5",text:"Exercise",diff:"hard",cat:"health",grp:"night",proof:true},{id:"n6",text:"Career Work",diff:"hard",cat:"work",grp:"night",proof:false},{id:"n7",text:"Eat Healthy",diff:"medium",cat:"health",grp:"night",proof:false},{id:"n8",text:"Spanish 30 min",diff:"hard",cat:"personal",grp:"night",proof:false},{id:"n9",text:"Read 30 min",diff:"medium",cat:"personal",grp:"night",proof:false},{id:"n10",text:"10K Steps",diff:"hard",cat:"health",grp:"night",proof:false},{id:"n11",text:"Talk to Family",diff:"medium",cat:"personal",grp:"night",proof:false},{id:"n12",text:"5 To-Do's Done",diff:"medium",cat:"work",grp:"night",proof:false},{id:"n13",text:"I Won the Day",diff:"easy",cat:"personal",grp:"night",proof:false},{id:"n14",text:"3L Water",diff:"medium",cat:"health",grp:"night",proof:false},{id:"n15",text:"Pills Taken",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n16",text:"Clean Room",diff:"easy",cat:"personal",grp:"night",proof:false},{id:"n17",text:"Teeth Clean",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n18",text:"Minoxidil",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n19",text:"Creatine",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n20",text:"Shower",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n21",text:"Face Clean",diff:"easy",cat:"health",grp:"night",proof:false},{id:"n22",text:"No Social Media",diff:"hard",cat:"personal",grp:"night",proof:false},{id:"n23",text:"No Phone",diff:"medium",cat:"personal",grp:"night",proof:false}];
const defWeekly=[{id:"w1",text:"Workout 4 times",target:4,current:0},{id:"w2",text:"Go to Class 3x",target:3,current:0},{id:"w3",text:"Get Groceries",target:1,current:0}];
const defMonthly=[{id:"mg1",text:"80% No Social Media",type:"habit-pct",habitId:"n22",target:80},{id:"mg2",text:"85% Exercise",type:"habit-pct",habitId:"n5",target:85},{id:"mg3",text:"Sign Morgan Stanley",type:"check",done:false},{id:"mg5",text:"Go to Paris",type:"check",done:false},{id:"mg8",text:"Read a Full Book",type:"check",done:false}];
const defSplits={upper:["Bench Press","Lat Pull Down","Pec Dec","Mid Row","Tricep PD","Lat Raises","Ab Circuit"],lower:["Squat","RDL","Back Ext.","Leg Ext.","Calf Raises","Ab Circuit"],pull:["Rows (Up)","Rows (Mid)","Pulldown","Face Pulls","Shrugs"],push:["Cable Chest","Tricep Ext","Curls","Shoulder Press","Hammer Curls"],legs:["Paused Squat","Cable Lat Raise","Calf Raises"]};
const spClr={upper:"#4A82D4",lower:"#2A9D5C",pull:"#E07A3A",push:"#D04545",legs:"#7B65B0"};
const seedWH=[{id:"h6",date:"2026-03-15",split:"upper",exercises:[{name:"Bench Press",sets:[{w:50,r:10},{w:60,r:6}]},{name:"Lat Pull Down",sets:[{w:54,r:8},{w:59,r:7}]}]}];
const seedBW=[{date:"2025-10-01",weight:72.5},{date:"2026-01-01",weight:74.5},{date:"2026-03-01",weight:75.2},{date:"2026-03-29",weight:75.8}];
const seedTx={"2026-03-01":[{id:"t14",type:"out",amount:26.5,desc:"Sunday"}],"2026-03-06":[{id:"t16",type:"in",amount:30,desc:"Income"}],"2026-03-12":[{id:"t20",type:"out",amount:186.53,desc:"Large expense"}]};

const getPhase=h=>h>=5&&h<9?"morning":h>=9&&h<16?"day":h>=16&&h<20?"evening":"night";
const getCircBg=p=>p==="morning"?"linear-gradient(180deg,#FFE4C4 0%,#F3F4F7 100%)":p==="day"?"linear-gradient(180deg,#E8F0FE 0%,#F3F4F7 100%)":p==="evening"?"linear-gradient(180deg,#FFD6A5 0%,#F3F4F7 100%)":"linear-gradient(180deg,#2C3E6B 0%,#4A6FA0 40%,#F3F4F7 100%)";

/* ═══ COMPONENTS ═══ */
function Overlay({open,onClose,title,children,wide}){if(!open)return null;return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(20,22,36,0.25)",backdropFilter:"blur(8px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#fff",borderRadius:20,padding:24,width:"92%",maxWidth:wide?640:520,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:15,fontWeight:700,margin:0}}>{title}</h3><button className="press" onClick={onClose} style={{background:C.surfaceDim,border:"none",color:C.textDim,fontSize:16,cursor:"pointer",width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>{children}</div></div>);}

function ProofModal({open,onClose,name,onDone}){if(!open)return null;let fileEl=null;const hf=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onDone(ev.target.result);onClose();};r.readAsDataURL(f);};return(<div style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#111",borderRadius:24,padding:32,width:"86%",maxWidth:360,textAlign:"center"}}><div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Photo Proof Required</div><div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:24}}>{name}</div><input ref={el=>fileEl=el} type="file" accept="image/*" capture="environment" onChange={hf} style={{display:"none"}} /><button onClick={()=>fileEl?.click()} style={{width:160,height:160,borderRadius:20,background:"rgba(255,255,255,0.05)",border:"2px dashed rgba(255,255,255,0.15)",margin:"0 auto 24px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,cursor:"pointer"}}><span style={{fontSize:44}}>📸</span><span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600}}>Tap to Open Camera</span></button><button onClick={onClose} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",padding:"10px 24px"}}>Cancel</button></div></div>);}

function MilestoneModal({open,onClose,data}){if(!open||!data)return null;return(<div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)"}} /><div onClick={e=>e.stopPropagation()} style={{position:"relative",textAlign:"center",animation:"milestoneIn 0.5s ease",padding:40}}><div style={{fontSize:72,marginBottom:16}}>{data.icon}</div><div style={{fontSize:28,fontFamily:FN.h,color:C.goldBright,marginBottom:8,letterSpacing:"0.06em"}}>{data.title}</div><div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:24,maxWidth:280,margin:"0 auto 24px"}}>{data.desc}</div>{data.reward&&<div style={{display:"inline-block",background:"rgba(226,174,42,0.15)",borderRadius:12,padding:"10px 24px",marginBottom:24}}><span style={{fontSize:16,fontWeight:700,color:C.goldBright}}>+{data.reward} XP</span></div>}<div><button onClick={onClose} style={{...btnB,padding:"12px 40px",fontSize:14,borderRadius:14,background:C.goldBright,color:"#1A1D2E"}}>Continue</button></div></div></div>);}

/* ═══ MAIN ═══ */
export default function Dashboard(){
  const[todos,setTodos]=useState(defTodos);
  const[checks,setChecks]=useState({});
  const[photoLog,setPhotoLog]=useState({});
  const[wGoals,setWGoals]=useState(defWeekly);
  const[mGoals,setMGoals]=useState(defMonthly);
  const[wHist,setWHist]=useState(seedWH);
  const[bwLog,setBwLog]=useState(seedBW);
  const[txns,setTxns]=useState(seedTx);
  const[groups,setGroups]=useState([{id:"g1",name:"Workout Crew",tasks:["n5"],members:[{name:"You",av:"E"},{name:"Alex",av:"A"}],feed:[]}]);
  const[splits,setSplits]=useState(defSplits);
  const[settings,setSettings]=useState({morningStart:5,morningEnd:12,nightStart:18,nightEnd:23,notifs:true,vibrate:true});
  const[purchased,setPurchased]=useState([]);
  const[spentXP,setSpentXP]=useState(0);
  const[activeTitle,setActiveTitle]=useState(null);
  const[prestige,setPrestige]=useState(0);
  const[dailyChallenge,setDailyChallenge]=useState(null);
  const[challengeDone,setChallengeDone]=useState({});
  const[lootPop,setLootPop]=useState(null);

  const[tab,setTab]=useState("today");
  const[menuTab,setMenuTab]=useState(null);
  const[vDate,setVDate]=useState(()=>new Date());
  const[showMenu,setShowMenu]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[showFullCal,setShowFullCal]=useState(false);
  const[showShop,setShowShop]=useState(false);
  const[showRecap,setShowRecap]=useState(false);
  const[showTitles,setShowTitles]=useState(false);
  const[showTimeline,setShowTimeline]=useState(null);
  const[confetti,setConfetti]=useState(false);
  const[proofTask,setProofTask]=useState(null);
  const[xpPops,setXpPops]=useState({});
  const[todaySub,setTodaySub]=useState("auto");
  const[milestone,setMilestone]=useState(null);
  const[editTask,setEditTask]=useState(null);
  const[editText,setEditText]=useState("");
  const[editDiff,setEditDiff]=useState("easy");
  const[editGrp,setEditGrp]=useState("morning");
  const[shopCat,setShopCat]=useState("All");

  const[gSplit,setGSplit]=useState(null);const[gView,setGView]=useState("log");const[curWk,setCurWk]=useState(null);const[doneEx,setDoneEx]=useState({});const[nBW,setNBW]=useState("");const[eBW,setEBW]=useState(null);const[eWk,setEWk]=useState(null);const[addSplit,setAddSplit]=useState(false);const[nSpName,setNSpName]=useState("");const[nSpEx,setNSpEx]=useState("");
  const[bMonth,setBMonth]=useState(()=>new Date());const[selDay,setSelDay]=useState(null);const[txF,setTxF]=useState({type:"out",amount:"",desc:""});
  const[gTab,setGTab]=useState("focus");const[addingIn,setAddingIn]=useState(null);const[qText,setQText]=useState("");const[qDiff,setQDiff]=useState("easy");const[qProof,setQProof]=useState(false);
  const[aRange,setARange]=useState("month");const[showGal,setShowGal]=useState(false);const[streakDD,setStreakDD]=useState("global");const[weakDD,setWeakDD]=useState(false);
  const[selGrp,setSelGrp]=useState(null);const[mkGrp,setMkGrp]=useState(false);const[nGrpName,setNGrpName]=useState("");const[nGrpTasks,setNGrpTasks]=useState([]);
  const[modal,setModal]=useState(null);
  const calRef=useRef(null);const prevStreak=useRef(0);const prevLevel=useRef(1);

  const now=new Date();const vk=dk(vDate);const isToday=vk===dk(now);const dc=checks[vk]||{};const phase=getPhase(now.getHours());
  const activeSubTab=todaySub==="auto"?(now.getHours()>=settings.nightStart?"night":now.getHours()>=settings.morningStart&&now.getHours()<settings.morningEnd?"morning":"allday"):todaySub;

  /* ─── Dynamic XP ─── */
  const xpMult=useMemo(()=>{const m={};todos.forEach(t=>{let d=0;for(let i=1;i<=14;i++){const dt=new Date();dt.setDate(dt.getDate()-i);if((checks[dk(dt)]||{})[t.id])d++;}const r=d/14;m[t.id]=r>0.85?0.8:r>0.7?0.9:r<0.2?1.4:r<0.35?1.25:r<0.5?1.1:1.0;});return m;},[checks,todos]);
  const drift=useMemo(()=>{const seed=vk.split("-").reduce((a,b)=>a+parseInt(b),0);const d={};todos.forEach((t,i)=>{const h=(seed*(i+7)*13)%100;d[t.id]=h<8?1.3:h<18?1.15:1.0;});return d;},[vk,todos]);
  const getXP=t=>Math.round((DIFF[t.diff]?.pts||1)*(xpMult[t.id]||1)*(drift[t.id]||1)*10)/10;

  const lifetimeXP=useMemo(()=>{let s=0;Object.entries(checks).forEach(([,ch])=>{todos.forEach(t=>{if(ch[t.id])s+=DIFF[t.diff]?.pts||1;});});return s;},[checks,todos]);
  const totalXP=Math.max(0,lifetimeXP-spentXP);
  const level=getLevel(lifetimeXP);const rank=getRank(level+prestige*10);
  const xpCur=getXPFor(level);const xpNext=getXPFor(level+1);
  const levelPct=xpNext>xpCur?Math.min(100,Math.round((lifetimeXP-xpCur)/(xpNext-xpCur)*100)):100;

  /* ─── Photo Streak ─── */
  const photoStreak=useMemo(()=>{let s=0;const d=new Date();while(true){const k=dk(d);if((photoLog[k]||[]).length>0)s++;else break;d.setDate(d.getDate()-1);}return s;},[photoLog]);

  /* ─── Toggle ─── */
  const toggle=t=>{
    const on=dc[t.id];
    if(!on&&t.proof){setProofTask(t);return;}
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:!on}}));
    if(!on){
      const xpV=getXP(t);
      setXpPops(p=>({...p,[t.id]:xpV}));
      setTimeout(()=>setXpPops(p=>{const n={...p};delete n[t.id];return n;}),900);
      // Loot drop (10% chance)
      if(Math.random()<0.1){const bonus=Math.floor(Math.random()*16)+5;setLootPop({icon:"🎁",text:`Loot Drop! +${bonus} XP`,bonus});setTimeout(()=>setLootPop(null),2500);}
      // Group feed
      groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
        setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"complete"},...(g.feed||[]).slice(0,49)]}:g));
      });
    }
  };
  const proofDone=(t,img)=>{
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:true}}));
    setPhotoLog(p=>({...p,[vk]:[...(p[vk]||[]),{taskId:t.id,taskName:t.text,time:new Date().toISOString(),img:img||null}]}));
    const xpV=getXP(t);
    setXpPops(p=>({...p,[t.id]:xpV}));
    setTimeout(()=>setXpPops(p=>{const n={...p};delete n[t.id];return n;}),900);
    groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
      setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"proof",img},...(g.feed||[]).slice(0,49)]}:g));
    });
  };

  /* ─── Streaks ─── */
  const streak=useMemo(()=>{let s=0;const d=new Date();d.setDate(d.getDate()-1);while(todos.filter(t=>(checks[dk(d)]||{})[t.id]).length>=todos.length*0.5){s++;d.setDate(d.getDate()-1);}if(todos.filter(t=>(checks[dk(now)]||{})[t.id]).length>=todos.length*0.5)s++;return s;},[checks,todos]);
  const sI=sMult(streak);
  const tStreaks=useMemo(()=>{const s={};todos.forEach(t=>{let c=0;const d=new Date();if((checks[dk(d)]||{})[t.id])c++;d.setDate(d.getDate()-1);while((checks[dk(d)]||{})[t.id]){c++;d.setDate(d.getDate()-1);}s[t.id]=c;});return s;},[checks,todos]);
  const longestS=useMemo(()=>{const keys=Object.keys(checks).sort();let mx=0,cu=0;for(const k of keys){if(todos.filter(t=>(checks[k]||{})[t.id]).length>=todos.length*0.5){cu++;mx=Math.max(mx,cu);}else cu=0;}return mx;},[checks,todos]);

  /* ─── Milestones ─── */
  useEffect(()=>{if(streak>0&&streak!==prevStreak.current&&[7,14,21,30,50,100].includes(streak)){setMilestone({icon:"🔥",title:`${streak}-DAY STREAK`,desc:`${sI.l||""} multiplier active!`,reward:streak>=30?50:streak>=14?25:10});}prevStreak.current=streak;},[streak]);
  useEffect(()=>{if(level>prevLevel.current&&level>1){const r=getRank(level);setMilestone({icon:r.icon,title:`LEVEL ${level}`,desc:`${r.name} rank reached!`,reward:level*5});}prevLevel.current=level;},[level]);

  /* ─── Daily Challenge ─── */
  useEffect(()=>{const today=dk(now);if(!dailyChallenge||dailyChallenge.date!==today){const idx=today.split("-").reduce((a,b)=>a+parseInt(b),0)%CHALLENGE_POOL.length;setDailyChallenge({...CHALLENGE_POOL[idx],date:today});}},[]);

  /* ─── Achievement Stats ─── */
  const achieveStats=useMemo(()=>{
    let morningPerfect=0,nightPerfect=0,perfectDays=0,consistentDays=0;
    const mornIds=todos.filter(t=>t.grp==="morning").map(t=>t.id);
    const nightIds=todos.filter(t=>t.grp==="night").map(t=>t.id);
    Object.entries(checks).forEach(([,ch])=>{
      if(mornIds.length>0&&mornIds.every(id=>ch[id]))morningPerfect++;
      if(nightIds.length>0&&nightIds.every(id=>ch[id]))nightPerfect++;
      const done=todos.filter(t=>ch[t.id]).length;
      if(done===todos.length&&todos.length>0)perfectDays++;
      if(todos.length>0&&done/todos.length>=0.8)consistentDays++;
    });
    const totalPhotos=Object.values(photoLog).flat().length;
    return{morningPerfect,nightPerfect,perfectDays,consistentDays,totalPhotos,lifetimeXP,longestStreak:longestS,groupCount:groups.length,photoStreak};
  },[checks,todos,photoLog,lifetimeXP,longestS,groups,photoStreak]);

  const unlockedTitles=useMemo(()=>ACHIEVEMENTS.filter(a=>a.check(achieveStats)),[achieveStats]);

  /* ─── Day XP & Today XP ─── */
  const dayXP=useMemo(()=>{const m={};Object.keys(checks).forEach(k=>{const ch=checks[k];let e=0;todos.forEach(t=>{if(ch[t.id])e+=DIFF[t.diff]?.pts||1;});m[k]=e;});return m;},[checks,todos]);
  const todayXP=useMemo(()=>{let e=0,t=0;todos.forEach(td=>{const p=getXP(td);t+=p;if(dc[td.id])e+=p;});const m=Math.round(e*sI.m*10)/10;const hards=todos.filter(td=>td.diff==="hard");const allH=hards.length>0&&hards.every(td=>dc[td.id]);const perf=t>0&&e>=t-0.1;let b=0;if(allH)b+=5;if(perf)b+=10;return{e,t:Math.round(t*10)/10,m,b,f:Math.round((m+b)*10)/10,allH,perf,pct:t>0?Math.round(e/t*100):0};},[todos,dc,sI,xpMult,drift]);

  const hRates=useMemo(()=>{const y=vDate.getFullYear(),mo=vDate.getMonth(),mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();if(!mx)return{};const r={};todos.forEach(h=>{let d=0;for(let i=1;i<=mx;i++){const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;if((checks[k]||{})[h.id])d++;}r[h.id]={name:h.text,rate:Math.round(d/mx*100)};});return r;},[checks,vDate,todos]);
  const mScore=useMemo(()=>{const y=vDate.getFullYear(),mo=vDate.getMonth(),mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();let sum=0;for(let i=1;i<=mx;i++){const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;const ch=checks[k]||{};let e=0,t=0;todos.forEach(td=>{t+=DIFF[td.diff]?.pts||1;if(ch[td.id])e+=DIFF[td.diff]?.pts||1;});sum+=t>0?e/t*100:0;}return mx>0?Math.round(sum/mx):0;},[checks,vDate,todos]);
  const avgXP=useMemo(()=>{const keys=Object.keys(dayXP);if(!keys.length)return 0;return Math.round(keys.reduce((a,k)=>a+dayXP[k],0)/keys.length*10)/10;},[dayXP]);
  const sortedH=useMemo(()=>Object.values(hRates).sort((a,b)=>b.rate-a.rate),[hRates]);
  const weakHabits=useMemo(()=>sortedH.filter(h=>h.rate<40).slice(-5).reverse(),[sortedH]);

  const weekRecap=useMemo(()=>{let tot=0,days=0,best=0,bestD="",perf=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dk(d);const xp=dayXP[k]||0;tot+=xp;if(xp>0)days++;if(xp>best){best=xp;bestD=fd(d);}const ch=checks[k]||{};if(todos.filter(t=>ch[t.id]).length===todos.length&&todos.length>0)perf++;}return{tot,days,best,bestD,perf};},[dayXP,checks,todos]);

  /* ─── Photo timeline per task ─── */
  const getPhotoTimeline=(taskId)=>{const photos=[];Object.entries(photoLog).sort(([a],[b])=>a.localeCompare(b)).forEach(([date,items])=>{items.forEach(p=>{if(p.taskId===taskId&&p.img)photos.push({date,img:p.img});});});return photos;};

  /* ─── Group leaderboard ─── */
  const getGroupLeaderboard=(g)=>{return g.members.map(m=>({name:m.name,xp:m.name==="You"?lifetimeXP:Math.floor(Math.random()*lifetimeXP*0.8)})).sort((a,b)=>b.xp-a.xp);};

  /* ─── Storage ─── */
  useEffect(()=>{try{const s=localStorage.getItem("dash-v16");if(s){const d=JSON.parse(s);if(d.todos)setTodos(d.todos);if(d.checks)setChecks(d.checks);if(d.photoLog)setPhotoLog(d.photoLog);if(d.wGoals)setWGoals(d.wGoals);if(d.mGoals)setMGoals(d.mGoals);if(d.wHist)setWHist(d.wHist);if(d.bwLog)setBwLog(d.bwLog);if(d.txns)setTxns(d.txns);if(d.groups)setGroups(d.groups);if(d.splits)setSplits(d.splits);if(d.settings)setSettings(d.settings);if(d.purchased)setPurchased(d.purchased);if(d.spentXP)setSpentXP(d.spentXP);if(d.activeTitle)setActiveTitle(d.activeTitle);if(d.prestige)setPrestige(d.prestige);if(d.challengeDone)setChallengeDone(d.challengeDone);}}catch(e){}},[]);
  useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem("dash-v16",JSON.stringify({todos,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,prestige,challengeDone}));}catch(e){}},500);return()=>clearTimeout(t);},[todos,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,prestige,challengeDone]);

  /* ─── Workout ─── */
  useEffect(()=>{if(gSplit&&(!curWk||curWk.split!==gSplit)){const exs=(splits[gSplit]||[]).map(name=>{const ls=[...wHist].reverse().find(h=>h.split===gSplit);const le=ls?.exercises?.find(e=>e.name===name);return{name,sets:Array.from({length:le?le.sets.length:3},(_,i)=>({w:le?.sets?.[i]?.w||0,r:le?.sets?.[i]?.r||0}))};});setCurWk({split:gSplit,exercises:exs});setDoneEx({});}},[gSplit]);
  const uSet=(ei,si,f,v)=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;return n;});
  const aSet=ei=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});return n;});
  const rSet=ei=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();return n;});
  const saveWk=()=>{if(!curWk)return;setWHist(p=>[...p,{id:uid(),date:dk(now),split:curWk.split,exercises:curWk.exercises}]);setConfetti(true);setTimeout(()=>{setConfetti(false);setCurWk(p=>({...p,exercises:p.exercises.map(ex=>({name:ex.name,sets:ex.sets.map(()=>({w:0,r:0}))}))}));setDoneEx({});},2000);};
  const lastSess=useMemo(()=>gSplit?wHist.filter(h=>h.split===gSplit).sort((a,b)=>new Date(b.date)-new Date(a.date))[0]||null:null,[wHist,gSplit]);

  /* ─── Budget ─── */
  const bY=bMonth.getFullYear(),bM=bMonth.getMonth(),bDIM=new Date(bY,bM+1,0).getDate(),bFD=new Date(bY,bM,1).getDay(),bCM=bY===now.getFullYear()&&bM===now.getMonth();
  const bDK=d=>`${bY}-${String(bM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const bGT=d=>txns[bDK(d)]||[];const bGN=d=>bGT(d).reduce((a,t)=>a+(t.type==="in"?t.amount:-t.amount),0);
  const aTx=()=>{if(!txF.amount||!selDay)return;const k=bDK(selDay);setTxns(p=>({...p,[k]:[...(p[k]||[]),{id:uid(),type:txF.type,amount:parseFloat(txF.amount),desc:txF.desc||""}]}));setTxF({type:"out",amount:"",desc:""});};
  const rTx=(d,id)=>{const k=bDK(d);setTxns(p=>({...p,[k]:(p[k]||[]).filter(t=>t.id!==id)}));};
  const bTot=useMemo(()=>{let i=0,o=0;for(let d=1;d<=bDIM;d++)bGT(d).forEach(t=>{if(t.type==="in")i+=t.amount;else o+=t.amount;});return{i,o,net:i-o};},[txns,bY,bM,bDIM]);

  /* ─── Derived ─── */
  const hardT=useMemo(()=>todos.filter(t=>t.diff==="hard").sort((a,b)=>getXP(b)-getXP(a)),[todos,xpMult,drift]);
  const mornT=todos.filter(t=>t.grp==="morning").sort((a,b)=>DIFF[b.diff].pts-DIFF[a.diff].pts);
  const nightT=todos.filter(t=>t.grp==="night"&&t.diff!=="hard").sort((a,b)=>DIFF[b.diff].pts-DIFF[a.diff].pts);
  const allT=[...todos].sort((a,b)=>DIFF[b.diff].pts-DIFF[a.diff].pts);
  const bwD=bwLog.map(e=>({date:fd(e.date),weight:e.weight}));
  const calDays=useMemo(()=>{const days=[];for(let i=-14;i<=14;i++){const d=new Date();d.setDate(d.getDate()+i);const k=dk(d);const xpVal=dayXP[k]||0;const ch=checks[k]||{};const done=todos.filter(t=>ch[t.id]).length;const pct=todos.length>0?done/todos.length:0;days.push({date:d,key:k,xp:xpVal,pct,isToday:i===0,dayNum:d.getDate(),dayName:d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)});}return days;},[dayXP,checks,todos]);
  useEffect(()=>{if(calRef.current)calRef.current.scrollLeft=14*56-100;},[]);

  const buyItem=item=>{if(totalXP<item.cost||purchased.includes(item.id))return;setPurchased(p=>[...p,item.id]);setSpentXP(p=>p+item.cost);setMilestone({icon:item.icon,title:"UNLOCKED",desc:item.name,reward:null});};
  const openEdit=t=>{setEditTask(t);setEditText(t.text);setEditDiff(t.diff);setEditGrp(t.grp);};
  const saveEdit=()=>{if(!editTask||!editText.trim())return;setTodos(p=>p.map(t=>t.id===editTask.id?{...t,text:editText.trim(),diff:editDiff,grp:editGrp}:t));setEditTask(null);};

  const TRow=({t,big})=>{const on=dc[t.id];const xpV=getXP(t);const hi=(drift[t.id]||1)>1.1;return(
    <div className="task-row" onClick={()=>toggle(t)} style={{position:"relative",display:"flex",alignItems:"center",gap:big?14:10,padding:big?"14px 16px":"10px 14px",marginBottom:big?8:4,borderRadius:big?14:10,cursor:"pointer",background:on?C.greenMed:hi?C.goldSoft:C.surfaceDim,border:on?`1px solid ${C.green}22`:hi?`1px solid ${C.goldBright}22`:"1px solid transparent"}}>
      <div style={{width:big?24:20,height:big?24:20,borderRadius:big?7:6,flexShrink:0,border:`2px solid ${on?C.greenBright:"rgba(0,0,0,0.12)"}`,background:on?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:big?12:10,fontWeight:800,animation:on?"checkPop 0.3s ease":"none"}}>{on&&"✓"}</div>
      <span style={{flex:1,fontSize:big?14:13,fontWeight:big?600:500,textDecoration:on?"line-through":"none",color:on?C.textDim:C.text}}>{t.text}</span>
      {t.proof&&<span style={{fontSize:big?16:14,opacity:on?0.3:0.8}}>📷</span>}
      {hi&&!on&&<span style={{fontSize:8,fontWeight:700,color:C.orange,background:C.orangeSoft,borderRadius:4,padding:"2px 6px"}}>HIGH</span>}
      <span style={{fontSize:big?11:10,fontWeight:700,color:DIFF[t.diff].color,opacity:0.7}}>{xpV}xp</span>
      {xpPops[t.id]&&<div style={{position:"absolute",top:-4,right:16,fontSize:13,fontWeight:800,color:C.orange,animation:"xpFloat 0.9s ease forwards",pointerEvents:"none"}}>+{xpPops[t.id]}xp</div>}
    </div>);};

  const mainTabs=[{k:"today",l:"Today"},{k:"groups",l:"Groups"},{k:"analytics",l:"Analytics"},{k:"goals",l:"Goals"}];

  /* ═══ RENDER ═══ */
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:FN.b,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {confetti&&<div style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none",overflow:"hidden"}}>{Array.from({length:40}).map((_,i)=>{const l=Math.random()*100,d=Math.random()*2.5+1;const c=[C.green,C.goldBright,C.blue,C.orange,"#fff"][Math.floor(Math.random()*5)];return(<div key={i} style={{position:"absolute",left:`${l}%`,top:-10,width:7,height:7,borderRadius:Math.random()>.5?"50%":"2px",background:c,animation:`confetti ${d}s ease-out forwards`,animationDelay:`${Math.random()*0.4}s`}} />);})}</div>}
      {lootPop&&<div className="loot" style={{position:"fixed",top:"40%",left:"50%",transform:"translateX(-50%)",zIndex:350,background:C.goldBright,color:"#1A1D2E",borderRadius:16,padding:"16px 28px",fontSize:15,fontWeight:700,boxShadow:"0 8px 32px rgba(226,174,42,0.4)",pointerEvents:"none",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>{lootPop.icon}</div>{lootPop.text}</div>}

      <ProofModal open={!!proofTask} onClose={()=>setProofTask(null)} name={proofTask?.text||""} onDone={img=>{if(proofTask)proofDone(proofTask,img);}} />
      <MilestoneModal open={!!milestone} onClose={()=>setMilestone(null)} data={milestone} />

      {/* ═══ STICKY HEADER ═══ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 6px"}}>
          <button className="press" onClick={()=>setShowMenu(!showMenu)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}><div style={{width:20,height:2,background:C.goldBright,borderRadius:1}} /><div style={{width:16,height:2,background:C.goldBright,borderRadius:1}} /><div style={{width:20,height:2,background:C.goldBright,borderRadius:1}} /></button>
          <span style={{fontFamily:FN.h,fontSize:20,color:C.goldBright,letterSpacing:"0.08em"}}>PROGRESS</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button className="press" onClick={()=>setShowShop(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏪</button>
            <button className="press" onClick={()=>setShowTitles(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏅</button>
            <button className="press" onClick={()=>setShowSettings(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4}}><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke={C.goldBright} strokeWidth="1.5"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke={C.goldBright} strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          </div>
        </div>

        {showMenu&&<div className="card-enter" style={{position:"absolute",left:12,top:52,background:C.surface,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",padding:4,zIndex:110,minWidth:140}}>
          <button className="press" onClick={()=>{setMenuTab("workout");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:8,color:C.text}}>💪 Workout</button>
          <button className="press" onClick={()=>{setMenuTab("budget");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:8,color:C.text}}>💰 Budget</button>
        </div>}

        {/* Level + Title */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 20px 4px"}}>
          <span style={{fontSize:16}}>{rank.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span style={{fontSize:10,fontWeight:700,color:rank.color}}>{rank.name} · Lv.{level}{prestige>0?` ★${prestige}`:""}</span>
              <span style={{fontSize:9,color:C.textDim}}>{activeTitle?ACHIEVEMENTS.find(a=>a.id===activeTitle)?.title:""}</span>
            </div>
            <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${levelPct}%`,background:`linear-gradient(90deg,${rank.color},${C.goldBright})`,borderRadius:2,transition:"width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)"}} /></div>
          </div>
          <span style={{fontSize:10,fontWeight:700,color:C.goldBright,background:C.goldSoft,borderRadius:6,padding:"2px 8px"}}>{totalXP}</span>
        </div>

        {/* Calendar */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px"}}>
          <div ref={calRef} className="hide-scroll" style={{display:"flex",gap:4,overflowX:"auto",flex:1,padding:"4px 0"}}>
            {calDays.map((d,i)=>{const sel=dk(vDate)===d.key;const sd=d.pct>=0.5;return(
              <div key={i} onClick={()=>{setVDate(d.date);setTab("today");setMenuTab(null);}} style={{flex:"0 0 48px",textAlign:"center",padding:"6px 2px",borderRadius:10,cursor:"pointer",background:sel?C.goldBright:d.isToday?C.goldSoft:sd?"rgba(42,157,92,0.06)":"transparent",border:d.isToday&&!sel?`2px solid ${C.goldBright}`:"2px solid transparent",transition:"all 0.2s ease"}}>
                <div style={{fontSize:9,fontWeight:600,color:sel?"#fff":C.textDim}}>{d.dayName}</div>
                <div style={{fontSize:14,fontWeight:sel?800:600,color:sel?"#fff":d.isToday?C.goldBright:C.text}}>{d.dayNum}</div>
                {d.xp>0&&<div style={{fontSize:8,fontWeight:700,color:sel?"rgba(255,255,255,0.8)":C.orange,marginTop:1}}>{d.xp}xp</div>}
              </div>
            );})}
          </div>
          <button className="press" onClick={()=>setShowFullCal(!showFullCal)} style={{background:showFullCal?C.goldSoft:C.surfaceDim,border:"none",borderRadius:10,padding:"6px 8px",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2.5" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.4"/><line x1="2" y1="7" x2="16" y2="7" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.2"/><line x1="6" y1="1.5" x2="6" y2="4.5" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.3" strokeLinecap="round"/><line x1="12" y1="1.5" x2="12" y2="4.5" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
        {showFullCal&&<div className="card-enter" style={{...card,margin:"4px 12px 0",padding:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()-1,1))} style={btnG}>‹</button><span style={{fontSize:13,fontWeight:700}}>{vDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()+1,1))} style={btnG}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,color:C.textDim,fontWeight:600}}>{d}</div>)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth(),1).getDay()}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth()+1,0).getDate()}).map((_,i)=>(<div key={i+1} onClick={()=>{setVDate(new Date(vDate.getFullYear(),vDate.getMonth(),i+1));setShowFullCal(false);}} style={{textAlign:"center",padding:"4px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:vDate.getDate()===i+1?700:400,background:vDate.getDate()===i+1?C.goldBright:"transparent",color:vDate.getDate()===i+1?"#fff":C.text}}>{i+1}</div>))}</div>
        </div>}
      </div>

      {/* ═══ SCROLLABLE MIDDLE ═══ */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 20px 80px"}}>

        {/* ═══ TODAY ═══ */}
        {tab==="today"&&<div className="tab-content" style={{background:getCircBg(phase),borderRadius:20,margin:"-12px -20px",padding:"16px 20px",minHeight:"calc(100vh - 220px)"}}>
          {/* Daily Challenge */}
          {dailyChallenge&&!challengeDone[dailyChallenge.date]&&<div style={{...card,padding:"12px 16px",marginBottom:12,borderLeft:`4px solid ${C.purple}`,background:C.purpleSoft}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>⚔️</span>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:C.purple}}>DAILY CHALLENGE</div><div style={{fontSize:12,marginTop:2}}>{dailyChallenge.text}</div></div>
              <span style={{fontSize:12,fontWeight:700,color:C.purple}}>+{dailyChallenge.xp}xp</span>
            </div>
          </div>}

          {/* XP Bar */}
          <div style={{...card,padding:"18px 22px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>Today's XP</div><div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:34,fontWeight:800,color:pC(todayXP.pct)}}>{todayXP.f}</span><span style={{fontSize:13,color:C.textDim}}>/ {todayXP.t} xp</span></div></div>
              <div style={{textAlign:"right"}}>{streak>0&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{fontSize:14}}>🔥</span><span style={{fontSize:15,fontWeight:700,color:C.orange}}>{streak}</span>{sI.l&&<span style={{fontSize:9,fontWeight:700,color:C.orange,background:C.orangeSoft,borderRadius:4,padding:"2px 5px"}}>{sI.l}</span>}</div>}{photoStreak>0&&<div style={{fontSize:9,fontWeight:600,color:C.blue}}>📸 {photoStreak}d photo streak</div>}{todayXP.allH&&<div style={{fontSize:9,fontWeight:700,color:C.orange}}>+5 Hard Bonus</div>}{todayXP.perf&&<div style={{fontSize:9,fontWeight:700,color:C.goldBright}}>+10 Perfect Day!</div>}</div>
            </div>
            <div style={{height:12,background:C.surfaceDim,borderRadius:8,overflow:"hidden"}}><div style={{height:"100%",width:`${todayXP.pct}%`,background:gB(todayXP.pct),borderRadius:8,transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)"}} /></div>
          </div>

          {/* Today Photo Wall */}
          {(photoLog[vk]||[]).length>0&&<div style={{...card,padding:"12px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8}}>TODAY'S PROOF</div>
            <div style={{display:"flex",gap:6,overflowX:"auto"}} className="hide-scroll">{(photoLog[vk]||[]).map((p,i)=>(<div key={i} style={{flex:"0 0 56px",width:56,height:56,borderRadius:10,overflow:"hidden",background:C.surfaceDim}}>{p.img?<img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:18}}>📸</span>}</div>))}</div>
          </div>}

          {hardT.length>0&&<div style={{...card,marginBottom:14,borderLeft:`4px solid ${C.orange}`}}>
            <div style={{...lbl,display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{color:C.orange}}>★</span> Focus Tasks<span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:pC(hardT.filter(t=>dc[t.id]).length/hardT.length*100)}}>{hardT.filter(t=>dc[t.id]).length}/{Math.min(hardT.length,9)}</span></div>
            {hardT.slice(0,9).map(t=>(<TRow key={t.id} t={t} big />))}
          </div>}

          <div style={{display:"flex",gap:3,marginBottom:12}}>{[{k:"auto",l:`Auto (${activeSubTab})`},{k:"morning",l:"Morning"},{k:"night",l:"Night"},{k:"allday",l:"All Day"}].map(s=>(<button key={s.k} onClick={()=>setTodaySub(s.k)} className="pill-btn" style={{...pill(todaySub===s.k),padding:"5px 12px",fontSize:11}}>{s.l}</button>))}</div>

          {(activeSubTab==="morning"||todaySub==="morning")&&<div style={{...card,marginBottom:12}}><div style={lbl}>Morning</div>{mornT.map(t=>(<TRow key={t.id} t={t} />))}</div>}
          {(activeSubTab==="night"||todaySub==="night")&&<div style={{...card,marginBottom:12}}><div style={lbl}>Night</div>{nightT.map(t=>(<TRow key={t.id} t={t} />))}</div>}
          {(activeSubTab==="allday"||todaySub==="allday")&&<div style={card}><div style={lbl}>All Tasks</div>{allT.filter(t=>t.diff!=="hard").map(t=>(<TRow key={t.id} t={t} />))}</div>}
        </div>}

        {/* ═══ GROUPS ═══ */}
        {tab==="groups"&&<div className="tab-content">
          {!selGrp&&!mkGrp&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontWeight:700,fontSize:16,margin:0}}>My Groups</h2><button className="press" onClick={()=>setMkGrp(true)} style={btnB}>+ New</button></div>
            {groups.map(g=>{const hl=24-now.getHours();const tp=Math.max(0,Math.min(100,hl/24*100));return(
              <div key={g.id} onClick={()=>setSelGrp(g.id)} className="press" style={{...card,marginBottom:10,cursor:"pointer",background:"linear-gradient(135deg,rgba(224,122,58,0.08),rgba(224,122,58,0.02))",border:"1px solid rgba(224,122,58,0.12)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><div style={{fontSize:15,fontWeight:700}}>{g.name}</div><div style={{fontSize:12,color:C.textDim,marginTop:2}}>{g.members.length} members</div></div><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:C.orange}}>0</div><div style={{fontSize:9,color:C.textDim,fontWeight:600}}>STREAK</div></div></div>
                <div style={{height:4,background:"rgba(0,0,0,0.06)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${tp}%`,background:tp>50?C.green:tp>25?C.gold:C.red,borderRadius:2}} /></div>
              </div>);})}
          </div>}

          {mkGrp&&<div><button className="press" onClick={()=>{setMkGrp(false);setNGrpName("");setNGrpTasks([]);}} style={{...btnG,marginBottom:14}}>← Back</button><div style={card}><div style={lbl}>Create Group</div><input value={nGrpName} onChange={e=>setNGrpName(e.target.value)} placeholder="Group name..." style={{...inp,marginBottom:14}} /><div style={{fontSize:12,fontWeight:600,color:C.textSec,marginBottom:8}}>Link proof tasks:</div>{todos.filter(t=>t.proof).map(t=>(<div key={t.id} onClick={()=>setNGrpTasks(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:4,borderRadius:10,cursor:"pointer",background:nGrpTasks.includes(t.id)?C.blueMed:C.surfaceDim}}><div style={{width:18,height:18,borderRadius:5,border:`2px solid ${nGrpTasks.includes(t.id)?C.blue:"rgba(0,0,0,0.1)"}`,background:nGrpTasks.includes(t.id)?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800}}>{nGrpTasks.includes(t.id)&&"✓"}</div><span style={{fontSize:13,fontWeight:500,flex:1}}>{t.text}</span></div>))}<button className="press" onClick={()=>{if(!nGrpName.trim())return;setGroups(p=>[...p,{id:uid(),name:nGrpName.trim(),tasks:nGrpTasks,members:[{name:"You",av:"E"}],feed:[]}]);setNGrpName("");setNGrpTasks([]);setMkGrp(false);}} style={{...btnB,width:"100%",marginTop:14}}>Create</button></div></div>}

          {selGrp&&groups.find(x=>x.id===selGrp)&&<div>
            <button className="press" onClick={()=>setSelGrp(null)} style={{...btnG,marginBottom:14}}>← Back</button>
            {/* Group Feed */}
            <div style={{...card,marginBottom:14}}><div style={lbl}>Activity Feed</div>
              {(groups.find(x=>x.id===selGrp).feed||[]).length===0&&<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>Complete linked tasks to see activity</div>}
              {(groups.find(x=>x.id===selGrp).feed||[]).slice(0,20).map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",marginBottom:4,borderRadius:10,background:C.surfaceDim,animation:"slideUp 0.3s ease"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,marginTop:2}}>E</div>
                <div style={{flex:1}}>
                  <div><span style={{fontSize:12,fontWeight:600}}>{f.user}</span><span style={{fontSize:12,color:C.textDim}}> completed </span><span style={{fontSize:12,fontWeight:600,color:C.blue}}>{f.task}</span></div>
                  {f.img&&<div style={{width:80,height:80,borderRadius:8,overflow:"hidden",marginTop:6,background:C.surfaceDim}}><img src={f.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}
                  {/* Reactions */}
                  <div style={{display:"flex",gap:4,marginTop:4}}>{["🔥","💪","👏"].map(r=>(<button key={r} className="press" style={{background:C.surfaceDim,border:"none",borderRadius:6,padding:"2px 6px",cursor:"pointer",fontSize:12}}>{r}</button>))}</div>
                </div>
                <span style={{fontSize:9,color:C.textDim,flexShrink:0}}>{new Date(f.time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>
              </div>))}
            </div>
            {/* Leaderboard */}
            <div style={{...card,marginBottom:14}}><div style={lbl}>Leaderboard</div>
              {getGroupLeaderboard(groups.find(x=>x.id===selGrp)).map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:2,borderRadius:8,background:i===0?C.goldSoft:C.surfaceDim}}>
                <span style={{fontSize:14,fontWeight:800,color:i===0?C.goldBright:i===1?"#A8A8A8":i===2?"#CD7F32":C.textDim,width:20}}>{i+1}</span>
                <span style={{fontSize:13,fontWeight:600,flex:1}}>{m.name}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.orange}}>{m.xp} xp</span>
              </div>))}
            </div>
            <div style={card}><div style={lbl}>Members</div>{groups.find(x=>x.id===selGrp).members.map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<groups.find(x=>x.id===selGrp).members.length-1?`1px solid ${C.surfaceDim}`:"none"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{m.av}</div><span style={{fontSize:13,fontWeight:600,flex:1}}>{m.name}</span></div>))}</div>
          </div>}
        </div>}

        {/* ═══ ANALYTICS ═══ */}
        {tab==="analytics"&&<div className="tab-content">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{...card,padding:14,textAlign:"center",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>⚡</div><div style={{fontSize:22,fontWeight:800,color:avgXP>30?C.green:avgXP>15?C.gold:C.red}}>{avgXP}</div><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginTop:2}}>Avg XP</div></div>
            <div style={{...card,padding:14,textAlign:"center",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>🔥</div><div style={{fontSize:22,fontWeight:800,color:C.orange}}>{streakDD==="global"?streak:(tStreaks[streakDD]||0)}</div><select value={streakDD} onChange={e=>setStreakDD(e.target.value)} style={{fontSize:9,border:"none",background:"transparent",color:C.textDim,fontWeight:600,cursor:"pointer",outline:"none",marginTop:2,width:"100%"}}><option value="global">Global Streak</option>{todos.filter(t=>tStreaks[t.id]>0).map(t=>(<option key={t.id} value={t.id}>{t.text}</option>))}</select></div>
            <div onClick={()=>setWeakDD(!weakDD)} style={{...card,padding:14,textAlign:"center",cursor:"pointer",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>📉</div><div style={{fontSize:22,fontWeight:800,color:C.red}}>{weakHabits.length}</div><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginTop:2}}>Weak</div></div>
          </div>

          {weakDD&&<div style={{...card,marginBottom:14}}><div style={lbl}>Weak Points</div>{weakHabits.map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",marginBottom:2,borderRadius:6,background:C.redSoft}}><span style={{fontSize:12}}>{h.name}</span><span style={{fontSize:11,fontWeight:700,color:C.red}}>{h.rate}%</span></div>))}</div>}

          {/* Suggested Focus */}
          <div style={{...card,marginBottom:14,borderLeft:`4px solid ${C.blue}`}}><div style={lbl}>Suggested Focus</div>{weakHabits.slice(0,3).map((h,i)=>(<div key={i} style={{padding:"8px 12px",marginBottom:4,borderRadius:8,background:C.blueSoft,fontSize:12}}><span style={{fontWeight:600}}>📌 {h.name}</span><span style={{color:C.textDim}}> — {h.rate}% {h.rate<20?"Break into smaller steps.":"Focus on consistency."}</span></div>))}{weakHabits.length===0&&<div style={{fontSize:12,color:C.textDim}}>On track!</div>}</div>

          {/* Weekly Recap */}
          <div style={{...card,marginBottom:14,background:`linear-gradient(135deg,${C.goldSoft},${C.surface})`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={lbl}>Weekly Recap</div><button className="press" onClick={()=>setShowRecap(true)} style={{...btnG,fontSize:11}}>Full Report</button></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{weekRecap.tot}</div><div style={{fontSize:9,color:C.textDim}}>XP</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.blue}}>{weekRecap.days}/7</div><div style={{fontSize:9,color:C.textDim}}>Days</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.green}}>{weekRecap.perf}</div><div style={{fontSize:9,color:C.textDim}}>Perfect</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.orange}}>{weekRecap.best}</div><div style={{fontSize:9,color:C.textDim}}>Best</div></div></div>
          </div>

          {/* Photo Progress with Timeline */}
          <div style={{...card,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={lbl}>Photo Progress</div><div style={{display:"flex",gap:4}}><button className="press" onClick={()=>setShowGal(!showGal)} style={{...pill(showGal),fontSize:10}}>📷 Gallery</button></div></div>
            <div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:8}}>📸 {Object.values(photoLog).flat().length} photos · {Object.keys(photoLog).length} days · 🔥 {photoStreak}d streak</div>
            {/* Per-task timeline buttons */}
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{todos.filter(t=>t.proof).map(t=>{const tl=getPhotoTimeline(t.id);return tl.length>=2?(<button key={t.id} className="press" onClick={()=>setShowTimeline(t.id)} style={{...pill(false),fontSize:10,display:"flex",alignItems:"center",gap:4}}>🎞️ {t.text} ({tl.length})</button>):null;})}</div>
            {showGal&&<div style={{marginTop:8}}>{Object.keys(photoLog).length===0&&<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>No proofs yet</div>}{Object.entries(photoLog).sort(([a],[b])=>b.localeCompare(a)).map(([date,photos])=>(<div key={date} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>{fd(date)}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{photos.map((p,i)=>(<div key={i} style={{width:68,height:68,borderRadius:10,overflow:"hidden",background:C.surfaceDim,position:"relative"}}>{p.img?<img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:22}}>📸</span>}<div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.5)",padding:"2px 4px"}}><span style={{fontSize:7,color:"#fff",fontWeight:600}}>{p.taskName}</span></div></div>))}</div></div>))}</div>}
          </div>

          <div style={{...card,padding:"16px 20px",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={lbl}>This Month</span><span style={{fontSize:26,fontWeight:800,color:pC(mScore)}}>{mScore}%</span></div></div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={card}><div style={{...lbl,color:C.green,fontSize:12}}>Strongest</div>{sortedH.filter(h=>h.rate>=50).slice(0,5).map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",marginBottom:2,borderRadius:6,background:C.greenSoft}}><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:10,fontWeight:700,color:pC(h.rate)}}>{h.rate}%</span></div>))}{sortedH.filter(h=>h.rate>=50).length===0&&<div style={{fontSize:11,color:C.textDim,padding:8}}>Track to see</div>}</div>
            <div style={card}><div style={{...lbl,color:C.red,fontSize:12}}>Needs Work</div>{sortedH.filter(h=>h.rate<50).slice(-5).reverse().map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",marginBottom:2,borderRadius:6,background:C.redSoft}}><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:10,fontWeight:700,color:pC(h.rate)}}>{h.rate}%</span></div>))}</div>
          </div>
        </div>}

        {/* ═══ GOALS ═══ */}
        {tab==="goals"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{[{k:"focus",l:"Focus"},{k:"daily",l:"Daily"},{k:"weekly",l:"Weekly"},{k:"monthly",l:"Monthly"}].map(t=>(<button key={t.k} onClick={()=>setGTab(t.k)} className="pill-btn" style={pill(gTab===t.k)}>{t.l}</button>))}</div>

          {gTab==="focus"&&<div style={card}><div style={lbl}>Focus Tasks</div>{hardT.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:4,borderRadius:10,background:C.orangeSoft}}><span style={{color:C.orange}}>★</span><span style={{fontSize:13,fontWeight:600,flex:1}}>{t.text}</span><button className="press" onClick={e=>{e.stopPropagation();openEdit(t);}} style={{...btnG,padding:"4px 8px",fontSize:9}}>✎</button><button className="press" onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.4}}>×</button></div>))}{addingIn!=="focus"?<button onClick={()=>{setAddingIn("focus");setQText("");setQProof(false);}} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:10,padding:10,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8}}>+ Add Focus Task</button>:<div style={{background:C.surfaceDim,borderRadius:10,padding:12,marginTop:8}}><input value={qText} onChange={e=>setQText(e.target.value)} placeholder="Task name..." style={{...inp,marginBottom:8}} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&qText.trim()){setTodos(p=>[...p,{id:uid(),text:qText.trim(),diff:"hard",cat:"personal",grp:"morning",proof:qProof}]);setQText("");setAddingIn(null);}}} /><div style={{display:"flex",gap:8}}><button onClick={()=>setQProof(!qProof)} style={{...btnG,fontSize:10,background:qProof?C.blueMed:C.surface}}>{qProof?"📸 ON":"📷 OFF"}</button><div style={{flex:1}} /><button onClick={()=>{if(!qText.trim())return;setTodos(p=>[...p,{id:uid(),text:qText.trim(),diff:"hard",cat:"personal",grp:"morning",proof:qProof}]);setQText("");setAddingIn(null);}} style={{...btnB,padding:"8px 16px",fontSize:12}}>Add</button><button onClick={()=>setAddingIn(null)} style={{...btnG,padding:"8px 10px"}}>✕</button></div></div>}</div>}

          {gTab==="daily"&&<div>{["morning","night","general"].map(grp=>{const items=todos.filter(t=>t.grp===grp);return(<div key={grp} style={{...card,marginBottom:12}}><div style={{...lbl,textTransform:"capitalize"}}>{grp} Tasks</div>{items.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}><span style={{fontSize:13,fontWeight:500,flex:1}}>{t.text}</span><span style={{fontSize:9,fontWeight:700,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 6px"}}>{DIFF[t.diff].label}</span><button className="press" onClick={e=>{e.stopPropagation();openEdit(t);}} style={{...btnG,padding:"4px 6px",fontSize:9}}>✎</button><button onClick={()=>setTodos(p=>p.map(x=>x.id===t.id?{...x,proof:!x.proof}:x))} style={{background:t.proof?C.blueMed:C.surfaceDim,border:t.proof?`2px solid ${C.blue}`:"2px solid rgba(0,0,0,0.06)",borderRadius:6,padding:"3px 6px",cursor:"pointer",fontSize:12}}>{t.proof?"📸":"📷"}</button><button onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.4}}>×</button></div>))}{addingIn!==grp?<button onClick={()=>{setAddingIn(grp);setQText("");setQDiff("easy");setQProof(false);}} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:10,padding:10,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:4}}>+ Add {grp} task</button>:<div style={{background:C.surfaceDim,borderRadius:10,padding:12,marginTop:4}}><input value={qText} onChange={e=>setQText(e.target.value)} placeholder="Task name..." style={{...inp,marginBottom:8}} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&qText.trim()){setTodos(p=>[...p,{id:uid(),text:qText.trim(),diff:qDiff,cat:"personal",grp,proof:qProof}]);setQText("");setAddingIn(null);}}} /><div style={{display:"flex",gap:4,marginBottom:8}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setQDiff(d)} style={{...pill(qDiff===d,DIFF[d].color),padding:"4px 10px",fontSize:10}}>{DIFF[d].label}</button>))}</div><div style={{display:"flex",gap:8}}><button onClick={()=>setQProof(!qProof)} style={{...btnG,fontSize:10,background:qProof?C.blueMed:C.surface}}>{qProof?"📸":"📷"}</button><div style={{flex:1}} /><button onClick={()=>{if(!qText.trim())return;setTodos(p=>[...p,{id:uid(),text:qText.trim(),diff:qDiff,cat:"personal",grp,proof:qProof}]);setQText("");setAddingIn(null);}} style={{...btnB,padding:"8px 16px",fontSize:12}}>Add</button><button onClick={()=>setAddingIn(null)} style={{...btnG,padding:"8px 10px"}}>✕</button></div></div>}</div>);})}</div>}

          {gTab==="weekly"&&<div style={card}><div style={{...lbl,display:"flex",alignItems:"center"}}>Weekly Goals<button onClick={()=>setModal("weekly")} style={{marginLeft:"auto",...btnG,fontSize:11}}>Edit</button></div>{wGoals.map(g=>(<div key={g.id} style={{padding:"10px 14px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{g.text}</span><span style={{fontSize:12,fontWeight:700,color:pC((g.current||0)/g.target*100)}}>{g.current||0}/{g.target}</span></div><div style={{height:5,background:"rgba(0,0,0,0.04)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((g.current||0)/g.target*100,100)}%`,background:gB((g.current||0)/g.target*100),borderRadius:3}} /></div></div>))}</div>}

          {gTab==="monthly"&&<div style={card}><div style={{...lbl,display:"flex",alignItems:"center"}}>Monthly Goals<button onClick={()=>setModal("monthly")} style={{marginLeft:"auto",...btnG,fontSize:11}}>Edit</button></div>{mGoals.map((g,i)=>{const ic=g.type==="check";let pct=0;if(ic)pct=g.done?100:0;else if(g.type==="habit-pct"){const hr=hRates[g.habitId];pct=hr?Math.min(hr.rate/(g.target||100)*100,100):0;}else pct=Math.min((g.current||0)/(g.target||1)*100,100);return(<div key={i} onClick={ic?()=>setMGoals(p=>p.map((x,j)=>j===i?{...x,done:!x.done}:x)):undefined} style={{padding:"10px 14px",marginBottom:6,borderRadius:10,cursor:ic?"pointer":"default",background:pct>=100?C.goldSoft:C.surfaceDim}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{g.text}</span><span style={{fontSize:11,fontWeight:700,color:pC(pct)}}>{ic?(g.done?"✓":"—"):`${Math.round(pct)}%`}</span></div><div style={{height:5,background:"rgba(0,0,0,0.04)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:gB(pct),borderRadius:3}} /></div></div>);})}</div>}
        </div>}

        {/* ═══ WORKOUT ═══ */}
        {menuTab==="workout"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"log",l:"Log"},{k:"progress",l:"Progress"},{k:"bodyweight",l:"Weight"}].map(v=>(<button key={v.k} onClick={()=>{setGView(v.k);if(v.k!=="log")setGSplit(null);}} className="pill-btn" style={pill(gView===v.k)}>{v.l}</button>))}</div>
          {gView==="log"&&!gSplit&&<div><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(splits).map(([key,exL])=>(<div key={key} style={{...card,padding:"14px 20px",display:"flex",alignItems:"center",gap:14}}><button className="press" onClick={()=>setGSplit(key)} style={{flex:1,display:"flex",alignItems:"center",gap:14,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}><div style={{width:44,height:44,borderRadius:12,background:`${spClr[key]||C.blue}10`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:800,color:spClr[key]||C.blue,textTransform:"uppercase"}}>{key[0]}</span></div><div><div style={{fontSize:14,fontWeight:700,color:spClr[key]||C.blue,textTransform:"uppercase"}}>{key}</div><div style={{fontSize:11,color:C.textDim}}>{exL.length} ex</div></div></button><button className="press" onClick={()=>setSplits(p=>{const n={...p};delete n[key];return n;})} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.35}}>×</button></div>))}</div>{!addSplit?<button onClick={()=>setAddSplit(true)} style={{...btnB,width:"100%",marginTop:12,fontSize:12}}>+ Add Split</button>:<div style={{...card,marginTop:12}}><input value={nSpName} onChange={e=>setNSpName(e.target.value)} placeholder="Split name" style={{...inp,marginBottom:8}} /><input value={nSpEx} onChange={e=>setNSpEx(e.target.value)} placeholder="Exercises (comma sep)" style={{...inp,marginBottom:10}} /><div style={{display:"flex",gap:8}}><button onClick={()=>{if(!nSpName.trim())return;setSplits(p=>({...p,[nSpName.trim().toLowerCase()]:nSpEx.split(",").map(e=>e.trim()).filter(Boolean)}));setNSpName("");setNSpEx("");setAddSplit(false);}} style={{...btnB,flex:1}}>Add</button><button onClick={()=>setAddSplit(false)} style={btnG}>Cancel</button></div></div>}</div>}
          {gView==="log"&&gSplit&&curWk&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><button onClick={()=>setGSplit(null)} style={btnG}>←</button><span style={{fontSize:15,fontWeight:800,color:spClr[gSplit]||C.blue,textTransform:"uppercase"}}>{gSplit}</span><button className="press" onClick={()=>{const n=prompt("Exercise name:");if(n&&n.trim()){setSplits(p=>({...p,[gSplit]:[...(p[gSplit]||[]),n.trim()]}));setCurWk(p=>({...p,exercises:[...p.exercises,{name:n.trim(),sets:[{w:0,r:0},{w:0,r:0},{w:0,r:0}]}]}));}}} style={{...btnG,fontSize:10,marginLeft:"auto"}}>+ Ex</button></div>{curWk.exercises.map((ex,ei)=>{const lE=lastSess?.exercises?.find(e=>e.name===ex.name);const dn=doneEx[ei];return(<div key={ei} style={{...card,marginBottom:10,background:dn?C.greenSoft:C.surface}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:dn?C.green:C.text}}>{dn&&"✓ "}{ex.name}</span><div style={{display:"flex",gap:3}}><button onClick={()=>setDoneEx(p=>({...p,[ei]:!p[ei]}))} style={{...pill(dn,C.green),padding:"3px 8px",fontSize:10}}>Done</button><button onClick={()=>rSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>−</button><button onClick={()=>aSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>+</button><button onClick={()=>{setSplits(p=>({...p,[gSplit]:(p[gSplit]||[]).filter(e=>e!==ex.name)}));setCurWk(p=>({...p,exercises:p.exercises.filter((_,i)=>i!==ei)}));}} style={{...btnG,padding:"3px 6px",fontSize:11,color:C.red}}>✕</button></div></div>{ex.sets.map((s,si)=>{const ls=lE?.sets?.[si];const wd=ls?s.w-ls.w:null;return(<div key={si} style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr 56px",gap:5,marginBottom:3,alignItems:"center"}}><span style={{fontSize:10,color:spClr[gSplit]||C.blue,fontWeight:700}}>S{si+1}</span><input type="number" value={s.w||""} onChange={e=>uSet(ei,si,"w",e.target.value)} placeholder="kg" style={numI} /><input type="number" value={s.r||""} onChange={e=>uSet(ei,si,"r",e.target.value)} placeholder="reps" style={numI} /><span style={{fontSize:9,textAlign:"center",fontWeight:600,color:ls?(wd>0?C.greenBright:wd<0?C.red:C.textDim):C.textDim}}>{ls?`${ls.w}×${ls.r}`:"—"}</span></div>);})}</div>);})}<button className="press" onClick={saveWk} style={{width:"100%",background:spClr[gSplit]||C.blue,border:"none",borderRadius:12,padding:"14px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Save ✓</button></div>}
          {gView==="progress"&&<div style={card}><div style={lbl}>History</div>{wHist.slice().reverse().map(w=>(<div key={w.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}><div style={{width:8,height:8,borderRadius:"50%",background:spClr[w.split]||C.blue}} /><span style={{fontSize:12,fontWeight:600,color:spClr[w.split]||C.blue,textTransform:"uppercase",width:50}}>{w.split}</span><span style={{fontSize:12,color:C.textDim}}>{fd(w.date)}</span><span style={{marginLeft:"auto",fontSize:11,color:C.textDim}}>{w.exercises.length} ex</span><button onClick={()=>setWHist(p=>p.filter(x=>x.id!==w.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.4}}>×</button></div>))}</div>}
          {gView==="bodyweight"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>{[{l:"Current",v:`${bwLog.length>0?bwLog[bwLog.length-1].weight:0}kg`,c:C.text},{l:"Start",v:`${bwLog.length>0?bwLog[0].weight:0}kg`,c:C.textDim},{l:"Change",v:`${bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0"}kg`,c:parseFloat(bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0")>0?C.greenBright:C.red}].map((s,i)=>(<div key={i} style={{...card,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{s.l}</div><div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div></div>))}</div><div style={{...card,marginBottom:12}}><div style={lbl}>Weight Over Time</div><ResponsiveContainer width="100%" height={140}><LineChart data={bwD}><CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false} /><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} /><YAxis domain={["dataMin-1","dataMax+1"]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32} /><Tooltip content={<Tip />} /><Line type="monotone" dataKey="weight" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:3,stroke:"#fff",strokeWidth:2}} name="kg" /></LineChart></ResponsiveContainer></div><div style={card}><div style={lbl}>Log</div><div style={{display:"flex",gap:8}}><input type="number" step="0.1" value={nBW} onChange={e=>setNBW(e.target.value)} placeholder="kg" style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==="Enter"){const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}}} /><button onClick={()=>{const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}} style={btnB}>Log</button></div></div></div>}
        </div>}

        {/* ═══ BUDGET ═══ */}
        {menuTab==="budget"&&<div className="tab-content">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red},{l:"Net",v:`${bTot.net>=0?"+":""}$${bTot.net.toFixed(2)}`,c:bTot.net>=0?C.green:C.red}].map((s,i)=>(<div key={i} style={{...card,padding:12}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div>))}</div>
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><button onClick={()=>setBMonth(new Date(bY,bM-1,1))} style={btnG}>‹</button><span style={{fontSize:14,fontWeight:700}}>{bMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setBMonth(new Date(bY,bM+1,1))} style={btnG}>›</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim,fontWeight:600}}>{d}</div>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{Array.from({length:bFD}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:bDIM}).map((_,i)=>{const d=i+1;const isT=bCM&&d===now.getDate();const net=bGN(d);const has=bGT(d).length>0;const sel=selDay===d;return(<div key={d} onClick={()=>setSelDay(sel?null:d)} style={{aspectRatio:"1",borderRadius:8,cursor:"pointer",padding:3,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:sel?C.blueMed:has?(net>=0?C.greenSoft:C.redSoft):C.surfaceDim,border:isT?`2px solid ${C.blue}`:"1.5px solid transparent"}}><span style={{fontSize:12,fontWeight:isT?800:500,color:isT?C.blue:C.text}}>{d}</span>{has&&<span style={{fontSize:7,fontWeight:700,color:net>=0?C.green:C.red}}>{net>=0?"+":""}{net.toFixed(0)}</span>}</div>);})}</div>
            {selDay&&<div style={{marginTop:14,borderTop:`1px solid ${C.surfaceDim}`,paddingTop:14}}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{new Date(bY,bM,selDay).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>{bGT(selDay).map(tx=>(<div key={tx.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:3,borderRadius:8,background:tx.type==="in"?C.greenSoft:C.redSoft}}><span style={{fontSize:11,fontWeight:700,color:tx.type==="in"?C.greenBright:C.red,width:14}}>{tx.type==="in"?"+":"−"}</span><span style={{flex:1,fontSize:12}}>{tx.desc||"Transaction"}</span><span style={{fontSize:12,fontWeight:700,color:tx.type==="in"?C.greenBright:C.red}}>${tx.amount.toFixed(2)}</span><button onClick={()=>rTx(selDay,tx.id)} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:13}}>×</button></div>))}<div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}><div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.surfaceDim}`}}><button onClick={()=>setTxF(p=>({...p,type:"in"}))} style={{padding:"7px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:txF.type==="in"?C.greenBright:"transparent",color:txF.type==="in"?"#fff":C.textDim}}>In</button><button onClick={()=>setTxF(p=>({...p,type:"out"}))} style={{padding:"7px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:txF.type==="out"?C.red:"transparent",color:txF.type==="out"?"#fff":C.textDim}}>Out</button></div><input type="number" step="0.01" value={txF.amount} onChange={e=>setTxF(p=>({...p,amount:e.target.value}))} placeholder="$" style={{...inp,width:65,padding:"7px 8px",textAlign:"center"}} /><input value={txF.desc} onChange={e=>setTxF(p=>({...p,desc:e.target.value}))} placeholder="Desc" style={{...inp,flex:1,padding:"7px 10px"}} onKeyDown={e=>{if(e.key==="Enter")aTx();}} /><button onClick={aTx} style={{...btnB,padding:"7px 14px",fontSize:11}}>Add</button></div></div>}
          </div>
          {/* PIE CHART */}
          <div style={{...card,marginTop:12}}><div style={lbl}>Breakdown</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:30}}><ResponsiveContainer width={180} height={180}><PieChart><Pie data={[{name:"Income",value:Math.max(bTot.i,0.01)},{name:"Expenses",value:Math.max(bTot.o,0.01)}]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<Tip />} /></PieChart></ResponsiveContainer><div>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red}].map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:3,background:s.c}} /><div><div style={{fontSize:11,color:C.textDim}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div></div>))}</div></div></div>
        </div>}
      </div>

      {/* ═══ BOTTOM TAB BAR ═══ */}
      <div style={{position:"sticky",bottom:0,zIndex:100,background:C.surface,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)",display:"flex",padding:"6px 8px",gap:2}}>{mainTabs.map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);setMenuTab(null);}} className="nav-btn" style={{flex:1,border:"none",borderRadius:12,padding:"10px 0",cursor:"pointer",textAlign:"center",background:(tab===t.k&&!menuTab)?C.blue:"transparent",color:(tab===t.k&&!menuTab)?"#fff":C.textDim,fontSize:12,fontFamily:FN.b,fontWeight:(tab===t.k&&!menuTab)?700:500,transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)"}}>{t.l}</button>))}</div>

      {/* ═══ MODALS ═══ */}
      <Overlay open={showSettings} onClose={()=>setShowSettings(false)} title="Settings">
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Morning Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.morningStart} onChange={e=>setSettings(p=>({...p,morningStart:parseInt(e.target.value)||5}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.morningEnd} onChange={e=>setSettings(p=>({...p,morningEnd:parseInt(e.target.value)||12}))} style={{...numI,width:60}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Night Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.nightStart} onChange={e=>setSettings(p=>({...p,nightStart:parseInt(e.target.value)||18}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.nightEnd} onChange={e=>setSettings(p=>({...p,nightEnd:parseInt(e.target.value)||23}))} style={{...numI,width:60}} /></div></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Notifications</span><button onClick={()=>setSettings(p=>({...p,notifs:!p.notifs}))} style={{...pill(settings.notifs,C.green),padding:"6px 20px"}}>{settings.notifs?"ON":"OFF"}</button></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Vibrations</span><button onClick={()=>setSettings(p=>({...p,vibrate:!p.vibrate}))} style={{...pill(settings.vibrate,C.green),padding:"6px 20px"}}>{settings.vibrate?"ON":"OFF"}</button></div>
        {/* Prestige */}
        {level>=40&&<div style={{marginTop:16,padding:"16px",borderRadius:12,background:C.goldSoft,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:C.goldBright,marginBottom:4}}>⚔️ PRESTIGE AVAILABLE</div><div style={{fontSize:11,color:C.textDim,marginBottom:10}}>Reset to Level 1, keep all items, earn ★ badge</div><button onClick={()=>{setPrestige(p=>p+1);setMilestone({icon:"⚔️",title:`PRESTIGE ${prestige+1}`,desc:"You've ascended. All items kept.",reward:100});}} style={{...btnB,background:C.goldBright,color:"#1A1D2E"}}>Prestige ★{prestige+1}</button></div>}
      </Overlay>

      {/* Shop */}
      <Overlay open={showShop} onClose={()=>setShowShop(false)} title="XP Shop" wide>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"12px 16px",background:C.goldSoft,borderRadius:12}}><span style={{fontSize:20}}>{rank.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{rank.name} · Level {level}</div></div><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{totalXP} XP</div></div>
        <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{["All","Consumable","Power-up","Theme","Badge","Cosmetic","Flex"].map(c=>(<button key={c} onClick={()=>setShopCat(c)} className="pill-btn" style={{...pill(shopCat===c),padding:"4px 12px",fontSize:10}}>{c}</button>))}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{SHOP_ITEMS.filter(i=>shopCat==="All"||i.cat===shopCat).map(item=>{const owned=purchased.includes(item.id);const can=totalXP>=item.cost&&!owned;return(<div key={item.id} style={{...card,padding:14,textAlign:"center",opacity:owned?0.6:1}}><div style={{fontSize:28,marginBottom:6}}>{item.icon}</div><div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{item.name}</div><div style={{fontSize:10,color:C.textDim,marginBottom:8,minHeight:24}}>{item.desc}</div>{owned?<div style={{fontSize:11,fontWeight:700,color:C.green}}>✓ Owned</div>:<button className="press" onClick={()=>buyItem(item)} style={{...btnB,width:"100%",padding:"8px 0",fontSize:11,opacity:can?1:0.4,background:can?C.blue:C.textDim,cursor:can?"pointer":"default"}}>{item.cost} XP</button>}</div>);})}</div>
      </Overlay>

      {/* Titles */}
      <Overlay open={showTitles} onClose={()=>setShowTitles(false)} title="Achievements & Titles">
        <div style={{fontSize:12,color:C.textDim,marginBottom:16}}>Earn titles through achievements. Select one to display.</div>
        {ACHIEVEMENTS.map(a=>{const unlocked=a.check(achieveStats);return(<div key={a.id} onClick={unlocked?()=>setActiveTitle(activeTitle===a.id?null:a.id):undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:12,background:activeTitle===a.id?C.goldSoft:unlocked?C.greenSoft:C.surfaceDim,border:activeTitle===a.id?`2px solid ${C.goldBright}`:"2px solid transparent",cursor:unlocked?"pointer":"default",opacity:unlocked?1:0.5}}>
          <span style={{fontSize:24}}>{a.icon}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{a.title}</div><div style={{fontSize:11,color:C.textDim}}>{a.desc}</div></div>
          {unlocked&&<span style={{fontSize:11,fontWeight:700,color:activeTitle===a.id?C.goldBright:C.green}}>{activeTitle===a.id?"ACTIVE":"✓"}</span>}
          {!unlocked&&<span style={{fontSize:10,color:C.textDim}}>🔒</span>}
        </div>);})}
      </Overlay>

      {/* Edit Task */}
      <Overlay open={!!editTask} onClose={()=>setEditTask(null)} title="Edit Task">
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Name</div><input value={editText} onChange={e=>setEditText(e.target.value)} style={{...inp,fontSize:15}} /></div>
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Difficulty</div><div style={{display:"flex",gap:4}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setEditDiff(d)} style={{...pill(editDiff===d,DIFF[d].color),flex:1}}>{DIFF[d].label}</button>))}</div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Group</div><div style={{display:"flex",gap:4}}>{["morning","night","general"].map(g=>(<button key={g} onClick={()=>setEditGrp(g)} style={{...pill(editGrp===g),flex:1,textTransform:"capitalize"}}>{g}</button>))}</div></div>
        <button className="press" onClick={saveEdit} style={{...btnB,width:"100%",background:C.green}}>Save Changes</button>
      </Overlay>

      {/* Weekly Recap */}
      <Overlay open={showRecap} onClose={()=>setShowRecap(false)} title="Weekly Recap">
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>📊</div><div style={{fontSize:20,fontWeight:800,color:C.goldBright}}>{weekRecap.tot} XP</div><div style={{fontSize:12,color:C.textDim}}>this week</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.blue}}>{weekRecap.days}</div><div style={{fontSize:11,color:C.textDim}}>Days Active</div></div><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.green}}>{weekRecap.perf}</div><div style={{fontSize:11,color:C.textDim}}>Perfect Days</div></div><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.orange}}>{weekRecap.best}</div><div style={{fontSize:11,color:C.textDim}}>Best Day</div></div><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.goldBright}}>{streak}</div><div style={{fontSize:11,color:C.textDim}}>Streak</div></div></div>
      </Overlay>

      {/* Photo Timeline */}
      <Overlay open={!!showTimeline} onClose={()=>setShowTimeline(null)} title="Photo Timeline" wide>
        {showTimeline&&<div>
          {getPhotoTimeline(showTimeline).length>=2&&<div style={{display:"flex",gap:8,marginBottom:16}}><div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,marginBottom:4}}>FIRST</div><div style={{width:"100%",aspectRatio:"1",borderRadius:12,overflow:"hidden",background:C.surfaceDim}}><img src={getPhotoTimeline(showTimeline)[0].img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div><div style={{fontSize:10,color:C.textDim,marginTop:4}}>{fd(getPhotoTimeline(showTimeline)[0].date)}</div></div><div style={{display:"flex",alignItems:"center",fontSize:20}}>→</div><div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,marginBottom:4}}>LATEST</div><div style={{width:"100%",aspectRatio:"1",borderRadius:12,overflow:"hidden",background:C.surfaceDim}}><img src={getPhotoTimeline(showTimeline)[getPhotoTimeline(showTimeline).length-1].img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div><div style={{fontSize:10,color:C.textDim,marginTop:4}}>{fd(getPhotoTimeline(showTimeline)[getPhotoTimeline(showTimeline).length-1].date)}</div></div></div>}
          <div style={{fontSize:12,fontWeight:700,color:C.textDim,marginBottom:8}}>All Photos ({getPhotoTimeline(showTimeline).length})</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getPhotoTimeline(showTimeline).map((p,i)=>(<div key={i} style={{width:60,height:60,borderRadius:8,overflow:"hidden",background:C.surfaceDim}}><img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>))}</div>
        </div>}
      </Overlay>

      <Overlay open={modal==="weekly"} onClose={()=>setModal(null)} title="Edit Weekly">{wGoals.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:8,background:C.surfaceDim}}><span style={{flex:1,fontSize:13}}>{g.text}</span><button onClick={()=>setWGoals(p=>p.filter(x=>x.id!==g.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>×</button></div>))}</Overlay>
      <Overlay open={modal==="monthly"} onClose={()=>setModal(null)} title="Edit Monthly">{mGoals.map((g,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:8,background:C.surfaceDim}}><span style={{flex:1,fontSize:13}}>{g.text}</span><button onClick={()=>setMGoals(p=>p.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>×</button></div>))}</Overlay>
    </div>
  );
}
