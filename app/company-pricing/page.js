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
    label: "FOR SMALL TEAMS",
    description:
      "Start building your talent pipeline with essential recruitment tools.",
    monthly: 500,
    annual: 5000,
    listings: 5,
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
    label: "FOR GROWING TEAMS",
    description:
      "A more powerful recruitment experience for growing businesses.",
    monthly: 1000,
    annual: 10000,
    listings: 15,
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
    key: "enterprise",
    name: "Enterprise",
    label: "FOR LARGE TEAMS",
    description:
      "More recruitment capacity for organisations building larger talent pipelines.",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    features: [
      "Up to 30 active internship listings",
      "Everything in Professional",
      "AI applicant matching",
      "Advanced applicant screening",
      "Document verification",
      "Priority recruitment support",
    ],
  },
  {
    key: "listing",
    name: "Pay Per Listing",
    label: "FOR ONE OPPORTUNITY",
    description:
      "Advertise one internship opportunity without a recurring subscription.",
    monthly: 350,
    annual: null,
    listings: 1,
    features: [
      "One active internship listing",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "30-day listing period",
      "No recurring subscription",
    ],
  },
];

const FAQS = [
  {
    question: "How do company payments work?",
    answer:
      "Choose your plan and continue to the payment page. Follow the bank-transfer instructions, make the payment and submit your payment reference and proof of payment. Your subscription remains pending until GradLink SA verifies receipt.",
  },
  {
    question: "How much can I save with annual billing?",
    answer:
      "Starter costs R5,000 per year instead of R6,000 when paid monthly. Professional costs R10,000 instead of R12,000, and Enterprise costs R15,000 instead of R18,000. Each annual plan saves the equivalent of two monthly payments.",
  },
  {
    question: "What is included in Enterprise?",
    answer:
      "Enterprise is R1,500 per month or R15,000 per year, with up to 30 active internship listings. It is designed for larger recruitment needs and includes the listed Professional features plus priority recruitment support. Advanced features should only be relied upon once they are operational.",
  },
  {
    question: "Can I pay for just one listing?",
    answer:
      "Yes. Pay Per Listing costs R350 once-off for one internship listing for 30 days. It does not renew as a monthly subscription.",
  },
  {
    question: "When will my company account be activated?",
    answer:
      "Your subscription stays pending until your payment has been verified. Selecting a plan or submitting proof of payment does not automatically activate your paid company access.",
  },
  {
    question: "Is there a free company plan?",
    answer:
      "No. Company recruitment plans are paid. Individuals looking for opportunities can use GradLink SA without purchasing a company subscription.",
  },
];

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!mounted) return;

        setUser(currentUser || null);

        if (!currentUser) return;

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
            "We could not load your account details. You can still view the plans. Please refresh if the problem continues."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const isActive =
    String(subscription?.status || "").toLowerCase() === "active";

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-ZA", {
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getPrice(plan) {
    if (plan.key === "listing") return 350;

    return billing === "annual" ? plan.annual : plan.monthly;
  }

  function getPeriod(plan) {
    if (plan.key === "listing") return "once-off";

    return billing === "annual" ? "per year" : "per month";
  }

  function goToSignup() {
    router.push(
      "/signup?role=company&redirect=/company-pricing"
    );
  }

  function goToCompanyLogin() {
    router.push(
      "/login?role=company&redirect=/company-dashboard"
    );
  }

  async function choosePlan(plan) {
    if (!user) {
      goToSignup();
      return;
    }

    try {
      setProcessingPlan(plan.key);
      setError("");

      const selectedBilling =
        plan.key === "listing" ? "listing" : billing;

      const amount = getPrice(plan);

      // Keep the existing database structure.
      // Annual prices are stored as their monthly equivalent.
      // The actual selected billing period and amount are
      // passed to the payment page through the URL.

      const storedMonthlyPrice =
        selectedBilling === "annual"
          ? Math.round(amount / 10)
          : amount;

      const {
        data: newSubscription,
        error: insertError,
      } = await supabase
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

      const paymentUrl =
        `/company/payment?plan=${encodeURIComponent(plan.key)}` +
        `&billing=${encodeURIComponent(selectedBilling)}` +
        `&subscription=${encodeURIComponent(newSubscription.id)}` +
        `&amount=${encodeURIComponent(amount)}`;

      router.push(paymentUrl);
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
        <div className="brand-mark">G</div>
        <h2>GradLink SA</h2>
        <p>Preparing your experience...</p>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f7f9fd;
            color: #10213d;
            font-family: Arial, sans-serif;
          }

          .brand-mark {
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            border-radius: 15px;
            background: #1d4ed8;
            color: white;
            font-size: 26px;
            font-weight: 900;
          }

          p {
            color: #64748b;
            font-size: 14px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div className="header-inner">
          <a href="/" className="brand">
            <span className="brand-mark">G</span>
            <span>
              <strong>GradLink SA</strong>
              <small>Connecting talent with opportunity</small>
            </span>
          </a>

          <nav className="header-actions">
            <a href="#plans" className="nav-link">
              View plans
            </a>

            {user ? (
              <button
                type="button"
                className="header-button"
                onClick={() =>
                  router.push("/company-dashboard")
                }
              >
                Dashboard →
              </button>
            ) : (
              <button
                type="button"
                className="header-button"
                onClick={goToCompanyLogin}
              >
                Company login
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            THE FUTURE OF RECRUITMENT
          </span>

          <h1>
            Great talent.
            <br />
            <span>Greater possibilities.</span>
          </h1>

          <p>
            Connect your organisation with South African talent.
            Advertise internship opportunities, discover
            candidates and build your future workforce with
            GradLink SA.
          </p>

          <div className="hero-actions">
            <a href="#plans" className="primary-button">
              Explore company plans →
            </a>

            <a href="#benefits" className="secondary-button">
              Discover the benefits
            </a>
          </div>

          <div className="trust-note">
            <span>✓</span>
            Transparent pricing · Bank transfer · Verified payments
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-glow" />

          <div className="visual-card">
            <div className="visual-brand">
              <span className="visual-mark">G</span>
              <div>
                <strong>GradLink SA</strong>
                <small>Talent and opportunity</small>
              </div>
            </div>

            <div className="visual-divider" />

            <span className="visual-kicker">
              BUILD YOUR FUTURE TEAM
            </span>

            <h2>
              The right opportunity.
              <br />
              The right connection.
            </h2>

            <div className="visual-tags">
              <span>Internships</span>
              <span>Applications</span>
              <span>Talent discovery</span>
            </div>

            <div className="visual-footer">
              <span className="status-dot" />
              Connecting opportunity with potential
            </div>
          </div>

          <div className="floating-card floating-one">
            <span className="floating-icon">✦</span>
            <div>
              <strong>Discover talent</strong>
              <small>Find your next candidate</small>
            </div>
          </div>

          <div className="floating-card floating-two">
            <span className="floating-icon green">✓</span>
            <div>
              <strong>Recruit with purpose</strong>
              <small>Grow your organisation</small>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits section" id="benefits">
        <div className="section-heading">
          <span className="section-kicker">
            WHY GRADLINK SA?
          </span>

          <h2>
            Recruitment built around
            <br />
            <span>your business needs.</span>
          </h2>

          <p>
            Find opportunities to introduce your organisation
            to emerging talent and manage your recruitment process.
          </p>
        </div>

        <div className="benefit-grid">
          <article className="benefit-card">
            <span className="benefit-number">01</span>
            <h3>Reach emerging talent</h3>
            <p>
              Advertise opportunities and connect with people
              taking their next career step.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">02</span>
            <h3>Manage applications</h3>
            <p>
              Review candidate applications and organise
              your recruitment activity.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">03</span>
            <h3>Discover candidates</h3>
            <p>
              Use available candidate information and matching
              tools according to your plan.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">04</span>
            <h3>Build your presence</h3>
            <p>
              Introduce your organisation through your
              company profile and internship listings.
            </p>
          </article>
        </div>
      </section>

      <section className="pricing section" id="plans">
        <div className="section-heading">
          <span className="section-kicker">
            SIMPLE, TRANSPARENT PRICING
          </span>

          <h2>
            Choose the plan
            <br />
            <span>that moves you forward.</span>
          </h2>

          <p>
            From a single opportunity to a larger recruitment
            pipeline, choose the option that fits your business.
          </p>
        </div>

        {isActive && (
          <div className="active-banner">
            <div>
              <strong>
                Your company has an active subscription
              </strong>
              <p>
                Review your existing subscription before
                requesting another plan.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/company-dashboard")
              }
            >
              Go to dashboard →
            </button>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="billing-panel">
          <div>
            <strong>Choose your billing option</strong>
            <p>
              Annual plans save the equivalent of two months.
            </p>
          </div>

          <div className="billing-toggle">
            <button
              type="button"
              className={
                billing === "monthly" ? "selected" : ""
              }
              aria-pressed={billing === "monthly"}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>

            <button
              type="button"
              className={
                billing === "annual" ? "selected" : ""
              }
              aria-pressed={billing === "annual"}
              onClick={() => setBilling("annual")}
            >
              Annual
              <span className="save-badge">SAVE 2 MONTHS</span>
            </button>
          </div>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan) => {
            const price = getPrice(plan);
            const period = getPeriod(plan);

            return (
              <article
                key={plan.key}
                className={`plan-card ${
                  plan.popular ? "popular" : ""
                } ${
                  plan.key === "enterprise"
                    ? "enterprise"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="popular-label">
                    MOST POPULAR
                  </div>
                )}

                {plan.key === "enterprise" && (
                  <div className="enterprise-label">
                    PREMIUM PLAN
                  </div>
                )}

                <div className="plan-top">
                  <span className="plan-label">
                    {plan.label}
                  </span>

                  <h3>{plan.name}</h3>

                  <p className="plan-description">
                    {plan.description}
                  </p>
                </div>

                <div className="price-block">
                  <div className="price-line">
                    <span className="currency">R</span>
                    <span className="price">
                      {formatPrice(price)}
                    </span>
                  </div>

                  <span className="price-period">
                    {period}
                  </span>

                  {plan.key !== "listing" &&
                    billing === "annual" && (
                      <p className="saving-note">
                        ✓ Save R
                        {formatPrice(
                          plan.monthly * 12 - plan.annual
                        )}{" "}
                        per year
                      </p>
                    )}
                </div>

                <div className="listing-limit">
                  <span className="limit-check">✓</span>
                  <span>
                    {plan.key === "listing"
                      ? "1 listing for 30 days"
                      : `Up to ${plan.listings} active listings`}
                  </span>
                </div>

                <h4 className="features-heading">
                  What's included
                </h4>

                <ul className="features">
                  {plan.features.map((feature, index) => (
                    <li key={`${plan.key}-${index}`}>
                      <span className="feature-check">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`plan-button ${
                    plan.popular
                      ? "plan-button-primary"
                      : ""
                  } ${
                    plan.key === "enterprise"
                      ? "enterprise-button"
                      : ""
                  }`}
                  disabled={processingPlan !== null}
                  onClick={() => choosePlan(plan)}
                >
                  {processingPlan === plan.key
                    ? "Preparing request..."
                    : plan.key === "listing"
                    ? "Choose this listing"
                    : isActive
                    ? "Request this plan"
                    : "Get started"}

                  <span>→</span>
                </button>

                <p className="plan-footnote">
                  Bank transfer · Verification required
                </p>
              </article>
            );
          })}
        </div>

        <p className="pricing-disclaimer">
          All prices are in South African rand (ZAR).
          Annual subscriptions are payable upfront.
          Pay Per Listing is a once-off payment for a
          30-day listing period.
        </p>
      </section>

      <section className="payment-section">
        <div className="payment-icon">✓</div>

        <div className="payment-content">
          <span className="section-kicker">
            STRAIGHTFORWARD PAYMENTS
          </span>

          <h2>Clear pricing. Verified payments.</h2>

          <p>
            Choose your plan, follow the bank-transfer
            instructions and submit your payment reference
            and proof of payment. Your subscription stays
            pending until we verify receipt.
          </p>
        </div>

        <div className="payment-steps">
          <div>
            <span>01</span>
            <strong>Select your plan</strong>
          </div>

          <div>
            <span>02</span>
            <strong>Make payment</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Payment verification</strong>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-heading">
          <span className="section-kicker">
            NEED TO KNOW MORE?
          </span>

          <h2>Frequently asked questions</h2>

          <p>
            Find answers about pricing, payment and company plans.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, index) => (
            <article className="faq-item" key={faq.question}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={openFaq === index}
                onClick={() =>
                  setOpenFaq(
                    openFaq === index ? -1 : index
                  )
                }
              >
                <span>{faq.question}</span>
                <span className="faq-toggle">
                  {openFaq === index ? "−" : "+"}
                </span>
              </button>

              {openFaq === index && (
                <p className="faq-answer">
                  {faq.answer}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="section-kicker">
            YOUR NEXT CHAPTER STARTS HERE
          </span>

          <h2>
            Find the people who
            <br />
            will shape your future.
          </h2>

          <p>
            Start connecting your organisation with
            South Africa's emerging talent.
          </p>
        </div>

        <a href="#plans" className="closing-button">
          Explore company plans →
        </a>
      </section>

      <footer className="footer">
        <a href="/" className="footer-brand">
          <span className="footer-mark">G</span>
          <strong>GradLink SA</strong>
        </a>

        <p>
          Connecting South African talent with opportunity.
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/internships">Internships</a>
          <a href="/contact">Contact</a>
        </div>

        <small>
          © {new Date().getFullYear()} GradLink SA.
          All rights reserved.
        </small>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          overflow: hidden;
          background: #ffffff;
          color: #10213d;
          font-family: Arial, Helvetica, sans-serif;
        }

        button,
        a {
          font-family: inherit;
          -webkit-tap-highlight-color: transparent;
        }

        a {
          text-decoration: none;
        }

        button {
          cursor: pointer;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid #e5ebf4;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(12px);
        }

        .header-inner {
          width: min(1160px, calc(100% - 36px));
          min-height: 74px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand,
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #10213d;
        }

        .brand-mark,
        .footer-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          color: white;
          font-size: 21px;
          font-weight: 900;
        }

        .brand > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand strong {
          font-size: 15px;
          font-weight: 900;
        }

        .brand small {
          color: #64748b;
          font-size: 10px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-link {
          color: #475569;
          font-size: 12px;
          font-weight: 800;
        }

        .header-button {
          min-height: 42px;
          padding: 0 15px;
          border: 0;
          border-radius: 9px;
          background: #1d4ed8;
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .header-button:hover,
        .primary-button:hover,
        .plan-button-primary:hover:not(:disabled) {
          background: #163ca8;
        }

        .hero {
          width: min(1160px, calc(100% - 40px));
          min-height: 520px;
          margin: auto;
          padding: 62px 0;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 36px;
        }

        .hero-copy {
          min-width: 0;
        }

        .eyebrow,
        .section-kicker {
          color: #2457c5;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          line-height: 1.7;
        }

        .eyebrow {
          display: inline-block;
          padding: 9px 12px;
          border: 1px solid #d5e4ff;
          border-radius: 7px;
          background: #f1f6ff;
        }

        .hero h1 {
          margin: 24px 0 0;
          color: #10213d;
          font-size: clamp(39px, 5vw, 61px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -2.5px;
        }

        .hero h1 span,
        .section-heading h2 span {
          color: #2563eb;
        }

        .hero-copy > p {
          max-width: 480px;
          margin: 20px 0 0;
          color: #52627a;
          font-size: 14px;
          line-height: 1.9;
        }

        .hero-actions {
          margin-top: 27px;
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
        }

        .primary-button,
        .secondary-button,
        .closing-button {
          min-height: 48px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.5;
          text-align: center;
        }

        .primary-button {
          background: #1d4ed8;
          color: white;
        }

        .secondary-button {
          border: 1px solid #d5deeb;
          background: white;
          color: #1e3658;
        }

        .secondary-button:hover {
          background: #f4f7fc;
        }

        .trust-note {
          margin-top: 21px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #52627a;
          font-size: 11px;
          line-height: 1.8;
        }

        .trust-note span {
          color: #16834c;
          font-weight: 900;
        }

        .hero-visual {
          min-width: 0;
          min-height: 390px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        .visual-glow {
          position: absolute;
          z-index: -1;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            #dce9ff,
            #eff5ff 53%,
            transparent 73%
          );
        }

        .visual-card {
          width: min(360px, 86%);
          padding: 25px;
          border: 1px solid #e2e9f4;
          border-radius: 20px;
          background: white;
          box-shadow: 0 24px 65px rgba(30, 64, 125, 0.12);
        }

        .visual-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .visual-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .visual-brand div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .visual-brand strong {
          font-size: 13px;
        }

        .visual-brand small {
          color: #64748b;
          font-size: 10px;
        }

        .visual-divider {
          height: 1px;
          margin: 22px 0;
          background: #e8edf5;
        }

        .visual-kicker {
          color: #3764b4;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .visual-card h2 {
          margin: 12px 0 19px;
          color: #142b4b;
          font-size: 27px;
          line-height: 1.3;
          letter-spacing: -0.8px;
        }

        .visual-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .visual-tags span {
          padding: 8px 9px;
          border: 1px solid #dce8fc;
          border-radius: 7px;
          background: #f2f7ff;
          color: #2858b4;
          font-size: 9px;
          font-weight: 800;
        }

        .visual-footer {
          margin-top: 22px;
          padding-top: 16px;
          display: flex;
          align-items: center;
          gap: 9px;
          border-top: 1px solid #e8edf5;
          color: #52627a;
          font-size: 10px;
          line-height: 1.6;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #16a34a;
        }

        .floating-card {
          position: absolute;
          z-index: 2;
          max-width: 215px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #e1e8f3;
          border-radius: 12px;
          background: white;
          box-shadow: 0 12px 35px rgba(30, 64, 125, 0.1);
        }

        .floating-one {
          top: 25px;
          right: -2px;
        }

        .floating-two {
          bottom: 22px;
          left: -4px;
        }

        .floating-icon {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #edf4ff;
          color: #2563eb;
          font-size: 15px;
        }

        .floating-icon.green {
          background: #e5f8ed;
          color: #16834c;
        }

        .floating-card > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .floating-card strong {
          font-size: 10px;
        }

        .floating-card small {
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .section {
          padding: 76px 20px;
        }

        .benefits {
          border-top: 1px solid #e9eef7;
          border-bottom: 1px solid #e9eef7;
          background: #f7f9fd;
        }

        .section-heading {
          max-width: 680px;
          margin: auto;
          text-align: center;
        }

        .section-heading h2 {
          margin: 14px 0 0;
          color: #10213d;
          font-size: clamp(30px, 4vw, 43px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -1.3px;
        }

        .section-heading > p {
          max-width: 570px;
          margin: 15px auto 0;
          color: #52627a;
          font-size: 13px;
          line-height: 1.9;
        }

        .benefit-grid {
          width: min(1100px, 100%);
          margin: 36px auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .benefit-card {
          min-width: 0;
          padding: 23px 19px;
          border: 1px solid #e2e9f4;
          border-radius: 14px;
          background: white;
        }

        .benefit-number {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eaf1ff;
          color: #245bd6;
          font-size: 12px;
          font-weight: 900;
        }

        .benefit-card h3 {
          margin: 18px 0 9px;
          color: #183052;
          font-size: 14px;
          line-height: 1.6;
        }

        .benefit-card p {
          margin: 0;
          color: #52627a;
          font-size: 12px;
          line-height: 1.9;
        }

        .pricing {
          scroll-margin-top: 80px;
          background: linear-gradient(
            180deg,
            #f8faff 0%,
            #ffffff 35%
          );
        }

        .active-banner {
          width: min(1050px, 100%);
          margin: 28px auto 0;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          background: #eff6ff;
        }

        .active-banner strong {
          font-size: 12px;
        }

        .active-banner p {
          margin: 6px 0 0;
          color: #52627a;
          font-size: 11px;
          line-height: 1.7;
        }

        .active-banner button {
          min-height: 40px;
          padding: 0 12px;
          flex-shrink: 0;
          border: 0;
          border-radius: 8px;
          background: #1d4ed8;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        .error-message {
          width: min(1050px, 100%);
          margin: 20px auto 0;
          padding: 13px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .billing-panel {
          width: min(1050px, 100%);
          margin: 32px auto 23px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #e0e7f1;
          border-radius: 12px;
          background: white;
        }

        .billing-panel > div:first-child strong {
          color: #193152;
          font-size: 12px;
        }

        .billing-panel p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.7;
        }

        .billing-toggle {
          padding: 4px;
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          border: 1px solid #e0e7f1;
          border-radius: 9px;
          background: #f0f3f8;
        }

        .billing-toggle button {
          min-height: 39px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #52627a;
          font-size: 10px;
          font-weight: 800;
        }

        .billing-toggle button.selected {
          background: white;
          color: #1d4ed8;
          box-shadow: 0 2px 7px rgba(15, 23, 42, 0.07);
        }

        .save-badge {
          padding: 5px 6px;
          border-radius: 5px;
          background: #dcfce7;
          color: #166534;
          font-size: 7px;
          font-weight: 900;
          white-space: nowrap;
        }

        .plans-grid {
          width: min(1050px, 100%);
          margin: auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
          gap: 13px;
        }

        .plan-card {
          min-width: 0;
          position: relative;
          padding: 24px 17px 19px;
          display: flex;
          flex-direction: column;
          border: 1px solid #dfe7f2;
          border-radius: 15px;
          background: white;
          box-shadow: 0 8px 28px rgba(16, 33, 61, 0.05);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(16, 33, 61, 0.09);
        }

        .plan-card.popular {
          border: 2px solid #2563eb;
          box-shadow: 0 13px 34px rgba(37, 99, 235, 0.12);
        }

        .plan-card.enterprise {
          border-color: #183a70;
          background: linear-gradient(
            180deg,
            #f2f6ff 0%,
            #ffffff 28%
          );
        }

        .popular-label,
        .enterprise-label {
          margin: -24px -17px 18px;
          padding: 9px 5px;
          border-radius: 12px 12px 0 0;
          background: #2563eb;
          color: white;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-align: center;
        }

        .enterprise-label {
          background: #183a70;
        }

        .plan-label {
          display: inline-block;
          color: #4167ad;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 1.7;
        }

        .plan-top h3 {
          margin: 12px 0 9px;
          color: #152944;
          font-size: 21px;
          line-height: 1.3;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .plan-description {
          min-height: 105px;
          margin: 0;
          color: #52627a;
          font-size: 11px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .price-block {
          min-height: 108px;
          margin-top: 15px;
          padding: 17px 0;
          border-top: 1px solid #e7edf5;
          border-bottom: 1px solid #e7edf5;
        }

        .price-line {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .currency {
          color: #183052;
          font-size: 15px;
          font-weight: 800;
        }

        .price {
          color: #10213d;
          font-size: clamp(25px, 2.3vw, 32px);
          font-weight: 900;
          line-height: 1.3;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
        }

        .price-period {
          display: block;
          margin-top: 4px;
          color: #52627a;
          font-size: 10px;
        }

        .saving-note {
          margin: 8px 0 0;
          color: #16834c;
          font-size: 9px;
          font-weight: 800;
          line-height: 1.6;
        }

        .listing-limit {
          min-height: 44px;
          margin-top: 15px;
          padding: 9px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d8e5ff;
          border-radius: 8px;
          background: #f2f6ff;
          color: #234b93;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .limit-check {
          width: 19px;
          height: 19px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #dce8ff;
          color: #2458c2;
        }

        .features-heading {
          margin: 20px 0 13px;
          color: #203653;
          font-size: 11px;
          font-weight: 900;
        }

        .features {
          margin: 0 0 22px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
          list-style: none;
        }

        .features li {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          color: #52627a;
          font-size: 10px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .feature-check {
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #e5f7ed;
          color: #16834c;
          font-size: 9px;
          font-weight: 900;
        }

        .plan-button {
          width: 100%;
          min-height: 46px;
          margin-top: auto;
          padding: 10px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #d5e1f1;
          border-radius: 8px;
          background: #f2f6ff;
          color: #214b99;
          font-size: 10px;
          font-weight: 900;
          line-height: 1.5;
        }

        .plan-button-primary {
          border-color: #1d4ed8;
          background: #1d4ed8;
          color: white;
        }

        .enterprise-button {
          border-color: #183a70;
          background: #183a70;
          color: white;
        }

        .enterprise-button:hover:not(:disabled) {
          background: #10284f;
        }

        .plan-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .plan-footnote {
          margin: 11px 0 0;
          color: #52627a;
          font-size: 9px;
          line-height: 1.7;
          text-align: center;
        }

        .pricing-disclaimer {
          max-width: 850px;
          margin: 21px auto 0;
          color: #52627a;
          font-size: 10px;
          line-height: 1.9;
          text-align: center;
        }

        .payment-section {
          width: min(1050px, calc(100% - 40px));
          margin: 0 auto 75px;
          padding: 27px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: start;
          gap: 16px;
          border: 1px solid #dfe7f2;
          border-radius: 16px;
          background: #f7faff;
        }

        .payment-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #e4eeff;
          color: #245bd6;
          font-size: 20px;
          font-weight: 900;
        }

        .payment-content h2 {
          margin: 9px 0;
          color: #183052;
          font-size: 22px;
          line-height: 1.4;
          letter-spacing: -0.5px;
        }

        .payment-content p {
          max-width: 650px;
          margin: 0;
          color: #52627a;
          font-size: 12px;
          line-height: 1.9;
        }

        .payment-steps {
          grid-column: 2;
          margin-top: 7px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .payment-steps > div {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #e2e9f4;
          border-radius: 9px;
          background: white;
        }

        .payment-steps span {
          color: #2563eb;
          font-size: 10px;
          font-weight: 900;
        }

        .payment-steps strong {
          color: #314763;
          font-size: 10px;
          line-height: 1.6;
        }

        .faq-section {
          width: min(780px, calc(100% - 40px));
          margin: 0 auto;
          padding-bottom: 75px;
        }

        .faq-section .section-heading {
          margin-bottom: 28px;
        }

        .faq-list {
          border-top: 1px solid #e1e8f2;
        }

        .faq-item {
          border-bottom: 1px solid #e1e8f2;
        }

        .faq-question {
          width: 100%;
          min-height: 61px;
          padding: 14px 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border: 0;
          background: transparent;
          color: #243956;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.7;
          text-align: left;
        }

        .faq-toggle {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #edf4ff;
          color: #2563eb;
          font-size: 18px;
        }

        .faq-answer {
          margin: 0 32px 19px 2px;
          color: #52627a;
          font-size: 12px;
          line-height: 1.9;
        }

        .closing-cta {
          width: min(1050px, calc(100% - 40px));
          margin: 0 auto 70px;
          padding: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          border-radius: 17px;
          background: #112c56;
          color: white;
        }

        .closing-cta .section-kicker {
          color: #b6d1ff;
        }

        .closing-cta h2 {
          margin: 12px 0 0;
          font-size: clamp(25px, 3vw, 35px);
          line-height: 1.3;
          letter-spacing: -0.8px;
        }

        .closing-cta p {
          max-width: 480px;
          margin: 12px 0 0;
          color: #d0dcef;
          font-size: 12px;
          line-height: 1.9;
        }

        .closing-button {
          flex-shrink: 0;
          background: white;
          color: #1747b8;
        }

        .closing-button:hover {
          background: #eaf1ff;
        }

        .footer {
          padding: 26px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 13px;
          border-top: 1px solid #e5ebf4;
          text-align: center;
        }

        .footer-brand {
          font-size: 13px;
        }

        .footer-mark {
          width: 31px;
          height: 31px;
          border-radius: 9px;
          font-size: 15px;
        }

        .footer > p {
          margin: 0;
          color: #52627a;
          font-size: 11px;
          line-height: 1.7;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
        }

        .footer-links a {
          color: #52627a;
          font-size: 10px;
          font-weight: 800;
        }

        .footer-links a:hover {
          color: #2563eb;
        }

        .footer > small {
          color: #64748b;
          font-size: 9px;
          line-height: 1.7;
        }

        @media (max-width: 1000px) {
          .hero {
            gap: 20px;
          }

          .hero h1 {
            font-size: 46px;
          }

          .benefit-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .plan-card {
            padding: 24px 20px 19px;
          }

          .plan-description {
            min-height: 70px;
          }

          .price {
            font-size: 34px;
          }

          .plan-top h3 {
            font-size: 23px;
          }

          .features li {
            font-size: 11px;
          }
        }

        @media (max-width: 650px) {
          .header-inner {
            width: calc(100% - 26px);
            min-height: 65px;
            gap: 8px;
          }

          .brand {
            gap: 8px;
          }

          .brand-mark {
            width: 35px;
            height: 35px;
            font-size: 18px;
          }

          .brand strong {
            font-size: 12px;
          }

          .brand small {
            max-width: 150px;
            font-size: 8px;
            line-height: 1.5;
          }

          .header-actions {
            gap: 8px;
          }

          .nav-link {
            display: none;
          }

          .header-button {
            min-height: 38px;
            padding: 0 10px;
            font-size: 9px;
            white-space: nowrap;
          }

          .hero {
            width: calc(100% - 28px);
            min-height: auto;
            margin: 14px auto 25px;
            padding: 26px 19px;
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
            border: 1px solid #e0e8f5;
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(16, 33, 61, 0.05);
          }

          .eyebrow {
            font-size: 8px;
            letter-spacing: 0.07em;
          }

          .hero h1 {
            margin-top: 20px;
            font-size: clamp(33px, 8.5vw, 44px);
            line-height: 1.13;
            letter-spacing: -1.6px;
            overflow-wrap: anywhere;
          }

          .hero-copy > p {
            margin-top: 16px;
            font-size: 13px;
            line-height: 1.85;
          }

          .hero-actions {
            margin-top: 21px;
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
            min-height: 48px;
            font-size: 12px;
          }

          .trust-note {
            font-size: 10px;
          }

          .hero-visual {
            min-height: 325px;
            margin-top: 5px;
          }

          .visual-glow {
            width: 260px;
            height: 260px;
          }

          .visual-card {
            width: 88%;
            padding: 18px;
          }

          .visual-card h2 {
            font-size: 23px;
          }

          .floating-card {
            max-width: 175px;
            padding: 9px;
            gap: 7px;
          }

          .floating-one {
            top: 3px;
            right: 0;
          }

          .floating-two {
            bottom: 2px;
            left: 0;
          }

          .floating-icon {
            width: 27px;
            height: 27px;
          }

          .floating-card strong {
            font-size: 9px;
          }

          .floating-card small {
            font-size: 8px;
          }

          .section {
            padding: 52px 15px;
          }

          .section-heading h2 {
            font-size: 30px;
            letter-spacing: -0.8px;
          }

          .section-heading > p {
            font-size: 12px;
            line-height: 1.85;
          }

          .benefit-grid {
            margin-top: 25px;
            grid-template-columns: minmax(0, 1fr);
            gap: 11px;
          }

          .benefit-card {
            padding: 19px;
          }

          .benefit-card h3 {
            margin-top: 13px;
          }

          .pricing {
            padding-top: 53px;
            padding-bottom: 50px;
          }

          .active-banner {
            align-items: stretch;
            flex-direction: column;
            gap: 12px;
          }

          .active-banner button {
            width: 100%;
            min-height: 42px;
          }

          .billing-panel {
            margin-top: 25px;
            padding: 14px;
            align-items: stretch;
            flex-direction: column;
            gap: 13px;
          }

          .billing-toggle {
            width: 100%;
          }

          .billing-toggle button {
            flex: 1;
            min-width: 0;
            padding: 0 8px;
            font-size: 10px;
          }

          .save-badge {
            font-size: 7px;
          }

          .plans-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 17px;
          }

          .plan-card {
            padding: 23px 20px 19px;
            border-radius: 14px;
          }

          .popular-label,
          .enterprise-label {
            margin: -23px -20px 18px;
          }

          .plan-top h3 {
            font-size: 24px;
          }

          .plan-description {
            min-height: 0;
            font-size: 13px;
            line-height: 1.8;
          }

          .price-block {
            min-height: 100px;
            margin-top: 17px;
          }

          .price {
            font-size: 37px;
          }

          .price-period {
            font-size: 11px;
          }

          .listing-limit {
            font-size: 11px;
          }

          .features li {
            font-size: 12px;
            line-height: 1.75;
          }

          .plan-button {
            min-height: 49px;
            font-size: 12px;
          }

          .plan-footnote {
            font-size: 10px;
          }

          .pricing-disclaimer {
            font-size: 10px;
          }

          .payment-section {
            width: calc(100% - 28px);
            margin-bottom: 52px;
            padding: 19px;
            grid-template-columns: minmax(0, 1fr);
            gap: 13px;
          }

          .payment-content h2 {
            font-size: 20px;
          }

          .payment-content p {
            font-size: 11px;
          }

          .payment-steps {
            grid-column: 1;
            grid-template-columns: minmax(0, 1fr);
          }

          .payment-steps > div {
            padding: 12px;
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }

          .payment-steps strong {
            font-size: 11px;
          }

          .faq-section {
            width: calc(100% - 30px);
            padding-bottom: 53px;
          }

          .faq-section .section-heading {
            margin-bottom: 22px;
          }

          .faq-section .section-heading h2 {
            font-size: 26px;
          }

          .faq-question {
            min-height: 59px;
            font-size: 11px;
          }

          .faq-answer {
            margin-right: 8px;
            font-size: 11px;
          }

          .closing-cta {
            width: calc(100% - 28px);
            margin-bottom: 45px;
            padding: 24px 19px;
            align-items: stretch;
            flex-direction: column;
            gap: 21px;
          }

          .closing-cta h2 {
            font-size: 28px;
          }

          .closing-cta p {
            font-size: 11px;
          }

          .closing-button {
            width: 100%;
            min-height: 47px;
          }

          .footer {
            padding: 24px 15px;
          }
        }

        @media (max-width: 370px) {
          .brand small {
            max-width: 120px;
          }

          .hero h1 {
            font-size: 32px;
          }

          .eyebrow {
            font-size: 7px;
          }

          .save-badge {
            display: none;
          }

          .price {
            font-size: 34px;
          }

          .plan-card {
            padding-right: 16px;
            padding-left: 16px;
          }

          .popular-label,
          .enterprise-label {
            margin-right: -16px;
            margin-left: -16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}