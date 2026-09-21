"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  function getAnnualPrice(monthlyPrice) {
    /*
     * Annual price = 10 months worth of the monthly price.
     *
     * Example:
     * R500 x 10 = R5,000 per year
     * instead of R6,000 monthly over 12 months.
     */

    return monthlyPrice * 10;
  }

  function getMonthlyEquivalent(monthlyPrice) {
    return Math.round(getAnnualPrice(monthlyPrice) / 12);
  }

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

  return (
    <main style={styles.page}>
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav style={styles.navbar}>
        <Link
          href="/"
          style={styles.logo}
        >
          <span style={styles.logoIcon}>
            G
          </span>

          <span>
            GradLink{" "}
            <strong>SA</strong>
          </span>
        </Link>

        <div style={styles.navLinks}>
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

        <div style={styles.navActions}>
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

        <div style={styles.securityNote}>
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
        <div style={styles.billingToggle}>
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
        <div style={styles.pricingGrid}>
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
              >
                {plan.popular && (
                  <div style={styles.popularBadge}>
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

                    <p style={styles.planDescription}>
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div style={styles.priceArea}>
                  {billing === "monthly" ? (
                    <>
                      <span style={styles.currency}>
                        R
                      </span>

                      <span style={styles.price}>
                        {plan.monthly.toLocaleString()}
                      </span>

                      <span style={styles.period}>
                        /month
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={styles.currency}>
                        R
                      </span>

                      <span style={styles.price}>
                        {annualPrice.toLocaleString()}
                      </span>

                      <span style={styles.period}>
                        /year
                      </span>
                    </>
                  )}
                </div>

                {billing === "annual" && (
                  <div style={styles.annualNote}>
                    Equivalent to R
                    {monthlyEquivalent.toLocaleString()}
                    /month
                  </div>
                )}

                <div style={styles.divider} />

                <div style={styles.featureTitle}>
                  Includes:
                </div>

                <ul style={styles.featureList}>
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

                <p style={styles.paymentSmall}>
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

        <div style={styles.steps}>
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
        <div style={styles.featurePanel}>
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

            <div style={styles.miniFeatures}>
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

      <style jsx>{`
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

        @media (max-width: 850px) {
          .navLinks {
            display: none;
          }
        }

        @media (max-width: 700px) {
          .pricingGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .navActions {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

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

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f7fbff 0%,#ffffff 50%,#f5f9ff 100%)",
    color: "#10233f",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f9ff",
    padding: "20px",
  },

  loadingBox: {
    background: "#fff",
    padding: "40px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow:
      "0 20px 60px rgba(15,59,112,.10)",
  },

  spinner: {
    fontSize: "42px",
    color: "#1261d6",
    marginBottom: "10px",
  },

  navbar: {
    minHeight: "72px",
    padding: "0 6%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    background: "rgba(255,255,255,.96)",
    borderBottom: "1px solid #e7eef7",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#10233f",
    textDecoration: "none",
    fontSize: "21px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg,#1261d6,#08a0ff)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow:
      "0 8px 18px rgba(18,97,214,.25)",
  },

  navLinks: {
    display: "flex",
    gap: "30px",
    alignItems: "center",
  },

  navLink: {
    color: "#52647c",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "650",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
  },

  loginButton: {
    textDecoration: "none",
    color: "#1261d6",
    border: "1px solid #cfe0f5",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "750",
    fontSize: "14px",
    background: "#fff",
  },

  hero: {
    textAlign: "center",
    padding: "75px 20px 35px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  heroBadge: {
    display: "inline-flex",
    padding: "8px 13px",
    borderRadius: "30px",
    background: "#eaf3ff",
    color: "#1261d6",
    fontSize: "12px",
    fontWeight: "850",
    letterSpacing: ".5px",
    marginBottom: "18px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(40px,7vw,68px)",
    lineHeight: "1.05",
    letterSpacing: "-2.5px",
    fontWeight: "900",
  },

  gradientText: {
    color: "#1261d6",
  },

  heroText: {
    maxWidth: "650px",
    margin: "22px auto 25px",
    color: "#64748b",
    lineHeight: "1.7",
    fontSize: "17px",
  },

  securityNote: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 15px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "650",
    maxWidth: "100%",
  },

  checkCircle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#fff",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    fontSize: "12px",
  },

  billingSection: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 20px 30px",
  },

  billingToggle: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px",
    background: "#eaf1f9",
    borderRadius: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  billingButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    padding: "11px 18px",
    borderRadius: "10px",
    fontWeight: "750",
    cursor: "pointer",
    fontSize: "14px",
  },

  billingActive: {
    background: "#fff",
    color: "#1261d6",
    boxShadow:
      "0 3px 12px rgba(20,70,120,.12)",
  },

  saveBadge: {
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "10px",
    fontWeight: "900",
    padding: "6px 8px",
    borderRadius: "7px",
    margin: "0 5px",
  },

  pricingSection: {
    padding: "0 20px 80px",
  },

  pricingGrid: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "22px",
  },

  planCard: {
    background: "#fff",
    border: "1px solid #e1eaf4",
    borderRadius: "22px",
    padding: "30px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    boxShadow:
      "0 15px 40px rgba(24,69,120,.07)",
  },

  popularCard: {
    border: "2px solid #1261d6",
    boxShadow:
      "0 20px 55px rgba(18,97,214,.15)",
    transform: "translateY(-6px)",
  },

  popularBadge: {
    position: "absolute",
    top: "-13px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1261d6",
    color: "#fff",
    padding: "7px 13px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: ".5px",
    whiteSpace: "nowrap",
  },

  planIcon: {
    fontSize: "30px",
    marginBottom: "12px",
  },

  planName: {
    margin: "0 0 9px",
    fontSize: "25px",
    fontWeight: "850",
  },

  planDescription: {
    margin: 0,
    color: "#718198",
    fontSize: "13px",
    lineHeight: "1.6",
    minHeight: "63px",
  },

  priceArea: {
    display: "flex",
    alignItems: "baseline",
    marginTop: "28px",
    minHeight: "55px",
  },

  currency: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1261d6",
    marginRight: "3px",
  },

  price: {
    fontSize: "42px",
    lineHeight: 1,
    fontWeight: "900",
    color: "#10233f",
    letterSpacing: "-1.5px",
  },

  period: {
    color: "#718198",
    fontSize: "13px",
    marginLeft: "5px",
  },

  annualNote: {
    marginTop: "8px",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "750",
  },

  divider: {
    height: "1px",
    background: "#edf1f6",
    margin: "25px 0",
  },

  featureTitle: {
    fontSize: "13px",
    fontWeight: "850",
    marginBottom: "13px",
  },

  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 25px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
  },

  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    color: "#52647c",
    fontSize: "13px",
    lineHeight: "1.45",
  },

  featureCheck: {
    width: "19px",
    height: "19px",
    borderRadius: "50%",
    background: "#eaf3ff",
    color: "#1261d6",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "11px",
    fontWeight: "900",
  },

  planButton: {
    width: "100%",
    minHeight: "50px",
    borderRadius: "12px",
    fontWeight: "850",
    fontSize: "14px",
    cursor: "pointer",
    transition:
      "transform .15s ease, box-shadow .15s ease",
  },

  planButtonPrimary: {
    border: "none",
    background:
      "linear-gradient(135deg,#1261d6,#087ed8)",
    color: "#fff",
    boxShadow:
      "0 10px 22px rgba(18,97,214,.22)",
  },

  planButtonSecondary: {
    border: "1px solid #cbdced",
    background: "#fff",
    color: "#1261d6",
  },

  disabledButton: {
    opacity: ".65",
    cursor: "not-allowed",
    transform: "none",
  },

  paymentSmall: {
    textAlign: "center",
    margin: "12px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
  },

  successMessage: {
    maxWidth: "700px",
    margin: "0 auto 25px",
    padding: "14px 17px",
    background: "#ecfdf3",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
  },

  errorMessage: {
    maxWidth: "700px",
    margin: "0 auto 25px",
    padding: "14px 17px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
  },

  howSection: {
    padding: "85px 20px",
    background: "#f7fbff",
    borderTop: "1px solid #edf3f9",
    borderBottom: "1px solid #edf3f9",
  },

  sectionHeading: {
    maxWidth: "700px",
    margin: "0 auto 45px",
    textAlign: "center",
  },

  smallBadge: {
    display: "inline-block",
    color: "#1261d6",
    background: "#eaf3ff",
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: ".7px",
    marginBottom: "12px",
  },

  steps: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",
    gap: "18px",
  },

  step: {
    background: "#fff",
    border: "1px solid #e1eaf4",
    borderRadius: "18px",
    padding: "24px",
    position: "relative",
  },

  stepNumber: {
    position: "absolute",
    right: "16px",
    top: "15px",
    color: "#dbe7f5",
    fontSize: "24px",
    fontWeight: "900",
  },

  stepIcon: {
    fontSize: "27px",
    marginBottom: "15px",
  },

  featureSection: {
    padding: "80px 20px",
  },

  featurePanel: {
    maxWidth: "1100px",
    margin: "0 auto",
    borderRadius: "28px",
    padding: "50px",
    background:
      "linear-gradient(135deg,#0c3d82,#1261d6)",
    color: "#fff",
    display: "grid",
    gridTemplateColumns:
      "1.5fr .8fr",
    gap: "40px",
    alignItems: "center",
    boxShadow:
      "0 25px 60px rgba(18,97,214,.18)",
  },

  featurePanelText: {
    minWidth: 0,
  },

  featureVisual: {
    background:
      "rgba(255,255,255,.10)",
    border:
      "1px solid rgba(255,255,255,.18)",
    borderRadius: "22px",
    padding: "35px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "9px",
  },

  visualCircle: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,.14)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "8px",
  },

  visualIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "#fff",
    color: "#1261d6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
    fontWeight: "900",
  },

  miniFeatures: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  footer: {
    background: "#07172c",
    color: "#fff",
    textAlign: "center",
    padding: "50px 20px 35px",
  },

  footerLogo: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
    fontWeight: "850",
  },

  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "22px",
    flexWrap: "wrap",
    margin: "25px 0",
  },

  footerLink: {
    color: "#b8c8dc",
    textDecoration: "none",
    fontSize: "13px",
  },
};