"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// PRICING
// ============================================================

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 500,
    description:
      "For businesses starting their graduate recruitment journey.",
    features: [
      "Company profile",
      "Post internship opportunities",
      "Receive applications",
      "View applicant profiles",
      "Manage applications",
      "Contact applicants",
    ],
    popular: false,
  },

  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 1000,
    description:
      "For companies actively recruiting South African graduates.",
    features: [
      "Everything in Starter",
      "More internship listings",
      "AI candidate matching",
      "Skills matching",
      "Advanced applicant filters",
      "Applicant insights",
      "Recruitment management tools",
    ],
    popular: true,
  },

  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 2000,
    description:
      "For companies wanting advanced AI-powered recruitment.",
    features: [
      "Everything in Professional",
      "AI-assisted document verification",
      "CV consistency checks",
      "Qualification document analysis",
      "Advanced AI candidate analysis",
      "Recruitment analytics",
      "Priority support",
    ],
    popular: false,
  },
];

// ============================================================
// BILLING HELPERS
// ============================================================

function getAnnualPrice(monthlyPrice) {
  // 15% discount on the normal 12-month cost
  return Math.round(monthlyPrice * 12 * 0.85);
}

function getAnnualSaving(monthlyPrice) {
  const normalAnnualPrice = monthlyPrice * 12;
  const discountedAnnualPrice = getAnnualPrice(monthlyPrice);

  return normalAnnualPrice - discountedAnnualPrice;
}

function formatCurrency(amount) {
  return `R${amount.toLocaleString("en-ZA")}`;
}

