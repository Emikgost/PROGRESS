import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ═══ TOKENS ═══ */
const C={bg:"#F3F4F7",surface:"#FFFFFF",surfaceDim:"#F8F9FB",text:"#1A1D2E",textSec:"#4B4F63",textDim:"#9196A8",blue:"#3568B2",blueLight:"#4178C4",blueSoft:"rgba(53,104,178,0.07)",blueMed:"rgba(53,104,178,0.13)",green:"#2A9D5C",greenBright:"#34BB6E",greenSoft:"rgba(42,157,92,0.07)",greenMed:"rgba(42,157,92,0.13)",red:"#D04545",redSoft:"rgba(208,69,69,0.07)",gold:"#C9960C",goldBright:"#E2AE2A",goldSoft:"rgba(201,150,12,0.07)",goldMed:"rgba(201,150,12,0.13)",orange:"#E07A3A",orangeSoft:"rgba(224,122,58,0.08)",purple:"#7B65B0",purpleSoft:"rgba(123,101,176,0.07)"};
const DIFF={easy:{pts:1,label:"Easy",color:C.green,bg:C.greenSoft},medium:{pts:3,label:"Med",color:C.blue,bg:C.blueSoft},hard:{pts:6,label:"Hard",color:C.orange,bg:C.orangeSoft}};
const FN={h:"'Audiowide',sans-serif",b:"'Inter',sans-serif"};
const pC=p=>p>=80?C.greenBright:p>=60?C.green:p>=40?C.gold:p>=20?C.orange:C.red;
const gB=p=>p>=80?`linear-gradient(90deg,${C.green},${C.greenBright})`:p>=50?`linear-gradient(90deg,${C.blue},${C.green})`:p>=25?`linear-gradient(90deg,${C.gold},${C.blue})`:`linear-gradient(90deg,${C.red},${C.gold})`;
// Red → Green gradient for calendar cells
const pctBg=p=>{if(p<=0)return "transparent";const r=Math.round(208+(42-208)*(p/100));const g=Math.round(69+(157-69)*(p/100));const b=Math.round(69+(92-69)*(p/100));return `rgba(${r},${g},${b},0.22)`;};
const pctBorder=p=>{if(p<=0)return "transparent";const r=Math.round(208+(42-208)*(p/100));const g=Math.round(69+(157-69)*(p/100));const b=Math.round(69+(92-69)*(p/100));return `rgba(${r},${g},${b},0.6)`;};
const dk=d=>{const t=typeof d==="string"?new Date(d):d;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;};
const fd=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const uid=()=>`_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

/* ═══ RANKS / ACHIEVEMENTS / SHOP (only shown if feature toggle on) ═══ */
const RANKS=[{name:"Rookie",min:0,color:"#9196A8",icon:"🌱"},{name:"Bronze",min:5,color:"#CD7F32",icon:"🥉"},{name:"Silver",min:10,color:"#A8A8A8",icon:"🥈"},{name:"Gold",min:18,color:"#E2AE2A",icon:"🥇"},{name:"Diamond",min:28,color:"#4FC3F7",icon:"💎"},{name:"Legend",min:40,color:"#E07A3A",icon:"👑"}];
const getLevel=xp=>Math.floor(Math.sqrt(xp/8))+1;
const getXPFor=lvl=>Math.round(Math.pow(lvl-1,2)*8);
const getRank=lv=>{for(let i=RANKS.length-1;i>=0;i--){if(lv>=RANKS[i].min)return RANKS[i];}return RANKS[0];};
const ACHIEVEMENTS=[
  {id:"first_blood",title:"First Blood",desc:"Complete your first task",icon:"🎯",check:s=>s.lifetimeXP>0},
  {id:"week_warrior",title:"Week Warrior",desc:"7-day streak",icon:"🗡️",check:s=>s.longestStreak>=7},
  {id:"iron_will",title:"Iron Will",desc:"30-day streak",icon:"🦾",check:s=>s.longestStreak>=30},
  {id:"perfectionist",title:"Perfectionist",desc:"10 perfect days",icon:"✨",check:s=>s.perfectDays>=10},
  {id:"photographer",title:"Photographer",desc:"100 proof photos",icon:"📸",check:s=>s.totalPhotos>=100},
  {id:"grinder",title:"The Grinder",desc:"1000 lifetime XP",icon:"⚡",check:s=>s.lifetimeXP>=1000},
];
const SHOP_ITEMS=[
  {id:"shield",name:"Streak Shield",desc:"Protect streak for 1 missed day",cost:80,icon:"🛡️"},
  {id:"double_xp",name:"Double XP Token",desc:"2× XP for one day",cost:300,icon:"⚡"},
  {id:"theme_dark",name:"Dark Mode",desc:"Unlock dark theme",cost:250,icon:"🌙"},
  {id:"badge_fire",name:"Fire Badge",desc:"Custom fire badge",cost:120,icon:"🔥"},
  {id:"badge_diamond",name:"Diamond Badge",desc:"Exclusive icon",cost:400,icon:"💠"},
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
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes fadeTab{from{opacity:0}to{opacity:1}}
.task-row{transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}.task-row:active{transform:scale(0.97)}
.hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{scrollbar-width:none}
.tab-content{animation:slideUp 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
.pill-btn{transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}.pill-btn:active{transform:scale(0.95)}
.press{transition:all 0.15s ease}.press:active{transform:scale(0.96)}
.overlay-bg{animation:overlayIn 0.2s ease}
.modal-box{animation:modalIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)}
.card-enter{animation:scaleIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}
.banner-fade{animation:fadeTab 0.4s ease}
`;

/* ═══ SEED DATA ═══ */
const defTodos=[
  {id:"m1",text:"Bed Made",diff:"easy",grp:"morning",proof:false},
  {id:"m2",text:"Teeth Brushed",diff:"easy",grp:"morning",proof:false},
  {id:"m3",text:"Face Cleaned",diff:"easy",grp:"morning",proof:false},
  {id:"m4",text:"No Phone (AM)",diff:"medium",grp:"morning",proof:false},
  {id:"m5",text:"Minoxidil",diff:"easy",grp:"morning",proof:false},
  {id:"m6",text:"Vaseline",diff:"easy",grp:"morning",proof:false},
  {id:"m7",text:"Shower",diff:"easy",grp:"morning",proof:false},
  {id:"n1",text:"To-Do List",diff:"easy",grp:"night",proof:false},
  {id:"n2",text:"Calendar Done",diff:"easy",grp:"night",proof:false},
  {id:"n3",text:"Budgeting",diff:"medium",grp:"night",proof:false},
  {id:"n4",text:"Journal",diff:"medium",grp:"night",proof:false},
  {id:"n7",text:"Eat Healthy",diff:"medium",grp:"night",proof:false},
  {id:"n9",text:"Read 30 min",diff:"medium",grp:"night",proof:false},
  {id:"n11",text:"Talk to Family",diff:"medium",grp:"night",proof:false},
  {id:"n13",text:"I Won the Day",diff:"easy",grp:"night",proof:false},
  {id:"n14",text:"3L Water",diff:"medium",grp:"night",proof:false},
  {id:"n15",text:"Pills Taken",diff:"easy",grp:"night",proof:false},
  {id:"n16",text:"Clean Room",diff:"easy",grp:"night",proof:false},
  {id:"n17",text:"Teeth Clean",diff:"easy",grp:"night",proof:false},
  {id:"n20",text:"Shower (PM)",diff:"easy",grp:"night",proof:false},
];
const defFocusSeed=[
  {id:"f_ex",text:"Exercise",diff:"hard",proof:true},
  {id:"f_cw",text:"Career Work",diff:"hard",proof:false},
  {id:"f_sp",text:"Spanish 30 min",diff:"hard",proof:false},
  {id:"f_10k",text:"10K Steps",diff:"hard",proof:false},
  {id:"f_nsm",text:"No Social Media",diff:"hard",proof:false},
];
const defWeekly=[{id:"w1",text:"Workout 4 times",target:4,current:0},{id:"w2",text:"Go to Class 3x",target:3,current:0},{id:"w3",text:"Get Groceries",target:1,current:0}];
const defMonthly=[{id:"mg1",text:"Sign Morgan Stanley",type:"check",done:false},{id:"mg2",text:"Read a Full Book",type:"check",done:false}];
const defSplits={upper:["Bench Press","Lat Pull Down","Pec Dec","Mid Row","Tricep PD","Lat Raises","Ab Circuit"],lower:["Squat","RDL","Back Ext.","Leg Ext.","Calf Raises","Ab Circuit"],pull:["Rows (Up)","Rows (Mid)","Pulldown","Face Pulls","Shrugs"],push:["Cable Chest","Tricep Ext","Curls","Shoulder Press","Hammer Curls"],legs:["Paused Squat","Cable Lat Raise","Calf Raises"]};
const spClr={upper:"#4A82D4",lower:"#2A9D5C",pull:"#E07A3A",push:"#D04545",legs:"#7B65B0"};
const seedWH=[{id:"h6",date:"2026-03-15",split:"upper",exercises:[{name:"Bench Press",sets:[{w:50,r:10},{w:60,r:6}]},{name:"Lat Pull Down",sets:[{w:54,r:8},{w:59,r:7}]}]}];
const seedBW=[{date:"2025-10-01",weight:72.5},{date:"2026-01-01",weight:74.5},{date:"2026-03-01",weight:75.2},{date:"2026-03-29",weight:75.8}];
const seedTx={"2026-03-01":[{id:"t14",type:"out",amount:26.5,desc:"Sunday"}],"2026-03-06":[{id:"t16",type:"in",amount:30,desc:"Income"}]};
const defSettings={morningStart:5,morningEnd:12,nightStart:18,nightEnd:23,notifs:true,vibrate:true,features:{xp:false,levels:false,store:false,achievements:false,dailyChallenges:false}};

