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
    eyebrow: "GET STARTED",
    description:
      "Everything you need to start discovering promising graduates.",
    monthly: 500,
    annual: 5000,
    listings: 5,
    icon: "🚀",
    features: [
      "Up to 5 active internship listings",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "Basic hiring tools",
    ],
  },

  professional: {
    key: "professional",
    name: "Professional",
    eyebrow: "MOST POPULAR",
    description:
      "Powerful recruitment tools for companies growing their graduate pipeline.",
    monthly: 950,
    annual: 9500,
    listings: 15,
    icon: "✦",
    popular: true,
    features: [
      "Up to 15 active internship listings",
      "Everything in Starter",
      "AI applicant matching",
      "Advanced applicant screening",
      "Document verification",
      "Smarter candidate discovery",
    ],
  },

  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    eyebrow: "HIGH-VOLUME HIRING",
    description:
      "Designed for organisations recruiting graduates at scale.",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    icon: "◆",
    features: [
      "Up to 30 active internship listings",
      "Everything in Professional",
      "AI applicant matching",
      "Document verification",
      "Advanced candidate screening",
      "Priority recruitment capacity",
    ],
  },

  pay_per_listing: {
    key: "pay_per_listing",
    name: "Pay Per Listing",
    eyebrow: "FLEXIBLE OPTION",
    description:
      "Need to advertise just one opportunity? Pay only for the listing you need.",
    monthly: 250,
    annual: 250,
    listings: 1,
    icon: "◎",
    oneTime: true,
    features: [
      "1 active internship listing",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "No monthly commitment",
    ],
  },
};

// ============================================================
// HELPERS
// ============================================================

function formatMoney(amount) {
  return `R${Number(amount).toLocaleString("en-ZA")}`;
}

// ============================================================
// ICONS
// ============================================================

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// PLAN ICON
// ============================================================

function PlanIcon({ icon }) {
  return (
    <div className="plan-icon">
      <span>{icon}</span>
    </div>
  );
}

// ============================================================
// PLAN CARD
// ============================================================

