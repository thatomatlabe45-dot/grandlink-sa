"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // ----------------------------------------
  // QUALIFICATION LEVEL
  // ----------------------------------------

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

  // ----------------------------------------
  // QUALIFICATION MATCH
  // ----------------------------------------

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

    if (applicantLevel > 0 && requiredLevel > 0) {
      return applicantLevel >= requiredLevel;
    }

    return (
      applicant === required ||
      applicant.includes(required) ||
      required.includes(applicant)
    );
  }

  // ----------------------------------------
  // MATCHING SCORE
  // ----------------------------------------

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

    // ----------------------------------------
    // QUALIFICATION = 35 POINTS
    // ----------------------------------------

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
        `✅ Qualification requirement met (${application.qualification} vs ${internship.qualification})`
      );
    } else if (
      application.qualification &&
      internship.qualification
    ) {
      reasons.push(
        `❌ Qualification requirement not met (${application.qualification} vs ${internship.qualification})`
      );
    }

    // ----------------------------------------
    // FIELD OF STUDY = 35 POINTS
    // ----------------------------------------

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
        `✅ Field of study matches (${application.field_of_study})`
      );
    } else if (
      application.field_of_study &&
      internship.field_of_study
    ) {
      reasons.push(
        `❌ Field of study does not match (${application.field_of_study} vs ${internship.field_of_study})`
      );
    }

    // ----------------------------------------
    // SKILLS = 30 POINTS
    // ----------------------------------------

    let matchingSkills = [];

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
        (matchingSkills.length /
          requiredSkills.length) *
        30;

      score += skillScore;

      if (matchingSkills.length > 0) {
        reasons.push(
          `✅ Skills matched: ${matchingSkills.join(", ")}`
        );
      }

      const missingSkills = requiredSkills.filter(
        (skill) => !matchingSkills.includes(skill)
      );

      if (missingSkills.length > 0) {
        reasons.push(
          `❌ Missing skills: ${missingSkills.join(", ")}`
        );
      }
    } else if (requiredSkills.length === 0) {
      reasons.push(
        "ℹ️ No specific skills were required"
      );
    } else {
      reasons.push(
        "❌ Applicant did not provide skills"
      );
    }

    return {
      score: Math.round(Math.min(score, 100)),
      reasons,
    };
  }

  // ----------------------------------------
  // MATCH LABEL
  // ----------------------------------------

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

  // ----------------------------------------
  // UPDATE APPLICATION STATUS
  // ----------------------------------------

  async function updateApplicationStatus(
    applicationId,
    newStatus
  ) {
    setUpdatingId(applicationId);

    const { error } = await supabase
      .from("applications")
      .update({
        status: newStatus,
      })
      .eq("id", applicationId);

    if (error) {
      alert(
        `Could not update application status: ${error.message}`
      );

      setUpdatingId(null);
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: newStatus,
            }
          : application
      )
    );

    setUpdatingId(null);
  }

  // ----------------------------------------
  // LOAD DASHBOARD
  // ----------------------------------------

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      data: companyData,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError || !companyData) {
      setLoading(false);
      return;
    }

    setCompany(companyData);

    const {
      data: internships,
      error: internshipError,
    } = await supabase
      .from("internships")
      .select(
        "id, job_title, company_name, qualification, field_of_study, skills"
      )
      .eq("company_name", companyData.company_name);

    if (
      internshipError ||
      !internships ||
      internships.length === 0
    ) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const internshipIds = internships.map(
      (internship) => internship.id
    );

    const {
      data: applicationData,
      error: applicationError,
    } = await supabase
      .from("applications")
      .select("*")
      .in("internship_id", internshipIds)
      .order("created_at", { ascending: false });

    if (!applicationError) {
      const applicationsWithJobs = (
        applicationData || []
      ).map((application) => {
        const internship = internships.find(
          (job) =>
            job.id === application.internship_id
        );

        const match = internship
          ? calculateMatch(application, internship)
          : {
              score: 0,
              reasons: [],
            };

        return {
          ...application,

          job_title:
            internship?.job_title || "Internship",

          internship_qualification:
            internship?.qualification || "",

          internship_field_of_study:
            internship?.field_of_study || "",

          internship_skills:
            internship?.skills || "",

          ai_score: match.score,

          match_reasons: match.reasons,
        };
      });

      applicationsWithJobs.sort(
        (a, b) => b.ai_score - a.ai_score
      );

      setApplications(applicationsWithJobs);
    }

    setLoading(false);
  }

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

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
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        Loading company dashboard...
      </main>
    );
  }

  // ----------------------------------------
  // NO COMPANY
  // ----------------------------------------

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
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            textAlign: "center",
            maxWidth: "500px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Company Profile Required
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            Please complete your company profile
            before accessing the dashboard.
          </p>

          <button
            onClick={() =>
              router.push("/company")
            }
            style={{
              marginTop: "15px",
              background: "#0057B8",
              color: "#fff",
              border: "none",
              padding: "13px 22px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Complete Company Profile
          </button>
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // DASHBOARD
  // ----------------------------------------

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#0057B8,#0a84ff)",
            color: "#fff",
            borderRadius: "20px",
            padding: "35px",
            marginBottom: "25px",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            🏢 Company Dashboard
          </h1>

          <p
            style={{
              marginBottom: 0,
              fontSize: "18px",
            }}
          >
            Welcome, {company.company_name}
          </p>
        </div>

        {/* STATISTICS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={statCard}>
            <div style={{ fontSize: "32px" }}>
              📋
            </div>

            <h2>{applications.length}</h2>

            <p>Total Applications</p>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: "32px" }}>
              👥
            </div>

            <h2>
              {
                new Set(
                  applications.map(
                    (application) =>
                      application.graduate_id
                  )
                ).size
              }
            </h2>

            <p>Applicants</p>
          </div>
        </div>

        {/* APPLICANTS */}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              color: "#0057B8",
              marginTop: 0,
            }}
          >
            👥 Applicants
          </h2>

          {applications.length === 0 ? (
            <div
              style={{
                padding: "30px 10px",
                textAlign: "center",
                color: "#777",
              }}
            >
              <div style={{ fontSize: "45px" }}>
                📭
              </div>

              <h3>No applications yet</h3>

              <p>
                When graduates apply for your
                internships, their applications will
                appear here.
              </p>
            </div>
          ) : (
            applications.map(
              (application, index) => {
                const match = getMatchLabel(
                  application.ai_score
                );

                const currentStatus =
                  application.status || "Pending";

                return (
                  <div
                    key={application.id}
                    style={{
                      border:
                        index === 0 &&
                        application.ai_score >= 70
                          ? "2px solid #0057B8"
                          : "1px solid #e1e7ef",

                      borderRadius: "14px",
                      padding: "22px",
                      marginBottom: "18px",
                    }}
                  >

                    {/* RANK */}

                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#777",
                        marginBottom: "10px",
                      }}
                    >
                      #{index + 1} Applicant
                    </div>

                    {/* NAME + STATUS */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "15px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: "6px",
                            color: "#003b7a",
                          }}
                        >
                          {application.full_name}
                        </h3>

                        <p
                          style={{
                            margin: "5px 0",
                            color: "#666",
                          }}
                        >
                          💼 {application.job_title}
                        </p>
                      </div>

                      {/* STATUS */}

                      <div
                        style={{
                          background:
                            currentStatus ===
                            "Shortlisted"
                              ? "#e8f7ee"
                              : currentStatus ===
                                "Rejected"
                              ? "#fff0f0"
                              : "#eef5ff",

                          color:
                            currentStatus ===
                            "Shortlisted"
                              ? "#16803c"
                              : currentStatus ===
                                "Rejected"
                              ? "#c62828"
                              : "#0057B8",

                          padding: "8px 12px",
                          borderRadius: "20px",
                          height: "fit-content",
                          fontWeight: "bold",
                        }}
                      >
                        {currentStatus}
                      </div>
                    </div>

                    <hr
                      style={{
                        border: "none",
                        borderTop:
                          "1px solid #eee",
                        margin: "18px 0",
                      }}
                    />

                    {/* APPLICANT DETAILS */}

                    <p>
                      <strong>
                        📧 Email:
                      </strong>{" "}
                      {application.email}
                    </p>

                    <p>
                      <strong>
                        📱 Phone:
                      </strong>{" "}
                      {application.phone}
                    </p>

                    <p>
                      <strong>
                        🎓 Qualification:
                      </strong>{" "}
                      {application.qualification}
                    </p>

                    <p>
                      <strong>
                        💻 Field of Study:
                      </strong>{" "}
                      {application.field_of_study}
                    </p>

                    <p>
                      <strong>
                        🛠️ Skills:
                      </strong>{" "}
                      {application.skills ||
                        "Not provided"}
                    </p>

                    {/* AI SCORE */}

                    <div
                      style={{
                        marginTop: "20px",
                        padding: "18px",
                        borderRadius: "14px",
                        background:
                          match.background,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "16px",
                              color: match.color,
                            }}
                          >
                            🎯 AI Match Score
                          </div>

                          <div
                            style={{
                              fontSize: "28px",
                              fontWeight: "bold",
                              color: match.color,
                              marginTop: "5px",
                            }}
                          >
                            {application.ai_score}%
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#fff",
                            color: match.color,
                            padding: "9px 14px",
                            borderRadius: "20px",
                            fontWeight: "bold",
                          }}
                        >
                          {match.label}
                        </div>
                      </div>
                    </div>

                    {/* WHY THIS SCORE */}

                    <div
                      style={{
                        marginTop: "15px",
                        padding: "18px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border:
                          "1px solid #e5eaf0",
                      }}
                    >
                      <h4
                        style={{
                          marginTop: 0,
                          color: "#003b7a",
                        }}
                      >
                        🔎 Why this score?
                      </h4>

                      {application.match_reasons &&
                      application.match_reasons
                        .length > 0 ? (
                        application.match_reasons.map(
                          (reason, reasonIndex) => (
                            <p
                              key={reasonIndex}
                              style={{
                                margin:
                                  "8px 0",
                                color: "#555",
                              }}
                            >
                              {reason}
                            </p>
                          )
                        )
                      ) : (
                        <p
                          style={{
                            color: "#777",
                          }}
                        >
                          No matching information
                          available.
                        </p>
                      )}
                    </div>

                    {/* RECRUITMENT ACTIONS */}

                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "18px",
                        borderTop:
                          "1px solid #eee",
                      }}
                    >
                      <h4
                        style={{
                          marginTop: 0,
                          color: "#003b7a",
                        }}
                      >
                        Recruitment Decision
                      </h4>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >

                        {/* SHORTLIST */}

                        <button
                          onClick={() =>
                            updateApplicationStatus(
                              application.id,
                              "Shortlisted"
                            )
                          }
                          disabled={
                            updatingId ===
                            application.id ||
                            currentStatus ===
                              "Shortlisted"
                          }
                          style={{
                            background:
                              currentStatus ===
                              "Shortlisted"
                                ? "#16803c"
                                : "#e8f7ee",

                            color:
                              currentStatus ===
                              "Shortlisted"
                                ? "#fff"
                                : "#16803c",

                            border:
                              "1px solid #16803c",

                            padding:
                              "11px 16px",

                            borderRadius:
                              "9px",

                            fontWeight:
                              "bold",

                            cursor:
                              currentStatus ===
                              "Shortlisted"
                                ? "default"
                                : "pointer",

                            opacity:
                              updatingId ===
                              application.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {updatingId ===
                          application.id
                            ? "Updating..."
                            : currentStatus ===
                              "Shortlisted"
                            ? "✅ Shortlisted"
                            : "🟢 Shortlist"}
                        </button>

                        {/* REJECT */}

                        <button
                          onClick={() =>
                            updateApplicationStatus(
                              application.id,
                              "Rejected"
                            )
                          }
                          disabled={
                            updatingId ===
                            application.id ||
                            currentStatus ===
                              "Rejected"
                          }
                          style={{
                            background:
                              currentStatus ===
                              "Rejected"
                                ? "#c62828"
                                : "#fff0f0",

                            color:
                              currentStatus ===
                              "Rejected"
                                ? "#fff"
                                : "#c62828",

                            border:
                              "1px solid #c62828",

                            padding:
                              "11px 16px",

                            borderRadius:
                              "9px",

                            fontWeight:
                              "bold",

                            cursor:
                              currentStatus ===
                              "Rejected"
                                ? "default"
                                : "pointer",

                            opacity:
                              updatingId ===
                              application.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {updatingId ===
                          application.id
                            ? "Updating..."
                            : currentStatus ===
                              "Rejected"
                            ? "❌ Rejected"
                            : "🔴 Reject"}
                        </button>

                        {/* RESET */}

                        {currentStatus !==
                          "Pending" && (
                          <button
                            onClick={() =>
                              updateApplicationStatus(
                                application.id,
                                "Pending"
                              )
                            }
                            disabled={
                              updatingId ===
                              application.id
                            }
                            style={{
                              background:
                                "#fff",

                              color:
                                "#555",

                              border:
                                "1px solid #aaa",

                              padding:
                                "11px 16px",

                              borderRadius:
                                "9px",

                              fontWeight:
                                "bold",

                              cursor:
                                "pointer",

                              opacity:
                                updatingId ===
                                application.id
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            🔄 Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>

                    {/* APPLIED DATE */}

                    <p
                      style={{
                        color: "#777",
                        fontSize: "14px",
                        marginTop: "18px",
                      }}
                    >
                      Applied:{" "}
                      {application.created_at
                        ? new Date(
                            application.created_at
                          ).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* ACTIONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "25px",
          }}
        >
          <button
            onClick={() =>
              router.push("/internships")
            }
            style={actionButton}
          >
            🚀 Post Internship
          </button>

          <button
            onClick={() =>
              router.push("/company")
            }
            style={secondaryButton}
          >
            ⚙️ Edit Company Profile
          </button>
        </div>
      </div>
    </main>
  );
}

const statCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "25px",
  textAlign: "center",
  boxShadow:
    "0 10px 25px rgba(0,0,0,.07)",
};

const actionButton = {
  background: "#0057B8",
  color: "#fff",
  border: "none",
  padding: "14px 20px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  background: "#fff",
  color: "#0057B8",
  border: "2px solid #0057B8",
  padding: "12px 20px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};