/* ═══ BANNER SCENE (3 modes) ═══ */
function BannerScene({mode}){
  const skies={
    morning:{a:"#FFE0C2",b:"#FFB88A",c:"#FFD9A8"},
    day:{a:"#87CEEB",b:"#B4DFF5",c:"#DCF2FC"},
    evening:{a:"#4B3B6B",b:"#E85A4F",c:"#FFB47A"}
  };
  const suns={
    morning:{x:90,y:95,r:18,color:"#FFD27A",glow:"#FFB366"},
    day:{x:320,y:34,r:22,color:"#FFE066",glow:"#FFD27A"},
    evening:{x:330,y:98,r:20,color:"#FF6B35",glow:"#FF4B20"}
  };
  const s=skies[mode];const su=suns[mode];
  return(
    <svg key={mode} viewBox="0 0 400 150" className="banner-fade" style={{width:"100%",height:"100%",display:"block",borderRadius:20}} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`sky-${mode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.a}/><stop offset="0.55" stopColor={s.b}/><stop offset="1" stopColor={s.c}/>
        </linearGradient>
        <radialGradient id={`sun-${mode}`}><stop offset="0" stopColor={su.color}/><stop offset="1" stopColor={su.glow}/></radialGradient>
      </defs>
      <rect width="400" height="150" fill={`url(#sky-${mode})`}/>
      <circle cx={su.x} cy={su.y} r={su.r+12} fill={su.glow} opacity="0.25"/>
      <circle cx={su.x} cy={su.y} r={su.r} fill={`url(#sun-${mode})`}/>
      {mode==="evening"&&<ellipse cx="200" cy="120" rx="260" ry="8" fill="#FF8C42" opacity="0.35"/>}
      {/* distant hills */}
      <path d="M0,118 Q80,102 160,110 T320,108 T400,112 L400,150 L0,150 Z" fill={mode==="evening"?"#3B2B4E":mode==="morning"?"#7FA07F":"#5F8F5F"} opacity="0.85"/>
      <path d="M0,126 Q100,120 200,124 T400,123 L400,150 L0,150 Z" fill={mode==="evening"?"#2C1F3B":mode==="morning"?"#5A7A5A":"#4A7A4A"}/>
      {/* 3 trees */}
      {[{x:70,s:1.0},{x:200,s:1.2},{x:330,s:0.9}].map((t,i)=>{const trunkColor=mode==="evening"?"#1C1226":"#3E2723";const leafDark=mode==="evening"?"#1F3326":"#2F4F2F";const leafLight=mode==="evening"?"#2A4A34":"#3A5F3A";return(
        <g key={i} transform={`translate(${t.x},126) scale(${t.s})`}>
          <rect x="-3" y="-22" width="6" height="24" fill={trunkColor}/>
          <polygon points="-20,-22 0,-58 20,-22" fill={leafDark}/>
          <polygon points="-15,-36 0,-66 15,-36" fill={leafLight}/>
        </g>
      );})}
    </svg>
  );
}

/* ═══ UI Bits ═══ */
function Overlay({open,onClose,title,children,wide}){if(!open)return null;return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(20,22,36,0.25)",backdropFilter:"blur(8px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#fff",borderRadius:20,padding:24,width:"92%",maxWidth:wide?640:520,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:15,fontWeight:700,margin:0}}>{title}</h3><button className="press" onClick={onClose} style={{background:C.surfaceDim,border:"none",color:C.textDim,fontSize:16,cursor:"pointer",width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>{children}</div></div>);}

function ProofModal({open,onClose,name,onDone}){if(!open)return null;let fileEl=null;const hf=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onDone(ev.target.result);onClose();};r.readAsDataURL(f);};return(<div style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#111",borderRadius:24,padding:32,width:"86%",maxWidth:360,textAlign:"center"}}><div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Photo Proof Required</div><div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:24}}>{name}</div><input ref={el=>fileEl=el} type="file" accept="image/*" capture="environment" onChange={hf} style={{display:"none"}} /><button onClick={()=>fileEl?.click()} style={{width:160,height:160,borderRadius:20,background:"rgba(255,255,255,0.05)",border:"2px dashed rgba(255,255,255,0.15)",margin:"0 auto 24px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,cursor:"pointer"}}><span style={{fontSize:44}}>📸</span><span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600}}>Tap to Open Camera</span></button><button onClick={onClose} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",padding:"10px 24px"}}>Cancel</button></div></div>);}

/* ═══ Icons for footer ═══ */
const Icons={
  today:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  groups:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  analytics:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  goals:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
};

/* ═══ MAIN ═══ */
export default function Dashboard(){
  const[todos,setTodos]=useState(defTodos);
  const[focusByDate,setFocusByDate]=useState(()=>({[dk(new Date())]:defFocusSeed}));
  const[checks,setChecks]=useState({});
  const[photoLog,setPhotoLog]=useState({});
  const[wGoals,setWGoals]=useState(defWeekly);
  const[mGoals,setMGoals]=useState(defMonthly);
  const[wHist,setWHist]=useState(seedWH);
  const[bwLog,setBwLog]=useState(seedBW);
  const[txns,setTxns]=useState(seedTx);
  const[groups,setGroups]=useState([{id:"g1",name:"Workout Crew",tasks:["f_ex"],members:[{name:"You",av:"E"},{name:"Alex",av:"A"}],feed:[]}]);
  const[splits,setSplits]=useState(defSplits);
  const[settings,setSettings]=useState(defSettings);
  const[purchased,setPurchased]=useState([]);
  const[spentXP,setSpentXP]=useState(0);
  const[activeTitle,setActiveTitle]=useState(null);
  const[curWkState,setCurWkState]=useState(null); // persisted workout draft

  const[tab,setTab]=useState("today");
  const[menuTab,setMenuTab]=useState(null);
  const[vDate,setVDate]=useState(()=>new Date());
  const[showMenu,setShowMenu]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[showFullCal,setShowFullCal]=useState(false);
  const[showShop,setShowShop]=useState(false);
  const[showTitles,setShowTitles]=useState(false);
  const[showRecap,setShowRecap]=useState(false);
  const[confetti,setConfetti]=useState(false);
  const[proofTask,setProofTask]=useState(null);
  const[xpPops,setXpPops]=useState({});
  const[todaySub,setTodaySub]=useState("morning"); // morning | allday | evening
  const[editTask,setEditTask]=useState(null); // {task, source:"focus"|"todos"}
  const[editText,setEditText]=useState("");
  const[editDiff,setEditDiff]=useState("easy");
  const[editGrp,setEditGrp]=useState("morning");
  const[editProof,setEditProof]=useState(false);
  const[shopCat,setShopCat]=useState("All");

  const[gSplit,setGSplit]=useState(null);const[gView,setGView]=useState("log");const[doneEx,setDoneEx]=useState({});const[nBW,setNBW]=useState("");const[addSplit,setAddSplit]=useState(false);const[nSpName,setNSpName]=useState("");const[nSpEx,setNSpEx]=useState("");
  const[bMonth,setBMonth]=useState(()=>new Date());const[selDay,setSelDay]=useState(null);const[txF,setTxF]=useState({type:"out",amount:"",desc:""});
  const[gTab,setGTab]=useState("focus");
  // Unified task-add form state (camera+diff+grp upfront)
  const[addForm,setAddForm]=useState(null); // {target:"focus"|"morning"|"night"|"general"}
  const[fText,setFText]=useState("");const[fDiff,setFDiff]=useState("easy");const[fProof,setFProof]=useState(false);const[fGrp,setFGrp]=useState("morning");
  const[addWGoal,setAddWGoal]=useState(false);const[nwText,setNwText]=useState("");const[nwTarget,setNwTarget]=useState("");
  const[addMGoal,setAddMGoal]=useState(false);const[nmText,setNmText]=useState("");
  const[showGal,setShowGal]=useState(false);
  const[selGrp,setSelGrp]=useState(null);const[mkGrp,setMkGrp]=useState(false);const[nGrpName,setNGrpName]=useState("");const[nGrpTasks,setNGrpTasks]=useState([]);
  const[modal,setModal]=useState(null);
  const calRef=useRef(null);

  const now=new Date();const vk=dk(vDate);const isToday=vk===dk(now);const dc=checks[vk]||{};
  const F=settings.features;
  const focusTasks=focusByDate[vk]||[];
  const morningT=todos.filter(t=>t.grp==="morning");
  const nightT=todos.filter(t=>t.grp==="night");

  /* ─── Toggle ─── */
  const toggle=t=>{
    const on=dc[t.id];
    if(!on&&t.proof){setProofTask(t);return;}
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:!on}}));
    if(!on&&F.xp){
      const xpV=DIFF[t.diff]?.pts||1;
      setXpPops(p=>({...p,[t.id]:xpV}));
      setTimeout(()=>setXpPops(p=>{const n={...p};delete n[t.id];return n;}),900);
    }
    if(!on){
      groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
        setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"complete"},...(g.feed||[]).slice(0,49)]}:g));
      });
    }
  };
  const proofDone=(t,img)=>{
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:true}}));
    setPhotoLog(p=>({...p,[vk]:[...(p[vk]||[]),{taskId:t.id,taskName:t.text,time:new Date().toISOString(),img:img||null}]}));
    groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
      setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"proof",img},...(g.feed||[]).slice(0,49)]}:g));
    });
  };

  /* ─── Streaks & XP (only used if features on) ─── */
  const allDayTasks=useMemo(()=>{const set={};Object.keys(focusByDate).forEach(d=>{(focusByDate[d]||[]).forEach(t=>{set[t.id]=t;});});return set;},[focusByDate]);
  const lifetimeXP=useMemo(()=>{let s=0;Object.entries(checks).forEach(([date,ch])=>{todos.forEach(t=>{if(ch[t.id])s+=DIFF[t.diff]?.pts||1;});(focusByDate[date]||[]).forEach(t=>{if(ch[t.id])s+=DIFF[t.diff]?.pts||1;});});return s;},[checks,todos,focusByDate]);
  const totalXP=Math.max(0,lifetimeXP-spentXP);
  const level=getLevel(lifetimeXP);const rank=getRank(level);
  const xpCur=getXPFor(level);const xpNext=getXPFor(level+1);
  const levelPct=xpNext>xpCur?Math.min(100,Math.round((lifetimeXP-xpCur)/(xpNext-xpCur)*100)):100;

  const streak=useMemo(()=>{let s=0;const d=new Date();d.setDate(d.getDate()-1);const tot=todos.length;while(todos.filter(t=>(checks[dk(d)]||{})[t.id]).length>=tot*0.5){s++;d.setDate(d.getDate()-1);}if(todos.filter(t=>(checks[dk(now)]||{})[t.id]).length>=tot*0.5)s++;return s;},[checks,todos]);
  const longestS=useMemo(()=>{const keys=Object.keys(checks).sort();let mx=0,cu=0;for(const k of keys){if(todos.filter(t=>(checks[k]||{})[t.id]).length>=todos.length*0.5){cu++;mx=Math.max(mx,cu);}else cu=0;}return mx;},[checks,todos]);

  /* ─── NEW Completion metrics (equal weight 1:1) ─── */
  // For viewed date: completion rate across ALL tasks (recurring + focus)
  const todayCompletion=useMemo(()=>{
    const all=[...todos,...focusTasks];
    if(all.length===0)return{done:0,total:0,pct:0};
    const done=all.filter(t=>dc[t.id]).length;
    return{done,total:all.length,pct:Math.round(done/all.length*100)};
  },[todos,focusTasks,dc]);

  // Monthly avg completion rate (equal weight)
  const monthCompletionAvg=useMemo(()=>{
    const y=vDate.getFullYear(),mo=vDate.getMonth();
    const mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();
    if(!mx)return 0;
    let sum=0,days=0;
    for(let i=1;i<=mx;i++){
      const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
      const ch=checks[k]||{};
      const dayFocus=focusByDate[k]||[];
      const all=[...todos,...dayFocus];
      if(all.length===0)continue;
      const done=all.filter(t=>ch[t.id]).length;
      sum+=(done/all.length)*100;days++;
    }
    return days>0?Math.round(sum/days):0;
  },[checks,todos,focusByDate,vDate]);

  // Avg focus task completion per day
  const focusAvgPct=useMemo(()=>{
    let sum=0,days=0;
    Object.keys(focusByDate).forEach(k=>{
      const f=focusByDate[k]||[];
      if(f.length===0)return;
      const ch=checks[k]||{};
      const done=f.filter(t=>ch[t.id]).length;
      sum+=(done/f.length)*100;days++;
    });
    return days>0?Math.round(sum/days):0;
  },[focusByDate,checks]);

  // Per-habit rates for Strong/Weak
  const hRates=useMemo(()=>{
    const y=vDate.getFullYear(),mo=vDate.getMonth();
    const mx=(y===now.getFullYear()&&mo===now.getMonth())?now.getDate():new Date(y,mo+1,0).getDate();
    if(!mx)return{};
    const r={};
    todos.forEach(h=>{
      let d=0;
      for(let i=1;i<=mx;i++){
        const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
        if((checks[k]||{})[h.id])d++;
      }
      r[h.id]={name:h.text,rate:Math.round(d/mx*100)};
    });
    return r;
  },[checks,vDate,todos]);
  const sortedH=useMemo(()=>Object.values(hRates).sort((a,b)=>b.rate-a.rate),[hRates]);
  const weakHabits=useMemo(()=>sortedH.filter(h=>h.rate<40).slice(-5).reverse(),[sortedH]);

  // Weekly recap (in terms of completion %)
  const weekRecap=useMemo(()=>{
    let totPct=0,days=0,best=0,bestD="",perf=0;
    const daily=[];
    for(let i=6;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=dk(d);
      const ch=checks[k]||{};
      const dayFocus=focusByDate[k]||[];
      const all=[...todos,...dayFocus];
      const done=all.length>0?all.filter(t=>ch[t.id]).length:0;
      const pct=all.length>0?Math.round(done/all.length*100):0;
      daily.push({day:d.toLocaleDateString("en-US",{weekday:"short"}),pct,done,total:all.length});
      if(pct>0){totPct+=pct;days++;}
      if(pct>best){best=pct;bestD=fd(d);}
      if(pct===100)perf++;
    }
    return{avg:days>0?Math.round(totPct/days):0,days,best,bestD,perf,daily};
  },[checks,todos,focusByDate]);

  // 14-day completion timeline for Full Report
  const fullReportData=useMemo(()=>{
    const out=[];
    for(let i=29;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=dk(d);
      const ch=checks[k]||{};
      const dayFocus=focusByDate[k]||[];
      const all=[...todos,...dayFocus];
      const done=all.length>0?all.filter(t=>ch[t.id]).length:0;
      const pct=all.length>0?Math.round(done/all.length*100):0;
      const focusDone=dayFocus.length>0?Math.round(dayFocus.filter(t=>ch[t.id]).length/dayFocus.length*100):0;
      out.push({date:`${d.getMonth()+1}/${d.getDate()}`,completion:pct,focus:focusDone});
    }
    return out;
  },[checks,todos,focusByDate]);

  // Weekly feedback label
  const weekLabel=weekRecap.avg>=75?"Good":weekRecap.avg>=50?"Okay":"Weak";
  const weekLabelColor=weekRecap.avg>=75?C.green:weekRecap.avg>=50?C.gold:C.red;

  // Photo stats
  const photoStreak=useMemo(()=>{let s=0;const d=new Date();while(true){const k=dk(d);if((photoLog[k]||[]).length>0)s++;else break;d.setDate(d.getDate()-1);}return s;},[photoLog]);
  const allPhotos=useMemo(()=>{const out=[];Object.entries(photoLog).sort(([a],[b])=>b.localeCompare(a)).forEach(([date,items])=>{items.forEach(p=>out.push({...p,date}));});return out;},[photoLog]);

  /* ─── Calendar days (relative to vDate) ─── */
  const calDays=useMemo(()=>{
    const days=[];
    for(let i=-14;i<=14;i++){
      const d=new Date(vDate);d.setDate(d.getDate()+i);
      const k=dk(d);
      const ch=checks[k]||{};
      const dayFocus=focusByDate[k]||[];
      const all=[...todos,...dayFocus];
      const done=all.length>0?all.filter(t=>ch[t.id]).length:0;
      const pct=all.length>0?Math.round(done/all.length*100):0;
      days.push({date:new Date(d),key:k,pct,isToday:k===dk(now),dayNum:d.getDate(),dayName:d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)});
    }
    return days;
  },[vDate,checks,todos,focusByDate]);
  useEffect(()=>{if(calRef.current)calRef.current.scrollLeft=14*56-100;},[vk]);

  /* ─── Achievement stats ─── */
  const achieveStats=useMemo(()=>{
    let perfectDays=0;
    const mornIds=morningT.map(t=>t.id);
    const nightIds=nightT.map(t=>t.id);
    let morningPerfect=0,nightPerfect=0;
    Object.entries(checks).forEach(([date,ch])=>{
      if(mornIds.length>0&&mornIds.every(id=>ch[id]))morningPerfect++;
      if(nightIds.length>0&&nightIds.every(id=>ch[id]))nightPerfect++;
      const dayFocus=focusByDate[date]||[];
      const all=[...todos,...dayFocus];
      if(all.length>0&&all.every(t=>ch[t.id]))perfectDays++;
    });
    const totalPhotos=Object.values(photoLog).flat().length;
    return{morningPerfect,nightPerfect,perfectDays,totalPhotos,lifetimeXP,longestStreak:longestS,groupCount:groups.length,photoStreak};
  },[checks,todos,focusByDate,photoLog,lifetimeXP,longestS,groups,photoStreak,morningT,nightT]);

  /* ─── Storage ─── */
  useEffect(()=>{try{const s=localStorage.getItem("dash-v17");if(s){const d=JSON.parse(s);if(d.todos)setTodos(d.todos);if(d.focusByDate)setFocusByDate(d.focusByDate);if(d.checks)setChecks(d.checks);if(d.photoLog)setPhotoLog(d.photoLog);if(d.wGoals)setWGoals(d.wGoals);if(d.mGoals)setMGoals(d.mGoals);if(d.wHist)setWHist(d.wHist);if(d.bwLog)setBwLog(d.bwLog);if(d.txns)setTxns(d.txns);if(d.groups)setGroups(d.groups);if(d.splits)setSplits(d.splits);if(d.settings)setSettings({...defSettings,...d.settings,features:{...defSettings.features,...(d.settings.features||{})}});if(d.purchased)setPurchased(d.purchased);if(d.spentXP)setSpentXP(d.spentXP);if(d.activeTitle)setActiveTitle(d.activeTitle);if(d.curWkState)setCurWkState(d.curWkState);}}catch(e){}},[]);
  // Save frequently (200ms debounce so typing in workout never loses data)
  useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem("dash-v17",JSON.stringify({todos,focusByDate,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,curWkState}));}catch(e){}},200);return()=>clearTimeout(t);},[todos,focusByDate,checks,photoLog,wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,purchased,spentXP,activeTitle,curWkState]);

  /* ─── Workout ─── */
  useEffect(()=>{
    if(gSplit&&(!curWkState||curWkState.split!==gSplit)){
      const exs=(splits[gSplit]||[]).map(name=>{
        const ls=[...wHist].reverse().find(h=>h.split===gSplit);
        const le=ls?.exercises?.find(e=>e.name===name);
        return{name,sets:Array.from({length:le?le.sets.length:3},(_,i)=>({w:le?.sets?.[i]?.w||0,r:le?.sets?.[i]?.r||0}))};
      });
      setCurWkState({split:gSplit,exercises:exs});
      setDoneEx({});
    }
  },[gSplit]);
  const uSet=(ei,si,f,v)=>setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;return n;});
  const aSet=ei=>setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});return n;});
  const rSet=ei=>setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();return n;});
  const saveWk=()=>{if(!curWkState)return;setWHist(p=>[...p,{id:uid(),date:dk(now),split:curWkState.split,exercises:curWkState.exercises}]);setConfetti(true);setTimeout(()=>{setConfetti(false);setCurWkState(p=>({...p,exercises:p.exercises.map(ex=>({name:ex.name,sets:ex.sets.map(()=>({w:0,r:0}))}))}));setDoneEx({});},2000);};
  const lastSess=useMemo(()=>gSplit?wHist.filter(h=>h.split===gSplit).sort((a,b)=>new Date(b.date)-new Date(a.date))[0]||null:null,[wHist,gSplit]);

  /* ─── Budget ─── */
  const bY=bMonth.getFullYear(),bM=bMonth.getMonth(),bDIM=new Date(bY,bM+1,0).getDate(),bFD=new Date(bY,bM,1).getDay(),bCM=bY===now.getFullYear()&&bM===now.getMonth();
  const bDK=d=>`${bY}-${String(bM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const bGT=d=>txns[bDK(d)]||[];const bGN=d=>bGT(d).reduce((a,t)=>a+(t.type==="in"?t.amount:-t.amount),0);
  const aTx=()=>{if(!txF.amount||!selDay)return;const k=bDK(selDay);setTxns(p=>({...p,[k]:[...(p[k]||[]),{id:uid(),type:txF.type,amount:parseFloat(txF.amount),desc:txF.desc||""}]}));setTxF({type:"out",amount:"",desc:""});};
  const rTx=(d,id)=>{const k=bDK(d);setTxns(p=>({...p,[k]:(p[k]||[]).filter(t=>t.id!==id)}));};
  const bTot=useMemo(()=>{let i=0,o=0;for(let d=1;d<=bDIM;d++)bGT(d).forEach(t=>{if(t.type==="in")i+=t.amount;else o+=t.amount;});return{i,o,net:i-o};},[txns,bY,bM,bDIM]);

  /* ─── Focus task CRUD (per-date) ─── */
  const addFocus=(t)=>setFocusByDate(p=>({...p,[vk]:[...(p[vk]||[]),t]}));
  const removeFocus=(id)=>setFocusByDate(p=>({...p,[vk]:(p[vk]||[]).filter(t=>t.id!==id)}));
  const updateFocus=(id,updates)=>setFocusByDate(p=>({...p,[vk]:(p[vk]||[]).map(t=>t.id===id?{...t,...updates}:t)}));

  const openEdit=(t,source)=>{setEditTask({task:t,source});setEditText(t.text);setEditDiff(t.diff);setEditGrp(t.grp||"morning");setEditProof(t.proof||false);};
  const saveEdit=()=>{
    if(!editTask||!editText.trim())return;
    const updates={text:editText.trim(),diff:editDiff,proof:editProof};
    if(editTask.source==="focus"){updateFocus(editTask.task.id,updates);}
    else{setTodos(p=>p.map(t=>t.id===editTask.task.id?{...t,...updates,grp:editGrp}:t));}
    setEditTask(null);
  };
  const deleteEditTask=()=>{
    if(!editTask)return;
    if(editTask.source==="focus"){removeFocus(editTask.task.id);}
    else{setTodos(p=>p.filter(t=>t.id!==editTask.task.id));}
    setEditTask(null);
  };

  const startAddForm=(target)=>{setAddForm(target);setFText("");setFDiff(target==="focus"?"hard":"easy");setFProof(false);setFGrp(target==="focus"?"morning":target);};
  const submitAddForm=()=>{
    if(!fText.trim())return;
    const task={id:uid(),text:fText.trim(),diff:fDiff,proof:fProof};
    if(addForm==="focus"){addFocus(task);}
    else{setTodos(p=>[...p,{...task,grp:fGrp}]);}
    setAddForm(null);setFText("");
  };

  const buyItem=item=>{if(totalXP<item.cost||purchased.includes(item.id))return;setPurchased(p=>[...p,item.id]);setSpentXP(p=>p+item.cost);};

  /* ─── Task Row ─── */
  const TRow=({t,big,onEdit,onDelete})=>{const on=dc[t.id];return(
    <div className="task-row" style={{position:"relative",display:"flex",alignItems:"center",gap:big?14:10,padding:big?"14px 16px":"11px 14px",marginBottom:big?8:6,borderRadius:big?14:12,background:on?C.greenMed:C.surfaceDim,border:on?`1px solid ${C.green}22`:"1px solid transparent"}}>
      <div onClick={()=>toggle(t)} style={{width:big?24:22,height:big?24:22,borderRadius:big?7:6,flexShrink:0,border:`2px solid ${on?C.greenBright:"rgba(0,0,0,0.18)"}`,background:on?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:big?12:11,fontWeight:800,cursor:"pointer",animation:on?"checkPop 0.3s ease":"none"}}>{on&&"✓"}</div>
      <span onClick={()=>toggle(t)} style={{flex:1,fontSize:big?14:13,fontWeight:big?600:500,textDecoration:on?"line-through":"none",color:on?C.textDim:C.text,cursor:"pointer"}}>{t.text}</span>
      {t.proof&&<span style={{fontSize:big?16:14,opacity:on?0.3:0.8}}>📷</span>}
      {F.xp&&<span style={{fontSize:big?11:10,fontWeight:700,color:DIFF[t.diff].color,opacity:0.7}}>{DIFF[t.diff].pts}xp</span>}
      {onEdit&&<button onClick={e=>{e.stopPropagation();onEdit();}} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:13,padding:"2px 6px",opacity:0.6}}>✎</button>}
      {onDelete&&<button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,opacity:0.4}}>×</button>}
      {xpPops[t.id]&&<div style={{position:"absolute",top:-4,right:16,fontSize:13,fontWeight:800,color:C.orange,animation:"xpFloat 0.9s ease forwards",pointerEvents:"none"}}>+{xpPops[t.id]}xp</div>}
    </div>);};

  const mainTabs=[{k:"today",l:"Today",i:Icons.today},{k:"groups",l:"Groups",i:Icons.groups},{k:"analytics",l:"Analytics",i:Icons.analytics},{k:"goals",l:"Goals",i:Icons.goals}];

  /* ═══ RENDER ═══ */
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:FN.b,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {confetti&&<div style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none",overflow:"hidden"}}>{Array.from({length:30}).map((_,i)=>{const l=Math.random()*100,d=Math.random()*2+1;const c=[C.green,C.goldBright,C.blue,C.orange,"#fff"][Math.floor(Math.random()*5)];return(<div key={i} style={{position:"absolute",left:`${l}%`,top:-10,width:7,height:7,borderRadius:"50%",background:c,animation:`xpFloat ${d}s ease-out forwards`}} />);})}</div>}

      <ProofModal open={!!proofTask} onClose={()=>setProofTask(null)} name={proofTask?.text||""} onDone={img=>{if(proofTask)proofDone(proofTask,img);}} />

      {/* ═══ STICKY HEADER ═══ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 6px"}}>
          <button className="press" onClick={()=>setShowMenu(!showMenu)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}><div style={{width:20,height:2,background:C.goldBright,borderRadius:1}} /><div style={{width:16,height:2,background:C.goldBright,borderRadius:1}} /><div style={{width:20,height:2,background:C.goldBright,borderRadius:1}} /></button>
          {/* PROGRESS title as button → Today */}
          <button className="press" onClick={()=>{setTab("today");setMenuTab(null);}} style={{background:"transparent",border:"none",cursor:"pointer",padding:0}}>
            <span style={{fontFamily:FN.h,fontSize:20,color:C.goldBright,letterSpacing:"0.08em"}}>PROGRESS</span>
          </button>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {F.store&&<button className="press" onClick={()=>setShowShop(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏪</button>}
            {F.achievements&&<button className="press" onClick={()=>setShowTitles(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,fontSize:16}}>🏅</button>}
            <button className="press" onClick={()=>setShowSettings(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4}}><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke={C.goldBright} strokeWidth="1.5"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke={C.goldBright} strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          </div>
        </div>

        {showMenu&&<div className="card-enter" style={{position:"absolute",left:12,top:52,background:C.surface,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",padding:4,zIndex:110,minWidth:140}}>
          <button className="press" onClick={()=>{setMenuTab("workout");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:8,color:C.text}}>💪 Workout</button>
          <button className="press" onClick={()=>{setMenuTab("budget");setTab(null);setShowMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:8,color:C.text}}>💰 Budget</button>
        </div>}

        {/* Level row — only if levels feature on */}
        {F.levels&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"0 20px 4px"}}>
          <span style={{fontSize:16}}>{rank.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span style={{fontSize:10,fontWeight:700,color:rank.color}}>{rank.name} · Lv.{level}</span>
            </div>
            <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${levelPct}%`,background:`linear-gradient(90deg,${rank.color},${C.goldBright})`,borderRadius:2,transition:"width 0.6s"}} /></div>
          </div>
          {F.xp&&<span style={{fontSize:10,fontWeight:700,color:C.goldBright,background:C.goldSoft,borderRadius:6,padding:"2px 8px"}}>{totalXP}</span>}
        </div>}

        {/* Calendar — % instead of XP, color gradient, click jumps */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px"}}>
          <div ref={calRef} className="hide-scroll" style={{display:"flex",gap:4,overflowX:"auto",flex:1,padding:"4px 0"}}>
            {calDays.map((d,i)=>{const sel=vk===d.key;return(
              <div key={i} onClick={()=>{setVDate(d.date);setTab("today");setMenuTab(null);}} style={{flex:"0 0 48px",textAlign:"center",padding:"6px 2px",borderRadius:10,cursor:"pointer",background:sel?C.goldBright:d.pct>0?pctBg(d.pct):"transparent",border:sel?"2px solid transparent":d.isToday?`2px solid ${C.goldBright}`:d.pct>0?`1px solid ${pctBorder(d.pct)}`:"2px solid transparent",transition:"all 0.2s ease"}}>
                <div style={{fontSize:9,fontWeight:600,color:sel?"#fff":C.textDim}}>{d.dayName}</div>
                <div style={{fontSize:14,fontWeight:sel?800:600,color:sel?"#fff":d.isToday?C.goldBright:C.text}}>{d.dayNum}</div>
                <div style={{fontSize:9,fontWeight:700,color:sel?"rgba(255,255,255,0.85)":d.pct>0?pC(d.pct):C.textDim,marginTop:1}}>{d.pct>0?`${d.pct}%`:"—"}</div>
              </div>
            );})}
          </div>
          <button className="press" onClick={()=>setShowFullCal(!showFullCal)} style={{background:showFullCal?C.goldSoft:C.surfaceDim,border:"none",borderRadius:10,padding:"6px 8px",cursor:"pointer",flexShrink:0}}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2.5" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.4"/><line x1="2" y1="7" x2="16" y2="7" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.2"/></svg></button>
        </div>
        {showFullCal&&<div className="card-enter" style={{...card,margin:"4px 12px 0",padding:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()-1,1))} style={btnG}>‹</button><span style={{fontSize:13,fontWeight:700}}>{vDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()+1,1))} style={btnG}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,color:C.textDim,fontWeight:600}}>{d}</div>)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth(),1).getDay()}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth()+1,0).getDate()}).map((_,i)=>(<div key={i+1} onClick={()=>{setVDate(new Date(vDate.getFullYear(),vDate.getMonth(),i+1));setShowFullCal(false);}} style={{textAlign:"center",padding:"4px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:vDate.getDate()===i+1?700:400,background:vDate.getDate()===i+1?C.goldBright:"transparent",color:vDate.getDate()===i+1?"#fff":C.text}}>{i+1}</div>))}</div>
        </div>}
      </div>

      {/* ═══ SCROLLABLE MIDDLE ═══ */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 20px 80px"}}>

        {/* ═══ TODAY TAB ═══ */}
        {tab==="today"&&<div className="tab-content">
          {/* Section 1: Banner (20%) */}
          <div style={{height:150,borderRadius:20,overflow:"hidden",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
            <BannerScene mode={todaySub==="morning"?"morning":todaySub==="allday"?"day":"evening"} />
          </div>

          {/* Section 2: Big tab selector */}
          <div style={{display:"flex",gap:8,marginBottom:18,padding:"4px",background:C.surface,borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            {[{k:"morning",l:"Morning",emoji:"☀️"},{k:"allday",l:"All Day",emoji:"🎯"},{k:"evening",l:"Evening",emoji:"🌙"}].map(s=>{const on=todaySub===s.k;return(
              <button key={s.k} onClick={()=>setTodaySub(s.k)} className="pill-btn" style={{flex:1,padding:"14px 8px",borderRadius:12,border:"none",cursor:"pointer",background:on?(s.k==="morning"?"linear-gradient(135deg,#FFB88A,#FFD27A)":s.k==="allday"?"linear-gradient(135deg,#4178C4,#3568B2)":"linear-gradient(135deg,#7B65B0,#4B3B6B)"):"transparent",color:on?"#fff":C.textSec,fontFamily:FN.b,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:on?"0 4px 12px rgba(0,0,0,0.15)":"none"}}>
                <span style={{fontSize:16}}>{s.emoji}</span>{s.l}
              </button>
            );})}
          </div>

          {/* Section 3: Tasks display — no card wrapper, just rows */}
          {todaySub==="morning"&&<div>
            {morningT.length===0&&<div style={{textAlign:"center",padding:20,color:C.textDim,fontSize:13}}>No morning tasks yet.</div>}
            {morningT.map(t=><TRow key={t.id} t={t} />)}
          </div>}

          {todaySub==="allday"&&<div>
            {focusTasks.length===0&&<div style={{textAlign:"center",padding:24,color:C.textDim,fontSize:13}}>No focus tasks for this day. Add them in Goals → Focus.</div>}
            {focusTasks.map(t=><TRow key={t.id} t={t} big />)}
          </div>}

          {todaySub==="evening"&&<div>
            {nightT.length===0&&<div style={{textAlign:"center",padding:20,color:C.textDim,fontSize:13}}>No evening tasks yet.</div>}
            {nightT.map(t=><TRow key={t.id} t={t} />)}
          </div>}

          {/* Small completion stat at bottom */}
          <div style={{marginTop:16,padding:"14px 18px",background:C.surface,borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Completion</div><div style={{fontSize:22,fontWeight:800,color:pC(todayCompletion.pct),marginTop:2}}>{todayCompletion.pct}%</div></div>
            <div style={{flex:1,margin:"0 16px",height:10,background:C.surfaceDim,borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:`${todayCompletion.pct}%`,background:gB(todayCompletion.pct),borderRadius:6,transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)"}} /></div>
            <div style={{fontSize:12,color:C.textDim,fontWeight:600}}>{todayCompletion.done}/{todayCompletion.total}</div>
          </div>
        </div>}

        {/* ═══ GROUPS ═══ (unchanged behavior) */}
        {tab==="groups"&&<div className="tab-content">
          {!selGrp&&!mkGrp&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontWeight:700,fontSize:16,margin:0}}>My Groups</h2><button className="press" onClick={()=>setMkGrp(true)} style={btnB}>+ New</button></div>
            {groups.map(g=>(
              <div key={g.id} onClick={()=>setSelGrp(g.id)} className="press" style={{...card,marginBottom:10,cursor:"pointer",background:"linear-gradient(135deg,rgba(224,122,58,0.08),rgba(224,122,58,0.02))",border:"1px solid rgba(224,122,58,0.12)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:700}}>{g.name}</div><div style={{fontSize:12,color:C.textDim,marginTop:2}}>{g.members.length} members</div></div><div style={{fontSize:24}}>→</div></div>
              </div>
            ))}
          </div>}
          {mkGrp&&<div><button className="press" onClick={()=>{setMkGrp(false);setNGrpName("");setNGrpTasks([]);}} style={{...btnG,marginBottom:14}}>← Back</button><div style={card}><div style={lbl}>Create Group</div><input value={nGrpName} onChange={e=>setNGrpName(e.target.value)} placeholder="Group name..." style={{...inp,marginBottom:14}} /><div style={{fontSize:12,fontWeight:600,color:C.textSec,marginBottom:8}}>Link proof tasks:</div>{[...todos,...focusTasks].filter(t=>t.proof).map(t=>(<div key={t.id} onClick={()=>setNGrpTasks(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:4,borderRadius:10,cursor:"pointer",background:nGrpTasks.includes(t.id)?C.blueMed:C.surfaceDim}}><div style={{width:18,height:18,borderRadius:5,border:`2px solid ${nGrpTasks.includes(t.id)?C.blue:"rgba(0,0,0,0.1)"}`,background:nGrpTasks.includes(t.id)?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800}}>{nGrpTasks.includes(t.id)&&"✓"}</div><span style={{fontSize:13,fontWeight:500,flex:1}}>{t.text}</span></div>))}<button className="press" onClick={()=>{if(!nGrpName.trim())return;setGroups(p=>[...p,{id:uid(),name:nGrpName.trim(),tasks:nGrpTasks,members:[{name:"You",av:"E"}],feed:[]}]);setNGrpName("");setNGrpTasks([]);setMkGrp(false);}} style={{...btnB,width:"100%",marginTop:14}}>Create</button></div></div>}
          {selGrp&&groups.find(x=>x.id===selGrp)&&<div>
            <button className="press" onClick={()=>setSelGrp(null)} style={{...btnG,marginBottom:14}}>← Back</button>
            <div style={{...card,marginBottom:14}}><div style={lbl}>Activity Feed</div>
              {(groups.find(x=>x.id===selGrp).feed||[]).length===0&&<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>Complete linked tasks to see activity</div>}
              {(groups.find(x=>x.id===selGrp).feed||[]).slice(0,20).map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}><div style={{width:28,height:28,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>E</div><div style={{flex:1}}><div><span style={{fontSize:12,fontWeight:600}}>{f.user}</span><span style={{fontSize:12,color:C.textDim}}> completed </span><span style={{fontSize:12,fontWeight:600,color:C.blue}}>{f.task}</span></div>{f.img&&<div style={{width:80,height:80,borderRadius:8,overflow:"hidden",marginTop:6}}><img src={f.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}</div></div>))}
            </div>
            <div style={card}><div style={lbl}>Members</div>{groups.find(x=>x.id===selGrp).members.map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{m.av}</div><span style={{fontSize:13,fontWeight:600,flex:1}}>{m.name}</span></div>))}</div>
          </div>}
        </div>}

        {/* ═══ ANALYTICS ═══ (simplified) */}
        {tab==="analytics"&&<div className="tab-content">
          {/* Top metric cards: Completion, Focus, Weekly */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{...card,padding:16,textAlign:"center",background:`linear-gradient(135deg,${C.greenSoft},${C.surface})`}}>
              <div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Completion Rate</div>
              <div style={{fontSize:30,fontWeight:800,color:pC(monthCompletionAvg)}}>{monthCompletionAvg}%</div>
              <div style={{fontSize:10,color:C.textDim,marginTop:2}}>this month, avg</div>
            </div>
            <div style={{...card,padding:16,textAlign:"center",background:`linear-gradient(135deg,${C.orangeSoft},${C.surface})`}}>
              <div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Focus Completion</div>
              <div style={{fontSize:30,fontWeight:800,color:pC(focusAvgPct)}}>{focusAvgPct}%</div>
              <div style={{fontSize:10,color:C.textDim,marginTop:2}}>avg focus tasks done</div>
            </div>
          </div>

          {/* Weekly Recap */}
          <div style={{...card,marginBottom:14,background:`linear-gradient(135deg,${C.goldSoft},${C.surface})`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700}}>Weekly Recap</span><span style={{fontSize:10,fontWeight:700,color:"#fff",background:weekLabelColor,borderRadius:6,padding:"2px 8px"}}>{weekLabel.toUpperCase()}</span></div>
              <button className="press" onClick={()=>setShowRecap(true)} style={{...btnG,fontSize:11}}>Full Report 📊</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{weekRecap.avg}%</div><div style={{fontSize:9,color:C.textDim}}>Avg</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.blue}}>{weekRecap.days}/7</div><div style={{fontSize:9,color:C.textDim}}>Active</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.green}}>{weekRecap.perf}</div><div style={{fontSize:9,color:C.textDim}}>Perfect</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.orange}}>{weekRecap.best}%</div><div style={{fontSize:9,color:C.textDim}}>Best</div></div>
            </div>
          </div>

          {/* Photo Progress — horizontal scroll like calendar */}
          <div style={{...card,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700}}>Photo Progress</div>
              <div style={{fontSize:11,color:C.textDim}}>📸 {allPhotos.length} · 🔥 {photoStreak}d</div>
            </div>
            {allPhotos.length===0?<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>No proof photos yet</div>:
            <div className="hide-scroll" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
              {allPhotos.map((p,i)=>(<div key={i} style={{flex:"0 0 88px",width:88}}>
                <div style={{width:88,height:88,borderRadius:12,overflow:"hidden",background:C.surfaceDim,position:"relative"}}>{p.img?<img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:28}}>📸</div>}</div>
                <div style={{fontSize:9,color:C.textDim,marginTop:4,textAlign:"center",fontWeight:600}}>{fd(p.date)}</div>
                <div style={{fontSize:8,color:C.textDim,textAlign:"center",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.taskName}</div>
              </div>))}
            </div>}
          </div>

          {/* Strong / Weak */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={card}>
              <div style={{...lbl,color:C.green,fontSize:12,display:"flex",alignItems:"center",gap:6}}>Strongest <span style={{fontSize:9,background:C.greenBright,color:"#fff",borderRadius:4,padding:"1px 6px"}}>GOOD</span></div>
              {sortedH.filter(h=>h.rate>=50).slice(0,5).map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",marginBottom:2,borderRadius:6,background:C.greenSoft}}><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:10,fontWeight:700,color:pC(h.rate)}}>{h.rate}%</span></div>))}
              {sortedH.filter(h=>h.rate>=50).length===0&&<div style={{fontSize:11,color:C.textDim,padding:8}}>Track to see</div>}
            </div>
            <div style={card}>
              <div style={{...lbl,color:C.red,fontSize:12,display:"flex",alignItems:"center",gap:6}}>Needs Work <span style={{fontSize:9,background:C.red,color:"#fff",borderRadius:4,padding:"1px 6px"}}>WEAK</span></div>
              {sortedH.filter(h=>h.rate<50).slice(-5).reverse().map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",marginBottom:2,borderRadius:6,background:C.redSoft}}><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:10,fontWeight:700,color:pC(h.rate)}}>{h.rate}%</span></div>))}
            </div>
          </div>
        </div>}

        {/* ═══ GOALS ═══ (date-specific focus + create weekly/monthly) */}
        {tab==="goals"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{[{k:"focus",l:"Focus"},{k:"daily",l:"Daily"},{k:"weekly",l:"Weekly"},{k:"monthly",l:"Monthly"}].map(t=>(<button key={t.k} onClick={()=>setGTab(t.k)} className="pill-btn" style={pill(gTab===t.k)}>{t.l}</button>))}</div>

          {/* ─── FOCUS (date-specific) ─── */}
          {gTab==="focus"&&<div style={card}>
            <div style={{...lbl,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>Focus Tasks — {fd(vDate)}</span>
              <span style={{fontSize:10,fontWeight:600,color:C.textDim,textTransform:"none"}}>Per-day. Editing won't affect other days.</span>
            </div>
            {focusTasks.length===0&&<div style={{textAlign:"center",padding:16,color:C.textDim,fontSize:12}}>No focus tasks for this date.</div>}
            {focusTasks.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",marginBottom:6,borderRadius:12,background:C.orangeSoft}}>
                <span style={{color:C.orange}}>★</span>
                <span style={{fontSize:13,fontWeight:600,flex:1}}>{t.text}</span>
                {t.proof&&<span style={{fontSize:13,opacity:0.7}}>📷</span>}
                <span style={{fontSize:9,fontWeight:700,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 6px"}}>{DIFF[t.diff].label}</span>
                <button className="press" onClick={()=>openEdit(t,"focus")} style={{...btnG,padding:"4px 8px",fontSize:10}}>✎</button>
                <button onClick={()=>removeFocus(t.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,opacity:0.4}}>×</button>
              </div>
            ))}
            {addForm==="focus"?
              <div style={{background:C.surfaceDim,borderRadius:12,padding:14,marginTop:8}}>
                <input value={fText} onChange={e=>setFText(e.target.value)} placeholder="Task name..." style={{...inp,marginBottom:10}} autoFocus onKeyDown={e=>{if(e.key==="Enter")submitAddForm();}} />
                <div style={{fontSize:10,fontWeight:700,color:C.textDim,marginBottom:6,textTransform:"uppercase"}}>Difficulty</div>
                <div style={{display:"flex",gap:4,marginBottom:10}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setFDiff(d)} style={{...pill(fDiff===d,DIFF[d].color),flex:1,fontSize:11}}>{DIFF[d].label}</button>))}</div>
                <div style={{fontSize:10,fontWeight:700,color:C.textDim,marginBottom:6,textTransform:"uppercase"}}>Photo Proof</div>
                <div style={{display:"flex",gap:4,marginBottom:12}}><button onClick={()=>setFProof(false)} style={{...pill(!fProof),flex:1,fontSize:11}}>📷 No</button><button onClick={()=>setFProof(true)} style={{...pill(fProof,C.blue),flex:1,fontSize:11}}>📸 Yes</button></div>
                <div style={{display:"flex",gap:8}}><button onClick={submitAddForm} style={{...btnB,flex:1}}>Add to {fd(vDate)}</button><button onClick={()=>setAddForm(null)} style={btnG}>Cancel</button></div>
              </div>
              :<button onClick={()=>startAddForm("focus")} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:12,padding:12,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8}}>+ Add Focus Task for this day</button>
            }
          </div>}

          {/* ─── DAILY (recurring) ─── */}
          {gTab==="daily"&&<div>{["morning","night","general"].map(grp=>{const items=todos.filter(t=>t.grp===grp);return(
            <div key={grp} style={{...card,marginBottom:12}}>
              <div style={{...lbl,textTransform:"capitalize"}}>{grp} Tasks</div>
              {items.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}>
                  <span style={{fontSize:13,fontWeight:500,flex:1}}>{t.text}</span>
                  {t.proof&&<span style={{fontSize:13,opacity:0.7}}>📷</span>}
                  <span style={{fontSize:9,fontWeight:700,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 6px"}}>{DIFF[t.diff].label}</span>
                  <button className="press" onClick={()=>openEdit(t,"todos")} style={{...btnG,padding:"4px 6px",fontSize:10}}>✎</button>
                  <button onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:15,opacity:0.4}}>×</button>
                </div>
              ))}
              {addForm===grp?
                <div style={{background:C.surfaceDim,borderRadius:12,padding:14,marginTop:6}}>
                  <input value={fText} onChange={e=>setFText(e.target.value)} placeholder="Task name..." style={{...inp,marginBottom:10}} autoFocus onKeyDown={e=>{if(e.key==="Enter")submitAddForm();}} />
                  <div style={{fontSize:10,fontWeight:700,color:C.textDim,marginBottom:6,textTransform:"uppercase"}}>Difficulty</div>
                  <div style={{display:"flex",gap:4,marginBottom:10}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setFDiff(d)} style={{...pill(fDiff===d,DIFF[d].color),flex:1,fontSize:11}}>{DIFF[d].label}</button>))}</div>
                  <div style={{fontSize:10,fontWeight:700,color:C.textDim,marginBottom:6,textTransform:"uppercase"}}>Group</div>
                  <div style={{display:"flex",gap:4,marginBottom:10}}>{["morning","night","general"].map(g=>(<button key={g} onClick={()=>setFGrp(g)} style={{...pill(fGrp===g),flex:1,fontSize:11,textTransform:"capitalize"}}>{g}</button>))}</div>
                  <div style={{fontSize:10,fontWeight:700,color:C.textDim,marginBottom:6,textTransform:"uppercase"}}>Photo Proof</div>
                  <div style={{display:"flex",gap:4,marginBottom:12}}><button onClick={()=>setFProof(false)} style={{...pill(!fProof),flex:1,fontSize:11}}>📷 No</button><button onClick={()=>setFProof(true)} style={{...pill(fProof,C.blue),flex:1,fontSize:11}}>📸 Yes</button></div>
                  <div style={{display:"flex",gap:8}}><button onClick={submitAddForm} style={{...btnB,flex:1}}>Add</button><button onClick={()=>setAddForm(null)} style={btnG}>Cancel</button></div>
                </div>
                :<button onClick={()=>startAddForm(grp)} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:10,padding:10,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:6}}>+ Add {grp} task</button>
              }
            </div>
          );})}</div>}

          {/* ─── WEEKLY (with create) ─── */}
          {gTab==="weekly"&&<div style={card}>
            <div style={lbl}>Weekly Goals</div>
            {wGoals.map(g=>(
              <div key={g.id} style={{padding:"10px 14px",marginBottom:6,borderRadius:10,background:C.surfaceDim}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600}}>{g.text}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button onClick={()=>setWGoals(p=>p.map(x=>x.id===g.id?{...x,current:Math.max(0,(x.current||0)-1)}:x))} style={{...btnG,padding:"2px 8px",fontSize:12}}>−</button>
                    <span style={{fontSize:12,fontWeight:700,color:pC((g.current||0)/g.target*100),minWidth:38,textAlign:"center"}}>{g.current||0}/{g.target}</span>
                    <button onClick={()=>setWGoals(p=>p.map(x=>x.id===g.id?{...x,current:(x.current||0)+1}:x))} style={{...btnG,padding:"2px 8px",fontSize:12}}>+</button>
                    <button onClick={()=>setWGoals(p=>p.filter(x=>x.id!==g.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:15,opacity:0.4}}>×</button>
                  </div>
                </div>
                <div style={{height:5,background:"rgba(0,0,0,0.04)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((g.current||0)/g.target*100,100)}%`,background:gB((g.current||0)/g.target*100),borderRadius:3}} /></div>
              </div>
            ))}
            {addWGoal?
              <div style={{background:C.surfaceDim,borderRadius:12,padding:14,marginTop:8}}>
                <input value={nwText} onChange={e=>setNwText(e.target.value)} placeholder="Goal name..." style={{...inp,marginBottom:8}} autoFocus />
                <input type="number" value={nwTarget} onChange={e=>setNwTarget(e.target.value)} placeholder="Target (e.g. 4)" style={{...inp,marginBottom:10}} />
                <div style={{display:"flex",gap:8}}><button onClick={()=>{const t=parseInt(nwTarget);if(!nwText.trim()||!t)return;setWGoals(p=>[...p,{id:uid(),text:nwText.trim(),target:t,current:0}]);setNwText("");setNwTarget("");setAddWGoal(false);}} style={{...btnB,flex:1}}>Create</button><button onClick={()=>setAddWGoal(false)} style={btnG}>Cancel</button></div>
              </div>
              :<button onClick={()=>setAddWGoal(true)} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:10,padding:10,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8}}>+ Create Weekly Goal</button>
            }
          </div>}

          {/* ─── MONTHLY (with create) ─── */}
          {gTab==="monthly"&&<div style={card}>
            <div style={lbl}>Monthly Goals</div>
            {mGoals.map((g,i)=>{const pct=g.done?100:0;return(
              <div key={i} onClick={()=>setMGoals(p=>p.map((x,j)=>j===i?{...x,done:!x.done}:x))} style={{padding:"10px 14px",marginBottom:6,borderRadius:10,cursor:"pointer",background:pct>=100?C.goldSoft:C.surfaceDim,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${g.done?C.goldBright:"rgba(0,0,0,0.15)"}`,background:g.done?C.goldBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800}}>{g.done&&"✓"}</div>
                <span style={{fontSize:13,fontWeight:600,flex:1,textDecoration:g.done?"line-through":"none",color:g.done?C.textDim:C.text}}>{g.text}</span>
                <button onClick={e=>{e.stopPropagation();setMGoals(p=>p.filter((_,j)=>j!==i));}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:15,opacity:0.4}}>×</button>
              </div>
            );})}
            {addMGoal?
              <div style={{background:C.surfaceDim,borderRadius:12,padding:14,marginTop:8}}>
                <input value={nmText} onChange={e=>setNmText(e.target.value)} placeholder="Goal name..." style={{...inp,marginBottom:10}} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&nmText.trim()){setMGoals(p=>[...p,{id:uid(),text:nmText.trim(),type:"check",done:false}]);setNmText("");setAddMGoal(false);}}} />
                <div style={{display:"flex",gap:8}}><button onClick={()=>{if(!nmText.trim())return;setMGoals(p=>[...p,{id:uid(),text:nmText.trim(),type:"check",done:false}]);setNmText("");setAddMGoal(false);}} style={{...btnB,flex:1}}>Create</button><button onClick={()=>setAddMGoal(false)} style={btnG}>Cancel</button></div>
              </div>
              :<button onClick={()=>setAddMGoal(true)} style={{width:"100%",background:C.surfaceDim,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:10,padding:10,color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8}}>+ Create Monthly Goal</button>
            }
          </div>}
        </div>}

        {/* ═══ WORKOUT ═══ */}
        {menuTab==="workout"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"log",l:"Log"},{k:"progress",l:"Progress"},{k:"bodyweight",l:"Weight"}].map(v=>(<button key={v.k} onClick={()=>{setGView(v.k);if(v.k!=="log")setGSplit(null);}} className="pill-btn" style={pill(gView===v.k)}>{v.l}</button>))}</div>
          {gView==="log"&&!gSplit&&<div><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(splits).map(([key,exL])=>(<div key={key} style={{...card,padding:"14px 20px",display:"flex",alignItems:"center",gap:14}}><button className="press" onClick={()=>setGSplit(key)} style={{flex:1,display:"flex",alignItems:"center",gap:14,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}><div style={{width:44,height:44,borderRadius:12,background:`${spClr[key]||C.blue}10`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:800,color:spClr[key]||C.blue,textTransform:"uppercase"}}>{key[0]}</span></div><div><div style={{fontSize:14,fontWeight:700,color:spClr[key]||C.blue,textTransform:"uppercase"}}>{key}</div><div style={{fontSize:11,color:C.textDim}}>{exL.length} ex</div></div></button><button className="press" onClick={()=>setSplits(p=>{const n={...p};delete n[key];return n;})} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.35}}>×</button></div>))}</div>{!addSplit?<button onClick={()=>setAddSplit(true)} style={{...btnB,width:"100%",marginTop:12,fontSize:12}}>+ Add Split</button>:<div style={{...card,marginTop:12}}><input value={nSpName} onChange={e=>setNSpName(e.target.value)} placeholder="Split name" style={{...inp,marginBottom:8}} /><input value={nSpEx} onChange={e=>setNSpEx(e.target.value)} placeholder="Exercises (comma sep)" style={{...inp,marginBottom:10}} /><div style={{display:"flex",gap:8}}><button onClick={()=>{if(!nSpName.trim())return;setSplits(p=>({...p,[nSpName.trim().toLowerCase()]:nSpEx.split(",").map(e=>e.trim()).filter(Boolean)}));setNSpName("");setNSpEx("");setAddSplit(false);}} style={{...btnB,flex:1}}>Add</button><button onClick={()=>setAddSplit(false)} style={btnG}>Cancel</button></div></div>}</div>}
          {gView==="log"&&gSplit&&curWkState&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><button onClick={()=>setGSplit(null)} style={btnG}>←</button><span style={{fontSize:15,fontWeight:800,color:spClr[gSplit]||C.blue,textTransform:"uppercase"}}>{gSplit}</span><span style={{fontSize:9,color:C.green,marginLeft:6}}>● auto-saving</span><button className="press" onClick={()=>{const n=prompt("Exercise name:");if(n&&n.trim()){setSplits(p=>({...p,[gSplit]:[...(p[gSplit]||[]),n.trim()]}));setCurWkState(p=>({...p,exercises:[...p.exercises,{name:n.trim(),sets:[{w:0,r:0},{w:0,r:0},{w:0,r:0}]}]}));}}} style={{...btnG,fontSize:10,marginLeft:"auto"}}>+ Ex</button></div>{curWkState.exercises.map((ex,ei)=>{const lE=lastSess?.exercises?.find(e=>e.name===ex.name);const dn=doneEx[ei];return(<div key={ei} style={{...card,marginBottom:10,background:dn?C.greenSoft:C.surface}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:dn?C.green:C.text}}>{dn&&"✓ "}{ex.name}</span><div style={{display:"flex",gap:3}}><button onClick={()=>setDoneEx(p=>({...p,[ei]:!p[ei]}))} style={{...pill(dn,C.green),padding:"3px 8px",fontSize:10}}>Done</button><button onClick={()=>rSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>−</button><button onClick={()=>aSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>+</button><button onClick={()=>{setSplits(p=>({...p,[gSplit]:(p[gSplit]||[]).filter(e=>e!==ex.name)}));setCurWkState(p=>({...p,exercises:p.exercises.filter((_,i)=>i!==ei)}));}} style={{...btnG,padding:"3px 6px",fontSize:11,color:C.red}}>✕</button></div></div>{ex.sets.map((s,si)=>{const ls=lE?.sets?.[si];const wd=ls?s.w-ls.w:null;return(<div key={si} style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr 56px",gap:5,marginBottom:3,alignItems:"center"}}><span style={{fontSize:10,color:spClr[gSplit]||C.blue,fontWeight:700}}>S{si+1}</span><input type="number" value={s.w||""} onChange={e=>uSet(ei,si,"w",e.target.value)} placeholder="kg" style={numI} /><input type="number" value={s.r||""} onChange={e=>uSet(ei,si,"r",e.target.value)} placeholder="reps" style={numI} /><span style={{fontSize:9,textAlign:"center",fontWeight:600,color:ls?(wd>0?C.greenBright:wd<0?C.red:C.textDim):C.textDim}}>{ls?`${ls.w}×${ls.r}`:"—"}</span></div>);})}</div>);})}<button className="press" onClick={saveWk} style={{width:"100%",background:spClr[gSplit]||C.blue,border:"none",borderRadius:12,padding:"14px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Save ✓</button></div>}
          {gView==="progress"&&<div style={card}><div style={lbl}>History</div>{wHist.slice().reverse().map(w=>(<div key={w.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:4,borderRadius:10,background:C.surfaceDim}}><div style={{width:8,height:8,borderRadius:"50%",background:spClr[w.split]||C.blue}} /><span style={{fontSize:12,fontWeight:600,color:spClr[w.split]||C.blue,textTransform:"uppercase",width:50}}>{w.split}</span><span style={{fontSize:12,color:C.textDim}}>{fd(w.date)}</span><span style={{marginLeft:"auto",fontSize:11,color:C.textDim}}>{w.exercises.length} ex</span><button onClick={()=>setWHist(p=>p.filter(x=>x.id!==w.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.4}}>×</button></div>))}</div>}
          {gView==="bodyweight"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>{[{l:"Current",v:`${bwLog.length>0?bwLog[bwLog.length-1].weight:0}kg`,c:C.text},{l:"Start",v:`${bwLog.length>0?bwLog[0].weight:0}kg`,c:C.textDim},{l:"Change",v:`${bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0"}kg`,c:parseFloat(bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0")>0?C.greenBright:C.red}].map((s,i)=>(<div key={i} style={{...card,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{s.l}</div><div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div></div>))}</div><div style={{...card,marginBottom:12}}><div style={lbl}>Weight Over Time</div><ResponsiveContainer width="100%" height={140}><LineChart data={bwLog.map(e=>({date:fd(e.date),weight:e.weight}))}><CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false} /><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} /><YAxis domain={["dataMin-1","dataMax+1"]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32} /><Tooltip content={<Tip />} /><Line type="monotone" dataKey="weight" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:3,stroke:"#fff",strokeWidth:2}} name="kg" /></LineChart></ResponsiveContainer></div><div style={card}><div style={lbl}>Log</div><div style={{display:"flex",gap:8}}><input type="number" step="0.1" value={nBW} onChange={e=>setNBW(e.target.value)} placeholder="kg" style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==="Enter"){const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}}} /><button onClick={()=>{const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}} style={btnB}>Log</button></div></div></div>}
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
          <div style={{...card,marginTop:12}}><div style={lbl}>Breakdown</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:30}}><ResponsiveContainer width={180} height={180}><PieChart><Pie data={[{name:"Income",value:Math.max(bTot.i,0.01)},{name:"Expenses",value:Math.max(bTot.o,0.01)}]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<Tip />} /></PieChart></ResponsiveContainer><div>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red}].map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:3,background:s.c}} /><div><div style={{fontSize:11,color:C.textDim}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div></div>))}</div></div></div>
        </div>}
      </div>

      {/* ═══ BOTTOM TAB BAR with icons ═══ */}
      <div style={{position:"sticky",bottom:0,zIndex:100,background:C.surface,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)",display:"flex",padding:"8px 10px",gap:4}}>
        {mainTabs.map(t=>{const on=tab===t.k&&!menuTab;return(
          <button key={t.k} onClick={()=>{setTab(t.k);setMenuTab(null);}} className="press" style={{flex:1,border:"none",borderRadius:14,padding:"10px 0",cursor:"pointer",textAlign:"center",background:on?C.blue:"transparent",color:on?"#fff":C.textDim,fontSize:11,fontFamily:FN.b,fontWeight:on?700:500,transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{t.i}</span>
            <span>{t.l}</span>
          </button>
        );})}
      </div>

      {/* ═══ SETTINGS (with feature toggles) ═══ */}
      <Overlay open={showSettings} onClose={()=>setShowSettings(false)} title="Settings">
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Feature Toggles</div>
          <div style={{fontSize:11,color:C.textDim,marginBottom:12}}>Enable advanced gamification features.</div>
          {[
            {k:"xp",l:"XP System",d:"Earn XP per task, see xp on rows"},
            {k:"levels",l:"Levels & Ranks",d:"Level bar + rank badge in header"},
            {k:"store",l:"XP Shop",d:"Spend XP on cosmetics & power-ups"},
            {k:"achievements",l:"Achievements",d:"Unlock titles from milestones"},
            {k:"dailyChallenges",l:"Daily Challenges",d:"Random daily challenge card"},
          ].map(f=>(
            <div key={f.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{f.l}</div><div style={{fontSize:10,color:C.textDim,marginTop:2}}>{f.d}</div></div>
              <button onClick={()=>setSettings(p=>({...p,features:{...p.features,[f.k]:!p.features[f.k]}}))} style={{...pill(F[f.k],C.green),padding:"6px 20px"}}>{F[f.k]?"ON":"OFF"}</button>
            </div>
          ))}
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Time Ranges</div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Morning Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.morningStart} onChange={e=>setSettings(p=>({...p,morningStart:parseInt(e.target.value)||5}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.morningEnd} onChange={e=>setSettings(p=>({...p,morningEnd:parseInt(e.target.value)||12}))} style={{...numI,width:60}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Night Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.nightStart} onChange={e=>setSettings(p=>({...p,nightStart:parseInt(e.target.value)||18}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.nightEnd} onChange={e=>setSettings(p=>({...p,nightEnd:parseInt(e.target.value)||23}))} style={{...numI,width:60}} /></div></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Notifications</span><button onClick={()=>setSettings(p=>({...p,notifs:!p.notifs}))} style={{...pill(settings.notifs,C.green),padding:"6px 20px"}}>{settings.notifs?"ON":"OFF"}</button></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${C.surfaceDim}`}}><span style={{fontSize:13,fontWeight:600}}>Vibrations</span><button onClick={()=>setSettings(p=>({...p,vibrate:!p.vibrate}))} style={{...pill(settings.vibrate,C.green),padding:"6px 20px"}}>{settings.vibrate?"ON":"OFF"}</button></div>

        {F.achievements&&<div style={{marginTop:16,padding:"14px",background:C.goldSoft,borderRadius:12}}><button onClick={()=>{setShowSettings(false);setShowTitles(true);}} style={{...btnB,width:"100%",background:C.goldBright,color:"#1A1D2E"}}>🏅 View Achievements</button></div>}
        {F.store&&<div style={{marginTop:10,padding:"14px",background:C.blueSoft,borderRadius:12}}><button onClick={()=>{setShowSettings(false);setShowShop(true);}} style={{...btnB,width:"100%"}}>🏪 Open Shop</button></div>}
      </Overlay>

      {/* Shop (only if toggled on) */}
      <Overlay open={showShop} onClose={()=>setShowShop(false)} title="XP Shop" wide>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"12px 16px",background:C.goldSoft,borderRadius:12}}><span style={{fontSize:20}}>{rank.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{rank.name} · Level {level}</div></div><div style={{fontSize:18,fontWeight:800,color:C.goldBright}}>{totalXP} XP</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{SHOP_ITEMS.map(item=>{const owned=purchased.includes(item.id);const can=totalXP>=item.cost&&!owned;return(<div key={item.id} style={{...card,padding:14,textAlign:"center",opacity:owned?0.6:1}}><div style={{fontSize:28,marginBottom:6}}>{item.icon}</div><div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{item.name}</div><div style={{fontSize:10,color:C.textDim,marginBottom:8,minHeight:24}}>{item.desc}</div>{owned?<div style={{fontSize:11,fontWeight:700,color:C.green}}>✓ Owned</div>:<button className="press" onClick={()=>buyItem(item)} style={{...btnB,width:"100%",padding:"8px 0",fontSize:11,opacity:can?1:0.4,background:can?C.blue:C.textDim,cursor:can?"pointer":"default"}}>{item.cost} XP</button>}</div>);})}</div>
      </Overlay>

      {/* Titles */}
      <Overlay open={showTitles} onClose={()=>setShowTitles(false)} title="Achievements">
        <div style={{fontSize:12,color:C.textDim,marginBottom:16}}>Earn titles through achievements.</div>
        {ACHIEVEMENTS.map(a=>{const unlocked=a.check(achieveStats);return(<div key={a.id} onClick={unlocked?()=>setActiveTitle(activeTitle===a.id?null:a.id):undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:12,background:activeTitle===a.id?C.goldSoft:unlocked?C.greenSoft:C.surfaceDim,cursor:unlocked?"pointer":"default",opacity:unlocked?1:0.5}}>
          <span style={{fontSize:24}}>{a.icon}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{a.title}</div><div style={{fontSize:11,color:C.textDim}}>{a.desc}</div></div>
          {unlocked?<span style={{fontSize:11,fontWeight:700,color:activeTitle===a.id?C.goldBright:C.green}}>{activeTitle===a.id?"ACTIVE":"✓"}</span>:<span style={{fontSize:10,color:C.textDim}}>🔒</span>}
        </div>);})}
      </Overlay>

      {/* Edit Task */}
      <Overlay open={!!editTask} onClose={()=>setEditTask(null)} title={`Edit ${editTask?.source==="focus"?"Focus":"Task"}`}>
        {editTask?.source==="focus"&&<div style={{fontSize:11,color:C.textDim,marginBottom:12,padding:"8px 12px",background:C.orangeSoft,borderRadius:8}}>⚠️ Editing only affects {fd(vDate)} — other days are independent.</div>}
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Name</div><input value={editText} onChange={e=>setEditText(e.target.value)} style={{...inp,fontSize:15}} /></div>
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Difficulty</div><div style={{display:"flex",gap:4}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setEditDiff(d)} style={{...pill(editDiff===d,DIFF[d].color),flex:1}}>{DIFF[d].label}</button>))}</div></div>
        {editTask?.source!=="focus"&&<div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Group</div><div style={{display:"flex",gap:4}}>{["morning","night","general"].map(g=>(<button key={g} onClick={()=>setEditGrp(g)} style={{...pill(editGrp===g),flex:1,textTransform:"capitalize"}}>{g}</button>))}</div></div>}
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Photo Proof</div><div style={{display:"flex",gap:4}}><button onClick={()=>setEditProof(false)} style={{...pill(!editProof),flex:1}}>📷 No</button><button onClick={()=>setEditProof(true)} style={{...pill(editProof,C.blue),flex:1}}>📸 Yes</button></div></div>
        <div style={{display:"flex",gap:8}}><button className="press" onClick={saveEdit} style={{...btnB,flex:1,background:C.green}}>Save</button><button onClick={deleteEditTask} style={{...btnG,color:C.red}}>Delete</button></div>
      </Overlay>

      {/* Weekly Recap — with chart */}
      <Overlay open={showRecap} onClose={()=>setShowRecap(false)} title="Full Report" wide>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>📊</div><div style={{fontSize:26,fontWeight:800,color:pC(weekRecap.avg)}}>{weekRecap.avg}%</div><div style={{fontSize:12,color:C.textDim}}>avg completion this week</div></div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textDim,marginBottom:8}}>Last 7 Days</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekRecap.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false} />
              <XAxis dataKey="day" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]} width={30} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="pct" name="Completion %" radius={[6,6,0,0]}>{weekRecap.daily.map((d,i)=>(<Cell key={i} fill={pC(d.pct)} />))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textDim,marginBottom:8}}>30-Day Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={fullReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false} />
              <XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]} width={30} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="completion" name="Completion" stroke={C.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="focus" name="Focus" stroke={C.orange} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.blue}}>{weekRecap.days}</div><div style={{fontSize:11,color:C.textDim}}>Days Active</div></div>
          <div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.green}}>{weekRecap.perf}</div><div style={{fontSize:11,color:C.textDim}}>Perfect Days</div></div>
          <div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.orange}}>{weekRecap.best}%</div><div style={{fontSize:11,color:C.textDim}}>Best Day</div></div>
          <div style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:weekLabelColor}}>{weekLabel}</div><div style={{fontSize:11,color:C.textDim}}>Overall</div></div>
        </div>
      </Overlay>
    </div>
  );
}
