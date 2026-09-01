"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  qualification: "",
  field_of_study: "",
  institution: "",
  province: "",
  career_goals: "",
  skills: "",
};

export default function GraduatePage() {
  const router = useRouter();

  const [form, setForm] = useState(emptyForm);

  const [cvFile, setCvFile] = useState(null);
  const [qualificationFile, setQualificationFile] = useState(null);

  const [existingCvUrl, setExistingCvUrl] = useState("");
  const [existingQualificationUrl, setExistingQualificationUrl] =
    useState("");

  const [graduateId, setGraduateId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD GRADUATE PROFILE
  // =========================================================

  useEffect(() => {
    loadGraduateProfile();
  }, []);

  async function loadGraduateProfile() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      // -------------------------------------------------------
      // Find graduate profile by logged-in user's ID
      // -------------------------------------------------------

      const {
        data: graduate,
        error: graduateError,
      } = await supabase
        .from("graduates")
        .select(
          "id, user_id, full_name, email, phone, qualification, field_of_study, institution, province, career_goals, skills, cv_url, qualification_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (graduateError) {
        console.error("Graduate lookup error:", graduateError);
        throw graduateError;
      }

      // -------------------------------------------------------
      // Existing profile
      // -------------------------------------------------------

      if (graduate) {
        setGraduateId(graduate.id);

        setForm({
          full_name: graduate.full_name || "",
          email: graduate.email || user.email || "",
          phone: graduate.phone || "",
          qualification: graduate.qualification || "",
          field_of_study: graduate.field_of_study || "",
          institution: graduate.institution || "",
          province: graduate.province || "",
          career_goals: graduate.career_goals || "",
          skills: graduate.skills || "",
        });

        setExistingCvUrl(graduate.cv_url || "");
        setExistingQualificationUrl(
          graduate.qualification_url || ""
        );

        console.log("Graduate profile loaded:", graduate);
      } else {
        // -----------------------------------------------------
        // No profile yet
        // -----------------------------------------------------

        setGraduateId(null);

        setForm({
          ...emptyForm,
          email: user.email || "",
        });

        setExistingCvUrl("");
        setExistingQualificationUrl("");

        console.log("No graduate profile found.");
      }
    } catch (err) {
      console.error("Load graduate profile error:", err);

      setError(
        err.message ||
          "Could not load your graduate profile."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // UPLOAD FILE
  // =========================================================

  async function uploadFile(file, folder) {
    if (!file) {
      return null;
    }

    const safeFileName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const filePath =
      `${folder}/${Date.now()}-${safeFileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      throw uploadError;
    }

    return filePath;
  }

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      // -------------------------------------------------------
      // Get logged-in user
      // -------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // -------------------------------------------------------
      // Validation
      // -------------------------------------------------------

      if (!form.full_name.trim()) {
        throw new Error(
          "Please enter your full name."
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          "Please enter your email."
        );
      }

      if (!form.phone.trim()) {
        throw new Error(
          "Please enter your phone number."
        );
      }

      if (!form.qualification.trim()) {
        throw new Error(
          "Please enter your qualification."
        );
      }

      if (!form.field_of_study.trim()) {
        throw new Error(
          "Please enter your field of study."
        );
      }

      // -------------------------------------------------------
      // Find existing graduate
      // -------------------------------------------------------

      const {
        data: existingGraduate,
        error: findError,
      } = await supabase
        .from("graduates")
        .select(
          "id, cv_url, qualification_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (findError) {
        console.error(
          "Find graduate error:",
          findError
        );

        throw findError;
      }

      // -------------------------------------------------------
      // Keep existing CV unless a new one is selected
      // -------------------------------------------------------

      let cvUrl =
        existingGraduate?.cv_url ||
        existingCvUrl ||
        null;

      if (cvFile) {
        cvUrl = await uploadFile(
          cvFile,
          "cv"
        );
      }

      // -------------------------------------------------------
      // Keep existing qualification document unless replaced
      // -------------------------------------------------------

      let qualificationUrl =
        existingGraduate?.qualification_url ||
        existingQualificationUrl ||
        null;

      if (qualificationFile) {
        qualificationUrl =
          await uploadFile(
            qualificationFile,
            "qualifications"
          );
      }

      // -------------------------------------------------------
      // IMPORTANT:
      // Create the exact data that must be saved.
      //
      // Skills are explicitly included here.
      // -------------------------------------------------------

      const graduateData = {
        user_id: user.id,

        full_name:
          form.full_name.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        qualification:
          form.qualification.trim(),

        field_of_study:
          form.field_of_study.trim(),

        institution:
          form.institution.trim(),

        province:
          form.province.trim(),

        career_goals:
          form.career_goals.trim(),

        skills:
          form.skills.trim(),

        cv_url:
          cvUrl,

        qualification_url:
          qualificationUrl,
      };

      console.log(
        "Saving graduate data:",
        graduateData
      );

      // =====================================================
      // UPDATE EXISTING PROFILE
      // =====================================================

      if (existingGraduate) {
        console.log(
          "Updating graduate ID:",
          existingGraduate.id
        );

        const {
          error: updateError,
        } = await supabase
          .from("graduates")
          .update(graduateData)
          .eq(
            "id",
            existingGraduate.id
          );

        if (updateError) {
          console.error(
            "Update error:",
            updateError
          );

          throw updateError;
        }

        setGraduateId(
          existingGraduate.id
        );

        // -----------------------------------------------------
        // IMPORTANT:
        // Read the profile again directly from Supabase.
        // This confirms that the new skills really saved.
        // -----------------------------------------------------

        const {
          data: savedGraduate,
          error: verifyError,
        } = await supabase
          .from("graduates")
          .select(
            "id, user_id, full_name, email, phone, qualification, field_of_study, institution, province, career_goals, skills, cv_url, qualification_url"
          )
          .eq(
            "id",
            existingGraduate.id
          )
          .single();

        if (verifyError) {
          console.error(
            "Verification error:",
            verifyError
          );

          throw verifyError;
        }

        console.log(
          "Profile saved in Supabase:",
          savedGraduate
        );

        // -----------------------------------------------------
        // Put the SAVED database values back into the form.
        // -----------------------------------------------------

        setForm({
          full_name:
            savedGraduate.full_name || "",

          email:
            savedGraduate.email ||
            user.email ||
            "",

          phone:
            savedGraduate.phone || "",

          qualification:
            savedGraduate.qualification || "",

          field_of_study:
            savedGraduate.field_of_study || "",

          institution:
            savedGraduate.institution || "",

          province:
            savedGraduate.province || "",

          career_goals:
            savedGraduate.career_goals || "",

          skills:
            savedGraduate.skills || "",
        });

        setExistingCvUrl(
          savedGraduate.cv_url || ""
        );

        setExistingQualificationUrl(
          savedGraduate.qualification_url ||
            ""
        );

        setMessage(
          "✅ Your graduate profile has been updated successfully!"
        );
      }

      // =====================================================
      // CREATE NEW PROFILE
      // =====================================================

      else {
        console.log(
          "Creating new graduate profile..."
        );

        const {
          data: newGraduate,
          error: insertError,
        } = await supabase
          .from("graduates")
          .insert(graduateData)
          .select(
            "id, user_id, full_name, email, phone, qualification, field_of_study, institution, province, career_goals, skills, cv_url, qualification_url"
          )
          .single();

        if (insertError) {
          console.error(
            "Insert error:",
            insertError
          );

          throw insertError;
        }

        console.log(
          "New graduate created:",
          newGraduate
        );

        setGraduateId(
          newGraduate.id
        );

        setForm({
          full_name:
            newGraduate.full_name || "",

          email:
            newGraduate.email ||
            user.email ||
            "",

          phone:
            newGraduate.phone || "",

          qualification:
            newGraduate.qualification || "",

          field_of_study:
            newGraduate.field_of_study || "",

          institution:
            newGraduate.institution || "",

          province:
            newGraduate.province || "",

          career_goals:
            newGraduate.career_goals || "",

          skills:
            newGraduate.skills || "",
        });

        setExistingCvUrl(
          newGraduate.cv_url || ""
        );

        setExistingQualificationUrl(
          newGraduate.qualification_url ||
            ""
        );

        setMessage(
          "✅ Your graduate profile has been created successfully!"
        );
      }

      // -------------------------------------------------------
      // Clear selected files
      // -------------------------------------------------------

      setCvFile(null);
      setQualificationFile(null);

      const cvInput =
        document.getElementById("cv");

      const qualificationInput =
        document.getElementById(
          "qualification_document"
        );

      if (cvInput) {
        cvInput.value = "";
      }

      if (qualificationInput) {
        qualificationInput.value = "";
      }
    } catch (err) {
      console.error(
        "Save graduate profile error:",
        err
      );

      setError(
        err.message ||
          "Your graduate profile could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            🎓
          </div>

          <h1>
            Loading Graduate Profile...
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Please wait.
          </p>
        </main>
      </>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "30px 20px 60px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,0.08)",
            border:
              "1px solid #e5e7eb",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "#eaf3ff",
                color: "#0057B8",
                padding: "8px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              GRADLINK SA
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                fontSize: "32px",
                color: "#0f172a",
              }}
            >
              🎓 Graduate Profile
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Keep your information, skills and
              documents up to date.
            </p>
          </div>

          {/* SUCCESS MESSAGE */}

          {message && (
            <div
              style={{
                background: "#ecfdf5",
                color: "#047857",
                border:
                  "1px solid #a7f3d0",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "700",
              }}
            >
              {message}
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border:
                  "1px solid #fecaca",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "700",
              }}
            >
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* FULL NAME */}

            <FormField
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              type="text"
            />

            {/* EMAIL */}

            <FormField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              type="email"
            />

            {/* PHONE */}

            <FormField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              type="tel"
            />

            {/* QUALIFICATION */}

            <FormField
              label="Qualification"
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
              placeholder="e.g. Diploma in Information Technology"
              type="text"
            />

            {/* FIELD */}

            <FormField
              label="Field of Study"
              name="field_of_study"
              value={form.field_of_study}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              type="text"
            />

            {/* INSTITUTION */}

            <FormField
              label="Institution"
              name="institution"
              value={form.institution}
              onChange={handleChange}
              placeholder="e.g. University of Johannesburg"
              type="text"
            />

            {/* PROVINCE */}

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                htmlFor="province"
                style={labelStyle}
              >
                Province
              </label>

              <select
                id="province"
                name="province"
                value={form.province}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">
                  Select Province
                </option>

                <option value="Gauteng">
                  Gauteng
                </option>

                <option value="KwaZulu-Natal">
                  KwaZulu-Natal
                </option>

                <option value="Western Cape">
                  Western Cape
                </option>

                <option value="Eastern Cape">
                  Eastern Cape
                </option>

                <option value="Free State">
                  Free State
                </option>

                <option value="Limpopo">
                  Limpopo
                </option>

                <option value="Mpumalanga">
                  Mpumalanga
                </option>

                <option value="North West">
                  North West
                </option>

                <option value="Northern Cape">
                  Northern Cape
                </option>
              </select>
            </div>

            {/* SKILLS */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                htmlFor="skills"
                style={labelStyle}
              >
                🛠️ Skills
              </label>

              <textarea
                id="skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. JavaScript, HTML, CSS, Communication"
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: "7px",
                }}
              >
                Separate multiple skills with commas.
                Example: JavaScript, HTML, CSS,
                Communication
              </p>
            </div>

            {/* CAREER GOALS */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <label
                htmlFor="career_goals"
                style={labelStyle}
              >
                🎯 Career Goals
              </label>

              <textarea
                id="career_goals"
                name="career_goals"
                value={form.career_goals}
                onChange={handleChange}
                placeholder="Tell companies about your career goals"
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {/* CV */}

            <div
              style={documentBoxStyle}
            >
              <label
                htmlFor="cv"
                style={{
                  ...labelStyle,
                  fontWeight: "700",
                }}
              >
                📄 CV
              </label>

              {existingCvUrl && (
                <div
                  style={{
                    background: "#ecfdf5",
                    color: "#166534",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  ✅ CV already uploaded.
                  <br />
                  Select a new file only if you want
                  to replace it.
                </div>
              )}

              <input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setCvFile(
                    e.target.files?.[0] || null
                  )
                }
              />

              <p style={helpTextStyle}>
                Accepted: PDF, DOC, DOCX
              </p>
            </div>

            {/* QUALIFICATION DOCUMENT */}

            <div
              style={{
                ...documentBoxStyle,
                marginBottom: "30px",
              }}
            >
              <label
                htmlFor="qualification_document"
                style={{
                  ...labelStyle,
                  fontWeight: "700",
                }}
              >
                🎓 Qualification Document
              </label>

              {existingQualificationUrl && (
                <div
                  style={{
                    background: "#ecfdf5",
                    color: "#166534",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  ✅ Qualification document already
                  uploaded.
                  <br />
                  Select a new file only if you want
                  to replace it.
                </div>
              )}

              <input
                id="qualification_document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setQualificationFile(
                    e.target.files?.[0] || null
                  )
                }
              />

              <p style={helpTextStyle}>
                Accepted: PDF, JPG, JPEG, PNG
              </p>
            </div>

            {/* SAVE BUTTON */}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: saving
                  ? "#94a3b8"
                  : "#0057B8",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                boxShadow: saving
                  ? "none"
                  : "0 8px 20px rgba(0,87,184,.20)",
              }}
            >
              {saving
                ? "Saving Profile..."
                : graduateId
                ? "💾 Update Graduate Profile"
                : "🎓 Create Graduate Profile"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

// =============================================================
// FORM FIELD
// =============================================================

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div
      style={{
        marginBottom: "18px",
      }}
    >
      <label
        htmlFor={name}
        style={labelStyle}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// =============================================================
// STYLES
// =============================================================

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "600",
  color: "#1e293b",
};

const documentBoxStyle = {
  marginBottom: "25px",
  padding: "20px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
};

const helpTextStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "8px",
};