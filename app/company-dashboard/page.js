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
    internship?.field_of_study || ""
  ).toLowerCase();

  const applicantField = (
    application?.field_of_study || ""
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
    internship?.skills || ""
  )
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const applicantSkills = (
    application?.skills || ""
  )
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (requiredSkills.length && applicantSkills.length) {
    const matchedSkills = requiredSkills.filter(
      (requiredSkill) =>
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
  const [subscriptionLoading, setSubscriptionLoading] =
    useState(true);
  const [error, setError] = useState("");

  const [showHeader, setShowHeader] = useState(true);

  // ==========================================================
  // HEADER SCROLL
  // ==========================================================

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
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
          "Subscription error:",
          error
        );

        setSubscription(null);
      } else {
        setSubscription(data || null);
      }
    } catch (err) {
      console.error(
        "Subscription loading error:",
        err
      );

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
        .eq(
          "company_name",
          companyData.company_name
        )
        .order("created_at", {
          ascending: false,
        });

      if (internshipError) {
        throw internshipError;
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
            (internship) => internship.id
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

          setApplications([]);
        } else {
          setApplications(
            applicationData || []
          );
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

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
      localStorage.removeItem(
        "gradlink_profile"
      );
    } catch (err) {
      console.error(
        "Local storage error:",
        err
      );
    }

    router.push("/login");
  }

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalApplications =
    applications.length;

  const shortlistedApplications =
    applications.filter(
      (application) =>
        application.status?.toLowerCase() ===
        "shortlisted"
    ).length;

  const pendingApplications =
    applications.filter(
      (application) => {
        const status =
          application.status?.toLowerCase();

        return (
          !status ||
          status === "pending" ||
          status === "applied" ||
          status === "review"
        );
      }
    ).length;

  const premiumActive =
    subscription?.status?.toLowerCase() ===
    "active";

  const companyName =
    company?.company_name ||
    "Your Company";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <div style={styles.loadingPage}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>

            <h2 style={styles.loadingTitle}>
              Loading your dashboard
            </h2>

            <p style={styles.loadingText}>
              Preparing your GradLink SA
              recruitment portal...
            </p>
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
  // ERROR
  // ==========================================================

  if (error && !company) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h1 style={styles.errorTitle}>
            Dashboard unavailable
          </h1>

          <p style={styles.errorText}>
            {error}
          </p>

          <div style={styles.errorActions}>
            <Link
              href="/company"
              style={styles.primaryButton}
            >
              Company Profile
            </Link>

            <Link
              href="/"
              style={styles.secondaryButton}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN RENDER
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
            : "translateY(-120%)",
        }}
      >
        <div style={styles.headerInner}>

          <Link
            href="/"
            style={styles.logo}
          >
            <span style={styles.logoMark}>
              G
            </span>

            <span style={styles.logoText}>
              GradLink{" "}
              <span style={styles.logoAccent}>
                SA
              </span>
            </span>
          </Link>

          <nav style={styles.nav}>

            <Link
              href="/"
              style={styles.navButton}
            >
              <span>⌂</span>
              Home
            </Link>

            <Link
              href="/company"
              style={styles.navButton}
            >
              <span>▣</span>
              Company Profile
            </Link>

            <Link
              href="/internships"
              style={styles.navPrimaryButton}
            >
              <span>＋</span>
              Post Internship
            </Link>

            <Link
              href="/company/pricing"
              style={styles.navPremiumButton}
            >
              <span>✦</span>
              Premium
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              <span>↪</span>
              Logout
            </button>

          </nav>
        </div>
      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <main>

        <section style={styles.hero}>
          <div style={styles.container}>

            <div style={styles.heroContent}>

              <div style={styles.eyebrow}>
                <span style={styles.eyebrowDot}></span>
                RECRUITMENT PORTAL
              </div>

              <h1 style={styles.heroTitle}>
                Welcome back,
                <br />
                <span>{companyName}</span>
              </h1>

              <p style={styles.heroText}>
                Manage your internships, review
                applicants, monitor your recruitment
                pipeline and connect with talented
                South African graduates.
              </p>

              <div style={styles.heroActions}>

                <Link
                  href="/internships"
                  style={styles.heroPrimaryButton}
                >
                  <span>＋</span>
                  Post an Internship
                </Link>

                <Link
                  href="/company"
                  style={styles.heroSecondaryButton}
                >
                  <span>▣</span>
                  Manage Company Profile
                </Link>

              </div>

            </div>

          </div>
        </section>

        {/* ====================================================
            RECRUITMENT OVERVIEW
        ==================================================== */}

        <section style={styles.overviewSection}>
          <div style={styles.container}>

            <div style={styles.sectionHeading}>
              <div>
                <div style={styles.sectionEyebrow}>
                  RECRUITMENT OVERVIEW
                </div>

                <h2 style={styles.sectionTitle}>
                  Your hiring pipeline
                </h2>
              </div>

              <div style={styles.overviewStatus}>
                <span
                  style={{
                    ...styles.statusDot,
                    background: premiumActive
                      ? "#18a957"
                      : "#f59e0b",
                  }}
                ></span>

                {premiumActive
                  ? "Premium active"
                  : "Recruitment workspace active"}
              </div>
            </div>

            <div style={styles.statsGrid}>

              <StatCard
                icon="▤"
                number={internships.length}
                label="Internship Listings"
                description="Published opportunities"
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
                description="Applications awaiting review"
              />

            </div>
          </div>
        </section>

        {/* ====================================================
            PREMIUM
        ==================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>

            <div style={styles.premiumCard}>

              <div style={styles.premiumHeader}>

                <div>
                  <div style={styles.premiumBadge}>
                    ✦ GRADLINK PREMIUM
                  </div>

                  <h2 style={styles.premiumTitle}>
                    Take your recruitment further
                  </h2>

                  <p style={styles.premiumText}>
                    Unlock premium recruitment
                    capabilities designed to help
                    companies discover, evaluate and
                    manage graduate talent more
                    efficiently.
                  </p>
                </div>

                <div style={styles.premiumPlanBox}>

                  <div style={styles.planLabel}>
                    CURRENT PLAN
                  </div>

                  <div style={styles.planName}>
                    {subscription?.plan ||
                      "Standard"}
                  </div>

                  <div style={styles.planPrice}>
                    {subscription?.monthly_price
                      ? `R${subscription.monthly_price}`
                      : "Free"}

                    <span>
                      / month
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.planStatus,
                      background:
                        premiumActive
                          ? "#e9f8ef"
                          : "#fff5df",
                      color:
                        premiumActive
                          ? "#147a45"
                          : "#a15c00",
                    }}
                  >
                    {subscriptionLoading
                      ? "CHECKING..."
                      : premiumActive
                      ? "ACTIVE"
                      : "STANDARD"}
                  </div>

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

              <div style={styles.premiumFeatures}>

                <PremiumFeature
                  icon="✦"
                  title="Advanced Recruitment Tools"
                  text="Manage your graduate recruitment workflow more efficiently."
                />

                <PremiumFeature
                  icon="✓"
                  title="Enhanced Candidate Insights"
                  text="Get clearer information when reviewing applications."
                />

                <PremiumFeature
                  icon="◈"
                  title="Premium Verification Features"
                  text="Access advanced document verification capabilities."
                />

                <PremiumFeature
                  icon="◉"
                  title="AI Candidate Matching"
                  text="Compare applicants against your internship requirements."
                />

              </div>

            </div>

          </div>
        </section>
        
                {/* ======================================================
            INTERNSHIP LISTINGS
        ====================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>

            <div style={styles.sectionHeading}>
              <div>
                <div style={styles.sectionEyebrow}>
                  YOUR OPPORTUNITIES
                </div>

                <h2 style={styles.sectionTitle}>
                  Internship listings
                </h2>

                <p style={styles.sectionDescription}>
                  Manage your active internship opportunities
                  and review the graduates who applied.
                </p>
              </div>

              <Link
                href="/internships"
                style={styles.headingButton}
              >
                <span>＋</span>
                Post Internship
              </Link>
            </div>

            {internships.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>
                  ▤
                </div>

                <h3 style={styles.emptyTitle}>
                  No internship listings yet
                </h3>

                <p style={styles.emptyText}>
                  Create your first internship opportunity
                  and start receiving applications from
                  South African graduates.
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

                  const deadline = internship.deadline
                    ? new Date(internship.deadline)
                    : null;

                  const isExpired =
                    deadline &&
                    !Number.isNaN(deadline.getTime()) &&
                    deadline < new Date();

                  return (
                    <article
                      key={internship.id}
                      style={styles.internshipCard}
                    >

                      <div style={styles.internshipTop}>

                        <div style={styles.internshipTitleArea}>

                          <div style={styles.internshipIcon}>
                            ▤
                          </div>

                          <div>
                            <div style={styles.listingLabel}>
                              INTERNSHIP OPPORTUNITY
                            </div>

                            <h3
                              style={styles.internshipTitle}
                            >
                              {internship.job_title ||
                                "Untitled Internship"}
                            </h3>

                            <p
                              style={
                                styles.internshipCompany
                              }
                            >
                              {internship.company_name ||
                                companyName}
                            </p>
                          </div>

                        </div>

                        <div
                          style={{
                            ...styles.listingStatus,
                            ...(isExpired
                              ? styles.listingStatusExpired
                              : styles.listingStatusActive),
                          }}
                        >
                          <span></span>
                          {isExpired
                            ? "Expired"
                            : "Active"}
                        </div>

                      </div>

                      <div style={styles.internshipDetails}>

                        <div style={styles.detailItem}>
                          <span
                            style={styles.detailIcon}
                          >
                            ◉
                          </span>

                          <div>
                            <span
                              style={styles.detailLabel}
                            >
                              Location
                            </span>

                            <strong
                              style={styles.detailValue}
                            >
                              {internship.location ||
                                internship.province ||
                                "South Africa"}
                            </strong>
                          </div>
                        </div>

                        <div style={styles.detailItem}>
                          <span
                            style={styles.detailIcon}
                          >
                            ◇
                          </span>

                          <div>
                            <span
                              style={styles.detailLabel}
                            >
                              Type
                            </span>

                            <strong
                              style={styles.detailValue}
                            >
                              {internship.internship_type ||
                                "Internship"}
                            </strong>
                          </div>
                        </div>

                        <div style={styles.detailItem}>
                          <span
                            style={styles.detailIcon}
                          >
                            R
                          </span>

                          <div>
                            <span
                              style={styles.detailLabel}
                            >
                              Stipend
                            </span>

                            <strong
                              style={styles.detailValue}
                            >
                              {internship.stipend ||
                                "Not specified"}
                            </strong>
                          </div>
                        </div>

                        <div style={styles.detailItem}>
                          <span
                            style={styles.detailIcon}
                          >
                            ◷
                          </span>

                          <div>
                            <span
                              style={styles.detailLabel}
                            >
                              Deadline
                            </span>

                            <strong
                              style={styles.detailValue}
                            >
                              {deadline &&
                              !Number.isNaN(
                                deadline.getTime()
                              )
                                ? deadline.toLocaleDateString(
                                    "en-ZA",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "Not specified"}
                            </strong>
                          </div>
                        </div>

                      </div>

                      <div
                        style={styles.applicationSummary}
                      >

                        <div
                          style={
                            styles.applicationSummaryItem
                          }
                        >
                          <strong>
                            {internshipApplications.length}
                          </strong>

                          <span>
                            Applications
                          </span>
                        </div>

                        <div
                          style={
                            styles.applicationSummaryItem
                          }
                        >
                          <strong>
                            {internshipShortlisted}
                          </strong>

                          <span>
                            Shortlisted
                          </span>
                        </div>

                        <div
                          style={
                            styles.applicationSummaryItem
                          }
                        >
                          <strong>
                            {Math.max(
                              internshipApplications.length -
                                internshipShortlisted,
                              0
                            )}
                          </strong>

                          <span>
                            Other applicants
                          </span>
                        </div>

                      </div>

                      <div
                        style={styles.internshipActions}
                      >

                        <Link
                          href={`/company/internships/${internship.id}/applicants`}
                          style={styles.applicantsButton}
                        >
                          <span>◉</span>
                          View Applicants
                        </Link>

                        <Link
                          href={`/internships/${internship.id}`}
                          style={styles.viewButton}
                        >
                          View Details
                          <span>→</span>
                        </Link>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </div>
        </section>


        {/* ======================================================
            RECENT APPLICATIONS
        ====================================================== */}

        <section style={styles.sectionAlt}>
          <div style={styles.container}>

            <div style={styles.sectionHeading}>
              <div>
                <div style={styles.sectionEyebrow}>
                  CANDIDATE ACTIVITY
                </div>

                <h2 style={styles.sectionTitle}>
                  Recent applications
                </h2>

                <p style={styles.sectionDescription}>
                  Keep track of the latest graduates who
                  have applied to your opportunities.
                </p>
              </div>

              {applications.length > 0 && (
                <div style={styles.applicationCount}>
                  {applications.length} total
                </div>
              )}

            </div>

            {applications.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>
                  ◉
                </div>

                <h3 style={styles.emptyTitle}>
                  No applications yet
                </h3>

                <p style={styles.emptyText}>
                  Applications from graduates will appear
                  here once they apply to your internship
                  listings.
                </p>
              </div>
            ) : (
              <div style={styles.applicationList}>

                {applications
                  .slice(0, 8)
                  .map((application) => {

                    const internship =
                      internships.find(
                        (item) =>
                          String(item.id) ===
                          String(
                            application.internship_id
                          )
                      );

                    const match =
                      calculateMatch(
                        internship,
                        application
                      );

                    const status =
                      application.status ||
                      "Pending";

                    return (
                      <div
                        key={application.id}
                        style={styles.applicationCard}
                      >

                        <div
                          style={
                            styles.applicationAvatar
                          }
                        >
                          {(
                            application.full_name ||
                            "G"
                          )
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div
                          style={
                            styles.applicationMain
                          }
                        >

                          <div
                            style={
                              styles.applicationNameRow
                            }
                          >
                            <h3
                              style={
                                styles.applicationName
                              }
                            >
                              {application.full_name ||
                                "Graduate Applicant"}
                            </h3>

                            <span
                              style={getStatusStyle(
                                status
                              )}
                            >
                              {status}
                            </span>
                          </div>

                          <p
                            style={
                              styles.applicationRole
                            }
                          >
                            Applied for{" "}
                            <strong>
                              {internship?.job_title ||
                                "Internship"}
                            </strong>
                          </p>

                          <div
                            style={
                              styles.applicationMeta
                            }
                          >

                            <span>
                              {application.email ||
                                "Email unavailable"}
                            </span>

                            <span>
                              {application.qualification ||
                                "Qualification not provided"}
                            </span>

                            <span>
                              {application.field_of_study ||
                                "Field not provided"}
                            </span>

                          </div>

                        </div>

                        <div
                          style={
                            styles.matchScore
                          }
                        >
                          <div
                            style={
                              styles.matchNumber
                            }
                          >
                            {match.total}%
                          </div>

                          <span>
                            {match.label}
                          </span>
                        </div>

                        <Link
                          href={`/company/internships/${application.internship_id}/applicants`}
                          style={
                            styles.applicationArrow
                          }
                          aria-label="View applicant"
                        >
                          →
                        </Link>

                      </div>
                    );
                  })}

              </div>
            )}

          </div>
        </section>


        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section style={styles.section}>
          <div style={styles.container}>

            <div style={styles.quickActionsBox}>

              <div style={styles.quickActionsIntro}>
                <div style={styles.sectionEyebrow}>
                  QUICK ACTIONS
                </div>

                <h2 style={styles.quickActionsTitle}>
                  Keep your recruitment moving
                </h2>

                <p style={styles.quickActionsText}>
                  Everything you need to manage your
                  GradLink SA company account.
                </p>
              </div>

              <div style={styles.quickActionsGrid}>

                <QuickAction
                  href="/internships"
                  icon="＋"
                  title="Post Internship"
                  text="Create a new opportunity"
                />

                <QuickAction
                  href="/company"
                  icon="▣"
                  title="Company Profile"
                  text="Update your company details"
                />

                <QuickAction
                  href="/company/pricing"
                  icon="✦"
                  title="Premium Plans"
                  text="Explore recruitment features"
                />

                <QuickAction
                  href="/"
                  icon="⌂"
                  title="Visit GradLink"
                  text="Return to the main website"
                />

              </div>

            </div>

          </div>
        </section>

      </main>


      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer style={styles.footer}>
        <div style={styles.container}>

          <div style={styles.footerMain}>

            <div style={styles.footerBrand}>

              <Link
                href="/"
                style={styles.footerLogo}
              >
                <span style={styles.footerLogoMark}>
                  G
                </span>

                <span>
                  GradLink{" "}
                  <b>SA</b>
                </span>
              </Link>

              <p style={styles.footerText}>
                Connecting South African graduates
                with meaningful career opportunities.
              </p>

            </div>

            <div style={styles.footerLinks}>

              <div>
                <div style={styles.footerHeading}>
                  COMPANY
                </div>

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

              <div>
                <div style={styles.footerHeading}>
                  GRADLINK SA
                </div>

                <Link
                  href="/"
                  style={styles.footerLink}
                >
                  Home
                </Link>

                <Link
                  href="/internships"
                  style={styles.footerLink}
                >
                  Internships
                </Link>

                <Link
                  href="/jobs"
                  style={styles.footerLink}
                >
                  Jobs
                </Link>
              </div>

            </div>

          </div>

          <div style={styles.footerBottom}>
            <span>
              © {new Date().getFullYear()} GradLink SA.
              All rights reserved.
            </span>

            <span>
              Innovation. Opportunity. Growth.
            </span>
          </div>

        </div>
      </footer>


      {/* ========================================================
          GLOBAL RESPONSIVE STYLES
      ======================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          background: #f5f8fc;
          color: #10233f;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          text-decoration: none;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes gradlinkSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {

          .gradlink-dashboard-placeholder {
            display: none;
          }

        }

        @media (max-width: 900px) {

          .gradlink-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gradlink-premium-header {
            grid-template-columns: 1fr;
          }

          .gradlink-premium-plan {
            width: 100%;
          }

        }

        @media (max-width: 720px) {

          .gradlink-container {
            width: 100%;
            padding-left: 18px;
            padding-right: 18px;
          }

          .gradlink-header-inner {
            min-height: auto;
            padding-top: 12px;
            padding-bottom: 12px;
            align-items: flex-start;
          }

          .gradlink-nav {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 2px;
            scrollbar-width: none;
          }

          .gradlink-nav::-webkit-scrollbar {
            display: none;
          }

          .gradlink-nav-button {
            flex: 0 0 auto;
          }

          .gradlink-hero {
            padding-top: 145px;
            padding-bottom: 55px;
          }

          .gradlink-hero-title {
            font-size: 42px !important;
            line-height: 1.02 !important;
          }

          .gradlink-section-heading {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .gradlink-heading-button {
            width: 100%;
          }

          .gradlink-stats-grid {
            grid-template-columns: 1fr;
          }

          .gradlink-premium-features {
            grid-template-columns: 1fr !important;
          }

          .gradlink-internship-details {
            grid-template-columns: 1fr 1fr !important;
          }

          .gradlink-internship-actions {
            grid-template-columns: 1fr !important;
          }

          .gradlink-application-card {
            grid-template-columns: auto 1fr auto !important;
          }

          .gradlink-application-match {
            display: none;
          }

          .gradlink-application-meta {
            grid-template-columns: 1fr !important;
          }

          .gradlink-quick-actions-grid {
            grid-template-columns: 1fr !important;
          }

          .gradlink-footer-main {
            grid-template-columns: 1fr !important;
          }

          .gradlink-footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

        }

        @media (max-width: 480px) {

          .gradlink-container {
            padding-left: 14px;
            padding-right: 14px;
          }

          .gradlink-hero {
            padding-top: 150px;
          }

          .gradlink-hero-title {
            font-size: 35px !important;
          }

          .gradlink-hero-actions {
            grid-template-columns: 1fr !important;
          }

          .gradlink-premium-card {
            padding: 22px !important;
          }

          .gradlink-premium-title {
            font-size: 25px !important;
          }

          .gradlink-internship-details {
            grid-template-columns: 1fr !important;
          }

          .gradlink-internship-top {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .gradlink-application-card {
            grid-template-columns: auto 1fr !important;
          }

          .gradlink-application-arrow {
            display: none;
          }

          .gradlink-section {
            padding-top: 38px !important;
            padding-bottom: 38px !important;
          }

        }

      `}</style>

    </div>
  );
}


/* ==============================================================
   STAT CARD
   ============================================================== */

function StatCard({
  icon,
  number,
  label,
  description,
}) {
  return (
    <div
      style={styles.statCard}
      className="gradlink-stat-card"
    >

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div style={styles.statNumber}>
        {number}
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


/* ==============================================================
   PREMIUM FEATURE
   ============================================================== */

function PremiumFeature({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={styles.premiumFeature}
      className="gradlink-premium-feature"
    >

      <div style={styles.premiumFeatureIcon}>
        {icon}
      </div>

      <div>
        <h3 style={styles.premiumFeatureTitle}>
          {title}
        </h3>

        <p style={styles.premiumFeatureText}>
          {text}
        </p>
      </div>

    </div>
  );
}


/* ==============================================================
   QUICK ACTION
   ============================================================== */

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
      className="gradlink-quick-action"
    >

      <div style={styles.quickActionIcon}>
        {icon}
      </div>

      <div style={styles.quickActionContent}>
        <strong style={styles.quickActionTitle}>
          {title}
        </strong>

        <span style={styles.quickActionText}>
          {text}
        </span>
      </div>

      <span style={styles.quickActionArrow}>
        →
      </span>

    </Link>
  );
}


/* ==============================================================
   APPLICATION STATUS
   ============================================================== */

function getStatusStyle(status) {
  const value =
    String(status || "Pending").toLowerCase();

  if (value === "shortlisted") {
    return {
      ...styles.statusBadge,
      background: "#e8f8ef",
      color: "#147a45",
      border: "1px solid #c8edd8",
    };
  }

  if (value === "rejected") {
    return {
      ...styles.statusBadge,
      background: "#fff0f0",
      color: "#b42318",
      border: "1px solid #f4cccc",
    };
  }

  return {
    ...styles.statusBadge,
    background: "#fff6e5",
    color: "#9a5b00",
    border: "1px solid #f4dfb1",
  };
}


/* ==============================================================
   STYLES
   ============================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f8fc",
    color: "#10233f",
    overflowX: "hidden",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    paddingLeft: "24px",
    paddingRight: "24px",
  },

  /* ----------------------------------------------------------
     LOADING
     ---------------------------------------------------------- */

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f5f8fc",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "430px",
    padding: "42px 30px",
    background: "#ffffff",
    border: "1px solid #dfe7f2",
    borderRadius: "18px",
    textAlign: "center",
  },

  spinner: {
    width: "44px",
    height: "44px",
    margin: "0 auto 20px",
    border: "4px solid #dce6f4",
    borderTopColor: "#1769e0",
    borderRadius: "50%",
    animation: "gradlinkSpin 0.8s linear infinite",
  },

  loadingTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#10233f",
  },

  loadingText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6a7b91",
  },

  /* ----------------------------------------------------------
     ERROR
     ---------------------------------------------------------- */

  errorPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background: "#f5f8fc",
  },

  errorCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "40px 30px",
    background: "#ffffff",
    border: "1px solid #dfe7f2",
    borderRadius: "18px",
    textAlign: "center",
  },

  errorIcon: {
    width: "54px",
    height: "54px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#fff0f0",
    color: "#c62828",
    fontSize: "25px",
    fontWeight: 900,
  },

  errorTitle: {
    margin: "0 0 10px",
    fontSize: "26px",
    fontWeight: 850,
  },

  errorText: {
    margin: "0 auto 24px",
    maxWidth: "420px",
    color: "#697b91",
    lineHeight: 1.6,
    fontSize: "15px",
  },

  errorActions: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  /* ----------------------------------------------------------
     HEADER
     ---------------------------------------------------------- */

  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "rgba(255,255,255,0.98)",
    borderBottom: "1px solid #dfe7f2",
    boxShadow: "0 5px 20px rgba(16,35,63,0.07)",
    transition: "transform 0.28s ease",
  },

  headerInner: {
    width: "100%",
    maxWidth: "1220px",
    minHeight: "78px",
    margin: "0 auto",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },

  logo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    color: "#10233f",
    flexShrink: 0,
  },

  logoMark: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 900,
  },

  logoText: {
    fontSize: "21px",
    fontWeight: 850,
    letterSpacing: "-0.5px",
  },

  logoAccent: {
    color: "#1769e0",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflowX: "auto",
    scrollbarWidth: "none",
  },

  navButton: {
    minHeight: "42px",
    padding: "0 13px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid #ccd8e8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#253b57",
    fontSize: "13px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  navPrimaryButton: {
    minHeight: "42px",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid #1769e0",
    borderRadius: "9px",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  navPremiumButton: {
    minHeight: "42px",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid #d9b54a",
    borderRadius: "9px",
    background: "#fff9e7",
    color: "#7a5900",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  logoutButton: {
    minHeight: "42px",
    padding: "0 13px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid #e2c7c7",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#9b3030",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* ----------------------------------------------------------
     HERO
     ---------------------------------------------------------- */

  hero: {
    paddingTop: "150px",
    paddingBottom: "76px",
    background:
      "linear-gradient(135deg, #eef5ff 0%, #ffffff 58%, #f7fbff 100%)",
    borderBottom: "1px solid #e0e8f3",
  },

  heroContent: {
    maxWidth: "850px",
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "18px",
    padding: "8px 12px",
    border: "1px solid #cbdcf4",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#1769e0",
    fontSize: "11px",
    fontWeight: 850,
    letterSpacing: "1.2px",
  },

  eyebrowDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#18a957",
  },

  heroTitle: {
    margin: 0,
    fontSize: "58px",
    lineHeight: 1.03,
    letterSpacing: "-2.5px",
    fontWeight: 900,
    color: "#10233f",
  },

  heroText: {
    maxWidth: "720px",
    margin: "22px 0 0",
    color: "#61738a",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  heroActions: {
    marginTop: "30px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  heroPrimaryButton: {
    minHeight: "50px",
    padding: "0 20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    border: "1px solid #1769e0",
    borderRadius: "10px",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
  },

  heroSecondaryButton: {
    minHeight: "50px",
    padding: "0 20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    border: "1px solid #cbd7e6",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#233b59",
    fontSize: "14px",
    fontWeight: 800,
  },

  /* ----------------------------------------------------------
     SECTIONS
     ---------------------------------------------------------- */

  section: {
    paddingTop: "68px",
    paddingBottom: "68px",
  },

  sectionAlt: {
    paddingTop: "68px",
    paddingBottom: "68px",
    background: "#eef3f9",
    borderTop: "1px solid #e1e8f1",
    borderBottom: "1px solid #e1e8f1",
  },

  overviewSection: {
    paddingTop: "64px",
    paddingBottom: "32px",
    background: "#f5f8fc",
  },

  sectionHeading: {
    marginBottom: "28px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
  },

  sectionEyebrow: {
    marginBottom: "8px",
    color: "#1769e0",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1.3px",
  },

  sectionTitle: {
    margin: 0,
    color: "#10233f",
    fontSize: "30px",
    lineHeight: 1.15,
    fontWeight: 850,
    letterSpacing: "-0.7px",
  },

  sectionDescription: {
    maxWidth: "650px",
    margin: "9px 0 0",
    color: "#708197",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  overviewStatus: {
    minHeight: "38px",
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #d7e1ed",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#53677f",
    fontSize: "12px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },

  headingButton: {
    minHeight: "44px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #1769e0",
    borderRadius: "9px",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  /* ----------------------------------------------------------
     STATS
     ---------------------------------------------------------- */

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  statCard: {
    minWidth: 0,
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #dce5f0",
    borderRadius: "14px",
    boxShadow: "0 4px 14px rgba(16,35,63,0.045)",
  },

  statIcon: {
    width: "40px",
    height: "40px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#edf4ff",
    color: "#1769e0",
    fontSize: "18px",
    fontWeight: 900,
  },

  statNumber: {
    fontSize: "34px",
    lineHeight: 1,
    fontWeight: 900,
    color: "#10233f",
  },

  statLabel: {
    marginTop: "9px",
    color: "#263c58",
    fontSize: "14px",
    fontWeight: 800,
  },

  statDescription: {
    marginTop: "5px",
    color: "#8291a4",
    fontSize: "12px",
  },

  /* ----------------------------------------------------------
     PREMIUM
     ---------------------------------------------------------- */

  premiumCard: {
    padding: "32px",
    background:
      "linear-gradient(135deg, #102b50 0%, #153d70 100%)",
    borderRadius: "18px",
    border: "1px solid #173e70",
    boxShadow: "0 12px 28px rgba(16,43,80,0.15)",
    color: "#ffffff",
  },

  premiumHeader: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 300px",
    gap: "30px",
    alignItems: "start",
  },

  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "28px",
    padding: "0 10px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    color: "#d9e8ff",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.1px",
  },

  premiumTitle: {
    margin: "15px 0 0",
    color: "#ffffff",
    fontSize: "30px",
    lineHeight: 1.15,
    fontWeight: 850,
  },

  premiumText: {
    maxWidth: "670px",
    margin: "12px 0 0",
    color: "#c5d5e9",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  premiumPlanBox: {
    padding: "22px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "13px",
  },

  planLabel: {
    color: "#9eb5d2",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1.2px",
  },

  planName: {
    marginTop: "7px",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 850,
  },

  planPrice: {
    marginTop: "4px",
    color: "#ffffff",
    fontSize: "25px",
    fontWeight: 900,
  },

  planStatus: {
    display: "inline-flex",
    marginTop: "12px",
    padding: "6px 9px",
    borderRadius: "7px",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  premiumButton: {
    minHeight: "42px",
    marginTop: "15px",
    padding: "0 13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    border: "1px solid #ffffff",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#153b6b",
    fontSize: "12px",
    fontWeight: 850,
  },

  premiumFeatures: {
    marginTop: "30px",
    paddingTop: "28px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    borderTop:
      "1px solid rgba(255,255,255,0.13)",
  },

  premiumFeature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    minWidth: 0,
  },

  premiumFeatureIcon: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.1)",
    color: "#dbeaff",
    fontSize: "14px",
    fontWeight: 900,
  },

  premiumFeatureTitle: {
    margin: "0 0 5px",
    color: "#ffffff",
    fontSize: "13px",
    lineHeight: 1.3,
    fontWeight: 800,
  },

  premiumFeatureText: {
    margin: 0,
    color: "#afc3dd",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  /* ----------------------------------------------------------
     INTERNSHIPS
     ---------------------------------------------------------- */

  internshipList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  internshipCard: {
    width: "100%",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #dce5f0",
    borderRadius: "15px",
    boxShadow: "0 4px 14px rgba(16,35,63,0.045)",
  },

  internshipTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
  },

  internshipTitleArea: {
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
  },

  internshipIcon: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#edf4ff",
    color: "#1769e0",
    fontSize: "18px",
    fontWeight: 900,
  },

  listingLabel: {
    marginBottom: "4px",
    color: "#8493a7",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  internshipTitle: {
    margin: 0,
    color: "#10233f",
    fontSize: "21px",
    lineHeight: 1.25,
    fontWeight: 850,
  },

  internshipCompany: {
    margin: "5px 0 0",
    color: "#61748c",
    fontSize: "13px",
  },

  listingStatus: {
    minHeight: "31px",
    flexShrink: 0,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    borderRadius: "7px",
    fontSize: "11px",
    fontWeight: 800,
  },

  listingStatusActive: {
    background: "#eaf8f0",
    color: "#157a45",
    border: "1px solid #cbead8",
  },

  listingStatusExpired: {
    background: "#fff0f0",
    color: "#ad3333",
    border: "1px solid #efcccc",
  },

  internshipDetails: {
    marginTop: "24px",
    paddingTop: "20px",
    paddingBottom: "20px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    borderTop: "1px solid #edf1f6",
    borderBottom: "1px solid #edf1f6",
  },

  detailItem: {
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
  },

  detailIcon: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#f0f5fb",
    color: "#50708f",
    fontSize: "11px",
    fontWeight: 900,
  },

  detailLabel: {
    display: "block",
    marginBottom: "3px",
    color: "#8a98aa",
    fontSize: "10px",
    fontWeight: 700,
  },

  detailValue: {
    display: "block",
    color: "#344b66",
    fontSize: "12px",
    lineHeight: 1.35,
    fontWeight: 800,
    wordBreak: "break-word",
  },

  applicationSummary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    paddingTop: "18px",
  },

  applicationSummaryItem: {
    padding: "12px",
    borderRadius: "9px",
    background: "#f7f9fc",
    border: "1px solid #e7edf4",
  },

  internshipActions: {
    marginTop: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  applicantsButton: {
    minHeight: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #1769e0",
    borderRadius: "9px",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
  },

  viewButton: {
    minHeight: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #ccd8e8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#263e5b",
    fontSize: "13px",
    fontWeight: 800,
  },

  /* ----------------------------------------------------------
     APPLICATIONS
     ---------------------------------------------------------- */

  applicationCount: {
    padding: "7px 11px",
    border: "1px solid #d5e0ed",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#536a84",
    fontSize: "11px",
    fontWeight: 800,
  },

  applicationList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  applicationCard: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      "44px minmax(0, 1fr) 70px 38px",
    alignItems: "center",
    gap: "15px",
    padding: "17px",
    background: "#ffffff",
    border: "1px solid #dce5f0",
    borderRadius: "13px",
  },

  applicationAvatar: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#eaf2ff",
    color: "#1769e0",
    fontSize: "16px",
    fontWeight: 900,
  },

  applicationMain: {
    minWidth: 0,
  },

  applicationNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flexWrap: "wrap",
  },

  applicationName: {
    margin: 0,
    color: "#172f4d",
    fontSize: "14px",
    fontWeight: 850,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "23px",
    padding: "0 7px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: 850,
  },

  applicationRole: {
    margin: "5px 0 0",
    color: "#718299",
    fontSize: "12px",
  },

  applicationMeta: {
    marginTop: "9px",
    display: "flex",
    flexWrap: "wrap",
    gap: "7px 16px",
    color: "#8a98aa",
    fontSize: "10px",
  },

  matchScore: {
    textAlign: "center",
  },

  matchNumber: {
    color: "#1769e0",
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: 900,
  },

  applicationArrow: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #d5dfeb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#1769e0",
    fontSize: "17px",
    fontWeight: 900,
  },

  /* ----------------------------------------------------------
     EMPTY
     ---------------------------------------------------------- */

  emptyCard: {
    padding: "46px 24px",
    background: "#ffffff",
    border: "1px solid #dce5f0",
    borderRadius: "15px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "#edf4ff",
    color: "#1769e0",
    fontSize: "20px",
    fontWeight: 900,
  },

  emptyTitle: {
    margin: 0,
    color: "#203752",
    fontSize: "19px",
    fontWeight: 850,
  },

  emptyText: {
    maxWidth: "520px",
    margin: "9px auto 20px",
    color: "#74849a",
    fontSize: "13px",
    lineHeight: 1.65,
  },

  primaryButton: {
    minHeight: "44px",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #1769e0",
    borderRadius: "9px",
    background: "#1769e0",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
  },

  secondaryButton: {
    minHeight: "44px",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #ccd8e8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#263e5b",
    fontSize: "13px",
    fontWeight: 800,
  },

  /* ----------------------------------------------------------
     QUICK ACTIONS
     ---------------------------------------------------------- */

  quickActionsBox: {
    padding: "30px",
    background: "#ffffff",
    border: "1px solid #dce5f0",
    borderRadius: "16px",
  },

  quickActionsIntro: {
    marginBottom: "22px",
  },

  quickActionsTitle: {
    margin: 0,
    color: "#10233f",
    fontSize: "25px",
    fontWeight: 850,
  },

  quickActionsText: {
    margin: "7px 0 0",
    color: "#738399",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },

  quickAction: {
    minWidth: 0,
    minHeight: "88px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #dbe4ef",
    borderRadius: "10px",
    background: "#f9fbfd",
    color: "#203752",
  },

  quickActionIcon: {
    width: "35px",
    height: "35px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#eaf2ff",
    color: "#1769e0",
    fontSize: "15px",
    fontWeight: 900,
  },

  quickActionContent: {
    minWidth: 0,
    flex: 1,
  },

  quickActionTitle: {
    display: "block",
    color: "#233a57",
    fontSize: "12px",
    fontWeight: 850,
  },

  quickActionText: {
    display: "block",
    marginTop: "4px",
    color: "#8593a5",
    fontSize: "10px",
    lineHeight: 1.35,
  },

  quickActionArrow: {
    color: "#1769e0",
    fontSize: "16px",
    fontWeight: 900,
  },

  /* ----------------------------------------------------------
     FOOTER
     ---------------------------------------------------------- */

  footer: {
    background: "#0d1f36",
    color: "#ffffff",
    paddingTop: "46px",
    paddingBottom: "22px",
  },

  footerMain: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "60px",
    paddingBottom: "35px",
  },

  footerBrand: {
    maxWidth: "430px",
  },

  footerLogo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 850,
  },

  footerLogoMark: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#1769e0",
    color: "#ffffff",
    fontWeight: 900,
  },

  footerText: {
    margin: "13px 0 0",
    color: "#9db0c8",
    fontSize: "12px",
    lineHeight: 1.7,
  },

  footerLinks: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
  },

  footerHeading: {
    marginBottom: "12px",
    color: "#dce8f6",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  footerLink: {
    display: "block",
    marginBottom: "9px",
    color: "#9db0c8",
    fontSize: "11px",
  },

  footerBottom: {
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    color: "#7f94ae",
    fontSize: "10px",
  },

};