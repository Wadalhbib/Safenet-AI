const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title  = "SafeNet AI — ICYOUTH 2026";

const P = {
  navy:"0A0F2C", blue:"0D47A1", cyan:"00B4D8", white:"FFFFFF",
  offwt:"E8F4FD", muted:"90A4AE", danger:"EF5350", warn:"FFA726",
  safe:"66BB6A", card:"111B3C", cardlt:"172148", purple:"7C3AED",
};

const darkBg = s => { s.background = { color: P.navy }; };

const card = (s,x,y,w,h,fill) => s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,
  fill:{color:fill||P.card},line:{color:"1E3A8A",width:0.5},
  shadow:{type:"outer",blur:8,offset:3,angle:135,color:"000000",opacity:0.3}});

const abar = (s,x,y,h,c) => s.addShape(pres.shapes.RECTANGLE,{x,y,w:0.07,h,
  fill:{color:c},line:{color:c}});

const slabel = (s,t,x,y) => s.addText(t,{x,y,w:5,h:0.28,fontSize:9,bold:true,
  color:P.cyan,charSpacing:3,fontFace:"Calibri"});

const ttl = (s,t) => s.addText(t,{x:0.5,y:0.6,w:9,h:0.75,fontSize:34,bold:true,
  color:P.white,fontFace:"Calibri"});

// SLIDE 1: TITLE
{
  const s = pres.addSlide(); darkBg(s);
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.1,h:5.625,fill:{color:P.cyan},line:{color:P.cyan}});
  for(let i=0;i<6;i++) for(let j=0;j<4;j++)
    s.addShape(pres.shapes.OVAL,{x:7.2+i*0.42,y:0.35+j*0.42,w:0.07,h:0.07,
      fill:{color:P.cyan,transparency:72},line:{color:P.cyan,transparency:72}});
  s.addShape(pres.shapes.OVAL,{x:0.55,y:0.55,w:1.3,h:1.3,
    fill:{color:"0D47A1",transparency:60},line:{color:P.cyan,width:2}});
  s.addText("S",{x:0.55,y:0.5,w:1.3,h:1.4,fontSize:42,bold:true,color:P.cyan,align:"center",fontFace:"Calibri"});
  s.addText("SafeNet AI",{x:0.5,y:1.9,w:8,h:1.1,fontSize:58,bold:true,color:P.white,fontFace:"Calibri",charSpacing:-1});
  s.addText("Protecting Malaysians from Online Scams",{x:0.5,y:2.95,w:8.5,h:0.55,fontSize:21,color:P.cyan,fontFace:"Calibri"});
  s.addText("Real-time AI-powered scam detection for browsers, mobile, and families.",{x:0.5,y:3.55,w:7.5,h:0.45,fontSize:14,color:P.muted,fontFace:"Calibri"});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:5.1,w:10,h:0.525,fill:{color:P.card},line:{color:P.card}});
  s.addText("ICYOUTH 2026 Hackathon  |  Cybersecurity Track  |  Malaysia",{x:0.2,y:5.15,w:9.6,h:0.4,fontSize:11,color:P.muted,align:"center",fontFace:"Calibri"});
}

// SLIDE 2: PROBLEM
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"THE PROBLEM",0.5,0.35); ttl(s,"Malaysia's Online Scam Crisis");
  const stats=[
    {val:"RM3.18B",label:"Lost to scams in 2023",sub:"PDRM Commercial Crime Dept",color:P.danger},
    {val:"69,270",label:"Reported scam cases",sub:"2023 annual total",color:P.warn},
    {val:"74%",label:"Victims via SMS / WhatsApp",sub:"Primary attack vector",color:P.cyan},
  ];
  stats.forEach((st,i)=>{
    const x=0.4+i*3.15;
    card(s,x,1.6,2.9,2.0); abar(s,x,1.6,2.0,st.color);
    s.addText(st.val,{x:x+0.25,y:1.78,w:2.5,h:0.78,fontSize:38,bold:true,color:st.color,fontFace:"Calibri"});
    s.addText(st.label,{x:x+0.25,y:2.55,w:2.5,h:0.4,fontSize:12,color:P.white,fontFace:"Calibri"});
    s.addText(st.sub,{x:x+0.25,y:2.94,w:2.5,h:0.3,fontSize:10,color:P.muted,fontFace:"Calibri"});
  });
  card(s,0.4,3.85,9.2,1.35,"0A1628"); abar(s,0.4,3.85,1.35,P.danger);
  s.addText("The root problem: Elderly Malaysians cannot distinguish fake LHDN, KWSP, and banking portals from real ones. No existing tool is bilingual, context-aware, or alerts their family when they are in danger.",
    {x:0.65,y:3.98,w:8.85,h:1.05,fontSize:14,color:P.offwt,fontFace:"Calibri",lineSpacingMultiple:1.35});
}

