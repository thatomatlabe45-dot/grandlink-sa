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

  if (text.includes("phd") || text.includes("doctorate")) return 6;
  if (text.includes("master") || text.includes("postgrad")) return 6;
  if (text.includes("honours") || text.includes("honors")) return 5;
  if (text.includes("degree") || text.includes("bachelor")) return 4;
  if (text.includes("diploma") || text.includes("national diploma")) return 3;
  if (text.includes("certificate")) return 2;
  if (text.includes("matric") || text.includes("grade 12")) return 1;

  return 0;
}

// ============================================================
// AI MATCHING
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

  const applicantSkills = String(application?.skills || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const requiredSkills = String(internship?.skills || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

  if (
    requiredField &&
    applicantField &&
    (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    )
  ) {
    fieldScore = 35;
  } else if (requiredField && applicantField) {
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
// MAIN DASHBOARD
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
  // LOAD DASHBOARD
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

      if (authError) throw authError;

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // --------------------------------------------------------
      // COMPANY
      // --------------------------------------------------------

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) throw companyError;

      if (!companyData) {
        setError(
          "Company profile not found. Please complete your company profile."
        );

        setLoading(false);
        return;
      }

      setCompany(companyData);

      // --------------------------------------------------------
      // INTERNSHIPS
      // --------------------------------------------------------

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
        .order("created_at", {
          ascending: false,
        });

      if (internshipError) {
        console.error(
          "Internship loading error:",
          internshipError
        );
      }

      const loadedInternships =
        internshipData || [];

      setInternships(loadedInternships);

      // --------------------------------------------------------
      // APPLICATIONS
      // --------------------------------------------------------

      if (loadedInternships.length > 0) {
        const internshipIds =
          loadedInternships.map(
            (item) => item.id
          );

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
          .order("created_at", {
            ascending: false,
          });

        if (applicationError) {
          console.error(
            "Application loading error:",
            applicationError
          );
        }

        setApplications(
          applicationData || []
        );
      } else {
        setApplications([]);
      }

      // --------------------------------------------------------
      // SUBSCRIPTION
      // --------------------------------------------------------

      await loadSubscription(
        companyData.id
      );
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
  // SUBSCRIPTION
  // ==========================================================

  async function loadSubscription(companyId) {
    try {
      setSubscriptionLoading(true);

      const {
        data,
        error,
      } = await supabase
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
      localStorage.removeItem(
        "gradlink_profile"
      );
    }

    router.push("/login");
  }

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalApplications =
    applications.length;

  const shortlisted =
    applications.filter(
      (app) =>
        String(
          app.status || ""
        ).toLowerCase() ===
        "shortlisted"
    ).length;

  const rejected =
    applications.filter(
      (app) =>
        String(
          app.status || ""
        ).toLowerCase() ===
        "rejected"
    ).length;

  const pending =
    applications.filter(
      (app) => {
        const status =
          String(
            app.status || ""
          ).toLowerCase();

        return (
          status !== "shortlisted" &&
          status !== "rejected"
        );
      }
    ).length;

  // ==========================================================
  // PREMIUM
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
          background:
            "linear-gradient(135deg,#eef5ff,#ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#fff",
            borderRadius: "26px",
            padding: "40px 28px",
            textAlign: "center",
            boxShadow:
              "0 25px 70px rgba(18,97,255,0.12)",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              margin: "0 auto 18px",
              borderRadius: "22px",
              background:
                "linear-gradient(135deg,#1261ff,#3d8bff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "32px",
            }}
          >
            🏢
          </div>

          <h2
            style={{
              margin: 0,
              color: "#101828",
              fontSize: "23px",
            }}
          >
            Loading your dashboard
          </h2>

          <p
            style={{
              color: "#667085",
              marginBottom: 0,
            }}
          >
            Preparing your recruitment portal...
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
            maxWidth: "650px",
            margin: "70px auto",
            background: "#fff",
            padding: "40px",
            borderRadius: "24px",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "15px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              marginTop: 0,
              color: "#101828",
            }}
          >
            Dashboard Error
          </h2>

          <p
            style={{
              color: "#b42318",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>

          <Link
            href="/company"
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "13px 20px",
              background: "#1261ff",
              color: "#fff",
              borderRadius: "11px",
              textDecoration: "none",
              fontWeight: "800",
            }}
          >
            Company Profile
          </Link>
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
          "linear-gradient(180deg,#f4f8ff 0%,#ffffff 38%,#f8fafc 100%)",
        color: "#101828",
      }}
    >
      {/* ======================================================
          TOP NAVIGATION
      ====================================================== */}

      <header
        style={{
          background:
            "rgba(255,255,255,0.94)",
          backdropFilter: "blur(14px)",
          borderBottom:
            "1px solid #e7edf5",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "auto",
            padding:
              "15px 20px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* BRAND */}

          <Link
            href="/company-dashboard"
            style={{
              textDecoration: "none",
              color: "inherit",
              minWidth: "170px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg,#1261ff,#4b91ff)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  boxShadow:
                    "0 7px 18px rgba(18,97,255,0.25)",
                }}
              >
                G
              </div>

              <div>
                <div
                  style={{
                    fontWeight: "950",
                    color: "#1261ff",
                    fontSize: "17px",
                    lineHeight: 1,
                  }}
                >
                  GRADLINK SA
                </div>

                <div
                  style={{
                    fontSize: "9px",
                    color: "#667085",
                    fontWeight: "800",
                    letterSpacing: "1.3px",
                    marginTop: "4px",
                  }}
                >
                  RECRUITMENT PORTAL
                </div>
              </div>
            </div>
          </Link>

          {/* NAV */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Link
              href="/"
              style={navLinkStyle}
            >
              Home
            </Link>

            <Link
              href="/company"
              style={navLinkStyle}
            >
              Company Profile
            </Link>

            <Link
              href="/company-pricing"
              style={{
                ...navLinkStyle,
                color: "#1261ff",
              }}
            >
              💎 Premium
            </Link>

            <button
              onClick={logout}
              style={{
                border: "1px solid #dce5f2",
                background: "#f7faff",
                color: "#344054",
                padding: "9px 14px",
                borderRadius: "10px",
                fontWeight: "800",
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
          maxWidth: "1240px",
          margin: "auto",
          padding:
            "32px 20px 70px",
        }}
      >
        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            padding:
              "34px 32px",
            marginBottom: "22px",
            background:
              "linear-gradient(135deg,#071b3d 0%,#0d3f8f 58%,#1261ff 100%)",
            color: "#fff",
            boxShadow:
              "0 22px 55px rgba(18,61,135,0.20)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.07)",
              right: "-70px",
              top: "-110px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.05)",
              right: "130px",
              bottom: "-110px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding:
                  "7px 11px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.15)",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1px",
                marginBottom: "13px",
              }}
            >
              COMPANY DASHBOARD
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(28px,5vw,42px)",
                lineHeight: 1.1,
                fontWeight: "950",
                maxWidth: "800px",
              }}
            >
              Welcome,{" "}
              {company?.company_name ||
                "Company"}{" "}
              👋
            </h1>

            <p
              style={{
                color:
                  "rgba(255,255,255,0.78)",
                margin:
                  "12px 0 0",
                fontSize: "16px",
                lineHeight: 1.6,
                maxWidth: "650px",
              }}
            >
              Manage your internship
              opportunities, review applicants
              and build your future talent
              pipeline from one place.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "23px",
              }}
            >
              <Link
                href="/internships"
                style={{
                  background: "#fff",
                  color: "#1261ff",
                  padding:
                    "12px 18px",
                  borderRadius: "11px",
                  textDecoration:
                    "none",
                  fontWeight: "900",
                }}
              >
                + Post Internship
              </Link>

              <Link
                href="/company"
                style={{
                  background:
                    "rgba(255,255,255,0.10)",
                  color: "#fff",
                  border:
                    "1px solid rgba(255,255,255,0.18)",
                  padding:
                    "12px 18px",
                  borderRadius: "11px",
                  textDecoration:
                    "none",
                  fontWeight: "800",
                }}
              >
                Edit Company Profile
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <StatCard
            icon="💼"
            title="Internships"
            value={internships.length}
            description="Posted opportunities"
            accent="#1261ff"
          />

          <StatCard
            icon="👥"
            title="Applications"
            value={totalApplications}
            description="Total candidates"
            accent="#7c3aed"
          />

          <StatCard
            icon="⭐"
            title="Shortlisted"
            value={shortlisted}
            description="Candidates selected"
            accent="#059669"
          />

          <StatCard
            icon="⏳"
            title="Pending Review"
            value={pending}
            description="Need your attention"
            accent="#d97706"
          />
        </section>

        {/* ====================================================
            PREMIUM
        ==================================================== */}

        <section
          style={{
            marginBottom: "28px",
            borderRadius: "25px",
            overflow: "hidden",
            background: "#fff",
            border:
              "1px solid #e4eaf3",
            boxShadow:
              "0 16px 45px rgba(15,42,80,0.08)",
          }}
        >
          <div
            style={{
              padding:
                "25px",
              background:
                "linear-gradient(135deg,#07152f,#0d397f)",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <div
                style={{
                  flex:
                    "1 1 500px",
                }}
              >
                <div
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "7px",
                    background:
                      "rgba(255,255,255,0.10)",
                    border:
                      "1px solid rgba(255,255,255,0.15)",
                    padding:
                      "7px 11px",
                    borderRadius:
                      "999px",
                    fontSize:
                      "11px",
                    fontWeight:
                      "900",
                    letterSpacing:
                      "0.5px",
                  }}
                >
                  💎 GRADLINK PREMIUM
                </div>

                <h2
                  style={{
                    margin:
                      "13px 0 7px",
                    fontSize:
                      "27px",
                    fontWeight:
                      "950",
                  }}
                >
                  Your Recruitment Advantage
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      "rgba(255,255,255,0.72)",
                    lineHeight: 1.6,
                    maxWidth:
                      "650px",
                  }}
                >
                  Powerful tools to help
                  your company verify,
                  screen and evaluate
                  graduate applications.
                </p>
              </div>

              <div
                style={{
                  minWidth:
                    "175px",
                  borderRadius:
                    "16px",
                  padding:
                    "17px",
                  background:
                    "rgba(255,255,255,0.09)",
                  border:
                    "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "10px",
                    letterSpacing:
                      "1px",
                    fontWeight:
                      "800",
                    opacity:
                      0.65,
                  }}
                >
                  SUBSCRIPTION
                </div>

                {subscriptionLoading ? (
                  <div
                    style={{
                      marginTop:
                        "9px",
                      fontWeight:
                        "800",
                    }}
                  >
                    Checking...
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontSize:
                          "20px",
                        fontWeight:
                          "950",
                        color:
                          isPremiumActive
                            ? "#72f2a8"
                            : "#ffd27a",
                      }}
                    >
                      {isPremiumActive
                        ? "● Active"
                        : "● Inactive"}
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        color:
                          "rgba(255,255,255,0.70)",
                        fontSize:
                          "13px",
                      }}
                    >
                      {subscription?.plan ||
                        "No active plan"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding:
                "22px 25px 25px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(210px,1fr))",
                gap: "12px",
              }}
            >
              <PremiumFeature
                icon="🤖"
                title="AI Document Verification"
                text="Help verify submitted applicant documents."
              />

              <PremiumFeature
                icon="📄"
                title="CV & Qualification Checks"
                text="Review applicant documentation more efficiently."
              />

              <PremiumFeature
                icon="🔎"
                title="Advanced Applicant Screening"
                text="Use deeper applicant analysis tools."
              />
            </div>

            {subscription && (
              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "17px",
                  borderRadius:
                    "15px",
                  background:
                    "#f7faff",
                  border:
                    "1px solid #e4ebf6",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(150px,1fr))",
                  gap: "16px",
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
                    subscription.monthly_price !=
                    null
                      ? `R${subscription.monthly_price}`
                      : "—"
                  }
                />

                <SubscriptionDetail
                  title="Status"
                  value={
                    subscription.status ||
                    "—"
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

            <div
              style={{
                marginTop:
                  "19px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                {!isPremiumActive && (
                  <div
                    style={{
                      color:
                        "#667085",
                      fontSize:
                        "12px",
                      lineHeight:
                        1.5,
                    }}
                  >
                    Premium activates only after
                    a verified subscription payment.
                  </div>
                )}
              </div>

              <Link
                href="/company-pricing"
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap: "7px",
                  background:
                    isPremiumActive
                      ? "#eef4ff"
                      : "#1261ff",
                  color:
                    isPremiumActive
                      ? "#1261ff"
                      : "#fff",
                  padding:
                    "12px 18px",
                  borderRadius:
                    "11px",
                  textDecoration:
                    "none",
                  fontWeight:
                    "900",
                  border:
                    isPremiumActive
                      ? "1px solid #d6e4ff"
                      : "none",
                }}
              >
                {isPremiumActive
                  ? "Manage Premium →"
                  : "View Plans / Upgrade →"}
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            INTERNSHIPS HEADER
        ==================================================== */}

        <section
          style={{
            marginTop:
              "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "flex-end",
              justifyContent:
                "space-between",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom:
                "15px",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    "#1261ff",
                  fontSize:
                    "11px",
                  fontWeight:
                    "900",
                  letterSpacing:
                    "1px",
                  marginBottom:
                    "5px",
                }}
              >
                RECRUITMENT PIPELINE
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "27px",
                  fontWeight:
                    "950",
                }}
              >
                Your Internships
              </h2>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color:
                    "#667085",
                }}
              >
                Track your opportunities
                and manage applicants.
              </p>
            </div>

            <Link
              href="/internships"
              style={{
                textDecoration:
                  "none",
                color:
                  "#1261ff",
                fontWeight:
                  "900",
                padding:
                  "10px 14px",
                borderRadius:
                  "10px",
                background:
                  "#eef4ff",
              }}
            >
              + Post New Internship
            </Link>
          </div>

          {/* ==================================================
              INTERNSHIP LIST
          ================================================== */}

          {internships.length === 0 ? (
            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px dashed #cbd5e1",
                borderRadius:
                  "22px",
                padding:
                  "55px 25px",
                textAlign:
                  "center",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width:
                    "70px",
                  height:
                    "70px",
                  margin:
                    "0 auto 15px",
                  borderRadius:
                    "20px",
                  background:
                    "#eef4ff",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize:
                    "32px",
                }}
              >
                💼
              </div>

              <h3
                style={{
                  margin:
                    "0 0 8px",
                  fontSize:
                    "21px",
                }}
              >
                No internships yet
              </h3>

              <p
                style={{
                  color:
                    "#667085",
                  maxWidth:
                    "480px",
                  margin:
                    "0 auto 20px",
                  lineHeight:
                    1.6,
                }}
              >
                Post your first internship
                and start building your
                graduate talent pipeline.
              </p>

              <Link
                href="/internships"
                style={{
                  display:
                    "inline-block",
                  background:
                    "#1261ff",
                  color:
                    "#fff",
                  padding:
                    "12px 19px",
                  borderRadius:
                    "11px",
                  textDecoration:
                    "none",
                  fontWeight:
                    "900",
                }}
              >
                Post Internship →
              </Link>
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

                  const shortlistedForJob =
                    applications.filter(
                      (app) =>
                        String(
                          app.internship_id
                        ) ===
                          String(
                            internship.id
                          ) &&
                        String(
                          app.status || ""
                        ).toLowerCase() ===
                          "shortlisted"
                    ).length;

                  return (
                    <div
                      key={
                        internship.id
                      }
                      style={{
                        background:
                          "#fff",
                        border:
                          "1px solid #e5eaf2",
                        borderRadius:
                          "20px",
                        padding:
                          "22px",
                        boxShadow:
                          "0 9px 30px rgba(15,42,80,0.045)",
                        transition:
                          "transform .2s ease, box-shadow .2s ease",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap:
                            "20px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            flex:
                              "1 1 450px",
                            minWidth:
                              0,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap:
                                "9px",
                              flexWrap:
                                "wrap",
                              marginBottom:
                                "8px",
                            }}
                          >
                            <span
                              style={{
                                background:
                                  "#eef4ff",
                                color:
                                  "#1261ff",
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  "900",
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Internship
                            </span>

                            {internship.internship_type && (
                              <span
                                style={{
                                  background:
                                    "#f2f4f7",
                                  color:
                                    "#475467",
                                  padding:
                                    "5px 9px",
                                  borderRadius:
                                    "999px",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    "800",
                                }}
                              >
                                {
                                  internship.internship_type
                                }
                              </span>
                            )}
                          </div>

                          <h3
                            style={{
                              margin:
                                "0 0 7px",
                              fontSize:
                                "21px",
                              fontWeight:
                                "900",
                              color:
                                "#101828",
                            }}
                          >
                            {internship.job_title ||
                              "Internship"}
                          </h3>

                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap:
                                "7px 14px",
                              color:
                                "#667085",
                              fontSize:
                                "13px",
                              lineHeight:
                                1.6,
                            }}
                          >
                            <span>
                              📍{" "}
                              {internship.location ||
                                internship.province ||
                                "Location not specified"}
                            </span>

                            <span>
                              💰{" "}
                              {internship.stipend ||
                                "Stipend not specified"}
                            </span>

                            <span>
                              🎓{" "}
                              {internship.qualification ||
                                "Qualification not specified"}
                            </span>

                            <span>
                              📅{" "}
                              {formatDate(
                                internship.deadline
                              )}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT SIDE */}

                        <div
                          style={{
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            alignItems:
                              "flex-end",
                            gap:
                              "9px",
                            minWidth:
                              "185px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "7px",
                              flexWrap:
                                "wrap",
                              justifyContent:
                                "flex-end",
                            }}
                          >
                            <MiniBadge
                              icon="👥"
                              value={
                                `${count} Application${
                                  count !== 1
                                    ? "s"
                                    : ""
                                }`
                              }
                            />

                            {shortlistedForJob >
                              0 && (
                              <MiniBadge
                                icon="⭐"
                                value={`${shortlistedForJob} Shortlisted`}
                                green
                              />
                            )}
                          </div>

                          <Link
                            href={`/company/internships/${internship.id}/applicants`}
                            style={{
                              background:
                                "#1261ff",
                              color:
                                "#fff",
                              textDecoration:
                                "none",
                              padding:
                                "11px 17px",
                              borderRadius:
                                "10px",
                              fontWeight:
                                "900",
                              fontSize:
                                "13px",
                              boxShadow:
                                "0 7px 18px rgba(18,97,255,0.20)",
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
            PREMIUM CALL TO ACTION
        ==================================================== */}

        {!isPremiumActive && (
          <section
            style={{
              marginTop:
                "25px",
              borderRadius:
                "20px",
              padding:
                "22px",
              background:
                "linear-gradient(135deg,#eef5ff,#f8fbff)",
              border:
                "1px solid #dce8fa",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap:
                "18px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight:
                    "950",
                  fontSize:
                    "18px",
                  color:
                    "#123f88",
                }}
              >
                Ready to upgrade your recruitment?
              </div>

              <div
                style={{
                  color:
                    "#667085",
                  fontSize:
                    "13px",
                  marginTop:
                    "4px",
                }}
              >
                Unlock GradLink Premium
                tools for your company.
              </div>
            </div>

            <Link
              href="/company-pricing"
              style={{
                background:
                  "#1261ff",
                color:
                  "#fff",
                textDecoration:
                  "none",
                padding:
                  "12px 18px",
                borderRadius:
                  "10px",
                fontWeight:
                  "900",
              }}
            >
              Explore Premium →
            </Link>
          </section>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer
          style={{
            marginTop:
              "55px",
            paddingTop:
              "25px",
            borderTop:
              "1px solid #e6ebf2",
            color:
              "#667085",
            fontSize:
              "12px",
            textAlign:
              "center",
          }}
        >
          <strong
            style={{
              color:
                "#1261ff",
            }}
          >
            GRADLINK SA
          </strong>{" "}
          — Connecting South African
          graduates with opportunities.
          <div
            style={{
              marginTop:
                "6px",
            }}
          >
            ©{" "}
            {new Date().getFullYear()}{" "}
            GradLink SA
          </div>
        </footer>
      </div>
    </main>
  );
}

// ============================================================
// NAV LINK
// ============================================================

const navLinkStyle = {
  textDecoration: "none",
  color: "#344054",
  fontWeight: "800",
  padding: "9px 11px",
  borderRadius: "9px",
};

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  title,
  value,
  description,
  accent,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #e5eaf2",
        borderRadius:
          "19px",
        padding:
          "19px",
        boxShadow:
          "0 8px 28px rgba(15,42,80,0.045)",
        position:
          "relative",
        overflow:
          "hidden",
      }}
    >
      <div
        style={{
          position:
            "absolute",
          width:
            "70px",
          height:
            "70px",
          borderRadius:
            "50%",
          background:
            `${accent}12`,
          right:
            "-20px",
          top:
            "-20px",
        }}
      />

      <div
        style={{
          position:
            "relative",
          zIndex:
            2,
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
          }}
        >
          <div
            style={{
              width:
                "43px",
              height:
                "43px",
              borderRadius:
                "13px",
              background:
                `${accent}12`,
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize:
                "21px",
            }}
          >
            {icon}
          </div>

          <div
            style={{
              width:
                "7px",
              height:
                "7px",
              borderRadius:
                "50%",
              background:
                accent,
            }}
          />
        </div>

        <div
          style={{
            fontSize:
              "30px",
            fontWeight:
              "950",
            marginTop:
              "15px",
            lineHeight:
              1,
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize:
              "14px",
            fontWeight:
              "850",
            marginTop:
              "7px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color:
              "#98a2b3",
            fontSize:
              "11px",
            marginTop:
              "4px",
          }}
        >
          {description}
        </div>
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
        border:
          "1px solid #e7edf5",
        borderRadius:
          "15px",
        padding:
          "15px",
        background:
          "#fbfdff",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "10px",
          marginBottom:
            "7px",
        }}
      >
        <div
          style={{
            width:
              "36px",
            height:
              "36px",
            borderRadius:
              "10px",
            background:
              "#eef4ff",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize:
              "18px",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            fontWeight:
              "900",
            color:
              "#101828",
            fontSize:
              "13px",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          color:
            "#667085",
          fontSize:
            "12px",
          lineHeight:
            1.5,
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
          color:
            "#98a2b3",
          fontSize:
            "10px",
          fontWeight:
            "800",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.5px",
          marginBottom:
            "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color:
            "#344054",
          fontWeight:
            "850",
          fontSize:
            "13px",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ============================================================
// MINI BADGE
// ============================================================

function MiniBadge({
  icon,
  value,
  green = false,
}) {
  return (
    <div
      style={{
        background:
          green
            ? "#ecfdf3"
            : "#eef4ff",
        color:
          green
            ? "#027a48"
            : "#1261ff",
        padding:
          "7px 9px",
        borderRadius:
          "999px",
        fontSize:
          "11px",
        fontWeight:
          "850",
        whiteSpace:
          "nowrap",
      }}
    >
      {icon} {value}
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
    return new Date(value).toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "—";
  }
}