"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page(){
  const r = useRouter();
  const [email,setEmail]=useState(""); const [username,setUsername]=useState(""); const [password,setPassword]=useState("");
  async function onSubmit(e:any){ e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, username, password }), credentials:"include"
    });
    if(res.ok){ r.push("/login"); } else { alert("Signup failed"); }
  }
  return (
    <main className="p-6 max-w-sm mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="w-full border p-2 rounded" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)}/>
        <input className="w-full border p-2 rounded" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <button className="border px-3 py-2 rounded" type="submit">Create</button>
      </form>
      <a href="/login" className="underline">Back to login</a>
    </main>
  );
}