// SLIDE 3: SOLUTION
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"OUR SOLUTION",0.5,0.35); ttl(s,"SafeNet AI — 4-Layer Defense");
  const layers=[
    {num:"01",title:"AI Decision Engine",desc:"Java Spring Boot + SQLite. 5-check scoring: blacklist, HTTPS, TLD, NLP (EN + BM), Levenshtein typosquatting.",color:P.cyan},
    {num:"02",title:"Browser Extension",desc:"Chrome MV3 service worker. Intercepts every URL, blocks HIGH-risk sites with a full-screen warning page.",color:P.purple},
    {num:"03",title:"React Native Mobile App",desc:"Scan URLs from WhatsApp/SMS via share extension. Bilingual UI. Scan history with severity filters.",color:P.warn},
    {num:"04",title:"Family Alert System",desc:"When elderly parent bypasses a HIGH-risk warning, Firebase sends an instant push notification to guardian's phone.",color:P.safe},
  ];
  layers.forEach((l,i)=>{
    const col=i%2,row=Math.floor(i/2),x=0.4+col*4.7,y=1.65+row*1.85;
    card(s,x,y,4.4,1.65); abar(s,x,y,1.65,l.color);
    s.addShape(pres.shapes.RECTANGLE,{x:x+0.22,y:y+0.2,w:0.55,h:0.36,fill:{color:l.color,transparency:80},line:{color:l.color}});
    s.addText(l.num,{x:x+0.22,y:y+0.17,w:0.55,h:0.4,fontSize:11,bold:true,color:l.color,align:"center",fontFace:"Calibri"});
    s.addText(l.title,{x:x+0.9,y:y+0.18,w:3.35,h:0.4,fontSize:13,bold:true,color:P.white,fontFace:"Calibri"});
    s.addText(l.desc,{x:x+0.22,y:y+0.65,w:4.05,h:0.85,fontSize:11,color:P.muted,fontFace:"Calibri",lineSpacingMultiple:1.25});
  });
}

// SLIDE 4: HOW IT WORKS
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"TECHNICAL ARCHITECTURE",0.5,0.35); ttl(s,"How SafeNet AI Scores a URL");
  const steps=[
    {n:"1",label:"URL Received",desc:"Extension/App sends URL to POST /v1/scan",color:P.cyan},
    {n:"2",label:"Blacklist Check",desc:"SQLite DB lookup: 28+ Malaysian scam domains",color:P.warn},
    {n:"3",label:"HTTPS + TLD Scan",desc:"Flags http:// and .xyz .tk .ml .click etc",color:P.purple},
    {n:"4",label:"NLP Keywords",desc:"38 urgency phrases in English + Bahasa Malaysia",color:P.cyan},
    {n:"5",label:"Typosquat Detect",desc:"Levenshtein distance vs 24 legit domains",color:P.warn},
    {n:"OK",label:"Risk Score 0-100",desc:"Returns severity + reasons in under 15ms",color:P.safe},
  ];
  steps.forEach((st,i)=>{
    const col=i<3?0:1,row=i%3,x=0.4+col*4.7,y=1.55+row*1.25;
    card(s,x,y,4.4,1.1);
    s.addShape(pres.shapes.OVAL,{x:x+0.15,y:y+0.25,w:0.58,h:0.58,fill:{color:st.color,transparency:80},line:{color:st.color}});
    s.addText(st.n,{x:x+0.15,y:y+0.22,w:0.58,h:0.62,fontSize:12,bold:true,color:st.color,align:"center",fontFace:"Calibri"});
    s.addText(st.label,{x:x+0.88,y:y+0.15,w:3.35,h:0.38,fontSize:13,bold:true,color:P.white,fontFace:"Calibri"});
    s.addText(st.desc,{x:x+0.88,y:y+0.55,w:3.35,h:0.42,fontSize:11,color:P.muted,fontFace:"Calibri"});
  });
}

