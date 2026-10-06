"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // CHECK AUTHENTICATED USER
  // ==========================================================

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
    } catch (err) {
      console.error(
        "Account security user check error:",
        err
      );

      router.replace("/login");
      return;
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  async function handleChangePassword(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!currentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (!/[A-Za-z]/.test(newPassword)) {
      setError(
        "Your new password must contain at least one letter."
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError(
        "Your new password must contain at least one number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "The new passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "Your new password must be different from your current password."
      );
      return;
    }

    if (!user?.email) {
      setError(
        "Your account email could not be found. Please log in again."
      );
      return;
    }

    setSaving(true);

    try {
      // ------------------------------------------------------
      // VERIFY CURRENT PASSWORD
      // ------------------------------------------------------

      const {
        data: verifyData,
        error: verifyError,
      } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        console.error(
          "Current password verification error:",
          verifyError
        );

        setError(
          "Your current password is incorrect."
        );

        setSaving(false);
        return;
      }

      if (!verifyData?.user) {
        setError(
          "We could not verify your current password. Please try again."
        );

        setSaving(false);
        return;
      }

      // ------------------------------------------------------
      // UPDATE PASSWORD
      // ------------------------------------------------------

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to change your password."
        );

        setSaving(false);
        return;
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Your password has been changed successfully."
      );
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.spinner}></div>

        <p style={styles.loadingText}>
          Loading account security...
        </p>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlow}></div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link
            href="/company-dashboard"
            style={styles.logo}
          >
            <span style={styles.logoMark}>
              G
            </span>

            <span>
              Grad
              <span style={styles.logoBlue}>
                Link
              </span>{" "}
              <span style={styles.logoSA}>
                SA
              </span>
            </span>
          </Link>

          <Link
            href="/company-dashboard"
            style={styles.backButton}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section style={styles.content}>
        {/* ====================================================
            INTRO
        ==================================================== */}

        <div style={styles.intro}>
          <div style={styles.securityIcon}>
            🔐
          </div>

          <div>
            <div style={styles.eyebrow}>
              ACCOUNT & SECURITY
            </div>

            <h1 style={styles.title}>
              Protect your account
            </h1>

            <p style={styles.subtitle}>
              Change your GradLink SA company
              account password securely from
              one place.
            </p>
          </div>
        </div>

        {/* ====================================================
            SECURITY CARD
        ==================================================== */}

        <div style={styles.securityCard}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Change Password
              </h2>

              <p style={styles.cardSubtitle}>
                Signed in as{" "}
                <strong>
                  {user?.email ||
                    "your account"}
                </strong>
              </p>
            </div>

            <div style={styles.lockBadge}>
              🔒
            </div>
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>
                !
              </span>

              <p style={styles.messageText}>
                {error}
              </p>
            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div style={styles.successBox}>
              <span style={styles.successIcon}>
                ✓
              </span>

              <p style={styles.messageText}>
                {success}
              </p>
            </div>
          )}

          {/* ==================================================
              FORM
          ================================================== */}

          <form onSubmit={handleChangePassword}>
            {/* CURRENT PASSWORD */}

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              setShow={setShowCurrent}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />

            {/* NEW PASSWORD */}

            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              setShow={setShowNew}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />

            {/* CONFIRM PASSWORD */}

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              setShow={setShowConfirm}
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />

            {/* =================================================
                PASSWORD REQUIREMENTS
            ================================================= */}

            <div style={styles.requirements}>
              <div
                style={
                  styles.requirementsTitle
                }
              >
                Password requirements
              </div>

              <Requirement
                valid={
                  newPassword.length >= 8
                }
                text="At least 8 characters"
              />

              <Requirement
                valid={
                  /[A-Za-z]/.test(
                    newPassword
                  )
                }
                text="At least one letter"
              />

              <Requirement
                valid={
                  /[0-9]/.test(
                    newPassword
                  )
                }
                text="At least one number"
              />

              <Requirement
                valid={
                  newPassword.length > 0 &&
                  newPassword ===
                    confirmPassword
                }
                text="Passwords match"
              />
            </div>

            {/* =================================================
                UPDATE BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Updating Password..."
                : "Update Password"}
            </button>
          </form>
        </div>

        {/* ====================================================
            SECURITY INFORMATION
        ==================================================== */}

        <div style={styles.infoCard}>
          <div style={styles.infoIcon}>
            🛡️
          </div>

          <div>
            <h3 style={styles.infoTitle}>
              Keep your account secure
            </h3>

            <p style={styles.infoText}>
              Use a password that you do not
              use on other websites. Never
              share your GradLink SA password
              with anyone.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <p>
          © {new Date().getFullYear()} GradLink
          SA. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  placeholder,
  autoComplete,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <div style={styles.passwordWrapper}>
        <input
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={styles.input}
        />

        <button
          type="button"
          onClick={() =>
            setShow(!show)
          }
          style={styles.eyeButton}
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
          title={
            show
              ? "Hide password"
              : "Show password"
          }
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PASSWORD REQUIREMENT
// ============================================================

