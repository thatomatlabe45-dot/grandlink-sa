"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInternships();
  }, []);

  async function loadInternships() {
    try {
      const { data, error } = await supabase
        .from("internships")
        .select(
          "id, title, company_name, province, qualification, field_of_study, skills"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(6);

      if (error) {
        console.error(
          "Homepage internships error:",
          error
        );
        setInternships([]);
        return;
      }

      setInternships(data || []);
    } catch (error) {
      console.error(
        "Homepage loading error:",
        error
      );
      setInternships([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header style={styles.header}>
        <div style={styles.navContainer}>

          <Link
            href="/"
            style={styles.brand}
          >
            <div style={styles.logo}>
              G
            </div>

            <div style={styles.brandText}>
              Grad
              <span style={styles.brandBlue}>
                Link
              </span>{" "}
              <span style={styles.brandSA}>
                SA
              </span>
            </div>
          </Link>

          <nav style={styles.desktopNav}>
            <Link
              href="/internships"
              style={styles.navLink}
            >
              Internships
            </Link>

            <Link
              href="/jobs"
              style={styles.navLink}
            >
              Jobs
            </Link>

            <Link
              href="/company"
              style={styles.navLink}
            >
              For Companies
            </Link>
          </nav>

          <div style={styles.navActions}>
            <Link
              href="/login"
              style={styles.loginButton}
            >
              Login
            </Link>

            <Link
              href="/signup"
              style={styles.signupButton}
            >
              Get Started
            </Link>
          </div>

        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section style={styles.hero}>
        <div style={styles.heroContainer}>

          <div style={styles.heroContent}>

            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot}></span>
              BUILT FOR SOUTH AFRICAN GRADUATES
            </div>

            <h1 style={styles.heroTitle}>
              Start your career.
              <br />
              <span style={styles.heroBlue}>
                Find your opportunity.
              </span>
            </h1>

            <p style={styles.heroText}>
              GradLink SA connects ambitious graduates
              with internships and jobs from companies
              looking for their next generation of talent.
            </p>

            <div style={styles.heroButtons}>

              <Link
                href="/internships"
                style={styles.primaryButton}
              >
                Find Internships
                <span style={styles.buttonArrow}>
                  →
                </span>
              </Link>

              <Link
                href="/jobs"
                style={styles.secondaryButton}
              >
                Explore Jobs
              </Link>

            </div>

            <div style={styles.heroTrust}>

              <div style={styles.trustItem}>
                <span style={styles.trustIcon}>
                  ✓
                </span>
                Free for graduates
              </div>

              <div style={styles.trustItem}>
                <span style={styles.trustIcon}>
                  ✓
                </span>
                South African opportunities
              </div>

            </div>

          </div>

          <div style={styles.heroVisual}>

            <div style={styles.imageCard}>
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85"
                alt="Young professionals working together"
                style={styles.heroImage}
              />

              <div style={styles.imageOverlay}></div>

              <div style={styles.opportunityBadge}>
                <div style={styles.badgeIcon}>
                  ✓
                </div>

                <div>
                  <strong style={styles.badgeTitle}>
                    Career opportunities
                  </strong>

                  <div style={styles.badgeText}>
                    Built for your next step
                  </div>
                </div>
              </div>

              <div style={styles.imageCaption}>
                <div style={styles.captionSmall}>
                  YOUR CAREER STARTS HERE
                </div>

                <div style={styles.captionTitle}>
                  Connect. Apply. Grow.
                </div>
              </div>

            </div>

            <div style={styles.floatingStat}>
              <div style={styles.statCircle}>
                ★
              </div>

              <div>
                <strong style={styles.statTitle}>
                  Graduate talent
                </strong>

                <div style={styles.statText}>
                  Meet your next opportunity
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          QUICK LINKS
      ===================================================== */}

      <section style={styles.quickSection}>
        <div style={styles.sectionContainer}>

          <div style={styles.quickGrid}>

            <Link
              href="/internships"
              style={styles.quickItem}
            >
              <div style={styles.quickIcon}>
                🎓
              </div>

              <div>
                <strong style={styles.quickTitle}>
                  Find Internships
                </strong>

                <p style={styles.quickText}>
                  Discover opportunities to gain
                  valuable experience.
                </p>
              </div>

              <span style={styles.quickArrow}>
                →
              </span>
            </Link>

            <Link
              href="/jobs"
              style={styles.quickItem}
            >
              <div style={styles.quickIcon}>
                💼
              </div>

              <div>
                <strong style={styles.quickTitle}>
                  Find Jobs
                </strong>

                <p style={styles.quickText}>
                  Take the next step toward your
                  professional career.
                </p>
              </div>

              <span style={styles.quickArrow}>
                →
              </span>
            </Link>

            <Link
              href="/company"
              style={styles.quickItem}
            >
              <div style={styles.quickIcon}>
                🏢
              </div>

              <div>
                <strong style={styles.quickTitle}>
                  Hire Graduate Talent
                </strong>

                <p style={styles.quickText}>
                  Connect your company with
                  promising graduates.
                </p>
              </div>

              <span style={styles.quickArrow}>
                →
              </span>
            </Link>

          </div>

        </div>
      </section>

      {/* =====================================================
          FEATURED INTERNSHIPS
      ===================================================== */}

      <section style={styles.internshipSection}>
        <div style={styles.sectionContainer}>

          <div style={styles.sectionHeader}>

            <div>
              <div style={styles.sectionEyebrow}>
                OPPORTUNITIES
              </div>

              <h2 style={styles.sectionTitle}>
                Latest internships
              </h2>

              <p style={styles.sectionText}>
                Explore opportunities from companies
                looking for South Africa's next generation
                of talent.
              </p>
            </div>

            <Link
              href="/internships"
              style={styles.viewAll}
            >
              View all internships →
            </Link>

          </div>

          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.loadingSpinner}></div>
              <p>Loading opportunities...</p>
            </div>
          ) : internships.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>
                🎓
              </div>

              <h3 style={styles.emptyTitle}>
                New opportunities are coming
              </h3>

              <p style={styles.emptyText}>
                Check the internships page for the
                latest graduate opportunities.
              </p>

              <Link
                href="/internships"
                style={styles.primarySmall}
              >
                Browse Internships
              </Link>
            </div>
          ) : (
            <div style={styles.internshipGrid}>

              {internships.map((internship) => (
                <Link
                  key={internship.id}
                  href={`/jobs/${internship.id}`}
                  style={styles.internshipCard}
                >

                  <div style={styles.cardTop}>
                    <div style={styles.companyLogo}>
                      {getCompanyInitial(
                        internship.company_name
                      )}
                    </div>

                    <span style={styles.internshipLabel}>
                      INTERNSHIP
                    </span>
                  </div>

                  <h3 style={styles.cardTitle}>
                    {internship.title ||
                      "Graduate Internship"}
                  </h3>

                  <p style={styles.companyName}>
                    {internship.company_name ||
                      "Company"}
                  </p>

                  <div style={styles.cardDetails}>

                    {internship.province && (
                      <span style={styles.detail}>
                        📍 {internship.province}
                      </span>
                    )}

                    {internship.qualification && (
                      <span style={styles.detail}>
                        🎓{" "}
                        {internship.qualification}
                      </span>
                    )}

                  </div>

                  <div style={styles.cardBottom}>
                    <span style={styles.viewOpportunity}>
                      View opportunity
                    </span>

                    <span style={styles.cardArrow}>
                      →
                    </span>
                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          FOR GRADUATES
      ===================================================== */}

      <section style={styles.graduateSection}>
        <div style={styles.sectionContainer}>

          <div style={styles.graduatePanel}>

            <div style={styles.graduateImageWrap}>
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=85"
                alt="Students preparing for their careers"
                style={styles.graduateImage}
              />

              <div style={styles.imageShade}></div>

              <div style={styles.photoBadge}>
                <span style={styles.photoBadgeIcon}>
                  ✓
                </span>

                Career ready
              </div>
            </div>

            <div style={styles.graduateContent}>

              <div style={styles.sectionEyebrow}>
                FOR GRADUATES
              </div>

              <h2 style={styles.graduateTitle}>
                Your degree is the beginning,
                not the destination.
              </h2>

              <p style={styles.graduateText}>
                Create your profile, discover
                opportunities and put your
                qualifications in front of companies
                looking for emerging talent.
              </p>

              <div style={styles.featureList}>

                <div style={styles.feature}>
                  <span style={styles.featureCheck}>
                    ✓
                  </span>
                  Discover internships and jobs
                </div>

                <div style={styles.feature}>
                  <span style={styles.featureCheck}>
                    ✓
                  </span>
                  Build your professional profile
                </div>

                <div style={styles.feature}>
                  <span style={styles.featureCheck}>
                    ✓
                  </span>
                  Apply directly to opportunities
                </div>

              </div>

              <Link
                href="/signup"
                style={styles.primaryButton}
              >
                Create Graduate Profile
                <span style={styles.buttonArrow}>
                  →
                </span>
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          FOR COMPANIES
      ===================================================== */}

      <section style={styles.companySection}>
        <div style={styles.sectionContainer}>

          <div style={styles.companyPanel}>

            <div style={styles.companyContent}>

              <div style={styles.companyEyebrow}>
                FOR COMPANIES
              </div>

              <h2 style={styles.companyTitle}>
                Find the graduates
                <br />
                <span>
                  your business needs.
                </span>
              </h2>

              <p style={styles.companyText}>
                Reach qualified graduate talent,
                manage applications and make smarter
                hiring decisions with GradLink SA.
              </p>

              <div style={styles.companyFeatures}>

                <div style={styles.companyFeature}>
                  <span>
                    ◈
                  </span>
                  AI applicant matching
                </div>

                <div style={styles.companyFeature}>
                  <span>
                    ◈
                  </span>
                  Applicant management
                </div>

                <div style={styles.companyFeature}>
                  <span>
                    ◈
                  </span>
                  Document verification
                </div>

              </div>

              <Link
                href="/company"
                style={styles.whiteButton}
              >
                Hire Graduate Talent
                <span>
                  →
                </span>
              </Link>

            </div>

            <div style={styles.companyVisual}>
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85"
                alt="Business team collaborating"
                style={styles.companyImage}
              />

              <div style={styles.companyImageOverlay}></div>

              <div style={styles.companyQuote}>
                <div style={styles.quoteMark}>
                  “
                </div>

                <p>
                  Find ambitious graduates
                  ready to make an impact.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section style={styles.stepsSection}>
        <div style={styles.sectionContainer}>

          <div style={styles.centerHeader}>
            <div style={styles.sectionEyebrow}>
              HOW IT WORKS
            </div>

            <h2 style={styles.sectionTitle}>
              Your next opportunity is
              <br />
              just a few steps away.
            </h2>
          </div>

          <div style={styles.stepsGrid}>

            <Step
              number="01"
              icon="👤"
              title="Create your profile"
              text="Show employers your qualifications, skills and career interests."
            />

            <Step
              number="02"
              icon="🔎"
              title="Discover opportunities"
              text="Explore internships and jobs that match your goals."
            />

            <Step
              number="03"
              icon="🚀"
              title="Apply and grow"
              text="Apply to opportunities and take the next step in your career."
            />

          </div>

        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section style={styles.ctaSection}>
        <div style={styles.ctaContainer}>

          <div style={styles.ctaGlow}></div>

          <div style={styles.ctaContent}>

            <div style={styles.ctaEyebrow}>
              YOUR NEXT CHAPTER STARTS HERE
            </div>

            <h2 style={styles.ctaTitle}>
              Ready to take the next step?
            </h2>

            <p style={styles.ctaText}>
              Whether you're looking for your first
              opportunity or your next great hire,
              GradLink SA is here to connect you.
            </p>

            <div style={styles.ctaButtons}>

              <Link
                href="/internships"
                style={styles.ctaPrimary}
              >
                Explore Internships
              </Link>

              <Link
                href="/signup"
                style={styles.ctaSecondary}
              >
                Get Started
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer style={styles.footer}>
        <div style={styles.footerContainer}>

          <div style={styles.footerBrand}>

            <Link
              href="/"
              style={styles.footerLogoRow}
            >
              <div style={styles.footerLogo}>
                G
              </div>

              <div style={styles.footerBrandText}>
                Grad
                <span>
                  Link
                </span>{" "}
                SA
              </div>
            </Link>

            <p style={styles.footerDescription}>
              Connecting South African graduates
              with opportunities to build their careers.
            </p>

          </div>

          <div style={styles.footerLinks}>

            <div style={styles.footerColumn}>
              <h4>
                Explore
              </h4>

              <Link href="/internships">
                Internships
              </Link>

              <Link href="/jobs">
                Jobs
              </Link>
            </div>

            <div style={styles.footerColumn}>
              <h4>
                GradLink SA
              </h4>

              <Link href="/company">
                For Companies
              </Link>

              <Link href="/signup">
                Create Account
              </Link>

              <Link href="/login">
                Login
              </Link>
            </div>

          </div>

        </div>

        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} GradLink SA.
          All rights reserved.
        </div>
      </footer>

    </main>
  );
}

