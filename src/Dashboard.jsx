import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

/* ═══ TOKENS ═══ */
const C={bg:"#F3F4F7",surface:"#FFFFFF",surfaceDim:"#F8F9FB",text:"#1A1D2E",textSec:"#4B4F63",textDim:"#9196A8",blue:"#3568B2",blueLight:"#4178C4",blueSoft:"rgba(53,104,178,0.07)",blueMed:"rgba(53,104,178,0.2)",green:"#2BB673",greenBright:"#0BB26A",greenSoft:"rgba(43,182,115,0.08)",orange:"#E07A3A",orangeSoft:"rgba(224,122,58,0.07)",red:"#E04A4A",goldBright:"#F2C94C",goldSoft:"rgba(242,201,76,0.08)",purple:"#6C5CE7"};
const DIFF={easy:{pts:1,label:"Easy",color:C.green,bg:C.greenSoft},medium:{pts:3,label:"Med",color:C.blue,bg:C.blueSoft},hard:{pts:6,label:"Hard",color:C.orange,bg:C.orangeSoft}};
const sMult=s=>s>=30?{m:2,l:"2×"}:s>=14?{m:1.8,l:"1.8×"}:s>=7?{m:1.5,l:"1.5×"}:s>=3?{m:1.2,l:"1.2×"}:{m:1,l:null};
const pC=p=>p>=90?C.goldBright:p>=70?C.greenBright:p>=50?C.green:p>=30?C.gold:C.red;
const gB=p=>p>=80?`linear-gradient(90deg,${C.green},${C.goldBright})`:p>=50?`linear-gradient(90deg,${C.blue},${C.green})`:p>=25?`linear-gradient(90deg,${C.gold},${C.blue})`:`linear-gradient(90deg,${C.orange},${C.red})`;
const dk=d=>{const t=typeof d==="string"?new Date(d):d;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;};
const fd=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const uid=()=>`_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const FN={h:"'Audiowide',sans-serif",b:"'Inter',sans-serif"};

/* ═══ RANKS & LEVELS ═══ */
const RANKS=[{name:"Rookie",min:0,color:"#9196A8",icon:"🌱"},{name:"Bronze",min:5,color:"#CD7F32",icon:"🥉"},{name:"Silver",min:10,color:"#A8A8A8",icon:"🥈"},{name:"Gold",min:18,color:"#E2AE2A",icon:"🥇"},{name:"Platinum",min:28,color:"#8AE0D6",icon:"💠"}];
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
const pill=(on,clr)=>({background:on?(clr||C.blue):C.surfaceDim,border:"none",borderRadius:20,padding:"6px 16px",color:on?"#fff":C.textDim,fontSize:12,fontFamily:FN.b,fontWeight:600,cursor:"pointer",transition:"all 0.12s ease"});

const Tip=({active,payload,label:lb})=>{if(!active||!payload?.length)return null;return(<div style={{background:"#fff",borderRadius:10,padding:"8px 14px",fontSize:12,fontFamily:FN.b,boxShadow:"0 6px 20px rgba(0,0,0,0.08)"}}><div style={{fontSize:12,fontWeight:700,marginBottom:6}}>{lb}</div><div style={{fontSize:12}}>{payload[0].payload.value}</div></div>);};

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
const defTodos=[{id:"m1",text:"Bed Made",diff:"easy",cat:"routine",grp:"morning",proof:false},{id:"m2",text:"Teeth Brushed",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"m3",text:"Face Cleansed",diff:"easy",cat:"health",grp:"morning",proof:false},{id:"n1",text:"Read 20 pages",diff:"medium",cat:"growth",grp:"night",proof:false},{id:"h1",text:"Study 1 hour",diff:"hard",cat:"study",grp:"allday",proof:false}];
const defWeekly=[{id:"w1",text:"Workout 4 times",target:4,current:0},{id:"w2",text:"Go to Class 3x",target:3,current:0},{id:"w3",text:"Get Groceries",target:1,current:0}];
const defMonthly=[{id:"mg1",text:"80% No Social Media",type:"habit-pct",habitId:"n22",target:80},{id:"mg2",text:"85% Exercise",type:"habit-pct",habitId:"n5",target:85},{id:"mg3",text:"Sign Morgan Stanley Form",type:"milestone",target:1}];
const defSplits={upper:["Bench Press","Lat Pull Down","Pec Dec","Mid Row","Tricep PD","Lat Raises","Ab Circuit"],lower:["Squat","RDL","Back Ext.","Leg Ext.","Calf Raises","Ab Circuit"],pull:["Rows (Upper)","Deadlift"],push:["Bench","Overhead Press"],legs:["Squat","Lunge"]};
const spClr={upper:"#4A82D4",lower:"#2A9D5C",pull:"#E07A3A",push:"#D04545",legs:"#7B65B0"};
const seedWH=[{id:"h6",date:"2026-03-15",split:"upper",exercises:[{name:"Bench Press",sets:[{w:50,r:10},{w:60,r:6}]},{name:"Lat Pull Down",sets:[{w:54,r:8},{w:59,r:7}]}]}];
const seedBW=[{date:"2025-10-01",weight:72.5},{date:"2026-01-01",weight:74.5},{date:"2026-03-01",weight:75.2},{date:"2026-03-29",weight:75.8}];
const seedTx={"2026-03-01":[{id:"t14",type:"out",amount:26.5,desc:"Sunday"}],"2026-03-06":[{id:"t16",type:"in",amount:30,desc:"Income"}]};

const getPhase=h=>h>=5&&h<9?"morning":h>=9&&h<16?"day":h>=16&&h<20?"evening":"night";
const getCircBg=p=>p==="morning"?"linear-gradient(180deg,#FFE4C4 0%,#F3F4F7 100%)":p==="day"?"linear-gradient(180deg,#E8F0FE 0%,#F3F4F7 100%)":p==="evening"?"linear-gradient(180deg,#FFD6A5 0%,#F3F4F7 100%)":"linear-gradient(180deg,#EDE7FF 0%,#F3F4F7 100%)";

/* ═══ COMPONENTS ═══ */
function Overlay({open,onClose,title,children,wide}){if(!open)return null;return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(e)=>{if(e.target===e.currentTarget)onClose&&onClose();}}><div style={{width:wide?860:520,maxWidth:"95%",background:C.surface,borderRadius:12,padding:18,boxShadow:"0 12px 40px rgba(0,0,0,0.12)",position:"relative"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:16,fontWeight:800}}>{title}</div><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18}}>✕</button></div><div>{children}</div></div></div>);}

function ProofModal({open,onClose,name,onDone}){if(!open)return null;let fileEl=null;const hf=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onDone(ev.target.result);onClose();};r.readAsDataURL(f);};return(<div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(e)=>e.target===e.currentTarget&&onClose()}><div style={{background:C.surface,padding:18,borderRadius:12,width:420}}><div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Submit Proof — {name}</div><input ref={(el)=>fileEl=el} type="file" accept="image/*" onChange={hf} /><div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><button onClick={onClose} style={{...btnG}}>Cancel</button></div></div></div>);}

function MilestoneModal({open,onClose,data}){if(!open||!data)return null;return(<div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(e)=>e.target===e.currentTarget&&onClose()}><div style={{background:C.surface,padding:22,borderRadius:12,width:420,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>{data.icon}</div><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{data.title}</div><div style={{fontSize:13,color:C.textDim,marginTop:8}}>{data.desc}</div>{data.reward&&<div style={{marginTop:12,fontWeight:700}}>{data.reward} XP</div>}<div style={{marginTop:14}}><button onClick={onClose} style={btnB}>Nice!</button></div></div></div>);}

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

  // New: daily focus tasks stored per date key (dk(date))
  const[dailyFocus,setDailyFocus]=useState({});
  const[focusText,setFocusText]=useState("");

  // Weekly/Monthly edit state
  const[editWId,setEditWId]=useState(null);
  const[editWText,setEditWText]=useState("");
  const[editWTarget,setEditWTarget]=useState("");
  const[editMId,setEditMId]=useState(null);
  const[editMText,setEditMText]=useState("");
  const[shopCat,setShopCat]=useState("All");

  const[gSplit,setGSplit]=useState(null);const[gView,setGView]=useState("log");const[curWk,setCurWk]=useState(null);const[doneEx,setDoneEx]=useState({});const[nBW,setNBW]=useState("");const[eBW,setEBW]=useState("");
  const[bMonth,setBMonth]=useState(()=>new Date());const[selDay,setSelDay]=useState(null);const[txF,setTxF]=useState({type:"out",amount:"",desc:""});
  const[gTab,setGTab]=useState("focus");const[addingIn,setAddingIn]=useState(null);const[qText,setQText]=useState("");const[qDiff,setQDiff]=useState("easy");const[qProof,setQProof]=useState(false);
  const[aRange,setARange]=useState("month");const[showGal,setShowGal]=useState(false);const[streakDD,setStreakDD]=useState("global");const[weakDD,setWeakDD]=useState(false);
  const[selGrp,setSelGrp]=useState(null);const[mkGrp,setMkGrp]=useState(false);const[nGrpName,setNGrpName]=useState("");const[nGrpTasks,setNGrpTasks]=useState([]);
  const[modal,setModal]=useState(null);
  const calRef=useRef(null);const prevStreak=useRef(0);const prevLevel=useRef(1);

  const now=new Date();const vk=dk(vDate);const isToday=vk===dk(now);const dc=checks[vk]||{};const phase=getPhase(now.getHours());
  const activeSubTab=todaySub==="auto"?(now.getHours()>=settings.nightStart?"night":now.getHours()>=settings.morningStart&&now.getHours()<settings.morningEnd?"morning":"allday"):todaySub;

  /* ─── Dynamic XP ─── */
  const xpMult=useMemo(()=>{const m={};todos.forEach(t=>{let d=0;for(let i=1;i<=14;i++){const dt=new Date();dt.setDate(dt.getDate()-i);if((checks[dk(dt)]||{})[t.id])d++;}const r=d/14;m[t.id]=r>0.85?0.9:r>0.6?0.97:1;});return m;},[todos,checks]);
  const drift=useMemo(()=>{const seed=vk.split("-").reduce((a,b)=>a+parseInt(b),0);const d={};todos.forEach((t,i)=>{const h=(seed*(i+7)*13)%100;d[t.id]=h<8?1.3:h<18?1.15:1.0;});return d;},[vk,todos]);
  const getXP=t=>Math.round((DIFF[t.diff]?.pts||1)*(xpMult[t.id]||1)*(drift[t.id]||1)*10)/10;

  const lifetimeXP=useMemo(()=>{let s=0;Object.entries(checks).forEach(([,ch])=>{todos.forEach(t=>{if(ch[t.id])s+=DIFF[t.diff]?.pts||1;});});return s;},[checks,todos]);
  const totalXP=Math.max(0,lifetimeXP-spentXP);
  const level=getLevel(lifetimeXP);const rank=getRank(level+prestige*10);
  const xpCur=getXPFor(level);const xpNext=getXPFor(level+1);
  const levelPct=xpNext>xpCur?Math.min(100,Math.round((lifetimeXP-xpCur)/(xpNext-xpCur)*100)):100;

  /* ─── Photo Streak ─── */
  const photoStreak=useMemo(()=>{let s=0;const d=new Date();while(true){const k=dk(d);if((photoLog[k]||[]).length>0)s++;else break;d.setDate(d.getDate()-1);}return s;},[photoLog]);

  /* ─── Focus Tasks (daily) ─── */
  const focusForDate = dailyFocus[vk] || [];
  const addFocus = (text)=>{if(!text||!text.trim())return;const t={id:uid(),text:text.trim(),done:false};setDailyFocus(p=>({...p,[vk]:[...(p[vk]||[]),t]}));setFocusText("");};
  const toggleFocusDone = (id)=>{setDailyFocus(p=>({...p,[vk]:(p[vk]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}));};
  const editFocus = (id,newText)=>{if(!newText||!newText.trim())return;setDailyFocus(p=>({...p,[vk]:(p[vk]||[]).map(t=>t.id===id?{...t,text:newText.trim()}:t)}));};
  const removeFocus = (id)=>{setDailyFocus(p=>({...p,[vk]:(p[vk]||[]).filter(t=>t.id!==id)}));};

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
  const streak=useMemo(()=>{let s=0;const d=new Date();d.setDate(d.getDate()-1);while(todos.filter(t=>(checks[dk(d)]||{})[t.id]).length>=todos.length*0.5){s++;d.setDate(d.getDate()-1);}if(todos.filter===undefined)return 0;return s;},[checks,todos]);
  const sI=sMult(streak);
  const tStreaks=useMemo(()=>{const s={};todos.forEach(t=>{let c=0;const d=new Date();if((checks[dk(d)]||{})[t.id])c++;d.setDate(d.getDate()-1);while((checks[dk(d)]||{})[t.id]){c++;d.setDate(d.getDate()-1);}s[t.id]=c;});return s;},[todos,checks]);
  const longestS=useMemo(()=>{const keys=Object.keys(checks).sort();let mx=0,cu=0;for(const k of keys){if(todos.filter(t=>(checks[k]||{})[t.id]).length>=todos.length*0.5){cu++;mx=Math.max(mx,cu);}else cu=0;}return mx;},[checks,todos]);

  /* ─── Milestones ─── */
  useEffect(()=>{if(streak>0&&streak!==prevStreak.current&&[7,14,21,30,50,100].includes(streak)){setMilestone({icon:"🔥",title:`${streak}-DAY STREAK`,desc:`${sI.l||""} multiplier active!`,reward:str?0:0});}prevStreak.current=streak;},[streak]);
  useEffect(()=>{if(level>prevLevel.current&&level>1){const r=getRank(level);setMilestone({icon:r.icon,title:`LEVEL ${level}`,desc:`${r.name} rank reached!`,reward:level*5});}prevLevel.current=level;},[level]);

  /* ─── Daily Challenge ─── */
  useEffect(()=>{const today=dk(now);if(!dailyChallenge||dailyChallenge.date!==today){const idx=today.split("-").reduce((a,b)=>a+parseInt(b),0)%CHALLENGE_POOL.length;setDailyChallenge({...CHALLENGE_POOL[idx],date:today});}},[now]);

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
  const todayXP=useMemo(()=>{let e=0,t=0;todos.forEach(td=>{const p=getXP(td);t+=p;if(dc[td.id])e+=p;});const m=Math.round(e*sI.m*10)/10;const hards=todos.filter(td=>td.diff==="hard");const allH=hards.length;return{val:Math.round(e*10)/10,total:Math.round(t*10)/10,pct:Math.min(100,Math.round(m/(t||1)*100))};},[todos,dc,sI]);

  const hRates=useMemo(()=>{const y=vDate.getFullYear(),mo=vDate.getMonth(),mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();if(!mx)return{};const r={};todos.forEach(t=>{let c=0;for(let i=1;i<=mx;i++){const d=new Date(y,mo,i);if((checks[dk(d)]||{})[t.id])c++;}r[t.id]={id:t.id,text:t.text,rate:Math.round(c/mx*100)};});return r;},[vDate,todos,checks]);
  const mScore=useMemo(()=>{const y=vDate.getFullYear(),mo=vDate.getMonth(),mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();let sum=0;for(let i=1;i<=mx;i++){const d=new Date(y,mo,i);const k=dk(d);sum+=dayXP[k]||0;}return Math.round(sum/(mx||1)*10)/10;},[vDate,dayXP]);
  const avgXP=useMemo(()=>{const keys=Object.keys(dayXP);if(!keys.length)return 0;return Math.round(keys.reduce((a,k)=>a+dayXP[k],0)/keys.length*10)/10;},[dayXP]);
  const sortedH=useMemo(()=>Object.values(hRates).sort((a,b)=>b.rate-a.rate),[hRates]);
  const weakHabits=useMemo(()=>sortedH.filter(h=>h.rate<40).slice(-5).reverse(),[sortedH]);

  const weekRecap=useMemo(()=>{let tot=0,days=0,best=0,bestD="",perf=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dk(d);const xp=dayXP[k]||0;tot+=xp;if(xp>0)days++;if(xp>best){best=xp;bestD=k;}if(xp>=(Object.values(dayXP).reduce((a,b)=>a+b,0)/7||0))perf++;}return{tot,days,best,bestD,perf};},[dayXP]);

  /* ─── Photo timeline per task ─── */
  const getPhotoTimeline=(taskId)=>{const photos=[];Object.entries(photoLog).sort(([a],[b])=>a.localeCompare(b)).forEach(([date,items])=>{items.forEach(p=>{if(p.taskId===taskId&&p.img)photos.push({date, ...p});});});return photos;};

  /* ─── Group leaderboard ─── */
  const getGroupLeaderboard=(g)=>{return g.members.map(m=>({name:m.name,xp:m.name==="You"?lifetimeXP:Math.floor(Math.random()*lifetimeXP*0.8)})).sort((a,b)=>b.xp-a.xp);};

  /* ─── Storage ─── */
  useEffect(()=>{try{const s=localStorage.getItem("dash-v16");if(s){const d=JSON.parse(s);if(d.todos)setTodos(d.todos);if(d.checks)setChecks(d.checks);if(d.photoLog)setPhotoLog(d.photoLog);if(d.wGoals)setWGoals(d.wGoals);if(d.mGoals)setMGoals(d.mGoals);if(d.wHist)setWHist(d.wHist);if(d.bwLog)setBwLog(d.bwLog);if(d.txns)setTxns(d.txns);if(d.groups)setGroups(d.groups);if(d.splits)setSplits(d.splits);if(d.settings)setSettings(d.settings);if(d.purchased)setPurchased(d.purchased);if(d.spentXP)setSpentXP(d.spentXP);if(d.activeTitle)setActiveTitle(d.activeTitle);if(d.dailyFocus)setDailyFocus(d.dailyFocus);} }catch(e){console.warn(e);} },[]);
  useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem("dash-v16",JSON.stringify({todos,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,dailyFocus}));}catch(e){console.warn(e);} },300);return()=>clearTimeout(t);},[todos,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,dailyFocus]);

  /* ─── Workout ─── */
  useEffect(()=>{if(gSplit&&(!curWk||curWk.split!==gSplit)){const exs=(splits[gSplit]||[]).map(name=>{const ls=[...wHist].reverse().find(h=>h.split===gSplit);const le=ls?.exercises?.find(e=>e.name===name);return {name,sets:le?JSON.parse(JSON.stringify(le.sets)):[{w:0,r:0}]};});setCurWk({id:uid(),date:dk(now),split:gSplit,exercises:exs});}},[gSplit]);
  const uSet=(ei,si,f,v)=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;return n;});
  const aSet=ei=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});return n;});
  const rSet=ei=>setCurWk(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();return n;});
  const saveWk=()=>{if(!curWk)return;setWHist(p=>[...p,{id:uid(),date:dk(now),split:curWk.split,exercises:curWk.exercises}]);setConfetti(true);setTimeout(()=>{setConfetti(false);setCurWk(p=>({...p,exercises:[]}) );},1400);};
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
  const calDays=useMemo(()=>{const days=[];for(let i=-14;i<=14;i++){const d=new Date();d.setDate(d.getDate()+i);const k=dk(d);const xpVal=dayXP[k]||0;const ch=checks[k]||{};const done=todos.filter(t=>ch[t.id]).length;days.push({date:d,key:k,dayName:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],dayNum:d.getDate(),xp:xpVal,pct:Math.min(100,Math.round((xpVal/Math.max(1,allT.reduce((a,b)=>a+getXP(b),0)))*100)),isToday:k===dk(new Date())});}return days;},[vDate,todos,checks]);
  useEffect(()=>{if(calRef.current)calRef.current.scrollLeft=14*56-100;},[]);

  const buyItem=item=>{if(totalXP<item.cost||purchased.includes(item.id))return;setPurchased(p=>[...p,item.id]);setSpentXP(p=>p+item.cost);setMilestone({icon:item.icon,title:"UNLOCKED",desc:item.name,reward:0});};
  const openEdit=t=>{setEditTask(t);setEditText(t.text);setEditDiff(t.diff);setEditGrp(t.grp);};
  const saveEdit=()=>{if(!editTask||!editText.trim())return;setTodos(p=>p.map(t=>t.id===editTask.id?{...t,text:editText.trim(),diff:editDiff,grp:editGrp}:t));setEditTask(null);};

  const TRow=({t,big})=>{const on=dc[t.id];const xpV=getXP(t);const hi=(drift[t.id]||1)>1.1;return(
    <div className="task-row" onClick={()=>toggle(t)} style={{position:"relative",display:"flex",alignItems:"center",gap:big?14:10,padding:big?"14px 16px":"10px 14px",marginBottom:big?8:4,borderRadius:12,background:on?C.surfaceDim:"transparent"}}>
      <div style={{width:big?24:20,height:big?24:20,borderRadius:big?7:6,flexShrink:0,border:`2px solid ${on?C.greenBright:"rgba(0,0,0,0.12)"}`,background:on?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{on?"✓":""}</div>
      <span style={{flex:1,fontSize:big?14:13,fontWeight:big?600:500,textDecoration:on?"line-through":"none",color:on?C.textDim:C.text}}>{t.text}</span>
      {t.proof&&<span style={{fontSize:big?16:14,opacity:on?0.3:0.8}}>📷</span>}
      {hi&&!on&&<span style={{fontSize:8,fontWeight:700,color:C.orange,background:C.orangeSoft,borderRadius:4,padding:"2px 6px"}}>HIGH</span>}
      <span style={{fontSize:big?11:10,fontWeight:700,color:DIFF[t.diff].color,opacity:0.7}}>{xpV}xp</span>
      {xpPops[t.id]&&<div style={{position:"absolute",top:-4,right:16,fontSize:13,fontWeight:800,color:C.orange,animation:"xpFloat 0.9s ease forwards",pointerEvents:"none"}}>+{xpPops[t.id]}xp</div>}
    </div>);
  };

  const mainTabs=[{k:"today",l:"Today"},{k:"groups",l:"Groups"},{k:"analytics",l:"Analytics"},{k:"goals",l:"Goals"}];

  /* Weekly goals CRUD */
  const startEditW=(g)=>{setEditWId(g.id);setEditWText(g.text);setEditWTarget(String(g.target||g.target===0?g.target:""));};
  const saveWEdit=()=>{if(!editWText.trim())return;setWGoals(p=>p.map(g=>g.id===editWId?{...g,text:editWText.trim(),target:parseInt(editWTarget)||g.target}:g));setEditWId(null);setEditWText("");setEditWTarget("");};
  const addWGoal=(text,target)=>{if(!text||!text.trim())return;setWGoals(p=>[...p,{id:uid(),text:text.trim(),target:parseInt(target)||1,current:0}]);};
  const deleteWGoal=(id)=>{setWGoals(p=>p.filter(g=>g.id!==id));};

  /* Monthly goals CRUD */
  const startEditM=(g)=>{setEditMId(g.id);setEditMText(g.text);};
  const saveMEdit=()=>{if(!editMText.trim())return;setMGoals(p=>p.map(g=>g.id===editMId?{...g,text:editMText.trim()}:g));setEditMId(null);setEditMText("");};
  const addMGoal=(text)=>{if(!text||!text.trim())return;setMGoals(p=>[...p,{id:uid(),text:text.trim(),type:"milestone",target:1}]);};
  const deleteMGoal=(id)=>{setMGoals(p=>p.filter(g=>g.id!==id));};

  /* ─── RENDER ─── */
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:FN.b,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {confetti&&<div style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none",overflow:"hidden"}}>{Array.from({length:40}).map((_,i)=>{const l=Math.random()*100,d=Math.random()*2.5+1;const c=[C.goldBright,C.orange,C.green][Math.floor(Math.random()*3)];return(<div key={i} style={{position:"absolute",left:`${l}%`,top:-40,fontSize:18,transform:`rotate(${Math.random()*360}deg)`,color:c,animation:`confetti ${d}s linear ${i*0.02}s forwards`}}>🎉</div>);})}</div>}
      {lootPop&&<div className="loot" style={{position:"fixed",top:"40%",left:"50%",transform:"translateX(-50%)",zIndex:350,background:C.goldBright,color:"#1A1D2E",borderRadius:16,padding:"16px 28px"}}>{lootPop.text}</div>}

      <ProofModal open={!!proofTask} onClose={()=>setProofTask(null)} name={proofTask?.text||""} onDone={img=>{if(proofTask)proofDone(proofTask,img);}} />
      <MilestoneModal open={!!milestone} onClose={()=>setMilestone(null)} data={milestone} />

      {/* ═══ STICKY HEADER ═══ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 6px"}}>
          <button className="press" onClick={()=>setShowMenu(!showMenu)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}><div style={{width:22,height:3,background:C.text,opacity:0.7,borderRadius:2}}></div><div style={{width:18,height:3,background:C.text,opacity:0.6,borderRadius:2}}></div><div style={{width:14,height:3,background:C.text,opacity:0.5,borderRadius:2}}></div></button>
          <span style={{fontFamily:FN.h,fontSize:20,color:C.goldBright,letterSpacing:"0.08em"}}>PROGRESS</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button className="press" onClick={()=>setShowShop(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏪</button>
            <button className="press" onClick={()=>setShowTitles(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏅</button>
            <button className="press" onClick={()=>setShowSettings(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4}}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13.333a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>

        {showMenu&&<div className="card-enter" style={{position:"absolute",left:12,top:52,background:C.surface,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",padding:4,zIndex:110,minWidth:140}}>
          <button className="press" onClick={()=>{setMenuTab("workout");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:8}}>Workout</button>
          <button className="press" onClick={()=>{setMenuTab("budget");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:8}}>Budget</button>
        </div>}

        {/* Level + Title */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 20px 4px"}}>
          <span style={{fontSize:16}}>{rank.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span style={{fontSize:10,fontWeight:700,color:rank.color}}>{rank.name} · Lv.{level}{prestige>0?` ★${prestige}`:""}</span>
              <span style={{fontSize:9,color:C.textDim}}>{activeTitle?ACHIEVEMENTS.find(a=>a.id===activeTitle)?.title:""}</span>
            </div>
            <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${levelPct}%`,background:`linear-gradient(90deg,${rank.color},${C.goldBright})`,borderRadius:2}} /></div>
          </div>
          <span style={{fontSize:10,fontWeight:700,color:C.goldBright,background:C.goldSoft,borderRadius:6,padding:"2px 8px"}}>{totalXP}</span>
        </div>

        {/* Calendar */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px"}}>
          <div ref={calRef} className="hide-scroll" style={{display:"flex",gap:4,overflowX:"auto",flex:1,padding:"4px 0"}}>
            {calDays.map((d,i)=>{const sel=dk(vDate)===d.key;const sd=d.pct>=0.5;return(
              <div key={i} onClick={()=>{setVDate(d.date);setTab("today");setMenuTab(null);}} style={{flex:"0 0 48px",textAlign:"center",padding:"6px 2px",borderRadius:10,cursor:"pointer",background:sel?C.blue:sd?C.surface:"transparent",color:sel?"#fff":C.text}}>
                <div style={{fontSize:9,fontWeight:600,color:sel?"#fff":C.textDim}}>{d.dayName}</div>
                <div style={{fontSize:14,fontWeight:sel?800:600,color:sel?"#fff":d.isToday?C.goldBright:C.text}}>{d.dayNum}</div>
                {d.xp>0&&<div style={{fontSize:8,fontWeight:700,color:sel?"rgba(255,255,255,0.8)":C.orange,marginTop:1}}>{d.xp}xp</div>}
              </div>
            );})}
          </div>
          <button className="press" onClick={()=>setShowFullCal(!showFullCal)} style={{background:showFullCal?C.goldSoft:C.surfaceDim,border:"none",borderRadius:10,padding:"6px 8px",cursor:"pointer"}}>📅</button>
        </div>
        {showFullCal&&<div className="card-enter" style={{...card,margin:"4px 12px 0",padding:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()-1,1))} style={btnG}>‹</button><div style={{fontWeight:800}}>{vDate.toLocaleString("en-US",{month:"long",year:"numeric"})}</div><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()+1,1))} style={btnG}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,color:C.textDim,fontWeight:700}}>{d}</div>)}</div>
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
              <div><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>Today's XP</div><div style={{display:"flex",alignItems:"baseline",gap:8}}><div style={{fontSize:18,fontWeight:800}}>{todayXP.val}</div><div style={{fontSize:11,color:C.textDim}}>of {todayXP.total} xp</div></div></div>
              <div style={{textAlign:"right"}}>{streak>0&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{fontSize:14}}>🔥</span><span style={{fontSize:15,fontWeight:800}}>{streak}d</span></div>}</div>
            </div>
            <div style={{height:12,background:C.surfaceDim,borderRadius:8,overflow:"hidden"}}><div style={{height:"100%",width:`${todayXP.pct}%`,background:gB(todayXP.pct),borderRadius:8,transition:"width 0.3s ease"}} /></div>
          </div>

          {/* Today Photo Wall */}
          {(photoLog[vk]||[]).length>0&&<div style={{...card,padding:"12px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8}}>TODAY'S PROOF</div>
            <div style={{display:"flex",gap:6,overflowX:"auto"}} className="hide-scroll">{(photoLog[vk]||[]).map((p,i)=>(<div key={i} style={{flex:"0 0 56px",width:56,height:56,borderRadius:10,overflow:"hidden",background:C.surfaceDim}}><img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>))}</div>
          </div>}

          {hardT.length>0&&<div style={{...card,marginBottom:14,borderLeft:`4px solid ${C.orange}`}}>
            <div style={{...lbl,display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{color:C.orange}}>★</span> Focus Tasks<span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:C.textDim}}></span></div>
            {hardT.slice(0,9).map(t=>(<TRow key={t.id} t={t} big />))}
          </div>}

          <div style={{display:"flex",gap:3,marginBottom:12}}>{[{k:"auto",l:`Auto (${activeSubTab})`},{k:"morning",l:"Morning"},{k:"night",l:"Night"},{k:"allday",l:"All Day"}].map(s=>(<button key={s.k} onClick={()=>setTodaySub(s.k)} className="pill-btn" style={pill(todaySub===s.k)}>{s.l}</button>))}</div>

          {(activeSubTab==="morning"||todaySub==="morning")&&<div style={{...card,marginBottom:12}}><div style={lbl}>Morning</div>{mornT.map(t=>(<TRow key={t.id} t={t} />))}</div>}
          {(activeSubTab==="night"||todaySub==="night")&&<div style={{...card,marginBottom:12}}><div style={lbl}>Night</div>{nightT.map(t=>(<TRow key={t.id} t={t} />))}</div>}
          {(activeSubTab==="allday"||todaySub==="allday")&&<div style={card}><div style={lbl}>All Tasks</div>{allT.filter(t=>t.diff!=="hard").map(t=>(<TRow key={t.id} t={t} />))}</div>}
        </div>}

        {/* ═══ GROUPS ═══ */}
        {tab==="groups"&&<div className="tab-content">
          {!selGrp&&!mkGrp&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontWeight:700,fontSize:16,margin:0}}>My Groups</h2><button className="press" onClick={()=>setMkGrp(true)} style={btnB}>+ New Group</button></div>
            {groups.map(g=>{const hl=24-now.getHours();const tp=Math.max(0,Math.min(100,hl/24*100));return(
              <div key={g.id} onClick={()=>setSelGrp(g.id)} className="press" style={{...card,marginBottom:10,cursor:"pointer",background:`linear-gradient(135deg,rgba(224,122,58,0.08),rgba(53,104,178,0.04))`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><div style={{fontSize:15,fontWeight:700}}>{g.name}</div><div style={{fontSize:12,color:C.textDim}}>{g.members.length} members</div></div><div style={{width:120}}><div style={{height:6,background:"rgba(0,0,0,0.06)",borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:`${tp}%`,background:tp>50?C.green:tp>25?C.gold:C.red}}/></div></div></div>
              </div>);})}
          </div>}

          {mkGrp&&<div><button className="press" onClick={()=>{setMkGrp(false);setNGrpName("");setNGrpTasks([]);}} style={{...btnG,marginBottom:14}}>← Back</button><div style={card}><div style={lbl}>Create Group</div><input value={nGrpName} onChange={e=>setNGrpName(e.target.value)} style={inp} placeholder="Group name" /><div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><button className="press" onClick={()=>{if(!nGrpName.trim())return;setGroups(p=>[...p,{id:uid(),name:nGrpName.trim(),tasks:[],members:[{name:"You",av:"E"}],feed:[]}]);setMkGrp(false);setNGrpName("");}} style={btnB}>Create</button></div></div></div>}

          {selGrp&&groups.find(x=>x.id===selGrp)&&<div>
            <button className="press" onClick={()=>setSelGrp(null)} style={{...btnG,marginBottom:14}}>← Back</button>
            {/* Group Feed */}
            <div style={{...card,marginBottom:14}}><div style={lbl}>Activity Feed</div>
              {(groups.find(x=>x.id===selGrp).feed||[]).length===0&&<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>Complete linked tasks to see activity</div>}
              {(groups.find(x=>x.id===selGrp).feed||[]).slice(0,20).map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{(f.user||"?").charAt(0)}</div>
                <div style={{flex:1}}>
                  <div><span style={{fontSize:12,fontWeight:600}}>{f.user}</span><span style={{fontSize:12,color:C.textDim}}> completed </span><span style={{fontSize:12,fontWeight:600,color:C.blue}}>{f.task}</span></div>
                  {f.img&&<div style={{width:80,height:80,borderRadius:8,overflow:"hidden",marginTop:6,background:C.surfaceDim}}><img src={f.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
                  {/* Reactions */}
                  <div style={{display:"flex",gap:4,marginTop:4}}>{["🔥","💪","👏"].map(r=>(<button key={r} className="press" style={{background:C.surfaceDim,border:"none",borderRadius:6,padding:"4px 8px"}}>{r}</button>))}</div>
                </div>
                <span style={{fontSize:9,color:C.textDim,flexShrink:0}}>{new Date(f.time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>
              </div>))}
            </div>
            {/* Leaderboard */}
            <div style={{...card,marginBottom:14}}><div style={lbl}>Leaderboard</div>
              {getGroupLeaderboard(groups.find(x=>x.id===selGrp)).map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:2,borderRadius:8,background:C.surfaceDim}}>
                <span style={{fontSize:14,fontWeight:800,color:i===0?C.goldBright:i===1?"#A8A8A8":i===2?"#CD7F32":C.textDim,width:20}}>{i+1}</span>
                <span style={{fontSize:13,fontWeight:600,flex:1}}>{m.name}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.orange}}>{m.xp} xp</span>
              </div>))}
            </div>
            <div style={card}><div style={lbl}>Members</div>{groups.find(x=>x.id===selGrp).members.map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,0.03)"}}><div style={{width:36,height:36,borderRadius:8,background:C.surfaceDim,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{m.av}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{m.name}</div></div></div>))}</div>
          </div>}
        </div>}

        {/* ═══ ANALYTICS ═══ */}
        {tab==="analytics"&&<div className="tab-content">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{...card,padding:14,textAlign:"center",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>⚡</div><div style={{fontSize:14,fontWeight:700}}>{avgXP} xp</div><div style={{fontSize:12,color:C.textDim}}>Avg / day</div></div>
            <div style={{...card,padding:14,textAlign:"center",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>🔥</div><div style={{fontSize:14,fontWeight:700}}>{streak} d</div><div style={{fontSize:12,color:C.textDim}}>Current streak</div></div>
            <div onClick={()=>setWeakDD(!weakDD)} style={{...card,padding:14,textAlign:"center",cursor:"pointer",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}><div style={{fontSize:18,marginBottom:4}}>⚠️</div><div style={{fontSize:14,fontWeight:700}}>{weakHabits.length}</div><div style={{fontSize:12,color:C.textDim}}>Weak habits</div></div>
          </div>

          {weakDD&&<div style={{...card,marginBottom:14}}><div style={lbl}>Weak Points</div>{weakHabits.map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(0,0,0,0.03)"}}><div style={{flex:1}}>{h.text}</div><div style={{width:60,textAlign:"right",fontWeight:700}}>{h.rate}%</div></div>))}</div>}

          {/* Suggested Focus */}
          <div style={{...card,marginBottom:14,borderLeft:`4px solid ${C.blue}`}}><div style={lbl}>Suggested Focus</div>{weakHabits.slice(0,3).map((h,i)=>(<div key={i} style={{padding:"8px 12px",marginBottom:6,borderRadius:8,background:C.surfaceDim}}>{h.text}</div>))}</div>

          {/* Weekly Recap */}
          <div style={{...card,marginBottom:14,background:`linear-gradient(135deg,${C.goldSoft},${C.surface})`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={lbl}>Weekly Recap</div><button className="press" onClick={()=>setShowRecap(true)} style={{...btnG}}>View</button></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{weekRecap.tot}</div><div style={{fontSize:12,color:C.textDim}}>XP</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.blue}}>{weekRecap.days}</div><div style={{fontSize:12,color:C.textDim}}>Active Days</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.green}}>{weekRecap.best}</div><div style={{fontSize:12,color:C.textDim}}>Best Day</div></div><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.orange}}>{weekRecap.perf}</div><div style={{fontSize:12,color:C.textDim}}>Consistency</div></div></div>
          </div>

          {/* Photo Progress with Timeline */}
          <div style={{...card,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={lbl}>Photo Progress</div><div style={{display:"flex",gap:4}}><button className="press" onClick={()=>setShowGal(!showGal)} style={btnG}>{showGal?"Hide":"Show"}</button></div></div>
            <div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:8}}>📸 {Object.values(photoLog).flat().length} photos · {Object.keys(photoLog).length} days · 🔥 {photoStreak}d streak</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{todos.filter(t=>t.proof).map(t=>{const tl=getPhotoTimeline(t.id);return tl.length>=2?(<button key={t.id} className="press" onClick={()=>setShowTimeline(t.id)} style={{...btnG}}>{t.text}</button>):null;})}</div>
          {Object.entries(photoLog).flatMap(([d, items]) =>
  items.map((it, i) => (
    <div
      key={`${d}-${i}`}
      style={{
        display: "inline-block",
        width: 80,
        height: 80,
        margin: 6,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <img src={it.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  ))
)}
          </div>

          <div style={{...card,padding:"16px 20px",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={lbl}>This Month</span><span style={{fontSize:12,color:C.textDim}}>{vDate.toLocaleString("en-US",{month:"long"})}</span></div><div style={{display:"flex",gap:8}}><div style={{flex:1,height:80,background:C.surfaceDim,borderRadius:8}}></div><div style={{flex:1,height:80,background:C.surfaceDim,borderRadius:8}}></div></div></div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={card}><div style={{...lbl,color:C.green,fontSize:12}}>Strongest</div>{sortedH.filter(h=>h.rate>=50).slice(0,5).map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(0,0,0,0.03)"}}><div>{h.text}</div><div style={{width:60,textAlign:"right",fontWeight:700}}>{h.rate}%</div></div>))}</div>
            <div style={card}><div style={{...lbl,color:C.red,fontSize:12}}>Needs Work</div>{sortedH.filter(h=>h.rate<50).slice(-5).reverse().map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(0,0,0,0.03)"}}><div>{h.text}</div><div style={{width:60,textAlign:"right",fontWeight:700}}>{h.rate}%</div></div>))}</div>
          </div>
        </div>}

        {/* ═══ GOALS ═══ */}
        {tab==="goals"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{[{k:"focus",l:"Focus"},{k:"daily",l:"Daily"},{k:"weekly",l:"Weekly"},{k:"monthly",l:"Monthly"}].map(t=>(<button key={t.k} onClick={()=>setGTab(t.k)} className="pill-btn" style={pill(gTab===t.k)}>{t.l}</button>))}</div>

          {/* Focus: daily user-defined tasks for selected date */}
          {gTab==="focus"&&<div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={lbl}>Daily Focus — {fd(vDate)} {isToday?"(Today)":""}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={focusText} onChange={e=>setFocusText(e.target.value)} placeholder="Add a focus task for this day" style={{...inp,width:280}} />
                <button onClick={()=>addFocus(focusText)} style={btnB}>Add</button>
              </div>
            </div>
            <div>
              {focusForDate.length===0&&<div style={{padding:12,color:C.textDim}}>No focus tasks for this day. Add some!</div>}
              {focusForDate.map((f,i)=> (
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}>
                  <input type="checkbox" checked={!!f.done} onChange={()=>toggleFocusDone(f.id)} />
                  <div style={{flex:1, textDecoration:f.done?"line-through":"none"}}>{f.text}</div>
                  <button className="press" onClick={()=>{const t=prompt("Edit focus task",f.text);if(t!==null)editFocus(f.id,t);}} style={btnG}>Edit</button>
                  <button className="press" onClick={()=>removeFocus(f.id)} style={{...btnG,background:"transparent"}}>Delete</button>
                </div>
              ))}
            </div>
          </div>}

          {/* Daily: existing grouping of daily todos */}
          {gTab==="daily"&&<div>{["morning","night","general"].map(grp=>{const items=todos.filter(t=>t.grp===grp);return(<div key={grp} style={{...card,marginBottom:12}}><div style={{...lbl,textTransform:"capitalize"}}>{grp}</div>{items.map(t=>(<TRow key={t.id} t={t} />))}</div>);})}</div>}

          {/* Weekly: full CRUD */}
          {gTab==="weekly"&&<div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={lbl}>Weekly Goals</div><div style={{display:"flex",gap:8}}><input id="newWText" placeholder="New weekly goal" style={inp} /><input id="newWTarget" placeholder="target" style={{...numI,width:80}} /><button onClick={()=>{const t=document.getElementById("newWText").value;const trg=document.getElementById("newWTarget").value;addWGoal(t,trg);document.getElementById("newWText").value="";document.getElementById("newWTarget").value="";}} style={btnB}>+ New</button></div></div>
            <div>
              {wGoals.length===0&&<div style={{padding:12,color:C.textDim}}>No weekly goals. Add one above.</div>}
              {wGoals.map(g=>{
                return(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}>
                  <div style={{flex:1}}>
                    {editWId===g.id?(
                      <div style={{display:"flex",gap:8}}><input value={editWText} onChange={e=>setEditWText(e.target.value)} style={inp} /><input value={editWTarget} onChange={e=>setEditWTarget(e.target.value)} style={{...numI,width:80}} /></div>
                    ):(<div style={{fontWeight:700}}>{g.text} <span style={{fontSize:12,color:C.textDim}}>({g.current}/{g.target})</span></div>)}
                  </div>
                  {editWId===g.id?(
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={saveWEdit} style={btnB}>Save</button>
                      <button onClick={()=>setEditWId(null)} style={btnG}>Cancel</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>startEditW(g)} style={btnG}>Edit</button>
                      <button onClick={()=>deleteWGoal(g.id)} style={{...btnG,background:"transparent"}}>Delete</button>
                    </div>
                  )}
                </div>);
              })}
            </div>
          </div>}

          {/* Monthly: full CRUD */}
          {gTab==="monthly"&&<div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={lbl}>Monthly Goals</div><div style={{display:"flex",gap:8}}><input id="newMText" placeholder="New monthly goal" style={inp} /><button onClick={()=>{const t=document.getElementById("newMText").value;addMGoal(t);document.getElementById("newMText").value="";}} style={btnB}>+ New</button></div></div>
            <div>
              {mGoals.length===0&&<div style={{padding:12,color:C.textDim}}>No monthly goals. Add one above.</div>}
              {mGoals.map(g=>{
                return(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}>
                  <div style={{flex:1}}>
                    {editMId===g.id?(
                      <input value={editMText} onChange={e=>setEditMText(e.target.value)} style={inp} />
                    ):(<div style={{fontWeight:700}}>{g.text}</div>)}
                  </div>
                  {editMId===g.id?(
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={saveMEdit} style={btnB}>Save</button>
                      <button onClick={()=>setEditMId(null)} style={btnG}>Cancel</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>startEditM(g)} style={btnG}>Edit</button>
                      <button onClick={()=>deleteMGoal(g.id)} style={{...btnG,background:"transparent"}}>Delete</button>
                    </div>
                  )}
                </div>);
              })}
            </div>
          </div>}

        </div>}

        {/* ═══ WORKOUT ═══ */}
        {menuTab==="workout"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"log",l:"Log"},{k:"progress",l:"Progress"},{k:"bodyweight",l:"Weight"}].map(v=>(<button key={v.k} onClick={()=>{setGView(v.k);if(v.k!="log")setGSplit(null);}} className="pill-btn" style={pill(gView===v.k)}>{v.l}</button>))}</div>
          {gView==="log"&&!gSplit&&<div><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(splits).map(([key,exL])=>(<div key={key} style={{...card,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>{setGSplit(key);}}><div><div style={{fontSize:15,fontWeight:700}}>{key}</div><div style={{fontSize:12,color:C.textDim}}>{exL.length} exercises</div></div><div style={{fontSize:12,fontWeight:700,color:spClr[key]||C.text}}>&gt;</div></div>))}</div></div>}
          {gView==="log"&&gSplit&&curWk&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><button onClick={()=>setGSplit(null)} style={btnG}>←</button><span style={{fontSize:16,fontWeight:800}}>{gSplit.toUpperCase()}</span></div></div>}
          {gView==="progress"&&<div style={card}><div style={lbl}>History</div>{wHist.slice().reverse().map(w=>(<div key={w.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}><div style={{flex:1}}><div style={{fontWeight:700}}>{w.split} · {fd(w.date)}</div></div></div>))}</div>}
          {gView==="bodyweight"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>{[{l:"Current",v:`${bwLog.length>0?bwLog[bwLog.length-1].weight:0}kg`,c:C.text},{l:"Avg",v:`${Math.round(bwLog.reduce((a,b)=>a+b.weight,0)/(bwLog.length||1)*10)/10}kg`,c:C.text},{l:"Entries",v:bwLog.length,c:C.text}].map((s,i)=>(<div key={i} style={{...card,textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:C.textDim}}>{s.l}</div></div>))}</div></div>}
        </div>}

        {/* ═══ BUDGET ═══ */}
        {menuTab==="budget"&&<div className="tab-content">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red},{l:"Net",v:`$${bTot.net.toFixed(2)}`,c:C.blue}].map((s,i)=>(<div key={i} style={{...card,textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:C.textDim}}>{s.l}</div></div>))}</div>
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><button onClick={()=>setBMonth(new Date(bY,bM-1,1))} style={btnG}>‹</button><span style={{fontWeight:800}}>{bMonth.toLocaleString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setBMonth(new Date(bY,bM+1,1))} style={btnG}>›</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim}}>{d}</div>)}</div>
          </div>
          {/* PIE CHART */}
          <div style={{...card,marginTop:12}}><div style={lbl}>Breakdown</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:30}}><ResponsiveContainer width={180} height={180}><PieChart><Pie data={[{name:"In",value:bTot.i},{name:"Out",value:bTot.o}]} dataKey="value" cx="50%" cy="50%" outerRadius={60}>{[{name:"In"},{name:"Out"}].map((s,i)=><Cell key={i} fill={i===0?C.green:C.red} />)}</Pie></PieChart></ResponsiveContainer></div></div>
        </div>}
      </div>

      {/* ═══ BOTTOM TAB BAR ═══ */}
      <div style={{position:"sticky",bottom:0,zIndex:100,background:C.surface,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)",display:"flex",padding:"6px 8px",gap:2}}>{mainTabs.map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);setMenuTab(null);}} style={{flex:1,padding:10,borderRadius:10,border:"none",background:tab===t.k?C.surfaceDim:"transparent",fontWeight:700}}>{t.l}</button>))}</div>

      {/* ═══ MODALS ═══ */}
      <Overlay open={showSettings} onClose={()=>setShowSettings(false)} title="Settings">
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Morning Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.morningStart} onChange={e=>setSettings(s=>({...s,morningStart:parseInt(e.target.value)||0}))} style={{...numI,width:100}} /><input type="number" value={settings.morningEnd} onChange={e=>setSettings(s=>({...s,morningEnd:parseInt(e.target.value)||0}))} style={{...numI,width:100}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Night Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.nightStart} onChange={e=>setSettings(s=>({...s,nightStart:parseInt(e.target.value)||0}))} style={{...numI,width:100}} /><input type="number" value={settings.nightEnd} onChange={e=>setSettings(s=>({...s,nightEnd:parseInt(e.target.value)||0}))} style={{...numI,width:100}} /></div></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Notifications</span><input type="checkbox" checked={settings.notifs} onChange={e=>setSettings(s=>({...s,notifs:e.target.checked}))} /></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Vibrations</span><input type="checkbox" checked={settings.vibrate} onChange={e=>setSettings(s=>({...s,vibrate:e.target.checked}))} /></div>
        {/* Prestige */}
        {level>=40&&<div style={{marginTop:16,padding:"16px",borderRadius:12,background:C.goldSoft,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:C.goldBright,marginBottom:4}}>⚔️ Prestige Available</div><div style={{fontSize:12,color:C.textDim}}>Reset level for prestige rewards.</div><div style={{marginTop:8}}><button style={btnB} onClick={()=>{setPrestige(p=>p+1);setSpentXP(0);}}>Prestige</button></div></div>}
      </Overlay>

      {/* Shop */}
      <Overlay open={showShop} onClose={()=>setShowShop(false)} title="XP Shop" wide>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"12px 16px",background:C.goldSoft,borderRadius:12}}><span style={{fontSize:20}}>{rank.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{rank.name} · Lv.{level}</div><div style={{fontSize:12,color:C.textDim}}>XP: {totalXP}</div></div></div>
        <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{["All","Consumable","Power-up","Theme","Badge","Cosmetic","Flex"].map(c=>(<button key={c} onClick={()=>setShopCat(c)} className="pill-btn" style={pill(shopCat===c)}>{c}</button>))}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{SHOP_ITEMS.filter(i=>shopCat==="All"||i.cat===shopCat).map(item=>{const owned=purchased.includes(item.id);const can=totalXP>=item.cost;return(<div key={item.id} style={{...card,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:22}}>{item.icon}</div><div><div style={{fontWeight:800}}>{item.name}</div><div style={{fontSize:12,color:C.textDim}}>{item.desc}</div></div></div><div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}><div style={{fontWeight:800,color:can?C.goldBright:C.textDim}}>{item.cost} xp</div><button onClick={()=>buyItem(item)} style={{...btnB,background:owned?C.surfaceDim:btnB.background}} disabled={!can||owned}>{owned?"Owned":"Buy"}</button></div></div>);})}</div>
      </Overlay>

      {/* Titles */}
      <Overlay open={showTitles} onClose={()=>setShowTitles(false)} title="Achievements & Titles">
        <div style={{fontSize:12,color:C.textDim,marginBottom:16}}>Earn titles through achievements. Select one to display.</div>
        {ACHIEVEMENTS.map(a=>{const unlocked=a.check(achieveStats);return(<div key={a.id} onClick={unlocked?()=>setActiveTitle(activeTitle===a.id?null:a.id):undefined} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",marginBottom:6,borderRadius:8,background:unlocked?C.surfaceDim:"transparent",cursor:unlocked?"pointer":"default"}}>
          <span style={{fontSize:24}}>{a.icon}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{a.title}</div><div style={{fontSize:11,color:C.textDim}}>{a.desc}</div></div>
          {unlocked&&<span style={{fontSize:11,fontWeight:700,color:activeTitle===a.id?C.goldBright:C.green}}>{activeTitle===a.id?"ACTIVE":"✓"}</span>}
          {!unlocked&&<span style={{fontSize:10,color:C.textDim}}>🔒</span>}
        </div>);})}
      </Overlay>

      {/* Edit Task */}
      <Overlay open={!!editTask} onClose={()=>setEditTask(null)} title="Edit Task">
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Name</div><input value={editText} onChange={e=>setEditText(e.target.value)} style={{...inp}} /></div>
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Difficulty</div><div style={{display:"flex",gap:4}}>{["easy","medium","hard"].map(d=>(<button key={d} className="press" onClick={()=>setEditDiff(d)} style={pill(editDiff===d,DIFF[d].color)}>{DIFF[d].label}</button>))}</div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Group</div><div style={{display:"flex",gap:4}}>{["morning","night","general"].map(g=>(<button key={g} className="press" onClick={()=>setEditGrp(g)} style={pill(editGrp===g)}>{g}</button>))}</div></div>
        <button className="press" onClick={saveEdit} style={{...btnB,width:"100%",background:C.green}}>Save Changes</button>
      </Overlay>

      {/* Weekly Recap */}
      <Overlay open={showRecap} onClose={()=>setShowRecap(false)} title="Weekly Recap">
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>📊</div><div style={{fontSize:20,fontWeight:800,color:C.goldBright}}>{weekRecap.tot} XP</div><div style={{fontSize:12,color:C.textDim}}>Last 7 days</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.blue}}>{weekRecap.best}</div><div style={{fontSize:12,color:C.textDim}}>Best Day XP</div></div><div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:C.green}}>{weekRecap.days}</div><div style={{fontSize:12,color:C.textDim}}>Active Days</div></div></div>
      </Overlay>

      {/* Photo Timeline */}
      <Overlay open={!!showTimeline} onClose={()=>setShowTimeline(null)} title="Photo Timeline" wide>
        {showTimeline&&<div>
          {getPhotoTimeline(showTimeline).length>=2&&<div style={{display:"flex",gap:8,marginBottom:16}}><div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,marginBottom:6}}>First</div><div style={{fontSize:12,fontWeight:700}}>{fd(getPhotoTimeline(showTimeline)[0].date)}</div></div><div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,marginBottom:6}}>Latest</div><div style={{fontSize:12,fontWeight:700}}>{fd(getPhotoTimeline(showTimeline).slice(-1)[0].date)}</div></div></div>}
          <div style={{fontSize:12,fontWeight:700,color:C.textDim,marginBottom:8}}>All Photos ({getPhotoTimeline(showTimeline).length})</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getPhotoTimeline(showTimeline).map((p,i)=>(<div key={i} style={{width:60,height:60,borderRadius:8,overflow:"hidden",background:C.surfaceDim}}><img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>))}</div>
        </div>}
      </Overlay>

    </div>
  );
}
