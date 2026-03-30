import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

// ═══ PALETTE ═══
const C={bg:"linear-gradient(180deg,#FFFFFF 0%,#F0F4FA 50%,#E8EEF8 100%)",bgFlat:"#F4F7FC",surface:"#FFFFFF",card:"#FFFFFF",border:"#E0E4ED",borderLight:"#ECEEF5",text:"#1C1C28",textSec:"#4A4A5A",textDim:"#8E8C99",accent:"#3D7EC7",accentBright:"#4A90E2",accentSoft:"rgba(61,126,199,0.07)",accentMed:"rgba(61,126,199,0.14)",green:"#2EAD65",greenBright:"#34C474",greenSoft:"rgba(46,173,101,0.07)",greenMed:"rgba(46,173,101,0.14)",red:"#D44940",redSoft:"rgba(212,73,64,0.07)",redMed:"rgba(212,73,64,0.14)",redLight:"rgba(212,73,64,0.10)",gold:"#DAA520",goldBright:"#F5C542",goldSoft:"rgba(218,165,32,0.08)",goldMed:"rgba(218,165,32,0.15)",goldLight:"rgba(218,165,32,0.06)",purple:"#7B65B0",purpleSoft:"rgba(123,101,176,0.07)",orange:"#E07A3A",orangeSoft:"rgba(224,122,58,0.10)"};

// ═══ COLOR FUNCTIONS ═══
function fracColor(d,t){if(t===0)return C.textDim;const r=d/t;if(r>=1)return C.goldBright;if(r>=.85)return C.greenBright;if(r>=.7)return C.green;if(r>=.5)return"#6BAE5E";if(r>=.35)return C.gold;if(r>=.2)return C.orange;return C.red;}
function fracBg(d,t){if(t===0)return C.borderLight;const r=d/t;if(r>=1)return C.goldMed;if(r>=.7)return C.goldLight;return C.goldSoft;}
function pctColor(p){if(p>=100)return C.goldBright;if(p>=85)return C.greenBright;if(p>=70)return C.green;if(p>=50)return"#6BAE5E";if(p>=35)return C.gold;if(p>=20)return C.orange;return C.red;}
function pctBg(p){if(p>=100)return C.goldMed;if(p>=70)return C.goldLight;return C.goldSoft;}
function barGrad(p){if(p>=100)return`linear-gradient(90deg,${C.green},${C.goldBright})`;if(p>=70)return`linear-gradient(90deg,${C.green},${C.greenBright})`;if(p>=40)return`linear-gradient(90deg,${C.gold},${C.green})`;return`linear-gradient(90deg,${C.red},${C.orange})`;}
function dowColor(a){if(a>=80)return C.greenBright;if(a>=65)return C.green;if(a>=50)return C.gold;return C.red;}

// ═══ HELPERS ═══
const dk=d=>{const dt=typeof d==="string"?new Date(d):d;return`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;};
const fd=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const crd={background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,boxShadow:"0 1px 3px rgba(0,0,0,0.02)"};
const secT={fontSize:13,fontWeight:700,color:C.text,marginBottom:14};
const pl=(a,clr)=>({background:a?(clr||C.accent):"transparent",border:`1px solid ${a?(clr||C.accent):C.border}`,borderRadius:6,padding:"5px 14px",color:a?"#fff":C.textDim,fontSize:12,fontWeight:600,cursor:"pointer"});
const inpS={background:"#F7F9FC",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",width:"100%"};
const numS={background:"#F7F9FC",border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 8px",color:C.text,fontSize:13,outline:"none",width:"100%",textAlign:"center",fontWeight:600};
const ChartTip=({active,payload,label})=>{if(!active||!payload||!payload.length)return null;return(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}><div style={{color:C.textDim,marginBottom:2,fontSize:11}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||C.text,fontWeight:600}}>{p.name}: {typeof p.value==="number"?Math.round(p.value*10)/10:p.value}</div>)}</div>)};

// ═══ DEFAULT HABIT TEMPLATES ═══
const defaultMorning=[{id:"m1",text:"Bed Made"},{id:"m2",text:"Teeth Brushed"},{id:"m3",text:"Face Cleaned"},{id:"m4",text:"No Phone"},{id:"m5",text:"Minoxidil"},{id:"m6",text:"Vaseline"},{id:"m7",text:"Shower"}];
const defaultNight=[{id:"n1",text:"To-Do List"},{id:"n2",text:"Calendar Done"},{id:"n3",text:"Budgeting"},{id:"n4",text:"Journal"},{id:"n5",text:"Exercise"},{id:"n6",text:"Career Work"},{id:"n7",text:"Eat Healthy"},{id:"n8",text:"Spanish 30 min"},{id:"n9",text:"Read 30 min"},{id:"n10",text:"10K Steps"},{id:"n11",text:"Talk to Family"},{id:"n12",text:"5 To-Do's Done"},{id:"n13",text:"I Won the Day"},{id:"n14",text:"3L Water"},{id:"n15",text:"Pills Taken"},{id:"n16",text:"Clean Room"},{id:"n17",text:"Teeth Clean"},{id:"n18",text:"Minoxidil"},{id:"n19",text:"Creatine"},{id:"n20",text:"Shower"},{id:"n21",text:"Face Clean"},{id:"n22",text:"No Social Media"},{id:"n23",text:"No Phone"}];
const splitExercises={upper:["Bench Press","Lat Pull Down","Pec Dec","Mid Row","Tricep PD","Lat Raises","Ab Circuit"],lower:["Squat","RDL","Back Ext.","Leg Ext.","Leg Inner/Outer","Calf Raises","Ab Circuit"],pull:["Rows (Up)","Rows (Mid)","Pulldown","Lat Raises","Face Pulls","Shrugs"],push:["Cable Chest","Tricep Ext","Curls","Shoulder Press","LH Tricep Ext","Hammer Curls"],legs:["Paused Squat","Cable Lat Raise","Calf Raises"]};
const splitColors={upper:"#4A90E2",lower:"#2EAD65",pull:"#E07A3A",push:"#D44940",legs:"#7B65B0"};
const defaultWeeklyGoals=[{id:"w1",text:"Workout 4 times",done:false},{id:"w2",text:"Go to Class 3x",done:false},{id:"w3",text:"Get Groceries",done:false},{id:"w4",text:"Complete Spanish module",done:false},{id:"w5",text:"Read 30 pages",done:false}];
const defaultMonthlyGoals=[{text:"80% on No Social Media",habitId:"n22",target:80,type:"pct"},{text:"85% in Exercise",habitId:"n5",target:85,type:"pct"},{text:"90% on Minoxidil",habitId:"m5",target:90,type:"pct"},{text:"80% on No Phone",habitId:"m4",target:80,type:"pct"},{text:"Sign Morgan Stanley",done:false,type:"check"},{text:"80%+ on Exam",done:false,type:"check"},{text:"Go to Paris",done:false,type:"check"},{text:"Make $1000",current:30,target:1000,money:true,type:"pct"},{text:"Get 20 Good Days",current:0,target:20,count:true,type:"pct"},{text:"Read a Full Book",done:false,type:"check"}];

// Seed workout history
const seedWH=[{id:"h6",date:"2026-03-15",split:"upper",exercises:[{name:"Bench Press",sets:[{w:50,r:10},{w:60,r:6},{w:60,r:6}]},{name:"Lat Pull Down",sets:[{w:54,r:8},{w:59,r:7},{w:59,r:6}]},{name:"Pec Dec",sets:[{w:66,r:10},{w:70,r:6},{w:66,r:9}]},{name:"Mid Row",sets:[{w:41,r:9},{w:41,r:8},{w:41,r:7}]},{name:"Tricep PD",sets:[{w:27,r:10},{w:27,r:10},{w:27,r:10}]},{name:"Lat Raises",sets:[{w:7.5,r:10},{w:10,r:9},{w:10,r:9}]},{name:"Ab Circuit",sets:[{w:45,r:10},{w:45,r:10},{w:45,r:10}]}]},{id:"h9",date:"2026-03-20",split:"push",exercises:[{name:"Cable Chest",sets:[{w:59,r:10},{w:66,r:9},{w:73,r:9}]},{name:"Tricep Ext",sets:[{w:8,r:10},{w:8,r:10},{w:8,r:9}]},{name:"Curls",sets:[{w:12.5,r:8},{w:12.5,r:8},{w:12.5,r:8}]},{name:"Shoulder Press",sets:[{w:17.5,r:6},{w:17.5,r:7},{w:17.5,r:7}]},{name:"LH Tricep Ext",sets:[{w:27,r:10},{w:36,r:8},{w:36,r:8}]},{name:"Hammer Curls",sets:[{w:12.5,r:8},{w:10,r:10},{w:10,r:9}]}]}];
const seedBW=[{date:"2025-10-01",weight:72.5},{date:"2025-12-01",weight:73.8},{date:"2026-01-01",weight:74.5},{date:"2026-02-01",weight:74.8},{date:"2026-03-01",weight:75.2},{date:"2026-03-29",weight:75.8}];
const seedTx={"2026-03-01":[{id:"t14",type:"out",amount:26.50,desc:"Sunday"}],"2026-03-03":[{id:"t15",type:"out",amount:42.60,desc:"Mon"}],"2026-03-06":[{id:"t16",type:"in",amount:30,desc:"Income"}],"2026-03-12":[{id:"t20",type:"out",amount:186.53,desc:"Large expense"}]};

// ═══ COMPONENTS ═══
function SmartTodo({todo,checked,onToggle,onUp,onDown,isFirst,isLast,missedYesterday}){
  return(<div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 12px",marginBottom:3,borderRadius:8,cursor:"pointer",background:checked?C.greenMed:missedYesterday?C.redLight:C.surface,border:`1px solid ${checked?"rgba(46,173,101,0.35)":missedYesterday?C.redMed:C.border}`}}>
    <div style={{display:"flex",flexDirection:"column",marginRight:2}}><button onClick={e=>{e.stopPropagation();onUp();}} disabled={isFirst} style={{background:"transparent",border:"none",color:isFirst?C.borderLight:C.textDim,cursor:isFirst?"default":"pointer",fontSize:8,padding:0,lineHeight:1}}>▲</button><button onClick={e=>{e.stopPropagation();onDown();}} disabled={isLast} style={{background:"transparent",border:"none",color:isLast?C.borderLight:C.textDim,cursor:isLast?"default":"pointer",fontSize:8,padding:0,lineHeight:1}}>▼</button></div>
    {missedYesterday&&!checked&&<div style={{width:3,height:22,borderRadius:2,background:C.red,flexShrink:0}}/>}
    <div onClick={onToggle} style={{width:18,height:18,borderRadius:5,flexShrink:0,border:`2px solid ${checked?C.greenBright:C.border}`,background:checked?C.greenBright:C.surface,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800,boxShadow:checked?`0 0 8px ${C.greenSoft}`:"none"}}>{checked&&"✓"}</div>
    <div onClick={onToggle} style={{flex:1}}><span style={{fontSize:13,fontWeight:500,textDecoration:checked?"line-through":"none",color:checked?C.textDim:C.text}}>{todo.text}</span>{missedYesterday&&!checked&&<div style={{fontSize:10,color:C.red,fontWeight:600,marginTop:1}}>Missed yesterday</div>}</div>
  </div>);}

function HabitBar({name,rate}){return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:12,color:C.textDim,width:115,flexShrink:0,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span><div style={{flex:1,height:6,background:C.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(rate,100)}%`,background:barGrad(rate),borderRadius:3}}/></div><span style={{fontSize:11,color:pctColor(rate),width:38,textAlign:"right",fontWeight:600}}>{rate.toFixed(0)}%</span></div>);}

