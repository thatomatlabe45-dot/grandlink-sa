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
  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      setLoading(true);
      setError("");

      // ============================================
      // CHECK LOGGED-IN USER
      // ============================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // ============================================
      // CHECK IF USER IS AN ADMIN
      // ============================================

      const {
        data: adminData,
        error: adminError,
      } = await supabase
        .from("admins")
        .select("id, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error(
          "Admin check error:",
          adminError
        );

        router.replace("/");
        return;
      }

      // ============================================
      // NOT AN ADMIN
      // ============================================

      if (!adminData) {
        router.replace("/");
        return;
      }

      // ============================================
      // USER IS ADMIN
      // ============================================

      setAuthorised(true);

      await getGraduates();

    } catch (err) {
      console.error(
        "Admin access error:",
        err
      );

      setError(
        "Could not verify administrator access."
      );
    } finally {
      setLoading(false);
    }
  }

  async function getGraduates() {
    const {
      data,
      error,
    } = await supabase
      .from("graduates")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Graduate loading error:",
        error
      );

      setError(
        "Could not load graduate profiles."
      );

      return;
    }

    setGraduates(data || []);
  }

  async function openDocument(path) {
    if (!path) {
      alert("Document not available");
      return;
    }

    let filePath = path;

    // ============================================
    // IF FULL SUPABASE STORAGE URL
    // ============================================

    if (path.includes("/documents/")) {
      filePath = decodeURIComponent(
        path
          .split("/documents/")[1]
          .split("?")[0]
      );
    }

    // Remove beginning slash if present
    filePath = filePath.replace(
      /^\/+/,
      ""
    );

    // Remove documents/ if present
    filePath = filePath.replace(
      /^documents\//,
      ""
    );

    const {
      data,
      error,
    } = await supabase.storage
      .from("documents")
      .createSignedUrl(
        filePath,
        300
      );

    if (error) {
      console.error(
        "Document error:",
        error
      );

      alert(error.message);
      return;
    }

    if (!data?.signedUrl) {
      alert(
        "Could not create a secure document link."
      );

      return;
    }

    window.open(
      data.signedUrl,
      "_blank"
    );
  }

  // ============================================
  // FILTER GRADUATES
  // ============================================

  const filteredGraduates =
    graduates.filter((person) =>
      `${person.full_name || ""} 
       ${person.qualification || ""} 
       ${person.field_of_study || ""} 
       ${person.province || ""}`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f8ff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
            }}
          >
            🛡️
          </div>

          <h2
            style={{
              color: "#0057b8",
            }}
          >
            Verifying administrator access...
          </h2>
        </div>
      </main>
    );
  }

  // ============================================
  // BLOCK PAGE UNTIL ADMIN IS VERIFIED
  // ============================================

  if (!authorised) {
    return null;
  }

  // ============================================
  // ADMIN PAGE
  // ============================================

  return (
    <main style={pageStyle}>

      <header style={headerStyle}>
        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
              }}
            >
              🛡️ GradLink SA Admin
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
              }}
            >
              Platform Administration Dashboard
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/")
            }
            style={homeButtonStyle}
          >
            🏠 Home
          </button>
        </div>
      </header>

      <section style={containerStyle}>

        {error && (
          <div style={errorStyle}>
            ❌ {error}
          </div>
        )}

        <div style={statsCard}>
          <h2>
            👨‍🎓 Graduate Profiles
          </h2>

          <strong>
            Total Graduates:{" "}
            {graduates.length}
          </strong>
        </div>

        <input
          type="search"
          placeholder="🔍 Search graduates..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={searchStyle}
        />

        {[...filteredGraduates]
          .sort(
            (a, b) =>
              calculateMatch(b).score -
              calculateMatch(a).score
          )
          .map((person) => {

            const match =
              calculateMatch(person);

            return (
              <div
                key={person.id}
                style={cardStyle}
              >
                <h3 style={nameStyle}>
                  👨‍🎓{" "}
                  {person.full_name ||
                    "Graduate"}
                </h3>

                <p>
                  📧{" "}
                  {person.email ||
                    "Not provided"}
                </p>

                <p>
                  📞{" "}
                  {person.phone ||
                    "Not provided"}
                </p>

                <p>
                  🎓{" "}
                  {person.qualification ||
                    "Not provided"}
                </p>

                <p>
                  📚{" "}
                  {person.field_of_study ||
                    "Not provided"}
                </p>

                <p>
                  🏫{" "}
                  {person.institution ||
                    "Not provided"}
                </p>

                <p>
                  📍{" "}
                  {person.province ||
                    "Not provided"}
                </p>

                <div style={aiCardStyle}>
                  <strong>
                    🤖 Profile Score:{" "}
                    {match.score}% —{" "}
                    {match.label}
                  </strong>

                  <p
                    style={{
                      marginBottom: 0,
                    }}
                  >
                    {match.reason ||
                      "Profile information is incomplete."}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() =>
                      openDocument(
                        person.cv_url
                      )
                    }
                    style={buttonStyle}
                  >
                    📄 View CV
                  </button>

                  <button
                    onClick={() =>
                      openDocument(
                        person.qualification_url
                      )
                    }
                    style={buttonStyle}
                  >
                    🎓 View Qualification
                  </button>
                </div>
              </div>
            );
          })}

        {filteredGraduates.length === 0 && (
          <div style={emptyStyle}>
            👨‍🎓 No graduate profiles found.
          </div>
        )}

      </section>
    </main>
  );
}


// ===========================================================
// STYLES
// ===========================================================

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f8ff",
  fontFamily:
    "Arial, sans-serif",
};


const headerStyle = {
  background:
    "linear-gradient(135deg,#003f88,#0077e6)",
  color: "white",
  padding: "30px 25px",
  boxShadow:
    "0 5px 15px rgba(0,0,0,0.1)",
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
  boxShadow:
    "0 5px 20px rgba(0,0,0,0.05)",
};


const searchStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "10px",
  border:
    "1px solid #ddd",
  marginBottom: "25px",
  fontSize: "16px",
  boxSizing:
    "border-box",
};


const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "18px",
  marginBottom: "20px",
  border:
    "1px solid #e5e7eb",
  boxShadow:
    "0 8px 25px rgba(0,0,0,0.06)",
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
  borderLeft:
    "5px solid #0057b8",
};


const buttonStyle = {
  background: "#0057b8",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};


const homeButtonStyle = {
  background:
    "rgba(255,255,255,0.15)",
  color: "white",
  border:
    "1px solid rgba(255,255,255,0.4)",
  padding: "11px 17px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};


const errorStyle = {
  background: "#fef2f2",
  color: "#b91c1c",
  border:
    "1px solid #fecaca",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "20px",
};


const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  background: "white",
  borderRadius: "16px",
  color: "#64748b",
};