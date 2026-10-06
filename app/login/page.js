"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================================
  // CHECK EXISTING SUPABASE SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          await routeAuthenticatedUser(session.user);
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      }

      if (mounted) {
        setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // ROUTE AUTHENTICATED USER
  // ============================================================

  async function routeAuthenticatedUser(user) {
    try {
      const userId = user.id;
      const userEmail = (user.email || "").trim().toLowerCase();

      console.log("Authenticated user:", userId);
      console.log("Authenticated email:", userEmail);

      // ----------------------------------------------------------
      // FIRST: LOOK FOR COMPANY BY AUTH USER ID
      // ----------------------------------------------------------

      const { data: companyByUserId, error: companyUserError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

      if (companyUserError) {
        console.warn(
          "Company user_id lookup warning:",
          companyUserError.message
        );
      }

      if (companyByUserId) {
        localStorage.setItem("gradlink_profile", "company");

        console.log("Company identified by user_id");

        router.replace("/company-dashboard");
        return;
      }

      // ----------------------------------------------------------
      // SECOND: LOOK FOR COMPANY BY EMAIL
      // ----------------------------------------------------------
      //
      // This helps repair older company records that may not have
      // the correct Supabase auth user_id attached.
      //

      if (userEmail) {
        const { data: companyByEmail, error: companyEmailError } =
          await supabase
            .from("companies")
            .select("*")
            .ilike("email", userEmail)
            .limit(1)
            .maybeSingle();

        if (companyEmailError) {
          console.warn(
            "Company email lookup warning:",
            companyEmailError.message
          );
        }

        if (companyByEmail) {
          console.log("Company identified by email");

          // Try to repair the old company record.
          // If RLS prevents this update, we still continue
          // because authentication has already succeeded.
          if (!companyByEmail.user_id) {
            const { error: repairError } = await supabase
              .from("companies")
              .update({
                user_id: userId,
              })
              .eq("id", companyByEmail.id);

            if (repairError) {
              console.warn(
                "Could not repair company user_id:",
                repairError.message
              );
            }
          }

          localStorage.setItem("gradlink_profile", "company");

          router.replace("/company-dashboard");
          return;
        }
      }

      // ----------------------------------------------------------
      // THIRD: LOOK FOR GRADUATE BY AUTH USER ID
      // ----------------------------------------------------------

      const { data: graduateByUserId, error: graduateUserError } =
        await supabase
          .from("graduates")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

      if (graduateUserError) {
        console.warn(
          "Graduate user_id lookup warning:",
          graduateUserError.message
        );
      }

      if (graduateByUserId) {
        localStorage.setItem("gradlink_profile", "graduate");

        console.log("Graduate identified by user_id");

        router.replace("/graduate");
        return;
      }

      // ----------------------------------------------------------
      // FOURTH: LOOK FOR GRADUATE BY EMAIL
      // ----------------------------------------------------------

      if (userEmail) {
        const { data: graduateByEmail, error: graduateEmailError } =
          await supabase
            .from("graduates")
            .select("*")
            .ilike("email", userEmail)
            .limit(1)
            .maybeSingle();

        if (graduateEmailError) {
          console.warn(
            "Graduate email lookup warning:",
            graduateEmailError.message
          );
        }

        if (graduateByEmail) {
          console.log("Graduate identified by email");

          // Try to repair older records.
          if (!graduateByEmail.user_id) {
            const { error: repairError } = await supabase
              .from("graduates")
              .update({
                user_id: userId,
              })
              .eq("id", graduateByEmail.id);

            if (repairError) {
              console.warn(
                "Could not repair graduate user_id:",
                repairError.message
              );
            }
          }

          localStorage.setItem("gradlink_profile", "graduate");

          router.replace("/graduate");
          return;
        }
      }

      // ----------------------------------------------------------
      // NO PROFILE FOUND
      // ----------------------------------------------------------
      //
      // Authentication succeeded, but there is no matching
      // GradLink profile yet.
      //

      console.log("Authenticated user has no GradLink profile");

      localStorage.removeItem("gradlink_profile");

      router.replace("/choose-profile");
    } catch (err) {
      console.error("Profile routing error:", err);

      // IMPORTANT:
      // Do NOT tell the user their password is wrong.
      // They have already successfully authenticated.
      //
      // Send them to profile selection instead.
      localStorage.removeItem("gradlink_profile");

      router.replace("/choose-profile");
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------
      // AUTHENTICATE DIRECTLY WITH SUPABASE
      // --------------------------------------------------------

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("Supabase login error:", loginError);

        setError(loginError.message || "Unable to sign in.");
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError("Login was not completed. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Supabase login successful");

      // --------------------------------------------------------
      // DO NOT TRUST LOCAL STORAGE FOR AUTHENTICATION
      // --------------------------------------------------------
      //
      // The old phone's localStorage is irrelevant here.
      // The authenticated Supabase user is the source of truth.
      //

      await routeAuthenticatedUser(data.user);
    } catch (err) {
      console.error("Unexpected login error:", err);

      setError(
        "Something went wrong while signing in. Please check your connection and try again."
      );

      setLoading(false);
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  function handleForgotPassword() {
    setError("");
    setMessage("");

    router.push(
      `/forgot-password${
        email.trim()
          ? `?email=${encodeURIComponent(email.trim())}`
          : ""
      }`
    );
  }

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (checkingSession) {
    return (
      <main style={styles.page}>
        <div style={styles.backgroundGlowOne}></div>
        <div style={styles.backgroundGlowTwo}></div>

        <section style={styles.loadingCard}>
          <div style={styles.logoMark}>G</div>

          <h1 style={styles.loadingTitle}>GradLink SA</h1>

          <p style={styles.loadingText}>
            Checking your account...
          </p>

          <div style={styles.spinner}></div>
        </section>
      </main>
    );
  }

  // ============================================================
  // LOGIN PAGE
  // ============================================================

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowOne}></div>
      <div style={styles.backgroundGlowTwo}></div>

      <div style={styles.container}>
        {/* BRAND */}
        <div style={styles.brandSection}>
          <div style={styles.logoMark}>G</div>

          <div>
            <div style={styles.brandName}>GradLink SA</div>
            <div style={styles.brandTagline}>
              Connecting talent with opportunity
            </div>
          </div>
        </div>

        {/* LOGIN CARD */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.eyebrow}>WELCOME BACK</div>

            <h1 style={styles.title}>Sign in to GradLink SA</h1>

            <p style={styles.subtitle}>
              Access your graduate or company account.
            </p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>!</div>

              <div>
                <strong style={styles.errorTitle}>Unable to sign in</strong>

                <p style={styles.errorText}>{error}</p>
              </div>
            </div>
          )}

          {message && (
            <div style={styles.successBox}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* PASSWORD */}
            <div style={styles.field}>
              <div style={styles.passwordLabelRow}>
                <label style={styles.label}>Password</label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={styles.forgotButton}
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.loginButton,
                ...(loading ? styles.loginButtonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <span style={styles.buttonSpinner}></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* SIGN UP */}
          <div style={styles.signupSection}>
            <span style={styles.signupText}>
              Don't have an account?
            </span>

            <Link href="/signup" style={styles.signupLink}>
              Create an account
            </Link>
          </div>
        </section>

        {/* TRUST MESSAGE */}
        <div style={styles.bottomText}>
          <span style={styles.lockIcon}>🔒</span>
          Secure authentication powered by Supabase
        </div>
      </div>
    </main>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "linear-gradient(145deg, #f7fbff 0%, #eef6ff 48%, #ffffff 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "28px 18px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },

  backgroundGlowOne: {
    position: "absolute",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background: "rgba(37, 99, 235, 0.08)",
    top: "-180px",
    right: "-150px",
    pointerEvents: "none",
  },

  backgroundGlowTwo: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(14, 165, 233, 0.06)",
    bottom: "-160px",
    left: "-140px",
    pointerEvents: "none",
  },

  container: {
    width: "100%",
    maxWidth: "470px",
    position: "relative",
    zIndex: 2,
  },

  brandSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "24px",
  },

  logoMark: {
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 12px 25px rgba(37, 99, 235, 0.24)",
    flexShrink: 0,
  },

  brandName: {
    fontSize: "21px",
    fontWeight: "850",
    color: "#0f172a",
    lineHeight: "1.1",
  },

  brandTagline: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },

  card: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderRadius: "24px",
    padding: "30px 26px",
    boxShadow:
      "0 25px 70px rgba(15, 23, 42, 0.10), 0 4px 15px rgba(15, 23, 42, 0.04)",
    boxSizing: "border-box",
  },

  cardHeader: {
    marginBottom: "25px",
  },

  eyebrow: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "850",
    letterSpacing: "1.4px",
    color: "#2563eb",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
    lineHeight: "1.15",
    fontWeight: "850",
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.55",
  },

  field: {
    marginBottom: "18px",
  },

  passwordLabelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "750",
    color: "#334155",
  },

  forgotButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "750",
    cursor: "pointer",
    padding: "2px 0",
  },

  input: {
    width: "100%",
    height: "52px",
    borderRadius: "13px",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    padding: "0 15px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },

  loginButton: {
    width: "100%",
    minHeight: "53px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    boxShadow: "0 12px 25px rgba(37, 99, 235, 0.22)",
    marginTop: "6px",
  },

  loginButtonDisabled: {
    opacity: 0.72,
    cursor: "not-allowed",
  },

  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.45)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    background: "#fff5f5",
    border: "1px solid #fecaca",
    borderRadius: "13px",
    padding: "13px",
    marginBottom: "18px",
  },

  errorIcon: {
    width: "23px",
    height: "23px",
    borderRadius: "50%",
    background: "#dc2626",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "900",
    flexShrink: 0,
  },

  errorTitle: {
    display: "block",
    color: "#991b1b",
    fontSize: "13px",
    marginBottom: "2px",
  },

  errorText: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "12px",
    lineHeight: "1.45",
  },

  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "13px",
    padding: "12px 13px",
    fontSize: "13px",
    marginBottom: "18px",
  },

  signupSection: {
    marginTop: "24px",
    paddingTop: "21px",
    borderTop: "1px solid #eef2f7",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "5px",
    fontSize: "13px",
  },

  signupText: {
    color: "#64748b",
  },

  signupLink: {
    color: "#2563eb",
    fontWeight: "800",
    textDecoration: "none",
  },

  bottomText: {
    textAlign: "center",
    marginTop: "18px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  lockIcon: {
    marginRight: "5px",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "360px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "35px 25px",
    boxShadow: "0 25px 70px rgba(15, 23, 42, 0.10)",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },

  loadingTitle: {
    margin: "16px 0 5px",
    color: "#0f172a",
    fontSize: "21px",
    fontWeight: "850",
  },

  loadingText: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  spinner: {
    width: "25px",
    height: "25px",
    border: "3px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    margin: "20px auto 0",
    animation: "spin 0.8s linear infinite",
  },
};