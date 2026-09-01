"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ===========================================================
// QUALIFICATION LEVEL
// ===========================================================

function getQualificationLevel(qualification = "") {
  const text = qualification.toLowerCase();

  if (
    text.includes("phd") ||
    text.includes("doctorate")
  ) {
    return 6;
  }

  if (
    text.includes("masters") ||
    text.includes("master") ||
    text.includes("postgraduate") ||
    text.includes("postgrad")
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
    text.includes("national diploma") ||
    text.includes("diploma")
  ) {
    return 3;
  }

  if (
    text.includes("certificate")
  ) {
    return 2;
  }

  if (
    text.includes("grade 12") ||
    text.includes("matric")
  ) {
    return 1;
  }

  return 0;
}

// ===========================================================
// FORMAT SKILLS
// ===========================================================

function splitSkills(skills = "") {
  if (!skills) return [];

  return skills
    .split(/[,;|]/)
    .map((skill) =>
      skill.trim().toLowerCase()
    )
    .filter(Boolean);
}

// ===========================================================
// FIELD MATCH
// ===========================================================

function fieldMatches(
  applicantField = "",
  requiredField = ""
) {
  const applicant =
    applicantField
      .toLowerCase()
      .trim();

  const required =
    requiredField
      .toLowerCase()
      .trim();

  if (!required) {
    return true;
  }

  if (!applicant) {
    return false;
  }

  return (
    applicant === required ||
    applicant.includes(required) ||
    required.includes(applicant)
  );
}

// ===========================================================
// SKILL MATCH
// ===========================================================

function skillMatches(
  applicantSkill,
  requiredSkill
) {
  return (
    applicantSkill.includes(
      requiredSkill
    ) ||
    requiredSkill.includes(
      applicantSkill
    )
  );
}

// ===========================================================
// AI MATCH CALCULATION
//
// Qualification = 35
// Field          = 35
// Skills         = 30
// ===========================================================

