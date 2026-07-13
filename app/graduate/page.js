"use client";

import { useState } from "react";

export default function GraduatePage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
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
          <input style={styles.input} type="text" placeholder="Full Name" required />
          <input style={styles.input} type="email" placeholder="Email Address" required />
          <input style={styles.input} type="tel" placeholder="Phone Number" required />
          <input style={styles.input} type="text" placeholder="Qualification" required />
          <input style={styles.input} type="text" placeholder="Field of Study" required />
          <input style={styles.input} type="text" placeholder="Institution" required />

          <select style={styles.input} required defaultValue="">
            <option value="" disabled>Select Province</option>
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
            style={styles.textarea}
            placeholder="Tell companies about your skills and career goals"
            required
          />

          <button style={styles.button} type="submit">
            Create Graduate Profile
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
    marginBottom: "10px",
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