function Step({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.step}>

      <div style={styles.stepNumber}>
        {number}
      </div>

      <div style={styles.stepIcon}>
        {icon}
      </div>

      <h3 style={styles.stepTitle}>
        {title}
      </h3>

      <p style={styles.stepText}>
        {text}
      </p>

    </div>
  );
}

function getCompanyInitial(name) {
  if (!name) return "G";

  const clean = name.trim();

  return clean
    .charAt(0)
    .toUpperCase();
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#0f172a",
    overflowX: "hidden",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(14px)",
    borderBottom: "1px solid #e2e8f0",
  },

  navContainer: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    minHeight: "72px",
    padding: "0 20px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    flexShrink: 0,
  },

  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #1d4ed8, #1e40af)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "900",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.22)",
  },

  brandText: {
    fontSize: "20px",
    fontWeight: "850",
    color: "#0f172a",
  },

  brandBlue: {
    color: "#2563eb",
  },

  brandSA: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
  },

  desktopNav: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    marginLeft: "auto",
  },

  navLink: {
    textDecoration: "none",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "700",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  loginButton: {
    textDecoration: "none",
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: "750",
    padding: "10px 13px",
  },

  signupButton: {
    textDecoration: "none",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    padding: "11px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "800",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.20)",
  },

  hero: {
    background:
      "linear-gradient(135deg, #f8fbff 0%, #eef5ff 55%, #ffffff 100%)",
    borderBottom: "1px solid #e5edf7",
  },

  heroContainer: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "75px 20px 85px",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(360px, 0.9fr)",
    gap: "65px",
    alignItems: "center",
  },

  heroContent: {
    minWidth: 0,
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "0.7px",
  },

  eyebrowDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#2563eb",
  },

  heroTitle: {
    margin: "20px 0 17px",
    fontSize: "clamp(40px, 5vw, 65px)",
    lineHeight: 1.03,
    letterSpacing: "-2.5px",
    fontWeight: "900",
    color: "#0f172a",
  },

  heroBlue: {
    color: "#2563eb",
  },

  heroText: {
    maxWidth: "600px",
    margin: 0,
    color: "#64748b",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  heroButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "11px",
    marginTop: "28px",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "52px",
    boxSizing: "border-box",
    padding: "0 20px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow:
      "0 10px 25px rgba(37,99,235,0.22)",
  },

  buttonArrow: {
    fontSize: "18px",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    boxSizing: "border-box",
    padding: "0 20px",
    borderRadius: "11px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#1e3a8a",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
  },

  heroTrust: {
    display: "flex",
    flexWrap: "wrap",
    gap: "17px",
    marginTop: "23px",
  },

  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "650",
  },

  trustIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "900",
  },

  heroVisual: {
    position: "relative",
    minWidth: 0,
  },

  imageCard: {
    position: "relative",
    height: "510px",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow:
      "0 30px 70px rgba(15,23,42,0.18)",
    background: "#dbeafe",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.02) 25%, rgba(15,23,42,0.70) 100%)",
  },

  opportunityBadge: {
    position: "absolute",
    top: "20px",
    left: "20px",
    right: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "14px",
    padding: "12px",
    boxShadow:
      "0 12px 30px rgba(15,23,42,0.16)",
  },

  badgeIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  badgeTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "12px",
  },

  badgeText: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "2px",
  },

  imageCaption: {
    position: "absolute",
    left: "24px",
    bottom: "26px",
    color: "#ffffff",
  },

  captionSmall: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
    opacity: 0.85,
  },

  captionTitle: {
    marginTop: "5px",
    fontSize: "24px",
    fontWeight: "850",
  },

  floatingStat: {
    position: "absolute",
    right: "-25px",
    bottom: "34px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    padding: "12px 14px",
    boxShadow:
      "0 18px 35px rgba(15,23,42,0.15)",
  },

  statCircle: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statTitle: {
    display: "block",
    fontSize: "12px",
    color: "#0f172a",
  },

  statText: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "2px",
  },

  quickSection: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },

  sectionContainer: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 20px",
    boxSizing: "border-box",
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
  },

  quickItem: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 20px",
    alignItems: "center",
    gap: "13px",
    padding: "25px 18px",
    textDecoration: "none",
    borderRight: "1px solid #e2e8f0",
  },

  quickIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  quickTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "13px",
  },

  quickText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  quickArrow: {
    color: "#2563eb",
    fontSize: "18px",
  },

  internshipSection: {
    padding: "80px 0",
    background: "#f8fafc",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "30px",
  },

  sectionEyebrow: {
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "clamp(28px, 4vw, 40px)",
    lineHeight: 1.1,
    letterSpacing: "-1.2px",
    fontWeight: "900",
  },

  sectionText: {
    maxWidth: "580px",
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  viewAll: {
    flexShrink: 0,
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "800",
  },

  internshipGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  internshipCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "17px",
    padding: "20px",
    textDecoration: "none",
    boxSizing: "border-box",
    boxShadow:
      "0 8px 25px rgba(15,23,42,0.045)",
    transition: "transform 0.2s ease",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "17px",
  },

  companyLogo: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "16px",
  },

  internshipLabel: {
    color: "#2563eb",
    background: "#eff6ff",
    borderRadius: "999px",
    padding: "6px 8px",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "0.5px",
  },

  cardTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
    lineHeight: 1.35,
    fontWeight: "850",
  },

  companyName: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "650",
  },

  cardDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "17px",
  },

  detail: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    padding: "6px 8px",
    color: "#64748b",
    fontSize: "9px",
    lineHeight: 1.2,
  },

  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "19px",
    paddingTop: "15px",
    borderTop: "1px solid #f1f5f9",
  },

  viewOpportunity: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
  },

  cardArrow: {
    color: "#2563eb",
    fontSize: "17px",
  },

  loadingBox: {
    minHeight: "180px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "13px",
  },

  loadingSpinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    borderTopColor: "#2563eb",
    marginBottom: "10px",
  },

  emptyBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "45px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "32px",
  },

  emptyTitle: {
    margin: "12px 0 5px",
    fontSize: "17px",
    color: "#0f172a",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  primarySmall: {
    display: "inline-flex",
    marginTop: "17px",
    padding: "11px 16px",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "800",
  },

  graduateSection: {
    padding: "80px 0",
    background: "#ffffff",
  },

  graduatePanel: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 0.9fr) minmax(0, 1.1fr)",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "25px",
    overflow: "hidden",
  },

  graduateImageWrap: {
    minHeight: "470px",
    position: "relative",
  },

  graduateImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageShade: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.03), rgba(15,23,42,0.50))",
  },

  photoBadge: {
    position: "absolute",
    left: "20px",
    bottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 13px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "11px",
    fontWeight: "800",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.15)",
  },

  photoBadgeIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
  },

  graduateContent: {
    padding: "55px 55px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  graduateTitle: {
    margin: "5px 0 15px",
    color: "#0f172a",
    fontSize: "clamp(27px, 3.5vw, 40px)",
    lineHeight: 1.1,
    letterSpacing: "-1.2px",
    fontWeight: "900",
  },

  graduateText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
    maxWidth: "500px",
  },

  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: "22px 0 27px",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  featureCheck: {
    width: "21px",
    height: "21px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "900",
  },

  companySection: {
    padding: "80px 0",
    background: "#f8fafc",
  },

  companyPanel: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr)",
    borderRadius: "25px",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0f2f73, #1d4ed8)",
    boxShadow:
      "0 25px 60px rgba(29,78,216,0.20)",
  },

  companyContent: {
    padding: "60px",
    color: "#ffffff",
  },

  companyEyebrow: {
    color: "#bfdbfe",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  companyTitle: {
    margin: "13px 0 15px",
    color: "#ffffff",
    fontSize: "clamp(30px, 4vw, 46px)",
    lineHeight: 1.05,
    letterSpacing: "-1.5px",
    fontWeight: "900",
  },

  companyTitleSpan: {
    color: "#bfdbfe",
  },

  companyText: {
    margin: 0,
    maxWidth: "490px",
    color: "#dbeafe",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  companyFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    margin: "25px 0 30px",
  },

  companyFeature: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
  },

  whiteButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "50px",
    padding: "0 19px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "850",
  },

  companyVisual: {
    minHeight: "500px",
    position: "relative",
  },

  companyImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  companyImageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(15,47,115,0.35), rgba(15,47,115,0.05))",
  },

  companyQuote: {
    position: "absolute",
    left: "25px",
    right: "25px",
    bottom: "25px",
    padding: "18px",
    background: "rgba(15,23,42,0.78)",
    borderRadius: "15px",
    backdropFilter: "blur(10px)",
  },

  quoteMark: {
    color: "#93c5fd",
    fontSize: "27px",
    lineHeight: 0.7,
  },

  companyQuoteText: {
    color: "#ffffff",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  stepsSection: {
    padding: "80px 0",
    background: "#ffffff",
  },

  centerHeader: {
    textAlign: "center",
    marginBottom: "45px",
  },

  stepsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  step: {
    position: "relative",
    padding: "28px 25px",
    border: "1px solid #e2e8f0",
    borderRadius: "17px",
    background: "#ffffff",
  },

  stepNumber: {
    position: "absolute",
    top: "18px",
    right: "20px",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "900",
  },

  stepIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    marginBottom: "20px",
  },

  stepTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "850",
  },

  stepText: {
    margin: "9px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.65,
  },

  ctaSection: {
    padding: "0 20px 80px",
    background: "#ffffff",
  },

  ctaContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "25px",
    background:
      "linear-gradient(135deg, #0f2f73, #2563eb)",
  },

  ctaGlow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    right: "-200px",
    top: "-300px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(147,197,253,0.25), transparent 70%)",
  },

  ctaContent: {
    position: "relative",
    zIndex: 1,
    padding: "65px 25px",
    textAlign: "center",
  },

  ctaEyebrow: {
    color: "#bfdbfe",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  ctaTitle: {
    margin: "12px 0 12px",
    color: "#ffffff",
    fontSize: "clamp(29px, 4vw, 45px)",
    letterSpacing: "-1.2px",
    fontWeight: "900",
  },

  ctaText: {
    maxWidth: "620px",
    margin: "0 auto",
    color: "#dbeafe",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  ctaButtons: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "26px",
  },

  ctaPrimary: {
    minHeight: "50px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 20px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "850",
  },

  ctaSecondary: {
    minHeight: "50px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 20px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "850",
  },

  footer: {
    background: "#0f172a",
    color: "#ffffff",
  },

  footerContainer: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "55px 20px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-between",
    gap: "50px",
  },

  footerBrand: {
    maxWidth: "390px",
  },

  footerLogoRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    textDecoration: "none",
  },

  footerLogo: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  footerBrandText: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "850",
  },

  footerDescription: {
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.6,
    marginTop: "14px",
  },

  footerLinks: {
    display: "flex",
    gap: "70px",
  },

  footerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  footerColumnHeading: {
    color: "#ffffff",
    fontSize: "12px",
    margin: "0 0 5px",
  },

  footerBottom: {
    borderTop: "1px solid #1e293b",
    padding: "18px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "11px",
  },
};