function calculateMatch(
  application,
  internship
) {
  let score = 0;

  const reasons = [];
  const strengths = [];
  const improvements = [];

  // =========================================================
  // QUALIFICATION
  // =========================================================

  const applicantQualification =
    application.qualification || "";

  const requiredQualification =
    internship.qualification || "";

  const applicantLevel =
    getQualificationLevel(
      applicantQualification
    );

  const requiredLevel =
    getQualificationLevel(
      requiredQualification
    );

  if (!requiredQualification) {
    score += 35;

    strengths.push(
      "No specific qualification requirement was set."
    );
  } else if (
    applicantLevel > 0 &&
    requiredLevel > 0
  ) {
    if (
      applicantLevel >=
      requiredLevel
    ) {
      score += 35;

      strengths.push(
        `Qualification meets the requirement (${applicantQualification}).`
      );
    } else {
      improvements.push(
        `Qualification is below the required level. Required: ${requiredQualification}.`
      );

      reasons.push(
        "Qualification requirement was not fully met."
      );
    }
  } else {
    const applicantText =
      applicantQualification
        .toLowerCase();

    const requiredText =
      requiredQualification
        .toLowerCase();

    if (
      applicantText.includes(
        requiredText
      ) ||
      requiredText.includes(
        applicantText
      )
    ) {
      score += 35;

      strengths.push(
        "Qualification closely matches the internship requirement."
      );
    } else {
      improvements.push(
        `Qualification does not closely match the required qualification (${requiredQualification}).`
      );

      reasons.push(
        "Qualification does not closely match the requirement."
      );
    }
  }

  // =========================================================
  // FIELD OF STUDY
  // =========================================================

  const applicantField =
    application.field_of_study || "";

  const requiredField =
    internship.field_of_study || "";

  if (!requiredField) {
    score += 35;

    strengths.push(
      "No specific field of study was required."
    );
  } else if (
    fieldMatches(
      applicantField,
      requiredField
    )
  ) {
    score += 35;

    strengths.push(
      `Field of study matches the internship (${applicantField}).`
    );
  } else {
    improvements.push(
      `Field of study does not closely match the required field (${requiredField}).`
    );

    reasons.push(
      "Field of study does not closely match the internship."
    );
  }

  // =========================================================
  // SKILLS
  // =========================================================

  const applicantSkills =
    splitSkills(
      application.skills
    );

  const requiredSkills =
    splitSkills(
      internship.skills
    );

  const matchedSkills = [];
  const missingSkills = [];

  if (
    requiredSkills.length === 0
  ) {
    score += 30;

    strengths.push(
      "No specific skills were required."
    );
  } else if (
    applicantSkills.length === 0
  ) {
    improvements.push(
      "No skills were provided on the application."
    );

    reasons.push(
      "The applicant did not provide skills for comparison."
    );
  } else {
    requiredSkills.forEach(
      (requiredSkill) => {
        const matched =
          applicantSkills.some(
            (
              applicantSkill
            ) =>
              skillMatches(
                applicantSkill,
                requiredSkill
              )
          );

        if (matched) {
          matchedSkills.push(
            requiredSkill
          );
        } else {
          missingSkills.push(
            requiredSkill
          );
        }
      }
    );

    const skillScore =
      (matchedSkills.length /
        requiredSkills.length) *
      30;

    score += skillScore;

    if (
      matchedSkills.length > 0
    ) {
      strengths.push(
        `${matchedSkills.length} of ${requiredSkills.length} required skill${
          requiredSkills.length === 1
            ? ""
            : "s"
        } matched.`
      );
    }

    if (
      missingSkills.length > 0
    ) {
      improvements.push(
        `Missing or unmatched skills: ${missingSkills.join(", ")}.`
      );

      reasons.push(
        `${missingSkills.length} required skill${
          missingSkills.length === 1
            ? ""
            : "s"
        } did not match.`
      );
    }
  }

  // =========================================================
  // FINAL SCORE
  // =========================================================

  score = Math.round(score);

  // =========================================================
  // GENERAL AI EXPLANATION
  // =========================================================

  let summary = "";

  if (score >= 85) {
    summary =
      "Excellent overall match. The applicant meets most or all of the key internship requirements.";
  } else if (score >= 70) {
    summary =
      "Strong candidate with a good overall match, although some requirements may be missing.";
  } else if (score >= 40) {
    summary =
      "The applicant has some relevant qualifications or skills, but important requirements do not fully match.";
  } else {
    summary =
      "The low score is mainly caused by significant differences between the internship requirements and the applicant's qualification, field of study, or skills.";
  }

  return {
    score,
    reasons,
    strengths,
    improvements,
    matchedSkills,
    missingSkills,
    summary,
  };
}

// ===========================================================
// MATCH LABEL
// ===========================================================

function getMatchLabel(score) {
  if (score >= 85) {
    return "Strong Match";
  }

  if (score >= 70) {
    return "Good Match";
  }

  if (score >= 40) {
    return "Possible Match";
  }

  return "Weak Match";
}

// ===========================================================
// MATCH COLOUR
// ===========================================================

function getMatchColor(score) {
  if (score >= 85) {
    return "#16a34a";
  }

  if (score >= 70) {
    return "#2563eb";
  }

  if (score >= 40) {
    return "#f59e0b";
  }

  return "#dc2626";
}

// ===========================================================
// MAIN COMPONENT
// ===========================================================

