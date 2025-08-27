"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";

type Conv = { id:string; title:string|null; isGroup:boolean };
type Msg = {
  id:string; conversationId:string; authorId:string; body:string|null; createdAt:string;
  author?: { username:string };
};

export default function Page(){
  const [convs,setConvs]=useState<Conv[]>([]);
  const [active,setActive]=useState<string|undefined>();
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [newDm,setNewDm]=useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const socket = useMemo(()=> io(process.env.NEXT_PUBLIC_WS_URL!, { withCredentials:true }), []);
  useEffect(()=>()=>{ socket.close(); },[socket]);

  useEffect(()=>{ 
    function onNew(m:Msg){
      if(m.conversationId===active){
        setMsgs((old)=> (old.some(x=>x.id===m.id) ? old : [m, ...old]));
      }
    }
    socket.on("message:new", onNew);
    return () => { socket.off("message:new", onNew); };
  },[socket, active]);

  useEffect(()=>{ if(active){ socket.emit("conv:join", active); } },[socket, active]);

  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, { credentials:"include" });
      if(r.ok){ setConvs(await r.json()); }
      else if(r.status===401){ window.location.href="/login"; }
    }catch{ alert("Cannot reach API"); }
  })(); },[]);

  useEffect(()=>{ if(!active) return; (async()=>{
    try{
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${active}/messages`, { credentials:"include" });
      if(r.ok){ setMsgs(await r.json()); }
    }catch{}
  })(); },[active]);

  async function send(){
    if(!active || !inputRef.current) return;
    const body = inputRef.current.value.trim(); if(!body) return;
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${active}/messages`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ body })
    });
    if(r.ok){
      const m: Msg = await r.json();
      setMsgs((old)=> (old.some(x=>x.id===m.id) ? old : [m, ...old]));
      inputRef.current.value="";
      inputRef.current.focus();
    }
  }

  async function startDm(){
    const username = newDm.trim();
    if(!username) return;
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/dm`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ username })
    });
    if(r.ok){
      const conv = await r.json();
      setConvs((old)=> old.find(c=>c.id===conv.id) ? old : [conv, ...old]);
      setActive(conv.id);
      setMsgs([]);
      socket.emit("conv:join", conv.id);
      setNewDm("");
    } else if(r.status===404){
      alert("User not found");
    } else if(r.status===401){
      window.location.href="/login";
    }
  }

  useEffect(()=>{
    function onConv(conv: Conv){
      setConvs(old => old.find(c=>c.id===conv.id) ? old : [conv, ...old]);
    }
    socket.on("conversation:new", onConv);
    return () => { socket.off("conversation:new", onConv); };
  },[socket]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      send();
    }
  }

  async function logout(){
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, { method:"POST", credentials:"include" });
    window.location.href="/login";
  }

  return (
    <div className="grid grid-cols-12 h-[calc(100vh-140px)] gap-4">
      <aside className="col-span-3 bombay-surface rounded-2xl p-3 overflow-y-auto">
        <div className="flex gap-2 mb-3">
          <input value={newDm} onChange={e=>setNewDm(e.target.value)} placeholder="Start DM by username" className="bombay-input flex-1 p-2 rounded"/>
          <button onClick={startDm} className="bombay-btn rounded px-3">Start</button>
        </div>
        <div className="space-y-1">
          {convs.map(c=>(
            <button key={c.id} className={`w-full p-2 text-left rounded ${active===c.id?"bg-[rgba(239,68,68,0.15)]":""}`} onClick={()=>setActive(c.id)}>
              {c.title === "Public" ? "🌐 Public" : (c.title || "Direct chat")}
            </button>
          ))}
        </div>
        <div className="mt-4 space-x-3">
          <a href="/settings" className="underline">Settings</a>
          <button onClick={logout} className="underline">Logout</button>
        </div>
      </aside>

      <main className="col-span-9 bombay-surface rounded-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto flex flex-col-reverse p-4">
          {msgs.map(m=>(
            <div key={m.id} className="mb-3">
              <div className="text-xs text-[var(--bombay-red)]">{m.author?.username ?? m.authorId}</div>
              <div className="p-2 rounded bg-[rgba(0,0,0,0.5)] border border-[rgba(239,68,68,0.3)]">{m.body}</div>
            </div>
          ))}
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); send();}} className="p-3 border-t border-[rgba(239,68,68,0.3)] flex gap-2">
          <input ref={inputRef} onKeyDown={onKeyDown} className="bombay-input flex-1 p-2 rounded" placeholder="Type a message..."/>
          <button type="submit" className="bombay-btn rounded px-4">Send</button>
        </form>
      </main>
    </div>
  );
}
