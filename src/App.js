import { useState, useEffect, useRef } from "react";

/* ═══ CONSTANTS — UNCHANGED ═══ */
const SUITS=["hearts","diamonds","clubs","spades"],RANKS=["6","7","8","9","10","J","Q","K","A"];
const RV={6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14};
const SYM={hearts:"♥",diamonds:"♦",clubs:"♣",spades:"♠"};
const SCOL={hearts:"#D66753",diamonds:"#D66753",clubs:"#2C2C2C",spades:"#2C2C2C"};
const TARGETS=[5,4,3],RLABEL=["Trump Decider","Cutter","Dealer"];
const P={dark:"#2C2C2C",terra:"#D66753",cream:"#F1EAD8",blue:"#4E7BAD",olive:"#7D8450",gold:"#E3B605"};
const NAMES=["Amara","Rohan","Zara","Felix","Luna","Kai","Mira","Dex","Noor","Jude","Sia","Rex","Ivy","Omar","Tessa","Nico","Priya","Arun","Lila","Hugo","Meera","Theo","Suki","Cass","Ravi","Anya","Idris","Bea","Yuki","Ezra"];
const pick2=()=>{const s=[...NAMES].sort(()=>Math.random()-0.5);return[s[0],s[1]]};
if(typeof document!=="undefined"&&!document.head.querySelector('link[href*="Abril+Fatface"]')){const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Manrope:wght@400;500;600;700&display=swap";document.head.appendChild(l)}
const FD="'Abril Fatface',Georgia,serif",FB="'Manrope','Segoe UI',sans-serif";
const SPEEDS={slow:{label:"Slow",m:2.8},normal:{label:"Normal",m:1.6},fast:{label:"Fast",m:1}};
const EG="cubic-bezier(0.25,1.0,0.5,1.0)";

// Set to true once you put SVGs in public/cards/
const USE_SVG_CARDS = true;

// Maps game rank to filename rank
const RANK_FILE={"6":"6","7":"7","8":"8","9":"9","10":"10","J":"jack","Q":"queen","K":"king","A":"ace"};
const cardFile=(card)=>`/cards/${RANK_FILE[card.rank]}_of_${card.suit}.svg`;
const BACK_FILE="/cards/back.svg";

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
const bp=w=>w<420?"sm":w<768?"md":"lg";

/* ═══ CARD COMPONENT — supports SVG images ═══ */
function CardC({card,faceDown,onClick,disabled,selected,small,style}){
  const{w:ww}=useWin();const sz=bp(ww);
  const bw=small?{sm:28,md:40,lg:48}[sz]:{sm:50,md:66,lg:82}[sz];
  const bh=small?{sm:40,md:58,lg:68}[sz]:{sm:74,md:96,lg:120}[sz];

  const PU = process.env.PUBLIC_URL || "";
  if(faceDown){
    if(USE_SVG_CARDS)return <div style={{width:bw,height:bh,borderRadius:small?3:6,flexShrink:0,boxShadow:"2px 2px 0px rgba(0,0,0,0.1)",overflow:"hidden",...(style||{})}}><img src="./cards/back.svg" alt="card" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;
    return(<div style={{width:bw,height:bh,borderRadius:small?3:6,flexShrink:0,background:P.olive,border:`1px solid ${P.dark}12`,boxShadow:"2px 2px 0px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",...(style||{})}}>{sz==="lg"&&!small&&<div style={{width:bw-10,height:bh-10,borderRadius:3,border:`1px solid ${P.cream}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:`${P.cream}30`}}>✦</div>}</div>);
  }

  if(USE_SVG_CARDS&&card){
    const src=`${PU}/cards/${card.rank}_of_${card.suit}.svg`;
    return(<div onClick={!disabled&&onClick?()=>onClick(card):undefined} style={{width:bw,height:bh,borderRadius:6,flexShrink:0,overflow:"hidden",border:selected?`2.5px solid ${P.terra}`:`1px solid ${P.dark}10`,cursor:!disabled&&onClick?"pointer":"default",opacity:disabled?0.45:1,boxShadow:selected?`3px 3px 0px ${P.terra}44`:"2px 2px 0px rgba(0,0,0,0.1)",transform:selected?"translateY(-20px)":"none",transition:`all 0.15s ${EG}`,...(style||{})}}><img src={src} alt={`${card.rank} of ${card.suit}`} style={{width:"100%",height:"100%",objectFit:"cover",pointerEvents:"none"}}/></div>);
  }

  const col=SCOL[card.suit],sym=SYM[card.suit];
  const fs1=small?{sm:7,md:9,lg:11}[sz]:{sm:11,md:14,lg:17}[sz];
  const fs2=small?{sm:7,md:9,lg:11}[sz]:{sm:12,md:15,lg:19}[sz];
  return(<div onClick={!disabled&&onClick?()=>onClick(card):undefined} style={{width:bw,height:bh,borderRadius:6,flexShrink:0,background:P.cream,border:selected?`2.5px solid ${P.terra}`:`1px solid ${P.dark}10`,cursor:!disabled&&onClick?"pointer":"default",opacity:disabled?0.45:1,boxShadow:selected?`3px 3px 0px ${P.terra}44`:"2px 2px 0px rgba(0,0,0,0.1)",transform:selected?"translateY(-20px)":"none",transition:`all 0.15s ${EG}`,position:"relative",fontFamily:FB,...(style||{})}}>
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
      <div key={i} style={{width:s,height:h,borderRadius:3,background:isF?(isX?P.gold:P.terra):(isHuman?`${P.dark}35`:`${P.cream}20`),border:isF?"none":(isHuman?`1px dashed ${P.dark}50`:`1px dashed ${P.cream}40`),display:"flex",alignItems:"center",justifyContent:"center",fontSize:isX?{sm:6,md:7,lg:9}[sz]:{sm:5,md:6,lg:7}[sz],color:isF?P.cream:"transparent",fontWeight:700,fontFamily:FB,boxShadow:isF?"1px 1px 0px rgba(0,0,0,0.06)":"none",transition:`all 0.4s ${EG}`,position:"relative"}}>
        {isF?(isX?"+":"✦"):""}
        {isX&&i===total-1&&plusShow&&<div style={{position:"absolute",top:-8,right:-8,fontSize:12,fontWeight:700,color:P.gold,fontFamily:FB,animation:`plusPop 1.5s ${EG} forwards`,pointerEvents:"none"}}>+1</div>}
      </div>)})}
  </div>);
}

function Badge({name,role,pts,tricks,target,active,sz,isHuman,plusShow}){
  const pad={sm:"5px 8px",md:"7px 12px",lg:"8px 14px"}[sz];
  return(<div style={{background:active?`${P.cream}ee`:`${P.dark}44`,borderRadius:6,padding:pad,border:active?`2px solid ${P.terra}`:`1px solid ${P.cream}10`,boxShadow:"2px 2px 0px rgba(0,0,0,0.08)",transition:"all 0.2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontFamily:FD,fontSize:{sm:13,md:16,lg:18}[sz],color:active?P.dark:P.cream}}>{name}</span><span style={{fontSize:{sm:7,md:8,lg:9}[sz],padding:"1px 5px",borderRadius:2,background:P.blue,color:P.cream,fontFamily:FB,fontWeight:700,letterSpacing:0.3,textTransform:"uppercase"}}>{role}</span></div>
    <div style={{fontFamily:FD,fontSize:{sm:22,md:28,lg:32}[sz],lineHeight:1.1,color:active?P.terra:P.gold}}>{pts} <span style={{fontSize:{sm:8,md:10,lg:12}[sz],fontFamily:FB,fontWeight:500,color:active?`${P.dark}70`:`${P.cream}70`}}>PTS</span></div>
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
  const[allDealt,setAllDealt]=useState(false); // true after all cards dealt (no gaps)
  const[rearranging,setRearranging]=useState(false);
  const[collecting,setCollecting]=useState(false);
  const[collectingTo,setCollectingTo]=useState(null);
  const[visualTricks,setVisualTricks]=useState([0,0,0]);
  const[plusAnims,setPlusAnims]=useState([false,false,false]);
  const[lastPlayed,setLastPlayed]=useState(null);
  const[fadeDisabled,setFadeDisabled]=useState(true);
  const[cantPlayPopup,setCantPlayPopup]=useState(false);
  // Fixed positions for trick cards — assigned when card enters, never changes
  const[trickPositions,setTrickPositions]=useState([]);
  const tmrs=useRef([]);const playKey=useRef(0);

  const sm=SPEEDS[speed].m;const ti=ms=>ms*sm;
  const clr=()=>{tmrs.current.forEach(t=>clearTimeout(t));tmrs.current=[]};
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);tmrs.current.push(id);return id};
  useEffect(()=>()=>clr(),[]);
  const isDeal=dealAnim!==null;
  const margin={sm:16,md:24,lg:32}[sz];

  // Vertical zigzag position generator
  const makeZigPos=(idx,sz)=>{
    const ch={sm:74,md:96,lg:120}[sz];
    const cw={sm:50,md:66,lg:82}[sz];
    const yOff=idx*(ch*0.35);
    const xDir=idx%2===0?-1:1;
    const xOff=xDir*(cw*0.18);
    const seed=idx*37+7;const rr=((seed*13)%5)-2;
    return{left:`calc(50% + ${xOff}px - ${cw/2}px)`,top:`${yOff}px`,transform:`rotate(${rr}deg)`};
  };

  const collectTo=wi=>{
    const t={0:{sm:"translate(-35vw,30vh)",md:"translate(-32vw,26vh)",lg:"translate(-28vw,22vh)"},1:{sm:"translate(-35vw,-30vh)",md:"translate(-32vw,-26vh)",lg:"translate(-28vw,-22vh)"},2:{sm:"translate(30vw,8vh)",md:"translate(28vw,8vh)",lg:"translate(26vw,6vh)"}};
    return{transform:`${t[wi][sz]} scale(0.12)`,opacity:0,transition:`all 0.6s ${EG}`};
  };
  const playAnim=pi=>pi===0?"playFromBot":pi===1?"playFromTop":"playFromRight";

  /* ═══ DEAL ═══ */
  const startRound=(players,dealerIdx)=>{
    clr();const deck=shuffle(makeDeck());const td=getTd(dealerIdx),cut=getCut(dealerIdx);
    const np=players.map(p=>({...p,hand:[],tricks:0}));const order=[td,cut,dealerIdx];let idx=0;
    for(const pi of order){np[pi].hand=deck.slice(idx,idx+5);idx+=5}
    const remaining=deck.slice(idx);
    setPs(np);setRemCards(remaining);setTrump(null);setTrick([]);setTrickNum(0);setTw(null);setSel(null);setMsg("");setCollecting(false);setCollectingTo(null);setVisualTricks([0,0,0]);setPlusAnims([false,false,false]);setRearranging(false);setLastPlayed(null);setTrickPositions([]);setAllDealt(false);
    setDealAnim("shuffle");setMsg("SHUFFLING...");setPhase("dealing");
    later(()=>{
      setDealAnim("deal1");setMsg("DEALING...");
      // Deal all 15 at once after a delay — no stagger gaps
      later(()=>{
        setAllDealt(true);
        later(()=>{
          setDealAnim(null);
          if(td===0){setMsg("CHOOSE YOUR TRUMP SUIT");setPhase("trumpSelect")}
          else{setMsg(`${np[td].name} IS CHOOSING TRUMP...`);setPhase("trumpWait");later(()=>finishDeal(np,remaining,aiTrump(np[td].hand),dealerIdx),ti(1400))}
        },ti(600));
      },ti(200));
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
    // Show all remaining at once
    later(()=>{
      setAllDealt(true);
      later(()=>{
        setRearranging(true);setMsg("REARRANGING CARDS...");
        const p3=p2.map(p=>({...p,hand:sortHand(p.hand)}));setPs(p3);
        later(()=>{
          setRearranging(false);setDealAnim(null);setTrickNum(1);setCurP(td);
          setMsg(td===0?"TRICK 1 — YOU LEAD":`TRICK 1 — ${p3[td].name} LEADS`);setPhase("playing");
          if(td!==0)later(()=>runAi(p3,[],td,suit,1,dealerIdx),ti(700));
        },ti(1000));
      },ti(400));
    },ti(300));
  };

  const chooseTrump=suit=>{if(phase!=="trumpSelect")return;setPhase("dealing");finishDeal(ps,remCards,suit,dealer)};

  /* ═══ PLAY ═══ */
  const runPlay=(card,pi,cPs,cTr,trp,tn,dealerIdx)=>{
    const np=cPs.map((p,i)=>i!==pi?p:{...p,hand:p.hand.filter(c=>c.id!==card.id)});
    const nt=[...cTr,{playerIndex:pi,card}];
    playKey.current++;
    // Assign fixed position for this card in the trick
    const newPos=makeZigPos(cTr.length,sz);
    setTrickPositions(prev=>[...prev,newPos]);
    setPs(np);setTrick(nt);setSel(null);setLastPlayed({pi,key:playKey.current});

    if(nt.length===3){
      const w=getWinner(nt,trp);np[w].tricks+=1;setPs([...np]);setTw(w);
      setMsg(w===0?"YOU WIN THE TRICK!":`${np[w].name} WINS!`);
      later(()=>{setCollecting(true);
        later(()=>{setCollectingTo(w);
          later(()=>{
            setTrick([]);setTw(null);setCollecting(false);setCollectingTo(null);setLastPlayed(null);setTrickPositions([]);
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
    if(!v.find(c=>c.id===card.id)){if(!fadeDisabled){setCantPlayPopup(true);later(()=>setCantPlayPopup(false),1200)}return}
    if(sel&&sel.id===card.id){setSel(null);return}setSel(card);
  };
  const playSelected=()=>{if(!sel||curP!==0||phase!=="playing")return;runPlay(sel,0,ps,trick,trump,trickNum,dealer)};

  /* ═══ END ROUND — UNCHANGED ═══ */
  const doEndRound=(fp,dI)=>{const res=fp.map((p,i)=>({name:pn(i,fp),tricks:p.tricks,target:targetOf(i,dI),role:rname(i,dI),diff:p.tricks-targetOf(i,dI)}));const pts=fp.map(p=>p.pts);const diffs=res.map(r=>r.diff);const transfers=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){if(diffs[i]>0&&diffs[j]<0){const a=Math.min(diffs[i],Math.abs(diffs[j]),pts[j]);if(a>0){pts[i]+=a;pts[j]-=a;diffs[i]-=a;diffs[j]+=a;transfers.push(`${pn(j,fp)} pay${j===0?"":"s"} ${a} to ${pn(i,fp)}`)}}}const up=fp.map((p,i)=>({...p,pts:pts[i]}));setPs(up);const bi=up.findIndex(p=>p.pts<=0);setResults({res,transfers,bankrupt:bi>=0?pn(bi,up):null});setPhase("roundEnd")};
  const continueGame=()=>{clr();const nd=(dealer+1)%3;setDealer(nd);setRound(r=>r+1);setResults(null);later(()=>startRound(ps,nd),250)};
  const newGame=()=>{clr();const[n1,n2]=pick2();const fp=[{name:"You",hand:[],tricks:0,pts:19,human:true},{name:n1,hand:[],tricks:0,pts:19,human:false},{name:n2,hand:[],tricks:0,pts:19,human:false}];const fd=Math.floor(Math.random()*3);setPs(fp);setDealer(fd);setRound(1);setResults(null);setTrump(null);setTrick([]);setTrickNum(0);setTw(null);setSel(null);setShowMenu(false);setShowHelp(false);setMsg("");setDealAnim(null);setAllDealt(false);setCollecting(false);setCollectingTo(null);setVisualTricks([0,0,0]);setPlusAnims([false,false,false]);setRearranging(false);setLastPlayed(null);setTrickPositions([]);later(()=>startRound(fp,fd),300)};

  const btnS=bg=>({padding:{sm:"6px 12px",md:"8px 18px",lg:"10px 24px"}[sz],fontSize:{sm:9,md:11,lg:13}[sz],fontFamily:FB,fontWeight:600,background:bg,color:P.cream,border:"none",borderRadius:4,cursor:"pointer",letterSpacing:0.8,textTransform:"uppercase",boxShadow:"2px 2px 0px rgba(0,0,0,0.1)"});
  const tagS=bg=>({display:"inline-block",padding:{sm:"2px 5px",md:"3px 7px",lg:"3px 8px"}[sz],fontSize:{sm:8,md:10,lg:11}[sz],background:bg,color:P.cream,borderRadius:2,fontFamily:FB,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"});

  const valid=phase==="playing"&&curP===0?getValid(ps[0].hand,trick):[];
  const vids=new Set(valid.map(c=>c.id));
  const n=ps[0].hand.length;
  const ov=n>9?{sm:-20,md:-18,lg:-16}[sz]:n>7?{sm:-16,md:-14,lg:-12}[sz]:{sm:-12,md:-10,lg:-8}[sz];

  // Hand transition: smooth glide when cards removed
  const handTransition=`all 0.4s ${EG}`;

  /* ═══ WELCOME ═══ */
  if(phase==="welcome")return(
    <div style={{width:"100%",minHeight:"100vh",background:P.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:12,boxSizing:"border-box"}}>
      <style>{ACSS}</style>
      <div style={{background:P.cream,borderRadius:6,padding:sz==="sm"?"20px 16px":"36px 40px",textAlign:"center",maxWidth:400,width:"100%",boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:{sm:7,md:9,lg:10}[sz],letterSpacing:4,color:P.terra,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>A Classic Trick-Taking Game</div>
        <h1 style={{fontFamily:FD,fontSize:{sm:"36px",md:"54px",lg:"68px"}[sz],color:P.dark,margin:"0 0 2px",lineHeight:1}}>3 · 4 · 5</h1>
        <div style={{width:60,height:3,background:P.terra,margin:"10px auto 14px",borderRadius:2}}/>
        <p style={{color:`${P.dark}88`,fontSize:{sm:10,md:12,lg:13}[sz],lineHeight:1.6,margin:"0 0 20px",fontWeight:500}}>Three players. Twelve tricks.<br/>One trump suit. Collect your sets<br/>— or pay the price.</p>
        <button onClick={()=>startRound(ps,dealer)} style={btnS(P.terra)}>Deal Me In</button>
      </div>
    </div>);

  /* ═══ ROUND END ═══ */
  if(phase==="roundEnd"&&results)return(
    <div style={{width:"100%",minHeight:"100vh",background:P.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:10,boxSizing:"border-box"}}>
      <div style={{background:P.cream,borderRadius:6,padding:sz==="sm"?"14px":"24px",maxWidth:480,width:"100%",color:P.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:12}}><span style={tagS(P.terra)}>Round {round}</span><h2 style={{fontFamily:FD,fontSize:{sm:18,md:22,lg:26}[sz],margin:"6px 0 0"}}>Round Complete</h2></div>
        <div style={{display:"flex",gap:{sm:4,md:6,lg:8}[sz],justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
          {results.res.map((r,i)=>(<div key={i} style={{borderRadius:4,padding:sz==="sm"?"6px 8px":"10px 14px",minWidth:{sm:80,md:100,lg:120}[sz],textAlign:"center",background:r.diff>=0?`${P.olive}10`:`${P.terra}08`,boxShadow:"2px 2px 0px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:FD,fontSize:{sm:11,md:13,lg:14}[sz]}}>{r.name}</div><div style={{...tagS(P.blue),margin:"2px 0 4px"}}>{r.role}</div>
            <div style={{fontFamily:FD,fontSize:{sm:22,md:28,lg:32}[sz],color:r.diff>=0?P.olive:P.terra}}>{r.tricks}</div>
            <div style={{fontSize:{sm:8,md:9,lg:10}[sz],color:`${P.dark}80`,fontWeight:500}}>of {r.target} needed</div>
            <div style={{marginTop:2,fontSize:{sm:9,md:10,lg:12}[sz],fontWeight:700,color:r.diff>0?P.olive:r.diff<0?P.terra:P.dark}}>{r.diff>0?`+${r.diff} extra`:r.diff<0?`${r.diff} short`:"Exact!"}</div>
          </div>))}
        </div>
        {results.transfers.length>0&&(<div style={{marginBottom:10,padding:"6px 10px",background:`${P.gold}0c`,borderRadius:4,textAlign:"center"}}><span style={tagS(P.dark)}>Transfers</span>{results.transfers.map((t2,i)=><div key={i} style={{fontSize:{sm:9,md:10,lg:12}[sz],marginTop:2,fontWeight:500}}>{t2}</div>)}</div>)}
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:10}}>{ps.map((p,i)=>(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:{sm:8,md:9,lg:10}[sz],color:`${P.dark}80`,fontWeight:600}}>{pn(i,ps)}</div><div style={{fontFamily:FD,fontSize:{sm:18,md:22,lg:24}[sz],color:P.terra}}>{p.pts}</div></div>))}</div>
        {results.bankrupt&&<div style={{textAlign:"center",padding:"6px 12px",background:P.terra,color:P.cream,borderRadius:4,marginBottom:8,fontWeight:700,fontSize:11}}>{results.bankrupt} went bankrupt!</div>}
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {!results.bankrupt&&<button onClick={continueGame} style={btnS(P.olive)}>Continue</button>}
          <button onClick={newGame} style={btnS(P.blue)}>New Game</button>
          <button onClick={()=>setPhase("gameOver")} style={btnS(P.dark)}>End Game</button>
        </div>
      </div>
    </div>);

  /* ═══ GAME OVER ═══ */
  if(phase==="gameOver"){const sorted=[...ps].sort((a,b)=>b.pts-a.pts);return(
    <div style={{width:"100%",minHeight:"100vh",background:P.olive,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,padding:12,boxSizing:"border-box"}}>
      <div style={{background:P.cream,borderRadius:6,padding:sz==="sm"?"18px 14px":"28px 32px",textAlign:"center",color:P.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)"}}>
        <span style={tagS(P.terra)}>Final Standings</span>
        <h2 style={{fontFamily:FD,fontSize:{sm:22,md:28,lg:32}[sz],margin:"8px 0 14px"}}>{sorted[0].name==="You"?"You Win!":`${sorted[0].name} Wins!`}</h2>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          {sorted.map((p,i)=>(<div key={p.name} style={{borderRadius:4,padding:"8px 14px",background:i===0?`${P.gold}10`:"transparent",boxShadow:"2px 2px 0px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:9,fontWeight:700,color:i===0?P.terra:`${P.dark}60`}}>{["1st","2nd","3rd"][i]}</div>
            <div style={{fontFamily:FD,fontSize:14,margin:"2px 0"}}>{p.name}</div>
            <div style={{fontFamily:FD,fontSize:22,color:P.terra}}>{p.pts}</div>
          </div>))}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}><button onClick={newGame} style={btnS(P.terra)}>New Game</button><button onClick={()=>setPhase("welcome")} style={btnS(P.olive)}>Main Menu</button></div>
      </div>
    </div>)}

  /* ═══ TABLE ═══ */
  return(
    <div style={{width:"100%",height:"100vh",background:P.olive,position:"relative",overflow:"hidden",fontFamily:FB}}>
      <style>{ACSS}</style>
      <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 12px,${P.dark} 12px,${P.dark} 13px)`,pointerEvents:"none"}}/>

      {cantPlayPopup&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:P.dark,color:"#fff",padding:{sm:"10px 18px",md:"12px 22px",lg:"14px 28px"}[sz],borderRadius:6,fontSize:{sm:12,md:14,lg:16}[sz],fontFamily:FB,fontWeight:600,zIndex:200,boxShadow:"4px 4px 0px rgba(0,0,0,0.2)",animation:`popupIn 0.15s ${EG} both`}}>Can't play this card!</div>}

      {(showMenu||showHelp)&&(<div style={{position:"fixed",inset:0,background:"rgba(44,44,44,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>{setShowMenu(false);setShowHelp(false)}}>
        <div onClick={e=>e.stopPropagation()} style={{background:P.cream,borderRadius:6,padding:sz==="sm"?"14px":"20px",maxWidth:500,width:"85%",color:P.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)",textAlign:"center"}}>
          {showHelp?(<><h3 style={{fontFamily:FD,fontSize:{sm:20,md:24,lg:28}[sz],margin:"0 0 20px"}}>How To Play</h3><div style={{fontSize:{sm:10,md:11,lg:13}[sz],lineHeight:1.4,fontWeight:500,textAlign:"left",display:"flex",flexDirection:"column",gap:15}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.cream),color:P.dark,minWidth:70,textAlign:"center",boxShadow:"2px 2px 0px rgba(0,0,0,0.1)"}}>SETUP</span><div style={{color:P.dark}}>Each player starts with a target number of tricks.<br/><strong>Trump Caller · 5</strong> &nbsp;|&nbsp; <strong>Cutter · 4</strong> &nbsp;|&nbsp; <strong>Dealer · 3</strong></div></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.terra),minWidth:70,textAlign:"center"}}>TRICKS</span><div style={{color:P.dark}}>Each player plays one card. The highest card wins all three—that is one "trick."</div></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.blue),minWidth:70,textAlign:"center"}}>TRUMP</span><div style={{color:P.dark}}>One suit is chosen as Trump. These cards beat any other suit, regardless of rank.</div></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.dark),minWidth:70,textAlign:"center"}}>RULES</span><div style={{color:P.dark}}>You must follow the suit that was led. If you can't, you may play a Trump to win or discard another suit.</div></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.olive),minWidth:70,textAlign:"center"}}>WINNING</span><div style={{color:P.dark}}>High card of the led suit wins, unless a Trump is played. The winner leads the next trick.</div></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{...tagS(P.gold),minWidth:70,textAlign:"center"}}>SCORING</span><div style={{color:P.dark}}><div>At the end of a round, if you missed your target, you must pay points to those who exceeded theirs.*</div><div style={{fontSize:10,color:`${P.dark}60`,marginTop:6,lineHeight:1.2}}>*Each player starts out with 19 points, to stay true to the original offline game.</div></div></div>
          </div><div style={{display:"flex",justifyContent:"center",marginTop:25}}><button onClick={()=>setShowHelp(false)} style={{...btnS(P.terra),padding:"12px 64px",fontSize:16,borderRadius:6}}>GOT IT</button></div></>):(<><h3 style={{fontFamily:FD,fontSize:{sm:16,md:18,lg:20}[sz],margin:"0 0 12px"}}>Menu</h3><div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
            <button onClick={()=>setShowMenu(false)} style={{...btnS(P.olive),width:"100%",maxWidth:200}}>▶ Resume</button>
            <button onClick={()=>{setShowMenu(false);setShowHelp(true)}} style={{...btnS(P.blue),width:"100%",maxWidth:200}}>? How to Play</button>
            <button onClick={()=>{setShowMenu(false);newGame()}} style={{...btnS(P.dark),width:"100%",maxWidth:200}}>↻ New Game</button>
            <button onClick={()=>{setShowMenu(false);setPhase("gameOver")}} style={{...btnS(P.terra),width:"100%",maxWidth:200}}>✕ Quit</button>
          </div>
          <div style={{marginTop:12,borderTop:`1px solid ${P.dark}15`,paddingTop:10}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:`${P.dark}80`,marginBottom:5}}>Speed</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>{Object.entries(SPEEDS).map(([k,v])=>(<button key={k} onClick={()=>setSpeed(k)} style={{...btnS(speed===k?P.terra:`${P.dark}20`),color:speed===k?P.cream:P.dark,padding:"4px 10px",fontSize:9}}>{v.label}</button>))}</div>
          </div>
          <div style={{marginTop:10,borderTop:`1px solid ${P.dark}15`,paddingTop:10}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:`${P.dark}80`,marginBottom:5}}>Fade Unplayable</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              <button onClick={()=>setFadeDisabled(true)} style={{...btnS(fadeDisabled?P.terra:`${P.dark}20`),color:fadeDisabled?P.cream:P.dark,padding:"4px 12px",fontSize:9}}>On</button>
              <button onClick={()=>setFadeDisabled(false)} style={{...btnS(!fadeDisabled?P.terra:`${P.dark}20`),color:!fadeDisabled?P.cream:P.dark,padding:"4px 12px",fontSize:9}}>Off</button>
            </div>
          </div></>)}
        </div>
      </div>)}

      {/* TOP BAR */}
      <div style={{position:"absolute",top:0,left:0,right:0,padding:{sm:"3px 6px",md:"5px 10px",lg:"6px 12px"}[sz],display:"flex",justifyContent:"space-between",alignItems:"center",background:P.dark,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:FD,color:P.cream,fontSize:{sm:12,md:14,lg:16}[sz]}}>3·4·5</span>
          <span style={{...tagS(P.olive)}}>Round {round}</span>
          {trickNum>0&&<span style={{...tagS(P.terra)}}>{trickNum}/12</span>}
        </div>
        <button onClick={()=>setShowMenu(true)} style={{background:`${P.cream}12`,border:"none",color:P.cream,padding:{sm:"3px 8px",md:"4px 12px",lg:"5px 16px"}[sz],borderRadius:3,cursor:"pointer",fontSize:{sm:10,md:12,lg:13}[sz],fontFamily:FB,fontWeight:600,display:"flex",alignItems:"center",gap:5,boxShadow:"1px 1px 0px rgba(0,0,0,0.08)"}}>
          <span style={{fontSize:{sm:13,md:16,lg:18}[sz],lineHeight:1}}>☰</span> MENU
        </button>
      </div>

      {/* TRUMP */}
      {trump&&(<div style={{position:"absolute",left:margin,top:"50%",transform:"translateY(-50%)",background:P.cream,borderRadius:6,padding:{sm:"6px 10px",md:"10px 16px",lg:"12px 20px"}[sz],textAlign:"center",zIndex:10,boxShadow:"3px 3px 0px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:{sm:6,md:8,lg:9}[sz],color:`${P.dark}70`,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>TRUMP</div>
        <div style={{fontSize:{sm:48,md:72,lg:96}[sz],color:SCOL[trump],lineHeight:1}}>{SYM[trump]}</div>
        <div style={{fontSize:{sm:9,md:12,lg:14}[sz],color:P.dark,textTransform:"capitalize",fontFamily:FD,marginTop:2}}>{trump}</div>
      </div>)}

      {/* DECK */}
      {dealAnim==="shuffle"&&(
        <div style={{position:"absolute",top:"38%",left:"50%",transform:"translate(-50%,-50%)",zIndex:20}}>
          {[0,1,2,3].map(i=>(
            <CardC 
              key={i} 
              faceDown 
              style={{
                position: i===0 ? "relative" : "absolute",
                top: i * -2,
                left: i * 1,
                animation: i%2===0 ? `shuffleL 0.8s ${EG} ${i*0.1}s` : `shuffleR 0.8s ${EG} ${i*0.1}s`
              }} 
            />
          ))}
        </div>
      )}

      {/* BADGES */}
      <div style={{position:"absolute",bottom:{sm:88,md:120,lg:148}[sz],left:margin,zIndex:10}}>
        <Badge name="You" role={rname(0,dealer)} pts={ps[0].pts} tricks={visualTricks[0]} target={targetOf(0,dealer)} active={curP===0&&phase==="playing"} sz={sz} isHuman plusShow={plusAnims[0]}/>
      </div>
      <div style={{position:"absolute",top:{sm:40,md:50,lg:56}[sz],left:margin,zIndex:10}}>
        <Badge name={ps[1].name} role={rname(1,dealer)} pts={ps[1].pts} tricks={visualTricks[1]} target={targetOf(1,dealer)} active={curP===1&&phase==="playing"} sz={sz} plusShow={plusAnims[1]}/>
      </div>
      <div style={{position:"absolute",top:"55%",right:margin,zIndex:10}}>
        <Badge name={ps[2].name} role={rname(2,dealer)} pts={ps[2].pts} tricks={visualTricks[2]} target={targetOf(2,dealer)} active={curP===2&&phase==="playing"} sz={sz} plusShow={plusAnims[2]}/>
      </div>

      {/* OPPONENT TOP */}
      <div style={{position:"absolute",top:{sm:36,md:48,lg:52}[sz],left:"50%",transform:"translateX(-50%)",display:"flex"}}>
        {ps[1].hand.map((_,i)=><CardC key={`t${i}`} faceDown small style={{marginLeft:i>0?{sm:-14,md:-18,lg:-20}[sz]:0,transform:`rotate(${(i-(ps[1].hand.length-1)/2)*3}deg)`,opacity:isDeal&&!allDealt?0:1,animation:isDeal&&allDealt?`dealUp 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined,transition:handTransition}}/>)}
      </div>

      {/* OPPONENT RIGHT — at edge */}
      <div style={{position:"absolute",right:{sm:4,md:8,lg:12}[sz],top:"44%",transform:"translateY(-50%)",display:"flex",flexDirection:"column"}}>
        {ps[2].hand.map((_,i)=><CardC key={`r${i}`} faceDown small style={{marginTop:i>0?{sm:-24,md:-34,lg:-40}[sz]:0,transform:`rotate(${90+(i-(ps[2].hand.length-1)/2)*3}deg)`,opacity:isDeal&&!allDealt?0:1,animation:isDeal&&allDealt?`dealRight 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined,transition:handTransition}}/>)}
      </div>

      {/* TRICK AREA — fixed positions, no snap */}
      <div style={{
        position:"absolute",top:{sm:"38%",md:"40%",lg:"42%"}[sz],left:"50%",
        transform:"translate(-50%,-50%)",
        width:{sm:120,md:160,lg:200}[sz],height:{sm:180,md:240,lg:300}[sz],
        ...(collectingTo!==null?collectTo(collectingTo):{}),
        transition:collecting||collectingTo!==null?`all 0.55s ${EG}`:undefined,
      }}>
        {trick.map((tc,idx)=>{
          const fixedPos=trickPositions[idx]||makeZigPos(idx,sz);
          const pos=collecting?{left:"50%",top:"50%",transform:"translate(-50%,-50%) rotate(0deg)"}:fixedPos;
          const isLatest=lastPlayed&&idx===trick.length-1&&lastPlayed.pi===tc.playerIndex;
          return(<div key={`tr${idx}-${lastPlayed?.key||0}`} style={{position:"absolute",...pos,transition:collecting?`all 0.4s ${EG}`:`all 0.35s ${EG}`,zIndex:5+idx,animation:isLatest&&!collecting?`${playAnim(tc.playerIndex)} 0.45s ${EG} both`:undefined}}>
            <CardC card={tc.card}/>
          </div>);
        })}
      </div>

      {/* MSG BOX */}
      {msg&&<div style={{position:"absolute",top:{sm:"58%",md:"59%",lg:"60%"}[sz],left:"50%",transform:"translateX(-50%)",zIndex:12}}>
        <div style={{background:"transparent",color:P.cream,padding:{sm:"6px 14px",md:"8px 20px",lg:"10px 28px"}[sz],borderRadius:5,fontSize:{sm:11,md:13,lg:16}[sz],fontWeight:700,fontFamily:FB,textTransform:"uppercase",letterSpacing:1.2,whiteSpace:"nowrap",boxShadow:`0 0 0 2px ${P.cream}88, 3px 3px 0px rgba(0,0,0,0.08)`,backdropFilter:"blur(2px)"}}>{msg}</div>
      </div>}

      {/* PLAYER HAND — smooth glide on removal */}
      <div style={{position:"absolute",bottom:{sm:4,md:8,lg:12}[sz],left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"flex-end",maxWidth:"96vw"}}>
        {ps[0].hand.map((card,i)=>{
          const angle=(i-(n-1)/2)*(n>9?{sm:0.8,md:1,lg:1.2}[sz]:{sm:1.2,md:1.5,lg:1.8}[sz]);
          const yOff=Math.abs(i-(n-1)/2)*(n>9?0.3:0.7);
          const isValid=vids.has(card.id);
          const showDis=fadeDisabled?!isValid:false;
          return(<div key={card.id} style={{marginLeft:i>0?ov:0,transform:`rotate(${angle}deg) translateY(${yOff}px)`,transition:handTransition,zIndex:sel?.id===card.id?30:i,opacity:isDeal&&!allDealt?0:1,animation:isDeal&&allDealt?`dealDown 0.5s ${EG} ${i*0.06}s both`:rearranging?`rearrange 0.5s ${EG} ${i*0.04}s both`:undefined}}>
            <CardC card={card} onClick={clickCard} disabled={curP!==0||(fadeDisabled&&!isValid)} selected={sel?.id===card.id} style={!fadeDisabled&&!isValid&&curP===0?{cursor:"pointer",opacity:1}:undefined}/>
          </div>);
        })}
      </div>

      {/* PLAY BUTTON */}
      {sel&&curP===0&&phase==="playing"&&(
        <div style={{position:"absolute",bottom:{sm:110,md:145,lg:175}[sz],left:"50%",transform:"translateX(-50%)",zIndex:30}}>
          <button onClick={playSelected} style={{...btnS(P.terra),padding:{sm:"5px 14px",md:"7px 20px",lg:"8px 24px"}[sz],boxShadow:"3px 3px 0px rgba(0,0,0,0.12)"}}>PLAY CARD</button>
        </div>
      )}

      {/* TRUMP SELECT */}
      {phase==="trumpSelect"&&(
        <div style={{position:"absolute",inset:0,background:"rgba(44,44,44,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div style={{background:P.cream,borderRadius:6,padding:{sm:"12px",md:"16px",lg:"20px"}[sz],textAlign:"center",color:P.dark,boxShadow:"4px 4px 0px rgba(0,0,0,0.08)",maxWidth:{sm:300,md:360,lg:400}[sz],width:"94%"}}>
            <h3 style={{fontFamily:FD,fontSize:{sm:16,md:19,lg:22}[sz],margin:"0 0 4px"}}>Choose Trump</h3>
            <p style={{fontSize:{sm:9,md:10,lg:11}[sz],color:`${P.dark}66`,margin:"0 0 8px",fontWeight:500}}>Your first 5 cards — pick a trump suit</p>
            <div style={{display:"flex",justifyContent:"center",gap:{sm:2,md:3,lg:4}[sz],marginBottom:12}}>
              {ps[0].hand.map(card=><CardC key={card.id} card={card} small/>)}
            </div>
            <div style={{display:"flex",gap:{sm:5,md:6,lg:8}[sz],justifyContent:"center"}}>
              {SUITS.map(suit=>{const cnt=ps[0].hand.filter(c=>c.suit===suit).length;return(
                <button key={suit} onClick={()=>chooseTrump(suit)} style={{width:{sm:54,md:64,lg:76}[sz],height:{sm:66,md:78,lg:92}[sz],borderRadius:5,background:P.cream,border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,boxShadow:"2px 2px 0px rgba(0,0,0,0.06)",transition:`all 0.2s ${EG}`}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${P.olive}15`;e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=P.cream;e.currentTarget.style.transform="none"}}>
                  <span style={{fontSize:{sm:20,md:26,lg:32}[sz],color:SCOL[suit]}}>{SYM[suit]}</span>
                  <span style={{fontSize:{sm:8,md:10,lg:12}[sz],color:P.dark,textTransform:"capitalize",fontFamily:FD}}>{suit}</span>
                  <span style={{fontSize:{sm:7,md:8,lg:9}[sz],color:`${P.dark}55`,fontFamily:FB,fontWeight:600}}>{cnt} card{cnt!==1?"s":""}</span>
                </button>)})}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