function PlanCard({
  plan,
  billing,
  loading,
  loadingPlan,
  onSelect,
}) {
  const isAnnual = billing === "annual";

  const price = plan.oneTime
    ? plan.monthly
    : isAnnual
      ? plan.annual
      : plan.monthly;

  const annualMonthlyEquivalent = plan.oneTime
    ? null
    : Math.round(plan.annual / 12);

  return (
    <article
      className={`plan-card ${
        plan.popular ? "plan-card-popular" : ""
      }`}
    >
      {plan.popular && (
        <div className="popular-badge">
          <span>✦</span>
          MOST POPULAR
        </div>
      )}

      <div className="plan-content">

        {/* Plan icon */}
        <PlanIcon icon={plan.icon} />

        {/* Heading */}
        <div className="plan-eyebrow">
          {plan.eyebrow}
        </div>

        <h2>{plan.name}</h2>

        {/* ==================================================
            PLAN DESCRIPTION CARD
        ================================================== */}

        <div className="plan-description-card">

          <div className="description-card-top">
            <span className="description-card-icon">
              ✦
            </span>

            <span className="description-card-label">
              PLAN OVERVIEW
            </span>
          </div>

          <p className="plan-description">
            {plan.description}
          </p>

        </div>

        {/* Price */}
        <div className="price-area">

          <div className="price-line">

            <span className="price">
              {formatMoney(price)}
            </span>

            <span className="price-period">
              {plan.oneTime
                ? " / listing"
                : isAnnual
                  ? " / year"
                  : " / month"}
            </span>

          </div>

          {!plan.oneTime && isAnnual && (
            <div className="annual-note">
              Equivalent to {formatMoney(annualMonthlyEquivalent)}
              /month
            </div>
          )}

          {!plan.oneTime && isAnnual && (
            <span className="save-badge">
              SAVE 2 MONTHS
            </span>
          )}

        </div>

        {/* Listing limit */}
        <div className="listing-limit">

          <span className="listing-icon">
            ▣
          </span>

          <span>
            {plan.listings === 1
              ? "1 active internship listing"
              : `Up to ${plan.listings} active internship listings`}
          </span>

        </div>

        {/* Divider */}
        <div className="card-divider" />

        {/* Features */}
        <div className="features">

          <div className="features-heading">
            What's included
          </div>

          {plan.features.map((feature, index) => (
            <div
              className="feature-row"
              key={`${plan.key}-feature-${index}`}
            >

              <span className="feature-check">
                <CheckIcon />
              </span>

              <span>{feature}</span>

            </div>
          ))}

        </div>

        {/* Button */}
        <div className="plan-action">

          <button
            type="button"
            className={`plan-button ${
              plan.popular
                ? "plan-button-primary"
                : "plan-button-secondary"
            }`}
            onClick={() => onSelect(plan.key)}
            disabled={loading}
          >

            {loading && loadingPlan === plan.key ? (
              <>
                <span className="button-spinner" />
                Preparing...
              </>
            ) : (
              <>
                {plan.oneTime
                  ? "Choose Listing"
                  : "Choose Plan"}

                <ArrowIcon />
              </>
            )}

          </button>

        </div>

        {/* Security */}
        <div className="secure-note">
          <LockIcon />
          Secure payment via PayFast
        </div>

      </div>
    </article>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CompanyPricingPage() {

  const router = useRouter();

  const [billing, setBilling] = useState("monthly");

  const [loading, setLoading] = useState(false);

  const [loadingPlan, setLoadingPlan] = useState("");

  const [user, setUser] = useState(null);

  const [currentSubscription, setCurrentSubscription] =
    useState(null);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD USER + SUBSCRIPTION
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    async function loadAccount() {

      try {

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(currentUser || null);

        if (!currentUser) {
          return;
        }

        const { data: subscription, error: subscriptionError } =
          await supabase
            .from("company_subscriptions")
            .select("*")
            .eq("company_id", currentUser.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (!mounted) return;

        if (subscriptionError) {

          console.error(
            "Subscription lookup error:",
            subscriptionError
          );

          return;
        }

        setCurrentSubscription(subscription || null);

      } catch (err) {

        console.error(
          "Account loading error:",
          err
        );

      }

    }

    loadAccount();

    return () => {
      mounted = false;
    };

  }, []);

  // ==========================================================
  // ACTIVE SUBSCRIPTION
  // ==========================================================

  const activeSubscription =
    currentSubscription?.status?.toLowerCase() === "active";

  // ==========================================================
  // CONTINUE TO PAYMENT
  // ==========================================================

  async function continueToPayment(planKey) {

    setError("");

    setLoading(true);

    setLoadingPlan(planKey);

    try {

      // -------------------------------------------------------
      // AUTH CHECK
      // -------------------------------------------------------

      if (!user) {

        router.push(
          "/signup?role=company&redirect=/company-pricing"
        );

        return;
      }

      // -------------------------------------------------------
      // PLAN CHECK
      // -------------------------------------------------------

      const plan = PLANS[planKey];

      if (!plan) {

        throw new Error(
          "The selected plan could not be found."
        );

      }

      // -------------------------------------------------------
      // BILLING
      // -------------------------------------------------------

      const selectedBilling =
        plan.oneTime
          ? "listing"
          : billing;

      // -------------------------------------------------------
      // CHECK ACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      const { data: activeRows, error: activeError } =
        await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .ilike("status", "active")
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

      const existingActive =
        activeRows && activeRows.length > 0
          ? activeRows[0]
          : null;

      // -------------------------------------------------------
      // ALREADY ACTIVE
      // -------------------------------------------------------

      if (existingActive && !plan.oneTime) {

        router.push("/company");

        return;
      }

      // -------------------------------------------------------
      // AMOUNT
      // -------------------------------------------------------

      const amount = plan.oneTime
        ? plan.monthly
        : billing === "annual"
          ? plan.annual
          : plan.monthly;

      // -------------------------------------------------------
      // FIND INACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      const { data: inactiveRows, error: inactiveError } =
        await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .ilike("status", "inactive")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

      if (inactiveError) {

        console.error(
          "Inactive subscription lookup:",
          inactiveError
        );

      }

      let subscriptionId = null;

      const existingInactive =
        inactiveRows && inactiveRows.length > 0
          ? inactiveRows[0]
          : null;

      // -------------------------------------------------------
      // UPDATE EXISTING INACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      if (existingInactive) {

        const { data: updatedSubscription, error: updateError } =
          await supabase
            .from("company_subscriptions")
            .update({
              plan: plan.key,
              status: "inactive",
              amount: amount,
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingInactive.id)
            .select()
            .maybeSingle();

        if (updateError) {

          console.error(
            "Subscription update error:",
            updateError
          );

          throw new Error(
            updateError.message ||
              "Could not prepare your subscription."
          );
        }

        subscriptionId =
          updatedSubscription?.id ||
          existingInactive.id;

      }

      // -------------------------------------------------------
      // CREATE NEW INACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      else {

        const { data: newSubscription, error: insertError } =
          await supabase
            .from("company_subscriptions")
            .insert({
              company_id: user.id,
              plan: plan.key,
              status: "inactive",
              amount: amount,
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
            })
            .select()
            .maybeSingle();

        if (insertError) {

          console.error(
            "Subscription insert error:",
            insertError
          );

          throw new Error(
            insertError.message ||
              "Could not create your subscription."
          );
        }

        subscriptionId =
          newSubscription?.id || null;

      }

      // -------------------------------------------------------
      // MAKE SURE WE HAVE SUBSCRIPTION ID
      // -------------------------------------------------------

      if (!subscriptionId) {

        throw new Error(
          "Could not create a subscription reference."
        );

      }

      // -------------------------------------------------------
      // GO TO PAYMENT
      // -------------------------------------------------------

      router.push(
        `/company/payment?plan=${encodeURIComponent(
          plan.key
        )}&billing=${encodeURIComponent(
          selectedBilling
        )}&subscription=${encodeURIComponent(
          subscriptionId
        )}`
      );

    } catch (err) {

      console.error(
        "Pricing selection error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );

    } finally {

      setLoading(false);

      setLoadingPlan("");

    }

  }

  // ==========================================================
  // PART 2 STARTS BELOW
  // ==========================================================

  return (
    <>
      <main className="pricing-page">

        {/* ==================================================
            NAVBAR
        ================================================== */}

        <nav className="pricing-nav">

          <div className="nav-inner">

            <button
              type="button"
              className="brand"
              onClick={() => router.push("/")}
            >

              <span className="brand-mark">
                G
              </span>

              <span className="brand-text">
                GradLink
                <span>SA</span>
              </span>

            </button>

            <div className="nav-links">

              <button
                type="button"
                onClick={() => router.push("/company")}
              >
                Dashboard
              </button>

              <button
                type="button"
                className="nav-active"
              >
                Pricing
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
              )}

            </div>

          </div>

        </nav>


        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero-section">

          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="hero-content">

            <div className="hero-badge">
              <span className="hero-dot" />
              RECRUIT WITH CONFIDENCE
            </div>

            <h1>
              Find the right graduates.
              <br />

              <span>
                Build your future team.
              </span>
            </h1>

            <p>
              Choose the GradLink SA plan that fits
              your recruitment needs and connect with
              talented South African graduates.
            </p>

            <div className="hero-trust">

              <div>
                <span>✓</span>
                Verified graduate profiles
              </div>

              <div>
                <span>✓</span>
                Secure PayFast payments
              </div>

              <div>
                <span>✓</span>
                Flexible plans
              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            ACTIVE SUBSCRIPTION
        ================================================== */}

        {activeSubscription && (
          <section className="active-banner-wrap">

            <div className="active-banner">

              <div className="active-icon">
                ✓
              </div>

              <div className="active-content">

                <strong>
                  Your company plan is active
                </strong>

                <span>
                  {currentSubscription?.plan
                    ? `${String(
                        currentSubscription.plan
                      )
                        .charAt(0)
                        .toUpperCase()}${String(
                        currentSubscription.plan
                      ).slice(1)} plan`
                    : "Active subscription"}
                  {" "}is currently active.
                </span>

              </div>

              <button
                type="button"
                onClick={() => router.push("/company")}
              >
                Go to Dashboard
                <ArrowIcon />
              </button>

            </div>

          </section>
        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <section className="error-wrap">

            <div className="error-box">

              <span className="error-symbol">
                !
              </span>

              <div>

                <strong>
                  Something went wrong
                </strong>

                <p>
                  {error}
                </p>

              </div>

            </div>

          </section>
        )}


        {/* ==================================================
            PRICING
        ================================================== */}

        <section className="pricing-section">

          <div className="pricing-container">

            <div className="section-heading">

              <div className="section-kicker">
                SIMPLE & TRANSPARENT
              </div>

              <h2>
                Choose your recruitment plan
              </h2>

              <p>
                Start with the plan that matches your
                hiring volume. You can change your
                approach as your recruitment needs grow.
              </p>

            </div>


            {/* ==================================================
                BILLING SWITCH
            ================================================== */}

            <div className="billing-wrapper">

              <div className="billing-switch">

                <button
                  type="button"
                  className={
                    billing === "monthly"
                      ? "billing-active"
                      : ""
                  }
                  onClick={() => setBilling("monthly")}
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
                  onClick={() => setBilling("annual")}
                >
                  Annual

                  <span className="billing-save">
                    SAVE 2 MONTHS
                  </span>

                </button>

              </div>

              <p className="billing-caption">
                Choose annual billing and pay for only
                10 months.
              </p>

            </div>


            {/* ==================================================
                STACKED PLAN CARDS
            ================================================== */}

            <div className="plans-list">

              <PlanCard
                plan={PLANS.starter}
                billing={billing}
                loading={loading}
                loadingPlan={loadingPlan}
                onSelect={continueToPayment}
              />

              <PlanCard
                plan={PLANS.professional}
                billing={billing}
                loading={loading}
                loadingPlan={loadingPlan}
                onSelect={continueToPayment}
              />

              <PlanCard
                plan={PLANS.enterprise}
                billing={billing}
                loading={loading}
                loadingPlan={loadingPlan}
                onSelect={continueToPayment}
              />

              <PlanCard
                plan={PLANS.pay_per_listing}
                billing={billing}
                loading={loading}
                loadingPlan={loadingPlan}
                onSelect={continueToPayment}
              />

            </div>


            {/* ==================================================
                PAYMENT TRUST
            ================================================== */}

            <div className="payment-trust">

              <div className="trust-lock">
                <LockIcon />
              </div>

              <div>

                <strong>
                  Secure payments
                </strong>

                <span>
                  Payments are securely processed
                  through PayFast.
                </span>

              </div>

              <div className="payfast-label">
                PAYFAST
              </div>

            </div>


            {/* ==================================================
                HOW IT WORKS
            ================================================== */}

            <section className="how-section">

              <div className="how-heading">

                <span>
                  HOW IT WORKS
                </span>

                <h2>
                  Start recruiting in three steps
                </h2>

              </div>


              <div className="steps">

                <div className="step">

                  <div className="step-number">
                    01
                  </div>

                  <div>

                    <h3>
                      Choose your plan
                    </h3>

                    <p>
                      Select the plan that matches
                      your company's recruitment needs.
                    </p>

                  </div>

                </div>


                <div className="step">

                  <div className="step-number">
                    02
                  </div>

                  <div>

                    <h3>
                      Complete payment
                    </h3>

                    <p>
                      Complete your secure payment
                      through PayFast.
                    </p>

                  </div>

                </div>


                <div className="step">

                  <div className="step-number">
                    03
                  </div>

                  <div>

                    <h3>
                      Start hiring
                    </h3>

                    <p>
                      Once your payment is verified,
                      access your company dashboard
                      and start recruiting.
                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                VALUE SECTION
            ================================================== */}

            <section className="value-section">

              <div className="value-content">

                <div className="value-kicker">
                  BUILT FOR MODERN RECRUITMENT
                </div>

                <h2>
                  More than just an internship listing.
                </h2>

                <p>
                  GradLink SA helps companies discover,
                  review and connect with graduates through
                  one streamlined recruitment experience.
                </p>

              </div>


              <div className="value-points">

                <div>
                  <span>01</span>
                  <strong>
                    Discover talent
                  </strong>
                </div>

                <div>
                  <span>02</span>
                  <strong>
                    Review applicants
                  </strong>
                </div>

                <div>
                  <span>03</span>
                  <strong>
                    Build your pipeline
                  </strong>
                </div>

              </div>

            </section>

          </div>

        </section>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="pricing-footer">

          <div className="footer-inner">

            <div className="footer-brand">

              <span className="brand-mark">
                G
              </span>

              <div>

                <strong>
                  GradLink SA
                </strong>

                <span>
                  Connecting South African graduates
                  with opportunity.
                </span>

              </div>

            </div>

            <div className="footer-copy">
              © {new Date().getFullYear()} GradLink SA.
              All rights reserved.
            </div>

          </div>

        </footer>

      </main>


      {/* ==================================================
          COMPLETE PREMIUM CSS
      ================================================== */}

      <style jsx>{`

        /* ==================================================
           RESET
        ================================================== */

        .pricing-page {
          min-height:100vh;
          width:100%;
          background:#f6f9fd;
          color:#0f172a;
          overflow-x:hidden;
        }

        button {
          font-family:inherit;
        }


        /* ==================================================
           NAVBAR
        ================================================== */

        .pricing-nav {
          position:sticky;
          top:0;
          z-index:100;
          width:100%;
          background:rgba(255,255,255,.94);
          backdrop-filter:blur(18px);
          border-bottom:1px solid #e5edf6;
        }

        .nav-inner {
          width:min(1180px, calc(100% - 32px));
          min-height:72px;
          margin:0 auto;

          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
        }

        .brand {
          border:0;
          background:transparent;
          padding:0;

          display:flex;
          align-items:center;
          gap:10px;

          cursor:pointer;
        }

        .brand-mark {
          width:38px;
          height:38px;
          border-radius:12px;

          display:flex;
          align-items:center;
          justify-content:center;

          background:linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );

          color:white;
          font-size:19px;
          font-weight:950;

          box-shadow:
            0 8px 20px
            rgba(37,99,235,.22);
        }

        .brand-text {
          font-size:19px;
          font-weight:950;
          letter-spacing:-.04em;
          color:#0f172a;
        }

        .brand-text span {
          color:#2563eb;
          margin-left:2px;
        }

        .nav-links {
          display:flex;
          align-items:center;
          gap:6px;
        }

        .nav-links button {
          border:0;
          background:transparent;

          padding:10px 13px;

          border-radius:10px;

          color:#64748b;

          font-size:13px;
          font-weight:800;

          cursor:pointer;

          transition:.2s ease;
        }

        .nav-links button:hover {
          color:#2563eb;
          background:#eff6ff;
        }

        .nav-links .nav-active {
          color:#2563eb;
          background:#eff6ff;
        }


        /* ==================================================
           HERO
        ================================================== */

        .hero-section {
          position:relative;
          overflow:hidden;

          background:
            linear-gradient(
              135deg,
              #071a3a 0%,
              #0b2c63 48%,
              #1558c0 100%
            );

          color:white;
        }

        .hero-content {
          position:relative;
          z-index:2;

          width:min(850px, calc(100% - 32px));

          margin:0 auto;

          padding:
            92px 0
            88px;

          text-align:center;
        }

        .hero-glow {
          position:absolute;
          border-radius:50%;
          filter:blur(3px);
          pointer-events:none;
        }

        .hero-glow-one {
          width:430px;
          height:430px;
          top:-260px;
          right:-120px;

          background:
            rgba(56,189,248,.17);
        }

        .hero-glow-two {
          width:350px;
          height:350px;
          bottom:-260px;
          left:-100px;

          background:
            rgba(96,165,250,.13);
        }

        .hero-badge {
          display:inline-flex;
          align-items:center;
          gap:8px;

          padding:8px 13px;

          border-radius:999px;

          border:1px solid
            rgba(255,255,255,.18);

          background:
            rgba(255,255,255,.08);

          color:#dbeafe;

          font-size:10px;
          font-weight:950;
          letter-spacing:.1em;
        }

        .hero-dot {
          width:7px;
          height:7px;
          border-radius:50%;
          background:#38bdf8;

          box-shadow:
            0 0 0 5px
            rgba(56,189,248,.12);
        }

        .hero-content h1 {
          margin:24px 0 0;

          font-size:
            clamp(38px, 6vw, 66px);

          line-height:1.03;

          letter-spacing:-.055em;

          font-weight:950;
        }

        .hero-content h1 span {
          color:#7dd3fc;
        }

        .hero-content > p {
          max-width:650px;

          margin:25px auto 0;

          color:#cbdaf2;

          font-size:16px;

          line-height:1.75;
        }

        .hero-trust {
          margin-top:30px;

          display:flex;
          justify-content:center;
          flex-wrap:wrap;

          gap:10px 22px;
        }

        .hero-trust div {
          display:flex;
          align-items:center;
          gap:7px;

          color:#dbeafe;

          font-size:12px;
          font-weight:700;
        }

        .hero-trust span {
          color:#67e8f9;
          font-weight:950;
        }


        /* ==================================================
           ACTIVE BANNER
        ================================================== */

        .active-banner-wrap {
          width:min(900px, calc(100% - 32px));
          margin:30px auto 0;
        }

        .active-banner {
          display:flex;
          align-items:center;
          gap:15px;

          padding:17px 20px;

          border-radius:18px;

          background:#ecfdf5;

          border:1px solid #bbf7d0;
        }

        .active-icon {
          flex:0 0 auto;

          width:40px;
          height:40px;

          border-radius:12px;

          display:flex;
          align-items:center;
          justify-content:center;

          background:#16a34a;

          color:white;

          font-weight:950;
        }

        .active-content {
          flex:1;

          display:flex;
          flex-direction:column;
          gap:3px;
        }

        .active-content strong {
          color:#14532d;
          font-size:14px;
        }

        .active-content span {
          color:#166534;
          font-size:12px;
        }

        .active-banner button {
          flex:0 0 auto;

          border:0;
          background:transparent;

          color:#15803d;

          display:flex;
          align-items:center;
          gap:6px;

          font-size:12px;
          font-weight:900;

          cursor:pointer;
        }


        /* ==================================================
           ERROR
        ================================================== */

        .error-wrap {
          width:min(900px, calc(100% - 32px));
          margin:24px auto 0;
        }

        .error-box {
          display:flex;
          align-items:flex-start;
          gap:13px;

          padding:17px;

          border-radius:16px;

          background:#fff7ed;

          border:1px solid #fed7aa;

          color:#9a3412;
        }

        .error-symbol {
          width:28px;
          height:28px;

          flex:0 0 auto;

          border-radius:50%;

          display:flex;
          align-items:center;
          justify-content:center;

          background:#ea580c;

          color:white;

          font-weight:950;
        }

        .error-box strong {
          display:block;
          font-size:13px;
        }

        .error-box p {
          margin:4px 0 0;
          font-size:12px;
          line-height:1.5;
        }


        /* ==================================================
           PRICING SECTION
        ================================================== */

        .pricing-section {
          width:100%;
          padding:80px 16px 100px;
          background:#f6f9fd;
        }

        .pricing-container {
          width:100%;
          max-width:920px;
          margin:0 auto;
        }

        .section-heading {
          text-align:center;
          max-width:700px;
          margin:0 auto;
        }

        .section-kicker {
          color:#2563eb;
          font-size:10px;
          font-weight:950;
          letter-spacing:.12em;
        }

        .section-heading h2 {
          margin:12px 0 0;

          font-size:
            clamp(30px, 5vw, 46px);

          line-height:1.08;

          letter-spacing:-.05em;

          font-weight:950;

          color:#0f172a;
        }

        .section-heading p {
          max-width:620px;
          margin:17px auto 0;

          color:#64748b;

          font-size:14px;
          line-height:1.75;
        }


        /* ==================================================
           BILLING
        ================================================== */

        .billing-wrapper {
          display:flex;
          flex-direction:column;
          align-items:center;

          margin:35px 0 38px;
        }

        .billing-switch {
          display:flex;
          align-items:center;

          padding:5px;

          border-radius:16px;

          background:white;

          border:1px solid #dbe4f0;

          box-shadow:
            0 8px 25px
            rgba(15,23,42,.06);
        }

        .billing-switch button {
          min-height:44px;

          padding:0 19px;

          border:0;

          border-radius:12px;

          background:transparent;

          color:#64748b;

          font-size:12px;
          font-weight:900;

          cursor:pointer;

          transition:.2s ease;
        }

        .billing-switch button.billing-active {
          background:#0f172a;
          color:white;

          box-shadow:
            0 5px 15px
            rgba(15,23,42,.16);
        }

        .billing-save {
          margin-left:7px;

          padding:4px 6px;

          border-radius:6px;

          background:#dcfce7;

          color:#15803d;

          font-size:8px;
          font-weight:950;
        }

        .billing-caption {
          margin:10px 0 0;

          color:#94a3b8;

          font-size:11px;
          font-weight:650;
        }


        /* ==================================================
           STACKED PLANS
        ================================================== */

        .plans-list {
          width:min(760px, 100%);
          margin:0 auto;

          display:flex;
          flex-direction:column;

          gap:24px;
        }


        /* ==================================================
           PLAN CARD
        ================================================== */

        .plan-card {
          position:relative;

          width:100%;

          display:block;

          border-radius:26px;

          background:#ffffff;

          border:1px solid #dbe4f0;

          box-shadow:
            0 16px 40px
            rgba(15,23,42,.075);

          overflow:hidden;

          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;

          opacity:1;
          visibility:visible;
        }

        .plan-card::before {
          content:"";

          position:absolute;

          top:0;
          left:0;
          right:0;

          height:5px;

          background:
            linear-gradient(
              90deg,
              #2563eb,
              #38bdf8
            );
        }

        .plan-card:hover {
          transform:translateY(-4px);

          border-color:#bfdbfe;

          box-shadow:
            0 24px 55px
            rgba(37,99,235,.12);
        }

        .plan-card-popular {
          border:
            2px solid #2563eb;

          box-shadow:
            0 25px 65px
            rgba(37,99,235,.17);
        }

        .plan-card-popular::before {
          height:7px;
        }


        /* ==================================================
           POPULAR BADGE
        ================================================== */

        .popular-badge {
          position:absolute;

          top:20px;
          right:22px;

          z-index:5;

          display:flex;
          align-items:center;
          gap:5px;

          padding:7px 11px;

          border-radius:999px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          color:white;

          font-size:9px;
          font-weight:950;

          letter-spacing:.06em;

          box-shadow:
            0 8px 20px
            rgba(37,99,235,.25);
        }


        /* ==================================================
           PLAN CONTENT
        ================================================== */

        .plan-content {
          position:relative;
          z-index:2;

          padding:34px;
        }

        .plan-icon {
          width:56px;
          height:56px;

          display:flex;
          align-items:center;
          justify-content:center;

          margin-bottom:20px;

          border-radius:18px;

          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #dbeafe
            );

          border:1px solid #dbeafe;

          color:#2563eb;

          font-size:25px;

          box-shadow:
            0 8px 20px
            rgba(37,99,235,.08);
        }

        .plan-eyebrow {
          margin-bottom:8px;

          color:#2563eb;

          font-size:9px;
          font-weight:950;

          letter-spacing:.12em;
        }

        .plan-content h2 {
          margin:0;

          color:#0f172a;

          font-size:30px;

          line-height:1.1;

          letter-spacing:-.045em;

          font-weight:950;
        }

        /* ==================================================
           PREMIUM PLAN DESCRIPTION CARD
        ================================================== */

        .plan-description-card {
          width:100%;

          margin-top:15px;

          padding:15px 16px;

          border-radius:16px;

          background:
            linear-gradient(
              135deg,
              #f8fbff 0%,
              #eff6ff 100%
            );

          border:1px solid #dbeafe;

          box-shadow:
            0 8px 22px
            rgba(37,99,235,.06);

          box-sizing:border-box;
        }

        .description-card-top {
          display:flex;

          align-items:center;

          gap:7px;

          margin-bottom:7px;
        }

        .description-card-icon {
          width:22px;
          height:22px;

          flex:0 0 auto;

          display:flex;

          align-items:center;

          justify-content:center;

          border-radius:7px;

          background:#dbeafe;

          color:#2563eb;

          font-size:10px;

          font-weight:950;
        }

        .description-card-label {
          color:#2563eb;

          font-size:8px;

          line-height:1;

          font-weight:950;

          letter-spacing:.11em;
        }

        .plan-description {
          margin:0;

          color:#475569;

          font-size:13px;

          line-height:1.65;

          font-weight:650;
        }


        /* ==================================================
           PRICE
        ================================================== */

        .price-area {
          margin-top:27px;
        }

        .price-line {
          display:flex;
          align-items:baseline;
          flex-wrap:wrap;
          gap:5px;
        }

        .price {
          color:#0f172a;

          font-size:46px;

          line-height:1;

          letter-spacing:-.06em;

          font-weight:950;
        }

        .price-period {
          color:#64748b;

          font-size:13px;

          font-weight:750;
        }

        .annual-note {
          margin-top:8px;

          color:#64748b;

          font-size:11px;
        }

        .save-badge {
          display:inline-block;

          margin-top:10px;

          padding:6px 9px;

          border-radius:7px;

          background:#dcfce7;

          color:#15803d;

          font-size:9px;

          font-weight:950;

          letter-spacing:.05em;
        }


        /* ==================================================
           LISTING LIMIT
        ================================================== */

        .listing-limit {
          margin-top:23px;

          display:flex;
          align-items:center;
          gap:9px;

          padding:14px 16px;

          border-radius:14px;

          background:#eff6ff;

          border:1px solid #dbeafe;

          color:#1e40af;

          font-size:13px;

          font-weight:850;
        }

        .listing-icon {
          width:25px;
          height:25px;

          flex:0 0 auto;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:7px;

          background:#2563eb;

          color:white;

          font-size:11px;
        }


        /* ==================================================
           DIVIDER
        ================================================== */

        .card-divider {
          height:1px;

          margin:27px 0;

          background:#e8eef5;
        }


        /* ==================================================
           FEATURES
        ================================================== */

        .features {
          display:flex;
          flex-direction:column;

          gap:13px;
        }

        .features-heading {
          margin-bottom:2px;

          color:#0f172a;

          font-size:12px;

          font-weight:950;
        }

        .feature-row {
          display:flex;
          align-items:center;

          gap:11px;

          color:#334155;

          font-size:13px;

          line-height:1.45;
        }

        .feature-check {
          width:23px;
          height:23px;

          flex:0 0 auto;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:50%;

          background:#dcfce7;

          color:#16a34a;
        }


        /* ==================================================
           ACTION
        ================================================== */

        .plan-action {
          margin-top:30px;
        }

        .plan-button {
          width:100%;

          min-height:56px;

          border-radius:15px;

          display:flex;
          align-items:center;
          justify-content:center;

          gap:9px;

          font-size:14px;

          font-weight:950;

          cursor:pointer;

          transition:.2s ease;
        }

        .plan-button:disabled {
          cursor:not-allowed;
          opacity:.7;
        }

        .plan-button-primary {
          border:0;

          color:white;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          box-shadow:
            0 10px 24px
            rgba(37,99,235,.22);
        }

        .plan-button-primary:hover {
          transform:translateY(-2px);

          box-shadow:
            0 15px 30px
            rgba(37,99,235,.28);
        }

        .plan-button-secondary {
          border:2px solid #bfdbfe;

          color:#1d4ed8;

          background:white;
        }

        .plan-button-secondary:hover {
          background:#eff6ff;
          border-color:#93c5fd;
        }

        .button-spinner {
          width:15px;
          height:15px;

          border-radius:50%;

          border:2px solid currentColor;

          border-right-color:transparent;

          animation:
            spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform:rotate(360deg);
          }
        }

        .secure-note {
          margin-top:13px;

          display:flex;
          align-items:center;
          justify-content:center;

          gap:6px;

          color:#94a3b8;

          font-size:10px;

          font-weight:700;
        }


        /* ==================================================
           PAYMENT TRUST
        ================================================== */

        .payment-trust {
          width:min(760px,100%);

          margin:32px auto 0;

          padding:18px 20px;

          display:flex;
          align-items:center;

          gap:13px;

          border-radius:18px;

          background:white;

          border:1px solid #e2e8f0;
        }

        .trust-lock {
          width:40px;
          height:40px;

          flex:0 0 auto;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:12px;

          background:#eff6ff;

          color:#2563eb;
        }

        .payment-trust > div:nth-child(2) {
          flex:1;

          display:flex;
          flex-direction:column;

          gap:3px;
        }

        .payment-trust strong {
          font-size:12px;
          color:#0f172a;
        }

        .payment-trust span {
          color:#64748b;
          font-size:10px;
        }

        .payfast-label {
          color:#0f172a !important;

          font-size:10px !important;

          font-weight:950;

          letter-spacing:.08em;
        }


        /* ==================================================
           HOW IT WORKS
        ================================================== */

        .how-section {
          margin-top:90px;
        }

        .how-heading {
          text-align:center;
        }

        .how-heading > span {
          color:#2563eb;

          font-size:10px;

          font-weight:950;

          letter-spacing:.12em;
        }

        .how-heading h2 {
          margin:10px 0 0;

          color:#0f172a;

          font-size:30px;

          letter-spacing:-.04em;

          font-weight:950;
        }

        .steps {
          margin-top:30px;

          display:flex;
          flex-direction:column;

          gap:14px;
        }

        .step {
          display:flex;

          align-items:flex-start;

          gap:17px;

          padding:20px;

          background:white;

          border:1px solid #e2e8f0;

          border-radius:18px;
        }

        .step-number {
          width:42px;
          height:42px;

          flex:0 0 auto;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:12px;

          background:#eff6ff;

          color:#2563eb;

          font-size:10px;

          font-weight:950;
        }

        .step h3 {
          margin:1px 0 0;

          font-size:14px;

          font-weight:900;

          color:#0f172a;
        }

        .step p {
          margin:6px 0 0;

          color:#64748b;

          font-size:12px;

          line-height:1.6;
        }


        /* ==================================================
           VALUE
        ================================================== */

        .value-section {
          margin-top:70px;

          padding:34px;

          display:flex;

          align-items:center;

          justify-content:space-between;

          gap:35px;

          border-radius:24px;

          background:
            linear-gradient(
              135deg,
              #0b2c63,
              #1558c0
            );

          color:white;

          overflow:hidden;

          position:relative;
        }

        .value-section::after {
          content:"";

          position:absolute;

          width:250px;
          height:250px;

          right:-120px;
          bottom:-150px;

          border-radius:50%;

          background:
            rgba(125,211,252,.14);
        }

        .value-content {
          position:relative;
          z-index:2;

          max-width:500px;
        }

        .value-kicker {
          color:#7dd3fc;

          font-size:9px;

          font-weight:950;

          letter-spacing:.12em;
        }

        .value-content h2 {
          margin:10px 0 0;

          font-size:30px;

          line-height:1.1;

          letter-spacing:-.045em;

          font-weight:950;
        }

        .value-content p {
          margin:13px 0 0;

          color:#cbdaf2;

          font-size:13px;

          line-height:1.7;
        }

        .value-points {
          position:relative;
          z-index:2;

          min-width:210px;

          display:flex;
          flex-direction:column;

          gap:13px;
        }

        .value-points div {
          display:flex;
          align-items:center;

          gap:12px;
        }

        .value-points span {
          color:#7dd3fc;

          font-size:9px;

          font-weight:950;
        }

        .value-points strong {
          color:white;

          font-size:12px;

          font-weight:800;
        }


        /* ==================================================
           FOOTER
        ================================================== */

        .pricing-footer {
          background:#071a3a;

          color:white;
        }

        .footer-inner {
          width:min(1180px, calc(100% - 32px));

          min-height:100px;

          margin:0 auto;

          display:flex;

          align-items:center;

          justify-content:space-between;

          gap:20px;
        }

        .footer-brand {
          display:flex;
          align-items:center;

          gap:10px;
        }

        .footer-brand > div {
          display:flex;
          flex-direction:column;

          gap:3px;
        }

        .footer-brand strong {
          font-size:13px;
        }

        .footer-brand span:not(.brand-mark) {
          color:#94a3b8;

          font-size:10px;
        }

        .footer-copy {
          color:#64748b;

          font-size:10px;
        }


        /* ==================================================
           TABLET
        ================================================== */

        @media (max-width:700px) {

          .nav-inner {
            min-height:64px;
          }

          .nav-links {
            gap:0;
          }

          .nav-links button {
            padding:8px 8px;
            font-size:11px;
          }

          .hero-content {
            padding:
              70px 0
              65px;
          }

          .hero-content h1 {
            font-size:40px;
          }

          .hero-content > p {
            font-size:14px;
          }

          .hero-trust {
            flex-direction:column;
            align-items:center;
            gap:9px;
          }

          .active-banner {
            align-items:flex-start;
            flex-wrap:wrap;
          }

          .active-banner button {
            margin-left:55px;
          }

          .pricing-section {
            padding:
              65px 14px
              75px;
          }

          .plan-content {
            padding:27px 21px;
          }

          .plan-content h2 {
            font-size:27px;
          }

          .price {
            font-size:42px;
          }

          .value-section {
            flex-direction:column;
            align-items:flex-start;
            padding:27px 22px;
          }

          .value-points {
            width:100%;
          }

          .footer-inner {
            flex-direction:column;
            align-items:flex-start;

            padding:25px 0;
          }

        }


        /* ==================================================
           PHONE
        ================================================== */

        @media (max-width:480px) {

          .nav-inner {
            width:
              calc(100% - 22px);
          }

          .brand-text {
            font-size:17px;
          }

          .brand-mark {
            width:34px;
            height:34px;
            border-radius:10px;
          }

          .nav-links button {
            padding:
              7px 6px;

            font-size:10px;
          }

          .hero-content {
            width:
              calc(100% - 28px);

            padding:
              60px 0
              58px;
          }

          .hero-content h1 {
            font-size:
              clamp(34px, 10vw, 40px);
          }

          .hero-content > p {
            font-size:13px;
            line-height:1.65;
          }

          .hero-badge {
            font-size:8px;
          }

          .active-banner-wrap,
          .error-wrap {
            width:
              calc(100% - 24px);
          }

          .active-banner {
            padding:15px;
          }

          .active-banner button {
            margin-left:55px;
          }

          .section-heading h2 {
            font-size:31px;
          }

          .billing-switch {
            width:100%;
          }

          .billing-switch button {
            flex:1;
            padding:0 8px;
          }

          .billing-save {
            display:none;
          }

          .plans-list {
            width:100%;
            gap:18px;
          }

          .plan-card {
            border-radius:22px;
          }

          .plan-content {
            padding:
              27px 18px;
          }

          .popular-badge {
            top:16px;
            right:15px;

            font-size:7px;

            padding:
              6px 8px;
          }

          .plan-icon {
            width:50px;
            height:50px;

            margin-bottom:17px;

            border-radius:15px;
          }

          .plan-content h2 {
            font-size:26px;

            padding-right:90px;
          }

          .plan-description-card {
            margin-top:14px;

            padding:13px 14px;

            border-radius:14px;
          }

          .description-card-icon {
            width:20px;
            height:20px;

            border-radius:6px;

            font-size:9px;
          }

          .description-card-label {
            font-size:7px;
          }

          .plan-description {
            font-size:12px;

            line-height:1.6;
          }

          .price {
            font-size:39px;
          }

          .listing-limit {
            font-size:12px;
          }

          .feature-row {
            font-size:12px;
          }

          .payment-trust {
            padding:15px;
          }

          .payfast-label {
            display:none;
          }

          .how-section {
            margin-top:65px;
          }

          .how-heading h2 {
            font-size:27px;
          }

          .value-content h2 {
            font-size:27px;
          }

          .footer-copy {
            line-height:1.5;
          }

        }

      `}</style>
    </>
  );
}