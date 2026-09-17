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

function getQualificationLevel(value) {
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

  if (text.includes("certificate")) {
    return 2;
  }

  if (
    text.includes("matric") ||
    text.includes("grade 12")
  ) {
    return 1;
  }

  return 0;
}

// ============================================================
// MATCHING
// ============================================================

function calculateMatch(application, internship) {
  let qualificationScore = 0;
  let fieldScore = 0;
  let skillsScore = 0;

  const applicantQualification = String(
    application?.qualification || ""
  ).toLowerCase();

  const requiredQualification = String(
    internship?.qualification || ""
  ).toLowerCase();

  const applicantField = String(
    application?.field_of_study || ""
  ).toLowerCase();

  const requiredField = String(
    internship?.field_of_study || ""
  ).toLowerCase();

  const applicantSkills = String(
    application?.skills || ""
  )
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const requiredSkills = String(
    internship?.skills || ""
  )
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Qualification
  const applicantLevel = getQualificationLevel(
    applicantQualification
  );

  const requiredLevel = getQualificationLevel(
    requiredQualification
  );

  if (requiredLevel === 0) {
    qualificationScore = 35;
  } else if (applicantLevel >= requiredLevel) {
    qualificationScore = 35;
  } else if (applicantLevel > 0) {
    qualificationScore = 10;
  }

  // Field
  if (
    requiredField &&
    applicantField &&
    (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    )
  ) {
    fieldScore = 35;
  } else if (
    requiredField &&
    applicantField
  ) {
    const requiredWords = requiredField
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const matchedWords = requiredWords.filter((word) =>
      applicantField.includes(word)
    );

    if (matchedWords.length > 0) {
      fieldScore = 20;
    }
  }

  // Skills
  if (requiredSkills.length === 0) {
    skillsScore = 30;
  } else {
    const matchedSkills = requiredSkills.filter((skill) =>
      applicantSkills.some(
        (appSkill) =>
          appSkill.includes(skill) ||
          skill.includes(appSkill)
      )
    );

    skillsScore = Math.round(
      (matchedSkills.length / requiredSkills.length) * 30
    );
  }

  const total =
    qualificationScore +
    fieldScore +
    skillsScore;

  let label = "Weak";

  if (total >= 85) {
    label = "Strong";
  } else if (total >= 70) {
    label = "Good";
  } else if (total >= 40) {
    label = "Possible";
  }

  return {
    total,
    label,
  };
}

// ============================================================
// PAGE
// ============================================================

