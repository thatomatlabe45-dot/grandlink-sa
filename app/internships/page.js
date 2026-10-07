"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { supabase } from "../lib/supabase";

export default function PostInternshipPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_website: "",
    job_title: "",
    province: "",
    location: "",
    internship_type: "On-site",
    stipend: "",
    qualification: "",
    field_of_study: "",
    deadline: "",
    description: "",
    skills: "",
  });

  useEffect(() => {
    checkCompanyAccess();
  }, []);

  async function checkCompanyAccess() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Check the selected GradLink profile
      const profile = localStorage.getItem("gradlink_profile");

      if (profile === "graduate") {
        router.replace("/graduate");
        return;
      }

      // A company profile must exist before an internship can be posted
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
        // If this is a company account that has not paid yet,
        // send them to pricing.
        if (profile === "company") {
          router.replace("/company-pricing");
          return;
        }

        setError(
          "Only verified company accounts can post internships."
        );
        setLoading(false);
        return;
      }

      // Check for an active paid subscription
      const { data: subscriptions, error: subscriptionError } =
        await supabase
          .from("company_subscriptions")
          .select("company_id,status")
          .eq("company_id", user.id)
          .ilike("status", "active")
          .limit(1);

      if (subscriptionError) {
        throw subscriptionError;
      }

      if (!subscriptions || subscriptions.length === 0) {
        router.replace("/company-pricing");
        return;
      }

      // Load company information into the form
      setForm((current) => ({
        ...current,
        company_name: company.company_name || "",
        company_email: user.email || "",
        company_website: company.website || "",
      }));

      setLoading(false);
    } catch (err) {
      console.error("Access check error:", err);
      setError(
        err?.message ||
          "Something went wrong while checking your company account."
      );
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Final security check before inserting
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("company_name,website")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
        router.replace("/company-pricing");
        return;
      }

      const { data: subscriptions, error: subscriptionError } =
        await supabase
          .from("company_subscriptions")
          .select("company_id,status")
          .eq("company_id", user.id)
          .ilike("status", "active")
          .limit(1);

      if (subscriptionError) {
        throw subscriptionError;
      }

      if (!subscriptions || subscriptions.length === 0) {
        router.replace("/company-pricing");
        return;
      }

      if (!form.job_title.trim()) {
        setError("Please enter the internship title.");
        setSubmitting(false);
        return;
      }

      if (!form.province.trim()) {
        setError("Please select a province.");
        setSubmitting(false);
        return;
      }

      if (!form.location.trim()) {
        setError("Please enter the internship location.");
        setSubmitting(false);
        return;
      }

      if (!form.qualification.trim()) {
        setError("Please enter the required qualification.");
        setSubmitting(false);
        return;
      }

      if (!form.field_of_study.trim()) {
        setError("Please enter the field of study.");
        setSubmitting(false);
        return;
      }

      if (!form.description.trim()) {
        setError("Please provide an internship description.");
        setSubmitting(false);
        return;
      }

      const internshipData = {
        user_id: user.id,
        company_name: company.company_name || form.company_name,
        company_email: user.email || form.company_email,
        company_website: company.website || form.company_website,
        job_title: form.job_title.trim(),
        province: form.province,
        location: form.location.trim(),
        internship_type: form.internship_type,
        stipend: form.stipend.trim(),
        qualification: form.qualification.trim(),
        field_of_study: form.field_of_study.trim(),
        deadline: form.deadline || null,
        description: form.description.trim(),
        skills: form.skills.trim(),
      };

      const { error: insertError } = await supabase
        .from("internships")
        .insert([internshipData]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Internship published successfully!");

      setTimeout(() => {
        router.push("/company-dashboard");
      }, 1200);
    } catch (err) {
      console.error("Post internship error:", err);
      setError(
        err?.message ||
          "Unable to publish the internship. Please try again."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />

        <main style={styles.loadingPage}>
          <div style={styles.loader}></div>
          <h2 style={styles.loadingTitle}>Checking your company account</h2>
          <p style={styles.loadingText}>
            Please wait while we verify your subscription.
          </p>
        </main>

        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroGlow}></div>

          <div style={styles.heroInner}>
            <Link href="/company-dashboard" style={styles.backLink}>
              ← Back to Dashboard
            </Link>

            <div style={styles.badge}>COMPANY HIRING</div>

            <h1 style={styles.heroTitle}>
              List an <span style={styles.heroAccent}>Internship</span>
            </h1>

            <p style={styles.heroText}>
              Connect your company with talented South African graduates
              looking for meaningful career opportunities.
            </p>
          </div>
        </section>

        <section style={styles.formSection}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.errorBox}>
                <strong>Unable to continue</strong>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successBox}>
                <strong>✓ Internship published</strong>
                <span>{success}</span>
              </div>
            )}

            {/* 01 */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNumber}>01</span>
                <div>
                  <h2 style={styles.sectionTitle}>Internship Details</h2>
                  <p style={styles.sectionSubtitle}>
                    Tell graduates about the opportunity.
                  </p>
                </div>
              </div>

              <div style={styles.grid}>
                <Field
                  label="Internship Title"
                  name="job_title"
                  value={form.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Software Development Intern"
                  required
                  full
                />

                <SelectField
                  label="Province"
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  required
                  options={[
                    "Gauteng",
                    "Western Cape",
                    "KwaZulu-Natal",
                    "Eastern Cape",
                    "Free State",
                    "Limpopo",
                    "Mpumalanga",
                    "North West",
                    "Northern Cape",
                  ]}
                />

                <Field
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Johannesburg, Gauteng"
                  required
                />

                <SelectField
                  label="Work Arrangement"
                  name="internship_type"
                  value={form.internship_type}
                  onChange={handleChange}
                  options={[
                    "On-site",
                    "Hybrid",
                    "Remote",
                  ]}
                />
              </div>
            </div>

            {/* 02 */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNumber}>02</span>
                <div>
                  <h2 style={styles.sectionTitle}>Candidate Requirements</h2>
                  <p style={styles.sectionSubtitle}>
                    Help graduates understand who you are looking for.
                  </p>
                </div>
              </div>

              <div style={styles.grid}>
                <Field
                  label="Minimum Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  placeholder="e.g. Diploma / Degree"
                  required
                />

                <Field
                  label="Field of Study"
                  name="field_of_study"
                  value={form.field_of_study}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  required
                />

                <Field
                  label="Key Skills"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, Excel, Communication"
                  full
                />
              </div>
            </div>
            
             heroInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "70px 24px 80px",
    position: "relative",
    zIndex: 2,
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "20px",
  },

  heroTitle: {
    margin: "0",
    maxWidth: "800px",
    fontSize: "clamp(34px, 6vw, 58px)",
    lineHeight: "1.05",
    letterSpacing: "-1.8px",
    fontWeight: "900",
    color: "#ffffff",
  },

  heroText: {
    margin: "20px 0 0",
    maxWidth: "680px",
    fontSize: "18px",
    lineHeight: "1.7",
    color: "rgba(255,255,255,0.88)",
  },

  searchSection: {
    maxWidth: "1200px",
    margin: "-34px auto 0",
    padding: "0 24px",
    position: "relative",
    zIndex: 5,
  },

  searchBox: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.14)",
    border: "1px solid #e5e7eb",
  },

  searchGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr auto",
    gap: "12px",
    alignItems: "center",
  },

  input: {
    width: "100%",
    minHeight: "50px",
    padding: "0 16px",
    borderRadius: "12px",
    border: "1px solid #dbe2ea",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#f8fafc",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    minHeight: "50px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #dbe2ea",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#f8fafc",
    boxSizing: "border-box",
  },

  searchButton: {
    minHeight: "50px",
    padding: "0 24px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "55px 24px 80px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: "0",
    fontSize: "28px",
    lineHeight: "1.2",
    fontWeight: "850",
    color: "#0f172a",
    letterSpacing: "-0.7px",
  },

  sectionText: {
    margin: "8px 0 0",
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#64748b",
  },

  resultsCount: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  internshipGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "20px",
  },

  internshipCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    minWidth: "0",
  },

  companyRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  companyLogo: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "17px",
    flexShrink: 0,
  },

  companyName: {
    margin: "0",
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },

  internshipTitle: {
    margin: "0 0 12px",
    fontSize: "20px",
    lineHeight: "1.3",
    fontWeight: "850",
    color: "#0f172a",
  },

  metaList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "18px",
  },

  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 10px",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
    border: "1px solid #e2e8f0",
  },

  description: {
    margin: "0 0 20px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.65",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    paddingTop: "16px",
    borderTop: "1px solid #eef2f7",
  },

  deadline: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
  },

  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  emptyState: {
    textAlign: "center",
    padding: "65px 24px",
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "20px",
  },

  emptyIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 16px",
    borderRadius: "16px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "21px",
    fontWeight: "850",
    color: "#0f172a",
  },

  emptyText: {
    margin: "0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  loading: {
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "700",
  },

  footerCta: {
    marginTop: "65px",
    padding: "45px 30px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "1px solid #bfdbfe",
    textAlign: "center",
  },

  footerCtaTitle: {
    margin: "0 0 10px",
    fontSize: "28px",
    fontWeight: "900",
    color: "#0f172a",
  },

  footerCtaText: {
    maxWidth: "620px",
    margin: "0 auto 22px",
    color: "#475569",
    fontSize: "15px",
    lineHeight: "1.65",
  },

  footerButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "0 22px",
    borderRadius: "11px",
    background: "#0f172a",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
  },

  responsive: `
    @media (max-width: 1000px) {
      .internship-search-grid {
        grid-template-columns: 1fr 1fr;
      }

      .internship-search-button {
        width: 100%;
      }

      .internship-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 650px) {
      .internship-hero-inner {
        padding: 48px 18px 65px;
      }

      .internship-search-section {
        padding: 0 16px;
      }

      .internship-search-box {
        padding: 14px;
        border-radius: 18px;
      }

      .internship-search-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .internship-content {
        padding: 42px 16px 60px;
      }

      .internship-section-header {
        display: block;
      }

      .internship-results-count {
        margin-top: 8px;
      }

      .internship-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .internship-card {
        padding: 18px;
        border-radius: 17px;
      }

      .internship-card-footer {
        align-items: stretch;
      }

      .internship-view-button {
        flex: 1;
      }

      .internship-footer-cta {
        margin-top: 45px;
        padding: 35px 20px;
        border-radius: 20px;
      }

      .internship-footer-title {
        font-size: 24px;
      }
    }
  `,
};