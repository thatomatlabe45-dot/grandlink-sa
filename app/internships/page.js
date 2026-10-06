"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InternshipPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    company_email: "",
    company_website: "",
    province: "",
    location: "",
    internship_type: "",
    stipend: "",
    qualification: "",
    field_of_study: "",
    deadline: "",
    description: "",
    skills: "",
  });

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setLoadingCompany(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: company, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!company) {
        setErrorMessage(
          "No company profile was found. Please complete your company profile first."
        );
        return;
      }

      setForm((prev) => ({
        ...prev,
        company_name: company.company_name || "",
        company_email: company.email || "",
        company_website: company.website || "",
      }));
    } catch (err) {
      console.error("Load company error:", err);

      setErrorMessage(
        err.message || "Could not load your company information."
      );
    } finally {
      setLoadingCompany(false);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const internshipData = {
        user_id: user.id,
        company_name: form.company_name,
        company_email: form.company_email,
        company_website: form.company_website,
        job_title: form.job_title,
        province: form.province,
        location: form.location,
        internship_type: form.internship_type,
        stipend: form.stipend,
        qualification: form.qualification,
        field_of_study: form.field_of_study,
        deadline: form.deadline,
        description: form.description,
        skills: form.skills,
      };

      const { error } = await supabase
        .from("internships")
        .insert([internshipData]);

      if (error) {
        throw error;
      }

      setMessage(
        "🎉 Internship posted successfully! Returning to your dashboard..."
      );

      setForm((prev) => ({
        job_title: "",
        company_name: prev.company_name,
        company_email: prev.company_email,
        company_website: prev.company_website,
        province: "",
        location: "",
        internship_type: "",
        stipend: "",
        qualification: "",
        field_of_study: "",
        deadline: "",
        description: "",
        skills: "",
      }));

      setTimeout(() => {
        router.push("/company-dashboard");
      }, 1200);
    } catch (err) {
      console.error("Post internship error:", err);

      setErrorMessage(
        err.message || "Could not publish the internship."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loadingCompany) {
    return (
      <>
        <SiteHeader />

        <main style={styles.loadingPage}>
          <div style={styles.loadingBox}>
            <div style={styles.loadingIcon}>💼</div>

            <h2 style={styles.loadingTitle}>
              Loading Internship Form...
            </h2>

            <p style={styles.loadingText}>
              Preparing your company information
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main style={styles.page}>
        <div style={styles.container}>

          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => router.push("/company-dashboard")}
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>

          {/* MAIN FORM */}
          <section style={styles.card}>

            <div style={styles.headingArea}>
              <div style={styles.eyebrow}>
                GRADLINK SA • COMPANY PORTAL
              </div>

              <h1 style={styles.title}>
                Post an Internship
              </h1>

              <p style={styles.subtitle}>
                Reach talented South African graduates
                through GradLink SA.
              </p>
            </div>

            {/* SUCCESS */}
            {message && (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>

                <div>
                  <strong>Internship Published</strong>

                  <p style={styles.alertText}>
                    {message}
                  </p>
                </div>
              </div>
            )}

            {/* ERROR */}
            {errorMessage && (
              <div style={styles.errorBox}>
                <div style={styles.errorIcon}>!</div>

                <div>
                  <strong>Unable to continue</strong>

                  <p style={styles.alertText}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* BASIC INFORMATION */}
              <div style={styles.sectionHeader}>
                <span>01</span>

                <div>
                  <h2>Internship Details</h2>
                  <p>
                    Tell graduates about the opportunity.
                  </p>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Internship Title
                </label>

                <input
                  style={inputStyle}
                  name="job_title"
                  placeholder="e.g. Software Development Intern"
                  value={form.job_title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* COMPANY INFORMATION */}
              <div style={styles.sectionHeader}>
                <span>02</span>

                <div>
                  <h2>Company Information</h2>
                  <p>
                    This information comes from your company profile.
                  </p>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Company Name
                </label>

                <input
                  style={readOnlyInputStyle}
                  value={form.company_name}
                  readOnly
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Company Email
                </label>

                <input
                  style={readOnlyInputStyle}
                  value={form.company_email}
                  readOnly
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Company Website
                </label>

                <input
                  style={readOnlyInputStyle}
                  value={form.company_website}
                  readOnly
                />
              </div>

              {/* LOCATION */}
              <div style={styles.sectionHeader}>
                <span>03</span>

                <div>
                  <h2>Location & Work Type</h2>
                  <p>
                    Help candidates understand where they will work.
                  </p>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Province
                </label>

                <select
                  style={inputStyle}
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Province
                  </option>

                  <option>Eastern Cape</option>
                  <option>Free State</option>
                  <option>Gauteng</option>
                  <option>KwaZulu-Natal</option>
                  <option>Limpopo</option>
                  <option>Mpumalanga</option>
                  <option>North West</option>
                  <option>Northern Cape</option>
                  <option>Western Cape</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Location
                </label>

                <input
                  style={inputStyle}
                  name="location"
                  placeholder="City / Town"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Work Type
                </label>

                <select
                  style={inputStyle}
                  name="internship_type"
                  value={form.internship_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Work Type
                  </option>

                  <option>On-site</option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                </select>
              </div>

              {/* REQUIREMENTS */}
              <div style={styles.sectionHeader}>
                <span>04</span>

                <div>
                  <h2>Candidate Requirements</h2>
                  <p>
                    Define who you are looking for.
                  </p>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Required Qualification
                </label>

                <input
                  style={inputStyle}
                  name="qualification"
                  placeholder="e.g. BSc Computer Science"
                  value={form.qualification}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Field of Study
                </label>

                <input
                  style={inputStyle}
                  name="field_of_study"
                  placeholder="e.g. Information Technology"
                  value={form.field_of_study}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Required Skills
                </label>

                <textarea
                  style={textareaStyle}
                  rows={4}
                  name="skills"
                  placeholder="e.g. JavaScript, React, Excel, Communication"
                  value={form.skills}
                  onChange={handleChange}
                />
              </div>

              {/* OPPORTUNITY */}
              <div style={styles.sectionHeader}>
                <span>05</span>

                <div>
                  <h2>Opportunity Information</h2>
                  <p>
                    Give graduates the information they need.
                  </p>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Monthly Stipend
                </label>

                <input
                  style={inputStyle}
                  name="stipend"
                  placeholder="e.g. R7,000 per month"
                  value={form.stipend}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Application Deadline
                </label>

                <input
                  style={inputStyle}
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Internship Description
                </label>

                <textarea
                  style={textareaLargeStyle}
                  rows={7}
                  name="description"
                  placeholder="Describe the internship, responsibilities, learning opportunities and what the successful candidate will be doing."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* SUBMIT */}
              <div style={styles.submitArea}>
                <div style={styles.secureText}>
                  🔒 Your internship will be published
                  securely on GradLink SA.
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.company_name}
                  style={{
                    ...styles.submitButton,
                    background:
                      loading || !form.company_name
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    cursor:
                      loading || !form.company_name
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loading
                    ? "Publishing..."
                    : "🚀 Publish Internship"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: "52px",
  padding: "14px 15px",
  border: "1px solid #cbd5e1",
  borderRadius: "11px",
  fontSize: "15px",
  color: "#0f172a",
  background: "#ffffff",
  boxSizing: "border-box",
  outline: "none",
};

const readOnlyInputStyle = {
  ...inputStyle,
  background: "#f8fafc",
  color: "#64748b",
  borderColor: "#e2e8f0",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical",
  lineHeight: 1.6,
};

const textareaLargeStyle = {
  ...inputStyle,
  minHeight: "170px",
  resize: "vertical",
  lineHeight: 1.6,
};

const styles = {
  loadingPage: {
    minHeight: "calc(100vh - 72px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 16px",
    background:
      "linear-gradient(135deg, #f5f9ff 0%, #eef5ff 50%, #ffffff 100%)",
    boxSizing: "border-box",
  },

  loadingBox: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "38px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 18px 50px rgba(15,23,42,0.09)",
    border: "1px solid #dbe5f0",
    boxSizing: "border-box",
  },

  loadingIcon: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  loadingTitle: {
    color: "#0f172a",
    margin: "0 0 8px",
    fontSize: "21px",
  },

  loadingText: {
    color: "#64748b",
    margin: 0,
    fontSize: "14px",
  },

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f5f9ff 0%, #eef5ff 50%, #ffffff 100%)",
    padding: "28px 16px 70px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
  },

  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#ffffff",
    color: "#2563eb",
    border: "1px solid #dbe5f0",
    padding: "11px 16px",
    borderRadius: "10px",
    fontWeight: "750",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "18px",
    boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: "22px",
    padding: "34px",
    boxShadow: "0 20px 55px rgba(15,23,42,0.09)",
    boxSizing: "border-box",
  },

  headingArea: {
    marginBottom: "32px",
  },

  eyebrow: {
    display: "inline-block",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "850",
    letterSpacing: "1px",
    marginBottom: "9px",
  },

  title: {
    margin: "0 0 9px",
    color: "#0f172a",
    fontSize: "32px",
    fontWeight: "850",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "21px 0 17px",
    marginTop: "5px",
    borderTop: "1px solid #eef2f7",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "22px 0 17px",
    marginTop: "5px",
    borderTop: "1px solid #eef2f7",
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "750",
  },

  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "22px",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  successIcon: {
    width: "23px",
    height: "23px",
    minWidth: "23px",
    borderRadius: "50%",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "22px",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  errorIcon: {
    width: "23px",
    height: "23px",
    minWidth: "23px",
    borderRadius: "50%",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  alertText: {
    margin: "4px 0 0",
    lineHeight: 1.5,
  },

  submitArea: {
    marginTop: "28px",
    paddingTop: "24px",
    borderTop: "1px solid #eef2f7",
  },

  secureText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "13px",
  },

  submitButton: {
    width: "100%",
    minHeight: "54px",
    border: "none",
    borderRadius: "12px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    boxShadow: "0 9px 24px rgba(37,99,235,0.22)",
  },
};