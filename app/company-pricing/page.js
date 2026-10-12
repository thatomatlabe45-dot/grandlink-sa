"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    eyebrow: "GET STARTED",
    description:
      "Everything your company needs to start discovering promising graduates.",
    monthly: 500,
    annual: 5000,
    listings: "Up to 5 active internship listings",
    features: [
      "Up to 5 active internship listings",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "Basic hiring tools",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    eyebrow: "MOST POPULAR",
    description:
      "Powerful recruitment tools for companies growing their graduate talent pipeline.",
    monthly: 1000,
    annual: 10000,
    listings: "Up to 15 active internship listings",
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
  {
    key: "listing",
    name: "Pay Per Listing",
    eyebrow: "FLEXIBLE OPTION",
    description:
      "Advertise one opportunity for 30 days without a monthly commitment.",
    monthly: 350,
    annual: 350,
    listings: "1 active internship listing",
    features: [
      "1 active internship listing",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "Listing active for 30 days",
      "No monthly commitment",
    ],
  },
];

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCompanyData() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!currentUser) {
          router.replace(
            "/signup?role=company&redirect=/company-pricing"
          );
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        const { data, error: subscriptionError } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) throw subscriptionError;

        if (mounted) {
          setSubscription(data || null);
        }
      } catch (err) {
        console.error("Pricing page error:", err);

        if (mounted) {
          setError(
            "We could not load your account. Please refresh and try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCompanyData();

    return () => {
      mounted = false;
    };
  }, [router]);

  const isActive =
    String(subscription?.status || "").toLowerCase() === "active";

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-ZA", {
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getPrice(plan) {
    if (plan.key === "listing") return plan.monthly;

    return billing === "annual" ? plan.annual : plan.monthly;
  }

  function getPeriod(plan) {
    if (plan.key === "listing") return "once-off";

    return billing === "annual" ? "per year" : "per month";
  }

  async function choosePlan(plan) {
    if (!user) {
      router.push(
        "/signup?role=company&redirect=/company-pricing"
      );
      return;
    }

    try {
      setProcessingPlan(plan.key);
      setError("");

      const selectedBilling =
        plan.key === "listing" ? "listing" : billing;

      const amount = getPrice(plan);

      // The subscription table stores monthly_price.
      // Annual payments are collected at the full annual price
      // on the payment page.
      const storedMonthlyPrice =
        selectedBilling === "annual"
          ? Math.round(amount / 10)
          : amount;

      const { data: newSubscription, error: insertError } =
        await supabase
          .from("company_subscriptions")
          .insert({
            company_id: user.id,
            plan: plan.key,
            status: "pending",
            monthly_price: storedMonthlyPrice,
            payment_provider: "bank_transfer",
            payment_reference: null,
          })
          .select("id")
          .single();

      if (insertError) throw insertError;

      if (!newSubscription?.id) {
        throw new Error(
          "We could not create your payment request. Please try again."
        );
      }

      router.push(
        `/company/payment?plan=${encodeURIComponent(
          plan.key
        )}&billing=${encodeURIComponent(
          selectedBilling
        )}&subscription=${encodeURIComponent(
          newSubscription.id
        )}`
      );
    } catch (err) {
      console.error("Choose plan error:", err);

      setError(
        err?.message ||
          "We could not continue to payment. Please try again."
      );

      setProcessingPlan(null);
    }
  }

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-box">
          <div className="logo-mark">G</div>
          <h1>GradLink SA</h1>
          <p>Preparing your company plans...</p>

          <style jsx>{`
            .loading-page {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: #f5f8ff;
              color: #0f172a;
              font-family: Arial, sans-serif;
            }

            .loading-box {
              width: 100%;
              max-width: 380px;
              padding: 35px 24px;
              text-align: center;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 22px;
              box-shadow: 0 15px 40px rgba(15, 23, 42, 0.07);
            }

            .logo-mark {
              width: 48px;
              height: 48px;
              margin: 0 auto 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 14px;
              background: #2563eb;
              color: #fff;
              font-size: 23px;
              font-weight: 900;
            }

            h1 {
              margin: 0;
              font-size: 22px;
            }

            p {
              color: #64748b;
              font-size: 14px;
            }
          `}</style>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="/">
            <span className="brand-mark">G</span>

            <span className="brand-copy">
              <strong>GradLink SA</strong>
              <small>Graduate recruitment made simpler</small>
            </span>
          </a>

          <button
            type="button"
            className="dashboard-button"
            onClick={() => router.push("/company-dashboard")}
          >
            Dashboard <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-badge">
          COMPANY PRICING
        </div>

        <h1>
          Find your next
          <br />
          <span>generation of talent.</span>
        </h1>

        <div className="hero-description">
          <div className="description-heading">
            <span className="description-icon">✦</span>
            <span>BUILT FOR YOUR BUSINESS</span>
          </div>

          <p>
            Connect with South African graduates, manage applications,
            and discover emerging talent through GradLink SA.
            Choose the plan that works for your recruitment needs.
          </p>
        </div>
      </section>

      {isActive && (
        <section className="active-banner">
          <div>
            <strong>Your company has an active subscription</strong>
            <p>
              You can review another plan below if you want to upgrade.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/company-dashboard")}
          >
            Go to dashboard →
          </button>
        </section>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="billing-section">
        <p className="billing-title">Choose your billing option</p>

        <div className="billing-toggle">
          <button
            type="button"
            className={billing === "monthly" ? "selected" : ""}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>

          <button
            type="button"
            className={billing === "annual" ? "selected" : ""}
            onClick={() => setBilling("annual")}
          >
            Annual <span className="save-badge">SAVE 2 MONTHS</span>
          </button>
        </div>

        <p className="billing-help">
          Annual subscriptions are paid upfront for 12 months.
        </p>
      </section>

      <section className="plans">
        {PLANS.map((plan) => {
          const price = getPrice(plan);
          const period = getPeriod(plan);

          return (
            <article
              key={plan.key}
              className={`plan-card ${
                plan.popular ? "popular" : ""
              }`}
            >
              {plan.popular && (
                <div className="popular-ribbon">MOST POPULAR</div>
              )}

              <div className="plan-eyebrow">
                <span className="plan-symbol">
                  {plan.key === "listing" ? "◎" : "✦"}
                </span>
                {plan.eyebrow}
              </div>

              <h2 className="plan-name">{plan.name}</h2>

              <div className="plan-description-card">
                <div className="description-card-heading">
                  <span className="small-star">✦</span>
                  <span>PLAN OVERVIEW</span>
                </div>

                <p>{plan.description}</p>
              </div>

              <div className="price-area">
                <span className="price">
                  R{formatPrice(price)}
                </span>

                <span className="price-period">{period}</span>

                {plan.key !== "listing" && billing === "annual" && (
                  <div className="annual-note">
                    SAVE 2 MONTHS WITH ANNUAL BILLING
                  </div>
                )}
              </div>

              <div className="listing-badge">
                <span aria-hidden="true">▣</span>
                {plan.listings}
              </div>

              <h3 className="features-heading">What's included</h3>

              <ul className="features">
                {plan.features.map((feature, index) => (
                  <li key={`${plan.key}-${index}`}>
                    <span className="check">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="plan-button"
                disabled={processingPlan !== null}
                onClick={() => choosePlan(plan)}
              >
                {processingPlan === plan.key
                  ? "Preparing payment..."
                  : plan.key === "listing"
                  ? "Choose Listing"
                  : isActive
                  ? "Choose Upgrade"
                  : "Choose Plan"}
              </button>

              <p className="payment-note">
                Pay by bank transfer
                <br />
                Activation after payment verification
              </p>
            </article>
          );
        })}
      </section>

      <section className="trust-section">
        <div className="trust-icon">🔒</div>

        <div>
          <h3>Secure company payments</h3>
          <p>
            Choose a plan, follow the bank-transfer instructions, and
            submit your payment reference and proof of payment.
            Your plan remains pending until GradLink SA verifies
            that the payment has arrived.
          </p>
        </div>
      </section>

      <footer className="footer">
        <a href="/">GradLink SA</a>
        <span>Connecting South African graduates with opportunity.</span>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding-bottom: 55px;
          background:
            radial-gradient(
              circle at 50% -5%,
              rgba(37, 99, 235, 0.12),
              transparent 36%
            ),
            #f7f9fd;
          color: #0f172a;
          font-family: Arial, Helvetica, sans-serif;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #e2e8f0;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .header-inner {
          width: min(1120px, calc(100% - 36px));
          min-height: 72px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          text-decoration: none;
          color: inherit;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 7px 18px rgba(37, 99, 235, 0.2);
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-copy strong {
          font-size: 15px;
          font-weight: 900;
        }

        .brand-copy small {
          color: #64748b;
          font-size: 10px;
        }

        .dashboard-button {
          min-height: 40px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dbe3ef;
          border-radius: 11px;
          background: white;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .dashboard-button:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .hero {
          width: min(790px, calc(100% - 32px));
          margin: 0 auto;
          padding: 47px 0 24px;
          text-align: center;
        }

        .hero-badge {
          display: inline-block;
          padding: 9px 13px;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .hero h1 {
          margin: 19px 0 0;
          color: #0f172a;
          font-size: clamp(32px, 5vw, 49px);
          line-height: 1.08;
          letter-spacing: -1.8px;
          font-weight: 900;
        }

        .hero h1 span {
          color: #2563eb;
        }

        .hero-description {
          width: min(660px, 100%);
          margin: 24px auto 0;
          padding: 19px 21px;
          position: relative;
          overflow: hidden;
          text-align: left;
          border: 1px solid #dbe7f5;
          border-radius: 17px;
          background: linear-gradient(135deg, #fff, #f1f6ff);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
        }

        .hero-description::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 4px;
          background: linear-gradient(#2563eb, #60a5fa);
        }

        .description-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 9px;
          color: #1d4ed8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .description-icon {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #dbeafe;
          font-size: 13px;
        }

        .hero-description p {
          margin: 0;
          padding-left: 36px;
          color: #334155;
          font-size: 13px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .active-banner {
          width: min(1000px, calc(100% - 32px));
          margin: 0 auto 25px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #bfdbfe;
          border-radius: 15px;
          background: #eff6ff;
        }

        .active-banner strong {
          font-size: 14px;
        }

        .active-banner p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.5;
        }

        .active-banner button {
          flex-shrink: 0;
          padding: 10px 12px;
          border: 0;
          border-radius: 9px;
          background: #2563eb;
          color: white;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .error-message {
          width: min(1000px, calc(100% - 32px));
          margin: 0 auto 22px;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .billing-section {
          margin: 8px auto 27px;
          padding: 0 12px;
          text-align: center;
        }

        .billing-title {
          margin: 0 0 12px;
          color: #475569;
          font-size: 12px;
          font-weight: 800;
        }

        .billing-toggle {
          width: fit-content;
          max-width: 100%;
          margin: 0 auto;
          padding: 5px;
          display: flex;
          gap: 4px;
          border: 1px solid #dbe3ef;
          border-radius: 13px;
          background: #eaf0f9;
        }

        .billing-toggle button {
          min-height: 43px;
          padding: 0 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #475569;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .billing-toggle button.selected {
          background: white;
          color: #1d4ed8;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .save-badge {
          padding: 5px 7px;
          border-radius: 6px;
          background: #dcfce7;
          color: #166534;
          font-size: 8px;
          font-weight: 900;
          white-space: nowrap;
        }

        .billing-help {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 11px;
        }

        .plans {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 18px;
        }

        .plan-card {
          min-width: 0;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 23px;
          border: 1px solid #e2e8f0;
          border-radius: 21px;
          background: white;
          box-shadow: 0 9px 30px rgba(15, 23, 42, 0.045);
        }

        .plan-card.popular {
          border: 2px solid #3b82f6;
          box-shadow: 0 15px 36px rgba(37, 99, 235, 0.11);
        }

        .popular-ribbon {
          position: absolute;
          top: -1px;
          right: 16px;
          padding: 7px 10px;
          border-radius: 0 0 9px 9px;
          background: #2563eb;
          color: white;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .plan-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #2563eb;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .plan-symbol {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #eff6ff;
          font-size: 14px;
        }

        .plan-name {
          margin: 15px 0 15px;
          color: #0f172a;
          font-size: 23px;
          line-height: 1.2;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .plan-description-card {
          min-height: 150px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          border: 1px solid #dbe7f5;
          border-radius: 15px;
          background: linear-gradient(135deg, #fff, #f3f7ff);
          color: #0f172a;
        }

        .description-card-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: #1d4ed8;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .small-star {
          width: 23px;
          height: 23px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: #dbeafe;
          font-size: 11px;
        }

        .plan-description-card p {
          display: block;
          width: 100%;
          margin: 0;
          padding-left: 31px;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.75;
          font-weight: 600;
          opacity: 1;
          visibility: visible;
          overflow-wrap: anywhere;
        }

        .price-area {
          min-height: 94px;
          margin-top: 23px;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 7px;
        }

        .price {
          color: #0f172a;
          font-size: 33px;
          font-weight: 900;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
        }

        .price-period {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .annual-note {
          width: 100%;
          color: #15803d;
          font-size: 9px;
          font-weight: 900;
        }

        .listing-badge {
          min-height: 42px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 11px;
          line-height: 1.5;
          font-weight: 800;
        }

        .features-heading {
          margin: 23px 0 13px;
          color: #0f172a;
          font-size: 12px;
          font-weight: 900;
        }

        .features {
          margin: 0 0 24px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          list-style: none;
        }

        .features li {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #475569;
          font-size: 12px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .check {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 11px;
          font-weight: 900;
        }

        .plan-button {
          width: 100%;
          min-height: 47px;
          margin-top: auto;
          padding: 12px;
          border: 0;
          border-radius: 11px;
          background: #2563eb;
          color: white;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .plan-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .plan-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .payment-note {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.7;
          text-align: center;
        }

        .trust-section {
          width: min(850px, calc(100% - 32px));
          margin: 30px auto 0;
          padding: 21px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          border: 1px solid #dbe3ef;
          border-radius: 16px;
          background: white;
        }

        .trust-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #eff6ff;
          font-size: 17px;
        }

        .trust-section h3 {
          margin: 0 0 7px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }

        .trust-section p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.8;
        }

        .footer {
          width: min(1120px, calc(100% - 32px));
          margin: 30px auto 0;
          padding-top: 19px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
        }

        .footer a {
          color: #1d4ed8;
          font-weight: 900;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .plans {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .plan-card:last-child {
            grid-column: 1 / -1;
          }

          .plan-card:last-child .plan-description-card {
            min-height: 120px;
          }
        }

        @media (max-width: 650px) {
          .header-inner {
            width: calc(100% - 24px);
            min-height: 64px;
          }

          .brand-mark {
            width: 37px;
            height: 37px;
            border-radius: 11px;
          }

          .brand-copy strong {
            font-size: 13px;
          }

          .brand-copy small {
            max-width: 165px;
            font-size: 9px;
            line-height: 1.4;
          }

          .dashboard-button {
            min-height: 37px;
            padding: 0 10px;
            font-size: 10px;
          }

          .hero {
            width: calc(100% - 26px);
            padding-top: 34px;
            padding-bottom: 22px;
          }

          .hero h1 {
            font-size: 34px;
            line-height: 1.1;
            letter-spacing: -1.1px;
          }

          .hero-description {
            margin-top: 19px;
            padding: 16px;
          }

          .hero-description p {
            padding-left: 0;
            font-size: 12px;
            line-height: 1.75;
          }

          .active-banner {
            width: calc(100% - 26px);
            align-items: stretch;
            flex-direction: column;
          }

          .active-banner button {
            width: 100%;
            min-height: 42px;
          }

          .error-message {
            width: calc(100% - 26px);
          }

          .billing-section {
            margin-top: 8px;
            margin-bottom: 22px;
          }

          .billing-toggle button {
            min-height: 41px;
            padding: 0 12px;
            font-size: 11px;
          }

          .save-badge {
            font-size: 7px;
          }

          .plans {
            width: calc(100% - 26px);
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .plan-card,
          .plan-card:last-child {
            grid-column: auto;
            padding: 19px;
            border-radius: 19px;
          }

          .plan-name {
            font-size: 23px;
          }

          .plan-description-card,
          .plan-card:last-child .plan-description-card {
            min-height: 125px;
            padding: 16px;
          }

          .plan-description-card p {
            padding-left: 31px;
            color: #1e293b;
            font-size: 13px;
            line-height: 1.75;
            font-weight: 600;
            opacity: 1;
            visibility: visible;
          }

          .price-area {
            min-height: 82px;
            margin-top: 19px;
          }

          .price {
            font-size: 31px;
          }

          .features {
            gap: 11px;
          }

          .plan-button {
            min-height: 49px;
          }

          .trust-section {
            width: calc(100% - 26px);
            padding: 17px;
          }

          .footer {
            width: calc(100% - 26px);
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 380px) {
          .brand-copy small {
            display: none;
          }

          .hero h1 {
            font-size: 30px;
          }

          .billing-toggle button {
            padding: 0 9px;
          }

          .save-badge {
            display: none;
          }

          .plan-card,
          .plan-card:last-child {
            padding: 16px;
          }

          .plan-description-card,
          .plan-card:last-child .plan-description-card {
            padding: 14px;
          }
        }
      `}</style>
    </main>
  );
}