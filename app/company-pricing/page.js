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
      "Start building your graduate talent pipeline with the essential recruitment tools.",
    monthly: 500,
    annual: 5000,
    listings: "5 active internship listings",
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
      "A more powerful recruitment experience for businesses looking to attract emerging talent.",
    monthly: 1000,
    annual: 10000,
    listings: "15 active internship listings",
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
    label: "FOR ONE OPPORTUNITY",
    description:
      "Advertise a single opportunity without committing to a monthly subscription.",
    monthly: 350,
    annual: 350,
    listings: "1 active internship listing",
    features: [
      "1 active internship listing",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "30-day listing period",
      "No monthly commitment",
    ],
  },
];

const FAQS = [
  {
    question: "How do company payments work?",
    answer:
      "Select your plan and continue to the payment page. Follow the bank-transfer instructions and submit your payment details and proof of payment. Your subscription remains pending until your payment has been verified.",
  },
  {
    question: "Can I pay annually?",
    answer:
      "Yes. Starter and Professional offer annual billing. Pay upfront for the year and save the equivalent of two months compared with paying monthly for twelve months.",
  },
  {
    question: "Can I upgrade my subscription?",
    answer:
      "You can review the available plans and request another plan. Any change to an existing subscription should be confirmed before a new subscription is activated.",
  },
  {
    question: "When will my company account be activated?",
    answer:
      "Your subscription must be verified before paid company access is activated. Submitting a payment request alone does not activate your subscription.",
  },
  {
    question: "Is there a free company plan?",
    answer:
      "No. Company recruitment plans are paid. Graduates can use GradLink SA to access opportunities without purchasing a company subscription.",
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

    async function loadCompanyData() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!mounted) return;

        setUser(currentUser || null);

        // Pricing is public. Visitors do not need an account
        // just to view the available plans.
        if (!currentUser) return;

        const {
          data,
          error: subscriptionError,
        } = await supabase
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

    loadCompanyData();

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
    if (plan.key === "listing") return plan.monthly;

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
      // The payment page must collect the actual selected amount.
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
        <div className="loading-mark">G</div>

        <h2>GradLink SA</h2>

        <p>Preparing your experience...</p>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f7f9fd;
            color: #10213d;
            font-family: Arial, sans-serif;
          }

          .loading-mark {
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            font-size: 25px;
            font-weight: 900;
          }

          h2 {
            margin: 16px 0 0;
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

            <span className="brand-text">
              <strong>GradLink SA</strong>
              <small>Connecting talent with opportunity</small>
            </span>
          </a>

          <nav className="header-actions">
            <a href="#plans" className="nav-plans">
              View plans
            </a>

            {user ? (
              <button
                type="button"
                className="header-button"
                onClick={() => router.push("/company-dashboard")}
              >
                Dashboard <span>→</span>
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
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            THE FUTURE OF GRADUATE RECRUITMENT
          </div>

          <h1>
            Great talent.
            <br />
            <span>Greater possibilities.</span>
          </h1>

          <p className="hero-text">
            Meet the next generation of South African talent.
            Discover graduates, advertise internship opportunities
            and build your future workforce with GradLink SA.
          </p>

          <div className="hero-actions">
            <a href="#plans" className="primary-button">
              Explore our plans <span>→</span>
            </a>

            <a href="#benefits" className="secondary-button">
              Discover the benefits
            </a>
          </div>

          <div className="hero-note">
            <span className="note-check">✓</span>
            Flexible recruitment plans for your business
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="visual-glow" />

          <div className="visual-card visual-card-main">
            <div className="visual-top">
              <div className="visual-icon">G</div>

              <div>
                <strong>GradLink SA</strong>
                <span>Graduate talent platform</span>
              </div>

              <span className="visual-status">●</span>
            </div>

            <div className="visual-divider" />

            <p className="visual-label">YOUR NEXT OPPORTUNITY</p>

            <h3>
              Talent meets
              <br />
              opportunity.
            </h3>

            <div className="visual-tags">
              <span>Graduate talent</span>
              <span>Internships</span>
            </div>

            <div className="visual-bottom">
              <div className="avatar-stack">
                <span>A</span>
                <span>B</span>
                <span>C</span>
              </div>

              <span>Build your talent pipeline</span>
            </div>
          </div>

          <div className="floating-card floating-top">
            <span className="floating-icon">✦</span>

            <div>
              <strong>Find your fit</strong>
              <small>Discover emerging talent</small>
            </div>
          </div>

          <div className="floating-card floating-bottom">
            <span className="floating-check">✓</span>

            <div>
              <strong>Recruit with purpose</strong>
              <small>Grow your future workforce</small>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits" id="benefits">
        <div className="section-heading">
          <span className="section-kicker">WHY GRADLINK SA?</span>

          <h2>
            Recruitment built around
            <br />
            <span>your business needs.</span>
          </h2>

          <p>
            Make it easier to connect your organisation with graduates
            ready to take their next career step.
          </p>
        </div>

        <div className="benefit-grid">
          <article className="benefit-card">
            <div className="benefit-icon">01</div>

            <h3>Reach emerging talent</h3>

            <p>
              Advertise opportunities and connect with graduates
              entering the professional world.
            </p>
          </article>

          <article className="benefit-card">
            <div className="benefit-icon">02</div>

            <h3>Manage applications</h3>

            <p>
              Review candidate applications and organise your
              recruitment process in one place.
            </p>
          </article>

          <article className="benefit-card">
            <div className="benefit-icon">03</div>

            <h3>Discover relevant candidates</h3>

            <p>
              Use the candidate information and matching tools
              available on your selected plan.
            </p>
          </article>

          <article className="benefit-card">
            <div className="benefit-icon">04</div>

            <h3>Build your employer presence</h3>

            <p>
              Introduce your organisation to graduates through
              your company profile and opportunities.
            </p>
          </article>
        </div>
      </section>

      <section className="pricing-section" id="plans">
        <div className="pricing-heading">
          <span className="section-kicker">SIMPLE, TRANSPARENT PRICING</span>

          <h2>
            Choose your next
            <br />
            <span>growth opportunity.</span>
          </h2>

          <p>
            The right tools to help your company discover and recruit
            emerging talent. Choose the option that works for you.
          </p>
        </div>

        {isActive && (
          <div className="active-banner">
            <div className="active-indicator" />

            <div>
              <strong>Your company has an active subscription</strong>

              <p>
                You can review the available plans below.
                Check your existing subscription before requesting a change.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/company-dashboard")}
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
          <div className="billing-copy">
            <strong>Choose your billing option</strong>

            <span>
              Save the equivalent of two months with annual billing.
            </span>
          </div>

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
                }`}
              >
                {plan.popular && (
                  <div className="popular-label">
                    MOST POPULAR
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

                  {plan.key !== "listing" && billing === "annual" && (
                    <div className="saving-note">
                      ✓ Annual savings included
                    </div>
                  )}
                </div>

                <div className="listing-limit">
                  <span className="limit-icon">✓</span>

                  <span>{plan.listings}</span>
                </div>

                <div className="features-heading">
                  What's included
                </div>

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
                    plan.popular ? "plan-button-primary" : ""
                  }`}
                  disabled={processingPlan !== null}
                  onClick={() => choosePlan(plan)}
                >
                  {processingPlan === plan.key
                    ? "Preparing your request..."
                    : plan.key === "listing"
                    ? "Choose this listing"
                    : isActive
                    ? "Request this plan"
                    : "Get started"}
                  <span>→</span>
                </button>

                <p className="plan-footnote">
                  Bank transfer · Payment verification required
                </p>
              </article>
            );
          })}
        </div>

        <p className="pricing-disclaimer">
          All prices are in South African rand (ZAR).
          Annual subscriptions are payable upfront.
          Pay-per-listing is a once-off payment.
        </p>
      </section>

      <section className="payment-section">
        <div className="payment-icon">↗</div>

        <div className="payment-content">
          <span className="section-kicker">STRAIGHTFORWARD PAYMENTS</span>

          <h2>Clear pricing. Verified payments.</h2>

          <p>
            Select your plan, follow the payment instructions and
            submit your proof of payment. Your subscription will
            remain pending until GradLink SA verifies receipt of
            the payment.
          </p>
        </div>

        <div className="payment-steps">
          <div>
            <span>01</span>
            <strong>Select a plan</strong>
          </div>

          <div>
            <span>02</span>
            <strong>Make payment</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Verification</strong>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-heading">
          <span className="section-kicker">NEED TO KNOW MORE?</span>

          <h2>Frequently asked questions</h2>

          <p>
            Important information to help your company choose a plan.
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
                  setOpenFaq(openFaq === index ? -1 : index)
                }
              >
                <span>{faq.question}</span>

                <span className="faq-toggle">
                  {openFaq === index ? "−" : "+"}
                </span>
              </button>

              {openFaq === index && (
                <p className="faq-answer">{faq.answer}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span>

          <h2>
            Find the people who
            <br />
            will shape your future.
          </h2>

          <p>
            Start connecting your organisation with South Africa's
            next generation of professionals.
          </p>
        </div>

        <a href="#plans" className="closing-button">
          Explore plans <span>→</span>
        </a>
      </section>

      <footer className="footer">
        <a href="/" className="footer-brand">
          <span className="footer-mark">G</span>
          <strong>GradLink SA</strong>
        </a>

        <p>
          Connecting South African graduates with opportunity.
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/internships">Internships</a>
          <a href="/contact">Contact</a>
        </div>

        <small>
          © {new Date().getFullYear()} GradLink SA. All rights reserved.
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
          -webkit-tap-highlight-color: transparent;
        }

        a {
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid #e9eef7;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .header-inner {
          width: min(1160px, calc(100% - 40px));
          min-height: 76px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #10213d;
        }

        .brand-mark,
        .footer-mark {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2);
          color: white;
          font-size: 21px;
          font-weight: 900;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-text strong {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.3px;
        }

        .brand-text small {
          color: #728098;
          font-size: 10px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .nav-plans {
          color: #475569;
          font-size: 12px;
          font-weight: 800;
        }

        .nav-plans:hover {
          color: #2563eb;
        }

        .header-button {
          min-height: 42px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 10px;
          background: #1d4ed8;
          color: white;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .header-button:hover,
        .primary-button:hover,
        .plan-button:hover:not(:disabled),
        .closing-button:hover {
          background: #163ca8;
        }

        .hero {
          width: min(1160px, calc(100% - 40px));
          min-height: 520px;
          margin: auto;
          padding: 65px 0 68px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 44px;
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .eyebrow,
        .section-kicker {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #2457c5;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.13em;
          line-height: 1.7;
        }

        .eyebrow {
          padding: 9px 12px;
          border: 1px solid #d9e7ff;
          border-radius: 7px;
          background: #f2f7ff;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #3478ef;
        }

        .hero h1 {
          margin: 25px 0 0;
          color: #10213d;
          font-size: clamp(40px, 5vw, 62px);
          font-weight: 900;
          line-height: 1.07;
          letter-spacing: -2.8px;
        }

        .hero h1 span,
        .section-heading h2 span,
        .pricing-heading h2 span {
          color: #2864dd;
        }

        .hero-text {
          max-width: 475px;
          margin: 22px 0 0;
          color: #607089;
          font-size: 14px;
          line-height: 1.95;
        }

        .hero-actions {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .primary-button,
        .secondary-button,
        .closing-button {
          min-height: 48px;
          padding: 0 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 900;
          transition: background 0.2s ease;
        }

        .primary-button,
        .closing-button {
          background: #2563eb;
          color: white;
        }

        .secondary-button {
          border: 1px solid #dce5f1;
          background: white;
          color: #263a59;
        }

        .secondary-button:hover {
          border-color: #9dbdf7;
          background: #f5f8ff;
        }

        .hero-note {
          margin-top: 23px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
        }

        .note-check {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #e5f8ed;
          color: #16834c;
          font-size: 11px;
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
            #dce9ff 0%,
            #eff5ff 53%,
            transparent 72%
          );
        }

        .visual-card {
          width: min(350px, 88%);
          position: relative;
          padding: 25px;
          border: 1px solid #e3eaf5;
          border-radius: 22px;
          background: white;
          box-shadow: 0 24px 65px rgba(30, 64, 125, 0.12);
        }

        .visual-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .visual-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .visual-top > div:nth-child(2) {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 5px;
        }

        .visual-top strong {
          font-size: 13px;
        }

        .visual-top div span {
          color: #7b879b;
          font-size: 10px;
        }

        .visual-status {
          color: #22a565;
          font-size: 11px;
        }

        .visual-divider {
          height: 1px;
          margin: 21px 0;
          background: #edf1f7;
        }

        .visual-label {
          margin: 0;
          color: #5373a8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .visual-card h3 {
          margin: 12px 0 17px;
          color: #122647;
          font-size: 29px;
          line-height: 1.2;
          letter-spacing: -0.9px;
        }

        .visual-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .visual-tags span {
          padding: 8px 10px;
          border: 1px solid #dce8fc;
          border-radius: 7px;
          background: #f2f7ff;
          color: #2858b4;
          font-size: 10px;
          font-weight: 800;
        }

        .visual-bottom {
          margin-top: 23px;
          padding-top: 17px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #edf1f7;
        }

        .avatar-stack {
          display: flex;
          padding-left: 3px;
        }

        .avatar-stack span {
          width: 27px;
          height: 27px;
          margin-left: -3px;
          display: grid;
          place-items: center;
          border: 2px solid white;
          border-radius: 50%;
          background: #e1eaff;
          color: #2455b3;
          font-size: 9px;
          font-weight: 900;
        }

        .avatar-stack span:nth-child(2) {
          background: #e2f5ee;
          color: #19734c;
        }

        .avatar-stack span:nth-child(3) {
          background: #fff0dc;
          color: #a65b13;
        }

        .visual-bottom > span {
          color: #65748c;
          font-size: 10px;
          line-height: 1.5;
        }

        .floating-card {
          position: absolute;
          z-index: 2;
          max-width: 225px;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e4ebf5;
          border-radius: 13px;
          background: white;
          box-shadow: 0 12px 35px rgba(30, 64, 125, 0.1);
        }

        .floating-top {
          top: 27px;
          right: -5px;
        }

        .floating-bottom {
          bottom: 23px;
          left: -10px;
        }

        .floating-icon,
        .floating-check {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf4ff;
          color: #2563eb;
          font-size: 17px;
        }

        .floating-check {
          background: #e6f8ed;
          color: #15803d;
        }

        .floating-card > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .floating-card strong {
          color: #183052;
          font-size: 10px;
        }

        .floating-card small {
          color: #7b879b;
          font-size: 9px;
          line-height: 1.5;
        }

        .benefits {
          padding: 78px 20px 82px;
          background: #f7f9fd;
          border-top: 1px solid #edf1f7;
          border-bottom: 1px solid #edf1f7;
        }

        .section-heading,
        .pricing-heading,
        .faq-heading {
          max-width: 650px;
          margin: 0 auto;
          text-align: center;
        }

        .section-heading h2,
        .pricing-heading h2 {
          margin: 15px 0 0;
          color: #10213d;
          font-size: clamp(30px, 4vw, 43px);
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: -1.4px;
        }

        .section-heading > p,
        .pricing-heading > p,
        .faq-heading > p {
          max-width: 570px;
          margin: 15px auto 0;
          color: #687890;
          font-size: 13px;
          line-height: 1.9;
        }

        .benefit-grid {
          width: min(1100px, 100%);
          margin: 39px auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .benefit-card {
          min-width: 0;
          padding: 23px 20px;
          border: 1px solid #e5ebf4;
          border-radius: 15px;
          background: white;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .benefit-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(24, 50, 90, 0.06);
        }

        .benefit-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #edf4ff;
          color: #2563eb;
          font-size: 13px;
          font-weight: 900;
        }

        .benefit-card h3 {
          margin: 19px 0 10px;
          color: #152a49;
          font-size: 14px;
          line-height: 1.5;
        }

        .benefit-card p {
          margin: 0;
          color: #718096;
          font-size: 12px;
          line-height: 1.9;
        }

        .pricing-section {
          padding: 84px 20px 76px;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              rgba(37, 99, 235, 0.07),
              transparent 50%
            ),
            white;
          scroll-margin-top: 90px;
        }

        .pricing-heading h2 {
          font-size: clamp(32px, 4vw, 45px);
        }

        .active-banner {
          width: min(1050px, 100%);
          margin: 30px auto 0;
          padding: 17px 19px;
          display: flex;
          align-items: center;
          gap: 13px;
          border: 1px solid #bfdbfe;
          border-radius: 13px;
          background: #eff6ff;
        }

        .active-indicator {
          width: 10px;
          height: 10px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #16a34a;
        }

        .active-banner > div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .active-banner strong {
          font-size: 12px;
        }

        .active-banner p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.7;
        }

        .active-banner button {
          min-height: 39px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .error-message {
          width: min(1050px, 100%);
          margin: 22px auto 0;
          padding: 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .billing-panel {
          width: min(1050px, 100%);
          margin: 35px auto 24px;
          padding: 15px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border: 1px solid #e4eaf4;
          border-radius: 13px;
          background: #f9fbff;
        }

        .billing-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .billing-copy strong {
          color: #193152;
          font-size: 12px;
        }

        .billing-copy span {
          color: #748198;
          font-size: 10px;
          line-height: 1.6;
        }

        .billing-toggle {
          padding: 4px;
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          border: 1px solid #e0e7f1;
          border-radius: 10px;
          background: #edf1f8;
        }

        .billing-toggle button {
          min-height: 39px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #607089;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
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
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 17px;
        }

        .plan-card {
          min-width: 0;
          position: relative;
          padding: 26px 22px 20px;
          display: flex;
          flex-direction: column;
          border: 1px solid #e0e7f1;
          border-radius: 17px;
          background: white;
          box-shadow: 0 8px 30px rgba(24, 50, 90, 0.045);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 17px 38px rgba(24, 50, 90, 0.09);
        }

        .plan-card.popular {
          border: 2px solid #3979ed;
          box-shadow: 0 15px 40px rgba(37, 99, 235, 0.12);
        }

        .popular-label {
          position: absolute;
          top: -1px;
          right: 17px;
          padding: 8px 10px;
          border-radius: 0 0 8px 8px;
          background: #2563eb;
          color: white;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .plan-label {
          display: inline-block;
          color: #4771b9;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .plan-top h3 {
          margin: 14px 0 10px;
          color: #152944;
          font-size: 23px;
          line-height: 1.25;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .plan-description {
          min-height: 82px;
          margin: 0;
          color: #718096;
          font-size: 12px;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }

        .price-block {
          min-height: 109px;
          margin-top: 20px;
          padding: 18px 0;
          border-top: 1px solid #edf1f7;
          border-bottom: 1px solid #edf1f7;
        }

        .price-line {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .currency {
          color: #172b49;
          font-size: 17px;
          font-weight: 800;
        }

        .price {
          color: #10213d;
          font-size: clamp(29px, 3vw, 36px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -1.2px;
          overflow-wrap: anywhere;
        }

        .price-period {
          display: block;
          margin-top: 5px;
          color: #7a879a;
          font-size: 10px;
        }

        .saving-note {
          margin-top: 9px;
          color: #16834c;
          font-size: 9px;
          font-weight: 800;
        }

        .listing-limit {
          min-height: 44px;
          margin-top: 18px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #dce8ff;
          border-radius: 9px;
          background: #f3f7ff;
          color: #264f9d;
          font-size: 11px;
          line-height: 1.6;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .limit-icon {
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #dce8ff;
          color: #2458c2;
          font-size: 10px;
        }

        .features-heading {
          margin: 23px 0 15px;
          color: #203653;
          font-size: 11px;
          font-weight: 900;
        }

        .features {
          margin: 0 0 25px;
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
          color: #596a82;
          font-size: 11px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .feature-check {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #e5f7ed;
          color: #16834c;
          font-size: 10px;
          font-weight: 900;
        }

        .plan-button {
          width: 100%;
          min-height: 46px;
          margin-top: auto;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid #d9e4f4;
          border-radius: 9px;
          background: #f5f8fe;
          color: #214b99;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .plan-button-primary {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .plan-button-primary:hover:not(:disabled) {
          background: #163ca8;
        }

        .plan-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .plan-footnote {
          margin: 12px 0 0;
          color: #8994a5;
          font-size: 9px;
          line-height: 1.7;
          text-align: center;
        }

        .pricing-disclaimer {
          max-width: 850px;
          margin: 22px auto 0;
          color: #8490a2;
          font-size: 10px;
          line-height: 1.9;
          text-align: center;
        }

        .payment-section {
          width: min(1050px, calc(100% - 40px));
          margin: 0 auto 80px;
          padding: 29px;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: start;
          gap: 17px;
          border: 1px solid #e0e8f5;
          border-radius: 17px;
          background: linear-gradient(135deg, #f7faff, #ffffff);
        }

        .payment-icon {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #e6efff;
          color: #2563eb;
          font-size: 23px;
          font-weight: 800;
        }

        .payment-content h2 {
          margin: 10px 0;
          color: #183052;
          font-size: 21px;
          line-height: 1.35;
          letter-spacing: -0.5px;
        }

        .payment-content p {
          max-width: 650px;
          margin: 0;
          color: #697990;
          font-size: 12px;
          line-height: 1.9;
        }

        .payment-steps {
          grid-column: 2;
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .payment-steps > div {
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #e6ecf5;
          border-radius: 10px;
          background: white;
        }

        .payment-steps span {
          color: #3571df;
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
          padding-bottom: 85px;
        }

        .faq-heading {
          margin-bottom: 30px;
        }

        .faq-heading h2 {
          margin: 13px 0 0;
          color: #10213d;
          font-size: clamp(25px, 4vw, 34px);
          line-height: 1.3;
          letter-spacing: -0.9px;
        }

        .faq-list {
          border-top: 1px solid #e6ebf3;
        }

        .faq-item {
          border-bottom: 1px solid #e6ebf3;
        }

        .faq-question {
          width: 100%;
          min-height: 64px;
          padding: 15px 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border: 0;
          background: transparent;
          color: #243956;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.7;
          text-align: left;
          cursor: pointer;
        }

        .faq-toggle {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #eff5ff;
          color: #2563eb;
          font-size: 18px;
        }

        .faq-answer {
          margin: -2px 35px 19px 2px;
          color: #687991;
          font-size: 12px;
          line-height: 1.9;
        }

        .closing-cta {
          width: min(1050px, calc(100% - 40px));
          margin: 0 auto 75px;
          padding: 37px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-radius: 19px;
          background:
            radial-gradient(
              circle at 90% 10%,
              rgba(125, 170, 255, 0.22),
              transparent 35%
            ),
            #112c56;
          color: white;
        }

        .closing-cta .section-kicker {
          color: #b6d1ff;
        }

        .closing-cta h2 {
          margin: 13px 0 0;
          font-size: clamp(25px, 3vw, 35px);
          line-height: 1.25;
          letter-spacing: -0.9px;
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
          padding: 27px 20px 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          border-top: 1px solid #e8edf5;
          text-align: center;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #1c3150;
          font-size: 13px;
        }

        .footer-mark {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          font-size: 15px;
        }

        .footer > p {
          margin: 0;
          color: #7b879a;
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
          color: #53657e;
          font-size: 10px;
          font-weight: 700;
        }

        .footer-links a:hover {
          color: #2563eb;
        }

        .footer > small {
          color: #929bad;
          font-size: 9px;
          line-height: 1.7;
        }

        @media (min-width: 1400px) {
          .hero {
            padding-top: 80px;
            padding-bottom: 80px;
          }
        }

        @media (max-width: 900px) {
          .hero {
            min-height: auto;
            gap: 20px;
          }

          .hero h1 {
            font-size: 46px;
          }

          .hero-visual {
            min-height: 350px;
          }

          .visual-card {
            padding: 20px;
          }

          .floating-top {
            right: -2px;
          }

          .floating-bottom {
            left: -2px;
          }

          .benefit-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .plans-grid {
            gap: 12px;
          }

          .plan-card {
            padding: 22px 15px 17px;
          }

          .plan-top h3 {
            font-size: 21px;
          }

          .price {
            font-size: 30px;
          }

          .plan-description {
            min-height: 105px;
          }
        }

        @media (max-width: 650px) {
          .header-inner {
            width: calc(100% - 26px);
            min-height: 66px;
            gap: 10px;
          }

          .brand {
            gap: 8px;
          }

          .brand-mark {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            font-size: 18px;
          }

          .brand-text strong {
            font-size: 13px;
          }

          .brand-text small {
            max-width: 155px;
            font-size: 8px;
            line-height: 1.5;
          }

          .header-actions {
            gap: 10px;
          }

          .nav-plans {
            display: none;
          }

          .header-button {
            min-height: 37px;
            padding: 0 10px;
            font-size: 9px;
            white-space: nowrap;
          }

          .hero {
            width: calc(100% - 30px);
            padding: 43px 0 44px;
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .eyebrow {
            font-size: 8px;
            letter-spacing: 0.08em;
          }

          .hero h1 {
            margin-top: 21px;
            font-size: clamp(37px, 9vw, 48px);
            line-height: 1.1;
            letter-spacing: -1.8px;
          }

          .hero-text {
            margin-top: 16px;
            font-size: 12px;
            line-height: 1.9;
          }

          .hero-actions {
            margin-top: 22px;
            align-items: stretch;
            flex-direction: column;
            gap: 10px;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
            min-height: 46px;
          }

          .hero-note {
            align-items: flex-start;
            font-size: 10px;
          }

          .hero-visual {
            width: 100%;
            min-height: 355px;
            margin-top: 4px;
          }

          .visual-glow {
            width: 280px;
            height: 280px;
          }

          .visual-card {
            width: min(320px, 88%);
            padding: 19px;
          }

          .visual-card h3 {
            font-size: 26px;
          }

          .floating-card {
            max-width: 190px;
            padding: 10px;
            gap: 8px;
          }

          .floating-top {
            top: 7px;
            right: 0;
          }

          .floating-bottom {
            bottom: 5px;
            left: 0;
          }

          .floating-icon,
          .floating-check {
            width: 29px;
            height: 29px;
          }

          .floating-card strong {
            font-size: 9px;
          }

          .floating-card small {
            font-size: 8px;
          }

          .benefits {
            padding: 55px 15px 58px;
          }

          .section-heading h2,
          .pricing-heading h2 {
            font-size: 32px;
            letter-spacing: -1px;
          }

          .section-heading > p,
          .pricing-heading > p,
          .faq-heading > p {
            font-size: 12px;
            line-height: 1.85;
          }

          .benefit-grid {
            margin-top: 27px;
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .benefit-card {
            padding: 20px;
          }

          .benefit-card h3 {
            margin-top: 14px;
          }

          .pricing-section {
            padding: 59px 15px 55px;
          }

          .active-banner {
            align-items: stretch;
            flex-wrap: wrap;
            padding: 15px;
          }

          .active-banner > div:nth-child(2) {
            flex-basis: calc(100% - 25px);
          }

          .active-banner button {
            width: 100%;
            min-height: 41px;
          }

          .billing-panel {
            margin-top: 26px;
            padding: 15px;
            align-items: stretch;
            flex-direction: column;
            gap: 13px;
          }

          .billing-copy strong {
            font-size: 12px;
          }

          .billing-toggle {
            width: 100%;
          }

          .billing-toggle button {
            flex: 1;
            min-width: 0;
            padding: 0 9px;
            font-size: 10px;
          }

          .save-badge {
            font-size: 7px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
            gap: 17px;
          }

          .plan-card {
            padding: 23px 20px 19px;
            border-radius: 15px;
          }

          .plan-card.popular {
            border-width: 2px;
          }

          .plan-top h3 {
            margin-top: 12px;
            font-size: 24px;
          }

          .plan-description {
            min-height: auto;
            font-size: 12px;
            line-height: 1.85;
          }

          .price-block {
            min-height: 102px;
            margin-top: 19px;
            padding: 17px 0;
          }

          .price {
            font-size: 35px;
          }

          .features {
            gap: 12px;
          }

          .features li {
            font-size: 12px;
          }

          .plan-button {
            min-height: 49px;
            font-size: 12px;
          }

          .plan-footnote {
            font-size: 9px;
          }

          .pricing-disclaimer {
            font-size: 10px;
            line-height: 1.9;
          }

          .payment-section {
            width: calc(100% - 30px);
            margin-bottom: 57px;
            padding: 20px;
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .payment-icon {
            width: 42px;
            height: 42px;
          }

          .payment-content h2 {
            font-size: 20px;
          }

          .payment-content p {
            font-size: 11px;
          }

          .payment-steps {
            grid-column: 1;
            grid-template-columns: 1fr;
            gap: 8px;
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
            padding-bottom: 55px;
          }

          .faq-heading {
            margin-bottom: 22px;
          }

          .faq-heading h2 {
            font-size: 27px;
          }

          .faq-question {
            min-height: 60px;
            font-size: 11px;
          }

          .faq-answer {
            margin-right: 8px;
            font-size: 11px;
          }

          .closing-cta {
            width: calc(100% - 30px);
            margin-bottom: 50px;
            padding: 25px 20px;
            align-items: stretch;
            flex-direction: column;
            gap: 22px;
          }

          .closing-cta h2 {
            font-size: 29px;
          }

          .closing-cta p {
            font-size: 11px;
          }

          .closing-button {
            width: 100%;
            min-height: 47px;
          }

          .footer {
            padding: 25px 15px;
          }
        }

        @media (max-width: 370px) {
          .brand-text small {
            max-width: 125px;
          }

          .hero h1 {
            font-size: 35px;
          }

          .eyebrow {
            font-size: 7px;
          }

          .floating-card {
            max-width: 175px;
          }

          .save-badge {
            display: none;
          }

          .billing-toggle button {
            padding: 0 7px;
          }

          .plan-card {
            padding: 20px 16px 17px;
          }

          .price {
            font-size: 32px;
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