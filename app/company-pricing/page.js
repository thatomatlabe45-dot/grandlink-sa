"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// GRADLINK SA COMPANY PRICING
// ============================================================

const PLANS = {
  starter: {
    name: "Starter",
    monthly: 500,
    annual: 5000,
    listings: 5,
    description: "For companies starting their graduate recruitment.",
  },

  professional: {
    name: "Professional",
    monthly: 950,
    annual: 9500,
    listings: 15,
    description: "For growing companies hiring more graduates.",
  },

  enterprise: {
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    description: "For companies with larger recruitment needs.",
  },

  pay_per_listing: {
    name: "Pay Per Listing",
    monthly: null,
    annual: null,
    price: 250,
    listings: 1,
    description: "Pay only when you need to publish one listing.",
  },
};

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: companyData, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Company lookup error:", error);
      }

      setCompany(companyData || null);
    } catch (error) {
      console.error("Pricing page error:", error);
    } finally {
      setLoading(false);
    }
  }

  function selectPlan(planKey) {
    setSelectedPlan(planKey);
  }

  function getPrice(plan) {
    if (plan.monthly === null) {
      return plan.price;
    }

    return billing === "monthly" ? plan.monthly : plan.annual;
  }

  function getPeriod(plan) {
    if (plan.monthly === null) {
      return "per listing";
    }

    return billing === "monthly" ? "per month" : "per year";
  }

  function continueToPayment(planKey) {
    const plan = PLANS[planKey];

    if (!plan) return;

    // --------------------------------------------------------
    // IMPORTANT:
    // Selecting a plan does NOT activate Premium.
    // The payment flow must verify successful payment first.
    // --------------------------------------------------------

    const params = new URLSearchParams({
      plan: planKey,
      billing:
        planKey === "pay_per_listing"
          ? "listing"
          : billing,
    });

    router.push(`/company-payment?${params.toString()}`);
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading GradLink SA pricing...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button
            onClick={() => router.push("/")}
            style={styles.logoButton}
          >
            <div style={styles.logoMark}>G</div>

            <div>
              <div style={styles.logoText}>GradLink SA</div>
              <div style={styles.logoSubtext}>
                Company Recruitment
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/company-dashboard")}
            style={styles.dashboardButton}
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section style={styles.hero}>
        <div style={styles.badge}>
          🏢 COMPANY PLANS
        </div>

        <h1 style={styles.heroTitle}>
          Choose the right plan for your
          <span style={styles.heroAccent}> recruitment needs</span>
        </h1>

        <p style={styles.heroText}>
          Publish internship and graduate opportunities on
          GradLink SA and connect with qualified South African
          graduates.
        </p>

        <div style={styles.importantNotice}>
          <span style={styles.noticeIcon}>🔒</span>

          <div>
            <strong style={styles.noticeTitle}>
              Payment is required
            </strong>

            <p style={styles.noticeText}>
              Companies do not have a free plan. Selecting a plan
              does not activate your subscription. Your access is
              activated only after successful payment verification.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          BILLING TOGGLE
      ====================================================== */}

      <section style={styles.billingSection}>
        <div style={styles.billingToggle}>
          <button
            onClick={() => setBilling("monthly")}
            style={{
              ...styles.billingButton,
              ...(billing === "monthly"
                ? styles.billingButtonActive
                : {}),
            }}
          >
            Monthly
          </button>

          <button
            onClick={() => setBilling("annual")}
            style={{
              ...styles.billingButton,
              ...(billing === "annual"
                ? styles.billingButtonActive
                : {}),
            }}
          >
            Annual
            <span style={styles.saveBadge}>Save</span>
          </button>
        </div>

        <p style={styles.billingHint}>
          Annual plans are priced at only 10 months of the monthly
          price.
        </p>
      </section>

      {/* =====================================================
          PRICING
      ====================================================== */}

      <section style={styles.pricingSection}>
        <div style={styles.pricingGrid}>

          {/* STARTER */}
          <PlanCard
            planKey="starter"
            plan={PLANS.starter}
            billing={billing}
            selectedPlan={selectedPlan}
            onSelect={selectPlan}
            onContinue={continueToPayment}
            getPrice={getPrice}
            getPeriod={getPeriod}
          />

          {/* PROFESSIONAL */}
          <PlanCard
            planKey="professional"
            plan={PLANS.professional}
            billing={billing}
            selectedPlan={selectedPlan}
            onSelect={selectPlan}
            onContinue={continueToPayment}
            getPrice={getPrice}
            getPeriod={getPeriod}
            popular
          />

          {/* ENTERPRISE */}
          <PlanCard
            planKey="enterprise"
            plan={PLANS.enterprise}
            billing={billing}
            selectedPlan={selectedPlan}
            onSelect={selectPlan}
            onContinue={continueToPayment}
            getPrice={getPrice}
            getPeriod={getPeriod}
          />

          {/* PAY PER LISTING */}
          <PlanCard
            planKey="pay_per_listing"
            plan={PLANS.pay_per_listing}
            billing={billing}
            selectedPlan={selectedPlan}
            onSelect={selectPlan}
            onContinue={continueToPayment}
            getPrice={getPrice}
            getPeriod={getPeriod}
            payPerListing
          />

        </div>
      </section>

      {/* =====================================================
          BOTTOM INFORMATION
      ====================================================== */}

      <section style={styles.infoSection}>
        <div style={styles.infoBox}>
          <div style={styles.infoIcon}>📋</div>

          <div>
            <h3 style={styles.infoTitle}>
              Listing limits are based on active listings
            </h3>

            <p style={styles.infoText}>
              Your plan determines how many active internship or
              job listings your company can have at one time.
              Expired or closed listings do not count toward your
              active listing limit.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <p>
          © {new Date().getFullYear()} GradLink SA. Connecting
          South African graduates with opportunities.
        </p>
      </footer>
    </main>
  );
}

