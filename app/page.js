"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadInternships();
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadInternships() {
    try {
      const { data, error } = await supabase
        .from("internships")
        .select(
          "id, title, company_name, province, qualification, field_of_study, skills"
        )
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        setInternships(data);
      }
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user || null);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await supabase.auth.signOut();

      if (typeof window !== "undefined") {
        localStorage.removeItem("gradlink_profile");
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  function getCompanyInitial(name) {
    if (!name) return "C";

    return name.trim().charAt(0).toUpperCase();
  }

  return (
    <main className="home-page">
      {/* =========================
          HEADER
      ========================= */}
      <header className="home-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">G</span>

            <span className="logo-text">
              GradLink <strong>SA</strong>
            </span>
          </Link>

          <nav className="desktop-nav">
            <Link href="/internships">Internships</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/company">For Companies</Link>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <Link href="/company-dashboard" className="dashboard-link">
                  Dashboard
                </Link>

                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="login-link">
                  Login
                </Link>

                <Link href="/signup" className="header-signup">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================
          HERO
      ========================= */}
      <section className="hero-section">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>

        <div className="container hero-grid">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              South Africa&apos;s graduate opportunity platform
            </div>

            <h1>
              Your career.
              <span>Your opportunity.</span>
            </h1>

            <p className="hero-description">
              Discover internships, graduate programmes and jobs from
              companies looking for the next generation of South African
              talent.
            </p>

            <div className="hero-buttons">
              <Link href="/internships" className="primary-button">
                Find an Internship
                <span>→</span>
              </Link>

              <Link href="/jobs" className="secondary-button">
                Explore Jobs
              </Link>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                Built for graduates
              </div>

              <div className="trust-item">
                <span className="trust-icon">✓</span>
                South African opportunities
              </div>

              <div className="trust-item">
                <span className="trust-icon">✓</span>
                Simple to use
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
                alt="Young professionals working together"
                className="hero-image"
              />

              <div className="hero-floating-card">
                <div className="floating-icon">✓</div>

                <div>
                  <strong>Career opportunities</strong>
                  <span>Built for South African talent</span>
                </div>
              </div>
            </div>

            <div className="hero-stat-card">
              <span className="stat-number">01</span>

              <div>
                <strong>Start your journey</strong>
                <span>Discover your next opportunity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          QUICK PATHS
      ========================= */}
      <section className="quick-section">
        <div className="container">
          <div className="quick-grid">
            <Link href="/internships" className="quick-item">
              <div className="quick-icon blue">🎓</div>

              <div className="quick-copy">
                <span className="quick-label">FOR GRADUATES</span>
                <h3>Find Internships</h3>
                <p>Build experience and start your career.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>

            <Link href="/jobs" className="quick-item">
              <div className="quick-icon navy">💼</div>

              <div className="quick-copy">
                <span className="quick-label">CAREER OPPORTUNITIES</span>
                <h3>Find Jobs</h3>
                <p>Discover opportunities that match your skills.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>

            <Link href="/company" className="quick-item">
              <div className="quick-icon purple">🏢</div>

              <div className="quick-copy">
                <span className="quick-label">FOR COMPANIES</span>
                <h3>Hire Graduates</h3>
                <p>Connect with emerging South African talent.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          FEATURED INTERNSHIPS
      ========================= */}
      <section className="featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">OPPORTUNITIES</span>

              <h2>Latest internship opportunities</h2>

              <p>
                Find opportunities designed to help you gain experience,
                develop your skills and take the next step in your career.
              </p>
            </div>

            <Link href="/internships" className="view-all">
              View all internships →
            </Link>
          </div>

          {loading ? (
            <div className="loading-box">
              <div className="loading-spinner"></div>
              <p>Loading opportunities...</p>
            </div>
          ) : internships.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">🎓</div>

              <h3>New opportunities coming soon</h3>

              <p>
                Check back soon for internship opportunities from companies
                across South Africa.
              </p>

              <Link href="/internships" className="empty-button">
                Browse internships →
              </Link>
            </div>
          ) : (
            <div className="internship-grid">
              {internships.map((internship) => (
                <Link
                  href={`/jobs/${internship.id}`}
                  key={internship.id}
                  className="internship-card"
                >
                  <div className="company-row">
                    <div className="company-avatar">
                      {getCompanyInitial(internship.company_name)}
                    </div>

                    <div className="company-name">
                      {internship.company_name || "Company"}
                    </div>
                  </div>

                  <h3>{internship.title}</h3>

                  <div className="internship-meta">
                    {internship.province && (
                      <span>📍 {internship.province}</span>
                    )}

                    {internship.qualification && (
                      <span>🎓 {internship.qualification}</span>
                    )}
                  </div>

                  {internship.field_of_study && (
                    <div className="field-tag">
                      {internship.field_of_study}
                    </div>
                  )}

                  <div className="card-bottom">
                    <span>View opportunity</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================
          GRADUATE SECTION
      ========================= */}
      <section className="graduate-section">
        <div className="container graduate-grid">
          <div className="graduate-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
              alt="Graduates collaborating"
              className="section-image"
              loading="lazy"
            />

            <div className="image-badge">
              <span>🎓</span>
              <div>
                <strong>Built for your future</strong>
                <small>Start with GradLink SA</small>
              </div>
            </div>
          </div>

          <div className="graduate-content">
            <span className="section-eyebrow">FOR GRADUATES</span>

            <h2>Your career starts with the right opportunity.</h2>

            <p>
              Whether you are looking for your first internship, graduate
              programme or full-time position, GradLink SA helps you discover
              opportunities that match your qualifications and career goals.
            </p>

            <div className="benefit-list">
              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Discover opportunities</strong>

                  <p>
                    Find internships and jobs from companies across South
                    Africa.
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Showcase your skills</strong>

                  <p>
                    Create your profile and highlight your qualifications.
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Take the next step</strong>

                  <p>
                    Apply for opportunities that can move your career forward.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/signup" className="primary-button">
              Create Your Profile
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          COMPANY SECTION
      ========================= */}
      <section className="company-section">
        <div className="container">
          <div className="company-panel">
            <div className="company-panel-content">
              <span className="section-eyebrow white">FOR COMPANIES</span>

              <h2>Find the next generation of South African talent.</h2>

              <p>
                Reach qualified graduates, post internship opportunities and
                discover candidates who can help your business grow.
              </p>

              <div className="company-features">
                <div>
                  <span>01</span>
                  <p>Reach qualified graduates</p>
                </div>

                <div>
                  <span>02</span>
                  <p>Post internship opportunities</p>
                </div>

                <div>
                  <span>03</span>
                  <p>Discover emerging talent</p>
                </div>
              </div>

              <Link href="/company" className="white-button">
                Explore Company Solutions
                <span>→</span>
              </Link>
            </div>

            <div className="company-panel-image">
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85"
                alt="Business team working together"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section className="how-section">
        <div className="container">
          <div className="center-heading">
            <span className="section-eyebrow">SIMPLE PROCESS</span>

            <h2>Your next opportunity is closer than you think.</h2>

            <p>Getting started with GradLink SA is simple.</p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>

              <div className="step-icon">👤</div>

              <h3>Create your profile</h3>

              <p>
                Build a professional profile that showcases your
                qualifications, skills and experience.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>

              <div className="step-icon">🔎</div>

              <h3>Discover opportunities</h3>

              <p>
                Explore internships and jobs that match your career goals.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>

              <div className="step-icon">🚀</div>

              <h3>Apply and grow</h3>

              <p>
                Apply for opportunities and take your first step towards your
                career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CTA
      ========================= */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <span className="section-eyebrow white">START TODAY</span>

              <h2>Ready to take the next step?</h2>

              <p>
                Create your GradLink SA profile and start discovering
                opportunities today.
              </p>
            </div>

            <div className="cta-buttons">
              <Link href="/signup" className="white-button">
                Get Started
                <span>→</span>
              </Link>

              <Link href="/internships" className="cta-outline-button">
                Browse Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo footer-logo">
              <span className="logo-mark">G</span>

              <span className="logo-text">
                GradLink <strong>SA</strong>
              </span>
            </Link>

            <p>
              Connecting South African graduates with opportunities that can
              shape their careers.
            </p>

            <span className="footer-email">gradlinksa@tuta.com</span>
          </div>

          <div className="footer-column">
            <h4>For Graduates</h4>

            <Link href="/internships">Internships</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/signup">Create Profile</Link>
          </div>

          <div className="footer-column">
            <h4>For Companies</h4>

            <Link href="/company">Hire Graduates</Link>
            <Link href="/company-pricing">Pricing</Link>
            <Link href="/login">Company Login</Link>
          </div>

          <div className="footer-column">
            <h4>GradLink SA</h4>

            <Link href="/">Home</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} GradLink SA. All rights reserved.
          </span>

          <span>Built for South African talent.</span>
        </div>
      </footer>

      {/* =========================
          STYLES
      ========================= */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
          overflow-x: hidden;
        }

        a {
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        .home-page {
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          background: #ffffff;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        /* HEADER */

        .home-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid #e8edf5;
        }

        .header-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.6px;
          white-space: nowrap;
        }

        .logo-text strong {
          color: #2563eb;
        }

        .logo-mark {
          width: 39px;
          height: 39px;
          flex: 0 0 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 9px 24px rgba(37, 99, 235, 0.25);
          font-size: 18px;
          font-weight: 900;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-left: auto;
        }

        .desktop-nav a {
          color: #475569;
          font-size: 14px;
          font-weight: 650;
          transition: color 0.2s ease;
        }

        .desktop-nav a:hover {
          color: #2563eb;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-link,
        .dashboard-link {
          color: #334155;
          font-size: 14px;
          font-weight: 750;
        }

        .login-link:hover,
        .dashboard-link:hover {
          color: #2563eb;
        }

        .header-signup,
        .logout-button {
          min-height: 42px;
          padding: 0 17px;
          border: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          font-size: 13px;
          font-weight: 750;
          box-shadow: 0 9px 22px rgba(37, 99, 235, 0.2);
          cursor: pointer;
        }

        .logout-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        /* HERO */

        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 82px 0 95px;
          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(37, 99, 235, 0.12),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 10%,
              rgba(59, 130, 246, 0.08),
              transparent 28%
            ),
            linear-gradient(180deg, #f7faff 0%, #ffffff 100%);
        }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
          pointer-events: none;
        }

        .hero-glow-one {
          width: 250px;
          height: 250px;
          right: -100px;
          top: 100px;
          background: rgba(37, 99, 235, 0.06);
        }

        .hero-glow-two {
          width: 180px;
          height: 180px;
          left: -80px;
          bottom: 0;
          background: rgba(59, 130, 246, 0.05);
        }

        .hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.88fr);
          align-items: center;
          gap: 65px;
        }

        .hero-content {
          min-width: 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 13px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .hero-content h1 {
          max-width: 690px;
          margin: 23px 0 21px;
          color: #0f172a;
          font-size: clamp(45px, 5.5vw, 73px);
          line-height: 1.01;
          letter-spacing: -3.5px;
          font-weight: 850;
        }

        .hero-content h1 span {
          display: block;
          color: #2563eb;
        }

        .hero-description {
          max-width: 625px;
          margin: 0;
          color: #64748b;
          font-size: 17px;
          line-height: 1.75;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 31px;
        }

        .primary-button,
        .secondary-button,
        .white-button,
        .cta-outline-button {
          min-height: 50px;
          padding: 0 20px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 750;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .primary-button {
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 13px 28px rgba(37, 99, 235, 0.22);
        }

        .secondary-button {
          color: #1e293b;
          background: #ffffff;
          border: 1px solid #dbe3ef;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .white-button:hover {
          transform: translateY(-2px);
        }

        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 29px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 650;
        }

        .trust-icon {
          width: 19px;
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 10px;
          font-weight: 900;
        }

        /* HERO VISUAL */

        .hero-visual {
          position: relative;
          min-width: 0;
          padding: 10px 20px 30px 0;
        }

        .hero-image-wrap {
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.17);
          background: #dbeafe;
        }

        .hero-image {
          display: block;
          width: 100%;
          height: 540px;
          object-fit: cover;
        }

        .hero-floating-card {
          position: absolute;
          left: 22px;
          bottom: 22px;
          max-width: calc(100% - 44px);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.14);
          backdrop-filter: blur(12px);
        }

        .floating-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 900;
        }

        .hero-floating-card strong,
        .hero-floating-card span {
          display: block;
        }

        .hero-floating-card strong {
          color: #0f172a;
          font-size: 12px;
        }

        .hero-floating-card span {
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
        }

        .hero-stat-card {
          position: absolute;
          right: -2px;
          top: 35px;
          width: 175px;
          padding: 17px;
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 17px 40px rgba(15, 23, 42, 0.13);
          backdrop-filter: blur(14px);
        }

        .stat-number {
          display: block;
          margin-bottom: 7px;
          color: #2563eb;
          font-size: 25px;
          font-weight: 850;
        }

        .hero-stat-card strong,
        .hero-stat-card span {
          display: block;
        }

        .hero-stat-card strong {
          color: #0f172a;
          font-size: 12px;
        }

        .hero-stat-card div span {
          margin-top: 4px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.4;
        }

        /* QUICK */

        .quick-section {
          position: relative;
          z-index: 3;
          padding: 0 0 90px;
          background: #ffffff;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .quick-item {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 21px;
          border: 1px solid #e5eaf2;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 7px 25px rgba(15, 23, 42, 0.035);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .quick-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
        }

        .quick-icon {
          width: 47px;
          height: 47px;
          flex: 0 0 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          font-size: 20px;
        }

        .quick-icon.blue {
          background: #eff6ff;
        }

        .quick-icon.navy {
          background: #e0e7ff;
        }

        .quick-icon.purple {
          background: #f3e8ff;
        }

        .quick-label {
          display: block;
          margin-bottom: 4px;
          color: #2563eb;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .quick-item h3 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 15px;
        }

        .quick-item p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .quick-arrow {
          color: #2563eb;
          font-size: 20px;
          font-weight: 750;
        }

        /* GENERAL SECTIONS */

        .featured-section {
          padding: 100px 0;
          background: #f8fafc;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 38px;
        }

        .section-eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #2563eb;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }

        .section-eyebrow.white {
          color: #bfdbfe;
        }

        .section-heading h2,
        .center-heading h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.6px;
        }

        .section-heading p,
        .center-heading p {
          max-width: 650px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .view-all {
          flex: 0 0 auto;
          color: #2563eb;
          font-size: 13px;
          font-weight: 750;
        }

        /* INTERNSHIPS */

        .internship-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .internship-card {
          min-width: 0;
          display: block;
          padding: 22px;
          border: 1px solid #e5eaf2;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.035);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .internship-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.09);
        }

        .company-row {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 18px;
        }

        .company-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 800;
        }

        .company-name {
          min-width: 0;
          overflow: hidden;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .internship-card h3 {
          margin: 0 0 15px;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.35;
        }

        .internship-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.4;
        }

        .field-tag {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          margin-top: 14px;
          padding: 7px 10px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #edf1f6;
          color: #2563eb;
          font-size: 11px;
          font-weight: 750;
        }

        .loading-box,
        .empty-box {
          padding: 55px 25px;
          border: 1px dashed #cbd5e1;
          border-radius: 17px;
          background: #ffffff;
          text-align: center;
        }

        .loading-box p {
          margin: 13px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          margin: 0 auto;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-icon {
          font-size: 35px;
          margin-bottom: 10px;
        }

        .empty-box h3 {
          margin: 0 0 8px;
          color: #0f172a;
        }

        .empty-box p {
          max-width: 450px;
          margin: 0 auto 20px;
          color: #64748b;
          line-height: 1.6;
          font-size: 13px;
        }

        .empty-button {
          display: inline-flex;
          min-height: 43px;
          align-items: center;
          padding: 0 16px;
          border-radius: 9px;
          color: #ffffff;
          background: #2563eb;
          font-size: 12px;
          font-weight: 750;
        }

        /* GRADUATE */

        .graduate-section {
          padding: 110px 0;
          background: #ffffff;
        }

        .graduate-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
          align-items: center;
          gap: 78px;
        }

        .graduate-image-wrap {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border-radius: 23px;
          box-shadow: 0 23px 60px rgba(15, 23, 42, 0.13);
        }

        .section-image {
          display: block;
          width: 100%;
          height: 535px;
          object-fit: cover;
        }

        .image-badge {
          position: absolute;
          left: 18px;
          bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.13);
        }

        .image-badge > span {
          width: 33px;
          height: 33px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eff6ff;
        }

        .image-badge strong,
        .image-badge small {
          display: block;
        }

        .image-badge strong {
          color: #0f172a;
          font-size: 11px;
        }

        .image-badge small {
          margin-top: 3px;
          color: #64748b;
          font-size: 9px;
        }

        .graduate-content h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.7px;
        }

        .graduate-content > p {
          margin: 20px 0 30px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.8;
        }

        .benefit-list {
          display: flex;
          flex-direction: column;
          gap: 19px;
          margin-bottom: 30px;
        }

        .benefit-item {
          display: flex;
          gap: 13px;
        }

        .benefit-check {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
        }

        .benefit-item strong {
          color: #0f172a;
          font-size: 13px;
        }

        .benefit-item p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        /* COMPANY */

        .company-section {
          padding: 100px 0;
          background: #f8fafc;
        }

        .company-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
          overflow: hidden;
          border-radius: 25px;
          background: linear-gradient(135deg, #0b3277 0%, #2563eb 100%);
          box-shadow: 0 27px 65px rgba(37, 99, 235, 0.18);
        }

        .company-panel-content {
          padding: 60px;
        }

        .company-panel h2 {
          max-width: 600px;
          margin: 0;
          color: #ffffff;
          font-size: clamp(31px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .company-panel-content > p {
          max-width: 550px;
          margin: 20px 0 30px;
          color: #dbeafe;
          font-size: 14px;
          line-height: 1.7;
        }

        .company-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .company-features div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .company-features span {
          color: #93c5fd;
          font-size: 10px;
          font-weight: 850;
        }

        .company-features p {
          margin: 0;
          color: #ffffff;
          font-size: 12px;
          font-weight: 650;
        }

        .white-button {
          color: #1d4ed8;
          background: #ffffff;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.14);
        }

        .company-panel-image {
          min-height: 500px;
        }

        .company-panel-image img {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 500px;
          object-fit: cover;
        }

        /* HOW IT WORKS */

        .how-section {
          padding: 110px 0;
          background: #ffffff;
        }

        .center-heading {
          max-width: 760px;
          margin: 0 auto 55px;
          text-align: center;
        }

        .center-heading p {
          margin-left: auto;
          margin-right: auto;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .step {
          padding: 29px;
          border: 1px solid #e5eaf2;
          border-top: 3px solid #2563eb;
          border-radius: 16px;
          background: #f8fafc;
        }

        .step-number {
          color: #2563eb;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .step-icon {
          width: 45px;
          height: 45px;
          margin: 21px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #ffffff;
          font-size: 20px;
        }

        .step h3 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 17px;
        }

        .step p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.7;
        }

        /* CTA */

        .cta-section {
          padding: 0 0 100px;
          background: #ffffff;
        }

        .cta-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          padding: 55px 60px;
          border-radius: 25px;
          background: linear-gradient(135deg, #0b3277, #2563eb);
          box-shadow: 0 25px 60px rgba(37, 99, 235, 0.15);
        }

        .cta-box h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(30px, 4vw, 44px);
          letter-spacing: -1.3px;
        }

        .cta-box p {
          max-width: 600px;
          margin: 12px 0 0;
          color: #dbeafe;
          line-height: 1.6;
          font-size: 13px;
        }

        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex: 0 0 auto;
        }

        .cta-outline-button {
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.08);
        }

        /* FOOTER */

        .footer {
          padding: 70px 0 25px;
          background: #0b1220;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.7fr repeat(3, 1fr);
          gap: 50px;
        }

        .footer-logo {
          color: #ffffff;
        }

        .footer-brand p {
          max-width: 360px;
          margin: 18px 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.7;
        }

        .footer-email {
          color: #cbd5e1;
          font-size: 11px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-column h4 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 12px;
        }

        .footer-column a {
          color: #94a3b8;
          font-size: 11px;
        }

        .footer-column a:hover {
          color: #ffffff;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 55px;
          padding-top: 20px;
          border-top: 1px solid #1e293b;
          color: #64748b;
          font-size: 10px;
        }

        /* TABLET */

        @media (max-width: 900px) {
          .desktop-nav {
            display: none;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .hero-image {
            height: 440px;
          }

          .quick-grid {
            grid-template-columns: 1fr;
          }

          .internship-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .graduate-grid {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .section-image {
            height: 430px;
          }

          .company-panel {
            grid-template-columns: 1fr;
          }

          .company-panel-image {
            min-height: 360px;
          }

          .company-panel-image img {
            min-height: 360px;
            height: 360px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .cta-box {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .container {
            width: calc(100% - 28px);
          }

          .header-inner {
            min-height: 65px;
            gap: 8px;
          }

          .logo {
            font-size: 16px;
            gap: 7px;
          }

          .logo-mark {
            width: 33px;
            height: 33px;
            flex-basis: 33px;
            border-radius: 9px;
            font-size: 15px;
          }

          .header-actions {
            margin-left: auto;
            gap: 7px;
          }

          .login-link,
          .dashboard-link {
            font-size: 11px;
          }

          .header-signup,
          .logout-button {
            min-height: 36px;
            padding: 0 10px;
            border-radius: 8px;
            font-size: 10px;
          }

          .hero-section {
            padding: 48px 0 60px;
          }

          .hero-grid {
            display: flex;
            flex-direction: column;
            gap: 33px;
          }

          .hero-content h1 {
            margin: 17px 0;
            font-size: 43px;
            line-height: 1.02;
            letter-spacing: -2.3px;
          }

          .hero-description {
            font-size: 14px;
            line-height: 1.7;
          }

          .eyebrow {
            max-width: 100%;
            padding: 7px 10px;
            font-size: 9px;
          }

          .hero-buttons {
            display: grid;
            grid-template-columns: 1fr;
            gap: 9px;
            margin-top: 25px;
          }

          .primary-button,
          .secondary-button,
          .white-button,
          .cta-outline-button {
            width: 100%;
            min-height: 49px;
          }

          .hero-trust {
            display: grid;
            grid-template-columns: 1fr;
            gap: 9px;
            margin-top: 23px;
          }

          .hero-visual {
            padding: 0 7px 20px 0;
          }

          .hero-image-wrap {
            border-radius: 19px;
          }

          .hero-image {
            height: 310px;
          }

          .hero-stat-card {
            top: 15px;
            right: -2px;
            width: 145px;
            padding: 12px;
            border-radius: 13px;
          }

          .hero-stat-card .stat-number {
            font-size: 20px;
          }

          .hero-floating-card {
            left: 12px;
            bottom: 12px;
            max-width: calc(100% - 24px);
            padding: 10px 12px;
            border-radius: 12px;
          }

          .floating-icon {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }

          .quick-section {
            padding-bottom: 60px;
          }

          .quick-grid {
            gap: 9px;
          }

          .quick-item {
            padding: 15px;
            gap: 10px;
            border-radius: 14px;
          }

          .quick-icon {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
            border-radius: 10px;
            font-size: 17px;
          }

          .quick-label {
            font-size: 7px;
          }

          .quick-item h3 {
            font-size: 13px;
          }

          .quick-item p {
            font-size: 10px;
          }

          .featured-section {
            padding: 65px 0;
          }

          .section-heading {
            display: block;
            margin-bottom: 25px;
          }

          .section-heading h2,
          .center-heading h2 {
            font-size: 31px;
            letter-spacing: -1px;
          }

          .section-heading p,
          .center-heading p {
            font-size: 12px;
            line-height: 1.65;
          }

          .view-all {
            display: inline-block;
            margin-top: 17px;
          }

          .internship-grid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .internship-card {
            padding: 18px;
            border-radius: 15px;
          }

          .internship-card h3 {
            font-size: 17px;
          }

          .graduate-section {
            padding: 70px 0;
          }

          .graduate-grid {
            gap: 32px;
          }

          .section-image {
            height: 300px;
          }

          .graduate-image-wrap {
            border-radius: 18px;
          }

          .graduate-content h2 {
            font-size: 32px;
            letter-spacing: -1px;
          }

          .graduate-content > p {
            font-size: 13px;
            line-height: 1.7;
          }

          .benefit-list {
            gap: 17px;
          }

          .company-section {
            padding: 65px 0;
          }

          .company-panel {
            border-radius: 19px;
          }

          .company-panel-content {
            padding: 32px 22px;
          }

          .company-panel h2 {
            font-size: 31px;
            letter-spacing: -1px;
          }

          .company-panel-content > p {
            font-size: 13px;
          }

          .company-panel-image {
            min-height: 270px;
          }

          .company-panel-image img {
            min-height: 270px;
            height: 270px;
          }

          .how-section {
            padding: 70px 0;
          }

          .center-heading {
            margin-bottom: 35px;
          }

          .step {
            padding: 24px;
          }

          .cta-section {
            padding-bottom: 65px;
          }

          .cta-box {
            padding: 32px 22px;
            border-radius: 19px;
          }

          .cta-box h2 {
            font-size: 31px;
            letter-spacing: -1px;
          }

          .cta-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
          }

          .footer {
            padding: 55px 0 22px;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 35px 25px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
            margin-top: 40px;
          }
        }

        @media (max-width: 380px) {
          .container {
            width: calc(100% - 22px);
          }

          .logo {
            font-size: 14px;
          }

          .logo-mark {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }

          .header-signup,
          .logout-button {
            padding: 0 8px;
            font-size: 9px;
          }

          .hero-content h1 {
            font-size: 38px;
          }

          .hero-image {
            height: 270px;
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}