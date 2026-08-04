"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export default function AuthButton() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <Link href="/login">
          <button
            style={{
              background: "#ffffff",
              color: "#0057B8",
              border: "2px solid #0057B8",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </Link>

        <Link href="/signup">
          <button
            style={{
              background: "#0057B8",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <Link href="/choose-profile">
        <button
          style={{
            background: "#0057B8",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          My Dashboard
        </button>
      </Link>

      <button
        onClick={logout}
        style={{
          background: "#ef4444",
          color: "#fff",
          border: "none",
          padding: "10px 18px",
          borderRadius: "10px",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}