function Requirement({
  valid,
  text,
}) {
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
      "linear-gradient(180deg, #f8fbff 0%, #eef5ff 52%, #ffffff 100%)",
    color: "#0f172a",
    position: "relative",
    overflow: "hidden",
  },

  backgroundGlow: {
    position: "absolute",
    top: "-180px",
    right: "-160px",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(37,99,235,0.13), rgba(37,99,235,0) 70%)",
    pointerEvents: "none",
  },

  header: {
    position: "relative",
    zIndex: 2,
    background:
      "rgba(255,255,255,0.94)",
    borderBottom:
      "1px solid #e2e8f0",
    backdropFilter:
      "blur(14px)",
  },

  headerInner: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "14px",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: "800",
    fontSize: "19px",
  },

  logoMark: {
    width: "35px",
    height: "35px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.25)",
  },

  logoBlue: {
    color: "#2563eb",
  },

  logoSA: {
    color: "#64748b",
    fontSize: "12px",
    marginLeft: "2px",
  },

  backButton: {
    textDecoration: "none",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "14px",
    padding: "10px 13px",
    border:
      "1px solid #dbeafe",
    borderRadius: "10px",
    background: "#eff6ff",
    whiteSpace: "nowrap",
  },

  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "850px",
    margin: "0 auto",
    padding:
      "48px 20px 70px",
  },

  intro: {
    display: "flex",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "28px",
  },

  securityIcon: {
    width: "54px",
    height: "54px",
    minWidth: "54px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    boxShadow:
      "0 8px 24px rgba(37,99,235,0.10)",
  },

  eyebrow: {
    color: "#2563eb",
    fontWeight: "800",
    letterSpacing: "1.4px",
    fontSize: "11px",
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(30px, 5vw, 43px)",
    lineHeight: 1.1,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.65,
    maxWidth: "650px",
  },

  securityCard: {
    background: "#ffffff",
    border:
      "1px solid #dbe5f0",
    borderRadius: "22px",
    padding: "28px",
    boxShadow:
      "0 18px 50px rgba(15,23,42,0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
    marginBottom: "24px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "800",
  },

  cardSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    wordBreak:
      "break-word",
  },

  lockBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    border:
      "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "18px",
    fontSize: "14px",
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
    alignItems: "center",
    gap: "10px",
    background: "#f0fdf4",
    border:
      "1px solid #bbf7d0",
    color: "#15803d",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "18px",
    fontSize: "14px",
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

  messageText: {
    margin: 0,
    lineHeight: 1.5,
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "750",
    color: "#334155",
    marginBottom: "8px",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    height: "50px",
    padding:
      "0 52px 0 14px",
    borderRadius: "12px",
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
  },

  eyeButton: {
    position: "absolute",
    right: "5px",
    top: "5px",
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "9px",
    background: "#f8fafc",
    cursor: "pointer",
    fontSize: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  requirements: {
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "15px",
    marginTop: "4px",
    marginBottom: "22px",
  },

  requirementsTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#334155",
    marginBottom: "10px",
  },

  requirement: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "7px",
  },

  requirementIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
  },

  requirementText: {
    fontSize: "12px",
  },

  saveButton: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    boxShadow:
      "0 10px 24px rgba(37,99,235,0.22)",
  },

  infoCard: {
    marginTop: "18px",
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    background: "#eff6ff",
    border:
      "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "18px",
  },

  infoIcon: {
    fontSize: "20px",
  },

  infoTitle: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: "800",
    color: "#1e3a8a",
  },

  infoText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  footer: {
    position: "relative",
    zIndex: 1,
    borderTop:
      "1px solid #e2e8f0",
    padding: "22px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fbff",
  },

  spinner: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border:
      "3px solid #dbeafe",
    borderTopColor:
      "#2563eb",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "12px",
  },
};
