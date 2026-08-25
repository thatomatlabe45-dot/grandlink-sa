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
  const [qualificationFile, setQualificationFile] =
    useState(null);

  const [existingCvUrl, setExistingCvUrl] =
    useState("");

  const [existingQualificationUrl, setExistingQualificationUrl] =
    useState("");

  const [graduateId, setGraduateId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

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
        console.error(
          "Auth error:",
          authError
        );

        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // IMPORTANT:
      // Do NOT use .single().
      // This avoids:
      // "Cannot coerce the result to a single JSON object"

      const {
        data: graduates,
        error: graduateError,
      } = await supabase
        .from("graduates")
        .select(
          "id, user_id, full_name, email, phone, qualification, field_of_study, institution, province, career_goals, skills, cv_url, qualification_url"
        )
        .eq("user_id", user.id)
        .order("id", {
          ascending: true,
        })
        .limit(1);

      if (graduateError) {
        console.error(
          "Graduate lookup error:",
          graduateError
        );

        setError(
          graduateError.message
        );

        return;
      }

      // =====================================================
      // EXISTING GRADUATE
      // =====================================================

      if (
        graduates &&
        graduates.length > 0
      ) {
        const graduate =
          graduates[0];

        setGraduateId(
          graduate.id
        );

        setForm({
          full_name:
            graduate.full_name || "",

          email:
            graduate.email ||
            user.email ||
            "",

          phone:
            graduate.phone || "",

          qualification:
            graduate.qualification || "",

          field_of_study:
            graduate.field_of_study || "",

          institution:
            graduate.institution || "",

          province:
            graduate.province || "",

          career_goals:
            graduate.career_goals || "",

          skills:
            graduate.skills || "",
        });

        setExistingCvUrl(
          graduate.cv_url || ""
        );

        setExistingQualificationUrl(
          graduate.qualification_url || ""
        );

        console.log(
          "Existing graduate loaded:",
          graduate.id
        );
      }

      // =====================================================
      // NEW GRADUATE
      // =====================================================

      else {
        setGraduateId(null);

        setForm({
          ...emptyForm,
          email: user.email || "",
        });

        setExistingCvUrl("");
        setExistingQualificationUrl("");

        console.log(
          "No existing graduate profile found."
        );
      }
    } catch (err) {
      console.error(
        "Load graduate profile error:",
        err
      );

      setError(
        err.message ||
          "Could not load graduate profile."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // HANDLE FORM CHANGE
  // =========================================================

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // UPLOAD FILE
  // =========================================================

  async function uploadFile(
    file,
    folder
  ) {
    if (!file) {
      return null;
    }

    const safeFileName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const filePath =
      `${folder}/${Date.now()}-${safeFileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("documents")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  }

  // =========================================================
  // SAVE / UPDATE GRADUATE
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      // =====================================================
      // GET LOGGED-IN USER
      // =====================================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "You are not logged in. Please log in again."
        );
      }

      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !form.full_name.trim()
      ) {
        throw new Error(
          "Please enter your full name."
        );
      }

      if (
        !form.email.trim()
      ) {
        throw new Error(
          "Please enter your email."
        );
      }

      if (
        !form.phone.trim()
      ) {
        throw new Error(
          "Please enter your phone number."
        );
      }

      if (
        !form.qualification.trim()
      ) {
        throw new Error(
          "Please enter your qualification."
        );
      }

      if (
        !form.field_of_study.trim()
      ) {
        throw new Error(
          "Please enter your field of study."
        );
      }

      // =====================================================
      // FIND EXISTING GRADUATE
      // =====================================================

      const {
        data: existingGraduates,
        error: findError,
      } = await supabase
        .from("graduates")
        .select(
          "id, cv_url, qualification_url"
        )
        .eq("user_id", user.id)
        .order("id", {
          ascending: true,
        })
        .limit(1);

      if (findError) {
        console.error(
          "Find graduate error:",
          findError
        );

        throw findError;
      }

      let existingGraduate =
        null;

      if (
        existingGraduates &&
        existingGraduates.length > 0
      ) {
        existingGraduate =
          existingGraduates[0];
      }

      // =====================================================
      // KEEP OLD CV UNLESS A NEW ONE IS SELECTED
      // =====================================================

      let cvUrl =
        existingGraduate?.cv_url ||
        existingCvUrl ||
        null;

      // =====================================================
      // UPLOAD NEW CV
      // =====================================================

      if (cvFile) {
        console.log(
          "Uploading new CV..."
        );

        cvUrl =
          await uploadFile(
            cvFile,
            "cv"
          );

        console.log(
          "New CV uploaded:",
          cvUrl
        );
      }

      // =====================================================
      // KEEP OLD QUALIFICATION DOCUMENT
      // =====================================================

      let qualificationUrl =
        existingGraduate?.qualification_url ||
        existingQualificationUrl ||
        null;

      // =====================================================
      // UPLOAD NEW QUALIFICATION DOCUMENT
      // =====================================================

      if (qualificationFile) {
        console.log(
          "Uploading qualification document..."
        );

        qualificationUrl =
          await uploadFile(
            qualificationFile,
            "qualifications"
          );

        console.log(
          "New qualification document uploaded:",
          qualificationUrl
        );
      }

      // =====================================================
      // DATA TO SAVE
      // =====================================================

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
        "Graduate data being saved:",
        graduateData
      );

      // =====================================================
      // UPDATE EXISTING GRADUATE
      // =====================================================

      if (existingGraduate) {
        console.log(
          "Updating existing graduate:",
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
            "Update graduate error:",
            updateError
          );

          throw updateError;
        }

        setGraduateId(
          existingGraduate.id
        );

        setExistingCvUrl(
          cvUrl || ""
        );

        setExistingQualificationUrl(
          qualificationUrl || ""
        );

        console.log(
          "Graduate updated successfully:",
          existingGraduate.id
        );

        setMessage(
          "✅ Your graduate profile and documents have been updated successfully!"
        );
      }

      // =====================================================
      // CREATE NEW GRADUATE
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
          .insert(
            graduateData
          )
          .select("id");

        if (insertError) {
          console.error(
            "Insert graduate error:",
            insertError
          );

          throw insertError;
        }

        if (
          newGraduate &&
          newGraduate.length > 0
        ) {
          setGraduateId(
            newGraduate[0].id
          );
        }

        setExistingCvUrl(
          cvUrl || ""
        );

        setExistingQualificationUrl(
          qualificationUrl || ""
        );

        setMessage(
          "✅ Your graduate profile and documents have been created successfully!"
        );
      }

      // =====================================================
      // CLEAR SELECTED FILES
      // =====================================================

      setCvFile(null);

      setQualificationFile(
        null
      );

      // Clear file inputs

      const cvInput =
        document.getElementById(
          "cv"
        );

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

      // =====================================================
      // RELOAD PROFILE
      // =====================================================

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
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main
          style={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "30px",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <h2
              style={{
                color: "#0057B8",
              }}
            >
              Loading Graduate Profile...
            </h2>

            <p>
              Please wait.
            </p>
          </div>
        </main>
      </>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          background: "#f5f9ff",
          padding:
            "30px 15px 60px",
        }}
      >
        <div
          style={{
            maxWidth: "850px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              background:
                "linear-gradient(135deg,#0057B8,#0a84ff)",
              color: "#fff",
              borderRadius: "20px",
              padding: "30px",
              marginBottom: "25px",
            }}
          >
            <h1
              style={{
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              🎓 Graduate Profile
            </h1>

            <p
              style={{
                marginBottom: 0,
                lineHeight: "1.6",
              }}
            >
              Keep your information and
              documents up to date so
              companies can view your
              application correctly.
            </p>
          </div>

          {/* FORM CARD */}

          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "25px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,.08)",
            }}
          >
            {/* SUCCESS */}

            {message && (
              <div
                style={{
                  background: "#e8f7ee",
                  color: "#16803c",
                  border:
                    "1px solid #b7e4c7",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                {message}
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div
                style={{
                  background: "#fff0f0",
                  color: "#c62828",
                  border:
                    "1px solid #f3b5b5",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                ❌ {error}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
            >
              {/* FULL NAME */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="full_name"
                  style={
                    labelStyle
                  }
                >
                  Full Name
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={
                    form.full_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your full name"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* EMAIL */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="email"
                  style={
                    labelStyle
                  }
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your email"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* PHONE */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="phone"
                  style={
                    labelStyle
                  }
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your phone number"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* QUALIFICATION */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="qualification"
                  style={
                    labelStyle
                  }
                >
                  Qualification
                </label>

                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  value={
                    form.qualification
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Diploma in Information Technology"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* FIELD OF STUDY */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="field_of_study"
                  style={
                    labelStyle
                  }
                >
                  Field of Study
                </label>

                <input
                  id="field_of_study"
                  name="field_of_study"
                  type="text"
                  value={
                    form.field_of_study
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Computer Science"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* INSTITUTION */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="institution"
                  style={
                    labelStyle
                  }
                >
                  Institution
                </label>

                <input
                  id="institution"
                  name="institution"
                  type="text"
                  value={
                    form.institution
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. University of Johannesburg"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* PROVINCE */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="province"
                  style={
                    labelStyle
                  }
                >
                  Province
                </label>

                <select
                  id="province"
                  name="province"
                  value={
                    form.province
                  }
                  onChange={
                    handleChange
                  }
                  style={
                    inputStyle
                  }
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
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="skills"
                  style={
                    labelStyle
                  }
                >
                  Skills
                </label>

                <textarea
                  id="skills"
                  name="skills"
                  value={
                    form.skills
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. JavaScript, HTML, CSS, Communication"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              {/* CAREER GOALS */}

              <div
                style={
                  fieldContainer
                }
              >
                <label
                  htmlFor="career_goals"
                  style={
                    labelStyle
                  }
                >
                  Career Goals
                </label>

                <textarea
                  id="career_goals"
                  name="career_goals"
                  value={
                    form.career_goals
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Tell companies about your career goals"
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              {/* =================================================
                  CV
              ================================================= */}

              <div
                style={{
                  marginTop: "25px",
                  marginBottom: "25px",
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border:
                    "1px solid #e5eaf0",
                }}
              >
                <label
                  htmlFor="cv"
                  style={
                    labelStyle
                  }
                >
                  📄 CV
                </label>

                {existingCvUrl && (
                  <div
                    style={{
                      background:
                        "#e8f7ee",
                      color:
                        "#16803c",
                      padding: "12px",
                      borderRadius: "9px",
                      marginBottom:
                        "12px",
                      fontSize:
                        "14px",
                      fontWeight:
                        "600",
                    }}
                  >
                    ✅ CV already uploaded.
                    Select a new file below
                    only if you want to replace
                    it.
                  </div>
                )}

                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    setCvFile(
                      e.target.files?.[0] ||
                        null
                    );
                  }}
                  style={{
                    width: "100%",
                  }}
                />

                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                  }}
                >
                  Accepted formats:
                  PDF, DOC, DOCX
                </p>
              </div>

              {/* =================================================
                  QUALIFICATION DOCUMENT
              ================================================= */}

              <div
                style={{
                  marginBottom: "30px",
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border:
                    "1px solid #e5eaf0",
                }}
              >
                <label
                  htmlFor="qualification_document"
                  style={
                    labelStyle
                  }
                >
                  🎓 Qualification Document
                </label>

                {existingQualificationUrl && (
                  <div
                    style={{
                      background:
                        "#e8f7ee",
                      color:
                        "#16803c",
                      padding: "12px",
                      borderRadius: "9px",
                      marginBottom:
                        "12px",
                      fontSize:
                        "14px",
                      fontWeight:
                        "600",
                    }}
                  >
                    ✅ Qualification document
                    already uploaded.
                  </div>
                )}

                <input
                  id="qualification_document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    setQualificationFile(
                      e.target.files?.[0] ||
                        null
                    );
                  }}
                  style={{
                    width: "100%",
                  }}
                />

                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                  }}
                >
                  Accepted formats:
                  PDF, JPG, JPEG, PNG
                </p>
              </div>

              {/* =================================================
                  SAVE BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  background: saving
                    ? "#94a3b8"
                    : "#0057B8",
                  color: "#fff",
                  border: "none",
                  padding: "15px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
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
        </div>
      </main>
    </>
  );
}

// =============================================================
// STYLES
// =============================================================

const fieldContainer = {
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "700",
  color: "#222",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "#fff",
  color: "#222",
};