export default function CompanyDashboard() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [company, setCompany] =
    useState(null);

  const [internships, setInternships] =
    useState([]);

  const [applications, setApplications] =
    useState([]);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      // =====================================================
      // FIND COMPANY
      // =====================================================

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        setError(
          "No company profile was found for this account."
        );

        return;
      }

      setCompany(
        companyData
      );

      // =====================================================
      // LOAD INTERNSHIPS
      // =====================================================

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select("*")
        .eq(
          "company_name",
          companyData.company_name
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

      if (
        internshipError
      ) {
        throw internshipError;
      }

      const loadedInternships =
        internshipData ||
        [];

      setInternships(
        loadedInternships
      );

      const internshipIds =
        loadedInternships.map(
          (internship) =>
            internship.id
        );

      // =====================================================
      // LOAD APPLICATIONS
      // =====================================================

      if (
        internshipIds.length ===
        0
      ) {
        setApplications(
          []
        );

        return;
      }

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select("*")
        .in(
          "internship_id",
          internshipIds
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

      if (
        applicationError
      ) {
        throw applicationError;
      }

      const loadedApplications =
        applicationData ||
        [];

      // =====================================================
      // ADD INTERNSHIP + AI ANALYSIS
      // =====================================================

      const analysedApplications =
        loadedApplications.map(
          (application) => {
            const internship =
              loadedInternships.find(
                (item) =>
                  item.id ===
                  application.internship_id
              );

            const analysis =
              internship
                ? calculateMatch(
                    application,
                    internship
                  )
                : {
                    score: 0,
                    reasons: [
                      "The internship could not be found."
                    ],
                    strengths: [],
                    improvements: [],
                    matchedSkills: [],
                    missingSkills: [],
                    summary:
                      "No internship data is available for comparison.",
                  };

            return {
              ...application,
              internship,
              analysis,
            };
          }
        );

      // =====================================================
      // SORT BY AI SCORE
      // =====================================================

      analysedApplications.sort(
        (a, b) =>
          b.analysis.score -
          a.analysis.score
      );

      setApplications(
        analysedApplications
      );

    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      setError(
        err.message ||
          "Could not load the company dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  async function updateApplicationStatus(
    applicationId,
    status
  ) {
    try {
      setUpdatingId(
        applicationId
      );

      setError("");
      setMessage("");

      const {
        error: updateError,
      } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq(
          "id",
          applicationId
        );

      if (
        updateError
      ) {
        throw updateError;
      }

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    status,
                  }
                : application
          )
      );

      setMessage(
        `Application marked as ${status}.`
      );

    } catch (err) {
      setError(
        err.message ||
          "Could not update the application."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  // =========================================================
  // REVIEW CV
  // =========================================================

  async function reviewCV(
    application
  ) {
    try {
      setError("");

      let cvPath =
        application.cv_url ||
        application.cv ||
        application.resume_url ||
        application.document_url ||
        null;

      // =====================================================
      // GET CV FROM GRADUATE PROFILE
      // =====================================================

      if (
        !cvPath &&
        application.graduate_id
      ) {
        const {
          data: graduate,
          error:
            graduateError,
        } = await supabase
          .from(
            "graduates"
          )
          .select(
            "cv_url"
          )
          .eq(
            "id",
            application.graduate_id
          )
          .maybeSingle();

        if (
          graduateError
        ) {
          console.error(
            graduateError
          );
        }

        if (
          graduate?.cv_url
        ) {
          cvPath =
            graduate.cv_url;
        }
      }

      if (
        !cvPath
      ) {
        alert(
          "No CV uploaded for this applicant."
        );

        return;
      }

      if (
        cvPath.startsWith(
          "http"
        )
      ) {
        window.open(
          cvPath,
          "_blank"
        );

        return;
      }

      const {
        data:
          signedData,
        error:
          signedError,
      } = await supabase.storage
        .from(
          "documents"
        )
        .createSignedUrl(
          cvPath,
          600
        );

      if (
        signedError
      ) {
        throw signedError;
      }

      window.open(
        signedData.signedUrl,
        "_blank"
      );

    } catch (err) {
      setError(
        err.message ||
          "Could not open the CV."
      );
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          background:
            "#f5f9ff",
        }}
      >
        <div
          style={{
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize:
                "45px",
            }}
          >
            🏢
          </div>

          <h2
            style={{
              color:
                "#0057B8",
            }}
          >
            Loading Dashboard...
          </h2>

          <p>
            Preparing your recruitment insights
            🤖
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // STATS
  // =========================================================

  const shortlisted =
    applications.filter(
      (application) =>
        application.status ===
        "Shortlisted"
    ).length;

  const underReview =
    applications.filter(
      (application) =>
        application.status ===
        "Review"
    ).length;

  const strongMatches =
    applications.filter(
      (application) =>
        application.analysis
          .score >= 85
    ).length;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(180deg,#eef6ff,#f8fafc)",
        padding:
          "25px 15px 70px",
      }}
    >
      <div
        style={{
          maxWidth:
            "1150px",
          margin:
            "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#003f88,#0077e6)",
            color:
              "#ffffff",
            padding:
              "35px",
            borderRadius:
              "24px",
            boxShadow:
              "0 15px 40px rgba(0,87,184,.20)",
            marginBottom:
              "25px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              gap:
                "20px",
              flexWrap:
                "wrap",
              alignItems:
                "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "14px",
                  opacity:
                    0.8,
                  marginBottom:
                    "8px",
                }}
              >
                GRADLINK SA • RECRUITMENT PORTAL
              </div>

              <h1
                style={{
                  margin:
                    "0 0 10px",
                  fontSize:
                    "32px",
                }}
              >
                🏢 Company Dashboard
              </h1>

              <p
                style={{
                  margin:
                    0,
                  opacity:
                    0.9,
                  fontSize:
                    "17px",
                }}
              >
                Welcome back
                {company?.company_name
                  ? `, ${company.company_name}`
                  : ""}.
                Manage your internships and discover your best candidates.
              </p>
            </div>

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
                  router.push(
                    "/company"
                  )
                }
                style={
                  headerButtonStyle
                }
              >
                ⚙️ Company Profile
              </button>

              <button
  onClick={() =>
    router.push("/internships")
  }
  style={headerButtonStyle}
