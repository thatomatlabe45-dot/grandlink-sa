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
// PLAN CARD
// ============================================================

function PlanCard({
  plan,
  billing,
  onSelect,
  loading,
}) {
  const isPayPerListing = plan.payPerListing === true;

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
    <div
      className={`plan-card ${
        plan.popular ? "plan-card-popular" : ""
      }`}
    >
      {plan.popular && (
        <div className="popular-badge">
          <span>★</span>
          MOST POPULAR
        </div>
      )}

      <div className="plan-top">
        <div className="plan-icon">
          {plan.key === "starter"
            ? "🚀"
            : plan.key === "professional"
              ? "⚡"
              : plan.key === "enterprise"
                ? "🏢"
                : "🎯"}
        </div>

        <h2>{plan.name}</h2>

        <p className="plan-description">
          {plan.description}
        </p>
      </div>

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

      <div className="listing-limit">
        <span className="listing-icon">✓</span>

        <span>
          <strong>{plan.listings}</strong>{" "}
          active{" "}
          {plan.listings === 1
            ? "listing"
            : "listings"}
        </span>
      </div>

      <div className="features">
        {plan.features.map((feature, index) => (
          <div
            key={index}
            className="feature-row"
          >
            <span className="feature-check">
              ✓
            </span>

            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="plan-spacer" />

      <button
        type="button"
        onClick={() => onSelect(plan.key)}
        disabled={loading}
        className={`plan-button ${
          plan.popular
            ? "plan-button-primary"
            : "plan-button-secondary"
        }`}
      >
        {loading
          ? "Please wait..."
          : isPayPerListing
            ? "Publish a Listing"
            : "Choose Plan"}

        {!loading && (
          <span className="button-arrow">
            →
          </span>
        )}
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] =
    useState("monthly");

  const [user, setUser] = useState(null);

  const [currentSubscription, setCurrentSubscription] =
    useState(null);

  const [loadingPlan, setLoadingPlan] =
    useState(null);

  const [message, setMessage] =
    useState("");

  // ----------------------------------------------------------
  // LOAD USER
  // ----------------------------------------------------------

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (data && data.length > 0) {
          setCurrentSubscription(data[0]);
        }
      }
    }

    loadUser();
  }, []);

  // ----------------------------------------------------------
  // SELECT PLAN
  // ----------------------------------------------------------

  async function continueToPayment(planKey) {
    try {
      setMessage("");
      setLoadingPlan(planKey);

      let currentUser = user;

      if (!currentUser) {
        const {
          data: {
            user: loggedInUser,
          },
        } = await supabase.auth.getUser();

        currentUser = loggedInUser;

        if (currentUser) {
          setUser(currentUser);
        }
      }

      if (!currentUser) {
        router.push(
          "/signup?role=company&redirect=/company-pricing"
        );

        return;
      }

      const selectedPlan = PLANS[planKey];

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
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", currentUser.id)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

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
      // CREATE / UPDATE PENDING SUBSCRIPTION
      // ------------------------------------------------------

      const {
        data: existingPending,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", currentUser.id)
        .eq("status", "inactive")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      let subscriptionId = null;

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
            payment_provider: "payfast",
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
      } else {
        const {
          data: newSubscription,
          error: insertError,
        } = await supabase
          .from("company_subscriptions")
          .insert({
            company_id: currentUser.id,
            plan: planKey,
            status: "inactive",
            monthly_price: amount,
            payment_provider: "payfast",
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
      // SEND TO PAYMENT
      // ------------------------------------------------------

      const params = new URLSearchParams({
        plan: planKey,
        billing: selectedBilling,
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

  // ----------------------------------------------------------
  // ACTIVE SUBSCRIPTION
  // ----------------------------------------------------------

  const active =
    currentSubscription &&
    String(
      currentSubscription.status
    ).toLowerCase() === "active";

  return (
    <main className="pricing-page">
      <div className="pricing-shell">

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <header className="pricing-nav">
          <button
            type="button"
            className="brand"
            onClick={() => router.push("/")}
          >
            <span className="brand-mark">
              G
            </span>

            <span>
              <strong>GradLink</strong>
              <small>SA</small>
            </span>
          </button>

          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </header>

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero">

          <div className="hero-badge">
            <span className="hero-badge-dot" />
            GRADLINK SA FOR COMPANIES
          </div>

          <h1>
            Find the right graduates.
            <span>
              Build your team.
            </span>
          </h1>

          <p className="hero-description">
            Choose a recruitment plan that gives
            your company the tools and capacity
            to connect with qualified South African
            graduates.
          </p>

          <div className="hero-points">
            <div>
              <span>✓</span>
              Publish internships
            </div>

            <div>
              <span>✓</span>
              Receive applications
            </div>

            <div>
              <span>✓</span>
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
              ✓
            </div>

            <div>
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
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (
          <div className="error-message">
            <span>!</span>
            {message}
          </div>
        )}

        {/* ==================================================
            BILLING SECTION
        ================================================== */}

        <section className="billing-section">

          <div>
            <h2>
              Choose your billing
            </h2>

            <p>
              Save 2 months when you
              choose annual billing.
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
              Annual
              <span>
                SAVE 2 MONTHS
              </span>
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
            onSelect={continueToPayment}
            loading={
              loadingPlan === "starter"
            }
          />

          <PlanCard
            plan={PLANS.professional}
            billing={billing}
            onSelect={continueToPayment}
            loading={
              loadingPlan ===
              "professional"
            }
          />

          <PlanCard
            plan={PLANS.enterprise}
            billing={billing}
            onSelect={continueToPayment}
            loading={
              loadingPlan === "enterprise"
            }
          />

          <PlanCard
            plan={PLANS.pay_per_listing}
            billing={billing}
            onSelect={continueToPayment}
            loading={
              loadingPlan ===
              "pay_per_listing"
            }
          />

        </section>

        {/* Part 2 continues here */}
        
                {/* ==================================================
            TRUST / PAYMENT SECTION
        ================================================== */}

        <section className="trust-section">

          <div className="trust-card">

            <div className="trust-icon">
              🔒
            </div>

            <div>
              <strong>
                Secure payments with PayFast
              </strong>

              <p>
                Your payment is processed securely
                through PayFast. Your GradLink SA
                company plan becomes active only
                after successful payment verification.
              </p>
            </div>

          </div>

          <div className="trust-items">

            <div>
              <span>✓</span>
              Secure payment processing
            </div>

            <div>
              <span>✓</span>
              No free company plan
            </div>

            <div>
              <span>✓</span>
              Upgrade when your business grows
            </div>

          </div>

        </section>

        {/* ==================================================
            FAQ / INFORMATION
        ================================================== */}

        <section className="info-section">

          <div className="info-heading">
            <span>GRADLINK SA</span>

            <h2>
              Built for graduate recruitment
            </h2>

            <p>
              Whether you are hiring for your first
              internship or managing a larger
              graduate recruitment programme,
              choose the capacity that fits your
              organisation.
            </p>
          </div>

          <div className="info-grid">

            <div className="info-item">
              <div className="info-number">
                01
              </div>

              <div>
                <h3>
                  Choose your plan
                </h3>

                <p>
                  Select the plan that matches the
                  number of active internship
                  listings your company needs.
                </p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-number">
                02
              </div>

              <div>
                <h3>
                  Complete payment
                </h3>

                <p>
                  Continue to PayFast and complete
                  the payment for your selected
                  plan.
                </p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-number">
                03
              </div>

              <div>
                <h3>
                  Start recruiting
                </h3>

                <p>
                  After payment verification, your
                  company subscription becomes
                  active and your recruitment tools
                  become available.
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
                Connecting South African graduates
                with opportunity.
              </span>
            </div>
          </div>

          <div className="footer-note">
            <span>
              © {new Date().getFullYear()} GradLink SA
            </span>

            <span>
              Companies require a paid plan.
            </span>
          </div>

        </footer>

      </div>

      {/* ====================================================
          COMPLETE PAGE STYLING
      ==================================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .pricing-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(37, 99, 235, 0.15),
              transparent 35%
            ),
            linear-gradient(
              180deg,
              #f8fbff 0%,
              #f8fafc 42%,
              #ffffff 100%
            );

          color: #0f172a;
          padding: 0 18px 70px;
        }

        .pricing-shell {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        /* ==================================================
           NAVIGATION
        ================================================== */

        .pricing-nav {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          color: #0f172a;
        }

        .brand-mark {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          font-size: 20px;
          font-weight: 900;
          box-shadow:
            0 8px 18px rgba(37, 99, 235, 0.25);
        }

        .brand > span:last-child {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 18px;
        }

        .brand strong {
          font-weight: 900;
        }

        .brand small {
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
        }

        .back-button {
          border: 1px solid #dbe3ef;
          background: rgba(255, 255, 255, 0.9);
          color: #334155;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .back-button:hover {
          border-color: #93c5fd;
          color: #1d4ed8;
          transform: translateY(-1px);
        }

        /* ==================================================
           HERO
        ================================================== */

        .hero {
          text-align: center;
          max-width: 850px;
          margin: 0 auto;
          padding: 72px 0 50px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .hero-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow:
            0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .hero h1 {
          margin: 22px 0 0;
          font-size: clamp(
            38px,
            7vw,
            68px
          );
          line-height: 1.02;
          letter-spacing: -0.045em;
          font-weight: 950;
          color: #0f172a;
        }

        .hero h1 span {
          display: block;
          color: #2563eb;
        }

        .hero-description {
          max-width: 690px;
          margin: 22px auto 0;
          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        .hero-points {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px 25px;
          margin-top: 28px;
          color: #334155;
          font-size: 14px;
          font-weight: 750;
        }

        .hero-points div {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .hero-points span {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 12px;
          font-weight: 900;
        }

        /* ==================================================
           ACTIVE BANNER
        ================================================== */

        .active-banner {
          max-width: 900px;
          margin: 0 auto 35px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 1px solid #86efac;
          background: #f0fdf4;
          border-radius: 15px;
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
          font-weight: 900;
        }

        .active-banner > div:nth-child(2) {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }

        .active-banner strong {
          color: #166534;
          font-size: 14px;
        }

        .active-banner span {
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
        }

        .active-banner button {
          border: none;
          background: transparent;
          color: #15803d;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        /* ==================================================
           ERROR
        ================================================== */

        .error-message {
          max-width: 800px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 14px 18px;
          border-radius: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 14px;
          font-weight: 750;
          text-align: center;
        }

        .error-message span {
          width: 21px;
          height: 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dc2626;
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        /* ==================================================
           BILLING
        ================================================== */

        .billing-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin: 10px 0 30px;
          padding: 22px 24px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow:
            0 10px 35px rgba(
              15,
              23,
              42,
              0.04
            );
        }

        .billing-section h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
        }

        .billing-section p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .billing-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 12px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .billing-toggle button {
          border: none;
          background: transparent;
          color: #64748b;
          min-width: 105px;
          padding: 10px 14px;
          border-radius: 9px;
          font-weight: 850;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .billing-toggle button.billing-active {
          background: #2563eb;
          color: white;
          box-shadow:
            0 5px 12px rgba(
              37,
              99,
              235,
              0.2
            );
        }

        .billing-toggle button span {
          display: block;
          margin-top: 2px;
          font-size: 9px;
          color: #16a34a;
        }

        .billing-toggle button.billing-active span {
          color: #dcfce7;
        }

        /* ==================================================
           PLANS GRID
        ================================================== */

        .plans-section {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          align-items: stretch;
          gap: 18px;
        }

        /* ==================================================
           PLAN CARD
        ================================================== */

        .plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 25px;
          border-radius: 20px;
          background: rgba(
            255,
            255,
            255,
            0.96
          );
          border: 1px solid #e2e8f0;
          box-shadow:
            0 12px 35px rgba(
              15,
              23,
              42,
              0.055
            );
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .plan-card:hover {
          transform: translateY(-4px);
          border-color: #bfdbfe;
          box-shadow:
            0 20px 45px rgba(
              15,
              23,
              42,
              0.09
            );
        }

        .plan-card-popular {
          border: 2px solid #2563eb;
          box-shadow:
            0 18px 50px rgba(
              37,
              99,
              235,
              0.16
            );
        }

        .popular-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.06em;
          white-space: nowrap;
          box-shadow:
            0 7px 16px rgba(
              37,
              99,
              235,
              0.25
            );
        }

        .popular-badge span {
          font-size: 11px;
        }

        .plan-top {
          min-height: 190px;
        }

        .plan-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 17px;
          border-radius: 12px;
          background: #eff6ff;
          font-size: 19px;
        }

        .plan-card h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .plan-description {
          min-height: 66px;
          margin: 9px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .price-area {
          margin-top: 2px;
          min-height: 78px;
        }

        .price-line {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }

        .price {
          color: #0f172a;
          font-size: 35px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.035em;
        }

        .price-period {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .saving-badge {
          display: inline-flex;
          margin-top: 9px;
          padding: 5px 8px;
          border-radius: 7px;
          background: #dcfce7;
          color: #15803d;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.04em;
        }

        .listing-limit {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 10px;
          padding: 12px;
          border-radius: 11px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 13px;
        }

        .listing-icon {
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #475569;
          font-size: 12px;
          line-height: 1.45;
        }

        .feature-check {
          flex: 0 0 auto;
          color: #16a34a;
          font-weight: 950;
        }

        .plan-spacer {
          flex: 1;
          min-height: 25px;
        }

        .plan-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 11px;
          padding: 14px 16px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .plan-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .plan-button-primary {
          background: #2563eb;
          color: white;
          box-shadow:
            0 8px 18px rgba(
              37,
              99,
              235,
              0.2
            );
        }

        .plan-button-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .plan-button-secondary {
          background: #f8fafc;
          color: #1e3a8a;
          border: 1px solid #dbeafe;
        }

        .plan-button-secondary:hover:not(:disabled) {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .button-arrow {
          font-size: 17px;
          line-height: 1;
        }

        /* ==================================================
           TRUST SECTION
        ================================================== */

        .trust-section {
          margin-top: 45px;
          padding: 24px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .trust-card {
          display: flex;
          align-items: center;
          gap: 15px;
          max-width: 800px;
          margin: 0 auto;
        }

        .trust-icon {
          flex: 0 0 auto;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #dcfce7;
          font-size: 19px;
        }

        .trust-card strong {
          display: block;
          margin-bottom: 4px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .trust-card p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .trust-items {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 28px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 750;
        }

        .trust-items div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trust-items span {
          color: #16a34a;
          font-weight: 950;
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
          margin-bottom: 35px;
        }

        .info-heading > span {
          color: #2563eb;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
        }

        .info-heading h2 {
          margin: 8px 0 10px;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.025em;
        }

        .info-heading p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 20px;
        }

        .info-item {
          display: flex;
          gap: 15px;
          padding: 20px;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .info-number {
          flex: 0 0 auto;
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
        }

        .info-item h3 {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 900;
        }

        .info-item p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
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
        }

        .footer-mark {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        .footer-brand > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-brand strong {
          font-size: 13px;
          font-weight: 900;
        }

        .footer-brand span {
          color: #94a3b8;
          font-size: 10px;
        }

        .footer-note {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        /* ==================================================
           TABLET
        ================================================== */

        @media (max-width: 1050px) {

          .plans-section {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .plan-top {
            min-height: auto;
          }

          .plan-description {
            min-height: auto;
          }

          .price-area {
            min-height: auto;
            margin-top: 20px;
          }

        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .pricing-page {
            padding-left: 12px;
            padding-right: 12px;
            padding-bottom: 45px;
          }

          .pricing-nav {
            min-height: 68px;
          }

          .brand > span:last-child {
            font-size: 16px;
          }

          .brand-mark {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }

          .back-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .hero {
            padding: 48px 5px 35px;
          }

          .hero h1 {
            font-size: 42px;
            letter-spacing: -0.045em;
          }

          .hero-description {
            font-size: 14px;
            line-height: 1.65;
          }

          .hero-points {
            flex-direction: column;
            align-items: center;
            gap: 9px;
            font-size: 12px;
          }

          .active-banner {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .active-banner button {
            width: 100%;
            padding-top: 8px;
            text-align: left;
          }

          .billing-section {
            flex-direction: column;
            align-items: stretch;
            padding: 18px;
          }

          .billing-section h2,
          .billing-section p {
            text-align: center;
          }

          .billing-toggle {
            width: 100%;
          }

          .billing-toggle button {
            flex: 1;
            min-width: 0;
          }

          .plans-section {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .plan-card {
            padding: 23px;
          }

          .plan-card-popular {
            margin-top: 6px;
          }

          .price {
            font-size: 37px;
          }

          .trust-section {
            margin-top: 35px;
            padding: 20px;
          }

          .trust-card {
            align-items: flex-start;
          }

          .trust-items {
            flex-direction: column;
            align-items: flex-start;
            gap: 9px;
          }

          .info-section {
            margin-top: 50px;
            padding: 40px 0;
          }

          .info-heading h2 {
            font-size: 26px;
          }

          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .pricing-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-note {
            align-items: flex-start;
          }

        }

        /* ==================================================
           SMALL PHONES
        ================================================== */

        @media (max-width: 390px) {

          .hero h1 {
            font-size: 36px;
          }

          .hero-badge {
            font-size: 10px;
          }

          .plan-card {
            padding: 20px;
          }

          .price {
            font-size: 34px;
          }

          .billing-toggle button {
            font-size: 12px;
            padding-left: 8px;
            padding-right: 8px;
          }

        }

      `}</style>
    </main>
  );
}