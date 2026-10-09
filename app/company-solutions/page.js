"use client";

import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const solutions = [
  {
    number: "01",
    title: "Internship Recruitment",
    description:
      "Publish internship opportunities and connect your organisation with South African graduates looking to begin their careers.",
    features: [
      "Create internship listings",
      "Reach emerging talent",
      "Manage recruitment opportunities",
    ],
  },
  {
    number: "02",
    title: "AI Applicant Matching",
    description:
      "Identify candidates whose qualifications, fields of study and skills align with your recruitment requirements.",
    features: [
      "Qualification matching",
      "Skills-based comparisons",
      "Applicant suitability indicators",
    ],
  },
  {
    number: "03",
    title: "Graduate Applications",
    description:
      "Organise applications and review candidate information through your company recruitment workspace.",
    features: [
      "Review applications",
      "Shortlist candidates",
      "Access candidate documents",
    ],
  },
  {
    number: "04",
    title: "Professional Company Profile",
    description:
      "Present your organisation professionally and help graduates understand your business and career opportunities.",
    features: [
      "Company branding",
      "Organisation information",
      "Graduate recruitment details",
    ],
  },
];

export default function CompanySolutionsPage() {
  return (
    <div className="solutions-page">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="eyebrow">
              GRADLINK SA · EMPLOYER SOLUTIONS
            </div>

            <h1>
              Meet the next generation
              <br />
              of South African talent.
            </h1>

            <p className="hero-description">
              Discover how GradLink SA helps employers connect
              with graduates, manage internship recruitment and
              identify promising early-career talent.
            </p>

            <div className="hero-actions">
              <Link
                href="/company-pricing"
                className="primary-button"
              >
                Explore Employer Plans →
              </Link>

              <Link
                href="/internships"
                className="secondary-button"
              >
                Explore Opportunities
              </Link>
            </div>

            <div className="trust-line">
              Built to connect South African graduates with
              meaningful career opportunities.
            </div>
          </div>
        </section>

        <section className="solutions-section">
          <div className="section-heading">
            <span className="section-label">
              THE GRADLINK ADVANTAGE
            </span>

            <h2>
              Recruitment tools designed for growing teams.
            </h2>

            <p>
              Explore the tools available to employers on
              GradLink SA. Browse our solutions before deciding
              which subscription suits your recruitment needs.
            </p>
          </div>

          <div className="solutions-grid">
            {solutions.map((solution) => (
              <article
                className="solution-card"
                key={solution.number}
              >
                <div className="solution-number">
                  {solution.number}
                </div>

                <h3>{solution.title}</h3>

                <p className="solution-description">
                  {solution.description}
                </p>

                <ul>
                  {solution.features.map((feature) => (
                    <li key={feature}>
                      <span className="check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section">
          <div>
            <span className="section-label">
              GET STARTED
            </span>

            <h2>
              Find the right plan for your organisation.
            </h2>

            <p>
              Compare our paid employer subscriptions and
              choose the option that fits your hiring volume.
              Company access is activated following verified
              payment.
            </p>
          </div>

          <Link
            href="/company-pricing"
            className="process-button"
          >
            Compare Pricing Plans →
          </Link>
        </section>

        <section className="bottom-section">
          <h2>
            Ready to connect with emerging talent?
          </h2>

          <p>
            Explore GradLink SA's employer solutions and
            discover a better way to approach graduate
            recruitment.
          </p>

          <Link
            href="/company-pricing"
            className="primary-button"
          >
            View Employer Plans →
          </Link>
        </section>
      </main>

      <SiteFooter />

      <style jsx>{`
        .solutions-page {
          min-height: 100vh;
          background: #f5f8fd;
          color: #10233f;
        }

        .hero {
          background: linear-gradient(
            125deg,
            #062754 0%,
            #075fc1 60%,
            #1685e8 100%
          );
          color: white;
          padding: 85px 22px 78px;
        }

        .hero-inner {
          max-width: 1120px;
          margin: 0 auto;
        }

        .eyebrow {
          color: #bfdbfe;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 22px;
        }

        h1 {
          max-width: 850px;
          font-size: clamp(36px, 6vw, 62px);
          line-height: 1.08;
          letter-spacing: -2px;
          font-weight: 900;
          margin: 0;
        }

        .hero-description {
          max-width: 690px;
          margin: 23px 0 0;
          color: #e4efff;
          font-size: 16px;
          line-height: 1.9;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 30px;
        }

        .primary-button,
        .secondary-button,
        .process-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          min-height: 48px;
          padding: 13px 19px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
          transition: transform 0.2s ease;
        }

        .primary-button {
          background: white;
          color: #075fc1;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
        }

        .secondary-button {
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
          background: rgba(255, 255, 255, 0.08);
        }

        .primary-button:hover,
        .secondary-button:hover,
        .process-button:hover {
          transform: translateY(-2px);
        }

        .trust-line {
          margin-top: 25px;
          color: #dbeafe;
          font-size: 12px;
          line-height: 1.7;
        }

        .solutions-section {
          max-width: 1120px;
          margin: 0 auto;
          padding: 75px 22px;
        }

        .section-heading {
          max-width: 740px;
          margin-bottom: 35px;
        }

        .section-label {
          color: #075fc1;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .section-heading h2,
        .process-section h2,
        .bottom-section h2 {
          font-size: clamp(26px, 4vw, 38px);
          line-height: 1.2;
          letter-spacing: -1px;
          font-weight: 900;
          margin: 13px 0;
        }

        .section-heading p,
        .process-section p,
        .bottom-section p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.9;
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .solution-card {
          min-width: 0;
          box-sizing: border-box;
          padding: 27px;
          border: 1px solid #dce7f5;
          border-radius: 17px;
          background: white;
          box-shadow: 0 8px 28px rgba(16, 35, 63, 0.045);
        }

        .solution-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eaf3ff;
          color: #075fc1;
          font-size: 13px;
          font-weight: 900;
        }

        .solution-card h3 {
          margin: 19px 0 10px;
          font-size: 19px;
          font-weight: 900;
          line-height: 1.4;
        }

        .solution-description {
          min-height: 76px;
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.85;
        }

        .solution-card ul {
          display: grid;
          gap: 12px;
          padding: 19px 0 0;
          margin: 18px 0 0;
          border-top: 1px solid #edf2f8;
          list-style: none;
        }

        .solution-card li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #334155;
          font-size: 13px;
          line-height: 1.6;
        }

        .check {
          color: #087443;
          font-weight: 900;
        }

        .process-section {
          max-width: 1076px;
          box-sizing: border-box;
          margin: 0 auto 70px;
          padding: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 25px;
          border: 1px solid #cfe2fb;
          border-radius: 18px;
          background: linear-gradient(
            120deg,
            #eaf3ff,
            #ffffff
          );
        }

        .process-section > div {
          max-width: 650px;
        }

        .process-section h2 {
          font-size: clamp(25px, 3vw, 32px);
        }

        .process-button {
          flex-shrink: 0;
          background: #075fc1;
          color: white;
        }

        .bottom-section {
          padding: 65px 22px;
          background: #082d5c;
          text-align: center;
          color: white;
        }

        .bottom-section h2 {
          max-width: 700px;
          margin: 0 auto 15px;
        }

        .bottom-section p {
          max-width: 650px;
          margin: 0 auto 25px;
          color: #d5e5fb;
        }

        @media (max-width: 700px) {
          .hero {
            padding: 60px 19px;
          }

          h1 {
            letter-spacing: -1.3px;
          }

          .solutions-section {
            padding: 53px 16px;
          }

          .solutions-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .solution-card {
            padding: 23px;
          }

          .solution-description {
            min-height: 0;
          }

          .process-section {
            margin: 0 16px 50px;
            padding: 24px;
          }

          .process-button {
            width: 100%;
          }

          .hero-actions a {
            width: 100%;
            text-align: center;
          }

          .bottom-section {
            padding: 52px 19px;
          }
        }
      `}</style>
    </div>
  );
}
