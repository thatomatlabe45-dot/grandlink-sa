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
// ANNUAL BILLING
// ============================================================
//
// Annual billing receives a 15% discount.
//
// Starter:
// R500 x 12 = R6,000
// 15% discount = R900
// Annual total = R5,100
//
// Professional:
// R1,000 x 12 = R12,000
// 15% discount = R1,800
// Annual total = R10,200
//
// Premium:
// R2,000 x 12 = R24,000
// 15% discount = R3,600
// Annual total = R20,400
//
// ============================================================

function getAnnualPrice(monthlyPrice) {
  return Math.round(monthlyPrice * 12 * 0.85);
}

function getAnnualSaving(monthlyPrice) {
  return monthlyPrice * 12 - getAnnualPrice(monthlyPrice);
}

function getMonthlyEquivalent(monthlyPrice) {
  return Math.round(getAnnualPrice(monthlyPrice) / 12);
}

function formatCurrency(amount) {
  return `R${Number(amount).toLocaleString("en-ZA")}`;
}

// ============================================================
// PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  // ----------------------------------------------------------
  // BILLING
  // ----------------------------------------------------------

  const [billing, setBilling] = useState("monthly");

  // ----------------------------------------------------------
  // ACCOUNT
  // ----------------------------------------------------------

  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD ACCOUNT
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

      const { data: subscription, error: subscriptionError } =
        await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Subscription loading error:",
          subscriptionError
        );

        return;
      }

      if (subscription) {
        setCurrentPlan(subscription);

        // Restore the previously selected billing cycle.
        if (
          subscription.billing_cycle === "annual" ||
          subscription.billing_cycle === "monthly"
        ) {
          setBilling(subscription.billing_cycle);
        }
      }
    } catch (err) {
      console.error("Load company error:", err);
      setError("Something went wrong while loading your account.");
    } finally {
      setLoadingUser(false);
    }
  }

  // ==========================================================
  // BILLING SWITCH
  // ==========================================================

  function changeBilling(type) {
    setMessage("");
    setError("");

    if (type !== "monthly" && type !== "annual") {
      return;
    }

    setBilling(type);
  }

  // ==========================================================
  // PRICE
  // ==========================================================

  function getDisplayedPrice(plan) {
    if (billing === "annual") {
      return getAnnualPrice(plan.monthlyPrice);
    }

    return plan.monthlyPrice;
  }

  function getPeriod() {
    return billing === "annual" ? "/year" : "/month";
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
        data: { user: loggedInUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!loggedInUser) {
        router.push("/login?redirect=/company-pricing");
        return;
      }

      const monthlyPrice = plan.monthlyPrice;

      const annualPrice = getAnnualPrice(
        monthlyPrice
      );

      const selectedPrice =
        billing === "annual"
          ? annualPrice
          : monthlyPrice;

      // --------------------------------------------------------
      // SAVE THE PLAN AND BILLING CYCLE
      // --------------------------------------------------------

      const subscriptionData = {
        company_id: loggedInUser.id,

        plan: plan.id,

        billing_cycle: billing,

        monthly_price: monthlyPrice,

        annual_price: annualPrice,

        // Selecting a plan does NOT activate payment.
        status: "inactive",

        payment_provider: null,

        payment_reference: null,

        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("company_subscriptions")
        .upsert(subscriptionData, {
          onConflict: "company_id",
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setCurrentPlan(data);

      // --------------------------------------------------------
      // CONFIRM WHAT WAS SELECTED
      // --------------------------------------------------------

      if (billing === "annual") {
        setMessage(
          `${plan.name} annual plan selected — ${formatCurrency(
            selectedPrice
          )} per year. This saves ${formatCurrency(
            getAnnualSaving(monthlyPrice)
          )} compared with paying monthly for 12 months.`
        );
      } else {
        setMessage(
          `${plan.name} monthly plan selected — ${formatCurrency(
            selectedPrice
          )} per month.`
        );
      }

      // --------------------------------------------------------
      // IMPORTANT
      // --------------------------------------------------------
      //
      // The subscription remains inactive.
      //
      // A real payment provider must confirm payment before
      // status becomes "active".
      //
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
  // CURRENT PLAN
  // ==========================================================

  function isPlanSelected(plan) {
    return currentPlan?.plan === plan.id;
  }

  function isActiveSubscription() {
    return (
      String(currentPlan?.status || "").toLowerCase() ===
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
          <span className="logo-icon">G</span>

          <span>
            GradLink <strong>SA</strong>
          </span>
        </Link>

        <div className="nav-links">

          <Link href="/">Home</Link>

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

        <div className="billing-wrapper">

          <div className="billing-toggle">

            <button
              type="button"
              className={
                billing === "monthly"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeBilling("monthly")
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
                changeBilling("annual")
              }
            >
              Annual

              <span className="save">
                Save 15%
              </span>
            </button>

          </div>

          {billing === "annual" && (
            <div className="billing-status">
              ✓ Annual billing selected
            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          ACCOUNT MESSAGE
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
          SUCCESS
      ======================================================= */}

      {message && (
        <div className="success-message">
          ✓ {message}
        </div>
      )}

      {/* ======================================================
          ERROR
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
            ✓ Subscription active
          </strong>

          <span>
            Your {currentPlan.plan} plan is
            currently active.
          </span>

        </div>
      )}

      {/* ======================================================
          PRICING CARDS
      ======================================================= */}

      <section className="pricing-section">

        <div className="pricing-grid">

          {PLANS.map((plan) => {

            const displayedPrice =
              getDisplayedPrice(plan);

            const annualSaving =
              getAnnualSaving(
                plan.monthlyPrice
              );

            const monthlyEquivalent =
              getMonthlyEquivalent(
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

                  <p className="description">
                    {plan.description}
                  </p>

                  {/* PRICE */}

                  <div className="price">

                    <span className="currency">
                      R
                    </span>

                    <span className="price-number">
                      {displayedPrice.toLocaleString(
                        "en-ZA"
                      )}
                    </span>

                    <span className="period">
                      {getPeriod()}
                    </span>

                  </div>

                  {/* ANNUAL INFORMATION */}

                  {billing === "annual" && (
                    <div className="annual-details">

                      <p className="annual-equivalent">

                        Equivalent to{" "}
                        <strong>
                          {formatCurrency(
                            monthlyEquivalent
                          )}
                        </strong>
                        /month

                      </p>

                      <p className="annual-saving">

                        You save{" "}
                        <strong>
                          {formatCurrency(
                            annualSaving
                          )}
                        </strong>{" "}
                        per year

                      </p>

                    </div>
                  )}

                  {/* MONTHLY INFORMATION */}

                  {billing === "monthly" && (
                    <p className="billing-note">
                      Billed monthly
                    </p>
                  )}

                  {/* BUTTON */}

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
                    disabled={
                      isSelecting ||
                      !user
                    }
                  >

                    {isSelecting
                      ? "Saving..."
                      : isSelected
                      ? "Selected"
                      : `Choose ${plan.name}`}

                  </button>

                  {!user && (
                    <p className="login-required">
                      Log in to select this plan.
                    </p>
                  )}

                  <div className="divider" />

                  <p className="includes">

                    {plan.name === "Premium"
                      ? "Everything you need for advanced recruitment:"
                      : "What's included:"}

                  </p>

                  <ul>

                    {plan.features.map(
                      (feature, index) => (
                        <li key={index}>

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
      
            {/* ======================================================
          PRICING EXPLANATION
      ======================================================= */}

      <section className="pricing-note-section">
        <div className="pricing-note">

          <div className="note-icon">
            💳
          </div>

          <div>
            <h3>
              Simple, transparent billing
            </h3>

            {billing === "annual" ? (
              <p>
                Annual plans are billed once per year
                at a 15% discount. You save the
                equivalent of almost two months compared
                with paying monthly for 12 months.
              </p>
            ) : (
              <p>
                Monthly plans are billed every month.
                You can switch to annual billing at any
                time before completing payment.
              </p>
            )}
          </div>

        </div>
      </section>

      {/* ======================================================
          FOOTER
      ======================================================= */}

      <footer className="pricing-footer">

        <div className="footer-brand">

          <Link href="/" className="footer-logo">

            <span className="logo-icon">
              G
            </span>

            <span>
              GradLink <strong>SA</strong>
            </span>

          </Link>

          <p>
            Connecting South African graduates
            with internship opportunities.
          </p>

        </div>

        <div className="footer-links">

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

          <Link href="/company-dashboard">
            Dashboard
          </Link>

        </div>

      </footer>

      {/* ======================================================
          STYLES
      ======================================================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .pricing-page {
          min-height: 100vh;
          background: #f7f9fc;
          color: #10284b;
          overflow-x: hidden;
        }

        /* ====================================================
           NAVBAR
        ==================================================== */

        .navbar {
          width: 100%;
          min-height: 72px;
          padding: 0 6%;
          background: white;
          border-bottom: 1px solid #e8edf4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          color: #10284b;
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
        }

        .logo strong {
          color: #0b63ce;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            #0b63ce,
            #084b9b
          );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow:
            0 5px 14px rgba(11, 99, 206, 0.2);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 27px;
        }

        .nav-links a {
          text-decoration: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .nav-links a:hover {
          color: #0b63ce;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-btn,
        .signup-btn {
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .login-btn {
          color: #0b63ce;
          border: 1px solid #d7e3f2;
          background: white;
        }

        .signup-btn {
          color: white;
          background: #0b63ce;
        }

        .login-btn:hover {
          border-color: #0b63ce;
        }

        .signup-btn:hover {
          background: #084fa5;
        }

        /* ====================================================
           HERO
        ==================================================== */

        .hero {
          text-align: center;
          padding: 65px 20px 42px;
          background:
            radial-gradient(
              circle at top,
              rgba(11, 99, 206, 0.1),
              transparent 45%
            ),
            white;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 13px;
          border-radius: 999px;
          background: #edf5ff;
          color: #0b63ce;
          border: 1px solid #d7e8fc;
          font-size: 11px;
          font-weight: 800;
        }

        .hero h1 {
          margin: 18px auto 12px;
          max-width: 750px;
          font-size: clamp(
            34px,
            5vw,
            56px
          );
          line-height: 1.08;
          letter-spacing: -1.5px;
          color: #092653;
        }

        .hero h1 span {
          color: #0b63ce;
        }

        .hero > p {
          max-width: 650px;
          margin: 0 auto;
          color: #718096;
          font-size: 15px;
          line-height: 1.7;
        }

        /* ====================================================
           BILLING
        ==================================================== */

        .billing-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 30px;
        }

        .billing-toggle {
          display: inline-flex;
          padding: 5px;
          background: #edf2f8;
          border: 1px solid #dfe6ef;
          border-radius: 13px;
          gap: 4px;
        }

        .billing-toggle button {
          border: none;
          background: transparent;
          color: #65758c;
          padding: 11px 19px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .billing-toggle button.active {
          background: white;
          color: #0b63ce;
          box-shadow:
            0 3px 10px rgba(
              15,
              40,
              75,
              0.1
            );
        }

        .billing-toggle button:hover {
          color: #0b63ce;
        }

        .save {
          display: inline-block;
          margin-left: 7px;
          padding: 3px 6px;
          border-radius: 5px;
          background: #dff5e8;
          color: #168346;
          font-size: 9px;
          font-weight: 900;
        }

        .billing-status {
          margin-top: 10px;
          color: #168346;
          font-size: 11px;
          font-weight: 800;
        }

        /* ====================================================
           MESSAGES
        ==================================================== */

        .info-banner,
        .success-message,
        .error-message,
        .active-banner {
          width: min(
            1120px,
            calc(100% - 32px)
          );
          margin: 20px auto 0;
          padding: 13px 16px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-align: center;
          font-size: 12px;
          line-height: 1.5;
        }

        .info-banner {
          background: #edf5ff;
          border: 1px solid #d6e7fa;
          color: #31577f;
        }

        .success-message {
          background: #eaf8ef;
          border: 1px solid #ccebd7;
          color: #176b39;
        }

        .error-message {
          background: #fff0f0;
          border: 1px solid #f3cccc;
          color: #a52c2c;
        }

        .active-banner {
          background: #eaf8ef;
          border: 1px solid #ccebd7;
          color: #176b39;
        }

        /* ====================================================
           PRICING
        ==================================================== */

        .pricing-section {
          width: min(
            1120px,
            calc(100% - 32px)
          );
          margin: 38px auto 0;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
        }

        .pricing-card {
          position: relative;
          background: white;
          border: 1px solid #e3e9f1;
          border-radius: 19px;
          overflow: hidden;
          box-shadow:
            0 7px 24px rgba(
              20,
              45,
              80,
              0.06
            );
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .pricing-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 12px 32px rgba(
              20,
              45,
              80,
              0.1
            );
        }

        .pricing-card.popular {
          border: 2px solid #0b63ce;
        }

        .popular-label {
          padding: 8px;
          text-align: center;
          background: #0b63ce;
          color: white;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .card-content {
          padding: 27px 23px 25px;
        }

        .plan-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .plan-heading h2 {
          margin: 0;
          font-size: 22px;
          color: #10284b;
        }

        .selected-badge {
          padding: 5px 8px;
          border-radius: 999px;
          background: #e8f7ee;
          color: #168346;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .description {
          min-height: 54px;
          margin: 12px 0 19px;
          color: #78879b;
          font-size: 12px;
          line-height: 1.6;
        }

        .price {
          display: flex;
          align-items: baseline;
          color: #092653;
          min-height: 50px;
        }

        .currency {
          font-size: 19px;
          font-weight: 800;
          margin-right: 2px;
        }

        .price-number {
          font-size: 37px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .period {
          margin-left: 5px;
          color: #78879b;
          font-size: 11px;
          font-weight: 700;
        }

        .billing-note {
          min-height: 30px;
          margin: 5px 0 0;
          color: #8995a7;
          font-size: 11px;
        }

        /* ====================================================
           ANNUAL DETAILS
        ==================================================== */

        .annual-details {
          min-height: 58px;
          margin-top: 3px;
        }

        .annual-equivalent,
        .annual-saving {
          margin: 3px 0;
          font-size: 10px;
        }

        .annual-equivalent {
          color: #718096;
        }

        .annual-equivalent strong {
          color: #092653;
        }

        .annual-saving {
          color: #168346;
          font-weight: 800;
        }

        .annual-saving strong {
          font-weight: 900;
        }

        /* ====================================================
           BUTTON
        ==================================================== */

        .plan-button {
          width: 100%;
          min-height: 45px;
          margin-top: 18px;
          border: 1px solid #cbd8e8;
          border-radius: 10px;
          background: white;
          color: #0b63ce;
          cursor: pointer;
          font-size: 12px;
          font-weight: 900;
          transition: 0.2s ease;
        }

        .plan-button:hover:not(:disabled) {
          background: #edf5ff;
          border-color: #0b63ce;
        }

        .plan-button.primary {
          background: #0b63ce;
          color: white;
          border-color: #0b63ce;
        }

        .plan-button.primary:hover:not(:disabled) {
          background: #084fa5;
        }

        .plan-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .login-required {
          margin: 7px 0 0;
          text-align: center;
          color: #8b97a8;
          font-size: 9px;
        }

        .divider {
          height: 1px;
          margin: 22px 0 18px;
          background: #e8edf3;
        }

        .includes {
          margin: 0 0 12px;
          color: #445671;
          font-size: 11px;
          font-weight: 800;
        }

        .card-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .card-content li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
          color: #65758c;
          font-size: 11px;
          line-height: 1.45;
        }

        .check {
          color: #168346;
          font-weight: 900;
          flex-shrink: 0;
        }

        /* ====================================================
           PRICING NOTE
        ==================================================== */

        .pricing-note-section {
          width: min(
            1120px,
            calc(100% - 32px)
          );
          margin: 34px auto 0;
        }

        .pricing-note {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 1px solid #e0e7ef;
          border-radius: 15px;
          background: white;
        }

        .note-icon {
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

        .pricing-note h3 {
          margin: 0 0 5px;
          color: #10284b;
          font-size: 14px;
        }

        .pricing-note p {
          margin: 0;
          color: #718096;
          font-size: 11px;
          line-height: 1.6;
        }

        /* ====================================================
           FOOTER
        ==================================================== */

        .pricing-footer {
          width: min(
            1120px,
            calc(100% - 32px)
          );
          margin: 50px auto 0;
          padding: 25px 0 35px;
          border-top: 1px solid #e1e7ef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
        }

        .footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #10284b;
          font-size: 15px;
          font-weight: 800;
        }

        .footer-logo .logo-icon {
          width: 29px;
          height: 29px;
          border-radius: 8px;
          font-size: 13px;
        }

        .footer-logo strong {
          color: #0b63ce;
        }

        .footer-brand p {
          margin: 8px 0 0;
          color: #8a96a8;
          font-size: 10px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 17px;
        }

        .footer-links a {
          text-decoration: none;
          color: #69798f;
          font-size: 10px;
          font-weight: 700;
        }

        .footer-links a:hover {
          color: #0b63ce;
        }

        /* ====================================================
           TABLET
        ==================================================== */

        @media (max-width: 900px) {

          .navbar {
            padding: 0 4%;
          }

          .nav-links {
            display: none;
          }

          .pricing-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .pricing-card:last-child {
            grid-column:
              1 / -1;
            max-width: 520px;
            width: 100%;
            margin: 0 auto;
          }

        }

        /* ====================================================
           MOBILE / IPHONE
        ==================================================== */

        @media (max-width: 600px) {

          .navbar {
            min-height: 64px;
            padding: 0 15px;
          }

          .logo {
            font-size: 15px;
          }

          .logo-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
          }

          .nav-actions {
            gap: 6px;
          }

          .login-btn,
          .signup-btn {
            padding: 8px 10px;
            font-size: 10px;
          }

          .hero {
            padding:
              43px
              16px
              32px;
          }

          .hero h1 {
            font-size: 34px;
            letter-spacing: -1px;
          }

          .hero > p {
            font-size: 13px;
          }

          .badge {
            font-size: 9px;
          }

          .billing-toggle {
            width: 100%;
            max-width: 310px;
          }

          .billing-toggle button {
            flex: 1;
            padding: 11px 8px;
            font-size: 11px;
          }

          .save {
            display: block;
            width: fit-content;
            margin: 4px auto 0;
          }

          .info-banner,
          .success-message,
          .error-message,
          .active-banner {
            width: calc(100% - 24px);
            flex-direction: column;
            margin-top: 14px;
            padding: 12px;
          }

          .pricing-section {
            width: calc(100% - 24px);
            margin-top: 25px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .pricing-card:last-child {
            grid-column: auto;
            max-width: none;
          }

          .card-content {
            padding: 23px 19px;
          }

          .description {
            min-height: auto;
          }

          .price-number {
            font-size: 34px;
          }

          .pricing-note-section {
            width: calc(100% - 24px);
            margin-top: 25px;
          }

          .pricing-note {
            align-items: flex-start;
            padding: 16px;
          }

          .pricing-note h3 {
            font-size: 13px;
          }

          .pricing-note p {
            font-size: 10px;
          }

          .pricing-footer {
            width: calc(100% - 24px);
            flex-direction: column;
            align-items: flex-start;
            margin-top: 35px;
          }

          .footer-links {
            justify-content: flex-start;
            gap: 13px;
          }

        }

      `}</style>

    </main>
  );
}