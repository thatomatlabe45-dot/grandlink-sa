"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        /*
         * Supabase password recovery links can contain
         * the recovery information in the URL.
         *
         * We first check whether Supabase already has
         * a session.
         */

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          setReady(true);
          setCheckingSession(false);
          return;
        }

        /*
         * Listen for the PASSWORD_RECOVERY event.
         *
         * This is important because Supabase may establish
         * the recovery session shortly after the page loads.
         */

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;

          if (event === "PASSWORD_RECOVERY" && session) {
            setReady(true);
            setCheckingSession(false);
          }
        });

        /*
         * Check once more after allowing Supabase time
         * to process the recovery URL.
         */
        setTimeout(async () => {
          if (!mounted) return;

          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (currentSession) {
            setReady(true);
          } else {
            setError(
              "Your password reset link is invalid or has expired. Please request a new password reset email."
            );
          }

          setCheckingSession(false);
        }, 1000);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        if (!mounted) return;

        setError(
          "We could not verify your password reset session. Please request a new reset link."
        );

        setCheckingSession(false);
      }
    }

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleResetPassword(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!ready) {
      setError(
        "Your password reset session is not available. Please open the reset link from your email again."
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Confirm that the recovery session still exists
       * immediately before changing the password.
       */

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "Your password reset session has expired. Please request a new reset link."
        );
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Password updated successfully! Redirecting you to login..."
      );

      /*
       * Give the user time to see the success message.
       */
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err) {
      setError(
        "Something went wrong while updating your password. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #eef4fb 50%, #ffffff 100%)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "20px",
          boxShadow: "0 15px 45px rgba(0, 55, 120, 0.12)",
          border: "1px solid #e6edf7",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 16px",
              borderRadius: "16px",
              background: "#eaf3ff",
              color: "#0057b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "700",
            }}
          >
            🔐
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              color: "#063b73",
              fontSize: "28px",
              fontWeight: "800",
            }}
          >
            Reset Password
          </h1>

          <p
            style={{
              margin: 0,
              color: "#667085",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            Create a new password for your GradLink SA account.
          </p>
        </div>

        {checkingSession ? (
          <div
            style={{
              textAlign: "center",
              padding: "25px 10px",
              color: "#667085",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Verifying your reset link...
            </div>

            <div
              style={{
                fontSize: "13px",
              }}
            >
              Please wait a moment.
            </div>
          </div>
        ) : error && !ready ? (
          <div>
            <div
              style={{
                background: "#fff1f1",
                border: "1px solid #ffd1d1",
                color: "#c62828",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "18px",
              }}
            >
              {error}
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                padding: "14px",
                background: "#0057b8",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#344054",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              New password
            </label>

            <input
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "14px",
                marginBottom: "18px",
                border: "1px solid #d0d5dd",
                borderRadius: "10px",
                fontSize: "16px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#344054",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Confirm new password
            </label>

            <input
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "14px",
                marginBottom: "18px",
                border: "1px solid #d0d5dd",
                borderRadius: "10px",
                fontSize: "16px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            {error && (
              <div
                style={{
                  background: "#fff1f1",
                  border: "1px solid #ffd1d1",
                  color: "#c62828",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  marginBottom: "15px",
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: "#ecfdf3",
                  border: "1px solid #b7ebc6",
                  color: "#18794e",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  marginBottom: "15px",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              style={{
                width: "100%",
                padding: "15px",
                background:
                  loading || !ready ? "#9bbce0" : "#0057b8",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor:
                  loading || !ready ? "not-allowed" : "pointer",
                boxShadow:
                  loading || !ready
                    ? "none"
                    : "0 6px 18px rgba(0,87,184,0.22)",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            paddingTop: "18px",
            borderTop: "1px solid #eef2f6",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              background: "transparent",
              border: "none",
              color: "#0057b8",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}