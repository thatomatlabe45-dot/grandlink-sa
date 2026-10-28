"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  // SCREEN SIZE
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

    return () => {
      window.removeEventListener("resize", updateScreen);
    };
  }, []);

  // DETECT USER PROFILE TYPE
  async function detectProfileType(currentUser: any) {
    if (!currentUser) {
      setProfileType(null);
      setProfileChecked(true);
      return;
    }

    // Use the profile selected during login when available.
    const savedProfile =
      typeof window !== "undefined"
        ? localStorage.getItem("gradlink_profile")
        : null;

    if (savedProfile === "graduate" || savedProfile === "company") {
      setProfileType(savedProfile);
      setProfileChecked(true);
      return;
    }

    try {
      const { data: graduate } = await supabase
        .from("graduates")
        .select("id")
        .eq("user_id", currentUser.id)
        .limit(1);

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", currentUser.id)
        .limit(1);

      let detectedProfile: string | null = null;

      if (graduate && graduate.length > 0) {
        detectedProfile = "graduate";
      } else if (company && company.length > 0) {
        detectedProfile = "company";
      }

      if (detectedProfile) {
        localStorage.setItem("gradlink_profile", detectedProfile);
        setProfileType(detectedProfile);
      } else {
        setProfileType(null);
      }
    } catch (error) {
      console.error("Could not detect profile type:", error);
      setProfileType(null);
    } finally {
      setProfileChecked(true);
    }
  }

  // LOAD SESSION AND AUTH CHANGES
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setProfileChecked(true);
          return;
        }

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          await detectProfileType(currentUser);
        } else {
          setProfileType(null);
          setProfileChecked(true);
        }
      } catch (error) {
        console.error("Navbar session error:", error);

        if (mounted) {
          setProfileChecked(true);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfileType(null);
        setProfileChecked(true);
        localStorage.removeItem("gradlink_profile");
        return;
      }

      // Use the selected account type immediately when available.
      const savedProfile = localStorage.getItem("gradlink_profile");

      if (savedProfile === "graduate" || savedProfile === "company") {
        setProfileType(savedProfile);
        setProfileChecked(true);
      } else {
        setProfileChecked(false);

        // Defer database queries until after the auth callback.
        setTimeout(() => {
          if (mounted) {
            detectProfileType(currentUser);
          }
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // GET STARTED / DASHBOARD
  async function handleGetStarted() {
    if (loading) return;

    setLoading(true);
    setMenuOpen(false);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        router.push("/choose-profile");
        return;
      }

      let currentProfile = localStorage.getItem("gradlink_profile");

      if (currentProfile !== "graduate" && currentProfile !== "company") {
        await detectProfileType(session.user);
        currentProfile = localStorage.getItem("gradlink_profile");
      }

      if (currentProfile === "company") {
        router.push("/company-dashboard");
      } else if (currentProfile === "graduate") {
        router.push("/graduate");
      } else {
        router.push("/choose-profile");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  // CLOSE MOBILE MENU
  function closeMenu() {
    setMenuOpen(false);
  }

  // STYLES
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

  // GRADUATES SHOULD NOT SEE THE COMPANIES LINK.
  const showCompaniesLink =
    !user || !profileChecked || profileType === "company";

  // NAVBAR
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
        {/* LOGO */}
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

        {/* DESKTOP MENU */}
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

            {/* BOTH LABELS LEAD TO THE PROFESSIONAL INTERNSHIPS PAGE */}
            <Link href="/internships" style={navLink}>
              Internships / Jobs
            </Link>

            {showCompaniesLink && (
              <Link href="/company" style={navLink}>
                Companies
              </Link>
            )}

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
          /* MOBILE MENU BUTTON */
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

      {/* MOBILE MENU */}
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

          {/* BOTH LABELS LEAD TO THE PROFESSIONAL INTERNSHIPS PAGE */}
          <Link
            href="/internships"
            onClick={closeMenu}
            style={navLink}
          >
            Internships / Jobs
          </Link>

          {showCompaniesLink && (
            <Link
              href="/company"
              onClick={closeMenu}
              style={navLink}
            >
              Companies
            </Link>
          )}

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
            <Link
              href="/graduate"
              onClick={closeMenu}
              style={navLink}
            >
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