// SLIDE 5: FAMILY ALERT
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"SOCIETAL IMPACT FEATURE",0.5,0.35); ttl(s,"Family Alert System");
  const flow=[
    {label:"Elderly Parent",desc:"Visits\nlhdn-refund.xyz",color:P.cyan,icon:"USER"},
    {label:"SafeNet Blocks",desc:"HIGH RISK\n95 / 100",color:P.danger,icon:"BLOCK"},
    {label:"Parent Bypasses",desc:"Clicks\n'Proceed Anyway'",color:P.warn,icon:"WARN"},
    {label:"Guardian Alerted",desc:"Firebase push\nto guardian",color:P.safe,icon:"ALERT"},
  ];
  const bw=2.0,gap=0.38,startX=(10-(flow.length*bw+(flow.length-1)*gap))/2;
  flow.forEach((f,i)=>{
    const x=startX+i*(bw+gap),y=1.6;
    card(s,x,y,bw,2.05); abar(s,x,y,2.05,f.color);
    s.addShape(pres.shapes.RECTANGLE,{x:x+0.18,y:y+0.18,w:bw-0.36,h:0.42,fill:{color:f.color,transparency:80},line:{color:f.color}});
    s.addText(f.icon,{x:x+0.18,y:y+0.15,w:bw-0.36,h:0.46,fontSize:11,bold:true,color:f.color,align:"center",fontFace:"Calibri"});
    s.addText(f.label,{x:x+0.12,y:y+0.72,w:bw-0.24,h:0.42,fontSize:12,bold:true,color:P.white,align:"center",fontFace:"Calibri"});
    s.addText(f.desc,{x:x+0.12,y:y+1.17,w:bw-0.24,h:0.72,fontSize:11,color:P.muted,align:"center",fontFace:"Calibri",lineSpacingMultiple:1.2});
    if(i<flow.length-1) s.addShape(pres.shapes.LINE,{x:x+bw+0.04,y:y+1.0,w:gap-0.08,h:0,line:{color:P.cyan,width:1.5,endArrowType:"triangle"}});
  });
  card(s,0.4,3.88,9.2,1.35,"071A0E"); abar(s,0.4,3.88,1.35,P.safe);
  s.addText("Unique in market: No other Malaysian scam detection tool notifies family members in real-time. Directly protects the 60+ demographic — Malaysia's highest-risk group — and addresses the 'Mak kena scam' crisis.",
    {x:0.62,y:3.98,w:8.85,h:1.1,fontSize:14,color:P.offwt,fontFace:"Calibri",lineSpacingMultiple:1.3});
}

