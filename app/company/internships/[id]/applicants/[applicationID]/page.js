"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// QUALIFICATION LEVEL
// ============================================================

function getQualificationLevel(value) {
  const text = String(value || "").toLowerCase().trim();

  if (
    text.includes("phd") ||
    text.includes("doctorate") ||
    text.includes("doctoral")
  ) {
    return 6;
  }

  if (
    text.includes("master") ||
    text.includes("postgrad") ||
    text.includes("post graduate")
  ) {
    return 6;
  }

  if (
    text.includes("honours") ||
    text.includes("honors")
  ) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor")
  ) {
    return 4;
  }

  if (
    text.includes("diploma") ||
    text.includes("national diploma")
  ) {
    return 3;
  }

  if (
    text.includes("certificate") ||
    text.includes("n6") ||
    text.includes("n5") ||
    text.includes("n4")
  ) {
    return 2;
  }

  if (
    text.includes("matric") ||
    text.includes("grade 12") ||
    text.includes("grade12")
  ) {
    return 1;
  }

  return 0;
}

// ============================================================
// QUALIFICATION MATCH
// ============================================================

function qualificationMatches(
  applicantQualification,
  requiredQualification
) {
  const applicantLevel =
    getQualificationLevel(applicantQualification);

  const requiredLevel =
    getQualificationLevel(requiredQualification);

  if (!requiredQualification || requiredLevel === 0) {
    return true;
  }

  if (applicantLevel === 0) {
    return false;
  }

  return applicantLevel >= requiredLevel;
}

// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SKILLS
// ============================================================

function getSkillsArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// ============================================================
// CALCULATE MATCH
// ============================================================

function calculateMatch(application, internship) {
  const applicantQualification =
    application.qualification || "";

  const requiredQualification =
    internship.qualification || "";

  const applicantField =
    normalizeText(application.field_of_study);

  const requiredField =
    normalizeText(internship.field_of_study);

  const applicantSkills =
    getSkillsArray(application.skills);

  const internshipSkills =
    getSkillsArray(internship.skills);

  // ----------------------------------------------------------
  // QUALIFICATION - 35%
  // ----------------------------------------------------------

  let qualificationScore = 0;

  if (!requiredQualification) {
    qualificationScore = 35;
  } else if (
    qualificationMatches(
      applicantQualification,
      requiredQualification
    )
  ) {
    qualificationScore = 35;
  }

  // ----------------------------------------------------------
  // FIELD OF STUDY - 35%
  // ----------------------------------------------------------

  let fieldScore = 0;

  if (!requiredField) {
    fieldScore = 35;
  } else if (!applicantField) {
    fieldScore = 0;
  } else if (applicantField === requiredField) {
    fieldScore = 35;
  } else if (
    applicantField.includes(requiredField) ||
    requiredField.includes(applicantField)
  ) {
    fieldScore = 30;
  } else {
    const applicantWords = applicantField.split(" ");
    const requiredWords = requiredField.split(" ");

    const overlap = applicantWords.filter((word) =>
      requiredWords.includes(word)
    );

    if (overlap.length > 0) {
      fieldScore = 20;
    }
  }

  // ----------------------------------------------------------
  // SKILLS - 30%
  // ----------------------------------------------------------

  let skillsScore = 0;

  const matchedSkills = [];
  const missingSkills = [];

  if (internshipSkills.length === 0) {
    skillsScore = 30;
  } else {
    internshipSkills.forEach((requiredSkill) => {
      const required = normalizeText(requiredSkill);

      const found = applicantSkills.some((skill) => {
        const applicant = normalizeText(skill);

        return (
          applicant === required ||
          applicant.includes(required) ||
          required.includes(applicant)
        );
      });

      if (found) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    });

    skillsScore =
      (matchedSkills.length /
        internshipSkills.length) *
      30;
  }

  const totalScore = Math.round(
    qualificationScore +
      fieldScore +
      skillsScore
  );

  let label = "Weak";

  if (totalScore >= 85) {
    label = "Strong";
  } else if (totalScore >= 70) {
    label = "Good";
  } else if (totalScore >= 40) {
    label = "Possible";
  }

  const strengths = [];
  const improvements = [];

  if (qualificationScore === 35) {
    strengths.push(
      "Meets or exceeds the required qualification."
    );
  } else {
    improvements.push(
      "Qualification does not meet the internship requirement."
    );
  }

  if (fieldScore >= 30) {
    strengths.push(
      "Field of study closely matches the internship."
    );
  } else if (fieldScore > 0) {
    strengths.push(
      "Some relevance to the required field of study."
    );
  } else {
    improvements.push(
      "Field of study does not closely match."
    );
  }

  if (matchedSkills.length > 0) {
    strengths.push(
      `Matches ${matchedSkills.length} required skill${
        matchedSkills.length === 1 ? "" : "s"
      }.`
    );
  }

  if (missingSkills.length > 0) {
    improvements.push(
      `Missing ${missingSkills.length} required skill${
        missingSkills.length === 1 ? "" : "s"
      }.`
    );
  }

  return {
    score: totalScore,
    label,
    matchedSkills,
    missingSkills,
    strengths,
    improvements,
  };
}

