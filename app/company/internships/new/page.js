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
        throw new Error(
          "Please complete your company profile before posting an internship."
        );
      }

      setCompany({
        ...companyData,
        user_id: user.id,
        login_email: user.email,
      });

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
        throw new Error(
          "An active paid subscription is required to post internships."
        );
      }

      setSubscription(activeSubscription);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
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

    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);

    if (form.deadline < localToday) {
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
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // Recheck the subscription before inserting the listing.
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
        setSubscription(null);
        throw new Error(
          "Your subscription is not active. Please check your company plans."
        );
      }

      const internshipData = {
        user_id: user.id,
        job_title: form.job_title.trim(),
        company_name: company.company_name,
        company_email:
          company.company_email || user.email || "",
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

        if (insertError.code === "42501") {
          throw new Error(
            "Your account does not have permission to publish this internship. Please check the internships table security policies."
          );
        }

        throw new Error(
          insertError.message ||
            "We could not publish your internship. Please try again."
        );
      }

      setSuccess(
        "Your internship has been published successfully!"
      );

      setTimeout(() => {
        router.push("/company-dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Unable to publish your internship."
      );
    } finally {
      setSaving(false);
    }
  }

  const today = new Date();
  const minimumDeadline = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  if (loading) {
    return (
      <main className="page loading-page">
        <div className="loading-card">
          <div className="spinner" />
          <h2>Preparing your workspace</h2>
          <p>
            Checking your company profile and subscription...
          </p>
        </div>

        <style jsx global>{globalStyles}</style>
      </main>
    );
  }

  if (error && (!company || !subscription)) {
    const subscriptionProblem =
      error.toLowerCase().includes("subscription");

    const profileProblem =
      error.toLowerCase().includes("company profile");

    return (
      <main className="page loading-page">
        <div className="loading-card">
          <div className="error-icon">!</div>

          <h2>We need to check something</h2>

          <p className="notice-text">{error}</p>

          <div className="action-stack">
            {subscriptionProblem ? (
              <Link
                href="/company-pricing"
                className="primary-button"
              >
                View Company Plans
              </Link>
            ) : profileProblem ? (
              <Link
                href="/company"
                className="primary-button"
              >
                Complete Company Profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={checkAccess}
                className="primary-button"
              >
                Try Again
              </button>
            )}

            <Link
              href="/company-dashboard"
              className="secondary-button"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>

        <style jsx global>{globalStyles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <Link href="/company-dashboard" className="brand">
          <span className="brand-icon">G</span>

          <span className="brand-text">
            <strong>GradLink</strong>
            <small>SOUTH AFRICA</small>
          </span>
        </Link>

        <Link
          href="/company-dashboard"
          className="back-link"
        >
          ← Dashboard
        </Link>
      </header>

      <section className="hero">
        <div className="hero-badge">
          COMPANY RECRUITMENT
        </div>

        <h1>Post an internship</h1>

        <p className="hero-description">
          Connect your organisation with talented South African
          graduates. Publish an opportunity and start finding
          your next candidate.
        </p>

        <div className="trust-row">
          <span>✓ Company access</span>
          <span>✓ Graduate applications</span>
          <span>✓ Candidate matching</span>
        </div>
      </section>

      <div className="content">
        <section className="form-card">
          <div className="form-heading">
            <div>
              <h2>Internship details</h2>
              <p>
                Tell graduates about the opportunity.
                Fields marked * are required.
              </p>
            </div>

            <span className="secure-tag">
              Secure posting
            </span>
          </div>

          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="job_title">
                Internship title *
              </label>

              <input
                id="job_title"
                name="job_title"
                value={form.job_title}
                onChange={updateField}
                placeholder="e.g. Software Development Intern"
                maxLength={150}
                required
              />
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="province">
                  Province *
                </label>

                <select
                  id="province"
                  name="province"
                  value={form.province}
                  onChange={updateField}
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
              </div>

              <div className="field">
                <label htmlFor="location">
                  City or work location *
                </label>

                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="e.g. Johannesburg"
                  maxLength={200}
                  required
                />
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="internship_type">
                  Opportunity type *
                </label>

                <select
                  id="internship_type"
                  name="internship_type"
                  value={form.internship_type}
                  onChange={updateField}
                  required
                >
                  <option value="Internship">Internship</option>
                  <option value="Graduate Programme">
                    Graduate Programme
                  </option>
                  <option value="Learnership">Learnership</option>
                  <option value="Work Experience">
                    Work Experience
                  </option>
                  <option value="Remote Internship">
                    Remote Internship
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="stipend">
                  Stipend or salary
                </label>

                <input
                  id="stipend"
                  name="stipend"
                  value={form.stipend}
                  onChange={updateField}
                  placeholder="e.g. R5,000 per month"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="qualification">
                Minimum qualification *
              </label>

              <input
                id="qualification"
                name="qualification"
                value={form.qualification}
                onChange={updateField}
                placeholder="e.g. Diploma, Degree or N6"
                maxLength={200}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="field_of_study">
                Field of study *
              </label>

              <input
                id="field_of_study"
                name="field_of_study"
                value={form.field_of_study}
                onChange={updateField}
                placeholder="e.g. Information Technology"
                maxLength={200}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="deadline">
                Application deadline *
              </label>

              <input
                id="deadline"
                name="deadline"
                type="date"
                value={form.deadline}
                min={minimumDeadline}
                onChange={updateField}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="skills">
                Required skills
              </label>

              <textarea
                id="skills"
                name="skills"
                value={form.skills}
                onChange={updateField}
                placeholder="e.g. Excel, communication, Python, teamwork"
                rows={3}
                maxLength={2000}
              />

              <small className="helper-text">
                Separate skills with commas to help graduates
                understand your requirements.
              </small>
            </div>

            <div className="field">
              <label htmlFor="description">
                Description and responsibilities *
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Describe the opportunity, responsibilities, requirements and what the successful candidate will learn..."
                rows={7}
                maxLength={10000}
                required
              />
            </div>

            <div className="form-footer">
              <p>
                Please confirm that the opportunity details
                are accurate and that your organisation is
                authorised to advertise this opportunity.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="publish-button"
              >
                {saving
                  ? "Publishing internship..."
                  : "Publish Internship →"}
              </button>

              <Link
                href="/company-dashboard"
                className="cancel-link"
              >
                Cancel and return to dashboard
              </Link>
            </div>
          </form>
        </section>

        <aside className="side-panel">
          <div className="plan-icon">✓</div>

          <h3>Subscription active</h3>

          <p>
            Your company subscription is active.
            You can submit an internship listing.
          </p>

          <div className="divider" />

          <span className="small-label">CURRENT PLAN</span>

          <strong className="plan-name">
            {subscription?.plan || "Company plan"}
          </strong>

          <span className="active-status">
            ● Active
          </span>

          <div className="tip-box">
            <strong>Tips for a strong listing</strong>

            <p>
              Be specific about qualifications, responsibilities,
              required skills and the application deadline.
              Clear listings help graduates decide whether
              to apply.
            </p>
          </div>

          <Link
            href="/company-dashboard"
            className="panel-link"
          >
            Back to company dashboard →
          </Link>
        </aside>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} GradLink SA · Connecting
        South African graduates with opportunity.
      </footer>

      <style jsx global>{globalStyles}</style>
    </main>
  );
}

