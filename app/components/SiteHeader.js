"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(user);

      if (typeof window !== "undefined") {
        setProfile(
          localStorage.getItem("gradlink_profile") || ""
        );
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (!currentUser) {
          setProfile("");
        } else if (typeof window !== "undefined") {
          setProfile(
            localStorage.getItem("gradlink_profile") || ""
          );
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();

    if (typeof window !== "undefined") {
      localStorage.removeItem("gradlink_profile");
    }

    setUser(null);
    setProfile("");

    router.push("/");
  }

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">

          {/* BRAND */}
          <Link href="/" className="brand">
            <div className="brand-logo">G</div>

            <div className="brand-name">
              Grad<span>Link</span>
              <small>SA</small>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="desktop-nav">

            <Link
              href="/internships"
              className={isActive("/internships") ? "active" : ""}
            >
              Internships
            </Link>

            <Link
              href="/jobs"
              className={isActive("/jobs") ? "active" : ""}
            >
              Jobs
            </Link>

            <Link
  href="/company-solutions"
  className={isActive("/company-solutions") ? "active" : ""}
>
  For Companies
</Link>

            {user ? (
              <>
                {profile === "company" ? (
                  <Link
                    href="/company-dashboard"
                    className={
                      isActive("/company-dashboard")
                        ? "active"
                        : ""
                    }
                  >
                    Dashboard
                  </Link>
                ) : profile === "graduate" ? (
                  <Link
                    href="/graduate"
                    className={
                      isActive("/graduate")
                        ? "active"
                        : ""
                    }
                  >
                    My Profile
                  </Link>
                ) : null}

                <button
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={
                    isActive("/login")
                      ? "active login-link"
                      : "login-link"
                  }
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="signup-button"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* MOBILE NAV */}
        {menuOpen && (
          <div className="mobile-nav">

            <Link
              href="/internships"
              className={isActive("/internships") ? "mobile-active" : ""}
            >
              Internships
            </Link>

            <Link
              href="/jobs"
              className={isActive("/jobs") ? "mobile-active" : ""}
            >
              Jobs
            </Link>

            <Link
              href="/company"
              className={isActive("/company") ? "mobile-active" : ""}
            >
              For Companies
            </Link>

            {user ? (
              <>
                {profile === "company" && (
                  <Link
                    href="/company-dashboard"
                    className={
                      isActive("/company-dashboard")
                        ? "mobile-active"
                        : ""
                    }
                  >
                    Dashboard
                  </Link>
                )}

                {profile === "graduate" && (
                  <Link
                    href="/graduate"
                    className={
                      isActive("/graduate")
                        ? "mobile-active"
                        : ""
                    }
                  >
                    My Profile
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mobile-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="mobile-signup"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
        }

        .site-header-inner {
          width: 100%;
          max-width: 1200px;
          height: 72px;
          margin: 0 auto;
          padding: 0 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          box-shadow:
            0 7px 18px rgba(37, 99, 235, 0.25);
        }

        .brand-name {
          color: #0f172a;
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.5px;
        }

        .brand-name span {
          color: #2563eb;
        }

        .brand-name small {
          margin-left: 3px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .desktop-nav a {
          text-decoration: none;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 12px;
          border-radius: 9px;
          transition: all 0.2s ease;
        }

        .desktop-nav a:hover {
          color: #2563eb;
          background: #eff6ff;
        }

        .desktop-nav a.active {
          color: #2563eb;
          background: #eff6ff;
        }

        .desktop-nav .login-link {
          margin-left: 5px;
        }

        .signup-button {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          ) !important;
          padding: 11px 17px !important;
          margin-left: 4px;
          box-shadow:
            0 7px 17px rgba(37, 99, 235, 0.2);
        }

        .signup-button:hover {
          color: #fff !important;
          transform: translateY(-1px);
        }

        .logout-button {
          border: 0;
          background: transparent;
          color: #475569;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 12px;
          border-radius: 9px;
          cursor: pointer;
        }

        .logout-button:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        .menu-button {
          display: none;
          width: 43px;
          height: 43px;
          border: 1px solid #dbe5f0;
          border-radius: 11px;
          background: #fff;
          padding: 9px;
          cursor: pointer;
        }

        .menu-button span {
          display: block;
          width: 100%;
          height: 2px;
          margin: 5px 0;
          background: #1e293b;
          border-radius: 4px;
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 760px) {
          .site-header-inner {
            height: 66px;
            padding: 0 15px;
          }

          .brand-logo {
            width: 37px;
            height: 37px;
            border-radius: 10px;
            font-size: 18px;
          }

          .brand-name {
            font-size: 18px;
          }

          .desktop-nav {
            display: none;
          }

          .menu-button {
            display: block;
          }

          .mobile-nav {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px 15px 15px;
            background: #fff;
            border-top: 1px solid #f1f5f9;
            box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
          }

          .mobile-nav a,
          .mobile-logout {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: #334155;
            text-decoration: none;
            text-align: left;
            font-family: inherit;
            font-size: 15px;
            font-weight: 700;
          }

          .mobile-nav a:hover,
          .mobile-nav a.mobile-active {
            background: #eff6ff;
            color: #2563eb;
          }

          .mobile-signup {
            color: #fff !important;
            background: linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            ) !important;
            text-align: center !important;
            margin-top: 5px;
          }

          .mobile-logout {
            color: #dc2626;
            background: #fef2f2;
            text-align: center;
            cursor: pointer;
            margin-top: 5px;
          }
        }
      `}</style>
    </>
  );
}