// ============================================================
// DOCUMENT PATH
// ============================================================

function cleanDocumentPath(url) {
  if (!url) return "";

  return String(url)
    .replace(/^.*\/documents\//, "")
    .replace(/^\/+/, "");
}

// ============================================================
// PAGE
// ============================================================

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId = params?.id;
  const applicationId = params?.applicationId;

  const [application, setApplication] = useState(null);
  const [internship, setInternship] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // LOAD APPLICATION
  // ==========================================================

  useEffect(() => {
    if (!internshipId || !applicationId) {
      return;
    }

    async function loadApplication() {
      setLoading(true);
      setErrorMessage("");

      try {
        // ----------------------------------------------------
        // GET LOGGED-IN USER
        // ----------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // ----------------------------------------------------
        // GET COMPANY
        // ----------------------------------------------------

        const {
          data: company,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!company) {
          setErrorMessage(
            "Company profile could not be found."
          );
          setLoading(false);
          return;
        }

        // ----------------------------------------------------
        // GET INTERNSHIP
        // ----------------------------------------------------

        const {
          data: internshipData,
          error: internshipError,
        } = await supabase
          .from("internships")
          .select("*")
          .eq("id", internshipId)
          .maybeSingle();

        if (internshipError) {
          throw internshipError;
        }

        if (!internshipData) {
          setErrorMessage(
            "This internship could not be found."
          );
          setLoading(false);
          return;
        }

        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------

        if (
          internshipData.company_name !==
          company.company_name
        ) {
          setErrorMessage(
            "You do not have permission to view this application."
          );

          setLoading(false);
          return;
        }

        setInternship(internshipData);

        // ----------------------------------------------------
        // GET APPLICATION
        // ----------------------------------------------------

        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select("*")
          .eq("id", applicationId)
          .eq("internship_id", internshipId)
          .maybeSingle();

        if (applicationError) {
          throw applicationError;
        }

        if (!applicationData) {
          setErrorMessage(
            "This application could not be found."
          );
          setLoading(false);
          return;
        }

        // ----------------------------------------------------
        // GET GRADUATE PROFILE
        // ----------------------------------------------------

        let graduate = null;

        if (applicationData.graduate_id) {
          const {
            data: graduateData,
            error: graduateError,
          } = await supabase
            .from("graduates")
            .select("*")
            .eq("id", applicationData.graduate_id)
            .maybeSingle();

          if (graduateError) {
            console.error(
              "Graduate profile error:",
              graduateError
            );
          } else {
            graduate = graduateData;
          }
        }

        // ----------------------------------------------------
        // COMBINE APPLICATION + PROFILE
        // ----------------------------------------------------

        const combinedApplication = {
          ...applicationData,
          ...(graduate || {}),
        };

        // ----------------------------------------------------
        // CALCULATE AI MATCH
        // ----------------------------------------------------

        const match = calculateMatch(
          combinedApplication,
          internshipData
        );

        setApplication({
          ...combinedApplication,
          matchScore: match.score,
          matchLabel: match.label,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          strengths: match.strengths,
          improvements: match.improvements,
        });
      } catch (error) {
        console.error(
          "Application details error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Could not load this application."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [
    internshipId,
    applicationId,
    router,
  ]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(status) {
    if (!application?.id) return;

    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq("id", application.id);

      if (error) {
        throw error;
      }

      setApplication((current) => ({
        ...current,
        status,
      }));
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error?.message ||
          "Could not update application status."
      );
    }
  }

  // ==========================================================
  // OPEN DOCUMENT
  // ==========================================================

  async function openDocument(url, documentName) {
    if (!url) {
      alert(
        `No ${documentName} has been uploaded by this applicant.`
      );
      return;
    }

    try {
      const path = cleanDocumentPath(url);

      if (!path) {
        throw new Error(
          `Could not find the ${documentName} file.`
        );
      }

      const {
        data,
        error,
      } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 600);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          `Could not create a secure ${documentName} link.`
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        `${documentName} error:`,
        error
      );

      alert(
        error?.message ||
          `Could not open the ${documentName}.`
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f4f8fc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
          padding: "20px",
        }}
      >
        Loading application...
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f4f8fc",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "850px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "18px",
            padding: "35px",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              color: "#c62828",
              marginTop: 0,
            }}
          >
            Unable to load application
          </h1>

          <p
            style={{
              color: "#555",
              lineHeight: "1.6",
            }}
          >
            {errorMessage}
          </p>

          <button
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={primaryButton}
          >
            ← Back to Applicants
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #0057B8, #0077d9)",
            color: "#fff",
            borderRadius: "20px",
            padding: "30px",
            marginBottom: "25px",
            boxShadow:
              "0 10px 30px rgba(0,87,184,0.18)",
          }}
        >
          <button
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.35)",
              borderRadius: "9px",
              padding: "9px 14px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            ← Back to Applicants
          </button>

          <div
            style={{
              fontSize: "14px",
              opacity: 0.85,
              marginBottom: "7px",
            }}
          >
            APPLICATION REVIEW
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "32px",
            }}
          >
            {application?.full_name ||
              "Graduate Applicant"}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "17px",
              opacity: 0.92,
            }}
          >
            {internship?.job_title ||
              "Internship Application"}
          </p>
        </div>

        {/* ==================================================
            PROFILE + MATCH
        ================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.7fr) minmax(250px, 0.8fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* PROFILE */}

          <section style={cardStyle}>
            <h2 style={sectionTitle}>
              👤 Applicant Profile
            </h2>

            <div style={infoGrid}>
              <Info
                label="Full Name"
                value={
                  application?.full_name ||
                  "Not provided"
                }
              />

              <Info
                label="Email"
                value={
                  application?.email ||
                  "Not provided"
                }
              />

              <Info
                label="Phone"
                value={
                  application?.phone ||
                  "Not provided"
                }
              />

              <Info
                label="Province"
                value={
                  application?.province ||
                  "Not provided"
                }
              />

              <Info
                label="Institution"
                value={
                  application?.institution ||
                  "Not provided"
                }
              />

              <Info
                label="Qualification"
                value={
                  application?.qualification ||
                  "Not provided"
                }
              />

              <Info
                label="Field of Study"
                value={
                  application?.field_of_study ||
                  "Not provided"
                }
              />

              <Info
                label="Application Status"
                value={
                  application?.status ||
                  "pending"
                }
              />
            </div>
          </section>

          {/* MATCH */}

          <section style={cardStyle}>
            <h2 style={sectionTitle}>
              🤖 GradLink Match
            </h2>

            <div
              style={{
                textAlign: "center",
                padding: "15px 0 20px",
              }}
            >
              <div
                style={{
                  fontSize: "55px",
                  fontWeight: "800",
                  color:
                    application?.matchScore >= 85
                      ? "#16803c"
                      : application?.matchScore >= 70
                      ? "#0057B8"
                      : application?.matchScore >= 40
                      ? "#a66a00"
                      : "#c62828",
                }}
              >
                {application?.matchScore || 0}%
              </div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#555",
                }}
              >
                {application?.matchLabel}
              </div>
            </div>

            <div
              style={{
                background: "#f7f9fc",
                borderRadius: "10px",
                padding: "13px",
                marginBottom: "10px",
              }}
            >
              <strong>Internship:</strong>
              <br />
              {internship?.job_title || "—"}
            </div>

            <div
              style={{
                background: "#f7f9fc",
                borderRadius: "10px",
                padding: "13px",
              }}
            >
              <strong>Required Qualification:</strong>
              <br />
              {internship?.qualification ||
                "Any"}
            </div>
          </section>
        </div>

        {/* ==================================================
            CAREER INFORMATION
        ================================================== */}

        <section style={cardStyle}>
          <h2 style={sectionTitle}>
            🎓 Career & Skills
          </h2>

          <div style={infoGrid}>
            <Info
              label="Skills"
              value={
                application?.skills ||
                "Not provided"
              }
              full
            />

            <Info
              label="Career Goals"
              value={
                application?.career_goals ||
                "Not provided"
              }
              full
            />
          </div>
        </section>

        {/* ==================================================
            MATCHED SKILLS
        ================================================== */}

        <section style={cardStyle}>
          <h2 style={sectionTitle}>
            ✅ Matching Analysis
          </h2>

          <h3
            style={{
              color: "#16803c",
              marginBottom: "10px",
            }}
          >
            Strengths
          </h3>

          {application?.strengths?.length > 0 ? (
            <ul
              style={{
                lineHeight: "1.8",
                color: "#444",
              }}
            >
              {application.strengths.map(
                (item, index) => (
                  <li key={index}>
                    {item}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p style={mutedText}>
              No strengths identified.
            </p>
          )}

          <h3
            style={{
              color: "#9a6700",
              marginTop: "25px",
              marginBottom: "10px",
            }}
          >
            Skills to Improve
          </h3>

          {application?.missingSkills?.length >
          0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {application.missingSkills.map(
                (skill, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#fff8e6",
                      border:
                        "1px solid #e1c878",
                      color: "#765400",
                      padding:
                        "7px 11px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <p style={mutedText}>
              No missing required skills.
            </p>
          )}

          <h3
            style={{
              color: "#0057B8",
              marginTop: "25px",
              marginBottom: "10px",
            }}
          >
            Matched Skills
          </h3>

          {application?.matchedSkills?.length >
          0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {application.matchedSkills.map(
                (skill, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#eef5ff",
                      border:
                        "1px solid #bdd5f2",
                      color: "#0057B8",
                      padding:
                        "7px 11px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    ✓ {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <p style={mutedText}>
              No matching skills found.
            </p>
          )}
        </section>

        {/* ==================================================
            DOCUMENTS
        ================================================== */}

        <section style={cardStyle}>
          <h2 style={sectionTitle}>
            📄 Applicant Documents
          </h2>

          <p style={mutedText}>
            Secure document links are generated when
            the company chooses to review a document.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() =>
                openDocument(
                  application?.cv_url ||
                    application?.cv ||
                    application?.resume_url,
                  "CV"
                )
              }
              style={documentButton}
            >
              📄 Review CV
            </button>

            <button
              onClick={() =>
                openDocument(
                  application?.qualification_url,
                  "qualification document"
                )
              }
              style={{
                ...documentButton,
                background: "#fff",
                color: "#0057B8",
                border:
                  "2px solid #0057B8",
              }}
            >
              📜 Review Qualification
            </button>
          </div>
        </section>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <section
          style={{
            ...cardStyle,
            marginBottom: 0,
          }}
        >
          <h2 style={sectionTitle}>
            Recruitment Decision
          </h2>

          <p style={mutedText}>
            Update the applicant's status after
            reviewing their application.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() =>
                updateStatus("shortlisted")
              }
              style={shortlistButton}
            >
              ⭐ Shortlist Applicant
            </button>

            <button
              onClick={() =>
                updateStatus("rejected")
              }
              style={rejectButton}
            >
              ✕ Reject Applicant
            </button>

            <button
              onClick={() =>
                updateStatus("pending")
              }
              style={resetButton}
            >
              ↺ Reset to Pending
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// INFO
// ============================================================

function Info({ label, value, full }) {
  return (
    <div
      style={{
        background: "#f7f9fc",
        borderRadius: "11px",
        padding: "15px",
        gridColumn: full
          ? "1 / -1"
          : "auto",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#777",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "6px",
          fontWeight: "600",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#222",
          lineHeight: "1.6",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const cardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "20px",
  boxShadow: "0 7px 25px rgba(0,0,0,0.06)",
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: "20px",
  color: "#0057B8",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "15px",
};

const mutedText = {
  color: "#666",
  lineHeight: "1.6",
};

const primaryButton = {
  marginTop: "20px",
  padding: "13px 20px",
  border: "none",
  borderRadius: "10px",
  background: "#0057B8",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const documentButton = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "10px",
  background: "#0057B8",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
};

const shortlistButton = {
  padding: "13px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#16803c",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const rejectButton = {
  padding: "13px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#c62828",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const resetButton = {
  padding: "13px 18px",
  border: "1px solid #bbb",
  borderRadius: "10px",
  background: "#fff",
  color: "#555",
  fontWeight: "bold",
  cursor: "pointer",
};