>
  ➕ Post Internship
</button>
            </div>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={successStyle}
          >
            ✅ {message}
          </div>
        )}

        {error && (
          <div
            style={errorStyle}
          >
            ❌ {error}
          </div>
        )}

        {/* STATS */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(210px,1fr))",
            gap:
              "18px",
            marginBottom:
              "28px",
          }}
        >
          <StatCard
            icon="💼"
            title="Internships"
            value={
              internships.length
            }
            subtitle="Currently posted"
          />

          <StatCard
            icon="👨‍🎓"
            title="Applicants"
            value={
              applications.length
            }
            subtitle="Total applications"
          />

          <StatCard
            icon="🏆"
            title="Strong Matches"
            value={
              strongMatches
            }
            subtitle="AI score 85%+"
          />

          <StatCard
            icon="⭐"
            title="Shortlisted"
            value={
              shortlisted
            }
            subtitle="Top candidates"
          />
        </div>

        {/* INTERNSHIPS */}

        <section
          style={
            sectionStyle
          }
        >
          <h2
            style={
              sectionTitleStyle
            }
          >
            💼 Your Internships
          </h2>

          {internships.length ===
          0 ? (
            <EmptyState
  icon="💼"
  text="You haven't posted an internship yet."
  buttonText="➕ Post Internship"
  onClick={() =>
    router.push("/internships")
  }
/>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(260px,1fr))",
                gap:
                  "18px",
              }}
            >
              {internships.map(
                (
                  internship
                ) => {
                  const applicantCount =
                    applications.filter(
                      (
                        application
                      ) =>
                        application.internship_id ===
                        internship.id
                    ).length;

                  return (
                    <div
                      key={
                        internship.id
                      }
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          "18px",
                        padding:
                          "20px",
                        background:
                          "#fbfdff",
                      }}
                    >
                      <h3
                        style={{
                          marginTop:
                            0,
                          color:
                            "#0f172a",
                        }}
                      >
                        {
                          internship.job_title
                        }
                      </h3>

                      <p>
                        📍{" "}
                        {
                          internship.location ||
                          "Location not specified"
                        }
                      </p>

                      <p>
                        🎓{" "}
                        {
                          internship.qualification ||
                          "Qualification not specified"
                        }
                      </p>

                      <div
                        style={{
                          marginTop:
                            "15px",
                          padding:
                            "10px 14px",
                          background:
                            "#eaf3ff",
                          color:
                            "#0057B8",
                          borderRadius:
                            "10px",
                          fontWeight:
                            "bold",
                        }}
                      >
                        👨‍🎓{" "}
                        {
                          applicantCount
                        } Applicant
                        {applicantCount ===
                        1
                          ? ""
                          : "s"}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* APPLICANTS */}

        <section
          style={
            sectionStyle
          }
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              flexWrap:
                "wrap",
              gap:
                "10px",
              marginBottom:
                "10px",
            }}
          >
            <div>
              <h2
                style={{
                  ...sectionTitleStyle,
                  marginBottom:
                    "5px",
                }}
              >
                🤖 AI Ranked Applicants
              </h2>

              <p
                style={{
                  color:
                    "#64748b",
                  marginTop:
                    0,
                }}
              >
                Applicants are ranked according to qualification, field of study and skills.
              </p>
            </div>

            <div
              style={{
                background:
                  "#eff6ff",
                color:
                  "#0057B8",
                padding:
                  "10px 15px",
                borderRadius:
                  "20px",
                fontWeight:
                  "bold",
              }}
            >
              {applications.length} Candidates
            </div>
          </div>

          {applications.length ===
          0 ? (
            <EmptyState
              icon="👨‍🎓"
              text="No applications have been received yet."
            />
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap:
                  "22px",
              }}
            >
              {applications.map(
                (
                  application,
                  index
                ) => {
                  const analysis =
                    application.analysis;

                  const score =
                    analysis.score;

                  const scoreColor =
                    getMatchColor(
                      score
                    );

                  return (
                    <div
                      key={
                        application.id
                      }
                      style={{
                        border:
                          "1px solid #e2e8f0",
                        borderRadius:
                          "22px",
                        overflow:
                          "hidden",
                        background:
                          "#ffffff",
                        boxShadow:
                          "0 8px 25px rgba(15,23,42,.05)",
                      }}
                    >
                      {/* TOP */}

                      <div
                        style={{
                          padding:
                            "22px",
                          background:
                            "linear-gradient(90deg,#ffffff,#f8fbff)",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap:
                              "20px",
                            flexWrap:
                              "wrap",
                            alignItems:
                              "center",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "15px",
                              alignItems:
                                "center",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "52px",
                                height:
                                  "52px",
                                borderRadius:
                                  "50%",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  "#eaf3ff",
                                color:
                                  "#0057B8",
                                fontWeight:
                                  "bold",
                                fontSize:
                                  "20px",
                              }}
                            >
                              #
                              {
                                index +
                                1
                              }
                            </div>

                            <div>
                              <h3
                                style={{
                                  margin:
                                    "0 0 6px",
                                  fontSize:
                                    "21px",
                                }}
                              >
                                {
                                  application.full_name ||
                                  "Graduate"
                                }
                              </h3>

                              <div
                                style={{
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "14px",
                                }}
                              >
                                📧{" "}
                                {
                                  application.email ||
                                  "No email"
                                }
                              </div>

                              <div
                                style={{
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "14px",
                                  marginTop:
                                    "3px",
                                }}
                              >
                                💼 Applying for:{" "}
                                {
                                  application
                                    .internship
                                    ?.job_title ||
                                  "Internship"
                                }
                              </div>
                            </div>
                          </div>

                          {/* SCORE */}

                          <div
                            style={{
                              minWidth:
                                "180px",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                marginBottom:
                                  "7px",
                              }}
                            >
                              <strong>
                                AI Match Score
                              </strong>

                              <strong
                                style={{
                                  color:
                                    scoreColor,
                                }}
                              >
                                {
                                  score
                                }
                                %
                              </strong>
                            </div>

                            <div
                              style={{
                                height:
                                  "12px",
                                borderRadius:
                                  "20px",
                                background:
                                  "#e5e7eb",
                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    `${score}%`,
                                  height:
                                    "100%",
                                  background:
                                    scoreColor,
                                  borderRadius:
                                    "20px",
                                  transition:
                                    "width .5s ease",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "8px",
                                color:
                                  scoreColor,
                                fontWeight:
                                  "bold",
                                textAlign:
                                  "right",
                              }}
                            >
                              🤖{" "}
                              {
                                getMatchLabel(
                                  score
                                )
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BODY */}

                      <div
                        style={{
                          padding:
                            "22px",
                        }}
                      >
                        {/* APPLICANT INFO */}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit,minmax(220px,1fr))",
                            gap:
                              "12px",
                            marginBottom:
                              "20px",
                          }}
                        >
                          <InfoCard
                            icon="🎓"
                            label="Qualification"
                            value={
                              application.qualification
                            }
                          />

                          <InfoCard
                            icon="📚"
                            label="Field of Study"
                            value={
                              application.field_of_study
                            }
                          />

                          <InfoCard
                            icon="🛠"
                            label="Skills"
                            value={
                              application.skills
                            }
                          />

                          <InfoCard
                            icon="📌"
                            label="Application Status"
                            value={
                              application.status ||
                              "Pending"
                            }
                          />
                        </div>

                        {/* AI SUMMARY */}

                        <div
                          style={{
                            background:
                              "#f8fafc",
                            border:
                              "1px solid #e2e8f0",
                            padding:
                              "18px",
                            borderRadius:
                              "15px",
                            marginBottom:
                              "18px",
                          }}
                        >
                          <strong
                            style={{
                              color:
                                "#0057B8",
                              fontSize:
                                "16px",
                            }}
                          >
                            🤖 AI Match Analysis
                          </strong>

                          <p
                            style={{
                              marginBottom:
                                0,
                              lineHeight:
                                "1.6",
                              color:
                                "#475569",
                            }}
                          >
                            {
                              analysis.summary
                            }
                          </p>
                        </div>

                        {/* STRENGTHS */}

                        {analysis.strengths
                          .length >
                          0 && (
                          <AnalysisBox
                            title="✅ What Matches Well"
                            items={
                              analysis.strengths
                            }
                            type="success"
                          />
                        )}

                        {/* LOW SCORE REASONS */}

                        {analysis.improvements
                          .length >
                          0 && (
                          <AnalysisBox
                            title="⚠️ Why The Score Is Lower"
                            items={
                              analysis.improvements
                            }
                            type="warning"
                          />
                        )}

                        {/* SKILLS */}

                        {(analysis
                          .matchedSkills
                          .length >
                          0 ||
                          analysis
                            .missingSkills
                            .length >
                            0) && (
                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit,minmax(220px,1fr))",
                              gap:
                                "15px",
                              marginTop:
                                "15px",
                            }}
                          >
                            <SkillList
                              title="✅ Matched Skills"
                              skills={
                                analysis.matchedSkills
                              }
                              emptyText="No skills matched."
                            />

                            <SkillList
                              title="❌ Missing Skills"
                              skills={
                                analysis.missingSkills
                              }
                              emptyText="No major missing skills."
                            />
                          </div>
                        )}

                        {/* ACTIONS */}

                        <div
                          style={{
                            display:
                              "flex",
                            flexWrap:
                              "wrap",
                            gap:
                              "10px",
                            marginTop:
                              "22px",
                            paddingTop:
                              "20px",
                            borderTop:
                              "1px solid #e5e7eb",
                          }}
                        >
                          <button
                            onClick={() =>
                              reviewCV(
                                application
                              )
                            }
                            style={
                              secondaryButtonStyle
                            }
                          >
                            📄 Review CV
                          </button>

                          <button
                            disabled={
                              updatingId ===
                              application.id
                            }
                            onClick={() =>
                              updateApplicationStatus(
                                application.id,
                                "Review"
                              )
                            }
                            style={
                              reviewButtonStyle
                            }
                          >
                            🔎 Review
                          </button>

                          <button
                            disabled={
                              updatingId ===
                              application.id
                            }
                            onClick={() =>
                              updateApplicationStatus(
                                application.id,
                                "Shortlisted"
                              )
                            }
                            style={
                              shortlistButtonStyle
                            }
                          >
                            ⭐ Shortlist
                          </button>

                          <button
                            disabled={
                              updatingId ===
                              application.id
                            }
                            onClick={() =>
                              updateApplicationStatus(
                                application.id,
                                "Rejected"
                              )
                            }
                            style={
                              rejectButtonStyle
                            }
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ===========================================================
// STAT CARD
// ===========================================================

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        borderRadius:
          "18px",
        padding:
          "22px",
        border:
          "1px solid #e5e7eb",
        boxShadow:
          "0 8px 22px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          fontSize:
            "25px",
          marginBottom:
            "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color:
            "#64748b",
          fontWeight:
            "600",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color:
            "#0057B8",
          fontSize:
            "32px",
          fontWeight:
            "bold",
          margin:
            "5px 0",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color:
            "#94a3b8",
          fontSize:
            "13px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

