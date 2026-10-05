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
    listingLabel: "Up to 5 active internship listings",
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
    listingLabel: "Up to 15 active internship listings",
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
    listingLabel: "Up to 30 active internship listings",
    features: [
      "Up to 30 active internship listings",
      "Everything in Professional",
      "AI applicant matching",
      "Document verification",
      "Advanced candidate screening",
      "Priority recruitment capacity",
    ],
  },

  listing: {
    key: "listing",
    name: "Pay Per Listing",
    eyebrow: "FLEXIBLE OPTION",
    description:
      "Need to advertise just one opportunity? Pay only for the listing you need.",
    monthly: 250,
    annual: 250,
    listings: 1,
    listingLabel: "1 active internship listing",
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

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD USER + SUBSCRIPTION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadCompanyData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
        }

        if (!currentUser) {
          router.replace(
            "/signup?role=company&redirect=/company-pricing"
          );
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        const {
          data: subscriptionData,
          error: subscriptionError,
        } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Subscription lookup error:",
            subscriptionError
          );
        }

        if (mounted) {
          setSubscription(subscriptionData || null);
        }
      } catch (err) {
        console.error("Pricing page error:", err);

        if (mounted) {
          setError(
            "Unable to load your company account."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCompanyData();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ============================================================
  // HELPERS
  // ============================================================

  const isActive =
    subscription?.status &&
    String(subscription.status).toLowerCase() === "active";

  function formatPrice(value) {
    return new Intl.NumberFormat("en-ZA", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getPlanPrice(plan) {
    if (plan.key === "listing") {
      return 250;
    }

    return billing === "annual"
      ? plan.annual
      : plan.monthly;
  }

  function getBillingLabel(plan) {
    if (plan.key === "listing") {
      return "listing";
    }

    return billing === "annual"
      ? "year"
      : "month";
  }

  // ============================================================
  // CHOOSE PLAN
  // ============================================================

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
        plan.key === "listing"
          ? "listing"
          : billing;

      const amount = getPlanPrice(plan);

      // --------------------------------------------------------
      // Find latest subscription
      // --------------------------------------------------------

      const {
        data: existingSubscription,
        error: existingError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error(
          "Existing subscription lookup:",
          existingError
        );
      }

      let subscriptionId =
        existingSubscription?.id;

      // --------------------------------------------------------
      // Update existing subscription
      // --------------------------------------------------------

      if (subscriptionId) {
        const { error: updateError } =
          await supabase
            .from("company_subscriptions")
            .update({
              plan: plan.key,
              amount,
              billing_cycle: selectedBilling,
              payment_provider: "payfast",
              status: isActive
                ? "active"
                : "inactive",
            })
            .eq("id", subscriptionId);

        if (updateError) {
          console.error(
            "Subscription update:",
            updateError
          );

          throw updateError;
        }
      } else {
        // ------------------------------------------------------
        // Create new inactive subscription
        // ------------------------------------------------------

        const {
          data: newSubscription,
          error: insertError,
        } = await supabase
          .from("company_subscriptions")
          .insert({
            company_id: user.id,
            plan: plan.key,
            amount,
            billing_cycle: selectedBilling,
            payment_provider: "payfast",
            status: "inactive",
          })
          .select()
          .single();

        if (insertError) {
          console.error(
            "Subscription insert:",
            insertError
          );

          throw insertError;
        }

        subscriptionId =
          newSubscription?.id;
      }

      if (!subscriptionId) {
        throw new Error(
          "Could not create subscription."
        );
      }

      // --------------------------------------------------------
      // PayFast payment page
      // --------------------------------------------------------

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
        "Choose plan error:",
        err
      );

      setError(
        err?.message ||
          "Unable to continue with this plan. Please try again."
      );

      setProcessingPlan(null);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            background: #f8fbff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .loading-box {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 34px 24px;
            text-align: center;
            box-shadow:
              0 18px 50px rgba(15, 23, 42, 0.08);
          }

          .loading-logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            border-radius: 15px;
            background: linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 950;
            font-size: 20px;
          }

          .loading-title {
            margin: 0;
            color: #0f172a;
            font-size: 18px;
            font-weight: 850;
          }

          .loading-text {
            margin: 8px 0 0;
            color: #64748b;
            font-size: 13px;
          }
        `}</style>

        <main className="loading-page">
          <div className="loading-box">
            <div className="loading-logo">
              G
            </div>

            <h1 className="loading-title">
              Loading GradLink SA
            </h1>

            <p className="loading-text">
              Preparing your company plans...
            </p>
          </div>
        </main>
      </>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(37, 99, 235, 0.10),
              transparent 35%
            ),
            #f8fbff;

          color: #0f172a;

          padding-bottom: 60px;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .header {
          width: 100%;

          background: rgba(
            255,
            255,
            255,
            0.94
          );

          border-bottom: 1px solid #e2e8f0;

          position: sticky;
          top: 0;
          z-index: 50;

          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .header-inner {
          width: min(
            1120px,
            calc(100% - 32px)
          );

          min-height: 72px;

          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;

          gap: 11px;

          min-width: 0;
        }

        .brand-mark {
          width: 42px;
          height: 42px;

          flex: 0 0 auto;

          border-radius: 13px;

          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );

          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 19px;
          font-weight: 950;

          box-shadow:
            0 8px 20px
              rgba(37, 99, 235, 0.22);
        }

        .brand-copy {
          min-width: 0;
        }

        .brand-name {
          margin: 0;

          color: #0f172a;

          font-size: 15px;
          line-height: 1.1;

          font-weight: 950;
        }

        .brand-subtitle {
          margin: 4px 0 0;

          color: #64748b;

          font-size: 10px;
          font-weight: 700;
        }

        .dashboard-button {
          min-height: 40px;

          padding: 0 15px;

          border: 1px solid #dbe3ef;
          border-radius: 11px;

          background: #ffffff;

          color: #1e40af;

          font-size: 12px;
          font-weight: 850;

          cursor: pointer;

          display: inline-flex;
          align-items: center;

          gap: 7px;

          transition: 0.2s ease;
        }

        .dashboard-button:hover {
          border-color: #93c5fd;

          background: #eff6ff;

          transform: translateY(-1px);
        }

        .arrow {
          font-size: 15px;
          line-height: 1;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero {
          width: min(
            850px,
            calc(100% - 32px)
          );

          margin: 0 auto;

          padding: 48px 0 30px;

          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;

          gap: 7px;

          padding: 8px 13px;

          border-radius: 999px;

          background: #eff6ff;

          border: 1px solid #bfdbfe;

          color: #2563eb;

          font-size: 9px;
          font-weight: 950;

          letter-spacing: 0.12em;

          box-shadow:
            0 5px 16px
              rgba(37, 99, 235, 0.06);
        }

        .hero-title {
          margin: 17px 0 0;

          font-size: clamp(
            30px,
            6vw,
            48px
          );

          line-height: 1.05;

          letter-spacing: -0.04em;

          font-weight: 950;

          color: #0f172a;
        }

        .hero-title span {
          color: #2563eb;
        }

        /* =====================================================
           HERO DESCRIPTION CARD
        ===================================================== */

        .hero-description-card {
          width: min(
            680px,
            100%
          );

          margin: 22px auto 0;

          padding: 18px 21px;

          text-align: left;

          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #f4f8ff 100%
          );

          border: 1px solid #dbe7f5;

          border-radius: 18px;

          box-shadow:
            0 10px 30px
              rgba(15, 23, 42, 0.06);

          position: relative;

          overflow: hidden;
        }

        .hero-description-card::before {
          content: "";

          position: absolute;

          left: 0;
          top: 0;
          bottom: 0;

          width: 4px;

          background: linear-gradient(
            180deg,
            #2563eb,
            #60a5fa
          );

          border-radius: 18px 0 0 18px;
        }

        .hero-description-top {
          display: flex;
          align-items: center;

          gap: 9px;

          margin-bottom: 8px;
        }

        .hero-description-icon {
          width: 27px;
          height: 27px;

          flex: 0 0 auto;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #dbeafe;

          border: 1px solid #bfdbfe;

          color: #2563eb;

          font-size: 11px;
          font-weight: 950;
        }

        .hero-description-label {
          color: #1d4ed8;

          font-size: 8px;

          font-weight: 950;

          letter-spacing: 0.12em;
        }

        .hero-text {
          margin: 0;

          padding-left: 36px;

          color: #475569;

          font-size: 13px;

          line-height: 1.7;

          font-weight: 600;
        }

        /* =====================================================
           ACTIVE SUBSCRIPTION
        ===================================================== */

        .active-banner {
          width: min(
            900px,
            calc(100% - 32px)
          );

          margin: 0 auto 25px;

          padding: 15px 17px;

          border-radius: 17px;

          background: linear-gradient(
            135deg,
            #eff6ff,
            #dbeafe
          );

          border: 1px solid #bfdbfe;

          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;
        }

        .active-copy {
          min-width: 0;
        }

        .active-label {
          color: #2563eb;

          font-size: 9px;

          font-weight: 950;

          letter-spacing: 0.1em;
        }

        .active-title {
          margin: 4px 0 0;

          color: #0f172a;

          font-size: 14px;

          font-weight: 900;
        }

        .active-button {
          flex: 0 0 auto;

          min-height: 38px;

          padding: 0 13px;

          border: 0;

          border-radius: 10px;

          background: #2563eb;

          color: #ffffff;

          font-size: 11px;

          font-weight: 850;

          cursor: pointer;

          display: inline-flex;

          align-items: center;

          gap: 6px;
        }

        /* =====================================================
           BILLING SWITCH
        ===================================================== */

        .billing-area {
          display: flex;

          justify-content: center;

          padding: 5px 16px 30px;
        }

        .billing-switch {
          display: inline-flex;

          align-items: center;

          gap: 4px;

          padding: 4px;

          border-radius: 14px;

          background: #e8eef7;

          border: 1px solid #dbe3ef;
        }

        .billing-option {
          min-height: 39px;

          padding: 0 15px;

          border: 0;

          border-radius: 10px;

          background: transparent;

          color: #64748b;

          font-size: 11px;

          font-weight: 850;

          cursor: pointer;
        }

        .billing-option.active {
          background: #ffffff;

          color: #1d4ed8;

          box-shadow:
            0 3px 10px
              rgba(15, 23, 42, 0.08);
        }

        .save-badge {
          margin-left: 5px;

          color: #16a34a;

          font-size: 9px;

          font-weight: 950;
        }

        /* =====================================================
           PLAN GRID
        ===================================================== */

        .plans {
          width: min(
            900px,
            calc(100% - 32px)
          );

          margin: 0 auto;

          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 18px;
        }

        .plan-card {
          position: relative;

          background: #ffffff;

          border: 1px solid #e2e8f0;

          border-radius: 22px;

          padding: 22px;

          box-shadow:
            0 12px 32px
              rgba(15, 23, 42, 0.06);

          overflow: hidden;

          display: flex;

          flex-direction: column;
        }

        .plan-card.popular {
          border: 1px solid #60a5fa;

          box-shadow:
            0 16px 40px
              rgba(37, 99, 235, 0.15);
        }

        .popular-ribbon {
          position: absolute;

          top: 0;
          right: 0;

          padding: 8px 13px;

          border-bottom-left-radius: 13px;

          background: #2563eb;

          color: #ffffff;

          font-size: 8px;

          font-weight: 950;

          letter-spacing: 0.08em;
        }

        .plan-eyebrow {
          display: inline-flex;

          align-items: center;

          gap: 6px;

          color: #2563eb;

          font-size: 8px;

          font-weight: 950;

          letter-spacing: 0.11em;
        }

        .plan-icon {
          font-size: 11px;
        }

        .plan-name {
          margin: 8px 0 0;

          color: #0f172a;

          font-size: 24px;

          line-height: 1.1;

          font-weight: 950;

          letter-spacing: -0.025em;
        }

        /* =====================================================
           PLAN DESCRIPTION CARD
        ===================================================== */

        .plan-description-card {
          width: 100%;

          margin-top: 15px;

          padding: 16px 17px 17px;

          border-radius: 16px;

          background: linear-gradient(
            135deg,
            #f8fbff 0%,
            #eef6ff 100%
          );

          border: 1px solid #d7e7fb;

          box-shadow:
            0 8px 22px
              rgba(30, 64, 175, 0.07);

          box-sizing: border-box;

          position: relative;

          overflow: hidden;
        }

        .plan-description-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 4px;
          height: 100%;

          background: linear-gradient(
            180deg,
            #2563eb,
            #60a5fa
          );

          border-radius: 16px 0 0 16px;
        }

        .description-card-top {
          position: relative;

          z-index: 1;

          display: flex;

          align-items: center;

          gap: 8px;

          margin-bottom: 9px;
        }

        .description-card-icon {
          width: 25px;
          height: 25px;

          flex: 0 0 auto;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #dbeafe;

          color: #2563eb;

          font-size: 11px;

          font-weight: 950;

          border: 1px solid #bfdbfe;
        }

        .description-card-label {
          color: #1d4ed8;

          font-size: 8px;

          line-height: 1;

          font-weight: 950;

          letter-spacing: 0.12em;
        }

        .plan-description {
          position: relative;

          z-index: 1;

          margin: 0;

          padding-left: 33px;

          color: #334155;

          font-size: 12.5px;

          line-height: 1.65;

          font-weight: 600;
        }

        /* =====================================================
           PRICE
        ===================================================== */

        .price-area {
          margin-top: 19px;
        }

        .price {
          color: #0f172a;

          font-size: 32px;

          line-height: 1;

          font-weight: 950;

          letter-spacing: -0.04em;
        }

        .price-period {
          margin-left: 5px;

          color: #64748b;

          font-size: 11px;

          font-weight: 750;
        }

        .annual-note {
          margin-top: 7px;

          color: #16a34a;

          font-size: 10px;

          font-weight: 850;
        }

        .listing-badge {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          width: fit-content;

          margin-top: 14px;

          padding: 8px 10px;

          border-radius: 10px;

          background: #f1f5f9;

          color: #334155;

          font-size: 10px;

          font-weight: 800;
        }

        .listing-badge-icon {
          color: #2563eb;

          font-size: 12px;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .features-heading {
          margin: 20px 0 11px;

          color: #0f172a;

          font-size: 10px;

          font-weight: 950;

          letter-spacing: 0.08em;

          text-transform: uppercase;
        }

        .features {
          margin: 0;

          padding: 0;

          list-style: none;

          display: flex;

          flex-direction: column;

          gap: 9px;
        }

        .feature {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          color: #475569;

          font-size: 11px;

          line-height: 1.4;

          font-weight: 650;
        }

        .check {
          width: 18px;
          height: 18px;

          flex: 0 0 auto;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 6px;

          background: #eff6ff;

          color: #2563eb;

          font-size: 10px;

          font-weight: 950;
        }

        /* =====================================================
           PLAN BUTTON
        ===================================================== */

        .plan-button {
          width: 100%;

          min-height: 46px;

          margin-top: 22px;

          border: 0;

          border-radius: 12px;

          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );

          color: #ffffff;

          font-size: 12px;

          font-weight: 900;

          cursor: pointer;

          box-shadow:
            0 8px 18px
              rgba(37, 99, 235, 0.20);

          transition: 0.2s ease;
        }

        .plan-button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 11px 23px
              rgba(37, 99, 235, 0.25);
        }

        .plan-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;

          transform: none;
        }

        .payfast-note {
          margin-top: 11px;

          text-align: center;

          color: #94a3b8;

          font-size: 9px;

          font-weight: 700;
        }

        .payfast-note span {
          color: #2563eb;

          font-weight: 850;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-box {
          width: min(
            900px,
            calc(100% - 32px)
          );

          margin: 0 auto 20px;

          padding: 12px 15px;

          border-radius: 12px;

          background: #fef2f2;

          border: 1px solid #fecaca;

          color: #b91c1c;

          font-size: 11px;

          line-height: 1.5;

          font-weight: 700;
        }

        /* =====================================================
           FOOTER TRUST
        ===================================================== */

        .trust {
          width: min(
            700px,
            calc(100% - 32px)
          );

          margin: 38px auto 0;

          padding: 20px;

          text-align: center;

          border-radius: 18px;

          background: #ffffff;

          border: 1px solid #e2e8f0;

          box-shadow:
            0 10px 28px
              rgba(15, 23, 42, 0.04);
        }

        .trust-title {
          margin: 0;

          color: #0f172a;

          font-size: 12px;

          font-weight: 900;
        }

        .trust-text {
          margin: 6px 0 0;

          color: #64748b;

          font-size: 10px;

          line-height: 1.5;

          font-weight: 650;
        }

        .trust-pill {
          display: inline-flex;

          align-items: center;

          gap: 6px;

          margin-top: 11px;

          padding: 7px 10px;

          border-radius: 999px;

          background: #eff6ff;

          color: #2563eb;

          font-size: 9px;

          font-weight: 850;
        }
      `}</style>
      
            <main className="page">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="header">
          <div className="header-inner">

            <div className="brand">
              <div className="brand-mark">
                G
              </div>

              <div className="brand-copy">
                <p className="brand-name">
                  GradLink SA
                </p>

                <p className="brand-subtitle">
                  Graduate Recruitment Platform
                </p>
              </div>
            </div>

            <button
              type="button"
              className="dashboard-button"
              onClick={() =>
                router.push("/company-dashboard")
              }
            >
              Dashboard
              <span className="arrow">
                →
              </span>
            </button>

          </div>
        </header>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="hero">

          <div className="hero-badge">
            ✦ COMPANY RECRUITMENT PLANS
          </div>

          <h1 className="hero-title">
            Find the right graduates.
            <br />
            <span>
              Build your team.
            </span>
          </h1>

          {/* PREMIUM HERO DESCRIPTION CARD */}

          <div className="hero-description-card">

            <div className="hero-description-top">

              <span className="hero-description-icon">
                ✦
              </span>

              <span className="hero-description-label">
                RECRUIT WITH CONFIDENCE
              </span>

            </div>

            <p className="hero-text">
              Choose the GradLink SA plan that fits your
              hiring needs. Access qualified graduate
              talent, powerful applicant management
              tools and smarter recruitment features.
            </p>

          </div>

        </section>

        {/* ====================================================
            ACTIVE SUBSCRIPTION
        ==================================================== */}

        {isActive && (
          <section className="active-banner">

            <div className="active-copy">

              <div className="active-label">
                ACTIVE SUBSCRIPTION
              </div>

              <div className="active-title">
                Your{" "}
                {subscription?.plan
                  ? String(subscription.plan)
                      .charAt(0)
                      .toUpperCase() +
                    String(subscription.plan).slice(1)
                  : "company"}{" "}
                plan is active.
              </div>

            </div>

            <button
              type="button"
              className="active-button"
              onClick={() =>
                router.push(
                  "/company-dashboard"
                )
              }
            >
              Go to Dashboard
              <span>
                →
              </span>
            </button>

          </section>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* ====================================================
            BILLING TOGGLE
        ==================================================== */}

        <div className="billing-area">

          <div className="billing-switch">

            <button
              type="button"
              className={`billing-option ${
                billing === "monthly"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setBilling("monthly")
              }
            >
              Monthly
            </button>

            <button
              type="button"
              className={`billing-option ${
                billing === "annual"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setBilling("annual")
              }
            >
              Annual

              <span className="save-badge">
                SAVE 2 MONTHS
              </span>
            </button>

          </div>

        </div>

        {/* ====================================================
            PLAN CARDS
        ==================================================== */}

        <section className="plans">

          {Object.values(PLANS).map((plan) => {

            const price =
              getPlanPrice(plan);

            const period =
              getBillingLabel(plan);

            return (
              <article
                key={plan.key}
                className={`plan-card ${
                  plan.popular
                    ? "popular"
                    : ""
                }`}
              >

                {/* POPULAR */}

                {plan.popular && (
                  <div className="popular-ribbon">
                    MOST POPULAR
                  </div>
                )}

                {/* EYEBROW */}

                <div className="plan-eyebrow">

                  <span className="plan-icon">
                    {plan.key ===
                    "enterprise"
                      ? "◆"
                      : plan.key ===
                        "listing"
                      ? "◎"
                      : "✦"}
                  </span>

                  {plan.eyebrow}

                </div>

                {/* PLAN NAME */}

                <h2 className="plan-name">
                  {plan.name}
                </h2>

                {/* =================================================
                    PLAN DESCRIPTION
                ================================================= */}

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

                {/* =================================================
                    PRICE
                ================================================= */}

                <div className="price-area">

                  <span className="price">
                    R{formatPrice(price)}
                  </span>

                  <span className="price-period">
                    / {period}
                  </span>

                  {plan.key !== "listing" &&
                    billing === "annual" && (
                      <div className="annual-note">
                        SAVE 2 MONTHS WITH
                        ANNUAL BILLING
                      </div>
                    )}

                </div>

                {/* LISTING COUNT */}

                <div className="listing-badge">

                  <span className="listing-badge-icon">
                    ▣
                  </span>

                  {plan.listingLabel}

                </div>

                {/* =================================================
                    FEATURES
                ================================================= */}

                <div className="features-heading">
                  What's included
                </div>

                <ul className="features">

                  {plan.features.map(
                    (feature, index) => (
                      <li
                        className="feature"
                        key={`${plan.key}-${index}`}
                      >

                        <span className="check">
                          ✓
                        </span>

                        <span>
                          {feature}
                        </span>

                      </li>
                    )
                  )}

                </ul>

                {/* =================================================
                    CTA
                ================================================= */}

                <button
                  type="button"
                  className="plan-button"
                  disabled={
                    processingPlan ===
                    plan.key
                  }
                  onClick={() =>
                    choosePlan(plan)
                  }
                >
                  {processingPlan ===
                  plan.key
                    ? "Preparing Payment..."
                    : plan.key ===
                      "listing"
                    ? "Choose Listing"
                    : "Choose Plan"}
                </button>

                <div className="payfast-note">
                  Secure payment via{" "}
                  <span>
                    PayFast
                  </span>
                </div>

              </article>
            );
          })}

        </section>

        {/* ====================================================
            TRUST AREA
        ==================================================== */}

        <section className="trust">

          <p className="trust-title">
            Secure company payments
          </p>

          <p className="trust-text">
            Complete your subscription securely
            through PayFast. Your company plan
            becomes active after successful
            payment verification.
          </p>

          <div className="trust-pill">
            🔒 Secure payment via PayFast
          </div>

        </section>

      </main>

      {/* ======================================================
          MOBILE STYLES
      ====================================================== */}

      <style jsx>{`
        @media (max-width: 700px) {

          .header-inner {
            width: min(
              100% - 22px,
              1120px
            );

            min-height: 64px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
            border-radius: 11px;
          }

          .brand-name {
            font-size: 13px;
          }

          .brand-subtitle {
            font-size: 9px;
          }

          .dashboard-button {
            min-height: 37px;

            padding: 0 11px;

            font-size: 10px;
          }

          /* HERO */

          .hero {
            width: calc(100% - 26px);

            padding-top: 34px;

            padding-bottom: 25px;
          }

          .hero-title {
            font-size: 32px;

            line-height: 1.08;
          }

          .hero-description-card {
            margin-top: 19px;

            padding: 16px 17px;

            border-radius: 16px;
          }

          .hero-description-top {
            margin-bottom: 8px;
          }

          .hero-description-icon {
            width: 25px;
            height: 25px;

            border-radius: 7px;
          }

          .hero-description-label {
            font-size: 7.5px;
          }

          .hero-text {
            padding-left: 34px;

            font-size: 12px;

            line-height: 1.65;
          }

          /* ACTIVE */

          .active-banner {
            width: calc(100% - 26px);

            align-items: flex-start;

            flex-direction: column;
          }

          .active-button {
            width: 100%;

            justify-content: center;
          }

          /* BILLING */

          .billing-area {
            padding-bottom: 23px;
          }

          .billing-option {
            padding: 0 12px;

            font-size: 10px;
          }

          /* PLANS */

          .plans {
            width: calc(100% - 26px);

            grid-template-columns: 1fr;

            gap: 15px;
          }

          .plan-card {
            padding: 19px;

            border-radius: 20px;
          }

          .plan-name {
            font-size: 23px;
          }

          .plan-description-card {
            padding: 16px;

            border-radius: 16px;
          }

          .plan-description {
            padding-left: 33px;

            font-size: 12.5px;
          }

          .price {
            font-size: 30px;
          }

          /* TRUST */

          .trust {
            width: calc(100% - 26px);

            margin-top: 30px;

            padding: 18px;
          }
        }

        @media (max-width: 380px) {

          .brand-subtitle {
            display: none;
          }

          .hero-title {
            font-size: 29px;
          }

          .hero-description-card {
            padding: 15px;
          }

          .hero-text {
            padding-left: 33px;

            font-size: 11.5px;
          }

          .billing-option {
            padding: 0 9px;
          }

          .save-badge {
            display: none;
          }

          .plan-card {
            padding: 17px;
          }
        }
      `}</style>
    </>
  );
}