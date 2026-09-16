"use client";

import { useState } from "react";
import Link from "next/link";

export default function CompanyPricingPage() {
  const [billing, setBilling] = useState("monthly");

  const plans = [
    {
      name: "Starter",
      price: 500,
      description: "For businesses starting their graduate recruitment journey.",
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
      name: "Professional",
      price: 1000,
      description: "For companies actively recruiting South African graduates.",
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
      name: "Premium",
      price: 2000,
      description: "For companies wanting advanced AI-powered recruitment.",
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

  return (
    <main className="pricing-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/" className="logo">
          <span className="logo-icon">G</span>
          <span>GradLink <strong>SA</strong></span>
        </Link>

        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/internships">Internships</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/company">Company</Link>
        </div>

        <div className="nav-actions">
          <Link href="/login" className="login-btn">
            Log In
          </Link>

          <Link href="/signup" className="signup-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge">
          🚀 Built for South African businesses
        </div>

        <h1>
          Recruit better.
          <br />
          <span>Grow with GradLink SA.</span>
        </h1>

        <p>
          Access talented South African graduates, manage applications,
          and use AI-powered recruitment tools to find the right candidates.
        </p>

        <div className="billing-toggle">
          <button
            className={billing === "monthly" ? "active" : ""}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>

          <button
            className={billing === "annual" ? "active" : ""}
            onClick={() => setBilling("annual")}
          >
            Annual
            <span className="save">Save 15%</span>
          </button>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section">
        <div className="pricing-grid">
          {plans.map((plan) => {
            const monthlyPrice =
              billing === "annual"
                ? Math.round(plan.price * 0.85)
                : plan.price;

            return (
              <div
                key={plan.name}
                className={`pricing-card ${
                  plan.popular ? "popular" : ""
                }`}
              >
                {plan.popular && (
                  <div className="popular-label">
                    MOST POPULAR
                  </div>
                )}

                <div className="card-content">
                  <h2>{plan.name}</h2>

                  <p className="description">
                    {plan.description}
                  </p>

                  <div className="price">
                    <span className="currency">R</span>
                    {monthlyPrice.toLocaleString()}
                    <span className="period">/month</span>
                  </div>

                  {billing === "annual" && (
                    <p className="annual-note">
                      Billed annually
                    </p>
                  )}

                  <button
                    className={`plan-button ${
                      plan.popular ? "primary" : ""
                    }`}
                  >
                    Choose {plan.name}
                  </button>

                  <div className="divider"></div>

                  <p className="includes">
                    {plan.name === "Premium"
                      ? "Everything you need for advanced recruitment:"
                      : "What's included:"}
                  </p>

                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <span className="check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI VERIFICATION */}
      <section className="verification-section">
        <div className="verification-content">
          <div className="verification-badge">
            ✨ PREMIUM AI
          </div>

          <h2>
            Go beyond the CV.
          </h2>

          <p>
            Premium gives companies access to GradLink's
            AI-assisted document analysis tools.
          </p>

          <div className="verification-grid">
            <div className="verification-item">
              <span>📄</span>
              <div>
                <h3>Document Analysis</h3>
                <p>
                  Analyse submitted CVs and qualification documents.
                </p>
              </div>
            </div>

            <div className="verification-item">
              <span>🔎</span>
              <div>
                <h3>Consistency Checks</h3>
                <p>
                  Identify information that may be inconsistent
                  across submitted documents.
                </p>
              </div>
            </div>

            <div className="verification-item">
              <span>🤖</span>
              <div>
                <h3>AI Candidate Analysis</h3>
                <p>
                  Get additional insights when reviewing applicants.
                </p>
              </div>
            </div>

            <div className="verification-item">
              <span>📊</span>
              <div>
                <h3>Recruitment Insights</h3>
                <p>
                  Understand your applicant pipeline more easily.
                </p>
              </div>
            </div>
          </div>

          <p className="important-note">
            AI verification provides screening signals and does not
            guarantee that a document is authentic. Companies should
            perform appropriate final verification where required.
          </p>
        </div>
      </section>

      {/* GRADUATES */}
      <section className="graduate-section">
        <div className="graduate-box">
          <div className="graduate-icon">🎓</div>

          <h2>Graduates don't pay to apply.</h2>

          <p>
            GradLink SA keeps the core graduate experience free,
            helping talented South Africans discover opportunities
            without a subscription barrier.
          </p>

          <Link href="/signup" className="graduate-button">
            Join GradLink SA
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-grid">
          <div className="faq-card">
            <h3>Do companies have to pay?</h3>
            <p>
              Yes. Company recruitment accounts require a paid
              GradLink SA subscription.
            </p>
          </div>

          <div className="faq-card">
            <h3>Can graduates use GradLink for free?</h3>
            <p>
              Yes. Graduates can create profiles, discover
              opportunities and apply using the core platform
              without a subscription.
            </p>
          </div>

          <div className="faq-card">
            <h3>What is AI document verification?</h3>
            <p>
              It is an AI-assisted screening feature designed to
              analyse submitted documents and identify potential
              inconsistencies or verification signals.
            </p>
          </div>

          <div className="faq-card">
            <h3>Can I change my plan?</h3>
            <p>
              Yes. Companies will be able to upgrade or change
              their subscription as their recruitment needs change.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <h2>Ready to recruit your next graduate?</h2>

        <p>
          Join businesses using GradLink SA to connect with
          emerging South African talent.
        </p>

        <Link href="/signup" className="cta-button">
          Create Company Account →
        </Link>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <span className="logo-icon">G</span>
          <span>GradLink <strong>SA</strong></span>
        </div>

        <p>
          Connecting South African graduates with opportunity.
        </p>

        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/internships">Internships</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/company">Companies</Link>
        </div>

        <p className="copyright">
          © 2026 GradLink SA. All rights reserved.
        </p>
      </footer>

      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          background: #f7faff;
          color: #10233f;
        }

        .navbar {
          height: 76px;
          padding: 0 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border-bottom: 1px solid #e6edf6;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #10233f;
          font-size: 21px;
          font-weight: 700;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: linear-gradient(135deg, #1261d6, #0b8df5);
          color: white;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(18, 97, 214, 0.25);
        }

        .logo strong {
          color: #1261d6;
        }

        .nav-links {
          display: flex;
          gap: 28px;
        }

        .nav-links a {
          color: #53657d;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .nav-links a:hover {
          color: #1261d6;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-btn,
        .signup-btn {
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }

        .login-btn {
          color: #1261d6;
          padding: 11px 16px;
        }

        .signup-btn {
          color: white;
          background: #1261d6;
          padding: 12px 18px;
          border-radius: 10px;
          box-shadow: 0 7px 18px rgba(18, 97, 214, 0.2);
        }

        .hero {
          text-align: center;
          padding: 85px 20px 55px;
          background:
            radial-gradient(
              circle at top,
              rgba(18, 97, 214, 0.1),
              transparent 45%
            ),
            white;
        }

        .badge,
        .verification-badge {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eaf3ff;
          color: #1261d6;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .hero h1 {
          font-size: clamp(42px, 7vw, 70px);
          line-height: 1.04;
          margin: 22px auto;
          max-width: 850px;
          letter-spacing: -2px;
        }

        .hero h1 span {
          color: #1261d6;
        }

        .hero > p {
          max-width: 680px;
          margin: auto;
          color: #63738a;
          font-size: 18px;
          line-height: 1.7;
        }

        .billing-toggle {
          margin: 32px auto 0;
          background: #edf2f8;
          width: fit-content;
          padding: 5px;
          border-radius: 14px;
          display: flex;
          gap: 4px;
        }

        .billing-toggle button {
          border: 0;
          background: transparent;
          padding: 11px 18px;
          border-radius: 10px;
          font-weight: 700;
          color: #65758a;
          cursor: pointer;
        }

        .billing-toggle button.active {
          background: white;
          color: #1261d6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
        }

        .save {
          margin-left: 7px;
          font-size: 10px;
          color: #159447;
        }

        .pricing-section {
          padding: 25px 6% 90px;
        }

        .pricing-grid {
          max-width: 1180px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          align-items: stretch;
        }

        .pricing-card {
          background: white;
          border: 1px solid #e2e9f2;
          border-radius: 22px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 45px rgba(20, 55, 100, 0.06);
        }

        .pricing-card.popular {
          border: 2px solid #1261d6;
          transform: translateY(-10px);
          box-shadow: 0 25px 60px rgba(18, 97, 214, 0.16);
        }

        .popular-label {
          text-align: center;
          padding: 9px;
          background: #1261d6;
          color: white;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .card-content {
          padding: 32px;
        }

        .card-content h2 {
          margin: 0;
          font-size: 25px;
        }

        .description {
          color: #718096;
          line-height: 1.6;
          min-height: 52px;
          font-size: 14px;
        }

        .price {
          margin: 25px 0;
          font-size: 45px;
          font-weight: 850;
          letter-spacing: -2px;
        }

        .currency {
          font-size: 23px;
          vertical-align: top;
          margin-right: 3px;
        }

        .period {
          font-size: 14px;
          color: #7b899b;
          letter-spacing: 0;
          font-weight: 600;
        }

        .annual-note {
          margin-top: -20px;
          color: #159447;
          font-size: 12px;
          font-weight: 700;
        }

        .plan-button {
          width: 100%;
          border: 1px solid #cfd9e7;
          background: white;
          color: #1261d6;
          padding: 14px;
          border-radius: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .plan-button.primary {
          background: #1261d6;
          color: white;
          border-color: #1261d6;
        }

        .divider {
          height: 1px;
          background: #e9eef5;
          margin: 27px 0;
        }

        .includes {
          font-size: 13px;
          font-weight: 800;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 18px 0 0;
        }

        li {
          display: flex;
          gap: 9px;
          margin: 13px 0;
          color: #53657d;
          font-size: 13px;
          line-height: 1.5;
        }

        .check {
          color: #159447;
          font-weight: 900;
        }

        .verification-section {
          padding: 90px 6%;
          background: #0c1f38;
          color: white;
        }

        .verification-content {
          max-width: 1050px;
          margin: auto;
          text-align: center;
        }

        .verification-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #8dc4ff;
        }

        .verification-content h2 {
          font-size: clamp(36px, 6vw, 55px);
          margin: 20px 0 12px;
        }

        .verification-content > p {
          color: #b9c8da;
          max-width: 650px;
          margin: auto;
          line-height: 1.7;
        }

        .verification-grid {
          margin-top: 45px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          text-align: left;
        }

        .verification-item {
          display: flex;
          gap: 17px;
          padding: 25px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }

        .verification-item > span {
          font-size: 28px;
        }

        .verification-item h3 {
          margin: 0 0 7px;
        }

        .verification-item p {
          margin: 0;
          color: #b9c8da;
          font-size: 13px;
          line-height: 1.5;
        }

        .important-note {
          margin-top: 30px !important;
          font-size: 12px;
        }

        .graduate-section {
          padding: 80px 6%;
          background: #f7faff;
        }

        .graduate-box {
          max-width: 850px;
          margin: auto;
          text-align: center;
          background: white;
          padding: 55px 30px;
          border-radius: 24px;
          border: 1px solid #e1e9f3;
          box-shadow: 0 15px 50px rgba(20, 55, 100, 0.06);
        }

        .graduate-icon {
          font-size: 45px;
        }

        .graduate-box h2 {
          font-size: 34px;
          margin: 15px 0;
        }

        .graduate-box p {
          max-width: 650px;
          margin: auto auto 25px;
          color: #687990;
          line-height: 1.7;
        }

        .graduate-button,
        .cta-button {
          display: inline-block;
          text-decoration: none;
          background: #1261d6;
          color: white;
          padding: 14px 22px;
          border-radius: 11px;
          font-weight: 800;
        }

        .faq-section {
          padding: 80px 6%;
          background: white;
        }

        .faq-section > h2 {
          text-align: center;
          font-size: 38px;
          margin-bottom: 40px;
        }

        .faq-grid {
          max-width: 1000px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .faq-card {
          padding: 25px;
          background: #f7faff;
          border: 1px solid #e3eaf3;
          border-radius: 15px;
        }

        .faq-card h3 {
          margin-top: 0;
        }

        .faq-card p {
          color: #687990;
          line-height: 1.6;
          font-size: 14px;
        }

        .final-cta {
          text-align: center;
          padding: 90px 20px;
          background: linear-gradient(
            135deg,
            #1261d6,
            #087ed8
          );
          color: white;
        }

        .final-cta h2 {
          font-size: clamp(34px, 5vw, 50px);
          margin: 0 0 15px;
        }

        .final-cta p {
          color: #dceeff;
          margin-bottom: 28px;
        }

        .cta-button {
          background: white;
          color: #1261d6;
        }

        footer {
          padding: 45px 7%;
          background: #08172b;
          color: white;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          font-size: 20px;
          font-weight: 800;
        }

        footer > p {
          color: #9eb0c6;
          font-size: 13px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 22px;
          margin: 25px 0;
        }

        .footer-links a {
          color: #c4d1df;
          text-decoration: none;
          font-size: 13px;
        }

        .copyright {
          margin-top: 30px;
          font-size: 11px;
        }

        @media (max-width: 850px) {
          .nav-links {
            display: none;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 500px;
          }

          .pricing-card.popular {
            transform: none;
          }

          .verification-grid,
          .faq-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .navbar {
            padding: 0 18px;
          }

          .nav-actions .login-btn {
            display: none;
          }

          .hero {
            padding-top: 55px;
          }

          .hero h1 {
            font-size: 43px;
          }

          .hero > p {
            font-size: 15px;
          }

          .card-content {
            padding: 27px;
          }

          .pricing-section {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>
    </main>
  );
}
