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

  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Submitting...");

    const { error } = await supabase
      .from("graduates")
      .insert([form]);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Profile submitted successfully!");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        qualification: "",
        field_of_study: "",
        institution: "",
        province: "",
        career_goals: "",
      });
    }
  }

  return (
    <main style={{ padding: "30px", maxWidth: "600px", margin: "auto" }}>
      <h1>Graduate Profile</h1>
      <p>Join GradLink SA and connect with internship opportunities.</p>

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

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          Submit Profile
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}