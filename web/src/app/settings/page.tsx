"use client";
import { useEffect, useState } from "react";

type Me = { id:string; email:string; username:string; avatarUrl:string|null; bio:string|null };

export default function Page(){
  const [me,setMe]=useState<Me|undefined>();
  const [email,setEmail]=useState(""); const [username,setUsername]=useState("");
  const [avatarUrl,setAvatarUrl]=useState(""); const [bio,setBio]=useState("");
  const [oldPassword,setOld]=useState(""); const [newPassword,setNew]=useState("");
  const [msg,setMsg]=useState<string|undefined>();
  const [bgFileName,setBgFileName]=useState<string>("");

  // apply bg from localStorage on load
  useEffect(()=>{ 
    const saved = localStorage.getItem("bgImage");
    if(saved){ document.documentElement.style.setProperty("--bg-image", `url(${saved})`); }
  },[]);

  useEffect(()=>{ (async()=>{
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { credentials:"include" });
    if(r.status===401){ window.location.href="/login"; return; }
    const d = await r.json(); setMe(d);
    setEmail(d?.email||""); setUsername(d?.username||""); setAvatarUrl(d?.avatarUrl||""); setBio(d?.bio||"");
  })(); },[]);

  async function saveProfile(){
    setMsg(undefined);
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
      method:"PATCH", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ email, username, avatarUrl: avatarUrl||null, bio: bio||null })
    });
    if(r.ok){ setMsg("Saved"); setMe(await r.json()); } else { const e=await r.json().catch(()=>({})); setMsg(e.error||`Error ${r.status}`); }
  }

  async function changePassword(){
    setMsg(undefined);
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword })
    });
    if(r.ok){ setOld(""); setNew(""); setMsg("Password updated"); } else { const e=await r.json().catch(()=>({})); setMsg(e.error||`Error ${r.status}`); }
  }

  function onPickBg(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    setBgFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem("bgImage", dataUrl);
      document.documentElement.style.setProperty("--bg-image", `url(${dataUrl})`);
      setMsg("Background updated");
    };
    reader.readAsDataURL(f);
  }
  function clearBg(){
    localStorage.removeItem("bgImage");
    document.documentElement.style.setProperty("--bg-image", "none");
    setBgFileName("");
    setMsg("Background cleared");
  }

  return (
    <main className="space-y-6">
      <section className="bombay-surface rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-semibold">Profile</h2>
        <input className="bombay-input w-full p-2 rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="bombay-input w-full p-2 rounded" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="bombay-input w-full p-2 rounded" placeholder="avatar URL" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
        <textarea className="bombay-input w-full p-2 rounded" placeholder="bio" value={bio} onChange={e=>setBio(e.target.value)} />
        <button onClick={saveProfile} className="bombay-btn rounded px-4 py-2">Save</button>
      </section>

      <section className="bombay-surface rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-semibold">Change password</h2>
        <input className="bombay-input w-full p-2 rounded" type="password" placeholder="old password" value={oldPassword} onChange={e=>setOld(e.target.value)} />
        <input className="bombay-input w-full p-2 rounded" type="password" placeholder="new password" value={newPassword} onChange={e=>setNew(e.target.value)} />
        <button onClick={changePassword} className="bombay-btn rounded px-4 py-2">Update</button>
      </section>

      <section className="bombay-surface rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-semibold">Background</h2>
        <input type="file" accept="image/*" onChange={onPickBg} className="block" />
        {bgFileName && <div className="text-sm opacity-80">Selected: {bgFileName}</div>}
        <div className="flex gap-3">
          <button onClick={clearBg} className="bombay-btn rounded px-4 py-2">Clear</button>
        </div>
      </section>

      {msg && <div className="text-sm">{msg}</div>}
    </main>
  );
}
