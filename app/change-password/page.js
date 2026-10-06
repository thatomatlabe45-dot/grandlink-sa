"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function prepareRecovery() {
      try {
        /*
         * Supabase processes the recovery link and establishes
         * the recovery session automatically.
         *
         * We listen for PASSWORD_RECOVERY and also check
         * the current session.
         */

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            if (event === "PASSWORD_RECOVERY" && session) {
              setReady(true);
              setChecking(false);
            }
          }
        );

        /*
         * Give Supabase a moment to process the recovery URL.
         */

        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        if (!mounted) {
          subscription.unsubscribe();
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Recovery session error:",
            sessionError
          );
        }

        if (session) {
          setReady(true);
        } else {
          setError(
            "This password reset link is invalid or has expired. Please request a new password reset email."
          );
        }

        setChecking(false);

        /*
         * Keep the listener active while the page is open.
         * It is cleaned up when leaving the page.
         */

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error(
          "Password recovery error:",
          err
        );

        if (!mounted) return;

        setError(
          "We could not verify your password reset link. Please request a new one."
        );

        setChecking(false);
      }
    }

    prepareRecovery();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!ready) {
      setError(
        "Your password reset session is not ready. Please open the reset link from your email again."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must be at least 8 characters."
      );
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError(
        "Your password must contain at least one letter."
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(
        "Your password must contain at least one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Your passwords do not match."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * Verify that the recovery session still exists
       * immediately before updating the password.
       */

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError(
          "Your password reset session has expired. Please request a new reset link."
        );

        setSaving(false);
        return;
      }

      /*
       * Update the authenticated user's password.
       */

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to update your password."
        );

        setSaving(false);
        return;
      }

      /*
       * Password successfully changed.
       */

      setSuccess(
        "Your password has been updated successfully."
      );

      setPassword("");
      setConfirmPassword("");

      /*
       * Give the success message a moment to appear.
       */

      setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        "Something went wrong while updating your password. Please try again."
      );

      setSaving(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow}></div>

      <div style={styles.container}>
        {/* ==================================================
            BRAND
        ================================================== */}

        <div style={styles.brand}>
          <div style={styles.logo}>
            G
          </div>

          <div style={styles.brandText}>
            Grad
            <span>Link</span>{" "}
            <small>SA</small>
          </div>
        </div>

        {/* ==================================================
            CARD
        ================================================== */}

        <div style={styles.card}>
          <div style={styles.icon}>
            🔐
          </div>

          <h1 style={styles.title}>
            Reset your password
          </h1>

          <p style={styles.subtitle}>
            Create a new secure password for
            your GradLink SA account.
          </p>

          {/* ==================================================
              CHECKING
          ================================================== */}

          {checking ? (
            <div style={styles.statusBox}>
              <div style={styles.spinner}></div>

              <div>
                <strong>
                  Verifying reset link
                </strong>

                <p>
                  Please wait while we securely
                  verify your password reset
                  session.
                </p>
              </div>
            </div>
          ) : !ready ? (
            <div>
              <div style={styles.errorBox}>
                <div style={styles.errorIcon}>
                  !
                </div>

                <div>
                  <strong>
                    Reset link unavailable
                  </strong>

                  <p>
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.replace("/login")
                }
                style={styles.primaryButton}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ==================================================
                  ERROR
              ================================================== */}

              {error && (
                <div style={styles.errorBox}>
                  <div style={styles.errorIcon}>
                    !
                  </div>

                  <div>
                    <strong>
                      Password update failed
                    </strong>

                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* ==================================================
                  SUCCESS
              ================================================== */}

              {success && (
                <div style={styles.successBox}>
                  <div style={styles.successIcon}>
                    ✓
                  </div>

                  <div>
                    <strong>
                      Password updated
                    </strong>

                    <p>{success}</p>
                  </div>
                </div>
              )}

              {/* ==================================================
                  NEW PASSWORD
              ================================================== */}

              <label style={styles.label}>
                New password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
                required
                style={styles.input}
              />

              {/* ==================================================
                  CONFIRM PASSWORD
              ================================================== */}

              <label style={styles.label}>
                Confirm new password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
                required
                style={styles.input}
              />

              {/* ==================================================
                  REQUIREMENTS
              ================================================== */}

              <div style={styles.requirements}>
                <div style={styles.requirementsTitle}>
                  Password requirements
                </div>

                <Requirement
                  valid={password.length >= 8}
                  text="At least 8 characters"
                />

                <Requirement
                  valid={/[A-Za-z]/.test(
                    password
                  )}
                  text="At least one letter"
                />

                <Requirement
                  valid={/[0-9]/.test(password)}
                  text="At least one number"
                />

                <Requirement
                  valid={
                    password.length > 0 &&
                    password ===
                      confirmPassword
                  }
                  text="Passwords match"
                />
              </div>

              {/* ==================================================
                  BUTTON
              ================================================== */}

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.primaryButton,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {saving
                  ? "Updating password..."
                  : "Update Password"}
              </button>
            </form>
          )}

          {/* ==================================================
              FOOTER LINK
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              router.replace("/login")
            }
            style={styles.backButton}
          >
            ← Back to Login
          </button>
        </div>

        <p style={styles.securityText}>
          🔒 Your password is securely managed
          by GradLink SA authentication.
        </p>
      </div>
    </main>
  );
}

// ============================================================
// REQUIREMENT
// ============================================================

function Requirement({ valid, text }) {
  return (
    <div style={styles.requirement}>
      <span
        style={{
          ...styles.requirementIcon,
          background: valid
            ? "#dcfce7"
            : "#f1f5f9",
          color: valid
            ? "#15803d"
            : "#64748b",
        }}
      >
        {valid ? "✓" : "•"}
      </span>

      <span
        style={{
          ...styles.requirementText,
          color: valid
            ? "#15803d"
            : "#64748b",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f5f9ff 0%, #eef5ff 50%, #ffffff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    top: "-250px",
    right: "-220px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(37,99,235,0.14), rgba(37,99,235,0) 70%)",
    pointerEvents: "none",
  },

  container: {
    width: "100%",
    maxWidth: "450px",
    position: "relative",
    zIndex: 1,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "22px",
  },

  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "900",
    boxShadow:
      "0 8px 22px rgba(37,99,235,0.25)",
  },

  brandText: {
    color: "#0f172a",
    fontSize: "21px",
    fontWeight: "800",
  },

  brandTextSpan: {
    color: "#2563eb",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "22px",
    padding: "30px 24px",
    boxShadow:
      "0 20px 55px rgba(15,23,42,0.10)",
    boxSizing: "border-box",
  },

  icon: {
    width: "60px",
    height: "60px",
    margin: "0 auto 17px",
    borderRadius: "17px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  title: {
    margin: 0,
    textAlign: "center",
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "850",
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin:
      "10px auto 26px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
    maxWidth: "350px",
  },

  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "13px",
    padding: "15px",
    color: "#1e3a8a",
    fontSize: "14px",
  },

  statusBox p: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  spinner: {
    width: "25px",
    height: "25px",
    minWidth: "25px",
    borderRadius: "50%",
    border: "3px solid #bfdbfe",
    borderTopColor: "#2563eb",
    animation:
      "spin 1s linear infinite",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "13px",
    marginBottom: "18px",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  errorIcon: {
    width: "22px",
    height: "22px",
    minWidth: "22px",
    borderRadius: "50%",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "13px",
    marginBottom: "18px",
    color: "#166534",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  successIcon: {
    width: "22px",
    height: "22px",
    minWidth: "22px",
    borderRadius: "50%",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "750",
  },

  input: {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    padding: "0 14px",
    marginBottom: "17px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
  },

  requirements: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "14px",
    marginBottom: "20px",
  },

  requirementsTitle: {
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px",
  },

  requirement: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },

  requirementIcon: {
    width: "19px",
    height: "19px",
    minWidth: "19px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "800",
  },

  requirementText: {
    fontSize: "12px",
  },

  primaryButton: {
    width: "100%",
    height: "51px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    boxShadow:
      "0 9px 22px rgba(37,99,235,0.22)",
  },

  backButton: {
    display: "block",
    width: "100%",
    marginTop: "19px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  securityText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    margin: "18px 0 0",
  },
};