export default function CompanyDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);

  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] =
    useState(true);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // ========================================================
      // COMPANY
      // ========================================================

      const { data: companyData, error: companyError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        setError(
          "Company profile not found. Please complete your company profile."
        );

        setLoading(false);
        return;
      }

      setCompany(companyData);

      // ========================================================
      // INTERNSHIPS
      // ========================================================

      const { data: internshipData, error: internshipError } =
        await supabase
          .from("internships")
          .select("*")
          .eq(
            "company_name",
            companyData.company_name
          )
          .order("created_at", {
            ascending: false,
          });

      if (internshipError) {
        console.error(
          "Internship loading error:",
          internshipError
        );
      }

      const loadedInternships = internshipData || [];

      setInternships(loadedInternships);

      // ========================================================
      // APPLICATIONS
      // ========================================================

      if (loadedInternships.length > 0) {
        const internshipIds = loadedInternships.map(
          (item) => item.id
        );

        const { data: applicationData, error: applicationError } =
          await supabase
            .from("applications")
            .select("*")
            .in("internship_id", internshipIds)
            .order("created_at", {
              ascending: false,
            });

        if (applicationError) {
          console.error(
            "Application loading error:",
            applicationError
          );
        }

        setApplications(applicationData || []);
      } else {
        setApplications([]);
      }

      // ========================================================
      // SUBSCRIPTION
      // ========================================================

      await loadSubscription(companyData.id);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // LOAD SUBSCRIPTION
  // ==========================================================

  async function loadSubscription(companyId) {
    try {
      setSubscriptionLoading(true);

      const { data, error } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Subscription loading error:",
          error
        );

        setSubscription(null);
        return;
      }

      setSubscription(data || null);
    } catch (err) {
      console.error(
        "Subscription error:",
        err
      );

      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {
    await supabase.auth.signOut();

    if (typeof window !== "undefined") {
      localStorage.removeItem("gradlink_profile");
    }

    router.push("/login");
  }

  // ==========================================================
  // APPLICATION COUNTS
  // ==========================================================

  const totalApplications =
    applications.length;

  const shortlisted =
    applications.filter(
      (app) =>
        String(app.status || "").toLowerCase() ===
        "shortlisted"
    ).length;

  const rejected =
    applications.filter(
      (app) =>
        String(app.status || "").toLowerCase() ===
        "rejected"
    ).length;

  // ==========================================================
  // PREMIUM STATUS
  // ==========================================================

  const isPremiumActive =
    subscription?.status === "active";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f8fc",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "20px",
            boxShadow:
              "0 10px 35px rgba(0,0,0,0.08)",
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

          <h2
            style={{
              margin: 0,
              color: "#123",
            }}
          >
            Loading Company Dashboard...
          </h2>

          <p
            style={{
              color: "#667085",
            }}
          >
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !company) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f8fc",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "60px auto",
            background: "#fff",
            padding: "35px",
            borderRadius: "20px",
            boxShadow:
              "0 10px 35px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Dashboard Error</h2>

          <p
            style={{
              color: "#b42318",
            }}
          >
            {error}
          </p>

          <Link
            href="/company"
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "12px 20px",
              background: "#1261ff",
              color: "#fff",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Company Profile
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f5f9ff 0%, #ffffff 55%)",
        color: "#122033",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e7edf5",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "auto",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: "900",
                color: "#1261ff",
                fontSize: "20px",
              }}
            >
              GRADLINK SA
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#667085",
                fontWeight: "700",
                letterSpacing: "1px",
              }}
            >
              RECRUITMENT PORTAL
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: "none",
                color: "#344054",
                fontWeight: "600",
                padding: "9px 12px",
              }}
            >
              Home
            </Link>

            <Link
              href="/company"
              style={{
                textDecoration: "none",
                color: "#344054",
                fontWeight: "600",
                padding: "9px 12px",
              }}
            >
              Company Profile
            </Link>

            <button
              onClick={logout}
              style={{
                border: "none",
                background: "#eef4ff",
                color: "#1261ff",
                padding: "9px 14px",
                borderRadius: "9px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "35px 20px 70px",
        }}
      >
        {/* ====================================================
            TITLE
        ==================================================== */}

        <section
          style={{
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              color: "#1261ff",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "1px",
              marginBottom: "8px",
            }}
          >
            COMPANY DASHBOARD
          </div>

          <h1
            style={{
              fontSize:
                "clamp(28px, 5vw, 42px)",
              margin: 0,
              fontWeight: "900",
            }}
          >
            Welcome,{" "}
            {company?.company_name ||
              "Company"}{" "}
            👋
          </h1>

          <p
            style={{
              color: "#667085",
              marginTop: "10px",
              fontSize: "16px",
            }}
          >
            Manage your internships and
            discover talented graduates.
          </p>
        </section>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <Link
            href="/internships"
            style={{
              textDecoration: "none",
              background: "#1261ff",
              color: "#fff",
              padding: "13px 20px",
              borderRadius: "11px",
              fontWeight: "800",
            }}
          >
            + Post Internship
          </Link>

          <Link
            href="/company"
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#1261ff",
              border: "1px solid #d6e1f0",
              padding: "13px 20px",
              borderRadius: "11px",
              fontWeight: "800",
            }}
          >
            Edit Company Profile
          </Link>

          <Link
            href="/company/pricing"
            style={{
              textDecoration: "none",
              background: "#111827",
              color: "#fff",
              padding: "13px 20px",
              borderRadius: "11px",
              fontWeight: "800",
            }}
          >
            💎 View Premium Plans
          </Link>
        </section>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "25px",
          }}
        >
          <StatCard
            icon="💼"
            title="Internships"
            value={internships.length}
          />

          <StatCard
            icon="👥"
            title="Applications"
            value={totalApplications}
          />

          <StatCard
            icon="⭐"
            title="Shortlisted"
            value={shortlisted}
          />

          <StatCard
            icon="❌"
            title="Rejected"
            value={rejected}
          />
        </section>

        {/* ====================================================
            GRADLINK PREMIUM
        ==================================================== */}

        <section
          style={{
            marginBottom: "35px",
            borderRadius: "22px",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #07152f, #123f88)",
            color: "#fff",
            boxShadow:
              "0 18px 45px rgba(18, 61, 135, 0.20)",
          }}
        >
          <div
            style={{
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent:
                  "space-between",
                gap: "20px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  flex: "1 1 400px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    background:
                      "rgba(255,255,255,0.12)",
                    border:
                      "1px solid rgba(255,255,255,0.18)",
                    padding: "7px 11px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "800",
                    marginBottom: "12px",
                  }}
                >
                  💎 GRADLINK PREMIUM
                </div>

                <h2
                  style={{
                    fontSize: "28px",
                    margin:
                      "0 0 8px",
                  }}
                >
                  Premium Recruitment Tools
                </h2>

                <p
                  style={{
                    color:
                      "rgba(255,255,255,0.78)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Unlock advanced tools designed
                  to help your company screen
                  and evaluate applicants more
                  efficiently.
                </p>
              </div>

              <div
                style={{
                  minWidth: "180px",
                  background:
                    "rgba(255,255,255,0.10)",
                  border:
                    "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.75,
                    marginBottom: "6px",
                  }}
                >
                  CURRENT STATUS
                </div>

                {subscriptionLoading ? (
                  <strong>
                    Checking...
                  </strong>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "900",
                        color: isPremiumActive
                          ? "#7ff0b0"
                          : "#ffd27a",
                      }}
                    >
                      {isPremiumActive
                        ? "● Active"
                        : "● Inactive"}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "14px",
                        opacity: 0.8,
                      }}
                    >
                      {subscription?.plan ||
                        "No active plan"}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                height: "1px",
                background:
                  "rgba(255,255,255,0.13)",
                margin: "25px 0",
              }}
            />

            {/* PREMIUM DETAILS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px",
              }}
            >
              <PremiumFeature
                icon="🤖"
                title="AI Document Verification"
                text="Advanced document verification tools."
              />

              <PremiumFeature
                icon="📄"
                title="CV & Qualification Checks"
                text="Review submitted applicant documents."
              />

              <PremiumFeature
                icon="🔎"
                title="Advanced Applicant Screening"
                text="More powerful applicant analysis."
              />
            </div>

            {/* SUBSCRIPTION INFO */}

            {subscription && (
              <div
                style={{
                  marginTop: "22px",
                  background:
                    "rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                }}
              >
                <SubscriptionDetail
                  title="Plan"
                  value={
                    subscription.plan ||
                    "Not selected"
                  }
                />

                <SubscriptionDetail
                  title="Monthly Price"
                  value={
                    subscription.monthly_price != null
                      ? `R${subscription.monthly_price}`
                      : "—"
                  }
                />

                <SubscriptionDetail
                  title="Period Start"
                  value={formatDate(
                    subscription.current_period_start
                  )}
                />

                <SubscriptionDetail
                  title="Period End"
                  value={formatDate(
                    subscription.current_period_end
                  )}
                />
              </div>
            )}

            {/* BUTTON */}

            <div
              style={{
                marginTop: "25px",
              }}
            >
              <Link
                href="/company/pricing"
                style={{
                  display: "inline-block",
                  background: "#fff",
                  color: "#123f88",
                  textDecoration: "none",
                  padding: "13px 21px",
                  borderRadius: "11px",
                  fontWeight: "900",
                }}
              >
                {isPremiumActive
                  ? "Manage Premium"
                  : "View Plans / Upgrade"}
              </Link>
            </div>

            {!isPremiumActive && (
              <p
                style={{
                  fontSize: "12px",
                  color:
                    "rgba(255,255,255,0.62)",
                  marginTop: "14px",
                  marginBottom: 0,
                }}
              >
                Selecting a plan does not
                automatically activate Premium.
                Premium features require an
                active verified subscription.
              </p>
            )}
          </div>
        </section>

        {/* ====================================================
            INTERNSHIPS
        ==================================================== */}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "25px",
                }}
              >
                Your Internships
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#667085",
                }}
              >
                Manage your posted internship
                opportunities.
              </p>
            </div>

            <Link
              href="/internships"
              style={{
                textDecoration: "none",
                color: "#1261ff",
                fontWeight: "800",
              }}
            >
              + Post New
            </Link>
          </div>

          {internships.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border:
                  "1px dashed #cbd5e1",
                borderRadius: "18px",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "10px",
                }}
              >
                💼
              </div>

              <h3>
                No internships yet
              </h3>

              <p
                style={{
                  color: "#667085",
                }}
              >
                Post your first internship
                and start receiving applications.
              </p>

              <Link
                href="/internships"
                style={{
                  display: "inline-block",
                  background: "#1261ff",
                  color: "#fff",
                  padding: "12px 18px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "800",
                }}
              >
                Post Internship
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {internships.map(
                (internship) => {
                  const count =
                    applications.filter(
                      (app) =>
                        String(
                          app.internship_id
                        ) ===
                        String(
                          internship.id
                        )
                    ).length;

                  return (
                    <div
                      key={internship.id}
                      style={{
                        background: "#fff",
                        border:
                          "1px solid #e6ebf2",
                        borderRadius: "18px",
                        padding: "22px",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent:
                            "space-between",
                          gap: "18px",
                        }}
                      >
                        <div
                          style={{
                            flex: "1 1 450px",
                          }}
                        >
                          <h3
                            style={{
                              margin:
                                "0 0 8px",
                              fontSize: "21px",
                            }}
                          >
                            {internship.job_title ||
                              "Internship"}
                          </h3>

                          <div
                            style={{
                              color: "#667085",
                              fontSize: "14px",
                              lineHeight: 1.8,
                            }}
                          >
                            📍{" "}
                            {internship.location ||
                              internship.province ||
                              "Location not specified"}

                            <br />

                            💰{" "}
                            {internship.stipend ||
                              "Stipend not specified"}

                            <br />

                            🎓{" "}
                            {internship.qualification ||
                              "Qualification not specified"}

                            <br />

                            📅 Deadline:{" "}
                            {formatDate(
                              internship.deadline
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection:
                              "column",
                            alignItems:
                              "flex-end",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              background:
                                "#eef4ff",
                              color: "#1261ff",
                              padding:
                                "9px 13px",
                              borderRadius:
                                "999px",
                              fontWeight:
                                "800",
                              fontSize: "13px",
                            }}
                          >
                            👥 {count}{" "}
                            Application
                            {count !== 1
                              ? "s"
                              : ""}
                          </div>

                          <Link
                            href={`/company/internships/${internship.id}/applicants`}
                            style={{
                              background:
                                "#1261ff",
                              color: "#fff",
                              textDecoration:
                                "none",
                              padding:
                                "11px 17px",
                              borderRadius:
                                "10px",
                              fontWeight:
                                "800",
                            }}
                          >
                            View Applicants →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer
          style={{
            marginTop: "60px",
            paddingTop: "25px",
            borderTop:
              "1px solid #e7edf5",
            color: "#667085",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} GradLink
          SA — Connecting South African
          graduates with opportunities.
        </footer>
      </div>
    </main>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e6ebf2",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
          "0 8px 25px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "900",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#667085",
          fontSize: "14px",
          marginTop: "4px",
        }}
      >
        {title}
      </div>
    </div>
  );
}

// ============================================================
// PREMIUM FEATURE
// ============================================================

function PremiumFeature({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,0.08)",
        border:
          "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        padding: "17px",
      }}
    >
      <div
        style={{
          fontSize: "25px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontWeight: "900",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color:
            "rgba(255,255,255,0.70)",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ============================================================
// SUBSCRIPTION DETAIL
// ============================================================

function SubscriptionDetail({
  title,
  value,
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color:
            "rgba(255,255,255,0.55)",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontWeight: "800",
          fontSize: "14px",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}