"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// GRADLINK SA COMPANY PLANS
// ============================================================

const PLANS = {
  starter: {
    key: "starter",
    name: "Starter",
    monthly: 500,
    annual: 5000,
    listings: 5,
    description:
      "A simple way for growing companies to start recruiting graduates.",
    icon: "rocket",
    features: [
      "5 active internship listings",
      "Graduate applications",
      "Applicant management",
      "Company profile",
    ],
  },

  professional: {
    key: "professional",
    name: "Professional",
    monthly: 950,
    annual: 9500,
    listings: 15,
    description:
      "Built for companies actively recruiting and managing more graduates.",
    popular: true,
    icon: "bolt",
    features: [
      "15 active internship listings",
      "Graduate applications",
      "Applicant management",
      "AI applicant matching",
      "Document verification features",
      "Company profile",
    ],
  },

  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    description:
      "Designed for companies with larger graduate recruitment needs.",
    icon: "building",
    features: [
      "30 active internship listings",
      "Graduate applications",
      "Applicant management",
      "AI applicant matching",
      "Document verification features",
      "Priority recruitment capacity",
    ],
  },

  pay_per_listing: {
    key: "pay_per_listing",
    name: "Pay Per Listing",
    price: 250,
    listings: 1,
    description:
      "A flexible option when you only need to publish one listing.",
    payPerListing: true,
    icon: "target",
    features: [
      "1 internship listing",
      "Receive graduate applications",
      "Applicant management",
      "No monthly subscription",
    ],
  },
};

function formatMoney(amount) {
  return `R${Number(amount).toLocaleString("en-ZA")}`;
}

// ============================================================
// SIMPLE PROFESSIONAL ICONS
// ============================================================

