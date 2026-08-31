"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [profileType, setProfileType] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ========================================
  // CHECK SCREEN SIZE
  // ========================================

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
      window.removeEventListener(
        "resize",
        updateScreen
      );
    };
  }, []);

  // ========================================
  // CHECK LOGGED-IN USER PROFILE TYPE
  // ========================================

  useEffect(() => {
    async function checkProfileType() {
      try {
        setLoadingProfile(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setProfileType(null);
          setLoadingProfile(false);
          return;
        }

        // ------------------------------------
        // CHECK COMPANY FIRST
        // ------------------------------------

        const {
          data: company,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyError) {
          console.error(
            "Navbar company check error:",
            companyError
          );
        }

        if (company) {
          setProfileType("company");

          localStorage.setItem(
            "gradlink_profile",
            "company"
          );

          setLoadingProfile(false);
          return;
        }

        // ------------------------------------
        // CHECK GRADUATE
        // ------------------------------------

        const {
          data: graduate,
          error: graduateError,
        } = await supabase
          .from("graduates")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (graduateError) {
          console.error(
            "Navbar graduate check error:",
            graduateError
          );
        }

        if (graduate) {
          setProfileType("graduate");

          localStorage.setItem(
            "gradlink_profile",
            "graduate"
          );

          setLoadingProfile(false);
          return;
        }

        // ------------------------------------
        // NO PROFILE YET
        // ------------------------------------

        setProfileType(null);
        setLoadingProfile(false);

      } catch (error) {
        console.error(
          "Navbar profile check error:",
          error
        );

        setProfileType(null);
        setLoadingProfile(false);
      }
    }

    checkProfileType();
  }, []);

  // ========================================
  // LOGOUT
  // ========================================

  async function handleLogout() {
    await supabase.auth.signOut();

    localStorage.removeItem(
      "gradlink_profile"
    );

    setMenuOpen(false);

    router.push("/login");
  }

  // ========================================
  // CLOSE MOBILE MENU
  // ========================================

  function closeMenu() {
    setMenuOpen(false);
  }

  // ========================================
  // NAVIGATION
  // ========================================

  const navLink = {
    textDecoration: "none",
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "16px",
  };

  // ========================================
  // PROFILE LINK
  // ========================================

  function ProfileLink() {
    if (loadingProfile) {
      return null;
    }

    // --------------------------------------
    // COMPANY
    // --------------------------------------

    if (profileType === "company") {
      return (
        <>
          <Link
            href="/company-dashboard"
            style={navLink}
            onClick={closeMenu}
          >
            Company Dashboard
          </Link>

          <Link
            href="/company"
            style={navLink}
            onClick={closeMenu}
          >
            Company Profile
          </Link>
        </>
      );
    }

    // --------------------------------------
    // GRADUATE
    // --------------------------------------

    if (profileType === "graduate") {
      return (
        <Link
          href="/graduate"
          style={navLink}
          onClick={closeMenu}
        >
          My Profile
        </Link>
      );
    }

    // --------------------------------------
    // NEW USER
    // --------------------------------------

    return (
      <Link
        href="/choose-profile"
        style={navLink}
        onClick={closeMenu}
      >
        Choose Profile
      </Link>
    );
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        boxShadow:
          "0 2px 15px rgba(0,0,0,.08)",
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
          onClick={closeMenu}
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
            <Link
              href="/"
              style={navLink}
            >
              Home
            </Link>

            <Link
              href="/jobs"
              style={navLink}
            >
              Internships
            </Link>

            <ProfileLink />

            <Link
              href="/admin"
              style={navLink}
            >
              Admin
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
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
          <Link
            href="/"
            style={navLink}
            onClick={closeMenu}
          >
            Home
          </Link>

          <Link
            href="/jobs"
            style={navLink}
            onClick={closeMenu}
          >
            Internships
          </Link>

          <ProfileLink />

          <Link
            href="/admin"
            style={navLink}
            onClick={closeMenu}
          >
            Admin
          </Link>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "14px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}