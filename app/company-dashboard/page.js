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
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top,#e9f2ff 0%,#f7faff 35%,#ffffff 75%)",
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
            background: "#ffffff",
            borderRadius: "28px",
            padding: "42px 28px",
            textAlign: "center",
            border: "1px solid #e6edf7",
            boxShadow:
              "0 30px 80px rgba(18,97,255,0.12)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 18px",
              borderRadius: "22px",
              background:
                "linear-gradient(135deg,#0b3b91,#1261ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "32px",
              boxShadow:
                "0 14px 30px rgba(18,97,255,0.25)",
            }}
          >
            🏢
          </div>

          <h2
            style={{
              margin: 0,
              color: "#101828",
              fontSize: "23px",
              fontWeight: "950",
            }}
          >
            Loading your dashboard
          </h2>

          <p
            style={{
              color: "#667085",
              marginBottom: 0,
              lineHeight: 1.6,
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
          background:
            "linear-gradient(180deg,#f4f8ff,#ffffff)",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "650px",
            margin: "70px auto",
            background: "#fff",
            padding: "40px",
            borderRadius: "26px",
            border: "1px solid #e6edf5",
            boxShadow:
              "0 25px 70px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "17px",
              background: "#fff4ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              marginBottom: "18px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              marginTop: 0,
              color: "#101828",
              fontWeight: "950",
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
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "15px",
              padding: "13px 20px",
              background:
                "linear-gradient(135deg,#1261ff,#0d4ed8)",
              color: "#fff",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "900",
              boxShadow:
                "0 10px 22px rgba(18,97,255,0.22)",
            }}
          >
            Company Profile →
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
          "linear-gradient(180deg,#f3f7ff 0%,#ffffff 38%,#f8fafc 100%)",
        color: "#101828",
      }}
    >
      {/* ======================================================
          TOP NAVIGATION
      ====================================================== */}

      <header
        style={{
          background:
            "rgba(255,255,255,0.92)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom:
            "1px solid rgba(220,228,240,0.85)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow:
            "0 5px 24px rgba(15,42,80,0.045)",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "auto",
            padding: "13px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* ==================================================
              PREMIUM BRAND
          ================================================== */}

          <Link
            href="/company-dashboard"
            style={{
              textDecoration: "none",
              color: "inherit",
              minWidth: "185px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
              }}
            >
              <div
                style={{
                  width: "43px",
                  height: "43px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(145deg,#0b3b91,#1261ff 65%,#4c92ff)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "950",
                  fontSize: "19px",
                  boxShadow:
                    "0 9px 22px rgba(18,97,255,0.28)",
                  border:
                    "1px solid rgba(255,255,255,0.3)",
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
                    letterSpacing: "-0.3px",
                  }}
                >
                  GRADLINK SA
                </div>

                <div
                  style={{
                    fontSize: "9px",
                    color: "#667085",
                    fontWeight: "850",
                    letterSpacing: "1.4px",
                    marginTop: "5px",
                  }}
                >
                  RECRUITMENT PORTAL
                </div>
              </div>
            </div>
          </Link>

          {/* ==================================================
              PREMIUM NAVIGATION
          ================================================== */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Link
              href="/"
              style={navLinkStyle}
            >
              <span style={navIconStyle}>⌂</span>
              Home
            </Link>

            <Link
              href="/company"
              style={navLinkStyle}
            >
              <span style={navIconStyle}>🏢</span>
              Company Profile
            </Link>

            <Link
              href="/company-pricing"
              style={{
                ...navPremiumStyle,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "22px",
                  height: "22px",
                  borderRadius: "7px",
                  background:
                    "rgba(18,97,255,0.10)",
                  fontSize: "12px",
                }}
              >
                💎
              </span>
              Premium
            </Link>

            <button
              onClick={logout}
              style={logoutButtonStyle}
            >
              <span
                style={{
                  fontSize: "14px",
                }}
              >
                ↪
              </span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1240px",
          margin: "auto",
          padding: "32px 20px 70px",
        }}
      >
        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "30px",
            padding: "38px 34px",
            marginBottom: "22px",
            background:
              "linear-gradient(135deg,#061633 0%,#0a3478 50%,#1261ff 100%)",
            color: "#fff",
            boxShadow:
              "0 25px 65px rgba(18,61,135,0.22)",
            border:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "310px",
              height: "310px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.065)",
              right: "-90px",
              top: "-135px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "rgba(83,153,255,0.10)",
              right: "100px",
              bottom: "-150px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "90px",
              height: "90px",
              borderRadius: "24px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              transform:
                "rotate(25deg)",
              right: "33%",
              top: "25px",
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
                alignItems: "center",
                gap: "7px",
                padding: "7px 12px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.16)",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "1.2px",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#72f2a8",
                  boxShadow:
                    "0 0 0 4px rgba(114,242,168,0.12)",
                }}
              />
              COMPANY DASHBOARD
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(28px,5vw,43px)",
                lineHeight: 1.08,
                fontWeight: "950",
                maxWidth: "820px",
                letterSpacing: "-1px",
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
                  "rgba(255,255,255,0.76)",
                margin: "13px 0 0",
                fontSize: "16px",
                lineHeight: 1.65,
                maxWidth: "680px",
              }}
            >
              Manage your internship opportunities,
              review applicants and build your future
              talent pipeline from one professional
              workspace.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "25px",
              }}
            >
              <Link
                href="/internships"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "#fff",
                  color: "#1261ff",
                  padding: "13px 19px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: "950",
                  boxShadow:
                    "0 10px 25px rgba(0,0,0,0.14)",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                Post Internship
              </Link>

              <Link
                href="/company"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background:
                    "rgba(255,255,255,0.10)",
                  color: "#fff",
                  border:
                    "1px solid rgba(255,255,255,0.20)",
                  padding: "13px 19px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: "850",
                  backdropFilter: "blur(8px)",
                }}
              >
                ⚙️
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
            marginBottom: "24px",
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
            marginBottom: "30px",
            borderRadius: "26px",
            overflow: "hidden",
            background: "#fff",
            border:
              "1px solid #e4eaf3",
            boxShadow:
              "0 18px 50px rgba(15,42,80,0.08)",
          }}
        >
          <div
            style={{
              padding: "27px",
              background:
                "linear-gradient(135deg,#06142d,#0b367c)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,0.045)",
                right: "-100px",
                top: "-130px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "20px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  flex: "1 1 500px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    background:
                      "rgba(255,255,255,0.10)",
                    border:
                      "1px solid rgba(255,255,255,0.15)",
                    padding: "7px 11px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "900",
                    letterSpacing: "0.6px",
                  }}
                >
                  💎 GRADLINK PREMIUM
                </div>

                <h2
                  style={{
                    margin: "14px 0 7px",
                    fontSize: "28px",
                    fontWeight: "950",
                    letterSpacing: "-0.5px",
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
                    maxWidth: "650px",
                  }}
                >
                  Powerful tools to help your company
                  verify, screen and evaluate graduate
                  applications.
                </p>
              </div>

              <div
                style={{
                  minWidth: "180px",
                  borderRadius: "17px",
                  padding: "18px",
                  background:
                    "rgba(255,255,255,0.09)",
                  border:
                    "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "1px",
                    fontWeight: "800",
                    opacity: 0.65,
                  }}
                >
                  SUBSCRIPTION
                </div>

                {subscriptionLoading ? (
                  <div
                    style={{
                      marginTop: "9px",
                      fontWeight: "800",
                    }}
                  >
                    Checking...
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "20px",
                        fontWeight: "950",
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
                        marginTop: "5px",
                        color:
                          "rgba(255,255,255,0.70)",
                        fontSize: "13px",
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
              padding: "22px 25px 25px",
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
                  marginTop: "18px",
                  padding: "17px",
                  borderRadius: "15px",
                  background: "#f7faff",
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
                    subscription.monthly_price != null
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
                marginTop: "19px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                {!isPremiumActive && (
                  <div
                    style={{
                      color: "#667085",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    Premium activates only after a
                    verified subscription payment.
                  </div>
                )}
              </div>

              <Link
                href="/company-pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  background:
                    isPremiumActive
                      ? "#eef4ff"
                      : "linear-gradient(135deg,#1261ff,#0d4ed8)",
                  color:
                    isPremiumActive
                      ? "#1261ff"
                      : "#fff",
                  padding: "12px 18px",
                  borderRadius: "11px",
                  textDecoration: "none",
                  fontWeight: "900",
                  border:
                    isPremiumActive
                      ? "1px solid #d6e4ff"
                      : "none",
                  boxShadow:
                    isPremiumActive
                      ? "none"
                      : "0 9px 20px rgba(18,97,255,0.20)",
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
            marginTop: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "17px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#1261ff",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "1.1px",
                  marginBottom: "6px",
                }}
              >
                RECRUITMENT PIPELINE
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "950",
                  letterSpacing: "-0.5px",
                }}
              >
                Your Internships
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#667085",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                Track your opportunities and manage
                applicants from one place.
              </p>
            </div>

            <Link
              href="/internships"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                textDecoration: "none",
                color: "#1261ff",
                fontWeight: "900",
                padding: "11px 15px",
                borderRadius: "11px",
                background: "#eef4ff",
                border: "1px solid #dce8fa",
              }}
            >
              <span
                style={{
                  fontSize: "17px",
                  lineHeight: 1,
                }}
              >
                +
              </span>
              Post New Internship
            </Link>
          </div>

          {/* ==================================================
              INTERNSHIP LIST
          ================================================== */}

          {internships.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px dashed #cbd5e1",
                borderRadius: "23px",
                padding: "58px 25px",
                textAlign: "center",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  margin: "0 auto 16px",
                  borderRadius: "21px",
                  background:
                    "linear-gradient(135deg,#eef4ff,#f5f8ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  border: "1px solid #e1eafa",
                }}
              >
                💼
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "21px",
                  fontWeight: "950",
                }}
              >
                No internships yet
              </h3>

              <p
                style={{
                  color: "#667085",
                  maxWidth: "480px",
                  margin: "0 auto 21px",
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                Post your first internship and start
                building your graduate talent pipeline.
              </p>

              <Link
                href="/internships"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background:
                    "linear-gradient(135deg,#1261ff,#0d4ed8)",
                  color: "#fff",
                  padding: "13px 20px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: "950",
                  boxShadow:
                    "0 10px 23px rgba(18,97,255,0.22)",
                }}
              >
                Post Internship
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "15px",
              }}
            >
              {internships.map((internship) => {
                const count =
                  applications.filter(
                    (app) =>
                      String(app.internship_id) ===
                      String(internship.id)
                  ).length;

                const shortlistedForJob =
                  applications.filter(
                    (app) =>
                      String(app.internship_id) ===
                        String(internship.id) &&
                      String(
                        app.status || ""
                      ).toLowerCase() ===
                        "shortlisted"
                  ).length;

                const pendingForJob =
                  applications.filter((app) => {
                    const sameInternship =
                      String(
                        app.internship_id
                      ) === String(internship.id);

                    const status = String(
                      app.status || ""
                    ).toLowerCase();

                    return (
                      sameInternship &&
                      status !== "shortlisted" &&
                      status !== "rejected"
                    );
                  }).length;

                return (
                  <div
                    key={internship.id}
                    style={{
                      background: "#fff",
                      border:
                        "1px solid #e3e9f2",
                      borderRadius: "21px",
                      padding: "22px",
                      boxShadow:
                        "0 9px 30px rgba(15,42,80,0.045)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* TOP ACCENT */}

                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        background:
                          "linear-gradient(180deg,#1261ff,#5a9cff)",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* LEFT */}

                      <div
                        style={{
                          flex: "1 1 470px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "9px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#eef4ff",
                              color: "#1261ff",
                              padding: "6px 9px",
                              borderRadius: "999px",
                              fontSize: "10px",
                              fontWeight: "900",
                              textTransform:
                                "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            💼 Internship
                          </span>

                          {internship.internship_type && (
                            <span
                              style={{
                                background:
                                  "#f2f4f7",
                                color: "#475467",
                                padding:
                                  "6px 9px",
                                borderRadius:
                                  "999px",
                                fontSize: "10px",
                                fontWeight: "800",
                              }}
                            >
                              {
                                internship.internship_type
                              }
                            </span>
                          )}

                          {count > 0 && (
                            <span
                              style={{
                                background:
                                  "#ecfdf3",
                                color: "#027a48",
                                padding:
                                  "6px 9px",
                                borderRadius:
                                  "999px",
                                fontSize: "10px",
                                fontWeight: "900",
                              }}
                            >
                              ● Receiving Applications
                            </span>
                          )}
                        </div>

                        <h3
                          style={{
                            margin: "0 0 8px",
                            fontSize: "21px",
                            fontWeight: "950",
                            color: "#101828",
                            letterSpacing:
                              "-0.2px",
                          }}
                        >
                          {internship.job_title ||
                            "Internship"}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "7px 15px",
                            color: "#667085",
                            fontSize: "13px",
                            lineHeight: 1.7,
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

                        {/* APPLICATION SUMMARY */}

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "16px",
                          }}
                        >
                          <PipelineBadge
                            icon="👥"
                            value={`${count} ${
                              count === 1
                                ? "Applicant"
                                : "Applicants"
                            }`}
                          />

                          {shortlistedForJob > 0 && (
                            <PipelineBadge
                              icon="⭐"
                              value={`${shortlistedForJob} Shortlisted`}
                              green
                            />
                          )}

                          {pendingForJob > 0 && (
                            <PipelineBadge
                              icon="⏳"
                              value={`${pendingForJob} Pending`}
                              orange
                            />
                          )}
                        </div>
                      </div>

                      {/* RIGHT SIDE */}

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: "9px",
                          minWidth: "190px",
                        }}
                      >
                        <Link
                          href={`/company/internships/${internship.id}/applicants`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            gap: "8px",
                            background:
                              "linear-gradient(135deg,#1261ff,#0d4ed8)",
                            color: "#fff",
                            textDecoration: "none",
                            padding:
                              "12px 17px",
                            borderRadius: "11px",
                            fontWeight: "950",
                            fontSize: "13px",
                            boxShadow:
                              "0 9px 20px rgba(18,97,255,0.20)",
                          }}
                        >
                          👥
                          View Applicants
                          <span>→</span>
                        </Link>

                        <Link
                          href={`/internships/${internship.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            gap: "7px",
                            background: "#f7faff",
                            color: "#344054",
                            textDecoration: "none",
                            padding:
                              "11px 17px",
                            borderRadius: "11px",
                            fontWeight: "850",
                            fontSize: "13px",
                            border:
                              "1px solid #e0e7f1",
                          }}
                        >
                          View Internship
                          <span>↗</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            PREMIUM CALL TO ACTION
        ==================================================== */}

        {!isPremiumActive && (
          <section
            style={{
              marginTop: "27px",
              borderRadius: "22px",
              padding: "23px",
              background:
                "linear-gradient(135deg,#eef5ff,#f9fbff)",
              border:
                "1px solid #dce8fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap",
              boxShadow:
                "0 9px 28px rgba(18,97,255,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "13px",
              }}
            >
              <div
                style={{
                  width: "47px",
                  height: "47px",
                  borderRadius: "14px",
                  background: "#fff",
                  border:
                    "1px solid #dce8fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "21px",
                  boxShadow:
                    "0 7px 18px rgba(18,97,255,0.08)",
                }}
              >
                💎
              </div>

              <div>
                <div
                  style={{
                    fontWeight: "950",
                    fontSize: "18px",
                    color: "#123f88",
                  }}
                >
                  Ready to upgrade your recruitment?
                </div>

                <div
                  style={{
                    color: "#667085",
                    fontSize: "13px",
                    marginTop: "4px",
                    lineHeight: 1.5,
                  }}
                >
                  Unlock GradLink Premium tools for
                  your company.
                </div>
              </div>
            </div>

            <Link
              href="/company-pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                background:
                  "linear-gradient(135deg,#1261ff,#0d4ed8)",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: "11px",
                fontWeight: "950",
                boxShadow:
                  "0 9px 20px rgba(18,97,255,0.20)",
              }}
            >
              Explore Premium
              <span>→</span>
            </Link>
          </section>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer
          style={{
            marginTop: "55px",
            paddingTop: "25px",
            borderTop:
              "1px solid #e6ebf2",
            color: "#667085",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          <strong
            style={{
              color: "#1261ff",
              fontWeight: "950",
            }}
          >
            GRADLINK SA
          </strong>{" "}
          — Connecting South African graduates
          with opportunities.

          <div
            style={{
              marginTop: "7px",
            }}
          >
            © {new Date().getFullYear()} GradLink SA
          </div>
        </footer>
      </div>
    </main>
  );
}

// ============================================================
// NAVIGATION STYLES
// ============================================================

const navLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  textDecoration: "none",
  color: "#344054",
  fontWeight: "850",
  padding: "9px 11px",
  borderRadius: "10px",
  border: "1px solid transparent",
  transition:
    "background .2s ease, border .2s ease",
};

const navPremiumStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  textDecoration: "none",
  color: "#1261ff",
  fontWeight: "900",
  padding: "7px 10px 7px 7px",
  borderRadius: "11px",
  background:
    "linear-gradient(135deg,#f0f6ff,#ffffff)",
  border:
    "1px solid #dce8fa",
  boxShadow:
    "0 5px 15px rgba(18,97,255,0.07)",
};

const navIconStyle = {
  fontSize: "13px",
  opacity: 0.8,
};

const logoutButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  border: "1px solid #dce5f2",
  background:
    "linear-gradient(135deg,#ffffff,#f7faff)",
  color: "#344054",
  padding: "9px 13px",
  borderRadius: "10px",
  fontWeight: "850",
  cursor: "pointer",
  boxShadow:
    "0 4px 12px rgba(15,42,80,0.04)",
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
        background: "#ffffff",
        border:
          "1px solid #e5eaf2",
        borderRadius: "20px",
        padding: "20px",
        boxShadow:
          "0 8px 28px rgba(15,42,80,0.045)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "85px",
          height: "85px",
          borderRadius: "50%",
          background: `${accent}12`,
          right: "-25px",
          top: "-25px",
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
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "13px",
              background:
                `${accent}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "21px",
              border:
                `1px solid ${accent}18`,
            }}
          >
            {icon}
          </div>

          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: accent,
              boxShadow:
                `0 0 0 4px ${accent}10`,
            }}
          />
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "950",
            marginTop: "15px",
            lineHeight: 1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "900",
            marginTop: "8px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#98a2b3",
            fontSize: "11px",
            marginTop: "4px",
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
        borderRadius: "16px",
        padding: "16px",
        background:
          "linear-gradient(135deg,#fbfdff,#ffffff)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "37px",
            height: "37px",
            borderRadius: "11px",
            background: "#eef4ff",
            border:
              "1px solid #dce8fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            fontWeight: "900",
            color: "#101828",
            fontSize: "13px",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          color: "#667085",
          fontSize: "12px",
          lineHeight: 1.55,
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
          color: "#98a2b3",
          fontSize: "10px",
          fontWeight: "850",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#344054",
          fontWeight: "850",
          fontSize: "13px",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ============================================================
// PIPELINE BADGE
// ============================================================

function PipelineBadge({
  icon,
  value,
  green = false,
  orange = false,
}) {
  let background = "#eef4ff";
  let color = "#1261ff";

  if (green) {
    background = "#ecfdf3";
    color = "#027a48";
  }

  if (orange) {
    background = "#fffaeb";
    color = "#b54708";
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background,
        color,
        padding: "7px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "850",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {value}
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