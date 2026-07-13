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

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("graduates")
      .insert([form]);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Profile Created 🎉</h1>
          <p>Welcome to GradLink SA.</p>
          <p>Your graduate profile has been submitted successfully.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Graduate Registration</h1>

        <p style={styles.subtitle}>
          Create your profile and connect with internship opportunities.
        </p>

        <form onSubmit={handleSubmit}>
          <input name="full_name" placeholder="Full Name" style={styles.input} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email Address" style={styles.input} onChange={handleChange} required />
          <input name="phone" placeholder="Phone Number" style={styles.input} onChange={handleChange} required />
          <input name="qualification" placeholder="Qualification" style={styles.input} onChange={handleChange} required />
          <input name="field_of_study" placeholder="Field of Study" style={styles.input} onChange={handleChange} required />
          <input name="institution" placeholder="Institution" style={styles.input} onChange={handleChange} required />

          <select name="province" style={styles.input} onChange={handleChange} required>
            <option value="">Select Province</option>
            <option>Gauteng</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>North West</option>
            <option>Free State</option>
            <option>KwaZulu-Natal</option>
            <option>Eastern Cape</option>
            <option>Western Cape</option>
            <option>Northern Cape</option>
          </select>

          <textarea
            name="career_goals"
            placeholder="Tell companies about your skills and career goals"
            style={styles.textarea}
            onChange={handleChange}
            required
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating Profile..." : "Create Graduate Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px 20px",
    fontFamily: "Arial",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    color: "#0b5ed7",
  },
  subtitle: {
    color: "#555",
    marginBottom: "25px",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "7px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "7px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "16px",
    background: "#0b5ed7",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "bold",
  },
};