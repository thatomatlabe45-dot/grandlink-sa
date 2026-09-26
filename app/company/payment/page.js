"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE
// ============================================================

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
    annual: 5000,
    listings: 5,
  },

  professional: {
    name: "Professional",
    monthly: 950,
    annual: 9500,
    listings: 15,
    popular: true,
  },

  enterprise: {
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
    listings: 30,
  },

  pay_per_listing: {
    name: "Pay Per Listing",
    listing: 250,
    listings: 1,
  },
};

// ============================================================
// MAIN CONTENT
// ============================================================

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get("plan");
  const billing =
    searchParams.get("billing") || "monthly";
  const subscriptionId =
    searchParams.get("subscription");
  const paymentResult =
    searchParams.get("payment");

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [checking, setChecking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  // ==========================================================
  // SELECTED PLAN
  // ==========================================================

  const plan = planId
    ? PLANS[planId]
    : null;

  // ==========================================================
  // GET AMOUNT
  // ==========================================================

  function getAmount() {
    if (!plan) {
      return 0;
    }

    if (planId === "pay_per_listing") {
      return plan.listing;
    }

    if (billing === "annual") {
      return plan.annual;
    }

    return plan.monthly;
  }

  // ==========================================================
  // LOAD USER + SUBSCRIPTION
  // ==========================================================

  useEffect(() => {
    async function loadPaymentDetails() {
      try {
        setLoading(true);

        const {
          data: {
            user: currentUser,
          },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.replace(
            "/login?redirect=/company-pricing"
          );

          return;
        }

        setUser(currentUser);

        // ------------------------------------------------------
        // Validate URL
        // ------------------------------------------------------

        if (!planId || !plan) {
          setMessage(
            "No valid payment plan was selected."
          );

          setMessageType("error");
          return;
        }

        if (!subscriptionId) {
          setMessage(
            "No subscription was found for this payment."
          );

          setMessageType("error");
          return;
        }

        // ------------------------------------------------------
        // Get exact subscription
        // ------------------------------------------------------

        const {
          data: subscriptionData,
          error: subscriptionError,
        } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("id", subscriptionId)
          .eq(
            "company_id",
            currentUser.id
          )
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            subscriptionError
          );

          setMessage(
            "We could not load your payment information."
          );

          setMessageType("error");
          return;
        }

        if (!subscriptionData) {
          setMessage(
            "The selected subscription could not be found."
          );

          setMessageType("error");
          return;
        }

        setSubscription(
          subscriptionData
        );

        // ------------------------------------------------------
        // Already active
        // ------------------------------------------------------

        const isActive =
          String(
            subscriptionData.status
          ).toLowerCase() === "active";

        if (
          isActive &&
          planId !== "pay_per_listing"
        ) {
          router.replace("/company");
          return;
        }

        // ------------------------------------------------------
        // Payment return messages
        // ------------------------------------------------------

        if (
          paymentResult === "success"
        ) {
          setMessage(
            "PayFast has returned you to GradLink SA. Your payment is now being verified."
          );

          setMessageType("success");
        }

        if (
          paymentResult === "cancelled"
        ) {
          setMessage(
            "The PayFast payment was cancelled. Your subscription has not been activated."
          );

          setMessageType("error");
        }
      } catch (error) {
        console.error(
          "Payment page error:",
          error
        );

        setMessage(
          "Something went wrong while loading the payment page."
        );

        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadPaymentDetails();
  }, [
    router,
    planId,
    subscriptionId,
    paymentResult,
    plan,
  ]);

  // ==========================================================
  // CHECK PAYMENT STATUS
  // ==========================================================

  async function checkPaymentStatus() {
    if (!user || !subscriptionId) {
      return;
    }

    try {
      setChecking(true);

      setMessage(
        "Checking your payment status..."
      );

      setMessageType("");

      const {
        data,
        error,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq(
          "company_id",
          user.id
        )
        .maybeSingle();

      if (error) {
        console.error(error);

        setMessage(
          "We could not check your payment status."
        );

        setMessageType("error");
        return;
      }

      if (!data) {
        setMessage(
          "Subscription not found."
        );

        setMessageType("error");
        return;
      }

      setSubscription(data);

      const status =
        String(
          data.status
        ).toLowerCase();

      if (status === "active") {
        setMessage(
          "Payment verified successfully. Your GradLink SA company access is now active."
        );

        setMessageType("success");

        setTimeout(() => {
          router.push("/company");
        }, 1500);

        return;
      }

      setMessage(
        "Payment has not been verified yet. If you have just paid, wait a moment and check again."
      );

      setMessageType("warning");
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while checking your payment."
      );

      setMessageType("error");
    } finally {
      setChecking(false);
    }
  }

  // ==========================================================
  // CONTINUE TO PAYFAST
  // ==========================================================

  async function continueToPayFast() {
    if (!user || !subscription) {
      setMessage(
        "Your payment information is not ready yet."
      );

      setMessageType("error");
      return;
    }

    try {
      setProcessing(true);

      setMessage(
        "Preparing secure PayFast checkout..."
      );

      setMessageType("");

      const currentStatus =
        String(
          subscription.status
        ).toLowerCase();

      if (
        currentStatus === "active" &&
        planId !== "pay_per_listing"
      ) {
        router.push("/company");
        return;
      }

      // ------------------------------------------------------
      // Create PayFast payment
      // ------------------------------------------------------

      const response =
        await fetch(
          "/api/payfast/create-payment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              plan: planId,

              billing:
                planId ===
                "pay_per_listing"
                  ? "listing"
                  : billing,

              subscriptionId:
                subscription.id,

              email:
                user.email,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          "PayFast creation error:",
          result
        );

        throw new Error(
          result.error ||
            "Could not create PayFast payment."
        );
      }

      const paymentUrl =
        result.paymentUrl;

      const paymentData =
        result.paymentData;

      if (
        !paymentUrl ||
        !paymentData
      ) {
        throw new Error(
          "PayFast payment information was not returned."
        );
      }

      // ------------------------------------------------------
      // POST form to PayFast
      // ------------------------------------------------------

      const form =
        document.createElement(
          "form"
        );

      form.method = "POST";
      form.action = paymentUrl;
      form.style.display = "none";

      Object.entries(
        paymentData
      ).forEach(
        ([key, value]) => {
          const input =
            document.createElement(
              "input"
            );

          input.type = "hidden";
          input.name = key;
          input.value =
            String(value ?? "");

          form.appendChild(input);
        }
      );

      document.body.appendChild(
        form
      );

      form.submit();
    } catch (error) {
      console.error(
        "PayFast checkout error:",
        error
      );

      setMessage(
        error.message ||
          "We could not start PayFast checkout."
      );

      setMessageType("error");

      setProcessing(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>

          <h2 style={styles.loadingTitle}>
            Loading payment
          </h2>

          <p style={styles.loadingText}>
            Preparing your GradLink SA
            payment details...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // INVALID PLAN
  // ==========================================================

  if (!plan) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <div style={styles.errorIcon}>
              !
            </div>

            <h1 style={styles.errorTitle}>
              Invalid payment plan
            </h1>

            <p style={styles.errorText}>
              Please return to the pricing
              page and select a valid plan.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/company-pricing"
                )
              }
              style={styles.primaryButton}
            >
              View Plans
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

  const amount = getAmount();

  const isPayPerListing =
    planId === "pay_per_listing";

  const billingLabel =
    isPayPerListing
      ? "One-time payment"
      : billing === "annual"
      ? "Annual billing"
      : "Monthly billing";

  const status = subscription
    ? String(
        subscription.status
      ).toLowerCase()
    : "";

  const formattedAmount =
    amount.toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <header style={styles.header}>
          <button
            onClick={() =>
              router.push(
                "/company-pricing"
              )
            }
            style={styles.backButton}
          >
            ← Back to Plans
          </button>

          <div style={styles.brand}>
            <div style={styles.logo}>
              G
            </div>

            <div>
              <div style={styles.brandName}>
                GradLink SA
              </div>

              <div style={styles.brandSub}>
                Company Payments
              </div>
            </div>
          </div>
        </header>

        {/* ================================================== */}
        {/* TITLE */}
        {/* ================================================== */}

        <section style={styles.titleSection}>
          <div style={styles.secureBadge}>
            🔒 Secure Checkout
          </div>

          <h1 style={styles.title}>
            Complete your payment
          </h1>

          <p style={styles.subtitle}>
            Secure your company access to
            GradLink SA through PayFast.
          </p>
        </section>

        {/* ================================================== */}
        {/* MESSAGE */}
        {/* ================================================== */}

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType ===
              "success"
                ? styles.successMessage
                : {}),
              ...(messageType ===
              "error"
                ? styles.errorMessage
                : {}),
              ...(messageType ===
              "warning"
                ? styles.warningMessage
                : {}),
            }}
          >
            <span style={styles.messageIcon}>
              {messageType ===
              "success"
                ? "✓"
                : messageType ===
                  "error"
                ? "!"
                : "i"}
            </span>

            <div>{message}</div>
          </div>
        )}

        {/* ================================================== */}
        {/* CARD 1 — ORDER SUMMARY */}
        {/* ================================================== */}

        <section style={styles.mainCard}>

          <div style={styles.cardTop}>
            <div>
              <p style={styles.eyebrow}>
                YOUR PLAN
              </p>

              <h2 style={styles.planName}>
                {plan.name}
              </h2>
            </div>

            {plan.popular && (
              <span style={styles.popularBadge}>
                POPULAR
              </span>
            )}
          </div>

          <div style={styles.summaryMain}>

            <div style={styles.priceBlock}>
              <div style={styles.priceLine}>
                <span style={styles.currency}>
                  R
                </span>

                <span style={styles.price}>
                  {formattedAmount}
                </span>
              </div>

              <span style={styles.billingText}>
                {billingLabel}
              </span>
            </div>

            <div style={styles.planDetails}>

              <div style={styles.detailItem}>
                <span style={styles.detailIcon}>
                  ✓
                </span>

                <div>
                  <span style={styles.detailLabel}>
                    Listings included
                  </span>

                  <strong style={styles.detailValue}>
                    {plan.listings}
                  </strong>
                </div>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailIcon}>
                  ✓
                </span>

                <div>
                  <span style={styles.detailLabel}>
                    Billing
                  </span>

                  <strong style={styles.detailValue}>
                    {billingLabel}
                  </strong>
                </div>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailIcon}>
                  ✓
                </span>

                <div>
                  <span style={styles.detailLabel}>
                    Payment provider
                  </span>

                  <strong style={styles.detailValue}>
                    PayFast
                  </strong>
                </div>
              </div>

            </div>
          </div>

          <div style={styles.secureStrip}>
            <span style={styles.secureStripIcon}>
              🔐
            </span>

            <div>
              <strong style={styles.secureStripTitle}>
                Secure payment
              </strong>

              <p style={styles.secureStripText}>
                You will be redirected to
                PayFast to complete your
                payment securely.
              </p>
            </div>
          </div>

        </section>

        {/* ================================================== */}
        {/* CARD 2 — PAYFAST + STATUS */}
        {/* ================================================== */}

        <section style={styles.checkoutCard}>

          <div style={styles.checkoutHeader}>
            <div>
              <p style={styles.checkoutEyebrow}>
                PAYMENT
              </p>

              <h2 style={styles.checkoutTitle}>
                Pay with PayFast
              </h2>

              <p style={styles.checkoutText}>
                Continue to PayFast to securely
                complete your payment.
              </p>
            </div>

            <div style={styles.payfastMark}>
              <span style={styles.payfastP}>
                P
              </span>

              <span>
                PayFast
              </span>
            </div>
          </div>

          <div style={styles.checkoutContent}>

            <div style={styles.paymentMethods}>
              <div style={styles.method}>
                <span>💳</span>
                <span>Card</span>
              </div>

              <div style={styles.method}>
                <span>🏦</span>
                <span>EFT</span>
              </div>

              <div style={styles.method}>
                <span>📱</span>
                <span>Instant EFT</span>
              </div>
            </div>

            <button
              onClick={
                continueToPayFast
              }
              disabled={
                processing ||
                status === "active"
              }
              style={{
                ...styles.payButton,
                ...(processing
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {processing
                ? "Connecting to PayFast..."
                : `Continue to PayFast — R${formattedAmount}`}
            </button>

            {status === "active" && (
              <div style={styles.activeNotice}>
                <span>✓</span>

                <span>
                  This subscription is
                  already active.
                </span>
              </div>
            )}

            <div style={styles.verificationArea}>

              <div>
                <p style={styles.verificationEyebrow}>
                  PAYMENT VERIFICATION
                </p>

                <h3 style={styles.verificationTitle}>
                  Already completed payment?
                </h3>

                <p style={styles.verificationText}>
                  PayFast may take a short
                  moment to send the payment
                  confirmation to GradLink SA.
                </p>
              </div>

              <button
                onClick={
                  checkPaymentStatus
                }
                disabled={checking}
                style={styles.checkButton}
              >
                {checking
                  ? "Checking..."
                  : "Check Payment Status"}
              </button>

            </div>

          </div>

          <div style={styles.disclaimerBox}>
            <span>ℹ</span>

            <p>
              Selecting a plan does not
              activate your company account.
              Access becomes active only
              after PayFast confirms
              successful payment.
            </p>
          </div>

        </section>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <footer style={styles.footer}>

          <div>
            <strong style={styles.footerBrand}>
              GradLink SA
            </strong>

            <span style={styles.footerText}>
              Connecting South African
              graduates with opportunities.
            </span>
          </div>

          <div style={styles.footerRight}>
            🔒 Secure payments powered by PayFast
          </div>

        </footer>

      </div>
    </main>
  );
}

// ============================================================
// SUSPENSE WRAPPER
// ============================================================

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>

            <h2 style={styles.loadingTitle}>
              Loading...
            </h2>
          </div>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
    color: "#102a43",
    fontFamily:
      "Inter, Arial, sans-serif",
    padding:
      "18px 16px 45px",
  },

  container: {
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto",
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
    padding: "5px 0 20px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    padding: "8px 0",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
      "0 7px 18px rgba(37,99,235,0.18)",
  },

  brandName: {
    fontWeight: "900",
    fontSize: "16px",
    color: "#0f172a",
  },

  brandSub: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },

  // ----------------------------------------------------------
  // TITLE
  // ----------------------------------------------------------

  titleSection: {
    textAlign: "center",
    maxWidth: "680px",
    margin: "20px auto 28px",
  },

  secureBadge: {
    display: "inline-block",
    background: "#e8f1ff",
    color: "#1d4ed8",
    padding: "7px 13px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "13px",
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(29px, 5vw, 43px)",
    lineHeight: 1.1,
    letterSpacing: "-1.2px",
    color: "#0f172a",
  },

  subtitle: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  // ----------------------------------------------------------
  // MESSAGE
  // ----------------------------------------------------------

  message: {
    maxWidth: "900px",
    margin: "0 auto 18px",
    padding: "14px 16px",
    borderRadius: "13px",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    fontSize: "13px",
    lineHeight: 1.5,
    border: "1px solid #dbe5f1",
    background: "#ffffff",
  },

  messageIcon: {
    minWidth: "20px",
    fontWeight: "900",
    textAlign: "center",
  },

  successMessage: {
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
    color: "#065f46",
  },

  errorMessage: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },

  warningMessage: {
    background: "#fffbeb",
    borderColor: "#fde68a",
    color: "#92400e",
  },

  // ----------------------------------------------------------
  // CARD 1
  // ----------------------------------------------------------

  mainCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "28px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
  },

  eyebrow: {
    margin: 0,
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    color: "#64748b",
  },

  planName: {
    margin: "7px 0 0",
    fontSize: "27px",
    color: "#0f172a",
  },

  popularBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  summaryMain: {
    display: "grid",
    gridTemplateColumns:
      "minmax(220px, 0.85fr) minmax(0, 1.15fr)",
    gap: "35px",
    alignItems: "center",
    marginTop: "27px",
  },

  priceBlock: {
    paddingRight: "20px",
    borderRight: "1px solid #e2e8f0",
  },

  priceLine: {
    display: "flex",
    alignItems: "baseline",
    color: "#0f172a",
  },

  currency: {
    fontSize: "19px",
    fontWeight: "800",
    marginRight: "4px",
  },

  price: {
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-1.2px",
  },

  billingText: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginTop: "2px",
  },

  planDetails: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  detailItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
  },

  detailIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "900",
    flexShrink: 0,
  },

  detailLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "10px",
    marginBottom: "3px",
  },

  detailValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "13px",
  },

  secureStrip: {
    marginTop: "25px",
    padding: "14px 16px",
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  secureStripIcon: {
    fontSize: "18px",
  },

  secureStripTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "12px",
  },

  secureStripText: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  // ----------------------------------------------------------
  // CARD 2
  // ----------------------------------------------------------

  checkoutCard: {
    marginTop: "18px",
    background:
      "linear-gradient(145deg, #0f2f68 0%, #164e9b 100%)",
    borderRadius: "22px",
    padding: "28px",
    color: "#ffffff",
    boxShadow:
      "0 18px 45px rgba(15,47,104,0.20)",
  },

  checkoutHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    paddingBottom: "23px",
    borderBottom:
      "1px solid rgba(255,255,255,0.15)",
  },

  checkoutEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },

  checkoutTitle: {
    margin: "7px 0 0",
    fontSize: "26px",
    color: "#ffffff",
  },

  checkoutText: {
    margin: "7px 0 0",
    color: "#dbeafe",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  payfastMark: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  payfastP: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#174ea6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "900",
  },

  checkoutContent: {
    paddingTop: "23px",
  },

  paymentMethods: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },

  method: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.15)",
    padding: "9px 12px",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
  },

  payButton: {
    width: "100%",
    marginTop: "19px",
    border: "none",
    borderRadius: "13px",
    padding: "15px 18px",
    background: "#ffffff",
    color: "#174ea6",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.15)",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  activeNotice: {
    marginTop: "13px",
    padding: "11px 13px",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: "12px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    gap: "7px",
  },

  verificationArea: {
    marginTop: "22px",
    paddingTop: "21px",
    borderTop:
      "1px solid rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  verificationEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.3px",
  },

  verificationTitle: {
    margin: "6px 0 0",
    color: "#ffffff",
    fontSize: "17px",
  },

  verificationText: {
    margin: "5px 0 0",
    color: "#bfdbfe",
    fontSize: "11px",
    lineHeight: 1.5,
    maxWidth: "550px",
  },

  checkButton: {
    border:
      "1px solid rgba(255,255,255,0.30)",
    background:
      "rgba(255,255,255,0.10)",
    color: "#ffffff",
    padding: "11px 15px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  disclaimerBox: {
    marginTop: "18px",
    padding: "12px 14px",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.07)",
    display: "flex",
    gap: "9px",
    alignItems: "flex-start",
  },

  disclaimerBox: {
    marginTop: "18px",
    padding: "12px 14px",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.07)",
    display: "flex",
    gap: "9px",
    alignItems: "flex-start",
    color: "#bfdbfe",
  },

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    marginTop: "25px",
    paddingTop: "18px",
    borderTop: "1px solid #dbe5f1",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "11px",
  },

  footerBrand: {
    display: "block",
    color: "#0f172a",
    marginBottom: "3px",
  },

  footerText: {
    display: "block",
  },

  footerRight: {
    textAlign: "right",
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingBox: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px",
  },

  spinner: {
    width: "38px",
    height: "38px",
    border:
      "4px solid #dbeafe",
    borderTop:
      "4px solid #2563eb",
    borderRadius: "50%",
    animation:
      "gradlink-spin 1s linear infinite",
    marginBottom: "18px",
  },

  loadingTitle: {
    margin: 0,
    color: "#0f172a",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "14px",
  },

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  errorBox: {
    maxWidth: "600px",
    margin: "80px auto",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 15px 40px rgba(15,23,42,0.08)",
  },

  errorIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px",
  },

  errorTitle: {
    margin: 0,
    color: "#0f172a",
  },

  errorText: {
    color: "#64748b",
    lineHeight: 1.6,
    margin: "10px 0 22px",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    padding: "13px 22px",
    borderRadius: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

// ============================================================
// RESPONSIVE CSS
// ============================================================

if (
  typeof document !== "undefined"
) {
  const styleId =
    "gradlink-payment-responsive";

  if (
    !document.getElementById(
      styleId
    )
  ) {
    const style =
      document.createElement(
        "style"
      );

    style.id = styleId;

    style.innerHTML = `
      @keyframes gradlink-spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 760px) {

        .gradlink-payment-mobile {
          display: block;
        }

      }

      @media (max-width: 700px) {

        body {
          overflow-x: hidden;
        }

        section {
          box-sizing: border-box;
        }

        /* Top plan card */

        .gradlink-payment-summary {
          grid-template-columns: 1fr !important;
        }

        /* Checkout header */

        .gradlink-checkout-header {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        /* Payment verification */

        .gradlink-verification {
          flex-direction: column !important;
          align-items: stretch !important;
        }

        .gradlink-check-button {
          width: 100% !important;
        }
      }

      @media (max-width: 520px) {

        main {
          padding-left: 11px !important;
          padding-right: 11px !important;
        }

        header {
          align-items: flex-start !important;
        }

        /* Make cards tighter on iPhone */

        section {
          border-radius: 17px !important;
        }

        /* Plan card */

        .gradlink-summary-main {
          display: block !important;
        }

        .gradlink-price-block {
          border-right: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding-right: 0 !important;
          padding-bottom: 20px !important;
        }

        .gradlink-plan-details {
          display: grid !important;
          grid-template-columns: 1fr !important;
          margin-top: 20px !important;
        }

        /* Checkout */

        .gradlink-checkout-card {
          padding: 22px !important;
        }

        .gradlink-main-card {
          padding: 22px !important;
        }

        .gradlink-payfast-mark {
          margin-top: 4px !important;
        }

        .gradlink-payment-methods {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
        }

        .gradlink-payment-methods .gradlink-method:last-child {
          grid-column: 1 / -1;
        }

        .gradlink-footer-right {
          text-align: left !important;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }
}