"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [accountType, setAccountType] = useState("graduate");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (accountType === "graduate" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (accountType === "company" && !companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            account_type: accountType,
            full_name:
              accountType === "graduate" ? fullName.trim() : "",
            company_name:
              accountType === "company" ? companyName.trim() : "",
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error(
          "We could not create your account. Please try again."
        );
      }

      if (data.session) {
        localStorage.setItem("gradlink_profile", accountType);

        setMessage(
          "Your account has been created successfully. Redirecting..."
        );

        router.replace(
          accountType === "company" ? "/company" : "/graduate"
        );

        return;
      }

      setMessage(
        "Your account has been created. Please check your email for a verification link, then return to the login page."
      );
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #dbe3ef",
    borderRadius: "11px",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#172033",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#24324a",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef5ff 0%, #f8fbff 50%, #ffffff 100%)",
        padding: "28px 16px 45px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            textDecoration: "none",
            color: "#0757b8",
            fontSize: "25px",
            fontWeight: "900",
            letterSpacing: "-0.7px",
            marginBottom: "25px",
          }}
        >
          GradLink <span style={{ color: "#142b4a" }}>SA</span>
        </Link>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5ecf6",
            borderRadius: "22px",
            padding: "28px 22px",
            boxShadow: "0 18px 55px rgba(28, 69, 125, 0.10)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#eaf3ff",
              color: "#0757b8",
              padding: "7px 12px",
              borderRadius: "30px",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "14px",
            }}
          >
            JOIN GRADLINK SA
          </div>

          <h1
            style={{
              margin: "0 0 9px",
              color: "#142b4a",
              fontSize: "30px",
              lineHeight: 1.2,
              letterSpacing: "-0.8px",
            }}
          >
            Create your account
          </h1>

          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            Connect with opportunities and take your next career step.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAccountType("graduate");
                setError("");
                setMessage("");
              }}
              style={{
                padding: "15px 8px",
                borderRadius: "12px",
                border:
                  accountType === "graduate"
                    ? "2px solid #0757b8"
                    : "1px solid #dbe3ef",
                background:
                  accountType === "graduate" ? "#eef5ff" : "#ffffff",
                color:
                  accountType === "graduate" ? "#0757b8" : "#526176",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              🎓 Graduate
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  marginTop: "5px",
                }}
              >
                Free account
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("company");
                setError("");
                setMessage("");
              }}
              style={{
                padding: "15px 8px",
                borderRadius: "12px",
                border:
                  accountType === "company"
                    ? "2px solid #0757b8"
                    : "1px solid #dbe3ef",
                background:
                  accountType === "company" ? "#eef5ff" : "#ffffff",
                color:
                  accountType === "company" ? "#0757b8" : "#526176",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              🏢 Company
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  marginTop: "5px",
                }}
              >
                Paid plans from R500
              </div>
            </button>
          </div>

          <form onSubmit={handleSignup}>
            {accountType === "graduate" ? (
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            ) : (
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Company name</label>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                  style={inputStyle}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
                minLength={8}
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                style={inputStyle}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#be123c",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#047857",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  marginBottom: "16px",
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
                padding: "15px",
                border: "none",
                borderRadius: "12px",
                background: loading ? "#7ba6dc" : "#0757b8",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 18px rgba(7, 87, 184, 0.18)",
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              margin: "22px 0 0",
              fontSize: "14px",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#0757b8",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </p>
        </section>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "12px",
            marginTop: "22px",
          }}
        >
          © {new Date().getFullYear()} GradLink SA. All rights reserved.
        </p>
      </div>
    </main>
  );
}