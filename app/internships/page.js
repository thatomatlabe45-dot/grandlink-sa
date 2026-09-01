"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fb",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            background: "white",
            padding: "35px",
            borderRadius: "16px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "45px" }}>💼</div>

          <h2 style={{ color: "#0057B8" }}>
            Loading Internship Form...
          </h2>

          <p style={{ color: "#64748b" }}>
            Preparing your company information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f4f7fb",
        minHeight: "100vh",
        padding: "30px 15px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/company-dashboard")}
          style={{
            background: "white",
            color: "#0057B8",
            border: "1px solid #dbeafe",
            padding: "11px 16px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "18px",
          }}
        >
          ← Back to Dashboard
        </button>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#0057B8",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              GRADLINK SA • COMPANY PORTAL
            </div>

            <h1
              style={{
                color: "#0057B8",
                marginBottom: "10px",
              }}
            >
              💼 Post an Internship
            </h1>

            <p
              style={{
                color: "#64748b",
                margin: 0,
              }}
            >
              Reach talented South African graduates through GradLink SA.
            </p>
          </div>

          {message && (
            <div
              style={{
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "bold",
              }}
            >
              {message}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "bold",
              }}
            >
              ❌ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              style={inputStyle}
              name="job_title"
              placeholder="Internship Title"
              value={form.job_title}
              onChange={handleChange}
              required
            />

            <input
              style={{
                ...inputStyle,
                background: "#f5f5f5",
              }}
              value={form.company_name}
              readOnly
            />

            <input
              style={{
                ...inputStyle,
                background: "#f5f5f5",
              }}
              value={form.company_email}
              readOnly
            />

            <input
              style={{
                ...inputStyle,
                background: "#f5f5f5",
              }}
              value={form.company_website}
              readOnly
            />

            <select
              style={inputStyle}
              name="province"
              value={form.province}
              onChange={handleChange}
              required
            >
              <option value="">Select Province</option>
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

            <input
              style={inputStyle}
              name="location"
              placeholder="Location (City/Town)"
              value={form.location}
              onChange={handleChange}
              required
            />

            <select
              style={inputStyle}
              name="internship_type"
              value={form.internship_type}
              onChange={handleChange}
              required
            >
              <option value="">Work Type</option>
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>

            <input
              style={inputStyle}
              name="stipend"
              placeholder="Monthly Stipend (e.g. R7000)"
              value={form.stipend}
              onChange={handleChange}
            />

            <input
              style={inputStyle}
              name="qualification"
              placeholder="Required Qualification"
              value={form.qualification}
              onChange={handleChange}
              required
            />

            <input
              style={inputStyle}
              name="field_of_study"
              placeholder="Field of Study"
              value={form.field_of_study}
              onChange={handleChange}
              required
            />

            <textarea
              style={inputStyle}
              rows={4}
              name="skills"
              placeholder="Required Skills (e.g. JavaScript, React, Excel)"
              value={form.skills}
              onChange={handleChange}
            />

            <textarea
              style={inputStyle}
              rows={6}
              name="description"
              placeholder="Internship Description"
              value={form.description}
              onChange={handleChange}
              required
            />

            <input
              style={inputStyle}
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={loading || !form.company_name}
              style={{
                width: "100%",
                padding: "16px",
                background:
                  loading || !form.company_name
                    ? "#94a3b8"
                    : "#0057B8",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
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
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  border: "1px solid #d6d6d6",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
};