// ============================================================
// PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");

  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD COMPANY
  // ==========================================================

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setLoadingUser(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setError("We could not load your account.");
        return;
      }

      setUser(user);

      if (!user) {
        return;
      }

      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error(subscriptionError);

        // Don't block the pricing page if the subscription
        // record does not exist yet.
        return;
      }

      if (subscription) {
        setCurrentPlan(subscription);
      }
    } catch (err) {
      console.error("Load company error:", err);
      setError("Something went wrong while loading your account.");
    } finally {
      setLoadingUser(false);
    }
  }

  // ==========================================================
  // CHOOSE PLAN
  // ==========================================================

  async function choosePlan(plan) {
    setMessage("");
    setError("");

    try {
      setSelectingPlan(plan.id);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login?redirect=/company-pricing");
        return;
      }

      // --------------------------------------------------------
      // CORRECT BILLING CALCULATION
      // --------------------------------------------------------
      //
      // Monthly:
      //   Starter       R500/month
      //   Professional  R1,000/month
      //   Premium       R2,000/month
      //
      // Annual:
      //   12 months minus 15%
      //
      // Starter       R5,100/year
      // Professional  R10,200/year
      // Premium       R20,400/year
      //
      // --------------------------------------------------------

      const monthlyPrice = plan.monthlyPrice;

      const annualPrice = getAnnualPrice(monthlyPrice);

      const selectedPrice =
        billing === "annual"
          ? annualPrice
          : monthlyPrice;

      // --------------------------------------------------------
      // IMPORTANT
      // --------------------------------------------------------
      //
      // Selecting a plan DOES NOT activate Premium.
      //
      // The subscription remains "inactive" until a real
      // payment provider confirms successful payment.
      //
      // --------------------------------------------------------

      const subscriptionData = {
        company_id: user.id,

        plan: plan.id,

        billing_cycle: billing,

        monthly_price: monthlyPrice,

        annual_price: annualPrice,

        status: "inactive",

        payment_provider: null,

        payment_reference: null,

        updated_at: new Date().toISOString(),
      };

      const {
        data,
        error: saveError,
      } = await supabase
        .from("company_subscriptions")
        .upsert(
          subscriptionData,
          {
            onConflict: "company_id",
          }
        )
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setCurrentPlan(data);

      // --------------------------------------------------------
      // PAYMENT NOT CONNECTED YET
      // --------------------------------------------------------

      setMessage(
        `${plan.name} selected at ${formatCurrency(
          selectedPrice
        )} ${
          billing === "annual"
            ? "per year"
            : "per month"
        }. Payment is required to activate the subscription.`
      );

      // --------------------------------------------------------
      // FUTURE PAYMENT FLOW
      // --------------------------------------------------------
      //
      // Later this is where we will send the company to the
      // real payment checkout.
      //
      // Example:
      //
      // router.push("/company-checkout");
      //
      // We are NOT activating the subscription here.
      // --------------------------------------------------------
    } catch (err) {
      console.error("Plan selection error:", err);

      setError(
        err?.message ||
          "Something went wrong while selecting your plan."
      );
    } finally {
      setSelectingPlan(null);
    }
  }

  // ==========================================================
  // PRICE DISPLAY
  // ==========================================================

  function getDisplayedPrice(plan) {
    if (billing === "annual") {
      return getAnnualPrice(plan.monthlyPrice);
    }

    return plan.monthlyPrice;
  }

  function getPricePeriod() {
    return billing === "annual"
      ? "/year"
      : "/month";
  }

  // ==========================================================
  // ANNUAL EQUIVALENT
  // ==========================================================

  function getMonthlyEquivalent(plan) {
    if (billing !== "annual") {
      return null;
    }

    return Math.round(
      getAnnualPrice(plan.monthlyPrice) / 12
    );
  }

  // ==========================================================
  // SELECTED PLAN
  // ==========================================================

  function isPlanSelected(plan) {
    return currentPlan?.plan === plan.id;
  }

  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  function isActiveSubscription() {
    return (
      currentPlan?.status?.toLowerCase() ===
      "active"
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="pricing-page">

      {/* ======================================================
          NAVBAR
      ======================================================= */}

      <nav className="navbar">

        <Link href="/" className="logo">

          <span className="logo-icon">
            G
          </span>

          <span>
            GradLink <strong>SA</strong>
          </span>

        </Link>

        <div className="nav-links">

          <Link href="/">
            Home
          </Link>

          <Link href="/internships">
            Internships
          </Link>

          <Link href="/jobs">
            Jobs
          </Link>

          <Link href="/company">
            Company
          </Link>

        </div>

        <div className="nav-actions">

          <Link
            href="/login"
            className="login-btn"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="signup-btn"
          >
            Get Started
          </Link>

        </div>

      </nav>

      {/* ======================================================
          HERO
      ======================================================= */}

      <section className="hero">

        <div className="badge">
          🚀 Built for South African businesses
        </div>

        <h1>
          Recruit better.
          <br />
          <span>
            Grow with GradLink SA.
          </span>
        </h1>

        <p>
          Access talented South African graduates,
          manage applications, and use AI-powered
          recruitment tools to find the right
          candidates.
        </p>

        {/* ==================================================
            BILLING TOGGLE
        =================================================== */}

        <div className="billing-toggle">

          <button
            type="button"
            className={
              billing === "monthly"
                ? "active"
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
                ? "active"
                : ""
            }
            onClick={() =>
              setBilling("annual")
            }
          >
            Annual

            <span className="save">
              Save 15%
            </span>
          </button>

        </div>

      </section>

      {/* ======================================================
          LOGIN MESSAGE
      ======================================================= */}

      {!loadingUser && !user && (

        <div className="info-banner">

          <strong>
            Company account required.
          </strong>

          <span>
            Log in or create a company account
            to select a GradLink SA plan.
          </span>

        </div>

      )}

      {/* ======================================================
          SUCCESS MESSAGE
      ======================================================= */}

      {message && (

        <div className="success-message">

          ✓ {message}

        </div>

      )}

      {/* ======================================================
          ERROR MESSAGE
      ======================================================= */}

      {error && (

        <div className="error-message">

          ⚠️ {error}

        </div>

      )}

      {/* ======================================================
          ACTIVE SUBSCRIPTION
      ======================================================= */}

      {isActiveSubscription() && (

        <div className="active-banner">

          <strong>
            ✓ Premium subscription active
          </strong>

          <span>
            Your {currentPlan.plan} plan is
            currently active.
          </span>

        </div>

      )}

      {/* ======================================================
          PRICING
      ======================================================= */}

      <section className="pricing-section">

        <div className="pricing-grid">

          {PLANS.map((plan) => {

            const displayedPrice =
              getDisplayedPrice(plan);

            const monthlyEquivalent =
              getMonthlyEquivalent(plan);

            const annualSaving =
              getAnnualSaving(
                plan.monthlyPrice
              );

            const isSelected =
              isPlanSelected(plan);

            const isSelecting =
              selectingPlan === plan.id;

            return (

              <div
                key={plan.id}
                className={`pricing-card ${
                  plan.popular
                    ? "popular"
                    : ""
                }`}
              >

                {plan.popular && (

                  <div className="popular-label">
                    MOST POPULAR
                  </div>

                )}

                <div className="card-content">

                  {/* PLAN NAME */}

                  <div className="plan-heading">

                    <h2>
                      {plan.name}
                    </h2>

                    {isSelected && (

                      <span className="selected-badge">
                        Selected
                      </span>

                    )}

                  </div>

                  {/* DESCRIPTION */}

                  <p className="description">
                    {plan.description}
                  </p>

                  {/* PRICE */}

                  <div className="price">

                    <span className="currency">
                      R
                    </span>

                    {displayedPrice
                      .toLocaleString(
                        "en-ZA"
                      )}

                    <span className="period">
                      {getPricePeriod()}
                    </span>

                  </div>

                  {/* ANNUAL DETAILS */}

                  {billing === "annual" && (

                    <div className="annual-details">

                      <p className="annual-equivalent">

                        ≈{" "}
                        {formatCurrency(
                          monthlyEquivalent
                        )}
                        /month equivalent

                      </p>

                      <p className="annual-saving">

                        Save{" "}
                        {formatCurrency(
                          annualSaving
                        )}
                        per year

                      </p>

                    </div>

                  )}

                  {/* MONTHLY DETAILS */}

                  {billing === "monthly" && (

                    <p className="billing-note">
                      Billed monthly
                    </p>

                  )}

                  {/* PLAN BUTTON */}

                  <button
                    type="button"
                    className={`plan-button ${
                      plan.popular
                        ? "primary"
                        : ""
                    }`}
                    onClick={() =>
                      choosePlan(plan)
                    }
                    disabled={isSelecting}
                  >

                    {isSelecting
                      ? "Saving..."
                      : isSelected
                      ? "Plan Selected"
                      : `Choose ${plan.name}`}

                  </button>

                  {/* DIVIDER */}

                  <div className="divider"></div>

                  {/* FEATURES */}

                  <p className="includes">

                    {plan.name ===
                    "Premium"
                      ? "Everything you need for advanced recruitment:"
                      : "What's included:"}

                  </p>

                  <ul>

                    {plan.features.map(
                      (
                        feature,
                        index
                      ) => (

                        <li
                          key={index}
                        >

                          <span className="check">
                            ✓
                          </span>

                          {feature}

                        </li>

                      )
                    )}

                  </ul>

                </div>

              </div>

            );
          })}

        </div>

      </section>
      
           {/* PREMIUM UPGRADE */}
      <section className="premium-section">
        <div className="premium-content">
          <div>
            <span className="premium-badge">GRADLINK SA PREMIUM</span>

            <h2>Recruit smarter with Premium</h2>

            <p>
              Unlock advanced applicant screening and document verification
              tools designed to help your company manage applications more
              efficiently.
            </p>

            <div className="premium-features">
              <div className="premium-feature">
                <span>✓</span>
                <div>
                  <strong>AI Applicant Screening</strong>
                  <small>
                    Quickly identify applicants whose qualifications,
                    field of study and skills match your internship.
                  </small>
                </div>
              </div>

              <div className="premium-feature">
                <span>✓</span>
                <div>
                  <strong>CV & Qualification Verification</strong>
                  <small>
                    Review submitted documents with advanced document
                    authenticity checks.
                  </small>
                </div>
              </div>

              <div className="premium-feature">
                <span>✓</span>
                <div>
                  <strong>Advanced Applicant Insights</strong>
                  <small>
                    Get clearer information when reviewing and comparing
                    applicants.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-action">
            {isPremium ? (
              <>
                <div className="active-premium">
                  <span>✓</span>
                  Premium Active
                </div>

                <p>
                  Your company currently has access to Premium features.
                </p>
              </>
            ) : (
              <>
                <div className="premium-price">
                  <span>From</span>
                  <strong>R500</strong>
                  <small>/ month</small>
                </div>

                <button
                  type="button"
                  className="premium-button"
                  onClick={() => router.push("/company-pricing")}
                >
                  Upgrade to Premium
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="plans-link"
                  onClick={() => router.push("/company-pricing")}
                >
                  View all plans
                </button>

                <small className="payment-note">
                  Choose a plan and complete payment to activate Premium.
                </small>
              </>
            )}
          </div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="quick-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUICK ACCESS</span>
            <h2>Manage your company</h2>
          </div>
        </div>

        <div className="quick-grid">
          <button
            type="button"
            className="quick-item"
            onClick={() => router.push("/company")}
          >
            <div className="quick-icon">🏢</div>
            <div>
              <strong>Company Profile</strong>
              <span>Edit your company information</span>
            </div>
            <b>→</b>
          </button>

          <button
            type="button"
            className="quick-item"
            onClick={() => router.push("/company-pricing")}
          >
            <div className="quick-icon">💳</div>
            <div>
              <strong>Plans & Billing</strong>
              <span>View Premium plans and pricing</span>
            </div>
            <b>→</b>
          </button>

          <button
            type="button"
            className="quick-item"
            onClick={() => router.push("/internships")}
          >
            <div className="quick-icon">📋</div>
            <div>
              <strong>Browse Opportunities</strong>
              <span>View internships on GradLink SA</span>
            </div>
            <b>→</b>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div>
          <strong>GradLink SA</strong>
          <p>
            Connecting South African graduates with internship
            opportunities.
          </p>
        </div>

        <div className="footer-links">
          <button onClick={() => router.push("/company")}>
            Company Profile
          </button>

          <button onClick={() => router.push("/company-pricing")}>
            Pricing
          </button>

          <button onClick={() => router.push("/")}>
            Home
          </button>
        </div>
      </footer>

      <style jsx>{`
        .premium-section {
          margin-top: 36px;
          border-radius: 24px;
          background: linear-gradient(135deg, #071f49 0%, #0b4ea2 100%);
          color: white;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(5, 35, 80, 0.16);
        }

        .premium-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px;
          padding: 34px;
          align-items: center;
        }

        .premium-badge {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.13);
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .premium-content h2 {
          margin: 14px 0 8px;
          font-size: 28px;
          line-height: 1.15;
        }

        .premium-content > div:first-child > p {
          max-width: 680px;
          margin: 0;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.65;
          font-size: 14px;
        }

        .premium-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 25px;
        }

        .premium-feature {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .premium-feature > span {
          width: 22px;
          height: 22px;
          min-width: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
          font-size: 12px;
          font-weight: 800;
        }

        .premium-feature strong {
          display: block;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .premium-feature small {
          display: block;
          color: rgba(255, 255, 255, 0.68);
          font-size: 11px;
          line-height: 1.5;
        }

        .premium-action {
          background: white;
          color: #092653;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
        }

        .premium-price span {
          display: block;
          font-size: 12px;
          color: #71809a;
          margin-bottom: 2px;
        }

        .premium-price strong {
          font-size: 34px;
          line-height: 1;
        }

        .premium-price small {
          font-size: 12px;
          color: #71809a;
          margin-left: 3px;
        }

        .premium-button {
          width: 100%;
          margin-top: 18px;
          border: none;
          border-radius: 12px;
          padding: 13px 16px;
          background: #0b63ce;
          color: white;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.2s ease;
        }

        .premium-button:hover {
          background: #084faa;
          transform: translateY(-1px);
        }

        .premium-button span {
          font-size: 18px;
        }

        .plans-link {
          margin-top: 12px;
          border: none;
          background: transparent;
          color: #0b63ce;
          font-weight: 700;
          cursor: pointer;
        }

        .payment-note {
          display: block;
          margin-top: 12px;
          color: #7a879b;
          font-size: 10px;
          line-height: 1.4;
        }

        .active-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          background: #e9f8ef;
          color: #16733c;
          font-size: 13px;
          font-weight: 800;
        }

        .active-premium span {
          font-weight: 900;
        }

        .premium-action > p {
          color: #71809a;
          font-size: 12px;
          line-height: 1.5;
          margin: 15px 0 0;
        }

        .quick-section {
          margin-top: 38px;
        }

        .section-heading {
          margin-bottom: 16px;
        }

        .eyebrow {
          display: block;
          color: #0b63ce;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 22px;
          color: #10284b;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .quick-item {
          width: 100%;
          min-height: 82px;
          border: 1px solid #e4eaf2;
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .quick-item:hover {
          border-color: #b9d4f4;
          transform: translateY(-1px);
        }

        .quick-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          background: #edf5ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .quick-item div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .quick-item strong {
          display: block;
          color: #10284b;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .quick-item span {
          display: block;
          color: #78879c;
          font-size: 11px;
          line-height: 1.4;
        }

        .quick-item b {
          color: #0b63ce;
          font-size: 18px;
        }

        .dashboard-footer {
          margin-top: 45px;
          padding: 25px 0 10px;
          border-top: 1px solid #e5eaf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .dashboard-footer strong {
          color: #10284b;
          font-size: 15px;
        }

        .dashboard-footer p {
          margin: 5px 0 0;
          color: #8793a5;
          font-size: 11px;
        }

        .footer-links {
          display: flex;
          gap: 18px;
        }

        .footer-links button {
          border: none;
          background: transparent;
          color: #687890;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .footer-links button:hover {
          color: #0b63ce;
        }

        @media (max-width: 900px) {
          .premium-content {
            grid-template-columns: 1fr;
          }

          .premium-features {
            grid-template-columns: 1fr;
          }

          .quick-grid {
            grid-template-columns: 1fr;
          }

          .premium-action {
            max-width: 420px;
          }
        }

        @media (max-width: 600px) {
          .premium-section {
            margin-top: 25px;
            border-radius: 18px;
          }

          .premium-content {
            padding: 22px 18px;
            gap: 24px;
          }

          .premium-content h2 {
            font-size: 23px;
          }

          .premium-content > div:first-child > p {
            font-size: 13px;
          }

          .premium-action {
            max-width: none;
            padding: 20px 16px;
          }

          .premium-price strong {
            font-size: 30px;
          }

          .quick-section {
            margin-top: 28px;
          }

          .section-heading h2 {
            font-size: 19px;
          }

          .quick-item {
            min-height: 76px;
            padding: 13px;
          }

          .dashboard-footer {
            margin-top: 32px;
            padding-bottom: 20px;
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-links {
            width: 100%;
            flex-wrap: wrap;
            gap: 12px 18px;
          }
        }
      `}</style>
    </main>
  );
} 