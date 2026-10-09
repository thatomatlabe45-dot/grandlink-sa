"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NewInternshipPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [form, setForm] = useState({
    job_title: "",
    province: "",
    location: "",
    internship_type: "Internship",
    stipend: "",
    qualification: "",
    field_of_study: "",
    deadline: "",
    description: "",
    skills: "",
  });

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      // Load the logged-in company's profile.
      const { data: companyData, error: companyError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (companyError) {
        throw new Error(
          "We could not load your company profile. Please try again."
        );
      }

      if (!companyData) {
        setError(
          "Please complete your company profile before posting an internship."
        );
        setLoading(false);
        return;
      }

      setCompany({
        ...companyData,
        user_id: user.id,
      });

      // Verify the company's subscription.
      const { data: subscriptions, error: subscriptionError } =
        await supabase
          .from("company_subscriptions")
          .select("id, plan, status")
          .eq("company_id", user.id);

      if (subscriptionError) {
        throw new Error(
          "We could not verify your active subscription. Please try again."
        );
      }

      const activeSubscription = (subscriptions || []).find(
        (item) =>
          String(item.status || "").toLowerCase() === "active"
      );

      if (!activeSubscription) {
        setError(
          "An active paid subscription is required to post internships. Please view our company plans."
        );
        setLoading(false);
        return;
      }

      setSubscription(activeSubscription);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!company || !subscription) {
      setError(
        "Your company profile or subscription could not be verified."
      );
      return;
    }

    if (
      !form.job_title.trim() ||
      !form.province ||
      !form.location.trim() ||
      !form.qualification.trim() ||
      !form.field_of_study.trim() ||
      !form.deadline ||
      !form.description.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.deadline < new Date().toISOString().slice(0, 10)) {
      setError("The application deadline cannot be in the past.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      // Recheck the subscription immediately before saving.
      const { data: subscriptions, error: subscriptionError } =
        await supabase
          .from("company_subscriptions")
          .select("id, plan, status")
          .eq("company_id", user.id);

      if (subscriptionError) {
        throw new Error(
          "We could not verify your active subscription. Your internship was not posted."
        );
      }

      const activeSubscription = (subscriptions || []).find(
        (item) =>
          String(item.status || "").toLowerCase() === "active"
      );

      if (!activeSubscription) {
        throw new Error(
          "Your subscription is not active. Please check your company plans."
        );
      }

      const internshipData = {
        user_id: user.id,
        job_title: form.job_title.trim(),
        company_name: company.company_name,
        company_email: company.company_email || user.email,
        company_website: company.company_website || "",
        province: form.province,
        location: form.location.trim(),
        internship_type: form.internship_type,
        stipend: form.stipend.trim() || "Not specified",
        qualification: form.qualification.trim(),
        field_of_study: form.field_of_study.trim(),
        deadline: form.deadline,
        description: form.description.trim(),
        skills: form.skills.trim(),
      };

      const { error: insertError } = await supabase
        .from("internships")
        .insert([internshipData]);

      if (insertError) {
        console.error("Internship insert error:", insertError);

        throw new Error(
          "We could not publish your internship. Please check your database permissions and try again."
        );
      }

      setSuccess("Your internship has been published successfully!");

      setTimeout(() => {
        router.push("/company-dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to publish your internship.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d7e0ed",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#172b4d",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#263b59",
  };

  function Field({ label, name, required = false, children }) {
    return (
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor={name} style={labelStyle}>
          {label}
          {required && <span style={{ color: "#dc2626" }}> *</span>}
        </label>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <h2 style={{ marginBottom: 8 }}>Preparing your workspace</h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            Checking your company profile and subscription...
          </p>
        </div>
      </main>
    );
  }

  if (error && (!company || !subscription)) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={{ color: "#172b4d" }}>
            Unable to open internship posting
          </h2>

          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            {error}
          </p>

          <div style={styles.buttonRow}>
            {error.toLowerCase().includes("subscription") ||
            error.toLowerCase().includes("paid subscription") ? (
              <Link href="/company-pricing" style={styles.primaryButton}>
                View Company Plans
              </Link>
            ) : (
              <button
                onClick={checkAccess}
                style={styles.primaryButton}
              >
                Try Again
              </button>
            )}

            <Link href="/company-dashboard" style={styles.secondaryButton}>
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <Link href="/company-dashboard" style={styles.brand}>
          <span style={styles.brandIcon}>G</span>
          <span>
            <strong>GradLink</strong>
            <small> SOUTH AFRICA</small>
          </span>
        </Link>

        <Link href="/company-dashboard" style={styles.backLink}>
          ← Dashboard
        </Link>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroBadge}>COMPANY RECRUITMENT</div>

        <h1 style={styles.title}>Post an internship</h1>

        <p style={styles.subtitle}>
          Connect your organisation with talented South African graduates.
          Create a clear opportunity and start finding your next candidate.
        </p>

        <div style={styles.trustRow}>
          <span>✓ Verified company access</span>
          <span>✓ Graduate applications</span>
          <span>✓ Candidate matching</span>
        </div>
      </section>

      <div style={styles.content}>
        <aside style={styles.sidePanel}>
          <div style={styles.planIcon}>✓</div>

          <h3>Subscription active</h3>

          <p>
            Your company is ready to publish internship opportunities.
          </p>

          <div style={styles.planDivider} />

          <span style={styles.smallLabel}>CURRENT PLAN</span>

          <strong style={styles.planName}>
            {subscription?.plan || "Company plan"}
          </strong>

          <span style={styles.activeStatus}>● Active</span>

          <div style={styles.tipBox}>
            <strong>Make your listing stand out</strong>
            <p>
              Include the qualification requirements, responsibilities,
              application deadline and skills candidates need.
            </p>
          </div>
        </aside>

        <section style={styles.formCard}>
          <div style={styles.formHeading}>
            <div>
              <h2>Internship details</h2>
              <p>Fields marked with * are required.</p>
            </div>
            <span style={styles.secureTag}>Secure posting</span>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successMessage}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Internship title" name="job_title" required>
              <input
                id="job_title"
                name="job_title"
                value={form.job_title}
                onChange={updateField}
                placeholder="e.g. Software Development Intern"
                style={inputStyle}
                maxLength={150}
                required
              />
            </Field>

            <div style={styles.twoColumns}>
              <Field label="Province" name="province" required>
                <select
                  id="province"
                  name="province"
                  value={form.province}
                  onChange={updateField}
                  style={inputStyle}
                  required
                >
                  <option value="">Select province</option>
                  <option>Eastern Cape</option>
                  <option>Free State</option>
                  <option>Gauteng</option>
                  <option>KwaZulu-Natal</option>
                  <option>Limpopo</option>
                  <option>Mpumalanga</option>
                  <option>North West</option>
                  <option>Northern Cape</option>
                  <option>Western Cape</option>
                  <option>Remote</option>
                </select>
              </Field>

              <Field label="City or work location" name="location" required>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="e.g. Johannesburg"
                  style={inputStyle}
                  required
                />
              </Field>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Opportunity type" name="internship_type" required>
                <select
                  id="internship_type"
                  name="internship_type"
                  value={form.internship_type}
                  onChange={updateField}
                  style={inputStyle}
                  required
                >
                  <option value="Internship">Internship</option>
                  <option value="Graduate Programme">Graduate Programme</option>
                  <option value="Learnership">Learnership</option>
                  <option value="Work Experience">Work Experience</option>
                  <option value="Remote Internship">Remote Internship</option>
                </select>
              </Field>

              <Field label="Stipend or salary" name="stipend">
                <input
                  id="stipend"
                  name="stipend"
                  value={form.stipend}
                  onChange={updateField}
                  placeholder="e.g. R5,000 per month"
                  style={inputStyle}
                  maxLength={100}
                />
              </Field>
            </div>

            <Field label="Minimum qualification" name="qualification" required>
              <input
                id="qualification"
                name="qualification"
                value={form.qualification}
                onChange={updateField}
                placeholder="e.g. Diploma, Degree or N6"
                style={inputStyle}
                required
                maxLength={200}
              />
            </Field>

            <Field label="Field of study" name="field_of_study" required>
              <input
                id="field_of_study"
                name="field_of_study"
                value={form.field_of_study}
                onChange={updateField}
                placeholder="e.g. Information Technology"
                style={inputStyle}
                required
                maxLength={200}
              />
            </Field>

            <Field label="Application deadline" name="deadline" required>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={updateField}
                min={new Date().toISOString().slice(0, 10)}
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Required skills" name="skills">
              <textarea
                id="skills"
                name="skills"
                value={form.skills}
                onChange={updateField}
                placeholder="e.g. Microsoft Excel, communication, Python, teamwork"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
                maxLength={2000}
              />
              <small style={styles.helperText}>
                Separate skills with commas to help graduates understand
                what you are looking for.
              </small>
            </Field>

            <Field label="Internship description and responsibilities" name="description" required>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Describe the opportunity, responsibilities, requirements and how the successful candidate will learn and contribute..."
                rows={7}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
                required
                maxLength={10000}
              />
            </Field>

            <div style={styles.formFooter}>
              <p>
                By publishing, you confirm that the opportunity details
                are accurate and that your organisation is authorised to
                advertise this opportunity.
              </p>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.publishButton,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? "Publishing internship..." : "Publish Internship →"}
              </button>

              <Link
                href="/company-dashboard"
                style={styles.cancelLink}
              >
                Cancel and return to dashboard
              </Link>
            </div>
          </form>
        </section>
      </div>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} GradLink SA · Connecting graduates
        with opportunity.
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7fc",
    color: "#172b4d",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: 40,
  },

  header: {
    minHeight: 76,
    padding: "14px clamp(18px, 5vw, 64px)",
    background: "#ffffff",
    borderBottom: "1px solid #e6edf6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#123b77",
    textDecoration: "none",
    fontSize: 19,
  },

  brandIcon: {
    display: "grid",
    placeItems: "center",
    width: 42,
    height: 42,
    borderRadius: 13,
    color: "#ffffff",
    background: "linear-gradient(135deg, #1262d6, #073779)",
    fontSize: 23,
    fontWeight: 900,
  },

  backLink: {
    color: "#1758ad",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
  },

  hero: {
    padding: "48px 20px 35px",
    textAlign: "center",
    color: "#ffffff",
    background:
      "radial-gradient(circle at 85% 10%, #2878df 0, transparent 35%), linear-gradient(125deg, #092b5d, #1156a8)",
  },

  heroBadge: {
    display: "inline-block",
    padding: "8px 13px",
    border: "1px solid rgba(255,255,255,.3)",
    borderRadius: 30,
    color: "#e3efff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.3,
  },

  title: {
    fontSize: "clamp(30px, 5vw, 43px)",
    lineHeight: 1.15,
    margin: "19px 0 12px",
    fontWeight: 850,
  },

  subtitle: {
    maxWidth: 670,
    margin: "0 auto",
    color: "#dbeafe",
    lineHeight: 1.8,
    fontSize: 15,
  },

  trustRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px 24px",
    marginTop: 23,
    fontSize: 12,
    color: "#e8f2ff",
  },

  content: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "32px auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)",
    alignItems: "start",
    gap: 22,
  },

  sidePanel: {
    padding: 24,
    borderRadius: 18,
    background: "#ffffff",
    border: "1px solid #e1eaf5",
    boxShadow: "0 8px 28px rgba(20, 50, 90, .045)",
  },

  planIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#e3f7ee",
    color: "#087443",
    fontSize: 23,
    fontWeight: 900,
  },

  planDivider: {
    height: 1,
    background: "#e8eef6",
    margin: "21px 0",
  },

  smallLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#71839c",
    marginBottom: 7,
  },

  planName: {
    display: "block",
    fontSize: 19,
    marginBottom: 10,
    overflowWrap: "anywhere",
  },

  activeStatus: {
    display: "inline-block",
    borderRadius: 30,
    background: "#e4f8ed",
    color: "#087443",
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
  },

  tipBox: {
    background: "#f0f6ff",
    border: "1px solid #dbe9ff",
    borderRadius: 13,
    padding: 16,
    marginTop: 24,
    lineHeight: 1.7,
    fontSize: 13,
    color: "#38516f",
  },

  formCard: {
    minWidth: 0,
    padding: "clamp(18px, 4vw, 34px)",
    background: "#ffffff",
    border: "1px solid #e1eaf5",
    borderRadius: 18,
    boxShadow: "0 8px 28px rgba(20, 50, 90, .045)",
  },

  formHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    paddingBottom: 22,
    marginBottom: 24,
    borderBottom: "1px solid #e8eef6",
  },

  secureTag: {
    background: "#edf5ff",
    color: "#1758ad",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 800,
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  helperText: {
    display: "block",
    marginTop: 7,
    color: "#72839a",
    fontSize: 12,
    lineHeight: 1.6,
  },

  formFooter: {
    borderTop: "1px solid #e8eef6",
    paddingTop: 20,
    marginTop: 8,
  },

  publishButton: {
    width: "100%",
    border: 0,
    borderRadius: 11,
    padding: "16px 18px",
    background: "linear-gradient(120deg, #1767d8, #104797)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    boxShadow: "0 7px 18px rgba(23, 103, 216, .2)",
  },

  cancelLink: {
    display: "block",
    textAlign: "center",
    marginTop: 17,
    fontSize: 13,
    color: "#526781",
    textDecoration: "none",
  },

  errorMessage: {
    background: "#fff1f1",
    border: "1px solid #fecaca",
    color: "#b42318",
    padding: 13,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },

  successMessage: {
    background: "#e9f9f0",
    border: "1px solid #b7ebcb",
    color: "#087443",
    padding: 13,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },

  loadingCard: {
    width: "min(480px, calc(100% - 36px))",
    margin: "12vh auto",
    background: "#ffffff",
    border: "1px solid #e1eaf5",
    borderRadius: 18,
    padding: "34px 24px",
    textAlign: "center",
    boxShadow: "0 12px 40px rgba(20, 50, 90, .08)",
    lineHeight: 1.7,
  },

  spinner: {
    width: 36,
    height: 36,
    margin: "0 auto 20px",
    border: "4px solid #dbeafe",
    borderTop: "4px solid #1767d8",
    borderRadius: "50%",
    animation: "gradlinkSpin 1s linear infinite",
  },

  errorIcon: {
    display: "grid",
    placeItems: "center",
    width: 46,
    height: 46,
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#fff1f1",
    color: "#b42318",
    fontSize: 24,
    fontWeight: 900,
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 22,
  },

  primaryButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#1459b5",
    color: "#ffffff",
    textDecoration: "none",
    border: 0,
    fontSize: 14,
    fontWeight: 800,
  },

  secondaryButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#eff4fa",
    color: "#254263",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
  },

  footer: {
    textAlign: "center",
    padding: "0 20px",
    color: "#75859b",
    fontSize: 12,
  },
};
