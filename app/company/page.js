"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompanyPage() {
  const router = useRouter();

  const [company, setCompany] = useState({
    company_name: "",
    industry: "",
    website: "",
    location: "",
    email: "",
    phone: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      }
    }

    checkUser();
  }, [router]);

  function handleChange(e) {
    setCompany({
      ...company,
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
      router.push("/login");
      return;
    }

    const companyData = {
      user_id: user.id,
      company_name: company.company_name,
      industry: company.industry,
      website: company.website,
      location: company.location,
      email: company.email,
      phone: company.phone,
      description: company.description,
    };

    // Check if the logged-in user already has a company profile
    const { data: existingCompany, error: checkError } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      alert(checkError.message);
      return;
    }

    let error = null;

    if (existingCompany) {
      // Update existing company profile
      const { error: updateError } = await supabase
        .from("companies")
        .update(companyData)
        .eq("user_id", user.id);

      error = updateError;
    } else {
      // Create a new company profile
      const { error: insertError } = await supabase
        .from("companies")
        .insert([companyData]);

      error = insertError;
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Company profile saved successfully!");

    setCompany({
      company_name: "",
      industry: "",
      website: "",
      location: "",
      email: "",
      phone: "",
      description: "",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "16px",
          padding: "35px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            color: "#0057B8",
            marginBottom: "10px",
          }}
        >
          Company Profile
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: "30px",
          }}
        >
          Create your company profile and start hiring South Africa's best graduates.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            name="company_name"
            placeholder="Company Name"
            value={company.company_name}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <input
            name="industry"
            placeholder="Industry"
            value={company.industry}
            onChange={handleChange}
            style={inputStyle}
            required
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
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Company Email"
            value={company.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={company.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <textarea
            name="description"
            placeholder="Describe your company..."
            value={company.description}
            onChange={handleChange}
            rows={6}
            style={inputStyle}
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
            {loading ? "Saving..." : "Save Company Profile"}
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
  border: "1px solid #d9d9d9",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
};