/* ============================================================
   MOBILE STYLES
   ============================================================ */

if (typeof document !== "undefined") {
  const styleId = "gradlink-home-mobile-styles";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;

    style.innerHTML = `
      @media (max-width: 900px) {
        nav {
          display: none !important;
        }

        .gradlink-mobile-placeholder {
          display: none;
        }
      }

      @media (max-width: 760px) {

        header {
          position: sticky !important;
          top: 0 !important;
        }

        header > div {
          min-height: 64px !important;
          padding: 0 14px !important;
        }

        header nav {
          display: none !important;
        }

        header a {
          white-space: nowrap;
        }

        header a:last-child {
          padding: 9px 11px !important;
          font-size: 11px !important;
        }

        header a:nth-last-child(2) {
          font-size: 12px !important;
          padding: 8px 7px !important;
        }

        main {
          overflow-x: hidden !important;
        }
      }

      @media (max-width: 700px) {

        section {
          overflow: hidden;
        }

        /* HERO */

        section:first-of-type > div {
          display: block !important;
          padding: 48px 17px 55px !important;
        }

        section:first-of-type > div > div:first-child {
          margin-bottom: 35px;
        }

        section:first-of-type h1 {
          font-size: 42px !important;
          letter-spacing: -1.8px !important;
        }

        section:first-of-type p {
          font-size: 15px !important;
        }

        section:first-of-type img {
          height: 390px !important;
        }

        section:first-of-type > div > div:last-child > div {
          height: 390px !important;
        }

        /* QUICK LINKS */

        section:nth-of-type(2) > div > div {
          display: block !important;
        }

        section:nth-of-type(2) a {
          border-right: none !important;
          border-bottom: 1px solid #e2e8f0;
          padding: 19px 5px !important;
        }

        /* GENERAL */

        section > div {
          max-width: 100% !important;
        }

        /* INTERNSHIPS */

        section:nth-of-type(3) {
          padding: 55px 0 !important;
        }

        section:nth-of-type(3) > div {
          padding: 0 17px !important;
        }

        section:nth-of-type(3) > div > div:first-child {
          display: block !important;
        }

        section:nth-of-type(3) > div > div:first-child > a {
          display: inline-block;
          margin-top: 15px;
        }

        section:nth-of-type(3) > div > div:nth-child(2) {
          display: block !important;
        }

        /* GRADUATES */

        section:nth-of-type(4) {
          padding: 55px 0 !important;
        }

        section:nth-of-type(4) > div {
          padding: 0 17px !important;
        }

        section:nth-of-type(4) > div > div {
          display: block !important;
        }

        section:nth-of-type(4) img {
          height: 310px !important;
        }

        section:nth-of-type(4) > div > div > div:last-child {
          padding: 35px 24px !important;
        }

        /* COMPANY */

        section:nth-of-type(5) {
          padding: 55px 0 !important;
        }

        section:nth-of-type(5) > div {
          padding: 0 17px !important;
        }

        section:nth-of-type(5) > div > div {
          display: block !important;
        }

        section:nth-of-type(5) > div > div > div:first-child {
          padding: 35px 24px !important;
        }

        section:nth-of-type(5) img {
          height: 310px !important;
        }

        /* STEPS */

        section:nth-of-type(6) {
          padding: 55px 0 !important;
        }

        section:nth-of-type(6) > div {
          padding: 0 17px !important;
        }

        section:nth-of-type(6) > div > div:last-child {
          display: block !important;
        }

        section:nth-of-type(6) > div > div:last-child > div {
          margin-bottom: 12px;
        }

        /* CTA */

        section:nth-of-type(7) {
          padding: 0 17px 55px !important;
        }

        section:nth-of-type(7) > div {
          border-radius: 20px !important;
        }

        /* FOOTER */

        footer > div:first-child {
          display: block !important;
          padding: 40px 20px !important;
        }

        footer > div:first-child > div:last-child {
          margin-top: 30px;
          display: flex !important;
          gap: 45px !important;
        }

        footer {
          overflow: hidden;
        }
      }

      @media (max-width: 430px) {

        section:first-of-type h1 {
          font-size: 37px !important;
        }

        section:first-of-type img {
          height: 330px !important;
        }

        section:first-of-type > div > div:last-child > div {
          height: 330px !important;
        }

        section:first-of-type > div > div:last-child > div > div:last-child {
          left: 17px !important;
          bottom: 20px !important;
        }

        section:first-of-type > div > div:last-child > div > div:last-child > div:last-child {
          font-size: 20px !important;
        }

        section:first-of-type > div > div:last-child > div > div:nth-child(3) {
          display: none !important;
        }

        section:nth-of-type(3) h2 {
          font-size: 30px !important;
        }

        section:nth-of-type(4) h2,
        section:nth-of-type(5) h2 {
          font-size: 29px !important;
        }

        section:nth-of-type(7) h2 {
          font-size: 30px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}