function PlanIcon({ type }) {
  if (type === "rocket") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="plan-svg"
      >
        <path
          d="M14.5 5.5c1.7-1.7 3.8-2.7 6-3 .3 2.2-.6 4.3-2.3 6l-2.7 2.7-3.2-3.2 2.2-2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m12.3 8-4.6 1.1-2.2 2.2 4.3.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m15.8 11.5-1.1 4.6-2.2 2.2-.9-4.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="16.9"
          cy="7.1"
          r="1.4"
          fill="currentColor"
        />
        <path
          d="M8.2 15.8c-1.4.2-2.6.8-3.6 1.8-.6.6-.9 1.4-1 2.2 1-.1 1.7-.4 2.3-1 1-.9 1.6-2.1 1.8-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "bolt") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="plan-svg"
      >
        <path
          d="M13.1 2.8 5.8 13h5.6l-.5 8.2L18.2 11h-5.5l.4-8.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "building") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="plan-svg"
      >
        <path
          d="M4 21V6.5L12 3l8 3.5V21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 9h1M8 13h1M8 17h1M15 9h1M15 13h1M15 17h1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.5 21v-4h3v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="plan-svg"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9 3.9-1.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

// ============================================================
// CHECK ICON
// ============================================================

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="check-svg"
    >
      <path
        d="m5 10.2 3.1 3.1L15.2 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// ARROW ICON
// ============================================================

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="arrow-svg"
    >
      <path
        d="M4 10h11M11 5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// LOCK ICON
// ============================================================

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="lock-svg"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="15.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

// ============================================================
// PLAN CARD
// ============================================================

function PlanCard({
  plan,
  billing,
  onSelect,
  loading,
}) {
  const isPayPerListing =
    plan.payPerListing === true;

  const price = isPayPerListing
    ? plan.price
    : billing === "annual"
      ? plan.annual
      : plan.monthly;

  const billingLabel = isPayPerListing
    ? "once"
    : billing === "annual"
      ? "per year"
      : "per month";

  return (
    <article
      className={`plan-card ${
        plan.popular
          ? "plan-card-popular"
          : ""
      } ${
        isPayPerListing
          ? "plan-card-flexible"
          : ""
      }`}
    >
      {plan.popular && (
        <div className="popular-badge">
          <span className="popular-star">
            ★
          </span>
          MOST POPULAR
        </div>
      )}

      <div className="plan-content">

        {/* PLAN HEADER */}

        <div className="plan-heading">

          <div className="plan-icon">
            <PlanIcon type={plan.icon} />
          </div>

          <div className="plan-title-row">
            <h2>{plan.name}</h2>

            {isPayPerListing && (
              <span className="flexible-label">
                FLEXIBLE
              </span>
            )}
          </div>

          <p className="plan-description">
            {plan.description}
          </p>

        </div>

        {/* PRICE */}

        <div className="price-area">

          <div className="price-line">

            <span className="price">
              {formatMoney(price)}
            </span>

            <span className="price-period">
              {billingLabel}
            </span>

          </div>

          {!isPayPerListing &&
            billing === "annual" && (
              <div className="saving-badge">
                SAVE 2 MONTHS
              </div>
            )}

        </div>

        {/* LISTING CAPACITY */}

        <div className="listing-limit">

          <span className="listing-icon">
            <CheckIcon />
          </span>

          <div>
            <strong>
              {plan.listings}
            </strong>{" "}
            active{" "}
            {plan.listings === 1
              ? "listing"
              : "listings"}
          </div>

        </div>

        {/* FEATURES */}

        <div className="features">

          <div className="features-label">
            INCLUDED
          </div>

          {plan.features.map(
            (feature, index) => (
              <div
                key={index}
                className="feature-row"
              >
                <span className="feature-check">
                  <CheckIcon />
                </span>

                <span>{feature}</span>
              </div>
            )
          )}

        </div>

      </div>

      {/* BUTTON */}

      <div className="plan-action">

        <button
          type="button"
          onClick={() =>
            onSelect(plan.key)
          }
          disabled={loading}
          className={`plan-button ${
            plan.popular
              ? "plan-button-primary"
              : "plan-button-secondary"
          }`}
        >

          <span>
            {loading
              ? "Please wait..."
              : isPayPerListing
                ? "Publish a Listing"
                : "Choose Plan"}
          </span>

          {!loading && (
            <ArrowIcon />
          )}

        </button>

      </div>

    </article>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] =
    useState("monthly");

  const [user, setUser] =
    useState(null);

  const [
    currentSubscription,
    setCurrentSubscription,
  ] = useState(null);

  const [loadingPlan, setLoadingPlan] =
    useState(null);

  const [message, setMessage] =
    useState("");

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (user) {
          setUser(user);

          const { data } =
            await supabase
              .from("company_subscriptions")
              .select("*")
              .eq(
                "company_id",
                user.id
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(1);

          if (
            mounted &&
            data &&
            data.length > 0
          ) {
            setCurrentSubscription(
              data[0]
            );
          }
        }
      } catch (error) {
        console.error(
          "Unable to load company:",
          error
        );
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // SELECT PLAN
  // ==========================================================

  async function continueToPayment(
    planKey
  ) {
    try {
      setMessage("");
      setLoadingPlan(planKey);

      let currentUser = user;

      if (!currentUser) {
        const {
          data: {
            user: loggedInUser,
          },
        } =
          await supabase.auth.getUser();

        currentUser =
          loggedInUser;

        if (currentUser) {
          setUser(currentUser);
        }
      }

      // ------------------------------------------------------
      // NOT LOGGED IN
      // ------------------------------------------------------

      if (!currentUser) {
        router.push(
          "/signup?role=company&redirect=/company-pricing"
        );

        return;
      }

      const selectedPlan =
        PLANS[planKey];

      if (!selectedPlan) {
        setMessage(
          "Invalid plan selected."
        );

        return;
      }

      const selectedBilling =
        selectedPlan.payPerListing
          ? "listing"
          : billing;

      // ------------------------------------------------------
      // CHECK ACTIVE SUBSCRIPTION
      // ------------------------------------------------------

      const {
        data: activeSubscription,
        error: activeError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq(
          "company_id",
          currentUser.id
        )
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (activeError) {
        console.error(
          "Active subscription check:",
          activeError
        );
      }

      if (
        activeSubscription &&
        activeSubscription.length > 0 &&
        !selectedPlan.payPerListing
      ) {
        router.push("/company");
        return;
      }

      // ------------------------------------------------------
      // PRICE
      // ------------------------------------------------------

      const amount =
        selectedPlan.payPerListing
          ? selectedPlan.price
          : selectedBilling === "annual"
            ? selectedPlan.annual
            : selectedPlan.monthly;

      // ------------------------------------------------------
      // FIND EXISTING INACTIVE SUBSCRIPTION
      // ------------------------------------------------------

      const {
        data: existingPending,
        error: pendingError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq(
          "company_id",
          currentUser.id
        )
        .eq("status", "inactive")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (pendingError) {
        console.error(
          "Pending subscription check:",
          pendingError
        );
      }

      let subscriptionId = null;

      // ------------------------------------------------------
      // UPDATE EXISTING PENDING SUBSCRIPTION
      // ------------------------------------------------------

      if (
        existingPending &&
        existingPending.length > 0
      ) {
        const pending =
          existingPending[0];

        const {
          data: updatedSubscription,
          error: updateError,
        } = await supabase
          .from("company_subscriptions")
          .update({
            plan: planKey,
            monthly_price: amount,
            payment_provider:
              "payfast",
            payment_reference: null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", pending.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        subscriptionId =
          updatedSubscription.id;
      }

      // ------------------------------------------------------
      // CREATE NEW PENDING SUBSCRIPTION
      // ------------------------------------------------------

      else {
        const {
          data: newSubscription,
          error: insertError,
        } = await supabase
          .from("company_subscriptions")
          .insert({
            company_id:
              currentUser.id,
            plan: planKey,
            status: "inactive",
            monthly_price: amount,
            payment_provider:
              "payfast",
            payment_reference: null,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        subscriptionId =
          newSubscription.id;
      }

      // ------------------------------------------------------
      // SEND TO PAYMENT PAGE
      // ------------------------------------------------------

      const params =
        new URLSearchParams({
          plan: planKey,
          billing:
            selectedBilling,
          subscription:
            String(subscriptionId),
        });

      router.push(
        `/company/payment?${params.toString()}`
      );
    } catch (error) {
      console.error(
        "Plan selection error:",
        error
      );

      setMessage(
        error?.message ||
          "Unable to continue. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  // ==========================================================
  // ACTIVE SUBSCRIPTION
  // ==========================================================

  const active =
    currentSubscription &&
    String(
      currentSubscription.status
    ).toLowerCase() === "active";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="pricing-page">

      <div className="pricing-background-shape shape-one" />
      <div className="pricing-background-shape shape-two" />

      <div className="pricing-shell">

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <header className="pricing-nav">

          <button
            type="button"
            className="brand"
            onClick={() =>
              router.push("/")
            }
            aria-label="Go to GradLink SA home"
          >

            <span className="brand-mark">
              G
            </span>

            <span className="brand-name">
              <strong>
                GradLink
              </strong>

              <small>
                SA
              </small>
            </span>

          </button>

          <button
            type="button"
            className="back-button"
            onClick={() =>
              router.back()
            }
          >
            <span className="back-arrow">
              ←
            </span>

            <span>
              Back
            </span>
          </button>

        </header>

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero">

          <div className="hero-badge">
            <span className="hero-badge-dot" />

            <span>
              GRADLINK SA FOR COMPANIES
            </span>
          </div>

          <h1>
            Find the right graduates.
            <span>
              Build your team.
            </span>
          </h1>

          <p className="hero-description">
            Give your company the tools to
            discover, connect with and recruit
            qualified South African graduates.
          </p>

          <div className="hero-points">

            <div>
              <span>
                <CheckIcon />
              </span>
              Publish internships
            </div>

            <div>
              <span>
                <CheckIcon />
              </span>
              Receive applications
            </div>

            <div>
              <span>
                <CheckIcon />
              </span>
              Discover graduate talent
            </div>

          </div>

        </section>

        {/* ==================================================
            ACTIVE PLAN
        ================================================== */}

        {active && (
          <div className="active-banner">

            <div className="active-icon">
              <CheckIcon />
            </div>

            <div className="active-copy">

              <strong>
                Your plan is active
              </strong>

              <span>
                {String(
                  currentSubscription.plan
                ).toUpperCase()}{" "}
                subscription
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/company")
              }
            >
              <span>
                Go to Dashboard
              </span>

              <ArrowIcon />
            </button>

          </div>
        )}

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (
          <div className="error-message">

            <span className="error-icon">
              !
            </span>

            <span>
              {message}
            </span>

          </div>
        )}

        {/* ==================================================
            BILLING SECTION
        ================================================== */}

        <section className="billing-section">

          <div className="billing-copy">

            <div className="section-eyebrow">
              PLANS & PRICING
            </div>

            <h2>
              Choose your billing
            </h2>

            <p>
              Save 2 months with annual
              billing.
            </p>

          </div>

          <div className="billing-toggle">

            <button
              type="button"
              className={
                billing === "monthly"
                  ? "billing-active"
                  : ""
              }
              onClick={() =>
                setBilling("monthly")
              }
            >
              Monthly
            </button>

            <button
              type="button"
              className={
                billing === "annual"
                  ? "billing-active"
                  : ""
              }
              onClick={() =>
                setBilling("annual")
              }
            >
              <span>
                Annual
              </span>

              <small>
                SAVE 2 MONTHS
              </small>
            </button>

          </div>

        </section>

        {/* ==================================================
            PLANS
        ================================================== */}

        <section className="plans-section">

          <PlanCard
            plan={PLANS.starter}
            billing={billing}
            onSelect={
              continueToPayment
            }
            loading={
              loadingPlan ===
              "starter"
            }
          />

          <PlanCard
            plan={PLANS.professional}
            billing={billing}
            onSelect={
              continueToPayment
            }
            loading={
              loadingPlan ===
              "professional"
            }
          />

          <PlanCard
            plan={PLANS.enterprise}
            billing={billing}
            onSelect={
              continueToPayment
            }
            loading={
              loadingPlan ===
              "enterprise"
            }
          />

          <PlanCard
            plan={
              PLANS.pay_per_listing
            }
            billing={billing}
            onSelect={
              continueToPayment
            }
            loading={
              loadingPlan ===
              "pay_per_listing"
            }
          />

        </section>

        {/* ==================================================
            TRUST / PAYMENT
        ================================================== */}

        <section className="trust-section">

          <div className="trust-card">

            <div className="trust-icon">
              <LockIcon />
            </div>

            <div className="trust-copy">

              <div className="trust-title-row">

                <strong>
                  Secure payments with PayFast
                </strong>

                <span className="secure-label">
                  SECURE
                </span>

              </div>

              <p>
                Your payment is processed
                securely through PayFast.
                Your GradLink SA company
                plan becomes active only
                after successful payment
                verification.
              </p>

            </div>

          </div>

          <div className="trust-items">

            <div>
              <span>
                <CheckIcon />
              </span>
              Secure payment processing
            </div>

            <div>
              <span>
                <CheckIcon />
              </span>
              Paid company plans
            </div>

            <div>
              <span>
                <CheckIcon />
              </span>
              Upgrade as you grow
            </div>

          </div>

        </section>

        {/* ==================================================
            INFORMATION
        ================================================== */}

        <section className="info-section">

          <div className="info-heading">

            <div className="section-eyebrow">
              HOW IT WORKS
            </div>

            <h2>
              Start recruiting in three
              simple steps.
            </h2>

            <p>
              Choose your recruitment capacity,
              complete your payment and start
              connecting with graduate talent
              after payment verification.
            </p>

          </div>

          <div className="info-grid">

            <div className="info-item">

              <div className="info-number">
                01
              </div>

              <div className="info-content">

                <h3>
                  Choose your plan
                </h3>

                <p>
                  Select the plan that matches
                  the number of active
                  internship listings your
                  company needs.
                </p>

              </div>

            </div>

            <div className="info-item">

              <div className="info-number">
                02
              </div>

              <div className="info-content">

                <h3>
                  Complete payment
                </h3>

                <p>
                  Continue to PayFast and
                  securely complete payment
                  for your selected plan.
                </p>

              </div>

            </div>

            <div className="info-item">

              <div className="info-number">
                03
              </div>

              <div className="info-content">

                <h3>
                  Start recruiting
                </h3>

                <p>
                  Once payment is verified,
                  your company subscription
                  becomes active and your
                  recruitment tools become
                  available.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="pricing-footer">

          <div className="footer-brand">

            <span className="footer-mark">
              G
            </span>

            <div>

              <strong>
                GradLink SA
              </strong>

              <span>
                Connecting South African
                graduates with opportunity.
              </span>

            </div>

          </div>

          <div className="footer-note">

            <span>
              ©{" "}
              {new Date().getFullYear()}{" "}
              GradLink SA
            </span>

            <span>
              Companies require a paid plan.
            </span>

          </div>

        </footer>

      </div>

            <style jsx>{`

        /* ==================================================
           GLOBAL
        ================================================== */

        * {
          box-sizing: border-box;
        }

        .pricing-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% -15%,
              rgba(37, 99, 235, 0.14),
              transparent 38%
            ),
            linear-gradient(
              180deg,
              #f8fbff 0%,
              #f8fafc 45%,
              #ffffff 100%
            );
          color: #0f172a;
          padding: 0 18px 70px;
        }

        .pricing-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .pricing-background-shape {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(2px);
          opacity: 0.55;
        }

        .shape-one {
          width: 320px;
          height: 320px;
          top: 220px;
          left: -220px;
          background: rgba(59, 130, 246, 0.08);
        }

        .shape-two {
          width: 280px;
          height: 280px;
          top: 720px;
          right: -180px;
          background: rgba(14, 165, 233, 0.07);
        }

        button {
          font-family: inherit;
        }

        /* ==================================================
           NAVIGATION
        ================================================== */

        .pricing-nav {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid
            rgba(148, 163, 184, 0.18);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          color: #0f172a;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background:
            linear-gradient(
              145deg,
              #3b82f6,
              #1d4ed8
            );
          color: white;
          font-size: 20px;
          font-weight: 950;
          box-shadow:
            0 9px 22px
              rgba(37, 99, 235, 0.25);
        }

        .brand-name {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .brand-name strong {
          font-weight: 950;
        }

        .brand-name small {
          color: #2563eb;
          font-size: 11px;
          font-weight: 950;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dbe3ef;
          background: rgba(255, 255, 255, 0.92);
          color: #334155;
          padding: 10px 15px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .back-button:hover {
          border-color: #93c5fd;
          color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow:
            0 6px 15px
              rgba(15, 23, 42, 0.05);
        }

        .back-arrow {
          font-size: 17px;
          line-height: 1;
        }

        /* ==================================================
           HERO
        ================================================== */

        .hero {
          max-width: 850px;
          margin: 0 auto;
          padding: 72px 0 52px;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 14px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background:
            rgba(239, 246, 255, 0.82);
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .hero-badge-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #2563eb;
          box-shadow:
            0 0 0 4px
              rgba(37, 99, 235, 0.10);
        }

        .hero h1 {
          margin: 23px 0 0;
          color: #0f172a;
          font-size: clamp(
            42px,
            7vw,
            70px
          );
          line-height: 1.01;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .hero h1 span {
          display: block;
          color: #2563eb;
        }

        .hero-description {
          max-width: 680px;
          margin: 23px auto 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.75;
        }

        .hero-points {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 25px;
          margin-top: 29px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .hero-points div {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .hero-points span {
          width: 21px;
          height: 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
        }

        .hero-points .check-svg {
          width: 13px;
          height: 13px;
        }

        /* ==================================================
           ACTIVE PLAN
        ================================================== */

        .active-banner {
          max-width: 900px;
          margin: 0 auto 35px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 17px;
          border: 1px solid #86efac;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #f0fdf4,
              #f7fff9
            );
          box-shadow:
            0 8px 25px
              rgba(22, 163, 74, 0.06);
        }

        .active-icon {
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #16a34a;
          color: white;
        }

        .active-icon .check-svg {
          width: 21px;
          height: 21px;
        }

        .active-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .active-copy strong {
          color: #166534;
          font-size: 14px;
          font-weight: 900;
        }

        .active-copy span {
          color: #15803d;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.04em;
        }

        .active-banner button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          border: none;
          background: transparent;
          color: #15803d;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .active-banner button:hover {
          color: #166534;
        }

        .active-banner button .arrow-svg {
          width: 16px;
          height: 16px;
        }

        /* ==================================================
           ERROR MESSAGE
        ================================================== */

        .error-message {
          max-width: 800px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 17px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 750;
          text-align: center;
        }

        .error-icon {
          width: 21px;
          height: 21px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dc2626;
          color: white;
          font-size: 12px;
          font-weight: 950;
        }

        /* ==================================================
           BILLING SECTION
        ================================================== */

        .billing-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin: 8px 0 30px;
          padding: 22px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background:
            rgba(255, 255, 255, 0.86);
          box-shadow:
            0 12px 35px
              rgba(15, 23, 42, 0.045);
        }

        .billing-copy {
          min-width: 0;
        }

        .section-eyebrow {
          color: #2563eb;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.13em;
        }

        .billing-section h2 {
          margin: 5px 0 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .billing-section p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .billing-toggle {
          flex: 0 0 auto;
          display: flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #f1f5f9;
        }

        .billing-toggle button {
          min-width: 105px;
          min-height: 43px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .billing-toggle button.billing-active {
          background: #2563eb;
          color: white;
          box-shadow:
            0 6px 15px
              rgba(37, 99, 235, 0.19);
        }

        .billing-toggle button span {
          display: block;
        }

        .billing-toggle button small {
          display: block;
          margin-top: 2px;
          color: #16a34a;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.04em;
        }

        .billing-toggle button.billing-active small {
          color: #dcfce7;
        }

        /* ==================================================
           PLANS GRID
        ================================================== */

        .plans-section {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          align-items: stretch;
          gap: 17px;
        }

        /* ==================================================
           PLAN CARD
        ================================================== */

        .plan-card {
          position: relative;
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background:
            rgba(255, 255, 255, 0.97);
          box-shadow:
            0 12px 34px
              rgba(15, 23, 42, 0.055);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .plan-card:hover {
          transform: translateY(-4px);
          border-color: #bfdbfe;
          box-shadow:
            0 22px 48px
              rgba(15, 23, 42, 0.09);
        }

        .plan-card-popular {
          border: 2px solid #2563eb;
          box-shadow:
            0 20px 52px
              rgba(37, 99, 235, 0.14);
        }

        .plan-card-popular:hover {
          border-color: #2563eb;
          box-shadow:
            0 25px 58px
              rgba(37, 99, 235, 0.18);
        }

        .plan-card-flexible {
          background:
            linear-gradient(
              180deg,
              #ffffff,
              #fbfdff
            );
        }

        .popular-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          z-index: 4;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 26px;
          padding: 6px 13px;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
          color: white;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.07em;
          white-space: nowrap;
          box-shadow:
            0 8px 18px
              rgba(37, 99, 235, 0.25);
        }

        .popular-star {
          font-size: 10px;
        }

        .plan-content {
          flex: 1;
          min-width: 0;
        }

        /* ==================================================
           PLAN HEADER
        ================================================== */

        .plan-heading {
          min-width: 0;
        }

        .plan-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 17px;
          border: 1px solid #dbeafe;
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              #eff6ff,
              #f8fbff
            );
          color: #2563eb;
        }

        .plan-svg {
          width: 22px;
          height: 22px;
        }

        .plan-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .plan-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          font-weight: 950;
          letter-spacing: -0.025em;
        }

        .flexible-label {
          padding: 4px 7px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #f8fafc;
          color: #64748b;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.07em;
        }

        .plan-description {
          min-height: 66px;
          margin: 9px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
        }

        /* ==================================================
           PRICE
        ================================================== */

        .price-area {
          min-height: 83px;
          margin-top: 18px;
        }

        .price-line {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
        }

        .price {
          color: #0f172a;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.045em;
        }

        .price-period {
          color: #64748b;
          font-size: 11px;
          font-weight: 750;
        }

        .saving-badge {
          display: inline-flex;
          margin-top: 9px;
          padding: 5px 8px;
          border: 1px solid #bbf7d0;
          border-radius: 7px;
          background: #f0fdf4;
          color: #15803d;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.05em;
        }

        /* ==================================================
           LISTING CAPACITY
        ================================================== */

        .listing-limit {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 8px;
          padding: 11px;
          border: 1px solid #dbeafe;
          border-radius: 11px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
        }

        .listing-limit strong {
          font-weight: 950;
        }

        .listing-icon {
          width: 22px;
          height: 22px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
        }

        .listing-icon .check-svg {
          width: 13px;
          height: 13px;
        }

        /* ==================================================
           FEATURES
        ================================================== */

        .features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .features-label {
          margin-bottom: 1px;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.12em;
        }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
          color: #475569;
          font-size: 11px;
          line-height: 1.5;
        }

        .feature-check {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 17px;
          height: 17px;
          margin-top: -1px;
          border-radius: 50%;
          background: #f0fdf4;
          color: #16a34a;
        }

        .check-svg {
          width: 12px;
          height: 12px;
        }

        /* ==================================================
           PLAN BUTTON
        ================================================== */

        .plan-action {
          margin-top: 25px;
        }

        .plan-button {
          width: 100%;
          min-height: 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 11px;
          padding: 12px 15px;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .plan-button:disabled {
          opacity: 0.58;
          cursor: not-allowed;
          transform: none;
        }

        .plan-button-primary {
          border: 1px solid #2563eb;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
          color: white;
          box-shadow:
            0 9px 20px
              rgba(37, 99, 235, 0.19);
        }

        .plan-button-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          background:
            linear-gradient(
              135deg,
              #1d4ed8,
              #1e40af
            );
          box-shadow:
            0 12px 25px
              rgba(37, 99, 235, 0.25);
        }

        .plan-button-secondary {
          border: 1px solid #dbeafe;
          background: #f8fafc;
          color: #1e3a8a;
        }

        .plan-button-secondary:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .arrow-svg {
          width: 17px;
          height: 17px;
        }

        /* ==================================================
           TRUST SECTION
        ================================================== */

        .trust-section {
          margin-top: 46px;
          padding: 25px;
          border: 1px solid #e2e8f0;
          border-radius: 19px;
          background:
            linear-gradient(
              135deg,
              #f8fafc,
              #ffffff
            );
        }

        .trust-card {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .trust-icon {
          width: 47px;
          height: 47px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #bbf7d0;
          border-radius: 13px;
          background: #f0fdf4;
          color: #15803d;
        }

        .lock-svg {
          width: 22px;
          height: 22px;
        }

        .trust-copy {
          min-width: 0;
        }

        .trust-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .trust-card strong {
          color: #0f172a;
          font-size: 14px;
          font-weight: 950;
        }

        .secure-label {
          padding: 3px 6px;
          border-radius: 5px;
          background: #dcfce7;
          color: #15803d;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.07em;
        }

        .trust-card p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.65;
        }

        .trust-items {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 28px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 800;
        }

        .trust-items div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trust-items span {
          width: 17px;
          height: 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
        }

        .trust-items .check-svg {
          width: 11px;
          height: 11px;
        }

        /* ==================================================
           INFORMATION
        ================================================== */

        .info-section {
          margin-top: 70px;
          padding: 50px 0;
          border-top: 1px solid #e2e8f0;
        }

        .info-heading {
          max-width: 650px;
          margin-bottom: 34px;
        }

        .info-heading h2 {
          max-width: 620px;
          margin: 8px 0 10px;
          color: #0f172a;
          font-size: 31px;
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.035em;
        }

        .info-heading p {
          max-width: 600px;
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .info-item {
          min-width: 0;
          display: flex;
          gap: 15px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow:
            0 8px 25px
              rgba(15, 23, 42, 0.035);
        }

        .info-number {
          flex: 0 0 auto;
          color: #2563eb;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.05em;
        }

        .info-content {
          min-width: 0;
        }

        .info-item h3 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 950;
        }

        .info-item p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.65;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .pricing-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding-top: 28px;
          border-top: 1px solid #e2e8f0;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .footer-mark {
          width: 35px;
          height: 35px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background:
            linear-gradient(
              145deg,
              #2563eb,
              #1d4ed8
            );
          color: white;
          font-size: 15px;
          font-weight: 950;
        }

        .footer-brand > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-brand strong {
          color: #0f172a;
          font-size: 12px;
          font-weight: 950;
        }

        .footer-brand span {
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.4;
        }

        .footer-note {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          color: #94a3b8;
          font-size: 9px;
          text-align: right;
        }

        /* ==================================================
           TABLET
        ================================================== */

        @media (max-width: 1100px) {

          .plans-section {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .plan-card {
            min-height: 100%;
          }

          .plan-description {
            min-height: auto;
          }

          .price-area {
            min-height: auto;
          }

        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .pricing-page {
            padding:
              0 12px
              45px;
          }

          .pricing-shell {
            max-width: 100%;
          }

          /* ----------------------------------------------
             NAV
          ---------------------------------------------- */

          .pricing-nav {
            min-height: 67px;
          }

          .brand {
            gap: 8px;
          }

          .brand-mark {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            font-size: 18px;
          }

          .brand-name {
            font-size: 16px;
          }

          .brand-name small {
            font-size: 10px;
          }

          .back-button {
            min-height: 37px;
            padding:
              8px 11px;
            font-size: 11px;
          }

          .back-arrow {
            font-size: 15px;
          }

          /* ----------------------------------------------
             HERO
          ---------------------------------------------- */

          .hero {
            padding:
              48px 4px
              36px;
          }

          .hero-badge {
            max-width: 100%;
            padding:
              7px 11px;
            font-size: 8px;
            letter-spacing: 0.07em;
          }

          .hero h1 {
            margin-top: 20px;
            font-size: 41px;
            line-height: 1.03;
            letter-spacing: -0.055em;
          }

          .hero-description {
            max-width: 500px;
            margin-top: 18px;
            font-size: 13px;
            line-height: 1.7;
          }

          .hero-points {
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin-top: 23px;
            font-size: 11px;
          }

          /* ----------------------------------------------
             ACTIVE PLAN
          ---------------------------------------------- */

          .active-banner {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 11px;
            margin-bottom: 26px;
            padding: 14px;
            border-radius: 14px;
          }

          .active-icon {
            width: 37px;
            height: 37px;
            border-radius: 10px;
          }

          .active-copy strong {
            font-size: 12px;
          }

          .active-copy span {
            font-size: 9px;
          }

          .active-banner button {
            width: 100%;
            min-height: 38px;
            justify-content: flex-start;
            padding:
              8px 0 0
              48px;
            border-top: 1px solid
              rgba(22, 101, 52, 0.12);
            font-size: 11px;
          }

          /* ----------------------------------------------
             BILLING
          ---------------------------------------------- */

          .billing-section {
            flex-direction: column;
            align-items: stretch;
            gap: 17px;
            margin-bottom: 27px;
            padding: 18px;
            border-radius: 16px;
          }

          .billing-copy {
            text-align: center;
          }

          .billing-section h2 {
            font-size: 16px;
          }

          .billing-section p {
            font-size: 11px;
          }

          .billing-toggle {
            width: 100%;
          }

          .billing-toggle button {
            flex: 1;
            min-width: 0;
            min-height: 45px;
            font-size: 11px;
          }

          /* ----------------------------------------------
             PLANS
          ---------------------------------------------- */

          .plans-section {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .plan-card {
            width: 100%;
            padding: 22px;
            border-radius: 18px;
          }

          .plan-card:hover {
            transform: none;
          }

          .plan-card-popular {
            margin-top: 6px;
          }

          .popular-badge {
            top: -13px;
            min-height: 25px;
            padding:
              6px 12px;
            font-size: 8px;
          }

          .plan-icon {
            width: 42px;
            height: 42px;
            margin-bottom: 15px;
          }

          .plan-card h2 {
            font-size: 20px;
          }

          .plan-description {
            min-height: 0;
            margin-top: 8px;
            font-size: 12px;
            line-height: 1.6;
          }

          .price-area {
            min-height: 0;
            margin-top: 19px;
          }

          .price {
            font-size: 36px;
          }

          .price-period {
            font-size: 10px;
          }

          .listing-limit {
            margin-top: 15px;
            padding: 11px;
          }

          .features {
            margin-top: 19px;
            gap: 9px;
          }

          .feature-row {
            font-size: 11px;
          }

          .plan-action {
            margin-top: 23px;
          }

          .plan-button {
            min-height: 49px;
            font-size: 12px;
          }

          /* ----------------------------------------------
             TRUST
          ---------------------------------------------- */

          .trust-section {
            margin-top: 35px;
            padding: 19px;
            border-radius: 16px;
          }

          .trust-card {
            align-items: flex-start;
            gap: 11px;
          }

          .trust-icon {
            width: 42px;
            height: 42px;
            border-radius: 11px;
          }

          .trust-copy {
            flex: 1;
          }

          .trust-title-row {
            gap: 6px;
          }

          .trust-card strong {
            font-size: 12px;
          }

          .secure-label {
            font-size: 6px;
          }

          .trust-card p {
            font-size: 10px;
            line-height: 1.6;
          }

          .trust-items {
            flex-direction: column;
            align-items: flex-start;
            gap: 9px;
            margin-top: 17px;
            padding-top: 16px;
            font-size: 10px;
          }

          /* ----------------------------------------------
             INFORMATION
          ---------------------------------------------- */

          .info-section {
            margin-top: 50px;
            padding:
              40px 0;
          }

          .info-heading {
            margin-bottom: 25px;
          }

          .info-heading h2 {
            margin-top: 7px;
            font-size: 27px;
            line-height: 1.12;
          }

          .info-heading p {
            font-size: 11px;
            line-height: 1.65;
          }

          .info-grid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .info-item {
            gap: 12px;
            padding: 17px;
            border-radius: 14px;
          }

          .info-number {
            font-size: 10px;
          }

          .info-item h3 {
            margin-bottom: 5px;
            font-size: 13px;
          }

          .info-item p {
            font-size: 10px;
          }

          /* ----------------------------------------------
             FOOTER
          ---------------------------------------------- */

          .pricing-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }

          .footer-note {
            align-items: flex-start;
            text-align: left;
          }

        }

        /* ==================================================
           SMALL PHONES
        ================================================== */

        @media (max-width: 390px) {

          .pricing-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .hero {
            padding-top: 43px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-badge {
            font-size: 7px;
          }

          .hero-description {
            font-size: 12px;
          }

          .plan-card {
            padding: 19px;
          }

          .plan-card h2 {
            font-size: 19px;
          }

          .price {
            font-size: 33px;
          }

          .billing-toggle button {
            min-height: 43px;
            font-size: 10px;
          }

          .billing-toggle button small {
            font-size: 7px;
          }

          .trust-section {
            padding: 16px;
          }

          .info-heading h2 {
            font-size: 24px;
          }

        }

        /* ==================================================
           VERY SMALL PHONES
        ================================================== */

        @media (max-width: 340px) {

          .brand-name {
            font-size: 14px;
          }

          .back-button span:last-child {
            display: none;
          }

          .back-button {
            width: 36px;
            justify-content: center;
            padding: 8px;
          }

          .hero h1 {
            font-size: 33px;
          }

          .hero-badge {
            padding-left: 8px;
            padding-right: 8px;
          }

          .plan-card {
            padding: 17px;
          }

          .price {
            font-size: 31px;
          }

        }

      `}</style>
    </main>
  );
}