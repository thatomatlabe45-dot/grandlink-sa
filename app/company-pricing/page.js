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
      "Everything you need to start connecting with talented South African graduates.",
    monthly: 500,
    annual: 5000,
    listings: 5,
    icon: "🚀",
    features: [
      "Up to 5 active internship listings",
      "Receive graduate applications",
      "Applicant management",
      "Company profile",
      "Recruitment dashboard",
    ],
  },

  professional: {
    key: "professional",
    name: "Professional",
    eyebrow: "MOST POPULAR",
    description:
      "Powerful recruitment tools for companies hiring graduates regularly.",
    monthly: 950,
    annual: 9500,
    listings: 15,
    icon: "✦",
    popular: true,
    features: [
      "Up to 15 active internship listings",
      "Everything in Starter",
      "AI applicant matching",
      "Document verification",
      "Advanced applicant screening",
      "Smarter candidate discovery",
    ],
  },

  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    eyebrow: "HIGH-VOLUME HIRING",
    description:
      "Built for organisations managing larger graduate recruitment campaigns.",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    icon: "◆",
    features: [
      "Up to 30 active internship listings",
      "Everything in Professional",
      "AI applicant matching",
      "Document verification",
      "Advanced recruitment tools",
      "Priority recruitment capacity",
    ],
  },

  pay_per_listing: {
    key: "pay_per_listing",
    name: "Pay Per Listing",
    eyebrow: "FLEXIBLE OPTION",
    description:
      "Publish one internship without committing to a monthly subscription.",
    monthly: 250,
    annual: 250,
    listings: 1,
    icon: "◎",
    oneTime: true,
    features: [
      "1 active internship listing",
      "No monthly commitment",
      "Receive graduate applications",
      "Applicant management",
      "Company profile",
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
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L9.2 16.5L19 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
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
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6L19 12L13 18"
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
      width="18"
      height="18"
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
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7.5C8 5.01 9.79 3 12 3C14.21 3 16 5.01 16 7.5V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// PLAN ICON
// ============================================================

function PlanIcon({ plan }) {
  return (
    <div className={`plan-icon plan-icon-${plan.key}`}>
      <span>{plan.icon}</span>
    </div>
  );
}

// ============================================================
// PLAN CARD
// ============================================================

function PlanCard({
  plan,
  billing,
  loadingPlan,
  onChoose,
}) {
  const isListing = plan.key === "pay_per_listing";

  const price = isListing
    ? plan.monthly
    : billing === "annual"
      ? plan.annual
      : plan.monthly;

  const monthlyEquivalent =
    !isListing && billing === "annual"
      ? Math.round(plan.annual / 10)
      : null;

  return (
    <article
      className={`premium-plan-card ${
        plan.popular ? "premium-plan-card-popular" : ""
      }`}
    >
      {plan.popular && (
        <div className="popular-ribbon">
          <span>✦</span>
          MOST POPULAR
        </div>
      )}

      <div className="plan-card-inner">
        <div className="plan-top">
          <div className="plan-heading">
            <PlanIcon plan={plan} />

            <div>
              <div className="plan-eyebrow">{plan.eyebrow}</div>
              <h2>{plan.name}</h2>
            </div>
          </div>

          <div className="listing-badge">
            <span>{plan.listings}</span>
            <small>
              {plan.listings === 1 ? "LISTING" : "LISTINGS"}
            </small>
          </div>
        </div>

        <div className="plan-description">
          {plan.description}
        </div>

        <div className="plan-price-area">
          <div className="plan-price">
            <span className="currency">R</span>
            <span className="price-number">
              {Number(price).toLocaleString("en-ZA")}
            </span>
          </div>

          <div className="price-period">
            {isListing ? (
              <>
                <strong>one-time</strong>
                <span>for 1 listing</span>
              </>
            ) : billing === "annual" ? (
              <>
                <strong>per year</strong>
                <span>R{monthlyEquivalent?.toLocaleString("en-ZA")}/mo equivalent</span>
              </>
            ) : (
              <>
                <strong>per month</strong>
                <span>cancel when you need to</span>
              </>
            )}
          </div>
        </div>

        {!isListing && billing === "annual" && (
          <div className="annual-saving">
            <span>✓</span>
            SAVE 2 MONTHS WITH ANNUAL BILLING
          </div>
        )}

        <div className="plan-divider" />

        <div className="feature-heading">
          <span>What's included</span>
        </div>

        <ul className="plan-features">
          {plan.features.map((feature, index) => (
            <li key={`${plan.key}-feature-${index}`}>
              <span className="feature-check">
                <CheckIcon />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`plan-button ${
            plan.popular ? "plan-button-primary" : ""
          }`}
          onClick={() => onChoose(plan.key)}
          disabled={Boolean(loadingPlan)}
        >
          {loadingPlan === plan.key ? (
            <>
              <span className="button-spinner" />
              Processing...
            </>
          ) : (
            <>
              <span>
                {isListing
                  ? "Publish a Listing"
                  : `Choose ${plan.name}`}
              </span>
              <ArrowIcon />
            </>
          )}
        </button>

        <div className="secure-note">
          <LockIcon />
          <span>Secure payment powered by PayFast</span>
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
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD USER + SUBSCRIPTION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User loading error:", userError);
        }

        if (!mounted) return;

        setUser(authUser || null);

        if (!authUser) {
          setCurrentSubscription(null);
          setLoading(false);
          return;
        }

        const { data: subscription, error: subscriptionError } =
          await supabase
            .from("company_subscriptions")
            .select("*")
            .eq("company_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(1);

        if (subscriptionError) {
          console.error(
            "Subscription loading error:",
            subscriptionError
          );
        }

        if (!mounted) return;

        setCurrentSubscription(
          subscription && subscription.length > 0
            ? subscription[0]
            : null
        );
      } catch (err) {
        console.error("Pricing page error:", err);

        if (mounted) {
          setError(
            "We could not load your subscription information. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // ACTIVE SUBSCRIPTION
  // ==========================================================

  const active =
    currentSubscription?.status?.toLowerCase() === "active";

  // ==========================================================
  // CONTINUE TO PAYMENT
  // ==========================================================

  async function continueToPayment(planKey) {
    try {
      setError("");
      setLoadingPlan(planKey);

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

      const selectedPlan = PLANS[planKey];

      if (!selectedPlan) {
        setError("The selected plan could not be found.");
        return;
      }

      const selectedBilling =
        planKey === "pay_per_listing"
          ? "listing"
          : billing;

      // -------------------------------------------------------
      // CHECK FOR ACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      const { data: activeSubscriptions, error: activeError } =
        await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .ilike("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);

      if (activeError) {
        console.error(
          "Active subscription check error:",
          activeError
        );
      }

      const activeSubscription =
        activeSubscriptions &&
        activeSubscriptions.length > 0
          ? activeSubscriptions[0]
          : null;

      if (
        activeSubscription &&
        planKey !== "pay_per_listing"
      ) {
        router.push("/company");
        return;
      }

      // -------------------------------------------------------
      // CALCULATE AMOUNT
      // -------------------------------------------------------

      const amount =
        planKey === "pay_per_listing"
          ? selectedPlan.monthly
          : selectedBilling === "annual"
            ? selectedPlan.annual
            : selectedPlan.monthly;

      // -------------------------------------------------------
      // LOOK FOR EXISTING INACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      const { data: inactiveSubscriptions, error: inactiveError } =
        await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .ilike("status", "inactive")
          .order("created_at", { ascending: false })
          .limit(1);

      if (inactiveError) {
        console.error(
          "Inactive subscription lookup error:",
          inactiveError
        );
      }

      const existingInactive =
        inactiveSubscriptions &&
        inactiveSubscriptions.length > 0
          ? inactiveSubscriptions[0]
          : null;

      let subscriptionId = null;

      // -------------------------------------------------------
      // UPDATE EXISTING INACTIVE SUBSCRIPTION
      // -------------------------------------------------------

      if (existingInactive) {
        const { data: updatedSubscription, error: updateError } =
          await supabase
            .from("company_subscriptions")
            .update({
              plan: planKey,
              status: "inactive",
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingInactive.id)
            .select()
            .single();

        if (updateError) {
          console.error(
            "Subscription update error:",
            updateError
          );

          setError(
            updateError.message ||
              "We could not prepare your subscription."
          );

          return;
        }

        subscriptionId = updatedSubscription?.id;
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
              plan: planKey,
              status: "inactive",
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
            })
            .select()
            .single();

        if (insertError) {
          console.error(
            "Subscription creation error:",
            insertError
          );

          setError(
            insertError.message ||
              "We could not create your subscription."
          );

          return;
        }

        subscriptionId = newSubscription?.id;
      }

      // -------------------------------------------------------
      // GO TO PAYFAST PAYMENT PAGE
      // -------------------------------------------------------

      if (!subscriptionId) {
        setError(
          "We could not create a subscription reference. Please try again."
        );
        return;
      }

      router.push(
        `/company/payment?plan=${encodeURIComponent(
          planKey
        )}&billing=${encodeURIComponent(
          selectedBilling
        )}&subscription=${encodeURIComponent(
          subscriptionId
        )}`
      );
    } catch (err) {
      console.error("Payment preparation error:", err);

      setError(
        err?.message ||
          "Something went wrong while preparing your payment."
      );
    } finally {
      setLoadingPlan("");
    }
  }
  
    // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <div className="pricing-page">
        {/* ================================================== */}
        {/* NAVIGATION */}
        {/* ================================================== */}

        <header className="pricing-nav">
          <div className="nav-container">
            <button
              type="button"
              className="brand"
              onClick={() => router.push("/")}
            >
              <span className="brand-mark">G</span>

              <span className="brand-text">
                <strong>GradLink</strong>
                <span>SA</span>
              </span>
            </button>

            <div className="nav-right">
              {user ? (
                <>
                  <button
                    type="button"
                    className="nav-dashboard"
                    onClick={() =>
                      router.push(
                        active ? "/company" : "/company-pricing"
                      )
                    }
                  >
                    {active ? "Dashboard" : "Pricing"}
                  </button>

                  <div className="nav-status">
                    <span className="status-dot" />
                    Company account
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="nav-login"
                  onClick={() =>
                    router.push(
                      "/login?redirect=/company-pricing"
                    )
                  }
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <main>
          <section className="hero-section">
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />

            <div className="hero-container">
              <div className="hero-pill">
                <span className="hero-pill-dot" />
                <span>GRADLINK SA FOR EMPLOYERS</span>
              </div>

              <h1>
                Find the right graduates.
                <br />

                <span>Build your future team.</span>
              </h1>

              <p className="hero-description">
                Powerful recruitment tools designed to help
                South African companies discover, evaluate and
                connect with emerging graduate talent.
              </p>

              <div className="hero-points">
                <div>
                  <span>
                    <CheckIcon />
                  </span>
                  Graduate talent network
                </div>

                <div>
                  <span>
                    <CheckIcon />
                  </span>
                  Smart applicant matching
                </div>

                <div>
                  <span>
                    <CheckIcon />
                  </span>
                  Secure PayFast payments
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* ACTIVE SUBSCRIPTION */}
          {/* ================================================= */}

          {active && (
            <section className="active-section">
              <div className="active-banner">
                <div className="active-left">
                  <div className="active-icon">
                    <CheckIcon />
                  </div>

                  <div>
                    <strong>Your company plan is active</strong>

                    <span>
                      You already have an active{" "}
                      {currentSubscription?.plan
                        ? currentSubscription.plan
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (char) =>
                              char.toUpperCase()
                            )
                        : "subscription"}{" "}
                      subscription.
                    </span>
                  </div>
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

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <section className="message-section">
              <div className="error-message">
                <span className="error-symbol">!</span>
                <span>{error}</span>
              </div>
            </section>
          )}

          {/* ================================================= */}
          {/* PRICING */}
          {/* ================================================= */}

          <section className="plans-section">
            <div className="plans-container">
              <div className="section-heading">
                <div className="section-kicker">
                  SIMPLE, TRANSPARENT PRICING
                </div>

                <h2>
                  Choose the plan that
                  <br />
                  <span>fits your hiring needs.</span>
                </h2>

                <p>
                  Start recruiting graduates with the tools
                  your company needs. No hidden platform fees.
                </p>
              </div>

              {/* BILLING SWITCH */}

              <div className="billing-wrapper">
                <div className="billing-switch">
                  <button
                    type="button"
                    className={
                      billing === "monthly"
                        ? "billing-option active"
                        : "billing-option"
                    }
                    onClick={() => setBilling("monthly")}
                  >
                    Monthly
                  </button>

                  <button
                    type="button"
                    className={
                      billing === "annual"
                        ? "billing-option active"
                        : "billing-option"
                    }
                    onClick={() => setBilling("annual")}
                  >
                    Annual

                    <span className="save-badge">
                      SAVE 2 MONTHS
                    </span>
                  </button>
                </div>

                <div className="billing-note">
                  {billing === "annual"
                    ? "Pay annually and get 2 months free."
                    : "Switch to annual billing to save 2 months."}
                </div>
              </div>

              {/* ================================================= */}
              {/* STACKED PLANS */}
              {/* ================================================= */}

              <div className="plans-list">
                <PlanCard
                  plan={PLANS.starter}
                  billing={billing}
                  loadingPlan={loadingPlan}
                  onChoose={continueToPayment}
                />

                <PlanCard
                  plan={PLANS.professional}
                  billing={billing}
                  loadingPlan={loadingPlan}
                  onChoose={continueToPayment}
                />

                <PlanCard
                  plan={PLANS.enterprise}
                  billing={billing}
                  loadingPlan={loadingPlan}
                  onChoose={continueToPayment}
                />

                <PlanCard
                  plan={PLANS.pay_per_listing}
                  billing={billing}
                  loadingPlan={loadingPlan}
                  onChoose={continueToPayment}
                />
              </div>

              {/* ================================================= */}
              {/* PAYMENT TRUST */}
              {/* ================================================= */}

              <div className="payment-trust">
                <div className="trust-icon">
                  <LockIcon />
                </div>

                <div className="trust-content">
                  <strong>Secure payments with PayFast</strong>

                  <span>
                    Your payment is securely processed through
                    PayFast. Your GradLink SA company plan is
                    activated only after payment verification.
                  </span>
                </div>

                <div className="payfast-wordmark">
                  PAYFAST
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* HOW IT WORKS */}
          {/* ================================================= */}

          <section className="process-section">
            <div className="process-container">
              <div className="process-heading">
                <div className="section-kicker">
                  GET STARTED IN MINUTES
                </div>

                <h2>
                  From payment to
                  <br />
                  <span>your first applicant.</span>
                </h2>
              </div>

              <div className="process-grid">
                <div className="process-item">
                  <div className="process-number">01</div>

                  <div>
                    <h3>Choose your plan</h3>

                    <p>
                      Select the recruitment plan that matches
                      the number of opportunities your company
                      wants to advertise.
                    </p>
                  </div>
                </div>

                <div className="process-line" />

                <div className="process-item">
                  <div className="process-number">02</div>

                  <div>
                    <h3>Complete payment</h3>

                    <p>
                      Complete your secure payment through
                      PayFast. Your subscription remains
                      protected until payment is verified.
                    </p>
                  </div>
                </div>

                <div className="process-line" />

                <div className="process-item">
                  <div className="process-number">03</div>

                  <div>
                    <h3>Start recruiting</h3>

                    <p>
                      Once verified, access your company
                      dashboard and begin connecting with
                      graduate candidates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* VALUE SECTION */}
          {/* ================================================= */}

          <section className="value-section">
            <div className="value-container">
              <div className="value-copy">
                <div className="section-kicker">
                  BUILT FOR MODERN RECRUITMENT
                </div>

                <h2>
                  More than a listing.
                  <br />
                  <span>A complete hiring workflow.</span>
                </h2>

                <p>
                  GradLink SA brings graduate opportunities,
                  applications and recruitment tools together
                  in one professional platform.
                </p>
              </div>

              <div className="value-features">
                <div className="value-feature">
                  <div className="value-feature-icon">✦</div>

                  <div>
                    <strong>Smart applicant matching</strong>

                    <span>
                      Identify candidates whose qualifications,
                      field of study and skills align with your
                      opportunity.
                    </span>
                  </div>
                </div>

                <div className="value-feature">
                  <div className="value-feature-icon">✓</div>

                  <div>
                    <strong>Document verification</strong>

                    <span>
                      Access recruitment tools designed to
                      support more informed candidate review.
                    </span>
                  </div>
                </div>

                <div className="value-feature">
                  <div className="value-feature-icon">◆</div>

                  <div>
                    <strong>One professional dashboard</strong>

                    <span>
                      Manage your company profile, listings and
                      applicants from one central workspace.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <footer className="pricing-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <button
                type="button"
                className="brand footer-brand-button"
                onClick={() => router.push("/")}
              >
                <span className="brand-mark">G</span>

                <span className="brand-text">
                  <strong>GradLink</strong>
                  <span>SA</span>
                </span>
              </button>

              <p>
                Connecting South African graduates with
                meaningful career opportunities.
              </p>
            </div>

            <div className="footer-right">
              <span>© {new Date().getFullYear()} GradLink SA</span>

              <span className="footer-separator">•</span>

              <span>Built for South African talent.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ==================================================== */}
      {/* PREMIUM STYLES */}
      {/* ==================================================== */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .pricing-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(37, 99, 235, 0.13),
              transparent 38%
            ),
            #f7faff;
          color: #0f172a;
          overflow-x: hidden;
        }

        button {
          font-family: inherit;
        }

        /* ================================================== */
        /* NAVIGATION */
        /* ================================================== */

        .pricing-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nav-container {
          width: min(1160px, calc(100% - 40px));
          min-height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          border: 0;
          background: transparent;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
          color: #0f172a;
        }

        .brand-mark {
          width: 39px;
          height: 39px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 21px;
          font-weight: 800;
          box-shadow:
            0 8px 22px rgba(37, 99, 235, 0.24);
        }

        .brand-text {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .brand-text strong {
          font-weight: 800;
        }

        .brand-text span {
          color: #2563eb;
          font-weight: 800;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
        }

        .nav-dashboard,
        .nav-login {
          border: 0;
          cursor: pointer;
          border-radius: 11px;
          padding: 10px 17px;
          font-size: 13px;
          font-weight: 700;
        }

        .nav-dashboard {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .nav-login {
          background: #0f172a;
          color: white;
        }

        /* ================================================== */
        /* HERO */
        /* ================================================== */

        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 92px 20px 80px;
          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #f8fbff 100%
            );
          border-bottom: 1px solid #e8eef7;
        }

        .hero-container {
          position: relative;
          z-index: 2;
          width: min(860px, 100%);
          margin: 0 auto;
          text-align: center;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 13px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background: rgba(239, 246, 255, 0.8);
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.9px;
        }

        .hero-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .hero-container h1 {
          margin: 25px 0 20px;
          color: #0b1220;
          font-size: clamp(42px, 6vw, 70px);
          line-height: 1.02;
          letter-spacing: -3.2px;
          font-weight: 850;
        }

        .hero-container h1 span {
          color: #2563eb;
        }

        .hero-description {
          width: min(680px, 100%);
          margin: 0 auto;
          color: #64748b;
          font-size: 17px;
          line-height: 1.75;
        }

        .hero-points {
          margin-top: 30px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 24px;
        }

        .hero-points div {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .hero-points span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
        }

        .hero-points svg {
          width: 12px;
          height: 12px;
        }

        .hero-glow {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          opacity: 0.3;
        }

        .hero-glow-one {
          top: -230px;
          left: -100px;
          background: #bfdbfe;
        }

        .hero-glow-two {
          top: -200px;
          right: -100px;
          background: #dbeafe;
        }

        /* ================================================== */
        /* ACTIVE */
        /* ================================================== */

        .active-section,
        .message-section {
          width: min(920px, calc(100% - 40px));
          margin: 26px auto 0;
        }

        .active-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 20px;
          border: 1px solid #bbf7d0;
          border-radius: 17px;
          background: #f0fdf4;
        }

        .active-left {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .active-icon {
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #dcfce7;
          color: #15803d;
        }

        .active-left strong,
        .active-left span {
          display: block;
        }

        .active-left strong {
          color: #166534;
          font-size: 14px;
        }

        .active-left span {
          margin-top: 3px;
          color: #4d7c5b;
          font-size: 12px;
        }

        .active-banner button {
          flex: 0 0 auto;
          border: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          padding: 10px 14px;
          background: #15803d;
          color: white;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 17px;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: #fff7f7;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 600;
        }

        .error-symbol {
          width: 25px;
          height: 25px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #fee2e2;
          font-weight: 800;
        }

        /* ================================================== */
        /* PRICING */
        /* ================================================== */

        .plans-section {
          padding: 95px 20px 100px;
        }

        .plans-container {
          width: min(920px, 100%);
          margin: 0 auto;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 45px;
        }

        .section-kicker {
          color: #2563eb;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1.3px;
        }

        .section-heading h2,
        .process-heading h2,
        .value-copy h2 {
          margin: 12px 0 15px;
          color: #0f172a;
          font-size: clamp(32px, 5vw, 48px);
          line-height: 1.08;
          letter-spacing: -2px;
          font-weight: 850;
        }

        .section-heading h2 span,
        .process-heading h2 span,
        .value-copy h2 span {
          color: #2563eb;
        }

        .section-heading p {
          width: min(570px, 100%);
          margin: 0 auto;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
        }

        /* ================================================== */
        /* BILLING */
        /* ================================================== */

        .billing-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 34px;
        }

        .billing-switch {
          display: inline-flex;
          align-items: center;
          padding: 5px;
          border: 1px solid #dbe3ef;
          border-radius: 14px;
          background: white;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
        }

        .billing-option {
          min-width: 120px;
          min-height: 43px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 750;
        }

        .billing-option.active {
          background: #0f172a;
          color: white;
          box-shadow: 0 5px 14px rgba(15, 23, 42, 0.16);
        }

        .save-badge {
          display: inline-block;
          margin-left: 6px;
          padding: 3px 5px;
          border-radius: 5px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 8px;
          font-weight: 850;
          vertical-align: 2px;
        }

        .billing-option.active .save-badge {
          background: rgba(255, 255, 255, 0.16);
          color: #bfdbfe;
        }

        .billing-note {
          margin-top: 10px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        /* ================================================== */
        /* PLAN LIST */
        /* ================================================== */

        .plans-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .premium-plan-card {
          position: relative;
          border: 1px solid #e2e8f0;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 15px 45px rgba(15, 23, 42, 0.055);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .premium-plan-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow:
            0 22px 55px rgba(15, 23, 42, 0.09);
        }

        .premium-plan-card-popular {
          border: 1.5px solid #3b82f6;
          box-shadow:
            0 20px 60px rgba(37, 99, 235, 0.13);
        }

        .popular-ribbon {
          position: absolute;
          top: 0;
          left: 28px;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.8px;
          box-shadow:
            0 8px 20px rgba(37, 99, 235, 0.25);
        }

        .plan-card-inner {
          padding: 32px;
        }

        .premium-plan-card-popular .plan-card-inner {
          padding-top: 37px;
        }

        .plan-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .plan-heading {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .plan-icon {
          width: 51px;
          height: 51px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 22px;
          font-weight: 800;
          box-shadow:
            inset 0 0 0 1px #dbeafe;
        }

        .plan-icon-professional {
          background: #2563eb;
          color: white;
          box-shadow:
            0 9px 22px rgba(37, 99, 235, 0.22);
        }

        .plan-icon-enterprise {
          background: #eef2ff;
          color: #4338ca;
          box-shadow:
            inset 0 0 0 1px #e0e7ff;
        }

        .plan-icon-pay_per_listing {
          background: #f8fafc;
          color: #475569;
          box-shadow:
            inset 0 0 0 1px #e2e8f0;
        }

        .plan-eyebrow {
          margin-bottom: 3px;
          color: #64748b;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .plan-heading h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          letter-spacing: -0.8px;
          font-weight: 850;
        }

        .listing-badge {
          display: flex;
          align-items: baseline;
          gap: 5px;
          padding: 9px 12px;
          border-radius: 11px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .listing-badge span {
          color: #0f172a;
          font-size: 18px;
          font-weight: 850;
        }

        .listing-badge small {
          color: #64748b;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.6px;
        }

        .plan-description {
          max-width: 650px;
          margin: 20px 0 25px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.65;
        }

        .plan-price-area {
          display: flex;
          align-items: flex-end;
          gap: 17px;
        }

        .plan-price {
          display: flex;
          align-items: flex-start;
          color: #0f172a;
        }

        .currency {
          margin-top: 8px;
          margin-right: 3px;
          color: #475569;
          font-size: 19px;
          font-weight: 750;
        }

        .price-number {
          font-size: 45px;
          line-height: 0.95;
          letter-spacing: -2.5px;
          font-weight: 850;
        }

        .price-period {
          display: flex;
          flex-direction: column;
          padding-bottom: 2px;
        }

        .price-period strong {
          color: #334155;
          font-size: 12px;
        }

        .price-period span {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .annual-saving {
          width: fit-content;
          margin-top: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 7px;
          background: #ecfdf5;
          color: #047857;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.3px;
        }

        .plan-divider {
          height: 1px;
          margin: 28px 0 22px;
          background: #e8edf4;
        }

        .feature-heading {
          margin-bottom: 13px;
          color: #334155;
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .plan-features {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px 30px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #475569;
          font-size: 12px;
          line-height: 1.45;
        }

        .feature-check {
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
        }

        .feature-check svg {
          width: 12px;
          height: 12px;
        }

        .plan-button {
          width: 100%;
          min-height: 51px;
          margin-top: 28px;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: white;
          color: #0f172a;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: 160ms ease;
        }

        .plan-button:hover:not(:disabled) {
          border-color: #94a3b8;
          background: #f8fafc;
        }

        .plan-button-primary {
          border-color: #2563eb;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
          color: white;
          box-shadow:
            0 10px 25px rgba(37, 99, 235, 0.2);
        }

        .plan-button-primary:hover:not(:disabled) {
          border-color: #1d4ed8;
          background:
            linear-gradient(
              135deg,
              #1d4ed8,
              #1e40af
            );
        }

        .plan-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .secure-note {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
        }

        .secure-note svg {
          width: 13px;
          height: 13px;
        }

        .button-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================================== */
        /* PAYMENT TRUST */
        /* ================================================== */

        .payment-trust {
          margin-top: 35px;
          padding: 21px 23px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #dbeafe;
          border-radius: 17px;
          background:
            linear-gradient(
              135deg,
              #f8fbff,
              #eff6ff
            );
        }

        .trust-icon {
          width: 43px;
          height: 43px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: white;
          color: #2563eb;
          box-shadow:
            0 5px 15px rgba(37, 99, 235, 0.08);
        }

        .trust-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .trust-content strong {
          color: #1e3a8a;
          font-size: 12px;
        }

        .trust-content span {
          max-width: 620px;
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.5;
        }

        .payfast-wordmark {
          margin-left: auto;
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        /* ================================================== */
        /* PROCESS */
        /* ================================================== */

        .process-section {
          padding: 100px 20px;
          background: #0b1220;
          color: white;
        }

        .process-container {
          width: min(1100px, 100%);
          margin: 0 auto;
        }

        .process-heading {
          max-width: 620px;
          margin-bottom: 55px;
        }

        .process-heading h2 {
          color: white;
          margin-bottom: 0;
        }

        .process-heading h2 span {
          color: #60a5fa;
        }

        .process-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 25px;
        }

        .process-item {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .process-number {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.13);
          color: #60a5fa;
          font-size: 11px;
          font-weight: 850;
        }

        .process-item h3 {
          margin: 0 0 8px;
          color: white;
          font-size: 16px;
          font-weight: 800;
        }

        .process-item p {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.7;
        }

        .process-line {
          width: 55px;
          height: 1px;
          background: rgba(148, 163, 184, 0.2);
        }

        /* ================================================== */
        /* VALUE */
        /* ================================================== */

        .value-section {
          padding: 100px 20px;
          background: white;
        }

        .value-container {
          width: min(1100px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 90px;
          align-items: center;
        }

        .value-copy p {
          max-width: 470px;
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.75;
        }

        .value-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .value-feature {
          display: flex;
          gap: 15px;
          padding: 19px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
        }

        .value-feature-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 850;
        }

        .value-feature strong,
        .value-feature span {
          display: block;
        }

        .value-feature strong {
          color: #0f172a;
          font-size: 13px;
        }

        .value-feature span {
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
        }

        /* ================================================== */
        /* FOOTER */
        /* ================================================== */

        .pricing-footer {
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .footer-container {
          width: min(1100px, calc(100% - 40px));
          min-height: 110px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .footer-brand-button {
          cursor: pointer;
        }

        .footer-brand p {
          max-width: 330px;
          margin: 8px 0 0 50px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
        }

        .footer-separator {
          color: #cbd5e1;
        }

        /* ================================================== */
        /* TABLET */
        /* ================================================== */

        @media (max-width: 800px) {
          .process-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .process-line {
            display: none;
          }

          .value-container {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .footer-container {
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            padding: 28px 0;
          }
        }

        /* ================================================== */
        /* MOBILE */
        /* ================================================== */

        @media (max-width: 600px) {
          .nav-container {
            width: calc(100% - 28px);
            min-height: 66px;
          }

          .brand-mark {
            width: 35px;
            height: 35px;
            border-radius: 10px;
            font-size: 18px;
          }

          .brand-text {
            font-size: 18px;
          }

          .nav-status {
            display: none;
          }

          .nav-dashboard,
          .nav-login {
            padding: 9px 12px;
            font-size: 11px;
          }

          .hero-section {
            padding: 70px 16px 65px;
          }

          .hero-container h1 {
            margin-top: 22px;
            font-size: 43px;
            line-height: 1.02;
            letter-spacing: -2.4px;
          }

          .hero-description {
            font-size: 14px;
            line-height: 1.7;
          }

          .hero-points {
            flex-direction: column;
            align-items: center;
            gap: 9px;
          }

          .hero-points div {
            font-size: 11px;
          }

          .active-section,
          .message-section {
            width: calc(100% - 28px);
          }

          .active-banner {
            flex-direction: column;
            align-items: stretch;
          }

          .active-banner button {
            width: 100%;
            justify-content: center;
          }

          .plans-section {
            padding: 75px 14px 75px;
          }

          .section-heading {
            margin-bottom: 36px;
          }

          .section-heading h2,
          .process-heading h2,
          .value-copy h2 {
            font-size: 34px;
            letter-spacing: -1.7px;
          }

          .section-heading p {
            font-size: 13px;
          }

          .billing-switch {
            width: 100%;
            max-width: 350px;
          }

          .billing-option {
            flex: 1;
            min-width: 0;
            padding: 0 7px;
          }

          .save-badge {
            display: block;
            width: fit-content;
            margin: 2px auto 0;
          }

          .billing-note {
            text-align: center;
            font-size: 10px;
          }

          .plans-list {
            gap: 19px;
          }

          .premium-plan-card {
            border-radius: 20px;
          }

          .premium-plan-card:hover {
            transform: none;
          }

          .popular-ribbon {
            left: 18px;
            font-size: 8px;
          }

          .plan-card-inner,
          .premium-plan-card-popular .plan-card-inner {
            padding: 25px 20px;
          }

          .premium-plan-card-popular .plan-card-inner {
            padding-top: 31px;
          }

          .plan-top {
            gap: 12px;
          }

          .plan-heading {
            gap: 11px;
          }

          .plan-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            font-size: 19px;
          }

          .plan-eyebrow {
            font-size: 8px;
          }

          .plan-heading h2 {
            font-size: 20px;
          }

          .listing-badge {
            padding: 7px 9px;
          }

          .listing-badge span {
            font-size: 16px;
          }

          .listing-badge small {
            font-size: 7px;
          }

          .plan-description {
            margin: 17px 0 21px;
            font-size: 12px;
          }

          .plan-price-area {
            gap: 12px;
          }

          .currency {
            margin-top: 7px;
            font-size: 16px;
          }

          .price-number {
            font-size: 38px;
            letter-spacing: -2px;
          }

          .price-period strong {
            font-size: 11px;
          }

          .price-period span {
            font-size: 9px;
          }

          .plan-divider {
            margin: 23px 0 19px;
          }

          .plan-features {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .plan-features li {
            font-size: 11px;
          }

          .plan-button {
            min-height: 49px;
            margin-top: 24px;
            font-size: 12px;
          }

          .payment-trust {
            padding: 18px;
            align-items: flex-start;
          }

          .trust-icon {
            width: 38px;
            height: 38px;
          }

          .trust-content strong {
            font-size: 11px;
          }

          .trust-content span {
            font-size: 9px;
          }

          .payfast-wordmark {
            display: none;
          }

          .process-section {
            padding: 75px 18px;
          }

          .process-heading {
            margin-bottom: 38px;
          }

          .process-item {
            gap: 15px;
          }

          .process-item h3 {
            font-size: 15px;
          }

          .process-item p {
            font-size: 11px;
          }

          .value-section {
            padding: 75px 18px;
          }

          .value-feature {
            padding: 16px;
          }

          .footer-container {
            width: calc(100% - 28px);
          }

          .footer-brand p {
            margin-left: 0;
          }

          .footer-right {
            flex-wrap: wrap;
            line-height: 1.5;
          }
        }

        @media (max-width: 380px) {
          .hero-container h1 {
            font-size: 38px;
          }

          .section-heading h2,
          .process-heading h2,
          .value-copy h2 {
            font-size: 31px;
          }

          .plan-card-inner,
          .premium-plan-card-popular .plan-card-inner {
            padding-left: 17px;
            padding-right: 17px;
          }

          .plan-heading h2 {
            font-size: 18px;
          }

          .listing-badge {
            padding: 6px 7px;
          }

          .listing-badge small {
            display: none;
          }
        }
      `}</style>
    </>
  );
}