import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts";

/* ═══ TOKENS ═══ */
// Two palettes: DARK (navy editorial) and LIGHT (warm paper editorial). Both keep the same
// amber accent identity. Light mode uses warm paper background so Fraunces italic feels at home.
const DARK={
  bg:"#131A2B",surface:"#1C2438",surfaceDim:"#161D30",surfaceHi:"#2A334A",
  text:"#F8F5EC",textSec:"#D4DCE8",textDim:"#7D8699",
  hairline:"rgba(248,245,236,0.10)",
  accent:"#F59E0B",accentBright:"#FBBF24",accentSoft:"rgba(245,158,11,0.12)",accentMed:"rgba(245,158,11,0.22)",
  green:"#34D399",greenSoft:"rgba(52,211,153,0.12)",greenMed:"rgba(52,211,153,0.20)",greenBright:"#34D399",
  red:"#F87171",redSoft:"rgba(248,113,113,0.12)",
  blue:"#F59E0B",blueLight:"#FBBF24",blueSoft:"rgba(245,158,11,0.12)",blueMed:"rgba(245,158,11,0.20)",
  gold:"#F59E0B",goldBright:"#FBBF24",goldSoft:"rgba(245,158,11,0.12)",goldMed:"rgba(245,158,11,0.20)",
  orange:"#F59E0B",orangeSoft:"rgba(245,158,11,0.12)",
  purple:"#7D8699",purpleSoft:"rgba(125,134,153,0.12)",
  btnText:"#0B1120", // text on accent buttons
  shadow:"0 1px 0 rgba(255,255,255,0.03) inset",
  modalShadow:"0 8px 24px rgba(0,0,0,0.4)",
  mode:"dark"
};
const LIGHT={
  bg:"#FBF9F5",surface:"#FFFFFF",surfaceDim:"#F3EFE6",surfaceHi:"#E9E3D6",
  text:"#16203A",textSec:"#45506A",textDim:"#8C8A86",
  hairline:"rgba(22,32,58,0.09)",
  accent:"#0AA063",accentBright:"#12C57E",accentSoft:"rgba(16,185,129,0.13)",accentMed:"rgba(16,185,129,0.22)",
  green:"#0AA063",greenSoft:"rgba(16,185,129,0.13)",greenMed:"rgba(16,185,129,0.22)",greenBright:"#12C57E",
  red:"#E5484D",redSoft:"rgba(229,72,77,0.11)",
  blue:"#E0820A",blueLight:"#F59E0B",blueSoft:"rgba(224,130,10,0.12)",blueMed:"rgba(224,130,10,0.22)",
  gold:"#E0820A",goldBright:"#F0960C",goldSoft:"rgba(224,130,10,0.12)",goldMed:"rgba(224,130,10,0.22)",
  orange:"#E0820A",orangeSoft:"rgba(224,130,10,0.12)",
  purple:"#8C8A86",purpleSoft:"rgba(140,138,134,0.12)",
  btnText:"#FFFFFF", // text on accent (green) buttons in light mode
  shadow:"0 1px 3px rgba(22,32,58,0.07), 0 6px 18px rgba(22,32,58,0.05)",
  modalShadow:"0 14px 44px rgba(22,32,58,0.16)",
  mode:"light"
};
// `C` is the *active* palette. Mutable reference — updated by the component when theme toggles.
// Module-level so legacy code keeps working, but React re-renders will see the swap because
// the component re-derives its own snapshot on each render.
let C=DARK;
let DIFF={easy:{pts:1,label:"Easy",color:C.green,bg:C.greenSoft},medium:{pts:3,label:"Med",color:C.blue,bg:C.blueSoft},hard:{pts:6,label:"Hard",color:C.orange,bg:C.orangeSoft}};
const FN={h:"'Fraunces',serif",b:"'Inter',sans-serif",m:"'JetBrains Mono',monospace"};
let pC=p=>p>=80?C.greenBright:p>=60?C.green:p>=40?C.gold:p>=20?C.orange:C.red;
let gB=p=>p>=80?`linear-gradient(90deg,${C.green},${C.greenBright})`:p>=50?`linear-gradient(90deg,${C.blue},${C.green})`:p>=25?`linear-gradient(90deg,${C.gold},${C.blue})`:`linear-gradient(90deg,${C.red},${C.gold})`;
// Completion % → background tint. Recomputed on theme swap because dark/light want different saturations.
let pctBg=p=>{if(p<=0)return "transparent";const isLight=C.mode==="light";const r=Math.round(248+(52-248)*(p/100));const g=Math.round(113+(211-113)*(p/100));const b=Math.round(113+(153-113)*(p/100));return `rgba(${r},${g},${b},${isLight?0.12:0.18})`;};
let pctBorder=p=>{if(p<=0)return "transparent";const r=Math.round(248+(52-248)*(p/100));const g=Math.round(113+(211-113)*(p/100));const b=Math.round(113+(153-113)*(p/100));return `rgba(${r},${g},${b},0.55)`;};
const dk=d=>{const t=typeof d==="string"?new Date(d):d;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;};
const fd=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const uid=()=>`_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

let card={background:C.surface,borderRadius:14,padding:20,border:`1px solid ${C.hairline}`,boxShadow:C.shadow};
let lbl={fontFamily:FN.b,fontSize:11,fontWeight:600,color:C.textDim,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.08em"};
let inp={background:C.surfaceDim,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"11px 14px",color:C.text,fontSize:13,fontFamily:FN.b,fontWeight:500,outline:"none",width:"100%"};
let numI={...inp,textAlign:"center",fontFamily:FN.m,fontWeight:600};
let btnB={background:C.accent,border:"none",borderRadius:8,padding:"11px 20px",color:C.btnText,fontSize:12,fontFamily:FN.b,fontWeight:700,cursor:"pointer",transition:"all 0.15s ease",letterSpacing:"0.02em",textTransform:"uppercase"};
let btnG={background:C.surfaceHi,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"9px 16px",color:C.textSec,fontSize:11,fontFamily:FN.b,fontWeight:600,cursor:"pointer",transition:"all 0.15s ease",textTransform:"uppercase",letterSpacing:"0.04em"};
let pill=(on,clr)=>({background:on?(clr||C.accent):C.surfaceHi,border:`1px solid ${on?"transparent":C.hairline}`,borderRadius:6,padding:"6px 14px",color:on?C.btnText:C.textDim,fontSize:11,fontFamily:FN.b,fontWeight:700,cursor:"pointer",transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",textTransform:"uppercase",letterSpacing:"0.04em"});

let Tip=({active,payload,label:lb})=>{if(!active||!payload?.length)return null;return(<div style={{background:C.surface,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"8px 14px",fontSize:11,fontFamily:FN.m,boxShadow:C.modalShadow}}><div style={{color:C.textDim,marginBottom:3}}>{lb}</div>{payload.map((p,i)=>(<div key={i} style={{color:p.color||C.text,fontWeight:600}}>{p.name}: {typeof p.value==="number"?Math.round(p.value*10)/10:p.value}</div>))}</div>);};

// Rebind all theme-derived helpers when the palette swaps. Called by the component's theme effect.
function applyTheme(palette){
  C=palette;
  DIFF={easy:{pts:1,label:"Easy",color:C.green,bg:C.greenSoft},medium:{pts:3,label:"Med",color:C.blue,bg:C.blueSoft},hard:{pts:6,label:"Hard",color:C.orange,bg:C.orangeSoft}};
  pC=p=>p>=80?C.greenBright:p>=60?C.green:p>=40?C.gold:p>=20?C.orange:C.red;
  gB=p=>p>=80?`linear-gradient(90deg,${C.green},${C.greenBright})`:p>=50?`linear-gradient(90deg,${C.blue},${C.green})`:p>=25?`linear-gradient(90deg,${C.gold},${C.blue})`:`linear-gradient(90deg,${C.red},${C.gold})`;
  pctBg=p=>{if(p<=0)return "transparent";const isLight=C.mode==="light";const r=Math.round(248+(52-248)*(p/100));const g=Math.round(113+(211-113)*(p/100));const b=Math.round(113+(153-113)*(p/100));return `rgba(${r},${g},${b},${isLight?0.12:0.18})`;};
  pctBorder=p=>{if(p<=0)return "transparent";const r=Math.round(248+(52-248)*(p/100));const g=Math.round(113+(211-113)*(p/100));const b=Math.round(113+(153-113)*(p/100));return `rgba(${r},${g},${b},0.55)`;};
  card={background:C.surface,borderRadius:14,padding:20,border:`1px solid ${C.hairline}`,boxShadow:C.shadow};
  lbl={fontFamily:FN.b,fontSize:11,fontWeight:600,color:C.textDim,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.08em"};
  inp={background:C.surfaceDim,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"11px 14px",color:C.text,fontSize:13,fontFamily:FN.b,fontWeight:500,outline:"none",width:"100%"};
  numI={...inp,textAlign:"center",fontFamily:FN.m,fontWeight:600};
  btnB={background:C.accent,border:"none",borderRadius:8,padding:"11px 20px",color:C.btnText,fontSize:12,fontFamily:FN.b,fontWeight:700,cursor:"pointer",transition:"all 0.15s ease",letterSpacing:"0.02em",textTransform:"uppercase"};
  btnG={background:C.surfaceHi,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"9px 16px",color:C.textSec,fontSize:11,fontFamily:FN.b,fontWeight:600,cursor:"pointer",transition:"all 0.15s ease",textTransform:"uppercase",letterSpacing:"0.04em"};
  pill=(on,clr)=>({background:on?(clr||C.accent):C.surfaceHi,border:`1px solid ${on?"transparent":C.hairline}`,borderRadius:6,padding:"6px 14px",color:on?C.btnText:C.textDim,fontSize:11,fontFamily:FN.b,fontWeight:700,cursor:"pointer",transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",textTransform:"uppercase",letterSpacing:"0.04em"});
  Tip=({active,payload,label:lb})=>{if(!active||!payload?.length)return null;return(<div style={{background:C.surface,border:`1px solid ${C.hairline}`,borderRadius:8,padding:"8px 14px",fontSize:11,fontFamily:FN.m,boxShadow:C.modalShadow}}><div style={{color:C.textDim,marginBottom:3}}>{lb}</div>{payload.map((p,i)=>(<div key={i} style={{color:p.color||C.text,fontWeight:600}}>{p.name}: {typeof p.value==="number"?Math.round(p.value*10)/10:p.value}</div>))}</div>);};
}

const CSS=`
@keyframes checkStamp{0%{transform:scale(0.6);opacity:0}50%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes strikeSweep{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes rowDim{0%{background:rgba(245,158,11,0.12)}100%{background:transparent}}
@keyframes xpFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-28px)}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes fadeTab{from{opacity:0}to{opacity:1}}
@keyframes sunPulse{0%,100%{opacity:0.3}50%{opacity:0.5}}
@keyframes chainPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)}50%{box-shadow:0 0 0 6px rgba(245,158,11,0)}}
@keyframes finishSweep{0%{background-position:-200% 0;opacity:0}30%{opacity:1}100%{background-position:200% 0;opacity:0}}
@keyframes finishGlow{0%{opacity:0;transform:scale(0.95)}40%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
@keyframes finishFade{0%{opacity:0;letter-spacing:0.5em}100%{opacity:1;letter-spacing:0.18em}}
@keyframes launchFade{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
@keyframes graduateBloom{0%{opacity:0;transform:scale(0.7)}50%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
@keyframes graduateRing{0%{stroke-dashoffset:628}100%{stroke-dashoffset:0}}
@keyframes graduateShimmer{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes liquidRise{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}
@keyframes textDim{0%{color:inherit}100%{opacity:0.55}}
@keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
@keyframes pageInR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes pageInL{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
.page-r{animation:pageInR 0.28s cubic-bezier(0.25,0.46,0.45,0.94)}
.page-l{animation:pageInL 0.28s cubic-bezier(0.25,0.46,0.45,0.94)}
.task-row{transition:opacity 0.35s ease, background 0.4s ease, border-color 0.3s ease}
@keyframes focusComplete{0%{transform:scale(1);opacity:1;max-height:70px}22%{transform:scale(1.05)}48%{transform:scale(1);opacity:1}72%{opacity:0.5}100%{transform:scale(0.82);opacity:0;max-height:0;margin-bottom:0;padding-top:0;padding-bottom:0;border-width:0}}
.focus-complete{animation:focusComplete 0.56s cubic-bezier(0.4,0,0.2,1) forwards;overflow:hidden}
@keyframes focusStrike{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
.task-row.just-checked{animation:rowDim 0.7s ease forwards}
.task-row:active{transform:scale(0.98)}
.sweep-fill{position:absolute;inset:0;border-radius:10px;pointer-events:none;animation:liquidRise 360ms cubic-bezier(0.4,0.0,0.2,1) forwards}
.check-stamp{animation:checkStamp 0.35s cubic-bezier(0.34,1.56,0.64,1)}
.strike-wrap{position:relative;display:inline-block}
.strike-line{position:absolute;left:0;right:0;top:55%;height:2px;border-radius:2px;background:linear-gradient(90deg,#34D399 0%,#10B981 50%,#059669 100%);box-shadow:0 0 8px rgba(52,211,153,0.4);transform-origin:left center;transform:scaleX(1);pointer-events:none}
.strike-line.animate{animation:strikeSweep 0.45s cubic-bezier(0.65,0,0.35,1) forwards}
.hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{scrollbar-width:none}
.tab-content{animation:slideUp 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
.pill-btn{transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}.pill-btn:active{transform:scale(0.95)}
.press{transition:all 0.15s ease}.press:active{transform:scale(0.96)}
.overlay-bg{animation:overlayIn 0.2s ease}
.modal-box{animation:modalIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)}
.card-enter{animation:scaleIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)}
.banner-fade{animation:fadeTab 0.6s ease}
.hero-num{font-family:${FN.m};font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.04em}
.display{font-family:${FN.h};font-weight:500;letter-spacing:-0.02em;font-variation-settings:"opsz" 144,"SOFT" 50}
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
/* ═══ HEALTH ═══ */
const MACRO={calories:{label:"Calories",unit:"kcal",color:"#F59E0B"},protein:{label:"Protein",unit:"g",color:"#EF4444"},carbs:{label:"Carbs",unit:"g",color:"#3B82F6"},fat:{label:"Fat",unit:"g",color:"#A855F7"},water:{label:"Water",unit:"oz",color:"#06B6D4"}};
// Distinct palette for per-exercise strength lines
const EX_PALETTE=["#4A82D4","#2A9D5C","#E07A3A","#D04545","#7B65B0","#06B6D4","#F59E0B","#EC4899","#14B8A6","#8B5CF6","#84CC16","#F43F5E"];
const defDietGoals={calories:2200,protein:160,carbs:250,fat:70,water:64,cupOz:8};
// Circular progress ring (SVG). Center content passed as children.
function Ring({value,goal,size=120,stroke=12,color,children}){
  const r=(size-stroke)/2,c=2*Math.PI*r,pct=goal>0?Math.max(0,Math.min(1,value/goal)):0;
  return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.surfaceDim} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct)} style={{transition:"stroke-dashoffset 0.7s cubic-bezier(0.34,1.2,0.64,1)"}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>{children}</div>
  </div>);
}
const seedWH=[{id:"h6",date:"2026-03-15",split:"upper",exercises:[{name:"Bench Press",sets:[{w:50,r:10},{w:60,r:6}]},{name:"Lat Pull Down",sets:[{w:54,r:8},{w:59,r:7}]}]}];
const seedBW=[{date:"2025-10-01",weight:72.5},{date:"2026-01-01",weight:74.5},{date:"2026-03-01",weight:75.2},{date:"2026-03-29",weight:75.8}];
const seedTx={"2026-03-01":[{id:"t14",type:"out",amount:26.5,desc:"Sunday"}],"2026-03-06":[{id:"t16",type:"in",amount:30,desc:"Income"}]};
const defSettings={morningStart:5,morningEnd:12,nightStart:18,nightEnd:23,reflectHour:21,reviewDay:0,netWorthGoal:1000,debtWarningThreshold:1000,focusTransferHour:22};

/* ═══ REFLECTION PROMPTS — rotate based on day quality ═══ */
const REFLECT_PROMPTS={
  great:["What worked today?","What's one thing you want to repeat tomorrow?","Who or what helped you show up?","When did you feel most yourself today?"],
  good:["What's one win, however small?","What surprised you today?","Where did you choose discipline over comfort?","One sentence: how did today actually feel?"],
  mid:["What got in the way today?","What were you avoiding?","Where did you spend energy that didn't matter?","If today happened again, what's the one thing you'd change?"],
  poor:["What was the hardest part of today?","What were you telling yourself when you skipped things?","What's one thing tomorrow that's non-negotiable?","Be honest — what are you actually afraid of right now?"],
  any:["One thing for tomorrow.","What are you grateful for, right now?","What's the version of you that you want to be tomorrow?","What's one sentence to your future self about today?"]
};
const pickPrompts=(pct)=>{const tier=pct>=80?"great":pct>=60?"good":pct>=30?"mid":"poor";const a=REFLECT_PROMPTS[tier];const b=REFLECT_PROMPTS.any;const seed=new Date().getDate();return[a[seed%a.length],b[(seed*7)%b.length]];};

/* ═══ GOAL CADENCE PARSER — extracts target frequency from natural-language goal text ═══ */
// Returns { text, cadence, targetDays, weeklyPace, type }
//   type: "recurring" | "check" | "vague"
//   cadence: "daily" | "weekly" | "monthly" | null
//   targetDays: number of days per month the user should hit
//   weeklyPace: derived days per week
function parseGoal(input){
  let text=input.trim();let cadence=null;let targetDays=null;let type="recurring";let isVague=false;
  // N days/week
  let m=text.match(/(\d+)\s*(?:days?|x|times?)?\s*(?:a|per|\/)?\s*(?:week|wk)/i);
  if(m){const n=parseInt(m[1]);targetDays=Math.round(n*4.3);cadence="weekly";text=text.replace(m[0],"").trim();}
  // N days/month
  if(!targetDays){m=text.match(/(\d+)\s*(?:days?|x|times?)?\s*(?:a|per|\/)?\s*(?:month|mo)/i);if(m){targetDays=parseInt(m[1]);cadence="monthly";text=text.replace(m[0],"").trim();}}
  // daily / every day
  if(!targetDays){m=text.match(/\b(daily|every ?day|everyday)\b/i);if(m){targetDays=30;cadence="daily";text=text.replace(m[0],"").trim();}}
  // most days ~75%
  if(!targetDays){m=text.match(/\bmost days\b/i);if(m){targetDays=23;cadence="weekly";text=text.replace(m[0],"").trim();}}
  // few times a week ~40%
  if(!targetDays){m=text.match(/\bfew times (?:a|per) week\b/i);if(m){targetDays=12;cadence="weekly";text=text.replace(m[0],"").trim();}}
  // one-time goal markers
  if(!targetDays&&/\b(finish|complete|sign|buy|launch|ship|get|achieve)\b/i.test(text)){type="check";}
  // vague aspirations
  if(!targetDays&&type==="recurring"&&/\bmore\b/i.test(text)){isVague=true;}
  // Clean up trailing connectors
  text=text.replace(/\s+(at least|around|about|roughly)\s*$/i,"").replace(/\s*(,|\.|-)?\s*$/,"").replace(/\s+/g," ").trim();
  const weeklyPace=targetDays?Math.round((targetDays/30)*7*10)/10:null;
  return{text,cadence,targetDays,weeklyPace,type,isVague};
}

/* ═══ NATURAL LANGUAGE PARSER for quick capture ═══ */
function parseQuick(input){
  let text=input.trim();let diff="medium";let proof=false;let when="today";let recurring=false;let group=null;
  // difficulty markers
  if(/!hard\b/i.test(text)){diff="hard";text=text.replace(/!hard\b/i,"").trim();}
  else if(/!easy\b/i.test(text)){diff="easy";text=text.replace(/!easy\b/i,"").trim();}
  else if(/!med(ium)?\b/i.test(text)){diff="medium";text=text.replace(/!med(ium)?\b/i,"").trim();}
  // photo proof
  if(/(?:📷|📸|\+photo|\bphoto\b)/i.test(text)){proof=true;text=text.replace(/(?:📷|📸|\+photo|\bphoto\b)/gi,"").trim();}
  // recurring
  if(/\b(every ?day|daily)\b/i.test(text)){recurring=true;text=text.replace(/\b(every ?day|daily)\b/i,"").trim();}
  // group
  if(/\b(morning|evening|night)\b/i.test(text)){const m=text.match(/\b(morning|evening|night)\b/i);group=m[1].toLowerCase()==="evening"?"night":m[1].toLowerCase();text=text.replace(/\b(morning|evening|night)\b/i,"").trim();}
  // when
  if(/\btomorrow\b/i.test(text)){when="tomorrow";text=text.replace(/\btomorrow\b/i,"").trim();}
  else if(/\btoday\b/i.test(text)){when="today";text=text.replace(/\btoday\b/i,"").trim();}
  // weekday
  const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  for(let i=0;i<7;i++){const re=new RegExp(`\\b${days[i]}\\b`,"i");if(re.test(text)){when=days[i];text=text.replace(re,"").trim();break;}}
  text=text.replace(/\s+/g," ").trim();
  return{text,diff,proof,when,recurring,group};
}
const whenToDate=(when)=>{const d=new Date();if(when==="today")return d;if(when==="tomorrow"){d.setDate(d.getDate()+1);return d;}const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];const idx=days.indexOf(when);if(idx>=0){const cur=d.getDay();let diff=idx-cur;if(diff<=0)diff+=7;d.setDate(d.getDate()+diff);return d;}return d;};

/* ═══ REACTIVE BANNER — this is the identity piece ═══ */
function BannerScene({mode,dayPct,morningPct,eveningPct}){
  // Linear interpolation helper
  const lerp=(a,b,t)=>Math.round(a+(b-a)*t);
  const lerpHex=(c1,c2,t)=>{const p=x=>parseInt(x.slice(1),16);const r1=(p(c1)>>16)&255,g1=(p(c1)>>8)&255,b1=p(c1)&255;const r2=(p(c2)>>16)&255,g2=(p(c2)>>8)&255,b2=p(c2)&255;return `rgb(${lerp(r1,r2,t)},${lerp(g1,g2,t)},${lerp(b1,b2,t)})`;};
  // Morning: interpolate dark pre-dawn → bright day blue as morningPct grows
  const mt=Math.max(0,Math.min(1,morningPct/100));
  let skyA,skyB,skyC,groundColor,mountainColor,treeBase,treeCanopy,treeCanopyMid,treeCanopyTop;
  if(mode==="morning"){
    // Dark navy/indigo → warm dawn pink → full bright daylight blue
    skyA=lerpHex("#1E293B","#7DB9E8",mt); // top of sky
    skyB=lerpHex("#3B2E4E","#BEE0F5",mt); // middle (dawn pink → light blue)
    skyC=lerpHex("#5B4E6E","#E8F4FB",mt); // horizon (warm → nearly white)
    groundColor=lerpHex("#131A2B","#2D5F4E",mt);
    mountainColor=lerpHex("#1E1B2E","#4A7A8E",mt);
    treeBase=lerpHex("#2C1810","#3E2723",mt);
    treeCanopy=lerpHex("#1F3B2E","#2F5F3F",mt);
    treeCanopyMid=lerpHex("#2A5040","#3F7F4F",mt);
    treeCanopyTop=lerpHex("#34664F","#4F9F5F",mt);
  }else if(mode==="day"){
    // Full bright daylight — stays bright regardless, only sun position shifts
    skyA="#5FA8D9";skyB="#9ECBEB";skyC="#E0EFF8";
    groundColor="#2D5F4E";mountainColor="#4A7A8E";
    treeBase="#3E2723";treeCanopy="#2F5F3F";treeCanopyMid="#3F7F4F";treeCanopyTop="#4F9F5F";
  }else{
    // Evening: moody twilight. Darkens slightly as eveningPct grows (going to bed = deepest night)
    const et=Math.max(0,Math.min(1,eveningPct/100));
    skyA=lerpHex("#2B2440","#0D1022",et);
    skyB=lerpHex("#4A3055","#1F1A35",et);
    skyC=lerpHex("#7A4560","#3B2E4E",et);
    groundColor=lerpHex("#1A1525","#08060F",et);
    mountainColor=lerpHex("#2B1F3B","#141020",et);
    treeBase="#1C0F1E";treeCanopy="#1A2E24";treeCanopyMid="#233F30";treeCanopyTop="#2D4F3C";
  }
  // Sun arc is split into thirds across the three tabs so the sun tracks continuously through the day:
  //   Morning tab → first 1/3 of the arc (horizon-left to upper-left)
  //   All Day tab → middle 1/3 (upper-left to upper-right, across the peak)
  //   Evening tab → final 1/3 (upper-right back down to horizon-right)
  // Within each tab, the sun's position along that third is driven by that tab's own completion %.
  const mtm=Math.max(0,Math.min(1,morningPct/100));
  const eta=Math.max(0,Math.min(1,eveningPct/100));
  const dyt=Math.max(0,Math.min(1,dayPct/100));
  let arcProgress;
  if(mode==="morning")arcProgress=mtm*(1/3);
  else if(mode==="day")arcProgress=(1/3)+dyt*(1/3);
  else arcProgress=(2/3)+eta*(1/3);
  const angle=Math.PI*(1-arcProgress);
  const sunX=200+Math.cos(angle)*160;
  const sunY=180-Math.sin(angle)*130;
  // Sun color shifts with context
  const sunColor=mode==="evening"?"#E85A2B":mode==="morning"?(mtm>0.6?"#FFE066":mtm>0.3?"#FFB84D":"#E85A2B"):"#FFEB66";
  const sunGlow=mode==="evening"?(0.5-eta*0.3):(mode==="morning"?0.3+mtm*0.4:0.65);
  // Moon only appears once evening is fully complete — sun has set, night has arrived
  const showMoon=mode==="evening"&&eta>=1;
  // Sun shows in all three modes (sun sets through evening into horizon)
  const showSun=!showMoon;
  // Stars: visible in evening (fading in as it darkens), fade as morning lightens, hidden in day
  const showStars=mode==="evening"||(mode==="morning"&&mtm<0.5);
  const starOpacity=mode==="evening"?(0.3+eta*0.5):(mode==="morning"?(1-mtm*2):0);
  // Trees: only react in morning (grow with morningPct), frozen in day/evening
  const growValue=mode==="morning"?mtm:mode==="day"?1:1;
  const trees=[{x:80,s:0.95,grow:growValue},{x:200,s:1.15,grow:growValue},{x:320,s:0.9,grow:growValue}];
  return(
    <svg key={mode} viewBox="0 0 400 200" className="banner-fade" style={{width:"100%",height:"100%",display:"block"}} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyA}/><stop offset="0.55" stopColor={skyB}/><stop offset="1" stopColor={skyC}/>
        </linearGradient>
        <radialGradient id="sung"><stop offset="0" stopColor={sunColor} stopOpacity="1"/><stop offset="1" stopColor={sunColor} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#sky)"/>
      {showStars&&[...Array(22)].map((_,i)=>{const sx=(i*53)%400,sy=(i*37)%100;return <circle key={i} cx={sx} cy={sy} r={(i%3)*0.4+0.5} fill="#F8F5EC" opacity={starOpacity*(0.4+(i%3)*0.2)}/>;})}
      {/* Sun */}
      {!showMoon&&<g><circle cx={sunX} cy={sunY} r="36" fill={sunColor} opacity={sunGlow*0.35} style={{animation:"sunPulse 4s ease-in-out infinite"}}/><circle cx={sunX} cy={sunY} r="20" fill="url(#sung)" opacity={sunGlow+0.3}/><circle cx={sunX} cy={sunY} r="12" fill={sunColor}/></g>}
      {/* Moon for evening */}
      {showMoon&&<g><circle cx="320" cy="48" r="22" fill="#F8F5EC" opacity="0.12"/><circle cx="320" cy="48" r="14" fill="#F8F5EC" opacity="0.95"/><circle cx="326" cy="44" r="12" fill={skyA} opacity="0.85"/></g>}
      {/* Mountains */}
      <path d="M0,150 L60,110 L110,135 L170,95 L230,130 L290,100 L350,125 L400,110 L400,200 L0,200 Z" fill={mountainColor} opacity="0.85"/>
      <path d="M0,165 L80,140 L160,155 L240,135 L320,155 L400,145 L400,200 L0,200 Z" fill={groundColor} opacity="0.92"/>
      <rect x="0" y="172" width="400" height="28" fill={groundColor}/>
      {/* Trees */}
      {trees.map((t,i)=>{const h=8+t.grow*28;const lw=6+t.grow*14;return(
        <g key={i} transform={`translate(${t.x},172)`}>
          <rect x="-2" y={-h*0.4} width="4" height={h*0.4} fill={treeBase}/>
          <rect x="-3" y="-4" width="6" height="4" fill={treeBase}/>
          {t.grow>0.1&&<polygon points={`${-lw},${-h*0.4} 0,${-h} ${lw},${-h*0.4}`} fill={treeCanopy}/>}
          {t.grow>0.4&&<polygon points={`${-lw*0.8},${-h*0.6} 0,${-h*1.15} ${lw*0.8},${-h*0.6}`} fill={treeCanopyMid}/>}
          {t.grow>0.7&&<polygon points={`${-lw*0.6},${-h*0.8} 0,${-h*1.3} ${lw*0.6},${-h*0.8}`} fill={treeCanopyTop}/>}
          {t.grow<=0.1&&<g stroke={treeBase} strokeWidth="1.2" fill="none"><line x1="0" y1={-h*0.4} x2={-lw*0.5} y2={-h*0.7}/><line x1="0" y1={-h*0.4} x2={lw*0.5} y2={-h*0.7}/></g>}
        </g>
      );})}
    </svg>
  );
}

/* ═══ UI Bits ═══ */
function Overlay({open,onClose,title,children,wide}){if(!open)return null;return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(5,8,16,0.75)",backdropFilter:"blur(10px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:C.surface,color:C.text,borderRadius:18,padding:24,width:"92%",maxWidth:wide?640:520,maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.hairline}`,boxShadow:"0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{fontSize:11,fontWeight:600,margin:0,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.1em"}}>{title}</h3><button className="press" onClick={onClose} style={{background:C.surfaceHi,border:`1px solid ${C.hairline}`,color:C.textDim,fontSize:16,cursor:"pointer",width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>{children}</div></div>);}

function ProofModal({open,onClose,name,onDone}){if(!open)return null;let fileEl=null;const hf=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onDone(ev.target.result);onClose();};r.readAsDataURL(f);};return(<div style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)"}} /><div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#111",borderRadius:24,padding:32,width:"86%",maxWidth:360,textAlign:"center"}}><div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Photo Proof Required</div><div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:24}}>{name}</div><input ref={el=>fileEl=el} type="file" accept="image/*" capture="environment" onChange={hf} style={{display:"none"}} /><button onClick={()=>fileEl?.click()} style={{width:160,height:160,borderRadius:20,background:"rgba(255,255,255,0.05)",border:"2px dashed rgba(255,255,255,0.15)",margin:"0 auto 24px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,cursor:"pointer"}}><span style={{fontSize:44}}>📸</span><span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600}}>Tap to Open Camera</span></button><button onClick={onClose} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",padding:"10px 24px"}}>Cancel</button></div></div>);}

/* ═══ VIDEO JOURNAL STORAGE ═══ */
// Video blobs are large, so they live in IndexedDB (keyed by entry id) rather than localStorage.
// Only lightweight metadata (id, note, timestamp, duration) is kept in app state + localStorage.
const VJ_DB="progress-vj",VJ_STORE="videos";
function vjOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(VJ_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(VJ_STORE))r.result.createObjectStore(VJ_STORE);};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function vjPut(id,blob){const db=await vjOpen();return new Promise((res,rej)=>{const tx=db.transaction(VJ_STORE,"readwrite");tx.objectStore(VJ_STORE).put(blob,id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
async function vjGet(id){const db=await vjOpen();return new Promise((res,rej)=>{const tx=db.transaction(VJ_STORE,"readonly");const rq=tx.objectStore(VJ_STORE).get(id);rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(rq.error);});}
async function vjDel(id){const db=await vjOpen();return new Promise((res,rej)=>{const tx=db.transaction(VJ_STORE,"readwrite");tx.objectStore(VJ_STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
const fmtDur=ms=>{const s=Math.floor((ms||0)/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;};

/* ═══ VIDEO RECORDER MODAL — live camera capture via MediaRecorder ═══ */
function VideoRecorderModal({open,onClose,onSave,dateLabel}){
  const videoRef=useRef(null);
  const streamRef=useRef(null);
  const recRef=useRef(null);
  const chunksRef=useRef([]);
  const startRef=useRef(0);
  const[phase,setPhase]=useState("idle"); // idle | recording | review
  const[elapsed,setElapsed]=useState(0);
  const[err,setErr]=useState(null);
  const[blob,setBlob]=useState(null);
  const[previewUrl,setPreviewUrl]=useState(null);
  const[saving,setSaving]=useState(false);

  // Acquire camera when the modal opens; tear everything down when it closes.
  useEffect(()=>{
    if(!open)return;
    let active=true;
    setPhase("idle");setElapsed(0);setErr(null);setBlob(null);setPreviewUrl(null);setSaving(false);
    (async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
        if(!active){stream.getTracks().forEach(t=>t.stop());return;}
        streamRef.current=stream;
        if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.muted=true;videoRef.current.play().catch(()=>{});}
      }catch(e){setErr("Camera unavailable. Check permissions, or upload a file instead.");}
    })();
    return()=>{active=false;if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}};
  },[open]);

  // Tick the elapsed timer while recording.
  useEffect(()=>{if(phase!=="recording")return;const id=setInterval(()=>setElapsed(Date.now()-startRef.current),200);return()=>clearInterval(id);},[phase]);

  if(!open)return null;

  const start=()=>{
    const stream=streamRef.current;if(!stream)return;
    chunksRef.current=[];
    let mime="video/webm";
    if(window.MediaRecorder){if(MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus"))mime="video/webm;codecs=vp9,opus";else if(MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus"))mime="video/webm;codecs=vp8,opus";else if(MediaRecorder.isTypeSupported("video/mp4"))mime="video/mp4";}
    try{
      const rec=new MediaRecorder(stream,{mimeType:mime});
      rec.ondataavailable=e=>{if(e.data&&e.data.size>0)chunksRef.current.push(e.data);};
      rec.onstop=()=>{const b=new Blob(chunksRef.current,{type:mime});setBlob(b);setPreviewUrl(URL.createObjectURL(b));setPhase("review");};
      recRef.current=rec;startRef.current=Date.now();rec.start();setPhase("recording");
    }catch(e){setErr("Recording isn't supported on this browser. Try uploading a file instead.");}
  };
  const stop=()=>{if(recRef.current&&recRef.current.state!=="inactive")recRef.current.stop();};
  const retake=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);setBlob(null);setPreviewUrl(null);setPhase("idle");setElapsed(0);if(videoRef.current&&streamRef.current){videoRef.current.srcObject=streamRef.current;videoRef.current.muted=true;videoRef.current.play().catch(()=>{});}};
  const save=async()=>{if(!blob)return;setSaving(true);await onSave(blob,elapsed);if(previewUrl)URL.revokeObjectURL(previewUrl);onClose();};

  return(<div style={{position:"fixed",inset:0,zIndex:260,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={phase==="recording"?undefined:onClose}>
    <div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"}} />
    <div className="modal-box" onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#0E0E12",borderRadius:24,padding:20,width:"90%",maxWidth:400}}>
      <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.45)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>Video Journal</div>
      {dateLabel&&<div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:14,fontFamily:FN.h,fontStyle:"italic"}}>{dateLabel}</div>}
      {err?
        <div style={{padding:"24px 8px",textAlign:"center",color:"rgba(255,255,255,0.6)",fontSize:13,lineHeight:1.5}}>{err}</div>
      :<>
        <div style={{position:"relative",borderRadius:16,overflow:"hidden",background:"#000",aspectRatio:"3/4",marginBottom:14}}>
          {phase!=="review"&&<video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}} />}
          {phase==="review"&&previewUrl&&<video src={previewUrl} controls playsInline style={{width:"100%",height:"100%",objectFit:"contain",background:"#000"}} />}
          {phase==="recording"&&<div style={{position:"absolute",top:12,left:12,display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.5)",borderRadius:20,padding:"5px 12px"}}><span style={{width:9,height:9,borderRadius:"50%",background:"#F87171",animation:"recPulse 1.2s ease-in-out infinite"}} /><span style={{fontSize:12,fontWeight:700,color:"#fff",fontFamily:FN.m}}>{fmtDur(elapsed)}</span></div>}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
          {phase==="idle"&&<button className="press" onClick={start} style={{display:"flex",alignItems:"center",gap:8,background:"#F87171",border:"none",borderRadius:30,padding:"12px 24px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.04em"}}><span style={{width:12,height:12,borderRadius:"50%",background:"#fff"}} />Record</button>}
          {phase==="recording"&&<button className="press" onClick={stop} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:30,padding:"12px 24px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.04em"}}><span style={{width:11,height:11,borderRadius:2,background:"#F87171"}} />Stop</button>}
          {phase==="review"&&<>
            <button className="press" onClick={retake} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.18)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:600,cursor:"pointer",padding:"11px 18px"}}>Retake</button>
            <button className="press" onClick={save} disabled={saving} style={{flex:1,background:"#34D399",border:"none",borderRadius:10,color:"#06281C",fontSize:13,fontWeight:700,cursor:"pointer",padding:"12px 18px",textTransform:"uppercase",letterSpacing:"0.04em",opacity:saving?0.6:1}}>{saving?"Saving…":"Save Entry"}</button>
          </>}
        </div>
      </>}
      {phase!=="recording"&&<button onClick={onClose} style={{display:"block",margin:"14px auto 0",background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",padding:"4px 12px"}}>Close</button>}
    </div>
  </div>);
}

/* ═══ BUDGET LEDGER HELPERS ═══ */
const ACCT_META=[
  {key:"checking",label:"Debit Card",icon:"💳"},
  {key:"savings",label:"Savings",icon:"🏦"},
  {key:"credit",label:"Credit Card",icon:"🧾"},
  {key:"investment",label:"Investments",icon:"📈"},
];
// Lerp between two hex colors at t∈[0,1], returns an rgb() string.
const lerpHex=(a,b,t)=>{const ai=parseInt(a.slice(1),16),bi=parseInt(b.slice(1),16);
  const ar=(ai>>16)&255,ag=(ai>>8)&255,ab=ai&255,br=(bi>>16)&255,bg=(bi>>8)&255,bb=bi&255;
  return`rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;};
// t=0 → red, t=0.5 → yellow, t=1 → green. Used for both Net Worth (direct) and Debt (inverted) gradients.
const gradColor=t=>{t=Math.max(0,Math.min(1,t));return t<0.5?lerpHex("#F87171","#FBBF24",t*2):lerpHex("#FBBF24","#34D399",(t-0.5)*2);};

/* ═══ DRAG-TO-REORDER LIST — pointer-based so it works for both mouse and touch ═══ */
function DragReorderList({items,onReorder}){
  const[seq,setSeq]=useState(()=>items.map(i=>i.id));
  const[dragId,setDragId]=useState(null);
  const draggingRef=useRef(null);
  // Re-sync from props whenever the list changes — but never mid-drag, or it would fight the user.
  useEffect(()=>{if(!draggingRef.current)setSeq(items.map(i=>i.id));},[items]);
  const byId={};items.forEach(i=>{byId[i.id]=i;});
  const reorder=(overId)=>{const id=draggingRef.current;if(!id||id===overId)return;setSeq(prev=>{const a=[...prev];const from=a.indexOf(id),to=a.indexOf(overId);if(from<0||to<0||from===to)return prev;a.splice(from,1);a.splice(to,0,id);return a;});};
  const down=(e,id)=>{draggingRef.current=id;setDragId(id);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}};
  const move=(e)=>{if(!draggingRef.current)return;const el=typeof document!=="undefined"&&document.elementFromPoint(e.clientX,e.clientY);const row=el&&el.closest&&el.closest("[data-rid]");if(row){const oid=row.getAttribute("data-rid");if(oid)reorder(oid);}};
  const up=()=>{if(!draggingRef.current)return;draggingRef.current=null;setDragId(null);setSeq(s=>{onReorder(s);return s;});};
  return(<div>{seq.map(id=>{const it=byId[id];if(!it)return null;const active=dragId===id;const d=it.diff&&DIFF[it.diff];return(
    <div key={id} data-rid={id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",marginBottom:8,borderRadius:10,background:C.surface,border:`1px solid ${active?C.accent:C.hairline}`,boxShadow:active?"0 8px 22px rgba(0,0,0,0.20)":"none",opacity:active?0.97:1,transform:active?"scale(1.01)":"none",transition:active?"none":"box-shadow 0.2s ease, transform 0.2s ease"}}>
      <div onPointerDown={e=>down(e,id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} title="Drag to reorder" style={{touchAction:"none",cursor:"grab",padding:"6px 4px",display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
        {[0,1,2].map(r=>(<div key={r} style={{display:"flex",gap:3}}><span style={{width:3,height:3,borderRadius:"50%",background:C.textDim}}/><span style={{width:3,height:3,borderRadius:"50%",background:C.textDim}}/></div>))}
      </div>
      {d&&<div style={{width:4,height:22,borderRadius:2,background:d.color,flexShrink:0}}/>}
      <span style={{flex:1,fontSize:13,fontWeight:500,color:C.text}}>{it.text}</span>
      {d&&<span style={{fontSize:9,fontWeight:700,fontFamily:FN.m,color:d.color,background:d.bg,borderRadius:4,padding:"2px 7px",flexShrink:0}}>{d.label}</span>}
    </div>);})}</div>);
}

/* ═══ Icons for footer ═══ */
const Icons={
  today:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  groups:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  analytics:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  goals:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  journal:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  workout:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  budget:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
};

/* ═══ MAIN ═══ */
export default function Dashboard(){
  const[todos,setTodos]=useState(defTodos);
  const[focusByDate,setFocusByDate]=useState(()=>({[dk(new Date())]:defFocusSeed}));
  const[checks,setChecks]=useState({});
  const[photoLog,setPhotoLog]=useState({});
  const[wGoals,setWGoals]=useState(defWeekly);
  const[mGoals,setMGoals]=useState(defMonthly);
  // Aspirations — the new unified goal system. Each has shape:
  // {id, text, type:"recurring"|"check", targetDays (for recurring), cadence, done (for check), created, history:{monthKey:daysHit}}
  const[aspirations,setAspirations]=useState([]);
  const[wHist,setWHist]=useState(seedWH);
  const[bwLog,setBwLog]=useState(seedBW);
  const[txns,setTxns]=useState(seedTx);
  const[groups,setGroups]=useState([{id:"g1",name:"Workout Crew",tasks:["f_ex"],members:[{name:"You",av:"E"},{name:"Alex",av:"A"}],feed:[]}]);
  const[splits,setSplits]=useState(defSplits);
  const[settings,setSettings]=useState(defSettings);
  const[curWkState,setCurWkState]=useState(null); // persisted workout draft
  // NEW: completion log — tracks the order you complete tasks each day, used to learn your actual routine
  // Shape: {dateKey: [{taskId, time, ordinal}]} — ordinal is the nth task you checked that day
  const[completionLog,setCompletionLog]=useState({});
  // Active workout session: when set, the entire app enters focus mode for this workout
  // Shape: {split, startTime (ms), exercises}
  const[activeSession,setActiveSession]=useState(null);
  const[sessionTick,setSessionTick]=useState(0); // forces re-render every second for the stopwatch
  const[finishingSession,setFinishingSession]=useState(false); // triggers the finish animation
  const[sessionMinimized,setSessionMinimized]=useState(false); // pop session out so user can navigate
  const[showCancelConfirm,setShowCancelConfirm]=useState(false);
  const[viewWorkout,setViewWorkout]=useState(null);
  const[saveError,setSaveError]=useState(null); // shows toast when saves fail
  useEffect(()=>{if(!activeSession)return;const id=setInterval(()=>setSessionTick(t=>t+1),1000);return()=>clearInterval(id);},[activeSession]);
  // NEW: chains (habit stacking), reflections, sunday reviews, quick-capture modal, weekly priorities
  const[chains,setChains]=useState([]); // [{id, name, taskIds:[], color}]
  const[reflections,setReflections]=useState({}); // {dateKey: [{prompt, answer, time}]}
  const[reviews,setReviews]=useState({}); // {weekKey: {numbers, kept, dropped, priorities, time}}
  const[weekPriorities,setWeekPriorities]=useState([]); // current week's top 3
  const[showQuick,setShowQuick]=useState(false);
  const[quickText,setQuickText]=useState("");
  const[quickPreview,setQuickPreview]=useState(null);
  const[showReflect,setShowReflect]=useState(false);
  const[reflectAnswers,setReflectAnswers]=useState(["",""]);
  const[showReview,setShowReview]=useState(false);
  const[reviewStep,setReviewStep]=useState(0);
  const[reviewPriorities,setReviewPriorities]=useState(["","",""]);
  const[reviewKept,setReviewKept]=useState({});
  const[reflectDismissed,setReflectDismissed]=useState({});
  const[launchDismissed,setLaunchDismissed]=useState({}); // keyed by date — morning card dismissed today?
  const[graduatingGoal,setGraduatingGoal]=useState(null); // the goal object being celebrated — triggers fullscreen ceremony
  const[eveningClosed,setEveningClosed]=useState({}); // keyed by date — evening card closed today?
  const[eveningCardOpen,setEveningCardOpen]=useState(false); // expanded input state
  const[eveningCarry,setEveningCarry]=useState(""); // "one thing to carry into tomorrow" input
  const[reviewDismissed,setReviewDismissed]=useState({});

  const[tab,setTab]=useState("today");
  const[menuTab,setMenuTab]=useState(null);
  const[vDate,setVDate]=useState(()=>new Date());
  const[showMenu,setShowMenu]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[showFullView,setShowFullView]=useState(false);
  // Theme: "dark" | "light". Persisted in settings (loaded below). Kept in component state so
  // React re-renders on swap; applyTheme() runs as a side-effect to rebind module helpers.
  const[theme,setTheme]=useState("dark");
  // Apply theme synchronously so module-level helpers (C, card, btnB, pill, DIFF, etc.) reflect
  // the active palette before any child JSX reads them this render.
  applyTheme(theme==="light"?LIGHT:DARK);
  const[structuredMode,setStructuredMode]=useState(false);
  const[gridExpanded,setGridExpanded]=useState(false); // week vs full month
  const[showFullCal,setShowFullCal]=useState(false);
  const[showRecap,setShowRecap]=useState(false);
  const[confetti,setConfetti]=useState(false);
  const[proofTask,setProofTask]=useState(null);
  const[todaySub,setTodaySub]=useState("morning"); // morning | evening | focus
  const[focusCollapsed,setFocusCollapsed]=useState({}); // {goalId:true} — collapsed goal cards in Today→Focus (default expanded)
  const[reorderMode,setReorderMode]=useState(false); // Today: drag-to-reorder habits
  const[focusQuick,setFocusQuick]=useState(""); // inline "add focus/daily task" composer text
  const[completingFocus,setCompletingFocus]=useState({}); // focus task ids mid completion-animation
  const[habitOrder,setHabitOrder]=useState({}); // {taskId: index} — manual habit order, overrides smart-learned order
  const[editTask,setEditTask]=useState(null); // {task, source:"focus"|"todos"}
  const[editText,setEditText]=useState("");
  const[editDiff,setEditDiff]=useState("easy");
  const[editGrp,setEditGrp]=useState("morning");
  const[editProof,setEditProof]=useState(false);

  const[gSplit,setGSplit]=useState(null);const[gView,setGView]=useState("workouts");const[doneEx,setDoneEx]=useState({});const[nBW,setNBW]=useState("");const[addSplit,setAddSplit]=useState(false);const[nSpName,setNSpName]=useState("");const[nSpEx,setNSpEx]=useState("");
  // ─── HEALTH: Diet ───
  const[diet,setDiet]=useState({}); // {dateKey:{calories,protein,carbs,fat,water}}
  const[dietGoals,setDietGoals]=useState(defDietGoals);
  const[dietDate,setDietDate]=useState(()=>dk(new Date()));
  const[showDietGoals,setShowDietGoals]=useState(false);
  const[dietAdd,setDietAdd]=useState({calories:"",protein:"",carbs:"",fat:""}); // quick-add buffer
  // ─── HEALTH: Progress filters ───
  const[strExSel,setStrExSel]=useState(null); // null = all exercises; otherwise array of names
  const[strView,setStrView]=useState("cards"); // cards | compare
  const[strExpanded,setStrExpanded]=useState(null); // exercise name expanded inline
  const[strCollapsed,setStrCollapsed]=useState({}); // {split:true} collapsed groups
  const[strRange,setStrRange]=useState("all"); // 30 | 90 | all
  const[nutriRange,setNutriRange]=useState("30");
  const[nutriShow,setNutriShow]=useState({calories:true,protein:true,carbs:true,fat:true,water:true});
  const[bMonth,setBMonth]=useState(()=>new Date());const[selDay,setSelDay]=useState(null);const[txF,setTxF]=useState({type:"out",amount:"",desc:"",account:"",toAccount:""});
  const[editingTx,setEditingTx]=useState(null); // {day,id} of the transaction currently loaded into txF, or null when adding new
  const[gTab,setGTab]=useState("focus");
  // Unified task-add form state (camera+diff+grp upfront)
  const[addForm,setAddForm]=useState(null); // {target:"focus"|"morning"|"night"|"general"}
  const[fText,setFText]=useState("");const[fDiff,setFDiff]=useState("easy");const[fProof,setFProof]=useState(false);const[fGrp,setFGrp]=useState("morning");
  const[addWGoal,setAddWGoal]=useState(false);const[nwText,setNwText]=useState("");const[nwTarget,setNwTarget]=useState("");
  const[addMGoal,setAddMGoal]=useState(false);const[nmText,setNmText]=useState("");const[nmType,setNmType]=useState("check");const[nmTarget,setNmTarget]=useState("");
  // New goal creation flow
  const[showGoalCreator,setShowGoalCreator]=useState(false);
  const[gcStep,setGcStep]=useState(0); // 0=name, 1=type, 2=details
  const[gcName,setGcName]=useState("");
  const[gcType,setGcType]=useState(null); // "measurable"|"outcome"|"habit"
  const[gcDeadline,setGcDeadline]=useState("");
  const[gcHours,setGcHours]=useState("");
  const[gcSteps,setGcSteps]=useState(["","",""]);
  const[gcTarget,setGcTarget]=useState(""); // days per month for habit type
  const[gcAction,setGcAction]=useState(""); // daily action text for habit type
  const[gcIntention,setGcIntention]=useState(""); // implementation intention — situational cue
  const[intentionPromptFor,setIntentionPromptFor]=useState(null); // legacy goal being asked about
  const[intentionPromptText,setIntentionPromptText]=useState("");
  const[intentionPromptDismissed,setIntentionPromptDismissed]=useState({}); // {goalId:true}
  const[gcOverride,setGcOverride]=useState(false); // direct habit override
  const resetGc=()=>{setGcStep(0);setGcName("");setGcType(null);setGcDeadline("");setGcHours("");setGcSteps(["","",""]);setGcTarget("");setGcAction("");setGcIntention("");setGcOverride(false);setShowGoalCreator(false);};
  const[showGal,setShowGal]=useState(false);
  const[selGrp,setSelGrp]=useState(null);const[mkGrp,setMkGrp]=useState(false);const[nGrpName,setNGrpName]=useState("");const[nGrpTasks,setNGrpTasks]=useState([]);
  const[modal,setModal]=useState(null);
  // ─── Video Journal (repurposed "Groups" tab) ───
  const[videoJournal,setVideoJournal]=useState({}); // {dateKey:[{id,note,time,duration,mime}]} — blobs live in IndexedDB
  const[vjMonth,setVjMonth]=useState(()=>new Date());
  const[vjSel,setVjSel]=useState(null); // selected day number
  const[vjUrls,setVjUrls]=useState({}); // id -> object URL (rebuilt from IndexedDB)
  const[showVjRecorder,setShowVjRecorder]=useState(false);
  const vjFileRef=useRef(null);
  // ─── Budget: Financial Snapshot ───
  const[accounts,setAccounts]=useState({checking:"",savings:"",cash:"",investment:"",credit:""});
  const[subscriptions,setSubscriptions]=useState([]); // [{id,name,cost,billDay,category}]
  const[showFinSnap,setShowFinSnap]=useState(true);
  const[subForm,setSubForm]=useState({name:"",cost:"",billDay:"",category:""});
  const[addSub,setAddSub]=useState(false);
  // ─── Weekly goal creation (mirrors monthly's outcome step builder) ───
  const[showAddWeekly,setShowAddWeekly]=useState(false);
  const[nWkText,setNWkText]=useState("");
  const[nWkTarget,setNWkTarget]=useState("");
  const[nWkSteps,setNWkSteps]=useState(["","",""]);
  // ─── Focus productivity log: {dateKey: count} — counts Daily Tasks + Weekly/Monthly step completions.
  // Deliberately separate from `checks` (habit tracking) so habit and focus metrics can never be combined. ───
  const[focusCompletionLog,setFocusCompletionLog]=useState({});
  // ─── PDF / report export wizard ───
  const[showExport,setShowExport]=useState(false);
  const[exportStep,setExportStep]=useState(1);
  const[exportSections,setExportSections]=useState({analytics:true,goals:false,workouts:false,nutrition:false,budget:false});
  const[exportRange,setExportRange]=useState("30");
  const[exportCustomStart,setExportCustomStart]=useState("");
  const[exportCustomEnd,setExportCustomEnd]=useState("");

  // ─── Goal editing (monthly / weekly) ───
  const[editGoal,setEditGoal]=useState(null); // {kind:"monthly"|"weekly", goal}
  const[egText,setEgText]=useState("");
  const[egNum,setEgNum]=useState("");
  const[egDeadline,setEgDeadline]=useState("");
  const[egSteps,setEgSteps]=useState([]);
  // ─── Footer page swipe nav ───
  const[navDir,setNavDir]=useState(0); // -1 left, 1 right, 0 none — drives transition direction
  const calRef=useRef(null);
  const dietCalRef=useRef(null);

  const now=new Date();const vk=dk(vDate);const isToday=vk===dk(now);const dc=checks[vk]||{};

  /* ─── Habit history freezing ─── a habit counts on day K only between its createdOn and removedOn.
     Existing habits (no dates) count on every day; removing sets removedOn so past days stay frozen. */
  const habitActiveOn=(h,k)=>{const d=new Date(k);if(h.createdOn&&d<new Date(h.createdOn))return false;if(h.removedOn&&d>=new Date(h.removedOn))return false;return true;};
  const activeTodos=(k)=>todos.filter(t=>habitActiveOn(t,k));
  const dayHabitRoster=(k)=>[...activeTodos(k),...aspirations.filter(a=>a.graduated)];
  const dayHabitPct=(k)=>{const all=dayHabitRoster(k);if(all.length===0)return 0;const ch=checks[k]||{};return Math.round(all.filter(t=>ch[t.id]).length/all.length*100);};
  const removeHabit=(id)=>setTodos(p=>p.map(t=>t.id===id?{...t,removedOn:dk(now)}:t)); // soft-delete: keep on past days, drop from today onward
  const focusTasks=focusByDate[vk]||[];
  const morningT=activeTodos(vk).filter(t=>t.grp==="morning");
  const nightT=activeTodos(vk).filter(t=>t.grp==="night");

  /* ─── SMART ORDERING: learn the order you actually complete tasks ─── */
  // For each task, compute its average ordinal rank across the last 14 days.
  // Lower avg ordinal = you tend to do it first. Tasks with no data go to the bottom.
  const learnedOrder=useMemo(()=>{
    const stats={}; // {taskId: {total, count}}
    const today=new Date();
    for(let i=0;i<14;i++){
      const d=new Date(today);d.setDate(d.getDate()-i);
      const k=dk(d);
      const log=completionLog[k]||[];
      log.forEach(entry=>{
        if(!stats[entry.taskId])stats[entry.taskId]={total:0,count:0};
        stats[entry.taskId].total+=entry.ordinal;
        stats[entry.taskId].count+=1;
      });
    }
    const rank={};
    Object.keys(stats).forEach(id=>{rank[id]=stats[id].total/stats[id].count;});
    return rank;
  },[completionLog]);
  // Sort tasks: manual drag order wins; anything not manually placed falls back to the smart-learned order.
  const sortByLearned=(tasks)=>{
    const manual=tasks.filter(t=>habitOrder[t.id]!==undefined).sort((a,b)=>habitOrder[a.id]-habitOrder[b.id]);
    const rest=tasks.filter(t=>habitOrder[t.id]===undefined);
    const restSorted=[...rest.filter(t=>learnedOrder[t.id]!==undefined).sort((a,b)=>learnedOrder[a.id]-learnedOrder[b.id]),...rest.filter(t=>learnedOrder[t.id]===undefined)];
    return[...manual,...restSorted];
  };
  // Persist a new manual sequence for a group (indices only need to be monotonic within each filtered group).
  const applyHabitOrder=(ids)=>setHabitOrder(prev=>{const m={...prev};ids.forEach((id,i)=>{m[id]=i;});return m;});
  const morningTSorted=useMemo(()=>sortByLearned(morningT),[morningT,learnedOrder,habitOrder]);
  const nightTSorted=useMemo(()=>sortByLearned(nightT),[nightT,learnedOrder,habitOrder]);

  /* ─── Toggle ─── */
  const toggle=t=>{
    const on=dc[t.id];
    if(!on&&t.proof){setProofTask(t);return;}
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:!on}}));
    if(!on){
      // Record completion order (only for today, only for morning/night tasks)
      if(isToday&&(t.grp==="morning"||t.grp==="night")){
        setCompletionLog(p=>{const day=p[vk]||[];if(day.find(e=>e.taskId===t.id))return p;return{...p,[vk]:[...day,{taskId:t.id,time:Date.now(),ordinal:day.length}]};});
      }
      groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
        setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"complete"},...(g.feed||[]).slice(0,49)]}:g));
      });
    }
    // Daily/focus tasks (created via the Focus flow) have no `grp` — recurring habit todos always do.
    // Logging this separately from `checks` keeps Focus productivity stats independent of habit consistency stats.
    if(!t.grp&&isToday)logFocusCompletion(on?-1:1);
  };
  const proofDone=(t,img)=>{
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:true}}));
    setPhotoLog(p=>({...p,[vk]:[...(p[vk]||[]),{taskId:t.id,taskName:t.text,time:new Date().toISOString(),img:img||null}]}));
    groups.filter(g=>g.tasks.includes(t.id)).forEach(()=>{
      setGroups(p=>p.map(g=>g.tasks.includes(t.id)?{...g,feed:[{user:"You",task:t.text,time:new Date().toISOString(),type:"proof",img},...(g.feed||[]).slice(0,49)]}:g));
    });
    if(!t.grp&&isToday)logFocusCompletion(1);
  };

  /* ─── Focus daily tasks: animate completion, then move to "done" ─── */
  const completeFocusTask=(t)=>{
    if(dc[t.id]||completingFocus[t.id])return;
    setCompletingFocus(p=>({...p,[t.id]:true}));        // keeps the row rendered while it animates out
    setChecks(p=>({...p,[vk]:{...(p[vk]||{}),[t.id]:true}})); // logically done now → shows in "done" once anim ends
    if(isToday)logFocusCompletion(1);
    setTimeout(()=>setCompletingFocus(p=>{const n={...p};delete n[t.id];return n;}),560);
  };
  const restoreFocusTask=(t)=>{
    setChecks(p=>{const day={...(p[vk]||{})};delete day[t.id];return{...p,[vk]:day};});
    if(isToday)logFocusCompletion(-1);
  };

  /* ─── Streaks ─── */
  const allDayTasks=useMemo(()=>{const set={};Object.keys(focusByDate).forEach(d=>{(focusByDate[d]||[]).forEach(t=>{set[t.id]=t;});});return set;},[focusByDate]);

  // Habits = recurring routine todos + graduated habit-tracker items. Inlined (rather than referencing the
  // `habits` memo declared further below) so these formulas don't depend on declaration order.
  const streak=useMemo(()=>{const hit=(d)=>{const k=dk(d);const roster=[...todos.filter(t=>habitActiveOn(t,k)),...aspirations.filter(a=>a.graduated)];const tot=roster.length;if(tot===0)return false;return roster.filter(t=>(checks[k]||{})[t.id]).length>=tot*0.5;};let s=0;const d=new Date();d.setDate(d.getDate()-1);while(hit(d)){s++;d.setDate(d.getDate()-1);}if(hit(new Date()))s++;return s;},[checks,todos,aspirations]);
  const longestHabitStreak=useMemo(()=>{const hb=[...todos,...aspirations.filter(a=>a.graduated)];const tot=hb.length;if(tot===0)return 0;const keys=Object.keys(checks).sort();let mx=0,cu=0;for(const k of keys){if(hb.filter(t=>(checks[k]||{})[t.id]).length>=tot*0.5){cu++;mx=Math.max(mx,cu);}else cu=0;}return mx;},[checks,todos,aspirations]);

  /* ─── Today Completion — HABITS ONLY (per spec). Daily Tasks, Weekly/Monthly goal steps are Focus,
     and are deliberately excluded so the Today screen measures consistency, not productivity. ─── */
  const todayCompletion=useMemo(()=>{
    const all=dayHabitRoster(vk);
    if(all.length===0)return{done:0,total:0,pct:0};
    const done=all.filter(t=>dc[t.id]).length;
    return{done,total:all.length,pct:Math.round(done/all.length*100)};
  },[todos,aspirations,dc,vk]);

  /* ─── ASPIRATION PROGRESS — compute this month's hits and on-pace status per aspiration ─── */
  // Each aspiration of type "recurring" auto-surfaces as a focus task. We treat the aspiration
  // as "hit" on a given date if the user has checked it off in aspirationChecks for that date.
  // Rather than a separate store, we reuse the main `checks` blob keyed by the aspiration's id.
  const aspirationProgress=useMemo(()=>{
    const y=now.getFullYear(),mo=now.getMonth();
    const daysInMonth=new Date(y,mo+1,0).getDate();
    const dayOfMonth=now.getDate();
    return aspirations.map(a=>{
      // Count days hit this month (for all types — used for habit tracking + analytics)
      let daysHit=0;
      for(let i=1;i<=dayOfMonth;i++){
        const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
        if((checks[k]||{})[a.id])daysHit++;
      }
      const target=a.targetDays||20;
      const expectedByNow=Math.round((target/daysInMonth)*dayOfMonth);
      const onPace=daysHit>=expectedByNow;
      const hitToday=!!(checks[dk(now)]||{})[a.id];
      const pct=target>0?Math.round((daysHit/target)*100):0;
      return{...a,daysHit,target,expectedByNow,onPace,hitToday,pct,daysInMonth,dayOfMonth};
    });
  },[aspirations,checks,now]);
  // Recurring aspirations that haven't been hit today — these surface on Today as focus tasks
  const todaysAspirations=useMemo(()=>aspirationProgress.filter(a=>a.goalType==="habit"&&!a.graduated),[aspirationProgress]);

  // Submit a new goal from the creation flow
  const submitGoal=()=>{
    if(!gcName.trim())return;
    const base={id:uid(),text:gcName.trim(),created:dk(now),status:"active",graduated:false,monthsAtTarget:0};
    let goal;
    if(gcOverride){
      goal={...base,goalType:"established",targetDays:parseInt(gcTarget)||20,dailyAction:gcAction.trim()||gcName.trim(),graduated:true};
    }else if(gcType==="measurable"){
      const totalH=parseInt(gcHours)||20;
      const deadlineDate=gcDeadline?new Date(gcDeadline):new Date(now.getFullYear(),now.getMonth()+2,0);
      const weeksLeft=Math.max(1,Math.ceil((deadlineDate-now)/(7*24*60*60*1000)));
      goal={...base,goalType:"measurable",deadline:dk(deadlineDate),totalHours:totalH,weeklyHours:Math.round(totalH/weeksLeft*10)/10,hoursLogged:0};
    }else if(gcType==="outcome"){
      const steps=gcSteps.filter(s=>s.trim()).map(s=>({id:uid(),text:s.trim(),done:false}));
      goal={...base,goalType:"outcome",steps};
    }else{
      // habit-building — implementation intention is required
      if(!gcIntention.trim())return;
      const td=parseInt(gcTarget)||20;
      goal={...base,goalType:"habit",targetDays:td,weeklyPace:Math.round((td/30)*7*10)/10,dailyAction:gcAction.trim()||gcName.trim(),implementationIntention:gcIntention.trim()};
    }
    setAspirations(p=>[...p,goal]);
    resetGc();
  };

  // Auto-derived weekly targets from monthly goals
  const weeklyTargets=useMemo(()=>{
    return aspirations.filter(a=>a.status==="active"&&!a.graduated).map(a=>{
      if(a.goalType==="measurable"){
        const remaining=Math.max(0,(a.totalHours||0)-(a.hoursLogged||0));
        if(remaining<=0)return null; // goal met — disappears from the weekly funnel
        const deadlineDate=new Date(a.deadline||dk(now));
        const weeksLeft=Math.max(1,Math.ceil((deadlineDate-now)/(7*24*60*60*1000)));
        return{goalId:a.id,text:a.text,type:"hours",target:Math.round(remaining/weeksLeft*10)/10,unit:"hrs",parentGoal:a};
      }
      if(a.goalType==="outcome"){
        const pending=(a.steps||[]).filter(s=>!s.done);
        if(pending.length===0)return null; // all steps done — disappears from the weekly funnel
        return{goalId:a.id,text:a.text,type:"steps",target:Math.min(pending.length,3),steps:pending.slice(0,3),parentGoal:a};
      }
      if(a.goalType==="habit"){
        return{goalId:a.id,text:a.text,type:"frequency",target:a.weeklyPace||5,unit:"days",parentGoal:a,dailyAction:a.dailyAction};
      }
      return null;
    }).filter(Boolean);
  },[aspirations,now]);

  // Auto-derived daily focus tasks from goals (surfaces on Today)
  const goalDerivedFocus=useMemo(()=>{
    return aspirations.filter(a=>a.status==="active").map(a=>{
      if(a.graduated&&a.goalType!=="established")return null; // graduated habits don't need focus
      const hitToday=!!(checks[dk(now)]||{})[a.id];
      if(a.goalType==="measurable")return{id:a.id,text:`${a.text} — study session`,goalId:a.id,goalType:a.goalType,hitToday,parentText:a.text};
      if(a.goalType==="outcome"){const next=(a.steps||[]).find(s=>!s.done);return next?{id:a.id,stepId:next.id,text:next.text,goalId:a.id,goalType:a.goalType,hitToday,parentText:a.text}:null;}
      if(a.goalType==="habit"||a.goalType==="established")return{id:a.id,text:a.dailyAction||a.text,goalId:a.id,goalType:a.goalType,hitToday,graduated:a.graduated,implementationIntention:a.implementationIntention,parentText:a.text};
      return null;
    }).filter(Boolean);
  },[aspirations,checks,now]);

  // Habits — graduated items
  const habits=useMemo(()=>aspirations.filter(a=>a.graduated),[aspirations]);

  /* ─── FOCUS vs HABITS — these are deliberately separate systems (per spec) and never share a completion score. ───
     Monthly Goals (Focus) = active goalDerivedFocus items, excluding "established" overrides (those are
     immediately-graduated habits and already live in the Habits tab — counting them here too would double-count
     the same action as both a habit and a focus item). */
  const monthlyGoalFocus=useMemo(()=>goalDerivedFocus.filter(f=>f.goalType!=="established"),[goalDerivedFocus]);

  // Bumps (or un-bumps) today's focus-productivity counter. Kept entirely separate from `checks` (habit data)
  // so Habit Analytics and Focus Analytics can never be derived from the same source.
  const logFocusCompletion=(delta)=>setFocusCompletionLog(p=>({...p,[dk(now)]:Math.max(0,(p[dk(now)]||0)+delta)}));

  // Completing a Monthly Goal's active step: for outcome-type goals this actually marks the STEP done
  // (which auto-advances `goalDerivedFocus` to the next step on next render — fixing the old bug where
  // checking it off here never advanced anything). For habit/measurable/established types, the daily
  // action is tracked the same way habits are (via `checks`), since there's no discrete "step" to advance.
  const completeMonthlyFocus=(item)=>{
    const wasHit=item.goalType==="outcome"?false:item.hitToday;
    if(item.goalType==="outcome"&&item.stepId){
      setAspirations(p=>p.map(a=>a.id===item.goalId?{...a,steps:(a.steps||[]).map(s=>s.id===item.stepId?{...s,done:!s.done}:s)}:a));
    }else{
      const on=!!(checks[dk(now)]||{})[item.id];
      if(!on)flashChecked(item.id);
      setChecks(p=>({...p,[dk(now)]:{...(p[dk(now)]||{}),[item.id]:!on}}));
    }
    logFocusCompletion(wasHit?-1:1);
  };

  /* ─── Weekly Goals — same outcome-style step model as Monthly, plus the legacy counter style kept for back-compat ─── */
  const weeklyActiveStep=g=>(g.steps||[]).find(s=>!s.done)||null;
  const weeklyFocusItems=useMemo(()=>{
    return wGoals.map(g=>{
      if(g.steps&&g.steps.length>0){
        const next=weeklyActiveStep(g);
        return next?{id:g.id,stepId:next.id,text:next.text,goalId:g.id,parentText:g.text,kind:"step"}:null;
      }
      return{id:g.id,text:g.text,goalId:g.id,parentText:g.text,kind:"counter",current:g.current||0,target:g.target||1};
    }).filter(Boolean);
  },[wGoals]);
  const completeWeeklyFocus=(item)=>{
    if(item.kind==="step"){
      setWGoals(p=>p.map(g=>g.id===item.goalId?{...g,steps:(g.steps||[]).map(s=>s.id===item.stepId?{...s,done:!s.done}:s)}:g));
      logFocusCompletion(1);
    }else{
      setWGoals(p=>p.map(g=>g.id===item.goalId?{...g,current:(g.current||0)+1}:g));
      logFocusCompletion(1);
    }
  };
  const addWeeklyGoal=()=>{
    if(!nWkText.trim())return;
    const steps=nWkSteps.filter(s=>s.trim()).map(s=>({id:uid(),text:s.trim(),done:false}));
    const goal=steps.length>0
      ?{id:uid(),text:nWkText.trim(),steps}
      :{id:uid(),text:nWkText.trim(),target:Math.max(1,parseInt(nWkTarget)||1),current:0};
    setWGoals(p=>[...p,goal]);
    setNWkText("");setNWkTarget("");setNWkSteps(["","",""]);setShowAddWeekly(false);
  };

  /* ─── TODAY → FOCUS: full-goal cards (expandable dropdowns of steps / occurrence checkboxes). ───
     Completed goals are filtered out so they disappear once everything inside them is checked off. */
  const weeklyFocusGoals=useMemo(()=>wGoals.map(g=>{
    if(g.steps&&g.steps.length>0){const done=g.steps.filter(s=>s.done).length;return{id:g.id,text:g.text,kind:"steps",steps:g.steps,done,total:g.steps.length,complete:done>=g.steps.length};}
    const current=g.current||0,target=g.target||1;return{id:g.id,text:g.text,kind:"count",current,target,complete:current>=target};
  }).filter(g=>!g.complete),[wGoals]);
  const monthlyFocusGoals=useMemo(()=>aspirations.filter(a=>a.status==="active"&&!a.graduated&&a.goalType!=="established").map(a=>{
    if(a.goalType==="outcome"){const steps=a.steps||[];const done=steps.filter(s=>s.done).length;return{id:a.id,text:a.text,kind:"steps",steps,done,total:steps.length,complete:steps.length>0&&done>=steps.length};}
    const hit=!!(checks[dk(now)]||{})[a.id];
    return{id:a.id,text:a.text,kind:"action",actionText:a.dailyAction||(a.goalType==="measurable"?`${a.text} — study session`:a.text),implementationIntention:a.implementationIntention,complete:hit};
  }).filter(g=>!g.complete),[aspirations,checks,now]);

  const toggleWeeklyStep=(goalId,stepId)=>{const g=wGoals.find(x=>x.id===goalId);const s=g&&(g.steps||[]).find(st=>st.id===stepId);const turningOn=s?!s.done:true;if(turningOn)flashChecked(stepId);setWGoals(p=>p.map(x=>x.id===goalId?{...x,steps:(x.steps||[]).map(st=>st.id===stepId?{...st,done:!st.done}:st)}:x));logFocusCompletion(turningOn?1:-1);};
  const setWeeklyCount=(goalId,newCount)=>{const g=wGoals.find(x=>x.id===goalId);if(!g)return;const tgt=g.target||1;const nc=Math.max(0,Math.min(tgt,newCount));logFocusCompletion(nc-(g.current||0));setWGoals(p=>p.map(x=>x.id===goalId?{...x,current:nc}:x));};
  const toggleMonthlyStep=(goalId,stepId)=>{const a=aspirations.find(x=>x.id===goalId);const s=a&&(a.steps||[]).find(st=>st.id===stepId);const turningOn=s?!s.done:true;if(turningOn)flashChecked(stepId);setAspirations(p=>p.map(x=>x.id===goalId?{...x,steps:(x.steps||[]).map(st=>st.id===stepId?{...st,done:!st.done}:st)}:x));logFocusCompletion(turningOn?1:-1);};
  const toggleMonthlyAction=(goalId)=>{const on=!!(checks[dk(now)]||{})[goalId];if(!on)flashChecked(goalId);setChecks(p=>({...p,[dk(now)]:{...(p[dk(now)]||{}),[goalId]:!on}}));logFocusCompletion(on?-1:1);};

  // Graduation check — runs when aspirationProgress updates
  // If a habit-type goal has been at ≥80% of target for 3+ months, offer graduation
  const graduationCandidates=useMemo(()=>{
    return aspirationProgress.filter(a=>a.goalType==="habit"&&!a.graduated&&a.monthsAtTarget>=3);
  },[aspirationProgress]);

  // Demotion check — graduated habits that dropped below 50% this month
  const demotionCandidates=useMemo(()=>{
    return aspirationProgress.filter(a=>a.graduated&&a.goalType!=="established"&&a.pct<50&&a.dayOfMonth>=14);
  },[aspirationProgress]);

  const graduateGoal=(id)=>{const g=aspirations.find(a=>a.id===id);if(g)setGraduatingGoal(g);};
  const finalizeGraduation=()=>{if(!graduatingGoal)return;setAspirations(p=>p.map(a=>a.id===graduatingGoal.id?{...a,graduated:true,graduatedAt:dk(now),status:"active"}:a));setGraduatingGoal(null);};
  const demoteGoal=(id)=>{setAspirations(p=>p.map(a=>a.id===id?{...a,graduated:false,monthsAtTarget:0}:a));};
  const removeGoal=(id)=>{setAspirations(p=>p.filter(a=>a.id!==id));};

  /* ─── LEGACY IMPLEMENTATION INTENTION PROMPT — auto-popup disabled (no more nudges) ─── */
  // The overlay no longer surfaces on its own. Implementation intentions can still be set
  // when editing a goal directly; this just stops the periodic prompt from interrupting.
  // (Effect intentionally left as a no-op.)

  const saveIntentionPrompt=()=>{
    if(!intentionPromptFor)return;
    const goalId=intentionPromptFor.id;
    if(intentionPromptText.trim()){
      setAspirations(p=>p.map(a=>a.id===goalId?{...a,implementationIntention:intentionPromptText.trim()}:a));
    }
    setIntentionPromptDismissed(p=>({...p,[goalId]:true}));
    setIntentionPromptFor(null);
    setIntentionPromptText("");
  };
  const skipIntentionPrompt=()=>{
    if(!intentionPromptFor)return;
    setIntentionPromptDismissed(p=>({...p,[intentionPromptFor.id]:true}));
    setIntentionPromptFor(null);
    setIntentionPromptText("");
  };

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
      const all=[...activeTodos(k),...dayFocus];
      if(all.length===0)continue;
      const done=all.filter(t=>ch[t.id]).length;
      sum+=(done/all.length)*100;days++;
    }
    return days>0?Math.round(sum/days):0;
  },[checks,todos,focusByDate,vDate]);

  // Avg focus task completion per day

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

  /* ═══ HABIT ANALYTICS — consistency only. Never mixed with Focus metrics below. ═══ */
  const habitPctForDate=(k)=>dayHabitPct(k);
  const habitToday=todayCompletion.pct;
  const habitWeekly=useMemo(()=>{let sum=0;for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()-i);sum+=habitPctForDate(dk(d));}return Math.round(sum/7);},[checks,todos,aspirations,now]);
  const habitMonthly=useMemo(()=>{const dom=now.getDate();let sum=0;for(let i=1;i<=dom;i++){sum+=habitPctForDate(dk(new Date(now.getFullYear(),now.getMonth(),i)));}return Math.round(sum/dom);},[checks,todos,aspirations,now]);
  const habitPrevWeekly=useMemo(()=>{let sum=0;for(let i=7;i<14;i++){const d=new Date(now);d.setDate(d.getDate()-i);sum+=habitPctForDate(dk(d));}return Math.round(sum/7);},[checks,todos,aspirations,now]);
  const habitTrendDelta=habitWeekly-habitPrevWeekly;
  const habitTrendArrow=habitTrendDelta>2?"↑":habitTrendDelta<-2?"↓":"→";
  const habitTrendColor=habitTrendDelta>2?C.green:habitTrendDelta<-2?C.red:C.textDim;
  const habitConsistency14d=useMemo(()=>{const out=[];for(let i=13;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);out.push({date:`${d.getMonth()+1}/${d.getDate()}`,pct:habitPctForDate(dk(d))});}return out;},[checks,todos,aspirations,now]);

  /* ═══ FOCUS ANALYTICS — productivity only (items completed per day), never a completion %. ═══ */
  const focusToday=focusCompletionLog[dk(now)]||0;
  const focusWeeklyAvg=useMemo(()=>{let sum=0;for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()-i);sum+=focusCompletionLog[dk(d)]||0;}return Math.round((sum/7)*10)/10;},[focusCompletionLog,now]);
  const focusMonthlyAvg=useMemo(()=>{const dom=now.getDate();let sum=0;for(let i=1;i<=dom;i++){sum+=focusCompletionLog[dk(new Date(now.getFullYear(),now.getMonth(),i))]||0;}return Math.round((sum/dom)*10)/10;},[focusCompletionLog,now]);
  const focusTotalThisMonth=useMemo(()=>{const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;return Object.entries(focusCompletionLog).filter(([k])=>k.startsWith(ym)).reduce((a,[,v])=>a+v,0);},[focusCompletionLog,now]);
  const focusBestDay=useMemo(()=>Object.values(focusCompletionLog).reduce((a,v)=>Math.max(a,v),0),[focusCompletionLog]);
  const focusBestWeek=useMemo(()=>{const keys=Object.keys(focusCompletionLog).sort();let best=0;for(let i=0;i<keys.length;i++){const start=new Date(keys[i]);let sum=0;for(let d=0;d<7;d++){const k=dk(new Date(start.getFullYear(),start.getMonth(),start.getDate()+d));sum+=focusCompletionLog[k]||0;}best=Math.max(best,sum);}return best;},[focusCompletionLog]);
  const focusBestMonth=useMemo(()=>{const byMonth={};Object.entries(focusCompletionLog).forEach(([k,v])=>{const ym=k.slice(0,7);byMonth[ym]=(byMonth[ym]||0)+v;});return Object.values(byMonth).reduce((a,v)=>Math.max(a,v),0);},[focusCompletionLog]);
  const focusTrend14d=useMemo(()=>{const out=[];for(let i=13;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);out.push({date:`${d.getMonth()+1}/${d.getDate()}`,items:focusCompletionLog[dk(d)]||0});}return out;},[focusCompletionLog,now]);

  // Weekly recap (in terms of completion %)
  const weekRecap=useMemo(()=>{
    let totPct=0,days=0,best=0,bestD="",perf=0;
    const daily=[];
    for(let i=6;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=dk(d);
      const ch=checks[k]||{};
      const dayFocus=focusByDate[k]||[];
      const all=[...activeTodos(k),...dayFocus];
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
      const all=[...activeTodos(k),...dayFocus];
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

  /* ─── ACTIONABLE ANALYTICS — insight, trends, win rate, behavior, recommendation ─── */
  // Previous week comparison for trends
  const prevWeekAvg=useMemo(()=>{
    let totPct=0,days=0;
    for(let i=13;i>=7;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=dk(d);const ch=checks[k]||{};const dayFocus=focusByDate[k]||[];
      const all=[...activeTodos(k),...dayFocus];
      if(all.length===0)continue;
      const done=all.filter(t=>ch[t.id]).length;
      totPct+=(done/all.length)*100;days++;
    }
    return days>0?Math.round(totPct/days):0;
  },[checks,todos,focusByDate]);
  const trendDelta=weekRecap.avg-prevWeekAvg;
  const trendArrow=trendDelta>2?"↑":trendDelta<-2?"↓":"→";
  const trendColor=trendDelta>2?C.green:trendDelta<-2?C.red:C.textDim;
  // Win rate: days at ≥85% completion this week
  const winRate=useMemo(()=>{
    let wins=0;weekRecap.daily.forEach(d=>{if(d.pct>=85)wins++;});return wins;
  },[weekRecap]);
  // Daily performance label for today
  const dailyLabel=todayCompletion.pct>=85?{text:"Strong Day",color:C.green}:todayCompletion.pct>=60?{text:"Solid Day",color:C.accent}:todayCompletion.pct>0?{text:"Needs Work",color:C.red}:{text:"Day Ahead",color:C.textDim};
  // Behavior pattern — compare morning vs evening completion across the month
  const behaviorPattern=useMemo(()=>{
    const mornIds=activeTodos(dk(now)).filter(t=>t.grp==="morning").map(t=>t.id);
    const nightIds=activeTodos(dk(now)).filter(t=>t.grp==="night").map(t=>t.id);
    if(mornIds.length===0&&nightIds.length===0)return null;
    let mornHit=0,mornTot=0,nightHit=0,nightTot=0,focusHit=0,focusTot=0;
    Object.entries(checks).forEach(([k,ch])=>{
      mornIds.forEach(id=>{mornTot++;if(ch[id])mornHit++;});
      nightIds.forEach(id=>{nightTot++;if(ch[id])nightHit++;});
      (focusByDate[k]||[]).forEach(t=>{focusTot++;if(ch[t.id])focusHit++;});
    });
    const mornRate=mornTot>0?(mornHit/mornTot)*100:0;
    const nightRate=nightTot>0?(nightHit/nightTot)*100:0;
    const focusRate=focusTot>0?(focusHit/focusTot)*100:0;
    const diff=Math.abs(mornRate-nightRate);
    if(diff>20){return mornRate>nightRate?"Morning strong, evenings inconsistent":"Evening strong, mornings inconsistent";}
    if(focusRate>70&&(mornRate+nightRate)/2<60)return "Strong on focus tasks, weak on routines";
    if(focusRate<40&&(mornRate+nightRate)/2>70)return "Routines locked in, focus tasks slipping";
    if(weekRecap.avg>=80)return "Consistent across the board";
    if(weekRecap.avg<40)return "Wide gap between intent and action";
    return "Steady pattern, room to push";
  },[checks,todos,focusByDate,weekRecap]);
  // Weekly Insight — one sentence summarizing what the data says
  const weeklyInsight=useMemo(()=>{
    if(Object.keys(checks).length===0)return "Track a few days to see your patterns.";
    if(trendDelta>5)return `You're up ${Math.round(trendDelta)}% from last week — momentum is real.`;
    if(trendDelta<-5)return `Down ${Math.abs(Math.round(trendDelta))}% from last week. Worth a look at what shifted.`;
    if(winRate>=5)return `${winRate} winning days this week. You've found your rhythm.`;
    if(winRate===0&&weekRecap.avg<50)return "Zero days above 85% this week. Maybe the bar is too high — consider trimming.";
    if(weakHabits.length>=3)return `${weakHabits[0].name} and ${weakHabits.length-1} other habits are slipping.`;
    return weekLabel==="Good"?"Solid week. Keep the foundation.":weekLabel==="Okay"?"Hovering near average. One change could move the needle.":"Tough week. Pick one thing tomorrow and protect it.";
  },[checks,trendDelta,winRate,weekRecap,weakHabits,weekLabel]);
  // Recommendation — single actionable next step
  const recommendation=useMemo(()=>{
    if(weakHabits.length>0)return `Tomorrow: prioritize ${weakHabits[0].name}.`;
    if(focusWeeklyAvg<2)return "Tomorrow: knock out at least 2 focus items.";
    if(winRate===0)return "Tomorrow: aim for one task before noon to build momentum.";
    if(todayCompletion.pct<50&&todayCompletion.total>0)return `${todayCompletion.total-todayCompletion.done} habits left today. Pick one, do it now.`;
    return "Keep doing what's working. Small wins compound.";
  },[weakHabits,focusWeeklyAvg,winRate,todayCompletion]);

  /* ═══ PDF EXPORT — builds a branded, print-ready report and hands it to the browser's PDF engine. ═══
     Client-side + dependency-free so it works the same on Vercel as locally. */
  const generateExport=()=>{
    // Resolve the selected timeframe into a [start,end] window.
    const today=new Date();let start,end=new Date(today),rangeLabel;
    if(exportRange==="7"){start=new Date(today);start.setDate(start.getDate()-6);rangeLabel="Last 7 Days";}
    else if(exportRange==="30"){start=new Date(today);start.setDate(start.getDate()-29);rangeLabel="Last 30 Days";}
    else if(exportRange==="month"){start=new Date(today.getFullYear(),today.getMonth(),1);rangeLabel=today.toLocaleDateString("en-US",{month:"long",year:"numeric"});}
    else{start=exportCustomStart?new Date(exportCustomStart):new Date(today.getFullYear(),today.getMonth(),1);end=exportCustomEnd?new Date(exportCustomEnd):new Date(today);rangeLabel=`${fd(start)} – ${fd(end)}`;}
    const inRange=k=>{const d=new Date(k);return d>=new Date(dk(start))&&d<=new Date(dk(end));};
    const dayCount=Math.max(1,Math.round((new Date(dk(end))-new Date(dk(start)))/86400000)+1);

    // Habits
    const habitAll=[...todos,...aspirations.filter(a=>a.graduated)];
    let habitSum=0,habitDays=0;
    Object.keys(checks).filter(inRange).forEach(k=>{if(habitAll.length===0)return;const ch=checks[k]||{};habitSum+=habitAll.filter(t=>ch[t.id]).length/habitAll.length*100;habitDays++;});
    const habitAvg=habitDays>0?Math.round(habitSum/habitDays):0;
    // Focus
    const focusEntries=Object.entries(focusCompletionLog).filter(([k])=>inRange(k));
    const focusTotal=focusEntries.reduce((a,[,v])=>a+v,0);
    const focusAvg=Math.round((focusTotal/dayCount)*10)/10;
    const focusBest=focusEntries.reduce((a,[,v])=>Math.max(a,v),0);

    const esc=s=>String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
    const acc="#0AA063",ink="#16203A",dim="#6B7280",line="#E8E3D8",amber="#E0820A",blue="#3B82F6",purple="#7C3AED",red="#DC2626";
    const money=n=>`${n<0?"-":""}$${Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const card=(label,val,sub,color)=>`<div style="flex:1;min-width:118px;border:1px solid ${line};border-radius:12px;padding:15px 16px;background:#fff"><div style="font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:${dim};font-weight:700;margin-bottom:7px">${esc(label)}</div><div style="font-size:26px;font-weight:800;color:${color||ink};line-height:1">${esc(val)}</div>${sub?`<div style="font-size:10px;color:${dim};margin-top:4px">${esc(sub)}</div>`:""}</div>`;
    const cards=arr=>`<div style="display:flex;gap:9px;flex-wrap:wrap">${arr.join("")}</div>`;
    const sectionTitle=(t,sub)=>`<h2 style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:6px;margin:32px 0 14px">${esc(t)}${sub?`<span style="float:right;font-size:10px;letter-spacing:0.04em;color:${dim};font-weight:600;text-transform:none">${esc(sub)}</span>`:""}</h2>`;
    const bar=(label,pct,color,right)=>`<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12px;color:${ink};margin-bottom:4px"><span>${esc(label)}</span><span style="font-weight:700;color:${color||acc}">${esc(right!=null?right:pct+"%")}</span></div><div style="height:7px;background:${line};border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.min(100,Math.max(0,pct))}%;background:${color||acc};border-radius:4px"></div></div></div>`;
    const table=(heads,rows,aligns)=>rows.length?`<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:11.5px"><tr style="text-align:left;color:${dim};border-bottom:1.5px solid ${line}">${heads.map((h,i)=>`<th style="padding:6px 4px;font-weight:700;text-align:${(aligns&&aligns[i])||"left"}">${esc(h)}</th>`).join("")}</tr>${rows.map(r=>`<tr style="border-bottom:1px solid ${line}">${r.map((c,i)=>`<td style="padding:6px 4px;text-align:${(aligns&&aligns[i])||"left"}">${c}</td>`).join("")}</tr>`).join("")}</table>`:"";
    const note=t=>`<p style="color:${dim};font-size:12px;margin:6px 0 0">${esc(t)}</p>`;

    let body="";

    // ── OVERVIEW (always) ──
    body+=sectionTitle("Overview",rangeLabel);
    body+=cards([card("Habit Completion",habitAvg+"%",`${habitDays} days tracked`,acc),card("Current Streak",streak+"d"),card("Longest Streak",longestHabitStreak+"d"),card("Focus Done",focusTotal,`${focusAvg}/day avg`,blue)]);
    if(weeklyInsight)body+=`<div style="margin-top:12px;padding:13px 16px;border-radius:10px;background:#F4FBF7;border:1px solid #CDEBDD"><div style="font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:${acc};font-weight:700;margin-bottom:4px">Insight</div><div style="font-size:13px;color:${ink}">${esc(weeklyInsight)}</div>${recommendation?`<div style="font-size:12px;color:${dim};margin-top:6px">→ ${esc(recommendation)}</div>`:""}</div>`;

    // ── ANALYTICS ──
    if(exportSections.analytics){
      body+=sectionTitle("Habit Analytics","Consistency");
      body+=cards([card("Completion",habitAvg+"%",rangeLabel,acc),card("Current Streak",streak+"d"),card("Longest Streak",longestHabitStreak+"d")]);
      const ranked=sortedH.slice().sort((a,b)=>b.rate-a.rate);
      if(ranked.length)body+=`<div style="margin-top:14px">${ranked.slice(0,10).map(h=>bar(h.name,h.rate,h.rate>=70?acc:h.rate>=40?amber:red)).join("")}</div>`;
      else body+=note("No habit data in this range yet.");
      body+=sectionTitle("Focus Analytics","Productivity");
      body+=cards([card("Total Completed",focusTotal,rangeLabel,blue),card("Daily Average",focusAvg,"items / day",blue),card("Best Day",focusBest,"items")]);
    }

    // ── GOALS ──
    if(exportSections.goals){
      body+=sectionTitle("Goals");
      const wkStep=wGoals.filter(g=>g.steps&&g.steps.length>0);
      const wkCount=wGoals.filter(g=>(!g.steps||!g.steps.length)&&g.target);
      const active=aspirations.filter(a=>a.status==="active"&&!a.graduated);
      const outcome=active.filter(a=>a.goalType==="outcome"),measurable=active.filter(a=>a.goalType==="measurable"),habitG=active.filter(a=>a.goalType==="habit");
      if(!wkStep.length&&!wkCount.length&&!active.length)body+=note("No goals in progress.");
      if(wkStep.length||wkCount.length){body+=`<div style="font-size:11px;font-weight:700;color:${amber};text-transform:uppercase;letter-spacing:0.06em;margin:6px 0 8px">Weekly</div>`;
        wkStep.forEach(g=>{const d=g.steps.filter(s=>s.done).length;body+=bar(g.text,Math.round(d/g.steps.length*100),amber,`${d}/${g.steps.length} steps`);});
        wkCount.forEach(g=>{body+=bar(g.text,Math.round((g.progress||0)/g.target*100),amber,`${g.progress||0}/${g.target}`);});}
      if(outcome.length||measurable.length||habitG.length){body+=`<div style="font-size:11px;font-weight:700;color:${purple};text-transform:uppercase;letter-spacing:0.06em;margin:16px 0 8px">Monthly</div>`;
        outcome.forEach(a=>{const t=(a.steps||[]).length,d=(a.steps||[]).filter(s=>s.done).length;body+=bar(a.text,t?Math.round(d/t*100):0,purple,`${d}/${t} steps`);});
        measurable.forEach(a=>{const g=a.totalHours||0,h=a.hoursLogged||0;body+=bar(a.text,g?Math.round(h/g*100):0,purple,`${h}/${g} hrs`);});
        habitG.forEach(a=>{body+=bar(a.text+" (habit)",0,purple,`${a.weeklyPace||5}×/wk pace`);});}
    }

    // ── HEALTH: WORKOUTS + STRENGTH + BODYWEIGHT ──
    if(exportSections.workouts){
      const ws=wHist.filter(w=>inRange(dk(new Date(w.date))));
      const sets=ws.reduce((a,w)=>a+w.exercises.reduce((x,e)=>x+e.sets.length,0),0);
      const vol=ws.reduce((a,w)=>a+w.exercises.reduce((x,e)=>x+e.sets.reduce((y,s)=>y+(s.w||0)*(s.r||0),0),0),0);
      body+=sectionTitle("Workouts",rangeLabel);
      body+=cards([card("Sessions",ws.length),card("Total Sets",sets),card("Volume",Math.round(vol).toLocaleString()+" lb"),card("Bodyweight",(bwLog.length?bwLog[bwLog.length-1].weight:0)+" lb")]);
      // split frequency
      const splitFreq={};ws.forEach(w=>{splitFreq[w.split]=(splitFreq[w.split]||0)+1;});
      const sf=Object.entries(splitFreq).sort((a,b)=>b[1]-a[1]);
      if(sf.length)body+=`<div style="margin-top:14px">${sf.map(([s,n])=>bar(s.toUpperCase(),Math.round(n/ws.length*100),acc,`${n}×`)).join("")}</div>`;
      // strength PRs (computed within range)
      const exMap={};ws.forEach(w=>(w.exercises||[]).forEach(ex=>{const mx=Math.max(0,...(ex.sets||[]).map(s=>s.w||0));if(mx>0)(exMap[ex.name]=exMap[ex.name]||[]).push({date:w.date,w:mx});}));
      const exStats=Object.entries(exMap).map(([name,arr])=>{arr.sort((a,b)=>new Date(a.date)-new Date(b.date));const wv=arr.map(a=>a.w);return{name,latest:wv[wv.length-1],pr:Math.max(...wv),change:wv[wv.length-1]-wv[0],sessions:arr.length};}).sort((a,b)=>b.pr-a.pr);
      if(exStats.length){body+=`<div style="font-size:11px;font-weight:700;color:${acc};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 0">Strength · Personal Records</div>`;
        body+=table(["Exercise","Latest","PR","Change","Sessions"],exStats.slice(0,16).map(e=>[esc(e.name),`${e.latest} lb`,`<b>${e.pr} lb</b>`,`<span style="color:${e.change>0?acc:e.change<0?red:dim}">${e.change>0?"+":""}${e.change} lb</span>`,e.sessions]),["left","right","right","right","right"]);}
      // recent sessions
      if(ws.length){body+=`<div style="font-size:11px;font-weight:700;color:${dim};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 0">Recent Sessions</div>`;
        body+=table(["Date","Split","Exercises","Sets"],ws.slice().reverse().slice(0,12).map(w=>[esc(fd(w.date)),`<span style="text-transform:uppercase">${esc(w.split)}</span>`,w.exercises.length,w.exercises.reduce((a,e)=>a+e.sets.length,0)]),["left","left","right","right"]);}
      // bodyweight
      if(bwLog.length>=2){const cur=bwLog[bwLog.length-1].weight,st=bwLog[0].weight,ch=(cur-st).toFixed(1);
        body+=`<div style="font-size:11px;font-weight:700;color:${dim};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 8px">Bodyweight</div>`;
        body+=cards([card("Current",cur+" lb"),card("Start",st+" lb"),card("Change",(ch>0?"+":"")+ch+" lb",null,ch>0?acc:red)]);}
    }

    // ── HEALTH: NUTRITION ──
    if(exportSections.nutrition){
      body+=sectionTitle("Nutrition",rangeLabel);
      const days=Object.entries(diet).filter(([k])=>inRange(k)).sort((a,b)=>new Date(b[0])-new Date(a[0]));
      if(!days.length)body+=note("No nutrition logged in this range.");
      else{
        const avg=key=>Math.round(days.reduce((a,[,v])=>a+(v[key]||0),0)/days.length);
        const ac=avg("calories"),ap=avg("protein"),acb=avg("carbs"),af=avg("fat"),aw=avg("water");
        body+=cards([card("Avg Calories",ac,`goal ${dietGoals.calories}`,amber),card("Avg Protein",ap+"g",`goal ${dietGoals.protein}g`,red),card("Avg Carbs",acb+"g",`goal ${dietGoals.carbs}g`,blue),card("Avg Fat",af+"g",`goal ${dietGoals.fat}g`,purple),card("Avg Water",aw+" oz",`goal ${dietGoals.water} oz`,"#06B6D4")]);
        body+=`<div style="margin-top:14px">${[["Calories",ac,dietGoals.calories,amber],["Protein",ap,dietGoals.protein,red],["Carbs",acb,dietGoals.carbs,blue],["Fat",af,dietGoals.fat,purple]].map(([l,v,g,c])=>bar(l+" adherence",g?Math.round(v/g*100):0,c,`${v} / ${g}`)).join("")}</div>`;
        body+=table(["Date","Cal","P","C","F","Water"],days.slice(0,14).map(([k,v])=>[esc(fd(k)),Math.round(v.calories||0),`${Math.round(v.protein||0)}g`,`${Math.round(v.carbs||0)}g`,`${Math.round(v.fat||0)}g`,`${Math.round(v.water||0)}oz`]),["left","right","right","right","right","right"]);
      }
    }

    // ── BUDGET ──
    if(exportSections.budget){
      body+=sectionTitle("Budget");
      const nw=acctNow.checking+acctNow.savings+acctNow.investment;
      body+=cards([card("Net Worth",money(nw),null,acc),card("Debt",money(Math.max(0,acctNow.credit)),null,red)]);
      // cash flow in range
      const txR=allTx.filter(t=>inRange(t.date));
      const income=txR.filter(t=>t.type==="in").reduce((a,t)=>a+t.amount,0);
      const expense=txR.filter(t=>t.type==="out").reduce((a,t)=>a+t.amount,0);
      body+=`<div style="margin-top:10px">${cards([card("Income",money(income),rangeLabel,acc),card("Expenses",money(expense),rangeLabel,red),card("Net Flow",money(income-expense),null,income-expense>=0?acc:red)])}</div>`;
      body+=`<div style="font-size:11px;font-weight:700;color:${dim};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 8px">Accounts</div>`;
      body+=cards(ACCT_META.map(a=>card(a.label,money(acctNow[a.key]||0))));
      // recent transactions
      const recent=txR.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,14);
      if(recent.length){body+=`<div style="font-size:11px;font-weight:700;color:${dim};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 0">Recent Transactions</div>`;
        body+=table(["Date","Description","Type","Amount"],recent.map(t=>[esc(fd(t.date)),esc(t.desc||"—"),t.type==="in"?"Income":t.type==="out"?"Expense":"Transfer",`<span style="color:${t.type==="in"?acc:t.type==="out"?red:dim}">${t.type==="out"?"-":t.type==="in"?"+":""}${money(t.amount).replace("$","$")}</span>`]),["left","left","left","right"]);}
      // subscriptions
      if(subscriptions.length){const subTot=subscriptions.reduce((a,s)=>a+(parseFloat(s.cost)||0),0);
        body+=`<div style="font-size:11px;font-weight:700;color:${dim};text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 0">Subscriptions · ${money(subTot)}/mo</div>`;
        body+=table(["Name","Category","Bills","Cost"],subscriptions.map(s=>[esc(s.name),esc(s.category||"—"),s.billDay?`Day ${s.billDay}`:"—",money(parseFloat(s.cost)||0)]),["left","left","left","right"]);}
    }

    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Progress Report — ${esc(rangeLabel)}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>@page{margin:42px 38px}@media print{.noprint{display:none}}body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${ink};margin:0;padding:38px 40px 56px;background:#fff}
h2{page-break-after:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid}
.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ${acc};padding-bottom:16px;margin-bottom:6px}
.foot{position:fixed;bottom:14px;left:0;right:0;text-align:center;font-size:9px;color:${dim}}</style></head>
<body>
<div class="hd"><div><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${acc}">Progress</div><div style="font-size:13px;color:${dim};margin-top:3px;font-weight:500">Personal Performance Report</div></div>
<div style="text-align:right;font-size:11px;color:${dim}"><div style="font-weight:700;color:${ink};font-size:13px">${esc(rangeLabel)}</div><div>Generated ${esc(new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}))}</div></div></div>
${body}
<div class="foot">Progress · Personal Performance Report · ${esc(rangeLabel)} · ${esc(new Date().toLocaleDateString("en-US"))}</div>
</body></html>`;


    // Trigger a real file download of the report (works everywhere, including mobile/PWA) ...
    const downloadHtml=()=>{
      try{
        const blob=new Blob([html],{type:"text/html"});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=`Progress-Report-${rangeLabel.replace(/[^a-z0-9]+/gi,"-")}.html`;
        document.body.appendChild(a);a.click();
        setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1500);
      }catch(e){setSaveError("Couldn't generate the report file.");}
    };
    // ... and also open it in a hidden iframe and fire the print dialog, so you can "Save as PDF" directly.
    // The iframe avoids the popup-blocker problem that silently broke the old window.open() approach.
    try{
      const iframe=document.createElement("iframe");
      iframe.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;";
      document.body.appendChild(iframe);
      const doc=iframe.contentWindow.document;
      doc.open();doc.write(html);doc.close();
      let printed=false;
      const doPrint=()=>{
        if(printed)return;printed=true;
        try{iframe.contentWindow.focus();iframe.contentWindow.print();}
        catch(e){downloadHtml();} // printing unsupported (some webviews) → fall back to file download
        setTimeout(()=>{try{document.body.removeChild(iframe);}catch(_){}}, 60000);
      };
      iframe.onload=()=>setTimeout(doPrint,250);
      setTimeout(doPrint,800); // safety net if onload doesn't fire after document.write
    }catch(e){
      downloadHtml(); // iframe path failed entirely → guaranteed file download
    }
    setShowExport(false);
  };

  /* ─── MORNING LAUNCH MESSAGE — first-hour framing generator ─── */
  // Returns a single Fraunces-italic sentence that frames today. Generated from actual data.
  // Only shows if: (a) time is between 5am-12pm, (b) not yet dismissed for today, (c) not on today's start
  // Compute yesterday's completion + recovery-mode data. If yPct < 40%, we show the Recovery Card
  // instead of the regular launchMessage. This uses abstinence-violation-effect research — rather
  // than framing a bad day as failure, we externally attribute it (via day-of-week patterns) and
  // offer one specific small win to collapse the shame cascade.
  const recoveryData=useMemo(()=>{
    const h=now.getHours();
    if(h<5||h>=13)return null;
    const todayKey=dk(now);
    if(launchDismissed[todayKey])return null;
    const y=now.getFullYear(),mo=now.getMonth(),d=now.getDate();
    const yesterday=new Date(y,mo,d-1);const yKey=dk(yesterday);
    const yDow=yesterday.getDay();
    const yCh=checks[yKey]||{};
    const yAll=[...todos];
    if(yAll.length===0)return null;
    const yDone=yAll.filter(t=>yCh[t.id]).length;
    const yPct=Math.round(yDone/yAll.length*100);
    if(yPct>=40)return null; // not a rough day — normal launch card applies
    // Check day-of-week miss rate over last 30 days — if yesterday's DOW is historically hard
    // (completion rate below 40%), frame it externally. Otherwise say "yesterday was a rough one."
    const dowDays=[];
    for(let i=1;i<=30;i++){
      const dt=new Date(y,mo,d-i);if(dt.getDay()!==yDow)continue;
      const k=dk(dt);const ch=checks[k]||{};
      if(yAll.length===0)continue;
      const done=yAll.filter(t=>ch[t.id]).length;
      dowDays.push(done/yAll.length);
    }
    const dowAvg=dowDays.length>=2?dowDays.reduce((a,v)=>a+v,0)/dowDays.length:null;
    const dowName=["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"][yDow];
    const todayDow=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()];
    const externallyAttributed=dowAvg!==null&&dowAvg<0.4;
    const headline=externallyAttributed
      ?`${dowName} are hard for you. Let's make ${todayDow} count.`
      :`Yesterday was a rough one. Today's a new day.`;
    // Pick one specific action: easiest uncompleted morning habit today
    const dcToday=checks[todayKey]||{};
    const morningCandidates=activeTodos(dk(now)).filter(t=>t.grp==="morning"&&!dcToday[t.id]);
    let startHere=null;
    if(morningCandidates.length>0){
      // Prefer easy difficulty. If none, pick the one with the highest historical completion rate.
      const easies=morningCandidates.filter(t=>t.diff==="easy");
      if(easies.length>0){startHere=easies[0];}
      else{
        const ranked=morningCandidates.map(t=>{
          let hit=0,tot=0;
          for(let i=1;i<=30;i++){const dt=new Date(y,mo,d-i);const k=dk(dt);const ch=checks[k]||{};tot++;if(ch[t.id])hit++;}
          return{t,rate:tot>0?hit/tot:0};
        }).sort((a,b)=>b.rate-a.rate);
        startHere=ranked[0]?.t||morningCandidates[0];
      }
    }
    return{headline,startHere,yPct};
  },[now,launchDismissed,checks,todos]);

  const launchMessage=useMemo(()=>{
    if(recoveryData)return null; // recovery card takes over
    const h=now.getHours();
    if(h<5||h>=13)return null;
    const todayKey=dk(now);
    if(launchDismissed[todayKey])return null;
    // Gather signals
    const y=now.getFullYear(),mo=now.getMonth(),d=now.getDate();
    const dow=now.getDay();
    const yesterday=new Date(y,mo,d-1);const yKey=dk(yesterday);
    const yCh=checks[yKey]||{};
    const yAll=[...todos];
    const yDone=yAll.filter(t=>yCh[t.id]).length;
    const yPct=yAll.length>0?Math.round(yDone/yAll.length*100):0;
    // Count days hit this week
    const weekStart=new Date(y,mo,d-(dow===0?6:dow-1));
    let weekHits=0,weekTotal=0;
    for(let i=0;i<7;i++){const wd=new Date(weekStart);wd.setDate(wd.getDate()+i);if(wd>now)break;const k=dk(wd);const ch=checks[k]||{};const all=[...activeTodos(k)];if(all.length===0)continue;const done=all.filter(t=>ch[t.id]).length;if(done/all.length>=0.8)weekHits++;weekTotal++;}
    // Struggling aspirations
    const behind=aspirationProgress.filter(a=>a.goalType==="habit"&&!a.graduated&&!a.hitToday&&!a.onPace);
    const closeToTarget=aspirationProgress.filter(a=>a.goalType==="habit"&&!a.graduated&&a.daysHit>=a.target-2&&a.daysHit<a.target);
    // Pick the most resonant message
    if(closeToTarget.length>0){const a=closeToTarget[0];return`${a.text} is at ${a.daysHit} of ${a.target} this month. Today's rep could close it.`;}
    if(weekHits>=3&&dow>=4)return`${weekHits} strong days this week. Hit today and the week is yours.`;
    if(weekHits===0&&dow>=3)return "Week's been soft so far. One good day changes the shape.";
    if(behind.length>=2)return`${behind.length} goals are off pace. Pick the one that matters and start there.`;
    if(behind.length===1)return`${behind[0].text} is behind. Today's the correction.`;
    if(dow===1)return "New week. What does a strong Monday look like?";
    if(dow===0)return "Sunday. End the week with intention, not exhaustion.";
    if(dow===5)return "Friday. One more day of momentum before the weekend.";
    if(todos.length>10)return `${todos.length} habits to move through today. Start with the one that's hardest.`;
    return "New day. What are you giving it?";
  },[now,launchDismissed,checks,todos,aspirationProgress,recoveryData]);
  const dismissLaunch=()=>{const k=dk(now);setLaunchDismissed(p=>({...p,[k]:true}));};

  /* ─── EVENING RECONCILIATION — closes the day, 8pm–midnight ─── */
  const showEveningCard=(()=>{
    const h=now.getHours();
    if(h<20)return false;
    const k=dk(now);
    if(eveningClosed[k])return false;
    return true;
  })();
  const closeTheDay=()=>{
    const k=dk(now);
    setEveningClosed(p=>({...p,[k]:true}));
    if(eveningCarry.trim()){
      // Store as a reflection so the weekly review can see it
      setReflections(p=>[...p,{id:uid(),date:k,prompt:"What I'm carrying into tomorrow",answer:eveningCarry.trim()}]);
    }
    setEveningCardOpen(false);
    setEveningCarry("");
  };

  /* ─── PATTERN SYNTHESIS — detects cross-week behavioral patterns ─── */
  // Runs over the last 21+ days of data and surfaces correlations and consistent patterns
  // that would be hard for the user to notice themselves. Returns an array of insight strings.
  const patternInsights=useMemo(()=>{
    const insights=[];
    const mornIds=activeTodos(dk(now)).filter(t=>t.grp==="morning").map(t=>t.id);
    const nightIds=activeTodos(dk(now)).filter(t=>t.grp==="night").map(t=>t.id);
    // Gather last 21 days of completion data
    const dayData=[];
    for(let i=0;i<21;i++){
      const d=new Date();d.setDate(d.getDate()-i);
      const k=dk(d);const ch=checks[k]||{};
      const mornDone=mornIds.length>0?mornIds.filter(id=>ch[id]).length/mornIds.length:null;
      const nightDone=nightIds.length>0?nightIds.filter(id=>ch[id]).length/nightIds.length:null;
      const all=[...activeTodos(k)];
      const total=all.length>0?all.filter(t=>ch[t.id]).length/all.length:0;
      dayData.push({date:k,dow:d.getDay(),mornDone,nightDone,total,ch});
    }
    const nonEmpty=dayData.filter(d=>d.total>0);
    if(nonEmpty.length<7)return[]; // not enough data
    // ─── Pattern 1: Morning vs Evening consistent gap
    const mornAvg=dayData.filter(d=>d.mornDone!==null).reduce((a,d)=>a+d.mornDone,0)/Math.max(1,dayData.filter(d=>d.mornDone!==null).length);
    const nightAvg=dayData.filter(d=>d.nightDone!==null).reduce((a,d)=>a+d.nightDone,0)/Math.max(1,dayData.filter(d=>d.nightDone!==null).length);
    if(Math.abs(mornAvg-nightAvg)>0.25&&mornIds.length>0&&nightIds.length>0){
      const strong=mornAvg>nightAvg?"mornings":"evenings";
      const weak=mornAvg>nightAvg?"evenings":"mornings";
      const strongPct=Math.round((mornAvg>nightAvg?mornAvg:nightAvg)*100);
      const weakPct=Math.round((mornAvg>nightAvg?nightAvg:mornAvg)*100);
      insights.push({type:"rhythm",text:`Your ${strong} hit ${strongPct}% on average. Your ${weak} average ${weakPct}%. That gap has held for 3 weeks.`});
    }
    // ─── Pattern 2: Day-of-week strength/weakness
    const dowBuckets=[[],[],[],[],[],[],[]];
    nonEmpty.forEach(d=>dowBuckets[d.dow].push(d.total));
    const dowAvg=dowBuckets.map(b=>b.length>0?b.reduce((a,v)=>a+v,0)/b.length:null);
    const dowNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const validDows=dowAvg.map((a,i)=>({a,i})).filter(x=>x.a!==null);
    if(validDows.length>=4){
      const best=validDows.reduce((a,b)=>a.a>b.a?a:b);
      const worst=validDows.reduce((a,b)=>a.a<b.a?a:b);
      if(best.a-worst.a>0.25){
        insights.push({type:"dow",text:`${dowNames[best.i]}s are your strongest day (${Math.round(best.a*100)}% avg). ${dowNames[worst.i]}s are your weakest (${Math.round(worst.a*100)}%).`});
      }
    }
    // ─── Pattern 3: Correlation between specific habits
    // When habit A is done, how often is habit B done?
    if(todos.length>=4){
      const pairs=[];
      for(let i=0;i<todos.length;i++){
        for(let j=0;j<todos.length;j++){
          if(i===j)continue;
          const a=todos[i],b=todos[j];
          const aDays=nonEmpty.filter(d=>d.ch[a.id]);
          const bGivenA=aDays.filter(d=>d.ch[b.id]).length;
          const bAll=nonEmpty.filter(d=>d.ch[b.id]).length;
          if(aDays.length>=5&&bAll<nonEmpty.length){
            const pWithA=bGivenA/aDays.length;
            const pBase=bAll/nonEmpty.length;
            if(pWithA>=0.85&&pBase<0.6&&pWithA-pBase>0.25){
              pairs.push({a:a.text,b:b.text,strength:pWithA-pBase});
            }
          }
        }
      }
      pairs.sort((x,y)=>y.strength-x.strength);
      if(pairs[0]){insights.push({type:"link",text:`You rarely miss "${pairs[0].b}" on days when you do "${pairs[0].a}". The link is stronger than average.`});}
    }
    // ─── Pattern 4: Aspirations momentum
    const habitAsps=aspirations.filter(a=>a.goalType==="habit"&&!a.graduated);
    if(habitAsps.length>0){
      const winning=habitAsps.filter(a=>{const p=aspirationProgress.find(x=>x.id===a.id);return p&&p.onPace&&p.pct>=60;});
      if(winning.length>=2)insights.push({type:"momentum",text:`${winning.length} habits are on pace this month. You're building real consistency.`});
    }
    // ─── Pattern 5: Streak detection
    let currentStreak=0;
    for(let i=0;i<dayData.length;i++){if(dayData[i].total>=0.7)currentStreak++;else break;}
    if(currentStreak>=5)insights.push({type:"streak",text:`${currentStreak} days in a row above 70%. Protect this.`});
    // ─── Pattern 6: Quiet struggle signal
    const last7=nonEmpty.slice(0,7);
    if(last7.length>=5){
      const trend=last7.slice(0,3).reduce((a,d)=>a+d.total,0)/3 - last7.slice(-3).reduce((a,d)=>a+d.total,0)/3;
      if(trend<-0.2)insights.push({type:"warning",text:`Last 3 days averaged ${Math.round(trend*-100)}% lower than the 3 before. Something shifted.`});
      else if(trend>0.2)insights.push({type:"rising",text:`Last 3 days averaged ${Math.round(trend*100)}% higher than the 3 before. Momentum is building.`});
    }
    return insights.slice(0,4);
  },[checks,todos,aspirations,aspirationProgress]);

  // Photo stats
  const photoStreak=useMemo(()=>{let s=0;const d=new Date();while(true){const k=dk(d);if((photoLog[k]||[]).length>0)s++;else break;d.setDate(d.getDate()-1);}return s;},[photoLog]);
  const allPhotos=useMemo(()=>{const out=[];Object.entries(photoLog).sort(([a],[b])=>b.localeCompare(a)).forEach(([date,items])=>{items.forEach(p=>out.push({...p,date}));});return out;},[photoLog]);

  /* ─── Calendar days (relative to vDate) ─── */
  const calDays=useMemo(()=>{
    const days=[];
    for(let i=-14;i<=14;i++){
      const d=new Date(vDate);d.setDate(d.getDate()+i);
      const k=dk(d);
      const pct=dayHabitPct(k);
      days.push({date:new Date(d),key:k,pct,isToday:k===dk(now),dayNum:d.getDate(),dayName:d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)});
    }
    return days;
  },[vDate,checks,todos,aspirations]);
  useEffect(()=>{if(calRef.current)calRef.current.scrollLeft=14*56-100;},[vk]);
  useEffect(()=>{if(dietCalRef.current)dietCalRef.current.scrollLeft=14*52-120;},[dietDate,gView,menuTab]);


  /* ─── Storage — bulletproof save system ─── */
  // LOAD: read main blob + separate photoLog key
  useEffect(()=>{try{
    let s=localStorage.getItem("dash-v18");if(!s)s=localStorage.getItem("dash-v17");
    if(s){const d=JSON.parse(s);
      if(d.todos)setTodos(d.todos);if(d.focusByDate)setFocusByDate(d.focusByDate);if(d.checks)setChecks(d.checks);
      if(d.wGoals)setWGoals(d.wGoals);if(d.mGoals)setMGoals(d.mGoals);if(d.wHist)setWHist(d.wHist);
      if(d.bwLog)setBwLog(d.bwLog);if(d.txns)setTxns(d.txns);if(d.groups)setGroups(d.groups);if(d.splits)setSplits(d.splits);
      if(d.settings)setSettings({...defSettings,...d.settings});
      if(d.theme==="light"||d.theme==="dark")setTheme(d.theme);
      if(d.curWkState)setCurWkState(d.curWkState);if(d.chains)setChains(d.chains);if(d.reflections)setReflections(d.reflections);
      if(d.reviews)setReviews(d.reviews);if(d.weekPriorities)setWeekPriorities(d.weekPriorities);
      if(d.reflectDismissed)setReflectDismissed(d.reflectDismissed);if(d.reviewDismissed)setReviewDismissed(d.reviewDismissed);if(d.launchDismissed)setLaunchDismissed(d.launchDismissed);if(d.eveningClosed)setEveningClosed(d.eveningClosed);if(d.intentionPromptDismissed)setIntentionPromptDismissed(d.intentionPromptDismissed);
      if(d.completionLog)setCompletionLog(d.completionLog);if(d.activeSession)setActiveSession(d.activeSession);
      if(d.diet)setDiet(d.diet);if(d.dietGoals)setDietGoals({...defDietGoals,...d.dietGoals});
      if(d.aspirations)setAspirations(d.aspirations);
      if(d.videoJournal)setVideoJournal(d.videoJournal);
      if(d.accounts)setAccounts({checking:"",savings:"",cash:"",investment:"",credit:"",...d.accounts});
      if(d.subscriptions)setSubscriptions(d.subscriptions);
      if(d.focusCompletionLog)setFocusCompletionLog(d.focusCompletionLog);
      if(d.habitOrder)setHabitOrder(d.habitOrder);
      // Migrate photoLog from main blob to separate key (one-time)
      if(d.photoLog&&d.photoLog.length>0){try{localStorage.setItem("dash-v18-photos",JSON.stringify(d.photoLog));}catch(e){}}
    }
    // Load photoLog from its own key (split to save ~500KB-2MB of main blob space)
    try{const ph=localStorage.getItem("dash-v18-photos");if(ph)setPhotoLog(JSON.parse(ph));}catch(e){}
  }catch(e){console.error("Load failed:",e);}
  },[]);

  // SAVE HELPER — writes to localStorage with error surfacing
  const trySave=(key,data)=>{
    try{localStorage.setItem(key,JSON.stringify(data));setSaveError(null);return true;}
    catch(e){
      console.error("Save failed:",key,e);
      if(e.name==="QuotaExceededError")setSaveError("Storage full — clear proof photos in Settings");
      else setSaveError("Save failed — your changes may not persist");
      return false;
    }
  };

  // CRITICAL STATE — saved immediately on every change, no debounce. These are the things
  // that absolutely cannot be lost: your check-offs, your focus tasks, your todos, your aspirations.
  const criticalRef=useRef({checks,focusByDate,todos,aspirations});

  /* ─── FOCUS ROLLOVER ─── carry unfinished focus tasks forward; only past the transfer hour ─── */
  const rollRef=useRef({checks,settings});
  useEffect(()=>{rollRef.current={checks,settings};},[checks,settings]);
  useEffect(()=>{
    const nextKey=k=>{const d=new Date(k);d.setDate(d.getDate()+1);return dk(d);};
    const run=()=>{
      const {checks:ck,settings:st}=rollRef.current;
      const H=parseInt(st.focusTransferHour);const hour=isNaN(H)?22:H;
      const now=new Date();const todayK=dk(now);
      // Day is "closed" for focus once the clock passes the transfer hour → leftovers go to the next day.
      const activeDay=now.getHours()>=hour?nextKey(todayK):todayK;
      setFocusByDate(prev=>{
        const work={...prev};
        let landing=[...(prev[activeDay]||[])];
        const ids=new Set(landing.map(t=>t.id));
        let moved=false;
        Object.keys(prev).forEach(k=>{
          if(new Date(k)>=new Date(activeDay))return;          // only days before the active day roll over
          const list=prev[k]||[];
          const dayChecks=ck[k]||{};
          const incomplete=list.filter(t=>!dayChecks[t.id]);
          if(incomplete.length===0)return;
          work[k]=list.filter(t=>dayChecks[t.id]);             // completed stay as that day's history
          incomplete.forEach(t=>{if(!ids.has(t.id)){landing.push(t);ids.add(t.id);}});
          moved=true;
        });
        if(!moved)return prev;
        work[activeDay]=landing;
        return work;
      });
    };
    const t=setTimeout(run,1500);              // let storage load first
    const id=setInterval(run,60000);           // re-check each minute so it fires when the hour passes
    return()=>{clearTimeout(t);clearInterval(id);};
  },[]);
  criticalRef.current={checks,focusByDate,todos,aspirations};
  useEffect(()=>{
    const blob=JSON.parse(localStorage.getItem("dash-v18")||"{}");
    blob.checks=checks;blob.focusByDate=focusByDate;blob.todos=todos;blob.aspirations=aspirations;
    // Strip photoLog from main blob if it migrated
    delete blob.photoLog;
    trySave("dash-v18",blob);
  },[checks,focusByDate,todos,aspirations]);

  // NON-CRITICAL STATE — saved with 400ms debounce. These matter but a 400ms loss window is acceptable.
  useEffect(()=>{const t=setTimeout(()=>{
    const blob=JSON.parse(localStorage.getItem("dash-v18")||"{}");
    Object.assign(blob,{wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,curWkState,chains,reflections,reviews,weekPriorities,reflectDismissed,reviewDismissed,launchDismissed,eveningClosed,intentionPromptDismissed,completionLog,activeSession,theme,videoJournal,accounts,subscriptions,focusCompletionLog,habitOrder,diet,dietGoals});
    delete blob.photoLog;
    trySave("dash-v18",blob);
  },400);return()=>clearTimeout(t);},[wGoals,mGoals,wHist,bwLog,txns,groups,splits,settings,curWkState,chains,reflections,reviews,weekPriorities,reflectDismissed,reviewDismissed,launchDismissed,eveningClosed,intentionPromptDismissed,completionLog,activeSession,theme,videoJournal,accounts,subscriptions,focusCompletionLog,habitOrder,diet,dietGoals]);

  // PHOTO LOG — saved to its own key, only when photos change
  useEffect(()=>{if(photoLog.length>0)trySave("dash-v18-photos",photoLog);},[photoLog]);

  // VISIBILITY CHANGE — force-save everything when user switches tabs, locks phone, or backgrounds app
  useEffect(()=>{
    const handleVisChange=()=>{
      if(document.visibilityState==="hidden"){
        // Synchronous save of all critical state — this MUST complete before iOS suspends JS
        const c=criticalRef.current;
        try{
          const blob=JSON.parse(localStorage.getItem("dash-v18")||"{}");
          blob.checks=c.checks;blob.focusByDate=c.focusByDate;blob.todos=c.todos;blob.aspirations=c.aspirations;
          delete blob.photoLog;
          localStorage.setItem("dash-v18",JSON.stringify(blob));
        }catch(e){console.error("Visibility save failed:",e);}
      }
    };
    document.addEventListener("visibilitychange",handleVisChange);
    return()=>document.removeEventListener("visibilitychange",handleVisChange);
  },[]);

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
  // Sync write of just the active session — fires on every keystroke so a phone lock can't lose data
  const syncSession=(s)=>{try{const raw=localStorage.getItem("dash-v18");const d=raw?JSON.parse(raw):{};d.activeSession=s;delete d.photoLog;localStorage.setItem("dash-v18",JSON.stringify(d));}catch(e){setSaveError("Workout save failed — try clearing photos in Settings");}};
  const uSet=(ei,si,f,v)=>{
    if(activeSession){setActiveSession(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;syncSession(n);return n;});}
    else setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;return n;});
  };
  const aSet=ei=>{
    if(activeSession){setActiveSession(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});syncSession(n);return n;});}
    else setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});return n;});
  };
  const rSet=ei=>{
    if(activeSession){setActiveSession(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();syncSession(n);return n;});}
    else setCurWkState(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();return n;});
  };
  // Start a workout: take the current curWkState (or build from split) and lock it as activeSession
  const startSession=(splitKey)=>{
    const exs=(splits[splitKey]||[]).map(name=>{const ls=[...wHist].reverse().find(h=>h.split===splitKey);const le=ls?.exercises?.find(e=>e.name===name);return{name,sets:Array.from({length:le?le.sets.length:3},(_,i)=>({w:0,r:0}))};});
    const sess={split:splitKey,startTime:Date.now(),exercises:exs};
    setActiveSession(sess);syncSession(sess);
    setDoneEx({});
  };
  const finishSession=()=>{
    if(!activeSession)return;
    setFinishingSession(true);
    setTimeout(()=>{
      setWHist(p=>[...p,{id:uid(),date:dk(now),split:activeSession.split,exercises:activeSession.exercises,duration:Date.now()-activeSession.startTime}]);
      setActiveSession(null);syncSession(null);setDoneEx({});setFinishingSession(false);setSessionMinimized(false);
    },1800);
  };
  const cancelSession=()=>setShowCancelConfirm(true);
  const confirmCancel=()=>{setActiveSession(null);syncSession(null);setDoneEx({});setShowCancelConfirm(false);setSessionMinimized(false);};
  const saveWk=()=>{if(!curWkState)return;setWHist(p=>[...p,{id:uid(),date:dk(now),split:curWkState.split,exercises:curWkState.exercises}]);setConfetti(true);setTimeout(()=>{setConfetti(false);setCurWkState(p=>({...p,exercises:p.exercises.map(ex=>({name:ex.name,sets:ex.sets.map(()=>({w:0,r:0}))}))}));setDoneEx({});},2000);};
  const lastSess=useMemo(()=>{const k=activeSession?activeSession.split:gSplit;return k?wHist.filter(h=>h.split===k).sort((a,b)=>new Date(b.date)-new Date(a.date))[0]||null:null;},[wHist,gSplit,activeSession]);
  // Format stopwatch
  const sessionElapsed=activeSession?Math.floor((Date.now()-activeSession.startTime)/1000):0;

  /* ─── HEALTH: Diet helpers ─── */
  const dietDay=diet[dietDate]||{calories:0,protein:0,carbs:0,fat:0,water:0};
  const setDietMetric=(key,val)=>setDiet(p=>({...p,[dietDate]:{calories:0,protein:0,carbs:0,fat:0,water:0,...(p[dietDate]||{}),[key]:Math.max(0,val)}}));
  const addDietMetric=(key,delta)=>setDietMetric(key,(dietDay[key]||0)+delta);
  const commitDietAdd=()=>{
    const cur=diet[dietDate]||{calories:0,protein:0,carbs:0,fat:0,water:0};
    const next={...cur};let any=false;
    ["calories","protein","carbs","fat"].forEach(k=>{const v=parseFloat(dietAdd[k]);if(!isNaN(v)&&v!==0){next[k]=Math.max(0,(cur[k]||0)+v);any=true;}});
    if(any)setDiet(p=>({...p,[dietDate]:next}));
    setDietAdd({calories:"",protein:"",carbs:"",fat:""});
  };

  /* ─── HEALTH: Strength progression — per exercise, max weight per day ─── */
  const strengthData=useMemo(()=>{
    const exSet=new Set();const byDate={};
    // Every exercise you've put into ANY split becomes a tracked line — even before it's logged,
    // it shows up in the legend/filter. Finishing a workout then fills that line with data points.
    Object.values(splits).forEach(list=>(list||[]).forEach(name=>exSet.add(name)));
    // In-progress exercises (current draft / active session) count too, so a just-typed exercise appears.
    (curWkState?.exercises||[]).forEach(ex=>exSet.add(ex.name));
    (activeSession?.exercises||[]).forEach(ex=>exSet.add(ex.name));
    wHist.forEach(w=>{
      (w.exercises||[]).forEach(ex=>{
        const mx=Math.max(0,...(ex.sets||[]).map(s=>s.w||0));
        exSet.add(ex.name);
        if(mx>0){byDate[w.date]=byDate[w.date]||{date:w.date};byDate[w.date][ex.name]=Math.max(byDate[w.date][ex.name]||0,mx);}
      });
    });
    const rows=Object.values(byDate).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>({...r,label:fd(r.date)}));
    return{exercises:[...exSet],rows};
  },[wHist,splits,curWkState,activeSession]);
  const strRows=useMemo(()=>{
    if(strRange==="all")return strengthData.rows;
    const cut=new Date(Date.now()-parseInt(strRange)*86400000);
    return strengthData.rows.filter(r=>new Date(r.date)>=cut);
  },[strengthData,strRange]);
  const strShownEx=strExSel||strengthData.exercises;

  /* ─── Per-exercise progression stats for the organized cards view ─── */
  const exerciseStats=useMemo(()=>{
    const cut=strRange==="all"?null:new Date(Date.now()-parseInt(strRange)*86400000);
    const byEx={}; // name -> {dateKey: maxWeight}
    wHist.forEach(w=>{
      if(cut&&new Date(w.date)<cut)return;
      (w.exercises||[]).forEach(ex=>{
        const mx=Math.max(0,...(ex.sets||[]).map(s=>s.w||0));
        if(mx>0){byEx[ex.name]=byEx[ex.name]||{};byEx[ex.name][w.date]=Math.max(byEx[ex.name][w.date]||0,mx);}
      });
    });
    // include every split exercise (even with no data yet) + assign each to its split
    const names=new Set();const splitOf={};
    Object.entries(splits).forEach(([sp,list])=>(list||[]).forEach(n=>{names.add(n);if(!splitOf[n])splitOf[n]=sp;}));
    Object.keys(byEx).forEach(n=>names.add(n));
    const stats=[...names].map(name=>{
      const days=byEx[name]||{};
      const series=Object.entries(days).map(([date,weight])=>({date,label:fd(date),weight})).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const ws=series.map(s=>s.weight);
      const latest=ws.length?ws[ws.length-1]:0,first=ws.length?ws[0]:0,pr=ws.length?Math.max(...ws):0;
      return{name,split:splitOf[name]||"other",series,latest,first,pr,change:latest-first,sessions:series.length};
    });
    // group by split, preserving split order then "other"
    const order=[...Object.keys(splits),"other"];
    const groups=order.map(sp=>({split:sp,items:stats.filter(s=>s.split===sp)})).filter(g=>g.items.length>0);
    return{stats,groups};
  },[wHist,splits,strRange]);

  /* ─── HEALTH: Nutrition history for the grouped bar chart ─── */
  const nutritionRows=useMemo(()=>{
    const cut=nutriRange==="all"?null:new Date(Date.now()-parseInt(nutriRange)*86400000);
    return Object.entries(diet).map(([date,v])=>({date,label:fd(date),calories:v.calories||0,protein:v.protein||0,carbs:v.carbs||0,fat:v.fat||0,water:v.water||0}))
      .filter(r=>!cut||new Date(r.date)>=cut).sort((a,b)=>new Date(a.date)-new Date(b.date));
  },[diet,nutriRange]);
  const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${m}:${String(sec).padStart(2,"0")}`;};

  /* ─── Budget: calendar plumbing ─── */
  const bY=bMonth.getFullYear(),bM=bMonth.getMonth(),bDIM=new Date(bY,bM+1,0).getDate(),bFD=new Date(bY,bM,1).getDay(),bCM=bY===now.getFullYear()&&bM===now.getMonth();
  const bDK=d=>`${bY}-${String(bM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const bGT=d=>txns[bDK(d)]||[];
  // Net cash-flow for a day — transfers are excluded since they move money between accounts rather than in/out overall.
  const bGN=d=>bGT(d).reduce((a,t)=>t.type==="in"?a+t.amount:t.type==="out"?a-t.amount:a,0);

  /* ─── Ledger: every account balance is opening balance + every transaction that ever touched it. ───
     Balances are NEVER stored directly — they're always derived here, so editing or deleting any past
     transaction automatically keeps every total correct. */
  const allTx=useMemo(()=>Object.entries(txns).flatMap(([date,arr])=>(arr||[]).map(t=>({...t,date}))),[txns]);
  const computeBalances=cutoffKey=>{
    const bal={checking:parseFloat(accounts.checking)||0,savings:parseFloat(accounts.savings)||0,credit:parseFloat(accounts.credit)||0,investment:parseFloat(accounts.investment)||0};
    for(const t of allTx){
      if(cutoffKey&&t.date>cutoffKey)continue;
      if(t.type==="transfer"){
        if(bal[t.account]!==undefined)bal[t.account]-=t.amount;
        // Paying a credit card down REDUCES debt rather than adding a deposit to it.
        if(bal[t.toAccount]!==undefined)bal[t.toAccount]+=(t.toAccount==="credit"?-t.amount:t.amount);
      }else if(bal[t.account]!==undefined){
        // For the credit account, "in" (a refund/credit) reduces debt and "out" (a purchase) increases it.
        const sign=t.account==="credit"?-1:1;
        bal[t.account]+=(t.type==="in"?sign:-sign)*t.amount;
      }
    }
    return bal;
  };
  const acctNow=useMemo(()=>computeBalances(null),[allTx,accounts]);
  const acct30Ago=useMemo(()=>computeBalances(dk(new Date(Date.now()-30*86400000))),[allTx,accounts]);
  const netWorth=acctNow.checking+acctNow.savings+acctNow.investment;
  const debt=Math.max(0,acctNow.credit);
  const netWorthGoal=parseFloat(settings.netWorthGoal)||1000;
  const debtThreshold=parseFloat(settings.debtWarningThreshold)||1000;
  const netWorthColor=gradColor(netWorth<=0?0:Math.min(1,netWorth/netWorthGoal));
  const debtColor=gradColor(1-Math.min(1,debt/Math.max(1,debtThreshold)));

  /* ─── Add / edit / delete a ledger transaction (the only way balances ever change) ─── */
  const txValid=!!txF.amount&&parseFloat(txF.amount)>0&&!!txF.account&&(txF.type!=="transfer"||(!!txF.toAccount&&txF.toAccount!==txF.account));
  const aTx=()=>{
    if(!txValid||!selDay)return;
    const k=bDK(selDay);
    const rec={id:editingTx?.id||uid(),type:txF.type,amount:parseFloat(txF.amount),desc:txF.desc||"",account:txF.account,...(txF.type==="transfer"?{toAccount:txF.toAccount}:{})};
    setTxns(p=>{
      if(editingTx){ // moving (or keeping) the edited record into the currently-selected day, removed from wherever it was
        const without={...p,[editingTx.day]:(p[editingTx.day]||[]).filter(t=>t.id!==editingTx.id)};
        return{...without,[k]:[...(without[k]||[]),rec]};
      }
      return{...p,[k]:[...(p[k]||[]),rec]};
    });
    setTxF({type:"out",amount:"",desc:"",account:"",toAccount:""});setEditingTx(null);
  };
  const rTx=(d,id)=>{const k=bDK(d);setTxns(p=>({...p,[k]:(p[k]||[]).filter(t=>t.id!==id)}));if(editingTx?.day===k&&editingTx?.id===id)cancelEditTx();};
  const startEditTx=(d,t)=>{setEditingTx({day:bDK(d),id:t.id});setTxF({type:t.type,amount:String(t.amount),desc:t.desc||"",account:t.account||"",toAccount:t.toAccount||""});};
  const cancelEditTx=()=>{setEditingTx(null);setTxF({type:"out",amount:"",desc:"",account:"",toAccount:""});};
  // Income/expense totals for the month — transfers are excluded since they're neither income nor a true expense.
  const bTot=useMemo(()=>{let i=0,o=0;for(let d=1;d<=bDIM;d++)bGT(d).forEach(t=>{if(t.type==="in")i+=t.amount;else if(t.type==="out")o+=t.amount;});return{i,o,net:i-o};},[txns,bY,bM,bDIM]);

  /* ─── Subscriptions ─── */
  const subTotal=useMemo(()=>subscriptions.reduce((a,s)=>a+(parseFloat(s.cost)||0),0),[subscriptions]);
  const upcomingBills=useMemo(()=>{const today=now.getDate();return subscriptions.map(s=>{const day=Math.min(31,Math.max(1,parseInt(s.billDay)||1));let du=day-today;if(du<0)du+=30;return{...s,day,daysUntil:du};}).sort((a,b)=>a.daysUntil-b.daysUntil);},[subscriptions,now]);
  const addSubscription=()=>{if(!subForm.name.trim())return;setSubscriptions(p=>[...p,{id:uid(),name:subForm.name.trim(),cost:subForm.cost||"0",billDay:subForm.billDay||"1",category:subForm.category.trim()}]);setSubForm({name:"",cost:"",billDay:"",category:""});setAddSub(false);};
  const removeSubscription=id=>setSubscriptions(p=>p.filter(s=>s.id!==id));

  /* ─── Video Journal calendar + storage ─── */
  const vjY=vjMonth.getFullYear(),vjM=vjMonth.getMonth(),vjDIM=new Date(vjY,vjM+1,0).getDate(),vjFD=new Date(vjY,vjM,1).getDay(),vjCM=vjY===now.getFullYear()&&vjM===now.getMonth();
  const vjDK=d=>`${vjY}-${String(vjM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const vjEntries=d=>videoJournal[vjDK(d)]||[];
  // When a day is selected, hydrate object URLs for its entries from IndexedDB.
  useEffect(()=>{
    if(vjSel==null)return;
    const key=vjDK(vjSel);const entries=videoJournal[key]||[];let cancelled=false;
    entries.forEach(en=>{if(vjUrls[en.id])return;vjGet(en.id).then(blob=>{if(blob&&!cancelled){const url=URL.createObjectURL(blob);setVjUrls(p=>p[en.id]?p:{...p,[en.id]:url});}}).catch(()=>{});});
    return()=>{cancelled=true;};
  },[vjSel,vjMonth,videoJournal]);
  const vjAdd=async(blob,duration)=>{
    if(vjSel==null)return;
    const key=vjDK(vjSel);const id=uid();
    try{await vjPut(id,blob);}catch(e){setSaveError("Couldn't save video — storage may be full");return;}
    const url=URL.createObjectURL(blob);
    setVjUrls(p=>({...p,[id]:url}));
    setVideoJournal(p=>({...p,[key]:[...(p[key]||[]),{id,time:new Date().toISOString(),duration:duration||0,note:"",mime:blob.type||"video/webm"}]}));
  };
  const vjUpload=e=>{const f=e.target.files?.[0];if(f)vjAdd(f,0);if(vjFileRef.current)vjFileRef.current.value="";};
  const vjRemove=async(key,id)=>{try{await vjDel(id);}catch(e){}setVideoJournal(p=>({...p,[key]:(p[key]||[]).filter(en=>en.id!==id)}));setVjUrls(p=>{const n={...p};if(n[id])URL.revokeObjectURL(n[id]);delete n[id];return n;});};
  const vjSetNote=(key,id,note)=>setVideoJournal(p=>({...p,[key]:(p[key]||[]).map(en=>en.id===id?{...en,note}:en)}));

  /* ─── Goal editing (monthly aspirations + manual weekly) ─── */
  const openGoalEdit=(goal,kind)=>{
    setEditGoal({kind,goal});setEgText(goal.text||"");setEgDeadline(goal.deadline||"");setEgSteps((goal.steps||[]).map(s=>({...s})));
    if(kind==="weekly")setEgNum(String(goal.target||""));
    else if(goal.goalType==="habit")setEgNum(String(goal.targetDays||""));
    else if(goal.goalType==="measurable")setEgNum(String(goal.totalHours||""));
    else setEgNum("");
  };
  const saveGoalEdit=()=>{
    if(!editGoal||!egText.trim())return;
    const{kind,goal}=editGoal;
    if(kind==="weekly"){const t=Math.max(1,parseInt(egNum)||goal.target||1);setWGoals(p=>p.map(g=>g.id===goal.id?{...g,text:egText.trim(),target:t}:g));}
    else{setAspirations(p=>p.map(a=>{if(a.id!==goal.id)return a;const u={...a,text:egText.trim()};if(a.goalType==="habit")u.targetDays=Math.max(1,parseInt(egNum)||a.targetDays);else if(a.goalType==="measurable"){u.totalHours=Math.max(1,parseInt(egNum)||a.totalHours);u.deadline=egDeadline||a.deadline;}else if(a.goalType==="outcome")u.steps=egSteps.filter(s=>s.text&&s.text.trim());return u;}));}
    setEditGoal(null);
  };
  const deleteGoalEdit=()=>{if(!editGoal)return;const{kind,goal}=editGoal;if(kind==="weekly")setWGoals(p=>p.filter(g=>g.id!==goal.id));else removeGoal(goal.id);setEditGoal(null);};

  /* ─── Footer page navigation with swipe ─── */
  const pageOrder=["today","groups","analytics","goals","workout","budget"];
  const curPage=menuTab||tab||"today";
  const goPage=(key)=>{
    const from=pageOrder.indexOf(curPage),to=pageOrder.indexOf(key);
    setNavDir(to>from?1:to<from?-1:0);
    if(key==="workout"||key==="budget"){setMenuTab(key);setTab(null);}else{setTab(key);setMenuTab(null);}
  };
  const swipeNav=(dir)=>{const i=pageOrder.indexOf(curPage);const ni=i+dir;if(ni<0||ni>=pageOrder.length)return;goPage(pageOrder[ni]);};
  // Page-level swipe: only fires for clearly-horizontal gestures that don't start on a swipe-to-delete row.
  const pageTouch=useRef({x:0,y:0,active:false});
  const onPageTouchStart=e=>{if(e.target.closest("[data-swiperow]")){pageTouch.current.active=false;return;}const t=e.touches[0];pageTouch.current={x:t.clientX,y:t.clientY,active:true};};
  const onPageTouchEnd=e=>{if(!pageTouch.current.active)return;pageTouch.current.active=false;const t=e.changedTouches[0];const dx=t.clientX-pageTouch.current.x,dy=t.clientY-pageTouch.current.y;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6){swipeNav(dx<0?1:-1);}};

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
    else{removeHabit(editTask.task.id);}
    setEditTask(null);
  };

  const startAddForm=(target)=>{setAddForm(target);setFText("");setFDiff(target==="focus"?"hard":"easy");setFProof(false);setFGrp(target==="focus"?"morning":target);};
  const submitAddForm=()=>{
    if(!fText.trim())return;
    const task={id:uid(),text:fText.trim(),diff:fDiff,proof:fProof};
    if(addForm==="focus"){addFocus(task);}
    else{setTodos(p=>[...p,{createdOn:dk(now),...task,grp:fGrp}]);}
    setAddForm(null);setFText("");
  };

  /* ─── NEW: Quick capture, reflections, sunday review ─── */
  const weekKey=(d=new Date())=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return dk(x);};
  const curWeekKey=weekKey();
  const todayK=dk(now);
  useEffect(()=>{if(!quickText.trim()){setQuickPreview(null);return;}setQuickPreview(parseQuick(quickText));},[quickText]);
  const submitQuick=()=>{
    if(!quickPreview||!quickPreview.text)return;
    const{text,diff,proof,when,recurring,group}=quickPreview;
    const targetDate=whenToDate(when);const tk=dk(targetDate);
    const newTask={id:uid(),text,diff,proof};
    if(recurring)setTodos(p=>[...p,{createdOn:dk(now),...newTask,grp:group||"general"}]);
    else setFocusByDate(p=>({...p,[tk]:[...(p[tk]||[]),newTask]}));
    setQuickText("");setQuickPreview(null);setShowQuick(false);
  };
  const todayReflection=reflections[todayK];
  const reflectReady=now.getHours()>=settings.reflectHour&&!todayReflection&&!reflectDismissed[todayK];
  const startReflect=()=>{setReflectAnswers(["",""]);setShowReflect(true);};
  const saveReflect=()=>{
    const prompts=pickPrompts(todayCompletion.pct);
    const entries=prompts.map((p,i)=>({prompt:p,answer:reflectAnswers[i]||"",time:new Date().toISOString()})).filter(e=>e.answer.trim());
    if(entries.length>0)setReflections(p=>({...p,[todayK]:entries}));
    setShowReflect(false);
  };
  const reviewReady=now.getDay()===settings.reviewDay&&!reviews[curWeekKey]&&!reviewDismissed[curWeekKey];
  const startReview=()=>{setReviewStep(0);setReviewKept({});setReviewPriorities(weekPriorities[0]?[...weekPriorities,"","",""].slice(0,3):["","",""]);setShowReview(true);};
  const saveReview=()=>{
    setReviews(p=>({...p,[curWeekKey]:{numbers:weekRecap,kept:reviewKept,priorities:reviewPriorities.filter(x=>x.trim()),time:new Date().toISOString()}}));
    setWeekPriorities(reviewPriorities.filter(x=>x.trim()));
    setShowReview(false);
  };
  const weekReflections=useMemo(()=>{const out=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dk(d);if(reflections[k])out.push({date:k,entries:reflections[k]});}return out;},[reflections]);
  const weakHabitsForReview=useMemo(()=>sortedH.filter(h=>h.rate<40).slice(0,5),[sortedH]);
  const strongHabitsForReview=useMemo(()=>sortedH.filter(h=>h.rate>=80).slice(0,5),[sortedH]);

  const[justChecked,setJustChecked]=useState({});
  // Chain builder state
  const[buildingChain,setBuildingChain]=useState(false);
  const[chainName,setChainName]=useState("");
  const[chainPicks,setChainPicks]=useState([]);
  const[stackStep,setStackStep]=useState(0); // 0=anchor, 1=new habit, 2=name/confirm
  const saveChain=()=>{if(!chainName.trim()||chainPicks.length<2)return;setChains(p=>[...p,{id:uid(),name:chainName.trim(),taskIds:chainPicks}]);setChainName("");setChainPicks([]);setBuildingChain(false);};
  const removeChain=id=>setChains(p=>p.filter(c=>c.id!==id));
  // Build a map: taskId → chain it belongs to
  const taskToChain=useMemo(()=>{const m={};chains.forEach(c=>{c.taskIds.forEach((tid,i)=>{m[tid]={chain:c,index:i,total:c.taskIds.length};});});return m;},[chains]);
  // Find which task in a chain is the next one to check (first uncompleted)
  const chainNextId=useMemo(()=>{const m={};chains.forEach(c=>{const next=c.taskIds.find(tid=>!dc[tid]);if(next)m[c.id]=next;});return m;},[chains,dc]);
  const flashChecked=(id)=>{setJustChecked(p=>({...p,[id]:true}));setTimeout(()=>setJustChecked(p=>{const n={...p};delete n[id];return n;}),420);};
  const handleCheck=(t)=>{
    const wasOff=!dc[t.id];
    toggle(t);
    if(wasOff){
      setJustChecked(p=>({...p,[t.id]:true}));
      setTimeout(()=>setJustChecked(p=>{const n={...p};delete n[t.id];return n;}),420);
    }
  };

  /* ─── Task Row ─── */
  // Golden fluid completion flashes — goalId → timestamp
  const[goldFlash,setGoldFlash]=useState({});
  const flashGold=id=>{setGoldFlash(p=>({...p,[id]:true}));setTimeout(()=>setGoldFlash(p=>{const n={...p};delete n[id];return n;}),900);};

  // Swipe-to-delete helper for goal rows
  const SwipeRow=({children,onDelete,bg,border,padY=12})=>{
    const[sx,setSx]=useState(0);const[ss,setSs]=useState(null);
    const ts=e=>{if(!onDelete)return;setSs(e.touches[0].clientX);};
    const tm=e=>{if(ss===null)return;const dx=e.touches[0].clientX-ss;if(dx<0)setSx(Math.max(dx,-80));};
    const te=()=>{if(ss===null)return;setSs(null);if(sx<-50)setSx(-72);else setSx(0);};
    return(<div data-swiperow style={{position:"relative",marginBottom:8}}>
      {onDelete&&sx<0&&<div onClick={()=>{onDelete();setSx(0);}} style={{position:"absolute",right:0,top:0,bottom:0,width:72,background:C.red,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></div>}
      <div onTouchStart={ts} onTouchMove={tm} onTouchEnd={te} style={{position:"relative",padding:`${padY}px 14px`,borderRadius:10,background:bg||C.surface,border:border||`1px solid ${C.hairline}`,overflow:"hidden",transform:`translateX(${sx}px)`,transition:ss===null?"transform 0.3s ease":"none"}}>
        {children}
      </div>
    </div>);
  };

  // Golden liquid fill overlay — reusable for goal completions
  const GoldLiquid=({flashing,done})=>{
    if(!done&&!flashing)return null;
    return(<div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:10,pointerEvents:"none",borderLeft:`3px solid ${C.accentBright}`}}>
      {!flashing&&done&&<div style={{position:"absolute",inset:0,background:theme==="light"?"rgba(217,119,6,0.14)":"rgba(245,158,11,0.20)"}}/>}
      {flashing&&<div className="sweep-fill" style={{background:theme==="light"?"rgba(217,119,6,0.18)":"rgba(245,158,11,0.28)"}}/>}
    </div>);
  };

  const TRow=({t,big,onEdit,onDelete})=>{
    const on=dc[t.id];const flash=justChecked[t.id];const link=taskToChain[t.id];const isNext=link&&chainNextId[link.chain.id]===t.id&&!on;
    const[swipeX,setSwipeX]=useState(0);const[swipeStart,setSwipeStart]=useState(null);
    const onTouchStart=e=>{if(!onDelete)return;setSwipeStart(e.touches[0].clientX);};
    const onTouchMove=e=>{if(swipeStart===null)return;const dx=e.touches[0].clientX-swipeStart;if(dx<0)setSwipeX(Math.max(dx,-80));else if(swipeX<0)setSwipeX(Math.min(0,swipeX+dx));};
    const onTouchEnd=()=>{if(swipeStart===null)return;setSwipeStart(null);if(swipeX<-50)setSwipeX(-72);else setSwipeX(0);};
    return(
    <div data-swiperow style={{position:"relative",marginBottom:big?10:8,marginLeft:link?14:0}}>
      {onDelete&&swipeX<0&&<div onClick={onDelete} style={{position:"absolute",right:0,top:0,bottom:0,width:72,background:C.red,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></div>}
    <div className={`task-row${flash?" just-checked":""}`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{position:"relative",display:"flex",alignItems:"center",gap:big?14:12,padding:big?"18px 18px":"14px 16px",borderRadius:10,background:C.surface,border:`1px solid ${isNext?C.accent:C.hairline}`,opacity:on?0.65:1,animation:isNext?"chainPulse 2.4s ease-in-out infinite":"none",overflow:"hidden",transform:`translateX(${swipeX}px)`,transition:swipeStart===null?"transform 0.3s ease, opacity 0.5s ease":"none"}}>
      {on&&<div style={{position:"absolute",inset:0,borderRadius:10,pointerEvents:"none",overflow:"hidden",borderLeft:`3px solid ${C.green}`}}>
        {/* Settled state — solid soft green once the sweep has finished */}
        {!flash&&<div style={{position:"absolute",inset:0,background:theme==="light"?"rgba(5,150,105,0.10)":"rgba(52,211,153,0.18)"}}/>}
        {/* Sweep animation — fills left-to-right via clip-path, 360ms */}
        {flash&&<div className="sweep-fill" style={{background:theme==="light"?"rgba(5,150,105,0.14)":"rgba(52,211,153,0.24)"}}/>}
      </div>}
      {link&&<div style={{position:"absolute",left:-14,top:0,bottom:0,width:14,display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
        {link.index>0&&<div style={{flex:1,width:2,background:C.accent,opacity:0.5}}/>}
        <div style={{width:8,height:8,borderRadius:"50%",background:on?C.accent:isNext?C.accent:C.surfaceHi,border:`1.5px solid ${C.accent}`,flexShrink:0}}/>
        {link.index<link.total-1&&<div style={{flex:1,width:2,background:C.accent,opacity:0.5}}/>}
      </div>}
      <div onClick={()=>handleCheck(t)} style={{position:"relative",zIndex:2,width:big?22:20,height:big?22:20,borderRadius:4,flexShrink:0,border:`1.5px solid ${on?C.greenBright:C.textDim}`,background:on?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:big?13:11,fontWeight:800,cursor:"pointer",transition:"all 0.3s ease"}}>{on&&"✓"}</div>
      {t.diff&&DIFF[t.diff]&&<div style={{position:"relative",zIndex:2,width:4,height:big?26:20,borderRadius:2,background:DIFF[t.diff].color,flexShrink:0,opacity:on?0.4:1}}/>}
      <span onClick={()=>handleCheck(t)} style={{position:"relative",zIndex:2,flex:1,fontSize:big?15:13,fontWeight:500,fontFamily:big?FN.h:FN.b,fontStyle:big?"italic":"normal",color:on?C.textDim:C.text,cursor:"pointer",transition:"color 0.4s ease"}}>{t.text}</span>
      {t.diff&&DIFF[t.diff]&&<span style={{position:"relative",zIndex:2,fontSize:9,fontWeight:700,fontFamily:FN.m,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 7px",flexShrink:0,opacity:on?0.5:1}}>{DIFF[t.diff].label}</span>}
      {t.proof&&<svg style={{position:"relative",zIndex:2}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
      {onEdit&&<button onClick={e=>{e.stopPropagation();onEdit();}} style={{position:"relative",zIndex:2,background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>edit</button>}
    </div>
    </div>);};

  /* Daily focus task row — strike + pop animation on complete, then it moves to the Done list. */
  const FocusDailyRow=({t})=>{
    const completing=!!completingFocus[t.id];
    const d=t.diff&&DIFF[t.diff];
    return(<div className={completing?"focus-complete":""} style={{display:"flex",alignItems:"center",gap:11,padding:"13px 4px",marginBottom:7,borderBottom:`1px solid ${C.hairline}`}}>
      <div onClick={()=>!completing&&completeFocusTask(t)} style={{width:23,height:23,borderRadius:7,border:`1.5px solid ${completing?C.greenBright:C.textDim}`,background:completing?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:13,fontWeight:800,cursor:"pointer",transition:"all 0.2s ease",flexShrink:0}}>{completing&&"✓"}</div>
      {d&&<div style={{width:4,height:24,borderRadius:2,background:d.color,flexShrink:0,opacity:completing?0.4:1}}/>}
      <span onClick={()=>!completing&&completeFocusTask(t)} style={{flex:1,position:"relative",fontSize:15,fontWeight:500,fontFamily:FN.h,fontStyle:"italic",color:completing?C.textDim:C.text,cursor:"pointer"}}>
        {t.text}
        {completing&&<span style={{position:"absolute",left:0,top:"52%",height:2,width:"100%",background:C.green,transformOrigin:"left center",animation:"focusStrike 0.28s ease forwards"}}/>}
      </span>
      {d&&<span style={{fontSize:9,fontWeight:700,fontFamily:FN.m,color:d.color,background:d.bg,borderRadius:4,padding:"2px 7px",flexShrink:0,opacity:completing?0.5:1}}>{d.label}</span>}
    </div>);
  };
  /* Completed focus tasks for the viewed day — tap to restore. Reused in Today→Focus and Goals→Focus. */
  const renderFocusDone=()=>{
    const done=focusTasks.filter(t=>dc[t.id]&&!completingFocus[t.id]);
    if(done.length===0)return null;
    return(<div style={{marginTop:18}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.08em"}}>Done {isToday?"Today":""}</span>
        <span style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>{done.length}</span>
        <div style={{flex:1,height:1,background:C.hairline}}/>
      </div>
      {done.map(t=>(<div key={t.id} onClick={()=>restoreFocusTask(t)} className="card-enter" style={{display:"flex",alignItems:"center",gap:11,padding:"10px 4px",borderBottom:`1px solid ${C.hairline}`,cursor:"pointer"}} title="Tap to restore">
        <div style={{width:23,height:23,borderRadius:7,background:C.greenBright,display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:13,fontWeight:800,flexShrink:0}}>✓</div>
        <span style={{flex:1,fontSize:14,color:C.textDim,textDecoration:"line-through",fontFamily:FN.h,fontStyle:"italic"}}>{t.text}</span>
        {t.diff&&DIFF[t.diff]&&<span style={{fontSize:9,fontWeight:700,fontFamily:FN.m,color:C.textDim,background:C.surfaceDim,borderRadius:4,padding:"2px 7px",flexShrink:0}}>{DIFF[t.diff].label}</span>}
      </div>))}
    </div>);
  };

  const mainTabs=[{k:"today",l:"Today",i:Icons.today},{k:"groups",l:"Journal",i:Icons.journal},{k:"analytics",l:"Analytics",i:Icons.analytics},{k:"goals",l:"Goals",i:Icons.goals},{k:"workout",l:"Health",i:Icons.workout},{k:"budget",l:"Budget",i:Icons.budget}];

  /* ═══ RENDER ═══ */
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:FN.b,display:"flex",flexDirection:"column",transition:"background 0.4s ease, color 0.4s ease"}}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {confetti&&<div style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none",overflow:"hidden"}}>{Array.from({length:30}).map((_,i)=>{const l=Math.random()*100,d=Math.random()*2+1;const c=[C.green,C.goldBright,C.blue,C.orange,"#fff"][Math.floor(Math.random()*5)];return(<div key={i} style={{position:"absolute",left:`${l}%`,top:-10,width:7,height:7,borderRadius:"50%",background:c,animation:`xpFloat ${d}s ease-out forwards`}} />);})}</div>}

      <ProofModal open={!!proofTask} onClose={()=>setProofTask(null)} name={proofTask?.text||""} onDone={img=>{if(proofTask)proofDone(proofTask,img);}} />
      <VideoRecorderModal open={showVjRecorder} onClose={()=>setShowVjRecorder(false)} onSave={vjAdd} dateLabel={vjSel!=null?new Date(vjY,vjM,vjSel).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}):""} />

      {/* ═══ STICKY HEADER ═══ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,padding:"13px 14px 9px"}}>
          {/* left spacer balances the right button cluster so the wordmark stays centered & never overlaps */}
          <div style={{width:58,flexShrink:0,height:1}} aria-hidden="true" />
          <button className="press" onClick={()=>{setTab("today");setMenuTab(null);}} style={{flex:1,minWidth:0,background:"transparent",border:"none",cursor:"pointer",padding:0}}>
            <span style={{display:"block",textAlign:"center",fontFamily:"'Space Grotesk',sans-serif",fontSize:27,fontWeight:700,letterSpacing:"0.18em",textIndent:"0.18em",textTransform:"uppercase",lineHeight:1.05,color:theme==="light"?"#0AA063":"#34E29B",whiteSpace:"nowrap"}}>Progress</span>
          </button>
          <div style={{width:58,flexShrink:0,display:"flex",gap:6,justifyContent:"flex-end",alignItems:"flex-start"}}>
            <button className="press" onClick={()=>setStructuredMode(p=>!p)} style={{background:structuredMode?C.accentSoft:"transparent",border:structuredMode?`1px solid ${C.accentMed}`:"1px solid transparent",borderRadius:6,cursor:"pointer",padding:5,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease"}} title="Structured Mode"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="6" y="1" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="11" y="1" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="1" y="6" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="6" y="6" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="11" y="6" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="1" y="11" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="6" y="11" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/><rect x="11" y="11" width="4" height="4" rx="1" fill={structuredMode?C.accent:C.textDim}/></svg></button>
            <button className="press" onClick={()=>setShowSettings(true)} style={{background:"transparent",border:"none",cursor:"pointer",padding:4}}><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke={C.goldBright} strokeWidth="1.5"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke={C.goldBright} strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          </div>
        </div>


        {/* Calendar — only on the Today tab; other tabs get the full page */}
        {curPage==="today"&&<>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px"}}>
          <div ref={calRef} className="hide-scroll" style={{display:"flex",gap:4,overflowX:"auto",flex:1,padding:"4px 0"}}>
            {calDays.map((d,i)=>{const sel=vk===d.key;return(
              <div key={i} onClick={()=>{setVDate(d.date);setTab("today");setMenuTab(null);}} style={{flex:"0 0 48px",textAlign:"center",padding:"6px 2px",borderRadius:8,cursor:"pointer",background:sel?C.accent:d.pct>0?pctBg(d.pct):"transparent",border:sel?"1px solid transparent":d.isToday?`1px solid ${C.accent}`:`1px solid ${C.hairline}`,transition:"all 0.2s ease"}}>
                <div style={{fontSize:9,fontWeight:600,color:sel?"#0B1120":C.textDim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{d.dayName}</div>
                <div className="hero-num" style={{fontSize:16,color:sel?"#0B1120":d.isToday?C.accent:C.text}}>{d.dayNum}</div>
                <div style={{fontFamily:FN.m,fontSize:9,fontWeight:600,color:sel?"rgba(11,17,32,0.7)":d.pct>0?pC(d.pct):C.textDim,marginTop:1}}>{d.pct>0?`${d.pct}%`:"—"}</div>
              </div>
            );})}
          </div>
          <button className="press" onClick={()=>setShowFullCal(!showFullCal)} style={{background:showFullCal?C.goldSoft:C.surfaceDim,border:"none",borderRadius:10,padding:"6px 8px",cursor:"pointer",flexShrink:0}}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2.5" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.4"/><line x1="2" y1="7" x2="16" y2="7" stroke={showFullCal?C.goldBright:C.textDim} strokeWidth="1.2"/></svg></button>
        </div>
        {showFullCal&&<div className="card-enter" style={{...card,margin:"4px 12px 0",padding:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()-1,1))} style={btnG}>‹</button><span style={{fontSize:13,fontWeight:700}}>{vDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setVDate(new Date(vDate.getFullYear(),vDate.getMonth()+1,1))} style={btnG}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,color:C.textDim,fontWeight:600}}>{d}</div>)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth(),1).getDay()}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:new Date(vDate.getFullYear(),vDate.getMonth()+1,0).getDate()}).map((_,i)=>(<div key={i+1} onClick={()=>{setVDate(new Date(vDate.getFullYear(),vDate.getMonth(),i+1));setShowFullCal(false);}} style={{textAlign:"center",padding:"4px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:vDate.getDate()===i+1?700:400,background:vDate.getDate()===i+1?C.goldBright:"transparent",color:vDate.getDate()===i+1?"#fff":C.text}}>{i+1}</div>))}</div>
        </div>}
        </>}
      </div>

      {/* ═══ SCROLLABLE MIDDLE ═══ */}
      <div onTouchStart={onPageTouchStart} onTouchEnd={onPageTouchEnd} style={{flex:1,overflowY:"auto",padding:"12px 20px 24px"}}>
      <div key={curPage} className={navDir<0?"page-l":navDir>0?"page-r":"tab-content"}>

        {/* ═══ TODAY TAB ═══ */}
        {/* ═══ STRUCTURED MODE — interactive grid view ═══ */}
        {tab==="today"&&structuredMode&&(()=>{
          const y=now.getFullYear(),mo=now.getMonth();
          const daysInMonth=new Date(y,mo+1,0).getDate();
          const todayDate=now.getDate();
          const todayDow=now.getDay(); // 0=Sun
          // Week view: Mon-Sun containing today
          const weekStart=new Date(y,mo,todayDate-(todayDow===0?6:(todayDow-1)));
          const weekDays=gridExpanded?Array.from({length:daysInMonth},(_,i)=>i+1):Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d.getMonth()===mo?d.getDate():null;}).filter(Boolean);
          const dayLabels=weekDays.map(d=>{const dt=new Date(y,mo,d);return["S","M","T","W","T","F","S"][dt.getDay()];});
          const cellW=gridExpanded?26:Math.floor((window.innerWidth-120)/7);
          const morningItems=activeTodos(dk(now)).filter(t=>t.grp==="morning");
          const nightItems=activeTodos(dk(now)).filter(t=>t.grp==="night");
          const generalItems=activeTodos(dk(now)).filter(t=>t.grp==="general");
          const goalItems=goalDerivedFocus;

          const toggleCell=(id,day)=>{
            const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const cur=(checks[k]||{})[id];
            if(!cur)flashChecked(id);
            setChecks(p=>({...p,[k]:{...(p[k]||{}),[id]:!cur}}));
          };

          // Streak calc for a habit
          const getStreak=(id)=>{let s=0;for(let d=todayDate;d>=1;d--){const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;if((checks[k]||{})[id])s++;else break;}return s;};

          const renderGridSection=(title,items,color,badge)=>{
            if(items.length===0)return null;
            return(<div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingLeft:2}}>
                <span style={{fontSize:12,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{title}</span>
                {badge&&<span style={{fontSize:8,padding:"1px 6px",borderRadius:4,background:`${color}20`,color,fontWeight:700,fontFamily:FN.m}}>{badge}</span>}
              </div>
              {/* Column headers */}
              <div style={{display:"flex",marginBottom:4}}>
                <div style={{width:100,flexShrink:0}}/>
                {weekDays.map(d=>(<div key={d} style={{width:cellW,textAlign:"center"}}>
                  <div style={{fontSize:10,color:d===todayDate?C.accent:C.textDim,fontFamily:FN.m,fontWeight:d===todayDate?800:400}}>{dayLabels[weekDays.indexOf(d)]}</div>
                  <div style={{fontSize:12,color:d===todayDate?C.accent:C.textDim,fontFamily:FN.m,fontWeight:d===todayDate?800:500}}>{d}</div>
                </div>))}
                <div style={{width:40,textAlign:"center",fontSize:7,color:C.textDim,fontFamily:FN.m}}>🔥</div>
              </div>
              {/* Rows */}
              {items.map(t=>{
                const id=t.id||t.goalId;
                const streak=getStreak(id);
                const ap=aspirationProgress.find(x=>x.id===id);
                const isGoalDerived=!!t.goalId;
                const isGraduated=t.graduated;
                const atRisk=ap&&ap.pct<50&&ap.dayOfMonth>=10;
                return(<div key={id} style={{display:"flex",alignItems:"center",marginBottom:2}}>
                  <div style={{width:100,flexShrink:0,display:"flex",alignItems:"center",gap:4,paddingRight:4}}>
                    {isGoalDerived&&<div style={{width:4,height:4,borderRadius:"50%",background:C.accent,flexShrink:0}}/>}
                    {isGraduated&&<div style={{width:4,height:4,borderRadius:"50%",background:C.green,flexShrink:0}}/>}
                    <span style={{fontSize:12,fontWeight:600,color:atRisk?C.red:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{t.text||t.dailyAction}</span>
                    {atRisk&&<span style={{fontSize:7,color:C.red,fontWeight:800}}>!</span>}
                  </div>
                  {weekDays.map(d=>{
                    const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                    const done=(checks[k]||{})[id];
                    const isToday=d===todayDate;
                    const isPast=d<todayDate;
                    const missed=isPast&&!done;
                    return(<div key={d} onClick={()=>toggleCell(id,d)} style={{width:cellW,height:cellW>30?30:cellW-4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:4,margin:"0 0.5px",background:done?`${color}`:missed?`${C.red}15`:isToday?C.surfaceHi:"transparent",border:isToday&&!done?`1px solid ${C.accent}50`:"1px solid transparent",transition:"all 0.15s ease"}}>
                      {done&&<svg width="10" height="10" viewBox="0 0 16 16"><polyline points="3,8 7,12 13,4" fill="none" stroke="#0B1120" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {missed&&<div style={{width:4,height:1,background:C.red,borderRadius:1}}/>}
                    </div>);
                  })}
                  <div style={{width:40,textAlign:"center",fontSize:10,fontFamily:FN.m,fontWeight:700,color:streak>=7?C.green:streak>=3?C.accent:C.textDim}}>{streak>0?streak:""}</div>
                </div>);
              })}
            </div>);
          };

          // Demotion warnings
          const atRiskItems=aspirationProgress.filter(a=>a.graduated&&a.pct<50&&a.dayOfMonth>=14);

          return(<div className="tab-content" style={{paddingBottom:140}}>
            {/* Mode header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em"}}>Structured Mode</div>
                <div className="display" style={{fontSize:18,fontStyle:"italic",color:C.text}}>{gridExpanded?"Full Month":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].find((_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d.getDate()===todayDate;})?`Week of ${weekStart.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mo]}`:"This Week"}</div>
              </div>
              <button onClick={()=>setGridExpanded(p=>!p)} style={{...btnG,fontSize:10,padding:"6px 12px"}}>{gridExpanded?"Week":"Month"}</button>
            </div>

            {/* Demotion warnings */}
            {atRiskItems.length>0&&<div style={{padding:"10px 14px",marginBottom:14,borderRadius:10,background:`${C.red}12`,border:`1px solid ${C.red}30`}}>
              <div style={{fontSize:9,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>⚠ Habits at Risk</div>
              {atRiskItems.map(a=>(<div key={a.id} style={{fontSize:11,color:C.text,marginTop:4}}>{a.dailyAction||a.text} — <span style={{color:C.red,fontWeight:700}}>{a.pct}%</span> this month</div>))}
            </div>}

            {/* Grid sections */}
            {renderGridSection("Morning",morningItems,C.accent)}
            {renderGridSection("Evening",nightItems,"#60A5FA")}
            {generalItems.length>0&&renderGridSection("All Day",generalItems,C.green)}
            {goalItems.length>0&&renderGridSection("Goals",goalItems.map(g=>({...g,id:g.goalId})),C.accent,"auto")}

                        {/* Weekly summary bar */}
            <div style={{...card,padding:14,marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>Today</div>
                  <div className="hero-num" style={{fontSize:28,color:dailyLabel.color,lineHeight:1}}>{todayCompletion.pct}<span style={{fontSize:12,color:C.textDim}}>%</span></div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>{dailyLabel.text}</div>
                  <div style={{fontSize:11,fontFamily:FN.m,color:C.textDim,marginTop:2}}>{todayCompletion.done}/{todayCompletion.total} tasks</div>
                </div>
              </div>
            </div>
          </div>);
        })()}
        
        {/* ═══ TODAY — Flow Mode (default card-based view) ═══ */}
        {tab==="today"&&!structuredMode&&(()=>{
          const mPct=morningT.length>0?Math.round(morningT.filter(t=>dc[t.id]).length/morningT.length*100):0;
          const ePct=nightT.length>0?Math.round(nightT.filter(t=>dc[t.id]).length/nightT.length*100):0;
          const empties={morning:"The day hasn't started yet.",focus:"What are you actually going to do today?",evening:"Nothing to close out. Rest, or add something worth doing."};
          return(<div className="tab-content" style={{paddingBottom:140}}>
          {/* Pinned weekly priorities — set during Sunday review */}
          {weekPriorities.length>0&&<div style={{marginBottom:14,padding:"14px 16px",background:C.surface,borderRadius:12,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${C.accent}`}}>
            <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>This Week</div>
            {weekPriorities.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}><span className="hero-num" style={{fontSize:11,color:C.accent}}>{i+1}</span><span className="display" style={{fontSize:14,fontStyle:"italic",color:C.text}}>{p}</span></div>))}
          </div>}


          {/* Section 1: Living banner — reacts to your day */}
          <div style={{height:180,borderRadius:14,overflow:"hidden",marginBottom:18,border:`1px solid ${C.hairline}`}}>
            <BannerScene mode={recoveryData?"morning":todaySub==="morning"?"morning":todaySub==="focus"?"day":"evening"} dayPct={recoveryData?0:todayCompletion.pct} morningPct={recoveryData?0:mPct} eveningPct={recoveryData?0:ePct} />
          </div>

          {/* Section 2: Big tab selector */}
          <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`1px solid ${C.hairline}`}}>
            {[{k:"morning",l:"Morning"},{k:"evening",l:"Evening"},{k:"focus",l:"Focus"}].map(s=>{const on=todaySub===s.k;return(
              <button key={s.k} onClick={()=>setTodaySub(s.k)} style={{flex:1,padding:"16px 8px",background:"transparent",border:"none",borderBottom:on?`2px solid ${C.accent}`:"2px solid transparent",cursor:"pointer",color:on?C.text:C.textDim,fontFamily:FN.b,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",transition:"all 0.2s ease",marginBottom:-1}}>{s.l}</button>
            );})}
          </div>

          {todaySub==="morning"&&<div>
            {morningT.length===0&&<div style={{textAlign:"center",padding:40,color:C.textDim,fontFamily:FN.h,fontSize:16,fontStyle:"italic"}}>{empties.morning}</div>}
            {morningT.length>1&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button onClick={()=>setReorderMode(m=>!m)} style={{background:reorderMode?C.accent:"transparent",border:`1px solid ${reorderMode?C.accent:C.hairline}`,color:reorderMode?C.btnText:C.textDim,borderRadius:8,padding:"5px 12px",fontSize:10,fontWeight:700,fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer"}}>{reorderMode?"Done":"⇅ Reorder"}</button></div>}
            {reorderMode&&morningT.length>1
              ?<DragReorderList items={morningTSorted} onReorder={applyHabitOrder} />
              :morningTSorted.map(t=><TRow key={t.id} t={t} />)}
          </div>}
          {todaySub==="focus"&&(()=>{
            const dailyTasks=focusTasks.filter(t=>!dc[t.id]||completingFocus[t.id]); // active + mid-animation
            const weeklyGoals=weeklyFocusGoals;
            const monthlyGoals=monthlyFocusGoals;
            const FOCUS_BLUE="#60A5FA",FOCUS_ORANGE="#FB923C",FOCUS_PURPLE="#A78BFA";
            const SectionHeader=({title,color,count})=>(
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:18}}>
                <div style={{width:8,height:8,borderRadius:2,background:color}}/>
                <span style={{fontSize:11,fontWeight:800,color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{title}</span>
                <span style={{fontSize:9,fontFamily:FN.m,color:C.textDim,fontWeight:700}}>{count}</span>
              </div>
            );
            // Expandable goal card with a dropdown of step / occurrence checkboxes
            const GoalCard=({goal,color,badge,summary,children})=>{
              const collapsed=focusCollapsed[goal.id];
              return(<div style={{marginBottom:8,borderRadius:10,background:C.surface,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${color}`,overflow:"hidden"}}>
                <div onClick={()=>setFocusCollapsed(p=>({...p,[goal.id]:!p[goal.id]}))} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,fontFamily:FN.m,color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{badge}</div>
                    <div style={{fontSize:15,fontWeight:500,fontFamily:FN.h,fontStyle:"italic",color:C.text,overflow:"hidden",textOverflow:"ellipsis"}}>{goal.text}</div>
                  </div>
                  <span style={{fontSize:11,fontFamily:FN.m,fontWeight:700,color,flexShrink:0}}>{summary}</span>
                  <span style={{fontSize:12,color:C.textDim,transform:collapsed?"none":"rotate(180deg)",transition:"transform 0.2s ease",flexShrink:0}}>▾</span>
                </div>
                {!collapsed&&<div style={{padding:"0 16px 12px"}}>{children}</div>}
              </div>);
            };
            const StepRow=({done,active,text,onToggle,color,flashKey})=>{const flash=justChecked[flashKey];return(
              <div onClick={onToggle} className={flash?"just-checked":""} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",cursor:"pointer",borderTop:`1px solid ${C.hairline}`}}>
                <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${done?C.greenBright:active?color:C.textDim}`,background:done?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:10,fontWeight:800,flexShrink:0}}>{done&&"✓"}</div>
                <span style={{fontSize:13,color:done?C.textDim:C.text,textDecoration:done?"line-through":"none",fontWeight:active&&!done?700:400,flex:1}}>{text}</span>
                {active&&!done&&<span style={{fontSize:8,fontFamily:FN.m,color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Next</span>}
              </div>);
            };
            const addFocusQuick=()=>{const t=focusQuick.trim();if(!t)return;addFocus({id:uid(),text:t,diff:"easy"});setFocusQuick("");};
            return(<div>
              {/* Section 1 — Daily Tasks (highest priority) — add directly here */}
              <SectionHeader title="Daily Tasks" color={FOCUS_BLUE} count={dailyTasks.length}/>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={focusQuick} onChange={e=>setFocusQuick(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addFocusQuick();}} placeholder="Add a focus task for today…" style={{...inp,flex:1}}/>
                <button onClick={addFocusQuick} disabled={!focusQuick.trim()} style={{...btnB,opacity:focusQuick.trim()?1:0.4,cursor:focusQuick.trim()?"pointer":"default"}}>Add</button>
              </div>
              {dailyTasks.map(t=><FocusDailyRow key={t.id} t={t} />)}
              {renderFocusDone()}

              {/* Section 2 — Weekly Goals (second priority): checkbox dropdowns */}
              {weeklyGoals.length>0&&<>
                <SectionHeader title="Weekly Goals" color={FOCUS_ORANGE} count={weeklyGoals.length}/>
                {weeklyGoals.map(goal=>{
                  if(goal.kind==="steps"){
                    const activeId=goal.steps.find(s=>!s.done)?.id;
                    return(<GoalCard key={goal.id} goal={goal} color={FOCUS_ORANGE} badge="Weekly" summary={`${goal.done}/${goal.total}`}>
                      {goal.steps.map(s=><StepRow key={s.id} done={s.done} active={s.id===activeId} text={s.text} color={FOCUS_ORANGE} flashKey={s.id} onToggle={()=>toggleWeeklyStep(goal.id,s.id)} />)}
                    </GoalCard>);
                  }
                  return(<GoalCard key={goal.id} goal={goal} color={FOCUS_ORANGE} badge="Weekly" summary={`${goal.current}/${goal.target}`}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,paddingTop:12,borderTop:`1px solid ${C.hairline}`}}>
                      {Array.from({length:goal.target}).map((_,i)=>{const checked=i<goal.current;return(
                        <div key={i} onClick={()=>setWeeklyCount(goal.id,checked?i:i+1)} style={{width:36,height:36,borderRadius:8,border:`1.5px solid ${checked?C.greenBright:C.textDim}`,background:checked?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:checked?C.btnText:C.textDim,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FN.m,transition:"all 0.2s ease"}}>{checked?"✓":i+1}</div>
                      );})}
                    </div>
                  </GoalCard>);
                })}
              </>}

              {/* Section 3 — Monthly Goals (third priority): outcome = step dropdown, habit/measurable = single daily checkbox */}
              {monthlyGoals.length>0&&<>
                <SectionHeader title="Monthly Goals" color={FOCUS_PURPLE} count={monthlyGoals.length}/>
                {monthlyGoals.map(goal=>{
                  if(goal.kind==="steps"){
                    const activeId=goal.steps.find(s=>!s.done)?.id;
                    return(<GoalCard key={goal.id} goal={goal} color={FOCUS_PURPLE} badge="Monthly" summary={`${goal.done}/${goal.total}`}>
                      {goal.steps.map(s=><StepRow key={s.id} done={s.done} active={s.id===activeId} text={s.text} color={FOCUS_PURPLE} flashKey={s.id} onToggle={()=>toggleMonthlyStep(goal.id,s.id)} />)}
                    </GoalCard>);
                  }
                  // habit / measurable daily action — single checkbox row (no sub-steps to expand)
                  const flash=justChecked[goal.id];
                  return(<div key={goal.id} onClick={()=>toggleMonthlyAction(goal.id)} className={`task-row${flash?" just-checked":""}`} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:8,borderRadius:10,background:C.surface,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${FOCUS_PURPLE}`,cursor:"pointer"}}>
                    <div style={{width:22,height:22,borderRadius:4,flexShrink:0,border:`1.5px solid ${C.textDim}`,display:"flex",alignItems:"center",justifyContent:"center"}}/>
                    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:2}}>
                      <span style={{fontSize:9,fontFamily:FN.m,color:FOCUS_PURPLE,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Monthly{goal.implementationIntention?` · ${goal.implementationIntention}`:""}</span>
                      <span style={{fontSize:15,fontWeight:500,fontFamily:FN.h,fontStyle:"italic",color:C.text}}>{goal.actionText}</span>
                    </div>
                  </div>);
                })}
              </>}
            </div>);
          })()}
          {todaySub==="evening"&&<div>
            {nightT.length===0&&<div style={{textAlign:"center",padding:40,color:C.textDim,fontFamily:FN.h,fontSize:16,fontStyle:"italic"}}>{empties.evening}</div>}
            {nightT.length>1&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button onClick={()=>setReorderMode(m=>!m)} style={{background:reorderMode?C.accent:"transparent",border:`1px solid ${reorderMode?C.accent:C.hairline}`,color:reorderMode?C.btnText:C.textDim,borderRadius:8,padding:"5px 12px",fontSize:10,fontWeight:700,fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer"}}>{reorderMode?"Done":"⇅ Reorder"}</button></div>}
            {reorderMode&&nightT.length>1
              ?<DragReorderList items={nightTSorted} onReorder={applyHabitOrder} />
              :nightTSorted.map(t=><TRow key={t.id} t={t} />)}
          </div>}

        </div>);})()}

        {/* ═══ GROUPS ═══ (unchanged behavior) */}
        {tab==="groups"&&<div className="tab-content">
          {/* ═══ VIDEO JOURNAL ═══ */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <h2 style={{fontWeight:700,fontSize:16,margin:0,fontFamily:FN.h,fontStyle:"italic"}}>Video Journal</h2>
            <span style={{fontSize:10,color:C.textDim,fontFamily:FN.m}}>{Object.values(videoJournal).reduce((a,v)=>a+v.length,0)} entries</span>
          </div>
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><button onClick={()=>{setVjMonth(new Date(vjY,vjM-1,1));setVjSel(null);}} style={btnG}>‹</button><span style={{fontSize:14,fontWeight:700}}>{vjMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>{setVjMonth(new Date(vjY,vjM+1,1));setVjSel(null);}} style={btnG}>›</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim,fontWeight:600}}>{d}</div>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{Array.from({length:vjFD}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:vjDIM}).map((_,i)=>{const d=i+1;const isT=vjCM&&d===now.getDate();const cnt=vjEntries(d).length;const sel=vjSel===d;return(<div key={d} onClick={()=>setVjSel(sel?null:d)} style={{aspectRatio:"1",borderRadius:8,cursor:"pointer",padding:3,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:sel?C.accentMed:cnt>0?C.accentSoft:C.surfaceDim,border:isT?`2px solid ${C.accent}`:cnt>0?`1.5px solid ${C.accentMed}`:"1.5px solid transparent",transition:"all 0.2s ease"}}><span style={{fontSize:12,fontWeight:isT?800:500,color:isT?C.accent:C.text}}>{d}</span>{cnt>0&&<span style={{display:"flex",alignItems:"center",gap:2,marginTop:1}}><span style={{width:4,height:4,borderRadius:"50%",background:C.accent}}/><span style={{fontSize:8,fontWeight:700,color:C.accent,fontFamily:FN.m}}>{cnt}</span></span>}</div>);})}</div>

            {vjSel&&(()=>{const key=vjDK(vjSel);const entries=videoJournal[key]||[];const dateLabel=new Date(vjY,vjM,vjSel).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});return(
              <div style={{marginTop:14,borderTop:`1px solid ${C.surfaceDim}`,paddingTop:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700}}>{dateLabel}</div>
                  <div style={{display:"flex",gap:6}}>
                    <button className="press" onClick={()=>setShowVjRecorder(true)} style={{display:"flex",alignItems:"center",gap:6,background:C.accent,border:"none",borderRadius:8,padding:"8px 12px",color:C.btnText,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.03em"}}><span style={{width:9,height:9,borderRadius:"50%",background:C.btnText}}/>Record</button>
                    <button className="press" onClick={()=>vjFileRef.current?.click()} style={{...btnG,padding:"8px 12px",fontSize:11}}>↑ Upload</button>
                  </div>
                </div>
                <input ref={vjFileRef} type="file" accept="video/*" onChange={vjUpload} style={{display:"none"}} />
                {entries.length===0&&<div style={{textAlign:"center",padding:"24px 12px",color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>No entries yet. Record or upload to capture this day.</div>}
                {entries.map(en=>{const url=vjUrls[en.id];return(
                  <div key={en.id} style={{background:C.surfaceDim,borderRadius:12,padding:10,marginBottom:10,border:`1px solid ${C.hairline}`}}>
                    <div style={{borderRadius:10,overflow:"hidden",background:"#000",marginBottom:8}}>
                      {url?<video src={url} controls playsInline style={{width:"100%",maxHeight:340,display:"block",background:"#000"}} />:<div style={{aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:12}}>Loading video…</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:10,color:C.textDim,fontFamily:FN.m}}>{new Date(en.time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}{en.duration?` · ${fmtDur(en.duration)}`:""}</span>
                      <button onClick={()=>vjRemove(key,en.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FN.b,display:"flex",alignItems:"center",gap:4}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>Delete</button>
                    </div>
                    <input value={en.note||""} onChange={e=>vjSetNote(key,en.id,e.target.value)} placeholder="Add a note or caption…" style={{...inp,padding:"9px 12px",fontSize:12}} />
                  </div>
                );})}
              </div>
            );})()}
          </div>
          <div style={{textAlign:"center",fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:12,lineHeight:1.5,padding:"0 8px"}}>Tap a date to record or upload. Videos are stored privately on this device.</div>
        </div>}

        {/* ═══ ANALYTICS ═══ (simplified) */}
        {tab==="analytics"&&<div className="tab-content">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{fontWeight:700,fontSize:18,margin:0,fontFamily:FN.h,fontStyle:"italic"}}>Analytics Hub</h2>
            <button onClick={()=>{setExportStep(1);setShowExport(true);}} className="press" style={{...btnB,display:"flex",alignItems:"center",gap:6}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.btnText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>

          {/* WEEKLY INSIGHT — actionable, dynamic, top of analytics */}
          <div style={{...card,marginBottom:14,padding:"18px 20px",borderLeft:`3px solid ${C.accent}`,background:`linear-gradient(135deg,${C.accentSoft},${C.surface})`}}>
            <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>This Week · Insight</div>
            <div className="display" style={{fontSize:16,fontStyle:"italic",color:C.text,lineHeight:1.4,marginBottom:12}}>{weeklyInsight}</div>
            <div style={{paddingTop:12,borderTop:`1px solid ${C.hairline}`,display:"flex",alignItems:"center",gap:10}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span style={{fontSize:12,color:C.textSec,fontFamily:FN.b,fontWeight:500}}>{recommendation}</span>
            </div>
          </div>

          {/* ═══ HABIT ANALYTICS — consistency ═══ */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:8,height:8,borderRadius:2,background:C.green}}/>
            <span style={{fontSize:12,fontWeight:800,color:C.green,textTransform:"uppercase",letterSpacing:"0.1em"}}>Habit Analytics</span>
            <span style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>consistency</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[{l:"Today",v:habitToday},{l:"Weekly",v:habitWeekly},{l:"Monthly",v:habitMonthly}].map((s,i)=>(<div key={i} style={{...card,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.l}</div><div className="hero-num" style={{fontSize:26,color:pC(s.v),lineHeight:1}}>{s.v}<span style={{fontSize:12,color:C.textDim}}>%</span></div></div>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{...card,padding:"14px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Streak</div><div style={{fontSize:20,fontWeight:800,color:streak>=7?C.green:streak>=3?C.accent:C.text,fontFamily:FN.m}}>{streak}<span style={{fontSize:10,color:C.textDim}}>d</span></div></div>
            <div style={{...card,padding:"14px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Longest</div><div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:FN.m}}>{longestHabitStreak}<span style={{fontSize:10,color:C.textDim}}>d</span></div></div>
            <div style={{...card,padding:"14px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Trend</div><div style={{fontSize:20,fontWeight:800,color:habitTrendColor,fontFamily:FN.m}}>{habitTrendArrow}{habitTrendDelta>0?"+":""}{habitTrendDelta}<span style={{fontSize:10,color:C.textDim}}>%</span></div></div>
          </div>
          <div style={{...card,marginBottom:18}}>
            <div style={lbl}>Consistency · Last 14 Days</div>
            <ResponsiveContainer width="100%" height={140}><LineChart data={habitConsistency14d}><CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} interval={2}/><YAxis domain={[0,100]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={28}/><Tooltip content={<Tip />}/><Line type="monotone" dataKey="pct" stroke={C.green} strokeWidth={2} dot={false} name="%"/></LineChart></ResponsiveContainer>
          </div>

          {/* ═══ FOCUS ANALYTICS — productivity (items/day, never %) ═══ */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:8,height:8,borderRadius:2,background:"#60A5FA"}}/>
            <span style={{fontSize:12,fontWeight:800,color:"#60A5FA",textTransform:"uppercase",letterSpacing:"0.1em"}}>Focus Analytics</span>
            <span style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>productivity</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{...card,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Today</div><div className="hero-num" style={{fontSize:26,color:C.text,lineHeight:1}}>{focusToday}</div><div style={{fontSize:8,color:C.textDim,fontFamily:FN.m,marginTop:2}}>completed</div></div>
            <div style={{...card,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Weekly</div><div className="hero-num" style={{fontSize:26,color:"#60A5FA",lineHeight:1}}>{focusWeeklyAvg}</div><div style={{fontSize:8,color:C.textDim,fontFamily:FN.m,marginTop:2}}>items/day</div></div>
            <div style={{...card,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Monthly</div><div className="hero-num" style={{fontSize:26,color:"#60A5FA",lineHeight:1}}>{focusMonthlyAvg}</div><div style={{fontSize:8,color:C.textDim,fontFamily:FN.m,marginTop:2}}>items/day</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{...card,padding:"14px 16px"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Total This Month</div><div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:FN.m}}>{focusTotalThisMonth}<span style={{fontSize:11,color:C.textDim,fontWeight:500}}> items</span></div></div>
            <div style={{...card,padding:"14px 16px"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Best Day</div><div style={{fontSize:22,fontWeight:800,color:C.green,fontFamily:FN.m}}>{focusBestDay}<span style={{fontSize:11,color:C.textDim,fontWeight:500}}> items</span></div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{...card,padding:"14px 16px"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Best Week</div><div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:FN.m}}>{focusBestWeek}<span style={{fontSize:11,color:C.textDim,fontWeight:500}}> items</span></div></div>
            <div style={{...card,padding:"14px 16px"}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Best Month</div><div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:FN.m}}>{focusBestMonth}<span style={{fontSize:11,color:C.textDim,fontWeight:500}}> items</span></div></div>
          </div>
          <div style={{...card,marginBottom:18}}>
            <div style={lbl}>Productivity · Items Completed Per Day</div>
            <ResponsiveContainer width="100%" height={140}><BarChart data={focusTrend14d}><CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} interval={2}/><YAxis allowDecimals={false} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={24}/><Tooltip content={<Tip />}/><Bar dataKey="items" fill="#60A5FA" radius={[3,3,0,0]} name="items"/></BarChart></ResponsiveContainer>
          </div>

          {/* ═══ GOAL PROGRESS — completed steps ÷ total ═══ */}
          {(aspirations.filter(a=>a.goalType==="outcome"&&!a.graduated).length>0||wGoals.some(g=>g.steps&&g.steps.length>0))&&<div style={{...card,marginBottom:18}}>
            <div style={lbl}>Goal Progress</div>
            {wGoals.filter(g=>g.steps&&g.steps.length>0).map(g=>{const done=g.steps.filter(s=>s.done).length;const pct=Math.round(done/g.steps.length*100);return(<div key={g.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}><span style={{fontSize:8,color:"#FB923C",fontWeight:700,textTransform:"uppercase",marginRight:6}}>Weekly</span>{g.text}</span><span style={{fontSize:11,fontFamily:FN.m,fontWeight:700,color:C.accent}}>{done}/{g.steps.length} · {pct}%</span></div><div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.greenBright:"#FB923C",borderRadius:2}}/></div></div>);})}
            {aspirations.filter(a=>a.goalType==="outcome"&&!a.graduated).map(a=>{const done=(a.steps||[]).filter(s=>s.done).length;const tot=(a.steps||[]).length;const pct=tot>0?Math.round(done/tot*100):0;return(<div key={a.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}><span style={{fontSize:8,color:"#A78BFA",fontWeight:700,textTransform:"uppercase",marginRight:6}}>Monthly</span>{a.text}</span><span style={{fontSize:11,fontFamily:FN.m,fontWeight:700,color:C.accent}}>{done}/{tot} · {pct}%</span></div><div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.greenBright:"#A78BFA",borderRadius:2}}/></div></div>);})}
          </div>}

          {/* Top metric cards: Completion, Focus — now with trend indicators */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <div style={{...card,padding:"22px 18px"}}>
              <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Habit Month Avg</div>
              <div className="hero-num" style={{fontSize:48,color:C.text,lineHeight:1}}>{monthCompletionAvg}<span style={{fontSize:20,color:C.textDim}}>%</span></div>
              <div style={{fontSize:10,color:C.textDim,marginTop:8,fontFamily:FN.m,display:"flex",alignItems:"center",gap:6}}>
                <span>month avg</span>
                <span style={{color:trendColor,fontWeight:700}}>{trendArrow} {trendDelta>0?"+":""}{trendDelta}% wk</span>
              </div>
            </div>
            <div style={{...card,padding:"22px 18px"}}>
              <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Win Rate</div>
              <div className="hero-num" style={{fontSize:48,color:winRate>=4?C.greenBright:winRate>=2?C.accent:C.textDim,lineHeight:1}}>{winRate}<span style={{fontSize:20,color:C.textDim}}>/7</span></div>
              <div style={{fontSize:10,color:C.textDim,marginTop:8,fontFamily:FN.m}}>days ≥ 85% this week</div>
            </div>
          </div>

          {/* Behavior pattern */}
          {behaviorPattern&&<div style={{...card,marginBottom:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.surfaceHi,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
            <div><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Pattern</div><div style={{fontSize:13,color:C.text,fontFamily:FN.h,fontStyle:"italic"}}>{behaviorPattern}</div></div>
          </div>}

          {/* ═══ DEEP PATTERNS — cross-week synthesis, shows only if enough data ═══ */}
          {patternInsights.length>0&&<div style={{...card,marginBottom:14,padding:"16px 20px",borderLeft:`3px solid ${C.accent}`,background:C.surface}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z"/></svg>
              <div>
                <div style={{fontSize:9,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.14em"}}>Patterns</div>
                <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:2}}>What the data sees across your weeks</div>
              </div>
            </div>
            {patternInsights.map((ins,i)=>{
              const tint=ins.type==="warning"?C.red:ins.type==="rising"||ins.type==="momentum"||ins.type==="streak"?C.green:ins.type==="dow"?"#93C5FD":C.accent;
              const icon=ins.type==="warning"?"⚠":ins.type==="rising"?"↗":ins.type==="streak"?"🔥":ins.type==="link"?"→":ins.type==="momentum"?"●":ins.type==="dow"?"◐":"◆";
              return(<div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderTop:i>0?`1px solid ${C.hairline}`:"none"}}>
                <span style={{fontSize:14,color:tint,flexShrink:0,marginTop:1}}>{icon}</span>
                <div style={{fontSize:12,color:C.text,lineHeight:1.5,fontFamily:FN.b}}>{ins.text}</div>
              </div>);
            })}
          </div>}

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
            {allPhotos.length===0?<div style={{textAlign:"center",padding:20,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>No proof yet — start tracking your progress.</div>:
            <div className="hide-scroll" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
              {allPhotos.map((p,i)=>(<div key={i} style={{flex:"0 0 88px",width:88}}>
                <div style={{width:88,height:88,borderRadius:12,overflow:"hidden",background:C.surfaceDim,position:"relative"}}>{p.img?<img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:28}}>📸</div>}</div>
                <div style={{fontSize:9,color:C.textDim,marginTop:4,textAlign:"center",fontWeight:600}}>{fd(p.date)}</div>
                <div style={{fontSize:8,color:C.textDim,textAlign:"center",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.taskName}</div>
              </div>))}
            </div>}
          </div>

          {/* Recent Reflections */}
          {Object.keys(reflections).length>0&&<div style={{...card,marginBottom:14}}>
            <div style={lbl}>Recent Reflections</div>
            <div style={{maxHeight:240,overflowY:"auto"}} className="hide-scroll">
              {Object.entries(reflections).sort(([a],[b])=>b.localeCompare(a)).slice(0,7).map(([date,entries])=>(
                <div key={date} style={{marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.hairline}`}}>
                  <div style={{fontSize:9,fontFamily:FN.m,color:C.textDim,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{fd(date)}</div>
                  {entries.map((e,i)=>(<div key={i} style={{marginBottom:6,paddingLeft:10,borderLeft:`2px solid ${C.accent}`}}>
                    <div style={{fontSize:11,fontFamily:FN.h,fontStyle:"italic",color:C.textDim,marginBottom:2}}>{e.prompt}</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{e.answer}</div>
                  </div>))}
                </div>
              ))}
            </div>
          </div>}

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

        {/* ═══ GOALS — 4 sub-tabs: Monthly / Weekly / Focus / Habits ═══ */}
        {tab==="goals"&&<div className="tab-content">
          <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{[{k:"monthly",l:"Monthly"},{k:"weekly",l:"Weekly"},{k:"focus",l:"Focus"},{k:"habits",l:"Habits"}].map(t=>(<button key={t.k} onClick={()=>setGTab(t.k)} className="pill-btn" style={pill(gTab===t.k)}>{t.l}</button>))}</div>

          {/* ─── MONTHLY GOALS ─── */}
          {gTab==="monthly"&&<div>
            {aspirations.filter(a=>!a.graduated).length===0&&<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:14}}>No goals yet. What are you working toward?</div>}
            {aspirations.filter(a=>!a.graduated).map(a=>{const p=aspirationProgress.find(x=>x.id===a.id);const pct=p?.pct||0;const typeBadge=a.goalType==="measurable"?"📐":a.goalType==="outcome"?"🎯":"🔄";return(
              <SwipeRow key={a.id} onDelete={()=>removeGoal(a.id)} bg={C.surface} padY={14}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:a.goalType==="habit"||a.goalType==="measurable"?8:0}}>
                  <span style={{fontSize:14}}>{typeBadge}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{a.text}</div>
                    <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:2}}>
                      {a.goalType==="measurable"&&`${a.hoursLogged||0}/${a.totalHours}h · due ${fd(a.deadline)}`}
                      {a.goalType==="outcome"&&`${(a.steps||[]).filter(s=>s.done).length}/${(a.steps||[]).length} steps`}
                      {a.goalType==="habit"&&`${p?.daysHit||0}/${a.targetDays} days · ${p?.onPace?"on pace":"behind"}`}
                    </div>
                  </div>
                  {a.goalType==="habit"&&a.monthsAtTarget>=3&&<button onClick={()=>graduateGoal(a.id)} className="press" style={{background:C.accent,border:"none",borderRadius:6,padding:"5px 10px",color:C.btnText,fontSize:9,fontWeight:700,fontFamily:FN.b,textTransform:"uppercase",cursor:"pointer"}}>Graduate</button>}
                  <button onClick={()=>openGoalEdit(a,"monthly")} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:FN.b,padding:"2px 4px",flexShrink:0}}>edit</button>
                </div>
                {(a.goalType==="habit"||a.goalType==="measurable")&&<div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:pct>=80?C.greenBright:pct>=50?C.accent:C.red,borderRadius:2,transition:"width 0.5s ease"}}/></div>}
                {a.goalType==="outcome"&&(()=>{const total=(a.steps||[]).length;const done=(a.steps||[]).filter(s=>s.done).length;const sp=total>0?Math.round(done/total*100):0;const activeId=(a.steps||[]).find(s=>!s.done)?.id;return(<><div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",width:`${sp}%`,background:sp>=100?C.greenBright:C.accent,borderRadius:2,transition:"width 0.5s ease"}}/></div><div>{(a.steps||[]).map((s,si)=>{const isActive=s.id===activeId;return(<div key={s.id||si} onClick={()=>{const turningOn=!s.done;setAspirations(p=>p.map(g=>g.id===a.id?{...g,steps:g.steps.map((st,i)=>i===si?{...st,done:!st.done}:st)}:g));logFocusCompletion(turningOn?1:-1);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",cursor:"pointer",borderTop:si>0?`1px solid ${C.hairline}`:"none"}}>
                  <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${s.done?C.greenBright:isActive?C.accent:C.textDim}`,background:s.done?C.greenBright:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:9,fontWeight:800,flexShrink:0}}>{s.done&&"✓"}</div>
                  <span style={{fontSize:12,color:s.done?C.textDim:C.text,textDecoration:s.done?"line-through":"none",fontWeight:isActive?700:400}}>{s.text}</span>
                  {isActive&&<span style={{fontSize:8,fontFamily:FN.m,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginLeft:"auto"}}>Active</span>}
                </div>);})}</div></>);})()}
              </SwipeRow>
            );})}
            <button onClick={()=>setShowGoalCreator(true)} style={{width:"100%",background:"transparent",border:`1px dashed ${C.hairline}`,borderRadius:10,padding:14,color:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",marginTop:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>+ Create a Goal</button>
          </div>}

          {/* ─── WEEKLY (auto-derived) ─── */}
          {gTab==="weekly"&&<div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>{!showAddWeekly&&<button onClick={()=>setShowAddWeekly(true)} className="press" style={btnB}>+ New Weekly Goal</button>}</div>
            {showAddWeekly&&<div style={{...card,marginBottom:16}}>
              <input value={nWkText} onChange={e=>setNWkText(e.target.value)} placeholder="e.g. Create Presentation" style={{...inp,marginBottom:10,fontSize:14,fontFamily:FN.h,fontStyle:"italic"}} autoFocus/>
              <div style={{fontSize:11,fontWeight:600,color:C.textDim,marginBottom:8}}>Optional — ordered steps (active step auto-advances when checked off):</div>
              {nWkSteps.map((s,i)=>(<input key={i} value={s} onChange={e=>{const n=[...nWkSteps];n[i]=e.target.value;setNWkSteps(n);}} placeholder={`Step ${i+1}...`} style={{...inp,marginBottom:8}}/>))}
              {nWkSteps.length<5&&<button onClick={()=>setNWkSteps(p=>[...p,""])} style={{...btnG,width:"100%",fontSize:10,marginBottom:10}}>+ Add step</button>}
              <div style={{fontSize:11,fontWeight:600,color:C.textDim,marginBottom:8}}>— or, if no steps, a weekly target count:</div>
              <input type="number" min="1" value={nWkTarget} onChange={e=>setNWkTarget(e.target.value)} placeholder="e.g. 4 (times this week)" style={{...numI,width:"100%",marginBottom:12}}/>
              <div style={{display:"flex",gap:8}}><button onClick={addWeeklyGoal} disabled={!nWkText.trim()} style={{...btnB,flex:1,opacity:nWkText.trim()?1:0.4}}>Create</button><button onClick={()=>{setShowAddWeekly(false);setNWkText("");setNWkTarget("");setNWkSteps(["","",""]);}} style={btnG}>Cancel</button></div>
            </div>}

            {wGoals.length===0&&!showAddWeekly&&<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>No weekly goals yet — create one above.</div>}
            {wGoals.map(g=>{
              const active=weeklyActiveStep(g);
              const hasSteps=g.steps&&g.steps.length>0;
              const pct=hasSteps?Math.round((g.steps.filter(s=>s.done).length/g.steps.length)*100):Math.min(100,((g.current||0)/(g.target||1))*100);
              return(
              <SwipeRow key={g.id} onDelete={()=>setWGoals(p=>p.filter(x=>x.id!==g.id))} bg={C.surface} padY={12}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.text}}>{g.text}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {!hasSteps&&<button onClick={()=>openGoalEdit(g,"weekly")} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:FN.b,padding:"2px 4px"}}>edit</button>}
                    {hasSteps?<span style={{fontFamily:FN.m,fontSize:11,fontWeight:700,color:C.accent}}>{pct}%</span>:<>
                      <button onClick={()=>setWGoals(p=>p.map(x=>x.id===g.id?{...x,current:Math.max(0,(x.current||0)-1)}:x))} style={{...btnG,padding:"3px 10px",fontSize:12}}>−</button>
                      <span style={{fontFamily:FN.m,fontSize:12,fontWeight:700,minWidth:40,textAlign:"center"}}>{g.current||0}/{g.target}</span>
                      <button onClick={()=>setWGoals(p=>p.map(x=>x.id===g.id?{...x,current:(x.current||0)+1}:x))} style={{...btnG,padding:"3px 10px",fontSize:12}}>+</button>
                    </>}
                  </div>
                </div>
                {hasSteps&&<div style={{fontSize:11,color:C.textDim,padding:"4px 0",fontFamily:FN.b}}>{active?<>Active step: <span style={{color:"#FB923C",fontWeight:600}}>{active.text}</span></>:<span style={{color:C.green,fontWeight:600}}>All steps complete ✓</span>}</div>}
                <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.greenBright:C.accent,borderRadius:2,transition:"width 0.5s ease"}}/></div>
              </SwipeRow>
            );})}

            {/* Auto-derived weekly pacing forecast from monthly goals (read-only — these steps are completed via the Monthly goal itself) */}
            {weeklyTargets.length>0&&<div style={{marginTop:20}}><div style={{...lbl,marginBottom:8}}>Weekly Pace — from Monthly Goals</div>
            {weeklyTargets.map(w=>(<div key={w.goalId} style={{...card,padding:16,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{w.text}</span>
                <span style={{fontSize:10,fontFamily:FN.m,color:C.accent,fontWeight:700}}>{w.type==="hours"?`${w.target} hrs/wk`:w.type==="frequency"?`${w.target} days/wk`:`${w.target} steps`}</span>
              </div>
              {w.type==="steps"&&w.steps&&w.steps.map((s,i)=>(<div key={s.id||i} style={{fontSize:11,color:C.textDim,padding:"4px 0",borderTop:i>0?`1px solid ${C.hairline}`:"none"}}>→ {s.text}</div>))}
              <div style={{fontSize:9,color:C.textDim,fontFamily:FN.m,marginTop:6}}>Auto-derived from monthly goal</div>
            </div>))}
            </div>}
          </div>}

          {/* ─── FOCUS — only the active step for every Weekly and Monthly goal, with parent context ─── */}
          {gTab==="focus"&&<div>
            <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginBottom:14}}>These surface automatically on your Today tab too. Check them off here or there — auto-advances to the next step.</div>
            {weeklyFocusItems.length===0&&monthlyGoalFocus.length===0&&<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>No active goal steps right now.</div>}
            {weeklyFocusItems.filter(i=>i.kind==="step").map(item=>(
              <div key={item.id} onClick={()=>completeWeeklyFocus(item)} style={{...card,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderLeft:"3px solid #FB923C"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:"#FB923C",flexShrink:0}}/>
                <span style={{fontSize:13,fontWeight:500,flex:1,color:C.text}}><span style={{color:C.textDim,fontWeight:600}}>({item.parentText})</span> {item.text}</span>
                <span style={{fontSize:9,fontFamily:FN.m,color:C.textDim}}>weekly</span>
              </div>
            ))}
            {monthlyGoalFocus.map(f=>(
              <div key={f.id} onClick={()=>completeMonthlyFocus(f)} style={{...card,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderLeft:"3px solid #A78BFA",background:f.hitToday?C.greenSoft:C.surface,opacity:f.hitToday?0.6:1}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:"#A78BFA",flexShrink:0}}/>
                <span style={{fontSize:13,fontWeight:500,flex:1,color:f.hitToday?C.textDim:C.text,textDecoration:f.hitToday?"line-through":"none"}}><span style={{color:C.textDim,fontWeight:600}}>({f.parentText})</span> {f.text}</span>
                {f.hitToday?<span style={{fontSize:9,fontFamily:FN.m,color:C.green,fontWeight:700}}>Done today</span>:<span style={{fontSize:9,fontFamily:FN.m,color:C.textDim}}>monthly</span>}
              </div>
            ))}
            {/* Manual focus tasks for today — add directly here */}
            <div style={{marginTop:16}}>
              <div style={{...lbl,marginBottom:8}}>Manual Focus — {fd(vDate)}</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={focusQuick} onChange={e=>setFocusQuick(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const t=focusQuick.trim();if(t){addFocus({id:uid(),text:t,diff:"easy"});setFocusQuick("");}}}} placeholder="Add a focus task…" style={{...inp,flex:1}}/>
                <button onClick={()=>{const t=focusQuick.trim();if(t){addFocus({id:uid(),text:t,diff:"easy"});setFocusQuick("");}}} disabled={!focusQuick.trim()} style={{...btnB,opacity:focusQuick.trim()?1:0.4,cursor:focusQuick.trim()?"pointer":"default"}}>Add</button>
              </div>
              {focusTasks.filter(t=>!dc[t.id]).map(t=>(<SwipeRow key={t.id} onDelete={()=>removeFocus(t.id)} bg={C.surface} padY={11}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13,fontWeight:500,flex:1,color:C.text}}>{t.text}</span>
                  <span style={{fontSize:9,fontWeight:700,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 6px",fontFamily:FN.m}}>{DIFF[t.diff].label}</span>
                  <button onClick={()=>openEdit(t,"focus")} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:FN.b}}>edit</button>
                </div>
              </SwipeRow>))}
              {renderFocusDone()}
            </div>
          </div>}

          {/* ─── HABITS (graduated + override) ─── */}
          {gTab==="habits"&&<div>
            {habits.length===0&&<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:14}}>No habits yet. Goals graduate here after 3 months of consistency.</div>}
            {habits.map(h=>{const p=aspirationProgress.find(x=>x.id===h.id);return(
              <SwipeRow key={h.id} onDelete={()=>removeGoal(h.id)} bg={C.surface} padY={14}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:p?.hitToday?C.greenBright:C.textDim}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{h.dailyAction||h.text}</div>
                    <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:2}}>
                      {p?`${p.daysHit}/${p.target} this month · ${p.pct}%`:"Established habit"}
                      {h.goalType==="established"&&" · override"}
                    </div>
                  </div>
                  {p&&p.pct<50&&p.dayOfMonth>=14&&<button onClick={()=>demoteGoal(h.id)} style={{...btnG,fontSize:9,color:C.red,borderColor:C.red+"40",padding:"4px 8px"}}>Demote</button>}
                </div>
              </SwipeRow>
            );})}
            {/* Demotion warnings */}
            {demotionCandidates.length>0&&<div style={{...card,padding:14,marginTop:12,background:C.redSoft||"rgba(239,68,68,0.08)",border:`1px solid ${C.red}30`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Slipping</div>
              <div style={{fontSize:12,color:C.textDim}}>Some habits have dropped below 50% this month. Consider demoting them back to goals to rebuild momentum.</div>
            </div>}
            <button onClick={()=>{setGcOverride(true);setShowGoalCreator(true);}} style={{width:"100%",background:"transparent",border:`1px dashed ${C.hairline}`,borderRadius:10,padding:12,color:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",marginTop:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>+ Add established habit (skip funnel)</button>

            {/* Daily Rituals — morning/evening/general recurring tasks */}
            <div style={{marginTop:28}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Daily Rituals</div>
              {["morning","night","general"].map(grp=>{const items=todos.filter(t=>t.grp===grp);return(
                <div key={grp} style={{marginBottom:16}}>
                  <div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,paddingLeft:2}}>{grp==="night"?"Evening":grp.charAt(0).toUpperCase()+grp.slice(1)}</div>
                  {items.map(t=>(<SwipeRow key={t.id} onDelete={()=>removeHabit(t.id)} bg={C.surface} padY={11}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13,fontWeight:500,flex:1,color:C.text}}>{t.text}</span>
                      {t.proof&&<span style={{fontSize:12,opacity:0.6}}>📷</span>}
                      <span style={{fontSize:9,fontWeight:700,color:DIFF[t.diff].color,background:DIFF[t.diff].bg,borderRadius:4,padding:"2px 6px",fontFamily:FN.m}}>{DIFF[t.diff].label}</span>
                      <button onClick={()=>openEdit(t,"todos")} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:FN.b}}>edit</button>
                    </div>
                  </SwipeRow>))}
                  {addForm===grp?
                    <div style={{background:C.surfaceDim,borderRadius:12,padding:14,marginTop:6,border:`1px solid ${C.hairline}`}}>
                      <input value={fText} onChange={e=>setFText(e.target.value)} placeholder="New task..." style={{...inp,marginBottom:10}} autoFocus/>
                      <div style={{display:"flex",gap:4,marginBottom:8}}>{["easy","medium","hard"].map(d=>(<button key={d} onClick={()=>setFDiff(d)} style={{...pill(fDiff===d,DIFF[d].color),flex:1,fontSize:11}}>{DIFF[d].label}</button>))}</div>
                      <div style={{display:"flex",gap:4,marginBottom:8}}>{["morning","night","general"].map(g=>(<button key={g} onClick={()=>setFGrp(g)} style={{...pill(fGrp===g),flex:1,fontSize:11,textTransform:"capitalize"}}>{g==="night"?"Evening":g}</button>))}</div>
                      <div style={{display:"flex",gap:4,marginBottom:10}}><button onClick={()=>setFProof(false)} style={{...pill(!fProof),flex:1,fontSize:11}}>📷 No</button><button onClick={()=>setFProof(true)} style={{...pill(fProof,C.blue),flex:1,fontSize:11}}>📸 Yes</button></div>
                      <div style={{display:"flex",gap:8}}><button onClick={submitAddForm} style={{...btnB,flex:1}}>Add</button><button onClick={()=>setAddForm(null)} style={btnG}>Cancel</button></div>
                    </div>
                    :<button onClick={()=>startAddForm(grp)} style={{width:"100%",background:"transparent",border:`1px dashed ${C.hairline}`,borderRadius:10,padding:9,color:C.textDim,fontSize:10,fontWeight:600,cursor:"pointer",marginTop:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>+ Add {grp==="night"?"evening":grp}</button>
                  }
                </div>
              );})}
            </div>

            {/* ─── HABIT STACKING ─── */}
            <div style={{marginTop:28}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Habit Stacking</div>
              <div style={{fontSize:11,color:C.textDim,fontFamily:FN.m,marginBottom:12,lineHeight:1.5}}>Anchor a new habit to one you already do. Evidence-backed approach (BJ Fogg, James Clear) — existing cues carry new behaviors.</div>
              {/* Existing stacks */}
              {chains.map(c=>(<div key={c.id} style={{...card,padding:"14px 16px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text}}>{c.name}</div>
                  <button onClick={()=>removeChain(c.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:13,opacity:0.5}}>×</button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:0,flexWrap:"wrap"}}>{c.taskIds.map((tid,i)=>{const task=todos.find(t=>t.id===tid);if(!task)return null;return(<div key={tid} style={{display:"flex",alignItems:"center",gap:4}}>{i>0&&<span style={{color:C.accent,fontSize:12,margin:"0 4px"}}>→</span>}<span style={{fontSize:10,fontFamily:FN.m,color:C.text,background:C.surfaceHi,padding:"4px 8px",borderRadius:5,border:`1px solid ${C.hairline}`}}>{task.text}</span></div>);})}</div>
              </div>))}
              <button onClick={()=>{setBuildingChain(true);setStackStep(0);setChainPicks([]);setChainName("");}} style={{width:"100%",background:"transparent",border:`1px dashed ${C.hairline}`,borderRadius:10,padding:14,color:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:chains.length>0?4:0}}>+ Build a habit stack</button>
            </div>
          </div>}
        </div>}

        {/* ═══ HABIT STACK BUILDER MODAL — two-step anchor-and-new-habit flow ═══ */}
        <Overlay open={buildingChain} onClose={()=>{setBuildingChain(false);setStackStep(0);setChainName("");setChainPicks([]);}} title={stackStep===0?"The Anchor":stackStep===1?"The New Habit":"Name Your Stack"}>
          {/* Step 0: pick the anchor (something they already do every day) */}
          {stackStep===0&&<div>
            <div className="display" style={{fontSize:17,fontStyle:"italic",color:C.text,lineHeight:1.4,marginBottom:14}}>What do you already do every day?</div>
            <div style={{fontSize:11,color:C.textDim,fontFamily:FN.m,marginBottom:14,lineHeight:1.5}}>Pick one of your most reliable habits — the cue that will trigger the new one.</div>
            <div style={{maxHeight:240,overflowY:"auto",marginBottom:12}} className="hide-scroll">
              {todos.map(t=>{
                const sel=chainPicks[0]===t.id;
                return(<div key={t.id} onClick={()=>setChainPicks([t.id])} style={{padding:"11px 14px",marginBottom:4,borderRadius:8,border:`1px solid ${sel?C.accent:C.hairline}`,background:sel?C.accentSoft:"transparent",cursor:"pointer",fontSize:13,color:sel?C.text:C.textSec,fontWeight:sel?600:500,display:"flex",alignItems:"center",gap:10,transition:"all 0.15s ease"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${sel?C.accent:C.textDim}`,background:sel?C.accent:"transparent",flexShrink:0}}/>
                  <span style={{flex:1}}>{t.text}</span>
                  <span style={{fontSize:8,color:C.textDim,fontFamily:FN.m,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.grp==="night"?"evening":t.grp}</span>
                </div>);
              })}
            </div>
            <button disabled={chainPicks.length===0} onClick={()=>setStackStep(1)} style={{...btnB,width:"100%",opacity:chainPicks.length>0?1:0.4}}>Next →</button>
          </div>}

          {/* Step 1: pick the new habit */}
          {stackStep===1&&<div>
            <div className="display" style={{fontSize:17,fontStyle:"italic",color:C.text,lineHeight:1.4,marginBottom:8}}>What new habit do you want to attach to it?</div>
            {(()=>{const anchor=todos.find(t=>t.id===chainPicks[0]);return anchor&&<div style={{fontSize:11,fontFamily:FN.m,color:C.textDim,marginBottom:14,padding:"8px 12px",background:C.surfaceDim,borderRadius:8,borderLeft:`2px solid ${C.accent}`}}>After "{anchor.text}", I will...</div>;})()}
            <div style={{fontSize:11,color:C.textDim,fontFamily:FN.m,marginBottom:10}}>Pick an existing habit to attach, or add the anchor only and come back later:</div>
            <div style={{maxHeight:200,overflowY:"auto",marginBottom:12}} className="hide-scroll">
              {todos.filter(t=>t.id!==chainPicks[0]&&!chainPicks.includes(t.id)).map(t=>{
                return(<div key={t.id} onClick={()=>setChainPicks(p=>[...p,t.id])} style={{padding:"10px 14px",marginBottom:3,borderRadius:8,border:`1px solid ${C.hairline}`,cursor:"pointer",fontSize:12,color:C.textSec,transition:"all 0.15s ease"}}>+ {t.text}</div>);
              })}
            </div>
            {chainPicks.length>1&&<div style={{padding:"10px 12px",marginBottom:12,background:C.surfaceDim,borderRadius:8}}>
              <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Your Stack</div>
              <div style={{display:"flex",alignItems:"center",flexWrap:"wrap"}}>{chainPicks.map((tid,i)=>{const t=todos.find(x=>x.id===tid);if(!t)return null;return(<div key={tid+i} style={{display:"flex",alignItems:"center",gap:4}}>{i>0&&<span style={{color:C.accent,fontSize:11,margin:"0 4px"}}>→</span>}<span onClick={()=>setChainPicks(p=>p.filter((_,j)=>j!==i))} style={{fontSize:10,fontFamily:FN.m,background:C.surfaceHi,padding:"4px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${C.hairline}`}}>{t.text} ×</span></div>);})}</div>
            </div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setStackStep(0)} style={{...btnG,flex:1}}>Back</button>
              <button disabled={chainPicks.length<2} onClick={()=>setStackStep(2)} style={{...btnB,flex:2,opacity:chainPicks.length>=2?1:0.4}}>Next →</button>
            </div>
          </div>}

          {/* Step 2: name and save */}
          {stackStep===2&&<div>
            <div className="display" style={{fontSize:17,fontStyle:"italic",color:C.text,lineHeight:1.4,marginBottom:14}}>Name your stack.</div>
            <input value={chainName} onChange={e=>setChainName(e.target.value)} placeholder="e.g. Morning routine, Evening wind-down" style={{...inp,marginBottom:12}} autoFocus/>
            <div style={{padding:"10px 12px",marginBottom:14,background:C.surfaceDim,borderRadius:8,borderLeft:`2px solid ${C.accent}`}}>
              <div style={{display:"flex",alignItems:"center",flexWrap:"wrap"}}>{chainPicks.map((tid,i)=>{const t=todos.find(x=>x.id===tid);if(!t)return null;return(<div key={tid+i} style={{display:"flex",alignItems:"center",gap:4}}>{i>0&&<span style={{color:C.accent,fontSize:11,margin:"0 4px"}}>→</span>}<span style={{fontSize:10,fontFamily:FN.m,color:C.text,background:C.surfaceHi,padding:"4px 8px",borderRadius:5,border:`1px solid ${C.hairline}`}}>{t.text}</span></div>);})}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setStackStep(1)} style={{...btnG,flex:1}}>Back</button>
              <button disabled={!chainName.trim()} onClick={()=>{saveChain();setStackStep(0);}} style={{...btnB,flex:2,opacity:chainName.trim()?1:0.4}}>Save Stack</button>
            </div>
          </div>}
        </Overlay>

        {/* ═══ LEGACY IMPLEMENTATION INTENTION PROMPT — surfaces once per pre-existing habit goal ═══ */}
        <Overlay open={!!intentionPromptFor} onClose={skipIntentionPrompt} title="Quick question">
          {intentionPromptFor&&<div>
            <div className="display" style={{fontSize:17,fontStyle:"italic",color:C.text,lineHeight:1.4,marginBottom:6}}>"{intentionPromptFor.dailyAction||intentionPromptFor.text}"</div>
            <div style={{fontSize:13,color:C.textSec,fontFamily:FN.b,lineHeight:1.5,marginBottom:16}}>When do you actually do this? It makes a measurable difference.</div>
            <input value={intentionPromptText} onChange={e=>setIntentionPromptText(e.target.value)} placeholder="e.g. after morning coffee, when I get home from class, before I open my laptop" style={{...inp,marginBottom:8}} autoFocus/>
            <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,fontStyle:"italic",marginBottom:16,lineHeight:1.5}}>A situational cue, not a time. Anchor it to something you already do.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={skipIntentionPrompt} style={{...btnG,flex:1}}>Skip</button>
              <button onClick={saveIntentionPrompt} disabled={!intentionPromptText.trim()} style={{...btnB,flex:2,opacity:intentionPromptText.trim()?1:0.4,cursor:intentionPromptText.trim()?"pointer":"not-allowed"}}>Save</button>
            </div>
          </div>}
        </Overlay>

        {/* ═══ GOAL CREATION MODAL — multi-step flow ═══ */}
        <Overlay open={showGoalCreator} onClose={resetGc} title={gcOverride?"Add Established Habit":gcStep===0?"New Goal":gcStep===1?"Goal Type":"Details"}>
          {/* Step 0: Name */}
          {gcStep===0&&<div>
            <div style={{fontSize:12,color:C.textDim,marginBottom:12}}>What are you working toward?</div>
            <input value={gcName} onChange={e=>setGcName(e.target.value)} placeholder={gcOverride?"e.g. Brush teeth, Morning stretch":"e.g. Study for IO exam, Learn Spanish"} style={{...inp,marginBottom:14,fontSize:15,fontFamily:FN.h,fontStyle:"italic"}} autoFocus/>
            {gcOverride&&<div>
              <div style={{fontSize:12,color:C.textDim,marginBottom:8}}>How often should you do this?</div>
              <input type="number" value={gcTarget} onChange={e=>setGcTarget(e.target.value)} placeholder="Days per month (e.g. 28)" style={{...inp,marginBottom:10}}/>
              <input value={gcAction} onChange={e=>setGcAction(e.target.value)} placeholder="Daily action (e.g. Morning stretch 10 min)" style={{...inp,marginBottom:14}}/>
              <button onClick={submitGoal} disabled={!gcName.trim()} style={{...btnB,width:"100%",opacity:gcName.trim()?1:0.4}}>Add as Habit</button>
            </div>}
            {!gcOverride&&<button onClick={()=>{if(gcName.trim())setGcStep(1);}} disabled={!gcName.trim()} style={{...btnB,width:"100%",opacity:gcName.trim()?1:0.4}}>Next</button>}
          </div>}
          {/* Step 1: Type selection */}
          {gcStep===1&&<div>
            <div style={{fontSize:12,color:C.textDim,marginBottom:14}}>What kind of goal is "{gcName}"?</div>
            {[
              {k:"measurable",icon:"📐",title:"Measurable",desc:"Has a deadline and estimated hours. Study for an exam, complete a project.",ex:"Study 50 hours by May 15"},
              {k:"outcome",icon:"🎯",title:"Outcome",desc:"A result you want to achieve, broken into actionable steps.",ex:"Get an offer from Morgan Stanley"},
              {k:"habit",icon:"🔄",title:"Habit-Building",desc:"A behavior you want to make automatic over time.",ex:"Read daily, learn Spanish, drink more water"},
            ].map(t=>(<button key={t.k} onClick={()=>{setGcType(t.k);setGcStep(2);}} className="press" style={{display:"block",width:"100%",textAlign:"left",padding:"16px 18px",marginBottom:8,borderRadius:12,background:C.surfaceDim,border:`1px solid ${C.hairline}`,cursor:"pointer",transition:"all 0.2s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{fontSize:18}}>{t.icon}</span><span style={{fontSize:14,fontWeight:700,color:C.text}}>{t.title}</span></div>
              <div style={{fontSize:11,color:C.textDim,marginBottom:4}}>{t.desc}</div>
              <div style={{fontSize:10,color:C.accent,fontFamily:FN.m,fontStyle:"italic"}}>e.g. "{t.ex}"</div>
            </button>))}
            <button onClick={()=>setGcStep(0)} style={{...btnG,width:"100%",marginTop:4}}>Back</button>
          </div>}
          {/* Step 2: Type-specific details */}
          {gcStep===2&&<div>
            {gcType==="measurable"&&<div>
              <div style={{fontSize:12,color:C.textDim,marginBottom:10}}>When is the deadline?</div>
              <input type="date" value={gcDeadline} onChange={e=>setGcDeadline(e.target.value)} style={{...inp,marginBottom:12}}/>
              <div style={{fontSize:12,color:C.textDim,marginBottom:10}}>How many total hours do you estimate?</div>
              <input type="number" value={gcHours} onChange={e=>setGcHours(e.target.value)} placeholder="e.g. 50" style={{...inp,marginBottom:14}}/>
              {gcDeadline&&gcHours&&(()=>{const wks=Math.max(1,Math.ceil((new Date(gcDeadline)-now)/(7*24*60*60*1000)));const perWk=Math.round(parseInt(gcHours)/wks*10)/10;return(<div style={{...card,padding:12,marginBottom:14,background:C.accentSoft,border:`1px solid ${C.accentMed}`}}>
                <div style={{fontSize:11,fontFamily:FN.m,color:C.text}}>≈ <strong>{perWk} hrs/week</strong> across {wks} weeks → <strong>~{Math.round(perWk/7*60)} min/day</strong></div>
              </div>);})()}
            </div>}
            {gcType==="outcome"&&<div>
              <div style={{fontSize:12,color:C.textDim,marginBottom:10}}>Break it into 2-4 actionable steps:</div>
              {gcSteps.map((s,i)=>(<input key={i} value={s} onChange={e=>{const n=[...gcSteps];n[i]=e.target.value;setGcSteps(n);}} placeholder={`Step ${i+1}...`} style={{...inp,marginBottom:8}}/>))}
              {gcSteps.length<5&&<button onClick={()=>setGcSteps(p=>[...p,""])} style={{...btnG,width:"100%",fontSize:10,marginBottom:8}}>+ Add step</button>}
            </div>}
            {gcType==="habit"&&<div>
              <div style={{fontSize:12,color:C.textDim,marginBottom:10}}>How many days per month do you want to hit?</div>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[{l:"Few times/wk",v:12},{l:"Most days",v:22},{l:"Every day",v:28}].map(p=>(<button key={p.v} onClick={()=>setGcTarget(String(p.v))} style={{...pill(gcTarget===String(p.v)),fontSize:11}}>{p.l} ({p.v})</button>))}
              </div>
              <input type="number" value={gcTarget} onChange={e=>setGcTarget(e.target.value)} placeholder="Or type a custom number" style={{...inp,marginBottom:12}}/>
              <div style={{fontSize:12,color:C.textDim,marginBottom:10}}>What's the daily action?</div>
              <input value={gcAction} onChange={e=>setGcAction(e.target.value)} placeholder="e.g. Read 30 min, Study Spanish 20 min" style={{...inp,marginBottom:14}}/>
              {/* ─── IMPLEMENTATION INTENTION — required for habit goals ─── */}
              <div style={{padding:"12px 14px",background:C.accentSoft,borderRadius:10,border:`1px solid ${C.accentMed}`,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>When will you do this?</div>
                <input value={gcIntention} onChange={e=>setGcIntention(e.target.value)} placeholder="e.g. after morning coffee, when I get home from class, before I open my laptop" style={{...inp,marginBottom:6,background:C.surface}}/>
                <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,lineHeight:1.5,fontStyle:"italic"}}>A situational cue — not a time. Anchor it to something you already do.</div>
              </div>
            </div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setGcStep(1)} style={{...btnG,flex:1}}>Back</button>
              <button onClick={submitGoal} disabled={gcType==="habit"&&!gcIntention.trim()} style={{...btnB,flex:2,opacity:(gcType==="habit"&&!gcIntention.trim())?0.4:1,cursor:(gcType==="habit"&&!gcIntention.trim())?"not-allowed":"pointer"}}>Create Goal</button>
            </div>
          </div>}
        </Overlay>
        {menuTab==="workout"&&<div className="tab-content">
          {/* ═══ HEALTH SUB-NAV ═══ */}
          <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto"}} className="hide-scroll">{[{k:"workouts",l:"My Workouts"},{k:"diet",l:"Diet"},{k:"progress",l:"Progress"}].map(v=>{const on=gView===v.k;return(<button key={v.k} onClick={()=>{setGView(v.k);if(v.k!=="workouts")setGSplit(null);}} style={{flexShrink:0,padding:"8px 18px",borderRadius:22,border:`1px solid ${on?C.accent:C.hairline}`,background:on?C.accent:"transparent",color:on?C.btnText:C.textDim,fontSize:12,fontWeight:700,fontFamily:FN.b,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",transition:"all 0.2s ease"}}>{v.l}</button>);})}</div>

          {/* ═══════════ MY WORKOUTS ═══════════ */}
          {gView==="workouts"&&!gSplit&&<div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(splits).map(([key,exL])=>(<div key={key} style={{...card,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}><button className="press" onClick={()=>setGSplit(key)} style={{flex:1,display:"flex",alignItems:"center",gap:14,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}><div style={{width:46,height:46,borderRadius:14,background:`${spClr[key]||C.blue}1A`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:17,fontWeight:800,color:spClr[key]||C.blue,textTransform:"uppercase"}}>{key[0]}</span></div><div><div style={{fontSize:14,fontWeight:700,color:spClr[key]||C.blue,textTransform:"uppercase",letterSpacing:"0.04em"}}>{key}</div><div style={{fontSize:11,color:C.textDim,marginTop:1}}>{exL.length} exercises</div></div></button><button className="press" onClick={()=>startSession(key)} style={{display:"flex",alignItems:"center",gap:5,background:C.accent,border:"none",borderRadius:10,padding:"9px 15px",color:C.btnText,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.06em",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill={C.btnText}><polygon points="6 4 20 12 6 20"/></svg>Start</button><button className="press" onClick={()=>setSplits(p=>{const n={...p};delete n[key];return n;})} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:15,opacity:0.3,flexShrink:0}}>×</button></div>))}</div>
            {!addSplit?<button onClick={()=>setAddSplit(true)} style={{...btnB,width:"100%",marginTop:12,fontSize:12}}>+ Add Split</button>:<div style={{...card,marginTop:12}}><input value={nSpName} onChange={e=>setNSpName(e.target.value)} placeholder="Split name (e.g. push)" style={{...inp,marginBottom:8}} /><input value={nSpEx} onChange={e=>setNSpEx(e.target.value)} placeholder="Exercises (comma separated)" style={{...inp,marginBottom:10}} /><div style={{display:"flex",gap:8}}><button onClick={()=>{if(!nSpName.trim())return;setSplits(p=>({...p,[nSpName.trim().toLowerCase()]:nSpEx.split(",").map(e=>e.trim()).filter(Boolean)}));setNSpName("");setNSpEx("");setAddSplit(false);}} style={{...btnB,flex:1}}>Add</button><button onClick={()=>setAddSplit(false)} style={btnG}>Cancel</button></div></div>}
            {/* Recent workouts */}
            {wHist.length>0&&<div style={{marginTop:22}}>
              <div style={{...lbl,marginBottom:10}}>Recent Workouts</div>
              {wHist.slice().reverse().slice(0,8).map(w=>(<div key={w.id} className="press" onClick={()=>setViewWorkout(w)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:12,background:C.surface,cursor:"pointer",border:`1px solid ${C.hairline}`}}><div style={{width:36,height:36,borderRadius:10,background:`${spClr[w.split]||C.accent}1A`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:13,fontWeight:800,color:spClr[w.split]||C.accent,textTransform:"uppercase"}}>{w.split[0]}</span></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:spClr[w.split]||C.accent,textTransform:"uppercase",letterSpacing:"0.04em"}}>{w.split}</div><div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:1}}>{fd(w.date)} · {w.exercises.length} ex · {w.exercises.reduce((a,e)=>a+e.sets.length,0)} sets{w.duration?` · ${fmtTime(Math.floor(w.duration/1000))}`:""}</div></div><span style={{fontSize:16,color:C.textDim}}>›</span><button onClick={e=>{e.stopPropagation();setWHist(p=>p.filter(x=>x.id!==w.id));}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14,opacity:0.35,padding:"0 2px"}}>×</button></div>))}
            </div>}
          </div>}
          {gView==="workouts"&&gSplit&&curWkState&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><button onClick={()=>setGSplit(null)} style={btnG}>←</button><span style={{fontSize:15,fontWeight:800,color:spClr[gSplit]||C.blue,textTransform:"uppercase"}}>{gSplit}</span><span style={{fontSize:9,color:C.green,marginLeft:6}}>● auto-saving</span><button className="press" onClick={()=>{const n=prompt("Exercise name:");if(n&&n.trim()){setSplits(p=>({...p,[gSplit]:[...(p[gSplit]||[]),n.trim()]}));setCurWkState(p=>({...p,exercises:[...p.exercises,{name:n.trim(),sets:[{w:0,r:0},{w:0,r:0},{w:0,r:0}]}]}));}}} style={{...btnG,fontSize:10,marginLeft:"auto"}}>+ Ex</button></div>{curWkState.exercises.map((ex,ei)=>{const lE=lastSess?.exercises?.find(e=>e.name===ex.name);const dn=doneEx[ei];return(<div key={ei} style={{...card,marginBottom:10,background:dn?C.greenSoft:C.surface}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:dn?C.green:C.text}}>{dn&&"✓ "}{ex.name}</span><div style={{display:"flex",gap:3}}><button onClick={()=>setDoneEx(p=>({...p,[ei]:!p[ei]}))} style={{...pill(dn,C.green),padding:"3px 8px",fontSize:10}}>Done</button><button onClick={()=>rSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>−</button><button onClick={()=>aSet(ei)} style={{...btnG,padding:"3px 6px",fontSize:14}}>+</button><button onClick={()=>{setSplits(p=>({...p,[gSplit]:(p[gSplit]||[]).filter(e=>e!==ex.name)}));setCurWkState(p=>({...p,exercises:p.exercises.filter((_,i)=>i!==ei)}));}} style={{...btnG,padding:"3px 6px",fontSize:11,color:C.red}}>✕</button></div></div>{ex.sets.map((s,si)=>{const ls=lE?.sets?.[si];const wd=ls?s.w-ls.w:null;return(<div key={si} style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr 56px",gap:5,marginBottom:3,alignItems:"center"}}><span style={{fontSize:10,color:spClr[gSplit]||C.blue,fontWeight:700}}>S{si+1}</span><input type="number" value={s.w||""} onChange={e=>uSet(ei,si,"w",e.target.value)} placeholder="lbs" style={numI} /><input type="number" value={s.r||""} onChange={e=>uSet(ei,si,"r",e.target.value)} placeholder="reps" style={numI} /><span style={{fontSize:9,textAlign:"center",fontWeight:600,color:ls?(wd>0?C.greenBright:wd<0?C.red:C.textDim):C.textDim}}>{ls?`${ls.w}×${ls.r}`:"—"}</span></div>);})}</div>);})}<button className="press" onClick={saveWk} style={{width:"100%",background:spClr[gSplit]||C.blue,border:"none",borderRadius:12,padding:"14px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Save ✓</button></div>}

          {/* ═══════════ DIET ═══════════ */}
          {gView==="diet"&&(()=>{
            const g=dietGoals,d=dietDay;
            const isToday=dietDate===dk(now);
            const isFuture=new Date(dietDate)>new Date(dk(now));
            const calLeft=Math.max(0,(g.calories||0)-(d.calories||0));
            const macroCards=[{k:"protein"},{k:"carbs"},{k:"fat"}];
            const totalMacroG=(d.protein||0)+(d.carbs||0)+(d.fat||0);
            // Scrolling date strip centered on the selected day — go back to backfill, forward to plan ahead.
            const dietCalDays=[];
            for(let i=-14;i<=14;i++){const dt=new Date(dietDate);dt.setDate(dt.getDate()+i);const k=dk(dt);const cal=(diet[k]||{}).calories||0;dietCalDays.push({key:k,cal,isToday:k===dk(now),isFuture:new Date(k)>new Date(dk(now)),dayNum:dt.getDate(),dayName:dt.toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)});}
            return(<div>
              {/* Scrolling calendar — tap any day to log; past = backfill, future = plan ahead */}
              <div ref={dietCalRef} className="hide-scroll" style={{display:"flex",gap:4,overflowX:"auto",padding:"4px 0",marginBottom:8}}>
                {dietCalDays.map((dy,i)=>{const sel=dietDate===dy.key;return(
                  <div key={i} onClick={()=>setDietDate(dy.key)} style={{flex:"0 0 48px",textAlign:"center",padding:"6px 2px",borderRadius:8,cursor:"pointer",background:sel?C.accent:dy.cal>0?C.accentSoft:"transparent",border:sel?"1px solid transparent":dy.isToday?`1px solid ${C.accent}`:`1px solid ${C.hairline}`,transition:"all 0.2s ease",opacity:dy.isFuture&&!sel?0.65:1}}>
                    <div style={{fontSize:9,fontWeight:600,color:sel?"#0B1120":C.textDim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{dy.dayName}</div>
                    <div className="hero-num" style={{fontSize:16,color:sel?"#0B1120":dy.isToday?C.accent:C.text}}>{dy.dayNum}</div>
                    <div style={{fontFamily:FN.m,fontSize:8,fontWeight:600,color:sel?"rgba(11,17,32,0.7)":dy.cal>0?C.accent:C.textDim,marginTop:1}}>{dy.cal>0?Math.round(dy.cal):"·"}</div>
                  </div>
                );})}
              </div>
              {/* Selected-day label + quick jump to Today */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
                <span style={{fontSize:14,fontWeight:700,color:C.text}}>{isToday?"Today":new Date(dietDate).toLocaleDateString("en-US",{weekday:"long"})}</span>
                <span style={{fontSize:11,color:C.textDim,fontFamily:FN.m}}>{new Date(dietDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                {isFuture&&<span style={{fontSize:8,fontWeight:700,color:C.accent,background:C.accentSoft,borderRadius:4,padding:"2px 6px",textTransform:"uppercase",letterSpacing:"0.04em"}}>Planned</span>}
                {!isToday&&<button onClick={()=>setDietDate(dk(now))} style={{fontSize:9,fontWeight:700,color:C.textDim,background:"transparent",border:`1px solid ${C.hairline}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontFamily:FN.b}}>Today</button>}
              </div>

              {/* Calorie ring hero */}
              <div style={{...card,marginBottom:12,display:"flex",alignItems:"center",gap:20}}>
                <Ring value={d.calories||0} goal={g.calories||1} size={130} stroke={13} color={MACRO.calories.color}>
                  <div style={{fontSize:26,fontWeight:800,color:C.text,fontFamily:FN.m,lineHeight:1}}>{Math.round(d.calories||0)}</div>
                  <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>of {g.calories}</div>
                </Ring>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:C.textDim,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Calories</div>
                  <div style={{fontSize:30,fontWeight:800,color:MACRO.calories.color,fontFamily:FN.m,lineHeight:1}}>{calLeft}</div>
                  <div style={{fontSize:11,color:C.textDim,marginTop:2}}>remaining</div>
                  <div style={{height:6,background:C.surfaceDim,borderRadius:3,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${Math.min(100,(d.calories||0)/(g.calories||1)*100)}%`,background:MACRO.calories.color,borderRadius:3,transition:"width 0.5s ease"}}/></div>
                </div>
              </div>

              {/* Macro rings */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {macroCards.map(({k})=>{const m=MACRO[k];const val=d[k]||0,goal=g[k]||1;const left=Math.max(0,goal-val);return(
                  <div key={k} style={{...card,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <Ring value={val} goal={goal} size={78} stroke={8} color={m.color}>
                      <div style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:FN.m,lineHeight:1}}>{Math.round(val)}</div>
                      <div style={{fontSize:7,color:C.textDim,fontWeight:600}}>/{goal}g</div>
                    </Ring>
                    <div style={{fontSize:10,fontWeight:700,color:m.color,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:8}}>{m.label}</div>
                    <div style={{fontSize:9,color:C.textDim,fontFamily:FN.m,marginTop:1}}>{left}g left</div>
                  </div>
                );})}
              </div>

              {/* Macro breakdown */}
              {totalMacroG>0&&<div style={{...card,marginBottom:12}}>
                <div style={{...lbl,marginBottom:10}}>Macro Breakdown</div>
                <div style={{display:"flex",height:14,borderRadius:7,overflow:"hidden",marginBottom:10}}>
                  {macroCards.map(({k})=>{const m=MACRO[k];const w=(d[k]||0)/totalMacroG*100;return w>0?<div key={k} style={{width:`${w}%`,background:m.color,transition:"width 0.5s ease"}}/>:null;})}
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  {macroCards.map(({k})=>{const m=MACRO[k];const pctG=Math.round((d[k]||0)/totalMacroG*100);return(<div key={k} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:9,height:9,borderRadius:3,background:m.color}}/><span style={{fontSize:10,color:C.textSec,fontWeight:600}}>{m.label} {pctG}%</span></div>);})}
                </div>
              </div>}

              {/* Water tracker — ounce goal, each cup holds cupOz ounces */}
              {(()=>{
                const cupOz=Math.max(1,g.cupOz||8);
                const goalOz=Math.max(cupOz,g.water||64);
                const consumed=d.water||0;
                const numCups=Math.max(1,Math.ceil(goalOz/cupOz));
                const cap=numCups*cupOz;
                const pct=Math.min(100,consumed/goalOz*100);
                return(<div style={{...card,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{...lbl,margin:0}}>Water</div>
                    <span style={{fontSize:13,fontWeight:700,color:MACRO.water.color,fontFamily:FN.m}}>{Math.round(consumed)} <span style={{fontSize:10,color:C.textDim}}>/ {goalOz} oz</span></span>
                  </div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:12}}>{Math.max(0,goalOz-consumed).toFixed(0)} oz left · {cupOz} oz per cup</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {Array.from({length:numCups}).map((_,i)=>{
                      const lvl=Math.max(0,Math.min(1,(consumed-i*cupOz)/cupOz)); // 0..1 fill of this cup
                      const filled=lvl>=1;
                      return(<button key={i} onClick={()=>setDietMetric("water",Math.min(cap,(i+1)*cupOz===consumed?i*cupOz:(i+1)*cupOz))} title={`${cupOz} oz`} style={{width:32,height:40,borderRadius:"4px 4px 9px 9px",border:`2px solid ${lvl>0?MACRO.water.color:C.hairline}`,background:"transparent",cursor:"pointer",transition:"all 0.2s ease",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:2,overflow:"hidden",position:"relative"}}>
                        <div style={{width:"100%",height:`${lvl*100}%`,background:filled?MACRO.water.color:`${MACRO.water.color}88`,borderRadius:3,transition:"height 0.3s ease"}}/>
                      </button>);
                    })}
                  </div>
                  <div style={{height:6,background:C.surfaceDim,borderRadius:3,overflow:"hidden",marginBottom:12}}><div style={{height:"100%",width:`${pct}%`,background:MACRO.water.color,borderRadius:3,transition:"width 0.5s ease"}}/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setDietMetric("water",Math.max(0,consumed-cupOz))} style={{...btnG,flex:1}}>− Cup</button>
                    <button onClick={()=>setDietMetric("water",Math.min(cap,consumed+cupOz))} style={{...btnB,flex:1}}>+ Cup ({cupOz}oz)</button>
                  </div>
                </div>);
              })()}

              {/* Quick add */}
              <div style={{...card,marginBottom:12}}>
                <div style={{...lbl,marginBottom:12}}>Log Intake</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {["calories","protein","carbs","fat"].map(k=>(<div key={k}><div style={{fontSize:9,color:MACRO[k].color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3}}>{MACRO[k].label} ({MACRO[k].unit})</div><input type="number" value={dietAdd[k]} onChange={e=>setDietAdd(p=>({...p,[k]:e.target.value}))} placeholder="0" style={{...inp,textAlign:"center",fontFamily:FN.m}} onKeyDown={e=>{if(e.key==="Enter")commitDietAdd();}}/></div>))}
                </div>
                <button onClick={commitDietAdd} style={{...btnB,width:"100%"}}>Add to {isToday?"Today":"Day"}</button>
                <div style={{fontSize:9,color:C.textDim,textAlign:"center",marginTop:8,fontFamily:FN.m}}>Adds to your running totals. Leave blank to skip a field.</div>
              </div>

              {/* Goals editor */}
              <div style={{...card,padding:0,overflow:"hidden"}}>
                <button onClick={()=>setShowDietGoals(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer",padding:"14px 16px",textAlign:"left"}}><span style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Daily Goals</span><span style={{fontSize:13,color:C.textDim,transform:showDietGoals?"rotate(180deg)":"none",transition:"transform 0.2s ease"}}>▾</span></button>
                {showDietGoals&&<div style={{padding:"0 16px 16px"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{["calories","protein","carbs","fat","water"].map(k=>(<div key={k}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{MACRO[k].label} ({MACRO[k].unit}{k==="water"?" goal":""})</div><input type="number" value={dietGoals[k]} onChange={e=>setDietGoals(p=>({...p,[k]:parseFloat(e.target.value)||0}))} style={{...inp,textAlign:"center",fontFamily:FN.m,fontSize:12}}/></div>))}<div><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Cup Size (oz)</div><input type="number" value={dietGoals.cupOz} onChange={e=>setDietGoals(p=>({...p,cupOz:Math.max(1,parseFloat(e.target.value)||1)}))} style={{...inp,textAlign:"center",fontFamily:FN.m,fontSize:12}}/></div></div></div>}
              </div>
            </div>);
          })()}

          {/* ═══════════ PROGRESS ═══════════ */}
          {gView==="progress"&&(()=>{
            const exs=strengthData.exercises;
            const toggleEx=(name)=>{const cur=strExSel||exs;const next=cur.includes(name)?cur.filter(x=>x!==name):[...cur,name];setStrExSel(next.length===exs.length?null:next);};
            const colorFor=(name)=>EX_PALETTE[exs.indexOf(name)%EX_PALETTE.length];
            return(<div>
              {/* ─── Section 1: Strength progression ─── */}
              <div style={{...card,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{...lbl,margin:0}}>Strength Progression</div>
                  <div style={{display:"flex",gap:3,background:C.surfaceDim,borderRadius:9,padding:3}}>
                    {[{k:"cards",l:"By Exercise"},{k:"compare",l:"Compare"}].map(v=>{const on=strView===v.k;return(<button key={v.k} onClick={()=>setStrView(v.k)} style={{padding:"5px 11px",borderRadius:7,border:"none",background:on?C.accent:"transparent",color:on?C.btnText:C.textDim,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FN.b}}>{v.l}</button>);})}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:14}}>{[{k:"30",l:"30D"},{k:"90",l:"90D"},{k:"all",l:"All"}].map(r=>{const on=strRange===r.k;return(<button key={r.k} onClick={()=>setStrRange(r.k)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${on?C.accent:C.hairline}`,background:on?C.accentSoft:"transparent",color:on?C.accent:C.textDim,fontSize:10,fontWeight:700,cursor:"pointer"}}>{r.l}</button>);})}</div>

                {/* ═══ BY EXERCISE — organized cards grouped by split ═══ */}
                {strView==="cards"&&(exerciseStats.stats.length===0?<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>Add exercises to a split and log a workout to track progress.</div>:
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {exerciseStats.groups.map(group=>{
                      const sc=spClr[group.split]||C.accent;const collapsed=strCollapsed[group.split];
                      return(<div key={group.split}>
                        <button onClick={()=>setStrCollapsed(p=>({...p,[group.split]:!p[group.split]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 10px",textAlign:"left"}}>
                          <div style={{width:9,height:9,borderRadius:3,background:sc}}/>
                          <span style={{fontSize:12,fontWeight:800,color:sc,textTransform:"uppercase",letterSpacing:"0.08em"}}>{group.split}</span>
                          <span style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>{group.items.length}</span>
                          <div style={{flex:1}}/>
                          <span style={{fontSize:11,color:C.textDim,transform:collapsed?"rotate(-90deg)":"none",transition:"transform 0.2s ease"}}>▾</span>
                        </button>
                        {!collapsed&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {group.items.map(ex=>{
                            const has=ex.series.length>0;const expanded=strExpanded===ex.name;
                            const up=ex.change>0,flat=ex.change===0;
                            const trendC=!has?C.textDim:up?C.greenBright:flat?C.textDim:C.red;
                            // sparkline geometry
                            const ws=ex.series.map(s=>s.weight);const mn=Math.min(...ws,0),mx=Math.max(...ws,1);const rng=mx-mn||1;
                            const W=120,H=30;const pts=ex.series.map((s,i)=>{const x=ex.series.length>1?(i/(ex.series.length-1))*W:W/2;const y=H-((s.weight-mn)/rng)*H;return`${x.toFixed(1)},${y.toFixed(1)}`;}).join(" ");
                            return(<div key={ex.name} style={{borderRadius:12,background:C.surface,border:`1px solid ${expanded?sc:C.hairline}`,overflow:"hidden",transition:"border-color 0.2s ease"}}>
                              <button onClick={()=>has&&setStrExpanded(expanded?null:ex.name)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:"transparent",border:"none",cursor:has?"pointer":"default",textAlign:"left"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.name}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                                    {has?<span style={{fontSize:10,fontWeight:700,color:trendC,fontFamily:FN.m}}>{up?"▲":flat?"—":"▼"} {ex.change>0?"+":""}{ex.change} lb</span>:<span style={{fontSize:10,color:C.textDim,fontStyle:"italic"}}>no data yet</span>}
                                    {has&&<span style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>· PR {ex.pr} · {ex.sessions}×</span>}
                                  </div>
                                </div>
                                {has&&<svg width={W} height={H} style={{flexShrink:0,opacity:0.9}}><defs><linearGradient id={`g${ex.name.replace(/\W/g,"")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sc} stopOpacity="0.25"/><stop offset="100%" stopColor={sc} stopOpacity="0"/></linearGradient></defs>{ex.series.length>1&&<polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#g${ex.name.replace(/\W/g,"")})`}/>}{ex.series.length>1?<polyline points={pts} fill="none" stroke={sc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>:<circle cx={W/2} cy={H/2} r="3" fill={sc}/>}</svg>}
                                <div style={{textAlign:"right",flexShrink:0,minWidth:46}}>
                                  <div style={{fontSize:17,fontWeight:800,color:has?C.text:C.textDim,fontFamily:FN.m,lineHeight:1}}>{ex.latest||"—"}</div>
                                  <div style={{fontSize:8,color:C.textDim,fontWeight:600}}>lb</div>
                                </div>
                                {has&&<span style={{fontSize:11,color:C.textDim,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s ease",flexShrink:0}}>▾</span>}
                              </button>
                              {expanded&&has&&<div style={{padding:"0 8px 12px"}}>
                                <ResponsiveContainer width="100%" height={170}>
                                  <LineChart data={ex.series} margin={{top:5,right:10,left:-14,bottom:0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false}/>
                                    <XAxis dataKey="label" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
                                    <YAxis domain={["dataMin-5","dataMax+5"]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={34} unit="lb"/>
                                    <Tooltip content={<Tip />}/>
                                    <Line type="monotone" dataKey="weight" stroke={sc} strokeWidth={2.5} dot={{fill:sc,r:3,stroke:C.surface,strokeWidth:2}} name={ex.name}/>
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>}
                            </div>);
                          })}
                        </div>}
                      </div>);
                    })}
                  </div>
                )}

                {/* ═══ COMPARE — overlay a few exercises ═══ */}
                {strView==="compare"&&<div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:10,fontFamily:FN.m}}>Tap exercises below to overlay them. Keep it to a few for a clean read.</div>
                  {strRows.length>0&&strShownEx.length>0?<ResponsiveContainer width="100%" height={250}>
                    <LineChart data={strRows} margin={{top:5,right:8,left:-12,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false}/>
                      <XAxis dataKey="label" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={36} unit="lb"/>
                      <Tooltip content={<Tip />}/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                      {strShownEx.map(name=>(<Line key={name} type="monotone" dataKey={name} stroke={colorFor(name)} strokeWidth={2} dot={{r:2}} connectNulls name={name}/>))}
                      {strRows.length>6&&<Brush dataKey="label" height={20} stroke={C.accent} travellerWidth={8} fill={C.surfaceDim}/>}
                    </LineChart>
                  </ResponsiveContainer>:<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>{exs.length===0?"Log workouts to compare progression.":"Select exercises below to compare."}</div>}
                  {exs.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>{exs.map(name=>{const on=(strExSel||exs).includes(name);return(<button key={name} onClick={()=>toggleEx(name)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:14,border:`1px solid ${on?colorFor(name):C.hairline}`,background:on?`${colorFor(name)}1A`:"transparent",cursor:"pointer"}}><span style={{width:8,height:8,borderRadius:"50%",background:on?colorFor(name):C.textDim}}/><span style={{fontSize:10,fontWeight:600,color:on?C.text:C.textDim}}>{name}</span></button>);})}</div>}
                </div>}
              </div>


              {/* ─── Section 2: Nutrition progress ─── */}
              <div style={{...card,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><div style={{...lbl,margin:0}}>Nutrition</div><div style={{fontSize:9,color:C.textDim,fontFamily:FN.m}}>grams · oz · kcal</div></div>
                <div style={{display:"flex",gap:6,marginBottom:12,marginTop:10}}>{[{k:"30",l:"30D"},{k:"90",l:"90D"},{k:"all",l:"All"}].map(r=>{const on=nutriRange===r.k;return(<button key={r.k} onClick={()=>setNutriRange(r.k)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${on?C.accent:C.hairline}`,background:on?C.accentSoft:"transparent",color:on?C.accent:C.textDim,fontSize:10,fontWeight:700,cursor:"pointer"}}>{r.l}</button>);})}</div>
                {nutritionRows.length>0?(()=>{
                  const CHIP_H=18,CHIP_GAP=3,STACK_MAX=150; // px: height of each number block, gap, max macro-stack height
                  const showMac=["protein","carbs","fat"].filter(k=>nutriShow[k]);
                  // Grams axis is scaled only to the macro stack — water & calories are unrelated number blocks above it.
                  const maxG=Math.max(1,...nutritionRows.map(r=>showMac.reduce((a,k)=>a+(r[k]||0),0)));
                  const gridVals=[0,0.25,0.5,0.75,1].map(f=>Math.round(maxG*f));
                  const blocksAbove=(nutriShow.water?1:0)+(nutriShow.calories?1:0);
                  const colW=Math.max(40,Math.min(72,640/nutritionRows.length));
                  return(<div>
                    <div style={{display:"flex"}}>
                      {/* grams axis (left) — labels only the macro stack region */}
                      <div style={{width:30,position:"relative",height:STACK_MAX,flexShrink:0,marginTop:blocksAbove*(CHIP_H+CHIP_GAP)}}>
                        {gridVals.map((g,i)=>(<div key={i} style={{position:"absolute",right:4,bottom:`${(g/maxG)*100}%`,transform:"translateY(50%)",fontSize:8,color:C.textDim,fontFamily:FN.m}}>{g}</div>))}
                      </div>
                      {/* scrollable columns */}
                      <div className="hide-scroll" style={{flex:1,overflowX:"auto",paddingBottom:4}}>
                        <div style={{display:"flex",gap:6,alignItems:"flex-end",minWidth:"min-content"}}>
                          {nutritionRows.map((r,idx)=>{
                            const totG=showMac.reduce((a,k)=>a+(r[k]||0),0);
                            const stackH=(totG/maxG)*STACK_MAX;
                            return(<div key={idx} style={{width:colW,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center"}}>
                              {/* calories block (top) */}
                              {nutriShow.calories&&<div style={{height:CHIP_H,marginBottom:CHIP_GAP,width:"86%",borderRadius:5,background:`${MACRO.calories.color}26`,border:`1px solid ${MACRO.calories.color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:MACRO.calories.color,fontFamily:FN.m}}>{Math.round(r.calories)}</div>}
                              {/* water block (middle) */}
                              {nutriShow.water&&<div style={{height:CHIP_H,marginBottom:CHIP_GAP,width:"86%",borderRadius:5,background:`${MACRO.water.color}26`,border:`1px solid ${MACRO.water.color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:MACRO.water.color,fontFamily:FN.m}}>{Math.round(r.water)}<span style={{fontSize:7,marginLeft:1,opacity:0.8}}>oz</span></div>}
                              {/* macro stack (bottom, proportional grams) */}
                              <div title={`P ${r.protein} · C ${r.carbs} · F ${r.fat} g`} style={{height:STACK_MAX,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                                <div style={{height:stackH,width:"100%",display:"flex",flexDirection:"column",borderRadius:"5px 5px 0 0",overflow:"hidden",transition:"height 0.4s ease"}}>
                                  {showMac.map((k,i)=>{const h=totG>0?((r[k]||0)/totG)*100:0;const px=stackH*h/100;return h>0?<div key={k} style={{height:`${h}%`,background:MACRO[k].color,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{px>=13&&<span style={{fontSize:px>=20?9:8,fontWeight:800,color:"#fff",fontFamily:FN.m,lineHeight:1,textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{Math.round(r[k]||0)}</span>}</div>:null;})}
                                </div>
                              </div>
                              <div style={{fontSize:8,color:C.textDim,fontFamily:FN.m,marginTop:5,whiteSpace:"nowrap"}}>{r.label}</div>
                            </div>);
                          })}
                        </div>
                      </div>
                    </div>
                  </div>);
                })():<div style={{textAlign:"center",padding:30,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",fontSize:13}}>Log meals in the Diet tab to see nutrition trends.</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:14}}>{["protein","carbs","fat","water","calories"].map(k=>{const on=nutriShow[k];return(<button key={k} onClick={()=>setNutriShow(p=>({...p,[k]:!p[k]}))} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:14,border:`1px solid ${on?MACRO[k].color:C.hairline}`,background:on?`${MACRO[k].color}1A`:"transparent",cursor:"pointer"}}><span style={{width:8,height:8,borderRadius:2,background:on?MACRO[k].color:C.textDim}}/><span style={{fontSize:10,fontWeight:600,color:on?C.text:C.textDim}}>{MACRO[k].label}</span></button>);})}</div>
                <div style={{fontSize:9,color:C.textDim,fontFamily:FN.m,marginTop:8,lineHeight:1.5}}>Stacked blocks = grams of protein/carbs/fat (left axis). The water (oz) and calorie blocks above each day are standalone totals, not on the grams scale.</div>
              </div>


              {/* ─── Bodyweight ─── */}
              <div style={{...card,marginBottom:12}}>
                <div style={{...lbl,marginBottom:12}}>Bodyweight</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>{[{l:"Current",v:`${bwLog.length>0?bwLog[bwLog.length-1].weight:0}lb`,c:C.text},{l:"Start",v:`${bwLog.length>0?bwLog[0].weight:0}lb`,c:C.textDim},{l:"Change",v:`${bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0"}lb`,c:parseFloat(bwLog.length>=2?(bwLog[bwLog.length-1].weight-bwLog[0].weight).toFixed(1):"0")>0?C.greenBright:C.red}].map((s,i)=>(<div key={i} style={{background:C.surfaceDim,borderRadius:12,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{s.l}</div><div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:FN.m}}>{s.v}</div></div>))}</div>
                {bwLog.length>0&&<ResponsiveContainer width="100%" height={140}><LineChart data={bwLog.map(e=>({date:fd(e.date),weight:e.weight}))}><CartesianGrid strokeDasharray="3 3" stroke={C.surfaceDim} vertical={false} /><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} /><YAxis domain={["dataMin-1","dataMax+1"]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32} /><Tooltip content={<Tip />} /><Line type="monotone" dataKey="weight" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:3,stroke:"#fff",strokeWidth:2}} name="lb" /></LineChart></ResponsiveContainer>}
                <div style={{display:"flex",gap:8,marginTop:12}}><input type="number" step="0.1" value={nBW} onChange={e=>setNBW(e.target.value)} placeholder="Log weight (lbs)" style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==="Enter"){const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}}} /><button onClick={()=>{const w=parseFloat(nBW);if(w){setBwLog(p=>[...p,{date:dk(now),weight:w}]);setNBW("");}}} style={btnB}>Log</button></div>
              </div>
            </div>);
          })()}
        </div>}

        {/* ═══ BUDGET ═══ */}
        {menuTab==="budget"&&<div className="tab-content">
          {/* ═══ NET WORTH / DEBT ═══ */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{...card,padding:14,background:`linear-gradient(135deg, ${netWorthColor}26, ${netWorthColor}0A)`,border:`1px solid ${netWorthColor}50`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Net Worth</div>
              <div style={{fontSize:21,fontWeight:800,color:netWorthColor,fontFamily:FN.m}}>${netWorth.toFixed(2)}</div>
              <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,netWorth/netWorthGoal*100))}%`,background:netWorthColor,borderRadius:2,transition:"width 0.4s ease"}} /></div>
            </div>
            <div style={{...card,padding:14,background:`linear-gradient(135deg, ${debtColor}26, ${debtColor}0A)`,border:`1px solid ${debtColor}50`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Debt</div>
              <div style={{fontSize:21,fontWeight:800,color:debtColor,fontFamily:FN.m}}>${debt.toFixed(2)}</div>
              <div style={{height:4,background:C.surfaceDim,borderRadius:2,overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,debt/debtThreshold*100))}%`,background:debtColor,borderRadius:2,transition:"width 0.4s ease"}} /></div>
            </div>
          </div>

          {/* ═══ ACCOUNT GRID (2×2 — every balance is derived from the ledger below, never typed in directly) ═══ */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {ACCT_META.map(a=>{
              const bal=acctNow[a.key],trend=bal-acct30Ago[a.key],trendGood=a.key==="credit"?trend<=0:trend>=0;
              return(<div key={a.key} style={{...card,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:15}}>{a.icon}</span><span style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{a.label}</span></div>
                <div style={{fontSize:16,fontWeight:700,color:a.key==="credit"&&bal>0?C.red:C.text,fontFamily:FN.m}}>${bal.toFixed(2)}</div>
                {Math.abs(trend)>=0.01&&<div style={{fontSize:9,fontWeight:600,color:trendGood?C.green:C.red,fontFamily:FN.m,marginTop:2}}>{trend>=0?"↑":"↓"}${Math.abs(trend).toFixed(2)}<span style={{color:C.textDim,fontWeight:500}}> /30d</span></div>}
              </div>);
            })}
          </div>

          {/* ═══ Starting balances — entered once; every dollar after this comes from the ledger ═══ */}
          <div style={{...card,marginBottom:14,padding:0,overflow:"hidden"}}>
            <button onClick={()=>setShowFinSnap(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer",padding:"12px 16px",textAlign:"left"}}>
              <span style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Starting Balances</span>
              <span style={{fontSize:13,color:C.textDim,transform:showFinSnap?"rotate(180deg)":"none",transition:"transform 0.2s ease"}}>▾</span>
            </button>
            {showFinSnap&&<div style={{padding:"0 16px 16px"}}>
              <div style={{fontSize:10,color:C.textDim,marginBottom:10,lineHeight:1.5}}>What each account held before you started tracking. Every transaction below updates the totals above automatically — these fields don't need touching again.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {ACCT_META.map(a=>(
                  <div key={a.key} style={{background:C.surfaceDim,borderRadius:10,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3}}>{a.label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:2}}><span style={{fontSize:13,color:C.textDim,fontFamily:FN.m}}>$</span><input type="number" step="0.01" value={accounts[a.key]} onChange={e=>setAccounts(p=>({...p,[a.key]:e.target.value}))} placeholder="0.00" style={{background:"transparent",border:"none",outline:"none",color:C.text,fontSize:14,fontWeight:700,fontFamily:FN.m,width:"100%",padding:0}} /></div>
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* ═══ Subscriptions ═══ */}
          <div style={{...card,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Subscriptions</div>
              {!addSub&&<button onClick={()=>setAddSub(true)} style={{...btnG,padding:"4px 10px",fontSize:10}}>+ Add</button>}
            </div>
            {subscriptions.length===0&&!addSub&&<div style={{fontSize:11,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",padding:"6px 0 10px"}}>No subscriptions tracked yet.</div>}
            {subscriptions.map(s=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,borderRadius:10,background:C.surfaceDim}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{s.name}{s.category&&<span style={{fontSize:9,color:C.textDim,background:C.surfaceHi,borderRadius:4,padding:"1px 6px",marginLeft:6,fontWeight:600}}>{s.category}</span>}</div>
                  <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:1}}>Bills on the {s.billDay}{["th","st","nd","rd"][(parseInt(s.billDay)%10>3||[11,12,13].includes(parseInt(s.billDay)%100))?0:parseInt(s.billDay)%10]}</div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:FN.m}}>${(parseFloat(s.cost)||0).toFixed(2)}</span>
                <button onClick={()=>removeSubscription(s.id)} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:15}}>×</button>
              </div>
            ))}
            {addSub&&<div style={{background:C.surfaceDim,borderRadius:12,padding:12,marginTop:6,border:`1px solid ${C.hairline}`}}>
              <input value={subForm.name} onChange={e=>setSubForm(p=>({...p,name:e.target.value}))} placeholder="Name (e.g. Netflix)" style={{...inp,marginBottom:8}} autoFocus />
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,marginBottom:3,textTransform:"uppercase"}}>Monthly $</div><input type="number" step="0.01" value={subForm.cost} onChange={e=>setSubForm(p=>({...p,cost:e.target.value}))} placeholder="0.00" style={{...inp,textAlign:"center",fontFamily:FN.m}} /></div>
                <div style={{flex:1}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,marginBottom:3,textTransform:"uppercase"}}>Bill Day</div><input type="number" min="1" max="31" value={subForm.billDay} onChange={e=>setSubForm(p=>({...p,billDay:e.target.value}))} placeholder="1" style={{...inp,textAlign:"center",fontFamily:FN.m}} /></div>
              </div>
              <input value={subForm.category} onChange={e=>setSubForm(p=>({...p,category:e.target.value}))} placeholder="Category (optional)" style={{...inp,marginBottom:10}} />
              <div style={{display:"flex",gap:8}}><button onClick={addSubscription} style={{...btnB,flex:1}}>Add</button><button onClick={()=>{setAddSub(false);setSubForm({name:"",cost:"",billDay:"",category:""});}} style={btnG}>Cancel</button></div>
            </div>}
            {upcomingBills.length>0&&<div style={{marginTop:18}}>
              <div style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Upcoming Bills</div>
              {upcomingBills.slice(0,4).map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                  <div style={{width:34,textAlign:"center"}}><div style={{fontSize:9,color:C.accent,fontWeight:700,fontFamily:FN.m}}>{b.daysUntil===0?"NOW":`${b.daysUntil}d`}</div></div>
                  <span style={{flex:1,fontSize:12,fontWeight:600,color:C.text}}>{b.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:FN.m}}>${(parseFloat(b.cost)||0).toFixed(2)}</span>
                </div>
              ))}
            </div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red},{l:"Net",v:`${bTot.net>=0?"+":""}$${bTot.net.toFixed(2)}`,c:bTot.net>=0?C.green:C.red}].map((s,i)=>(<div key={i} style={{...card,padding:12}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div>))}</div>

          {/* ═══ Cash In / Cash Out / Transfer ledger calendar ═══ */}
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><button onClick={()=>setBMonth(new Date(bY,bM-1,1))} style={btnG}>‹</button><span style={{fontSize:14,fontWeight:700}}>{bMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setBMonth(new Date(bY,bM+1,1))} style={btnG}>›</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim,fontWeight:600}}>{d}</div>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{Array.from({length:bFD}).map((_,i)=><div key={`e${i}`} />)}{Array.from({length:bDIM}).map((_,i)=>{const d=i+1;const isT=bCM&&d===now.getDate();const dayTxs=bGT(d);const hasFlow=dayTxs.some(t=>t.type!=="transfer");const hasXfer=dayTxs.some(t=>t.type==="transfer");const net=bGN(d);const sel=selDay===d;return(<div key={d} onClick={()=>setSelDay(sel?null:d)} style={{aspectRatio:"1",borderRadius:8,cursor:"pointer",padding:3,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:sel?C.blueMed:hasFlow?(net>=0?C.greenSoft:C.redSoft):hasXfer?C.accentSoft:C.surfaceDim,border:isT?`2px solid ${C.blue}`:"1.5px solid transparent"}}><span style={{fontSize:12,fontWeight:isT?800:500,color:isT?C.blue:C.text}}>{d}</span>{hasFlow&&<span style={{fontSize:7,fontWeight:700,color:net>=0?C.green:C.red}}>{net>=0?"+":""}{net.toFixed(0)}</span>}{!hasFlow&&hasXfer&&<span style={{fontSize:7,fontWeight:700,color:C.accent}}>⇄</span>}</div>);})}</div>

            {selDay&&<div style={{marginTop:14,borderTop:`1px solid ${C.surfaceDim}`,paddingTop:14}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{new Date(bY,bM,selDay).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
              {bGT(selDay).length===0&&<div style={{fontSize:11,color:C.textDim,fontFamily:FN.h,fontStyle:"italic",padding:"2px 0 10px"}}>No transactions yet.</div>}
              {bGT(selDay).map(tx=>{
                const isXfer=tx.type==="transfer";
                const fromLbl=ACCT_META.find(a=>a.key===tx.account)?.label||"—";
                const toLbl=isXfer?(ACCT_META.find(a=>a.key===tx.toAccount)?.label||"—"):null;
                const clr=isXfer?C.accent:tx.type==="in"?C.greenBright:C.red;
                const bg=editingTx?.id===tx.id?C.blueMed:isXfer?C.accentSoft:tx.type==="in"?C.greenSoft:C.redSoft;
                return(<div key={tx.id} onClick={()=>startEditTx(selDay,tx)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:3,borderRadius:8,background:bg,cursor:"pointer"}}>
                  <span style={{fontSize:11,fontWeight:700,color:clr,width:14,flexShrink:0}}>{isXfer?"⇄":tx.type==="in"?"+":"−"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12}}>{tx.desc||(isXfer?"Transfer":"Transaction")}</div>
                    <div style={{fontSize:9,color:C.textDim,fontFamily:FN.m,marginTop:1}}>{isXfer?`${fromLbl} → ${toLbl}`:fromLbl}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:clr,flexShrink:0}}>${tx.amount.toFixed(2)}</span>
                  <button onClick={e=>{e.stopPropagation();rTx(selDay,tx.id);}} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:13,flexShrink:0}}>×</button>
                </div>);
              })}

              <div style={{marginTop:10,background:C.surfaceDim,borderRadius:10,padding:10}}>
                {editingTx&&<div style={{fontSize:10,color:C.accent,fontWeight:700,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>Editing transaction</span><button onClick={cancelEditTx} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,fontWeight:600}}>Cancel</button></div>}
                <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.hairline}`,marginBottom:8}}>
                  {["in","out","transfer"].map(tp=>(<button key={tp} onClick={()=>setTxF(p=>({...p,type:tp,toAccount:tp==="transfer"?p.toAccount:""}))} style={{flex:1,padding:"7px 0",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,textTransform:"uppercase",background:txF.type===tp?(tp==="in"?C.greenBright:tp==="out"?C.red:C.accent):"transparent",color:txF.type===tp?"#fff":C.textDim}}>{tp==="in"?"In":tp==="out"?"Out":"Transfer"}</button>))}
                </div>
                {txF.type!=="transfer"?
                  <select value={txF.account} onChange={e=>setTxF(p=>({...p,account:e.target.value}))} style={{...inp,marginBottom:8,padding:"9px 12px",fontSize:12}}>
                    <option value="">Select account…</option>
                    {ACCT_META.map(a=>(<option key={a.key} value={a.key}>{a.label}</option>))}
                  </select>
                :<div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
                    <select value={txF.account} onChange={e=>setTxF(p=>({...p,account:e.target.value}))} style={{...inp,flex:1,padding:"9px 8px",fontSize:11}}>
                      <option value="">From…</option>
                      {ACCT_META.map(a=>(<option key={a.key} value={a.key}>{a.label}</option>))}
                    </select>
                    <span style={{color:C.textDim,fontSize:12,flexShrink:0}}>→</span>
                    <select value={txF.toAccount} onChange={e=>setTxF(p=>({...p,toAccount:e.target.value}))} style={{...inp,flex:1,padding:"9px 8px",fontSize:11}}>
                      <option value="">To…</option>
                      {ACCT_META.filter(a=>a.key!==txF.account).map(a=>(<option key={a.key} value={a.key}>{a.label}</option>))}
                    </select>
                  </div>}
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input type="number" step="0.01" value={txF.amount} onChange={e=>setTxF(p=>({...p,amount:e.target.value}))} placeholder="$" style={{...inp,width:68,padding:"9px 6px",textAlign:"center"}} />
                  <input value={txF.desc} onChange={e=>setTxF(p=>({...p,desc:e.target.value}))} placeholder="Desc (optional)" style={{...inp,flex:1,padding:"9px 10px"}} onKeyDown={e=>{if(e.key==="Enter"&&txValid)aTx();}} />
                  <button onClick={aTx} disabled={!txValid} style={{...btnB,padding:"9px 14px",fontSize:11,opacity:txValid?1:0.4,cursor:txValid?"pointer":"default",flexShrink:0}}>{editingTx?"Save":"Add"}</button>
                </div>
                {!txValid&&(txF.amount||txF.account||txF.toAccount)&&<div style={{fontSize:9,color:C.red,marginTop:6}}>{!txF.account?"Select an account to continue.":txF.type==="transfer"&&(!txF.toAccount||txF.toAccount===txF.account)?"Choose a different destination account.":"Enter an amount greater than 0."}</div>}
              </div>
            </div>}
          </div>
          <div style={{...card,marginTop:12}}><div style={lbl}>Breakdown</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:30}}><ResponsiveContainer width={180} height={180}><PieChart><Pie data={[{name:"Income",value:Math.max(bTot.i,0.01)},{name:"Expenses",value:Math.max(bTot.o,0.01)}]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<Tip />} /></PieChart></ResponsiveContainer><div>{[{l:"Income",v:`$${bTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${bTot.o.toFixed(2)}`,c:C.red}].map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:3,background:s.c}} /><div><div style={{fontSize:11,color:C.textDim}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div></div>))}</div></div></div>
        </div>}

      </div>
      </div>

      {/* ═══ FIXED HERO COMPLETION (Today tab only — always visible while scrolling) ═══ */}
      {tab==="today"&&!menuTab&&(()=>{
        const pct=todayCompletion.pct;
        const lerp=(a,b,t)=>Math.round(a+(b-a)*t);
        let r,g,bl;
        if(theme==="light"){
          // Deeper red → deeper amber → deeper green for contrast on warm paper
          if(pct<=50){const t=pct/50;r=lerp(220,217,t);g=lerp(38,119,t);bl=lerp(38,6,t);}
          else{const t=(pct-50)/50;r=lerp(217,5,t);g=lerp(119,150,t);bl=lerp(6,105,t);}
        }else{
          if(pct<=50){const t=pct/50;r=lerp(248,251,t);g=lerp(113,191,t);bl=lerp(113,36,t);}
          else{const t=(pct-50)/50;r=lerp(251,52,t);g=lerp(191,211,t);bl=lerp(36,153,t);}
        }
        const numColor=`rgb(${r},${g},${bl})`;
        return(
          <div style={{position:"fixed",left:0,right:0,bottom:70,zIndex:99,background:theme==="light"?`linear-gradient(180deg,rgba(245,240,229,0) 0%,${C.bg} 40%)`:`linear-gradient(180deg,rgba(28,36,56,0.85) 0%,${C.surface} 30%)`,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderTop:`1px solid ${C.hairline}`,padding:"12px 24px 12px",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span>Today</span>
              <span style={{width:3,height:3,borderRadius:"50%",background:C.textDim}}/>
              <span style={{color:dailyLabel.color,fontWeight:700}}>{dailyLabel.text}</span>
            </div>
            <div className="hero-num" style={{fontSize:48,lineHeight:0.95,color:numColor,marginBottom:8,transition:"color 0.4s ease"}}>{pct}<span style={{fontSize:18,color:C.textDim}}>%</span></div>
            <div style={{height:5,background:C.surfaceDim,borderRadius:3,overflow:"hidden",margin:"0 auto",maxWidth:420}}>
              <div style={{height:"100%",width:`${pct}%`,background:numColor,borderRadius:3,transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease",boxShadow:pct>0?(theme==="light"?`0 0 8px ${numColor}40`:`0 0 14px ${numColor}80`):"none"}} />
            </div>
            <div style={{fontFamily:FN.m,fontSize:9,color:C.textDim,letterSpacing:"0.04em",marginTop:6}}>{todayCompletion.done} / {todayCompletion.total} tasks</div>
          </div>
        );
      })()}

      <div style={{position:"sticky",bottom:0,zIndex:100,background:C.surface,borderTop:`1px solid ${C.hairline}`,display:"flex",padding:"10px 6px",gap:2}}>
        {mainTabs.map(t=>{const on=curPage===t.k;return(
          <button key={t.k} onClick={()=>goPage(t.k)} className="press" style={{flex:1,minWidth:0,border:"none",borderRadius:10,padding:"8px 0",cursor:"pointer",textAlign:"center",background:"transparent",color:on?C.accent:C.textDim,fontSize:9,fontFamily:FN.b,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.02em",transition:"all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{t.i}</span>
            <span style={{whiteSpace:"nowrap"}}>{t.l}</span>
          </button>
        );})}
      </div>

      {/* ═══ SETTINGS ═══ */}
      <Overlay open={showSettings} onClose={()=>setShowSettings(false)} title="Settings">
        {/* ─── THEME TOGGLE ─── */}
        <div style={{marginBottom:22,padding:"14px 16px",background:C.surfaceDim,borderRadius:12,border:`1px solid ${C.hairline}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Appearance</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setTheme("dark")} style={{flex:1,background:theme==="dark"?C.accent:"transparent",border:`1px solid ${theme==="dark"?"transparent":C.hairline}`,borderRadius:10,padding:"14px 10px",color:theme==="dark"?C.btnText:C.text,cursor:"pointer",fontFamily:FN.b,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",transition:"all 0.3s ease",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <span>Dark</span>
            </button>
            <button onClick={()=>setTheme("light")} style={{flex:1,background:theme==="light"?C.accent:"transparent",border:`1px solid ${theme==="light"?"transparent":C.hairline}`,borderRadius:10,padding:"14px 10px",color:theme==="light"?C.btnText:C.text,cursor:"pointer",fontFamily:FN.b,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",transition:"all 0.3s ease",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <span>Light</span>
            </button>
          </div>
          <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginTop:8,textAlign:"center"}}>{theme==="dark"?"Navy editorial. Built for night.":"Warm paper. Built for day."}</div>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Time Ranges</div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Morning Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.morningStart} onChange={e=>setSettings(p=>({...p,morningStart:parseInt(e.target.value)||5}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.morningEnd} onChange={e=>setSettings(p=>({...p,morningEnd:parseInt(e.target.value)||12}))} style={{...numI,width:60}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Night Range</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={settings.nightStart} onChange={e=>setSettings(p=>({...p,nightStart:parseInt(e.target.value)||18}))} style={{...numI,width:60}} /><span style={{color:C.textDim}}>to</span><input type="number" value={settings.nightEnd} onChange={e=>setSettings(p=>({...p,nightEnd:parseInt(e.target.value)||23}))} style={{...numI,width:60}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Weekly Review Day</div><div style={{display:"flex",gap:4}}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>(<button key={d} onClick={()=>setSettings(p=>({...p,reviewDay:i}))} style={{...pill(settings.reviewDay===i),flex:1,fontSize:10,padding:"6px 0"}}>{d}</button>))}</div></div>

        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Carry unfinished focus to next day at</div>
          <select value={settings.focusTransferHour??22} onChange={e=>setSettings(p=>({...p,focusTransferHour:parseInt(e.target.value)}))} style={{...inp,width:"100%",cursor:"pointer"}}>
            {Array.from({length:24},(_,h)=>{const ampm=h<12?"AM":"PM";const h12=h%12===0?12:h%12;return(<option key={h} value={h}>{h12}:00 {ampm}</option>);})}
          </select>
          <div style={{fontSize:10,color:C.textDim,marginTop:5,lineHeight:1.45}}>Before this time, unfinished focus tasks stay on the day. After it, anything still open rolls over to the next day.</div>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Budget Thresholds</div>
        <div style={{fontSize:10,color:C.textDim,marginBottom:10,lineHeight:1.5}}>Controls where the Net Worth and Debt cards shift between red, yellow, and green.</div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Net Worth Goal — green at</div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:C.textDim,fontSize:13}}>$</span><input type="number" min="1" value={settings.netWorthGoal} onChange={e=>setSettings(p=>({...p,netWorthGoal:e.target.value}))} style={{...numI,width:90}} /></div></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Debt Warning — red at</div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:C.textDim,fontSize:13}}>$</span><input type="number" min="1" value={settings.debtWarningThreshold} onChange={e=>setSettings(p=>({...p,debtWarningThreshold:e.target.value}))} style={{...numI,width:90}} /></div></div>

        {/* Full Monthly View */}
        <div style={{marginTop:16,padding:"14px",background:C.surfaceDim,borderRadius:12,border:`1px solid ${C.hairline}`}}>
          <button onClick={()=>{setShowSettings(false);setShowFullView(true);}} style={{...btnB,width:"100%",background:C.accent,color:C.btnText}}>📊 Full Monthly View</button>
          <div style={{fontSize:10,color:C.textDim,textAlign:"center",marginTop:6}}>Spreadsheet-style overview of all habits this month</div>
        </div>

        {/* Storage Health Diagnostic */}
        <div style={{marginTop:18,paddingTop:16,borderTop:`1px solid ${C.surfaceDim}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Storage Health</div>
          {(()=>{
            let mainSize=0,photoSize=0;
            try{mainSize=new Blob([localStorage.getItem("dash-v18")||""]).size;}catch(e){}
            try{photoSize=new Blob([localStorage.getItem("dash-v18-photos")||""]).size;}catch(e){}
            const totalKB=Math.round((mainSize+photoSize)/1024);
            const mainKB=Math.round(mainSize/1024);
            const photoKB=Math.round(photoSize/1024);
            const pct=Math.round(totalKB/5120*100);
            const barColor=pct>80?C.red:pct>50?C.accent:C.green;
            return(<div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:8}}>
                <span>{totalKB} KB / 5,120 KB</span>
                <span style={{color:barColor}}>{pct}% used</span>
              </div>
              <div style={{height:6,background:C.surfaceDim,borderRadius:3,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:barColor,borderRadius:3,transition:"width 0.4s ease"}}/>
              </div>
              <div style={{fontSize:10,color:C.textDim,fontFamily:FN.m,marginBottom:4}}>App data: {mainKB} KB · Photos: {photoKB} KB ({photoLog.length} photos)</div>
              {photoKB>500&&<div style={{fontSize:10,color:C.orange,fontFamily:FN.m,marginBottom:8}}>⚠ Photos are using {photoKB} KB. Consider clearing old ones to free space.</div>}
              {photoLog.length>0&&<button onClick={()=>{if(confirm("Clear all proof photos? This frees storage but photos are gone forever.")){setPhotoLog([]);try{localStorage.removeItem("dash-v18-photos");}catch(e){}}}} style={{...btnG,width:"100%",fontSize:10,color:C.red,borderColor:C.red+"40"}}>Clear All Photos ({photoLog.length})</button>}
            </div>);
          })()}
        </div>
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

      {/* Goal edit (monthly aspirations + manual weekly) */}
      <Overlay open={!!editGoal} onClose={()=>setEditGoal(null)} title={editGoal?.kind==="weekly"?"Edit Weekly Goal":"Edit Goal"}>
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Name</div><input value={egText} onChange={e=>setEgText(e.target.value)} style={{...inp,fontSize:15}} /></div>
        {editGoal?.kind==="weekly"&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Weekly Target</div><input type="number" min="1" value={egNum} onChange={e=>setEgNum(e.target.value)} style={numI} /></div>}
        {editGoal?.kind==="monthly"&&editGoal?.goal?.goalType==="habit"&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Target Days / Month</div><input type="number" min="1" max="31" value={egNum} onChange={e=>setEgNum(e.target.value)} style={numI} /></div>}
        {editGoal?.kind==="monthly"&&editGoal?.goal?.goalType==="measurable"&&<><div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Total Hours</div><input type="number" min="1" value={egNum} onChange={e=>setEgNum(e.target.value)} style={numI} /></div><div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Deadline</div><input type="date" value={egDeadline} onChange={e=>setEgDeadline(e.target.value)} style={{...inp,fontFamily:FN.m}} /></div></>}
        {editGoal?.kind==="monthly"&&editGoal?.goal?.goalType==="outcome"&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.textDim,marginBottom:6}}>Steps</div>{egSteps.map((s,si)=>(<div key={s.id||si} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}><input value={s.text||""} onChange={e=>setEgSteps(p=>p.map((x,i)=>i===si?{...x,text:e.target.value}:x))} placeholder={`Step ${si+1}`} style={{...inp,flex:1,padding:"9px 12px"}} /><button onClick={()=>setEgSteps(p=>p.filter((_,i)=>i!==si))} style={{...btnG,color:C.red,padding:"6px 10px"}}>×</button></div>))}<button onClick={()=>setEgSteps(p=>[...p,{id:uid(),text:"",done:false}])} style={{width:"100%",background:"transparent",border:`1px dashed ${C.hairline}`,borderRadius:8,padding:9,color:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>+ Add step</button></div>}
        <div style={{display:"flex",gap:8}}><button className="press" onClick={saveGoalEdit} style={{...btnB,flex:1,background:C.green}}>Save</button><button onClick={deleteGoalEdit} style={{...btnG,color:C.red}}>Delete</button></div>
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

      {/* ═══ EXPORT WIZARD ═══ */}
      <Overlay open={showExport} onClose={()=>setShowExport(false)} title="Export Report">
        {exportStep===1&&<div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>Which sections?</div>
          <div style={{fontSize:11,color:C.textDim,marginBottom:14}}>Select one or more to include.</div>
          {[{k:"analytics",l:"Analytics",d:"Habit consistency, streaks, focus productivity"},{k:"goals",l:"Goals",d:"Weekly, monthly & measurable goal progress"},{k:"workouts",l:"Health · Workouts",d:"Sessions, volume, strength PRs, bodyweight"},{k:"nutrition",l:"Health · Nutrition",d:"Calorie & macro averages vs. goals"},{k:"budget",l:"Budget",d:"Net worth, cash flow, accounts, subscriptions"}].map(s=>{const on=exportSections[s.k];return(
            <div key={s.k} onClick={()=>setExportSections(p=>({...p,[s.k]:!p[s.k]}))} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:10,cursor:"pointer",background:on?C.accentSoft:C.surfaceDim,border:`1px solid ${on?C.accentMed:C.hairline}`}}>
              <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${on?C.accent:C.textDim}`,background:on?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:11,fontWeight:800,flexShrink:0}}>{on&&"✓"}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{s.l}</div><div style={{fontSize:10,color:C.textDim,marginTop:1}}>{s.d}</div></div>
            </div>);})}
          <button onClick={()=>setExportStep(2)} disabled={!Object.values(exportSections).some(Boolean)} style={{...btnB,width:"100%",marginTop:10,opacity:Object.values(exportSections).some(Boolean)?1:0.4}}>Next</button>
        </div>}
        {exportStep===2&&<div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Timeframe</div>
          {[{k:"7",l:"Last 7 Days"},{k:"30",l:"Last 30 Days"},{k:"month",l:"This Month"},{k:"custom",l:"Custom Range"}].map(r=>{const on=exportRange===r.k;return(
            <div key={r.k} onClick={()=>setExportRange(r.k)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:10,cursor:"pointer",background:on?C.accentSoft:C.surfaceDim,border:`1px solid ${on?C.accentMed:C.hairline}`}}>
              <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${on?C.accent:C.textDim}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<div style={{width:9,height:9,borderRadius:"50%",background:C.accent}}/>}</div>
              <span style={{fontSize:13,fontWeight:600,color:C.text}}>{r.l}</span>
            </div>);})}
          {exportRange==="custom"&&<div style={{display:"flex",gap:8,marginTop:8,marginBottom:4}}>
            <div style={{flex:1}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,marginBottom:4,textTransform:"uppercase"}}>From</div><input type="date" value={exportCustomStart} onChange={e=>setExportCustomStart(e.target.value)} style={{...inp,fontFamily:FN.m,fontSize:12}}/></div>
            <div style={{flex:1}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,marginBottom:4,textTransform:"uppercase"}}>To</div><input type="date" value={exportCustomEnd} onChange={e=>setExportCustomEnd(e.target.value)} style={{...inp,fontFamily:FN.m,fontSize:12}}/></div>
          </div>}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>setExportStep(1)} style={btnG}>Back</button>
            <button onClick={generateExport} style={{...btnB,flex:1}}>Generate PDF</button>
          </div>
          <div style={{fontSize:10,color:C.textDim,marginTop:10,lineHeight:1.5,textAlign:"center"}}>A print dialog opens — choose "Save as PDF". If your device can't print, the report downloads as a file you can open and save as PDF.</div>
        </div>}
      </Overlay>

      {/* ═══ ACTIVE WORKOUT SESSION — fullscreen focus mode (hidden when minimized) ═══ */}
      {activeSession&&!sessionMinimized&&<div style={{position:"fixed",inset:0,zIndex:300,background:C.bg,display:"flex",flexDirection:"column",fontFamily:FN.b}}>
        {/* Finish overlay */}
        {finishingSession&&<div style={{position:"absolute",inset:0,zIndex:10,background:`radial-gradient(circle at center,${C.accentSoft},${C.bg} 70%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"finishGlow 1.8s ease forwards"}}>
          <div style={{width:120,height:120,borderRadius:"50%",border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,boxShadow:`0 0 60px ${C.accent}80`}}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="display" style={{fontSize:32,fontStyle:"italic",color:C.text,marginBottom:8,textTransform:"none"}}>Done.</div>
          <div style={{fontFamily:FN.m,fontSize:12,color:C.textDim,animation:"finishFade 1.2s ease forwards",letterSpacing:"0.18em",textTransform:"uppercase"}}>{fmtTime(sessionElapsed)} · {activeSession.split}</div>
          <div style={{position:"absolute",left:0,right:0,top:"50%",height:2,background:`linear-gradient(90deg,transparent,${C.accent},transparent)`,backgroundSize:"200% 100%",animation:"finishSweep 1.6s ease forwards",pointerEvents:"none"}}/>
        </div>}
        {/* Header: stopwatch + cancel */}
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.hairline}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surface}}>
          <div>
            <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2}}>{activeSession.split}</div>
            <div className="hero-num" style={{fontSize:34,color:C.accent,lineHeight:1}}>{fmtTime(sessionElapsed)}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSessionMinimized(true)} style={{background:"transparent",border:`1px solid ${C.hairline}`,borderRadius:8,padding:"8px 12px",color:C.textDim,fontSize:10,fontFamily:FN.b,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:6}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>Minimize</button>
            <button onClick={cancelSession} style={{background:"transparent",border:`1px solid ${C.hairline}`,borderRadius:8,padding:"8px 14px",color:C.textDim,fontSize:10,fontFamily:FN.b,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em"}}>Cancel</button>
          </div>
        </div>
        {/* Exercises */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px 24px"}}>
          {activeSession.exercises.map((ex,ei)=>{const lE=lastSess?.exercises?.find(e=>e.name===ex.name);const dn=doneEx[ei];return(
            <div key={ei} style={{...card,marginBottom:12,background:dn?C.greenSoft:C.surface,border:`1px solid ${dn?C.greenMed:C.hairline}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:700,color:dn?C.green:C.text,fontFamily:FN.h,fontStyle:"italic"}}>{dn&&"✓ "}{ex.name}</span>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>setDoneEx(p=>({...p,[ei]:!p[ei]}))} style={{...pill(dn,C.green),padding:"4px 10px",fontSize:9}}>Done</button>
                  <button onClick={()=>rSet(ei)} style={{...btnG,padding:"4px 8px",fontSize:13}}>−</button>
                  <button onClick={()=>aSet(ei)} style={{...btnG,padding:"4px 8px",fontSize:13}}>+</button>
                </div>
              </div>
              {ex.sets.map((s,si)=>{const ls=lE?.sets?.[si];const wd=ls?s.w-ls.w:null;return(
                <div key={si} style={{display:"grid",gridTemplateColumns:"32px 1fr 1fr 56px",gap:6,marginBottom:6,alignItems:"center"}}>
                  <span style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:FN.m}}>S{si+1}</span>
                  <input type="number" inputMode="decimal" value={s.w||""} onChange={e=>uSet(ei,si,"w",e.target.value)} placeholder="lbs" style={{...numI,padding:"12px 8px",fontSize:15}}/>
                  <input type="number" inputMode="numeric" value={s.r||""} onChange={e=>uSet(ei,si,"r",e.target.value)} placeholder="reps" style={{...numI,padding:"12px 8px",fontSize:15}}/>
                  <span style={{fontSize:9,textAlign:"center",fontWeight:600,fontFamily:FN.m,color:ls?(wd>0?C.green:wd<0?C.red:C.textDim):C.textDim}}>{ls?`${ls.w}×${ls.r}`:"—"}</span>
                </div>
              );})}
            </div>
          );})}
        </div>
        {/* Finish button */}
        <div style={{padding:"14px 22px 18px",background:C.surface,borderTop:`1px solid ${C.hairline}`}}>
          <button onClick={finishSession} className="press" style={{width:"100%",background:C.accent,border:"none",borderRadius:12,padding:"18px 0",color:C.btnText,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.16em",boxShadow:`0 4px 20px ${C.accent}40`}}>Finish Workout</button>
          <div style={{fontFamily:FN.m,fontSize:9,color:C.textDim,textAlign:"center",marginTop:8,letterSpacing:"0.04em"}}>● auto-saving every keystroke</div>
        </div>
      </div>}

      {/* ═══ GRADUATION CEREMONY — full-screen celebration when a goal becomes a habit ═══ */}
      {graduatingGoal&&(()=>{
        // Compute the stats we'll show
        const ap=aspirationProgress.find(x=>x.id===graduatingGoal.id);
        const created=graduatingGoal.created?new Date(graduatingGoal.created):new Date(now.getFullYear(),now.getMonth()-3,1);
        const daysSince=Math.max(1,Math.round((now-created)/(24*60*60*1000)));
        const monthsSince=Math.max(1,Math.round(daysSince/30));
        // Count total hits across all time (not just this month)
        let totalHits=0;Object.values(checks).forEach(ch=>{if(ch[graduatingGoal.id])totalHits++;});
        return(<div style={{position:"fixed",inset:0,zIndex:400,background:`radial-gradient(circle at center,${C.surface} 0%,${C.bg} 75%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",animation:"graduateBloom 1.2s cubic-bezier(0.34,1.2,0.64,1) forwards",fontFamily:FN.b}}>
          {/* Ambient amber glow */}
          <div style={{position:"absolute",left:"50%",top:"50%",width:400,height:400,marginLeft:-200,marginTop:-200,background:`radial-gradient(circle,${C.accentSoft} 0%,transparent 60%)`,animation:"graduateShimmer 3s ease-in-out infinite",pointerEvents:"none"}}/>
          {/* Drawing ring behind the name */}
          <div style={{position:"relative",width:220,height:220,marginBottom:28}}>
            <svg width="220" height="220" viewBox="0 0 220 220" style={{position:"absolute",inset:0}}>
              <circle cx="110" cy="110" r="100" fill="none" stroke={C.hairline} strokeWidth="1"/>
              <circle cx="110" cy="110" r="100" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="628" strokeDashoffset="628" style={{animation:"graduateRing 2.2s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s forwards",transform:"rotate(-90deg)",transformOrigin:"110px 110px",filter:`drop-shadow(0 0 12px ${C.accent}60)`}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24}}>
              <div style={{fontSize:9,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>Graduated</div>
              <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,lineHeight:1.15}}>{graduatingGoal.dailyAction||graduatingGoal.text}</div>
            </div>
          </div>
          {/* The three-sentence emotional payoff */}
          <div style={{textAlign:"center",maxWidth:340,marginBottom:36,position:"relative"}}>
            <div style={{fontSize:13,color:C.textSec,lineHeight:1.6,fontFamily:FN.b,marginBottom:14}}>
              You set this as a goal <span style={{color:C.accent,fontWeight:700}}>{monthsSince} {monthsSince===1?"month":"months"}</span> ago.
            </div>
            <div style={{fontSize:13,color:C.textSec,lineHeight:1.6,fontFamily:FN.b,marginBottom:14}}>
              You hit it <span style={{color:C.accent,fontWeight:700}}>{totalHits} {totalHits===1?"time":"times"}</span> — <span style={{color:C.accent,fontWeight:700}}>{ap?ap.pct:80}%</span> this month alone.
            </div>
            <div className="display" style={{fontSize:17,fontStyle:"italic",color:C.text,lineHeight:1.4,marginTop:20}}>
              This isn't effort anymore — it's who you are.
            </div>
          </div>
          {/* Single CTA */}
          <button onClick={finalizeGraduation} className="press" style={{background:C.accent,border:"none",borderRadius:12,padding:"16px 36px",color:C.btnText,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:FN.b,textTransform:"uppercase",letterSpacing:"0.18em",boxShadow:`0 6px 28px ${C.accent}50, 0 0 0 1px ${C.accent}30`}}>Welcome Home</button>
          {/* Secondary escape (quiet) */}
          <button onClick={()=>setGraduatingGoal(null)} style={{background:"transparent",border:"none",color:C.textDim,fontSize:10,fontFamily:FN.b,cursor:"pointer",marginTop:18,letterSpacing:"0.06em",opacity:0.5}}>Not yet</button>
        </div>);
      })()}

      {/* ═══ FULL MONTHLY VIEW — spreadsheet-style overview ═══ */}
      {showFullView&&<div style={{position:"fixed",inset:0,zIndex:250,background:C.bg,display:"flex",flexDirection:"column",fontFamily:FN.b}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.hairline}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface}}>
          <div>
            <div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em"}}>Monthly Progress</div>
            <div className="display" style={{fontSize:20,fontStyle:"italic",color:C.text}}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][now.getMonth()]} {now.getFullYear()}</div>
          </div>
          <button onClick={()=>setShowFullView(false)} className="press" style={{background:C.surfaceHi,border:`1px solid ${C.hairline}`,color:C.textDim,fontSize:14,cursor:"pointer",width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 0"}}>
          {(()=>{
            const y=now.getFullYear(),mo=now.getMonth();
            const daysInMonth=new Date(y,mo+1,0).getDate();
            const days=Array.from({length:daysInMonth},(_,i)=>i+1);
            const dayLabels=days.map(d=>{const dt=new Date(y,mo,d);return["SU","MO","TU","WE","TH","FR","SA"][dt.getDay()];});
            const morningItems=activeTodos(dk(now)).filter(t=>t.grp==="morning");
            const nightItems=activeTodos(dk(now)).filter(t=>t.grp==="night");
            const generalItems=activeTodos(dk(now)).filter(t=>t.grp==="general");
            const cellW=28,labelW=100,hdrH=36;
            const renderSection=(title,items,color)=>{
              // Compute per-habit monthly %
              const habitStats=items.map(t=>{
                let hit=0;
                days.forEach(d=>{
                  const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  if((checks[k]||{})[t.id])hit++;
                });
                const pct=days.length>0?Math.round(hit/daysInMonth*100):0;
                return{...t,hit,pct};
              });
              const sectionAvg=habitStats.length>0?Math.round(habitStats.reduce((a,h)=>a+h.pct,0)/habitStats.length):0;
              return(<div style={{marginBottom:24}}>
                <div style={{padding:"0 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{title}</span>
                  <span style={{fontSize:20,fontWeight:800,fontFamily:FN.m,color}}>{sectionAvg}%</span>
                </div>
                <div style={{overflowX:"auto",paddingLeft:14,paddingRight:14}} className="hide-scroll">
                  <div style={{display:"inline-block",minWidth:labelW+days.length*cellW+60}}>
                    {/* Day headers */}
                    <div style={{display:"flex",marginBottom:2}}>
                      <div style={{width:labelW,flexShrink:0}}/>
                      {days.map(d=>(<div key={d} style={{width:cellW,textAlign:"center",fontSize:7,color:C.textDim,fontFamily:FN.m}}>{dayLabels[d-1]}</div>))}
                      <div style={{width:50,textAlign:"center",fontSize:7,color:C.textDim,fontFamily:FN.m}}>%</div>
                    </div>
                    <div style={{display:"flex",marginBottom:4}}>
                      <div style={{width:labelW,flexShrink:0}}/>
                      {days.map(d=>(<div key={d} style={{width:cellW,textAlign:"center",fontSize:8,color:C.textDim,fontFamily:FN.m,fontWeight:600}}>{d}</div>))}
                      <div style={{width:50}}/>
                    </div>
                    {/* Habit rows */}
                    {habitStats.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",marginBottom:1}}>
                      <div style={{width:labelW,flexShrink:0,fontSize:12,fontWeight:600,color:C.text,textTransform:"uppercase",letterSpacing:"0.04em",paddingRight:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
                      {days.map(d=>{
                        const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                        const done=(checks[k]||{})[t.id];
                        const isToday=d===now.getDate();
                        return(<div key={d} style={{width:cellW,height:cellW-4,display:"flex",alignItems:"center",justifyContent:"center",background:done?`${color}30`:isToday?C.surfaceHi:"transparent",borderRadius:3,margin:"0 0.5px"}}>
                          {done&&<div style={{width:8,height:8,borderRadius:2,background:color}}/>}
                        </div>);
                      })}
                      <div style={{width:50,textAlign:"center",fontSize:9,fontWeight:700,fontFamily:FN.m,color:t.pct>=80?C.green:t.pct>=50?C.accent:C.red}}>{t.pct}%</div>
                    </div>))}
                  </div>
                </div>
              </div>);
            };
            // Daily completion row
            const dailyPcts=days.map(d=>{
              const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const ch=checks[k]||{};
              const all=[...activeTodos(k)];
              if(all.length===0)return 0;
              return Math.round(all.filter(t=>ch[t.id]).length/all.length*100);
            });
            return(<div>
              {morningItems.length>0&&renderSection("Morning",morningItems,C.accent)}
              {nightItems.length>0&&renderSection("Evening",nightItems,C.blue||"#60A5FA")}
              {generalItems.length>0&&renderSection("All Day",generalItems,C.green)}
              {/* Daily completion strip */}
              <div style={{padding:"0 14px",marginTop:8}}>
                <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Daily Completion</div>
                <div style={{overflowX:"auto"}} className="hide-scroll">
                  <div style={{display:"inline-flex",gap:2,minWidth:daysInMonth*cellW}}>
                    {days.map(d=>{const p=dailyPcts[d-1];const isToday=d===now.getDate();return(
                      <div key={d} style={{width:cellW-2,textAlign:"center"}}>
                        <div style={{height:40,borderRadius:4,background:p>0?`linear-gradient(180deg,${p>=80?C.green:p>=50?C.accent:C.red}${Math.round(p*0.7+30).toString(16)},${C.surfaceDim})`:C.surfaceDim,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:2,border:isToday?`1px solid ${C.accent}`:"1px solid transparent"}}>
                          <span style={{fontSize:7,fontFamily:FN.m,fontWeight:700,color:p>=50?"#fff":C.textDim}}>{p>0?p:""}</span>
                        </div>
                        <div style={{fontSize:7,color:C.textDim,fontFamily:FN.m,marginTop:2}}>{d}</div>
                      </div>
                    );})}
                  </div>
                </div>
              </div>
              {/* Monthly goals */}
              {aspirations.filter(a=>!a.graduated).length>0&&<div style={{padding:"0 14px",marginTop:24}}>
                <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Monthly Goals</div>
                {aspirations.filter(a=>!a.graduated).map(a=>{const p=aspirationProgress.find(x=>x.id===a.id);return(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:`1px solid ${C.hairline}`}}>
                    <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${p?.pct>=80?C.green:C.textDim}`,background:p?.pct>=100?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.btnText,fontSize:8,fontWeight:800,flexShrink:0}}>{p?.pct>=100&&"✓"}</div>
                    <span style={{fontSize:12,fontWeight:500,flex:1,color:C.text}}>{a.text}</span>
                    <span style={{fontSize:10,fontFamily:FN.m,fontWeight:700,color:p?.onPace?C.green:C.red}}>{p?.pct||0}%</span>
                  </div>
                );})}
              </div>}
            </div>);
          })()}
        </div>
      </div>}

      {/* ═══ SAVE ERROR TOAST — visible when localStorage writes fail ═══ */}
      {saveError&&<div onClick={()=>setSaveError(null)} style={{position:"fixed",left:12,right:12,top:16,zIndex:500,background:C.red,borderRadius:10,padding:"12px 16px",color:"#fff",fontSize:11,fontFamily:FN.b,fontWeight:600,display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(239,68,68,0.4)",cursor:"pointer"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{saveError}</span>
        <span style={{marginLeft:"auto",opacity:0.7,fontSize:9}}>TAP TO DISMISS</span>
      </div>}

      {/* ═══ MINIMIZED SESSION PILL — sits at top so user can resume anytime ═══ */}
      {activeSession&&sessionMinimized&&<button onClick={()=>setSessionMinimized(false)} className="press" style={{position:"fixed",left:"50%",top:14,transform:"translateX(-50%)",zIndex:120,background:C.accent,border:"none",borderRadius:24,padding:"10px 20px",color:C.btnText,fontSize:11,fontFamily:FN.b,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.08em",boxShadow:`0 6px 24px ${C.accent}60, 0 2px 8px rgba(0,0,0,0.4)`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:"#0B1120",animation:"sunPulse 1.6s ease-in-out infinite"}}/>
        <span>{activeSession.split} · {fmtTime(sessionElapsed)}</span>
        <span style={{fontSize:9,opacity:0.7}}>RESUME →</span>
      </button>}

      {/* ═══ CANCEL CONFIRM DIALOG ═══ */}
      {showCancelConfirm&&<div onClick={()=>setShowCancelConfirm(false)} style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(5,8,16,0.85)",backdropFilter:"blur(10px)"}}/>
        <div onClick={e=>e.stopPropagation()} className="modal-box" style={{position:"relative",background:C.surface,color:C.text,borderRadius:16,padding:28,width:"86%",maxWidth:380,border:`1px solid ${C.hairline}`,textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
          <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,marginBottom:8}}>Cancel workout?</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:24,fontFamily:FN.m,lineHeight:1.5}}>All sets logged in this session will be lost. This can't be undone.</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowCancelConfirm(false)} style={{...btnG,flex:1,padding:"12px 0"}}>Keep Going</button>
            <button onClick={confirmCancel} style={{...btnB,flex:1,background:C.red,color:"#fff",padding:"12px 0"}}>Discard</button>
          </div>
        </div>
      </div>}

      {/* ═══ WORKOUT DETAIL MODAL — view a saved workout's full set/weight/rep summary ═══ */}
      <Overlay open={!!viewWorkout} onClose={()=>setViewWorkout(null)} title={viewWorkout?`${viewWorkout.split.toUpperCase()} · ${fd(viewWorkout.date)}`:""} wide>
        {viewWorkout&&<div>
          {viewWorkout.duration&&<div style={{fontSize:11,color:C.textDim,fontFamily:FN.m,marginBottom:18,letterSpacing:"0.04em"}}>Duration: {fmtTime(Math.floor(viewWorkout.duration/1000))} · {viewWorkout.exercises.length} exercises · {viewWorkout.exercises.reduce((a,e)=>a+e.sets.length,0)} sets total</div>}
          {viewWorkout.exercises.map((ex,ei)=>{const totalVol=ex.sets.reduce((a,s)=>a+(s.w||0)*(s.r||0),0);return(
            <div key={ei} style={{...card,padding:16,marginBottom:10,background:C.surfaceDim,border:`1px solid ${C.hairline}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:FN.h,fontStyle:"italic"}}>{ex.name}</span>
                <span style={{fontSize:10,fontFamily:FN.m,color:C.textDim,letterSpacing:"0.04em"}}>{Math.round(totalVol)} kg vol</span>
              </div>
              {ex.sets.map((s,si)=>(
                <div key={si} style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr",gap:10,padding:"6px 0",borderTop:si>0?`1px solid ${C.hairline}`:"none",alignItems:"center"}}>
                  <span style={{fontSize:10,fontFamily:FN.m,color:C.accent,fontWeight:700}}>S{si+1}</span>
                  <span style={{fontFamily:FN.m,fontSize:14,color:C.text}}>{s.w||0}<span style={{fontSize:10,color:C.textDim,marginLeft:4}}>lb</span></span>
                  <span style={{fontFamily:FN.m,fontSize:14,color:C.text}}>{s.r||0}<span style={{fontSize:10,color:C.textDim,marginLeft:4}}>reps</span></span>
                </div>
              ))}
            </div>
          );})}
        </div>}
      </Overlay>

      {/* ═══ FLOATING QUICK CAPTURE BUTTON ═══ */}
      {/* ═══ QUICK CAPTURE MODAL ═══ */}
      {showQuick&&<div onClick={()=>setShowQuick(false)} style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div className="overlay-bg" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}}/>
        <div onClick={e=>e.stopPropagation()} className="modal-box" style={{position:"relative",background:C.surface,borderTopLeftRadius:24,borderTopRightRadius:24,padding:"24px 22px 32px",width:"100%",maxWidth:560,border:`1px solid ${C.hairline}`,borderBottom:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:11,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Quick Capture</span>
            <button onClick={()=>setShowQuick(false)} style={{background:"transparent",border:"none",color:C.textDim,fontSize:20,cursor:"pointer"}}>×</button>
          </div>
          <input autoFocus value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submitQuick();}} placeholder="What needs doing?" style={{...inp,fontSize:16,padding:"14px 16px",fontFamily:FN.h,fontStyle:"italic"}}/>
          {quickPreview&&quickPreview.text&&<div style={{marginTop:14,padding:"12px 14px",background:C.surfaceDim,borderRadius:10,border:`1px solid ${C.hairline}`}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Preview</div>
            <div style={{fontSize:14,color:C.text,marginBottom:8}}>{quickPreview.text}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontFamily:FN.m,color:C.accent,background:C.accentSoft,padding:"3px 8px",borderRadius:4}}>{quickPreview.recurring?"recurring":quickPreview.when}</span>
              <span style={{fontSize:10,fontFamily:FN.m,color:DIFF[quickPreview.diff].color,background:DIFF[quickPreview.diff].bg,padding:"3px 8px",borderRadius:4}}>{quickPreview.diff}</span>
              {quickPreview.proof&&<span style={{fontSize:10,fontFamily:FN.m,color:C.textSec,background:C.surfaceHi,padding:"3px 8px",borderRadius:4}}>📷 proof</span>}
              {quickPreview.group&&<span style={{fontSize:10,fontFamily:FN.m,color:C.textSec,background:C.surfaceHi,padding:"3px 8px",borderRadius:4}}>{quickPreview.group}</span>}
            </div>
          </div>}
          <div style={{fontSize:10,color:C.textDim,marginTop:10,fontFamily:FN.m,lineHeight:1.6}}>Try: "gym tomorrow", "spanish daily", "!hard read 30 min", "📷 workout monday"</div>
          <button onClick={submitQuick} style={{...btnB,width:"100%",marginTop:14,padding:"14px"}}>Add Task</button>
        </div>
      </div>}

      {/* ═══ REFLECT MODAL ═══ */}
      <Overlay open={showReflect} onClose={()=>setShowReflect(false)} title="End of Day · Reflect">
        <div style={{fontSize:11,color:C.textDim,marginBottom:18,fontFamily:FN.m}}>Two questions. One sentence each. Thirty seconds.</div>
        {pickPrompts(todayCompletion.pct).map((prompt,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div className="display" style={{fontSize:16,fontStyle:"italic",color:C.text,marginBottom:8}}>{prompt}</div>
            <textarea autoFocus={i===0} value={reflectAnswers[i]||""} onChange={e=>setReflectAnswers(p=>{const n=[...p];n[i]=e.target.value;return n;})} placeholder="…" rows={2} style={{...inp,fontFamily:FN.b,fontSize:13,resize:"none",lineHeight:1.5}}/>
          </div>
        ))}
        <button onClick={saveReflect} style={{...btnB,width:"100%",marginTop:8}}>Save Reflection</button>
      </Overlay>

      {/* ═══ SUNDAY REVIEW MODAL ═══ */}
      <Overlay open={showReview} onClose={()=>setShowReview(false)} title={`Weekly Review · Step ${reviewStep+1}/5`} wide>
        {reviewStep===0&&<div>
          <div className="display" style={{fontSize:24,fontStyle:"italic",color:C.text,marginBottom:6}}>Here's your week.</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:20,fontFamily:FN.m}}>Five minutes. We'll go step by step.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <div style={{...card,padding:18}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Avg Completion</div><div className="hero-num" style={{fontSize:42,color:C.text,lineHeight:1}}>{weekRecap.avg}<span style={{fontSize:18,color:C.textDim}}>%</span></div></div>
            <div style={{...card,padding:18}}><div style={{fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Perfect Days</div><div className="hero-num" style={{fontSize:42,color:C.accent,lineHeight:1}}>{weekRecap.perf}<span style={{fontSize:18,color:C.textDim}}>/7</span></div></div>
          </div>
          <ResponsiveContainer width="100%" height={140}><BarChart data={weekRecap.daily}><CartesianGrid strokeDasharray="3 3" stroke={C.hairline} vertical={false}/><XAxis dataKey="day" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]} width={30}/><Tooltip content={<Tip/>}/><Bar dataKey="pct" radius={[6,6,0,0]}>{weekRecap.daily.map((d,i)=>(<Cell key={i} fill={pC(d.pct)}/>))}</Bar></BarChart></ResponsiveContainer>
        </div>}
        {reviewStep===1&&<div>
          <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,marginBottom:6}}>What worked.</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:18,fontFamily:FN.m}}>Habits you crushed this week (≥80%).</div>
          {strongHabitsForReview.length===0&&<div style={{padding:20,textAlign:"center",color:C.textDim,fontFamily:FN.h,fontStyle:"italic"}}>No standouts this week. That's data too.</div>}
          {strongHabitsForReview.map((h,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:10,background:C.greenSoft,border:`1px solid ${C.greenMed}`}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span style={{fontSize:14,flex:1,color:C.text}}>{h.name}</span><span style={{fontFamily:FN.m,fontSize:13,color:C.green,fontWeight:700}}>{h.rate}%</span></div>))}
        </div>}
        {reviewStep===2&&<div>
          <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,marginBottom:6}}>What didn't.</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:18,fontFamily:FN.m}}>For each, decide: keep going, modify, or drop.</div>
          {weakHabitsForReview.length===0&&<div style={{padding:20,textAlign:"center",color:C.textDim,fontFamily:FN.h,fontStyle:"italic"}}>Nothing fell through the cracks.</div>}
          {weakHabitsForReview.map((h,i)=>{const choice=reviewKept[h.name];return(<div key={i} style={{padding:"14px",marginBottom:8,borderRadius:10,background:C.surfaceDim,border:`1px solid ${C.hairline}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:14,color:C.text}}>{h.name}</span><span style={{fontFamily:FN.m,fontSize:12,color:C.red}}>{h.rate}%</span></div>
            <div style={{display:"flex",gap:6}}>{["Keep","Modify","Drop"].map(opt=>(<button key={opt} onClick={()=>setReviewKept(p=>({...p,[h.name]:opt}))} style={{...pill(choice===opt,opt==="Keep"?C.green:opt==="Drop"?C.red:C.accent),flex:1,fontSize:10}}>{opt}</button>))}</div>
          </div>);})}
        </div>}
        {reviewStep===3&&<div>
          <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,marginBottom:6}}>What you wrote.</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:18,fontFamily:FN.m}}>Reflections from this week.</div>
          {weekReflections.length===0&&<div style={{padding:20,textAlign:"center",color:C.textDim,fontFamily:FN.h,fontStyle:"italic"}}>No reflections logged this week.</div>}
          {weekReflections.map(({date,entries})=>(<div key={date} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontFamily:FN.m,color:C.textDim,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{fd(date)}</div>
            {entries.map((e,i)=>(<div key={i} style={{padding:"10px 14px",marginBottom:4,borderRadius:8,background:C.surfaceDim,borderLeft:`2px solid ${C.accent}`}}><div style={{fontSize:11,fontStyle:"italic",color:C.textDim,fontFamily:FN.h,marginBottom:3}}>{e.prompt}</div><div style={{fontSize:13,color:C.text}}>{e.answer}</div></div>))}
          </div>))}
        </div>}
        {reviewStep===4&&<div>
          <div className="display" style={{fontSize:22,fontStyle:"italic",color:C.text,marginBottom:6}}>Three priorities.</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:18,fontFamily:FN.m}}>What matters most this coming week. Be specific.</div>
          {[0,1,2].map(i=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div className="hero-num" style={{fontSize:24,color:C.accent,width:24,textAlign:"center"}}>{i+1}</div>
            <input value={reviewPriorities[i]||""} onChange={e=>setReviewPriorities(p=>{const n=[...p];n[i]=e.target.value;return n;})} placeholder="…" style={{...inp,fontFamily:FN.h,fontStyle:"italic",fontSize:15}}/>
          </div>))}
        </div>}
        <div style={{display:"flex",gap:8,marginTop:24,paddingTop:18,borderTop:`1px solid ${C.hairline}`}}>
          {reviewStep>0&&<button onClick={()=>setReviewStep(s=>s-1)} style={btnG}>Back</button>}
          <div style={{flex:1}}/>
          {reviewStep<4?<button onClick={()=>setReviewStep(s=>s+1)} style={btnB}>Next →</button>:<button onClick={saveReview} style={{...btnB,background:C.green,color:C.btnText}}>Save Review</button>}
        </div>
      </Overlay>
    </div>
  );
}


