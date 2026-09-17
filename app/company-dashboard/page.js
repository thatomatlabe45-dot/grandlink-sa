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
  if (!value) return 0;

  const text = value.toLowerCase();

  if (
    text.includes("phd") ||
    text.includes("doctorate") ||
    text.includes("master") ||
    text.includes("postgrad")
  ) {
    return 6;
  }

  if (text.includes("honours") || text.includes("honor")) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bsc") ||
    text.includes("bcom") ||
    text.includes("ba")
  ) {
    return 4;
  }

  if (text.includes("diploma")) {
    return 3;
  }

  if (text.includes("certificate")) {
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
// AI MATCHING
// ============================================================

function calculateMatch(internship, application) {
  let qualificationScore = 0;
  let fieldScore = 0;
  let skillsScore = 0;

  const requiredQualification = getQualificationLevel(
    internship?.qualification
  );

  const applicantQualification = getQualificationLevel(
    application?.qualification
  );

  if (
    applicantQualification > 0 &&
    requiredQualification > 0 &&
    applicantQualification >= requiredQualification
  ) {
    qualificationScore = 35;
  }

  const requiredField = (
    internship?.field_of_study ||
    ""
  ).toLowerCase();

  const applicantField = (
    application?.field_of_study ||
    ""
  ).toLowerCase();

  if (requiredField && applicantField) {
    if (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    ) {
      fieldScore = 35;
    } else {
      const requiredWords = requiredField
        .split(/[\s,/&-]+/)
        .filter(Boolean);

      const matchedField = requiredWords.some((word) =>
        applicantField.includes(word)
      );

      if (matchedField) {
        fieldScore = 20;
      }
    }
  }

  const requiredSkills = (
    internship?.skills ||
    ""
  )
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const applicantSkills = (
    application?.skills ||
    ""
  )
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (requiredSkills.length && applicantSkills.length) {
    const matchedSkills = requiredSkills.filter((requiredSkill) =>
      applicantSkills.some(
        (applicantSkill) =>
          applicantSkill.includes(requiredSkill) ||
          requiredSkill.includes(applicantSkill)
      )
    );

    skillsScore = Math.round(
      (matchedSkills.length / requiredSkills.length) * 30
    );
  }

  const total = qualificationScore + fieldScore + skillsScore;

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
    qualificationScore,
    fieldScore,
    skillsScore,
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [error, setError] = useState("");

  const [showHeader, setShowHeader] = useState(true);

  // Responsive viewport
  const [viewportWidth, setViewportWidth] = useState(1200);

  // ==========================================================
  // RESPONSIVE SCREEN SIZE
  // ==========================================================

  useEffect(() => {
    const updateWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const isMobile = viewportWidth <= 700;
  const isSmallPhone = viewportWidth <= 420;
  const isTablet = viewportWidth > 700 && viewportWidth <= 1050;

  // ==========================================================
  // HEADER SCROLL BEHAVIOUR
  // ==========================================================

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ==========================================================
  // LOAD SUBSCRIPTION
  // ==========================================================

  async function loadSubscription(companyId) {
    if (!companyId) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);

    try {
      const { data, error: subscriptionError } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Subscription error:",
          subscriptionError
        );

        setSubscription(null);
      } else {
        setSubscription(data || null);
      }
    } catch (err) {
      console.error("Subscription loading error:", err);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const authUser = authData?.user;

      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);

      // --------------------------------------------------------
      // COMPANY
      // --------------------------------------------------------

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        setError(
          "We could not find your company profile. Please complete your company profile first."
        );

        setLoading(false);
        setSubscriptionLoading(false);
        return;
      }

      setCompany(companyData);

      // --------------------------------------------------------
      // SUBSCRIPTION
      // --------------------------------------------------------

      loadSubscription(companyData.id);

      // --------------------------------------------------------
      // INTERNSHIPS
      // --------------------------------------------------------

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select("*")
        .eq("company_name", companyData.company_name)
        .order("created_at", {
          ascending: false,
        });

      if (internshipError) {
        throw internshipError;
      }

      const loadedInternships = internshipData || [];

      setInternships(loadedInternships);

      // --------------------------------------------------------
      // APPLICATIONS
      // --------------------------------------------------------

      if (loadedInternships.length > 0) {
        const internshipIds = loadedInternships.map(
          (internship) => internship.id
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
            "Application loading error:",
            applicationError
          );

          setApplications([]);
        } else {
          setApplications(applicationData || []);
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function handleLogout() {
    await supabase.auth.signOut();

    try {
      localStorage.removeItem("gradlink_profile");
    } catch (err) {
      console.error("Local storage error:", err);
    }

    router.push("/login");
  }

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalApplications = applications.length;

  const shortlistedApplications = applications.filter(
    (application) =>
      application.status?.toLowerCase() === "shortlisted"
  ).length;

  const rejectedApplications = applications.filter(
    (application) =>
      application.status?.toLowerCase() === "rejected"
  ).length;

  const pendingApplications = applications.filter((application) => {
    const status = application.status?.toLowerCase();

    return (
      !status ||
      status === "pending" ||
      status === "applied" ||
      status === "review"
    );
  }).length;

  const premiumActive =
    subscription?.status?.toLowerCase() === "active";

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <>
        <div style={styles.loadingPage}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>

            <div style={styles.loadingTitle}>
              Loading your dashboard
            </div>

            <div style={styles.loadingText}>
              Preparing your GradLink SA recruitment portal...
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes gradlinkSpin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error && !company) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h1 style={styles.errorTitle}>
            Dashboard unavailable
          </h1>

          <p style={styles.errorText}>{error}</p>

          <div style={styles.errorActions}>
            <Link href="/company" style={styles.primaryButton}>
              Company Profile
            </Link>

            <Link href="/" style={styles.secondaryButton}>
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // FORMAT COMPANY NAME
  // ==========================================================

  const companyName =
    company?.company_name || "Your Company";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          ...styles.header,
          transform: showHeader
            ? "translateY(0)"
            : "translateY(-110%)",
        }}
      >
        <div
          style={{
            ...styles.headerInner,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? "12px" : "20px",
          }}
        >
          {/* LOGO / BRAND */}
          <Link
            href="/"
            style={{
              ...styles.logo,
              justifyContent: isMobile
                ? "center"
                : "flex-start",
            }}
          >
            <span style={styles.logoMark}>G</span>

            <span style={styles.logoText}>
              GradLink <span>SA</span>
            </span>
          </Link>

          {/* NAVIGATION */}
          <nav
            style={{
              ...styles.nav,
              width: isMobile ? "100%" : "auto",
              overflowX: isMobile ? "auto" : "visible",
              justifyContent: isMobile
                ? "flex-start"
                : "flex-end",
              paddingBottom: isMobile ? "3px" : "0",
            }}
          >
            <Link
              href="/"
              style={{
                ...styles.navButton,
                flexShrink: 0,
              }}
            >
              <span>⌂</span>
              Home
            </Link>

            <Link
              href="/company"
              style={{
                ...styles.navButton,
                flexShrink: 0,
              }}
            >
              <span>▣</span>
              Company Profile
            </Link>

            <Link
              href="/internships"
              style={{
                ...styles.navButton,
                ...styles.navPrimaryButton,
                flexShrink: 0,
              }}
            >
              <span>＋</span>
              Post Internship
            </Link>

            <Link
              href="/company/pricing"
              style={{
                ...styles.navButton,
                ...styles.navPremiumButton,
                flexShrink: 0,
              }}
            >
              <span>✦</span>
              Premium
            </Link>

            <button
              onClick={handleLogout}
              style={{
                ...styles.navButton,
                ...styles.logoutButton,
                flexShrink: 0,
              }}
            >
              <span>↪</span>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main>
        {/* ====================================================
            HERO
        ==================================================== */}

        <section style={styles.hero}>
          <div style={styles.container}>
            <div
              style={{
                ...styles.heroGrid,
                gridTemplateColumns:
                  isMobile || isTablet
                    ? "1fr"
                    : "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
              }}
            >
              {/* HERO LEFT */}
              <div
                style={{
                  ...styles.heroContent,
                  minWidth: 0,
                }}
              >
                <div style={styles.eyebrow}>
                  <span style={styles.eyebrowDot}></span>
                  RECRUITMENT PORTAL
                </div>

                <h1
                  style={{
                    ...styles.heroTitle,
                    fontSize: isSmallPhone
                      ? "34px"
                      : isMobile
                      ? "42px"
                      : "56px",
                  }}
                >
                  Welcome back,
                  <br />

                  <span>{companyName}</span>
                </h1>

                <p style={styles.heroText}>
                  Manage your internships, review applicants,
                  monitor your recruitment pipeline and connect
                  with talented South African graduates.
                </p>

                {/* HERO ACTIONS */}
                <div
                  style={{
                    ...styles.heroActions,
                    flexDirection: isSmallPhone
                      ? "column"
                      : "row",
                  }}
                >
                  <Link
                    href="/internships"
                    style={{
                      ...styles.heroPrimaryButton,
                      width: isSmallPhone
                        ? "100%"
                        : "auto",
                    }}
                  >
                    <span>＋</span>
                    Post an Internship
                  </Link>

                  <Link
                    href="/company"
                    style={{
                      ...styles.heroSecondaryButton,
                      width: isSmallPhone
                        ? "100%"
                        : "auto",
                    }}
                  >
                    <span>▣</span>
                    Manage Company Profile
                  </Link>
                </div>
              </div>

              {/* RECRUITMENT OVERVIEW */}
              <div
                style={{
                  ...styles.overviewCard,
                  minWidth: 0,
                }}
              >
                <div style={styles.overviewTop}>
                  <div>
                    <div style={styles.overviewLabel}>
                      RECRUITMENT OVERVIEW
                    </div>

                    <div style={styles.overviewTitle}>
                      Your hiring activity
                    </div>
                  </div>

                  <div style={styles.overviewIcon}>↗</div>
                </div>

                <div style={styles.overviewDivider}></div>

                <div style={styles.overviewRows}>
                  <div style={styles.overviewRow}>
                    <span>Active internships</span>
                    <strong>{internships.length}</strong>
                  </div>

                  <div style={styles.overviewRow}>
                    <span>Total applications</span>
                    <strong>{totalApplications}</strong>
                  </div>

                  <div style={styles.overviewRow}>
                    <span>Shortlisted</span>
                    <strong>{shortlistedApplications}</strong>
                  </div>
                </div>

                <div style={styles.overviewFooter}>
                  <span
                    style={{
                      ...styles.statusDot,
                      background: premiumActive
                        ? "#18a957"
                        : "#f59e0b",
                    }}
                  ></span>

                  {premiumActive
                    ? "Premium account active"
                    : "Standard account"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>
            <div
              style={{
                ...styles.statsGrid,
                gridTemplateColumns: isSmallPhone
                  ? "1fr"
                  : isMobile || isTablet
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(4, minmax(0, 1fr))",
              }}
            >
              <StatCard
                icon="▤"
                number={internships.length}
                label="Internships"
                description="Internship listings"
              />

              <StatCard
                icon="◉"
                number={totalApplications}
                label="Applications"
                description="Graduate applications"
              />

              <StatCard
                icon="✓"
                number={shortlistedApplications}
                label="Shortlisted"
                description="Candidates shortlisted"
              />

              <StatCard
                icon="◷"
                number={pendingApplications}
                label="Pending Review"
                description="Awaiting your review"
              />
            </div>
          </div>
        </section>

        {/* ====================================================
            PREMIUM
        ==================================================== */}

        <section style={styles.sectionCompact}>
          <div style={styles.container}>
            <div
              style={{
                ...styles.premiumCard,
                gridTemplateColumns:
                  isMobile || isTablet
                    ? "1fr"
                    : "minmax(0, 1.45fr) minmax(280px, 0.55fr)",
              }}
            >
              <div
                style={{
                  ...styles.premiumMain,
                  minWidth: 0,
                }}
              >
                <div style={styles.premiumBadge}>
                  ✦ GRADLINK PREMIUM
                </div>

                <h2 style={styles.premiumTitle}>
                  Build a smarter recruitment process.
                </h2>

                <p style={styles.premiumText}>
                  Unlock advanced recruitment tools designed
                  to help your company discover and assess
                  graduate talent more efficiently.
                </p>

                <div
                  style={{
                    ...styles.premiumFeatures,
                    gridTemplateColumns: isSmallPhone
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  <PremiumFeature
                    icon="✦"
                    title="AI Matching"
                    text="Match applicants against your internship requirements."
                  />

                  <PremiumFeature
                    icon="✓"
                    title="Document Verification"
                    text="Advanced document checking tools for eligible plans."
                  />

                  <PremiumFeature
                    icon="◉"
                    title="Applicant Insights"
                    text="Review applications with clearer candidate information."
                  />

                  <PremiumFeature
                    icon="↗"
                    title="Recruitment Tools"
                    text="Organise and manage your graduate recruitment pipeline."
                  />
                </div>
              </div>

              <div
                style={{
                  ...styles.subscriptionBox,
                  minWidth: 0,
                }}
              >
                <div style={styles.subscriptionHeader}>
                  <span>YOUR PLAN</span>

                  <span
                    style={{
                      ...styles.subscriptionStatus,
                      background: premiumActive
                        ? "rgba(24,169,87,0.12)"
                        : "rgba(245,158,11,0.12)",
                      color: premiumActive
                        ? "#128047"
                        : "#b45309",
                    }}
                  >
                    {premiumActive
                      ? "ACTIVE"
                      : "STANDARD"}
                  </span>
                </div>

                <div style={styles.subscriptionPlan}>
                  {subscription?.plan ||
                    "Standard"}
                </div>

                <div style={styles.subscriptionPrice}>
                  {subscription?.monthly_price
                    ? `R${subscription.monthly_price}`
                    : "Free"}
                  <span>/ month</span>
                </div>

                {subscriptionLoading ? (
                  <div style={styles.subscriptionLoading}>
                    Checking subscription...
                  </div>
                ) : (
                  <div style={styles.subscriptionDetails}>
                    <SubscriptionDetail
                      label="Status"
                      value={
                        premiumActive
                          ? "Active"
                          : "Standard"
                      }
                    />

                    <SubscriptionDetail
                      label="Started"
                      value={formatDate(
                        subscription?.started_at
                      )}
                    />

                    <SubscriptionDetail
                      label="Renewal"
                      value={formatDate(
                        subscription?.current_period_end
                      )}
                    />
                  </div>
                )}

                <Link
                  href="/company/pricing"
                  style={styles.premiumButton}
                >
                  {premiumActive
                    ? "Manage Premium"
                    : "View Premium Plans"}
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
                {/* ====================================================
            INTERNSHIP LISTINGS
        ==================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.sectionEyebrow}>
                  YOUR LISTINGS
                </div>

                <h2 style={styles.sectionTitle}>
                  Internship listings
                </h2>

                <p style={styles.sectionText}>
                  Manage your internship opportunities and
                  review the graduates who have applied.
                </p>
              </div>

              <Link
                href="/internships"
                style={{
                  ...styles.sectionActionButton,
                  width: isSmallPhone ? "100%" : "auto",
                }}
              >
                <span>＋</span>
                Post Internship
              </Link>
            </div>

            {internships.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>＋</div>

                <h3 style={styles.emptyTitle}>
                  No internships yet
                </h3>

                <p style={styles.emptyText}>
                  Create your first internship listing and
                  start receiving applications from graduates.
                </p>

                <Link
                  href="/internships"
                  style={styles.primaryButton}
                >
                  Create Internship
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div style={styles.internshipList}>
                {internships.map((internship) => {
                  const internshipApplications =
                    applications.filter(
                      (application) =>
                        String(application.internship_id) ===
                        String(internship.id)
                    );

                  const internshipShortlisted =
                    internshipApplications.filter(
                      (application) =>
                        application.status?.toLowerCase() ===
                        "shortlisted"
                    ).length;

                  const internshipPending =
                    internshipApplications.filter((application) => {
                      const status =
                        application.status?.toLowerCase();

                      return (
                        !status ||
                        status === "pending" ||
                        status === "applied" ||
                        status === "review"
                      );
                    }).length;

                  return (
                    <div
                      key={internship.id}
                      style={styles.internshipCard}
                    >
                      <div
                        style={{
                          ...styles.internshipCardTop,
                          flexDirection: isMobile
                            ? "column"
                            : "row",
                        }}
                      >
                        <div
                          style={{
                            ...styles.internshipInfo,
                            minWidth: 0,
                          }}
                        >
                          <div style={styles.listingBadge}>
                            INTERNSHIP
                          </div>

                          <h3 style={styles.internshipTitle}>
                            {internship.job_title ||
                              "Untitled Internship"}
                          </h3>

                          <div style={styles.internshipCompany}>
                            <span>▣</span>
                            {internship.company_name ||
                              companyName}
                          </div>

                          <div
                            style={{
                              ...styles.internshipMeta,
                              flexWrap: "wrap",
                            }}
                          >
                            {internship.location && (
                              <span>
                                <b>⌖</b>
                                {internship.location}
                              </span>
                            )}

                            {internship.province && (
                              <span>
                                <b>◈</b>
                                {internship.province}
                              </span>
                            )}

                            {internship.internship_type && (
                              <span>
                                <b>◷</b>
                                {internship.internship_type}
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            ...styles.internshipActions,
                            width: isMobile
                              ? "100%"
                              : "auto",
                          }}
                        >
                          <Link
                            href={`/company/internships/${internship.id}/applicants`}
                            style={{
                              ...styles.viewApplicantsButton,
                              width: isMobile
                                ? "100%"
                                : "auto",
                            }}
                          >
                            <span>◉</span>
                            View Applicants
                          </Link>

                          <Link
                            href={`/internships/${internship.id}`}
                            style={{
                              ...styles.viewDetailsButton,
                              width: isMobile
                                ? "100%"
                                : "auto",
                            }}
                          >
                            View Details
                            <span>→</span>
                          </Link>
                        </div>
                      </div>

                      <div style={styles.internshipDivider}></div>

                      <div
                        style={{
                          ...styles.applicationSummary,
                          gridTemplateColumns: isSmallPhone
                            ? "1fr"
                            : "repeat(3, minmax(0, 1fr))",
                        }}
                      >
                        <ApplicationSummary
                          icon="◉"
                          number={internshipApplications.length}
                          label="Applications"
                        />

                        <ApplicationSummary
                          icon="✓"
                          number={internshipShortlisted}
                          label="Shortlisted"
                        />

                        <ApplicationSummary
                          icon="◷"
                          number={internshipPending}
                          label="Pending review"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            RECRUITMENT ACTIVITY
        ==================================================== */}

        <section style={styles.sectionCompact}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.sectionEyebrow}>
                  APPLICATION ACTIVITY
                </div>

                <h2 style={styles.sectionTitle}>
                  Recent applications
                </h2>

                <p style={styles.sectionText}>
                  Keep track of the latest graduates applying
                  to your internship opportunities.
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>◉</div>

                <h3 style={styles.emptyTitle}>
                  No applications yet
                </h3>

                <p style={styles.emptyText}>
                  Applications from graduates will appear here
                  once they apply to your internships.
                </p>
              </div>
            ) : (
              <div style={styles.applicationList}>
                {applications
                  .slice(0, 6)
                  .map((application) => {
                    const internship = internships.find(
                      (item) =>
                        String(item.id) ===
                        String(application.internship_id)
                    );

                    const match = calculateMatch(
                      internship,
                      application
                    );

                    const status =
                      application.status || "Pending";

                    return (
                      <div
                        key={application.id}
                        style={styles.applicationCard}
                      >
                        <div
                          style={{
                            ...styles.applicationMain,
                            flexDirection: isMobile
                              ? "column"
                              : "row",
                          }}
                        >
                          <div
                            style={styles.applicantAvatar}
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
                              ...styles.applicantInfo,
                              minWidth: 0,
                            }}
                          >
                            <h3
                              style={
                                styles.applicantName
                              }
                            >
                              {application.full_name ||
                                "Graduate Applicant"}
                            </h3>

                            <div
                              style={
                                styles.applicantEmail
                              }
                            >
                              {application.email ||
                                "No email provided"}
                            </div>

                            <div
                              style={{
                                ...styles.applicantRole,
                                overflowWrap:
                                  "anywhere",
                              }}
                            >
                              Applied for:{" "}
                              <strong>
                                {internship?.job_title ||
                                  "Internship"}
                              </strong>
                            </div>
                          </div>

                          <div
                            style={{
                              ...styles.matchBox,
                              alignSelf: isMobile
                                ? "stretch"
                                : "center",
                              width: isMobile
                                ? "100%"
                                : "auto",
                            }}
                          >
                            <div
                              style={
                                styles.matchNumber
                              }
                            >
                              {match.total}%
                            </div>

                            <div
                              style={styles.matchLabel}
                            >
                              AI Match
                            </div>
                          </div>

                          <div
                            style={{
                              ...styles.applicationStatusBox,
                              alignSelf: isMobile
                                ? "stretch"
                                : "center",
                            }}
                          >
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...getStatusStyle(status),
                              }}
                            >
                              {status}
                            </span>
                          </div>

                          <Link
                            href={`/company/internships/${application.internship_id}/applicants`}
                            style={{
                              ...styles.reviewButton,
                              width: isMobile
                                ? "100%"
                                : "auto",
                            }}
                          >
                            Review
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.quickActionsCard}>
              <div style={styles.quickActionsHeader}>
                <div>
                  <div style={styles.sectionEyebrow}>
                    QUICK ACTIONS
                  </div>

                  <h2 style={styles.quickActionsTitle}>
                    Manage your GradLink account
                  </h2>
                </div>
              </div>

              <div
                style={{
                  ...styles.quickActionsGrid,
                  gridTemplateColumns: isSmallPhone
                    ? "1fr"
                    : isMobile || isTablet
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(4, minmax(0, 1fr))",
                }}
              >
                <QuickAction
                  href="/internships"
                  icon="＋"
                  title="Post Internship"
                  text="Create a new opportunity."
                />

                <QuickAction
                  href="/company"
                  icon="▣"
                  title="Company Profile"
                  text="Update your company information."
                />

                <QuickAction
                  href="/company/pricing"
                  icon="✦"
                  title="Premium"
                  text="View recruitment plans."
                />

                <QuickAction
                  href="/"
                  icon="⌂"
                  title="Back Home"
                  text="Return to GradLink SA."
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <div
          style={{
            ...styles.footerInner,
            flexDirection: isMobile
              ? "column"
              : "row",
            textAlign: isMobile
              ? "center"
              : "left",
          }}
        >
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <span style={styles.logoMark}>
                G
              </span>

              <span style={styles.logoText}>
                GradLink <span>SA</span>
              </span>
            </div>

            <p style={styles.footerText}>
              Connecting South African graduates with
              internship opportunities.
            </p>
          </div>

          <div style={styles.footerLinks}>
            <Link href="/" style={styles.footerLink}>
              Home
            </Link>

            <Link
              href="/company"
              style={styles.footerLink}
            >
              Company Profile
            </Link>

            <Link
              href="/internships"
              style={styles.footerLink}
            >
              Post Internship
            </Link>

            <Link
              href="/company/pricing"
              style={styles.footerLink}
            >
              Premium
            </Link>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} GradLink SA. All
          rights reserved.
        </div>
      </footer>

      {/* ======================================================
          GLOBAL RESPONSIVE CSS
      ====================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #f6f9fc;
        }

        a {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          font-family: inherit;
        }

        @media (max-width: 700px) {
          body {
            width: 100%;
            max-width: 100%;
          }
        }

        @media (max-width: 420px) {
          input,
          textarea,
          select,
          button,
          a {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  number,
  label,
  description,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div style={styles.statIcon}>{icon}</div>

        <div style={styles.statNumber}>
          {number}
        </div>
      </div>

      <div style={styles.statLabel}>
        {label}
      </div>

      <div style={styles.statDescription}>
        {description}
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
    <div style={styles.premiumFeature}>
      <div style={styles.premiumFeatureIcon}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={styles.premiumFeatureTitle}>
          {title}
        </div>

        <div style={styles.premiumFeatureText}>
          {text}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUBSCRIPTION DETAIL
// ============================================================

function SubscriptionDetail({
  label,
  value,
}) {
  return (
    <div style={styles.subscriptionDetail}>
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

// ============================================================
// APPLICATION SUMMARY
// ============================================================

function ApplicationSummary({
  icon,
  number,
  label,
}) {
  return (
    <div style={styles.applicationSummaryItem}>
      <div style={styles.applicationSummaryIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.applicationSummaryNumber}>
          {number}
        </div>

        <div style={styles.applicationSummaryLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  href,
  icon,
  title,
  text,
}) {
  return (
    <Link
      href={href}
      style={styles.quickAction}
    >
      <div style={styles.quickActionIcon}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={styles.quickActionTitle}>
          {title}
        </div>

        <div style={styles.quickActionText}>
          {text}
        </div>
      </div>

      <span style={styles.quickActionArrow}>
        →
      </span>
    </Link>
  );
}

// ============================================================
// STATUS STYLE
// ============================================================

function getStatusStyle(status) {
  const normalized =
    status?.toLowerCase() || "pending";

  if (normalized === "shortlisted") {
    return {
      background: "#e8f7ef",
      color: "#147a45",
    };
  }

  if (normalized === "rejected") {
    return {
      background: "#fdecec",
      color: "#b42318",
    };
  }

  return {
    background: "#fff6df",
    color: "#a15c00",
  };
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
  if (!value) return "—";

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

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f9fc",
    color: "#10243e",
    overflowX: "hidden",
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(135deg, #eef5fb 0%, #f8fbff 100%)",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "430px",
    background: "#ffffff",
    border: "1px solid #e3ebf3",
    borderRadius: "24px",
    padding: "42px 28px",
    textAlign: "center",
    boxShadow:
      "0 18px 50px rgba(15, 55, 95, 0.10)",
  },

  spinner: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "4px solid #dbe8f4",
    borderTopColor: "#1478c9",
    animation:
      "gradlinkSpin 0.8s linear infinite",
    margin: "0 auto 20px",
  },

  loadingTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#10243e",
    marginBottom: "8px",
  },

  loadingText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#68788c",
  },

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  errorPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(135deg, #eef5fb 0%, #f8fbff 100%)",
  },

  errorCard: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    border: "1px solid #e3ebf3",
    borderRadius: "24px",
    padding: "36px 28px",
    textAlign: "center",
    boxShadow:
      "0 18px 50px rgba(15, 55, 95, 0.10)",
  },

  errorIcon: {
    width: "54px",
    height: "54px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff1f1",
    color: "#c62828",
    fontSize: "24px",
    fontWeight: 900,
  },

  errorTitle: {
    margin: "0 0 10px",
    fontSize: "25px",
    fontWeight: 850,
    color: "#10243e",
  },

  errorText: {
    margin: "0",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#68788c",
  },

  errorActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "24px",
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background:
      "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #e4ebf2",
    boxShadow:
      "0 8px 30px rgba(18, 50, 80, 0.07)",
    transition:
      "transform 0.28s ease",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  headerInner: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    justifyContent: "space-between",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#10243e",
    minWidth: 0,
  },

  logoMark: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0c65ad, #1d91df)",
    color: "#ffffff",
    fontSize: "21px",
    fontWeight: 900,
    boxShadow:
      "0 7px 18px rgba(18, 119, 200, 0.22)",
  },

  logoText: {
    fontSize: "21px",
    fontWeight: 900,
    letterSpacing: "-0.5px",
    whiteSpace: "nowrap",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  navButton: {
    minHeight: "42px",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "10px",
    border: "1px solid #d8e3ed",
    background: "#ffffff",
    color: "#29435e",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 750,
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxShadow:
      "0 2px 5px rgba(20, 50, 80, 0.05)",
  },

  navPrimaryButton: {
    background:
      "linear-gradient(135deg, #0d70bf, #168bd8)",
    borderColor: "#0d70bf",
    color: "#ffffff",
    boxShadow:
      "0 7px 18px rgba(13, 112, 191, 0.20)",
  },

  navPremiumButton: {
    background:
      "linear-gradient(135deg, #173f68, #235f91)",
    borderColor: "#173f68",
    color: "#ffffff",
    boxShadow:
      "0 7px 18px rgba(23, 63, 104, 0.18)",
  },

  logoutButton: {
    fontFamily: "inherit",
  },

  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  hero: {
    paddingTop: "150px",
    paddingBottom: "72px",
    background:
      "radial-gradient(circle at top right, rgba(40,145,220,0.13), transparent 36%), linear-gradient(135deg, #edf6fd 0%, #ffffff 72%)",
    borderBottom: "1px solid #e5edf4",
  },

  container: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    paddingLeft: "24px",
    paddingRight: "24px",
  },

  heroGrid: {
    display: "grid",
    gap: "34px",
    alignItems: "center",
  },

  heroContent: {
    width: "100%",
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#e5f2fc",
    border: "1px solid #cfe5f6",
    color: "#1165a5",
    fontSize: "11px",
    fontWeight: 850,
    letterSpacing: "1.1px",
  },

  eyebrowDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#1493df",
    flexShrink: 0,
  },

  heroTitle: {
    margin: "20px 0 18px",
    color: "#10243e",
    fontWeight: 900,
    lineHeight: 1.06,
    letterSpacing: "-1.8px",
    overflowWrap: "anywhere",
  },

  heroText: {
    maxWidth: "720px",
    margin: 0,
    color: "#61748a",
    fontSize: "16px",
    lineHeight: 1.75,
  },

  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "28px",
  },

  heroPrimaryButton: {
    minHeight: "48px",
    padding: "0 19px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #0c70bd, #188dd8)",
    border: "1px solid #0c70bd",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow:
      "0 9px 22px rgba(12,112,189,0.20)",
  },

  heroSecondaryButton: {
    minHeight: "48px",
    padding: "0 19px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "11px",
    background: "#ffffff",
    border: "1px solid #d4e0ea",
    color: "#23425f",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow:
      "0 5px 14px rgba(20,50,80,0.07)",
  },

  // ----------------------------------------------------------
  // OVERVIEW
  // ----------------------------------------------------------

  overviewCard: {
    width: "100%",
    background:
      "linear-gradient(145deg, #12395d, #0b2844)",
    borderRadius: "22px",
    padding: "26px",
    color: "#ffffff",
    boxShadow:
      "0 22px 50px rgba(12, 43, 72, 0.20)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  overviewTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
  },

  overviewLabel: {
    fontSize: "10px",
    letterSpacing: "1.4px",
    fontWeight: 850,
    color: "#91bad9",
    marginBottom: "7px",
  },

  overviewTitle: {
    fontSize: "20px",
    fontWeight: 850,
    lineHeight: 1.25,
  },

  overviewIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  overviewDivider: {
    height: "1px",
    background:
      "rgba(255,255,255,0.12)",
    margin: "22px 0 5px",
  },

  overviewRows: {
    display: "flex",
    flexDirection: "column",
  },

  overviewRow: {
    minHeight: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    color: "#d6e5f1",
    fontSize: "14px",
  },

  overviewFooter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "18px",
    color: "#d6e5f1",
    fontSize: "12px",
    fontWeight: 700,
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  // ----------------------------------------------------------
  // SECTIONS
  // ----------------------------------------------------------

  section: {
    paddingTop: "62px",
    paddingBottom: "4px",
  },

  sectionCompact: {
    paddingTop: "34px",
    paddingBottom: "4px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "24px",
  },

  sectionEyebrow: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.3px",
    color: "#1478c9",
    marginBottom: "7px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.15,
    letterSpacing: "-0.8px",
    fontWeight: 900,
    color: "#10243e",
  },

  sectionText: {
    margin: "8px 0 0",
    color: "#6c7d90",
    fontSize: "14px",
    lineHeight: 1.65,
    maxWidth: "700px",
  },

  sectionActionButton: {
    minHeight: "44px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #0c70bd, #168bd8)",
    border: "1px solid #0c70bd",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    boxShadow:
      "0 7px 18px rgba(12,112,189,0.17)",
  },

  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  statsGrid: {
    display: "grid",
    gap: "16px",
  },

  statCard: {
    minWidth: 0,
    background: "#ffffff",
    border: "1px solid #e0e8f0",
    borderRadius: "18px",
    padding: "21px",
    boxShadow:
      "0 8px 25px rgba(20,55,90,0.055)",
  },

  statTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "17px",
  },

  statIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "11px",
    background: "#eaf5fd",
    border: "1px solid #d5eaf8",
    color: "#1478c9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: 900,
    color: "#10243e",
  },

  statLabel: {
    fontSize: "15px",
    fontWeight: 850,
    color: "#183653",
    marginBottom: "5px",
  },

  statDescription: {
    fontSize: "12px",
    color: "#7a8999",
    lineHeight: 1.5,
  },

  // ----------------------------------------------------------
  // PREMIUM
  // ----------------------------------------------------------

  premiumCard: {
    width: "100%",
    display: "grid",
    gap: "22px",
    padding: "27px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, #0e3356, #124d7c)",
    color: "#ffffff",
    boxShadow:
      "0 20px 48px rgba(11,55,91,0.17)",
  },

  premiumMain: {
    width: "100%",
  },

  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    color: "#c8e7ff",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  premiumTitle: {
    margin: "17px 0 10px",
    fontSize: "28px",
    lineHeight: 1.2,
    letterSpacing: "-0.7px",
    fontWeight: 900,
  },

  premiumText: {
    margin: 0,
    maxWidth: "700px",
    color: "#c9dceb",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  premiumFeatures: {
    display: "grid",
    gap: "12px",
    marginTop: "22px",
  },

  premiumFeature: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    minWidth: 0,
    padding: "13px",
    borderRadius: "13px",
    background:
      "rgba(255,255,255,0.07)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  premiumFeatureIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.10)",
    color: "#a9dcff",
    fontSize: "13px",
    fontWeight: 900,
  },

  premiumFeatureTitle: {
    fontSize: "13px",
    fontWeight: 850,
    marginBottom: "4px",
  },

  premiumFeatureText: {
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#b9d0e2",
  },

  subscriptionBox: {
    width: "100%",
    padding: "21px",
    borderRadius: "18px",
    background: "#ffffff",
    color: "#10243e",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.13)",
  },

  subscriptionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: "#708297",
  },

  subscriptionStatus: {
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 900,
  },

  subscriptionPlan: {
    marginTop: "17px",
    fontSize: "20px",
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  subscriptionPrice: {
    marginTop: "6px",
    fontSize: "27px",
    fontWeight: 900,
    color: "#1478c9",
  },

  subscriptionPrice span: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#7c8b9a",
  },

  subscriptionLoading: {
    marginTop: "16px",
    fontSize: "12px",
    color: "#75869a",
  },

  subscriptionDetails: {
    display: "flex",
    flexDirection: "column",
    marginTop: "17px",
    borderTop: "1px solid #e8edf2",
  },

  subscriptionDetail: {
    minHeight: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    borderBottom: "1px solid #edf1f5",
    fontSize: "11px",
    color: "#77879a",
  },

  premiumButton: {
    width: "100%",
    minHeight: "45px",
    marginTop: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "0 14px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #0c70bd, #168bd8)",
    border: "1px solid #0c70bd",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 850,
  },

  // ----------------------------------------------------------
  // INTERNSHIP LISTINGS
  // ----------------------------------------------------------

  internshipList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  internshipCard: {
    width: "100%",
    minWidth: 0,
    background: "#ffffff",
    border: "1px solid #dfe8f0",
    borderRadius: "20px",
    padding: "21px",
    boxShadow:
      "0 8px 25px rgba(20,55,90,0.055)",
  },

  internshipCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "22px",
  },

  internshipInfo: {
    flex: 1,
    width: "100%",
  },

  listingBadge: {
    display: "inline-flex",
    minHeight: "25px",
    alignItems: "center",
    padding: "0 8px",
    borderRadius: "7px",
    background: "#edf6fd",
    color: "#1478c9",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  internshipTitle: {
    margin: "10px 0 7px",
    fontSize: "20px",
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#10243e",
    overflowWrap: "anywhere",
  },

  internshipCompany: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#4f667d",
    fontSize: "13px",
    fontWeight: 700,
  },

  internshipMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "13px",
    fontSize: "11px",
    color: "#738397",
  },

  internshipMeta span: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    minHeight: "28px",
    padding: "0 8px",
    borderRadius: "8px",
    background: "#f5f8fb",
    border: "1px solid #e5ebf1",
  },

  internshipMeta b: {
    color: "#1478c9",
  },

  internshipActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  },

  viewApplicantsButton: {
    minHeight: "43px",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #0c70bd, #168bd8)",
    border: "1px solid #0c70bd",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 850,
    whiteSpace: "nowrap",
    boxShadow:
      "0 6px 15px rgba(12,112,189,0.16)",
  },

  viewDetailsButton: {
    minHeight: "42px",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #d6e1eb",
    color: "#31506c",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  internshipDivider: {
    height: "1px",
    background: "#e9eef3",
    margin: "20px 0 15px",
  },

  applicationSummary: {
    display: "grid",
    gap: "10px",
  },

  applicationSummaryItem: {
    minWidth: 0,
    minHeight: "60px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "11px",
    background: "#f8fafc",
    border: "1px solid #edf1f5",
  },

  applicationSummaryIcon: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#eaf5fd",
    color: "#1478c9",
    fontSize: "12px",
    fontWeight: 900,
  },

  applicationSummaryNumber: {
    fontSize: "17px",
    fontWeight: 900,
    color: "#10243e",
  },

  applicationSummaryLabel: {
    fontSize: "10px",
    color: "#77879a",
    marginTop: "2px",
  },

  // ----------------------------------------------------------
  // EMPTY STATE
  // ----------------------------------------------------------

  emptyCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px dashed #cbd9e6",
    borderRadius: "20px",
    padding: "40px 24px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 14px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eaf5fd",
    color: "#1478c9",
    fontSize: "22px",
    fontWeight: 900,
  },

  emptyTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 900,
    color: "#10243e",
  },

  emptyText: {
    maxWidth: "520px",
    margin: "8px auto 20px",
    fontSize: "13px",
    lineHeight: 1.65,
    color: "#748498",
  },

  primaryButton: {
    minHeight: "44px",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #0c70bd, #168bd8)",
    border: "1px solid #0c70bd",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 850,
    boxShadow:
      "0 7px 18px rgba(12,112,189,0.17)",
  },

  secondaryButton: {
    minHeight: "44px",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #d5e0ea",
    color: "#294762",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 850,
  },

  // ----------------------------------------------------------
  // APPLICATIONS
  // ----------------------------------------------------------

  applicationList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  applicationCard: {
    width: "100%",
    minWidth: 0,
    background: "#ffffff",
    border: "1px solid #dfe8f0",
    borderRadius: "17px",
    padding: "16px",
    boxShadow:
      "0 6px 20px rgba(20,55,90,0.045)",
  },

  applicationMain: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  applicantAvatar: {
    width: "46px",
    height: "46px",
    flexShrink: 0,
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #dceffc, #edf7fd)",
    color: "#1269a9",
    fontSize: "17px",
    fontWeight: 900,
  },

  applicantInfo: {
    flex: 1,
  },

  applicantName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 900,
    color: "#10243e",
    overflowWrap: "anywhere",
  },

  applicantEmail: {
    marginTop: "4px",
    fontSize: "11px",
    color: "#708195",
    overflowWrap: "anywhere",
  },

  applicantRole: {
    marginTop: "5px",
    fontSize: "11px",
    color: "#65778b",
    lineHeight: 1.5,
  },

  matchBox: {
    minWidth: "74px",
    padding: "8px 10px",
    borderRadius: "10px",
    textAlign: "center",
    background: "#eef8f3",
    border: "1px solid #d8eee2",
  },

  matchNumber: {
    fontSize: "16px",
    fontWeight: 900,
    color: "#16834b",
  },

  matchLabel: {
    marginTop: "2px",
    fontSize: "8px",
    fontWeight: 850,
    color: "#64816f",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  applicationStatusBox: {
    flexShrink: 0,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 9px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  reviewButton: {
    minHeight: "38px",
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "9px",
    background: "#ffffff",
    border: "1px solid #d4e0ea",
    color: "#2e4d68",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  // ----------------------------------------------------------
  // QUICK ACTIONS
  // ----------------------------------------------------------

  quickActionsCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #dfe8f0",
    borderRadius: "20px",
    padding: "23px",
    boxShadow:
      "0 8px 25px rgba(20,55,90,0.05)",
  },

  quickActionsHeader: {
    marginBottom: "18px",
  },

  quickActionsTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 900,
    color: "#10243e",
  },

  quickActionsGrid: {
    display: "grid",
    gap: "11px",
  },

  quickAction: {
    minWidth: 0,
    minHeight: "82px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e4ebf1",
    textDecoration: "none",
    color: "#10243e",
  },

  quickActionIcon: {
    width: "35px",
    height: "35px",
    flexShrink: 0,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eaf5fd",
    color: "#1478c9",
    fontWeight: 900,
  },

  quickActionTitle: {
    fontSize: "12px",
    fontWeight: 850,
    marginBottom: "3px",
  },

  quickActionText: {
    fontSize: "10px",
    lineHeight: 1.45,
    color: "#77879a",
  },

  quickActionArrow: {
    marginLeft: "auto",
    flexShrink: 0,
    color: "#1478c9",
    fontSize: "15px",
    fontWeight: 900,
  },

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    marginTop: "70px",
    background: "#0d2944",
    color: "#ffffff",
  },

  footerInner: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "34px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  footerBrand: {
    minWidth: 0,
  },

  footerLogo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
  },

  footerText: {
    maxWidth: "420px",
    margin: "11px 0 0",
    color: "#a9bfd1",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  footerLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  footerLink: {
    color: "#d9e7f1",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 700,
  },

  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.09)",
    padding: "16px 24px",
    textAlign: "center",
    color: "#8ea8bc",
    fontSize: "10px",
  },
};