// SLIDE 6: DEMO
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"LIVE DEMO",0.5,0.35); ttl(s,"Real Malaysian Scam Scenario");
  card(s,0.4,1.55,4.3,3.65,"111827");
  s.addText("WHATSAPP MESSAGE",{x:0.55,y:1.65,w:4.0,h:0.32,fontSize:10,bold:true,color:P.cyan,charSpacing:1,fontFace:"Calibri"});
  s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x:0.62,y:2.06,w:3.95,h:2.9,fill:{color:"1B4332"},line:{color:"2D6A4F"},rectRadius:0.12});
  s.addText([
    {text:"LHDN: ",options:{bold:true,color:P.warn}},
    {text:"Bayaran balik cukai anda sebanyak RM1,842 telah diluluskan.\n\n",options:{color:"D1FAE5"}},
    {text:"Sila klik untuk menuntut dalam 24 jam:\n\n",options:{color:"D1FAE5"}},
    {text:"http://lhdn-refund.xyz/claim?urgent=true",options:{color:P.cyan,bold:true}},
    {text:"\n\n[TINDAKAN SEGERA DIPERLUKAN]",options:{color:P.warn,bold:true}},
  ],{x:0.82,y:2.18,w:3.55,h:2.65,fontSize:12,fontFace:"Calibri",lineSpacingMultiple:1.3,margin:4});
  s.addShape(pres.shapes.LINE,{x:4.73,y:3.38,w:0.55,h:0,line:{color:P.cyan,width:2,endArrowType:"triangle"}});
  card(s,5.32,1.55,4.3,3.65,"100505");
  s.addText("SAFENET AI RESPONSE",{x:5.47,y:1.65,w:4.0,h:0.32,fontSize:10,bold:true,color:P.danger,charSpacing:1,fontFace:"Calibri"});
  card(s,5.46,2.06,3.97,2.9,"0D0D0D");
  const lines=[
    ["riskScore:","100",P.danger],["severity:",'"HIGH"',P.danger],
    ["domain:",'"lhdn-refund.xyz"',P.warn],["reasons:","[",P.white],
    ['  "Known scam: LHDN Clone"',"",P.muted],['  "Non-HTTPS connection"',"",P.muted],
    ['  "Suspicious TLD: .xyz"',"",P.muted],['  "Keyword: tindakan segera"',"",P.muted],
    ["]","",P.white],["scanDurationMs:","11",P.safe],
  ];
  lines.forEach(([k,v,c],i)=>s.addText(
    v?[{text:k+" ",options:{color:P.muted}},{text:v,options:{color:c,bold:true}}]:[{text:k,options:{color:c}}],
    {x:5.6,y:2.16+i*0.265,w:3.65,h:0.28,fontSize:10.5,fontFace:"Consolas"}));
}

// SLIDE 7: LOCAL CONTEXT
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"LOCAL CONTEXT & IMPACT",0.5,0.35); ttl(s,"Built for Malaysia, by Malaysians");
  const points=[
    {label:"BM",title:"Bilingual Protection",desc:"NLP scans for scam phrases in both English and Bahasa Malaysia: 'tindakan segera', 'pengeluaran KWSP', 'hadiah menang', 'sahkan sekarang'.",color:P.cyan},
    {label:"MY",title:"Malaysian Institution Focus",desc:"Trained on real scam patterns targeting LHDN, KWSP, Pos Malaysia, Maybank, CIMB, RHB, Public Bank, and government portals.",color:P.warn},
    {label:"60+",title:"Senior-First Design",desc:"Warning pages use plain language, large text, and bilingual instructions — designed for elderly users with limited digital experience.",color:P.safe},
    {label:"<15",title:"Networking-Optimised Latency",desc:"Average scan latency under 15ms. No user-perceivable slowdown — a key differentiator leveraging networking background knowledge.",color:P.purple},
  ];
  points.forEach((p,i)=>{
    const col=i%2,row=Math.floor(i/2),x=0.4+col*4.7,y=1.65+row*1.85;
    card(s,x,y,4.4,1.65); abar(s,x,y,1.65,p.color);
    s.addShape(pres.shapes.RECTANGLE,{x:x+0.22,y:y+0.22,w:0.58,h:0.38,fill:{color:p.color,transparency:80},line:{color:p.color}});
    s.addText(p.label,{x:x+0.22,y:y+0.18,w:0.58,h:0.44,fontSize:11,bold:true,color:p.color,align:"center",fontFace:"Calibri"});
    s.addText(p.title,{x:x+0.94,y:y+0.18,w:3.3,h:0.4,fontSize:13,bold:true,color:P.white,fontFace:"Calibri"});
    s.addText(p.desc,{x:x+0.22,y:y+0.67,w:4.05,h:0.85,fontSize:11,color:P.muted,fontFace:"Calibri",lineSpacingMultiple:1.2});
  });
}

