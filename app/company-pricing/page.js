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
      "Get started with the essential tools to connect your company with emerging talent.",
    monthly: 500,
    annual: 5000,
    listings: "5 active internship listings",
    features: [
      "Up to 5 active internship listings",
      "Graduate applications",
      "Applicant management",
      "Candidate profiles",
      "CV access",
      "Essential recruitment tools",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    label: "FOR GROWING TEAMS",
    description:
      "A powerful recruitment solution for businesses ready to grow their talent pipeline.",
    monthly: 1000,
    annual: 10000,
    listings: "15 active internship listings",
    popular: true,
    features: [
      "Up to 15 active internship listings",
      "Everything in Starter",
      "AI applicant matching",
      "Advanced applicant screening",
      "Candidate discovery tools",
      "Document access",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    label: "FOR LARGE TEAMS",
    description:
      "More room to advertise opportunities and manage a growing recruitment pipeline.",
    monthly: 1500,
    annual: 15000,
    listings: "30 active internship listings",
    features: [
      "Up to 30 active internship listings",
      "Everything in Professional",
      "Advanced candidate matching",
      "Applicant screening tools",
      "Candidate management",
      "Priority recruitment support",
    ],
  },
  {
    key: "listing",
    name: "Pay Per Listing",
    label: "FOR ONE OPPORTUNITY",
    description:
      "Advertise one opportunity with a once-off payment and no monthly subscription.",
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
      "Choose a plan, follow the bank-transfer instructions and submit your payment reference and proof of payment. Your subscription remains pending until GradLink SA verifies your payment.",
  },
  {
    question: "Can I pay annually?",
    answer:
      "Yes. Starter, Professional and Enterprise offer annual billing. Pay upfront and save the equivalent of two months compared with paying monthly for twelve months.",
  },
  {
    question: "When will my company account be activated?",
    answer:
      "Your company subscription must be verified before paid access is activated. Selecting a plan or submitting payment details does not automatically activate your subscription.",
  },
  {
    question: "Can I advertise just one opportunity?",
    answer:
      "Yes. Choose Pay Per Listing for a once-off payment of R350 for one listing for 30 days.",
  },
  {
    question: "Is there a free company plan?",
    answer:
      "No. Company recruitment plans are paid. People looking for opportunities can use GradLink SA without purchasing a company subscription.",
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
            "We could not load your account details. You can still view the plans. Please refresh if necessary."
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
        )}&amount=${encodeURIComponent(amount)}`
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
            background: #f5f8ff;
            color: #10213d;
            font-family: Arial, Helvetica, sans-serif;
            text-align: center;
          }

          .loading-mark {
            width: 58px;
            height: 58px;
            display: grid;
            place-items: center;
            border-radius: 17px;
            background: linear-gradient(135deg, #3984ff, #1747b8);
            color: white;
            font-size: 27px;
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
            <a href="#plans" className="nav-link">
              View plans
            </a>

            {user ? (
              <button
                type="button"
                className="header-button"
                onClick={() => router.push("/company-dashboard")}
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
  <div className="hero-content">
    <div className="eyebrow">
      <span className="eyebrow-dot" />
      THE FUTURE OF RECRUITMENT
    </div>

    <h1>
      Great talent.
      <br />
      <span>Greater possibilities.</span>
    </h1>

    <p className="hero-text">
      Discover emerging South African talent, advertise
      internship opportunities and build your future workforce
      with GradLink SA.
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
      <span>✓</span>
      Paid recruitment plans for your business
    </div>
  </div>

  <div className="hero-visual" aria-hidden="true">
    <div className="visual-card">
      <div className="visual-brand">
        <span className="visual-mark">G</span>

        <div>
          <strong>GradLink SA</strong>
          <small>Talent connection platform</small>
        </div>
      </div>

      <div className="visual-divider" />

      <span className="visual-label">
        YOUR NEXT OPPORTUNITY
      </span>

      <h2>
        Talent meets
        <br />
        opportunity.
      </h2>

      <div className="visual-tags">
        <span>Internships</span>
        <span>Emerging talent</span>
      </div>

      <div className="visual-bottom">
        <span className="visual-check">✓</span>
        <span>Build your talent pipeline</span>
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
            Connect your organisation with people ready to take
            their next career step.
          </p>
        </div>

        <div className="benefit-grid">
          <article className="benefit-card">
            <span className="benefit-number">01</span>
            <h3>Reach emerging talent</h3>
            <p>
              Advertise opportunities and reach people entering
              the professional world.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">02</span>
            <h3>Manage applications</h3>
            <p>
              Review applications and organise your recruitment
              process in one place.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">03</span>
            <h3>Discover candidates</h3>
            <p>
              Use the candidate information and recruitment tools
              available with your plan.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">04</span>
            <h3>Grow your presence</h3>
            <p>
              Introduce your organisation through your company
              profile and advertised opportunities.
            </p>
          </article>
        </div>
      </section>

      <section className="pricing-section" id="plans">
        <div className="pricing-heading">
          <span className="section-kicker">
            SIMPLE, TRANSPARENT PRICING
          </span>

          <h2>
            Choose the right plan
            <br />
            <span>for your business.</span>
          </h2>

          <p>
            Compare our plans and choose the recruitment option
            that works for your organisation.
          </p>
        </div>

        {isActive && (
          <div className="active-banner">
            <span className="active-indicator" />

            <div className="active-copy">
              <strong>Your company has an active subscription</strong>
              <p>
                You can view the available plans below. Check your
                existing subscription before requesting a change.
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
              Annual subscriptions save the equivalent of two months.
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
                  <div className="popular-label">MOST POPULAR</div>
                )}

                <div className="plan-top">
                  <span className="plan-label">{plan.label}</span>
                  <h3>{plan.name}</h3>
                  <p className="plan-description">
                    {plan.description}
                  </p>
                </div>

                <div className="price-block">
                  <div className="price-line">
                    <span className="currency">R</span>
                    <span className="price">{formatPrice(price)}</span>
                  </div>

                  <span className="price-period">{period}</span>

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
          All prices are in South African rand (ZAR). Annual
          subscriptions are payable upfront. Pay Per Listing is a
          once-off payment for a 30-day listing period.
        </p>
      </section>

      <section className="payment-section">
        <div className="payment-icon">↗</div>

        <div className="payment-content">
          <span className="section-kicker">STRAIGHTFORWARD PAYMENTS</span>
          <h2>Clear pricing. Verified payments.</h2>

          <p>
            Choose your plan, follow the bank-transfer instructions
            and submit your proof of payment. Your subscription stays
            pending until GradLink SA verifies receipt of payment.
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
            <strong>Payment verification</strong>
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
          <span className="section-kicker">
            YOUR NEXT CHAPTER STARTS HERE
          </span>

          <h2>
            Find the people who
            <br />
            will shape your future.
          </h2>

          <p>
            Connect your organisation with South Africa's emerging
            talent through GradLink SA.
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

        <p>Connecting South African talent with opportunity.</p>

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
          cursor: pointer;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid #e5eaf3;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
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
          min-width: 0;
          color: #10213d;
        }

        .brand-mark,
        .footer-mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2);
          color: #ffffff;
          font-size: 22px;
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

        .nav-link {
          color: #475569;
          font-size: 12px;
          font-weight: 800;
        }

        .nav-link:hover {
          color: #2563eb;
        }

        .header-button {
          min-height: 43px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          background: #1d4ed8;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
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
          padding: 68px 0;
          display: grid;
          grid-template-columns: 1fr 0.9fr;
          align-items: center;
          gap: 50px;
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
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.11em;
          line-height: 1.7;
        }

        .eyebrow {
          padding: 9px 12px;
          border: 1px solid #d9e7ff;
          border-radius: 8px;
          background: #f2f7ff;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #3478ef;
        }

        .hero h1 {
          margin: 25px 0 0;
          color: #10213d;
          font-size: clamp(40px, 5vw, 62px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -2.5px;
        }

        .hero h1 span,
        .section-heading h2 span,
        .pricing-heading h2 span {
          color: #2864dd;
        }

        .hero-text {
          max-width: 480px;
          margin: 22px 0 0;
          color: #607089;
          font-size: 15px;
          line-height: 1.9;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-button,
        .secondary-button,
        .closing-button {
          min-height: 48px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          transition: background 0.2s ease;
        }

        .primary-button,
        .closing-button {
          background: #1d4ed8;
          color: #ffffff;
        }

        .secondary-button {
          border: 1px solid #dbe3ef;
          background: #ffffff;
          color: #253858;
        }

        .secondary-button:hover {
          background: #f4f7fc;
        }

        .hero-note {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 24px;
          color: #64748b;
          font-size: 12px;
        }

        .hero-note span {
          color: #16865b;
          font-weight: 900;
        }

        .hero-visual {
          position: relative;
          min-width: 0;
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 30px;
          background:
            radial-gradient(circle at 70% 20%, #dce9ff 0, transparent 45%),
            linear-gradient(145deg, #f3f7ff, #eaf1ff);
        }

        .visual-card {
          position: relative;
          z-index: 1;
          width: min(340px, calc(100% - 56px));
          padding: 26px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 23px;
          background: #ffffff;
          box-shadow: 0 24px 60px rgba(35, 66, 120, 0.15);
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
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #3984ff, #1747b8);
          color: #ffffff;
          font-size: 21px;
          font-weight: 900;
        }

        .visual-brand strong,
        .visual-brand small {
          display: block;
        }

        .visual-brand strong {
          font-size: 13px;
        }

        .visual-brand small {
          margin-top: 5px;
          color: #748198;
          font-size: 10px;
        }

        .visual-divider {
          height: 1px;
          margin: 22px 0;
          background: #edf1f7;
        }

        .visual-label {
          color: #2864dd;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .visual-card h2 {
          margin: 12px 0 18px;
          color: #10213d;
          font-size: 31px;
          line-height: 1.15;
          letter-spacing: -1px;
        }

        .visual-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .visual-tags span {
          padding: 8px 10px;
          border-radius: 7px;
          background: #eef4ff;
          color: #2457c5;
          font-size: 10px;
          font-weight: 800;
        }

        .visual-bottom {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding-top: 17px;
          border-top: 1px solid #edf1f7;
          color: #64748b;
          font-size: 10px;
        }

        .visual-check,
        .floating-check {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #e6f8ef;
          color: #16865b;
          font-weight: 900;
        }

        .floating-card {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 11px;
          max-width: calc(100% - 24px);
          padding: 13px 15px;
          border: 1px solid #e7edf7;
          border-radius: 13px;
          background: #ffffff;
          box-shadow: 0 12px 35px rgba(35, 66, 120, 0.12);
        }

        .floating-top {
          top: 23px;
          right: 12px;
        }

        .floating-bottom {
          bottom: 22px;
          left: 12px;
        }

        .floating-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #eef4ff;
          color: #2864dd;
        }

        .floating-card strong,
        .floating-card small {
          display: block;
        }

        .floating-card strong {
          color: #10213d;
          font-size: 11px;
        }

        .floating-card small {
          margin-top: 5px;
          color: #748198;
          font-size: 9px;
        }

        .benefits {
          padding: 76px 20px;
          background: #f7f9fd;
        }

        .section-heading,
        .pricing-heading,
        .faq-heading {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .section-heading h2,
        .pricing-heading h2 {
          margin: 16px 0 0;
          color: #10213d;
          font-size: clamp(30px, 4vw, 43px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -1.3px;
        }

        .section-heading > p,
        .pricing-heading > p,
        .faq-heading > p {
          max-width: 580px;
          margin: 16px auto 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.8;
        }

        .benefit-grid {
          width: min(1080px, 100%);
          margin: 40px auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }

        .benefit-card {
          min-width: 0;
          padding: 25px 21px;
          border: 1px solid #e6ebf4;
          border-radius: 15px;
          background: #ffffff;
        }

        .benefit-number {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf4ff;
          color: #2457c5;
          font-size: 12px;
          font-weight: 900;
        }

        .benefit-card h3 {
          margin: 21px 0 0;
          color: #10213d;
          font-size: 15px;
          line-height: 1.45;
        }

        .benefit-card p {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.8;
        }

        .pricing-section {
          width: min(1180px, calc(100% - 40px));
          margin: auto;
          padding: 86px 0 76px;
          scroll-margin-top: 90px;
        }

        .pricing-heading {
          margin-bottom: 35px;
        }

        .active-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0 0 22px;
          padding: 18px;
          border: 1px solid #bfe8d1;
          border-radius: 13px;
          background: #f0fbf5;
        }

        .active-indicator {
          width: 11px;
          height: 11px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #16865b;
        }

        .active-copy {
          flex: 1;
          min-width: 0;
        }

        .active-copy strong {
          color: #12633f;
          font-size: 13px;
        }

        .active-copy p {
          margin: 5px 0 0;
          color: #43745b;
          font-size: 12px;
          line-height: 1.6;
        }

        .active-banner button {
          min-height: 40px;
          padding: 0 12px;
          flex-shrink: 0;
          border: 1px solid #b8dfc9;
          border-radius: 8px;
          background: #ffffff;
          color: #12633f;
          font-size: 11px;
          font-weight: 800;
        }

        .error-message {
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fff1f2;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .billing-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
          padding: 20px;
          border: 1px solid #e5eaf3;
          border-radius: 14px;
          background: #f8faff;
        }

        .billing-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .billing-copy strong {
          color: #10213d;
          font-size: 13px;
        }

        .billing-copy span {
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
        }

        .billing-toggle {
          display: flex;
          flex-shrink: 0;
          gap: 5px;
          padding: 5px;
          border: 1px solid #e0e7f2;
          border-radius: 10px;
          background: #edf2f9;
        }

        .billing-toggle button {
          min-height: 38px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #52627a;
          font-size: 11px;
          font-weight: 800;
        }

        .billing-toggle button.selected {
          background: #ffffff;
          color: #1747b8;
          box-shadow: 0 2px 7px rgba(20, 45, 90, 0.1);
        }

        .save-badge {
          padding: 5px 6px;
          border-radius: 5px;
          background: #e4f8ed;
          color: #147548;
          font-size: 8px;
          font-weight: 900;
          white-space: nowrap;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
          gap: 17px;
        }

        .plan-card {
          position: relative;
          min-width: 0;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          padding: 25px 20px 20px;
          border: 1px solid #e0e7f1;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 7px 25px rgba(23, 46, 88, 0.045);
          overflow: hidden;
        }

        .plan-card.popular {
          border: 2px solid #2864dd;
          padding: 24px 19px 19px;
          box-shadow: 0 12px 35px rgba(37, 99, 235, 0.11);
        }

        .popular-label {
          margin: -24px -19px 20px;
          padding: 11px 8px;
          background: #1d4ed8;
          color: #ffffff;
          text-align: center;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .plan-top {
          min-width: 0;
        }

        .plan-label {
          display: inline-block;
          color: #2864dd;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.09em;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .plan-top h3 {
          margin: 12px 0 0;
          color: #10213d;
          font-size: 23px;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: -0.6px;
          overflow-wrap: anywhere;
        }

        .plan-description {
          min-height: 92px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .price-block {
          min-height: 112px;
          margin-top: 17px;
          padding: 17px 0;
          border-top: 1px solid #edf1f7;
          border-bottom: 1px solid #edf1f7;
        }

        .price-line {
          display: flex;
          align-items: baseline;
          gap: 4px;
          min-width: 0;
          white-space: nowrap;
        }

        .currency {
          color: #10213d;
          font-size: 19px;
          font-weight: 800;
        }

        .price {
          color: #10213d;
          font-size: clamp(27px, 2.5vw, 35px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -1.2px;
        }

        .price-period {
          display: block;
          margin-top: 6px;
          color: #64748b;
          font-size: 11px;
        }

        .saving-note {
          margin-top: 9px;
          color: #147548;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.5;
        }

        .listing-limit {
          min-height: 56px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 14px 0;
          color: #263b5b;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .limit-icon,
        .feature-check {
          flex-shrink: 0;
          color: #16865b;
          font-weight: 900;
        }

        .features-heading {
          margin-top: 12px;
          color: #10213d;
          font-size: 11px;
          font-weight: 900;
        }

        .features {
          flex: 1;
          margin: 15px 0 22px;
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
          color: #52627a;
          font-size: 11px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .feature-check {
          margin-top: 1px;
        }

        .plan-button {
          width: 100%;
          min-height: 47px;
          padding: 11px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border: 1px solid #d7e3f8;
          border-radius: 9px;
          background: #f0f5ff;
          color: #1747b8;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.5;
          text-align: left;
          overflow-wrap: anywhere;
        }

        .plan-button-primary {
          border-color: #1d4ed8;
          background: #1d4ed8;
          color: #ffffff;
        }

        .plan-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .plan-footnote {
          margin: 12px 0 0;
          color: #7b8799;
          font-size: 9px;
          line-height: 1.7;
          text-align: center;
        }

        .pricing-disclaimer {
          margin: 22px 0 0;
          color: #748198;
          font-size: 11px;
          line-height: 1.8;
          text-align: center;
        }

        .payment-section {
          width: min(1080px, calc(100% - 40px));
          margin: 0 auto 75px;
          padding: 30px;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: start;
          gap: 20px;
          border: 1px solid #dce7fb;
          border-radius: 18px;
          background: linear-gradient(135deg, #f3f7ff, #ffffff);
        }

        .payment-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #1d4ed8;
          color: #ffffff;
          font-size: 24px;
        }

        .payment-content h2 {
          margin: 10px 0 0;
          color: #10213d;
          font-size: 25px;
          line-height: 1.3;
        }

        .payment-content p {
          max-width: 650px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.9;
        }

        .payment-steps {
          grid-column: 2;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 8px;
        }

        .payment-steps div {
          min-width: 0;
          padding: 15px;
          border: 1px solid #e1e9f7;
          border-radius: 10px;
          background: #ffffff;
        }

        .payment-steps span,
        .payment-steps strong {
          display: block;
        }

        .payment-steps span {
          color: #2864dd;
          font-size: 10px;
          font-weight: 900;
        }

        .payment-steps strong {
          margin-top: 8px;
          color: #263b5b;
          font-size: 11px;
          line-height: 1.5;
        }

        .faq-section {
          width: min(850px, calc(100% - 40px));
          margin: 0 auto;
          padding: 0 0 80px;
        }

        .faq-heading {
          margin-bottom: 30px;
        }

        .faq-heading h2 {
          margin: 13px 0 0;
          color: #10213d;
          font-size: clamp(27px, 4vw, 36px);
          line-height: 1.3;
          letter-spacing: -0.8px;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .faq-item {
          border: 1px solid #e3e9f3;
          border-radius: 11px;
          background: #ffffff;
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          min-height: 58px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border: 0;
          background: #ffffff;
          color: #10213d;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.6;
          text-align: left;
        }

        .faq-toggle {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #edf4ff;
          color: #2457c5;
          font-size: 19px;
        }

        .faq-answer {
          margin: 0;
          padding: 0 18px 19px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.9;
          overflow-wrap: anywhere;
        }

        .closing-cta {
          width: min(1080px, calc(100% - 40px));
          margin: 0 auto 70px;
          padding: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-radius: 19px;
          background: linear-gradient(125deg, #102d66, #1d4ed8);
          color: #ffffff;
        }

        .closing-cta .section-kicker {
          color: #c7dcff;
        }

        .closing-cta h2 {
          margin: 13px 0 0;
          color: #ffffff;
          font-size: clamp(27px, 4vw, 38px);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .closing-cta p {
          max-width: 520px;
          margin: 13px 0 0;
          color: #d7e5ff;
          font-size: 12px;
          line-height: 1.8;
        }

        .closing-button {
          flex-shrink: 0;
          background: #ffffff;
          color: #1747b8;
        }

        .closing-button:hover {
          background: #eaf1ff;
        }

        .footer {
          padding: 35px 20px;
          border-top: 1px solid #e7edf5;
          background: #f8faff;
          text-align: center;
        }

        .footer-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #10213d;
        }

        .footer-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          font-size: 17px;
        }

        .footer-brand strong {
          font-size: 14px;
        }

        .footer > p {
          margin: 13px 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.7;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
        }

        .footer-links a {
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .footer-links a:hover {
          color: #2457c5;
        }

        .footer > small {
          color: #8490a3;
          font-size: 10px;
          line-height: 1.7;
        }

        @media (min-width: 1500px) {
          .plans-grid {
            gap: 20px;
          }

          .plan-card {
            padding-right: 23px;
            padding-left: 23px;
          }

          .plan-card.popular {
            padding-right: 22px;
            padding-left: 22px;
          }
        }

        @media (max-width: 1050px) {
          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }

          .plan-card,
          .plan-card.popular {
            padding: 25px;
          }

          .popular-label {
            margin: -25px -25px 20px;
          }

          .plan-description {
            min-height: 60px;
          }

          .price {
            font-size: 35px;
          }

          .benefit-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero {
            gap: 28px;
          }

          .hero h1 {
            font-size: clamp(38px, 5vw, 53px);
          }
        }

        @media (max-width: 700px) {
          .header-inner {
            width: calc(100% - 28px);
            min-height: 68px;
            gap: 10px;
          }

          .brand {
            gap: 8px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            font-size: 19px;
          }

          .brand-text strong {
            font-size: 14px;
          }

          .brand-text small {
            max-width: 155px;
            font-size: 9px;
            line-height: 1.4;
          }

          .header-actions {
            gap: 0;
          }

          .nav-link {
            display: none;
          }

          .header-button {
            min-height: 39px;
            padding: 0 11px;
            font-size: 10px;
          }

          .hero {
            width: calc(100% - 36px);
            min-height: auto;
            padding: 48px 0 55px;
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .eyebrow {
            font-size: 8px;
            letter-spacing: 0.07em;
          }

          .hero h1 {
            margin-top: 20px;
            font-size: clamp(37px, 10vw, 50px);
            letter-spacing: -1.8px;
          }

          .hero-text {
            font-size: 14px;
            line-height: 1.85;
          }

          .hero-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
            min-height: 48px;
          }

          .hero-visual {
            min-height: 350px;
          }

          .visual-card {
            width: min(320px, calc(100% - 40px));
            padding: 21px;
          }

          .visual-card h2 {
            font-size: 28px;
          }

          .floating-card {
            padding: 10px 11px;
          }

          .floating-top {
            top: 10px;
            right: 7px;
          }

          .floating-bottom {
            bottom: 10px;
            left: 7px;
          }

          .benefits {
            padding: 58px 18px;
          }

          .section-heading h2,
          .pricing-heading h2 {
            font-size: 31px;
            letter-spacing: -0.8px;
          }

          .section-heading > p,
          .pricing-heading > p,
          .faq-heading > p {
            font-size: 13px;
          }

          .benefit-grid {
            margin-top: 27px;
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .benefit-card {
            padding: 21px;
          }

          .benefit-card h3 {
            margin-top: 15px;
          }

          .pricing-section {
            width: calc(100% - 28px);
            padding: 60px 0;
          }

          .pricing-heading {
            margin-bottom: 25px;
          }

          .active-banner {
            align-items: flex-start;
            flex-wrap: wrap;
            padding: 15px;
          }

          .active-copy {
            flex: 1 1 calc(100% - 30px);
          }

          .active-banner button {
            width: 100%;
            min-height: 43px;
          }

          .billing-panel {
            align-items: stretch;
            flex-direction: column;
            gap: 15px;
            padding: 16px;
          }

          .billing-toggle {
            width: 100%;
          }

          .billing-toggle button {
            flex: 1;
            min-width: 0;
            padding: 0 7px;
            font-size: 10px;
          }

          .save-badge {
            font-size: 7px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .plan-card,
          .plan-card.popular {
            min-height: auto;
            padding: 24px 22px;
          }

          .popular-label {
            margin: -24px -22px 20px;
          }

          .plan-top h3 {
            font-size: 25px;
          }

          .plan-description {
            min-height: auto;
            font-size: 13px;
          }

          .price-block {
            min-height: auto;
            margin-top: 19px;
            padding: 18px 0;
          }

          .price {
            font-size: 37px;
          }

          .listing-limit {
            min-height: auto;
            padding: 17px 0;
            font-size: 12px;
          }

          .features-heading {
            margin-top: 8px;
            font-size: 12px;
          }

          .features {
            gap: 13px;
            margin: 15px 0 22px;
          }

          .features li {
            font-size: 12px;
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
            margin-bottom: 58px;
            padding: 22px 18px;
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .payment-icon {
            width: 43px;
            height: 43px;
          }

          .payment-content h2 {
            font-size: 23px;
          }

          .payment-content p {
            font-size: 12px;
          }

          .payment-steps {
            grid-column: 1;
            grid-template-columns: 1fr;
            gap: 9px;
            margin-top: 4px;
          }

          .payment-steps div {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
          }

          .payment-steps strong {
            margin-top: 0;
          }

          .faq-section {
            width: calc(100% - 32px);
            padding-bottom: 58px;
          }

          .faq-heading h2 {
            font-size: 28px;
          }

          .faq-question {
            padding: 15px 13px;
            font-size: 12px;
          }

          .faq-answer {
            padding: 0 13px 16px;
            font-size: 12px;
          }

          .closing-cta {
            width: calc(100% - 28px);
            margin-bottom: 48px;
            padding: 25px 20px;
            align-items: stretch;
            flex-direction: column;
            gap: 23px;
          }

          .closing-cta h2 {
            font-size: 30px;
          }

          .closing-button {
            width: 100%;
          }

          .footer {
            padding: 30px 18px;
          }
        }

        @media (max-width: 360px) {
          .brand-text small {
            max-width: 125px;
          }

          .header-button {
            padding: 0 8px;
            font-size: 9px;
          }

          .hero h1 {
            font-size: 35px;
          }

          .billing-toggle button {
            gap: 4px;
            padding: 0 5px;
          }

          .save-badge {
            padding: 4px;
            font-size: 6px;
          }

          .plan-card,
          .plan-card.popular {
            padding-right: 17px;
            padding-left: 17px;
          }

          .popular-label {
            margin-right: -17px;
            margin-left: -17px;
          }

          .price {
            font-size: 33px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
        
        /* HERO SECTION FIX */
.hero {
  display: grid !important;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr) !important;
  align-items: center !important;
  gap: 40px !important;
  padding: 64px 5% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.hero-content {
  position: relative !important;
  z-index: 2 !important;
  min-width: 0 !important;
}

.eyebrow {
  display: inline-flex !important;
  align-items: center !important;
  gap: 9px !important;
  margin-bottom: 22px !important;
  color: #155eef !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 1.5px !important;
  line-height: 1.6 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.eyebrow-dot {
  display: inline-block !important;
  flex: 0 0 8px !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #155eef !important;
}

.hero h1 {
  margin: 0 0 22px !important;
  color: #10213d !important;
  font-size: clamp(34px, 4.2vw, 56px) !important;
  font-weight: 800 !important;
  line-height: 1.12 !important;
  letter-spacing: -1.8px !important;
  overflow-wrap: break-word !important;
}

.hero h1 span {
  color: #155eef !important;
}

.hero-text {
  max-width: 520px !important;
  margin: 0 0 28px !important;
  color: #53627a !important;
  font-size: 16px !important;
  line-height: 1.8 !important;
  opacity: 1 !important;
}

.hero-actions {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 24px !important;
}

.hero-note {
  display: flex !important;
  align-items: center !important;
  gap: 9px !important;
  color: #35445d !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.hero-note > span {
  color: #12805c !important;
  font-weight: 900 !important;
}

.hero-visual {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  min-width: 0 !important;
  width: 100% !important;
  padding: 12px !important;
  box-sizing: border-box !important;
}

.visual-card {
  position: relative !important;
  width: 100% !important;
  max-width: 410px !important;
  min-width: 0 !important;
  padding: 30px !important;
  box-sizing: border-box !important;
  overflow-wrap: break-word !important;
  border: 1px solid #e0e9f8 !important;
  border-radius: 24px !important;
  background: #ffffff !important;
  box-shadow: 0 20px 55px rgba(22, 54, 105, 0.12) !important;
}

.visual-brand {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}

.visual-brand strong {
  display: block !important;
  color: #10213d !important;
  font-size: 16px !important;
}

.visual-brand small {
  display: block !important;
  margin-top: 4px !important;
  color: #687790 !important;
  font-size: 12px !important;
}

.visual-mark {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 44px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 13px !important;
  background: #155eef !important;
  color: #ffffff !important;
  font-size: 23px !important;
  font-weight: 800 !important;
}

.visual-divider {
  height: 1px !important;
  margin: 24px 0 !important;
  background: #e8edf5 !important;
}

.visual-label {
  display: block !important;
  margin-bottom: 12px !important;
  color: #155eef !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 1.4px !important;
  line-height: 1.6 !important;
}

.visual-card h2 {
  margin: 0 0 22px !important;
  color: #10213d !important;
  font-size: clamp(27px, 3vw, 38px) !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  letter-spacing: -0.8px !important;
}

.visual-tags {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin-bottom: 25px !important;
}

.visual-tags span {
  padding: 8px 12px !important;
  border-radius: 20px !important;
  background: #eef4ff !important;
  color: #1550b8 !important;
  font-size: 12px !important;
  font-weight: 700 !important;
}

.visual-bottom {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding-top: 18px !important;
  border-top: 1px solid #e8edf5 !important;
  color: #35445d !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.visual-check {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 25px !important;
  width: 25px !important;
  height: 25px !important;
  border-radius: 50% !important;
  background: #e7f8ef !important;
  color: #12805c !important;
  font-weight: 900 !important;
}

/* IPHONE AND SMALL SCREEN LAYOUT */
@media (max-width: 700px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 30px !important;
    padding: 42px 20px !important;
  }

  .hero-content {
    width: 100% !important;
  }

  .eyebrow {
    max-width: 100% !important;
    font-size: 10px !important;
    letter-spacing: 1.1px !important;
  }

  .hero h1 {
    font-size: clamp(34px, 9vw, 43px) !important;
    line-height: 1.15 !important;
    letter-spacing: -1.2px !important;
  }

  .hero-text {
    font-size: 15px !important;
    line-height: 1.75 !important;
  }

  .hero-actions {
    align-items: stretch !important;
    flex-direction: column !important;
    gap: 12px !important;
  }

  .hero-actions a {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    min-height: 48px !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  .hero-visual {
    padding: 0 !important;
    margin-top: 2px !important;
  }

  .visual-card {
    max-width: none !important;
    padding: 24px 20px !important;
    border-radius: 20px !important;
  }

  .visual-card h2 {
    font-size: 30px !important;
  }
}

   /* IMPROVE BLUE BUTTON AND HERO TEXT VISIBILITY */

.primary-button {
  background: #155eef !important;
  color: #ffffff !important;
  border: 2px solid #155eef !important;
  font-weight: 800 !important;
  opacity: 1 !important;
}

.primary-button span {
  color: #ffffff !important;
}

.secondary-button {
  background: #ffffff !important;
  color: #155eef !important;
  border: 2px solid #155eef !important;
  font-weight: 800 !important;
  opacity: 1 !important;
}

.eyebrow {
  color: #155eef !important;
  opacity: 1 !important;
}

.hero h1 {
  color: #10213d !important;
}

.hero h1 span {
  color: #155eef !important;
}

.hero-text {
  color: #35445d !important;
  opacity: 1 !important;
}

.hero-note {
  color: #35445d !important;
}

.visual-card {
  background: #ffffff !important;
}

.visual-brand strong,
.visual-card h2 {
  color: #10213d !important;
}

.visual-brand small,
.visual-bottom {
  color: #35445d !important;
}

.visual-label {
  color: #155eef !important;
}

.visual-tags span {
  background: #eaf1ff !important;
  color: #1247a8 !important;
}
      `}</style>
    </main>
  );
}