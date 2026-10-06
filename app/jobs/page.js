"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data);
    }

    setLoading(false);
  }

  return (
    <>
      <SiteHeader />

      <main style={styles.page}>
        <div style={styles.container}>

          {/* HERO */}
          <section style={styles.hero}>
            <div style={styles.eyebrow}>
              GRADLINK SA • OPPORTUNITIES
            </div>

            <h1 style={styles.title}>
              Find Your Next
              <span style={styles.titleBlue}>
                {" "}Opportunity
              </span>
            </h1>

            <p style={styles.subtitle}>
              Explore internship opportunities from
              companies across South Africa and take
              the next step in your career.
            </p>

            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>{jobs.length}</strong>
                <span>Opportunities</span>
              </div>

              <div style={styles.statDivider}></div>

              <div style={styles.stat}>
                <strong>🇿🇦</strong>
                <span>South Africa</span>
              </div>

              <div style={styles.statDivider}></div>

              <div style={styles.stat}>
                <strong>🎓</strong>
                <span>Graduate Focused</span>
              </div>
            </div>
          </section>

          {/* CONTENT HEADER */}
          <div style={styles.contentHeader}>
            <div>
              <div style={styles.sectionEyebrow}>
                LATEST LISTINGS
              </div>

              <h2 style={styles.sectionTitle}>
                Available Internships
              </h2>
            </div>

            <Link
              href="/internships"
              style={styles.companyLink}
            >
              Are you a company?
              <span> Post an Internship →</span>
            </Link>
          </div>

          {/* LOADING */}
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.loadingIcon}>
                💼
              </div>

              <h3 style={styles.loadingTitle}>
                Loading opportunities...
              </h3>

              <p style={styles.loadingText}>
                Finding the latest internships for you.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            /* EMPTY STATE */
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>
                🔎
              </div>

              <h3 style={styles.emptyTitle}>
                No internships available yet
              </h3>

              <p style={styles.emptyText}>
                New opportunities will appear here as
                companies begin posting on GradLink SA.
              </p>

              <Link
                href="/signup"
                style={styles.emptyButton}
              >
                Create Your Graduate Account
              </Link>
            </div>
          ) : (
            /* JOB GRID */
            <div style={styles.grid}>
              {jobs.map((job) => (
                <article
                  key={job.id}
                  style={styles.jobCard}
                >
                  <div>

                    {/* CARD TOP */}
                    <div style={styles.cardTop}>
                      <div style={styles.companyIcon}>
                        {job.company_name
                          ? job.company_name
                              .charAt(0)
                              .toUpperCase()
                          : "G"}
                      </div>

                      <div style={styles.typeBadge}>
                        {job.internship_type ||
                          "Internship"}
                      </div>
                    </div>

                    {/* TITLE */}
                    <h2 style={styles.jobTitle}>
                      {job.job_title}
                    </h2>

                    <p style={styles.companyName}>
                      🏢 {job.company_name}
                    </p>

                    {/* DETAILS */}
                    <div style={styles.details}>

                      <div style={styles.detail}>
                        <span style={styles.detailIcon}>
                          📍
                        </span>

                        <div>
                          <small>Location</small>
                          <strong>
                            {job.location ||
                              job.province ||
                              "South Africa"}
                          </strong>
                        </div>
                      </div>

                      <div style={styles.detail}>
                        <span style={styles.detailIcon}>
                          🎓
                        </span>

                        <div>
                          <small>Qualification</small>
                          <strong>
                            {job.qualification ||
                              "Graduate"}
                          </strong>
                        </div>
                      </div>

                      <div style={styles.detail}>
                        <span style={styles.detailIcon}>
                          💰
                        </span>

                        <div>
                          <small>Stipend</small>
                          <strong>
                            {job.stipend ||
                              "Not specified"}
                          </strong>
                        </div>
                      </div>

                    </div>

                    {/* DESCRIPTION */}
                    <p style={styles.description}>
                      {job.description?.length > 145
                        ? job.description.substring(
                            0,
                            145
                          ) + "..."
                        : job.description ||
                          "Explore this internship opportunity on GradLink SA."}
                    </p>
                  </div>

                  {/* BUTTON */}
                  <Link
                    href={`/jobs/${job.id}`}
                    style={styles.viewButton}
                  >
                    View Internship
                    <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* BOTTOM CTA */}
          {!loading && (
            <section style={styles.bottomCta}>
              <div>
                <div style={styles.ctaEyebrow}>
                  START YOUR CAREER JOURNEY
                </div>

                <h2 style={styles.ctaTitle}>
                  Your next opportunity
                  could be here.
                </h2>

                <p style={styles.ctaText}>
                  Create your free graduate profile
                  and start discovering opportunities
                  built for South African graduates.
                </p>
              </div>

              <Link
                href="/signup"
                style={styles.ctaButton}
              >
                Create Free Profile →
              </Link>
            </section>
          )}

        </div>
      </main>

      <SiteFooter />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f5f9ff 0%, #eef5ff 48%, #ffffff 100%)",
    padding: "40px 16px 70px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  hero: {
    textAlign: "center",
    padding: "25px 10px 45px",
  },

  eyebrow: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "850",
    letterSpacing: "1.2px",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "clamp(34px, 6vw, 52px)",
    lineHeight: 1.08,
    fontWeight: "900",
    letterSpacing: "-1.5px",
  },

  titleBlue: {
    color: "#2563eb",
  },

  subtitle: {
    maxWidth: "650px",
    margin: "17px auto 28px",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.7,
  },

  heroStats: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "22px",
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "15px",
    padding: "13px 20px",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.06)",
  },

  stat: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  statDivider: {
    width: "1px",
    height: "28px",
    background: "#e2e8f0",
  },

  contentHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "27px",
    fontWeight: "850",
    letterSpacing: "-0.5px",
  },

  companyLink: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "650",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  jobCard: {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "19px",
    padding: "22px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "390px",
    boxSizing: "border-box",
    transition: "transform 0.2s ease",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "17px",
  },

  companyIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #dbeafe, #eff6ff)",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
  },

  typeBadge: {
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "10px",
    fontWeight: "800",
  },

  jobTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "20px",
    lineHeight: 1.25,
    fontWeight: "850",
  },

  companyName: {
    margin: "0 0 19px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "650",
  },

  details: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "17px",
  },

  detail: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  detailIcon: {
    width: "27px",
    height: "27px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    borderRadius: "8px",
    fontSize: "13px",
    flexShrink: 0,
  },

  detail: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  description: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  viewButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "20px",
    padding: "13px 15px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.18)",
  },

  loadingBox: {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "19px",
    padding: "55px 20px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.06)",
  },

  loadingIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  loadingTitle: {
    margin: "0 0 7px",
    color: "#0f172a",
    fontSize: "20px",
  },

  loadingText: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  emptyBox: {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "19px",
    padding: "60px 20px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.06)",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "21px",
  },

  emptyText: {
    maxWidth: "480px",
    margin: "0 auto 22px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  emptyButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "800",
  },

  bottomCta: {
    marginTop: "55px",
    padding: "30px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #0f3f91, #2563eb)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    boxShadow:
      "0 18px 40px rgba(37,99,235,0.20)",
    boxSizing: "border-box",
  },

  ctaEyebrow: {
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "1px",
    opacity: 0.8,
    marginBottom: "7px",
  },

  ctaTitle: {
    margin: "0 0 7px",
    fontSize: "24px",
    fontWeight: "850",
    letterSpacing: "-0.4px",
  },

  ctaText: {
    margin: 0,
    maxWidth: "570px",
    color: "#dbeafe",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  ctaButton: {
    flexShrink: 0,
    padding: "13px 18px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "850",
    boxShadow:
      "0 7px 18px rgba(0,0,0,0.12)",
  },
};

