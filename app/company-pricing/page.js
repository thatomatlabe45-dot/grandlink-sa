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
// PLANS
// ============================================================

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 500,
    description:
      "Everything a company needs to start recruiting graduates on GradLink SA.",
    features: [
      "Post internship opportunities",
      "Receive graduate applications",
      "View applicant profiles",
      "Manage applications",
      "Basic applicant matching",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthly: 950,
    description:
      "More powerful recruitment tools for companies hiring regularly.",
    features: [
      "Everything in Starter",
      "Advanced applicant screening",
      "AI candidate matching",
      "Applicant management tools",
      "Priority recruitment visibility",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 1500,
    description:
      "Advanced recruitment capabilities for growing organisations.",
    features: [
      "Everything in Professional",
      "Advanced AI screening",
      "Document verification tools",
      "CV and qualification authenticity checks",
      "Priority support",
    ],
  },
];

// ============================================================
// PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD ACCOUNT
  // ==========================================================

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
      }

      setUser(user || null);

      if (!user) {
        setLoading(false);
        return;
      }

      /*
       * IMPORTANT
       *
       * We check the subscription but we do NOT assume
       * that selecting a plan means payment happened.
       */

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
      }

      setCurrentPlan(subscription || null);
    } catch (error) {
      console.error(error);

      setError(
        error?.message ||
          "Could not load the pricing page."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PRICING
  // ==========================================================

  function getAnnualPrice(monthlyPrice) {
    /*
     * Annual price = 10 months worth of the monthly price.
     *
     * R500 x 10 = R5,000 per year
     * R950 x 10 = R9,500 per year
     * R1,500 x 10 = R15,000 per year
     */

    return monthlyPrice * 10;
  }

  function getMonthlyEquivalent(monthlyPrice) {
    return Math.round(getAnnualPrice(monthlyPrice) / 12);
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

      /*
       * Company account must exist before we can associate
       * a payment/subscription with the user.
       *
       * BUT we do NOT create a companies row here.
       */

      if (!user) {
        router.push(
          `/signup?role=company&redirect=/company-pricing`
        );
        return;
      }

      const price =
        billing === "annual"
          ? getAnnualPrice(plan.monthly)
          : plan.monthly;

      /*
       * Store ONLY the selected plan as inactive.
       *
       * This does NOT give the company access.
       *
       * Payment must later change the subscription to:
       *
       * status = "active"
       */

      const { data, error: saveError } = await supabase
        .from("company_subscriptions")
        .upsert(
          {
            company_id: user.id,
            plan: plan.id,
            status: "inactive",
            monthly_price:
              billing === "annual"
                ? getMonthlyEquivalent(plan.monthly)
                : plan.monthly,
            payment_provider: null,
            payment_reference: null,
            updated_at: new Date().toISOString(),
          },
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

      /*
       * Send the company to the payment page.
       *
       * The company profile is NOT created yet.
       */

      router.push(
        `/company/payment?plan=${encodeURIComponent(
          plan.id
        )}&billing=${billing}`
      );
    } catch (error) {
      console.error(
        "Plan selection error:",
        error
      );

      setError(
        error?.message ||
          "Something went wrong while selecting your plan."
      );
    } finally {
      setSelectingPlan(null);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}>◌</div>

          <h2>Loading GradLink SA</h2>

          <p>
            Preparing company plans...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main style={styles.page}>
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav style={styles.navbar}>
        <Link
          href="/"
          style={styles.logo}
          className="gl-logo"
        >
          <span style={styles.logoIcon}>
            G
          </span>

          <span>
            GradLink{" "}
            <strong>SA</strong>
          </span>
        </Link>

        <div
          style={styles.navLinks}
          className="gl-nav-links"
        >
          <Link
            href="/"
            style={styles.navLink}
          >
            Home
          </Link>

          <Link
            href="/internships"
            style={styles.navLink}
          >
            Internships
          </Link>

          <Link
            href="/jobs"
            style={styles.navLink}
          >
            Jobs
          </Link>
        </div>

        <div
          style={styles.navActions}
          className="gl-nav-actions"
        >
          <Link
            href="/login"
            style={styles.loginButton}
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          🏢 FOR COMPANIES
        </div>

        <h1 style={styles.heroTitle}>
          Choose your{" "}
          <span style={styles.gradientText}>
            GradLink plan
          </span>
        </h1>

        <p style={styles.heroText}>
          Access the tools you need to find,
          screen and manage talented South
          African graduates.
        </p>

        <div
          style={styles.securityNote}
          className="gl-security-note"
        >
          <span style={styles.checkCircle}>
            ✓
          </span>

          <span>
            Payment is required before a company
            profile can be registered.
          </span>
        </div>
      </section>

      {/* =====================================================
          BILLING TOGGLE
      ====================================================== */}

      <section style={styles.billingSection}>
        <div
          style={styles.billingToggle}
          className="gl-billing-toggle"
        >
          <button
            type="button"
            onClick={() =>
              setBilling("monthly")
            }
            style={{
              ...styles.billingButton,
              ...(billing === "monthly"
                ? styles.billingActive
                : {}),
            }}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() =>
              setBilling("annual")
            }
            style={{
              ...styles.billingButton,
              ...(billing === "annual"
                ? styles.billingActive
                : {}),
            }}
          >
            Annual
          </button>

          <span style={styles.saveBadge}>
            SAVE 2 MONTHS
          </span>
        </div>
      </section>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div style={styles.successMessage}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* =====================================================
          PRICING
      ====================================================== */}

      <section style={styles.pricingSection}>
        <div
          style={styles.pricingGrid}
          className="gl-pricing-grid"
        >
          {PLANS.map((plan) => {
            const annualPrice =
              getAnnualPrice(plan.monthly);

            const monthlyEquivalent =
              getMonthlyEquivalent(
                plan.monthly
              );

            const isCurrent =
              currentPlan?.plan ===
                plan.id &&
              currentPlan?.status ===
                "active";

            const isSelecting =
              selectingPlan === plan.id;

            return (
              <article
                key={plan.id}
                style={{
                  ...styles.planCard,
                  ...(plan.popular
                    ? styles.popularCard
                    : {}),
                }}
                className={
                  plan.popular
                    ? "gl-plan-card gl-popular-card"
                    : "gl-plan-card"
                }
              >
                {plan.popular && (
                  <div
                    style={styles.popularBadge}
                    className="gl-popular-badge"
                  >
                    MOST POPULAR
                  </div>
                )}

                <div style={styles.planTop}>
                  <div>
                    <div style={styles.planIcon}>
                      {plan.id === "starter"
                        ? "🚀"
                        : plan.id ===
                          "professional"
                        ? "⭐"
                        : "🏢"}
                    </div>

                    <h2 style={styles.planName}>
                      {plan.name}
                    </h2>

                    <p
                      style={
                        styles.planDescription
                      }
                    >
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div
                  style={styles.priceArea}
                  className="gl-price-area"
                >
                  {billing === "monthly" ? (
                    <>
                      <span
                        style={styles.currency}
                      >
                        R
                      </span>

                      <span
                        style={styles.price}
                      >
                        {plan.monthly.toLocaleString()}
                      </span>

                      <span
                        style={styles.period}
                      >
                        /month
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        style={styles.currency}
                      >
                        R
                      </span>

                      <span
                        style={styles.price}
                      >
                        {annualPrice.toLocaleString()}
                      </span>

                      <span
                        style={styles.period}
                      >
                        /year
                      </span>
                    </>
                  )}
                </div>

                {billing === "annual" && (
                  <div
                    style={styles.annualNote}
                  >
                    Equivalent to R
                    {monthlyEquivalent.toLocaleString()}
                    /month
                  </div>
                )}

                <div
                  style={styles.divider}
                />

                <div
                  style={styles.featureTitle}
                >
                  Includes:
                </div>

                <ul
                  style={styles.featureList}
                >
                  {plan.features.map(
                    (feature) => (
                      <li
                        key={feature}
                        style={styles.feature}
                      >
                        <span
                          style={
                            styles.featureCheck
                          }
                        >
                          ✓
                        </span>

                        <span>
                          {feature}
                        </span>
                      </li>
                    )
                  )}
                </ul>

                <button
                  type="button"
                  disabled={isSelecting}
                  onClick={() =>
                    choosePlan(plan)
                  }
                  style={{
                    ...styles.planButton,
                    ...(plan.popular
                      ? styles.planButtonPrimary
                      : styles.planButtonSecondary),
                    ...(isSelecting
                      ? styles.disabledButton
                      : {}),
                  }}
                >
                  {isSelecting
                    ? "Preparing payment..."
                    : isCurrent
                    ? "Manage Plan"
                    : "Choose Plan →"}
                </button>

                <p
                  style={
                    styles.paymentSmall
                  }
                >
                  🔒 Secure payment required
                  before company registration
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section style={styles.howSection}>
        <div style={styles.sectionHeading}>
          <span style={styles.smallBadge}>
            SIMPLE PROCESS
          </span>

          <h2>
            Get your company on GradLink
          </h2>

          <p>
            Your company profile is created only
            after payment has been successfully
            verified.
          </p>
        </div>

        <div
          style={styles.steps}
          className="gl-steps"
        >
          <Step
            number="01"
            icon="💳"
            title="Choose a plan"
            text="Select the plan that matches your recruitment needs."
          />

          <Step
            number="02"
            icon="🔐"
            title="Complete payment"
            text="Complete the payment through the secure payment process."
          />

          <Step
            number="03"
            icon="🏢"
            title="Register your company"
            text="Once payment is verified, your company profile becomes available."
          />

          <Step
            number="04"
            icon="🚀"
            title="Start recruiting"
            text="Post opportunities and manage graduate applications."
          />
        </div>
      </section>

      {/* =====================================================
          PREMIUM FEATURES
      ====================================================== */}

      <section style={styles.featureSection}>
        <div
          style={styles.featurePanel}
          className="gl-feature-panel"
        >
          <div style={styles.featurePanelText}>
            <span style={styles.smallBadge}>
              BUILT FOR RECRUITERS
            </span>

            <h2>
              More than just an internship
              listing platform.
            </h2>

            <p>
              GradLink SA is designed to help
              companies move from posting an
              opportunity to managing applicants
              in one place.
            </p>

            <div
              style={styles.miniFeatures}
              className="gl-mini-features"
            >
              <div>
                <strong>
                  AI Matching
                </strong>

                <span>
                  Compare applicant
                  qualifications, fields and
                  skills.
                </span>
              </div>

              <div>
                <strong>
                  Applicant Management
                </strong>

                <span>
                  Review and manage applications
                  from your dashboard.
                </span>
              </div>

              <div>
                <strong>
                  Document Verification
                </strong>

                <span>
                  Advanced verification tools
                  can help screen submitted
                  documents.
                </span>
              </div>
            </div>
          </div>

          <div style={styles.featureVisual}>
            <div style={styles.visualCircle}>
              <div style={styles.visualIcon}>
                ✓
              </div>
            </div>

            <strong>
              Professional recruitment
            </strong>

            <span>
              One company workspace
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <span style={styles.logoIcon}>
            G
          </span>

          GradLink{" "}
          <strong>SA</strong>
        </div>

        <p>
          Connecting South African graduates
          with internship opportunities.
        </p>

        <div style={styles.footerLinks}>
          <Link
            href="/"
            style={styles.footerLink}
          >
            Home
          </Link>

          <Link
            href="/internships"
            style={styles.footerLink}
          >
            Internships
          </Link>

          <Link
            href="/jobs"
            style={styles.footerLink}
          >
            Jobs
          </Link>

          <Link
            href="/login"
            style={styles.footerLink}
          >
            Login
          </Link>
        </div>

        <div style={styles.copyright}>
          © {new Date().getFullYear()} GradLink
          SA. All rights reserved.
        </div>
      </footer>

      {/* =====================================================
          RESPONSIVE CSS
      ====================================================== */}

      <style jsx>{`
        :global(html) {
          width: 100%;
          overflow-x: hidden;
        }

        :global(body) {
          margin: 0;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          font-family: inherit;
        }

        .gl-logo {
          flex-shrink: 0;
        }

        @media (max-width: 1000px) {
          .gl-pricing-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }

          .gl-popular-card {
            transform: none !important;
          }

          .gl-steps {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }

          .gl-feature-panel {
            grid-template-columns: 1fr !important;
          }

          .gl-mini-features {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 850px) {
          .gl-nav-links {
            display: none !important;
          }

          .gl-pricing-grid {
            gap: 18px !important;
          }

          .gl-plan-card {
            padding: 26px !important;
          }
        }

        @media (max-width: 700px) {
          .gl-pricing-grid {
            grid-template-columns: 1fr !important;
            width: 100% !important;
          }

          .gl-plan-card {
            width: 100% !important;
            max-width: 100% !important;
          }

          .gl-popular-card {
            transform: none !important;
          }

          .gl-steps {
            grid-template-columns: 1fr !important;
          }

          .gl-feature-panel {
            padding: 32px 24px !important;
          }
        }

        @media (max-width: 520px) {
          .gl-nav-actions {
            display: none !important;
          }

          .gl-logo {
            font-size: 19px !important;
          }

          .gl-billing-toggle {
            width: 100% !important;
            max-width: 360px !important;
          }

          .gl-security-note {
            width: 100% !important;
            justify-content: flex-start !important;
            text-align: left !important;
          }

          .gl-price-area {
            flex-wrap: nowrap !important;
          }

          .gl-plan-card {
            padding: 24px 20px !important;
            border-radius: 20px !important;
          }

          .gl-popular-badge {
            top: -12px !important;
          }
        }

        @media (max-width: 380px) {
          .gl-logo {
            font-size: 17px !important;
          }

          .gl-billing-toggle {
            padding: 4px !important;
          }
        }
      `}</style>
    </main>
  );
}

// ============================================================
// STEP COMPONENT
// ============================================================

function Step({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumber}>
        {number}
      </div>

      <div style={styles.stepIcon}>
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  // ==========================================================
  // PAGE
  // ==========================================================

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7fbff 0%, #ffffff 45%, #f8fbff 100%)",
    color: "#10233f",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #eef6ff 0%, #ffffff 55%, #f5f9ff 100%)",
    padding: "24px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",
  },

  loadingBox: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    border: "1px solid #e4edf8",
    borderRadius: "24px",
    padding: "42px 28px",
    textAlign: "center",
    boxShadow:
      "0 20px 60px rgba(16, 35, 63, 0.10)",
  },

  spinner: {
    width: "54px",
    height: "54px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0b6bcb, #19a7ff)",
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: "800",
  },

  // ==========================================================
  // NAVBAR
  // ==========================================================

  navbar: {
    width: "100%",
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    position: "relative",
    zIndex: 20,
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#10233f",
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0868c9, #19a7ff)",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "800",
    boxShadow:
      "0 8px 22px rgba(8, 104, 201, 0.25)",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "30px",
    flex: 1,
  },

  navLink: {
    color: "#52657d",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.2s ease",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  loginButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 18px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #d9e5f2",
    color: "#0b5cab",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow:
      "0 5px 16px rgba(16, 35, 63, 0.06)",
  },

  // ==========================================================
  // HERO
  // ==========================================================

  hero: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "70px 24px 34px",
    textAlign: "center",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#e9f5ff",
    border: "1px solid #cfe8ff",
    color: "#0968c5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.7px",
    marginBottom: "18px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(38px, 6vw, 68px)",
    lineHeight: 1.04,
    letterSpacing: "-2.5px",
    fontWeight: "850",
    color: "#10233f",
  },

  gradientText: {
    background:
      "linear-gradient(90deg, #0868c9, #18a7ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  heroText: {
    maxWidth: "680px",
    margin: "22px auto 0",
    color: "#61738a",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  securityNote: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "28px",
    padding: "12px 17px",
    borderRadius: "14px",
    background: "#ffffff",
    border: "1px solid #dce9f5",
    color: "#43566e",
    fontSize: "13px",
    lineHeight: 1.5,
    boxShadow:
      "0 8px 26px rgba(16, 35, 63, 0.06)",
  },

  checkCircle: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e5f7ed",
    color: "#16824d",
    fontWeight: "900",
    fontSize: "13px",
  },

  // ==========================================================
  // BILLING
  // ==========================================================

  billingSection: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 24px 38px",
  },

  billingToggle: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px",
    background: "#eaf2fa",
    border: "1px solid #dce8f4",
    borderRadius: "16px",
    boxShadow:
      "0 8px 24px rgba(16, 35, 63, 0.06)",
  },

  billingButton: {
    minWidth: "112px",
    minHeight: "44px",
    border: "none",
    borderRadius: "12px",
    background: "transparent",
    color: "#61738a",
    fontSize: "14px",
    fontWeight: "750",
    cursor: "pointer",
    padding: "0 16px",
  },

  billingActive: {
    background: "#ffffff",
    color: "#075eb5",
    boxShadow:
      "0 4px 14px rgba(16, 35, 63, 0.10)",
  },

  saveBadge: {
    marginLeft: "5px",
    marginRight: "5px",
    padding: "7px 9px",
    borderRadius: "8px",
    background: "#dff7e9",
    color: "#177447",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
  },

  // ==========================================================
  // MESSAGES
  // ==========================================================

  successMessage: {
    width: "calc(100% - 48px)",
    maxWidth: "700px",
    margin: "0 auto 24px",
    padding: "14px 18px",
    borderRadius: "14px",
    background: "#eaf9f0",
    border: "1px solid #c9ecd8",
    color: "#176b42",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "650",
  },

  errorMessage: {
    width: "calc(100% - 48px)",
    maxWidth: "700px",
    margin: "0 auto 24px",
    padding: "14px 18px",
    borderRadius: "14px",
    background: "#fff0f0",
    border: "1px solid #f3d0d0",
    color: "#b42323",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "650",
  },

  // ==========================================================
  // PRICING
  // ==========================================================

  pricingSection: {
    width: "100%",
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "10px 24px 70px",
  },

  pricingGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "24px",
    alignItems: "stretch",
  },

  planCard: {
    position: "relative",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    border: "1px solid #dfe9f3",
    borderRadius: "24px",
    padding: "30px",
    boxShadow:
      "0 14px 45px rgba(16, 35, 63, 0.08)",
  },

  popularCard: {
    border:
      "2px solid #0a75d1",
    boxShadow:
      "0 18px 55px rgba(8, 104, 201, 0.16)",
    transform: "translateY(-8px)",
  },

  popularBadge: {
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "7px 13px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #0868c9, #18a7ff)",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "0.7px",
    whiteSpace: "nowrap",
    boxShadow:
      "0 8px 20px rgba(8, 104, 201, 0.25)",
  },

  planTop: {
    minHeight: "176px",
  },

  planIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef7ff",
    fontSize: "22px",
    marginBottom: "15px",
  },

  planName: {
    margin: 0,
    color: "#10233f",
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
  },

  planDescription: {
    margin: "10px 0 0",
    color: "#687b91",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  priceArea: {
    minHeight: "72px",
    display: "flex",
    alignItems: "baseline",
    gap: "3px",
    whiteSpace: "nowrap",
  },

  currency: {
    color: "#0a6bc8",
    fontSize: "20px",
    fontWeight: "800",
    alignSelf: "flex-start",
    marginTop: "10px",
  },

  price: {
    color: "#10233f",
    fontSize: "42px",
    fontWeight: "850",
    letterSpacing: "-2px",
    lineHeight: 1,
  },

  period: {
    color: "#72849a",
    fontSize: "13px",
    fontWeight: "600",
    marginLeft: "4px",
  },

  annualNote: {
    minHeight: "24px",
    color: "#197448",
    fontSize: "12px",
    fontWeight: "700",
    marginTop: "3px",
  },

  divider: {
    width: "100%",
    height: "1px",
    background: "#e8eef5",
    margin: "22px 0",
  },

  featureTitle: {
    color: "#263c55",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "14px",
  },

  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
  },

  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    color: "#53677e",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  featureCheck: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#e8f5ff",
    color: "#0870cb",
    fontSize: "11px",
    fontWeight: "900",
    marginTop: "1px",
  },

  planButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "28px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  planButtonPrimary: {
    border: "1px solid #0871d1",
    background:
      "linear-gradient(135deg, #0868c9, #18a7ff)",
    color: "#ffffff",
    boxShadow:
      "0 10px 24px rgba(8, 104, 201, 0.22)",
  },

  planButtonSecondary: {
    border: "1px solid #cbdbea",
    background: "#ffffff",
    color: "#075eb5",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  paymentSmall: {
    margin: "12px 0 0",
    textAlign: "center",
    color: "#8a99aa",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  // ==========================================================
  // HOW IT WORKS
  // ==========================================================

  howSection: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "78px 24px",
  },

  sectionHeading: {
    maxWidth: "700px",
    margin: "0 auto 45px",
    textAlign: "center",
  },

  smallBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#eaf5ff",
    color: "#0868c9",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "0.8px",
  },

  steps: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  step: {
    position: "relative",
    minWidth: 0,
    padding: "28px 22px",
    background: "#ffffff",
    border: "1px solid #e3ebf4",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 10px 35px rgba(16, 35, 63, 0.05)",
  },

  stepNumber: {
    position: "absolute",
    top: "15px",
    right: "17px",
    color: "#a8bacd",
    fontSize: "11px",
    fontWeight: "850",
  },

  stepIcon: {
    width: "52px",
    height: "52px",
    margin: "0 auto 17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    background: "#edf7ff",
    fontSize: "24px",
  },

  // ==========================================================
  // FEATURE SECTION
  // ==========================================================

  featureSection: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "20px 24px 85px",
  },

  featurePanel: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.5fr) minmax(260px, 0.7fr)",
    gap: "40px",
    alignItems: "center",
    padding: "50px",
    borderRadius: "30px",
    background:
      "linear-gradient(135deg, #0b315e 0%, #075cae 60%, #0788d9 100%)",
    boxShadow:
      "0 25px 70px rgba(8, 71, 130, 0.20)",
    overflow: "hidden",
  },

  featurePanelText: {
    minWidth: 0,
  },

  miniFeatures: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginTop: "28px",
  },

  featureVisual: {
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: "24px",
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    color: "#ffffff",
    padding: "30px",
  },

  visualCircle: {
    width: "100px",
    height: "100px",
    marginBottom: "22px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.13)",
    border:
      "1px solid rgba(255,255,255,0.25)",
  },

  visualIcon: {
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#0870c9",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.15)",
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    width: "100%",
    padding: "55px 24px 30px",
    textAlign: "center",
    background: "#081a2f",
    color: "#ffffff",
  },

  footerLogo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "21px",
    fontWeight: "700",
  },

  footerLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "22px",
    marginTop: "25px",
  },

  footerLink: {
    color: "#b8c9da",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },

  copyright: {
    marginTop: "28px",
    paddingTop: "22px",
    borderTop:
      "1px solid rgba(255,255,255,0.10)",
    color: "#8195aa",
    fontSize: "11px",
  },
};