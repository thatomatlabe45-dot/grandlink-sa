"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InternshipPage() {
  const [loading, setLoading] = useState(false);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !company) return;

    setForm((prev) => ({
      ...prev,
      company_name: company.company_name || "",
      company_email: company.email || "",
      company_website: company.website || "",
    }));
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      setLoading(false);
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

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Internship posted successfully!");

    setForm({
      job_title: "",
      company_name: form.company_name,
      company_email: form.company_email,
      company_website: form.company_website,
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
  }

  return (
    <div
      style={{
        background: "#f4f7fb",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
          background: "white",
          borderRadius: "16px",
          padding: "35px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ color: "#0057B8" }}>
          Post an Internship
        </h1>

        <p style={{ color: "#666", marginBottom: "30px" }}>
          Reach thousands of South African graduates through GradLink SA.
        </p>

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
            placeholder="Required Skills"
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
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: "#0057B8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Publishing..." : "🚀 Publish Internship"}
          </button>

        </form>
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