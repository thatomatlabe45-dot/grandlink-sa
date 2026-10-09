"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadInternships();
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const savedProfile = localStorage.getItem("gradlink_profile");

      if (
        savedProfile === "graduate" ||
        savedProfile === "company"
      ) {
        setProfile(savedProfile);
      } else {
        setProfile(null);
      }
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
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      setUser(currentUser || null);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const savedProfile = localStorage.getItem("gradlink_profile");

      if (
        savedProfile === "graduate" ||
        savedProfile === "company"
      ) {
        setProfile(savedProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
      setProfile(null);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      localStorage.removeItem("gradlink_profile");

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
      {/* HEADER */}
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
            <Link href="/company-solutions">
              For Companies
            </Link>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <Link
                  href={
                    profile === "graduate"
                      ? "/graduate"
                      : profile === "company"
                        ? "/company-dashboard"
                        : "/choose-profile"
                  }
                  className="dashboard-link"
                >
                  {profile === "graduate"
                    ? "Graduate Dashboard"
                    : profile === "company"
                      ? "Company Dashboard"
                      : "Choose Profile"}
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
                <Link
                  href="/login?role=graduate"
                  className="login-link"
                >
                  Graduate Login
                </Link>

                <Link
                  href="/login?role=company"
                  className="login-link"
                >
                  Company Login
                </Link>

                <Link
                  href="/signup?role=graduate"
                  className="header-signup"
                >
                  Graduate Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
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
              Discover internships, graduate programmes and jobs
              from companies looking for the next generation of
              South African talent.
            </p>

            <div className="hero-buttons">
              <Link
                href="/internships"
                className="primary-button"
              >
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
                  <span>
                    Built for South African talent
                  </span>
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

      {/* QUICK PATHS */}
      <section className="quick-section">
        <div className="container">
          <div className="quick-grid">
            <Link href="/internships" className="quick-item">
              <div className="quick-icon blue">🎓</div>

              <div className="quick-copy">
                <span className="quick-label">
                  FOR GRADUATES
                </span>

                <h3>Find Internships</h3>

                <p>
                  Build experience and start your career.
                </p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>

            <Link href="/jobs" className="quick-item">
              <div className="quick-icon navy">💼</div>

              <div className="quick-copy">
                <span className="quick-label">
                  CAREER OPPORTUNITIES
                </span>

                <h3>Find Jobs</h3>

                <p>
                  Discover opportunities that match your skills.
                </p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>

            <Link
              href="/company-solutions"
              className="quick-item"
            >
              <div className="quick-icon purple">🏢</div>

              <div className="quick-copy">
                <span className="quick-label">
                  FOR COMPANIES
                </span>

                <h3>Hire Graduates</h3>

                <p>
                  Connect with emerging South African talent.
                </p>
              </div>

              <span className="quick-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED INTERNSHIPS */}
      <section className="featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                OPPORTUNITIES
              </span>

              <h2>Latest internship opportunities</h2>

              <p>
                Find opportunities designed to help you gain
                experience, develop your skills and take the next
                step in your career.
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
                Check back soon for internship opportunities from
                companies across South Africa.
              </p>

              <Link
                href="/internships"
                className="empty-button"
              >
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
                      {getCompanyInitial(
                        internship.company_name
                      )}
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

      {/* GRADUATE SECTION */}
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
            <span className="section-eyebrow">
              FOR GRADUATES
            </span>

            <h2>
              Your career starts with the right opportunity.
            </h2>

            <p>
              Whether you are looking for your first internship,
              graduate programme or full-time position, GradLink SA
              helps you discover opportunities that match your
              qualifications and career goals.
            </p>

            <div className="benefit-list">
              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Discover opportunities</strong>

                  <p>
                    Find internships and jobs from companies across
                    South Africa.
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Showcase your skills</strong>

                  <p>
                    Create your profile and highlight your
                    qualifications.
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-check">✓</span>

                <div>
                  <strong>Take the next step</strong>

                  <p>
                    Apply for opportunities that can move your
                    career forward.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/signup?role=graduate"
              className="primary-button"
            >
              Create Your Profile
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* COMPANY SECTION */}
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
                Reach qualified graduates, post internship
                opportunities and discover candidates who can help
                your business grow.
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
                            <div className="hero-buttons">
                <Link
                  href="/company-pricing"
                  className="white-button"
                >
                  View Company Plans
                  <span>→</span>
                </Link>

                <Link
                  href="/login?role=company"
                  className="cta-outline-button"
                >
                  Company Login
                </Link>
              </div>

              <p className="company-signup-note">
                New company? Start with a paid plan from R500.
                <Link href="/signup?role=company&redirect=/company-pricing">
                  {" "}Create a company account →
                </Link>
              </p>
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

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="container">
          <div className="center-heading">
            <span className="section-eyebrow">
              SIMPLE PROCESS
            </span>

            <h2>
              Your next opportunity is closer than you think.
            </h2>

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
                Explore internships and jobs that match your career
                goals.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <div className="step-icon">🚀</div>
              <h3>Apply and grow</h3>

              <p>
                Apply for opportunities and take your first step
                towards your career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <span className="section-eyebrow white">
                START TODAY
              </span>

              <h2>Ready to take the next step?</h2>

              <p>
                Create your GradLink SA profile and start
                discovering opportunities today.
              </p>
            </div>

            <div className="cta-buttons">
              <Link
                href="/signup?role=graduate"
                className="white-button"
              >
                Get Started
                <span>→</span>
              </Link>

              <Link
                href="/internships"
                className="cta-outline-button"
              >
                Browse Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
              Connecting South African graduates with
              opportunities that can shape their careers.
            </p>

            <span className="footer-email">
              gradlinksa@tuta.com
            </span>
          </div>

          <div className="footer-column">
            <h4>For Graduates</h4>
            <Link href="/internships">Internships</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/signup?role=graduate">
              Create Profile
            </Link>
          </div>

          <div className="footer-column">
            <h4>For Companies</h4>

            <Link href="/company-solutions">
              Hire Graduates
            </Link>

            <Link href="/company-pricing">Pricing</Link>

            <Link href="/login?role=company">
              Company Login
            </Link>
          </div>

          <div className="footer-column">
            <h4>GradLink SA</h4>
            <Link href="/">Home</Link>

            <Link href="/login?role=graduate">
              Graduate Login
            </Link>

            <Link href="/signup?role=graduate">
              Graduate Sign Up
            </Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} GradLink SA. All rights
            reserved.
          </span>

          <span>Built for South African talent.</span>
        </div>
      </footer>
    </main>
  );
}