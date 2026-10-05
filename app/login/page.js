"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      const user = data?.user;

      if (!user) {
        setError("Could not find your account.");
        setLoading(false);
        return;
      }

      setMessage(
        "Login successful! Redirecting..."
      );

      localStorage.removeItem("gradlink_profile");

      const cleanEmail = user.email
        ?.trim()
        .toLowerCase();

      // ========================================================
      // CHECK COMPANY BY USER ID
      // ========================================================

      const {
        data: companyByUserId,
        error: companyUserIdError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyUserIdError) {
        console.error(
          "Company user_id check error:",
          companyUserIdError
        );
      }

      if (companyByUserId) {
        localStorage.setItem(
          "gradlink_profile",
          "company"
        );

        router.replace("/company-dashboard");
        return;
      }

      // ========================================================
      // CHECK COMPANY BY EMAIL
      // ========================================================

      let companyByEmail = null;

      if (cleanEmail) {
        const {
          data,
          error: companyEmailError,
        } = await supabase
          .from("companies")
          .select("*")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (companyEmailError) {
          console.error(
            "Company email check error:",
            companyEmailError
          );
        } else {
          companyByEmail = data;
        }
      }

      if (companyByEmail) {
        const { error: updateCompanyError } =
          await supabase
            .from("companies")
            .update({
              user_id: user.id,
            })
            .eq("id", companyByEmail.id);

        if (updateCompanyError) {
          console.error(
            "Could not update company user_id:",
            updateCompanyError
          );
        }

        localStorage.setItem(
          "gradlink_profile",
          "company"
        );

        router.replace("/company-dashboard");
        return;
      }

      // ========================================================
      // CHECK GRADUATE
      // ========================================================

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
          "Graduate check error:",
          graduateError
        );

        setError(
          "Could not check your account type. Please try again."
        );

        setLoading(false);
        return;
      }

      if (graduate) {
        localStorage.setItem(
          "gradlink_profile",
          "graduate"
        );

        router.replace("/graduate");
        return;
      }

      // ========================================================
      // NEW USER
      // ========================================================

      router.replace("/choose-profile");

    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Something went wrong while logging in. Please try again."
      );

      setLoading(false);
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  async function handleForgotPassword(e) {
    e.preventDefault();

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    const cleanEmail = resetEmail
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      setResetError(
        "Please enter your email address."
      );

      setResetLoading(false);
      return;
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        );

      if (resetError) {
        console.error(
          "Password reset error:",
          resetError
        );

        setResetError(resetError.message);
        setResetLoading(false);
        return;
      }

      setResetMessage(
        "Password reset email sent successfully. Please check your email and tap the reset link."
      );

      setResetEmail("");

    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setResetError(
        "Something went wrong while sending the reset email. Please try again."
      );
    }

    setResetLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #eef5ff 50%, #ffffff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "35px 25px",
          borderRadius: "20px",
          boxShadow:
            "0 15px 45px rgba(0,55,120,0.12)",
          border: "1px solid #e5edf7",
          boxSizing: "border-box",
        }}
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 15px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #0057b8, #0b78e3)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "800",
              boxShadow:
                "0 8px 20px rgba(0,87,184,0.22)",
            }}
          >
            G
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              color: "#063b73",
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            GradLink SA
          </h1>

          <p
            style={{
              margin: 0,
              color: "#667085",
              fontSize: "15px",
            }}
          >
            Login to your account
          </p>
        </div>

        {/* =====================================================
            LOGIN FORM
        ====================================================== */}

        <form onSubmit={handleLogin}>

          <label
            style={{
              display: "block",
              fontWeight: "700",
              color: "#344054",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            required
            disabled={loading}
            autoComplete="email"
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d0d5dd",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "16px",
              boxSizing: "border-box",
              outline: "none",
              background: "#ffffff",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "700",
              color: "#344054",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            required
            disabled={loading}
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d0d5dd",
              borderRadius: "10px",
              marginBottom: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
              outline: "none",
              background: "#ffffff",
            }}
          />

          {/* FORGOT PASSWORD BUTTON */}

          <div
            style={{
              textAlign: "right",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(
                  !showForgotPassword
                );
                setResetError("");
                setResetMessage("");

                if (!resetEmail) {
                  setResetEmail(email);
                }
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#0057b8",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#fff1f1",
                border:
                  "1px solid #ffd1d1",
                color: "#b42318",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "15px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                background: "#ecfdf3",
                border:
                  "1px solid #b7ebc6",
                color: "#18794e",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "15px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "#93bce5"
                : "#0057b8",
              color: "#ffffff",
              border: "none",
              padding: "15px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow: loading
                ? "none"
                : "0 6px 18px rgba(0,87,184,0.22)",
            }}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
        
                {/* =====================================================
            FORGOT PASSWORD PANEL
        ====================================================== */}

        {showForgotPassword && (
          <div
            style={{
              marginTop: "22px",
              padding: "20px",
              background:
                "linear-gradient(135deg, #f7fbff, #eef6ff)",
              border:
                "1px solid #d7e7f8",
              borderRadius: "15px",
              boxShadow:
                "0 6px 20px rgba(0,87,184,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#dceeff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                🔐
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#063b73",
                    fontSize: "18px",
                    fontWeight: "800",
                  }}
                >
                  Reset your password
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#667085",
                    fontSize: "13px",
                  }}
                >
                  We'll send you a secure reset link.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword}>

              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  color: "#344054",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Email address
              </label>

              <input
                type="email"
                value={resetEmail}
                onChange={(e) =>
                  setResetEmail(e.target.value)
                }
                placeholder="Enter your account email"
                required
                disabled={resetLoading}
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "14px",
                  border:
                    "1px solid #cbd9e8",
                  borderRadius: "10px",
                  marginBottom: "14px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                  background: "#ffffff",
                }}
              />

              {resetError && (
                <div
                  style={{
                    background: "#fff1f1",
                    border:
                      "1px solid #ffd1d1",
                    color: "#b42318",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  {resetError}
                </div>
              )}

              {resetMessage && (
                <div
                  style={{
                    background: "#ecfdf3",
                    border:
                      "1px solid #b7ebc6",
                    color: "#18794e",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  width: "100%",
                  background: resetLoading
                    ? "#93bce5"
                    : "#0057b8",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: resetLoading
                    ? "not-allowed"
                    : "pointer",
                  boxShadow: resetLoading
                    ? "none"
                    : "0 5px 15px rgba(0,87,184,0.18)",
                }}
              >
                {resetLoading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetError("");
                setResetMessage("");
              }}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "11px",
                background: "transparent",
                color: "#667085",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* =====================================================
            SIGN UP
        ====================================================== */}

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#667085",
            fontSize: "14px",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "#0057b8",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>

        {/* =====================================================
            BACK TO HOME
        ====================================================== */}

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            paddingTop: "18px",
            borderTop:
              "1px solid #eef2f6",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#667085",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back to GradLink SA
          </Link>
        </div>
      </div>
    </main>
  );
}