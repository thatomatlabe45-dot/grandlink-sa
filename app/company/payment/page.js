"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// PLANS
// ============================================================

const PLANS = {
  starter: {
    name: "Starter",
    monthly: 500,
  },

  professional: {
    name: "Professional",
    monthly: 950,
  },

  enterprise: {
    name: "Enterprise",
    monthly: 1500,
  },
};

// ============================================================
// PAGE WRAPPER
// ============================================================

export default function CompanyPaymentPage() {
  return (
    <Suspense
      fallback={
        <main style={styles.loadingPage}>
          <div style={styles.loadingBox}>
            <div style={styles.loadingIcon}>
              💳
            </div>

            <h2>
              Preparing payment
            </h2>

            <p>
              Please wait...
            </p>
          </div>
        </main>
      }
    >
      <CompanyPaymentContent />
    </Suspense>
  );
}

// ============================================================
// PAYMENT CONTENT
// ============================================================

function CompanyPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId =
    searchParams.get("plan") ||
    "starter";

  const billing =
    searchParams.get("billing") ||
    "monthly";

  const plan =
    PLANS[planId] ||
    PLANS.starter;

  const [user, setUser] =
    useState(null);

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD PAYMENT PAGE
  // ==========================================================

  useEffect(() => {
    loadPaymentPage();
  }, []);

  async function loadPaymentPage() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace(
          "/login?redirect=/company-pricing"
        );

        return;
      }

      setUser(user);

      const {
        data: subscriptionData,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        throw subscriptionError;
      }

      setSubscription(
        subscriptionData || null
      );

      // --------------------------------------------------------
      // ACTIVE SUBSCRIPTION
      // --------------------------------------------------------

      if (
        subscriptionData?.status
          ?.toLowerCase() === "active"
      ) {
        router.replace("/company");
        return;
      }
    } catch (err) {
      console.error(
        "Payment page error:",
        err
      );

      setError(
        err?.message ||
          "Could not load the payment page."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PRICE
  // ==========================================================

  function getAmount() {
    if (billing === "annual") {
      return plan.monthly * 10;
    }

    return plan.monthly;
  }

  // ==========================================================
  // CHECK PAYMENT
  // ==========================================================

  async function checkPaymentStatus() {
    try {
      setChecking(true);
      setMessage("");
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace(
          "/login?redirect=/company-pricing"
        );

        return;
      }

      const {
        data: latestSubscription,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        throw subscriptionError;
      }

      setSubscription(
        latestSubscription || null
      );

      if (
        latestSubscription?.status
          ?.toLowerCase() === "active"
      ) {
        setMessage(
          "Payment verified. Your company registration is now available."
        );

        setTimeout(() => {
          router.push("/company");
        }, 900);

        return;
      }

      setMessage(
        "We have not received a verified payment yet. Please complete payment first."
      );
    } catch (err) {
      console.error(
        "Payment status error:",
        err
      );

      setError(
        err?.message ||
          "Could not check your payment status."
      );
    } finally {
      setChecking(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>
            💳
          </div>

          <h2>
            Preparing payment
          </h2>

          <p>
            Please wait...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <main style={styles.page}>
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav style={styles.navbar}>
        <Link
          href="/company-pricing"
          style={styles.logo}
        >
          <span style={styles.logoIcon}>
            G
          </span>

          <span>
            GradLink{" "}
            <strong>SA</strong>
          </span>
        </Link>

        <Link
          href="/company-pricing"
          style={styles.backButton}
        >
          ← Back to plans
        </Link>
      </nav>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>
            🔒 SECURE CHECKOUT
          </div>

          <h1 style={styles.mainTitle}>
            Complete your{" "}
            <span style={styles.titleHighlight}>
              company payment
            </span>
          </h1>

          <p style={styles.headerText}>
            Your company profile will only
            become available after your
            payment has been successfully
            verified.
          </p>
        </div>

        {/* ===================================================
            MESSAGES
        ==================================================== */}

        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}

        {message && (
          <div style={styles.message}>
            ✓ {message}
          </div>
        )}

        {/* ===================================================
            CHECKOUT
        ==================================================== */}

        <div style={styles.checkoutGrid}>
          {/* =================================================
              ORDER SUMMARY
          ================================================== */}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span>
                SELECTED PLAN
              </span>

              <span style={styles.lock}>
                🔐
              </span>
            </div>

            <div style={styles.planIcon}>
              {planId === "starter"
                ? "🚀"
                : planId === "professional"
                ? "⭐"
                : "🏢"}
            </div>

            <h2 style={styles.planName}>
              {plan.name}
            </h2>

            <p style={styles.planText}>
              Company recruitment plan
            </p>

            <div style={styles.line} />

            <div style={styles.summaryRow}>
              <span>
                Billing
              </span>

              <strong>
                {billing === "annual"
                  ? "Annual"
                  : "Monthly"}
              </strong>
            </div>

            <div style={styles.summaryRow}>
              <span>
                Plan
              </span>

              <strong>
                {plan.name}
              </strong>
            </div>

            <div style={styles.line} />

            <div style={styles.totalRow}>
              <span>
                Total
              </span>

              <strong>
                R
                {getAmount().toLocaleString()}
              </strong>
            </div>

            {billing === "annual" && (
              <p style={styles.savingText}>
                Annual billing gives you the
                equivalent of 2 months free.
              </p>
            )}
          </div>

          {/* =================================================
              PAYMENT
          ================================================== */}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span>
                PAYMENT
              </span>

              <span>
                🔒
              </span>
            </div>

            <h2 style={styles.paymentTitle}>
              Secure payment
            </h2>

            <p style={styles.paymentText}>
              Complete your payment through
              the secure payment gateway.
              GradLink SA will only activate
              your company subscription after
              the payment provider confirms
              the transaction.
            </p>

            {/* -----------------------------------------------
                PAYMENT PROVIDER
            ------------------------------------------------ */}

            <div
              style={
                styles.paymentPlaceholder
              }
            >
              <div
                style={
                  styles.paymentPlaceholderIcon
                }
              >
                💳
              </div>

              <strong>
                Payment checkout
              </strong>

              <p>
                Your secure payment gateway
                will be connected here.
              </p>

              <button
                type="button"
                style={
                  styles.paymentButton
                }
                onClick={() => {
                  setError("");

                  setMessage(
                    "The payment gateway must confirm the transaction before your account can be activated."
                  );
                }}
              >
                Continue to Payment
              </button>
            </div>

            {/* -----------------------------------------------
                CHECK PAYMENT
            ------------------------------------------------ */}

            <button
              type="button"
              onClick={
                checkPaymentStatus
              }
              disabled={checking}
              style={{
                ...styles.checkButton,
                ...(checking
                  ? styles.disabled
                  : {}),
              }}
            >
              {checking
                ? "Checking payment..."
                : "I've completed payment — Check status"}
            </button>

            {/* -----------------------------------------------
                WARNING
            ------------------------------------------------ */}

            <div style={styles.warning}>
              <strong>
                Important
              </strong>

              <span>
                Selecting a plan or clicking a
                button does not activate your
                company subscription.
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            FLOW
        ==================================================== */}

        <div style={styles.flow}>
          <FlowStep
            number="1"
            title="Choose plan"
            active
          />

          <div style={styles.flowLine} />

          <FlowStep
            number="2"
            title="Payment"
            active
          />

          <div style={styles.flowLine} />

          <FlowStep
            number="3"
            title="Verification"
          />

          <div style={styles.flowLine} />

          <FlowStep
            number="4"
            title="Company profile"
          />
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 750px) {
          .checkoutGrid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 520px) {
          .flow {
            flex-direction: column !important;
          }

          .flowLine {
            width: 2px !important;
            height: 25px !important;
          }
        }
      `}</style>
    </main>
  );
}

// ============================================================
// FLOW STEP
// ============================================================

function FlowStep({
  number,
  title,
  active,
}) {
  return (
    <div style={styles.flowStep}>
      <div
        style={{
          ...styles.flowNumber,
          ...(active
            ? styles.flowNumberActive
            : {}),
        }}
      >
        {number}
      </div>

      <span>
        {title}
      </span>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  // ==========================================================
  // PAGE
  // ==========================================================

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f5f9ff 0%, #ffffff 55%, #f8fbff 100%)",
    color: "#10233f",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #eef6ff, #ffffff)",
    padding: "20px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",
  },

  loadingBox: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "40px 28px",
    borderRadius: "22px",
    textAlign: "center",
    border: "1px solid #e2eaf3",
    boxShadow:
      "0 20px 60px rgba(15,59,112,.10)",
  },

  loadingIcon: {
    width: "60px",
    height: "60px",
    margin: "0 auto 16px",
    borderRadius: "18px",
    background: "#eaf4ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
  },

  // ==========================================================
  // NAVBAR
  // ==========================================================

  navbar: {
    width: "100%",
    minHeight: "72px",
    padding: "0 6%",
    background: "#ffffff",
    borderBottom: "1px solid #e4ecf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#10233f",
    textDecoration: "none",
    fontSize: "20px",
    fontWeight: "850",
    flexShrink: 0,
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg,#1261d6,#08a0ff)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
  },

  backButton: {
    color: "#1261d6",
    textDecoration: "none",
    fontWeight: "750",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
    padding: "65px 20px 80px",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    textAlign: "center",
    maxWidth: "720px",
    margin: "0 auto 40px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eaf3ff",
    color: "#1261d6",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: ".6px",
    marginBottom: "15px",
  },

  mainTitle: {
    margin: 0,
    fontSize: "clamp(34px, 6vw, 52px)",
    lineHeight: 1.08,
    letterSpacing: "-1.8px",
    fontWeight: "900",
  },

  titleHighlight: {
    background:
      "linear-gradient(90deg,#1261d6,#08a0ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  headerText: {
    maxWidth: "650px",
    margin: "18px auto 0",
    color: "#687990",
    lineHeight: 1.7,
    fontSize: "15px",
  },

  // ==========================================================
  // MESSAGES
  // ==========================================================

  error: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "14px 17px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "650",
    fontSize: "13px",
  },

  message: {
    background: "#ecfdf3",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "14px 17px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "650",
    fontSize: "13px",
  },

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  checkoutGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, .8fr) minmax(0, 1.2fr)",
    gap: "22px",
    alignItems: "stretch",
  },

  card: {
    minWidth: 0,
    background: "#ffffff",
    border: "1px solid #dfe8f2",
    borderRadius: "22px",
    padding: "30px",
    boxShadow:
      "0 18px 50px rgba(24,69,120,.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#7b8ba0",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: ".6px",
  },

  lock: {
    fontSize: "15px",
  },

  // ==========================================================
  // PLAN
  // ==========================================================

  planIcon: {
    width: "62px",
    height: "62px",
    marginTop: "30px",
    borderRadius: "17px",
    background: "#edf7ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "31px",
  },

  planName: {
    margin: "16px 0 5px",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "-.7px",
  },

  planText: {
    color: "#718198",
    margin: 0,
    fontSize: "14px",
  },

  line: {
    height: "1px",
    background: "#edf1f6",
    margin: "25px 0",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "14px",
    color: "#687990",
    fontSize: "14px",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    fontSize: "17px",
  },

  savingText: {
    color: "#15803d",
    fontSize: "12px",
    lineHeight: "1.5",
    marginTop: "15px",
    marginBottom: 0,
  },

  // ==========================================================
  // PAYMENT
  // ==========================================================

  paymentTitle: {
    margin: "22px 0 8px",
    fontSize: "25px",
    fontWeight: "850",
    letterSpacing: "-.4px",
  },

  paymentText: {
    color: "#687990",
    lineHeight: "1.65",
    fontSize: "14px",
    margin: 0,
  },

  paymentPlaceholder: {
    marginTop: "25px",
    padding: "28px 20px",
    background: "#f7fbff",
    border: "1px dashed #bdd2eb",
    borderRadius: "17px",
    textAlign: "center",
  },

  paymentPlaceholderIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 12px",
    borderRadius: "16px",
    background: "#eaf4ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "27px",
  },

  paymentButton: {
    width: "100%",
    marginTop: "15px",
    minHeight: "50px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg,#1261d6,#087ed8)",
    color: "#ffffff",
    fontWeight: "850",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow:
      "0 9px 22px rgba(18,97,214,.20)",
  },

  checkButton: {
    width: "100%",
    marginTop: "15px",
    minHeight: "48px",
    border: "1px solid #cbdced",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#1261d6",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    padding: "10px 15px",
  },

  disabled: {
    opacity: ".6",
    cursor: "not-allowed",
  },

  warning: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginTop: "20px",
    padding: "13px",
    background: "#fffaf0",
    border: "1px solid #fde68a",
    borderRadius: "11px",
    color: "#854d0e",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  // ==========================================================
  // FLOW
  // ==========================================================

  flow: {
    marginTop: "45px",
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #e2eaf3",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "13px",
    flexWrap: "wrap",
  },

  flowStep: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "750",
    color: "#52647c",
  },

  flowNumber: {
    width: "27px",
    height: "27px",
    borderRadius: "50%",
    background: "#e7edf5",
    color: "#718198",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  flowNumberActive: {
    background: "#1261d6",
    color: "#ffffff",
  },

  flowLine: {
    height: "1px",
    width: "45px",
    background: "#dbe5f0",
  },
};