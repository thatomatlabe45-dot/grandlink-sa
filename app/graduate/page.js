"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
  });

  const [cv, setCv] = useState(null);
  const [qualificationFile, setQualificationFile] = useState(null);
  const [message, setMessage] = useState("");

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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function uploadFile(file, folder) {
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Uploading documents...");

    try {
      const cvPath = await uploadFile(cv, "cv");
      const qualificationPath = await uploadFile(
        qualificationFile,
        "qualifications"
      );

      const { error } = await supabase
        .from("graduates")
        .insert([
          {
            ...form,
            cv_url: cvPath,
            qualification_url: qualificationPath,
          },
        ]);

      if (error) throw error;

      setMessage(
        "Your graduate profile has been submitted successfully!"
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>🎓 Join GradLink SA</h1>
        <p>
          Create your professional graduate profile and connect with employers
          across South Africa.
        </p>
      </section>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>👤 Personal Information</h2>

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
            <option value="">Select Province</option>
            <option>Gauteng</option>
            <option>Western Cape</option>
            <option>KwaZulu-Natal</option>
            <option>Eastern Cape</option>
            <option>Free State</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>North West</option>
            <option>Northern Cape</option>
          </select>
        </div>

        <div className="card">
          <h2>🎓 Education</h2>

          <label>Qualification</label>
          <input
            className="input"
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
            placeholder="e.g. Diploma in Information Technology"
            required
          />

          <label>Field of Study</label>
          <input
            className="input"
            name="field_of_study"
            value={form.field_of_study}
            onChange={handleChange}
            placeholder="e.g. Information Technology"
            required
          />

          <label>Institution</label>
          <input
            className="input"
            name="institution"
            value={form.institution}
            onChange={handleChange}
            placeholder="College or University"
            required
          />

          <label>Career Goals</label>
          <textarea
            className="input"
            name="career_goals"
            value={form.career_goals}
            onChange={handleChange}
            rows={5}
            placeholder="Tell employers about yourself, your goals, and the type of internship you're looking for."
            required
          />
        </div>

        <div className="card">
          <h2>📄 Documents</h2>

          <label>Upload CV</label>
          <input
            className="input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCv(e.target.files[0])}
            required
          />

          <label style={{ marginTop: "20px", display: "block" }}>
            Upload Qualification
          </label>

          <input
            className="input"
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setQualificationFile(e.target.files[0])}
            required
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "16px",
            background: "#0056d2",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          🚀 Submit Graduate Profile
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}