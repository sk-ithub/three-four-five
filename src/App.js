import { useState, useEffect, useRef } from "react";

/* ═══ CONSTANTS — UNCHANGED ═══ */
const SUITS=["hearts","diamonds","clubs","spades"],RANKS=["6","7","8","9","10","J","Q","K","A"];
const RV={6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14};
const SYM={hearts:"♥",diamonds:"♦",clubs:"♣",spades:"♠"};
const SCOL={hearts:"#D66753",diamonds:"#D66753",clubs:"#2C2C2C",spades:"#2C2C2C"};
const TARGETS=[5,4,3],RLABEL=["Trump Decider","Cutter","Dealer"];
const C={dark:"#2C2C2C",terra:"#D66753",cream:"#F1EAD8",blue:"#4E7BAD",olive:"#7D8450",gold:"#E3B605"};
const NAMES=["Amara","Rohan","Zara","Felix","Luna","Kai","Mira","Dex","Noor","Jude","Sia","Rex","Ivy","Omar","Tessa","Nico","Priya","Arun","Lila","Hugo","Meera","Theo","Suki","Cass","Ravi","Anya","Idris","Bea","Yuki","Ezra"];
const pick2=()=>{const s=[...NAMES].sort(()=>Math.random()-0.5);return[s[0],s[1]]};
if(typeof document!=="undefined"&&!document.head.querySelector('link[href*="Abril+Fatface"]')){const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Manrope:wght@400;500;600;700&display=swap";document.head.appendChild(l)}
const FD="'Abril Fatface',Georgia,serif",FB="'Manrope','Segoe UI',sans-serif";
const SPEEDS={slow:{label:"Slow",m:2.8},normal:{label:"Normal",m:1.6},fast:{label:"Fast",m:1}};
const EG="cubic-bezier(0.25,1.0,0.5,1.0)";

const ACSS=`
@keyframes dealDown{from{transform:translate(0,-50vh) scale(0.7);opacity:0}60%{opacity:1}to{transform:none;opacity:1}}
@keyframes dealUp{from{transform:translate(0,40vh) scale(0.7);opacity:0}60%{opacity:1}to{transform:none;opacity:1}}
@keyframes dealRight{from{transform:translate(-50vw,0) scale(0.7);opacity:0}60%{opacity:1}to{transform:none;opacity:1}}
@keyframes playFromBot{from{transform:translateY(40vh) scale(1.02);opacity:0.5}to{transform:none;opacity:1}}
@keyframes playFromTop{from{transform:translateY(-35vh) scale(1.02);opacity:0.5}to{transform:none;opacity:1}}
@keyframes playFromRight{from{transform:translateX(40vw) scale(1.02);opacity:0.5}to{transform:none;opacity:1}}
@keyframes shuffleL{0%{transform:translateX(0)}50%{transform:translateX(-25px) rotate(-2deg)}100%{transform:translateX(0)}}
@keyframes shuffleR{0%{transform:translateX(0)}50%{transform:translateX(25px) rotate(2deg)}100%{transform:translateX(0)}}
@keyframes rearrange{0%{transform:translateX(var(--rx,0)) scale(0.9);opacity:0.6}100%{transform:none;opacity:1}}
@keyframes plusPop{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-22px) scale(1.4);opacity:0}}
@keyframes popupIn{0%{transform:translate(-50%,-50%) scale(0.8);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes popupOut{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(0.8);opacity:0}}
`;

/* ═══ GAME LOGIC — 100% UNCHANGED ═══ */
const makeDeck=()=>{const d=[];for(const s of SUITS)for(const r of RANKS)d.push({suit:s,rank:r,id:`${r}_${s}`});return d};
const shuffle=a=>{const b=[...a];for(let p=0;p<5;p++)for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const cv=c=>RV[c.rank];
const sortHand=h=>{const o={spades:0,hearts:1,diamonds:2,clubs:3};return[...h].sort((a,b)=>o[a.suit]!==o[b.suit]?o[a.suit]-o[b.suit]:cv(b)-cv(a))};
const getWinner=(trick,trump)=>{const led=trick[0].card.suit;let best=0;for(let i=1;i<trick.length;i++){const bc=trick[best].card,cc=trick[i].card,bt=bc.suit===trump,ct=cc.suit===trump;if(ct&&!bt)best=i;else if(ct&&bt&&cv(cc)>cv(bc))best=i;else if(!ct&&!bt){if(cc.suit===led&&bc.suit!==led)best=i;else if(cc.suit===led&&bc.suit===led&&cv(cc)>cv(bc))best=i}}return trick[best].playerIndex};
const getValid=(hand,trick)=>{if(!trick.length)return hand;const led=trick[0].card.suit;const f=hand.filter(c=>c.suit===led);return f.length>0?f:hand};
const getTd=d=>(d+1)%3,getCut=d=>(d+2)%3;
const roleOf=(i,d)=>i===getTd(d)?0:i===getCut(d)?1:2;
const targetOf=(i,d)=>TARGETS[roleOf(i,d)];
const rname=(i,d)=>RLABEL[roleOf(i,d)];
const pn=(i,pl)=>i===0?"You":pl[i].name;
const aiTrump=hand=>{const sc={};SUITS.forEach(s=>sc[s]=0);hand.forEach(c=>{sc[c.suit]+=2;if(cv(c)>=13)sc[c.suit]+=3;else if(cv(c)>=11)sc[c.suit]+=1});return SUITS.reduce((a,b)=>sc[a]>=sc[b]?a:b)};
const aiCard=(hand,trick,trump,won,target,tNum)=>{const valid=getValid(hand,trick);if(valid.length===1)return valid[0];const need=won<target,desp=target-won>=13-tNum;if(!trick.length){if(desp){const tc=valid.filter(c=>c.suit===trump).sort((a,b)=>cv(b)-cv(a));if(tc.length&&cv(tc[0])>=12)return tc[0]}if(need){const nt=valid.filter(c=>c.suit!==trump);const aces=nt.filter(c=>cv(c)===14);if(aces.length)return aces[0];const kings=nt.filter(c=>cv(c)===13);if(kings.length)return kings[0];if(nt.length)return nt.reduce((a,b)=>cv(a)>cv(b)?a:b);return valid.reduce((a,b)=>cv(a)>cv(b)?a:b)}const nt=valid.filter(c=>c.suit!==trump);return(nt.length?nt:valid).reduce((a,b)=>cv(a)<cv(b)?a:b)}const led=trick[0].card.suit,following=valid[0].suit===led,hasTr=trick.some(x=>x.card.suit===trump&&led!==trump);if(following){if(won>=target||hasTr)return valid.reduce((a,b)=>cv(a)<cv(b)?a:b);if(need){const best=Math.max(...trick.filter(x=>x.card.suit===led).map(x=>cv(x.card)));const w=valid.filter(c=>cv(c)>best);if(w.length)return trick.length===2?w.reduce((a,b)=>cv(a)<cv(b)?a:b):w.reduce((a,b)=>cv(a)>cv(b)?a:b)}return valid.reduce((a,b)=>cv(a)<cv(b)?a:b)}const tc=valid.filter(c=>c.suit===trump),nt=valid.filter(c=>c.suit!==trump);if(need&&tc.length){const pt=trick.filter(x=>x.card.suit===trump);if(pt.length){const ht=Math.max(...pt.map(x=>cv(x.card)));const b=tc.filter(c=>cv(c)>ht);if(b.length)return b.reduce((a,b2)=>cv(a)<cv(b2)?a:b2);if(nt.length)return nt.reduce((a,b)=>cv(a)<cv(b)?a:b);return tc.reduce((a,b)=>cv(a)<cv(b)?a:b)}return tc.reduce((a,b)=>cv(a)<cv(b)?a:b)}return(nt.length?nt:valid).reduce((a,b)=>cv(a)<cv(b)?a:b)};

/* ═══ RESPONSIVE ═══ */
function useWin(){const[s,setS]=useState({w:typeof window!=="undefined"?window.innerWidth:1200,h:typeof window!=="undefined"?window.innerHeight:800});useEffect(()=>{const h=()=>setS({w:window.innerWidth,h:window.innerHeight});window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return s}
// 3 breakpoints: sm<420, md 420-768, lg 768+
const bp=(w)=>w<420?"sm":w<768?"md":"lg";

/* ═══ COMPONENTS ═══ */
function CardC({card,faceDown,onClick,disabled,selected,small,style}){
  const{w:ww}=useWin();const sz=bp(ww);
  const bw=small?{sm:28,md:40,lg:48}[sz]:{sm:50,md:66,lg:82}[sz];
  const bh=small?{sm:40,md:58,lg:68}[sz]:{sm:74,md:96,lg:120}[sz];
  if(faceDown)return(<div style={{width:bw,height:bh,borderRadius:small?3:6,flexShrink:0,background:C.olive,border:`1px solid ${C.dark}12`,boxShadow:"2px 2px 0px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",...(style||{})}}>{sz==="lg"&&!small&&<div style={{width:bw-10,height:bh-10,borderRadius:3,border:`1px solid ${C.cream}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:`${C.cream}30`}}>✦</div>}</div>);
  const col=SCOL[card.suit],sym=SYM[card.suit];
  const fs1=small?{sm:7,md:9,lg:11}[sz]:{sm:11,md:14,lg:17}[sz];
  const fs2=small?{sm:7,md:9,lg:11}[sz]:{sm:12,md:15,lg:19}[sz];
  return(<div onClick={!disabled&&onClick?()=>onClick(card):undefined} style={{width:bw,height:bh,borderRadius:6,flexShrink:0,background:C.cream,border:selected?`2.5px solid ${C.terra}`:`1px solid ${C.dark}10`,cursor:!disabled&&onClick?"pointer":"default",opacity:disabled?0.45:1,boxShadow:selected?`3px 3px 0px ${C.terra}44`:"2px 2px 0px rgba(0,0,0,0.1)",transform:selected?"translateY(-20px)":"none",transition:`all 0.15s ${EG}`,position:"relative",fontFamily:FB,...(style||{})}}>
    <div style={{position:"absolute",top:small?2:5,left:small?2:6}}><div style={{color:col,fontWeight:700,fontSize:fs1,lineHeight:1,fontFamily:FD}}>{card.rank}</div><div style={{color:col,fontSize:fs2,lineHeight:1}}>{sym}</div></div>
    <div style={{position:"absolute",bottom:small?2:5,right:small?2:6,transform:"rotate(180deg)"}}><div style={{color:col,fontWeight:700,fontSize:fs1,lineHeight:1,fontFamily:FD}}>{card.rank}</div><div style={{color:col,fontSize:fs2,lineHeight:1}}>{sym}</div></div>
    {!small&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:{sm:18,md:24,lg:30}[sz],color:col,opacity:0.08}}>{sym}</div>}
  </div>);
}

function Slots({count,filled,sz,isHuman,plusShow}){
  const s={sm:12,md:16,lg:22}[sz],h={sm:17,md:22,lg:30}[sz];
  const extra=Math.max(0,filled-count),total=count+extra;
  return(<div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap",position:"relative"}}>
    {Array.from({length:total}).map((_,i)=>{const isX=i>=count,isF=i<filled;return(
      <div key={i} style={{width:s,height:h,borderRadius:3,background:isF?(isX?C.gold:C.terra):(isHuman?`${C.dark}35`:`${C.cream}20`),border:isF?"none":(isHuman?`1px dashed ${C.dark}50`:`1px dashed ${C.cream}40`),display:"flex",alignItems:"center",justifyContent:"center",fontSize:isX?{sm:6,md:7,lg:9}[sz]:{sm:5,md:6,lg:7}[sz],color:isF?C.cream:"transparent",fontWeight:700,fontFamily:FB,boxShadow:isF?"1px 1px 0px rgba(0,0,0,0.06)":"none",transition:`all 0.4s ${EG}`,position:"relative"}}>
        {isF?(isX?"+":"✦"):""}
        {isX&&i===total-1&&plusShow&&<div style={{position:"absolute",top:-8,right:-8,fontSize:12,fontWeight:700,color:C.gold,fontFamily:FB,animation:`plusPop 1.5s ${EG} forwards`,pointerEvents:"none"}}>+1</div>}
      </div>)})}
  </div>);
}

function Badge({name,role,pts,tricks,target,active,sz,isHuman,plusShow}){
  const pad={sm:"5px 8px",md:"7px 12px",lg:"8px 14px"}[sz];
  const nameFs={sm:13,md:16,lg:18}[sz];
  const ptsFs={sm:22,md:28,lg:32}[sz];
  const roleFs={sm:7,md:8,lg:9}[sz];
  const ptsLbl={sm:8,md:10,lg:12}[sz];
  return(<div style={{background:active?`${C.cream}ee`:`${C.dark}44`,borderRadius:6,padding:pad,border:active?`2px solid ${C.terra}`:`1px solid ${C.cream}10`,boxShadow:"2px 2px 0px rgba(0,0,0,0.08)",transition:"all 0.2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontFamily:FD,fontSize:nameFs,color:active?C.dark:C.cream}}>{name}</span><span style={{fontSize:roleFs,padding:"1px 5px",borderRadius:2,background:C.blue,color:C.cream,fontFamily:FB,fontWeight:700,letterSpacing:0.3,textTransform:"uppercase"}}>{role}</span></div>
    <div style={{fontFamily:FD,fontSize:ptsFs,lineHeight:1.1,color:active?C.terra:C.gold}}>{pts} <span style={{fontSize:ptsLbl,fontFamily:FB,fontWeight:500,color:active?`${C.dark}70`:`${C.cream}70`}}>PTS</span></div>
    <Slots count={target} filled={tricks} sz={sz} isHuman={isHuman} plusShow={plusShow}/>
  </div>);
}

/* ═══ MAIN ═══ */
export default function Game345(){
  const{w:ww}=useWin();const sz=bp(ww);
  const[phase,setPhase]=useState("welcome");
  const[ps,setPs]=useState(()=>{const[n1,n2]=pick2();return[{name:"You",hand:[],tricks:0,pts:19,human:true},{name:n1,hand:[],tricks:0,pts:19,human:false},{name:n2,hand:[],tricks:0,pts:19,human:false}]});
  const[dealer,setDealer]=useState(()=>Math.floor(Math.random()*3));
  const[trump,setTrump]=useState(null);
  const[trick,setTrick]=useState([]);
  const[curP,setCurP]=useState(0);
  const[sel,setSel]=useState(null);
  const[round,setRound]=useState(1);
  const[trickNum,setTrickNum]=useState(0);
  const[msg,setMsg]=useState("");
  const[results,setResults]=useState(null);
  const[tw,setTw]=useState(null);
  const[showMenu,setShowMenu]=useState(false);
  const[showHelp,setShowHelp]=useState(false);
  const[remCards,setRemCards]=useState([]);
  const[speed,setSpeed]=useState("normal");
  const[dealAnim,setDealAnim]=useState(null);
  const[dealtIds,setDealtIds]=useState(new Set());
  const[rearranging,setRearranging]=useState(false);
  const[collecting,setCollecting]=useState(false);
  const[collectingTo,setCollectingTo]=useState(null);
  const[visualTricks,setVisualTricks]=useState([0,0,0]);
  const[plusAnims,setPlusAnims]=useState([false,false,false]);
  const[lastPlayed,setLastPlayed]=useState(null); // {pi, key} for play animation
  const[fadeDisabled,setFadeDisabled]=useState(true);
  const[cantPlayPopup,setCantPlayPopup]=useState(false);
  const tmrs=useRef([]);

  const sm=SPEEDS[speed].m;const ti=ms=>ms*sm;
  const clr=()=>{tmrs.current.forEach(t=>clearTimeout(t));tmrs.current=[]};
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);tmrs.current.push(id);return id};
  useEffect(()=>()=>clr(),[]);

  const playAnimKey=useRef(0);
  const isDeal=dealAnim!==null;

  // Badge refs for collect-to-slot positions
  const badgeRefs=[useRef(null),useRef(null),useRef(null)];
  const trickAreaRef=useRef(null);

  /* ═══ DEAL ═══ */
  const startRound=(players,dealerIdx)=>{
    clr();const deck=shuffle(makeDeck());const td=getTd(dealerIdx),cut=getCut(dealerIdx);
    const np=players.map(p=>({...p,hand:[],tricks:0}));const order=[td,cut,dealerIdx];let idx=0;
    for(const pi of order){np[pi].hand=deck.slice(idx,idx+5);idx+=5}
    const remaining=deck.slice(idx);
    setPs(np);setRemCards(remaining);setTrump(null);setTrick([]);setTrickNum(0);setTw(null);setSel(null);setMsg("");setCollecting(false);setCollectingTo(null);setVisualTricks([0,0,0]);setPlusAnims([false,false,false]);setRearranging(false);setLastPlayed(null);
    setDealtIds(new Set());setDealAnim("shuffle");setMsg("SHUFFLING...");setPhase("dealing");
    later(()=>{
      setDealAnim("deal1");setMsg("DEALING...");
      const ids=[];order.forEach(pi=>np[pi].hand.forEach(c=>ids.push(c.id)));
      ids.forEach((id,i)=>{later(()=>setDealtIds(prev=>{const n=new Set(prev);n.add(id);return n}),i*ti(100))});
      later(()=>{
        setDealAnim(null);
        if(td===0){setMsg("CHOOSE YOUR TRUMP SUIT");setPhase("trumpSelect")}
        else{setMsg(`${np[td].name} IS CHOOSING TRUMP...`);setPhase("trumpWait");later(()=>finishDeal(np,remaining,aiTrump(np[td].hand),dealerIdx),ti(1400))}
      },ids.length*ti(100)+ti(400));
    },ti(1200));
  };

  const finishDeal=(players,remaining,suit,dealerIdx)=>{
    const td=getTd(dealerIdx),cut=getCut(dealerIdx);
    setTrump(suit);setMsg(`TRUMP: ${SYM[suit]} ${suit[0].toUpperCase()+suit.slice(1)}`);
    setPhase("dealing");setDealAnim("deal2");
    const order=[td,cut,dealerIdx];
    const p2=players.map(p=>({...p,hand:[...p.hand]}));let idx=0;
    for(const pi of order){p2[pi].hand.push(...remaining.slice(idx,idx+4));idx+=4}
    for(const pi of order){p2[pi].hand.push(...remaining.slice(idx,idx+3));idx+=3}
    setPs(p2);setRemCards([]);
    const newIds=[];p2.forEach(p=>p.hand.forEach(c=>{if(!dealtIds.has(c.id))newIds.push(c.id)}));
    let count=0;
    newIds.forEach((id,i)=>{later(()=>setDealtIds(prev=>{const n=new Set(prev);n.add(id);return n}),i*ti(80));count++});
    later(()=>{
      setRearranging(true);setMsg("REARRANGING CARDS...");
      const p3=p2.map(p=>({...p,hand:sortHand(p.hand)}));setPs(p3);
      later(()=>{
        setRearranging(false);setDealAnim(null);setTrickNum(1);setCurP(td);
        setMsg(td===0?"TRICK 1 — YOU LEAD":`TRICK 1 — ${p3[td].name} LEADS`);setPhase("playing");
        if(td!==0)later(()=>runAi(p3,[],td,suit,1,dealerIdx),ti(700));
      },ti(1000)); // 1s rearrange
    },count*ti(80)+ti(300));
  };

  const chooseTrump=suit=>{if(phase!=="trumpSelect")return;setPhase("dealing");finishDeal(ps,remCards,suit,dealer)};

  /* ═══ PLAY ═══ */
  const runPlay=(card,pi,cPs,cTr,trp,tn,dealerIdx)=>{
    const np=cPs.map((p,i)=>i!==pi?p:{...p,hand:p.hand.filter(c=>c.id!==card.id)});
    const nt=[...cTr,{playerIndex:pi,card}];
    playAnimKey.current++;
    setPs(np);setTrick(nt);setSel(null);setLastPlayed({pi,key:playAnimKey.current});

    if(nt.length===3){
      const w=getWinner(nt,trp);np[w].tricks+=1;setPs([...np]);setTw(w);
      setMsg(w===0?"YOU WIN THE TRICK!":`${np[w].name} WINS!`);
      later(()=>{setCollecting(true);
        later(()=>{setCollectingTo(w);
          later(()=>{
            setTrick([]);setTw(null);setCollecting(false);setCollectingTo(null);setLastPlayed(null);
            const vt=[...visualTricks];vt[w]=np[w].tricks;setVisualTricks(vt);
            if(np[w].tricks>targetOf(w,dealerIdx)){const pa=[false,false,false];pa[w]=true;setPlusAnims(pa);later(()=>setPlusAnims([false,false,false]),1600)}
            const nxt=tn+1;if(nxt>12){doEndRound(np,dealerIdx);return}
            setTrickNum(nxt);setCurP(w);
            setMsg(w===0?`TRICK ${nxt} — YOU LEAD`:`TRICK ${nxt} — ${np[w].name} LEADS`);
            if(!np[w].human)later(()=>runAi(np,[],w,trp,nxt,dealerIdx),ti(600));
          },ti(600));
        },ti(500));
      },ti(900));
    }else{
      const nx=(pi+1)%3;setCurP(nx);
      setMsg(nx===0?"YOUR TURN":`${cPs[nx].name}'S TURN`);
      if(!np[nx].human)later(()=>runAi(np,nt,nx,trp,tn,dealerIdx),ti(600));
    }
  };
  const runAi=(cPs,cTr,pi,trp,tn,dI)=>{runPlay(aiCard(cPs[pi].hand,cTr,trp,cPs[pi].tricks,targetOf(pi,dI),tn),pi,cPs,cTr,trp,tn,dI)};

  const clickCard=card=>{
    if(phase!=="playing"||curP!==0)return;
    const v=getValid(ps[0].hand,trick);
    if(!v.find(c=>c.id===card.id)){
      if(!fadeDisabled){setCantPlayPopup(true);later(()=>setCantPlayPopup(false),1200)}
      return;
    }
    if(sel&&sel.id===card.id){setSel(null);return}
    setSel(card);
  };
  const playSelected=()=>{if(!sel||curP!==0||phase!=="playing")return;runPlay(sel,0,ps,trick,trump,trickNum,dealer)};

  /* ═══ END ROUND — UNCHANGED ═══ */
  const doEndRound=(fp,dI)=>{const res=fp.map((p,i)=>({name:pn(i,fp),tricks:p.tricks,target:targetOf(i,dI),role:rname(i,dI),diff:p.tricks-targetOf(i,dI)}));const pts=fp.map(p=>p.pts);const diffs=res.map(r=>r.diff);const transfers=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){if(diffs[i]>0&&diffs[j]<0){const a=Math.min(diffs[i],Math.abs(diffs[j]),pts[j]);if(a>0){pts[i]+=a;pts[j]-=a;diffs[i]-=a;diffs[j]+=a;transfers.push(`${pn(j,fp)} pay${j===0?"":"s"} ${a} to ${pn(i,fp)}`)}}}const up=fp.map((p,i)=>({...p,pts:pts[i]}));setPs(up);const bi=up.findIndex(p=>p.pts<=0);setResults({res,transfers,bankrupt:bi>=0?pn(bi,up):null});setPhase("roundEnd")};
  const continueGame=()=>{clr();const nd=(dealer+1)%3;setDealer(nd);setRound(r=>r+1);setResults(null);later(()=>startRound(ps,nd),250)};
  const newGame=()=>{clr();const[n1,n2]=pick2();const fp=[{name:"You",hand:[],tricks:0,pts:19,human:true},{name:n1,hand:[],tricks:0,pts:19,human:false},{name:n2,hand:[],tricks:0,pts:19,human:false}];const fd=Math.floor(Math.random()*3);setPs(fp);setDealer(fd);setRound(1);setResults(null);setTrump(null);setTrick([]);setTrickNum(0);setTw(null);setSel(null);setShowMenu(false);setShowHelp(false);setMsg("");setDealAnim(null);setDealtIds(new Set());setCollecting(false);setCollectingTo(null);setVisualTricks([0,0,0]);setPlusAnims([false,false,false]);setRearranging(false);setLastPlayed(null);later(()=>startRound(fp,fd),300)};

  /* ═══ STYLES ═══ */
  const btnS=bg=>({padding:{sm:"6px 12px",md:"8px 18px",lg:"10px 24px"}[sz],fontSize:{sm:9,md:11,lg:13}[sz],fontFamily:FB,fontWeight:600,background:bg,color:C.cream,border:"none",borderRadius:4,cursor:"pointer",letterSpacing:0.8,textTransform:"uppercase",boxShadow:"2px 2px 0px rgba(0,0,0,0.1)"});
  const tagS=bg=>({display:"inline-block",padding:{sm:"2px 5px",md:"2px 6px",lg:"3px 8px"}[sz],fontSize:{sm:7,md:9,lg:10}[sz],background:bg,color:C.cream,borderRadius:2,fontFamily:FB,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"});

  // Zig-zag trick positions
  const zigzag=(idx)=>{
    const cw={sm:50,md:66,lg:82}[sz];
    const ch={sm:74,md:96,lg:120}[sz];
    const xOff=idx*(cw*0.45);
    const yDir=idx%2===0?-1:1;
    const yOff=idx*(ch*0.3)*yDir*0.5;
    const seed=idx*37+7;const rr=((seed*13)%7)-3;
    return{left:`calc(50% - ${cw*0.6}px + ${xOff}px)`,top:`calc(50% + ${yOff}px)`,transform:`translate(0,-50%) rotate(${rr}deg)`};
  };

  // Collect target: toward badge area of winner
  const collectTo=(wi)=>{
    const targets={
      0:{sm:"translate(-40vw,35vh)",md:"translate(-35vw,30vh)",lg:"translate(-30vw,25vh)"},
      1:{sm:"translate(-40vw,-35vh)",md:"translate(-35vw,-30vh)",lg:"translate(-30vw,-25vh)"},
      2:{sm:"translate(35vw,10vh)",md:"translate(30vw,10vh)",lg:"translate(28vw,8vh)"},
    };
    return{transform:`${targets[wi][sz]} scale(0.12)`,opacity:0,transition:`all 0.5s ${EG}`};
  };

  const playAnim=pi=>pi===0?"playFromBot":pi===1?"playFromTop":"playFromRight";

  /* ═══ WELCOME ═══ */
  if(phase==="welcome")return(
    <div style={{width:"100%",minHeight:"100vh",background:C.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:12,boxSizing:"border-box"}}>
      <style>{ACSS}</style>
      <div style={{background:C.cream,borderRadius:6,padding:sz==="sm"?"20px 16px":"36px 40px",textAlign:"center",maxWidth:400,width:"100%",boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:{sm:7,md:9,lg:10}[sz],letterSpacing:4,color:C.terra,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>A Classic Trick-Taking Game</div>
        <h1 style={{fontFamily:FD,fontSize:{sm:"36px",md:"54px",lg:"68px"}[sz],color:C.dark,margin:"0 0 2px",lineHeight:1}}>3 · 4 · 5</h1>
        <div style={{width:60,height:3,background:C.terra,margin:"10px auto 14px",borderRadius:2}}/>
        <p style={{color:`${C.dark}88`,fontSize:{sm:10,md:12,lg:13}[sz],lineHeight:1.6,margin:"0 0 20px",fontWeight:500}}>Three players. Twelve tricks.<br/>One trump suit. Collect your sets<br/>— or pay the price.</p>
        <button onClick={()=>startRound(ps,dealer)} style={btnS(C.terra)}>Deal Me In</button>
      </div>
    </div>);

  /* ═══ ROUND END ═══ */
  if(phase==="roundEnd"&&results)return(
    <div style={{width:"100%",minHeight:"100vh",background:C.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:10,boxSizing:"border-box"}}>
      <div style={{background:C.cream,borderRadius:6,padding:sz==="sm"?"14px":"24px",maxWidth:480,width:"100%",color:C.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:12}}><span style={tagS(C.terra)}>Round {round}</span><h2 style={{fontFamily:FD,fontSize:{sm:18,md:22,lg:26}[sz],margin:"6px 0 0"}}>Round Complete</h2></div>
        <div style={{display:"flex",gap:{sm:4,md:6,lg:8}[sz],justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
          {results.res.map((r,i)=>(<div key={i} style={{borderRadius:4,padding:sz==="sm"?"6px 8px":"10px 14px",minWidth:{sm:80,md:100,lg:120}[sz],textAlign:"center",background:r.diff>=0?`${C.olive}10`:`${C.terra}08`,boxShadow:"2px 2px 0px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:FD,fontSize:{sm:11,md:13,lg:14}[sz]}}>{r.name}</div><div style={{...tagS(C.blue),margin:"2px 0 4px"}}>{r.role}</div>
            <div style={{fontFamily:FD,fontSize:{sm:22,md:28,lg:32}[sz],color:r.diff>=0?C.olive:C.terra}}>{r.tricks}</div>
            <div style={{fontSize:{sm:8,md:9,lg:10}[sz],color:`${C.dark}80`,fontWeight:500}}>of {r.target} needed</div>
            <div style={{marginTop:2,fontSize:{sm:9,md:10,lg:12}[sz],fontWeight:700,color:r.diff>0?C.olive:r.diff<0?C.terra:C.dark}}>{r.diff>0?`+${r.diff} extra`:r.diff<0?`${r.diff} short`:"Exact!"}</div>
          </div>))}
        </div>
        {results.transfers.length>0&&(<div style={{marginBottom:10,padding:"6px 10px",background:`${C.gold}0c`,borderRadius:4,textAlign:"center"}}><span style={tagS(C.dark)}>Transfers</span>{results.transfers.map((t2,i)=><div key={i} style={{fontSize:{sm:9,md:10,lg:12}[sz],marginTop:2,fontWeight:500}}>{t2}</div>)}</div>)}
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:10}}>{ps.map((p,i)=>(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:{sm:8,md:9,lg:10}[sz],color:`${C.dark}80`,fontWeight:600}}>{pn(i,ps)}</div><div style={{fontFamily:FD,fontSize:{sm:18,md:22,lg:24}[sz],color:C.terra}}>{p.pts}</div></div>))}</div>
        {results.bankrupt&&<div style={{textAlign:"center",padding:"6px 12px",background:C.terra,color:C.cream,borderRadius:4,marginBottom:8,fontWeight:700,fontSize:11}}>{results.bankrupt} went bankrupt!</div>}
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {!results.bankrupt&&<button onClick={continueGame} style={btnS(C.olive)}>Continue</button>}
          <button onClick={newGame} style={btnS(C.blue)}>New Game</button>
          <button onClick={()=>setPhase("gameOver")} style={btnS(C.dark)}>End Game</button>
        </div>
      </div>
    </div>);

  /* ═══ GAME OVER ═══ */
  if(phase==="gameOver"){const sorted=[...ps].sort((a,b)=>b.pts-a.pts);return(
    <div style={{width:"100%",minHeight:"100vh",background:C.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:12,boxSizing:"border-box"}}>
      <div style={{background:C.cream,borderRadius:6,padding:sz==="sm"?"18px 14px":"28px 32px",textAlign:"center",color:C.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <span style={tagS(C.terra)}>Final Standings</span>
        <h2 style={{fontFamily:FD,fontSize:{sm:22,md:28,lg:32}[sz],margin:"8px 0 14px"}}>{sorted[0].name==="You"?"You Win!":`${sorted[0].name} Wins!`}</h2>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          {sorted.map((p,i)=>(<div key={p.name} style={{borderRadius:4,padding:"8px 14px",background:i===0?`${C.gold}10`:"transparent",boxShadow:"2px 2px 0px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:9,fontWeight:700,color:i===0?C.terra:`${C.dark}60`}}>{["1st","2nd","3rd"][i]}</div>
            <div style={{fontFamily:FD,fontSize:14,margin:"2px 0"}}>{p.name}</div>
            <div style={{fontFamily:FD,fontSize:22,color:C.terra}}>{p.pts}</div>
          </div>))}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}><button onClick={newGame} style={btnS(C.terra)}>New Game</button><button onClick={()=>setPhase("welcome")} style={btnS(C.olive)}>Main Menu</button></div>
      </div>
    </div>)}

  /* ═══ TABLE ═══ */
  const valid=phase==="playing"&&curP===0?getValid(ps[0].hand,trick):[];
  const vids=new Set(valid.map(c=>c.id));
  const n=ps[0].hand.length;
  const ov=n>9?{sm:-20,md:-18,lg:-16}[sz]:n>7?{sm:-16,md:-14,lg:-12}[sz]:{sm:-12,md:-10,lg:-8}[sz];
  const margin={sm:16,md:24,lg:32}[sz];

  return(
    <div style={{width:"100%",height:"100vh",background:C.olive,position:"relative",overflow:"hidden",fontFamily:FB}}>
      <style>{ACSS}</style>
      <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 12px,${C.dark} 12px,${C.dark} 13px)`,pointerEvents:"none"}}/>

      {/* CAN'T PLAY POPUP */}
      {cantPlayPopup&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:C.dark,color:"#fff",padding:{sm:"10px 18px",md:"12px 22px",lg:"14px 28px"}[sz],borderRadius:6,fontSize:{sm:12,md:14,lg:16}[sz],fontFamily:FB,fontWeight:600,zIndex:200,boxShadow:"4px 4px 0px rgba(0,0,0,0.2)",animation:`popupIn 0.15s ${EG} both`}}>Can't play this card!</div>}

      {/* OVERLAYS */}
      {(showMenu||showHelp)&&(<div style={{position:"fixed",inset:0,background:"rgba(44,44,44,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>{setShowMenu(false);setShowHelp(false)}}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.cream,borderRadius:6,padding:sz==="sm"?"14px":"20px",maxWidth:280,width:"85%",color:C.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)",textAlign:"center"}}>
          {showHelp?(<><h3 style={{fontFamily:FD,fontSize:{sm:16,md:18,lg:20}[sz],margin:"0 0 10px"}}>How to Play</h3><div style={{fontSize:{sm:10,md:11,lg:12}[sz],lineHeight:1.8,fontWeight:500,textAlign:"left"}}>
            <p style={{margin:"0 0 5px"}}><span style={tagS(C.terra)}>Roles</span> Trump Decider: 5. Cutter: 4. Dealer: 3.</p>
            <p style={{margin:"0 0 5px"}}><span style={tagS(C.blue)}>Trump</span> Beats everything.</p>
            <p style={{margin:"0 0 5px"}}><span style={tagS(C.olive)}>Suit</span> Must follow led suit.</p>
            <p style={{margin:"0 0 5px"}}><span style={tagS(C.dark)}>Win</span> Highest trump or led suit.</p>
            <p style={{margin:"0 0 8px"}}><span style={tagS(C.terra)}>Points</span> Miss target? Pay difference.</p>
          </div><button onClick={()=>setShowHelp(false)} style={btnS(C.terra)}>Got It</button></>):(<><h3 style={{fontFamily:FD,fontSize:{sm:16,md:18,lg:20}[sz],margin:"0 0 12px"}}>Menu</h3><div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
            <button onClick={()=>setShowMenu(false)} style={{...btnS(C.olive),width:"100%",maxWidth:200}}>▶ Resume</button>
            <button onClick={()=>{setShowMenu(false);setShowHelp(true)}} style={{...btnS(C.blue),width:"100%",maxWidth:200}}>? How to Play</button>
            <button onClick={()=>{setShowMenu(false);newGame()}} style={{...btnS(C.dark),width:"100%",maxWidth:200}}>↻ New Game</button>
            <button onClick={()=>{setShowMenu(false);setPhase("gameOver")}} style={{...btnS(C.terra),width:"100%",maxWidth:200}}>✕ Quit</button>
          </div>
          <div style={{marginTop:12,borderTop:`1px solid ${C.dark}15`,paddingTop:10}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:`${C.dark}80`,marginBottom:5}}>Speed</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>{Object.entries(SPEEDS).map(([k,v])=>(<button key={k} onClick={()=>setSpeed(k)} style={{...btnS(speed===k?C.terra:`${C.dark}20`),color:speed===k?C.cream:C.dark,padding:"4px 10px",fontSize:9}}>{v.label}</button>))}</div>
          </div>
          <div style={{marginTop:10,borderTop:`1px solid ${C.dark}15`,paddingTop:10}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:`${C.dark}80`,marginBottom:5}}>Fade Unplayable Cards</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              <button onClick={()=>setFadeDisabled(true)} style={{...btnS(fadeDisabled?C.terra:`${C.dark}20`),color:fadeDisabled?C.cream:C.dark,padding:"4px 12px",fontSize:9}}>On</button>
              <button onClick={()=>setFadeDisabled(false)} style={{...btnS(!fadeDisabled?C.terra:`${C.dark}20`),color:!fadeDisabled?C.cream:C.dark,padding:"4px 12px",fontSize:9}}>Off</button>
            </div>
          </div></>)}
        </div>
      </div>)}

      {/* TOP BAR */}
      <div style={{position:"absolute",top:0,left:0,right:0,padding:{sm:"3px 6px",md:"5px 10px",lg:"6px 12px"}[sz],display:"flex",justifyContent:"space-between",alignItems:"center",background:C.dark,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:FD,color:C.cream,fontSize:{sm:12,md:14,lg:16}[sz]}}>3·4·5</span>
          <span style={{...tagS(C.olive),fontSize:{sm:8,md:10,lg:11}[sz],padding:"3px 8px"}}>Round {round}</span>
          {trickNum>0&&<span style={{...tagS(C.terra),fontSize:{sm:8,md:10,lg:11}[sz],padding:"3px 8px"}}>{trickNum}/12</span>}
        </div>
        <button onClick={()=>setShowMenu(true)} style={{background:`${C.cream}12`,border:"none",color:C.cream,padding:{sm:"3px 8px",md:"4px 12px",lg:"5px 16px"}[sz],borderRadius:3,cursor:"pointer",fontSize:{sm:10,md:12,lg:13}[sz],fontFamily:FB,fontWeight:600,display:"flex",alignItems:"center",gap:5,boxShadow:"1px 1px 0px rgba(0,0,0,0.08)"}}>
          <span style={{fontSize:{sm:13,md:16,lg:18}[sz],lineHeight:1}}>☰</span> MENU
        </button>
      </div>

      {/* TRUMP */}
      {trump&&(<div style={{position:"absolute",left:margin,top:"50%",transform:"translateY(-50%)",background:C.cream,borderRadius:6,padding:{sm:"6px 10px",md:"10px 16px",lg:"12px 20px"}[sz],textAlign:"center",zIndex:10,boxShadow:"3px 3px 0px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:{sm:6,md:8,lg:9}[sz],color:`${C.dark}70`,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>TRUMP</div>
        <div style={{fontSize:{sm:48,md:72,lg:96}[sz],color:SCOL[trump],lineHeight:1}}>{SYM[trump]}</div>
        <div style={{fontSize:{sm:9,md:12,lg:14}[sz],color:C.dark,textTransform:"capitalize",fontFamily:FD,marginTop:2}}>{trump}</div>
      </div>)}

      {/* DECK */}
      {dealAnim==="shuffle"&&(
        <div style={{position:"absolute",top:"38%",left:"50%",transform:"translate(-50%,-50%)",zIndex:20}}>
          {[0,1,2,3].map(i=>(<div key={i} style={{position:i===0?"relative":"absolute",top:i*-2,left:i*1,width:{sm:42,md:56,lg:70}[sz],height:{sm:60,md:80,lg:102}[sz],borderRadius:5,background:C.olive,border:`1px solid ${C.dark}15`,boxShadow:"2px 2px 0px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",justifyContent:"center",animation:i%2===0?`shuffleL 0.8s ${EG} ${i*0.1}s`:`shuffleR 0.8s ${EG} ${i*0.1}s`}}>{i===3&&<span style={{color:`${C.cream}25`,fontSize:16}}>✦</span>}</div>))}
        </div>
      )}

      {/* BADGES */}
      <div ref={badgeRefs[0]} style={{position:"absolute",bottom:{sm:88,md:120,lg:148}[sz],left:margin,zIndex:10}}>
        <Badge name="You" role={rname(0,dealer)} pts={ps[0].pts} tricks={visualTricks[0]} target={targetOf(0,dealer)} active={curP===0&&phase==="playing"} sz={sz} isHuman plusShow={plusAnims[0]}/>
      </div>
      <div ref={badgeRefs[1]} style={{position:"absolute",top:{sm:40,md:50,lg:56}[sz],left:margin,zIndex:10}}>
        <Badge name={ps[1].name} role={rname(1,dealer)} pts={ps[1].pts} tricks={visualTricks[1]} target={targetOf(1,dealer)} active={curP===1&&phase==="playing"} sz={sz} plusShow={plusAnims[1]}/>
      </div>
      <div ref={badgeRefs[2]} style={{position:"absolute",top:"55%",right:margin,zIndex:10}}>
        <Badge name={ps[2].name} role={rname(2,dealer)} pts={ps[2].pts} tricks={visualTricks[2]} target={targetOf(2,dealer)} active={curP===2&&phase==="playing"} sz={sz} plusShow={plusAnims[2]}/>
      </div>

      {/* OPPONENT TOP */}
      <div style={{position:"absolute",top:{sm:36,md:48,lg:52}[sz],left:"50%",transform:"translateX(-50%)",display:"flex"}}>
        {ps[1].hand.map((_,i)=>{const vis=dealtIds.has(ps[1].hand[i]?.id);return <CardC key={`t${i}`} faceDown small style={{marginLeft:i>0?{sm:-14,md:-18,lg:-20}[sz]:0,transform:`rotate(${(i-(ps[1].hand.length-1)/2)*3}deg)`,opacity:isDeal&&!vis?0:1,animation:isDeal&&vis?`dealUp 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined}}/>})}
      </div>

      {/* OPPONENT RIGHT — at edge */}
      <div style={{position:"absolute",right:{sm:6,md:10,lg:14}[sz],top:"44%",transform:"translateY(-50%)",display:"flex",flexDirection:"column"}}>
        {ps[2].hand.map((_,i)=>{const vis=dealtIds.has(ps[2].hand[i]?.id);return <CardC key={`r${i}`} faceDown small style={{marginTop:i>0?{sm:-24,md:-34,lg:-40}[sz]:0,transform:`rotate(${90+(i-(ps[2].hand.length-1)/2)*3}deg)`,opacity:isDeal&&!vis?0:1,animation:isDeal&&vis?`dealRight 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined}}/>})}
      </div>

      {/* TRICK AREA */}
      <div ref={trickAreaRef} style={{
        position:"absolute",top:{sm:"33%",md:"36%",lg:"38%"}[sz],left:"50%",
        transform:"translate(-50%,-50%)",
        width:{sm:160,md:210,lg:260}[sz],height:{sm:110,md:140,lg:170}[sz],
        ...(collectingTo!==null?collectTo(collectingTo):{}),
        transition:collecting||collectingTo!==null?`all 0.5s ${EG}`:undefined,
      }}>
        {trick.map((tc,idx)=>{
          const pos=collecting?{left:"50%",top:"50%",transform:"translate(-50%,-50%) rotate(0deg)"}:zigzag(idx);
          const isLatest=lastPlayed&&idx===trick.length-1&&lastPlayed.pi===tc.playerIndex;
          return(<div key={`tr${idx}-${lastPlayed?.key||0}`} style={{position:"absolute",...pos,transition:collecting?`all 0.4s ${EG}`:`all 0.35s ${EG}`,zIndex:5+idx,animation:isLatest&&!collecting?`${playAnim(tc.playerIndex)} 0.45s ${EG} both`:undefined}}>
            <CardC card={tc.card}/>
          </div>);
        })}
      </div>

      {/* SINGLE MSG BOX — transparent bg, shadow border */}
      {msg&&<div style={{position:"absolute",top:{sm:"55%",md:"58%",lg:"61%"}[sz],left:"50%",transform:"translateX(-50%)",zIndex:12}}>
        <div style={{background:"transparent",color:"#fff",padding:{sm:"6px 14px",md:"8px 20px",lg:"10px 28px"}[sz],borderRadius:5,fontSize:{sm:11,md:13,lg:16}[sz],fontWeight:700,fontFamily:FB,textTransform:"uppercase",letterSpacing:1.2,whiteSpace:"nowrap",boxShadow:`0 0 0 2px ${C.cream}88, 3px 3px 0px rgba(0,0,0,0.08)`,backdropFilter:"blur(2px)"}}>{msg}</div>
      </div>}

      {/* PLAYER HAND */}
      <div style={{position:"absolute",bottom:{sm:4,md:8,lg:12}[sz],left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"flex-end",maxWidth:"96vw"}}>
        {ps[0].hand.map((card,i)=>{
          const vis=dealtIds.has(card.id);
          const angle=(i-(n-1)/2)*(n>9?{sm:0.8,md:1,lg:1.2}[sz]:{sm:1.2,md:1.5,lg:1.8}[sz]);
          const yOff=Math.abs(i-(n-1)/2)*(n>9?0.3:0.7);
          const isValid=vids.has(card.id);
          const showDisabled=fadeDisabled?!isValid:false;
          return(<div key={card.id} style={{marginLeft:i>0?ov:0,transform:`rotate(${angle}deg) translateY(${yOff}px)`,transition:`all 0.35s ${EG}`,zIndex:sel?.id===card.id?30:i,opacity:isDeal&&!vis?0:1,animation:isDeal&&vis?`dealDown 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined}}>
            <CardC card={card} onClick={clickCard} disabled={curP!==0||(fadeDisabled&&!isValid)} selected={sel?.id===card.id} style={!fadeDisabled&&!isValid&&curP===0?{cursor:"pointer",opacity:1}:undefined}/>
          </div>);
        })}
      </div>

      {/* PLAY BUTTON — centered */}
      {sel&&curP===0&&phase==="playing"&&(
        <div style={{position:"absolute",bottom:{sm:110,md:145,lg:175}[sz],left:"50%",transform:"translateX(-50%)",zIndex:30}}>
          <button onClick={playSelected} style={{...btnS(C.terra),padding:{sm:"5px 14px",md:"7px 20px",lg:"8px 24px"}[sz],boxShadow:"3px 3px 0px rgba(0,0,0,0.12)"}}>PLAY CARD</button>
        </div>
      )}

      {/* TRUMP SELECT */}
      {phase==="trumpSelect"&&(
        <div style={{position:"absolute",inset:0,background:"rgba(44,44,44,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div style={{background:C.cream,borderRadius:6,padding:{sm:"12px",md:"16px",lg:"20px"}[sz],textAlign:"center",color:C.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)",maxWidth:{sm:300,md:360,lg:400}[sz],width:"94%"}}>
            <h3 style={{fontFamily:FD,fontSize:{sm:16,md:19,lg:22}[sz],margin:"0 0 4px"}}>Choose Trump</h3>
            <p style={{fontSize:{sm:9,md:10,lg:11}[sz],color:`${C.dark}66`,margin:"0 0 8px",fontWeight:500}}>Your first 5 cards — pick a trump suit</p>
            <div style={{display:"flex",justifyContent:"center",gap:{sm:2,md:3,lg:4}[sz],marginBottom:12}}>
              {ps[0].hand.map(card=><CardC key={card.id} card={card} small/>)}
            </div>
            <div style={{display:"flex",gap:{sm:5,md:6,lg:8}[sz],justifyContent:"center"}}>
              {SUITS.map(suit=>{const cnt=ps[0].hand.filter(c=>c.suit===suit).length;return(
                <button key={suit} onClick={()=>chooseTrump(suit)} style={{width:{sm:54,md:64,lg:76}[sz],height:{sm:66,md:78,lg:92}[sz],borderRadius:5,background:C.cream,border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,boxShadow:"2px 2px 0px rgba(0,0,0,0.06)",transition:`all 0.2s ${EG}`}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${C.olive}15`;e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.cream;e.currentTarget.style.transform="none"}}>
                  <span style={{fontSize:{sm:20,md:26,lg:32}[sz],color:SCOL[suit]}}>{SYM[suit]}</span>
                  <span style={{fontSize:{sm:8,md:10,lg:12}[sz],color:C.dark,textTransform:"capitalize",fontFamily:FD}}>{suit}</span>
                  <span style={{fontSize:{sm:7,md:8,lg:9}[sz],color:`${C.dark}55`,fontFamily:FB,fontWeight:600}}>{cnt} card{cnt!==1?"s":""}</span>
                </button>)})}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
