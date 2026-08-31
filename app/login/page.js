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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    // ----------------------------------------
    // LOGIN USER
    // ----------------------------------------

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
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

    setMessage("Login successful! Redirecting...");

    // ----------------------------------------
    // IMPORTANT:
    // REMOVE OLD BROWSER PROFILE TYPE
    // ----------------------------------------

    localStorage.removeItem("gradlink_profile");

    // ----------------------------------------
    // CHECK IF USER IS A COMPANY
    // ----------------------------------------

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
        "Company check error:",
        companyError
      );

      setError(
        "Could not check your account type. Please try again."
      );

      setLoading(false);
      return;
    }

    // ----------------------------------------
    // COMPANY FOUND
    // ----------------------------------------

    if (company) {
      localStorage.setItem(
        "gradlink_profile",
        "company"
      );

      router.push("/company-dashboard");
      return;
    }

    // ----------------------------------------
    // CHECK IF USER IS A GRADUATE
    // ----------------------------------------

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

    // ----------------------------------------
    // GRADUATE FOUND
    // ----------------------------------------

    if (graduate) {
      localStorage.setItem(
        "gradlink_profile",
        "graduate"
      );

      router.push("/graduate");
      return;
    }

    // ----------------------------------------
    // NEW USER
    // ----------------------------------------
    // User has no company or graduate
    // profile yet.

    router.push("/choose-profile");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "35px 25px",
          borderRadius: "18px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#0057b8",
            fontSize: "32px",
            marginBottom: "8px",
          }}
        >
          GradLink SA
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          Login to your account
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
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
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
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
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              marginBottom: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              textAlign: "right",
              marginBottom: "20px",
            }}
          >
            <Link
              href="/reset-password"
              style={{
                color: "#0057b8",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              style={{
                background: "#dcfce7",
                color: "#166534",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "#93c5fd"
                : "#0057b8",
              color: "#ffffff",
              border: "none",
              padding: "14px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#6b7280",
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

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#6b7280",
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