const globalStyles = `
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 100%;
  }

  body {
    overflow-x: hidden;
  }

  .page {
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    background: #f3f7fc;
    color: #172b4d;
    font-family: Inter, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    padding-bottom: 30px;
  }

  .topbar {
    width: 100%;
    min-height: 72px;
    padding: 12px clamp(14px, 4vw, 52px);
    background: #fff;
    border-bottom: 1px solid #e4ebf5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: #123b77;
    min-width: 0;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(135deg, #1767d8, #073779);
    font-size: 22px;
    font-weight: 900;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .brand-text strong {
    font-size: 18px;
  }

  .brand-text small {
    font-size: 9px;
    letter-spacing: 1.2px;
  }

  .back-link {
    font-size: 13px;
    font-weight: 700;
    color: #1758ad;
    text-decoration: none;
    white-space: nowrap;
  }

  .hero {
    width: 100%;
    padding: 38px 18px 30px;
    text-align: center;
    color: #fff;
    background:
      radial-gradient(circle at 85% 10%, #2878df 0, transparent 35%),
      linear-gradient(125deg, #092b5d, #1156a8);
  }

  .hero-badge {
    display: inline-block;
    max-width: 100%;
    padding: 7px 12px;
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 30px;
    color: #e3efff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .hero h1 {
    margin: 17px 0 12px;
    font-size: clamp(28px, 7vw, 42px);
    line-height: 1.16;
    font-weight: 850;
    overflow-wrap: anywhere;
  }

  .hero-description {
    max-width: 650px;
    margin: 0 auto;
    color: #dbeafe;
    font-size: 14px;
    line-height: 1.8;
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 18px;
    margin-top: 20px;
    color: #e8f2ff;
    font-size: 11px;
  }

  .content {
    width: 100%;
    max-width: 1120px;
    padding: 0 16px;
    margin: 24px auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 270px;
    align-items: start;
    gap: 18px;
  }

  .form-card,
  .side-panel {
    min-width: 0;
    width: 100%;
    background: #fff;
    border: 1px solid #e1eaf5;
    border-radius: 16px;
    box-shadow: 0 7px 25px rgba(20, 50, 90, .045);
  }

  .form-card {
    padding: clamp(16px, 3vw, 30px);
  }

  .form-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 20px;
    margin-bottom: 23px;
    border-bottom: 1px solid #e8eef6;
  }

  .form-heading h2 {
    margin: 0 0 8px;
    font-size: 22px;
    line-height: 1.3;
  }

  .form-heading p {
    margin: 0;
    color: #687b94;
    font-size: 13px;
    line-height: 1.6;
  }

  .secure-tag {
    padding: 8px 10px;
    border-radius: 8px;
    background: #edf5ff;
    color: #1758ad;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .field {
    min-width: 0;
    width: 100%;
    margin-bottom: 19px;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .field label {
    display: block;
    margin-bottom: 7px;
    color: #263b59;
    font-size: 13px;
    font-weight: 750;
    line-height: 1.5;
  }

  .field input,
  .field select,
  .field textarea {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 13px 12px;
    border: 1px solid #d7e0ed;
    border-radius: 10px;
    outline: none;
    background: #fff;
    color: #172b4d;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    box-shadow: none;
  }

  .field input,
  .field select {
    min-height: 48px;
  }

  .field textarea {
    resize: vertical;
    min-height: 100px;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #2473d4;
    box-shadow: 0 0 0 3px rgba(36, 115, 212, .11);
  }

  .helper-text {
    display: block;
    margin-top: 7px;
    color: #72839a;
    font-size: 12px;
    line-height: 1.6;
  }

  .form-footer {
    border-top: 1px solid #e8eef6;
    padding-top: 18px;
    margin-top: 8px;
  }

  .form-footer > p {
    margin: 0 0 18px;
    color: #687b94;
    font-size: 12px;
    line-height: 1.7;
  }

  .publish-button,
  .primary-button,
  .secondary-button {
    display: flex;
    width: 100%;
    min-height: 48px;
    padding: 13px 15px;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 0;
    border-radius: 10px;
    text-decoration: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  .publish-button,
  .primary-button {
    color: #fff;
    background: linear-gradient(120deg, #1767d8, #104797);
  }

  .publish-button:disabled {
    opacity: .65;
    cursor: wait;
  }

  .secondary-button {
    color: #254263;
    background: #eff4fa;
  }

  .cancel-link {
    display: block;
    margin-top: 16px;
    text-align: center;
    color: #526781;
    font-size: 13px;
    line-height: 1.6;
    text-decoration: none;
  }

  .side-panel {
    padding: 22px;
  }

  .plan-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: #e3f7ee;
    color: #087443;
    font-size: 22px;
    font-weight: 900;
  }

  .side-panel h3 {
    margin: 16px 0 8px;
    font-size: 18px;
  }

  .side-panel > p {
    margin: 0;
    color: #687b94;
    font-size: 13px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  .divider {
    height: 1px;
    margin: 20px 0;
    background: #e8eef6;
  }

  .small-label {
    display: block;
    margin-bottom: 7px;
    color: #71839c;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .plan-name {
    display: block;
    margin-bottom: 10px;
    font-size: 18px;
    overflow-wrap: anywhere;
  }

  .active-status {
    display: inline-block;
    padding: 7px 10px;
    border-radius: 30px;
    background: #e4f8ed;
    color: #087443;
    font-size: 12px;
    font-weight: 800;
  }

  .tip-box {
    margin-top: 22px;
    padding: 14px;
    border: 1px solid #dbe9ff;
    border-radius: 12px;
    background: #f0f6ff;
    color: #38516f;
    font-size: 12px;
    line-height: 1.7;
  }

  .tip-box p {
    margin: 7px 0 0;
  }

  .panel-link {
    display: block;
    margin-top: 18px;
    color: #1758ad;
    font-size: 12px;
    font-weight: 750;
    line-height: 1.7;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .message {
    margin-bottom: 18px;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  .error-message {
    border: 1px solid #fecaca;
    background: #fff1f1;
    color: #b42318;
  }

  .success-message {
    border: 1px solid #b7ebcb;
    background: #e9f9f0;
    color: #087443;
  }

  .footer {
    padding: 0 18px;
    color: #75859b;
    text-align: center;
    font-size: 11px;
    line-height: 1.7;
  }

  .loading-page {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 12vh 16px 30px;
  }

  .loading-card {
    width: 100%;
    max-width: 450px;
    padding: 28px 20px;
    border: 1px solid #e1eaf5;
    border-radius: 16px;
    background: #fff;
    text-align: center;
    box-shadow: 0 12px 40px rgba(20, 50, 90, .08);
  }

  .loading-card h2 {
    margin: 0 0 10px;
    font-size: 21px;
    line-height: 1.4;
  }

  .loading-card > p {
    color: #64748b;
    font-size: 14px;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  .notice-text {
    margin: 12px 0 20px;
  }

  .spinner {
    width: 35px;
    height: 35px;
    margin: 0 auto 20px;
    border: 4px solid #dbeafe;
    border-top-color: #1767d8;
    border-radius: 50%;
    animation: gradlinkSpin 1s linear infinite;
  }

  .error-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: 0 auto 15px;
    border-radius: 50%;
    background: #fff1f1;
    color: #b42318;
    font-size: 23px;
    font-weight: 900;
  }

  .action-stack {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }

  @keyframes gradlinkSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .content {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      padding: 0 12px;
      margin: 18px auto;
    }

    .form-card {
      padding: 18px 14px;
      border-radius: 14px;
    }

    .side-panel {
      padding: 18px;
      border-radius: 14px;
    }

    .hero {
      padding: 30px 16px 26px;
    }

    .trust-row {
      gap: 9px 13px;
      font-size: 10px;
    }
  }

  @media (max-width: 480px) {
    .topbar {
      min-height: 64px;
      padding: 10px 12px;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
    }

    .brand-text strong {
      font-size: 16px;
    }

    .brand-text small {
      font-size: 8px;
    }

    .back-link {
      font-size: 12px;
    }

    .hero h1 {
      font-size: 30px;
    }

    .hero-description {
      font-size: 13px;
    }

    .field-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }

    .form-heading h2 {
      font-size: 20px;
    }

    .secure-tag {
      white-space: normal;
    }

    .field input,
    .field select,
    .field textarea {
      font-size: 16px;
    }

    .publish-button {
      padding: 14px 10px;
      font-size: 13px;
    }
  }
`;