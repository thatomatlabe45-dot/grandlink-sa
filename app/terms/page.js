"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link href="/" className="brand">
          GradLink <span>SA</span>
        </Link>

        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <article className="legal-content">
        <p className="eyebrow">LEGAL INFORMATION</p>

        <h1>Terms & Conditions</h1>

        <p className="updated">Last updated: 11 October 2026</p>

        <p>
          Welcome to GradLink SA. These Terms & Conditions govern your access
          to and use of the GradLink SA platform, which connects graduates with
          internship and employment opportunities.
        </p>

        <p>
          By accessing or using our platform, you agree to these terms. If you
          do not agree, please do not use the platform.
        </p>

        <section>
          <h2>1. About GradLink SA</h2>
          <p>
            GradLink SA is a platform designed to help graduates discover
            opportunities and help companies connect with potential candidates.
            GradLink SA does not guarantee employment, internships, interviews,
            or successful recruitment outcomes.
          </p>
        </section>

        <section>
          <h2>2. Eligibility and accounts</h2>
          <p>
            You must provide accurate information when creating and maintaining
            an account. You are responsible for keeping your login credentials
            secure and for activity conducted through your account.
          </p>
          <p>
            You must not impersonate another person, provide deliberately
            misleading information, or use the platform for unlawful purposes.
          </p>
        </section>

        <section>
          <h2>3. Graduate responsibilities</h2>
          <p>Graduates agree to:</p>
          <ul>
            <li>Provide truthful profile, education and skills information.</li>
            <li>Upload documents they are authorised to share.</li>
            <li>Apply for opportunities honestly and professionally.</li>
            <li>Keep their contact information reasonably up to date.</li>
            <li>Respect the rights and privacy of other platform users.</li>
          </ul>
          <p>
            Graduate access is intended to be free unless GradLink SA clearly
            communicates a change to its pricing arrangements.
          </p>
        </section>

        <section>
          <h2>4. Company responsibilities</h2>
          <p>Companies agree to:</p>
          <ul>
            <li>Provide accurate business and recruiter information.</li>
            <li>Post genuine internships and employment opportunities.</li>
            <li>Describe qualifications, duties, locations and stipends honestly.</li>
            <li>Use candidate information only for legitimate recruitment purposes.</li>
            <li>Comply with applicable employment and privacy laws.</li>
          </ul>
          <p>
            Companies must not post fraudulent opportunities, request unlawful
            payments from applicants, discriminate unlawfully, or misuse
            graduate information.
          </p>
        </section>

        <section>
          <h2>5. Company subscriptions and payments</h2>
          <p>
            Company services are paid services. Advertised plans currently
            start at R500, with applicable prices, billing periods and listing
            limits displayed on the pricing page.
          </p>
          <p>
            The plan description and checkout information shown before payment
            form part of the applicable subscription arrangement. Companies
            should review these details before paying.
          </p>
          <p>
            A plan selection alone does not confirm payment or activate paid
            features. Activation is subject to payment verification.
          </p>
          <p>
            Cancellation, renewal, refunds and any applicable statutory rights
            will be governed by the applicable plan terms and South African law.
            Contact GradLink SA if you have a payment or subscription query.
          </p>
        </section>

        <section>
          <h2>6. Listings and applications</h2>
          <p>
            GradLink SA may remove or restrict listings that appear fraudulent,
            misleading, expired, unlawful or inconsistent with these terms.
            We may also restrict accounts where reasonably necessary to protect
            the platform and its users.
          </p>
          <p>
            Companies are responsible for their recruitment decisions.
            GradLink SA does not guarantee the accuracy of every user-submitted
            statement or the availability of every advertised opportunity.
          </p>
        </section>

        <section>
          <h2>7. Personal information</h2>
          <p>
            Personal information must be handled in accordance with applicable
            privacy laws, including South Africa's Protection of Personal
            Information Act (POPIA), where applicable.
          </p>
          <p>
            Please read our{" "}
            <Link href="/privacy">Privacy Policy</Link> to understand how
            information is collected, used, stored and shared.
          </p>
        </section>

        <section>
          <h2>8. Intellectual property</h2>
          <p>
            Unless otherwise stated, GradLink SA's branding, website design
            and platform content are protected by applicable intellectual
            property laws. You may not copy or commercially exploit these
            materials without permission.
          </p>
          <p>
            You retain the rights you have in content you submit. You authorise
            GradLink SA to process and display that content as reasonably
            necessary to provide the services you request, subject to our
            Privacy Policy and applicable law.
          </p>
        </section>

        <section>
          <h2>9. Availability and liability</h2>
          <p>
            We aim to keep GradLink SA available and reliable, but uninterrupted
            access cannot be guaranteed. Features may change, and maintenance
            or technical issues may temporarily affect the service.
          </p>
          <p>
            Nothing in these terms excludes or limits a right or liability
            that cannot lawfully be excluded or limited under South African law.
          </p>
        </section>

        <section>
          <h2>10. Suspension and termination</h2>
          <p>
            We may suspend or terminate access where reasonably necessary for
            security, suspected fraud, misuse, legal compliance or a material
            breach of these terms. Where appropriate, we will provide notice
            or an opportunity to resolve the issue.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms as the platform develops. The updated
            version will be published on this page with a revised date.
            Where required by law, we will provide additional notice or obtain
            consent.
          </p>
        </section>

        <section>
          <h2>12. Governing law</h2>
          <p>
            These terms are intended to be governed by the laws of the
            Republic of South Africa, subject to any mandatory legal
            protections that apply.
          </p>
        </section>

        <section>
          <h2>13. Contact us</h2>
          <p>
            For questions about these terms, contact GradLink SA at{" "}
            <a href="mailto:gradlinksa@tuta.com">gradlinksa@tuta.com</a>.
          </p>
        </section>

        <div className="legal-note">
          <strong>Important:</strong> These are draft terms for your platform,
          not a substitute for legal advice. Review them before launch,
          especially the subscription, cancellation, refund and liability
          provisions.
        </div>
      </article>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} GradLink SA</span>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/">Home</Link>
      </footer>

      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: #f5f8ff;
          color: #172b4d;
          font-family: Arial, sans-serif;
        }

        .legal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px max(20px, calc((100% - 1050px) / 2));
          background: #fff;
          border-bottom: 1px solid #e5eaf3;
        }

        .brand {
          font-size: 22px;
          font-weight: 800;
          color: #123b7a;
          text-decoration: none;
        }

        .brand span {
          color: #2878ee;
        }

        .back-link {
          color: #245bb5;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }

        .legal-content {
          max-width: 900px;
          margin: 38px auto;
          padding: 42px;
          background: #fff;
          border: 1px solid #e7ecf5;
          border-radius: 20px;
          box-shadow: 0 12px 35px rgba(26, 56, 105, 0.06);
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .eyebrow {
          color: #2878ee;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        h1 {
          margin: 8px 0;
          color: #123b7a;
          font-size: clamp(32px, 5vw, 46px);
          line-height: 1.2;
        }

        .updated {
          color: #718096;
          font-size: 14px;
          margin-bottom: 28px;
        }

        section {
          margin-top: 30px;
        }

        h2 {
          margin-bottom: 8px;
          color: #173e7a;
          font-size: 21px;
          line-height: 1.4;
        }

        p {
          color: #46566e;
          font-size: 15px;
        }

        ul {
          padding-left: 23px;
          color: #46566e;
          font-size: 15px;
        }

        li {
          margin: 6px 0;
        }

        a {
          color: #2468d8;
        }

        .legal-note {
          margin-top: 32px;
          padding: 18px;
          border-radius: 12px;
          background: #eff5ff;
          color: #3e526f;
          font-size: 14px;
          line-height: 1.7;
        }

        .legal-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          padding: 25px 20px;
          color: #64748b;
          font-size: 13px;
        }

        .legal-footer a {
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .legal-header {
            padding: 17px 18px;
          }

          .brand {
            font-size: 19px;
          }

          .legal-content {
            margin: 18px 12px;
            padding: 24px 19px;
            border-radius: 15px;
          }

          h2 {
            font-size: 19px;
          }

          p,
          ul {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}
