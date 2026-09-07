"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// AI PROFILE SCORE
// ============================================================

function calculateMatch(graduate) {
  let score = 0;
  const reasons = [];

  if (graduate.qualification) {
    score += 35;
    reasons.push("Qualification added");
  }

  if (graduate.field_of_study) {
    score += 25;
    reasons.push("Field of study added");
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
    reason:
      reasons.join(" • ") ||
      "Profile information is incomplete.",
  };
}

// ============================================================
// ADMIN PAGE
// ============================================================

export default function AdminPage() {
  const router = useRouter();

  const [graduates, setGraduates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState("");
  const [openingDocument, setOpeningDocument] =
    useState("");

  // ==========================================================
  // CHECK ADMIN
  // ==========================================================

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      setLoading(true);
      setError("");

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        router.replace("/login");
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      console.log("Logged-in user:", user.id);

      // Check admins table
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

        setError(
          "Could not verify administrator access."
        );

        return;
      }

      if (!adminData) {
        router.replace("/");
        return;
      }

      console.log(
        "Administrator verified:",
        adminData
      );

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

  // ==========================================================
  // LOAD GRADUATES
  // ==========================================================

  async function getGraduates() {
    try {
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

      console.log(
        "Graduates loaded:",
        data
      );

      setGraduates(data || []);
    } catch (err) {
      console.error(
        "Graduate loading exception:",
        err
      );

      setError(
        "Could not load graduate profiles."
      );
    }
  }

  // ==========================================================
  // OPEN DOCUMENT
  // ==========================================================

  async function openDocument(
    documentPath,
    documentName
  ) {
    try {
      setError("");
      setOpeningDocument(documentName);

      // ------------------------------------------------------
      // CHECK PATH
      // ------------------------------------------------------

      if (!documentPath) {
        alert(
          `${documentName} is not available for this graduate.`
        );

        setOpeningDocument("");
        return;
      }

      console.log(
        "===================================="
      );

      console.log(
        `Opening ${documentName}`
      );

      console.log(
        "Original path:",
        documentPath
      );

      // ------------------------------------------------------
      // IF ALREADY A FULL HTTP URL
      // ------------------------------------------------------

      if (
        documentPath.startsWith("http://") ||
        documentPath.startsWith("https://")
      ) {
        console.log(
          "Document is already a URL."
        );

        // IMPORTANT:
        // Do NOT use window.open().
        // Safari/iPhone can block it as a popup.
        window.location.assign(
          documentPath
        );

        return;
      }

      // ------------------------------------------------------
      // CLEAN STORAGE PATH
      // ------------------------------------------------------

      let filePath = documentPath;

      try {
        filePath =
          decodeURIComponent(
            filePath
          );
      } catch (decodeError) {
        console.log(
          "Decode warning:",
          decodeError
        );
      }

      // Remove leading slash
      filePath =
        filePath.replace(
          /^\/+/,
          ""
        );

      // Remove bucket name if included
      filePath =
        filePath.replace(
          /^documents\//i,
          ""
        );

      // Remove full Supabase storage URL if present
      if (
        filePath.includes(
          "/storage/v1/object/"
        )
      ) {
        const parts =
          filePath.split(
            "/documents/"
          );

        if (parts.length > 1) {
          filePath =
            parts[1];
        }
      }

      // Remove query string
      filePath =
        filePath.split("?")[0];

      // Remove hash
      filePath =
        filePath.split("#")[0];

      console.log(
        "Clean storage path:",
        filePath
      );

      if (!filePath) {
        alert(
          `The ${documentName} file path is empty.`
        );

        setOpeningDocument("");
        return;
      }

      // ------------------------------------------------------
      // CREATE SIGNED URL
      // ------------------------------------------------------

      console.log(
        "Creating signed URL..."
      );

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("documents")
        .createSignedUrl(
          filePath,
          3600
        );

      // ------------------------------------------------------
      // SIGNED URL ERROR
      // ------------------------------------------------------

      if (signedError) {
        console.error(
          "SIGNED URL ERROR:",
          signedError
        );

        const message =
          signedError.message ||
          "Unknown Supabase Storage error.";

        const details =
          signedError.details ||
          "No additional details.";

        const hint =
          signedError.hint ||
          "No additional hint.";

        alert(
          `❌ COULD NOT OPEN ${documentName.toUpperCase()}\n\n` +
          `Message:\n${message}\n\n` +
          `Details:\n${details}\n\n` +
          `Hint:\n${hint}\n\n` +
          `File path:\n${filePath}`
        );

        setOpeningDocument("");
        return;
      }

      // ------------------------------------------------------
      // CHECK SIGNED URL
      // ------------------------------------------------------

      if (
        !signedData ||
        !signedData.signedUrl
      ) {
        console.error(
          "No signed URL returned:",
          signedData
        );

        alert(
          `❌ Supabase did not return a secure URL for the ${documentName}.`
        );

        setOpeningDocument("");
        return;
      }

      console.log(
        "Signed URL created successfully."
      );

      console.log(
        "Navigating to document..."
      );

      // ======================================================
      // IMPORTANT FIX
      // ======================================================
      //
      // We use location.assign() instead of window.open().
      //
      // window.open() after an async Supabase request can be
      // blocked by Safari/iPhone as a popup.
      //
      // location.assign() navigates normally and does not rely
      // on popup permission.
      //
      // ======================================================

      window.location.assign(
        signedData.signedUrl
      );

    } catch (err) {
      console.error(
        "DOCUMENT OPEN ERROR:",
        err
      );

      alert(
        `❌ Something went wrong while opening ${documentName}.\n\n` +
        `${err?.message || "Unknown error."}`
      );

      setOpeningDocument("");
    }
  }

  // ==========================================================
  // FILTER GRADUATES
  // ==========================================================

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

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f8ff",
          fontFamily:
            "Arial, sans-serif",
          padding: "20px",
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
            Verifying administrator
            access...
          </h2>
        </div>
      </main>
    );
  }

  // ==========================================================
  // BLOCK UNAUTHORISED USERS
  // ==========================================================

  if (!authorised) {
    return null;
  }

  // ==========================================================
  // ADMIN DASHBOARD
  // ==========================================================

  return (
    <main style={pageStyle}>

      {/* ====================================================
          HEADER
      ==================================================== */}

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
              Platform Administration
              Dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            style={homeButtonStyle}
          >
            🏠 Home
          </button>
        </div>
      </header>

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <section style={containerStyle}>

        {/* ERROR */}

        {error && (
          <div style={errorStyle}>
            ❌ {error}
          </div>
        )}

        {/* ==================================================
            STATS
        ================================================== */}

        <div style={statsCard}>
          <h2>
            👨‍🎓 Graduate Profiles
          </h2>

          <strong>
            Total Graduates:{" "}
            {graduates.length}
          </strong>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

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

        {/* ==================================================
            GRADUATE CARDS
        ================================================== */}

        {[...filteredGraduates]
          .sort(
            (a, b) =>
              calculateMatch(b)
                .score -
              calculateMatch(a)
                .score
          )
          .map((person) => {
            const match =
              calculateMatch(person);

            return (
              <div
                key={person.id}
                style={cardStyle}
              >

                {/* NAME */}

                <h3 style={nameStyle}>
                  👨‍🎓{" "}
                  {person.full_name ||
                    "Graduate"}
                </h3>

                {/* EMAIL */}

                <p>
                  📧{" "}
                  <strong>
                    Email:
                  </strong>{" "}
                  {person.email ||
                    "Not provided"}
                </p>

                {/* PHONE */}

                <p>
                  📞{" "}
                  <strong>
                    Phone:
                  </strong>{" "}
                  {person.phone ||
                    "Not provided"}
                </p>

                {/* QUALIFICATION */}

                <p>
                  🎓{" "}
                  <strong>
                    Qualification:
                  </strong>{" "}
                  {person.qualification ||
                    "Not provided"}
                </p>

                {/* FIELD */}

                <p>
                  📚{" "}
                  <strong>
                    Field of Study:
                  </strong>{" "}
                  {person.field_of_study ||
                    "Not provided"}
                </p>

                {/* INSTITUTION */}

                <p>
                  🏫{" "}
                  <strong>
                    Institution:
                  </strong>{" "}
                  {person.institution ||
                    "Not provided"}
                </p>

                {/* PROVINCE */}

                <p>
                  📍{" "}
                  <strong>
                    Province:
                  </strong>{" "}
                  {person.province ||
                    "Not provided"}
                </p>

                {/* =================================================
                    AI SCORE
                ================================================= */}

                <div style={aiCardStyle}>

                  <strong>
                    🤖 Profile Score:{" "}
                    {match.score}% —{" "}
                    {match.label}
                  </strong>

                  <p
                    style={{
                      marginBottom: 0,
                      marginTop: "8px",
                    }}
                  >
                    {match.reason}
                  </p>

                </div>

                {/* =================================================
                    DOCUMENT BUTTONS
                ================================================= */}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >

                  {/* CV */}

                  <button
                    type="button"
                    disabled={
                      openingDocument ===
                      "CV"
                    }
                    onClick={() =>
                      openDocument(
                        person.cv_url,
                        "CV"
                      )
                    }
                    style={{
                      ...buttonStyle,
                      opacity:
                        openingDocument ===
                        "CV"
                          ? 0.6
                          : 1,
                    }}
                  >
                    {openingDocument ===
                    "CV"
                      ? "⏳ Opening CV..."
                      : "📄 View CV"}
                  </button>

                  {/* QUALIFICATION */}

                  <button
                    type="button"
                    disabled={
                      openingDocument ===
                      "Qualification"
                    }
                    onClick={() =>
                      openDocument(
                        person.qualification_url,
                        "Qualification"
                      )
                    }
                    style={{
                      ...qualificationButtonStyle,
                      opacity:
                        openingDocument ===
                        "Qualification"
                          ? 0.6
                          : 1,
                    }}
                  >
                    {openingDocument ===
                    "Qualification"
                      ? "⏳ Opening..."
                      : "🎓 View Qualification"}
                  </button>

                </div>

                {/* =================================================
                    DOCUMENT STATUS
                ================================================= */}

                <div
                  style={
                    documentStatusStyle
                  }
                >

                  <div>
                    {person.cv_url ? (
                      <span>
                        ✅ CV available
                      </span>
                    ) : (
                      <span>
                        ⚠️ No CV uploaded
                      </span>
                    )}
                  </div>

                  <div>
                    {person.qualification_url ? (
                      <span>
                        ✅ Qualification
                        available
                      </span>
                    ) : (
                      <span>
                        ⚠️ No qualification
                        uploaded
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })}

        {/* ====================================================
            NO RESULTS
        ==================================================== */}

        {filteredGraduates.length ===
          0 && (
            <div style={emptyStyle}>
              👨‍🎓 No graduate profiles
              found.
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
  border: "1px solid #ddd",
  marginBottom: "25px",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "18px",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
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
  fontSize: "14px",
};

const qualificationButtonStyle = {
  background: "#087f5b",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
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

const documentStatusStyle = {
  marginTop: "14px",
  fontSize: "13px",
  color: "#64748b",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  background: "white",
  borderRadius: "16px",
  color: "#64748b",
};