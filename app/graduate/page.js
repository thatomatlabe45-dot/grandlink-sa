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
  // LOAD LOGGED-IN USER + EXISTING GRADUATE
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
        console.error(authError);
        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: graduates, error: graduateError } = await supabase
        .from("graduates")
        .select(
          "id, user_id, full_name, email, phone, qualification, field_of_study, institution, province, career_goals, skills, cv_url, qualification_url"
        )
        .eq("user_id", user.id)
        .order("id", { ascending: true })
        .limit(1);

      if (graduateError) {
        console.error("Graduate lookup error:", graduateError);
        setError(graduateError.message);
        return;
      }

      // =====================================================
      // EXISTING GRADUATE FOUND
      // =====================================================
      if (graduates && graduates.length > 0) {
        const graduate = graduates[0];

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
        setExistingQualificationUrl(graduate.qualification_url || "");

        console.log("Existing graduate loaded:", graduate.id);
      } else {
        // ===================================================
        // NO GRADUATE PROFILE YET
        // ===================================================
        setForm({
          ...emptyForm,
          email: user.email || "",
        });

        setGraduateId(null);
        setExistingCvUrl("");
        setExistingQualificationUrl("");

        console.log("No graduate profile found.");
      }
    } catch (err) {
      console.error("Load profile error:", err);
      setError(err.message || "Could not load graduate profile.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // HANDLE FORM CHANGES
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
    if (!file) return null;

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const filePath = `${folder}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
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
  // SUBMIT / UPDATE PROFILE
  // =========================================================
  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // =====================================================
      // VALIDATION
      // =====================================================
      if (!form.full_name.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!form.email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (!form.phone.trim()) {
        throw new Error("Please enter your phone number.");
      }

      if (!form.qualification.trim()) {
        throw new Error("Please enter your qualification.");
      }

      if (!form.field_of_study.trim()) {
        throw new Error("Please enter your field of study.");
      }

      // =====================================================
      // FIND EXISTING GRADUATE
      // =====================================================
      const {
        data: existingGraduates,
        error: findError,
      } = await supabase
        .from("graduates")
        .select("id, cv_url, qualification_url")
        .eq("user_id", user.id)
        .order("id", { ascending: true })
        .limit(1);

      if (findError) {
        console.error("Find graduate error:", findError);
        throw findError;
      }

      let existingGraduate = null;

      if (
        existingGraduates &&
        existingGraduates.length > 0
      ) {
        existingGraduate = existingGraduates[0];
      }

      // =====================================================
      // CV
      // Keep old CV unless a new one is selected
      // =====================================================
      let cvUrl =
        existingGraduate?.cv_url ||
        existingCvUrl ||
        null;

      if (cvFile) {
        console.log("Uploading new CV...");
        cvUrl = await uploadFile(cvFile, "cv");
      }

      // =====================================================
      // QUALIFICATION DOCUMENT
      // Keep old document unless a new one is selected
      // =====================================================
      let qualificationUrl =
        existingGraduate?.qualification_url ||
        existingQualificationUrl ||
        null;

      if (qualificationFile) {
        console.log(
          "Uploading new qualification document..."
        );

        qualificationUrl = await uploadFile(
          qualificationFile,
          "qualifications"
        );
      }

      // =====================================================
      // GRADUATE DATA
      // =====================================================
      const graduateData = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        qualification: form.qualification.trim(),
        field_of_study: form.field_of_study.trim(),
        institution: form.institution.trim(),
        province: form.province.trim(),
        career_goals: form.career_goals.trim(),
        skills: form.skills.trim(),
        cv_url: cvUrl,
        qualification_url: qualificationUrl,
      };

      // =====================================================
      // UPDATE EXISTING GRADUATE
      // =====================================================
      if (existingGraduate) {
        console.log(
          "Updating existing graduate:",
          existingGraduate.id
        );

        const {
          data: updatedGraduates,
          error: updateError,
        } = await supabase
          .from("graduates")
          .update(graduateData)
          .eq("id", existingGraduate.id)
          .select("id");

        if (updateError) {
          console.error(
            "Update graduate error:",
            updateError
          );
          throw updateError;
        }

        // Confirm that the update actually returned a graduate
        if (
          !updatedGraduates ||
          updatedGraduates.length === 0
        ) {
          throw new Error(
            "Your graduate profile could not be updated."
          );
        }

        const updatedGraduate =
          updatedGraduates[0];

        setGraduateId(updatedGraduate.id);

        console.log(
          "Graduate updated successfully:",
          updatedGraduate
        );

        setMessage(
          "✅ Your graduate profile and documents have been updated successfully!"
        );
      }

      // =====================================================
      // INSERT NEW GRADUATE
      // =====================================================
      else {
        console.log(
          "Creating new graduate profile..."
        );

        const {
          data: newGraduates,
          error: insertError,
        } = await supabase
          .from("graduates")
          .insert(graduateData)
          .select("id");

        if (insertError) {
          console.error(
            "Insert graduate error:",
            insertError
          );
          throw insertError;
        }

        if (
          !newGraduates ||
          newGraduates.length === 0
        ) {
          throw new Error(
            "Your graduate profile could not be created."
          );
        }

        const newGraduate =
          newGraduates[0];

        setGraduateId(newGraduate.id);

        console.log(
          "Graduate created successfully:",
          newGraduate
        );

        setMessage(
          "✅ Your graduate profile and documents have been created successfully!"
        );
      }

      // =====================================================
      // UPDATE LOCAL STATE
      // =====================================================
      setExistingCvUrl(cvUrl || "");
      setExistingQualificationUrl(
        qualificationUrl || ""
      );

      setCvFile(null);
      setQualificationFile(null);

      // Reset file inputs
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

      // Reload profile from Supabase
      await loadGraduateProfile();
    } catch (err) {
      console.error(
        "Save graduate profile error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while updating your graduate profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <>
        <Navbar />

        <main
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <h1>Loading Graduate Profile...</h1>
          <p>Please wait.</p>
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
            borderRadius: "16px",
            padding: "30px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              marginBottom: "10px",
              fontSize: "32px",
              fontWeight: "700",
            }}
          >
            🎓 Graduate Profile
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
            }}
          >
            Keep your graduate profile and documents up to date.
          </p>

          {/* SUCCESS MESSAGE */}
          {message && (
            <div
              style={{
                background: "#dcfce7",
                color: "#166534",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontWeight: "600",
              }}
            >
              {message}
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontWeight: "600",
              }}
            >
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* FULL NAME */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="full_name"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                style={inputStyle}
              />
            </div>

            {/* EMAIL */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={inputStyle}
              />
            </div>

            {/* PHONE */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="phone"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                style={inputStyle}
              />
            </div>

            {/* QUALIFICATION */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="qualification"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Qualification
              </label>

              <input
                id="qualification"
                name="qualification"
                type="text"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. Diploma in Information Technology"
                style={inputStyle}
              />
            </div>

            {/* FIELD OF STUDY */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="field_of_study"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Field of Study
              </label>

              <input
                id="field_of_study"
                name="field_of_study"
                type="text"
                value={form.field_of_study}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                style={inputStyle}
              />
            </div>

            {/* INSTITUTION */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="institution"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Institution
              </label>

              <input
                id="institution"
                name="institution"
                type="text"
                value={form.institution}
                onChange={handleChange}
                placeholder="e.g. University of Johannesburg"
                style={inputStyle}
              />
            </div>

            {/* PROVINCE */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="province"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
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
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="skills"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Skills
              </label>

              <textarea
                id="skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. JavaScript, HTML, CSS, Communication"
                rows="4"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {/* CAREER GOALS */}
            <div style={{ marginBottom: "25px" }}>
              <label
                htmlFor="career_goals"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Career Goals
              </label>

              <textarea
                id="career_goals"
                name="career_goals"
                value={form.career_goals}
                onChange={handleChange}
                placeholder="Tell companies about your career goals"
                rows="5"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {/* CV */}
            <div
              style={{
                marginBottom: "25px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              <label
                htmlFor="cv"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                }}
              >
                📄 CV
              </label>

              {existingCvUrl && (
                <p
                  style={{
                    color: "#166534",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  ✅ CV already uploaded. Select a new file below only if you want to replace it.
                </p>
              )}

              <input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  setCvFile(
                    e.target.files?.[0] || null
                  );
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginTop: "8px",
                }}
              >
                Accepted: PDF, DOC, DOCX
              </p>
            </div>

            {/* QUALIFICATION DOCUMENT */}
            <div
              style={{
                marginBottom: "30px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              <label
                htmlFor="qualification_document"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                }}
              >
                🎓 Qualification Document
              </label>

              {existingQualificationUrl && (
                <p
                  style={{
                    color: "#166534",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  ✅ Qualification document already uploaded. Select a new file only if you want to replace it.
                </p>
              )}

              <input
                id="qualification_document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  setQualificationFile(
                    e.target.files?.[0] || null
                  );
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginTop: "8px",
                }}
              >
                Accepted: PDF, JPG, JPEG, PNG
              </p>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: saving
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Updating Profile..."
                : graduateId
                ? "Update Graduate Profile"
                : "Create Graduate Profile"}
            </button>

          </form>
        </div>
      </main>
    </>
  );
}

// =============================================================
// INPUT STYLE
// =============================================================
const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "#ffffff",
};