"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signup(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created! Check your email to confirm.");
  }

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={{color:"#0057B8"}}>Create Account</h1>

        <form onSubmit={signup}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button style={button}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

const container = {
  minHeight:"100vh",
  background:"#f4f7fb",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
};

const card = {
  background:"white",
  padding:"35px",
  borderRadius:"16px",
  width:"350px",
  boxShadow:"0 8px 25px rgba(0,0,0,.08)"
};

const inputStyle = {
  width:"100%",
  padding:"14px",
  marginBottom:"15px",
  border:"1px solid #ccc",
  borderRadius:"10px",
};

const button = {
  width:"100%",
  padding:"14px",
  background:"#0057B8",
  color:"white",
  border:"none",
  borderRadius:"10px",
  fontWeight:"bold",
};
