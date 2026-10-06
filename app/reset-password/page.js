"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function prepareRecovery() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (mounted) {
            setReady(true);
            setLoading(false);
          }
          return;
        }

        const { data: authListener } =
          supabase.auth.onAuthStateChange(
            async (event, sessionData) => {
              if (!mounted) return;

              if (
                event === "PASSWORD_RECOVERY" &&
                sessionData
              ) {
                setReady(true);
                setLoading(false);
              }
            }
          );

        setTimeout(async () => {
          if (!mounted) return;

          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (currentSession) {
            setReady(true);
            setLoading(false);
          } else {
            setError(
              "This password reset link is invalid or has expired. Please request a new password reset link."
            );
            setLoading(false);
          }
        }, 1200);

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.error(
          "Password recovery session error:",
          err
        );

        if (mounted) {
          setError(
            "We could not verify your password reset session. Please request a new reset link."
          );
          setLoading(false);
        }
      }
    }

    let cleanup;

    prepareRecovery().then((cleanupFunction) => {
      cleanup = cleanupFunction;
    });

    return () => {
      mounted = false;

      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  function validatePassword(value) {
    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (!/[A-Za-z]/.test(value)) {
      return "Password must contain at least one letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number.";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "Your password reset session has expired. Please request a new reset link."
        );
        setSaving(false);
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        setError(updateError.message);
        setSaving(false);
        return;
      }

      setMessage(
        "Your password has been saved successfully."
      );

      setPassword("");
      setConfirmPassword("");

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
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.glow}></div>

        <div style={styles.container}>
          <Brand />

          <div style={styles.card}>
            <div style={styles.icon}>
              🔐
            </div>

            <h1 style={styles.title}>
              Verifying reset link
            </h1>

            <p style={styles.subtitle}>
              Please wait while we securely
              verify your password reset session.
            </p>

            <div style={styles.loaderBox}>
              <div style={styles.loader}></div>
            </div>
          </div>

          <p style={styles.security}>
            🔒 Secure password recovery by
            GradLink SA.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow}></div>

      <div style={styles.container}>
        <Brand />

        <div style={styles.card}>
          <div style={styles.icon}>
            🔐
          </div>

          <h1 style={styles.title}>
            Set a new password
          </h1>

          <p style={styles.subtitle}>
            Create a new secure password for
            your GradLink SA account.
          </p>

          {error && (
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>
                !
              </div>

              <div style={styles.messageArea}>
                <strong>
                  Password reset unavailable
                </strong>

                <p style={styles.message}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>
                ✓
              </div>

              <div style={styles.messageArea}>
                <strong>
                  Password saved
                </strong>

                <p style={styles.message}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {ready && !message && (
            <form onSubmit={handleSubmit}>
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your new password"
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your new password"
              />

              <div style={styles.requirements}>
                <div style={styles.requirementTitle}>
                  Password requirements
                </div>

                <Requirement
                  valid={password.length >= 8}
                  text="At least 8 characters"
                />

                <Requirement
                  valid={/[A-Za-z]/.test(password)}
                  text="At least one letter"
                />

                <Requirement
                  valid={/[0-9]/.test(password)}
                  text="At least one number"
                />

                <Requirement
                  valid={
                    password.length > 0 &&
                    confirmPassword.length > 0 &&
                    password === confirmPassword
                  }
                  text="Passwords match"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.button,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {saving
                  ? "Saving password..."
                  : "Save New Password"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => router.replace("/login")}
            style={styles.backButton}
          >
            ← Back to Login
          </button>
        </div>

        <p style={styles.security}>
          🔒 Your password is securely handled
          by GradLink SA.
        </p>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div style={styles.brand}>
      <div style={styles.logo}>
        G
      </div>

      <div style={styles.brandText}>
        Grad
        <span style={styles.blue}>
          Link
        </span>{" "}
        <small style={styles.sa}>
          SA
        </small>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        autoComplete="new-password"
        required
        style={styles.input}
      />
    </div>
  );
}

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
            : "#94a3b8",
        }}
      >
        {valid ? "✓" : "•"}
      </span>

      <span
        style={{
          color: valid
            ? "#166534"
            : "#64748b",
        }}
      >
        {text}
      </span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #f5f9ff 0%, #eef5ff 50%, #ffffff 100%)",
    position: "relative",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    top: "-260px",
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
      "linear-gradient(135deg, #1d4ed8, #1e40af)",
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

  blue: {
    color: "#2563eb",
  },

  sa: {
    color: "#64748b",
    fontSize: "12px",
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
    margin: "10px auto 26px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
    maxWidth: "350px",
  },

  field: {
    marginBottom: "17px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "750",
  },

  input: {
    width: "100%",
    height: "51px",
    boxSizing: "border-box",
    padding: "0 14px",
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

  requirementTitle: {
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px",
  },

  requirement: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    marginTop: "7px",
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
    fontWeight: "900",
  },

  button: {
    width: "100%",
    height: "52px",
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

  messageArea: {
    flex: 1,
  },

  message: {
    margin: "4px 0 0",
    lineHeight: 1.5,
  },

  loaderBox: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 5px",
  },

  loader: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    borderTopColor: "#2563eb",
  },

  backButton: {
    display: "block",
    width: "100%",
    marginTop: "20px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  security: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "18px",
  },
};