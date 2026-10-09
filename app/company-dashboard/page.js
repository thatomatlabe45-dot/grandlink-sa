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

  if (value.includes("grade 12") || value.includes("matric")) {
    return 1;
  }

  if (value.includes("certificate")) {
    return 2;
  }

  if (value.includes("diploma")) {
    return 3;
  }

  if (value.includes("degree") || value.includes("bachelor")) {
    return 4;
  }

  if (value.includes("honours") || value.includes("honors")) {
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

  const applicantLevel = getQualificationLevel(applicant);
  const requiredLevel = getQualificationLevel(required);

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
  ).toLowerCase().trim();

  const requiredField = (
    internship.field_of_study || ""
  ).toLowerCase().trim();

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

  // QUALIFICATION: 35 POINTS

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

  // FIELD OF STUDY: 35 POINTS

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

  // SKILLS: 30 POINTS

  const matchingSkills = [];

  if (requiredSkills.length > 0 && applicantSkills.length > 0) {
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
    reasons.push("No specific skills were required");
  } else {
    reasons.push("Applicant did not provide skills");
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
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    loadDashboard();

    const handleFocus = () => {
      loadDashboard();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  async function loadDashboard() {
    setLoading(true);
    setDashboardError("");

    try {
      // GET LOGGED-IN USER

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // GET COMPANY PROFILE

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company lookup error:", companyError);
        setDashboardError(
          "We could not load your company profile. Please try again."
        );
        setCompany(null);
        return;
      }

      if (!companyData) {
        setCompany(null);
        setInternships([]);
        setApplications([]);
        return;
      }

      setCompany(companyData);

      // GET COMPANY INTERNSHIPS

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
        .eq("company_name", companyData.company_name)
        .order("created_at", {
          ascending: false,
        });

      if (internshipError) {
        console.error("Internship lookup error:", internshipError);

        setInternships([]);
        setApplications([]);
        setDashboardError(
          "We could not load your internships. Please try again."
        );
        return;
      }

      const jobs = internshipData || [];

      setInternships(jobs);

      if (jobs.length === 0) {
        setApplications([]);
        return;
      }

      // GET APPLICATIONS

      const internshipIds = jobs.map((job) => job.id);

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
        console.error("Application lookup error:", applicationError);

        setApplications([]);
        setDashboardError(
          "Your internships loaded, but we could not load applications."
        );
        return;
      }

      // GET GRADUATE IDS

      const graduateIds = [
        ...new Set(
          (applicationData || [])
            .map((application) => application.graduate_id)
            .filter(Boolean)
        ),
      ];

      let graduates = [];

      // GET GRADUATE PROFILES

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
          .in("id", graduateIds);

        if (graduateError) {
          console.error("Graduate lookup error:", graduateError);
        } else if (graduateData) {
          graduates = graduateData;
        }
      }

      // COMBINE APPLICATION, INTERNSHIP AND GRADUATE DATA

      const applicationsWithData = (applicationData || []).map(
        (application) => {
          const internship = jobs.find(
            (job) => job.id === application.internship_id
          );

          const graduate = graduates.find(
            (item) => item.id === application.graduate_id
          );

          const mergedApplication = {
            ...graduate,
            ...application,
          };

          const match = internship
            ? calculateMatch(mergedApplication, internship)
            : {
                score: 0,
                reasons: [],
              };

          return {
            ...mergedApplication,

            job_title: internship?.job_title || "Internship",

            internship_qualification:
              internship?.qualification || "",

            internship_field_of_study:
              internship?.field_of_study || "",

            internship_skills: internship?.skills || "",

            internship,

            ai_score: match.score,
            match_reasons: match.reasons,

            cv_url:
              application.cv_url ||
              application.cv ||
              application.resume_url ||
              application.document_url ||
              graduate?.cv_url ||
              null,
          };
        }
      );

      setApplications(applicationsWithData);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setInternships([]);
      setApplications([]);
      setDashboardError(
        "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // APPLICATION COUNTS
  // ==========================================================

  function getApplicationCount(internshipId) {
    return applications.filter(
      (application) =>
        application.internship_id === internshipId
    ).length;
  }

  const candidateCount = new Set(
    applications
      .map((application) => application.graduate_id)
      .filter(Boolean)
  ).size;

  const shortlistedCount = applications.filter(
    (application) =>
      (application.status || "").toLowerCase() === "shortlisted"
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeInternships = internships.filter((job) => {
    if (!job.deadline) {
      return true;
    }

    const deadline = new Date(`${job.deadline}T00:00:00`);

    return deadline >= today;
  }).length;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={loadingPage}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>
            🏢
          </div>

          <div>Loading your company dashboard...</div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR MESSAGE
  // ==========================================================

  if (dashboardError && !company) {
    return (
      <main style={loadingPage}>
        <div style={messageCard}>
          <div style={{ fontSize: "42px" }}>⚠️</div>

          <h2 style={{ color: "#003b7a" }}>
            Dashboard unavailable
          </h2>

          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            {dashboardError}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            style={actionButton}
          >
            Try Again
          </button>

          <p style={{ marginTop: "18px" }}>
            <Link href="/login" style={textLink}>
              Return to Login
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // NO COMPANY PROFILE
  // ==========================================================

  if (!company) {
    return (
      <main style={loadingPage}>
        <div style={messageCard}>
          <div style={{ fontSize: "50px", marginBottom: "10px" }}>
            🏢
          </div>

          <h2 style={{ color: "#003b7a", marginTop: 0 }}>
            Company Profile Required
          </h2>

          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Please complete your company profile before accessing
            the recruitment dashboard.
          </p>

          <button
            type="button"
            onClick={() => router.push("/company")}
            style={{
              ...actionButton,
              width: "100%",
              marginTop: "15px",
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
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* TOP NAVIGATION */}

        <header style={headerStyle}>
          <Link href="/" style={brandStyle}>
            GRADLINK SA
          </Link>

          <nav style={navigationStyle}>
            <Link href="/" style={navButton}>
              Home
            </Link>

            <Link href="/company" style={navButton}>
              Company Profile
            </Link>

            <Link href="/change-password" style={securityNavButton}>
              <span>🔐</span>
              <span>Account &amp; Security</span>
            </Link>

            {/* CORRECT COMPANY POSTING ROUTE */}

            <Link
              href="/company/internships/new"
              style={primaryNavButton}
            >
              + Post Internship
            </Link>
          </nav>
        </header>

        {/* HERO */}

        <section style={heroStyle}>
          <div style={heroDecoration} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={eyebrowStyle}>
              COMPANY RECRUITMENT PORTAL
            </div>

            <h1 style={heroTitleStyle}>
              Welcome back,
              <br />
              {company.company_name || "Your Company"}
            </h1>

            <p style={heroDescriptionStyle}>
              Manage your internship opportunities and review
              applications from one place.
            </p>
          </div>
        </section>

        {/* DASHBOARD ERROR */}

        {dashboardError && (
          <div style={warningBox}>
            <span>{dashboardError}</span>

            <button
              type="button"
              onClick={loadDashboard}
              style={retryButton}
            >
              Retry
            </button>
          </div>
        )}

        {/* QUICK STATS */}

        <section style={statsGrid}>
          <div style={statCard}>
            <div style={statIcon}>💼</div>
            <div style={statNumber}>{activeInternships}</div>
            <div style={statLabel}>Active Internships</div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>📋</div>
            <div style={statNumber}>{applications.length}</div>
            <div style={statLabel}>Total Applications</div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>⭐</div>
            <div style={statNumber}>{shortlistedCount}</div>
            <div style={statLabel}>Shortlisted</div>
          </div>

          <div style={statCard}>
            <div style={statIcon}>👥</div>
            <div style={statNumber}>{candidateCount}</div>
            <div style={statLabel}>Candidates</div>
          </div>
        </section>

        {/* YOUR INTERNSHIPS */}

        <section style={{ marginBottom: "32px" }}>
          <div style={sectionHeadingStyle}>
            <div>
              <div style={sectionEyebrowStyle}>
                RECRUITMENT
              </div>

              <h2 style={sectionTitleStyle}>
                Your Internships
              </h2>
            </div>

            {/* CORRECTED LINK */}

            <Link
              href="/company/internships/new"
              style={secondaryActionLink}
            >
              + Post another internship
            </Link>
          </div>

          {internships.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                📭
              </div>

              <h3 style={emptyTitleStyle}>
                No internships yet
              </h3>

              <p style={emptyDescriptionStyle}>
                Post your first internship and start receiving
                applications from graduates.
              </p>

              {/* CORRECTED EMPTY-STATE LINK */}

              <Link
                href="/company/internships/new"
                style={actionLink}
              >
                + Post Internship
              </Link>
            </div>
          ) : (
            <div style={internshipsGrid}>
              {internships.map((internship) => {
                const count = getApplicationCount(internship.id);

                const isExpired =
                  internship.deadline &&
                  new Date(`${internship.deadline}T00:00:00`) < today;

                return (
                  <article key={internship.id} style={internshipCard}>
                    <div style={internshipCardTop}>
                      <div style={internshipIcon}>
                        💼
                      </div>

                      <span
                        style={{
                          ...statusBadge,
                          background: isExpired
                            ? "#fff0f0"
                            : "#e8f7ee",
                          color: isExpired
                            ? "#c62828"
                            : "#16803c",
                        }}
                      >
                        {isExpired ? "EXPIRED" : "ACTIVE"}
                      </span>
                    </div>

                    <h3 style={internshipTitleStyle}>
                      {internship.job_title || "Untitled Internship"}
                    </h3>

                    <p style={internshipFieldStyle}>
                      {internship.field_of_study ||
                        "General Internship"}
                    </p>

                    <div style={infoListStyle}>
                      <InfoRow
                        icon="📍"
                        value={
                          [
                            internship.province,
                            internship.location,
                          ]
                            .filter(Boolean)
                            .join(" • ") ||
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
                          count === 1 ? "Application" : "Applications"
                        }`}
                      />
                    </div>

                    <Link
                      href={`/company/internships/${internship.id}/applicants`}
                      style={viewApplicationsButton}
                    >
                      View Applications <span>→</span>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT APPLICATIONS */}

        {applications.length > 0 && (
          <section style={{ marginBottom: "32px" }}>
            <div style={sectionHeadingStyle}>
              <div>
                <div style={sectionEyebrowStyle}>
                  APPLICANTS
                </div>

                <h2 style={sectionTitleStyle}>
                  Recent Applications
                </h2>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {applications.slice(0, 6).map((application) => {
                const match = getMatchLabel(
                  application.ai_score || 0
                );

                return (
                  <article
                    key={application.id}
                    style={applicationCard}
                  >
                    <div style={applicationTopRow}>
                      <div style={applicantIdentity}>
                        <div style={avatarStyle}>
                          {(application.full_name || "G")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3 style={applicantNameStyle}>
                            {application.full_name ||
                              "Graduate Applicant"}
                          </h3>

                          <p style={applicantJobStyle}>
                            {application.job_title || "Internship"}
                          </p>
                        </div>
                      </div>

                      <div style={matchBadges}>
                        <span
                          style={{
                            ...matchBadge,
                            background: match.background,
                            color: match.color,
                          }}
                        >
                          {match.label}
                        </span>

                        <span style={scoreBadge}>
                          {application.ai_score || 0}%
                        </span>
                      </div>
                    </div>

                    <div style={qualificationTags}>
                      {application.qualification && (
                        <span style={qualificationTag}>
                          🎓 {application.qualification}
                        </span>
                      )}

                      {application.field_of_study && (
                        <span style={qualificationTag}>
                          📚 {application.field_of_study}
                        </span>
                      )}
                    </div>

                    <div style={applicationFooter}>
                      <div style={applicationMeta}>
                        <span>
                          📧 {application.email || "No email"}
                        </span>

                        {application.status && (
                          <span>
                            Status: {application.status}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/company/internships/${application.internship_id}/applicants`}
                        style={reviewButton}
                      >
                        Review →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* RECRUITMENT TIP */}

        <section style={tipCard}>
          <div style={tipIcon}>💡</div>

          <div>
            <h3 style={tipTitle}>
              Recruitment made simpler
            </h3>

            <p style={tipDescription}>
              Open any internship above to see its applications,
              applicant information and matching results in one
              place. You don't need to search through graduates
              individually.
            </p>
          </div>
        </section>

        {/* FOOTER */}

        <footer style={footerStyle}>
          <div>
            © {new Date().getFullYear()} GradLink SA
          </div>

          <div style={footerLinks}>
            <Link href="/" style={footerLink}>
              Home
            </Link>

            <Link href="/company" style={footerLink}>
              Company Profile
            </Link>

            <Link
              href="/change-password"
              style={{
                ...footerLink,
                color: "#0057B8",
                fontWeight: "700",
              }}
            >
              🔐 Account &amp; Security
            </Link>

            {/* CORRECTED FOOTER LINK */}

            <Link
              href="/company/internships/new"
              style={footerLink}
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

function InfoRow({ icon, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoIconStyle}>{icon}</span>

      <span style={infoValueStyle}>
        {value}
      </span>
    </div>
  );
}

// ============================================================
// GENERAL PAGE STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f5f9ff 0%,#ffffff 100%)",
  padding: "0 16px 60px",
  boxSizing: "border-box",
};

const containerStyle = {
  width: "100%",
  maxWidth: "1150px",
  margin: "0 auto",
};

const headerStyle = {
  padding: "18px 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  flexWrap: "wrap",
};

const brandStyle = {
  textDecoration: "none",
  color: "#0057B8",
  fontWeight: "900",
  fontSize: "20px",
  letterSpacing: "-0.5px",
};

const navigationStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

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
  boxShadow: "0 3px 10px rgba(0,0,0,.04)",
};

const securityNavButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  minHeight: "42px",
  padding: "0 15px",
  boxSizing: "border-box",
  borderRadius: "10px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#0057B8",
  textDecoration: "none",
  fontWeight: "800",
  fontSize: "13px",
  boxShadow: "0 3px 10px rgba(37,99,235,.08)",
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
  boxShadow: "0 5px 14px rgba(0,87,184,.18)",
};

const heroStyle = {
  background:
    "linear-gradient(135deg,#003b7a 0%,#0057B8 55%,#0a84ff 100%)",
  borderRadius: "24px",
  padding: "32px clamp(22px,5vw,45px)",
  color: "#fff",
  marginBottom: "22px",
  boxShadow: "0 18px 45px rgba(0,87,184,.18)",
  position: "relative",
  overflow: "hidden",
};

const heroDecoration = {
  position: "absolute",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background: "rgba(255,255,255,.08)",
  right: "-80px",
  top: "-90px",
};

const eyebrowStyle = {
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "1.2px",
  opacity: 0.8,
  marginBottom: "9px",
};

const heroTitleStyle = {
  margin: 0,
  fontSize: "clamp(27px,5vw,40px)",
  lineHeight: 1.15,
  letterSpacing: "-1px",
  overflowWrap: "anywhere",
};

const heroDescriptionStyle = {
  margin: "14px 0 0",
  maxWidth: "650px",
  lineHeight: 1.6,
  fontSize: "16px",
  opacity: 0.9,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
  gap: "14px",
  marginBottom: "30px",
};

const statCard = {
  background: "#ffffff",
  border: "1px solid #e3eaf2",
  borderRadius: "17px",
  padding: "20px",
  minHeight: "135px",
  boxSizing: "border-box",
  boxShadow: "0 7px 22px rgba(0,0,0,.045)",
};

const statIcon = {
  fontSize: "24px",
  marginBottom: "10px",
};

const statNumber = {
  color: "#003b7a",
  fontSize: "28px",
  fontWeight: "900",
  lineHeight: 1,
  marginBottom: "7px",
};

const statLabel = {
  color: "#718096",
  fontSize: "12px",
  fontWeight: "700",
};

const sectionHeadingStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "15px",
};

const sectionEyebrowStyle = {
  color: "#0057B8",
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "1px",
  marginBottom: "5px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#003b7a",
  fontSize: "27px",
  lineHeight: 1.2,
};

const secondaryActionLink = {
  textDecoration: "none",
  color: "#0057B8",
  fontWeight: "800",
  fontSize: "14px",
  padding: "8px 0",
};

const internshipsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))",
  gap: "18px",
};

const internshipCard = {
  background: "#fff",
  border: "1px solid #e3eaf2",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 8px 25px rgba(0,0,0,.05)",
  minWidth: 0,
  boxSizing: "border-box",
};

const internshipCardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "15px",
};

const internshipIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#eef6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "23px",
};

const statusBadge = {
  padding: "6px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "800",
};

const internshipTitleStyle = {
  color: "#003b7a",
  fontSize: "20px",
  margin: "0 0 7px",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

const internshipFieldStyle = {
  color: "#666",
  margin: "0 0 15px",
  fontSize: "14px",
};

const infoListStyle = {
  display: "grid",
  gap: "9px",
  marginBottom: "18px",
};

const infoRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "9px",
  color: "#5e6977",
  fontSize: "13px",
  lineHeight: 1.45,
};

const infoIconStyle = {
  width: "20px",
  minWidth: "20px",
  textAlign: "center",
};

const infoValueStyle = {
  wordBreak: "break-word",
  minWidth: 0,
};

const viewApplicationsButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  width: "100%",
  boxSizing: "border-box",
  background: "#0057B8",
  color: "#fff",
  textDecoration: "none",
  padding: "13px 16px",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "14px",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e3eaf2",
  borderRadius: "18px",
  padding: "40px 25px",
  textAlign: "center",
  boxShadow: "0 8px 25px rgba(0,0,0,.05)",
};

