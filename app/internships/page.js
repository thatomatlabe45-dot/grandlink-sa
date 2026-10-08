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

      const profile =
        typeof window !== "undefined"
          ? localStorage.getItem("gradlink_profile")
          : null;

      if (profile === "graduate") {
        router.replace("/graduate");
        return;
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
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

      const internshipData = {
        user_id: user.id,
        company_name: company.company_name || form.company_name,
        company_email: user.email || form.company_email,
        company_website:
          company.website || form.company_website,

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

      setSuccess("Your internship has been published successfully!");

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

        <main className="loading-page">
          <div className="loader"></div>

          <h2>Checking your company account</h2>

          <p>
            Please wait while we verify your subscription.
          </p>
        </main>

        <SiteFooter />

        <style jsx global>{globalStyles}</style>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main className="post-page">
        <section className="hero">
          <div className="hero-glow"></div>

          <div className="hero-inner">
            <Link
              href="/company-dashboard"
              className="back-link"
            >
              ← Back to Dashboard
            </Link>

            <div className="hero-badge">
              COMPANY HIRING
            </div>

            <h1>
              List an{" "}
              <span>Internship</span>
            </h1>

            <p>
              Connect your company with talented South African
              graduates looking for meaningful career
              opportunities.
            </p>
          </div>
        </section>

        <section className="form-section">
          <form
            onSubmit={handleSubmit}
            className="internship-form"
          >
            {error && (
              <div className="message error-message">
                <strong>Unable to continue</strong>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="message success-message">
                <strong>✓ Internship published</strong>
                <span>{success}</span>
              </div>
            )}

            {/* SECTION 01 */}

            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number">
                  01
                </span>

                <div>
                  <h2>Internship Details</h2>

                  <p>
                    Tell graduates about the opportunity.
                  </p>
                </div>
              </div>

              <div className="form-grid">
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

                <Field
                  label="Stipend"
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  placeholder="e.g. R5,000 per month"
                />

                <Field
                  label="Application Deadline"
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SECTION 02 */}

            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number">
                  02
                </span>

                <div>
                  <h2>Candidate Requirements</h2>

                  <p>
                    Help graduates understand who you are
                    looking for.
                  </p>
                </div>
              </div>

              <div className="form-grid">
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

            {/* SECTION 03 */}

            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number">
                  03
                </span>

                <div>
                  <h2>Internship Description</h2>

                  <p>
                    Explain the role and what the successful
                    candidate will do.
                  </p>
                </div>
              </div>

              <div className="single-field">
                <label>
                  Description
                  <span>*</span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the internship, responsibilities, learning opportunities and what the graduate can expect..."
                  rows={8}
                  required
                />
              </div>
            </div>

            {/* SECTION 04 */}

            <div className="form-section-block company-preview">
              <div className="form-section-header">
                <span className="section-number">
                  04
                </span>

                <div>
                  <h2>Company Information</h2>

                  <p>
                    This information comes from your verified
                    company profile.
                  </p>
                </div>
              </div>

              <div className="company-info-grid">
                <div className="company-info">
                  <span>COMPANY</span>
                  <strong>
                    {form.company_name || "Your company"}
                  </strong>
                </div>

                <div className="company-info">
                  <span>EMAIL</span>
                  <strong>
                    {form.company_email || "Company email"}
                  </strong>
                </div>

                <div className="company-info">
                  <span>WEBSITE</span>
                  <strong>
                    {form.company_website ||
                      "Company website"}
                  </strong>
                </div>
              </div>
            </div>

            {/* SUBMIT */}

            <div className="submit-area">
              <div>
                <strong>Ready to publish?</strong>

                <p>
                  Your internship will be visible to
                  graduates on GradLink SA.
                </p>
              </div>

              <button
                type="submit"
                className="publish-button"
                disabled={submitting}
              >
                {submitting
                  ? "Publishing..."
                  : "Publish Internship →"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter />

      <style jsx global>{globalStyles}</style>
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  full = false,
  type = "text",
}) {
  return (
    <div className={`field ${full ? "field-full" : ""}`}>
      <label htmlFor={name}>
        {label}

        {required && <span>*</span>}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}

        {required && <span>*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="">Select an option</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

const globalStyles = `
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    background: #f8fafc;
    color: #0f172a;
  }

  .post-page {
    min-height: 100vh;
    background: #f8fafc;
  }

  .loading-page {
    min-height: 65vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    background: #f8fafc;
    text-align: center;
  }

  .loading-page h2 {
    margin: 20px 0 8px;
    color: #0f172a;
    font-size: 22px;
  }

  .loading-page p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }

  .loader {
    width: 42px;
    height: 42px;
    border: 4px solid #dbeafe;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: internshipSpin 0.8s linear infinite;
  }

  @keyframes internshipSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .hero {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 85% 20%,
        rgba(96,165,250,0.18),
        transparent 28%
      ),
      linear-gradient(
        135deg,
        #071b46 0%,
        #0b3277 50%,
        #2563eb 100%
      );
  }

  .hero-glow {
    position: absolute;
    width: 360px;
    height: 360px;
    right: -150px;
    top: -160px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 24px 70px;
  }

  .back-link {
    display: inline-flex;
    margin-bottom: 28px;
    color: #dbeafe;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .back-link:hover {
    color: #ffffff;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .hero h1 {
    max-width: 800px;
    margin: 18px 0 0;
    color: #ffffff;
    font-size: clamp(38px, 6vw, 62px);
    line-height: 1.04;
    letter-spacing: -2.5px;
    font-weight: 900;
  }

  .hero h1 span {
    color: #93c5fd;
  }

  .hero p {
    max-width: 680px;
    margin: 20px 0 0;
    color: rgba(255,255,255,0.86);
    font-size: 17px;
    line-height: 1.7;
  }

  .form-section {
    max-width: 1000px;
    margin: -28px auto 0;
    padding: 0 20px 80px;
    position: relative;
    z-index: 5;
  }

  .internship-form {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 22px;
    background: #ffffff;
    box-shadow: 0 25px 70px rgba(15,23,42,0.10);
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 22px 22px 0;
    padding: 15px 17px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
  }

  .error-message {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }

  .success-message {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #166534;
  }

  .form-section-block {
    padding: 38px;
    border-bottom: 1px solid #edf2f7;
  }

  .form-section-header {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 28px;
  }

  .section-number {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 11px;
    font-weight: 900;
  }

  .form-section-header h2 {
    margin: 0;
    color: #0f172a;
    font-size: 21px;
    letter-spacing: -0.5px;
  }

  .form-section-header p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .field-full {
    grid-column: 1 / -1;
  }

  .field,
  .single-field {
    min-width: 0;
  }

  .field label,
  .single-field label {
    display: block;
    margin-bottom: 8px;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
  }

  .field label span,
  .single-field label span {
    margin-left: 3px;
    color: #dc2626;
  }

  .field input,
  .field select,
  .single-field textarea {
    width: 100%;
    border: 1px solid #dbe2ea;
    border-radius: 11px;
    outline: none;
    background: #f8fafc;
    color: #0f172a;
    font-family: inherit;
    font-size: 14px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .field input,
  .field select {
    min-height: 49px;
    padding: 0 14px;
  }

  .single-field textarea {
    min-height: 180px;
    padding: 14px;
    resize: vertical;
    line-height: 1.6;
  }

  .field input:focus,
  .field select:focus,
  .single-field textarea:focus {
    border-color: #2563eb;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
  }

  .company-preview {
    background: #fbfdff;
  }

  .company-info-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .company-info {
    min-width: 0;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
  }

  .company-info span {
    display: block;
    margin-bottom: 7px;
    color: #64748b;
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 1px;
  }

  .company-info strong {
    display: block;
    overflow: hidden;
    color: #0f172a;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .submit-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    padding: 30px 38px;
    background: #f8fafc;
  }

  .submit-area strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
  }

  .submit-area p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 11px;
  }

  .publish-button {
    min-height: 50px;
    padding: 0 23px;
    border: 0;
    border-radius: 11px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 12px 25px rgba(37,99,235,0.20);
    cursor: pointer;
    white-space: nowrap;
  }

  .publish-button:hover {
    transform: translateY(-1px);
  }

  .publish-button:disabled {
    opacity: 0.65;
    cursor: wait;
    transform: none;
  }

  @media (max-width: 700px) {
    .hero-inner {
      padding: 45px 18px 58px;
    }

    .hero h1 {
      font-size: 40px;
      letter-spacing: -1.8px;
    }

    .hero p {
      font-size: 14px;
    }

    .form-section {
      padding: 0 12px 55px;
    }

    .form-section-block {
      padding: 27px 19px;
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: 17px;
    }

    .field-full {
      grid-column: auto;
    }

    .company-info-grid {
      grid-template-columns: 1fr;
    }

    .submit-area {
      flex-direction: column;
      align-items: stretch;
      padding: 25px 19px;
    }

    .publish-button {
      width: 100%;
    }
  }

  @media (max-width: 420px) {
    .hero-inner {
      padding-left: 14px;
      padding-right: 14px;
    }

    .hero h1 {
      font-size: 35px;
    }

    .form-section {
      padding-left: 8px;
      padding-right: 8px;
    }

    .form-section-block {
      padding-left: 16px;
      padding-right: 16px;
    }

    .form-section-header {
      gap: 11px;
    }

    .section-number {
      width: 34px;
      height: 34px;
      flex-basis: 34px;
    }
  }
`;