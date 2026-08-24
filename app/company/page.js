"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CompanyPage() {
  const router = useRouter();

  const [company, setCompany] = useState(emptyCompany);
  const [companyId, setCompanyId] = useState(null);
  const [oldCompanyName, setOldCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------------------------
  // LOAD COMPANY
  // ----------------------------------------

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company load error:", companyError);

        setErrorMessage(
          "Could not load your company profile. Please try again."
        );

        setLoading(false);
        return;
      }

      if (companyData) {
        setCompanyId(companyData.id);

        setOldCompanyName(companyData.company_name || "");

        setCompany({
          company_name: companyData.company_name || "",
          industry: companyData.industry || "",
          website: companyData.website || "",
          location: companyData.location || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          description: companyData.description || "",
        });
      }

      setLoading(false);
    }

    loadCompany();
  }, [router]);

  // ----------------------------------------
  // HANDLE INPUT
  // ----------------------------------------

  function handleChange(e) {
    const { name, value } = e.target;

    setCompany((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  }

  // ----------------------------------------
  // SAVE COMPANY
  // ----------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      // ----------------------------------------
      // GET LOGGED-IN USER
      // ----------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ----------------------------------------
      // PREPARE DATA
      // ----------------------------------------

      const newCompanyName = company.company_name.trim();

      if (!newCompanyName) {
        setErrorMessage("Company name is required.");
        setSaving(false);
        return;
      }

      const companyData = {
        company_name: newCompanyName,
        industry: company.industry.trim(),
        website: company.website.trim(),
        location: company.location.trim(),
        email: company.email.trim(),
        phone: company.phone.trim(),
        description: company.description.trim(),
      };

      // ----------------------------------------
      // FIND COMPANY BY USER ID
      // ----------------------------------------

      const {
        data: existingCompany,
        error: findError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (findError) {
        console.error("Find company error:", findError);
        throw findError;
      }

      // ----------------------------------------
      // UPDATE EXISTING COMPANY
      // ----------------------------------------

      if (existingCompany) {
        const previousName = existingCompany.company_name || "";

        const {
          data: updatedCompany,
          error: updateError,
        } = await supabase
          .from("companies")
          .update(companyData)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (updateError) {
          console.error("Company update error:", updateError);
          throw updateError;
        }

        if (!updatedCompany) {
          throw new Error(
            "Company could not be updated. No matching company was found."
          );
        }

        // ----------------------------------------
        // UPDATE INTERNSHIPS
        // ----------------------------------------
        // This keeps existing applications connected
        // to the same internships.

        if (
          previousName &&
          newCompanyName &&
          previousName !== newCompanyName
        ) {
          const {
            error: internshipUpdateError,
          } = await supabase
            .from("internships")
            .update({
              company_name: newCompanyName,
            })
            .eq("company_name", previousName);

          if (internshipUpdateError) {
            console.error(
              "Internship company name update error:",
              internshipUpdateError
            );

            throw internshipUpdateError;
          }
        }

        // ----------------------------------------
        // UPDATE LOCAL STATE
        // ----------------------------------------

        setCompanyId(updatedCompany.id);

        setOldCompanyName(newCompanyName);

        setCompany({
          company_name: updatedCompany.company_name || "",
          industry: updatedCompany.industry || "",
          website: updatedCompany.website || "",
          location: updatedCompany.location || "",
          email: updatedCompany.email || "",
          phone: updatedCompany.phone || "",
          description: updatedCompany.description || "",
        });

        setMessage(
          "✅ Company profile and internships updated successfully!"
        );

        setSaving(false);

        return;
      }

      // ----------------------------------------
      // CREATE COMPANY
      // ----------------------------------------

      const {
        data: createdCompany,
        error: insertError,
      } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          ...companyData,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Company insert error:", insertError);
        throw insertError;
      }

      setCompanyId(createdCompany.id);
      setOldCompanyName(newCompanyName);

      setCompany(companyData);

      setMessage("✅ Company profile created successfully!");

    } catch (error) {
      console.error("Company profile error:", error);

      setErrorMessage(
        error?.message ||
          "Something went wrong while saving your company profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------
  // GO TO DASHBOARD
  // ----------------------------------------

  function goToDashboard() {
    router.push("/company-dashboard");
  }

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f8fc",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
          padding: "20px",
        }}
      >
        Loading company profile...
      </main>
    );
  }

  // ----------------------------------------
  // PAGE
  // ----------------------------------------

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
          🏢 {companyId ? "Edit Company Profile" : "Company Profile"}
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: "30px",
            lineHeight: "1.6",
          }}
        >
          Update your company information and keep your GradLink SA
          profile up to date.
        </p>

        {message && (
          <div
            style={{
              background: "#e8f7ee",
              color: "#16803c",
              border: "1px solid #b7e4c7",
              padding: "14px 16px",
              borderRadius: "10px",
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
              background: "#fff0f0",
              color: "#c62828",
              border: "1px solid #f0b8b8",
              padding: "14px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Company Name</label>

          <input
            name="company_name"
            placeholder="Company Name"
            value={company.company_name}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Industry</label>

          <input
            name="industry"
            placeholder="Industry"
            value={company.industry}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Website</label>

          <input
            name="website"
            placeholder="https://example.co.za"
            value={company.website}
            onChange={handleChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Location</label>

          <input
            name="location"
            placeholder="Johannesburg, Gauteng"
            value={company.location}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Company Email</label>

          <input
            type="email"
            name="email"
            placeholder="company@example.co.za"
            value={company.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Phone Number</label>

          <input
            name="phone"
            placeholder="Phone Number"
            value={company.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Company Description</label>

          <textarea
            name="description"
            placeholder="Describe your company..."
            value={company.description}
            onChange={handleChange}
            rows={6}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "15px",
              background: saving ? "#7aa9d8" : "#0057B8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving
              ? "Saving..."
              : companyId
              ? "💾 Update Company Profile"
              : "💾 Save Company Profile"}
          </button>

          <button
            type="button"
            onClick={goToDashboard}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "12px",
              background: "#fff",
              color: "#0057B8",
              border: "2px solid #0057B8",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#333",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  border: "1px solid #d9d9d9",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
};