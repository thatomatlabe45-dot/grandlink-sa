"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GraduatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    field_of_study: "",
    institution: "",
    province: "",
    career_goals: "",
    skills: "",
  });

  const [cv, setCv] = useState(null);
  const [qualificationFile, setQualificationFile] = useState(null);

  const [existingGraduate, setExistingGraduate] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ----------------------------------------
  // LOAD EXISTING GRADUATE
  // ----------------------------------------

  useEffect(() => {
    async function loadGraduate() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Make sure email is available
      setForm((current) => ({
        ...current,
        email: user.email || "",
      }));

      // Look for existing graduate profile
      const {
        data: graduate,
        error: graduateError,
      } = await supabase
        .from("graduates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (graduateError) {
        console.error(
          "Graduate profile load error:",
          graduateError
        );

        setMessage(
          "Could not load your graduate profile."
        );

        setLoading(false);
        return;
      }

      if (graduate) {
        setExistingGraduate(graduate);

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
      }

      setLoading(false);
    }

    loadGraduate();
  }, [router]);

  // ----------------------------------------
  // HANDLE FORM CHANGES
  // ----------------------------------------

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // ----------------------------------------
  // UPLOAD FILE
  // ----------------------------------------

  async function uploadFile(file, folder) {
    if (!file) return null;

    const safeFileName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const fileName = `${folder}/${Date.now()}-${safeFileName}`;

    const {
      data,
      error,
    } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (error) {
      console.error(
        "Storage upload error:",
        error
      );

      throw error;
    }

    return data?.path || fileName;
  }

  // ----------------------------------------
  // SUBMIT / UPDATE PROFILE
  // ----------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("Saving your graduate profile...");

    try {
      // ----------------------------------------
      // GET USER
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
      // FIND EXISTING GRADUATE
      // ----------------------------------------

      const {
        data: currentGraduate,
        error: findError,
      } = await supabase
        .from("graduates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (findError) {
        console.error(
          "Find graduate error:",
          findError
        );

        throw findError;
      }

      // ----------------------------------------
      // UPLOAD NEW CV ONLY IF SELECTED
      // ----------------------------------------

      let cvPath = currentGraduate?.cv_url || null;

      if (cv) {
        cvPath = await uploadFile(cv, "cv");
      }

      // ----------------------------------------
      // UPLOAD NEW QUALIFICATION ONLY IF SELECTED
      // ----------------------------------------

      let qualificationPath =
        currentGraduate?.qualification_url || null;

      if (qualificationFile) {
        qualificationPath = await uploadFile(
          qualificationFile,
          "qualifications"
        );
      }

      // ----------------------------------------
      // DATA TO SAVE
      // ----------------------------------------

      const graduateData = {
        user_id: user.id,

        full_name: form.full_name.trim(),

        email:
          form.email.trim() ||
          user.email ||
          "",

        phone: form.phone.trim(),

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

        cv_url: cvPath,

        qualification_url:
          qualificationPath,
      };

      // ----------------------------------------
      // UPDATE EXISTING GRADUATE
      // ----------------------------------------

      if (currentGraduate) {
        const {
          data: updatedGraduate,
          error: updateError,
        } = await supabase
          .from("graduates")
          .update(graduateData)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (updateError) {
          console.error(
            "Graduate update error:",
            updateError
          );

          throw updateError;
        }

        if (!updatedGraduate) {
          throw new Error(
            "Graduate profile could not be updated."
          );
        }

        setExistingGraduate(
          updatedGraduate
        );

        setForm({
          full_name:
            updatedGraduate.full_name || "",

          email:
            updatedGraduate.email ||
            user.email ||
            "",

          phone:
            updatedGraduate.phone || "",

          qualification:
            updatedGraduate.qualification || "",

          field_of_study:
            updatedGraduate.field_of_study || "",

          institution:
            updatedGraduate.institution || "",

          province:
            updatedGraduate.province || "",

          career_goals:
            updatedGraduate.career_goals || "",

          skills:
            updatedGraduate.skills || "",
        });

        setCv(null);
        setQualificationFile(null);

        setMessage(
          "✅ Your graduate profile and documents have been updated successfully!"
        );

        setSaving(false);
        return;
      }

      // ----------------------------------------
      // CREATE NEW GRADUATE
      // ----------------------------------------

      const {
        data: createdGraduate,
        error: insertError,
      } = await supabase
        .from("graduates")
        .insert([graduateData])
        .select("*")
        .single();

      if (insertError) {
        console.error(
          "Graduate insert error:",
          insertError
        );

        throw insertError;
      }

      setExistingGraduate(
        createdGraduate
      );

      setCv(null);
      setQualificationFile(null);

      setMessage(
        "✅ Your graduate profile has been submitted successfully!"
      );

    } catch (error) {
      console.error(
        "Graduate profile error:",
        error
      );

      setMessage(
        error?.message ||
          "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <>
        <Navbar />

        <main
          style={{
            minHeight: "70vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#0057b8",
            fontSize: "22px",
            fontWeight: "bold",
          }}
        >
          Loading your graduate profile...
        </main>
      </>
    );
  }

  // ----------------------------------------
  // PAGE
  // ----------------------------------------

  return (
    <>
      <Navbar />

      <section
        style={{
          background:
            "linear-gradient(135deg,#0057b8,#0a84ff)",
          color: "white",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize:
              "clamp(2rem,5vw,3rem)",
            marginBottom: "15px",
          }}
        >
          🎓 Graduate Dashboard
        </h1>

        <p
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.8",
            opacity: 0.95,
          }}
        >
          Complete your graduate profile to
          unlock AI internship matching and
          apply to opportunities across South
          Africa.
        </p>
      </section>

      <main className="page">
        <section className="hero">
          <h1>
            {existingGraduate
              ? "👤 Update Your Graduate Profile"
              : "🎓 Join GradLink SA"}
          </h1>

          <p>
            {existingGraduate
              ? "Update your information and documents whenever you need to."
              : "Create your professional graduate profile and connect with employers across South Africa."}
          </p>
        </section>

        {/* STATS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "20px",
            maxWidth: "1200px",
            margin: "40px auto",
            padding: "0 20px",
          }}
        >
          {[
            ["📝", "Applications", "0"],
            ["❤️", "Saved Jobs", "0"],
            ["🎯", "AI Match", "0%"],
            [
              "📄",
              "Profile",
              existingGraduate
                ? "100%"
                : "0%",
            ],
          ].map(
            ([icon, title, value]) => (
              <div
                key={title}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "25px",
                  textAlign: "center",
                  boxShadow:
                    "0 10px 25px rgba(0,0,0,.08)",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                  }}
                >
                  {icon}
                </div>

                <h3>{value}</h3>

                <p
                  style={{
                    color: "#666",
                  }}
                >
                  {title}
                </p>
              </div>
            )
          )}
        </div>

        {/* PROFILE COMPLETION */}

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto 30px",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow:
                "0 10px 25px rgba(0,0,0,.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "15px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#0057b8",
                }}
              >
                📈 Profile Completion
              </h2>

              <strong>
                {existingGraduate
                  ? "100%"
                  : "0%"}
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                height: "12px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width:
                    existingGraduate
                      ? "100%"
                      : "0%",
                  height: "100%",
                  background: "#0057b8",
                }}
              />
            </div>

            <p
              style={{
                marginTop: "15px",
                color: "#666",
              }}
            >
              Complete your profile, upload
              your documents and improve your
              AI internship matching.
            </p>
          </div>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2>
              👤 Personal Information
            </h2>

            <label>Full Name</label>

            <input
              className="input"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />

            <label>Email Address</label>

            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>

            <input
              className="input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <label>Province</label>

            <select
              className="input"
              name="province"
              value={form.province}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Province
              </option>

              <option>Gauteng</option>
              <option>
                Western Cape
              </option>
              <option>
                KwaZulu-Natal
              </option>
              <option>
                Eastern Cape
              </option>
              <option>
                Free State
              </option>
              <option>Limpopo</option>
              <option>
                Mpumalanga
              </option>
              <option>
                North West
              </option>
              <option>
                Northern Cape
              </option>
            </select>
          </div>

          <div className="card">
            <h2>🎓 Education</h2>

            <label>Qualification</label>

            <input
              className="input"
              name="qualification"
              value={
                form.qualification
              }
              onChange={handleChange}
              required
            />

            <label>
              Field of Study
            </label>

            <input
              className="input"
              name="field_of_study"
              value={
                form.field_of_study
              }
              onChange={handleChange}
              required
            />

            <label>
              Institution
            </label>

            <input
              className="input"
              name="institution"
              value={
                form.institution
              }
              onChange={handleChange}
              required
            />

            <label>
              Career Goals
            </label>

            <textarea
              className="input"
              name="career_goals"
              value={
                form.career_goals
              }
              onChange={handleChange}
              rows={5}
              required
            />

            <label>Skills</label>

            <textarea
              className="input"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              rows={4}
              placeholder="Example: JavaScript, React, SQL, Python, Communication, Teamwork"
            />
          </div>

          {/* DOCUMENTS */}

          <div className="card">
            <h2>📄 Documents</h2>

            <label>
              {existingGraduate?.cv_url
                ? "Replace CV (optional)"
                : "Upload CV"}
            </label>

            <input
              className="input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                setCv(
                  e.target.files?.[0] ||
                    null
                )
              }
              required={
                !existingGraduate?.cv_url
              }
            />

            {existingGraduate?.cv_url && (
              <p
                style={{
                  color: "#16803c",
                  fontSize: "14px",
                  marginTop: "-10px",
                  marginBottom: "20px",
                }}
              >
                ✅ CV already uploaded.
                Select a new file only if
                you want to replace it.
              </p>
            )}

            <label
              style={{
                marginTop: "20px",
                display: "block",
              }}
            >
              {existingGraduate?.qualification_url
                ? "Replace Qualification Document (optional)"
                : "Upload Qualification"}
            </label>

            <input
              className="input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setQualificationFile(
                  e.target.files?.[0] ||
                    null
                )
              }
              required={
                !existingGraduate?.qualification_url
              }
            />

            {existingGraduate?.qualification_url && (
              <p
                style={{
                  color: "#16803c",
                  fontSize: "14px",
                  marginTop: "-10px",
                }}
              >
                ✅ Qualification document
                already uploaded.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "16px",
              background: saving
                ? "#7aa9d8"
                : "#0056d2",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: saving
                ? "not-allowed"
                : "pointer",
              marginTop: "20px",
            }}
          >
            {saving
              ? "💾 Saving..."
              : existingGraduate
              ? "💾 Update Graduate Profile"
              : "🚀 Submit Graduate Profile"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontWeight: "bold",
            color: "#0056d2",
          }}
        >
          {message}
        </p>
      </main>
    </>
  );
}