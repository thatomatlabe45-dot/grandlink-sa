"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyCompany = {
  company_name: "",
  industry: "",
  website: "",
  location: "",
  email: "",
  phone: "",
  description: "",
};

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [company, setCompany] = useState(emptyCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadCompany();
    }
  }, [id]);

  async function loadCompany() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Load company error:", error);
        setErrorMessage(
          "Could not load your company profile. " + error.message
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("No company was found with this ID.");
        setLoading(false);
        return;
      }

      setCompany({
        company_name: data.company_name || "",
        industry: data.industry || "",
        website: data.website || "",
        location: data.location || "",
        email: data.email || "",
        phone: data.phone || "",
        description: data.description || "",
      });

      setLoading(false);
    } catch (error) {
      console.error("Unexpected error:", error);

      setErrorMessage(
        "Something went wrong while loading your company profile."
      );

      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setCompany((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!id) {
        setErrorMessage("Company ID is missing.");
        setSaving(false);
        return;
      }

      const updatedCompany = {
        company_name: company.company_name.trim(),
        industry: company.industry.trim(),
        website: company.website.trim(),
        location: company.location.trim(),
        email: company.email.trim(),
        phone: company.phone.trim(),
        description: company.description.trim(),
      };

      if (!updatedCompany.company_name) {
        setErrorMessage("Please enter your company name.");
        setSaving(false);
        return;
      }

      console.log("Updating company with ID:", id);
      console.log("New company data:", updatedCompany);

      const { data, error } = await supabase
        .from("companies")
        .update(updatedCompany)
        .eq("id", id)
        .select("*");

      console.log("Update response:", data);
      console.log("Update error:", error);

      if (error) {
        console.error("Supabase update error:", error);

        setErrorMessage(
          "Company profile could not be updated. " + error.message
        );

        setSaving(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorMessage(
          "Company profile could not be updated. No matching company was found."
        );

        setSaving(false);
        return;
      }

      setCompany({
        company_name: data[0].company_name || "",
        industry: data[0].industry || "",
        website: data[0].website || "",
        location: data[0].location || "",
        email: data[0].email || "",
        phone: data[0].phone || "",
        description: data[0].description || "",
      });

      setMessage("Company profile updated successfully! ✅");

      setSaving(false);

      setTimeout(() => {
        router.push("/company");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Unexpected update error:", error);

      setErrorMessage(
        "Something went wrong while updating your company profile."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        Loading company profile...
      </div>
    );
  }

  if (errorMessage && !company.company_name) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f9ff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "20px",
            maxWidth: "550px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ color: "#d32f2f" }}>Company Profile Error</h2>

          <p
            style={{
              color: "#555",
              lineHeight: "1.6",
            }}
          >
            {errorMessage}
          </p>

          <button
            onClick={() => router.push("/company")}
            style={{
              marginTop: "20px",
              padding: "12px 22px",
              background: "#0057B8",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <button
            onClick={() => router.push("/company")}
            style={{
              background: "transparent",
              border: "none",
              color: "#0057B8",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              padding: "0",
            }}
          >
            ← Back to Dashboard
          </button>

          <h1
            style={{
              color: "#0057B8",
              marginBottom: "8px",
              fontSize: "32px",
            }}
          >
            Edit Company Profile
          </h1>

          <p
            style={{
              color: "#666",
              marginTop: 0,
            }}
          >
            Update your company information below.
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: "15px 18px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "15px 18px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          {/* Company Name */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Company Name *
            </label>

            <input
              type="text"
              name="company_name"
              value={company.company_name}
              onChange={handleChange}
              required
              placeholder="Enter company name"
              style={inputStyle}
            />
          </div>

          {/* Industry */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Industry</label>

            <input
              type="text"
              name="industry"
              value={company.industry}
              onChange={handleChange}
              placeholder="e.g. Information Technology"
              style={inputStyle}
            />
          </div>

          {/* Website */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Website</label>

            <input
              type="text"
              name="website"
              value={company.website}
              onChange={handleChange}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Location</label>

            <input
              type="text"
              name="location"
              value={company.location}
              onChange={handleChange}
              placeholder="e.g. Johannesburg, Gauteng"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email</label>

            <input
              type="email"
              name="email"
              value={company.email}
              onChange={handleChange}
              placeholder="company@example.com"
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Phone</label>

            <input
              type="tel"
              name="phone"
              value={company.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "25px" }}>
            <label style={labelStyle}>Company Description</label>

            <textarea
              name="description"
              value={company.description}
              onChange={handleChange}
              placeholder="Tell graduates about your company..."
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "140px",
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "14px 20px",
                background: saving ? "#7aa9d8" : "#0057B8",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/company")}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "14px 20px",
                background: "#fff",
                color: "#0057B8",
                border: "2px solid #0057B8",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d5dce5",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
  color: "#333",
};