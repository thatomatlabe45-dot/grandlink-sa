"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function calculateMatch(graduate) {
  let score = 0;
  const reasons = [];

  if (graduate.qualification) {
    score += 35;
    reasons.push("Qualification added");
  }

  if (graduate.field_of_study) {
    score += 25;
    reasons.push("Field of study matches");
  }

  if (graduate.institution) {
    score += 15;
    reasons.push("Institution provided");
  }

  if (graduate.cv_url) {
    score += 15;
    reasons.push("CV uploaded");
  }

  if (graduate.qualification_url) {
    score += 10;
    reasons.push("Certificate uploaded");
  }

  let label = "Possible Match";

  if (score >= 80) {
    label = "Strong Match";
  } else if (score >= 60) {
    label = "Good Match";
  }

  return {
    score,
    label,
    reason: reasons.join(" • "),
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [graduates, setGraduates] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    getGraduates();
  }

  checkUser();
}, [router]);


  async function getGraduates() {
    const { data, error } = await supabase
      .from("graduates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setGraduates(data || []);
    }
  }

  async function openDocument(path) {
    if (!path) {
      alert("Document not available");
      return;
    }

    let filePath = path;

    if (path.includes("/documents/")) {
      filePath = decodeURIComponent(
        path.split("/documents/")[1].split("?")[0]
      );
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
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0 }}>GradLink SA</h1>
        <p style={{ marginTop: "8px" }}>
          AI Internship Matching Dashboard
        </p>
      </header>

      <section style={containerStyle}>
        <div style={statsCard}>
          <h2>Graduate Profiles</h2>
          <strong>Total Graduates: {graduates.length}</strong>
        </div>

        <input
          type="search"
          placeholder="Search graduates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchStyle}
        />

        {[...filteredGraduates]
          .sort(
            (a, b) =>
              calculateMatch(b).score - calculateMatch(a).score
          )
          .map((person) => {
            const match = calculateMatch(person);

            return (
              <div key={person.id} style={cardStyle}>
                <h3 style={nameStyle}>
                  {person.full_name}
                </h3>

                <p>📧 {person.email}</p>
                <p>📞 {person.phone}</p>
                <p>🎓 {person.qualification}</p>
                <p>📚 {person.field_of_study}</p>
                <p>🏫 {person.institution}</p>
                <p>📍 {person.province}</p>

                <div style={aiCardStyle}>
                  <strong>
                    🤖 AI Match: {match.score}% — {match.label}
                  </strong>

                  <p style={{ marginBottom: 0 }}>
                    {match.reason}
                  </p>
                </div>

                <button
                  onClick={() => openDocument(person.cv_url)}
                  style={buttonStyle}
                >
                  View CV
                </button>

                <button
                  onClick={() =>
                    openDocument(person.qualification_url)
                  }
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


const pageStyle = {
  minHeight: "100vh",
  background: "#f4f8ff",
  fontFamily: "Arial, sans-serif",
};


const headerStyle = {
  background: "#0057b8",
  color: "white",
  padding: "30px 25px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
};


const containerStyle = {
  maxWidth: "1000px",
  margin: "auto",
  padding: "25px",
};


const statsCard = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  marginBottom: "20px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};


const searchStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  marginBottom: "25px",
  fontSize: "16px",
  boxSizing: "border-box",
};


const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "18px",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
};


const nameStyle = {
  color: "#0057b8",
  marginTop: 0,
  fontSize: "22px",
};


const aiCardStyle = {
  marginTop: "20px",
  padding: "16px",
  background: "#eef6ff",
  borderRadius: "12px",
  borderLeft: "5px solid #0057b8",
};


const buttonStyle = {
  background: "#0057b8",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  marginRight: "10px",
  marginTop: "15px",
  cursor: "pointer",
};