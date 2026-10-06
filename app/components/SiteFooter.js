"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <div className="footer-logo-icon">G</div>

            <div>
              Grad<span>Link</span>
              <small>SA</small>
            </div>
          </Link>

          <p>
            Connecting South African graduates
            with internship and job opportunities.
          </p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>

          <Link href="/internships">
            Internships
          </Link>

          <Link href="/jobs">
            Jobs
          </Link>

          <Link href="/company">
            For Companies
          </Link>
        </div>

        <div className="footer-column">
          <h3>Account</h3>

          <Link href="/login">
            Login
          </Link>

          <Link href="/signup">
            Create Account
          </Link>

          <Link href="/forgot-password">
            Forgot Password
          </Link>
        </div>

        <div className="footer-column">
          <h3>GradLink SA</h3>

          <a href="mailto:gradlinksa@tuta.com">
            Contact Us
          </a>

          <span>
            South Africa 🇿🇦
          </span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} GradLink SA.
          All rights reserved.
        </span>

        <span>
          Built for South African graduates.
        </span>
      </div>

      <style jsx>{`
        .site-footer {
          margin-top: 70px;
          background: #0f172a;
          color: #cbd5e1;
        }

        .footer-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 55px 22px 42px;
          box-sizing: border-box;
          display: grid;
          grid-template-columns:
            2fr 1fr 1fr 1fr;
          gap: 45px;
        }

        .footer-brand {
          max-width: 330px;
        }

        .footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          text-decoration: none;
          font-size: 20px;
          font-weight: 850;
        }

        .footer-logo span {
          color: #60a5fa;
        }

        .footer-logo small {
          color: #94a3b8;
          font-size: 10px;
          margin-left: 3px;
        }

        .footer-logo-icon {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 900;
        }

        .footer-brand p {
          margin: 17px 0 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.7;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 11px;
        }

        .footer-column h3 {
          margin: 0 0 5px;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .footer-column a,
        .footer-column span {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          line-height: 1.5;
        }

        .footer-column a:hover {
          color: #60a5fa;
        }

        .footer-bottom {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 22px 25px;
          box-sizing: border-box;
          border-top: 1px solid #1e293b;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 760px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 35px 20px;
            padding: 45px 18px 35px;
          }

          .footer-brand {
            grid-column: 1 / -1;
            max-width: none;
          }

          .footer-bottom {
            flex-direction: column;
            padding: 18px;
            gap: 7px;
          }
        }
      `}</style>
    </footer>
  );
}