function Modal({open,onClose,title,children,wide}){if(!open)return null;return(<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div style={{position:"absolute",inset:0,background:"rgba(28,28,40,0.2)",backdropFilter:"blur(6px)"}}/><div onClick={e=>e.stopPropagation()} style={{position:"relative",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24,width:"92%",maxWidth:wide?700:580,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,0.08)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:16,fontWeight:700,margin:0}}>{title}</h3><button onClick={onClose} style={{background:C.bgFlat,border:"none",color:C.textDim,fontSize:14,cursor:"pointer",width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>{children}</div></div>);}

// ═══════════ MAIN DASHBOARD ═══════════
export default function Dashboard(){
  // ── CORE PER-DAY DATA STORES ──
  const[dailyChecks,setDailyChecks]=useState({}); // { "2026-03-30": { "m1": true, "n5": true } }
  const[dailyGoalsHistory,setDailyGoalsHistory]=useState({}); // { "2026-03-30": [{id,text,done}] }

  // ── TEMPLATES (what habits/goals exist) ──
  const[morningTodos,setMorningTodos]=useState(defaultMorning);
  const[nightTodos,setNightTodos]=useState(defaultNight);
  const[weeklyGoals,setWeeklyGoals]=useState(defaultWeeklyGoals);
  const[monthlyGoals,setMonthlyGoals]=useState(defaultMonthlyGoals);

  // ── OTHER DATA ──
  const[workoutHistory,setWorkoutHistory]=useState(seedWH);
  const[bodyWeightLog,setBodyWeightLog]=useState(seedBW);
  const[transactions,setTransactions]=useState(seedTx);

  // ── UI STATE ──
  const[tab,setTab]=useState("overview");
  const[viewDate,setViewDate]=useState(()=>new Date());
  const[showDatePicker,setShowDatePicker]=useState(false);
  const[mornInput,setMornInput]=useState("");
  const[nightInput,setNightInput]=useState("");
  const[dailyInput,setDailyInput]=useState("");
  const[weeklyInput,setWeeklyInput]=useState("");
  const[monthlyInput,setMonthlyInput]=useState("");
  const[newBW,setNewBW]=useState("");
  const[editingBW,setEditingBW]=useState(null);
  const[gymSplit,setGymSplit]=useState(null); // null = show split selector
  const[gymView,setGymView]=useState("log");
  const[currentWorkout,setCurrentWorkout]=useState(null);
  const[doneExercises,setDoneExercises]=useState({});
  const[showConfetti,setShowConfetti]=useState(false);
  const[budgetMonth,setBudgetMonth]=useState(()=>new Date());
  const[selectedDay,setSelectedDay]=useState(null);
  const[txForm,setTxForm]=useState({type:"out",amount:"",desc:""});
  const[modalType,setModalType]=useState(null);
  const[goalAddMode,setGoalAddMode]=useState(null);
  const[goalPctTodo,setGoalPctTodo]=useState("");
  const[goalPctTarget,setGoalPctTarget]=useState("");
  const[detailMonth,setDetailMonth]=useState(null);
  const[selectedHabit,setSelectedHabit]=useState(null);
  const[report,setReport]=useState(null);
  const[reportLoading,setReportLoading]=useState(false);
  const[reportType,setReportType]=useState("daily");

  // ── DERIVED: current view date key ──
  const vdk=dk(viewDate);
  const isToday=vdk===dk(new Date());
  const now=new Date();

  // ── Per-day checks for current view date ──
  const dayChecks=dailyChecks[vdk]||{};
  const setDayCheck=(id,val)=>{setDailyChecks(p=>({...p,[vdk]:{...(p[vdk]||{}), [id]:val}}));};
  const toggleDayCheck=id=>setDayCheck(id,!dayChecks[id]);

  // ── Per-day daily goals ──
  const dayGoals=dailyGoalsHistory[vdk]||[{id:"dg1",text:"Go to Class",done:false},{id:"dg2",text:"Workout",done:false},{id:"dg3",text:"Get Groceries",done:false}];
  const setDayGoals=goals=>{setDailyGoalsHistory(p=>({...p,[vdk]:goals}));};
  const toggleDayGoal=id=>{setDayGoals(dayGoals.map(g=>g.id===id?{...g,done:!g.done}:g));};
  const addDayGoal=text=>{if(!text.trim())return;setDayGoals([...dayGoals,{id:`dg_${Date.now()}`,text:text.trim(),done:false}]);};
  const removeDayGoal=id=>{setDayGoals(dayGoals.filter(g=>g.id!==id));};

  // ── Yesterday's checks (for missed-yesterday highlighting) ──
  const yesterday=new Date(viewDate);yesterday.setDate(yesterday.getDate()-1);
  const ydk=dk(yesterday);
  const yesterdayChecks=dailyChecks[ydk]||{};

  // ── COMPUTED: Monthly stats from dailyChecks ──
  const allHabits=[...morningTodos,...nightTodos];
  const totalHabits=allHabits.length;

  const monthlyProgress=useMemo(()=>{
    const y=viewDate.getFullYear(),m=viewDate.getMonth();
    const daysInMonth=new Date(y,m+1,0).getDate();
    const todayDate=new Date().getDate();
    const isCurrentMonth=y===now.getFullYear()&&m===now.getMonth();
    const maxDay=isCurrentMonth?todayDate:daysInMonth;
    const data=[];
    for(let d=1;d<=maxDay;d++){
      const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const checks=dailyChecks[key]||{};
      const done=allHabits.filter(h=>checks[h.id]).length;
      data.push({day:d,pct:totalHabits>0?Math.round(done/totalHabits*100):0,done});
    }
    return data;
  },[dailyChecks,viewDate,allHabits,totalHabits]);

  // Habit completion rates for current month
  const habitRates=useMemo(()=>{
    const y=viewDate.getFullYear(),m=viewDate.getMonth();
    const todayDate=new Date().getDate();
    const isCurrentMonth=y===now.getFullYear()&&m===now.getMonth();
    const daysInMonth=new Date(y,m+1,0).getDate();
    const maxDay=isCurrentMonth?todayDate:daysInMonth;
    if(maxDay===0)return{};
    const rates={};
    allHabits.forEach(h=>{
      let done=0;
      for(let d=1;d<=maxDay;d++){
        const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        if((dailyChecks[key]||{})[h.id])done++;
      }
      rates[h.id]={name:h.text,rate:Math.round(done/maxDay*100),done,total:maxDay};
    });
    return rates;
  },[dailyChecks,viewDate,allHabits]);

  // Monthly score (average of all daily percents)
  const monthScore=monthlyProgress.length>0?Math.round(monthlyProgress.reduce((a,b)=>a+b.pct,0)/monthlyProgress.length):0;

  // Good days count
  const goodDays=monthlyProgress.filter(d=>d.pct>=50).length;

  // Today's done count
  const morningDone=morningTodos.filter(t=>dayChecks[t.id]).length;
  const nightDone=nightTodos.filter(t=>dayChecks[t.id]).length;
  const todayDone=morningDone+nightDone;
  const dailyGoalsDone=dayGoals.filter(g=>g.done).length;

  // Monthly goal auto-calculation (% goals linked to habits)
  const computedMonthlyGoals=useMemo(()=>{
    return monthlyGoals.map(g=>{
      if(g.type==="check")return g;
      if(g.habitId&&habitRates[g.habitId]){
        return{...g,current:habitRates[g.habitId].rate};
      }
      if(g.count&&g.text.includes("Good Days")){
        return{...g,current:goodDays};
      }
      return g;
    });
  },[monthlyGoals,habitRates,goodDays]);

  // ── STORAGE ──
  useEffect(()=>{try{const s=localStorage.getItem("dash-v10");if(s){const d=JSON.parse(s);if(d.dailyChecks)setDailyChecks(d.dailyChecks);if(d.dailyGoalsHistory)setDailyGoalsHistory(d.dailyGoalsHistory);if(d.morningTodos)setMorningTodos(d.morningTodos);if(d.nightTodos)setNightTodos(d.nightTodos);if(d.weeklyGoals)setWeeklyGoals(d.weeklyGoals);if(d.monthlyGoals)setMonthlyGoals(d.monthlyGoals);if(d.workoutHistory)setWorkoutHistory(d.workoutHistory);if(d.bodyWeightLog)setBodyWeightLog(d.bodyWeightLog);if(d.transactions)setTransactions(d.transactions);}}catch(e){}},[]);
  useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem("dash-v10",JSON.stringify({dailyChecks,dailyGoalsHistory,morningTodos,nightTodos,weeklyGoals,monthlyGoals,workoutHistory,bodyWeightLog,transactions}));}catch(e){}},500);return()=>clearTimeout(t);},[dailyChecks,dailyGoalsHistory,morningTodos,nightTodos,weeklyGoals,monthlyGoals,workoutHistory,bodyWeightLog,transactions]);

  // ── WORKOUT ──
  useEffect(()=>{if(gymSplit&&(!currentWorkout||currentWorkout.split!==gymSplit)){const exercises=(splitExercises[gymSplit]||[]).map(name=>{const ls=[...workoutHistory].reverse().find(h=>h.split===gymSplit);const le=ls&&ls.exercises?ls.exercises.find(e=>e.name===name):null;const n=le?le.sets.length:3;return{name,sets:Array.from({length:n},(_,i)=>({w:le&&le.sets&&le.sets[i]?le.sets[i].w:0,r:le&&le.sets&&le.sets[i]?le.sets[i].r:0}))};});setCurrentWorkout({split:gymSplit,exercises});setDoneExercises({});}},[gymSplit]);

  const updateSet=(ei,si,f,v)=>{setCurrentWorkout(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets[si][f]=parseFloat(v)||0;return n;});};
  const addSet=ei=>{setCurrentWorkout(p=>{const n=JSON.parse(JSON.stringify(p));n.exercises[ei].sets.push({w:0,r:0});return n;});};
  const removeSet=ei=>{setCurrentWorkout(p=>{const n=JSON.parse(JSON.stringify(p));if(n.exercises[ei].sets.length>1)n.exercises[ei].sets.pop();return n;});};
  const saveWorkout=()=>{
    if(!currentWorkout)return;
    const entry={id:`h_${Date.now()}`,date:dk(new Date()),split:currentWorkout.split,exercises:currentWorkout.exercises};
    setWorkoutHistory(p=>[...p,entry]);
    setShowConfetti(true);
    setTimeout(()=>{setShowConfetti(false);const ne=currentWorkout.exercises.map(ex=>({name:ex.name,sets:ex.sets.map(()=>({w:0,r:0}))}));setCurrentWorkout({split:currentWorkout.split,exercises:ne});setDoneExercises({});},2000);
  };
  const lastSession=useMemo(()=>{if(!gymSplit)return null;const e=workoutHistory.filter(h=>h.split===gymSplit).sort((a,b)=>new Date(b.date)-new Date(a.date));return e[0]||null;},[workoutHistory,gymSplit]);
  const addBodyWeight=()=>{const w=parseFloat(newBW);if(!w)return;setBodyWeightLog(p=>[...p,{date:dk(new Date()),weight:w}]);setNewBW("");};

  // ── BUDGET ──
  const calY=budgetMonth.getFullYear(),calM=budgetMonth.getMonth(),dIM=new Date(calY,calM+1,0).getDate(),fDow=new Date(calY,calM,1).getDay(),isCM=calY===now.getFullYear()&&calM===now.getMonth();
  const getDK=d=>`${calY}-${String(calM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getDT=d=>transactions[getDK(d)]||[];
  const getDN=d=>getDT(d).reduce((a,t)=>a+(t.type==="in"?t.amount:-t.amount),0);
  const addTx=()=>{if(!txForm.amount||!selectedDay)return;const k=getDK(selectedDay);setTransactions(p=>({...p,[k]:[...(p[k]||[]),{id:`tx_${Date.now()}`,type:txForm.type,amount:parseFloat(txForm.amount),desc:txForm.desc||""}]}));setTxForm({type:"out",amount:"",desc:""});};
  const removeTx=(d,id)=>{const k=getDK(d);setTransactions(p=>({...p,[k]:(p[k]||[]).filter(t=>t.id!==id)}));};
  const mTot=useMemo(()=>{let i=0,o=0;for(let d=1;d<=dIM;d++)getDT(d).forEach(t=>{if(t.type==="in")i+=t.amount;else o+=t.amount;});return{i,o,net:i-o,ratio:o>0?i/o:0};},[transactions,calY,calM,dIM]);

  // ── ANALYTICS: 3-month trend with actual dates ──
  const trendChart=useMemo(()=>{
    const data=[];
    const today=new Date();
    const startMs=new Date(today.getFullYear(),today.getMonth()-2,1).getTime();
    const endMs=today.getTime();
    const weekMs=7*24*60*60*1000;
    let weekStart=startMs;
    while(weekStart<endMs){
      const weekEndMs=Math.min(weekStart+weekMs-1,endMs);
      const label=`${new Date(weekStart).getMonth()+1}/${new Date(weekStart).getDate()}`;
      let sum=0,cnt=0;
      for(let ts=weekStart;ts<=weekEndMs;ts+=24*60*60*1000){
        const d=new Date(ts);
        const key=dk(d);
        const chk=dailyChecks[key]||{};
        const done=allHabits.filter(h=>chk[h.id]).length;
        if(totalHabits>0){sum+=done/totalHabits*100;cnt++;}
      }
      if(cnt>0)data.push({label:label,avg:Math.round(sum/cnt)});
      weekStart+=weekMs;
    }
    return data;
  },[dailyChecks,allHabits,totalHabits]);

  // All habit names for analytics
  const habitList=allHabits.map(h=>{const hr=habitRates[h.id];return{id:h.id,name:h.text,rate:hr?hr.rate:0};}).sort((a,b)=>b.rate-a.rate);

  // Day-of-week analysis from live data
  const dowData=useMemo(()=>{const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];const sums=Array(7).fill(0),counts=Array(7).fill(0);Object.entries(dailyChecks).forEach(([key,checks])=>{const d=new Date(key);const dow=d.getDay();const done=allHabits.filter(h=>checks[h.id]).length;if(totalHabits>0){sums[dow]+=done/totalHabits*100;counts[dow]++;}});return days.map((d,i)=>({day:d,avg:counts[i]?Math.round(sums[i]/counts[i]):0}));},[dailyChecks,allHabits,totalHabits]);

  // ── REPORT ──
  const generateReport=useCallback(async type=>{setReportLoading(true);setReport(null);setReportType(type);setModalType("report");const ctx=`Score:${monthScore}%. Done today:${todayDone}/${totalHabits}. Good days:${goodDays}.`;const pr={daily:`Coach.${ctx}JSON:grade,headline(10w),wins(2-3),improvements(2-3),advice,streak_note.ONLY JSON.`,weekly:`Coach.${ctx}JSON:grade,headline,wins,improvements,pattern,challenge,advice.ONLY JSON.`,monthly:`Coach.${ctx}JSON:grade,headline,wins(3-4),improvements(3-4),patterns(2-3),top3_focus,budget_note,advice.ONLY JSON.`};try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:pr[type]}]})});const d=await r.json();const raw=d.content?d.content.map(c=>c.text||"").join(""):"";setReport(JSON.parse(raw.replace(/```json|```/g,"").trim()));}catch{setReport({grade:"?",headline:"Failed",wins:["Retry"],improvements:[],advice:"Could not generate."});}setReportLoading(false);},[todayDone,totalHabits,monthScore,goodDays]);

  const sortList=todos=>[...todos.filter(t=>!dayChecks[t.id]),...todos.filter(t=>dayChecks[t.id])];
  const moveTodo=(list,setList,idx,dir)=>{const n=[...list];const t=idx+dir;if(t<0||t>=n.length)return;[n[idx],n[t]]=[n[t],n[idx]];setList(n);};

  const tabList=[{key:"overview",label:"Today"},{key:"budget",label:"Budget"},{key:"workout",label:"Workout"},{key:"goals",label:"Goals"},{key:"mstats",label:"Monthly Stats"},{key:"analytics",label:"Overall Analytics"}];
  const bwData=bodyWeightLog.map(e=>({date:fd(e.date),weight:e.weight}));
  const bwChange=bodyWeightLog.length>=2?(bodyWeightLog[bodyWeightLog.length-1].weight-bodyWeightLog[0].weight).toFixed(1):0;
  const sortedMorning=sortList(morningTodos);const sortedNight=sortList(nightTodos);
  const dpY=viewDate.getFullYear(),dpM=viewDate.getMonth(),dpDays=new Date(dpY,dpM+1,0).getDate(),dpFdow=new Date(dpY,dpM,1).getDay();

  // Confetti component
  const Confetti=()=>(<div style={{position:"fixed",inset:0,zIndex:200,pointerEvents:"none",overflow:"hidden"}}>{Array.from({length:50}).map((_,i)=>{const l=Math.random()*100;const d=Math.random()*3+1;const c=[C.green,C.goldBright,C.accent,C.red,"#fff"][Math.floor(Math.random()*5)];return(<div key={i} style={{position:"absolute",left:`${l}%`,top:-20,width:8,height:8,borderRadius:Math.random()>.5?"50%":"0",background:c,animation:`confetti ${d}s ease-out forwards`,animationDelay:`${Math.random()*0.5}s`}}/>);})}<style>{`@keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style></div>);

  return(<div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    {showConfetti&&<Confetti/>}

    <div style={{padding:"20px 24px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
        <div><div style={{fontSize:12,color:C.textDim,fontWeight:500,marginBottom:2}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div><h1 style={{fontSize:22,fontWeight:800,margin:0,letterSpacing:"-0.03em",color:C.green}}>PROGRESS</h1></div>
        <div style={{display:"flex",gap:4}}>{["daily","weekly","monthly"].map(r=>(<button key={r} onClick={()=>generateReport(r)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",color:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim;}}>{r[0].toUpperCase()+r.slice(1)}</button>))}</div>
      </div>
      <div style={{display:"flex",gap:2,background:C.surface,borderRadius:8,padding:3,border:`1px solid ${C.border}`,overflowX:"auto"}}>{tabList.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{flex:"0 0 auto",background:tab===t.key?C.accent:"transparent",border:"none",borderRadius:6,padding:"7px 10px",color:tab===t.key?"#fff":C.textDim,fontSize:10.5,fontWeight:tab===t.key?700:500,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label}</button>))}</div>
    </div>

    <div style={{padding:"16px 24px 36px",maxWidth:960,margin:"0 auto"}}>

      {/* ═══ TODAY ═══ */}
      {tab==="overview"&&<>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={()=>setShowDatePicker(!showDatePicker)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:C.text,display:"flex",alignItems:"center",gap:6}}>📅 {viewDate.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}<span style={{fontSize:10,color:C.textDim}}>▼</span></button>
          {!isToday&&<button onClick={()=>{setViewDate(new Date());setShowDatePicker(false);}} style={{background:C.accent,border:"none",borderRadius:6,padding:"6px 12px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>Back to Today</button>}
        </div>
        {showDatePicker&&<div style={{...crd,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><button onClick={()=>setViewDate(new Date(dpY,dpM-1,viewDate.getDate()))} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.textDim,fontSize:12}}>‹</button><span style={{fontSize:13,fontWeight:700}}>{viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setViewDate(new Date(dpY,dpM+1,viewDate.getDate()))} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.textDim,fontSize:12}}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim,fontWeight:600}}>{d}</div>))}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{Array.from({length:dpFdow}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dpDays}).map((_,i)=>{const d=i+1;const key=`${dpY}-${String(dpM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const dayData=dailyChecks[key]||{};const dayDone=allHabits.filter(h=>dayData[h.id]).length;const dayPct=totalHabits>0?Math.round(dayDone/totalHabits*100):0;const sel=viewDate.getDate()===d&&viewDate.getMonth()===dpM;const isT=now.getDate()===d&&now.getMonth()===dpM&&now.getFullYear()===dpY;return(<div key={d} onClick={()=>{setViewDate(new Date(dpY,dpM,d));setShowDatePicker(false);}} style={{textAlign:"center",padding:"4px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:sel?700:isT?600:400,background:sel?C.accent:dayPct>0?pctBg(dayPct):"transparent",color:sel?"#fff":isT?C.accent:C.text,border:isT&&!sel?`1px solid ${C.accent}`:"1px solid transparent"}}><div>{d}</div>{dayPct>0&&!sel&&<div style={{fontSize:7,fontWeight:700,color:pctColor(dayPct)}}>{dayPct}%</div>}</div>);})}</div>
        </div>}

        {!isToday&&<div style={{...crd,padding:"12px 16px",marginBottom:12,borderLeft:`3px solid ${C.accent}`,background:C.accentSoft}}><div style={{fontSize:13,fontWeight:600,color:C.accent}}>Viewing {viewDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div></div>}

        <div style={{...crd,padding:"16px 18px",marginBottom:14,background:fracBg(todayDone,totalHabits),border:`1px solid ${todayDone>=totalHabits&&totalHabits>0?C.goldBright+"44":C.border}`,boxShadow:todayDone>=totalHabits&&totalHabits>0?`0 0 20px ${C.goldSoft}`:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:14,fontWeight:700}}>Today's Progress</span><span style={{fontSize:24,fontWeight:800,color:fracColor(todayDone,totalHabits)}}>{todayDone}/{totalHabits}</span></div>
          <div style={{height:10,background:"rgba(255,255,255,0.6)",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:`${totalHabits>0?(todayDone/totalHabits*100):0}%`,background:barGrad(totalHabits>0?todayDone/totalHabits*100:0),borderRadius:5,transition:"width 0.4s"}}/></div>
        </div>

        {/* Daily Goals */}
        <div style={{...crd,marginBottom:12,background:fracBg(dailyGoalsDone,dayGoals.length)}}>
          <div style={{...secT,display:"flex",alignItems:"center"}}>Daily Goals<span style={{marginLeft:"auto",fontSize:13,fontWeight:800,color:fracColor(dailyGoalsDone,dayGoals.length)}}>{dailyGoalsDone}/{dayGoals.length}</span></div>
          <div style={{display:"flex",gap:6,marginBottom:10}}><input value={dailyInput} onChange={e=>setDailyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){addDayGoal(dailyInput);setDailyInput("");}}} placeholder="Add a daily goal..." style={inpS}/><button onClick={()=>{addDayGoal(dailyInput);setDailyInput("");}} style={{background:C.accent,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Add</button></div>
          {dayGoals.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}><div onClick={()=>toggleDayGoal(g.id)} style={{display:"flex",alignItems:"center",gap:10,flex:1,padding:"9px 12px",borderRadius:8,cursor:"pointer",background:g.done?C.greenMed:C.surface,border:`1px solid ${g.done?"rgba(46,173,101,0.35)":C.border}`}}><div style={{width:18,height:18,borderRadius:5,flexShrink:0,border:`2px solid ${g.done?C.greenBright:C.border}`,background:g.done?C.greenBright:C.surface,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800,boxShadow:g.done?`0 0 8px ${C.greenSoft}`:"none"}}>{g.done&&"✓"}</div><span style={{fontSize:13,fontWeight:500,textDecoration:g.done?"line-through":"none",color:g.done?C.textDim:C.text}}>{g.text}</span></div><button onClick={()=>removeDayGoal(g.id)} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:14,opacity:0.4}}>×</button></div>))}
        </div>

        {/* Morning & Night */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{...crd,background:fracBg(morningDone,morningTodos.length)}}>
            <div style={{...secT,display:"flex",alignItems:"center"}}>Morning<span style={{marginLeft:"auto",fontSize:13,fontWeight:800,color:fracColor(morningDone,morningTodos.length)}}>{morningDone}/{morningTodos.length}</span></div>
            <div style={{display:"flex",gap:4,marginBottom:8}}><input value={mornInput} onChange={e=>setMornInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&mornInput.trim()){setMorningTodos(p=>[...p,{id:`m_${Date.now()}`,text:mornInput.trim()}]);setMornInput("");}}} placeholder="Add morning task..." style={{...inpS,padding:"7px 10px",fontSize:12}}/><button onClick={()=>{if(mornInput.trim()){setMorningTodos(p=>[...p,{id:`m_${Date.now()}`,text:mornInput.trim()}]);setMornInput("");}}} style={{background:C.accent,border:"none",borderRadius:6,padding:"6px 10px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button></div>
            {sortedMorning.map((t,i)=><SmartTodo key={t.id} todo={t} checked={dayChecks[t.id]} missedYesterday={!yesterdayChecks[t.id]&&Object.keys(yesterdayChecks).length>0} onToggle={()=>toggleDayCheck(t.id)} onUp={()=>moveTodo(morningTodos,setMorningTodos,morningTodos.indexOf(t),-1)} onDown={()=>moveTodo(morningTodos,setMorningTodos,morningTodos.indexOf(t),1)} isFirst={i===0} isLast={i===sortedMorning.length-1}/>)}
          </div>
          <div style={{...crd,background:fracBg(nightDone,nightTodos.length)}}>
            <div style={{...secT,display:"flex",alignItems:"center"}}>Night<span style={{marginLeft:"auto",fontSize:13,fontWeight:800,color:fracColor(nightDone,nightTodos.length)}}>{nightDone}/{nightTodos.length}</span></div>
            <div style={{display:"flex",gap:4,marginBottom:8}}><input value={nightInput} onChange={e=>setNightInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nightInput.trim()){setNightTodos(p=>[...p,{id:`n_${Date.now()}`,text:nightInput.trim()}]);setNightInput("");}}} placeholder="Add night task..." style={{...inpS,padding:"7px 10px",fontSize:12}}/><button onClick={()=>{if(nightInput.trim()){setNightTodos(p=>[...p,{id:`n_${Date.now()}`,text:nightInput.trim()}]);setNightInput("");}}} style={{background:C.accent,border:"none",borderRadius:6,padding:"6px 10px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button></div>
            <div style={{maxHeight:420,overflowY:"auto"}}>{sortedNight.map((t,i)=><SmartTodo key={t.id} todo={t} checked={dayChecks[t.id]} missedYesterday={!yesterdayChecks[t.id]&&Object.keys(yesterdayChecks).length>0} onToggle={()=>toggleDayCheck(t.id)} onUp={()=>moveTodo(nightTodos,setNightTodos,nightTodos.indexOf(t),-1)} onDown={()=>moveTodo(nightTodos,setNightTodos,nightTodos.indexOf(t),1)} isFirst={i===0} isLast={i===sortedNight.length-1}/>)}</div>
          </div>
        </div>
      </>}

      {/* ═══ BUDGET ═══ */}
      {tab==="budget"&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>{[{l:"Income",v:`$${mTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${mTot.o.toFixed(2)}`,c:C.red},{l:"Net",v:`${mTot.net>=0?"+":""}$${mTot.net.toFixed(2)}`,c:mTot.net>=0?C.green:C.red},{l:"Ratio",v:mTot.ratio===0?"—":mTot.ratio.toFixed(2),c:mTot.ratio>=1?C.greenBright:C.red}].map((s,i)=>(<div key={i} style={{...crd,padding:"12px"}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{s.l}</div><div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div></div>))}</div>
        <div style={crd}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><button onClick={()=>setBudgetMonth(new Date(calY,calM-1,1))} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:C.textDim,fontSize:12,fontWeight:600}}>‹</button><span style={{fontSize:14,fontWeight:700}}>{budgetMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span><button onClick={()=>setBudgetMonth(new Date(calY,calM+1,1))} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:C.textDim,fontSize:12,fontWeight:600}}>›</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["S","M","T","W","T","F","S"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:10,color:C.textDim,fontWeight:600}}>{d}</div>))}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{Array.from({length:fDow}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dIM}).map((_,i)=>{const d=i+1;const isT=isCM&&d===now.getDate();const net=getDN(d);const has=getDT(d).length>0;const sel=selectedDay===d;return(<div key={d} onClick={()=>setSelectedDay(sel?null:d)} style={{aspectRatio:"1",borderRadius:6,cursor:"pointer",padding:3,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:sel?C.accentMed:has?(net>=0?C.greenSoft:C.redSoft):C.surface,border:isT?`2px solid ${C.accent}`:sel?`2px solid ${C.accent}`:`1px solid ${C.borderLight}`}}><span style={{fontSize:12,fontWeight:isT?800:500,color:isT?C.accent:C.text}}>{d}</span>{has&&<span style={{fontSize:7,fontWeight:700,color:net>=0?C.green:C.red}}>{net>=0?"+":""}{net.toFixed(0)}</span>}</div>);})}</div>
          {selectedDay&&<div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:14}}><div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{new Date(calY,calM,selectedDay).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>{getDT(selectedDay).map(tx=>(<div key={tx.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:3,borderRadius:6,background:tx.type==="in"?C.greenSoft:C.redSoft}}><span style={{fontSize:11,fontWeight:700,color:tx.type==="in"?C.greenBright:C.red,width:14}}>{tx.type==="in"?"+":"−"}</span><span style={{flex:1,fontSize:12}}>{tx.desc||"Transaction"}</span><span style={{fontSize:12,fontWeight:700,color:tx.type==="in"?C.greenBright:C.red}}>${tx.amount.toFixed(2)}</span><button onClick={()=>removeTx(selectedDay,tx.id)} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:13}}>×</button></div>))}<div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}><div style={{display:"flex",borderRadius:6,overflow:"hidden",border:`1px solid ${C.border}`}}><button onClick={()=>setTxForm(p=>({...p,type:"in"}))} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:txForm.type==="in"?C.greenBright:"transparent",color:txForm.type==="in"?"#fff":C.textDim}}>In</button><button onClick={()=>setTxForm(p=>({...p,type:"out"}))} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:txForm.type==="out"?C.red:"transparent",color:txForm.type==="out"?"#fff":C.textDim}}>Out</button></div><input type="number" step="0.01" value={txForm.amount} onChange={e=>setTxForm(p=>({...p,amount:e.target.value}))} placeholder="$" style={{...inpS,width:65,padding:"6px 8px",fontSize:12,textAlign:"center"}}/><input value={txForm.desc} onChange={e=>setTxForm(p=>({...p,desc:e.target.value}))} placeholder="Description" style={{...inpS,flex:1,padding:"6px 8px",fontSize:12}} onKeyDown={e=>e.key==="Enter"&&addTx()}/><button onClick={addTx} style={{background:C.accent,border:"none",borderRadius:6,padding:"6px 12px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Add</button></div></div>}
        </div>
        <div style={{...crd,marginTop:12}}><div style={secT}>Breakdown</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:30}}><ResponsiveContainer width={180} height={180}><PieChart><Pie data={[{name:"Income",value:Math.max(mTot.i,0.01)},{name:"Expenses",value:Math.max(mTot.o,0.01)}]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none"><Cell fill={C.green}/><Cell fill={C.red}/></Pie><Tooltip content={<ChartTip/>}/></PieChart></ResponsiveContainer><div>{[{l:"Income",v:`$${mTot.i.toFixed(2)}`,c:C.green},{l:"Expenses",v:`$${mTot.o.toFixed(2)}`,c:C.red}].map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:3,background:s.c}}/><div><div style={{fontSize:11,color:C.textDim}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div></div></div>))}</div></div></div>
      </>}

      {/* ═══ WORKOUT ═══ */}
      {tab==="workout"&&<>
        <div style={{display:"flex",gap:6,marginBottom:14}}>{[{k:"log",l:"Log"},{k:"progress",l:"Progress"},{k:"bodyweight",l:"Weight"}].map(v=>(<button key={v.k} onClick={()=>{setGymView(v.k);if(v.k!=="log")setGymSplit(null);}} style={pl(gymView===v.k)}>{v.l}</button>))}</div>

        {gymView==="log"&&!gymSplit&&<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {Object.entries(splitExercises).map(([key])=>(<button key={key} onClick={()=>setGymSplit(key)} style={{background:`${splitColors[key]}11`,border:`2px solid ${splitColors[key]}33`,borderRadius:12,padding:"24px 10px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=splitColors[key];e.currentTarget.style.background=`${splitColors[key]}22`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=`${splitColors[key]}33`;e.currentTarget.style.background=`${splitColors[key]}11`;}}>
            <div style={{fontSize:20,fontWeight:800,color:splitColors[key],textTransform:"uppercase",letterSpacing:"0.05em"}}>{key}</div>
            <div style={{fontSize:11,color:C.textDim,marginTop:4}}>{splitExercises[key].length} exercises</div>
          </button>))}
        </div>}

        {gymView==="log"&&gymSplit&&currentWorkout&&<>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <button onClick={()=>setGymSplit(null)} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:C.textDim,fontSize:12}}>← Back</button>
            <span style={{fontSize:15,fontWeight:800,color:splitColors[gymSplit],textTransform:"uppercase"}}>{gymSplit}</span>
            {lastSession&&<span style={{fontSize:11,color:C.textDim,marginLeft:"auto"}}>Last: {fd(lastSession.date)}</span>}
          </div>
          {currentWorkout.exercises.map((ex,ei)=>{const lEx=lastSession&&lastSession.exercises?lastSession.exercises.find(e=>e.name===ex.name):null;const isDone=doneExercises[ei];return(
            <div key={ei} style={{...crd,marginBottom:10,background:isDone?C.greenSoft:C.card,border:`1px solid ${isDone?"rgba(46,173,101,0.3)":C.border}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:isDone?C.green:C.text}}>{isDone&&"✓ "}{ex.name}</span><div style={{display:"flex",gap:3}}><button onClick={()=>setDoneExercises(p=>({...p,[ei]:!p[ei]}))} style={{background:isDone?C.green:C.bgFlat,border:`1px solid ${isDone?C.green:C.border}`,borderRadius:5,padding:"3px 8px",color:isDone?"#fff":C.textDim,cursor:"pointer",fontSize:10,fontWeight:600}}>Done</button><button onClick={()=>removeSet(ei)} style={{background:C.bgFlat,border:`1px solid ${C.border}`,borderRadius:5,width:24,height:24,color:C.textDim,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button><button onClick={()=>addSet(ei)} style={{background:C.accentSoft,border:`1px solid ${C.accentMed}`,borderRadius:5,width:24,height:24,color:C.accent,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div></div>
              <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 60px",gap:6,marginBottom:6}}><span/><span style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",textAlign:"center"}}>kg</span><span style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",textAlign:"center"}}>Reps</span><span style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",textAlign:"center"}}>Prev</span></div>
              {ex.sets.map((s,si)=>{const ls=lEx&&lEx.sets?lEx.sets[si]:null;const wd=ls?s.w-ls.w:null;return(<div key={si} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 60px",gap:6,marginBottom:4,alignItems:"center"}}><span style={{fontSize:11,color:splitColors[gymSplit],fontWeight:700}}>S{si+1}</span><input type="number" value={s.w||""} onChange={e=>updateSet(ei,si,"w",e.target.value)} placeholder="0" style={numS}/><input type="number" value={s.r||""} onChange={e=>updateSet(ei,si,"r",e.target.value)} placeholder="0" style={numS}/><span style={{fontSize:10,textAlign:"center",fontWeight:600,color:ls?(wd>0?C.greenBright:wd<0?C.red:C.textDim):C.textDim}}>{ls?`${ls.w}×${ls.r}`:"—"}</span></div>);})}
            </div>);})}
          <button onClick={saveWorkout} style={{width:"100%",background:splitColors[gymSplit],border:"none",borderRadius:8,padding:"14px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,boxShadow:`0 4px 16px ${splitColors[gymSplit]}33`}}>Save Workout ✓</button>
        </>}

        {gymView==="progress"&&<div style={crd}><div style={secT}>Workout History</div>
          {workoutHistory.slice().reverse().slice(0,10).map((w,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:4,borderRadius:8,background:C.bgFlat}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:splitColors[w.split],flexShrink:0}}/>
            <span style={{fontSize:12,fontWeight:600,color:splitColors[w.split],textTransform:"uppercase",width:50}}>{w.split}</span>
            <span style={{fontSize:12,color:C.textDim}}>{fd(w.date)}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:C.textDim}}>{w.exercises.length} exercises</span>
          </div>))}
        </div>}

        {gymView==="bodyweight"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>{[{l:"Current",v:`${bodyWeightLog.length>0?bodyWeightLog[bodyWeightLog.length-1].weight:0}kg`,c:C.text},{l:"Start",v:`${bodyWeightLog.length>0?bodyWeightLog[0].weight:0}kg`,c:C.textDim},{l:"Change",v:`${bwChange>0?"+":""}${bwChange}kg`,c:bwChange>0?C.greenBright:C.red}].map((s,i)=>(<div key={i} style={{...crd,padding:"12px",textAlign:"center"}}><div style={{fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{s.l}</div><div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div></div>))}</div>
          <div style={{...crd,marginBottom:12}}><div style={secT}>Weight Over Time</div><ResponsiveContainer width="100%" height={160}><LineChart data={bwData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis domain={["dataMin-1","dataMax+1"]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} dot={{fill:C.accent,r:3,strokeWidth:2,stroke:C.surface}} name="kg"/></LineChart></ResponsiveContainer></div>
          <div style={crd}><div style={secT}>Log Weight</div><div style={{display:"flex",gap:8}}><input type="number" step="0.1" value={newBW} onChange={e=>setNewBW(e.target.value)} placeholder="kg" style={{...inpS,flex:1}} onKeyDown={e=>e.key==="Enter"&&addBodyWeight()}/><button onClick={addBodyWeight} style={{background:C.accent,border:"none",borderRadius:8,padding:"9px 18px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Log</button></div><div style={{marginTop:12}}>{bodyWeightLog.slice(-5).reverse().map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",marginBottom:2,borderRadius:6,background:i===0?C.accentSoft:C.bgFlat}}><span style={{fontSize:12,color:C.textDim}}>{fd(e.date)}</span>{editingBW===i?<input type="number" step="0.1" defaultValue={e.weight} onBlur={ev=>{const nw=parseFloat(ev.target.value);if(nw){const idx=bodyWeightLog.length-1-i;setBodyWeightLog(p=>{const n=[...p];n[idx]={...n[idx],weight:nw};return n;});}setEditingBW(null);}} style={{...numS,width:60}} autoFocus/>:<><span style={{fontSize:12,fontWeight:700,color:i===0?C.accent:C.text}}>{e.weight} kg</span><button onClick={()=>setEditingBW(i)} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,opacity:0.5}}>✎</button></>}</div>))}</div></div>
        </>}
      </>}

      {/* ═══ GOALS ═══ */}
      {tab==="goals"&&<>
        <div style={{...crd,marginBottom:12}}>
          <div style={{...secT,display:"flex",alignItems:"center"}}>Monthly Goals<button onClick={()=>setModalType("monthly")} style={{marginLeft:"auto",...pl(false),fontSize:11}}>Edit</button></div>
          {computedMonthlyGoals.map((g,i)=>{const isBin=g.type==="check";const pct=isBin?(g.done?100:0):g.money?Math.min((g.current||0)/(g.target||1)*100,100):g.count?Math.min((g.current||0)/(g.target||1)*100,100):Math.min((g.current||0)/(g.target||100)*100,100);const cl=pctColor(pct);
            return(<div key={i} onClick={isBin?()=>{setMonthlyGoals(p=>p.map((x,j)=>j===i?{...x,done:!x.done}:x));}:undefined} style={{background:pctBg(pct),borderRadius:8,padding:"10px 14px",marginBottom:6,cursor:isBin?"pointer":"default",border:pct>=100?`1px solid ${C.goldBright}44`:"none",boxShadow:pct>=100?`0 0 12px ${C.goldSoft}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><span style={{fontSize:13,fontWeight:600}}>{g.text}</span><span style={{fontSize:11,fontWeight:700,color:cl}}>{isBin?(g.done?"✓ Done":"Not yet"):g.money?`$${(g.current||0).toFixed(0)}/$${g.target}`:g.count?`${g.current||0}/${g.target}`:`${(g.current||0).toFixed(1)}%`}</span></div>
              <div style={{height:6,background:"rgba(255,255,255,0.5)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:barGrad(pct),borderRadius:3,transition:"width 0.3s"}}/></div></div>);})}
          {!goalAddMode&&<button onClick={()=>setGoalAddMode("choose")} style={{width:"100%",background:C.bgFlat,border:`1px dashed ${C.border}`,borderRadius:8,padding:"10px",color:C.textDim,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8}}>+ Add Goal</button>}
          {goalAddMode==="choose"&&<div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>setGoalAddMode("check")} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>☑</div><div style={{fontSize:12,fontWeight:600}}>Checkbox</div></button><button onClick={()=>setGoalAddMode("pct")} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>📊</div><div style={{fontSize:12,fontWeight:600}}>% Goal</div></button></div>}
          {goalAddMode==="check"&&<div style={{background:C.bgFlat,borderRadius:8,padding:12,marginTop:8}}><div style={{display:"flex",gap:6}}><input value={monthlyInput} onChange={e=>setMonthlyInput(e.target.value)} placeholder="e.g. Go to Paris" style={inpS} onKeyDown={e=>{if(e.key==="Enter"&&monthlyInput.trim()){setMonthlyGoals(p=>[...p,{text:monthlyInput.trim(),done:false,type:"check"}]);setMonthlyInput("");setGoalAddMode(null);}}}/><button onClick={()=>{if(monthlyInput.trim()){setMonthlyGoals(p=>[...p,{text:monthlyInput.trim(),done:false,type:"check"}]);setMonthlyInput("");setGoalAddMode(null);}}} style={{background:C.accent,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button><button onClick={()=>setGoalAddMode(null)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.textDim,fontSize:12,cursor:"pointer"}}>✕</button></div></div>}
          {goalAddMode==="pct"&&<div style={{background:C.bgFlat,borderRadius:8,padding:12,marginTop:8}}><select value={goalPctTodo} onChange={e=>setGoalPctTodo(e.target.value)} style={{...inpS,marginBottom:6,cursor:"pointer"}}><option value="">Select a to-do...</option>{allHabits.map(h=>(<option key={h.id} value={h.id}>{h.text}</option>))}</select><div style={{display:"flex",gap:6}}><input type="number" value={goalPctTarget} onChange={e=>setGoalPctTarget(e.target.value)} placeholder="%" style={{...inpS,width:80}}/><button onClick={()=>{if(goalPctTodo&&goalPctTarget){const habit=allHabits.find(h=>h.id===goalPctTodo);setMonthlyGoals(p=>[...p,{text:`${goalPctTarget}% on ${habit?habit.text:goalPctTodo}`,habitId:goalPctTodo,current:0,target:parseFloat(goalPctTarget),type:"pct"}]);setGoalPctTodo("");setGoalPctTarget("");setGoalAddMode(null);}}} style={{background:C.accent,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button><button onClick={()=>setGoalAddMode(null)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.textDim,fontSize:12,cursor:"pointer"}}>✕</button></div></div>}
        </div>
        <div style={crd}><div style={{...secT,display:"flex",alignItems:"center"}}>Weekly Goals<button onClick={()=>setModalType("weekly")} style={{marginLeft:"auto",...pl(false),fontSize:11}}>Edit</button></div>{weeklyGoals.map(g=>(<div key={g.id} onClick={()=>setWeeklyGoals(p=>p.map(x=>x.id===g.id?{...x,done:!x.done}:x))} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:3,borderRadius:8,cursor:"pointer",background:g.done?C.accentMed:C.surface,border:`1px solid ${g.done?C.accentBright+"44":C.border}`,boxShadow:g.done?`0 0 8px ${C.accentSoft}`:"none"}}><div style={{width:18,height:18,borderRadius:5,flexShrink:0,border:`2px solid ${g.done?C.accentBright:C.border}`,background:g.done?C.accentBright:C.surface,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800}}>{g.done&&"✓"}</div><span style={{fontSize:13,fontWeight:500,textDecoration:g.done?"line-through":"none",color:g.done?C.textDim:C.text}}>{g.text}</span></div>))}</div>
      </>}

      {/* ═══ MONTHLY STATS ═══ */}
      {tab==="mstats"&&<>
        <div style={{...crd,padding:"16px 18px",marginBottom:14,background:pctBg(monthScore)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:14,fontWeight:700}}>This Month</span><span style={{fontSize:26,fontWeight:800,color:pctColor(monthScore)}}>{monthScore}%</span></div>
        </div>
        <div style={{...crd,marginBottom:12}}><div style={secT}>Daily Progress</div>
          <ResponsiveContainer width="100%" height={180}><AreaChart data={monthlyProgress}><defs><linearGradient id="fG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.3}/><stop offset="100%" stopColor={C.green} stopOpacity={0.05}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false}/><XAxis dataKey="day" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} width={28} tickFormatter={v=>`${v}%`}/><Tooltip content={<ChartTip/>}/><ReferenceLine y={50} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4}/><Area type="monotone" dataKey="pct" stroke={C.green} fill="url(#fG)" strokeWidth={2.5} dot={{fill:C.green,r:2.5,strokeWidth:0}} name="Score"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div style={{...crd,border:`1px solid ${C.greenMed}`}}><div style={{...secT,color:C.green}}>Strong (&gt;60%)</div>{habitList.filter(h=>h.rate>=60).map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",marginBottom:3,borderRadius:6,background:C.greenSoft}}><span style={{fontSize:12}}>{h.name}</span><span style={{fontSize:11,fontWeight:700,color:pctColor(h.rate)}}>{h.rate}%</span></div>))}{habitList.filter(h=>h.rate>=60).length===0&&<div style={{fontSize:12,color:C.textDim,textAlign:"center",padding:10}}>Check off habits to see them here</div>}</div>
          <div style={{...crd,border:`1px solid ${C.redMed}`}}><div style={{...secT,color:C.red}}>Weak (&lt;25%)</div>{habitList.filter(h=>h.rate<25&&h.rate>=0).map((h,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",marginBottom:3,borderRadius:6,background:C.redSoft}}><span style={{fontSize:12}}>{h.name}</span><span style={{fontSize:11,fontWeight:700,color:pctColor(h.rate)}}>{h.rate}%</span></div>))}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={crd}><div style={secT}>Morning</div>{morningTodos.map(t=>{const hr=habitRates[t.id];const r=hr?hr.rate:0;return (<HabitBar key={t.id} name={t.text} rate={r}/>);})}</div>
          <div style={crd}><div style={secT}>Night</div><div style={{maxHeight:400,overflowY:"auto"}}>{nightTodos.map(t=>{const hr=habitRates[t.id];const r=hr?hr.rate:0;return (<HabitBar key={t.id} name={t.text} rate={r}/>);})}</div></div>
        </div>
      </>}

      {/* ═══ OVERALL ANALYTICS ═══ */}
      {tab==="analytics"&&<>
        <div style={{...crd,marginBottom:12}}><div style={secT}>3-Month Performance Trend</div>
          <ResponsiveContainer width="100%" height={180}><LineChart data={trendChart}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false}/><XAxis dataKey="label" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={28} tickFormatter={v=>`${v}%`}/><Tooltip content={<ChartTip/>}/><ReferenceLine y={70} stroke={C.green} strokeDasharray="4 4" strokeOpacity={0.4}/><Line type="monotone" dataKey="avg" stroke={C.accent} strokeWidth={3} dot={{r:4,strokeWidth:2,stroke:C.surface,fill:C.accent}} activeDot={{r:7,fill:C.accent,stroke:C.surface,strokeWidth:3}} name="Weekly Avg %"/></LineChart></ResponsiveContainer>
          {trendChart.length===0&&<div style={{textAlign:"center",padding:20,color:C.textDim}}>Check off habits in the Today tab to see data here</div>}
        </div>

        <div style={{...crd,marginBottom:12}}><div style={secT}>Day-of-Week Patterns</div>
          <ResponsiveContainer width="100%" height={130}><BarChart data={dowData} barSize={28}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false}/><XAxis dataKey="day" tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false} width={28}/><Tooltip content={<ChartTip/>}/><Bar dataKey="avg" radius={[4,4,0,0]} name="Avg %">{dowData.map((d,i)=>(<Cell key={i} fill={dowColor(d.avg)}/>))}</Bar></BarChart></ResponsiveContainer>
        </div>

        {/* Clickable habit list */}
        <div style={crd}><div style={secT}>Habit Detail (click to expand)</div>
          {habitList.map((h,i)=>(<div key={i}>
            <div onClick={()=>setSelectedHabit(selectedHabit===h.id?null:h.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginBottom:2,borderRadius:8,background:selectedHabit===h.id?C.accentSoft:i%2===0?C.bgFlat:"transparent",cursor:"pointer",border:`1px solid ${selectedHabit===h.id?C.accentMed:"transparent"}`}}>
              <span style={{fontSize:13,fontWeight:500}}>{h.name}</span>
              <span style={{fontSize:12,fontWeight:700,color:pctColor(h.rate)}}>{h.rate}%</span>
            </div>
            {selectedHabit===h.id&&<div style={{padding:"10px 14px",marginBottom:6,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,color:C.textDim,marginBottom:6}}>This month: <strong style={{color:pctColor(h.rate)}}>{h.rate}%</strong></div>
              <div style={{height:8,background:C.borderLight,borderRadius:4,overflow:"hidden",marginBottom:8}}><div style={{height:"100%",width:`${h.rate}%`,background:barGrad(h.rate),borderRadius:4}}/></div>
              <div style={{fontSize:12,fontWeight:600,color:h.rate>=70?C.green:h.rate>=40?C.gold:C.red,padding:"6px 10px",borderRadius:6,background:h.rate>=70?C.greenSoft:h.rate>=40?C.goldSoft:C.redSoft}}>
                {h.rate>=70?"Keep it up — strong consistency!":h.rate>=40?"Room to improve — try to be more consistent":h.rate>=20?"Needs attention — make this a priority":"Critical — this habit needs a restart"}
              </div>
            </div>}
          </div>))}
        </div>
      </>}
    </div>

    {/* ═══ MODALS ═══ */}
    <Modal open={modalType==="weekly"} onClose={()=>setModalType(null)} title="Weekly Goals">
      {weeklyGoals.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:6,background:C.bgFlat}}><span style={{flex:1,fontSize:13}}>{g.text}</span><button onClick={()=>setWeeklyGoals(p=>p.filter(x=>x.id!==g.id))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>×</button></div>))}
      <div style={{display:"flex",gap:6,marginTop:10}}><input value={weeklyInput} onChange={e=>setWeeklyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&weeklyInput.trim()){setWeeklyGoals(p=>[...p,{id:`w_${Date.now()}`,text:weeklyInput.trim(),done:false}]);setWeeklyInput("");}}} placeholder="Add goal..." style={inpS}/><button onClick={()=>{if(weeklyInput.trim()){setWeeklyGoals(p=>[...p,{id:`w_${Date.now()}`,text:weeklyInput.trim(),done:false}]);setWeeklyInput("");}}} style={{background:C.accent,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button></div>
    </Modal>
    <Modal open={modalType==="monthly"} onClose={()=>setModalType(null)} title="Edit Monthly Goals">
      {monthlyGoals.map((g,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:6,background:C.bgFlat}}><span style={{flex:1,fontSize:13}}>{g.text}</span><button onClick={()=>setMonthlyGoals(p=>p.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:14}}>×</button></div>))}
    </Modal>
    <Modal open={modalType==="report"} onClose={()=>{setModalType(null);setReport(null);}} title={`${reportType==="daily"?"Daily":reportType==="weekly"?"Weekly":"Monthly"} Report`}>
      {reportLoading&&<div style={{textAlign:"center",padding:40}}><div style={{fontSize:13,color:C.accent,fontWeight:700}}>Generating...</div><div style={{height:3,background:C.borderLight,borderRadius:2,overflow:"hidden",marginTop:12}}><div style={{height:"100%",width:"60%",background:C.accent,borderRadius:2,animation:"pulse 1.5s ease-in-out infinite"}}/></div><style>{`@keyframes pulse{0%,100%{opacity:.4;width:30%}50%{opacity:1;width:80%}}`}</style></div>}
      {report&&!reportLoading&&<div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"14px 16px",borderRadius:10,background:pctBg(report.grade==="A"?95:report.grade==="B"?75:report.grade==="C"?55:25)}}><div style={{width:52,height:52,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,flexShrink:0,background:C.surface,color:report.grade==="A"?C.goldBright:report.grade==="B"?C.greenBright:report.grade==="C"?C.accent:C.red,boxShadow:report.grade==="A"?`0 0 16px ${C.goldSoft}`:"none"}}>{report.grade}</div><div><div style={{fontSize:15,fontWeight:700}}>{report.headline}</div>{report.streak_note&&<div style={{fontSize:12,color:C.textDim,marginTop:2}}>{report.streak_note}</div>}</div></div>
        {report.wins&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",marginBottom:8}}>Wins</div>{report.wins.map((w,i)=>(<div key={i} style={{padding:"7px 10px",marginBottom:3,borderRadius:6,background:C.greenSoft,fontSize:12.5}}>{w}</div>))}</div>}
        {report.improvements&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.red,textTransform:"uppercase",marginBottom:8}}>Improve</div>{report.improvements.map((w,i)=>(<div key={i} style={{padding:"7px 10px",marginBottom:3,borderRadius:6,background:C.redSoft,fontSize:12.5}}>{w}</div>))}</div>}
        <div style={{padding:"12px 14px",borderRadius:8,background:C.bgFlat}}><div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:4}}>Advice</div><div style={{fontSize:13,lineHeight:1.5}}>{report.advice}</div></div>
      </div>}
    </Modal>
  </div>);
}
