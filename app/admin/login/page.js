"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login(e) {
    e.preventDefault();
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/admin");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#0057b8" }}>GradLink SA</h1>
        <h2>Admin Login 🔐</h2>

        <form onSubmit={login}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Sign In
          </button>
        </form>

        <p>{message}</p>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginBottom: "12px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "13px",
  background: "#0057b8",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
};