"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

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
  logo_url: "",
  company_size: "",
  year_established: "",
  registration_number: "",
  province: "",
  city: "",
  physical_address: "",
  linkedin_url: "",
  recruitment_information: "",
  graduate_fields: "",
};

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const companySizes = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1,000 employees",
  "1,001–5,000 employees",
  "5,000+ employees",
];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  border: "1px solid #d6e1ef",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#10233f",
  fontSize: "15px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  fontWeight: "800",
  color: "#253b59",
};

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e1eaf5",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "22px",
  boxShadow: "0 8px 28px rgba(16,35,63,0.035)",
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  hint,
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={labelStyle} htmlFor={name}>
        {label}
        {required && (
          <span style={{ color: "#dc3545" }}> *</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder || ""}
        required={required}
        style={inputStyle}
      />

      {hint && (
        <p
          style={{
            margin: "7px 0 0",
            color: "#718096",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={labelStyle} htmlFor={name}>
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        style={inputStyle}
      >
        <option value="">
          {placeholder || "Select an option"}
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CompanyPage() {
  const router = useRouter();

  const [company, setCompany] = useState(emptyCompany);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // LOAD PROFILE AND VERIFY ACTIVE SUBSCRIPTION
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const {
          data: subscription,
          error: subscriptionError,
        } = await supabase
          .from("company_subscriptions")
          .select("id, status, plan, created_at")
          .eq("company_id", user.id)
          .ilike("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Subscription verification error:",
            subscriptionError
          );

          if (!cancelled) {
            setErrorMessage(
              "We could not verify your company subscription. Please try again."
            );
          }

          return;
        }

        if (!subscription) {
          router.replace("/company-pricing");
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
          console.error(
            "Company profile loading error:",
            companyError
          );

          if (!cancelled) {
            setErrorMessage(
              "Could not load your company profile. Please try again."
            );
          }

          return;
        }

        if (cancelled) return;

        if (companyData) {
          setCompanyId(companyData.id);

          setCompany({
            ...emptyCompany,
            ...Object.fromEntries(
              Object.keys(emptyCompany).map((key) => [
                key,
                companyData[key] == null
                  ? ""
                  : String(companyData[key]),
              ])
            ),
          });

          setLogoPreview(companyData.logo_url || "");
        } else {
          setCompany({
            ...emptyCompany,
            email: user.email || "",
          });
        }
      } catch (error) {
        console.error("Company profile error:", error);

        if (!cancelled) {
          setErrorMessage(
            error?.message ||
              "Something went wrong while loading your profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ============================================================
  // FORM INPUTS
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setCompany((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  }

  // ============================================================
  // LOGO SELECTION
  // ============================================================

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setErrorMessage("");

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Your logo is too large. Please select an image smaller than 5MB."
      );

      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Please upload a PNG, JPG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // ============================================================
  // UPLOAD LOGO TO SUPABASE STORAGE
  // ============================================================

  async function uploadCompanyLogo(userId) {
    if (!selectedLogo) {
      return company.logo_url || "";
    }

    setUploadingLogo(true);

    try {
      const extension =
        selectedLogo.name.split(".").pop()?.toLowerCase() ||
        "png";

      const safeExtension =
        extension === "jpeg" ? "jpg" : extension;

      const filePath =
        `${userId}/company-logo-${Date.now()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, selectedLogo, {
          cacheControl: "3600",
          upsert: true,
          contentType: selectedLogo.type,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message ||
            "The company logo could not be uploaded."
        );
      }

      const { data } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error(
          "The logo was uploaded, but its public URL could not be created."
        );
      }

      return data.publicUrl;
    } finally {
      setUploadingLogo(false);
    }
  }

  // ============================================================
  // SAVE PROFILE
  // ============================================================

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
        router.replace("/login");
        return;
      }

      // Verify the company has an active subscription.
      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("id, status, plan, created_at")
        .eq("company_id", user.id)
        .ilike("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Subscription verification error:",
          subscriptionError
        );

        setErrorMessage(
          "We could not verify your active subscription."
        );

        return;
      }

      if (!subscription) {
        setErrorMessage(
          "An active paid subscription is required to manage your company profile."
        );

        setTimeout(() => {
          router.push("/company-pricing");
        }, 1200);

        return;
      }

      if (!company.company_name.trim()) {
        setErrorMessage("Please enter your company name.");
        return;
      }

      if (!company.industry.trim()) {
        setErrorMessage("Please enter your industry.");
        return;
      }

      if (!company.email.trim()) {
        setErrorMessage("Please enter your company email.");
        return;
      }

      // Upload a newly selected logo, if any.
      let finalLogoUrl = company.logo_url || "";

      if (selectedLogo) {
        finalLogoUrl = await uploadCompanyLogo(user.id);
      }

      // Keep the original fields and save the new fields.
      const companyData = {
        company_name: company.company_name.trim(),
        industry: company.industry.trim(),
        website: company.website.trim(),
        location: company.location.trim(),
        email: company.email.trim(),
        phone: company.phone.trim(),
        description: company.description.trim(),
        logo_url: finalLogoUrl,

        company_size: company.company_size.trim(),

        year_established: company.year_established.trim()
          ? Number(company.year_established)
          : null,

        registration_number:
          company.registration_number.trim(),

        province: company.province.trim(),
        city: company.city.trim(),
        physical_address: company.physical_address.trim(),
        linkedin_url: company.linkedin_url.trim(),

        recruitment_information:
          company.recruitment_information.trim(),

        graduate_fields: company.graduate_fields.trim(),
      };

      if (
        companyData.year_established !== null &&
        (
          !Number.isInteger(companyData.year_established) ||
          companyData.year_established < 1800 ||
          companyData.year_established > new Date().getFullYear()
        )
      ) {
        setErrorMessage(
          "Please enter a valid year established."
        );

        return;
      }

      const {
        data: existingCompany,
        error: findError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (findError) {
        console.error("Company lookup error:", findError);
        throw findError;
      }

      let savedCompany;

      if (existingCompany) {
        const previousName =
          existingCompany.company_name || "";

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
          console.error(
            "Company update error:",
            updateError
          );

          throw updateError;
        }

        savedCompany = updatedCompany;

        // Keep existing internship company names in sync.
        if (
          previousName &&
          previousName !== companyData.company_name
        ) {
          const { error: internshipError } =
            await supabase
              .from("internships")
              .update({
                company_name: companyData.company_name,
              })
              .eq("company_name", previousName);

          if (internshipError) {
            console.error(
              "Internship name update error:",
              internshipError
            );
          }
        }
      } else {
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
          console.error(
            "Company creation error:",
            insertError
          );

          throw insertError;
        }

        savedCompany = createdCompany;
      }

      if (!savedCompany) {
        throw new Error(
          "Your company profile could not be saved."
        );
      }

      setCompanyId(savedCompany.id);

      setCompany({
        ...emptyCompany,
        ...Object.fromEntries(
          Object.keys(emptyCompany).map((key) => [
            key,
            savedCompany[key] == null
              ? ""
              : String(savedCompany[key]),
          ])
        ),
      });

      setLogoPreview(savedCompany.logo_url || "");
      setSelectedLogo(null);

      setMessage(
        "Your company profile and information have been saved successfully."
      );
    } catch (error) {
      console.error("Save company profile error:", error);

      setErrorMessage(
        error?.message ||
          "Something went wrong while saving your company profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function goToDashboard() {
    router.push("/company-dashboard");
  }

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <SiteHeader />

        <main style={styles.loading}>
          <div style={styles.spinner}></div>

          <h2>Loading company profile</h2>

          <p>
            Verifying your company subscription...
          </p>
        </main>

        <SiteFooter />
      </div>
    );
  }

  // ============================================================
  // COMPANY PROFILE PAGE
  // ============================================================

  return (
    <div style={styles.page}>
      <SiteHeader />

      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>
            GRADLINK SA · COMPANY PORTAL
          </div>

          <h1 style={styles.heroTitle}>
            Build a profile
            <br />
            graduates can trust.
          </h1>

          <p style={styles.heroText}>
            Showcase your organisation, strengthen your
            employer brand and help South African graduates
            understand the opportunities you offer.
          </p>

          <div style={styles.heroActions}>
            <button
              type="button"
              onClick={goToDashboard}
              style={styles.heroButton}
            >
              ← Company Dashboard
            </button>

            <span style={styles.verified}>
              ✓ Active subscription verified
            </span>
          </div>
        </div>
      </section>

      <main style={styles.main}>
        <div style={styles.headingRow}>
          <div>
            <p style={styles.overline}>
              {companyId
                ? "MANAGE YOUR ORGANISATION"
                : "GET YOUR ORGANISATION STARTED"}
            </p>

            <h2 style={styles.pageTitle}>
              Company profile
            </h2>

            <p style={styles.pageDescription}>
              Complete these details to give graduates
              a clearer picture of your organisation.
            </p>
          </div>

          {companyId && (
            <span style={styles.activeBadge}>
              ✓ Profile saved
            </span>
          )}
        </div>

        {message && (
          <div style={styles.successMessage}>
            <strong>✓ Saved successfully</strong>
            <p>{message}</p>
          </div>
        )}

        {errorMessage && (
          <div style={styles.errorMessage}>
            <strong>We could not complete that action</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: LOGO */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>01</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  Company branding
                </h3>

                <p style={styles.sectionDescription}>
                  Upload your official company logo.
                </p>
              </div>
            </div>

            <div style={styles.logoRow}>
              <div style={styles.logoPreview}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    style={styles.logoImage}
                  />
                ) : (
                  <div style={styles.logoPlaceholder}>
                    <span style={{ fontSize: 34 }}>🏢</span>
                    <span>No logo selected</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <label
                  htmlFor="company-logo"
                  style={styles.uploadButton}
                >
                  {selectedLogo
                    ? "Choose another logo"
                    : "Upload company logo"}
                </label>

                <input
                  id="company-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />

                <p style={styles.hint}>
                  PNG, JPG or WEBP. Maximum size: 5MB.
                </p>

                <p style={styles.hint}>
                  Your logo can be used on your company
                  profile and internship listings.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: BASIC INFORMATION */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>02</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  Organisation details
                </h3>

                <p style={styles.sectionDescription}>
                  Tell graduates who you are.
                </p>
              </div>
            </div>

            <div style={styles.grid}>
              <Field
                label="Company name"
                name="company_name"
                value={company.company_name}
                onChange={handleChange}
                placeholder="e.g. ABC Technologies"
                required
              />

              <Field
                label="Industry"
                name="industry"
                value={company.industry}
                onChange={handleChange}
                placeholder="e.g. Information Technology"
                required
              />

              <SelectField
                label="Company size"
                name="company_size"
                value={company.company_size}
                onChange={handleChange}
                options={companySizes}
                placeholder="Select employee range"
              />

              <Field
                label="Year established"
                name="year_established"
                type="number"
                value={company.year_established}
                onChange={handleChange}
                placeholder="e.g. 2018"
                hint="Enter a year between 1800 and the current year."
              />

              <Field
                label="Company registration number"
                name="registration_number"
                value={company.registration_number}
                onChange={handleChange}
                placeholder="Optional registration number"
              />

              <Field
                label="Company website"
                name="website"
                value={company.website}
                onChange={handleChange}
                placeholder="www.example.co.za"
                hint="Enter your website address. URL formatting is not enforced."
              />
            </div>
          </section>

          {/* SECTION 3: LOCATION */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>03</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  Business location
                </h3>

                <p style={styles.sectionDescription}>
                  Help graduates identify where your
                  organisation operates.
                </p>
              </div>
            </div>

            <div style={styles.grid}>
              <SelectField
                label="Province"
                name="province"
                value={company.province}
                onChange={handleChange}
                options={provinces}
                placeholder="Select province"
              />

              <Field
                label="City or town"
                name="city"
                value={company.city}
                onChange={handleChange}
                placeholder="e.g. Johannesburg"
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="General location"
                  name="location"
                  value={company.location}
                  onChange={handleChange}
                  placeholder="e.g. Sandton, Johannesburg"
                  hint="This field is retained for compatibility with existing GradLink SA listings."
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle} htmlFor="physical_address">
                  Physical business address
                </label>

                <textarea
                  id="physical_address"
                  name="physical_address"
                  value={company.physical_address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter your business address"
                  style={styles.textarea}
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: CONTACT */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>04</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  Contact information
                </h3>

                <p style={styles.sectionDescription}>
                  Provide professional contact details.
                </p>
              </div>
            </div>

            <div style={styles.grid}>
              <Field
                label="Company email"
                name="email"
                type="email"
                value={company.email}
                onChange={handleChange}
                placeholder="company@example.co.za"
                required
              />

              <Field
                label="Business phone"
                name="phone"
                type="tel"
                value={company.phone}
                onChange={handleChange}
                placeholder="+27 00 000 0000"
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="LinkedIn company page"
                  name="linkedin_url"
                  value={company.linkedin_url}
                  onChange={handleChange}
                  placeholder="LinkedIn company page address"
                />
              </div>
            </div>
          </section>

          {/* SECTION 5: ABOUT THE COMPANY */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>05</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  About your organisation
                </h3>

                <p style={styles.sectionDescription}>
                  Explain what makes your company a great
                  place for graduates to develop their careers.
                </p>
              </div>
            </div>

            <label style={labelStyle} htmlFor="description">
              Company description
            </label>

            <textarea
              id="description"
              name="description"
              value={company.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe your organisation, its work, its values and the opportunities it offers..."
              style={styles.textarea}
            />
          </section>

          {/* SECTION 6: RECRUITMENT */}

          <section style={sectionStyle}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionNumber}>06</span>

              <div>
                <h3 style={styles.sectionTitle}>
                  Graduate recruitment
                </h3>

                <p style={styles.sectionDescription}>
                  Tell candidates what you look for when
                  recruiting graduates.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={labelStyle}
                htmlFor="graduate_fields"
              >
                Graduate fields you recruit
              </label>

              <textarea
                id="graduate_fields"
                name="graduate_fields"
                value={company.graduate_fields}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Accounting, IT, Engineering, Marketing, Human Resources"
                style={styles.textarea}
              />

              <p style={styles.hint}>
                Separate fields with commas if you recruit
                across several disciplines.
              </p>
            </div>

            <label
              style={labelStyle}
              htmlFor="recruitment_information"
            >
              Recruitment information
            </label>

            <textarea
              id="recruitment_information"
              name="recruitment_information"
              value={company.recruitment_information}
              onChange={handleChange}
              rows={5}
              placeholder="Describe your graduate programmes, internship opportunities, application process or recruitment requirements..."
              style={styles.textarea}
            />
          </section>

          {/* PROFILE NOTE */}

          <div style={styles.note}>
            <div style={styles.noteIcon}>✦</div>

            <div>
              <h3 style={styles.noteTitle}>
                Make your organisation stand out
              </h3>

              <p style={styles.noteText}>
                Accurate company information helps graduates
                understand your organisation and the career
                opportunities you provide. Your existing
                profile details will be retained when you
                save changes.
              </p>
            </div>
          </div>

          {/* ACTIONS */}

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={saving || uploadingLogo}
              style={{
                ...styles.saveButton,
                opacity:
                  saving || uploadingLogo ? 0.65 : 1,
                cursor:
                  saving || uploadingLogo
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {uploadingLogo
                ? "Uploading logo..."
                : saving
                ? "Saving profile..."
                : companyId
                ? "Save Company Profile"
                : "Create Company Profile"}
            </button>

            <button
              type="button"
              onClick={goToDashboard}
              style={styles.backButton}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />

      <style jsx>{`
        @media (max-width: 700px) {
          .unused {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// PAGE DESIGN
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f8fe",
    color: "#10233f",
  },

  loading: {
    minHeight: "65vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 20px",
    textAlign: "center",
  },

  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #d9e8fb",
    borderTop: "4px solid #075fc1",
    borderRadius: "50%",
    marginBottom: 18,
    animation: "spin 1s linear infinite",
  },

  hero: {
    background:
      "linear-gradient(125deg, #062c61 0%, #075fc1 60%, #1685e8 100%)",
    padding: "65px 20px",
    color: "#ffffff",
  },

  heroInner: {
    maxWidth: 1100,
    margin: "0 auto",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#bfe2ff",
    marginBottom: 18,
  },

  heroTitle: {
    fontSize: "clamp(34px, 6vw, 55px)",
    lineHeight: 1.08,
    letterSpacing: "-1.5px",
    fontWeight: 900,
    margin: 0,
    maxWidth: 760,
  },

  heroText: {
    maxWidth: 680,
    fontSize: 16,
    lineHeight: 1.8,
    color: "#e4f1ff",
    marginTop: 20,
  },

  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginTop: 28,
  },

  heroButton: {
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },

  verified: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
  },

  main: {
    maxWidth: 1000,
    width: "100%",
    boxSizing: "border-box",
    margin: "0 auto",
    padding: "45px 20px 75px",
  },

  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 28,
  },

  overline: {
    color: "#075fc1",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.7,
    margin: "0 0 8px",
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.7px",
    margin: 0,
  },

  pageDescription: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#687b94",
    maxWidth: 620,
    margin: "10px 0 0",
  },

  activeBadge: {
    background: "#e7f7ee",
    color: "#167744",
    border: "1px solid #c5ead3",
    padding: "9px 13px",
    borderRadius: 30,
    fontSize: 12,
    fontWeight: 800,
  },

  sectionHeading: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 24,
  },

  sectionNumber: {
    display: "flex",
    flexShrink: 0,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    background: "#eaf3ff",
    color: "#075fc1",
    fontSize: 13,
    fontWeight: 900,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 900,
    margin: "2px 0 5px",
  },

  sectionDescription: {
    color: "#728198",
    fontSize: 13,
    lineHeight: 1.6,
    margin: 0,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: 22,
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 22,
  },

  logoPreview: {
    width: 125,
    height: 125,
    border: "1px dashed #b9cce3",
    borderRadius: 15,
    background: "#f6f9fe",
    overflow: "hidden",
    flexShrink: 0,
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#ffffff",
  },

  logoPlaceholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#718198",
    fontSize: 11,
  },

  uploadButton: {
    display: "inline-block",
    padding: "12px 17px",
    background: "#075fc1",
    color: "#ffffff",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },

  hint: {
    color: "#7a899e",
    fontSize: 12,
    lineHeight: 1.6,
    margin: "9px 0 0",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d6e1ef",
    borderRadius: 10,
    background: "#ffffff",
    color: "#10233f",
    fontSize: 14,
    lineHeight: 1.7,
    resize: "vertical",
    fontFamily: "inherit",
  },

  successMessage: {
    background: "#ecf9f1",
    border: "1px solid #c5ead3",
    color: "#176b3b",
    padding: 17,
    borderRadius: 12,
    marginBottom: 22,
    fontSize: 14,
  },

  errorMessage: {
    background: "#fff1f1",
    border: "1px solid #f0c9c9",
    color: "#a32727",
    padding: 17,
    borderRadius: 12,
    marginBottom: 22,
    fontSize: 14,
  },

  note: {
    display: "flex",
    alignItems: "flex-start",
    gap: 15,
    padding: 22,
    border: "1px solid #cfe3fb",
    background:
      "linear-gradient(120deg, #edf5ff, #ffffff)",
    borderRadius: 16,
    marginBottom: 25,
  },

  noteIcon: {
    color: "#075fc1",
    fontSize: 23,
  },

  noteTitle: {
    fontSize: 15,
    fontWeight: 900,
    margin: "0 0 7px",
  },

  noteText: {
    color: "#657891",
    fontSize: 13,
    lineHeight: 1.8,
    margin: 0,
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  saveButton: {
    width: "100%",
    border: "none",
    background:
      "linear-gradient(110deg, #075fc1, #1685e8)",
    color: "#ffffff",
    padding: "16px 20px",
    borderRadius: 11,
    fontSize: 15,
    fontWeight: 900,
    boxShadow: "0 8px 20px rgba(7,95,193,0.18)",
  },

  backButton: {
    width: "100%",
    border: "1px solid #d6e1ef",
    background: "#ffffff",
    color: "#24415f",
    padding: "14px 20px",
    borderRadius: 11,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
};