"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bot, X, Send, Loader2, Minimize2, Maximize2, Sparkles, Paperclip, ImageIcon, Table2, Trash2, Plus, History, ChevronLeft } from "lucide-react";

interface Message { role: "user"|"model"; text: string; image?: string; }
interface Session { id: number; title: string; updatedAt: string; messages?: any[]; _count?: { messages: number }; }

// ── Action parser ─────────────────────────────────────────────────────────────
function execActions(text: string): { cleaned: string; priceTable: string|null; log: string[] } {
  let priceTable: string|null = null;
  const log: string[] = [];
  const ptm = text.match(/\[\[PRICE_TABLE:([\s\S]*?)\]\]/);
  if (ptm) priceTable = ptm[1].trim();
  if (text.includes("[[CLEAR_ALL]]")) { window.dispatchEvent(new CustomEvent("kaido-ai-clear",{detail:{type:"clearAll"}})); log.push("🗑️ Đã xóa danh sách"); }
  const cfr = /\[\[CLEAR_FIELD:(\w+)\]\]/g; let cf;
  while ((cf=cfr.exec(text))!==null) { window.dispatchEvent(new CustomEvent("kaido-ai-clear",{detail:{type:"clearField",field:cf[1]}})); log.push(`🧹 Xóa ${cf[1]}`); }
  const ar = /\[\[ACTION:(\w+):(?:FORMULA:([^\]]+)|([^\]]+))\]\]/g; let am;
  while ((am=ar.exec(text))!==null) { window.dispatchEvent(new CustomEvent("kaido-ai-action",{detail:{field:am[1],formula:am[2]||null,value:am[3]||null}})); log.push(`✏️ ${am[1]}=${am[2]?"công thức":am[3]}`); }
  const msr = /\[\[ACTION_MAP:(\w+):/g; let ms;
  while ((ms=msr.exec(text))!==null) {
    const after=text.slice(ms.index+ms[0].length), ci=after.indexOf("]]");
    if (ci<0) continue;
    try { const map=JSON.parse(after.slice(0,ci).trim()); window.dispatchEvent(new CustomEvent("kaido-ai-map",{detail:{field:ms[1],map}})); log.push(`📊 Điền ${ms[1]} (${Object.keys(map).length} SP)`); } catch(e){log.push(`⚠️ Parse lỗi`);}
  }
  const cleaned = text.replace(/\[\[PRICE_TABLE:[\s\S]*?\]\]/g,"").replace(/\[\[CLEAR_ALL\]\]/g,"").replace(/\[\[CLEAR_FIELD:\w+\]\]/g,"").replace(/\[\[ACTION:\w+:[^\]]*\]\]/g,"").replace(/\[\[ACTION_MAP:\w+:[\s\S]*?\]\]/g,"").trim();
  return { cleaned, priceTable, log };
}

