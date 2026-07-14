"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
function calculateMatch(graduate) {
  let score = 0;
  const reasons = [];

  if (graduate.qualification) {
    score += 40;
    reasons.push("Qualification provided");
  }

  if (graduate.institution) {
    score += 20;
    reasons.push("Institution verified");
  }

  if (graduate.cv_url) {
    score += 25;
    reasons.push("CV available");
  }

  if (graduate.qualification_url) {
    score += 15;
    reasons.push("Qualification document available");
  }

  let label = "Possible Match";

  if (score >= 80) label = "Strong Match";
  else if (score >= 60) label = "Good Match";

  return {
    score,
    label,
    reason: reasons.join(" • "),
  };
}
  const [graduates, setGraduates] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getGraduates();
  }, []);

  async function getGraduates() {
    const { data } = await supabase
      .from("graduates")
      .select("*")
      .order("created_at", { ascending: false });

    setGraduates(data || []);
  }

  async function openDocument(path) {
  if (!path) return alert("Document not available");

  let filePath = path;

  if (path.includes("/documents/")) {
    filePath = decodeURIComponent(path.split("/documents/")[1].split("?")[0]);
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 300);

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = data.signedUrl;
}

  const filteredGraduates = graduates.filter((person) =>
    `${person.full_name} ${person.qualification} ${person.field_of_study} ${person.province}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8ff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#0057b8",
          color: "white",
          padding: "25px",
        }}
      >
        <h1 style={{ margin: 0 }}>GradLink SA</h1>
        <p style={{ marginBottom: 0 }}>Admin Dashboard</p>
      </header>

      <section style={{ padding: "25px", maxWidth: "1000px", margin: "auto" }}>
        <h2>Graduate Profiles</h2>

        <div
          style={{
            background: "white",
            padding: "18px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <strong>Total Graduates: {graduates.length}</strong>
        </div>

        <input
          type="search"
          placeholder="Search graduates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />
         {[...filteredGraduates]
           .sort((a, b) => calculateMatch(b).score - calculateMatch(a).score)
           .map((person) => {
           const match = calculateMatch(person);

           return (
          <div
  key={person.id}
  style={{
    background: "white",
    padding: "25px",
    borderRadius: "18px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
  }}
>
          >
        <h3
  style={{
    color: "#0057b8",
    marginTop: 0,
    fontSize: "22px",
  }}
>
              {person.full_name}
            </h3>

            <p>📧 {person.email}</p>
            <p>📞 {person.phone}</p>
            <p>🎓 {person.qualification}</p>
            <p>📚 {person.field_of_study}</p>
            <p>🏫 {person.institution}</p>
            <p>📍 {person.province}</p>

            <button
              onClick={() => openDocument(person.cv_url)}
              style={buttonStyle}
            >
              View CV
            </button>
         <div style={{ marginTop: "12px", marginBottom: "12px" }}>
  <strong>AI Match: {match.score}% — {match.label}</strong>
  <p style={{ fontSize: "13px" }}>{match.reason}</p>
</div>
            <button
              onClick={() => openDocument(person.qualification_url)}
              style={buttonStyle}
            >
              View Qualification
            </button>
          </div>
        );
        })}
      </section>
    </main>
  );
}

const buttonStyle = {
  background: "#0057b8",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "7px",
  marginRight: "8px",
  marginTop: "8px",
  cursor: "pointer",
};