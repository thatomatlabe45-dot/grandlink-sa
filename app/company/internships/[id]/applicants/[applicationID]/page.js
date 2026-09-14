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
  // FIELD - 35%
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
    const applicantWords =
      applicantField.split(" ");

    const requiredWords =
      requiredField.split(" ");

    const overlap =
      applicantWords.filter((word) =>
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
      const required =
        normalizeText(requiredSkill);

      const found =
        applicantSkills.some((skill) => {
          const applicant =
            normalizeText(skill);

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

  const score = Math.round(
    qualificationScore +
      fieldScore +
      skillsScore
  );

  let label = "Weak";

  if (score >= 85) {
    label = "Strong";
  } else if (score >= 70) {
    label = "Good";
  } else if (score >= 40) {
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
        matchedSkills.length === 1
          ? ""
          : "s"
      }.`
    );
  }

  if (missingSkills.length > 0) {
    improvements.push(
      `Missing ${missingSkills.length} required skill${
        missingSkills.length === 1
          ? ""
          : "s"
      }.`
    );
  }

  return {
    score,
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

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId =
    params?.id;

  const applicationId =
    params?.applicationId ||
    params?.applicationid ||
    params?.application_id;

  const [internship, setInternship] =
    useState(null);

  const [application, setApplication] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // LOAD APPLICATION
  // ==========================================================

  useEffect(() => {
    if (!internshipId || !applicationId) {
      setLoading(false);

      setErrorMessage(
        "The application could not be identified. Please return to the applicant list and try again."
      );

      return;
    }

    let cancelled = false;

    async function loadApplication() {
      setLoading(true);
      setErrorMessage("");

      try {
        // ----------------------------------------------------
        // GET USER
        // ----------------------------------------------------

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // ----------------------------------------------------
        // GET COMPANY
        // ----------------------------------------------------

        const {
          data: company,
          error: companyError,
        } =
          await supabase
            .from("companies")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!company) {
          throw new Error(
            "Company profile could not be found."
          );
        }

        // ----------------------------------------------------
        // GET INTERNSHIP
        // ----------------------------------------------------

        const {
          data: internshipData,
          error: internshipError,
        } =
          await supabase
            .from("internships")
            .select("*")
            .eq("id", internshipId)
            .maybeSingle();

        if (internshipError) {
          throw internshipError;
        }

        if (!internshipData) {
          throw new Error(
            "This internship could not be found."
          );
        }

        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------

        if (
          internshipData.company_name !==
          company.company_name
        ) {
          throw new Error(
            "You do not have permission to view this application."
          );
        }

        if (cancelled) return;

        setInternship(internshipData);

        // ----------------------------------------------------
        // GET APPLICATION
        // ----------------------------------------------------

        const {
          data: applicationData,
          error: applicationError,
        } =
          await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .eq("internship_id", internshipId)
            .maybeSingle();

        if (applicationError) {
          throw applicationError;
        }

        if (!applicationData) {
          throw new Error(
            "This application could not be found."
          );
        }

        // ----------------------------------------------------
        // START WITH APPLICATION DATA
        // ----------------------------------------------------
        //
        // IMPORTANT:
        // The application already stores the applicant
        // information. Therefore the page does NOT depend
        // on the graduates table to finish loading.
        //

        let combined = {
          ...applicationData,
        };

        // ----------------------------------------------------
        // OPTIONAL GRADUATE PROFILE
        // ----------------------------------------------------

        if (applicationData.graduate_id) {
          try {
            const {
              data: graduateData,
              error: graduateError,
            } =
              await supabase
                .from("graduates")
                .select("*")
                .eq(
                  "id",
                  applicationData.graduate_id
                )
                .maybeSingle();

            if (
              !graduateError &&
              graduateData
            ) {
              combined = {
                ...combined,
                ...graduateData,

                // Preserve application values
                // when they exist.
                full_name:
                  applicationData.full_name ||
                  graduateData.full_name,

                email:
                  applicationData.email ||
                  graduateData.email,

                phone:
                  applicationData.phone ||
                  graduateData.phone,

                qualification:
                  applicationData.qualification ||
                  graduateData.qualification,

                field_of_study:
                  applicationData.field_of_study ||
                  graduateData.field_of_study,

                skills:
                  applicationData.skills ||
                  graduateData.skills,

                career_goals:
                  applicationData.career_goals ||
                  graduateData.career_goals,
              };
            }
          } catch (graduateError) {
            console.log(
              "Graduate profile could not be loaded. Using application data.",
              graduateError
            );
          }
        }

        // ----------------------------------------------------
        // AI MATCH
        // ----------------------------------------------------

        const match =
          calculateMatch(
            combined,
            internshipData
          );

        const finalApplication = {
          ...combined,

          matchScore:
            match.score,

          matchLabel:
            match.label,

          matchedSkills:
            match.matchedSkills,

          missingSkills:
            match.missingSkills,

          strengths:
            match.strengths,

          improvements:
            match.improvements,
        };

        if (cancelled) return;

        setApplication(
          finalApplication
        );
      } catch (error) {
        console.error(
          "Application details error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error?.message ||
              "Could not load this application."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [
    internshipId,
    applicationId,
    router,
  ]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(status) {
    if (!application?.id) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq(
          "id",
          application.id
        );

      if (error) {
        throw error;
      }

      setApplication(
        (current) => ({
          ...current,
          status,
        })
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
  // OPEN DOCUMENT
  // ==========================================================

  async function openDocument(
    url,
    label
  ) {
    if (!url) {
      alert(
        `This applicant has not uploaded a ${label}.`
      );
      return;
    }

    const newWindow =
      window.open(
        "",
        "_blank"
      );

    if (!newWindow) {
      alert(
        "Please allow pop-ups in your browser to review documents."
      );
      return;
    }

    try {
      const cleanPath =
        String(url)
          .replace(
            /^.*\/documents\//,
            ""
          )
          .replace(
            /^\/+/,
            ""
          );

      const {
        data,
        error,
      } =
        await supabase.storage
          .from("documents")
          .createSignedUrl(
            cleanPath,
            600
          );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          `Could not create a secure ${label} link.`
        );
      }

      newWindow.location.href =
        data.signedUrl;
    } catch (error) {
      console.error(
        `${label} review error:`,
        error
      );

      newWindow.close();

      alert(
        error?.message ||
          `Could not open the ${label}.`
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBox}>
          <div
            style={{
              fontSize: "38px",
              marginBottom: "15px",
            }}
          >
            ⏳
          </div>

          Loading application...
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={errorBox}>
          <div
            style={{
              fontSize: "50px",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              color: "#c62828",
              marginBottom: "10px",
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
  // SAFETY
  // ==========================================================

  if (
    !application ||
    !internship
  ) {
    return (
      <main style={pageStyle}>
        <div style={errorBox}>
          <div
            style={{
              fontSize: "50px",
            }}
          >
            ⚠️
          </div>

          <h1>
            Application unavailable
          </h1>

          <p
            style={{
              color: "#666",
            }}
          >
            The application could not be displayed.
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

  const score =
    application.matchScore || 0;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>

        {/* HEADER */}

        <div style={headerStyle}>
          <button
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={backButton}
          >
            ← Back to Applicants
          </button>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: "25px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  opacity: 0.85,
                  marginBottom: "8px",
                }}
              >
                APPLICATION REVIEW
              </div>

              <h1
                style={{
                  margin:
                    "0 0 8px",
                  fontSize: "32px",
                }}
              >
                {application.full_name ||
                  "Graduate Applicant"}
              </h1>

              <p
                style={{
                  margin: 0,
                  fontSize: "17px",
                  opacity: 0.9,
                }}
              >
                Applied for:{" "}
                <strong>
                  {internship.job_title}
                </strong>
              </p>
            </div>

            <div
              style={{
                background:
                  "rgba(255,255,255,0.16)",
                border:
                  "1px solid rgba(255,255,255,0.3)",
                borderRadius: "18px",
                padding:
                  "18px 25px",
                textAlign: "center",
                minWidth: "140px",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "800",
                }}
              >
                {score}%
              </div>

              <div
                style={{
                  fontWeight: "700",
                }}
              >
                {application.matchLabel}
                {" Match"}
              </div>
            </div>
          </div>
        </div>

        {/* STATUS */}

        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>
                Application Status
              </h2>

              <p
                style={sectionSubtitle}
              >
                Decide how you want to
                proceed with this applicant.
              </p>
            </div>

            <StatusBadge
              status={
                application.status ||
                "pending"
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              onClick={() =>
                updateStatus(
                  "shortlisted"
                )
              }
              style={statusButton(
                "#16803c"
              )}
            >
              ⭐ Shortlist
            </button>

            <button
              onClick={() =>
                updateStatus(
                  "rejected"
                )
              }
              style={statusButton(
                "#c62828"
              )}
            >
              ✕ Reject
            </button>

            <button
              onClick={() =>
                updateStatus(
                  "pending"
                )
              }
              style={statusButton(
                "#777"
              )}
            >
              ↺ Reset to Pending
            </button>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}

        <div style={sectionStyle}>
          <h2 style={sectionTitle}>
            👤 Applicant Information
          </h2>

          <div style={gridStyle}>
            <Info
              label="Full Name"
              value={
                application.full_name ||
                "Not provided"
              }
            />

            <Info
              label="Email"
              value={
                application.email ||
                "Not provided"
              }
            />

            <Info
              label="Phone"
              value={
                application.phone ||
                "Not provided"
              }
            />

            <Info
              label="Province"
              value={
                application.province ||
                "Not provided"
              }
            />

            <Info
              label="Institution"
              value={
                application.institution ||
                "Not provided"
              }
            />

            <Info
              label="Qualification"
              value={
                application.qualification ||
                "Not provided"
              }
            />

            <Info
              label="Field of Study"
              value={
                application.field_of_study ||
                "Not provided"
              }
            />

            <Info
              label="Application Date"
              value={formatDate(
                application.created_at
              )}
            />
          </div>
        </div>

        {/* SKILLS */}

        <div style={sectionStyle}>
          <h2 style={sectionTitle}>
            💼 Skills
          </h2>

          {getSkillsArray(
            application.skills
          ).length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {getSkillsArray(
                application.skills
              ).map(
                (skill, index) => (
                  <span
                    key={index}
                    style={skillBadge}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <p style={mutedText}>
              No skills provided.
            </p>
          )}
        </div>

        {/* CAREER GOALS */}

        <div style={sectionStyle}>
          <h2 style={sectionTitle}>
            🎯 Career Goals
          </h2>

          <div style={textBox}>
            {application.career_goals ||
              "No career goals provided."}
          </div>
        </div>

        {/* AI MATCH */}

        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>
                🤖 AI Match Analysis
              </h2>

              <p
                style={sectionSubtitle}
              >
                Compatibility with this
                specific internship.
              </p>
            </div>

            <div
              style={{
                fontSize: "32px",
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
          </div>

          <div style={gridStyle}>
            <div
              style={{
                ...analysisBox,
                background:
                  "#f4fbf6",
                borderColor:
                  "#ccebd7",
              }}
            >
              <strong
                style={{
                  color:
                    "#16803c",
                }}
              >
                Qualification
              </strong>

              <p>
                Required:{" "}
                <strong>
                  {internship.qualification ||
                    "Any"}
                </strong>
              </p>

              <p>
                Applicant:{" "}
                <strong>
                  {application.qualification ||
                    "Not provided"}
                </strong>
              </p>
            </div>

            <div
              style={{
                ...analysisBox,
                background:
                  "#f4f8ff",
                borderColor:
                  "#c9dcf5",
              }}
            >
              <strong
                style={{
                  color:
                    "#0057B8",
                }}
              >
                Field of Study
              </strong>

              <p>
                Required:{" "}
                <strong>
                  {internship.field_of_study ||
                    "Any"}
                </strong>
              </p>

              <p>
                Applicant:{" "}
                <strong>
                  {application.field_of_study ||
                    "Not provided"}
                </strong>
              </p>
            </div>
          </div>

          {application.strengths?.length >
            0 && (
            <div
              style={{
                background:
                  "#f4fbf6",
                border:
                  "1px solid #ccebd7",
                borderRadius:
                  "12px",
                padding: "18px",
                marginTop:
                  "20px",
              }}
            >
              <h3
                style={{
                  color:
                    "#16803c",
                  marginTop: 0,
                }}
              >
                ✅ Strengths
              </h3>

              <ul
                style={{
                  color: "#444",
                  lineHeight:
                    "1.8",
                  marginBottom: 0,
                }}
              >
                {application.strengths.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={index}
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {application.matchedSkills?.length >
            0 && (
            <div
              style={{
                marginTop:
                  "20px",
              }}
            >
              <h3
                style={{
                  color:
                    "#16803c",
                }}
              >
                ✓ Matched Skills
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap:
                    "wrap",
                  gap: "8px",
                }}
              >
                {application.matchedSkills.map(
                  (
                    skill,
                    index
                  ) => (
                    <span
                      key={index}
                      style={{
                        background:
                          "#e8f7ee",
                        color:
                          "#16803c",
                        border:
                          "1px solid #b7e4c7",
                        padding:
                          "7px 11px",
                        borderRadius:
                          "20px",
                        fontSize:
                          "13px",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✓ {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {application.missingSkills?.length >
            0 && (
            <div
              style={{
                background:
                  "#fffaf0",
                border:
                  "1px solid #f0dfb2",
                borderRadius:
                  "12px",
                padding: "18px",
                marginTop:
                  "20px",
              }}
            >
              <h3
                style={{
                  color:
                    "#9a6700",
                  marginTop: 0,
                }}
              >
                ⚠️ Skills to Improve
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap:
                    "wrap",
                  gap: "8px",
                }}
              >
                {application.missingSkills.map(
                  (
                    skill,
                    index
                  ) => (
                    <span
                      key={index}
                      style={{
                        background:
                          "#fff",
                        color:
                          "#7a5700",
                        border:
                          "1px solid #e1c878",
                        padding:
                          "7px 11px",
                        borderRadius:
                          "20px",
                        fontSize:
                          "13px",
                      }}
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {application.improvements?.length >
            0 && (
            <div
              style={{
                marginTop:
                  "20px",
              }}
            >
              <h3
                style={{
                  color:
                    "#9a6700",
                }}
              >
                💡 Considerations
              </h3>

              <ul
                style={{
                  color: "#555",
                  lineHeight:
                    "1.7",
                }}
              >
                {application.improvements.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={index}
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>

        {/* DOCUMENTS */}

        <div style={sectionStyle}>
          <h2 style={sectionTitle}>
            📄 Applicant Documents
          </h2>

          <p
            style={sectionSubtitle}
          >
            Documents are opened through secure
            temporary links.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <button
              onClick={() =>
                openDocument(
                  application.cv_url ||
                    application.cv ||
                    application.resume_url,
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
                  application.qualification_url ||
                    application.qualification_document_url ||
                    application.qualification_file_url,
                  "qualification document"
                )
              }
              style={documentButton}
            >
              🎓 Review Qualification
            </button>
          </div>
        </div>

        {/* INTERNSHIP */}

        <div style={sectionStyle}>
          <h2 style={sectionTitle}>
            💼 Internship Applied For
          </h2>

          <div style={gridStyle}>
            <Info
              label="Position"
              value={
                internship.job_title ||
                "—"
              }
            />

            <Info
              label="Company"
              value={
                internship.company_name ||
                "—"
              }
            />

            <Info
              label="Location"
              value={
                internship.location ||
                "—"
              }
            />

            <Info
              label="Province"
              value={
                internship.province ||
                "—"
              }
            />

            <Info
              label="Internship Type"
              value={
                internship.internship_type ||
                "—"
              }
            />

            <Info
              label="Stipend"
              value={
                internship.stipend ||
                "Not specified"
              }
            />
          </div>
        </div>

        {/* BOTTOM ACTIONS */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #0057B8, #0077d9)",
            color: "#fff",
            borderRadius:
              "18px",
            padding: "28px",
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Ready to make a decision?
          </h2>

          <p
            style={{
              opacity: 0.9,
              marginBottom:
                "22px",
            }}
          >
            Update the applicant's status or return
            to the applicant list.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              onClick={() =>
                updateStatus(
                  "shortlisted"
                )
              }
              style={bottomButton(
                "#16803c"
              )}
            >
              ⭐ Shortlist Applicant
            </button>

            <button
              onClick={() =>
                updateStatus(
                  "rejected"
                )
              }
              style={bottomButton(
                "#c62828"
              )}
            >
              ✕ Reject Applicant
            </button>

            <button
              onClick={() =>
                router.push(
                  `/company/internships/${internshipId}/applicants`
                )
              }
              style={bottomButton(
                "#fff",
                "#0057B8"
              )}
            >
              ← Back to Applicants
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// INFO
// ============================================================

function Info({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#f7f9fc",
        borderRadius:
          "12px",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom:
            "7px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#222",
          fontWeight:
            "600",
          lineHeight:
            "1.5",
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status ||
        "pending"
    ).toLowerCase();

  let background =
    "#f1f3f5";

  let color =
    "#666";

  let text =
    "Pending";

  if (
    normalized ===
    "shortlisted"
  ) {
    background =
      "#e8f7ee";

    color =
      "#16803c";

    text =
      "⭐ Shortlisted";
  }

  if (
    normalized ===
    "rejected"
  ) {
    background =
      "#fff0f0";

    color =
      "#c62828";

    text =
      "✕ Rejected";
  }

  return (
    <span
      style={{
        display:
          "inline-block",
        background,
        color,
        padding:
          "9px 14px",
        borderRadius:
          "20px",
        fontWeight:
          "700",
      }}
    >
      {text}
    </span>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value
) {
  if (!value) {
    return "Not provided";
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  } catch {
    return String(value);
  }
}

// ============================================================
// STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "#f4f8fc",
  padding:
    "30px 20px 60px",
};

const containerStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto",
};

const loadingBox = {
  background:
    "#fff",
  borderRadius:
    "18px",
  padding:
    "50px",
  textAlign:
    "center",
  color:
    "#0057B8",
  fontSize:
    "22px",
  fontWeight:
    "700",
  boxShadow:
    "0 8px 30px rgba(0,0,0,0.06)",
};

const errorBox = {
  maxWidth:
    "800px",
  margin:
    "30px auto",
  background:
    "#fff",
  borderRadius:
    "18px",
  padding:
    "40px",
  textAlign:
    "center",
  boxShadow:
    "0 8px 30px rgba(0,0,0,0.08)",
};

const headerStyle = {
  background:
    "linear-gradient(135deg, #0057B8, #0077d9)",
  color:
    "#fff",
  borderRadius:
    "20px",
  padding:
    "30px",
  marginBottom:
    "22px",
  boxShadow:
    "0 10px 30px rgba(0,87,184,0.18)",
};

const backButton = {
  background:
    "rgba(255,255,255,0.15)",
  color:
    "#fff",
  border:
    "1px solid rgba(255,255,255,0.35)",
  borderRadius:
    "9px",
  padding:
    "9px 14px",
  cursor:
    "pointer",
  marginBottom:
    "22px",
};

const sectionStyle = {
  background:
    "#fff",
  borderRadius:
    "18px",
  padding:
    "25px",
  marginBottom:
    "20px",
  boxShadow:
    "0 6px 24px rgba(0,0,0,0.06)",
};

const sectionHeader = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "15px",
  flexWrap:
    "wrap",
  marginBottom:
    "20px",
};

const sectionTitle = {
  color:
    "#0057B8",
  marginTop:
    0,
  marginBottom:
    "7px",
};

const sectionSubtitle = {
  color:
    "#666",
  marginTop:
    0,
  lineHeight:
    "1.5",
};

const gridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap:
    "15px",
};

const analysisBox = {
  border:
    "1px solid",
  borderRadius:
    "12px",
  padding:
    "18px",
};

const skillBadge = {
  background:
    "#eef5ff",
  color:
    "#0057B8",
  border:
    "1px solid #c9dcf5",
  padding:
    "8px 13px",
  borderRadius:
    "20px",
  fontSize:
    "14px",
  fontWeight:
    "600",
};

const textBox = {
  background:
    "#f7f9fc",
  borderRadius:
    "12px",
  padding:
    "18px",
  color:
    "#444",
  lineHeight:
    "1.8",
  whiteSpace:
    "pre-wrap",
};

const mutedText = {
  color:
    "#777",
};

const primaryButton = {
  background:
    "#0057B8",
  color:
    "#fff",
  border:
    "none",
  borderRadius:
    "10px",
  padding:
    "12px 18px",
  fontWeight:
    "700",
  cursor:
    "pointer",
};

const documentButton = {
  background:
    "#0057B8",
  color:
    "#fff",
  border:
    "none",
  borderRadius:
    "10px",
  padding:
    "13px 18px",
  fontWeight:
    "700",
  cursor:
    "pointer",
};

function statusButton(
  background
) {
  return {
    background,
    color:
      "#fff",
    border:
      "none",
    borderRadius:
      "9px",
    padding:
      "11px 16px",
    fontWeight:
      "700",
    cursor:
      "pointer",
  };
}

function bottomButton(
  background,
  color = "#fff"
) {
  return {
    background,
    color,
    border:
      background ===
      "#fff"
        ? "none"
        : "1px solid rgba(255,255,255,0.2)",
    borderRadius:
      "10px",
    padding:
      "12px 17px",
    fontWeight:
      "700",
    cursor:
      "pointer",
  };
}