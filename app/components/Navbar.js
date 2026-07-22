"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Navbar() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 30px",
        background: "#0057B8",
        color: "white",
      }}
    >
      <Link
        href="/"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "24px",
        }}
      >
        GradLink SA
      </Link>

      <div style={{ display: "flex", gap: "15px" }}>
        <Link
          href="/jobs"
          style={{ color: "white", textDecoration: "none" }}
        >
          Jobs
        </Link>

        <Link
          href="/graduate"
          style={{ color: "white", textDecoration: "none" }}
        >
          Profile
        </Link>

        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#0057B8",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