// SLIDE 8: ROADMAP
{
  const s = pres.addSlide(); darkBg(s);
  slabel(s,"DEVELOPMENT ROADMAP",0.5,0.35); ttl(s,"5-Step Build Plan — All Complete");
  const steps=[
    {n:"1",title:"AI Backend",sub:"Java Spring Boot + SQLite + 5-check scoring engine",status:"COMPLETE",color:P.safe},
    {n:"2",title:"Browser Extension",sub:"Chrome MV3 service worker, blocker page, popup UI",status:"COMPLETE",color:P.safe},
    {n:"3",title:"Mobile App",sub:"React Native + share extension + scan history",status:"COMPLETE",color:P.safe},
    {n:"4",title:"Family Alert",sub:"Firebase FCM + guardian linking + bypass detection",status:"COMPLETE",color:P.safe},
    {n:"5",title:"Pitch & Demo",sub:"Malaysian examples + bilingual UI + this deck",status:"LIVE NOW",color:P.cyan},
  ];
  steps.forEach((st,i)=>{
    const y=1.6+i*0.75;
    card(s,0.4,y,9.2,0.65,i%2===0?P.card:P.cardlt);
    s.addShape(pres.shapes.OVAL,{x:0.55,y:y+0.08,w:0.5,h:0.5,fill:{color:st.color,transparency:75},line:{color:st.color}});
    s.addText(st.n,{x:0.55,y:y+0.04,w:0.5,h:0.58,fontSize:13,bold:true,color:st.color,align:"center",fontFace:"Calibri"});
    s.addText(st.title,{x:1.2,y:y+0.15,w:3.2,h:0.38,fontSize:13,bold:true,color:P.white,fontFace:"Calibri"});
    s.addText(st.sub,{x:4.5,y:y+0.15,w:3.6,h:0.38,fontSize:11,color:P.muted,fontFace:"Calibri"});
    s.addShape(pres.shapes.RECTANGLE,{x:8.35,y:y+0.14,w:1.1,h:0.36,fill:{color:st.color,transparency:80},line:{color:st.color}});
    s.addText(st.status,{x:8.35,y:y+0.11,w:1.1,h:0.42,fontSize:10,bold:true,color:st.color,align:"center",fontFace:"Calibri"});
  });
}

// SLIDE 9: CLOSING
{
  const s = pres.addSlide(); s.background={color:"020818"};
  s.addShape(pres.shapes.OVAL,{x:2.5,y:0.3,w:5,h:5,fill:{color:"0D47A1",transparency:85},line:{color:"0D47A1",transparency:90}});
  s.addShape(pres.shapes.OVAL,{x:4.0,y:0.5,w:2.0,h:2.0,fill:{color:"0D47A1",transparency:55},line:{color:P.cyan,width:2}});
  s.addText("S",{x:4.0,y:0.4,w:2.0,h:2.1,fontSize:72,bold:true,color:P.cyan,align:"center",fontFace:"Calibri"});
  s.addText("Protecting Malaysia,",{x:0.8,y:2.55,w:8.4,h:0.65,fontSize:38,bold:true,color:P.white,align:"center",fontFace:"Calibri"});
  s.addText("One Click at a Time.",{x:0.8,y:3.15,w:8.4,h:0.65,fontSize:38,bold:true,color:P.cyan,align:"center",fontFace:"Calibri"});
  s.addText("SafeNet AI  |  ICYOUTH 2026  |  Cybersecurity Track",{x:1,y:3.9,w:8,h:0.5,fontSize:14,color:P.muted,align:"center",fontFace:"Calibri"});
  const badges=["Open Source","Bilingual EN / BM","< 15ms Latency","Cross-Platform"];
  const bw=2.0,totalW=badges.length*bw+(badges.length-1)*0.28,bStart=(10-totalW)/2;
  badges.forEach((b,i)=>{
    const bx=bStart+i*(bw+0.28);
    s.addShape(pres.shapes.RECTANGLE,{x:bx,y:4.55,w:bw,h:0.42,fill:{color:P.blue,transparency:70},line:{color:P.cyan}});
    s.addText(b,{x:bx,y:4.53,w:bw,h:0.45,fontSize:11,color:P.cyan,align:"center",bold:true,fontFace:"Calibri"});
  });
  s.addText("Thank you  |  Terima Kasih",{x:1,y:5.1,w:8,h:0.4,fontSize:13,color:"444466",align:"center",fontFace:"Calibri"});
}

pres.writeFile({fileName:"safenet-ai-pitch.pptx"})
  .then(()=>console.log("Done")).catch(e=>{console.error(e);process.exit(1);});
