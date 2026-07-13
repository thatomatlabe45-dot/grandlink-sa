"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GraduatePage() {
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
    <main style={{ padding: "30px", maxWidth: "600px", margin: "auto" }}>
      <h1>GradLink SA Graduate Profile</h1>

      <form onSubmit={handleSubmit}>
        {Object.keys(form).map((field) => (
          <input
            key={field}
            name={field}
            value={form[field]}
            onChange={handleChange}
            placeholder={field.replaceAll("_", " ")}
            required
            style={{
              width: "100%",
              padding: "12px",
              margin: "8px 0",
            }}
          />
        ))}

        <label>Upload CV</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setCv(e.target.files[0])}
          required
        />

        <br /><br />

        <label>Upload Qualification</label>
        <input
          type="file"
          accept=".pdf,.jpg,.png"
          onChange={(e) =>
            setQualificationFile(e.target.files[0])
          }
          required
        />

        <br /><br />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
          }}
        >
          Submit Profile
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}