"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              "https://grandlink-sa.vercel.app/reset-password",
          }
        );

      if (resetError) {
        console.error(
          "Password reset email error:",
          resetError
        );

        setError(resetError.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Password reset instructions have been sent to your email. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setError(
        "Something went wrong. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow}></div>

      <div style={styles.container}>

        {/* BRAND */}

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

        {/* CARD */}

        <div style={styles.card}>

          <div style={styles.icon}>
            🔐
          </div>

          <h1 style={styles.title}>
            Forgot your password?
          </h1>

          <p style={styles.subtitle}>
            Enter the email address associated
            with your GradLink SA account and
            we'll send you a secure password
            reset link.
          </p>

          {/* ERROR */}

          {error && (
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>
                !
              </div>

              <div>
                <strong>
                  Unable to send reset email
                </strong>

                <p style={styles.message}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>
                ✓
              </div>

              <div>
                <strong>
                  Check your email
                </strong>

                <p style={styles.message}>
                  {message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label style={styles.label}>
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              router.push("/login")
            }
            style={styles.backButton}
          >
            ← Back to Login
          </button>
        </div>

        <p style={styles.security}>
          🔒 Your password reset link is
          securely handled by GradLink SA.
        </p>
      </div>
    </main>
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

    /* Small visual change to trigger a new deployment */
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
    marginBottom: "18px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
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

  message: {
    margin: "4px 0 0",
    lineHeight: 1.5,
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