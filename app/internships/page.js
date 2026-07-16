"use client";

import { useState } from "react";
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
    location: "",
    internship_type: "",
    stipend: "",
    qualification: "",
    field_of_study: "",
    deadline: "",
    description: "",
    skills: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase
      .from("internships")
      .insert([form]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Internship posted successfully!");

    setForm({
      job_title: "",
      company_name: "",
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
          maxWidth: "850px",
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
            placeholder="Job Title"
            value={form.job_title}
            onChange={handleChange}
            required
          />

          <input
            style={inputStyle}
            name="company_name"
            placeholder="Company Name"
            value={form.company_name}
            onChange={handleChange}
            required
          />

          <input
            style={inputStyle}
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />

          <select
            style={inputStyle}
            name="internship_type"
            value={form.internship_type}
            onChange={handleChange}
            required
          >
            <option value="">Internship Type</option>
            <option>On-site</option>
            <option>Remote</option>
            <option>Hybrid</option>
          </select>

          <input
            style={inputStyle}
            name="stipend"
            placeholder="Monthly Stipend"
            value={form.stipend}
            onChange={handleChange}
          />

          <input
            style={inputStyle}
            name="qualification"
            placeholder="Required Qualification"
            value={form.qualification}
            onChange={handleChange}
          />

          <input
            style={inputStyle}
            name="field_of_study"
            placeholder="Field of Study"
            value={form.field_of_study}
            onChange={handleChange}
          />

          <input
            style={inputStyle}
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
          />

          <textarea
            style={inputStyle}
            rows={6}
            name="description"
            placeholder="Internship Description"
            value={form.description}
            onChange={handleChange}
          />

          <textarea
            style={inputStyle}
            rows={4}
            name="skills"
            placeholder="Required Skills"
            value={form.skills}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: "#0057B8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Posting..." : "Post Internship"}
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
