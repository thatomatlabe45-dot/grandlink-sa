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

function qualificationLevel(value) {
  const text = String(value || "").toLowerCase();

  if (
    text.includes("phd") ||
    text.includes("doctorate")
  ) {
    return 6;
  }

  if (
    text.includes("master") ||
    text.includes("postgrad")
  ) {
    return 6;
  }

  if (text.includes("honours") || text.includes("honors")) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bsc") ||
    text.includes("ba ") ||
    text.includes("bcom") ||
    text.includes("beng")
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
// NORMALISE TEXT
// ============================================================

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// MATCHING
// ============================================================

function calculateMatch(application, internship) {
  const applicantQualification = normalise(
    application.qualification
  );

  const requiredQualification = normalise(
    internship.qualification
  );

  const applicantField = normalise(
    application.field_of_study
  );

  const requiredField = normalise(
    internship.field_of_study
  );

  const applicantSkills = normalise(
    application.skills
  );

  const requiredSkills = normalise(
    internship.skills
  );

  let qualificationScore = 0;
  let fieldScore = 0;
  let skillsScore = 0;

  // ----------------------------------------------------------
  // QUALIFICATION
  // ----------------------------------------------------------

  const applicantLevel = qualificationLevel(
    applicantQualification
  );

  const requiredLevel = qualificationLevel(
    requiredQualification
  );

  if (requiredLevel === 0) {
    qualificationScore = applicantQualification
      ? 35
      : 0;
  } else if (
    applicantLevel >= requiredLevel
  ) {
    // Higher qualifications are accepted.
    qualificationScore = 35;
  } else if (
    applicantLevel === requiredLevel - 1
  ) {
    qualificationScore = 20;
  } else {
    qualificationScore = 0;
  }

  // ----------------------------------------------------------
  // FIELD OF STUDY
  // ----------------------------------------------------------

  if (!requiredField) {
    fieldScore = 35;
  } else if (
    applicantField &&
    (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    )
  ) {
    fieldScore = 35;
  } else {
    const applicantWords = applicantField.split(" ");
    const requiredWords = requiredField.split(" ");

    const matchingWords = applicantWords.filter(
      (word) =>
        word.length > 2 &&
        requiredWords.includes(word)
    );

    if (matchingWords.length > 0) {
      fieldScore = 20;
    }
  }

  // ----------------------------------------------------------
  // SKILLS
  // ----------------------------------------------------------

  if (!requiredSkills) {
    skillsScore = 30;
  } else {
    const applicantSkillList = applicantSkills
      .split(/[,;\n|]+/)
      .map((skill) => normalise(skill))
      .filter(Boolean);

    const requiredSkillList = requiredSkills
      .split(/[,;\n|]+/)
      .map((skill) => normalise(skill))
      .filter(Boolean);

    if (requiredSkillList.length === 0) {
      skillsScore = 30;
    } else {
      let matched = 0;

      requiredSkillList.forEach((requiredSkill) => {
        const found = applicantSkillList.some(
          (applicantSkill) =>
            applicantSkill.includes(requiredSkill) ||
            requiredSkill.includes(applicantSkill)
        );

        if (found) {
          matched++;
        }
      });

      skillsScore = Math.round(
        (matched / requiredSkillList.length) * 30
      );
    }
  }

  const total = Math.min(
    100,
    qualificationScore +
      fieldScore +
      skillsScore
  );

  let level = "Weak";

  if (total >= 85) {
    level = "Strong";
  } else if (total >= 70) {
    level = "Good";
  } else if (total >= 40) {
    level = "Possible";
  }

  return {
    total,
    level,
    qualificationScore,
    fieldScore,
    skillsScore,
  };
}

// ============================================================
// SCORE COLOUR
// ============================================================

function scoreColor(score) {
  if (score >= 85) return "#047857";
  if (score >= 70) return "#2563eb";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

// ============================================================
// FILE URL
// ============================================================

async function getDocumentUrl(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  // Already a complete URL
  if (
    text.startsWith("http://") ||
    text.startsWith("https://")
  ) {
    return text;
  }

  // Remove bucket name if accidentally included
  let path = text;

  if (path.startsWith("documents/")) {
    path = path.replace(/^documents\//, "");
  }

  const { data, error } =
    await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    console.error(
      "Document URL error:",
      error
    );

    return null;
  }

  return data.signedUrl;
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
  const [graduates, setGraduates] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedApplicant, setSelectedApplicant] =
    useState(null);

  const [openingCV, setOpeningCV] = useState(null);
  const [openingQualification, setOpeningQualification] =
    useState(null);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (!internshipId) return;

    loadApplicants();
  }, [internshipId]);

  async function loadApplicants() {
    setLoading(true);
    setError("");

    try {
      // ------------------------------------------------------
      // GET INTERNSHIP
      // ------------------------------------------------------

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select("*")
        .eq("id", internshipId)
        .single();

      if (internshipError) {
        throw internshipError;
      }

      setInternship(internshipData);

      // ------------------------------------------------------
      // GET APPLICATIONS
      // ------------------------------------------------------

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

      const apps = applicationData || [];

      // ------------------------------------------------------
      // GET GRADUATE PROFILES
      // ------------------------------------------------------

      const graduateIds = [
        ...new Set(
          apps
            .map((app) => app.graduate_id)
            .filter(Boolean)
        ),
      ];

      let graduateMap = {};

      if (graduateIds.length > 0) {
        const {
          data: graduateData,
          error: graduateError,
        } = await supabase
          .from("graduates")
          .select("*")
          .in("id", graduateIds);

        if (!graduateError && graduateData) {
          graduateData.forEach((graduate) => {
            graduateMap[graduate.id] = graduate;
          });
        }
      }

      setGraduates(graduateMap);

      // ------------------------------------------------------
      // ADD MATCH SCORE
      // ------------------------------------------------------

      const enrichedApplications = apps.map(
        (application) => {
          const graduate =
            graduateMap[application.graduate_id] ||
            {};

          const combinedApplication = {
            ...graduate,
            ...application,
          };

          const match = calculateMatch(
            combinedApplication,
            internshipData
          );

          return {
            ...application,
            graduate,
            match,
          };
        }
      );

      // Highest score first
      enrichedApplications.sort(
        (a, b) =>
          b.match.total - a.match.total
      );

      setApplications(
        enrichedApplications
      );
    } catch (err) {
      console.error(
        "Applicants loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load applicants."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // OPEN CV
  // ==========================================================

  async function openCV(application) {
    setOpeningCV(application.id);

    try {
      const graduate =
        graduates[application.graduate_id] ||
        application.graduate ||
        {};

      const cv =
        application.cv_url ||
        graduate.cv_url ||
        application.cv ||
        graduate.cv ||
        application.resume_url ||
        graduate.resume_url ||
        application.document_url ||
        graduate.document_url;

      if (!cv) {
        alert(
          "No CV has been uploaded by this applicant."
        );
        return;
      }

      const url = await getDocumentUrl(cv);

      if (!url) {
        alert(
          "Unable to open the applicant's CV."
        );
        return;
      }

      // Works better on iPhone Safari
      window.location.assign(url);
    } catch (err) {
      console.error(
        "CV error:",
        err
      );

      alert(
        "Unable to open the CV."
      );
    } finally {
      setOpeningCV(null);
    }
  }

  // ==========================================================
  // OPEN QUALIFICATION
  // ==========================================================

  async function openQualification(application) {
    setOpeningQualification(
      application.id
    );

    try {
      const graduate =
        graduates[application.graduate_id] ||
        application.graduate ||
        {};

      const qualification =
        application.qualification_url ||
        graduate.qualification_url ||
        application.qualification_document_url ||
        graduate.qualification_document_url;

      if (!qualification) {
        alert(
          "No qualification document has been uploaded by this applicant."
        );
        return;
      }

      const url =
        await getDocumentUrl(
          qualification
        );

      if (!url) {
        alert(
          "Unable to open the qualification document."
        );
        return;
      }

      // Works better on iPhone Safari
      window.location.assign(url);
    } catch (err) {
      console.error(
        "Qualification error:",
        err
      );

      alert(
        "Unable to open the qualification document."
      );
    } finally {
      setOpeningQualification(
        null
      );
    }
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async function updateStatus(
    applicationId,
    newStatus
  ) {
    try {
      const {
        error: updateError,
      } = await supabase
        .from("applications")
        .update({
          status: newStatus,
        })
        .eq("id", applicationId);

      if (updateError) {
        throw updateError;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id ===
          applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application
        )
      );

      if (
        selectedApplicant?.id ===
        applicationId
      ) {
        setSelectedApplicant(
          (current) =>
            current
              ? {
                  ...current,
                  status: newStatus,
                }
              : current
        );
      }
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      alert(
        err?.message ||
          "Unable to update application status."
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
          background: "#f5f8fc",
          padding: "40px 20px",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
            paddingTop: "100px",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            ⏳
          </div>

          <h2
            style={{
              color: "#0f172a",
              marginBottom: "8px",
            }}
          >
            Loading applicants...
          </h2>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Please wait while we load the
            applications for this internship.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f8fc",
          padding: "40px 20px",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "80px auto",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              color: "#dc2626",
            }}
          >
            Unable to load applicants
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: "25px",
            }}
          >
            {error}
          </p>

          <button
            onClick={loadApplicants}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "13px 22px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Try Again
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
        background:
          "linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%)",
        padding: "25px 16px 60px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div>
            <Link
              href={`/company/internships/${internshipId}`}
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              ← Back to Internship
            </Link>

            <h1
              style={{
                margin:
                  "10px 0 5px",
                color: "#0f172a",
                fontSize:
                  "clamp(25px,5vw,38px)",
              }}
            >
              Internship Applicants
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Review and manage candidates
              who applied for this internship.
            </p>
          </div>

          <button
            onClick={loadApplicants}
            style={{
              background: "#ffffff",
              color: "#2563eb",
              border:
                "1px solid #bfdbfe",
              padding: "11px 17px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ================================================== */}
        {/* INTERNSHIP SUMMARY */}
        {/* ================================================== */}

        {internship && (
          <section
            style={{
              background:
                "linear-gradient(135deg,#0f4cdb,#2563eb)",
              color: "#ffffff",
              borderRadius: "22px",
              padding: "25px",
              marginBottom: "25px",
              boxShadow:
                "0 15px 35px rgba(37,99,235,0.20)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent:
                  "space-between",
                gap: "25px",
              }}
            >
              <div
                style={{
                  flex: "1 1 400px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    opacity: 0.85,
                    marginBottom: "7px",
                    fontWeight: "700",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.5px",
                  }}
                >
                  Internship
                </div>

                <h2
                  style={{
                    margin:
                      "0 0 10px",
                    fontSize:
                      "clamp(22px,4vw,32px)",
                  }}
                >
                  {internship.job_title ||
                    "Internship"}
                </h2>

                <p
                  style={{
                    margin: 0,
                    opacity: 0.92,
                    fontSize: "15px",
                  }}
                >
                  🏢{" "}
                  {internship.company_name ||
                    "Company"}
                  {" • "}
                  📍{" "}
                  {internship.location ||
                    internship.province ||
                    "Location not specified"}
                </p>
              </div>

              <div
                style={{
                  minWidth: "150px",
                  background:
                    "rgba(255,255,255,0.15)",
                  borderRadius: "18px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    fontWeight: "800",
                  }}
                >
                  {applications.length}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                  }}
                >
                  Total Applicants
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {applications.length === 0 && (
          <section
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "60px 25px",
              textAlign: "center",
              boxShadow:
                "0 8px 25px rgba(15,23,42,0.06)",
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
                color: "#0f172a",
                marginBottom: "10px",
              }}
            >
              No applicants yet
            </h2>

            <p
              style={{
                color: "#64748b",
                maxWidth: "500px",
                margin:
                  "0 auto 25px",
              }}
            >
              Applicants will appear here when
              graduates apply for this internship.
            </p>

            <Link
              href="/company"
              style={{
                display: "inline-block",
                background: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                fontWeight: "700",
              }}
            >
              ← Company Dashboard
            </Link>
          </section>
        )}

        {/* ================================================== */}
        {/* APPLICANTS */}
        {/* ================================================== */}

        {applications.length > 0 && (
          <section>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "15px",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "22px",
                }}
              >
                Applicants
              </h2>

              <span
                style={{
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  padding:
                    "7px 12px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                Sorted by AI Match Score
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {applications.map(
                (application, index) => {
                  const graduate =
                    application.graduate ||
                    {};

                  const name =
                    application.full_name ||
                    graduate.full_name ||
                    "Applicant";

                  const qualification =
                    application.qualification ||
                    graduate.qualification ||
                    "Not provided";

                  const field =
                    application.field_of_study ||
                    graduate.field_of_study ||
                    "Not provided";

                  const skills =
                    application.skills ||
                    graduate.skills ||
                    "Not provided";

                  const score =
                    application.match?.total ||
                    0;

                  const status =
                    application.status ||
                    "Pending";

                  return (
                    <article
                      key={
                        application.id
                      }
                      style={{
                        background:
                          "#ffffff",
                        borderRadius:
                          "18px",
                        padding:
                          "20px",
                        boxShadow:
                          "0 7px 25px rgba(15,23,42,0.07)",
                        border:
                          "1px solid #e5edf8",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap:
                            "wrap",
                          justifyContent:
                            "space-between",
                          gap: "18px",
                        }}
                      >
                        {/* APPLICANT INFO */}

                        <div
                          style={{
                            flex:
                              "1 1 400px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "12px",
                              marginBottom:
                                "14px",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "48px",
                                height:
                                  "48px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#dbeafe",
                                color:
                                  "#1d4ed8",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontWeight:
                                  "800",
                                fontSize:
                                  "19px",
                                flexShrink: 0,
                              }}
                            >
                              {name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "700",
                                  marginBottom:
                                    "2px",
                                }}
                              >
                                #{index + 1}
                              </div>

                              <h3
                                style={{
                                  margin:
                                    0,
                                  color:
                                    "#0f172a",
                                  fontSize:
                                    "19px",
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {name}
                              </h3>
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit,minmax(180px,1fr))",
                              gap: "10px",
                            }}
                          >
                            <InfoBox
                              label="Qualification"
                              value={
                                qualification
                              }
                            />

                            <InfoBox
                              label="Field of Study"
                              value={
                                field
                              }
                            />

                            <InfoBox
                              label="Email"
                              value={
                                application.email ||
                                graduate.email ||
                                "Not provided"
                              }
                            />

                            <InfoBox
                              label="Phone"
                              value={
                                application.phone ||
                                graduate.phone ||
                                "Not provided"
                              }
                            />
                          </div>

                          <div
                            style={{
                              marginTop:
                                "12px",
                              background:
                                "#f8fafc",
                              padding:
                                "11px 13px",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "11px",
                                color:
                                  "#64748b",
                                fontWeight:
                                  "800",
                                marginBottom:
                                  "5px",
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Skills
                            </div>

                            <div
                              style={{
                                color:
                                  "#334155",
                                fontSize:
                                  "13px",
                                lineHeight:
                                  "1.5",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {skills}
                            </div>
                          </div>
                        </div>

                        {/* SCORE */}

                        <div
                          style={{
                            minWidth:
                              "145px",
                            textAlign:
                              "center",
                            alignSelf:
                              "flex-start",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "105px",
                              height:
                                "105px",
                              margin:
                                "0 auto 10px",
                              borderRadius:
                                "50%",
                              border:
                                `8px solid ${scoreColor(
                                  score
                                )}`,
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "#ffffff",
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  "27px",
                                color:
                                  scoreColor(
                                    score
                                  ),
                              }}
                            >
                              {score}%
                            </strong>

                            <span
                              style={{
                                fontSize:
                                  "10px",
                                color:
                                  "#64748b",
                                fontWeight:
                                  "700",
                              }}
                            >
                              MATCH
                            </span>
                          </div>

                          <div
                            style={{
                              color:
                                scoreColor(
                                  score
                                ),
                              fontWeight:
                                "800",
                              fontSize:
                                "13px",
                            }}
                          >
                            {application
                              .match
                              ?.level ||
                              "Weak"}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "10px",
                              display:
                                "inline-block",
                              padding:
                                "5px 10px",
                              borderRadius:
                                "999px",
                              background:
                                status ===
                                "Shortlisted"
                                  ? "#dcfce7"
                                  : status ===
                                    "Rejected"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                status ===
                                "Shortlisted"
                                  ? "#166534"
                                  : status ===
                                    "Rejected"
                                  ? "#991b1b"
                                  : "#92400e",
                              fontSize:
                                "11px",
                              fontWeight:
                                "800",
                            }}
                          >
                            {status}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div
                        style={{
                          marginTop:
                            "18px",
                          paddingTop:
                            "15px",
                          borderTop:
                            "1px solid #e5e7eb",
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: "9px",
                        }}
                      >
                        <button
                          onClick={() =>
                            setSelectedApplicant(
                              application
                            )
                          }
                          style={{
                            background:
                              "#2563eb",
                            color:
                              "#ffffff",
                            border:
                              "none",
                            padding:
                              "10px 15px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          👤 Review Application
                        </button>

                        <button
                          onClick={() =>
                            openCV(
                              application
                            )
                          }
                          disabled={
                            openingCV ===
                            application.id
                          }
                          style={{
                            background:
                              "#eff6ff",
                            color:
                              "#1d4ed8",
                            border:
                              "1px solid #bfdbfe",
                            padding:
                              "10px 15px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          {openingCV ===
                          application.id
                            ? "Opening..."
                            : "📄 View CV"}
                        </button>

                        <button
                          onClick={() =>
                            openQualification(
                              application
                            )
                          }
                          disabled={
                            openingQualification ===
                            application.id
                          }
                          style={{
                            background:
                              "#f8fafc",
                            color:
                              "#334155",
                            border:
                              "1px solid #cbd5e1",
                            padding:
                              "10px 15px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          {openingQualification ===
                          application.id
                            ? "Opening..."
                            : "🎓 View Qualification"}
                        </button>

                        <div
                          style={{
                            flex:
                              "1 1 auto",
                          }}
                        />

                        <button
                          onClick={() =>
                            updateStatus(
                              application.id,
                              "Shortlisted"
                            )
                          }
                          style={{
                            background:
                              "#ecfdf5",
                            color:
                              "#047857",
                            border:
                              "1px solid #a7f3d0",
                            padding:
                              "10px 15px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✓ Shortlist
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              application.id,
                              "Rejected"
                            )
                          }
                          style={{
                            background:
                              "#fff1f2",
                            color:
                              "#be123c",
                            border:
                              "1px solid #fecdd3",
                            padding:
                              "10px 15px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>

      {/* ==================================================== */}
      {/* REVIEW APPLICATION MODAL */}
      {/* ==================================================== */}

      {selectedApplicant && (
        <div
          onClick={() =>
            setSelectedApplicant(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15,23,42,0.65)",
            zIndex: 1000,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              maxWidth: "750px",
              margin:
                "30px auto",
              background:
                "#ffffff",
              borderRadius:
                "20px",
              overflow:
                "hidden",
              boxShadow:
                "0 25px 70px rgba(0,0,0,0.25)",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                background:
                  "linear-gradient(135deg,#0f4cdb,#2563eb)",
                color:
                  "#ffffff",
                padding:
                  "25px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap: "15px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        "13px",
                      opacity:
                        0.85,
                      marginBottom:
                        "5px",
                    }}
                  >
                    Applicant
                  </div>

                  <h2
                    style={{
                      margin:
                        0,
                    }}
                  >
                    {selectedApplicant.full_name ||
                      selectedApplicant
                        .graduate
                        ?.full_name ||
                      "Applicant"}
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setSelectedApplicant(
                      null
                    )
                  }
                  style={{
                    width:
                      "38px",
                    height:
                      "38px",
                    borderRadius:
                      "50%",
                    border:
                      "none",
                    background:
                      "rgba(255,255,255,0.18)",
                    color:
                      "#ffffff",
                    fontSize:
                      "20px",
                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* MODAL BODY */}

            <div
              style={{
                padding:
                  "25px",
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap:
                    "14px",
                  marginBottom:
                    "22px",
                }}
              >
                <InfoBox
                  label="Email"
                  value={
                    selectedApplicant.email ||
                    selectedApplicant
                      .graduate
                      ?.email ||
                    "Not provided"
                  }
                />

                <InfoBox
                  label="Phone"
                  value={
                    selectedApplicant.phone ||
                    selectedApplicant
                      .graduate
                      ?.phone ||
                    "Not provided"
                  }
                />

                <InfoBox
                  label="Qualification"
                  value={
                    selectedApplicant
                      .qualification ||
                    selectedApplicant
                      .graduate
                      ?.qualification ||
                    "Not provided"
                  }
                />

                <InfoBox
                  label="Field of Study"
                  value={
                    selectedApplicant
                      .field_of_study ||
                    selectedApplicant
                      .graduate
                      ?.field_of_study ||
                    "Not provided"
                  }
                />

                <InfoBox
                  label="Institution"
                  value={
                    selectedApplicant
                      .graduate
                      ?.institution ||
                    "Not provided"
                  }
                />

                <InfoBox
                  label="Province"
                  value={
                    selectedApplicant
                      .graduate
                      ?.province ||
                    "Not provided"
                  }
                />
              </div>

              {/* AI ANALYSIS */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "15px",
                  padding:
                    "18px",
                  marginBottom:
                    "18px",
                }}
              >
                <h3
                  style={{
                    margin:
                      "0 0 15px",
                    color:
                      "#0f172a",
                  }}
                >
                  🤖 GradLink AI Match
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "20px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "42px",
                      fontWeight:
                        "800",
                      color:
                        scoreColor(
                          selectedApplicant
                            .match
                            ?.total ||
                            0
                        ),
                    }}
                  >
                    {selectedApplicant
                      .match
                      ?.total || 0}
                    %
                  </div>

                  <div>
                    <strong
                      style={{
                        color:
                          scoreColor(
                            selectedApplicant
                              .match
                              ?.total ||
                              0
                          ),
                      }}
                    >
                      {selectedApplicant
                        .match
                        ?.level ||
                        "Weak"}{" "}
                      Match
                    </strong>

                    <div
                      style={{
                        marginTop:
                          "6px",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      Qualification:{" "}
                      {
                        selectedApplicant
                          .match
                          ?.qualificationScore
                      }
                      /35
                    </div>

                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      Field:{" "}
                      {
                        selectedApplicant
                          .match
                          ?.fieldScore
                      }
                      /35
                    </div>

                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      Skills:{" "}
                      {
                        selectedApplicant
                          .match
                          ?.skillsScore
                      }
                      /30
                    </div>
                  </div>
                </div>
              </div>

              {/* SKILLS */}

              <div
                style={{
                  marginBottom:
                    "20px",
                }}
              >
                <h3
                  style={{
                    color:
                      "#0f172a",
                    fontSize:
                      "17px",
                  }}
                >
                  Skills
                </h3>

                <p
                  style={{
                    color:
                      "#475569",
                    lineHeight:
                      "1.6",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {selectedApplicant.skills ||
                    selectedApplicant
                      .graduate
                      ?.skills ||
                    "No skills provided."}
                </p>
              </div>

              {/* ACTION BUTTONS */}

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "10px",
                }}
              >
                <button
                  onClick={() =>
                    openCV(
                      selectedApplicant
                    )
                  }
                  style={{
                    flex:
                      "1 1 180px",
                    background:
                      "#2563eb",
                    color:
                      "#ffffff",
                    border:
                      "none",
                    padding:
                      "13px",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "700",
                    cursor:
                      "pointer",
                  }}
                >
                  📄 View CV
                </button>

                <button
                  onClick={() =>
                    openQualification(
                      selectedApplicant
                    )
                  }
                  style={{
                    flex:
                      "1 1 180px",
                    background:
                      "#0f172a",
                    color:
                      "#ffffff",
                    border:
                      "none",
                    padding:
                      "13px",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "700",
                    cursor:
                      "pointer",
                  }}
                >
                  🎓 View Qualification
                </button>

                <button
                  onClick={() =>
                    updateStatus(
                      selectedApplicant.id,
                      "Shortlisted"
                    )
                  }
                  style={{
                    flex:
                      "1 1 150px",
                    background:
                      "#059669",
                    color:
                      "#ffffff",
                    border:
                      "none",
                    padding:
                      "13px",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "700",
                    cursor:
                      "pointer",
                  }}
                >
                  ✓ Shortlist
                </button>

                <button
                  onClick={() =>
                    updateStatus(
                      selectedApplicant.id,
                      "Rejected"
                    )
                  }
                  style={{
                    flex:
                      "1 1 150px",
                    background:
                      "#dc2626",
                    color:
                      "#ffffff",
                    border:
                      "none",
                    padding:
                      "13px",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "700",
                    cursor:
                      "pointer",
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================
// INFO BOX
// ============================================================

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background:
          "#f8fafc",
        border:
          "1px solid #e2e8f0",
        borderRadius:
          "10px",
        padding:
          "12px",
      }}
    >
      <div
        style={{
          color:
            "#64748b",
          fontSize:
            "11px",
          fontWeight:
            "800",
          textTransform:
            "uppercase",
          marginBottom:
            "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color:
            "#334155",
          fontSize:
            "13px",
          fontWeight:
            "600",
          lineHeight:
            "1.4",
          wordBreak:
            "break-word",
        }}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}
