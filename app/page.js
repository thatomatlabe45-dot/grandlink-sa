"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadInternships();
  }, []);

  function getCompanyInitial(name) {
    if (!name) return "C";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  return (
    <main className="home-page">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="home-header">
        <div className="container header-inner">

          <Link href="/" className="logo">
            <span className="logo-mark">G</span>
            <span>GradLink <strong>SA</strong></span>
          </Link>

          <nav className="desktop-nav">
            <Link href="/internships">Internships</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/company">For Companies</Link>
          </nav>

          <div className="header-actions">
            <Link href="/login" className="login-link">
              Login
            </Link>

            <Link href="/signup" className="header-signup">
              Get Started
            </Link>
          </div>

        </div>
      </header>


      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="hero-section">
        <div className="container hero-grid">

          <div className="hero-content">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              South Africa's graduate opportunity platform
            </div>

            <h1>
              Start your career.
              <span>Find your opportunity.</span>
            </h1>

            <p className="hero-description">
              Discover internships, graduate opportunities and jobs from
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
                Easy to use
              </div>
            </div>

          </div>


          {/* HERO IMAGE */}
          <div className="hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
              alt="Young professionals working together"
              className="hero-image"
            />
          </div>

        </div>
      </section>


      {/* =====================================================
          QUICK LINKS
      ===================================================== */}
      <section className="quick-section">
        <div className="container">

          <div className="quick-grid">

            <Link href="/internships" className="quick-item">
              <div className="quick-icon blue">
                🎓
              </div>

              <div>
                <h3>Find Internships</h3>
                <p>Build experience and start your career.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>


            <Link href="/jobs" className="quick-item">
              <div className="quick-icon navy">
                💼
              </div>

              <div>
                <h3>Find Jobs</h3>
                <p>Discover opportunities that match your skills.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>


            <Link href="/company" className="quick-item">
              <div className="quick-icon light">
                🏢
              </div>

              <div>
                <h3>Hire Graduates</h3>
                <p>Connect with South Africa's emerging talent.</p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>

          </div>

        </div>
      </section>


      {/* =====================================================
          FEATURED INTERNSHIPS
      ===================================================== */}
      <section className="featured-section">
        <div className="container">

          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                OPPORTUNITIES
              </span>

              <h2>
                Latest internship opportunities
              </h2>

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
              Loading opportunities...
            </div>
          ) : internships.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">🎓</div>
              <h3>New opportunities coming soon</h3>
              <p>
                Check back soon for internship opportunities from
                companies across South Africa.
              </p>
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


                  <h3>
                    {internship.title}
                  </h3>


                  <div className="internship-meta">

                    {internship.province && (
                      <span>
                        📍 {internship.province}
                      </span>
                    )}

                    {internship.qualification && (
                      <span>
                        🎓 {internship.qualification}
                      </span>
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


      {/* =====================================================
          GRADUATE SECTION
      ===================================================== */}
      <section className="graduate-section">
        <div className="container graduate-grid">

          <div className="graduate-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
              alt="Graduates collaborating"
              className="section-image"
              loading="lazy"
            />
          </div>


          <div className="graduate-content">

            <span className="section-eyebrow">
              FOR GRADUATES
            </span>

            <h2>
              Your career starts with the right opportunity.
            </h2>

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
                    Find internships and jobs from companies across South Africa.
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


      {/* =====================================================
          COMPANY SECTION
      ===================================================== */}
      <section className="company-section">
        <div className="container">

          <div className="company-panel">

            <div className="company-panel-content">

              <span className="section-eyebrow white">
                FOR COMPANIES
              </span>

              <h2>
                Find the next generation of South African talent.
              </h2>

              <p>
                Reach qualified graduates, post opportunities and discover
                candidates who can help your business grow.
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


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}
      <section className="how-section">
        <div className="container">

          <div className="center-heading">

            <span className="section-eyebrow">
              SIMPLE PROCESS
            </span>

            <h2>
              Your next opportunity is closer than you think.
            </h2>

            <p>
              Getting started with GradLink SA is simple.
            </p>

          </div>


          <div className="steps-grid">

            <div className="step">

              <div className="step-number">
                01
              </div>

              <h3>
                Create your profile
              </h3>

              <p>
                Build a professional profile that showcases your
                qualifications, skills and experience.
              </p>

            </div>


            <div className="step">

              <div className="step-number">
                02
              </div>

              <h3>
                Discover opportunities
              </h3>

              <p>
                Explore internships and jobs that match your career goals.
              </p>

            </div>


            <div className="step">

              <div className="step-number">
                03
              </div>

              <h3>
                Apply and grow
              </h3>

              <p>
                Apply for opportunities and take your first step towards
                your career.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          CTA
      ===================================================== */}
      <section className="cta-section">
        <div className="container">

          <div className="cta-box">

            <div>
              <span className="section-eyebrow white">
                START TODAY
              </span>

              <h2>
                Ready to take the next step?
              </h2>

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


      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="footer">

        <div className="container footer-grid">

          <div className="footer-brand">

            <Link href="/" className="logo footer-logo">
              <span className="logo-mark">G</span>
              <span>GradLink <strong>SA</strong></span>
            </Link>

            <p>
              Connecting South African graduates with opportunities
              that can shape their careers.
            </p>

            <span className="footer-email">
              gradlinksa@tuta.com
            </span>

          </div>


          <div className="footer-column">

            <h4>For Graduates</h4>

            <Link href="/internships">
              Internships
            </Link>

            <Link href="/jobs">
              Jobs
            </Link>

            <Link href="/signup">
              Create Profile
            </Link>

          </div>


          <div className="footer-column">

            <h4>For Companies</h4>

            <Link href="/company">
              Hire Graduates
            </Link>

            <Link href="/company-pricing">
              Pricing
            </Link>

            <Link href="/login">
              Company Login
            </Link>

          </div>


          <div className="footer-column">

            <h4>GradLink SA</h4>

            <Link href="/">
              Home
            </Link>

            <Link href="/login">
              Login
            </Link>

            <Link href="/signup">
              Sign Up
            </Link>

          </div>

        </div>


        <div className="container footer-bottom">

          <span>
            © {new Date().getFullYear()} GradLink SA. All rights reserved.
          </span>

          <span>
            Built for South African talent.
          </span>

        </div>

      </footer>


      {/* =====================================================
          RESPONSIVE STYLES
      ===================================================== */}
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

        .home-page {
          width: 100%;
          overflow-x: hidden;
          background: #ffffff;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }


        /* =========================
           HEADER
        ========================= */

        .home-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #e8edf5;
        }

        .header-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          white-space: nowrap;
        }

        .logo strong {
          color: #2563eb;
        }

        .logo-mark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 8px 20px rgba(37,99,235,0.22);
          font-size: 18px;
          font-weight: 800;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 34px;
          margin-left: auto;
        }

        .desktop-nav a {
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .desktop-nav a:hover {
          color: #2563eb;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .login-link {
          color: #334155;
          font-size: 14px;
          font-weight: 700;
        }

        .header-signup {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(37,99,235,0.18);
        }


        /* =========================
           HERO
        ========================= */

        .hero-section {
          padding: 78px 0 90px;
          background:
            radial-gradient(circle at 15% 20%, rgba(37,99,235,0.08), transparent 32%),
            linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
          align-items: center;
          gap: 70px;
        }

        .hero-content {
          min-width: 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 13px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
        }

        .hero-content h1 {
          margin: 22px 0 20px;
          max-width: 680px;
          color: #0f172a;
          font-size: clamp(44px, 5vw, 72px);
          line-height: 1.03;
          letter-spacing: -3px;
          font-weight: 850;
        }

        .hero-content h1 span {
          display: block;
          color: #2563eb;
        }

        .hero-description {
          max-width: 620px;
          margin: 0;
          color: #64748b;
          font-size: 18px;
          line-height: 1.7;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 32px;
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .primary-button {
          color: #ffffff;
          background: #2563eb;
          box-shadow: 0 12px 25px rgba(37,99,235,0.2);
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
          margin-top: 30px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .trust-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 11px;
          font-weight: 900;
        }

        .hero-image-wrap {
          min-width: 0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(15,23,42,0.16);
          background: #e2e8f0;
        }

        .hero-image {
          display: block;
          width: 100%;
          height: 560px;
          object-fit: cover;
        }


        /* =========================
           QUICK LINKS
        ========================= */

        .quick-section {
          padding: 0 0 90px;
          background: #ffffff;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .quick-item {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0,1fr) auto;
          align-items: center;
          gap: 15px;
          padding: 22px;
          border: 1px solid #e5eaf2;
          border-radius: 16px;
          background: #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .quick-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(15,23,42,0.08);
        }

        .quick-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .quick-icon.blue {
          background: #eff6ff;
        }

        .quick-icon.navy {
          background: #e0e7ff;
        }

        .quick-icon.light {
          background: #f1f5f9;
        }

        .quick-item h3 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 15px;
        }

        .quick-item p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .quick-arrow {
          color: #2563eb;
          font-size: 20px;
          font-weight: 700;
        }


        /* =========================
           FEATURED
        ========================= */

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
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1.4px;
        }

        .section-heading h2,
        .center-heading h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .section-heading p,
        .center-heading p {
          max-width: 650px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
        }

        .view-all {
          flex: 0 0 auto;
          color: #2563eb;
          font-size: 14px;
          font-weight: 750;
        }

        .internship-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .internship-card {
          min-width: 0;
          display: block;
          padding: 22px;
          border: 1px solid #e5eaf2;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 8px 25px rgba(15,23,42,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .internship-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15,23,42,0.09);
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
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 800;
        }

        .company-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
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
          font-size: 12px;
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
          font-size: 11px;
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
          padding-top: 17px;
          border-top: 1px solid #edf1f6;
          color: #2563eb;
          font-size: 12px;
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
          margin: 0 auto;
          color: #64748b;
          line-height: 1.6;
        }


        /* =========================
           GRADUATE
        ========================= */

        .graduate-section {
          padding: 110px 0;
          background: #ffffff;
        }

        .graduate-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
          align-items: center;
          gap: 80px;
        }

        .graduate-image-wrap {
          min-width: 0;
          overflow: hidden;
          border-radius: 22px;
          box-shadow: 0 22px 55px rgba(15,23,42,0.13);
        }

        .section-image {
          display: block;
          width: 100%;
          height: 540px;
          object-fit: cover;
        }

        .graduate-content {
          min-width: 0;
        }

        .graduate-content h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.6px;
        }

        .graduate-content > p {
          margin: 20px 0 30px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.8;
        }

        .benefit-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          font-size: 14px;
        }

        .benefit-item p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }


        /* =========================
           COMPANY
        ========================= */

        .company-section {
          padding: 100px 0;
          background: #f8fafc;
        }

        .company-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
          overflow: hidden;
          border-radius: 24px;
          background: linear-gradient(135deg, #0f3f91 0%, #2563eb 100%);
          box-shadow: 0 25px 60px rgba(37,99,235,0.18);
        }

        .company-panel-content {
          padding: 60px;
        }

        .section-eyebrow.white {
          color: #bfdbfe;
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
          font-size: 15px;
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
          font-size: 11px;
          font-weight: 800;
        }

        .company-features p {
          margin: 0;
          color: #ffffff;
          font-size: 13px;
          font-weight: 650;
        }

        .white-button {
          color: #1d4ed8;
          background: #ffffff;
          box-shadow: 0 10px 25px rgba(15,23,42,0.14);
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


        /* =========================
           HOW IT WORKS
        ========================= */

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
          gap: 20px;
        }

        .step {
          padding: 30px;
          border-top: 3px solid #2563eb;
          border-radius: 15px;
          background: #f8fafc;
        }

        .step-number {
          margin-bottom: 25px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .step h3 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 18px;
        }

        .step p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }


        /* =========================
           CTA
        ========================= */

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
          border-radius: 24px;
          background: linear-gradient(135deg, #0f3f91, #2563eb);
        }

        .cta-box h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(30px, 4vw, 44px);
          letter-spacing: -1.2px;
        }

        .cta-box p {
          max-width: 600px;
          margin: 12px 0 0;
          color: #dbeafe;
          line-height: 1.6;
          font-size: 14px;
        }

        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex: 0 0 auto;
        }

        .cta-outline-button {
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.08);
        }


        /* =========================
           FOOTER
        ========================= */

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
          margin: 18px 0 18px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.7;
        }

        .footer-email {
          color: #cbd5e1;
          font-size: 12px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-column h4 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 13px;
        }

        .footer-column a {
          color: #94a3b8;
          font-size: 12px;
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
          font-size: 11px;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {

          .desktop-nav {
            display: none;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .hero-image {
            height: 420px;
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


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .container {
            width: min(100% - 28px, 1180px);
          }


          /* Header */

          .home-header {
            position: sticky;
            top: 0;
          }

          .header-inner {
            min-height: 66px;
            gap: 10px;
          }

          .logo {
            font-size: 17px;
            gap: 7px;
          }

          .logo-mark {
            width: 33px;
            height: 33px;
            border-radius: 9px;
            font-size: 16px;
          }

          .header-actions {
            gap: 8px;
          }

          .login-link {
            font-size: 12px;
          }

          .header-signup {
            min-height: 37px;
            padding: 0 12px;
            border-radius: 9px;
            font-size: 11px;
          }


          /* Hero */

          .hero-section {
            padding: 45px 0 55px;
          }

          .hero-grid {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .hero-content h1 {
            margin: 17px 0 17px;
            font-size: 43px;
            line-height: 1.03;
            letter-spacing: -2.1px;
          }

          .hero-description {
            font-size: 15px;
            line-height: 1.65;
          }

          .eyebrow {
            max-width: 100%;
            padding: 7px 10px;
            font-size: 9px;
            line-height: 1.3;
          }

          .hero-buttons {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
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
            gap: 10px;
            margin-top: 24px;
          }

          .hero-image-wrap {
            width: 100%;
            border-radius: 18px;
          }

          .hero-image {
            width: 100%;
            height: 310px;
            object-fit: cover;
          }


          /* Quick links */

          .quick-section {
            padding-bottom: 60px;
          }

          .quick-grid {
            gap: 10px;
          }

          .quick-item {
            grid-template-columns: auto minmax(0,1fr) auto;
            padding: 16px;
            gap: 11px;
            border-radius: 14px;
          }

          .quick-icon {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
            font-size: 17px;
          }

          .quick-item h3 {
            font-size: 14px;
          }

          .quick-item p {
            font-size: 11px;
          }


          /* Featured */

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
            font-size: 13px;
            line-height: 1.65;
          }

          .view-all {
            display: inline-block;
            margin-top: 18px;
          }

          .internship-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .internship-card {
            padding: 18px;
            border-radius: 15px;
          }

          .internship-card h3 {
            font-size: 17px;
          }


          /* Graduate */

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
            font-size: 14px;
            line-height: 1.7;
          }

          .benefit-list {
            gap: 17px;
          }


          /* Company */

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
            font-size: 14px;
          }

          .company-panel-image {
            min-height: 270px;
          }

          .company-panel-image img {
            min-height: 270px;
            height: 270px;
          }


          /* How it works */

          .how-section {
            padding: 70px 0;
          }

          .center-heading {
            margin-bottom: 35px;
          }

          .step {
            padding: 24px;
          }


          /* CTA */

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


          /* Footer */

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


        /* =====================================================
           VERY SMALL PHONES
        ===================================================== */

        @media (max-width: 380px) {

          .container {
            width: calc(100% - 22px);
          }

          .logo {
            font-size: 15px;
          }

          .logo-mark {
            width: 30px;
            height: 30px;
          }

          .header-signup {
            padding: 0 9px;
            font-size: 10px;
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