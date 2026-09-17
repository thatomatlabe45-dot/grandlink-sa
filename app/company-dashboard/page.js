"use client";

import { useEffect, useMemo, useState } from "react";
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

  const text = String(value).toLowerCase().trim();

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
    text.includes("post-grad")
  ) {
    return 6;
  }

  if (text.includes("honours") || text.includes("honors")) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bsc") ||
    text.includes("bcom") ||
    text.includes("ba ") ||
    text.includes("national diploma")
  ) {
    return 4;
  }

  if (
    text.includes("diploma") ||
    text.includes("n.dip") ||
    text.includes("ndip")
  ) {
    return 3;
  }

  if (
    text.includes("certificate") ||
    text.includes("certification") ||
    text.includes("nqf")
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
// NORMALISE TEXT
// ============================================================

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SKILL MATCHING
// ============================================================

function calculateSkillMatch(applicantSkills, requiredSkills) {
  const applicant = normalise(applicantSkills);
  const required = normalise(requiredSkills);

  if (!required) {
    return {
      score: 30,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const requiredList = required
    .split(/[,\n|]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (requiredList.length === 0) {
    return {
      score: 30,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = [];
  const missingSkills = [];

  requiredList.forEach((skill) => {
    if (
      applicant.includes(skill) ||
      skill
        .split(" ")
        .filter(Boolean)
        .some((word) => word.length > 2 && applicant.includes(word))
    ) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const score = Math.round(
    (matchedSkills.length / requiredList.length) * 30
  );

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}

// ============================================================
// AI MATCHING
// ============================================================

function calculateMatch(application, internship) {
  const applicantQualification = getQualificationLevel(
    application?.qualification
  );

  const requiredQualification = getQualificationLevel(
    internship?.qualification
  );

  let qualificationScore = 0;

  if (requiredQualification === 0) {
    qualificationScore = 35;
  } else if (applicantQualification >= requiredQualification) {
    qualificationScore = 35;
  } else if (applicantQualification > 0) {
    const difference =
      requiredQualification - applicantQualification;

    if (difference === 1) {
      qualificationScore = 18;
    } else {
      qualificationScore = 5;
    }
  }

  const applicantField = normalise(
    application?.field_of_study
  );

  const requiredField = normalise(
    internship?.field_of_study
  );

  let fieldScore = 0;

  if (!requiredField) {
    fieldScore = 35;
  } else if (
    applicantField &&
    (
      applicantField.includes(requiredField) ||
      requiredField.includes(applicantField)
    )
  ) {
    fieldScore = 35;
  } else {
    const requiredWords = requiredField
      .split(" ")
      .filter((word) => word.length > 2);

    const matchingWords = requiredWords.filter((word) =>
      applicantField.includes(word)
    );

    if (matchingWords.length > 0) {
      fieldScore = Math.min(
        35,
        Math.round(
          (matchingWords.length / requiredWords.length) * 35
        )
      );
    }
  }

  const skillResult = calculateSkillMatch(
    application?.skills,
    internship?.skills
  );

  const totalScore =
    qualificationScore +
    fieldScore +
    skillResult.score;

  let label = "Weak";

  if (totalScore >= 85) {
    label = "Strong";
  } else if (totalScore >= 70) {
    label = "Good";
  } else if (totalScore >= 40) {
    label = "Possible";
  }

  const strengths = [];

  if (qualificationScore >= 35) {
    strengths.push("Qualification meets the internship requirement.");
  }

  if (fieldScore >= 35) {
    strengths.push("Field of study closely matches the internship.");
  }

  if (skillResult.matchedSkills.length > 0) {
    strengths.push(
      `Relevant skills: ${skillResult.matchedSkills.join(", ")}.`
    );
  }

  const improvements = [];

  if (qualificationScore < 35) {
    improvements.push(
      "Qualification is below the preferred internship requirement."
    );
  }

  if (fieldScore < 35) {
    improvements.push(
      "Field of study has limited direct overlap with the requirement."
    );
  }

  if (skillResult.missingSkills.length > 0) {
    improvements.push(
      `Missing or unverified skills: ${skillResult.missingSkills.join(
        ", "
      )}.`
    );
  }

  return {
    score: totalScore,
    label,
    qualificationScore,
    fieldScore,
    skillScore: skillResult.score,
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
    strengths,
    improvements,
    summary:
      totalScore >= 85
        ? "Strong overall match based on the available application information."
        : totalScore >= 70
        ? "Good overall match with several relevant areas."
        : totalScore >= 40
        ? "Possible match, but some areas should be reviewed."
        : "Limited match based on the available information.",
  };
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {
  if (!value) return "No deadline";

  try {
    return new Date(value).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "No deadline";
  }
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();

  if (value === "shortlisted") {
    return (
      <span className="statusBadge shortlisted">
        Shortlisted
      </span>
    );
  }

  if (value === "rejected") {
    return (
      <span className="statusBadge rejected">
        Rejected
      </span>
    );
  }

  return (
    <span className="statusBadge pending">
      New
    </span>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

export default function CompanyDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [error, setError] = useState("");

  const [selectedInternship, setSelectedInternship] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState("");

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
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // --------------------------------------------------------
      // COMPANY
      // --------------------------------------------------------

      const { data: companyData, error: companyError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        setError(
          "Company profile could not be found. Please complete your company profile."
        );
        setLoading(false);
        return;
      }

      setCompany(companyData);

      // --------------------------------------------------------
      // INTERNSHIPS
      // --------------------------------------------------------

      const { data: internshipData, error: internshipError } =
        await supabase
          .from("internships")
          .select("*")
          .eq("company_name", companyData.company_name)
          .order("created_at", { ascending: false });

      if (internshipError) {
        throw internshipError;
      }

      setInternships(internshipData || []);

      // --------------------------------------------------------
      // APPLICATIONS
      // --------------------------------------------------------

      const internshipIds = (internshipData || []).map(
        (item) => item.id
      );

      if (internshipIds.length > 0) {
        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select("*")
          .in("internship_id", internshipIds)
          .order("created_at", { ascending: false });

        if (applicationError) {
          console.error(
            "Application loading error:",
            applicationError
          );
        } else {
          setApplications(applicationData || []);
        }
      } else {
        setApplications([]);
      }

      // --------------------------------------------------------
      // SUBSCRIPTION
      // --------------------------------------------------------

      const { data: subscriptionData } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(subscriptionData || null);
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

  // ==========================================================
  // APPLICATION COUNTS
  // ==========================================================

  const getApplicationsForInternship = (internshipId) => {
    return applications.filter(
      (application) =>
        String(application.internship_id) === String(internshipId)
    );
  };

  const getInternshipStats = (internshipId) => {
    const list = getApplicationsForInternship(internshipId);

    return {
      total: list.length,

      newCount: list.filter(
        (item) =>
          !item.status ||
          String(item.status).toLowerCase() === "pending"
      ).length,

      shortlisted: list.filter(
        (item) =>
          String(item.status).toLowerCase() === "shortlisted"
      ).length,

      rejected: list.filter(
        (item) =>
          String(item.status).toLowerCase() === "rejected"
      ).length,
    };
  };

  // ==========================================================
  // OVERALL STATS
  // ==========================================================

  const dashboardStats = useMemo(() => {
    const activeInternships = internships.filter((item) => {
      if (!item.deadline) return true;

      return new Date(item.deadline) >= new Date();
    }).length;

    const totalApplications = applications.length;

    const shortlisted = applications.filter(
      (item) =>
        String(item.status).toLowerCase() === "shortlisted"
    ).length;

    const newApplications = applications.filter(
      (item) =>
        !item.status ||
        String(item.status).toLowerCase() === "pending"
    ).length;

    return {
      activeInternships,
      totalApplications,
      shortlisted,
      newApplications,
    };
  }, [internships, applications]);

  // ==========================================================
  // FILTER INTERNSHIPS
  // ==========================================================

  const filteredInternships = useMemo(() => {
    const value = searchTerm.toLowerCase().trim();

    if (!value) return internships;

    return internships.filter((internship) => {
      return (
        String(internship.job_title || "")
          .toLowerCase()
          .includes(value) ||
        String(internship.location || "")
          .toLowerCase()
          .includes(value) ||
        String(internship.province || "")
          .toLowerCase()
          .includes(value) ||
        String(internship.internship_type || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [internships, searchTerm]);

  // ==========================================================
  // OPEN APPLICATIONS
  // ==========================================================

  function openApplications(internship) {
    router.push(
      `/company/internships/${internship.id}/applicants`
    );
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function handleLogout() {
    await supabase.auth.signOut();

    try {
      localStorage.removeItem("gradlink_profile");
    } catch {}

    router.push("/login");
  }

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <>
        <style jsx global>{dashboardStyles}</style>

        <main className="dashboardPage">
          <div className="loadingScreen">
            <div className="loadingLogo">
              GL
            </div>

            <div className="loadingSpinner" />

            <p>Loading your recruitment dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error && !company) {
    return (
      <>
        <style jsx global>{dashboardStyles}</style>

        <main className="dashboardPage">
          <div className="errorScreen">
            <div className="errorIcon">!</div>

            <h1>Dashboard unavailable</h1>

            <p>{error}</p>

            <div className="errorActions">
              <Link href="/company" className="primaryButton">
                Company Profile
              </Link>

              <button
                className="secondaryButton"
                onClick={loadDashboard}
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style jsx global>{dashboardStyles}</style>

      <main className="dashboardPage">

        {/* ====================================================
            TOP NAVIGATION
        ==================================================== */}

        <header className="topBar">
          <div className="topBarInner">

            <Link href="/" className="brand">
              <span className="brandMark">G</span>

              <span>
                <strong>GradLink</strong>
                <small>SA</small>
              </span>
            </Link>

            <div className="topActions">

              <Link
                href="/"
                className="navButton"
              >
                Home
              </Link>

              <Link
                href="/company"
                className="navButton"
              >
                Company Profile
              </Link>

              <button
                className="logoutButton"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          </div>
        </header>

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <div className="dashboardContainer">

          {/* ==================================================
              HERO
          ================================================== */}

          <section className="dashboardHero">

            <div>
              <div className="eyebrow">
                GRADLINK SA • RECRUITMENT PORTAL
              </div>

              <h1>
                Company Dashboard
              </h1>

              <p>
                Welcome back,{" "}
                <strong>
                  {company?.company_name || "Company"}
                </strong>
                . Manage your internships and applications
                from one place.
              </p>
            </div>

            <Link
              href="/internships"
              className="postInternshipButton"
            >
              <span className="plusIcon">+</span>
              Post Internship
            </Link>

          </section>

          {/* ==================================================
              ERROR NOTICE
          ================================================== */}

          {error && (
            <div className="notice">
              <span>!</span>
              {error}
            </div>
          )}

          {/* ==================================================
              STATS
          ================================================== */}

          <section className="statsGrid">

            <div className="statCard">
              <div className="statIcon blue">
                <span>▣</span>
              </div>

              <div>
                <span className="statLabel">
                  Active Internships
                </span>

                <strong className="statNumber">
                  {dashboardStats.activeInternships}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon purple">
                <span>◎</span>
              </div>

              <div>
                <span className="statLabel">
                  Total Applications
                </span>

                <strong className="statNumber">
                  {dashboardStats.totalApplications}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon green">
                <span>✓</span>
              </div>

              <div>
                <span className="statLabel">
                  Shortlisted
                </span>

                <strong className="statNumber">
                  {dashboardStats.shortlisted}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon orange">
                <span>●</span>
              </div>

              <div>
                <span className="statLabel">
                  New Applications
                </span>

                <strong className="statNumber">
                  {dashboardStats.newApplications}
                </strong>
              </div>
            </div>

          </section>

          {/* ==================================================
              PREMIUM
          ================================================== */}

          <section className="premiumBar">

            <div className="premiumInfo">

              <div className="premiumIcon">
                ✦
              </div>

              <div>
                <div className="premiumTitle">
                  GradLink Premium
                </div>

                <div className="premiumText">
                  {subscription?.status === "active"
                    ? "Your Premium recruitment features are active."
                    : "Unlock more recruitment tools for your company."}
                </div>
              </div>

            </div>

            <div className="premiumRight">

              <span
                className={
                  subscription?.status === "active"
                    ? "premiumStatus active"
                    : "premiumStatus"
                }
              >
                {subscription?.status === "active"
                  ? "ACTIVE"
                  : "NOT ACTIVE"}
              </span>

              <Link
                href="/company/subscription"
                className="premiumButton"
              >
                {subscription?.status === "active"
                  ? "Manage Plan"
                  : "View Plans"}
              </Link>

            </div>

          </section>

          {/* ==================================================
              INTERNSHIP SECTION
          ================================================== */}

          <section className="internshipSection">

            <div className="sectionHeader">

              <div>
                <span className="sectionEyebrow">
                  RECRUITMENT
                </span>

                <h2>Your Internships</h2>

                <p>
                  See your applications and recruitment
                  progress at a glance.
                </p>
              </div>

              <div className="searchBox">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

            </div>

            {/* ==================================================
                NO INTERNSHIPS
            ================================================== */}

            {filteredInternships.length === 0 ? (

              <div className="emptyState">

                <div className="emptyIcon">
                  ▣
                </div>

                <h3>
                  {searchTerm
                    ? "No internships found"
                    : "No internships yet"}
                </h3>

                <p>
                  {searchTerm
                    ? "Try a different search term."
                    : "Post your first internship to start receiving applications."}
                </p>

                {!searchTerm && (
                  <Link
                    href="/internships"
                    className="primaryButton"
                  >
                    Post an Internship
                  </Link>
                )}

              </div>

            ) : (

              <div className="internshipList">

                {filteredInternships.map((internship) => {

                  const stats = getInternshipStats(
                    internship.id
                  );

                  return (
                    <article
                      className="internshipRow"
                      key={internship.id}
                    >

                      <div className="internshipMain">

                        <div className="internshipTitleRow">

                          <div className="companyMiniLogo">
                            {String(
                              company?.company_name || "C"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <h3>
                              {internship.job_title ||
                                "Untitled Internship"}
                            </h3>

                            <p className="companyName">
                              {company?.company_name ||
                                internship.company_name ||
                                "Company"}
                            </p>
                          </div>

                        </div>

                        <div className="internshipMeta">

                          {internship.location && (
                            <span>
                              <b>⌖</b>
                              {internship.location}
                            </span>
                          )}

                          {internship.province && (
                            <span>
                              <b>•</b>
                              {internship.province}
                            </span>
                          )}

                          {internship.internship_type && (
                            <span>
                              <b>•</b>
                              {internship.internship_type}
                            </span>
                          )}

                          {internship.stipend && (
                            <span>
                              <b>•</b>
                              {internship.stipend}
                            </span>
                          )}

                        </div>

                        <div className="deadline">
                          Deadline:{" "}
                          <strong>
                            {formatDate(
                              internship.deadline
                            )}
                          </strong>
                        </div>

                      </div>

                      {/* =================================================
                          APPLICATION SUMMARY
                      ================================================= */}

                      <div className="applicationSummary">

                        <div className="applicationTotal">
                          <strong>
                            {stats.total}
                          </strong>

                          <span>
                            Applications
                          </span>
                        </div>

                        <div className="miniStat">
                          <span className="miniDot new" />
                          <strong>
                            {stats.newCount}
                          </strong>
                          <span>New</span>
                        </div>

                        <div className="miniStat">
                          <span className="miniDot shortlisted" />
                          <strong>
                            {stats.shortlisted}
                          </strong>
                          <span>Shortlisted</span>
                        </div>

                        <div className="miniStat">
                          <span className="miniDot rejected" />
                          <strong>
                            {stats.rejected}
                          </strong>
                          <span>Rejected</span>
                        </div>

                      </div>

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <div className="internshipActions">

                        <button
                          className="applicationsButton"
                          onClick={() =>
                            openApplications(internship)
                          }
                        >
                          View Applications
                          <span>→</span>
                        </button>

                        <Link
                          href={`/internships/${internship.id}`}
                          className="viewButton"
                        >
                          View Internship
                        </Link>

                      </div>

                    </article>
                  );
                })}

              </div>

            )}

          </section>

          {/* ==================================================
              RECRUITMENT TIP
          ================================================== */}

          <section className="recruitmentTip">

            <div className="tipIcon">
              ✦
            </div>

            <div>
              <strong>
                Recruitment overview
              </strong>

              <p>
                Applications are organised by internship,
                so you can review candidates for a specific
                opportunity without searching through
                unrelated applicants.
              </p>
            </div>

          </section>

        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="dashboardFooter">
          <div>
            <strong>GradLink SA</strong>
            <span>
              Connecting South African graduates with
              internship opportunities.
            </span>
          </div>

          <span>
            © {new Date().getFullYear()} GradLink SA
          </span>
        </footer>

      </main>
    </>
  );
}