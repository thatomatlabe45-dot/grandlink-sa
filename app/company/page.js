"use client";

import { useState } from "react";

export default function CompanyPage() {
  const [company, setCompany] = useState({
    company_name: "",
    industry: "",
    website: "",
    location: "",
    email: "",
    phone: "",
    description: "",
  });

  function handleChange(e) {
    setCompany({
      ...company,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert("Company profile will be saved!");
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "30px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ color: "#0057B8" }}>Company Profile</h1>
      <p>Create your company profile to start hiring graduates.</p>

      <form onSubmit={handleSubmit}>
        <input
          name="company_name"
          placeholder="Company Name"
          value={company.company_name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="industry"
          placeholder="Industry"
          value={company.industry}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="website"
          placeholder="Website"
          value={company.website}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="location"
          placeholder="Location"
          value={company.location}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="email"
          placeholder="Email"
          value={company.email}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="phone"
          placeholder="Phone"
          value={company.phone}
          onChange={handleChange}
          style={inputStyle}
        />

        <textarea
          name="description"
          placeholder="Tell graduates about your company..."
          value={company.description}
          onChange={handleChange}
          rows={5}
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            background: "#0057B8",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Save Company Profile
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
  boxSizing: "border-box",
};
