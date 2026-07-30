"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setMobile(window.innerWidth < 768);

      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const linkStyle = {
    textDecoration: "none",
    color: "#333",
    fontWeight: "600",
    fontSize: "16px",
  };

  return (
    <nav
      style={{
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "18px 20px",
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
            fontSize: "32px",
            fontWeight: "bold",
          }}
        >
          GradLink SA
        </Link>

        {mobile ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              fontSize: "30px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "28px",
            }}
          >
            <Link href="/" style={linkStyle}>Home</Link>
            <Link href="/jobs" style={linkStyle}>Jobs</Link>
            <Link href="/graduate" style={linkStyle}>Graduates</Link>
            <Link href="/company" style={linkStyle}>Companies</Link>
            <Link href="/admin" style={linkStyle}>Admin</Link>
          </div>
        )}
      </div>

      {mobile && menuOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "15px 20px",
            borderTop: "1px solid #eee",
            background: "#fff",
            gap: "18px",
          }}
        >
          <Link href="/" style={linkStyle}>Home</Link>
          <Link href="/jobs" style={linkStyle}>Jobs</Link>
          <Link href="/graduate" style={linkStyle}>Graduates</Link>
          <Link href="/company" style={linkStyle}>Companies</Link>
          <Link href="/admin" style={linkStyle}>Admin</Link>
        </div>
      )}
    </nav>
  );
}