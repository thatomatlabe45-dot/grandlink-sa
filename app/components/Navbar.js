"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const router = useRouter();

async function handleLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem("gradlink_profile");
  router.push("/login");
}

  useEffect(() => {
    function updateScreen() {
      const isMobile = window.innerWidth <= 768;
      setMobile(isMobile);

      if (!isMobile) {
        setMenuOpen(false);
      }
    }

    updateScreen();

    window.addEventListener("resize", updateScreen);

    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  const navLink = {
    textDecoration: "none",
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "16px",
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        boxShadow: "0 2px 15px rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#0057b8",
            fontSize: "clamp(24px,4vw,32px)",
            fontWeight: "800",
          }}
        >
          GradLink SA
        </Link>

        {!mobile ? (
          <div
            style={{
              display: "flex",
              gap: "28px",
              alignItems: "center",
            }}
          >
            <Link href="/" style={navLink}>Home</Link>
            <Link href="/jobs" style={navLink}>Internships</Link>
            <Link href="/graduate" style={navLink}>Graduates</Link>
            <Link href="/company" style={navLink}>Companies</Link>
            <Link href="/admin" style={navLink}>Admin</Link>

            <Link href="/graduate">
              <button
                style={{
                  background: "#0057b8",
                  color: "#fff",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Get Started
              </button>
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              border: "none",
              background: "none",
              fontSize: "32px",
              cursor: "pointer",
              color: "#0057b8",
            }}
          >
            ☰
          </button>
        )}
      </div>

      {mobile && menuOpen && (
        <div
          style={{
            borderTop: "1px solid #eee",
            background: "#fff",
            padding: "15px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link href="/" style={navLink}>Home</Link>
          <Link href="/jobs" style={navLink}>Internships</Link>
          <Link href="/graduate" style={navLink}>Graduates</Link>
          <Link href="/company" style={navLink}>Companies</Link>
          <Link href="/admin" style={navLink}>Admin</Link>

          <Link href="/graduate">
            <button
              style={{
                width: "100%",
                background: "#0057b8",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Get Started
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}