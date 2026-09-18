"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// QUALIFICATION LEVEL
// ============================================================

function getQualificationLevel(qualification) {
  const value = (qualification || "").toLowerCase().trim();

  if (
    value.includes("grade 12") ||
    value.includes("matric")
  ) {
    return 1;
  }

  if (value.includes("certificate")) {
    return 2;
  }

  if (
    value.includes("diploma") ||
    value.includes("national diploma")
  ) {
    return 3;
  }

  if (
    value.includes("degree") ||
    value.includes("bachelor")
  ) {
    return 4;
  }

  if (
    value.includes("honours") ||
    value.includes("honors")
  ) {
    return 5;
  }

  if (
    value.includes("masters") ||
    value.includes("master") ||
    value.includes("postgraduate") ||
    value.includes("phd") ||
    value.includes("doctorate")
  ) {
    return 6;
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
  const applicant = (applicantQualification || "")
    .toLowerCase()
    .trim();

  const required = (requiredQualification || "")
    .toLowerCase()
    .trim();

  if (!applicant || !required) {
    return false;
  }

  const applicantLevel =
    getQualificationLevel(applicant);

  const requiredLevel =
    getQualificationLevel(required);

  // Higher qualifications satisfy lower requirements.
  if (applicantLevel > 0 && requiredLevel > 0) {
    return applicantLevel >= requiredLevel;
  }

  return (
    applicant === required ||
    applicant.includes(required) ||
    required.includes(applicant)
  );
}

// ============================================================
// AI MATCHING
// ============================================================

function calculateMatch(application, internship) {
  let score = 0;
  const reasons = [];

  const applicantField = (
    application.field_of_study || ""
  )
    .toLowerCase()
    .trim();

  const requiredField = (
    internship.field_of_study || ""
  )
    .toLowerCase()
    .trim();

  const applicantSkills = (
    application.skills || ""
  )
    .toLowerCase()
    .split(/[,;]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const requiredSkills = (
    internship.skills || ""
  )
    .toLowerCase()
    .split(/[,;]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  // ----------------------------------------------------------
  // QUALIFICATION = 35 POINTS
  // ----------------------------------------------------------

  const qualificationMatch = qualificationMatches(
    application.qualification,
    internship.qualification
  );

  if (
    qualificationMatch &&
    application.qualification &&
    internship.qualification
  ) {
    score += 35;

    reasons.push(
      `Qualification requirement met (${application.qualification} vs ${internship.qualification})`
    );
  } else if (
    application.qualification &&
    internship.qualification
  ) {
    reasons.push(
      `Qualification requirement not met (${application.qualification} vs ${internship.qualification})`
    );
  }

  // ----------------------------------------------------------
  // FIELD OF STUDY = 35 POINTS
  // ----------------------------------------------------------

  const fieldMatch =
    applicantField &&
    requiredField &&
    (
      applicantField === requiredField ||
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    );

  if (fieldMatch) {
    score += 35;

    reasons.push(
      `Field of study matches (${application.field_of_study})`
    );
  } else if (
    application.field_of_study &&
    internship.field_of_study
  ) {
    reasons.push(
      `Field of study does not match (${application.field_of_study} vs ${internship.field_of_study})`
    );
  }

  // ----------------------------------------------------------
  // SKILLS = 30 POINTS
  // ----------------------------------------------------------

  const matchingSkills = [];

  if (
    requiredSkills.length > 0 &&
    applicantSkills.length > 0
  ) {
    requiredSkills.forEach((requiredSkill) => {
      const matchedSkill = applicantSkills.find(
        (applicantSkill) =>
          applicantSkill.includes(requiredSkill) ||
          requiredSkill.includes(applicantSkill)
      );

      if (matchedSkill) {
        matchingSkills.push(requiredSkill);
      }
    });

    const skillScore =
      (matchingSkills.length / requiredSkills.length) * 30;

    score += skillScore;

    if (matchingSkills.length > 0) {
      reasons.push(
        `Skills matched: ${matchingSkills.join(", ")}`
      );
    }

    const missingSkills = requiredSkills.filter(
      (skill) => !matchingSkills.includes(skill)
    );

    if (missingSkills.length > 0) {
      reasons.push(
        `Missing skills: ${missingSkills.join(", ")}`
      );
    }
  } else if (requiredSkills.length === 0) {
    reasons.push(
      "No specific skills were required"
    );
  } else {
    reasons.push(
      "Applicant did not provide skills"
    );
  }

  return {
    score: Math.round(Math.min(score, 100)),
    reasons,
  };
}

// ============================================================
// MATCH LABEL
// ============================================================

function getMatchLabel(score) {
  if (score >= 85) {
    return {
      label: "Strong Match",
      background: "#e8f7ee",
      color: "#16803c",
    };
  }

  if (score >= 70) {
    return {
      label: "Good Match",
      background: "#eef6ff",
      color: "#0057B8",
    };
  }

  if (score >= 40) {
    return {
      label: "Possible Match",
      background: "#fff7e6",
      color: "#b26a00",
    };
  }

  return {
    label: "Weak Match",
    background: "#fff0f0",
    color: "#c62828",
  };
}

// ============================================================
// COMPANY DASHBOARD
// ============================================================

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {
    loadDashboard();

    const handleFocus = () => {
      loadDashboard();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      // ------------------------------------------------------
      // GET LOGGED-IN USER
      // ------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ------------------------------------------------------
      // GET COMPANY PROFILE
      // ------------------------------------------------------

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error(
          "Company lookup error:",
          companyError
        );

        setCompany(null);
        setLoading(false);
        return;
      }

      if (!companyData) {
        setCompany(null);
        setLoading(false);
        return;
      }

      setCompany(companyData);

      // ------------------------------------------------------
      // GET COMPANY INTERNSHIPS
      // ------------------------------------------------------

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select(`
          id,
          job_title,
          company_name,
          company_email,
          company_website,
          province,
          location,
          internship_type,
          stipend,
          qualification,
          field_of_study,
          deadline,
          description,
          skills,
          created_at
        `)
        .eq(
          "company_name",
          companyData.company_name
        )
        .order("created_at", {
          ascending: false,
        });

      if (internshipError) {
        console.error(
          "Internship lookup error:",
          internshipError
        );

        setInternships([]);
        setApplications([]);
        setLoading(false);
        return;
      }

      const jobs = internshipData || [];

      setInternships(jobs);

      // ------------------------------------------------------
      // NO INTERNSHIPS
      // ------------------------------------------------------

      if (jobs.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // ------------------------------------------------------
      // GET APPLICATIONS
      // ------------------------------------------------------

      const internshipIds = jobs.map(
        (job) => job.id
      );

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select("*")
        .in("internship_id", internshipIds)
        .order("created_at", {
          ascending: false,
        });

      if (applicationError) {
        console.error(
          "Application lookup error:",
          applicationError
        );

        setApplications([]);
        setLoading(false);
        return;
      }

      // ------------------------------------------------------
      // GET GRADUATE IDs
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // GET GRADUATE PROFILES
      // ------------------------------------------------------

      if (graduateIds.length > 0) {
        const {
          data: graduateData,
          error: graduateError,
        } = await supabase
          .from("graduates")
          .select(`
            id,
            user_id,
            full_name,
            email,
            phone,
            qualification,
            field_of_study,
            institution,
            province,
            career_goals,
            skills,
            cv_url
          `)
          .in(
            "id",
            graduateIds
          );

        if (graduateError) {
          console.error(
            "Graduate lookup error:",
            graduateError
          );
        } else if (graduateData) {
          graduates = graduateData;
        }
      }

      // ------------------------------------------------------
      // COMBINE APPLICATION + INTERNSHIP + GRADUATE DATA
      // ------------------------------------------------------

      const applicationsWithData = (
        applicationData || []
      ).map((application) => {
        const internship = jobs.find(
          (job) =>
            job.id ===
            application.internship_id
        );

        const graduate = graduates.find(
          (item) =>
            item.id ===
            application.graduate_id
        );

        const mergedApplication = {
          ...graduate,
          ...application,
        };

        const match = internship
          ? calculateMatch(
              mergedApplication,
              internship
            )
          : {
              score: 0,
              reasons: [],
            };

        return {
          ...mergedApplication,

          job_title:
            internship?.job_title ||
            "Internship",

          internship_qualification:
            internship?.qualification ||
            "",

          internship_field_of_study:
            internship?.field_of_study ||
            "",

          internship_skills:
            internship?.skills ||
            "",

          internship,

          ai_score: match.score,

          match_reasons:
            match.reasons,

          // Keep application CV first,
          // then graduate CV.
          cv_url:
            application.cv_url ||
            application.cv ||
            application.resume_url ||
            application.document_url ||
            graduate?.cv_url ||
            null,
        };
      });

      setApplications(
        applicationsWithData
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setInternships([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // APPLICATION COUNT FOR INTERNSHIP
  // ==========================================================

  function getApplicationCount(
    internshipId
  ) {
    return applications.filter(
      (application) =>
        application.internship_id ===
        internshipId
    ).length;
  }

  // ==========================================================
  // CANDIDATE COUNT
  // ==========================================================

  const candidateCount =
    new Set(
      applications
        .map(
          (application) =>
            application.graduate_id
        )
        .filter(Boolean)
    ).size;

  // ==========================================================
  // SHORTLISTED COUNT
  // ==========================================================

  const shortlistedCount =
    applications.filter(
      (application) =>
        application.status ===
        "Shortlisted"
    ).length;

  // ==========================================================
  // ACTIVE INTERNSHIPS
  // ==========================================================

  const activeInternships =
    internships.filter((job) => {
      if (!job.deadline) {
        return true;
      }

      return (
        new Date(job.deadline) >=
        new Date()
      );
    }).length;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          color: "#0057B8",
          fontSize: "20px",
          fontWeight: "700",
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
              fontSize: "42px",
              marginBottom: "12px",
            }}
          >
            🏢
          </div>

          Loading your company dashboard...
        </div>
      </main>
    );
  }

  // ==========================================================
  // NO COMPANY PROFILE
  // ==========================================================

  if (!company) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#fff",
            borderRadius: "22px",
            padding: "35px 25px",
            textAlign: "center",
            boxShadow:
              "0 15px 45px rgba(0,0,0,.08)",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "10px",
            }}
          >
            🏢
          </div>

          <h2
            style={{
              color: "#003b7a",
              marginTop: 0,
            }}
          >
            Company Profile Required
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            Please complete your company
            profile before accessing the
            recruitment dashboard.
          </p>

          <button
            onClick={() =>
              router.push("/company")
            }
            style={{
              width: "100%",
              marginTop: "15px",
              background: "#0057B8",
              color: "#fff",
              border: "none",
              padding: "14px 20px",
              borderRadius: "11px",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Complete Company Profile
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f5f9ff 0%,#ffffff 100%)",
        padding: "0 16px 60px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        {/* ====================================================
            TOP NAVIGATION
        ==================================================== */}

        <header
          style={{
            padding: "18px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#0057B8",
              fontWeight: "900",
              fontSize: "20px",
              letterSpacing: "-0.5px",
            }}
          >
            GRADLINK SA
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={navButton}
            >
              Home
            </Link>

            <Link
              href="/company"
              style={navButton}
            >
              Company Profile
            </Link>

            <Link
              href="/internships"
              style={primaryNavButton}
            >
              + Post Internship
            </Link>
          </nav>
        </header>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          style={{
            background:
              "linear-gradient(135deg,#003b7a 0%,#0057B8 55%,#0a84ff 100%)",
            borderRadius: "24px",
            padding:
              "32px clamp(22px,5vw,45px)",
            color: "#fff",
            marginBottom: "22px",
            boxShadow:
              "0 18px 45px rgba(0,87,184,.18)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,.08)",
              right: "-80px",
              top: "-90px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "1.2px",
                opacity: 0.8,
                marginBottom: "9px",
              }}
            >
              COMPANY RECRUITMENT PORTAL
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(27px,5vw,40px)",
                lineHeight: 1.15,
                letterSpacing: "-1px",
              }}
            >
              Welcome back,
              <br />
              {company.company_name}
            </h1>

            <p
              style={{
                margin:
                  "14px 0 0",
                maxWidth: "650px",
                lineHeight: "1.6",
                fontSize: "16px",
                opacity: 0.9,
              }}
            >
              Manage your internship
              opportunities and review
              applications from one place.
            </p>
          </div>
        </section>

        {/* ====================================================
            QUICK STATS
        ==================================================== */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "14px",
            marginBottom: "30px",
          }}
        >
          <div style={statCard}>
            <div style={statIcon}>
              💼
            </div>

            <div style={statNumber}>
              {activeInternships}
            </div>

            <div style={statLabel}>
              Active Internships
            </div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>
              📋
            </div>

            <div style={statNumber}>
              {applications.length}
            </div>

            <div style={statLabel}>
              Total Applications
            </div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>
              ⭐
            </div>

            <div style={statNumber}>
              {shortlistedCount}
            </div>

            <div style={statLabel}>
              Shortlisted
            </div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>
              👥
            </div>

            <div style={statNumber}>
              {candidateCount}
            </div>

            <div style={statLabel}>
              Candidates
            </div>
          </div>
        </section>

        {/* ====================================================
            YOUR INTERNSHIPS
        ==================================================== */}

        <section
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-end",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#0057B8",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  marginBottom: "5px",
                }}
              >
                RECRUITMENT
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#003b7a",
                  fontSize: "27px",
                }}
              >
                Your Internships
              </h2>
            </div>

            <Link
              href="/internships"
              style={{
                textDecoration: "none",
                color: "#0057B8",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              + Post another internship
            </Link>
          </div>

          {internships.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border:
                  "1px solid #e3eaf2",
                borderRadius: "18px",
                padding: "40px 25px",
                textAlign: "center",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "10px",
                }}
              >
                📭
              </div>

              <h3
                style={{
                  color: "#003b7a",
                  margin:
                    "0 0 8px",
                }}
              >
                No internships yet
              </h3>

              <p
                style={{
                  color: "#777",
                  lineHeight: "1.6",
                  margin:
                    "0 auto 20px",
                  maxWidth: "500px",
                }}
              >
                Post your first internship
                and start receiving
                applications from
                graduates.
              </p>

              <Link
                href="/internships"
                style={{
                  ...actionButton,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                + Post Internship
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(290px,1fr))",
                gap: "18px",
              }}
            >
              {internships.map(
                (internship) => {
                  const count =
                    getApplicationCount(
                      internship.id
                    );

                  const isExpired =
                    internship.deadline &&
                    new Date(
                      internship.deadline
                    ) < new Date();

                  return (
                    <article
                      key={
                        internship.id
                      }
                      style={{
                        background: "#fff",
                        border:
                          "1px solid #e3eaf2",
                        borderRadius: "18px",
                        padding: "22px",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,.05)",
                        transition:
                          "transform .2s ease,box-shadow .2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: "12px",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius:
                              "14px",
                            background:
                              "#eef6ff",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize: "23px",
                          }}
                        >
                          💼
                        </div>

                        <span
                          style={{
                            padding:
                              "6px 10px",
                            borderRadius:
                              "20px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "800",
                            background:
                              isExpired
                                ? "#fff0f0"
                                : "#e8f7ee",
                            color:
                              isExpired
                                ? "#c62828"
                                : "#16803c",
                          }}
                        >
                          {isExpired
                            ? "EXPIRED"
                            : "ACTIVE"}
                        </span>
                      </div>

                      <h3
                        style={{
                          color: "#003b7a",
                          fontSize: "20px",
                          margin:
                            "0 0 7px",
                          lineHeight: 1.3,
                        }}
                      >
                        {
                          internship.job_title
                        }
                      </h3>

                      <p
                        style={{
                          color: "#666",
                          margin:
                            "0 0 15px",
                          fontSize:
                            "14px",
                        }}
                      >
                        {internship.field_of_study ||
                          "General Internship"}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gap: "9px",
                          marginBottom:
                            "18px",
                        }}
                      >
                        <InfoRow
                          icon="📍"
                          value={
                            [
                              internship.province,
                              internship.location,
                            ]
                              .filter(Boolean)
                              .join(
                                " • "
                              ) ||
                            "Location not specified"
                          }
                        />

                        <InfoRow
                          icon="💰"
                          value={
                            internship.stipend ||
                            "Stipend not specified"
                          }
                        />

                        <InfoRow
                          icon="🕐"
                          value={
                            internship.internship_type ||
                            "Internship"
                          }
                        />

                        <InfoRow
                          icon="👥"
                          value={`${count} ${
                            count === 1
                              ? "Application"
                              : "Applications"
                          }`}
                        />
                      </div>

                      <Link
                        href={`/company/internships/${internship.id}/applicants`}
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          width: "100%",
                          boxSizing:
                            "border-box",
                          background:
                            "#0057B8",
                          color: "#fff",
                          textDecoration:
                            "none",
                          padding:
                            "13px 16px",
                          borderRadius:
                            "10px",
                          fontWeight:
                            "800",
                          fontSize:
                            "14px",
                        }}
                      >
                        View Applications
                        <span
                          style={{
                            marginLeft:
                              "7px",
                          }}
                        >
                          →
                        </span>
                      </Link>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

                {/* ====================================================
            RECENT APPLICATIONS
        ==================================================== */}

        {applications.length > 0 && (
          <section
            style={{
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#0057B8",
                    fontSize: "13px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    marginBottom: "5px",
                  }}
                >
                  APPLICANTS
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#003b7a",
                    fontSize: "27px",
                  }}
                >
                  Recent Applications
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {applications
                .slice(0, 6)
                .map((application) => {
                  const match =
                    getMatchLabel(
                      application.ai_score || 0
                    );

                  return (
                    <div
                      key={application.id}
                      style={{
                        background: "#fff",
                        border:
                          "1px solid #e3eaf2",
                        borderRadius: "16px",
                        padding: "18px",
                        boxShadow:
                          "0 6px 20px rgba(0,0,0,.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: "15px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              marginBottom:
                                "7px",
                            }}
                          >
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#eef6ff",
                                color:
                                  "#0057B8",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontWeight:
                                  "900",
                                fontSize:
                                  "17px",
                              }}
                            >
                              {(
                                application.full_name ||
                                "G"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <h3
                                style={{
                                  margin: 0,
                                  color:
                                    "#003b7a",
                                  fontSize:
                                    "17px",
                                  lineHeight:
                                    "1.3",
                                }}
                              >
                                {application.full_name ||
                                  "Graduate Applicant"}
                              </h3>

                              <p
                                style={{
                                  margin:
                                    "3px 0 0",
                                  color:
                                    "#777",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                {application.job_title ||
                                  "Internship"}
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap: "7px",
                              marginTop:
                                "10px",
                            }}
                          >
                            {application.qualification && (
                              <span
                                style={{
                                  background:
                                    "#f5f8fc",
                                  color:
                                    "#455a70",
                                  border:
                                    "1px solid #e3eaf2",
                                  borderRadius:
                                    "8px",
                                  padding:
                                    "6px 9px",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "700",
                                }}
                              >
                                🎓{" "}
                                {
                                  application.qualification
                                }
                              </span>
                            )}

                            {application.field_of_study && (
                              <span
                                style={{
                                  background:
                                    "#f5f8fc",
                                  color:
                                    "#455a70",
                                  border:
                                    "1px solid #e3eaf2",
                                  borderRadius:
                                    "8px",
                                  padding:
                                    "6px 9px",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "700",
                                }}
                              >
                                📚{" "}
                                {
                                  application.field_of_study
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              background:
                                match.background,
                              color:
                                match.color,
                              borderRadius:
                                "20px",
                              padding:
                                "7px 11px",
                              fontSize:
                                "11px",
                              fontWeight:
                                "800",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {match.label}
                          </span>

                          <span
                            style={{
                              background:
                                "#f5f8fc",
                              color:
                                "#003b7a",
                              border:
                                "1px solid #e3eaf2",
                              borderRadius:
                                "20px",
                              padding:
                                "7px 11px",
                              fontSize:
                                "11px",
                              fontWeight:
                                "900",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {application.ai_score || 0}%
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "15px",
                          paddingTop: "14px",
                          borderTop:
                            "1px solid #edf1f5",
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "12px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "12px",
                            flexWrap:
                              "wrap",
                            color:
                              "#6d7885",
                            fontSize:
                              "12px",
                          }}
                        >
                          <span>
                            📧{" "}
                            {application.email ||
                              "No email"}
                          </span>

                          {application.status && (
                            <span>
                              •{" "}
                              {
                                application.status
                              }
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/company/internships/${application.internship_id}/applicants`}
                          style={{
                            textDecoration:
                              "none",
                            background:
                              "#eef6ff",
                            color:
                              "#0057B8",
                            padding:
                              "9px 13px",
                            borderRadius:
                              "9px",
                            fontSize:
                              "12px",
                            fontWeight:
                              "800",
                          }}
                        >
                          Review →
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* ====================================================
            RECRUITMENT TIP
        ==================================================== */}

        <section
          style={{
            background:
              "linear-gradient(135deg,#ffffff 0%,#f3f8ff 100%)",
            border:
              "1px solid #dfeaf6",
            borderRadius: "20px",
            padding:
              "24px clamp(20px,4vw,30px)",
            marginBottom: "30px",
            boxShadow:
              "0 8px 25px rgba(0,0,0,.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "flex-start",
              gap: "15px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                minWidth: "46px",
                borderRadius: "13px",
                background: "#0057B8",
                color: "#fff",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: "22px",
              }}
            >
              💡
            </div>

            <div>
              <h3
                style={{
                  margin:
                    "0 0 6px",
                  color: "#003b7a",
                  fontSize: "18px",
                }}
              >
                Recruitment made simpler
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#66717f",
                  lineHeight: "1.6",
                  fontSize: "14px",
                }}
              >
                Open any internship above
                to see its applications,
                applicant information and
                matching results in one
                place. You don't need to
                search through graduates
                individually.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer
          style={{
            borderTop:
              "1px solid #e5ebf2",
            paddingTop: "22px",
            marginTop: "35px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            color: "#7a8795",
            fontSize: "12px",
          }}
        >
          <div>
            © {new Date().getFullYear()}{" "}
            GradLink SA
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#6d7885",
                textDecoration:
                  "none",
              }}
            >
              Home
            </Link>

            <Link
              href="/company"
              style={{
                color: "#6d7885",
                textDecoration:
                  "none",
              }}
            >
              Company Profile
            </Link>

            <Link
              href="/internships"
              style={{
                color: "#6d7885",
                textDecoration:
                  "none",
              }}
            >
              Post Internship
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  icon,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "9px",
        color: "#5e6977",
        fontSize: "13px",
        lineHeight: "1.45",
      }}
    >
      <span
        style={{
          width: "20px",
          minWidth: "20px",
          textAlign: "center",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// NAVIGATION BUTTONS
// ============================================================

const navButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "0 15px",
  boxSizing: "border-box",
  borderRadius: "10px",
  border: "1px solid #d7e1ec",
  background: "#ffffff",
  color: "#003b7a",
  textDecoration: "none",
  fontWeight: "800",
  fontSize: "13px",
  boxShadow:
    "0 3px 10px rgba(0,0,0,.04)",
};

const primaryNavButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "0 16px",
  boxSizing: "border-box",
  borderRadius: "10px",
  border: "1px solid #0057B8",
  background: "#0057B8",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "800",
  fontSize: "13px",
  boxShadow:
    "0 5px 14px rgba(0,87,184,.18)",
};

const actionButton = {
  background: "#0057B8",
  color: "#ffffff",
  border: "none",
  padding: "13px 18px",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow:
    "0 5px 14px rgba(0,87,184,.16)",
};

const statCard = {
  background: "#ffffff",
  border: "1px solid #e3eaf2",
  borderRadius: "17px",
  padding: "20px",
  minHeight: "135px",
  boxSizing: "border-box",
  boxShadow:
    "0 7px 22px rgba(0,0,0,.045)",
};

const statIcon = {
  fontSize: "24px",
  marginBottom: "10px",
};

const statNumber = {
  color: "#003b7a",
  fontSize: "28px",
  fontWeight: "900",
  lineHeight: "1",
  marginBottom: "7px",
};

const statLabel = {
  color: "#718096",
  fontSize: "12px",
  fontWeight: "700",
};