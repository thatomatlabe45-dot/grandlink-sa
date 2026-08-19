"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompanyProfilePage() {
  const params = useParams();
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Logged in user:", user.id);
      console.log("Company loaded:", data);
      console.log("Company load error:", error);

      if (error) {
        setErrorMessage(
          "Could not load company profile: " +
            error.message
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage(
          "No company profile was found for this account."
        );
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
      console.error(error);

      setErrorMessage(
        "Something went wrong while loading your company profile."
      );

      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setCompany((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          "Your session has expired. Please log in again."
        );
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
        setErrorMessage(
          "Please enter your company name."
        );
        setSaving(false);
        return;
      }

      console.log(
        "Updating company for user:",
        user.id
      );

      const { error: updateError } = await supabase
        .from("companies")
        .update(updatedCompany)
        .eq("user_id", user.id);

      console.log(
        "Update error:",
        updateError
      );

      if (updateError) {
        setErrorMessage(
          "Company profile could not be updated: " +
            updateError.message
        );

        setSaving(false);
        return;
      }

      // Verify that the updated company can be read
      const { data: updatedData, error: verifyError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      console.log(
        "Updated company:",
        updatedData
      );

      console.log(
        "Verification error:",
        verifyError
      );

      if (verifyError) {
        setErrorMessage(
          "The profile was updated, but we could not verify the changes: " +
            verifyError.message
        );

        setSaving(false);
        return;
      }

      if (!updatedData) {
        setErrorMessage(
          "Company profile could not be updated. No company was found for this account."
        );

        setSaving(false);
        return;
      }

      setCompany({
        company_name:
          updatedData.company_name || "",
        industry:
          updatedData.industry || "",
        website:
          updatedData.website || "",
        location:
          updatedData.location || "",
        email:
          updatedData.email || "",
        phone:
          updatedData.phone || "",
        description:
          updatedData.description || "",
      });

      setMessage(
        "Company profile updated successfully! ✅"
      );

      setSaving(false);

      setTimeout(() => {
        router.push("/company-dashboard");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(
        "Unexpected update error:",
        error
      );

      setErrorMessage(
        "Something went wrong while updating your company profile."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
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
      </main>
    );
  }

  if (errorMessage && !company.company_name) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            maxWidth: "550px",
            width: "100%",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2 style={{ color: "#c62828" }}>
            Company Profile Error
          </h2>

          <p style={{ color: "#666" }}>
            {errorMessage}
          </p>

          <button
            onClick={() =>
              router.push("/company-dashboard")
            }
            style={primaryButton}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "35px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() =>
            router.push("/company-dashboard")
          }
          style={{
            background: "transparent",
            border: "none",
            color: "#0057B8",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: 0,
            marginBottom: "20px",
          }}
        >
          ← Back to Dashboard
        </button>

        <h1
          style={{
            color: "#0057B8",
            marginBottom: "8px",
          }}
        >
          Edit Company Profile
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Update your company information below.
        </p>

        {message && (
          <div
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: "15px",
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
              background: "#ffebee",
              color: "#c62828",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "20px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <FormField
            label="Company Name *"
            name="company_name"
            value={company.company_name}
            onChange={handleChange}
            required
          />

          <FormField
            label="Industry"
            name="industry"
            value={company.industry}
            onChange={handleChange}
            placeholder="e.g. Information Technology"
          />

          <FormField
            label="Website"
            name="website"
            value={company.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />

          <FormField
            label="Location"
            name="location"
            value={company.location}
            onChange={handleChange}
            placeholder="e.g. Johannesburg, Gauteng"
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={company.email}
            onChange={handleChange}
            placeholder="company@example.com"
          />

          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={company.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <div style={{ marginBottom: "25px" }}>
            <label style={labelStyle}>
              Company Description
            </label>

            <textarea
              name="description"
              value={company.description}
              onChange={handleChange}
              placeholder="Tell graduates about your company..."
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

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
                ...primaryButton,
                flex: 1,
                minWidth: "180px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/company-dashboard"
                )
              }
              style={{
                ...secondaryButton,
                flex: 1,
                minWidth: "180px",
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

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d5dce5",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
  color: "#333",
};

const primaryButton = {
  marginTop: "15px",
  padding: "13px 22px",
  background: "#0057B8",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "13px 22px",
  background: "#fff",
  color: "#0057B8",
  border: "2px solid #0057B8",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};