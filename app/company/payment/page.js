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

  const planId =
    searchParams.get("plan");

  const billing =
    searchParams.get("billing") || "monthly";

  const subscriptionId =
    searchParams.get("subscription");

  const paymentResult =
    searchParams.get("payment");

  const [user, setUser] =
    useState(null);

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

  const plan =
    planId
      ? PLANS[planId]
      : null;

  // ==========================================================
  // GET AMOUNT
  // ==========================================================

  function getAmount() {
    if (!plan) {
      return 0;
    }

    if (
      planId === "pay_per_listing"
    ) {
      return plan.listing;
    }

    if (billing === "annual") {
      return plan.annual;
    }

    return plan.monthly;
  }

  // ==========================================================
  // LOAD USER + EXACT SUBSCRIPTION
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
            `/login?redirect=/company-pricing`
          );

          return;
        }

        setUser(currentUser);

        // ------------------------------------------------------
        // Validate URL parameters
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
        // Get EXACT subscription
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
        // Already active?
        //
        // Pay Per Listing can still be purchased even if
        // another subscription is active.
        // ------------------------------------------------------

        const isActive =
          String(
            subscriptionData.status
          ).toLowerCase() ===
          "active";

        if (
          isActive &&
          planId !== "pay_per_listing"
        ) {
          router.replace(
            "/company"
          );

          return;
        }

        // ------------------------------------------------------
        // Payment return messages
        // ------------------------------------------------------

        if (
          paymentResult ===
          "success"
        ) {
          setMessage(
            "PayFast has returned you to GradLink SA. Your payment is now being verified. Please check the payment status below."
          );

          setMessageType(
            "success"
          );
        }

        if (
          paymentResult ===
          "cancelled"
        ) {
          setMessage(
            "The PayFast payment was cancelled. Your subscription has not been activated."
          );

          setMessageType(
            "error"
          );
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
        console.error(
          error
        );

        setMessage(
          "We could not check your payment status."
        );

        setMessageType(
          "error"
        );

        return;
      }

      if (!data) {
        setMessage(
          "Subscription not found."
        );

        setMessageType(
          "error"
        );

        return;
      }

      setSubscription(data);

      const status =
        String(
          data.status
        ).toLowerCase();

      if (
        status === "active"
      ) {
        setMessage(
          "Payment verified successfully. Your GradLink SA company access is now active."
        );

        setMessageType(
          "success"
        );

        setTimeout(() => {
          router.push(
            "/company"
          );
        }, 1500);

        return;
      }

      setMessage(
        "Payment has not been verified yet. If you have just paid, wait a moment and check again."
      );

      setMessageType(
        "warning"
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Something went wrong while checking your payment."
      );

      setMessageType(
        "error"
      );
    } finally {
      setChecking(false);
    }
  }

  // ==========================================================
  // CONTINUE TO PAYFAST
  // ==========================================================

  async function continueToPayFast() {
    if (
      !user ||
      !subscription
    ) {
      setMessage(
        "Your payment information is not ready yet."
      );

      setMessageType(
        "error"
      );

      return;
    }

    try {
      setProcessing(true);

      setMessage(
        "Preparing secure PayFast checkout..."
      );

      setMessageType("");

      // ------------------------------------------------------
      // Make sure subscription is still inactive
      // ------------------------------------------------------

      const currentStatus =
        String(
          subscription.status
        ).toLowerCase();

      if (
        currentStatus ===
          "active" &&
        planId !==
          "pay_per_listing"
      ) {
        router.push(
          "/company"
        );

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

      // ------------------------------------------------------
      // PayFast URL + payment fields
      // ------------------------------------------------------

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
      // Create a POST form
      //
      // PayFast requires payment fields to be submitted
      // using POST.
      // ------------------------------------------------------

      const form =
        document.createElement(
          "form"
        );

      form.method = "POST";
      form.action =
        paymentUrl;

      form.style.display =
        "none";

      Object.entries(
        paymentData
      ).forEach(
        ([key, value]) => {
          const input =
            document.createElement(
              "input"
            );

          input.type =
            "hidden";

          input.name =
            key;

          input.value =
            String(
              value ?? ""
            );

          form.appendChild(
            input
          );
        }
      );

      document.body.appendChild(
        form
      );

      // ------------------------------------------------------
      // Send company to PayFast
      // ------------------------------------------------------

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

      setMessageType(
        "error"
      );

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

  const amount =
    getAmount();

  const isPayPerListing =
    planId ===
    "pay_per_listing";

  const billingLabel =
    isPayPerListing
      ? "One-time payment"
      : billing ===
        "annual"
      ? "Annual billing"
      : "Monthly billing";

  const status =
    subscription
      ? String(
          subscription.status
        ).toLowerCase()
      : "";

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
            <span>
              {messageType ===
              "success"
                ? "✓"
                : messageType ===
                  "error"
                ? "!"
                : "i"}
            </span>

            <div>
              {message}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* PAYMENT LAYOUT */}
        {/* ================================================== */}

        <div style={styles.paymentGrid}>

          {/* ================================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================================= */}

          <section style={styles.summarySection}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.eyebrow}>
                  ORDER SUMMARY
                </p>

                <h2 style={styles.sectionTitle}>
                  {plan.name}
                </h2>
              </div>

              {plan.popular && (
                <span style={styles.popularBadge}>
                  POPULAR
                </span>
              )}
            </div>

            <div style={styles.priceArea}>
              <span style={styles.currency}>
                R
              </span>

              <span style={styles.price}>
                {amount.toLocaleString(
                  "en-ZA",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            <div style={styles.billingLabel}>
              {billingLabel}
            </div>

            <div style={styles.divider}></div>

            <div style={styles.detailsList}>

              <div style={styles.detailRow}>
                <span>
                  Plan
                </span>

                <strong>
                  {plan.name}
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>
                  Listings included
                </span>

                <strong>
                  {plan.listings}
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>
                  Billing
                </span>

                <strong>
                  {billingLabel}
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>
                  Payment provider
                </span>

                <strong>
                  PayFast
                </strong>
              </div>

            </div>

            <div style={styles.secureNotice}>
              <span style={styles.secureIcon}>
                🔐
              </span>

              <div>
                <strong>
                  Secure payment
                </strong>

                <p>
                  You will be redirected to
                  PayFast to complete your
                  payment securely.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* PAYMENT ACTION */}
          {/* ================================================= */}

          <section style={styles.paymentSection}>

            <div style={styles.paymentTop}>
              <p style={styles.eyebrow}>
                PAYMENT
              </p>

              <h2 style={styles.paymentTitle}>
                Pay with PayFast
              </h2>

              <p style={styles.paymentText}>
                Click the button below to
                continue to the secure PayFast
                checkout.
              </p>
            </div>

            <div style={styles.payfastBox}>
              <div style={styles.payfastLogo}>
                PayFast
              </div>

              <p style={styles.payfastText}>
                South Africa's secure online
                payment platform.
              </p>

              <div style={styles.paymentMethods}>
                <span>
                  💳 Card
                </span>

                <span>
                  🏦 EFT
                </span>

                <span>
                  📱 Instant EFT
                </span>
              </div>
            </div>

            <button
              onClick={
                continueToPayFast
              }
              disabled={
                processing ||
                status ===
                  "active"
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
                : `Continue to PayFast — R${amount.toLocaleString(
                    "en-ZA",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}`}
            </button>

            {status ===
              "active" && (
              <div style={styles.activeNotice}>
                ✓ This subscription is already
                active.
              </div>
            )}

            <p style={styles.disclaimer}>
              Selecting a plan does not activate
              your company account. Your access
              becomes active only after PayFast
              confirms successful payment.
            </p>
          </section>
        </div>

        {/* ================================================== */}
        {/* PAYMENT STATUS */}
        {/* ================================================== */}

        <section style={styles.statusSection}>
          <div>
            <p style={styles.eyebrow}>
              PAYMENT VERIFICATION
            </p>

            <h2 style={styles.statusTitle}>
              Already completed payment?
            </h2>

            <p style={styles.statusText}>
              PayFast may take a short moment to
              send the payment confirmation to
              GradLink SA.
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
        </section>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <footer style={styles.footer}>
          <div>
            <strong>
              GradLink SA
            </strong>

            <span>
              Connecting South African
              graduates with opportunities.
            </span>
          </div>

          <div style={styles.footerRight}>
            Secure payments powered by PayFast
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
      "20px 16px 50px",
  },

  container: {
    width: "100%",
    maxWidth: "1120px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "16px",
    flexWrap: "wrap",
    padding:
      "10px 0 24px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "8px 0",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: "900",
    boxShadow:
      "0 8px 20px rgba(37,99,235,0.20)",
  },

  brandName: {
    fontWeight: "900",
    fontSize: "17px",
    color: "#0f172a",
  },

  brandSub: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },

  titleSection: {
    textAlign: "center",
    maxWidth: "700px",
    margin:
      "24px auto 34px",
  },

  secureBadge: {
    display: "inline-block",
    background: "#e8f1ff",
    color: "#1d4ed8",
    padding:
      "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(30px, 5vw, 46px)",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    color: "#0f172a",
  },

  subtitle: {
    margin:
      "14px 0 0",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: 1.6,
  },

  message: {
    maxWidth: "900px",
    margin:
      "0 auto 24px",
    padding:
      "15px 17px",
    borderRadius: "14px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    fontSize: "14px",
    lineHeight: 1.5,
    border:
      "1px solid #dbe5f1",
    background: "#ffffff",
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

  paymentGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "22px",
    alignItems: "stretch",
  },

  summarySection: {
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "28px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.06)",
  },

  paymentSection: {
    background:
      "linear-gradient(145deg, #0f2f68, #164e9b)",
    borderRadius: "22px",
    padding: "28px",
    color: "#ffffff",
    boxShadow:
      "0 18px 45px rgba(15,47,104,0.20)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  eyebrow: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    color: "#64748b",
  },

  sectionTitle: {
    margin:
      "8px 0 0",
    fontSize: "27px",
    color: "#0f172a",
  },

  popularBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding:
      "7px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "900",
  },

  priceArea: {
    display: "flex",
    alignItems: "baseline",
    marginTop: "28px",
    color: "#0f172a",
  },

  currency: {
    fontSize: "20px",
    fontWeight: "800",
    marginRight: "4px",
  },

  price: {
    fontSize: "44px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  billingLabel: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "3px",
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin:
      "24px 0",
  },

  detailsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  detailRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    fontSize: "14px",
    color: "#64748b",
  },

  secureNotice: {
    marginTop: "26px",
    padding: "15px",
    background: "#f8fbff",
    border:
      "1px solid #dbeafe",
    borderRadius: "14px",
    display: "flex",
    gap: "11px",
    alignItems: "flex-start",
  },

  secureIcon: {
    fontSize: "18px",
  },

  secureNoticeStrong: {
    fontWeight: "800",
  },

  secureNoticeP: {
    margin:
      "4px 0 0",
  },

  paymentTop: {
    marginBottom: "24px",
  },

  paymentTitle: {
    margin:
      "8px 0 0",
    fontSize: "28px",
  },

  paymentText: {
    margin:
      "10px 0 0",
    color: "#dbeafe",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  payfastBox: {
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "17px",
    padding: "20px",
  },

  payfastLogo: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#ffffff",
  },

  payfastText: {
    color: "#dbeafe",
    fontSize: "13px",
    margin:
      "7px 0 16px",
    lineHeight: 1.5,
  },

  paymentMethods: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  payButton: {
    width: "100%",
    marginTop: "20px",
    border: "none",
    borderRadius: "13px",
    padding:
      "15px 18px",
    background: "#ffffff",
    color: "#174ea6",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.14)",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  activeNotice: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: "13px",
    textAlign: "center",
  },

  disclaimer: {
    margin:
      "17px 0 0",
    color: "#bfdbfe",
    fontSize: "11px",
    lineHeight: 1.6,
    textAlign: "center",
  },

  statusSection: {
    marginTop: "22px",
    padding: "24px 28px",
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },

  statusTitle: {
    margin:
      "7px 0 0",
    fontSize: "20px",
    color: "#0f172a",
  },

  statusText: {
    margin:
      "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
    maxWidth: "650px",
  },

  checkButton: {
    border:
      "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding:
      "12px 17px",
    borderRadius: "11px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  footer: {
    marginTop: "30px",
    padding:
      "20px 0 0",
    borderTop:
      "1px solid #dbe5f1",
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "12px",
  },

  footerRight: {
    textAlign: "right",
  },

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
      "spin 1s linear infinite",
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

  errorBox: {
    maxWidth: "600px",
    margin:
      "80px auto",
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 15px 40px rgba(15,23,42,0.08)",
  },

  errorIcon: {
    width: "50px",
    height: "50px",
    margin:
      "0 auto 18px",
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
    margin:
      "10px 0 22px",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    padding:
      "13px 22px",
    borderRadius: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

// ============================================================
// MOBILE RESPONSIVE STYLE
// ============================================================

if (
  typeof document !==
  "undefined"
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
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 760px) {
        main {
          padding-left: 12px !important;
          padding-right: 12px !important;
        }

        header {
          align-items: flex-start !important;
        }

        .gradlink-payment-grid {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 760px) {
        section {
          box-sizing: border-box;
        }
      }

      @media (max-width: 520px) {
        body {
          overflow-x: hidden;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }
}