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

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // GET LOGGED-IN USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // =====================================================
      // FIND COMPANY
      // =====================================================

      let companyData = null;

      const {
        data: companyByUserId,
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
      }

      if (companyByUserId) {
        companyData = companyByUserId;
      }

      // =====================================================
      // FALLBACK: FIND COMPANY BY EMAIL
      // =====================================================

      if (!companyData && user.email) {
        const {
          data: companyByEmail,
          error: emailCompanyError,
        } = await supabase
          .from("companies")
          .select("*")
          .ilike(
            "email",
            user.email.trim()
          )
          .maybeSingle();

        if (emailCompanyError) {
          console.error(
            "Company email lookup error:",
            emailCompanyError
          );
        }

        if (companyByEmail) {
          companyData = companyByEmail;

          // Repair user_id if needed
          await supabase
            .from("companies")
            .update({
              user_id: user.id,
            })
            .eq(
              "id",
              companyByEmail.id
            );
        }
      }

      // =====================================================
      // NO COMPANY PROFILE
      // =====================================================

      if (!companyData) {
        setCompany(null);
        setLoading(false);

        setError(
          "No company profile was found for this account."
        );

        return;
      }

      setCompany(companyData);

      // =====================================================
      // LOAD COMPANY INTERNSHIPS
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
            ascending: false,
          }
        );

      if (internshipError) {
        console.error(
          "Internship load error:",
          internshipError
        );

        throw internshipError;
      }

      const loadedInternships =
        internshipData || [];

      setInternships(
        loadedInternships
      );

      // =====================================================
      // GET INTERNSHIP IDS
      // =====================================================

      const internshipIds =
        loadedInternships.map(
          (internship) =>
            internship.id
        );

      // =====================================================
      // LOAD APPLICATIONS
      // =====================================================

      if (
        internshipIds.length === 0
      ) {
        setApplications([]);
        setLoading(false);
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
            ascending: false,
          }
        );

      if (applicationError) {
        console.error(
          "Application load error:",
          applicationError
        );

        throw applicationError;
      }

      const loadedApplications =
        applicationData || [];

      // =====================================================
      // SORT BY AI SCORE
      // =====================================================

      loadedApplications.sort(
        (a, b) =>
          Number(
            b.ai_score || 0
          ) -
          Number(
            a.ai_score || 0
          )
      );

      setApplications(
        loadedApplications
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
  // UPDATE APPLICATION STATUS
  // =========================================================

  async function updateApplicationStatus(
    applicationId,
    status
  ) {
    try {
      setUpdatingId(
        applicationId
      );

      setMessage("");
      setError("");

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

      if (updateError) {
        throw updateError;
      }

      setApplications(
        (currentApplications) =>
          currentApplications.map(
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
        `Application ${status.toLowerCase()} successfully.`
      );

    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      setError(
        err.message ||
          "Could not update application."
      );
    } finally {
      setUpdatingId(null);
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

      // First check CV fields
      let cvPath =
        application.cv_url ||
        application.cv ||
        application.resume_url ||
        application.document_url ||
        null;

      // If application does not have CV,
      // get it from graduate profile

      if (
        !cvPath &&
        application.graduate_id
      ) {
        const {
          data: graduate,
          error: graduateError,
        } = await supabase
          .from("graduates")
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
            "Graduate CV lookup error:",
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

      if (!cvPath) {
        alert(
          "No CV uploaded for this application."
        );

        return;
      }

      // If already a full URL
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

      // Create signed URL for Supabase Storage

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from(
          "documents"
        )
        .createSignedUrl(
          cvPath,
          60 * 10
        );

      if (signedError) {
        throw signedError;
      }

      if (
        !signedData?.signedUrl
      ) {
        throw new Error(
          "Could not create a link for this CV."
        );
      }

      window.open(
        signedData.signedUrl,
        "_blank"
      );

    } catch (err) {
      console.error(
        "Review CV error:",
        err
      );

      setError(
        err.message ||
          "Could not open the CV."
      );
    }
  }

  // =========================================================
  // AI LABEL
  // =========================================================

  function getMatchLabel(
    score
  ) {
    const numberScore =
      Number(score || 0);

    if (
      numberScore >= 85
    ) {
      return "Strong Match";
    }

    if (
      numberScore >= 70
    ) {
      return "Good Match";
    }

    if (
      numberScore >= 40
    ) {
      return "Possible Match";
    }

    return "Weak Match";
  }

  // =========================================================
  // AI SCORE COLOR
  // =========================================================

  function getMatchColor(
    score
  ) {
    const numberScore =
      Number(score || 0);

    if (
      numberScore >= 85
    ) {
      return "#16803c";
    }

    if (
      numberScore >= 70
    ) {
      return "#0057B8";
    }

    if (
      numberScore >= 40
    ) {
      return "#d97706";
    }

    return "#c62828";
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f9ff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#0057B8",
            }}
          >
            Loading Company Dashboard...
          </h2>

          <p>
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding:
          "30px 15px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#0057B8,#0a84ff)",
            color: "#ffffff",
            borderRadius: "20px",
            padding: "30px",
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom:
                "10px",
            }}
          >
            🏢 Company Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "17px",
            }}
          >
            Welcome
            {company?.company_name
              ? `, ${company.company_name}`
              : ""}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() =>
                router.push(
                  "/company"
                )
              }
              style={headerButtonStyle}
            >
              ⚙️ Edit Company Profile
            </button>

            <button
              onClick={() =>
                router.push(
                  "/internship"
                )
              }
              style={headerButtonStyle}
            >
              ➕ Post Internship
            </button>
          </div>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            style={{
              background:
                "#e8f7ee",
              color:
                "#16803c",
              border:
                "1px solid #b7e4c7",
              padding:
                "14px 16px",
              borderRadius:
                "10px",
              marginBottom:
                "20px",
              fontWeight:
                "bold",
            }}
          >
            ✅ {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background:
                "#fff0f0",
              color:
                "#c62828",
              border:
                "1px solid #f3b5b5",
              padding:
                "14px 16px",
              borderRadius:
                "10px",
              marginBottom:
                "20px",
              fontWeight:
                "bold",
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
            gap:
              "18px",
            marginBottom:
              "30px",
          }}
        >
          <StatCard
            title="Posted Internships"
            value={
              internships.length
            }
          />

          <StatCard
            title="Total Applications"
            value={
              applications.length
            }
          />

          <StatCard
            title="Shortlisted"
            value={
              applications.filter(
                (application) =>
                  application.status ===
                  "Shortlisted"
              ).length
            }
          />

          <StatCard
            title="Under Review"
            value={
              applications.filter(
                (application) =>
                  application.status ===
                  "Review"
              ).length
            }
          />
        </div>

        {/* =================================================
            INTERNSHIPS
        ================================================= */}

        <section
          style={sectionStyle}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0057B8",
            }}
          >
            📋 Your Internships
          </h2>

          {internships.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "30px",
                color:
                  "#666",
              }}
            >
              <p>
                You have not posted
                any internships yet.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/internship"
                  )
                }
                style={
                  primaryButtonStyle
                }
              >
                ➕ Post Your First Internship
              </button>
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap:
                  "15px",
              }}
            >
              {internships.map(
                (
                  internship
                ) => (
                  <div
                    key={
                      internship.id
                    }
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "12px",
                      padding:
                        "18px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop:
                          0,
                        marginBottom:
                          "8px",
                      }}
                    >
                      {internship.job_title}
                    </h3>

                    <p
                      style={{
                        margin:
                          "5px 0",
                      }}
                    >
                      📍{" "}
                      {
                        internship.location
                      }
                    </p>

                    <p
                      style={{
                        margin:
                          "5px 0",
                      }}
                    >
                      🎓{" "}
                      {
                        internship.qualification
                      }
                    </p>

                    <p
                      style={{
                        margin:
                          "5px 0",
                      }}
                    >
                      👥 Applicants:{" "}
                      {
                        applications.filter(
                          (
                            application
                          ) =>
                            application.internship_id ===
                            internship.id
                        ).length
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            APPLICANTS
        ================================================= */}

        <section
          style={sectionStyle}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0057B8",
            }}
          >
            👨‍🎓 Applicants
          </h2>

          {applications.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "30px",
                color:
                  "#666",
              }}
            >
              No applications yet.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap:
                  "20px",
              }}
            >
              {applications.map(
                (
                  application
                ) => {
                  const score =
                    Number(
                      application.ai_score ||
                        0
                    );

                  return (
                    <div
                      key={
                        application.id
                      }
                      style={{
                        background:
                          "#fff",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          "14px",
                        padding:
                          "20px",
                      }}
                    >
                      {/* APPLICANT HEADER */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap:
                            "15px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              marginTop:
                                0,
                              marginBottom:
                                "8px",
                            }}
                          >
                            {
                              application.full_name ||
                              "Graduate"
                            }
                          </h3>

                          <p
                            style={{
                              margin:
                                "5px 0",
                            }}
                          >
                            📧{" "}
                            {
                              application.email ||
                              "No email"
                            }
                          </p>

                          <p
                            style={{
                              margin:
                                "5px 0",
                            }}
                          >
                            📱{" "}
                            {
                              application.phone ||
                              "No phone"
                            }
                          </p>
                        </div>

                        {/* AI SCORE */}

                        <div
                          style={{
                            minWidth:
                              "150px",
                            textAlign:
                              "center",
                            padding:
                              "14px",
                            borderRadius:
                              "12px",
                            background:
                              "#f8fafc",
                            border:
                              `2px solid ${getMatchColor(
                                score
                              )}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "24px",
                              fontWeight:
                                "bold",
                              color:
                                getMatchColor(
                                  score
                                ),
                            }}
                          >
                            {score}%
                          </div>

                          <div
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                getMatchColor(
                                  score
                                ),
                            }}
                          >
                            {
                              getMatchLabel(
                                score
                              )
                            }
                          </div>
                        </div>
                      </div>

                      {/* APPLICANT DETAILS */}

                      <div
                        style={{
                          marginTop:
                            "18px",
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(220px,1fr))",
                          gap:
                            "12px",
                        }}
                      >
                        <Detail
                          label="Qualification"
                          value={
                            application.qualification
                          }
                        />

                        <Detail
                          label="Field of Study"
                          value={
                            application.field_of_study
                          }
                        />

                        <Detail
                          label="Skills"
                          value={
                            application.skills
                          }
                        />

                        <Detail
                          label="Status"
                          value={
                            application.status ||
                            "Pending"
                          }
                        />
                      </div>

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
                            "20px",
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
                            primaryButtonStyle
                          }
                        >
                          {updatingId ===
                          application.id
                            ? "Updating..."
                            : "🔎 Review"}
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
                          {updatingId ===
                          application.id
                            ? "Updating..."
                            : "⭐ Shortlist"}
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
                          {updatingId ===
                          application.id
                            ? "Updating..."
                            : "❌ Reject"}
                        </button>
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
  title,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        padding:
          "22px",
        borderRadius:
          "15px",
        boxShadow:
          "0 5px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          color:
            "#666",
          marginBottom:
            "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color:
            "#0057B8",
          fontSize:
            "30px",
          fontWeight:
            "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ===========================================================
// DETAIL
// ===========================================================

function Detail({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#f8fafc",
        padding:
          "12px",
        borderRadius:
          "10px",
        border:
          "1px solid #e5e7eb",
      }}
    >
      <strong>
        {label}
      </strong>

      <div
        style={{
          marginTop:
            "5px",
          color:
            "#555",
        }}
      >
        {value ||
          "Not provided"}
      </div>
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
    "18px",
  padding:
    "25px",
  marginBottom:
    "25px",
  boxShadow:
    "0 8px 30px rgba(0,0,0,0.06)",
};

const primaryButtonStyle = {
  background:
    "#0057B8",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "8px",
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
    "8px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const shortlistButtonStyle = {
  background:
    "#16803c",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "8px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const rejectButtonStyle = {
  background:
    "#c62828",
  color:
    "#ffffff",
  border:
    "none",
  padding:
    "11px 16px",
  borderRadius:
    "8px",
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
    "11px 16px",
  borderRadius:
    "8px",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};