// ===========================================================
// INFO CARD
// ===========================================================

function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#f8fafc",
        border:
          "1px solid #e5e7eb",
        borderRadius:
          "12px",
        padding:
          "14px",
      }}
    >
      <div
        style={{
          color:
            "#64748b",
          fontSize:
            "13px",
          marginBottom:
            "6px",
        }}
      >
        {icon} {label}
      </div>

      <strong
        style={{
          color:
            "#1e293b",
        }}
      >
        {value ||
          "Not provided"}
      </strong>
    </div>
  );
}

// ===========================================================
// ANALYSIS BOX
// ===========================================================

function AnalysisBox({
  title,
  items,
  type,
}) {
  const background =
    type === "success"
      ? "#f0fdf4"
      : "#fffbeb";

  const border =
    type === "success"
      ? "#bbf7d0"
      : "#fde68a";

  return (
    <div
      style={{
        background,
        border:
          `1px solid ${border}`,
        borderRadius:
          "14px",
        padding:
          "16px",
        marginTop:
          "15px",
      }}
    >
      <strong>
        {title}
      </strong>

      <ul
        style={{
          marginBottom:
            0,
          paddingLeft:
            "20px",
          lineHeight:
            "1.8",
        }}
      >
        {items.map(
          (
            item,
            index
          ) => (
            <li
              key={
                index
              }
            >
              {item}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

// ===========================================================
// SKILL LIST
// ===========================================================

function SkillList({
  title,
  skills,
  emptyText,
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e5e7eb",
        borderRadius:
          "14px",
        padding:
          "16px",
        background:
          "#ffffff",
      }}
    >
      <strong>
        {title}
      </strong>

      {skills.length ===
      0 ? (
        <p
          style={{
            color:
              "#64748b",
            marginBottom:
              0,
          }}
        >
          {emptyText}
        </p>
      ) : (
        <div
          style={{
            display:
              "flex",
            flexWrap:
              "wrap",
            gap:
              "8px",
            marginTop:
              "12px",
          }}
        >
          {skills.map(
            (
              skill
            ) => (
              <span
                key={
                  skill
                }
                style={{
                  background:
                    "#f1f5f9",
                  padding:
                    "7px 10px",
                  borderRadius:
                    "20px",
                  fontSize:
                    "13px",
                  fontWeight:
                    "600",
                }}
              >
                {skill}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================
// EMPTY STATE
// ===========================================================

function EmptyState({
  icon,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div
      style={{
        textAlign:
          "center",
        padding:
          "40px 20px",
        color:
          "#64748b",
      }}
    >
      <div
        style={{
          fontSize:
            "45px",
          marginBottom:
            "10px",
        }}
      >
        {icon}
      </div>

      <p>
        {text}
      </p>

      {buttonText && (
        <button
          onClick={
            onClick
          }
          style={
            primaryButtonStyle
          }
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const sectionStyle = {
  background:
    "#ffffff",
  borderRadius:
    "22px",
  padding:
    "25px",
  marginBottom:
    "25px",
  boxShadow:
    "0 10px 30px rgba(15,23,42,.06)",
  border:
    "1px solid #e8eef5",
};

const sectionTitleStyle = {
  marginTop:
    0,
  color:
    "#0f172a",
  fontSize:
    "24px",
};

const successStyle = {
  background:
    "#ecfdf5",
  color:
    "#047857",
  border:
    "1px solid #a7f3d0",
  padding:
    "15px",
  borderRadius:
    "12px",
  marginBottom:
    "20px",
  fontWeight:
    "bold",
};

const errorStyle = {
  background:
    "#fef2f2",
  color:
    "#b91c1c",
  border:
    "1px solid #fecaca",
  padding:
    "15px",
  borderRadius:
    "12px",
  marginBottom:
    "20px",
  fontWeight:
    "bold",
};

const primaryButtonStyle = {
  background:
    "#0057B8",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 17px",
  borderRadius:
    "9px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const headerButtonStyle = {
  background:
    "#ffffff",
  color:
    "#0057B8",
  border:
    "none",
  padding:
    "12px 16px",
  borderRadius:
    "10px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const secondaryButtonStyle = {
  background:
    "#ffffff",
  color:
    "#0057B8",
  border:
    "2px solid #0057B8",
  padding:
    "10px 15px",
  borderRadius:
    "9px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const reviewButtonStyle = {
  background:
    "#2563eb",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "9px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const shortlistButtonStyle = {
  background:
    "#16a34a",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "9px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const rejectButtonStyle = {
  background:
    "#dc2626",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "9px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};