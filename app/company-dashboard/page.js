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
  const text = String(value || "").toLowerCase().trim();

  if (!text) return 0;

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

  if (text.includes("honours") || text.includes("honor")) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bsc") ||
    text.includes("bcom") ||
    text.includes("ba ") ||
    text === "ba"
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
    text.includes("certification")
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
// MATCH CALCULATION
// ============================================================

function calculateMatch(internship, application) {
  const requiredQualification = getQualificationLevel(
    internship?.qualification
  );

  const applicantQualification = getQualificationLevel(
    application?.qualification
  );

  let qualificationScore = 0;

  if (
    requiredQualification > 0 &&
    applicantQualification >= requiredQualification
  ) {
    qualificationScore = 35;
  } else if (
    requiredQualification > 0 &&
    applicantQualification > 0
  ) {
    qualificationScore =
      Math.min(
        applicantQualification / requiredQualification,
        1
      ) * 35;
  }

  const requiredField = String(
    internship?.field_of_study || ""
  )
    .toLowerCase()
    .trim();

  const applicantField = String(
    application?.field_of_study || ""
  )
    .toLowerCase()
    .trim();

  let fieldScore = 0;

  if (requiredField && applicantField) {
    if (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    ) {
      fieldScore = 35;
    } else {
      const requiredWords = requiredField
        .split(/[\s,;/]+/)
        .filter(Boolean);

      const applicantWords = applicantField
        .split(/[\s,;/]+/)
        .filter(Boolean);

      const overlap = requiredWords.filter((word) =>
        applicantWords.includes(word)
      );

      if (overlap.length > 0) {
        fieldScore = 20;
      }
    }
  }

  const requiredSkills = String(
    internship?.skills || ""
  )
    .toLowerCase()
    .split(/[,;/]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const applicantSkills = String(
    application?.skills || ""
  )
    .toLowerCase()
    .split(/[,;/]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  let skillsScore = 0;

  if (
    requiredSkills.length > 0 &&
    applicantSkills.length > 0
  ) {
    const matchedSkills = requiredSkills.filter(
      (requiredSkill) =>
        applicantSkills.some(
          (applicantSkill) =>
            applicantSkill.includes(requiredSkill) ||
            requiredSkill.includes(applicantSkill)
        )
    );

    skillsScore =
      (matchedSkills.length / requiredSkills.length) * 30;
  }

  const total = Math.round(
    qualificationScore + fieldScore + skillsScore
  );

  let label = "Weak";

  if (total >= 85) {
    label = "Strong";
  } else if (total >= 70) {
    label = "Good";
  } else if (total >= 40) {
    label = "Possible";
  }

  return {
    score: total,
    label,
  };
}

// ============================================================
// COMPANY DASHBOARD
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
  // HEADER SCROLL BEHAVIOUR
  // ==========================================================

  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function handleScroll() {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Always show header at the very top
          if (currentScrollY <= 20) {
            setShowHeader(true);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling UP
            setShowHeader(true);
          } else if (currentScrollY > lastScrollY) {
            // Scrolling DOWN
            setShowHeader(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });

        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);

      // --------------------------------------------------------
      // LOAD COMPANY
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
        return;
      }

      setCompany(companyData);

      // --------------------------------------------------------
      // LOAD COMPANY INTERNSHIPS
      // --------------------------------------------------------

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select("*")
        .eq("company_name", companyData.company_name)
        .order("created_at", { ascending: false });

      if (internshipError) {
        throw internshipError;
      }

      const loadedInternships = internshipData || [];

      setInternships(loadedInternships);

      // --------------------------------------------------------
      // LOAD APPLICATIONS
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
          .order("created_at", { ascending: false });

        if (applicationError) {
          throw applicationError;
        }

        setApplications(applicationData || []);
      } else {
        setApplications([]);
      }

      // --------------------------------------------------------
      // LOAD SUBSCRIPTION
      // --------------------------------------------------------

      await loadSubscription(companyData.id);
    } catch (err) {
      console.error(
        "Dashboard loading error:",
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

  // ============================================================
  // LOAD SUBSCRIPTION
  // ============================================================

  async function loadSubscription(companyId) {
    try {
      setSubscriptionLoading(true);

      const {
        data,
        error: subscriptionError,
      } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Subscription loading error:",
          subscriptionError
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

  // ============================================================
  // LOGOUT
  // ============================================================

  async function logout() {
    await supabase.auth.signOut();

    try {
      localStorage.removeItem("gradlink_profile");
    } catch (error) {
      console.error(error);
    }

    router.push("/login");
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalApplications = applications.length;

  const shortlistedApplications =
    applications.filter(
      (application) =>
        String(
          application.status || ""
        ).toLowerCase() === "shortlisted"
    ).length;

  const rejectedApplications =
    applications.filter(
      (application) =>
        String(
          application.status || ""
        ).toLowerCase() === "rejected"
    ).length;

  const pendingApplications =
    applications.filter((application) => {
      const status = String(
        application.status || "pending"
      ).toLowerCase();

      return (
        status !== "shortlisted" &&
        status !== "rejected"
      );
    }).length;

  const premiumActive =
    subscription?.status === "active";

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingLogo}>
            GL
          </div>

          <div style={styles.spinner}></div>

          <h2 style={styles.loadingTitle}>
            Loading your dashboard
          </h2>

          <p style={styles.loadingText}>
            Preparing your GradLink SA recruitment
            workspace...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h1 style={styles.errorTitle}>
            Something went wrong
          </h1>

          <p style={styles.errorText}>
            {error}
          </p>

          <div style={styles.errorActions}>
            <button
              onClick={loadDashboard}
              style={styles.primaryButton}
            >
              Try Again
            </button>

            <Link
              href="/company"
              style={styles.secondaryButton}
            >
              Company Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <main style={styles.page}>

      {/* ======================================================
          TOP NAVIGATION
      ====================================================== */}

      <header
        style={{
          ...styles.header,
          transform: showHeader
            ? "translateY(0)"
            : "translateY(-110%)",
        }}
      >
        <div style={styles.headerInner}>

          {/* LOGO */}

          <Link
            href="/"
            style={styles.logoLink}
          >
            <div style={styles.logoMark}>
              GL
            </div>

            <div>
              <div style={styles.logoText}>
                GradLink <span>SA</span>
              </div>

              <div style={styles.logoSubtext}>
                RECRUITMENT PORTAL
              </div>
            </div>
          </Link>

          {/* NAVIGATION */}

          <nav style={styles.nav}>

            <Link
              href="/"
              style={{
                ...styles.navButton,
                ...styles.navButtonHome,
              }}
            >
              <span style={styles.navIcon}>
                ⌂
              </span>

              <span>Home</span>
            </Link>

            <Link
              href="/company"
              style={{
                ...styles.navButton,
                ...styles.navButtonProfile,
              }}
            >
              <span style={styles.navIcon}>
                ▣
              </span>

              <span>Company Profile</span>
            </Link>

            <Link
              href="/internships"
              style={{
                ...styles.navButton,
                ...styles.navButtonPost,
              }}
            >
              <span style={styles.navPlus}>
                ＋
              </span>

              <span>Post Internship</span>
            </Link>

            <Link
              href="/company-pricing"
              style={{
                ...styles.navButton,
                ...styles.navButtonPremium,
              }}
            >
              <span style={styles.navIcon}>
                ✦
              </span>

              <span>GradLink Premium</span>
            </Link>

            <button
              onClick={logout}
              style={{
                ...styles.navButton,
                ...styles.navButtonLogout,
              }}
            >
              <span style={styles.navIcon}>
                ↪
              </span>

              <span>Logout</span>
            </button>

          </nav>
        </div>
      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section style={styles.heroSection}>
        <div style={styles.heroGlow}></div>

        <div style={styles.container}>
          <div style={styles.heroGrid}>

            <div style={styles.heroContent}>

              <div style={styles.heroEyebrow}>
                <span style={styles.liveDot}></span>
                COMPANY WORKSPACE
              </div>

              <h1 style={styles.heroTitle}>
                Welcome back,
                <br />

                <span>
                  {company?.company_name ||
                    "Your Company"}
                </span>
              </h1>

              <p style={styles.heroDescription}>
                Manage your internships, review graduate
                applications, and build your recruitment
                pipeline from one professional workspace.
              </p>

              <div style={styles.heroActions}>

                <Link
                  href="/internships"
                  style={styles.heroPrimaryButton}
                >
                  <span>＋</span>
                  Post New Internship
                </Link>

                <Link
                  href="/company"
                  style={styles.heroSecondaryButton}
                >
                  View Company Profile
                  <span>→</span>
                </Link>

              </div>
            </div>

            <div style={styles.heroPanel}>

              <div style={styles.heroPanelTop}>
                <div>
                  <div style={styles.heroPanelLabel}>
                    RECRUITMENT OVERVIEW
                  </div>

                  <div style={styles.heroPanelTitle}>
                    Your hiring pipeline
                  </div>
                </div>

                <div style={styles.heroPanelIcon}>
                  ✦
                </div>
              </div>

              <div style={styles.heroPanelStats}>

                <div>
                  <div style={styles.heroNumber}>
                    {internships.length}
                  </div>

                  <div style={styles.heroStatLabel}>
                    Active Listings
                  </div>
                </div>

                <div>
                  <div style={styles.heroNumber}>
                    {totalApplications}
                  </div>

                  <div style={styles.heroStatLabel}>
                    Applications
                  </div>
                </div>

              </div>

              <div style={styles.heroPanelBottom}>
                <span style={styles.heroPanelStatus}>
                  <span style={styles.statusDot}></span>
                  Recruitment workspace active
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <section style={styles.statsSection}>
        <div style={styles.container}>

          <div style={styles.statsGrid}>

            <StatCard
              icon="▤"
              label="Internship Listings"
              value={internships.length}
              description="Published opportunities"
            />

            <StatCard
              icon="◉"
              label="Applications"
              value={totalApplications}
              description="Graduate applications"
            />

            <StatCard
              icon="✓"
              label="Shortlisted"
              value={shortlistedApplications}
              description="Candidates shortlisted"
            />

            <StatCard
              icon="◷"
              label="Pending Review"
              value={pendingApplications}
              description="Applications awaiting review"
            />

          </div>
        </div>
      </section>

      {/* ======================================================
          PREMIUM SECTION
      ====================================================== */}

      <section style={styles.premiumSection}>
        <div style={styles.container}>

          <div
            style={{
              ...styles.premiumCard,
              ...(premiumActive
                ? styles.premiumCardActive
                : {}),
            }}
          >

            <div style={styles.premiumGlow}></div>

            <div style={styles.premiumContent}>

              <div style={styles.premiumBadge}>
                <span>✦</span>
                GRADLINK PREMIUM
              </div>

              <h2 style={styles.premiumTitle}>
                {premiumActive
                  ? "Your company is using GradLink Premium"
                  : "Take your recruitment further"}
              </h2>

              <p style={styles.premiumDescription}>
                Unlock premium recruitment capabilities
                designed to help companies discover,
                evaluate and manage graduate talent more
                efficiently.
              </p>

              <div style={styles.premiumFeatures}>

                <PremiumFeature
                  icon="✦"
                  title="Advanced Recruitment Tools"
                />

                <PremiumFeature
                  icon="✓"
                  title="Enhanced Candidate Insights"
                />

                <PremiumFeature
                  icon="◈"
                  title="Premium Verification Features"
                />

              </div>
            </div>

            <div style={styles.subscriptionBox}>

              {subscriptionLoading ? (
                <div style={styles.subscriptionLoading}>
                  Checking subscription...
                </div>
              ) : (
                <>

                  <div
                    style={
                      styles.subscriptionStatusRow
                    }
                  >

                    <div>
                      <div
                        style={
                          styles.subscriptionSmallLabel
                        }
                      >
                        CURRENT PLAN
                      </div>

                      <div
                        style={
                          styles.subscriptionPlan
                        }
                      >
                        {subscription?.plan ||
                          "No active plan"}
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.activeBadge,
                        ...(premiumActive
                          ? styles.activeBadgeGreen
                          : styles.activeBadgeGray),
                      }}
                    >
                      <span></span>

                      {premiumActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </div>

                  </div>

                  {subscription?.monthly_price != null && (
                    <SubscriptionDetail
                      label="Monthly Price"
                      value={`R${Number(
                        subscription.monthly_price
                      ).toLocaleString()}`}
                    />
                  )}

                  {subscription?.current_period_end && (
                    <SubscriptionDetail
                      label="Current Period Ends"
                      value={formatDate(
                        subscription.current_period_end
                      )}
                    />
                  )}

                  <Link
                    href="/company-pricing"
                    style={styles.premiumButton}
                  >
                    {premiumActive
                      ? "Manage Premium"
                      : "View Plans & Upgrade"}

                    <span>→</span>
                  </Link>

                </>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          INTERNSHIPS
      ====================================================== */}

      <section style={styles.internshipsSection}>
        <div style={styles.container}>

          <div style={styles.sectionHeader}>

            <div>
              <div style={styles.sectionEyebrow}>
                YOUR OPPORTUNITIES
              </div>

              <h2 style={styles.sectionTitle}>
                Internship Listings
              </h2>

              <p style={styles.sectionDescription}>
                Manage your opportunities and review
                graduate applications.
              </p>
            </div>

            <Link
              href="/internships"
              style={styles.sectionAction}
            >
              <span>＋</span>
              Post Internship
            </Link>

          </div>

          {internships.length === 0 ? (
            <div style={styles.emptyState}>

              <div style={styles.emptyIcon}>
                +
              </div>

              <h3 style={styles.emptyTitle}>
                No internships posted yet
              </h3>

              <p style={styles.emptyText}>
                Create your first internship opportunity
                and start connecting with qualified
                graduates.
              </p>

              <Link
                href="/internships"
                style={styles.emptyButton}
              >
                Create Internship
                <span>→</span>
              </Link>

            </div>
          ) : (

            <div style={styles.internshipGrid}>

              {internships.map((internship) => {

                const internshipApplications =
                  applications.filter(
                    (application) =>
                      application.internship_id ===
                      internship.id
                  );

                const internshipShortlisted =
                  internshipApplications.filter(
                    (application) =>
                      String(
                        application.status || ""
                      ).toLowerCase() ===
                      "shortlisted"
                  ).length;

                const internshipPending =
                  internshipApplications.filter(
                    (application) => {
                      const status = String(
                        application.status ||
                          "pending"
                      ).toLowerCase();

                      return (
                        status !== "shortlisted" &&
                        status !== "rejected"
                      );
                    }
                  ).length;

                return (
                  <article
                    key={internship.id}
                    style={styles.internshipCard}
                  >

                    {/* CARD TOP */}

                    <div style={styles.cardTop}>

                      <div style={styles.cardIcon}>
                        ◈
                      </div>

                      <PipelineBadge
                        count={
                          internshipApplications.length
                        }
                      />

                    </div>

                    {/* TITLE */}

                    <h3 style={styles.internshipTitle}>
                      {internship.job_title ||
                        "Internship Opportunity"}
                    </h3>

                    <div style={styles.companyName}>
                      {internship.company_name ||
                        company?.company_name ||
                        "Your Company"}
                    </div>

                    {/* DETAILS */}

                    <div style={styles.detailsList}>

                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>
                          ◎
                        </span>

                        <span>
                          {internship.location ||
                            "Location not specified"}
                        </span>
                      </div>

                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>
                          ◫
                        </span>

                        <span>
                          {internship.internship_type ||
                            "Internship"}
                        </span>
                      </div>

                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>
                          ◷
                        </span>

                        <span>
                          Deadline:{" "}
                          {formatDate(
                            internship.deadline
                          )}
                        </span>
                      </div>

                    </div>

                    {/* APPLICATION PIPELINE */}

                    <div
                      style={
                        styles.applicationPipeline
                      }
                    >

                      <div
                        style={
                          styles.pipelineHeader
                        }
                      >
                        <span>
                          Application Pipeline
                        </span>

                        <strong>
                          {
                            internshipApplications.length
                          }
                        </strong>
                      </div>

                      <div
                        style={
                          styles.pipelineStats
                        }
                      >

                        <div
                          style={
                            styles.pipelineItem
                          }
                        >
                          <span
                            style={{
                              ...styles.pipelineDot,
                              background:
                                "#1261ff",
                            }}
                          ></span>

                          <span>
                            {
                              internshipApplications.length
                            }{" "}
                            Total
                          </span>
                        </div>

                        <div
                          style={
                            styles.pipelineItem
                          }
                        >
                          <span
                            style={{
                              ...styles.pipelineDot,
                              background:
                                "#16a34a",
                            }}
                          ></span>

                          <span>
                            {internshipShortlisted}{" "}
                            Shortlisted
                          </span>
                        </div>

                        <div
                          style={
                            styles.pipelineItem
                          }
                        >
                          <span
                            style={{
                              ...styles.pipelineDot,
                              background:
                                "#f59e0b",
                            }}
                          ></span>

                          <span>
                            {internshipPending}{" "}
                            Pending
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div style={styles.cardActions}>

                      <Link
                        href={`/company/internships/${internship.id}/applicants`}
                        style={
                          styles.viewApplicantsButton
                        }
                      >
                        <span>◉</span>

                        View Applicants

                        <span
                          style={styles.arrow}
                        >
                          →
                        </span>
                      </Link>

                      <Link
                        href={`/internships/${internship.id}`}
                        style={
                          styles.viewInternshipButton
                        }
                      >
                        View Internship
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
          RECRUITMENT CTA
      ====================================================== */}

      <section style={styles.ctaSection}>
        <div style={styles.container}>

          <div style={styles.ctaCard}>

            <div style={styles.ctaPattern}></div>

            <div style={styles.ctaContent}>

              <div style={styles.ctaIcon}>
                ✦
              </div>

              <div>

                <div style={styles.ctaEyebrow}>
                  GRADLINK SA
                </div>

                <h2 style={styles.ctaTitle}>
                  Ready to find your next graduate?
                </h2>

                <p style={styles.ctaText}>
                  Publish an internship opportunity and
                  connect with graduates looking for their
                  next career opportunity.
                </p>

              </div>

            </div>

            <Link
              href="/internships"
              style={styles.ctaButton}
            >
              Post an Internship
              <span>→</span>
            </Link>

          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <div style={styles.container}>

          <div style={styles.footerInner}>

            <div style={styles.footerBrand}>

              <div style={styles.footerLogo}>
                GL
              </div>

              <div>

                <div style={styles.footerName}>
                  GradLink SA
                </div>

                <div style={styles.footerTagline}>
                  Connecting South African graduates
                  with opportunity.
                </div>

              </div>
            </div>

            <div style={styles.footerLinks}>

              <Link
                href="/"
                style={styles.footerLink}
              >
                Home
              </Link>

              <Link
                href="/company"
                style={styles.footerLink}
              >
                Company Profile
              </Link>

              <Link
                href="/company-pricing"
                style={styles.footerLink}
              >
                Premium
              </Link>

            </div>

          </div>

          <div style={styles.footerBottom}>

            <span>
              © {new Date().getFullYear()} GradLink SA.
              All rights reserved.
            </span>

            <span>
              Built for South African talent.
            </span>

          </div>

        </div>
      </footer>

    </main>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div style={styles.statCard}>

      <div style={styles.statTop}>

        <div style={styles.statIcon}>
          {icon}
        </div>

        <div style={styles.statArrow}>
          ↗
        </div>

      </div>

      <div style={styles.statValue}>
        {value}
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
}) {
  return (
    <div style={styles.premiumFeature}>

      <div style={styles.premiumFeatureIcon}>
        {icon}
      </div>

      <span>{title}</span>

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
// PIPELINE BADGE
// ============================================================

function PipelineBadge({ count }) {
  return (
    <div style={styles.pipelineBadge}>

      <span></span>

      {count}{" "}
      {count === 1
        ? "Application"
        : "Applications"}

    </div>
  );
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
  if (!value) {
    return "Not specified";
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
    return String(value);
  }
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fbff 0%, #ffffff 42%, #f7faff 100%)",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1220px",
    margin: "0 auto",
    padding: "0 22px",
    boxSizing: "border-box",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background:
      "rgba(255,255,255,0.97)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom:
      "1px solid rgba(15,23,42,0.09)",
    boxShadow:
      "0 8px 28px rgba(15,23,42,0.07)",
    transition:
      "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
    willChange: "transform",
  },

  headerInner: {
    width: "100%",
    maxWidth: "1220px",
    margin: "0 auto",
    padding: "12px 22px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },

  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    textDecoration: "none",
    color: "#0f172a",
    flexShrink: 0,
  },

  logoMark: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0b4fd7, #1687ff)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "-0.5px",
    boxShadow:
      "0 9px 22px rgba(18,97,255,0.28)",
  },

  logoText: {
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-0.7px",
  },

  logoSubtext: {
    marginTop: "5px",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#64748b",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "7px",
    padding: "5px",
    borderRadius: "16px",
    background: "#f5f8fc",
    border:
      "1px solid rgba(15,23,42,0.08)",
    boxShadow:
      "inset 0 1px 2px rgba(15,23,42,0.035)",
  },

  // ==========================================================
  // NAV BUTTONS
  // ==========================================================

  navButton: {
    minHeight: "40px",
    padding: "0 13px",
    borderRadius: "11px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 780,
    cursor: "pointer",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    transition:
      "all 0.18s ease",
    fontFamily: "inherit",
    outline: "none",
  },

  navButtonHome: {
    color: "#1e3a5f",
    background: "#ffffff",
    border:
      "1px solid rgba(37,99,235,0.18)",
    boxShadow:
      "0 3px 8px rgba(15,23,42,0.07)",
  },

  navButtonProfile: {
    color: "#1e3a5f",
    background: "#ffffff",
    border:
      "1px solid rgba(37,99,235,0.18)",
    boxShadow:
      "0 3px 8px rgba(15,23,42,0.07)",
  },

  navButtonPost: {
    color: "#ffffff",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    border:
      "1px solid rgba(18,97,255,0.55)",
    boxShadow:
      "0 6px 13px rgba(18,97,255,0.22)",
  },

  navButtonPremium: {
    color: "#543300",
    background:
      "linear-gradient(135deg, #fff8df, #ffedab)",
    border:
      "1px solid rgba(245,158,11,0.35)",
    boxShadow:
      "0 4px 10px rgba(245,158,11,0.11)",
  },

  navButtonLogout: {
    color: "#475569",
    background: "#ffffff",
    border:
      "1px solid rgba(100,116,139,0.20)",
    boxShadow:
      "0 3px 8px rgba(15,23,42,0.05)",
  },

  navIcon: {
    fontSize: "14px",
    lineHeight: 1,
  },

  navPlus: {
    fontSize: "16px",
    lineHeight: 1,
    fontWeight: 500,
  },

  // ==========================================================
  // HERO
  // ==========================================================

  heroSection: {
    position: "relative",
    overflow: "hidden",
    padding:
      "125px 0 70px",
    background:
      "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.12), transparent 35%), radial-gradient(circle at 90% 20%, rgba(14,165,233,0.10), transparent 32%), linear-gradient(135deg, #eef6ff, #ffffff 58%, #f5f9ff)",
    borderBottom:
      "1px solid rgba(37,99,235,0.08)",
  },

  heroGlow: {
    position: "absolute",
    width: "420px",
    height: "420px",
    right: "-180px",
    top: "-180px",
    borderRadius: "50%",
    background:
      "rgba(37,99,235,0.08)",
    filter: "blur(4px)",
  },

  heroGrid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
    alignItems: "center",
    gap: "55px",
  },

  heroContent: {
    maxWidth: "720px",
  },

  heroEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    background:
      "rgba(18,97,255,0.08)",
    border:
      "1px solid rgba(18,97,255,0.12)",
    color: "#1261ff",
    fontSize: "10px",
    fontWeight: 850,
    letterSpacing: "1.5px",
  },

  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#16a34a",
    boxShadow:
      "0 0 0 4px rgba(22,163,74,0.10)",
  },

  heroTitle: {
    margin:
      "20px 0 18px",
    fontSize: "clamp(38px, 5vw, 64px)",
    lineHeight: 1.02,
    letterSpacing: "-3px",
    fontWeight: 900,
    color: "#0f172a",
  },

  heroDescription: {
    maxWidth: "650px",
    margin: 0,
    color: "#64748b",
    fontSize: "16px",
    lineHeight: 1.75,
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "30px",
  },

  heroPrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    minHeight: "50px",
    padding: "0 19px",
    borderRadius: "14px",
    textDecoration: "none",
    color: "#ffffff",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    border:
      "1px solid rgba(18,97,255,0.5)",
    boxShadow:
      "0 12px 25px rgba(18,97,255,0.24)",
    fontWeight: 800,
    fontSize: "14px",
  },

  heroSecondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "50px",
    padding: "0 19px",
    borderRadius: "14px",
    textDecoration: "none",
    color: "#1e3a5f",
    background: "#ffffff",
    border:
      "1px solid rgba(37,99,235,0.18)",
    boxShadow:
      "0 8px 20px rgba(15,23,42,0.06)",
    fontWeight: 750,
    fontSize: "14px",
  },

  heroPanel: {
    position: "relative",
    padding: "25px",
    borderRadius: "24px",
    background:
      "linear-gradient(145deg, #0c3f9c, #1261ff)",
    color: "#ffffff",
    boxShadow:
      "0 24px 55px rgba(18,97,255,0.23)",
    overflow: "hidden",
  },

  heroPanelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  heroPanelLabel: {
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "1.6px",
    opacity: 0.72,
  },

  heroPanelTitle: {
    marginTop: "8px",
    fontSize: "21px",
    fontWeight: 850,
    letterSpacing: "-0.6px",
  },

  heroPanelIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.14)",
    border:
      "1px solid rgba(255,255,255,0.16)",
    fontSize: "18px",
  },

  heroPanelStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "35px",
  },

  heroNumber: {
    fontSize: "38px",
    fontWeight: 900,
    letterSpacing: "-2px",
  },

  heroStatLabel: {
    marginTop: "4px",
    fontSize: "11px",
    opacity: 0.72,
  },

  heroPanelBottom: {
    marginTop: "30px",
    paddingTop: "17px",
    borderTop:
      "1px solid rgba(255,255,255,0.14)",
  },

  heroPanelStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    opacity: 0.82,
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#86efac",
  },

  // ==========================================================
  // STATS
  // ==========================================================

  statsSection: {
    padding: "30px 0 10px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  statCard: {
    padding: "21px",
    borderRadius: "19px",
    background: "#ffffff",
    border:
      "1px solid rgba(15,23,42,0.07)",
    boxShadow:
      "0 10px 28px rgba(15,23,42,0.055)",
  },

  statTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(18,97,255,0.08)",
    color: "#1261ff",
    fontSize: "16px",
    fontWeight: 800,
  },

  statArrow: {
    color: "#94a3b8",
    fontSize: "17px",
  },

  statValue: {
    marginTop: "18px",
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-1.5px",
  },

  statLabel: {
    marginTop: "9px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
  },

  statDescription: {
    marginTop: "5px",
    fontSize: "11px",
    color: "#94a3b8",
  },

  // ==========================================================
  // PREMIUM
  // ==========================================================

  premiumSection: {
    padding: "30px 0 20px",
  },

  premiumCard: {
    position: "relative",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.45fr) minmax(280px, 0.55fr)",
    gap: "30px",
    padding: "32px",
    borderRadius: "25px",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0b1730, #102d62 58%, #123f8e)",
    color: "#ffffff",
    boxShadow:
      "0 22px 55px rgba(15,23,42,0.16)",
  },

  premiumCardActive: {
    background:
      "linear-gradient(135deg, #081b35, #0c3978 58%, #1261ff)",
  },

  premiumGlow: {
    position: "absolute",
    width: "300px",
    height: "300px",
    right: "-100px",
    top: "-130px",
    borderRadius: "50%",
    background:
      "rgba(56,189,248,0.13)",
    filter: "blur(10px)",
  },

  premiumContent: {
    position: "relative",
    zIndex: 1,
  },

  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 11px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "1.3px",
    color: "#dbeafe",
  },

  premiumTitle: {
    margin:
      "18px 0 10px",
    fontSize: "clamp(25px, 3vw, 34px)",
    lineHeight: 1.1,
    letterSpacing: "-1.3px",
    fontWeight: 900,
  },

  premiumDescription: {
    maxWidth: "680px",
    margin: 0,
    color: "#bfdbfe",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  premiumFeatures: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
    marginTop: "23px",
  },

  premiumFeature: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 11px",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.07)",
    border:
      "1px solid rgba(255,255,255,0.10)",
    fontSize: "10px",
    color: "#dbeafe",
  },

  premiumFeatureIcon: {
    color: "#93c5fd",
    fontWeight: 900,
  },

  subscriptionBox: {
    position: "relative",
    zIndex: 2,
    alignSelf: "stretch",
    padding: "22px",
    borderRadius: "19px",
    background:
      "rgba(255,255,255,0.08)",
    border:
      "1px solid rgba(255,255,255,0.13)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  subscriptionLoading: {
    height: "100%",
    minHeight: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#bfdbfe",
    fontSize: "12px",
  },

  subscriptionStatusRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  subscriptionSmallLabel: {
    fontSize: "8px",
    letterSpacing: "1.3px",
    fontWeight: 850,
    color: "#93c5fd",
  },

  subscriptionPlan: {
    marginTop: "6px",
    fontSize: "18px",
    fontWeight: 850,
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    borderRadius: "999px",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  activeBadgeGreen: {
    color: "#bbf7d0",
    background:
      "rgba(22,163,74,0.18)",
    border:
      "1px solid rgba(134,239,172,0.18)",
  },

  activeBadgeGray: {
    color: "#cbd5e1",
    background:
      "rgba(148,163,184,0.13)",
    border:
      "1px solid rgba(148,163,184,0.16)",
  },

  subscriptionDetail: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding:
      "11px 0",
    marginTop: "7px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    color: "#bfdbfe",
    fontSize: "10px",
  },

  premiumButton: {
    marginTop: "18px",
    width: "100%",
    minHeight: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxSizing: "border-box",
    borderRadius: "12px",
    textDecoration: "none",
    background: "#ffffff",
    color: "#0b4fd7",
    fontSize: "12px",
    fontWeight: 850,
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.12)",
  },

  // ==========================================================
  // INTERNSHIPS
  // ==========================================================

  internshipsSection: {
    padding: "55px 0 35px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "25px",
  },

  sectionEyebrow: {
    color: "#1261ff",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1.7px",
  },

  sectionTitle: {
    margin:
      "8px 0 6px",
    fontSize: "32px",
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: "-1.4px",
  },

  sectionDescription: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  sectionAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "44px",
    padding: "0 15px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 800,
    boxShadow:
      "0 9px 20px rgba(18,97,255,0.18)",
  },

  internshipGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  internshipCard: {
    padding: "22px",
    borderRadius: "20px",
    background: "#ffffff",
    border:
      "1px solid rgba(15,23,42,0.07)",
    boxShadow:
      "0 12px 32px rgba(15,23,42,0.055)",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  cardIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #e8f1ff, #f4f8ff)",
    color: "#1261ff",
    border:
      "1px solid rgba(18,97,255,0.10)",
    fontSize: "18px",
    fontWeight: 900,
  },

  pipelineBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 9px",
    borderRadius: "999px",
    background: "#f1f6ff",
    color: "#2452a5",
    border:
      "1px solid rgba(18,97,255,0.10)",
    fontSize: "9px",
    fontWeight: 800,
  },

  internshipTitle: {
    margin:
      "20px 0 5px",
    fontSize: "20px",
    lineHeight: 1.2,
    fontWeight: 900,
    letterSpacing: "-0.6px",
  },

  companyName: {
    color: "#1261ff",
    fontSize: "12px",
    fontWeight: 750,
  },

  detailsList: {
    display: "grid",
    gap: "8px",
    marginTop: "19px",
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#64748b",
    fontSize: "11px",
  },

  detailIcon: {
    width: "23px",
    height: "23px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#f5f8fc",
    color: "#1261ff",
    fontSize: "11px",
  },

  applicationPipeline: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "14px",
    background: "#f8fafc",
    border:
      "1px solid rgba(15,23,42,0.055)",
  },

  pipelineHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#475569",
    fontSize: "10px",
    fontWeight: 750,
  },

  pipelineStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "11px",
  },

  pipelineItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    color: "#64748b",
    fontSize: "9px",
  },

  pipelineDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  // ==========================================================
  // CARD BUTTONS
  // ==========================================================

  cardActions: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "9px",
    marginTop: "17px",
  },

  viewApplicantsButton: {
    minHeight: "43px",
    padding: "0 12px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 850,
    boxShadow:
      "0 8px 17px rgba(18,97,255,0.18)",
    border:
      "1px solid rgba(18,97,255,0.35)",
  },

  arrow: {
    marginLeft: "2px",
    fontSize: "13px",
  },

  viewInternshipButton: {
    minHeight: "43px",
    padding: "0 10px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#334155",
    border:
      "1px solid rgba(15,23,42,0.12)",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: 750,
    boxShadow:
      "0 3px 8px rgba(15,23,42,0.04)",
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    padding: "60px 25px",
    textAlign: "center",
    borderRadius: "22px",
    background: "#ffffff",
    border:
      "1px dashed rgba(37,99,235,0.22)",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.04)",
  },

  emptyIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #e8f1ff, #f5f9ff)",
    color: "#1261ff",
    fontSize: "26px",
    fontWeight: 400,
  },

  emptyTitle: {
    margin:
      "18px 0 7px",
    fontSize: "20px",
    fontWeight: 850,
  },

  emptyText: {
    maxWidth: "500px",
    margin:
      "0 auto",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.65,
  },

  emptyButton: {
    marginTop: "22px",
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 16px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    color: "#ffffff",
    textDecoration: "none",
        fontSize: "11px",
    fontWeight: 800,
    boxShadow:
      "0 8px 18px rgba(18,97,255,0.18)",
  },

  // ==========================================================
  // CTA
  // ==========================================================

  ctaSection: {
    padding: "35px 0 60px",
  },

  ctaCard: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    padding: "30px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, #0b4fd7, #1261ff 58%, #1687ff)",
    color: "#ffffff",
    boxShadow:
      "0 22px 48px rgba(18,97,255,0.20)",
  },

  ctaPattern: {
    position: "absolute",
    width: "280px",
    height: "280px",
    right: "-100px",
    top: "-130px",
    borderRadius: "50%",
    border:
      "55px solid rgba(255,255,255,0.06)",
    boxSizing: "border-box",
  },

  ctaContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: "18px",
    minWidth: 0,
  },

  ctaIcon: {
    width: "52px",
    height: "52px",
    flexShrink: 0,
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.13)",
    border:
      "1px solid rgba(255,255,255,0.16)",
    fontSize: "20px",
  },

  ctaEyebrow: {
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1.6px",
    opacity: 0.75,
  },

  ctaTitle: {
    margin:
      "7px 0 6px",
    fontSize: "25px",
    lineHeight: 1.15,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  ctaText: {
    maxWidth: "650px",
    margin: 0,
    color: "rgba(255,255,255,0.76)",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  ctaButton: {
    position: "relative",
    zIndex: 2,
    flexShrink: 0,
    minHeight: "46px",
    padding: "0 17px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: "#ffffff",
    color: "#0b4fd7",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 850,
    boxShadow:
      "0 9px 22px rgba(0,0,0,0.13)",
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    padding:
      "30px 0 20px",
    background: "#081426",
    color: "#ffffff",
  },

  footerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    paddingBottom: "25px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  footerLogo: {
    width: "39px",
    height: "39px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #1261ff, #1687ff)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 900,
    boxShadow:
      "0 7px 18px rgba(18,97,255,0.22)",
  },

  footerName: {
    fontSize: "15px",
    fontWeight: 850,
    letterSpacing: "-0.4px",
  },

  footerTagline: {
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "10px",
  },

  footerLinks: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "18px",
  },

  footerLink: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 700,
  },

  footerBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    paddingTop: "18px",
    color: "#64748b",
    fontSize: "9px",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "25px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #eef6ff, #ffffff)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px 28px",
    textAlign: "center",
    borderRadius: "24px",
    background: "#ffffff",
    border:
      "1px solid rgba(15,23,42,0.07)",
    boxShadow:
      "0 20px 55px rgba(15,23,42,0.08)",
  },

  loadingLogo: {
    width: "56px",
    height: "56px",
    margin: "0 auto",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 900,
    boxShadow:
      "0 12px 25px rgba(18,97,255,0.22)",
  },

  spinner: {
    width: "30px",
    height: "30px",
    margin: "24px auto 0",
    borderRadius: "50%",
    border:
      "3px solid #e2e8f0",
    borderTopColor: "#1261ff",
    animation:
      "gradlinkSpin 0.8s linear infinite",
  },

  loadingTitle: {
    margin:
      "20px 0 7px",
    fontSize: "19px",
    fontWeight: 850,
    letterSpacing: "-0.5px",
    color: "#0f172a",
  },

  loadingText: {
    maxWidth: "320px",
    margin: "0 auto",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorCard: {
    width: "calc(100% - 40px)",
    maxWidth: "520px",
    margin: "120px auto 50px",
    padding: "35px 28px",
    textAlign: "center",
    borderRadius: "22px",
    background: "#ffffff",
    border:
      "1px solid rgba(15,23,42,0.08)",
    boxShadow:
      "0 18px 45px rgba(15,23,42,0.08)",
    boxSizing: "border-box",
  },

  errorIcon: {
    width: "52px",
    height: "52px",
    margin: "0 auto",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff1f2",
    color: "#dc2626",
    border:
      "1px solid rgba(220,38,38,0.10)",
    fontSize: "22px",
    fontWeight: 900,
  },

  errorTitle: {
    margin:
      "18px 0 8px",
    fontSize: "22px",
    fontWeight: 900,
    letterSpacing: "-0.8px",
  },

  errorText: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.65,
  },

  errorActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "22px",
  },

  primaryButton: {
    minHeight: "43px",
    padding: "0 16px",
    borderRadius: "11px",
    border:
      "1px solid rgba(18,97,255,0.45)",
    background:
      "linear-gradient(135deg, #1261ff, #0b4fd7)",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "11px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow:
      "0 8px 18px rgba(18,97,255,0.18)",
  },

  secondaryButton: {
    minHeight: "43px",
    padding: "0 16px",
    borderRadius: "11px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#334155",
    border:
      "1px solid rgba(15,23,42,0.12)",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 800,
    boxShadow:
      "0 3px 8px rgba(15,23,42,0.04)",
  },
};

// ============================================================
// RESPONSIVE STYLES
// ============================================================

if (typeof document !== "undefined") {
  const styleId = "gradlink-company-dashboard-styles";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;

    style.innerHTML = `
      @keyframes gradlinkSpin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1050px) {
        .gradlink-dashboard-placeholder {
          display: none;
        }
      }

      @media (max-width: 900px) {
        body {
          overflow-x: hidden;
        }
      }

      @media (max-width: 760px) {
        header {
          transform-origin: top center;
        }
      }
    `;

    document.head.appendChild(style);
  }
}