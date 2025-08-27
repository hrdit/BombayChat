"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Page(){
  const r = useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [err,setErr]=useState<string|undefined>();
  async function onSubmit(e:any){ e.preventDefault(); setErr(undefined);
    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email, password }), credentials:"include"
      });
      if(res.ok){ r.push("/chat"); return; }
      const data = await res.json().catch(()=>({}));
      setErr(data?.error || `Login failed (${res.status})`);
    }catch{ setErr("Network error"); }
  }
  return (<main className="p-6 max-w-sm mx-auto space-y-3">
    <h1 className="text-xl font-semibold">Login</h1>
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border p-2 rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input className="w-full border p-2 rounded" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <button className="border px-3 py-2 rounded" type="submit">Sign in</button>
    </form>
    <a href="/signup" className="underline">Create account</a>
  </main>);
}