// ============================================================
// PLAN CARD
// ============================================================

function PlanCard({
  planKey,
  plan,
  billing,
  selectedPlan,
  onSelect,
  onContinue,
  getPrice,
  getPeriod,
  popular = false,
  payPerListing = false,
}) {
  const selected = selectedPlan === planKey;

  return (
    <div
      style={{
        ...styles.planCard,
        ...(popular ? styles.popularCard : {}),
        ...(selected ? styles.selectedCard : {}),
      }}
      onClick={() => onSelect(planKey)}
    >
      {popular && (
        <div style={styles.popularBadge}>
          MOST POPULAR
        </div>
      )}

      <div style={styles.planHeader}>
        <h2 style={styles.planName}>{plan.name}</h2>

        <p style={styles.planDescription}>
          {plan.description}
        </p>
      </div>

      <div style={styles.priceArea}>
        <span style={styles.currency}>R</span>

        <span style={styles.price}>
          {getPrice(plan).toLocaleString("en-ZA")}
        </span>

        <span style={styles.period}>
          / {getPeriod(plan).replace("per ", "")}
        </span>
      </div>

      {planKey !== "pay_per_listing" && billing === "annual" && (
        <div style={styles.monthlyEquivalent}>
          Equivalent to R
          {(plan.annual / 12).toLocaleString("en-ZA")}
          /month
        </div>
      )}

      <div style={styles.listingsBox}>
        <div style={styles.listingsIcon}>📋</div>

        <div>
          <div style={styles.listingsLabel}>
            Listings included
          </div>

          <div style={styles.listingsValue}>
            {plan.listings === 1
              ? "1 listing"
              : `Up to ${plan.listings} active listings`}
          </div>
        </div>
      </div>

      <div style={styles.featureList}>
        <div style={styles.feature}>
          <span>✓</span>
          <span>Company profile</span>
        </div>

        <div style={styles.feature}>
          <span>✓</span>
          <span>Publish opportunities</span>
        </div>

        <div style={styles.feature}>
          <span>✓</span>
          <span>Receive applications</span>
        </div>

        <div style={styles.feature}>
          <span>✓</span>
          <span>Applicant management</span>
        </div>
      </div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onContinue(planKey);
        }}
        style={{
          ...styles.planButton,
          ...(popular ? styles.planButtonPopular : {}),
          ...(selected ? styles.planButtonSelected : {}),
        }}
      >
        {payPerListing
          ? "Publish a Listing"
          : "Continue to Payment"}
      </button>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7faff 0%, #ffffff 45%, #f8fbff 100%)",
    color: "#0f172a",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    overflowX: "hidden",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fbff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  },

  loadingSpinner: {
    width: "38px",
    height: "38px",
    border: "4px solid #dbeafe",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "gradlinkSpin 0.8s linear infinite",
  },

  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },

  header: {
    width: "100%",
    background: "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(12px)",
  },

  headerInner: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "14px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  logoButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
  },

  logoMark: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "21px",
    boxShadow: "0 7px 18px rgba(37,99,235,0.22)",
  },

  logoText: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1.1",
  },

  logoSubtext: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "3px",
  },

  dashboardButton: {
    border: "1px solid #dbe3ef",
    background: "#ffffff",
    color: "#1d4ed8",
    padding: "10px 15px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  hero: {
    maxWidth: "920px",
    margin: "0 auto",
    padding: "58px 22px 20px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.6px",
  },

  heroTitle: {
    margin: "18px auto 0",
    maxWidth: "780px",
    fontSize: "clamp(32px, 5vw, 54px)",
    lineHeight: "1.08",
    letterSpacing: "-1.5px",
    fontWeight: "850",
    color: "#0f172a",
  },

  heroAccent: {
    color: "#2563eb",
  },

  heroText: {
    maxWidth: "680px",
    margin: "18px auto 0",
    fontSize: "16px",
    lineHeight: "1.65",
    color: "#64748b",
  },

  importantNotice: {
    maxWidth: "720px",
    margin: "28px auto 0",
    padding: "16px",
    borderRadius: "14px",
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    textAlign: "left",
    boxSizing: "border-box",
  },

  noticeIcon: {
    fontSize: "20px",
    lineHeight: "1",
  },

  noticeTitle: {
    fontSize: "13px",
    color: "#1e3a8a",
  },

  noticeText: {
    margin: "5px 0 0",
    fontSize: "12px",
    lineHeight: "1.55",
    color: "#64748b",
  },

  billingSection: {
    textAlign: "center",
    padding: "24px 20px 12px",
  },

  billingToggle: {
    display: "inline-flex",
    padding: "4px",
    borderRadius: "13px",
    background: "#eaf0f8",
    border: "1px solid #dce5f0",
  },

  billingButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    padding: "10px 18px",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },

  billingButtonActive: {
    background: "#ffffff",
    color: "#1d4ed8",
    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
  },

  saveBadge: {
    marginLeft: "7px",
    padding: "3px 6px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "9px",
    fontWeight: "800",
  },

  billingHint: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "11px",
  },

  pricingSection: {
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "26px 20px 40px",
    boxSizing: "border-box",
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "18px",
    alignItems: "stretch",
  },

  planCard: {
    position: "relative",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "25px 21px 21px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    cursor: "pointer",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
    boxShadow: "0 8px 25px rgba(15,23,42,0.05)",
  },

  popularCard: {
    border: "2px solid #2563eb",
    boxShadow: "0 14px 35px rgba(37,99,235,0.13)",
  },

  selectedCard: {
    borderColor: "#2563eb",
    boxShadow: "0 12px 30px rgba(37,99,235,0.12)",
  },

  popularBadge: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2563eb",
    color: "#ffffff",
    padding: "5px 11px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "0.6px",
    whiteSpace: "nowrap",
  },

  planHeader: {
    minHeight: "93px",
  },

  planName: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "800",
    color: "#0f172a",
  },

  planDescription: {
    margin: "8px 0 0",
    fontSize: "12px",
    lineHeight: "1.55",
    color: "#64748b",
  },

  priceArea: {
    display: "flex",
    alignItems: "baseline",
    gap: "3px",
    marginTop: "18px",
    minHeight: "48px",
  },

  currency: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1d4ed8",
  },

  price: {
    fontSize: "38px",
    lineHeight: "1",
    fontWeight: "850",
    letterSpacing: "-1.5px",
    color: "#0f172a",
  },

  period: {
    fontSize: "11px",
    color: "#64748b",
  },

  monthlyEquivalent: {
    marginTop: "7px",
    fontSize: "10px",
    color: "#64748b",
  },

  listingsBox: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginTop: "22px",
    padding: "13px",
    background: "#f8fbff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  listingsIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "16px",
  },

  listingsLabel: {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
    fontWeight: "800",
  },

  listingsValue: {
    marginTop: "3px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#0f172a",
  },

  featureList: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    flex: 1,
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "12px",
    color: "#475569",
  },

  planButton: {
    width: "100%",
    marginTop: "24px",
    border: "1px solid #2563eb",
    background: "#ffffff",
    color: "#1d4ed8",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  planButtonPopular: {
    background: "#2563eb",
    color: "#ffffff",
  },

  planButtonSelected: {
    background: "#1d4ed8",
    color: "#ffffff",
  },

  infoSection: {
    maxWidth: "920px",
    margin: "0 auto",
    padding: "0 20px 50px",
    boxSizing: "border-box",
  },

  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "18px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    boxShadow: "0 5px 18px rgba(15,23,42,0.04)",
  },

  infoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  infoTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "800",
    color: "#0f172a",
  },

  infoText: {
    margin: "5px 0 0",
    fontSize: "11px",
    lineHeight: "1.6",
    color: "#64748b",
  },

  footer: {
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
    padding: "22px 20px",
    color: "#94a3b8",
    fontSize: "10px",
  },
};

// ============================================================
// MOBILE RESPONSIVE CSS
// ============================================================

if (typeof document !== "undefined") {
  const styleId = "gradlink-company-pricing-styles";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;

    style.innerHTML = `
      @keyframes gradlinkSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 700px) {
        .gradlink-pricing-page {
          overflow-x: hidden;
        }
      }

      @media (max-width: 600px) {
        body {
          margin: 0;
        }
      }

      @media (max-width: 480px) {
        button {
          -webkit-tap-highlight-color: transparent;
        }
      }
    `;

    document.head.appendChild(style);
  }
}