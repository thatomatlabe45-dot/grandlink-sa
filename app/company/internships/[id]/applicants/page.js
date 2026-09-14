"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

  if (text.includes("honours") || text.includes("honors")) {
    return 5;
  }

  if (text.includes("degree") || text.includes("bachelor")) {
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
      (matchedSkills.length / internshipSkills.length) * 30;
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
// PAGE
// ============================================================

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId = params?.id;

  const [internship, setInternship] = useState(null);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (!internshipId) return;

    async function loadApplicants() {
      setLoading(true);
      setErrorMessage("");

      try {
        // ----------------------------------------------------
        // GET USER
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
            "You do not have permission to view applicants for this internship."
          );

          setLoading(false);
          return;
        }

        setInternship(internshipData);

        // ----------------------------------------------------
        // GET APPLICATIONS
        // ----------------------------------------------------

        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select("*")
          .eq("internship_id", internshipId)
          .order("created_at", {
            ascending: false,
          });

        if (applicationError) {
          throw applicationError;
        }

        // ----------------------------------------------------
        // GET GRADUATE PROFILES
        // ----------------------------------------------------

        const graduateIds = [
          ...new Set(
            (applicationData || [])
              .map(
                (application) =>
                  application.graduate_id
              )
              .filter(Boolean)
          ),
        ];

        let graduates = [];

        if (graduateIds.length > 0) {
          const {
            data: graduateData,
            error: graduateError,
          } = await supabase
            .from("graduates")
            .select("*")
            .in("id", graduateIds);

          if (graduateError) {
            console.error(
              "Graduate profile error:",
              graduateError
            );
          } else {
            graduates = graduateData || [];
          }
        }

        // ----------------------------------------------------
        // MERGE APPLICATION + GRADUATE
        // ----------------------------------------------------

        const mergedApplications = (
          applicationData || []
        ).map((application) => {
          const graduate = graduates.find(
            (item) =>
              String(item.id) ===
              String(application.graduate_id)
          );

          const combined = {
  ...(graduate || {}),
  ...application,
};

          const match = calculateMatch(
            combined,
            internshipData
          );

          return {
            ...combined,
            matchScore: match.score,
            matchLabel: match.label,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            strengths: match.strengths,
            improvements: match.improvements,
          };
        });

        // ----------------------------------------------------
        // SORT BY MATCH SCORE
        // ----------------------------------------------------

        mergedApplications.sort(
          (a, b) => b.matchScore - a.matchScore
        );

        setApplications(mergedApplications);
      } catch (error) {
        console.error(
          "Applicants page error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Could not load applicants."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplicants();
  }, [internshipId, router]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(applicationId, status) {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq("id", applicationId);

      if (error) {
        throw error;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status,
              }
            : application
        )
      );
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
  // REVIEW CV
  // ==========================================================

  async function reviewCV(application) {
    const cvUrl =
      application.cv_url ||
      application.cv ||
      application.resume_url;

    if (!cvUrl) {
      alert(
        "This applicant has not uploaded a CV."
      );
      return;
    }

    // Open window immediately to avoid Safari popup blocking
    const newWindow = window.open(
      "",
      "_blank"
    );

    if (!newWindow) {
      alert(
        "Please allow pop-ups in your browser to review the CV."
      );
      return;
    }

    try {
      const cleanPath = String(cvUrl)
        .replace(/^.*\/documents\//, "")
        .replace(/^\/+/, "");

      const { data, error } =
        await supabase.storage
          .from("documents")
          .createSignedUrl(cleanPath, 600);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Could not create a secure CV link."
        );
      }

      newWindow.location.href =
        data.signedUrl;
    } catch (error) {
      console.error(
        "CV review error:",
        error
      );

      newWindow.close();

      alert(
        error?.message ||
          "Could not open this CV."
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
        }}
      >
        Loading applicants...
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
            maxWidth: "900px",
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
              marginBottom: "15px",
            }}
          >
            Unable to load applicants
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
                "/company-dashboard"
              )
            }
            style={{
              marginTop: "20px",
              padding: "13px 20px",
              border: "none",
              borderRadius: "10px",
              background: "#0057B8",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ← Back to Company Dashboard
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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #0057B8, #0077d9)",
            color: "#fff",
            borderRadius: "18px",
            padding: "30px",
            marginBottom: "25px",
            boxShadow:
              "0 10px 30px rgba(0,87,184,0.18)",
          }}
        >
          <button
            onClick={() =>
              router.push(
                "/company-dashboard"
              )
            }
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.35)",
              borderRadius: "8px",
              padding: "9px 14px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            ← Back to Dashboard
          </button>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "32px",
            }}
          >
            👥 Internship Applicants
          </h1>

          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
              fontWeight: "600",
            }}
          >
            {internship?.job_title ||
              "Internship"}
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            Review and manage graduates who
            applied for this internship.
          </p>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >
          <div style={summaryCard}>
            <div style={summaryIcon}>
              👥
            </div>

            <div>
              <div style={summaryNumber}>
                {applications.length}
              </div>

              <div style={summaryLabel}>
                Total Applicants
              </div>
            </div>
          </div>

          <div style={summaryCard}>
            <div style={summaryIcon}>
              ⭐
            </div>

            <div>
              <div style={summaryNumber}>
                {
                  applications.filter(
                    (item) =>
                      item.matchScore >= 85
                  ).length
                }
              </div>

              <div style={summaryLabel}>
                Strong Matches
              </div>
            </div>
          </div>

          <div style={summaryCard}>
            <div style={summaryIcon}>
              📋
            </div>

            <div>
              <div style={summaryNumber}>
                {
                  applications.filter(
                    (item) =>
                      item.status ===
                      "shortlisted"
                  ).length
                }
              </div>

              <div style={summaryLabel}>
                Shortlisted
              </div>
            </div>
          </div>
        </div>

        {/* INTERNSHIP DETAILS */}

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "25px",
            marginBottom: "25px",
            boxShadow:
              "0 6px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0057B8",
            }}
          >
            Internship Details
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "15px",
            }}
          >
            <Detail
              label="Company"
              value={
                internship?.company_name ||
                "—"
              }
            />

            <Detail
              label="Province"
              value={
                internship?.province || "—"
              }
            />

            <Detail
              label="Location"
              value={
                internship?.location || "—"
              }
            />

            <Detail
              label="Internship Type"
              value={
                internship?.internship_type ||
                "—"
              }
            />

            <Detail
              label="Qualification"
              value={
                internship?.qualification ||
                "Any"
              }
            />

            <Detail
              label="Field of Study"
              value={
                internship?.field_of_study ||
                "Any"
              }
            />

            <Detail
              label="Stipend"
              value={
                internship?.stipend ||
                "Not specified"
              }
            />

            <Detail
              label="Deadline"
              value={
                internship?.deadline ||
                "Not specified"
              }
            />
          </div>
        </div>

        {/* APPLICANTS */}

        {applications.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "55px 25px",
              textAlign: "center",
              boxShadow:
                "0 6px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "55px",
                marginBottom: "15px",
              }}
            >
              📭
            </div>

            <h2
              style={{
                color: "#0057B8",
                marginBottom: "8px",
              }}
            >
              No applicants yet
            </h2>

            <p
              style={{
                color: "#666",
              }}
            >
              Applications for this internship
              will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {applications.map(
              (application, index) => (
                <ApplicantCard
                  key={
                    application.id ||
                    application.graduate_id ||
                    index
                  }
                  application={application}
                  index={index}
                  internshipId={internshipId}
                  onStatusChange={
                    updateStatus
                  }
                  onReviewCV={reviewCV}
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// APPLICANT CARD
// ============================================================

function ApplicantCard({
  application,
  index,
  internshipId,
  onStatusChange,
  onReviewCV,
}) {
  const score = application.matchScore || 0;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "25px",
        boxShadow:
          "0 7px 25px rgba(0,0,0,0.07)",
        border:
          score >= 85
            ? "2px solid #b7e4c7"
            : "1px solid #e5eaf0",
      }}
    >
      {/* TOP */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              color: "#777",
              fontSize: "13px",
              marginBottom: "5px",
            }}
          >
            Applicant #{index + 1}
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              color: "#222",
            }}
          >
            {application.full_name ||
              "Graduate Applicant"}
          </h2>

          <div
            style={{
              color: "#555",
              lineHeight: "1.7",
            }}
          >
            📧{" "}
            {application.email ||
              "Email not provided"}
            <br />
            📱{" "}
            {application.phone ||
              "Phone not provided"}
          </div>
        </div>

        {/* MATCH SCORE */}

        <div
          style={{
            minWidth: "130px",
            textAlign: "center",
            padding: "15px",
            borderRadius: "14px",
            background:
              score >= 85
                ? "#e8f7ee"
                : score >= 70
                ? "#eef5ff"
                : score >= 40
                ? "#fff8e6"
                : "#fff0f0",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              fontWeight: "800",
              color:
                score >= 85
                  ? "#16803c"
                  : score >= 70
                  ? "#0057B8"
                  : score >= 40
                  ? "#a66a00"
                  : "#c62828",
            }}
          >
            {score}%
          </div>

          <div
            style={{
              fontWeight: "bold",
              color: "#555",
            }}
          >
            {application.matchLabel}
          </div>
        </div>
      </div>

      {/* DETAILS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <InfoBox
          label="Qualification"
          value={
            application.qualification ||
            "Not provided"
          }
        />

        <InfoBox
          label="Field of Study"
          value={
            application.field_of_study ||
            "Not provided"
          }
        />

        <InfoBox
          label="Skills"
          value={
            application.skills ||
            "Not provided"
          }
        />

        <InfoBox
          label="Application Status"
          value={
            application.status ||
            "pending"
          }
        />
      </div>

      {/* STRENGTHS */}

      {application.strengths?.length > 0 && (
        <div
          style={{
            background: "#f4fbf6",
            border: "1px solid #ccebd7",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "15px",
          }}
        >
          <strong
            style={{
              color: "#16803c",
            }}
          >
            ✅ Strengths
          </strong>

          <ul
            style={{
              marginBottom: 0,
              color: "#444",
              lineHeight: "1.7",
            }}
          >
            {application.strengths.map(
              (item, i) => (
                <li key={i}>{item}</li>
              )
            )}
          </ul>
        </div>
      )}

      {/* MISSING SKILLS */}

      {application.missingSkills?.length >
        0 && (
        <div
          style={{
            background: "#fffaf0",
            border: "1px solid #f0dfb2",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "15px",
          }}
        >
          <strong
            style={{
              color: "#9a6700",
            }}
          >
            ⚠️ Skills to Improve
          </strong>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            {application.missingSkills.map(
              (skill, i) => (
                <span
                  key={i}
                  style={{
                    background: "#fff",
                    border:
                      "1px solid #e1c878",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    fontSize: "13px",
                  }}
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          paddingTop: "15px",
          borderTop:
            "1px solid #edf0f4",
        }}
      >
        <Link
          href={`/company/internships/${internshipId}/applicants/${application.id}`}
          style={{
            ...actionButton("#0057B8"),
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          👤 View Full Application
        </Link>

        <button
          onClick={() =>
            onStatusChange(
              application.id,
              "shortlisted"
            )
          }
          style={actionButton("#16803c")}
        >
          ⭐ Shortlist
        </button>

        <button
          onClick={() =>
            onStatusChange(
              application.id,
              "rejected"
            )
          }
          style={actionButton("#c62828")}
        >
          ✕ Reject
        </button>

        <button
          onClick={() =>
            onStatusChange(
              application.id,
              "pending"
            )
          }
          style={actionButton("#777")}
        >
          ↺ Reset
        </button>

        <button
          onClick={() =>
            onReviewCV(application)
          }
          style={actionButton("#174ea6")}
        >
          📄 Review CV
        </button>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL COMPONENT
// ============================================================

function Detail({ label, value }) {
  return (
    <div
      style={{
        background: "#f7f9fc",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "600",
          color: "#222",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// INFO BOX
// ============================================================

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#f7f9fc",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#333",
          lineHeight: "1.5",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

const summaryCard = {
  background: "#fff",
  borderRadius: "14px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
};

const summaryIcon = {
  fontSize: "30px",
};

const summaryNumber = {
  fontSize: "28px",
  fontWeight: "800",
  color: "#0057B8",
};

const summaryLabel = {
  color: "#666",
  fontSize: "14px",
};

// ============================================================
// ACTION BUTTON
// ============================================================

function actionButton(background) {
  return {
    background,
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "11px 15px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}