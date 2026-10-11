"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profileType, setProfileType] = useState(null);

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

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        const savedProfile =
          typeof window !== "undefined"
            ? localStorage.getItem("gradlink_profile")
            : null;

        if (savedProfile) {
          setProfileType(savedProfile);
        } else {
          setProfileType(null);
        }
      } else {
        setProfileType(null);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfileType(null);
      } else {
        const savedProfile = localStorage.getItem("gradlink_profile");
        setProfileType(savedProfile || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleGetStarted() {
    if (loading) return;

    setLoading(true);
    setMenuOpen(false);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        router.push("/login");
        return;
      }

      if (!session?.user) {
        router.push("/choose-profile");
        return;
      }

      const savedProfile = localStorage.getItem("gradlink_profile");

      if (savedProfile === "company") {
        router.push("/company-dashboard");
      } else if (savedProfile === "graduate") {
        router.push("/graduate");
      } else {
        router.push("/choose-profile");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const navLink = {
    textDecoration: "none",
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "15px",
  };

  const buttonStyle = {
    background: "#0057b8",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: loading ? "wait" : "pointer",
    fontWeight: "700",
    fontSize: "15px",
    opacity: loading ? 0.7 : 1,
  };

  const accountLabel =
    user && profileType === "company"
      ? "Company Dashboard"
      : user && profileType === "graduate"
      ? "Graduate Dashboard"
      : "Get Started";

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
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Link
          href="/"
          onClick={closeMenu}
          style={{
            textDecoration: "none",
            color: "#0057b8",
            fontSize: "clamp(23px,4vw,30px)",
            fontWeight: "800",
            whiteSpace: "nowrap",
          }}
        >
          GradLink SA
        </Link>

        {!mobile ? (
          <div
            style={{
              display: "flex",
              gap: "22px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/" style={navLink}>
              Home
            </Link>

            <Link href="/jobs" style={navLink}>
              Internships
            </Link>

            <Link href="/graduate" style={navLink}>
              Graduates
            </Link>

            <Link href="/company" style={navLink}>
              Companies
            </Link>

            {user && profileType === "company" && (
              <Link href="/company-dashboard" style={navLink}>
                Dashboard
              </Link>
            )}

            {user && profileType === "graduate" && (
              <Link href="/graduate" style={navLink}>
                My Profile
              </Link>
            )}

            <Link href="/terms" style={navLink}>
              Terms
            </Link>

            <Link href="/privacy" style={navLink}>
              Privacy
            </Link>

            <button
              type="button"
              onClick={handleGetStarted}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Please wait..." : accountLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            style={{
              border: "none",
              background: "none",
              fontSize: "30px",
              cursor: "pointer",
              color: "#0057b8",
              padding: "4px 8px",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      {mobile && menuOpen && (
        <div
          style={{
            borderTop: "1px solid #eee",
            background: "#fff",
            padding: "18px 20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <Link href="/" onClick={closeMenu} style={navLink}>
            Home
          </Link>

          <Link href="/jobs" onClick={closeMenu} style={navLink}>
            Internships
          </Link>

          <Link href="/graduate" onClick={closeMenu} style={navLink}>
            Graduates
          </Link>

          <Link href="/company" onClick={closeMenu} style={navLink}>
            Companies
          </Link>

          {user && profileType === "company" && (
            <Link
              href="/company-dashboard"
              onClick={closeMenu}
              style={navLink}
            >
              Company Dashboard
            </Link>
          )}

          {user && profileType === "graduate" && (
            <Link href="/graduate" onClick={closeMenu} style={navLink}>
              My Profile
            </Link>
          )}

          <Link href="/terms" onClick={closeMenu} style={navLink}>
            Terms & Conditions
          </Link>

          <Link href="/privacy" onClick={closeMenu} style={navLink}>
            Privacy Policy
          </Link>

          <button
            type="button"
            onClick={handleGetStarted}
            disabled={loading}
            style={{
              ...buttonStyle,
              width: "100%",
              padding: "14px",
            }}
          >
            {loading ? "Please wait..." : accountLabel}
          </button>
        </div>
      )}
    </nav>
  );
}