const emptyTitleStyle = {
  color: "#003b7a",
  margin: "0 0 8px",
};

const emptyDescriptionStyle = {
  color: "#777",
  lineHeight: 1.6,
  margin: "0 auto 20px",
  maxWidth: "500px",
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
  boxShadow: "0 5px 14px rgba(0,87,184,.16)",
};

const actionLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0057B8",
  color: "#ffffff",
  textDecoration: "none",
  padding: "13px 18px",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "14px",
  boxShadow: "0 5px 14px rgba(0,87,184,.16)",
};

const applicationCard = {
  background: "#fff",
  border: "1px solid #e3eaf2",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 6px 20px rgba(0,0,0,.04)",
  minWidth: 0,
};

const applicationTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  flexWrap: "wrap",
};

const applicantIdentity = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  flex: 1,
};

const avatarStyle = {
  width: "42px",
  height: "42px",
  minWidth: "42px",
  borderRadius: "50%",
  background: "#eef6ff",
  color: "#0057B8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "17px",
};

const applicantNameStyle = {
  margin: 0,
  color: "#003b7a",
  fontSize: "17px",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

const applicantJobStyle = {
  margin: "3px 0 0",
  color: "#777",
  fontSize: "13px",
};

const matchBadges = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const matchBadge = {
  borderRadius: "20px",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

const scoreBadge = {
  background: "#f5f8fc",
  color: "#003b7a",
  border: "1px solid #e3eaf2",
  borderRadius: "20px",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: "900",
  whiteSpace: "nowrap",
};

const qualificationTags = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "12px",
};

const qualificationTag = {
  background: "#f5f8fc",
  color: "#455a70",
  border: "1px solid #e3eaf2",
  borderRadius: "8px",
  padding: "6px 9px",
  fontSize: "12px",
  fontWeight: "700",
  overflowWrap: "anywhere",
};

const applicationFooter = {
  marginTop: "15px",
  paddingTop: "14px",
  borderTop: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const applicationMeta = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  color: "#6d7885",
  fontSize: "12px",
  minWidth: 0,
  overflowWrap: "anywhere",
};

const reviewButton = {
  textDecoration: "none",
  background: "#eef6ff",
  color: "#0057B8",
  padding: "9px 13px",
  borderRadius: "9px",
  fontSize: "12px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

const tipCard = {
  background: "linear-gradient(135deg,#ffffff 0%,#f3f8ff 100%)",
  border: "1px solid #dfeaf6",
  borderRadius: "20px",
  padding: "24px clamp(20px,4vw,30px)",
  marginBottom: "30px",
  boxShadow: "0 8px 25px rgba(0,0,0,.04)",
  display: "flex",
  alignItems: "flex-start",
  gap: "15px",
};

const tipIcon = {
  width: "46px",
  height: "46px",
  minWidth: "46px",
  borderRadius: "13px",
  background: "#0057B8",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const tipTitle = {
  margin: "0 0 6px",
  color: "#003b7a",
  fontSize: "18px",
};

const tipDescription = {
  margin: 0,
  color: "#66717f",
  lineHeight: 1.6,
  fontSize: "14px",
};

const footerStyle = {
  borderTop: "1px solid #e5ebf2",
  paddingTop: "22px",
  marginTop: "35px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  color: "#7a8795",
  fontSize: "12px",
};

const footerLinks = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const footerLink = {
  color: "#6d7885",
  textDecoration: "none",
};

const loadingPage = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f9ff",
  color: "#0057B8",
  fontSize: "18px",
  fontWeight: "700",
  padding: "20px",
  boxSizing: "border-box",
};

const messageCard = {
  width: "100%",
  maxWidth: "500px",
  background: "#fff",
  borderRadius: "22px",
  padding: "35px 25px",
  textAlign: "center",
  boxShadow: "0 15px 45px rgba(0,0,0,.08)",
  boxSizing: "border-box",
};

const textLink = {
  color: "#0057B8",
  textDecoration: "none",
  fontWeight: "700",
};

const warningBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  background: "#fff8e6",
  border: "1px solid #f2d38b",
  borderRadius: "12px",
  padding: "13px 16px",
  color: "#805b00",
  fontSize: "13px",
  marginBottom: "20px",
};

const retryButton = {
  border: "1px solid #e3bd59",
  background: "#fff",
  color: "#805b00",
  borderRadius: "8px",
  padding: "8px 12px",
  fontWeight: "800",
  cursor: "pointer",
};