function Bubble({ msg, onFeedback }: { msg: Message; onFeedback?: (good:boolean)=>void }) {
  const isUser = msg.role==="user";
  const [fb, setFb] = useState<"up"|"down"|null>(null);
  const render = (t: string) => t.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((p,i)=>{
    if (p.startsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    const lm=p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lm) return <a key={i} href={lm[2]} style={{color:"#10b981",textDecoration:"underline"}}>{lm[1]}</a>;
    return p;
  });
  return (
    <div style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:10,gap:6,alignItems:"flex-end"}}>
      {!isUser&&<div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={13} color="white"/></div>}
      <div style={{maxWidth:"82%",display:"flex",flexDirection:"column",gap:4,alignItems:isUser?"flex-end":"flex-start"}}>
        {msg.image&&<img src={msg.image} alt="" style={{maxWidth:160,borderRadius:8,border:"2px solid rgba(16,185,129,0.4)"}}/>}
        {msg.text&&<div style={{padding:"9px 13px",borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isUser?"linear-gradient(135deg,#10b981,#059669)":"#f1f5f9",color:isUser?"white":"#1e293b",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",boxShadow:isUser?"0 2px 8px rgba(16,185,129,0.3)":"0 1px 3px rgba(0,0,0,0.06)"}}>{render(msg.text)}</div>}
        {!isUser&&onFeedback&&(
          <div style={{display:"flex",gap:3}}>
            <button onClick={()=>{if(!fb){setFb("up");onFeedback(true);}}} style={{background:fb==="up"?"#dcfce7":"transparent",border:`1px solid ${fb==="up"?"#86efac":"#e2e8f0"}`,borderRadius:6,padding:"1px 7px",cursor:fb?"default":"pointer",fontSize:12,color:fb==="up"?"#16a34a":"#94a3b8"}}>👍{fb==="up"?" Đã lưu":""}</button>
            <button onClick={()=>{if(!fb){setFb("down");onFeedback(false);}}} style={{background:fb==="down"?"#fee2e2":"transparent",border:`1px solid ${fb==="down"?"#fca5a5":"#e2e8f0"}`,borderRadius:6,padding:"1px 7px",cursor:fb?"default":"pointer",fontSize:12,color:fb==="down"?"#dc2626":"#94a3b8"}}>👎</button>
          </div>
        )}
      </div>
    </div>
  );
}

const INIT_MSG: Message = { role:"model", text:"Xin chào! Tôi là **Kaido AI** 🤖\n\nBấm 📎 upload ảnh/PDF catalogue:\n- ✅ Tự động thêm sản phẩm vào danh sách\n- 📊 Nhớ bảng giá để hỏi nhiều lần không tốn token\n- ✍️ Điền/xóa dữ liệu hàng loạt" };

export default function AiAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [messages, setMessages] = useState<Message[]>([INIT_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{base64:string;mimeType:string;preview:string;name:string}|null>(null);
  const [priceTableCache, setPriceTableCache] = useState<{text:string;label:string}|null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number|null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);
  useEffect(()=>{ if(open&&!minimized) inputRef.current?.focus(); },[open,minimized]);
  useEffect(()=>{
    if(!open) return;
    const win=window as any;
    if(win.__kaidoCatalogueCache&&!priceTableCache) setPriceTableCache(win.__kaidoCatalogueCache);
  },[open,priceTableCache]);

  const loadSessions = useCallback(async()=>{
    setSessionsLoading(true);
    try { const r=await fetch("/api/ai-sessions"); if(r.ok) setSessions(await r.json()); } catch{}
    setSessionsLoading(false);
  },[]);

  const openHistory = ()=>{ setShowHistory(true); loadSessions(); };

  const startNewChat = ()=>{
    setCurrentSessionId(null);
    setMessages([INIT_MSG]);
    setPriceTableCache(null);
    setInput("");
    setShowHistory(false);
  };

  const restoreSession = async(s: Session)=>{
    try {
      const r=await fetch(`/api/ai-sessions/${s.id}`);
      if(!r.ok) return;
      const data=await r.json();
      const restored: Message[] = data.messages.map((m:any)=>({role:m.role as "user"|"model",text:m.text,image:m.image||undefined}));
      setMessages(restored.length>0?restored:[INIT_MSG]);
      setCurrentSessionId(s.id);
      setShowHistory(false);
    } catch{}
  };

  const deleteSession = async(e:React.MouseEvent, id:number)=>{
    e.stopPropagation();
    await fetch(`/api/ai-sessions/${id}`,{method:"DELETE"});
    setSessions(prev=>prev.filter(s=>s.id!==id));
    if(currentSessionId===id) startNewChat();
  };

  const saveMessage = async(sessionId:number, msg:Message)=>{
    try {
      await fetch(`/api/ai-sessions/${sessionId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:msg.role,text:msg.text,image:msg.image||null})});
    } catch{}
  };

  const getOrCreateSession = async(firstMsg: string): Promise<number>=>{
    if(currentSessionId) return currentSessionId;
    const title = firstMsg.length>40 ? firstMsg.slice(0,40)+"…" : firstMsg;
    const r=await fetch("/api/ai-sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})});
    const s=await r.json();
    setCurrentSessionId(s.id);
    return s.id;
  };

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{ const r=ev.target?.result as string; setPendingImage({base64:r.split(",")[1],mimeType:file.type,preview:r,name:file.name}); };
    reader.readAsDataURL(file); e.target.value="";
  };

  const send = async(text?: string)=>{
    const msg=text||input.trim(); if((!msg&&!pendingImage)||loading) return;
    const msgText=msg||"Phân tích ảnh này";
    setInput("");
    const userMsg: Message={role:"user",text:msgText,image:pendingImage?.preview};
    setMessages(prev=>[...prev,userMsg]);
    const imgPayload=pendingImage; setPendingImage(null); setLoading(true);

    try {
      const sessionId = await getOrCreateSession(msgText);
      await saveMessage(sessionId, userMsg);

      const history=messages.map(m=>({role:m.role,text:m.text}));
      const currentProducts=(window as any).__kaidoBulkProducts||[];
      const winCache=(window as any).__kaidoCatalogueCache;
      const activePT=priceTableCache||(winCache?winCache:null);
      if(!priceTableCache&&winCache) setPriceTableCache(winCache);

      const res=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msgText,history,image:imgPayload?.base64||null,imageMimeType:imgPayload?.mimeType||null,cachedPriceTable:!imgPayload&&activePT?activePT.text:null,currentProducts})});

      if(imgPayload){
        const blob=await fetch(`data:${imgPayload.mimeType};base64,${imgPayload.base64}`).then(r=>r.blob());
        const pf=new FormData(); pf.append("file",blob,imgPayload.name||"img.jpg"); pf.append("modelName",aiModel);
        fetch("/api/parse-product",{method:"POST",body:pf}).then(r=>r.json()).then(d=>{
          if(!d.error){
            const items=Array.isArray(d)?d:(Array.isArray(d.products)?d.products:[]);
            if(items.length>0) window.dispatchEvent(new CustomEvent("kaido-ai-products",{detail:{products:items}}));
            if(d.rawText){const c={text:d.rawText,label:imgPayload.name||"catalogue"};(window as any).__kaidoCatalogueCache=c;setPriceTableCache(c);}
          }
        }).catch(console.error);
      }

      const data=await res.json();
      const raw=data.reply||data.error||"Xin lỗi, có lỗi xảy ra.";
      const {cleaned,priceTable,log}=execActions(raw);
      const navM=raw.match(/\[.*?\]\((\/admin[^)]*)\)/);
      if(navM) setTimeout(()=>router.push(navM[1]),800);
      if(priceTable) setPriceTableCache({text:priceTable,label:imgPayload?.name||"bảng giá"});
      const displayText=(cleaned||(log.length>0?"":"✅ Xong!"))+(log.length>0?`\n\n**✅ Thực hiện ${log.length} thao tác:**\n`+log.join("\n"):"");
      const aiMsg: Message={role:"model",text:displayText.trim()||"✅ Xong!"};
      setMessages(prev=>[...prev,aiMsg]);
      await saveMessage(sessionId, aiMsg);
    } catch { setMessages(prev=>[...prev,{role:"model",text:"Lỗi kết nối. Vui lòng thử lại."}]); }
    finally { setLoading(false); }
  };

  const saveFeedback=async(msg:Message,userMsg:string|undefined,good:boolean)=>{
    try { await fetch("/api/ai-memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:(userMsg||"").split(" ").slice(0,4).join(" "),userInput:userMsg||"",aiResponse:msg.text,rating:good?1:-1})}); } catch{}
  };

  const SUGG=["Điền bảo hành 20 năm","Giá nhập = 70% giá bán","Xóa toàn bộ danh sách"];

  if(!open) return (
    <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:60,height:60,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#10b981,#059669)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(16,185,129,0.5)",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <Sparkles size={26} color="white"/>
    </button>
  );

  return (
    <>
      <div style={{position:"fixed",bottom:24,right:24,zIndex:1000,width:400,height:minimized?60:590,borderRadius:20,background:"white",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",overflow:"hidden",transition:"height 0.3s cubic-bezier(0.4,0,0.2,1)",border:"1px solid rgba(16,185,129,0.2)"}}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0f172a,#064e3b)",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,cursor:"pointer"}} onClick={()=>setMinimized(m=>!m)}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={16} color="white"/></div>
            <div>
              <div style={{color:"white",fontWeight:700,fontSize:13}}>Kaido AI</div>
              <div style={{color:"#6ee7b7",fontSize:10,display:"flex",alignItems:"center",gap:3}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>
                {loading?"Đang xử lý...":priceTableCache?"Nhớ bảng giá 📊":"Trực tuyến"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:3,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
            <select value={aiModel} onChange={e=>setAiModel(e.target.value)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:5,padding:"3px 5px",color:"white",fontSize:10,outline:"none",cursor:"pointer"}}>
              <option value="gemini-2.5-flash" style={{color:"#000"}}>Flash</option>
              <option value="gemini-2.5-pro" style={{color:"#000"}}>Pro</option>
            </select>
            <button onClick={startNewChat} title="Chat mới" style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:7,padding:5,cursor:"pointer",color:"white",display:"flex"}}><Plus size={13}/></button>
            <button onClick={openHistory} title="Lịch sử chat" style={{background:showHistory?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.12)",border:"none",borderRadius:7,padding:5,cursor:"pointer",color:"white",display:"flex"}}><History size={13}/></button>
            <button onClick={()=>setMinimized(m=>!m)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:7,padding:5,cursor:"pointer",color:"white",display:"flex"}}>{minimized?<Maximize2 size={13}/>:<Minimize2 size={13}/>}</button>
            <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:7,padding:5,cursor:"pointer",color:"white",display:"flex"}}><X size={13}/></button>
          </div>
        </div>

        {!minimized&&(<>
          {/* History sidebar */}
          {showHistory&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",background:"#f8fafc"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",display:"flex"}}><ChevronLeft size={16}/></button>
                <span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>Lịch sử chat</span>
                <button onClick={startNewChat} style={{marginLeft:"auto",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:8,padding:"5px 12px",color:"white",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Plus size={12}/>Mới</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"8px"}}>
                {sessionsLoading&&<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:12}}>Đang tải...</div>}
                {!sessionsLoading&&sessions.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:12}}>Chưa có lịch sử chat</div>}
                {sessions.map(s=>(
                  <div key={s.id} onClick={()=>restoreSession(s)} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:4,background:currentSessionId===s.id?"rgba(16,185,129,0.1)":"white",border:`1px solid ${currentSessionId===s.id?"rgba(16,185,129,0.3)":"#e2e8f0"}`,display:"flex",alignItems:"center",gap:8,transition:"all 0.15s"}} onMouseEnter={e=>{if(currentSessionId!==s.id)e.currentTarget.style.background="#f1f5f9"}} onMouseLeave={e=>{if(currentSessionId!==s.id)e.currentTarget.style.background="white"}}>
                    <Bot size={14} style={{flexShrink:0,color:currentSessionId===s.id?"#10b981":"#94a3b8"}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{s._count?.messages||0} tin nhắn · {new Date(s.updatedAt).toLocaleDateString("vi")}</div>
                    </div>
                    <button onClick={e=>deleteSession(e,s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:2,opacity:0.6,display:"flex",flexShrink:0}}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat view */}
          {!showHistory&&(<>
            {/* Price table cache indicator */}
            {priceTableCache&&(
              <div style={{padding:"6px 12px",background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",borderBottom:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <Table2 size={12} color="#059669"/>
                <div style={{flex:1,minWidth:0,fontSize:11,color:"#059669",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📊 Đang nhớ: {priceTableCache.label}</div>
                <button onClick={()=>setPriceTableCache(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex"}}><Trash2 size={11}/></button>
              </div>
            )}

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column"}}>
              {messages.map((m,i)=>{
                const prev=m.role==="model"?messages.slice(0,i).reverse().find(x=>x.role==="user")?.text:undefined;
                return <Bubble key={i} msg={m} onFeedback={m.role==="model"&&i>0?async(good)=>saveFeedback(m,prev,good):undefined}/>;
              })}
              {loading&&(
                <div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:10}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={13} color="white"/></div>
                  <div style={{background:"#f1f5f9",borderRadius:"16px 16px 16px 4px",padding:"10px 14px"}}><Loader2 size={14} style={{animation:"spin 1s linear infinite",color:"#10b981"}}/></div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Suggestions */}
            {messages.length<=1&&(
              <div style={{padding:"0 10px 8px",display:"flex",flexWrap:"wrap",gap:5}}>
                {SUGG.map(s=><button key={s} onClick={()=>send(s)} style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:16,padding:"4px 10px",fontSize:11,color:"#10b981",cursor:"pointer",fontWeight:500}}>{s}</button>)}
              </div>
            )}

            {/* Pending image */}
            {pendingImage&&(
              <div style={{padding:"5px 10px",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",flexShrink:0}}>
                <img src={pendingImage.preview} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:6,border:"1px solid #bbf7d0"}}/>
                <div style={{flex:1,minWidth:0,fontSize:11,color:"#059669",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pendingImage.name}</div>
                <button onClick={()=>setPendingImage(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex"}}><X size={13}/></button>
              </div>
            )}

            {/* Input */}
            <div style={{padding:"8px 10px",borderTop:"1px solid #f1f5f9",display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
              <button onClick={()=>fileRef.current?.click()} disabled={loading} style={{width:34,height:34,borderRadius:9,border:"none",background:pendingImage?"rgba(16,185,129,0.15)":"#f1f5f9",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:pendingImage?"#10b981":"#64748b"}}>
                {pendingImage?<ImageIcon size={15}/>:<Paperclip size={15}/>}
              </button>
              <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={pendingImage?"Hỏi về ảnh...":priceTableCache?"Hỏi về bảng giá...":"Nhắn gì đó..."} disabled={loading} style={{flex:1,border:"1px solid #e2e8f0",borderRadius:11,padding:"8px 12px",fontSize:13,outline:"none",background:"#f8fafc"}} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              <button onClick={()=>send()} disabled={(!input.trim()&&!pendingImage)||loading} style={{width:34,height:34,borderRadius:11,border:"none",background:(!input.trim()&&!pendingImage)||loading?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",cursor:(!input.trim()&&!pendingImage)||loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Send size={14} color={(!input.trim()&&!pendingImage)||loading?"#94a3b8":"white"}/>
              </button>
            </div>
          </>)}
        </>)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
