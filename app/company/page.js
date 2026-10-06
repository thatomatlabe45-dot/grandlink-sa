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
};

export default function CompanyPage() {
  const router = useRouter();

  const [company, setCompany] = useState(emptyCompany);
  const [companyId, setCompanyId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // LOAD COMPANY
  // ============================================================

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      try {
        // --------------------------------------------------------
        // GET LOGGED-IN USER
        // --------------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // --------------------------------------------------------
        // VERIFY ACTIVE COMPANY SUBSCRIPTION
        // --------------------------------------------------------

        const {
          data: subscription,
          error: subscriptionError,
        } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .ilike("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Subscription check error:",
            subscriptionError
          );

          setErrorMessage(
            "We could not verify your company subscription. Please try again."
          );

          setLoading(false);
          return;
        }

        // --------------------------------------------------------
        // COMPANY PROFILE REQUIRES VERIFIED PAYMENT
        // --------------------------------------------------------

        if (!subscription) {
          router.replace("/company-pricing");
          return;
        }

        // --------------------------------------------------------
        // LOAD COMPANY PROFILE
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // LOAD EXISTING COMPANY
        // --------------------------------------------------------

        if (companyData) {
          setCompanyId(companyData.id);

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
      } catch (error) {
        console.error("Company page error:", error);

        setErrorMessage(
          error?.message ||
            "Something went wrong while loading your company profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [router]);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setCompany((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  }

  // ============================================================
  // SAVE COMPANY
  // ============================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      // --------------------------------------------------------
      // GET USER
      // --------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // --------------------------------------------------------
      // VERIFY ACTIVE SUBSCRIPTION AGAIN
      // --------------------------------------------------------

      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("id, status, plan, amount")
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

        setSaving(false);
        return;
      }

      if (!subscription) {
        setErrorMessage(
          "Your company profile requires an active paid subscription."
        );

        setSaving(false);

        setTimeout(() => {
          router.push("/company-pricing");
        }, 1200);

        return;
      }

      // --------------------------------------------------------
      // VALIDATE COMPANY NAME
      // --------------------------------------------------------

      const newCompanyName = company.company_name.trim();

      if (!newCompanyName) {
        setErrorMessage("Company name is required.");
        setSaving(false);
        return;
      }

      // --------------------------------------------------------
      // PREPARE COMPANY DATA
      // --------------------------------------------------------

      const companyData = {
        company_name: newCompanyName,
        industry: company.industry.trim(),
        website: company.website.trim(),
        location: company.location.trim(),
        email: company.email.trim(),
        phone: company.phone.trim(),
        description: company.description.trim(),
      };

      // --------------------------------------------------------
      // FIND EXISTING COMPANY
      // --------------------------------------------------------

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

      // ========================================================
      // UPDATE EXISTING COMPANY
      // ========================================================

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

        // ------------------------------------------------------
        // UPDATE EXISTING INTERNSHIPS IF COMPANY NAME CHANGED
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // UPDATE STATE
        // ------------------------------------------------------

        setCompanyId(updatedCompany.id);

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
          "Company profile and internships updated successfully."
        );

        setSaving(false);
        return;
      }

      // ========================================================
      // CREATE COMPANY
      // ========================================================

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

      if (!createdCompany) {
        throw new Error(
          "Company profile could not be created."
        );
      }

      setCompanyId(createdCompany.id);

      setCompany({
        company_name: createdCompany.company_name || "",
        industry: createdCompany.industry || "",
        website: createdCompany.website || "",
        location: createdCompany.location || "",
        email: createdCompany.email || "",
        phone: createdCompany.phone || "",
        description: createdCompany.description || "",
      });

      setMessage(
        "Company profile created successfully."
      );
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

  // ============================================================
  // DASHBOARD
  // ============================================================

  function goToDashboard() {
    router.push("/company-dashboard");
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={pageStyle}>
        <SiteHeader />

        <main style={loadingContainer}>
          <div style={loadingOrb}>
            <div style={loadingDot}></div>
          </div>

          <h2 style={loadingTitle}>
            Loading company profile
          </h2>

          <p style={loadingText}>
            Verifying your company access...
          </p>
        </main>

        <SiteFooter />
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div style={pageStyle}>
      <SiteHeader />

      <main>
        {/* ======================================================
            HERO
        ====================================================== */}

        <section style={heroSection}>
          <div style={heroGlowOne}></div>
          <div style={heroGlowTwo}></div>

          <div style={heroContent}>
            <div style={eyebrow}>
              <span style={eyebrowDot}></span>
              COMPANY PROFILE
            </div>

            <h1 style={heroTitle}>
              Build a company profile
              <span style={heroAccent}> graduates trust.</span>
            </h1>

            <p style={heroDescription}>
              Tell graduates who you are, what you do and where
              your organisation is based. A strong company profile
              helps attract the right candidates on GradLink SA.
            </p>

            <div style={heroActions}>
              <button
                type="button"
                onClick={goToDashboard}
                style={secondaryHeroButton}
              >
                ← Dashboard
              </button>

              <div style={verifiedBadge}>
                <span style={verifiedIcon}>✓</span>
                Paid access verified
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            PROFILE FORM
        ====================================================== */}

        <section style={contentSection}>
          <div style={contentContainer}>
            {/* TOP INTRO */}
            <div style={sectionIntro}>
              <div>
                <p style={sectionEyebrow}>
                  {companyId
                    ? "UPDATE YOUR PROFILE"
                    : "COMPLETE YOUR PROFILE"}
                </p>

                <h2 style={sectionTitle}>
                  Company information
                </h2>

                <p style={sectionDescription}>
                  Keep your organisation details accurate so
                  graduates can understand your business before
                  applying.
                </p>
              </div>

              {companyId && (
                <div style={savedBadge}>
                  <span>✓</span>
                  Profile active
                </div>
              )}
            </div>

            {/* MESSAGES */}

            {message && (
              <div style={successBox}>
                <div style={successIcon}>✓</div>

                <div>
                  <strong>Saved successfully</strong>

                  <p>{message}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={errorBox}>
                <div style={errorIcon}>!</div>

                <div>
                  <strong>Something went wrong</strong>

                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              {/* ==================================================
                  SECTION 01
              ================================================== */}

              <div style={formSection}>
                <div style={formSectionHeader}>
                  <div style={numberBadge}>01</div>

                  <div>
                    <h3 style={formSectionTitle}>
                      Organisation details
                    </h3>

                    <p style={formSectionDescription}>
                      The basics graduates need to know.
                    </p>
                  </div>
                </div>

                <div style={formGrid}>
                  <div style={fieldFull}>
                    <label style={labelStyle}>
                      Company Name
                      <span style={requiredMark}>*</span>
                    </label>

                    <input
                      name="company_name"
                      placeholder="e.g. ABC Technologies"
                      value={company.company_name}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={fieldHalf}>
                    <label style={labelStyle}>
                      Industry
                      <span style={requiredMark}>*</span>
                    </label>

                    <input
                      name="industry"
                      placeholder="e.g. Information Technology"
                      value={company.industry}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={fieldHalf}>
                    <label style={labelStyle}>
                      Location
                      <span style={requiredMark}>*</span>
                    </label>

                    <input
                      name="location"
                      placeholder="e.g. Johannesburg, Gauteng"
                      value={company.location}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================
                  SECTION 02
              ================================================== */}

              <div style={formSection}>
                <div style={formSectionHeader}>
                  <div style={numberBadge}>02</div>

                  <div>
                    <h3 style={formSectionTitle}>
                      Contact details
                    </h3>

                    <p style={formSectionDescription}>
                      Give candidates a professional way to
                      identify your organisation.
                    </p>
                  </div>
                </div>

                <div style={formGrid}>
                  <div style={fieldHalf}>
                    <label style={labelStyle}>
                      Company Email
                      <span style={requiredMark}>*</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      placeholder="company@example.co.za"
                      value={company.email}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={fieldHalf}>
                    <label style={labelStyle}>
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      placeholder="+27 00 000 0000"
                      value={company.phone}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldFull}>
                    <label style={labelStyle}>
                      Company Website
                    </label>

                    <input
                      type="url"
                      name="website"
                      placeholder="https://www.example.co.za"
                      value={company.website}
                      onChange={handleChange}
                      style={inputStyle}
                    />

                    <p style={fieldHint}>
                      Adding your website helps graduates learn
                      more about your organisation.
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  SECTION 03
              ================================================== */}

              <div style={formSection}>
                <div style={formSectionHeader}>
                  <div style={numberBadge}>03</div>

                  <div>
                    <h3 style={formSectionTitle}>
                      About your company
                    </h3>

                    <p style={formSectionDescription}>
                      Make your organisation stand out to
                      graduate talent.
                    </p>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Company Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Tell graduates about your organisation, your work, your culture and the opportunities you offer..."
                    value={company.description}
                    onChange={handleChange}
                    rows={7}
                    style={textareaStyle}
                  />

                  <p style={fieldHint}>
                    A clear description can help candidates
                    understand whether your organisation is the
                    right fit for them.
                  </p>
                </div>
              </div>

              {/* ==================================================
                  PROFILE PREVIEW NOTE
              ================================================== */}

              <div style={profileNote}>
                <div style={profileNoteIcon}>✦</div>

                <div>
                  <h3 style={profileNoteTitle}>
                    Your profile represents your organisation
                  </h3>

                  <p style={profileNoteText}>
                    Keep your company name, contact details and
                    description professional and up to date.
                    These details can be used throughout your
                    GradLink SA hiring experience.
                  </p>
                </div>
              </div>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div style={actionArea}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButton,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {saving
                    ? "Saving profile..."
                    : companyId
                    ? "Save Changes"
                    : "Create Company Profile"}
                </button>

                <button
                  type="button"
                  onClick={goToDashboard}
                  style={secondaryButton}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* ==========================================================
          MOBILE / PAGE STYLES
      ========================================================== */}

      <style jsx>{`
        @media (max-width: 760px) {
          .company-hero {
            padding: 56px 20px !important;
          }

          .company-hero-title {
            font-size: 40px !important;
            line-height: 1.08 !important;
          }

          .company-content {
            padding: 42px 16px !important;
          }

          .company-form-grid {
            grid-template-columns: 1fr !important;
          }

          .company-half {
            width: 100% !important;
          }

          .company-section-intro {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .company-actions {
            flex-direction: column !important;
          }

          .company-actions button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// PAGE STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f9ff",
  color: "#10233f",
};

const loadingContainer = {
  minHeight: "70vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px 20px",
  textAlign: "center",
};

const loadingOrb = {
  width: "58px",
  height: "58px",
  borderRadius: "50%",
  background:
    "linear-gradient(135deg, #0057B8, #0b78e3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "20px",
  boxShadow: "0 12px 35px rgba(0,87,184,0.25)",
};

const loadingDot = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
};

const loadingTitle = {
  margin: "0 0 8px",
  color: "#10233f",
  fontSize: "24px",
  fontWeight: "800",
};

const loadingText = {
  margin: 0,
  color: "#718096",
  fontSize: "15px",
};

const heroSection = {
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #032f6b 0%, #0057B8 55%, #0878df 100%)",
  padding: "76px 20px 82px",
};

const heroGlowOne = {
  position: "absolute",
  width: "360px",
  height: "360px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.08)",
  top: "-180px",
  right: "-100px",
};

const heroGlowTwo = {
  position: "absolute",
  width: "260px",
  height: "260px",
  borderRadius: "50%",
  background: "rgba(80,180,255,0.12)",
  bottom: "-150px",
  left: "-80px",
};

const heroContent = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1050px",
  margin: "0 auto",
};

const eyebrow = {
  display: "inline-flex",
  alignItems: "center",
  gap: "9px",
  color: "#d9efff",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "1.8px",
  marginBottom: "18px",
};

const eyebrowDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#ffffff",
  boxShadow: "0 0 0 5px rgba(255,255,255,0.12)",
};

const heroTitle = {
  maxWidth: "760px",
  margin: 0,
  color: "#ffffff",
  fontSize: "58px",
  lineHeight: "1.05",
  letterSpacing: "-2px",
  fontWeight: "900",
};

const heroAccent = {
  display: "block",
  color: "#aee0ff",
};

const heroDescription = {
  maxWidth: "680px",
  margin: "24px 0 0",
  color: "#e7f4ff",
  fontSize: "18px",
  lineHeight: "1.7",
};

const heroActions = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginTop: "30px",
};

const secondaryHeroButton = {
  border: "1px solid rgba(255,255,255,0.5)",
  background: "rgba(255,255,255,0.1)",
  color: "#ffffff",
  padding: "13px 20px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
};

const verifiedBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "9px",
  padding: "11px 15px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700",
};

const verifiedIcon = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  background: "#ffffff",
  color: "#0057B8",
  fontSize: "13px",
  fontWeight: "900",
};

const contentSection = {
  padding: "58px 20px 80px",
};

const contentContainer = {
  maxWidth: "1050px",
  margin: "0 auto",
};

const sectionIntro = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "25px",
  marginBottom: "30px",
};

const sectionEyebrow = {
  margin: "0 0 7px",
  color: "#0057B8",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "1.7px",
};

const sectionTitle = {
  margin: 0,
  color: "#10233f",
  fontSize: "34px",
  lineHeight: "1.15",
  fontWeight: "900",
};

const sectionDescription = {
  maxWidth: "680px",
  margin: "10px 0 0",
  color: "#66778d",
  fontSize: "15px",
  lineHeight: "1.7",
};

const savedBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
  padding: "9px 13px",
  borderRadius: "999px",
  background: "#eaf6ef",
  color: "#167744",
  fontSize: "13px",
  fontWeight: "800",
  border: "1px solid #c9e9d5",
};

const successBox = {
  display: "flex",
  gap: "13px",
  alignItems: "flex-start",
  padding: "17px",
  marginBottom: "24px",
  borderRadius: "14px",
  background: "#edf9f2",
  border: "1px solid #c8ead5",
  color: "#176b3b",
};

const successIcon = {
  width: "30px",
  height: "30px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#d4f0de",
  fontWeight: "900",
};

const errorBox = {
  display: "flex",
  gap: "13px",
  alignItems: "flex-start",
  padding: "17px",
  marginBottom: "24px",
  borderRadius: "14px",
  background: "#fff3f3",
  border: "1px solid #f1caca",
  color: "#a92828",
};

const errorIcon = {
  width: "30px",
  height: "30px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#ffe0e0",
  fontWeight: "900",
};

const formSection = {
  background: "#ffffff",
  border: "1px solid #e3ebf5",
  borderRadius: "18px",
  padding: "30px",
  marginBottom: "20px",
  boxShadow: "0 8px 28px rgba(15,57,95,0.05)",
};

const formSectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "27px",
};

const numberBadge = {
  width: "42px",
  height: "42px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  background: "#eaf3ff",
  color: "#0057B8",
  fontSize: "13px",
  fontWeight: "900",
  letterSpacing: "0.5px",
};

const formSectionTitle = {
  margin: 0,
  color: "#10233f",
  fontSize: "19px",
  fontWeight: "850",
};

const formSectionDescription = {
  margin: "4px 0 0",
  color: "#7b8a9d",
  fontSize: "13px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0 18px",
};

const fieldFull = {
  gridColumn: "1 / -1",
};

const fieldHalf = {
  minWidth: 0,
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#263b55",
  fontSize: "14px",
  fontWeight: "800",
};

const requiredMark = {
  color: "#0057B8",
  marginLeft: "4px",
};

const inputStyle = {
  width: "100%",
  minHeight: "52px",
  padding: "13px 15px",
  marginBottom: "20px",
  border: "1px solid #d9e3ef",
  borderRadius: "11px",
  background: "#fbfdff",
  color: "#172b45",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: "14px 15px",
  border: "1px solid #d9e3ef",
  borderRadius: "11px",
  background: "#fbfdff",
  color: "#172b45",
  fontSize: "16px",
  lineHeight: "1.6",
  outline: "none",
  resize: "vertical",
  minHeight: "170px",
  boxSizing: "border-box",
};

const fieldHint = {
  margin: "-10px 0 18px",
  color: "#8492a5",
  fontSize: "12px",
  lineHeight: "1.5",
};

const profileNote = {
  display: "flex",
  alignItems: "flex-start",
  gap: "15px",
  padding: "21px",
  marginBottom: "25px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, #edf6ff 0%, #f7fbff 100%)",
  border: "1px solid #d8eaff",
};

const profileNoteIcon = {
  width: "40px",
  height: "40px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  background: "#0057B8",
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: "900",
};

const profileNoteTitle = {
  margin: "1px 0 5px",
  color: "#173451",
  fontSize: "15px",
  fontWeight: "850",
};

const profileNoteText = {
  margin: 0,
  color: "#6e8198",
  fontSize: "13px",
  lineHeight: "1.65",
};

const actionArea = {
  display: "flex",
  gap: "13px",
  flexWrap: "wrap",
};

const primaryButton = {
  flex: "1 1 300px",
  minHeight: "54px",
  padding: "14px 22px",
  border: "none",
  borderRadius: "11px",
  background:
    "linear-gradient(135deg, #0057B8, #0878df)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "850",
  boxShadow: "0 10px 24px rgba(0,87,184,0.2)",
};

const secondaryButton = {
  flex: "0 1 240px",
  minHeight: "54px",
  padding: "14px 22px",
  border: "1px solid #cbd9e8",
  borderRadius: "11px",
  background: "#ffffff",
  color: "#0057B8",
  fontSize: "15px",
  fontWeight: "850",
  cursor: "pointer",
};