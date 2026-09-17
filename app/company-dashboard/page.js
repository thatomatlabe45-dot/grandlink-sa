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

  const v = value.toLowerCase();

  if (
    v.includes("phd") ||
    v.includes("doctorate") ||
    v.includes("doctoral")
  ) {
    return 6;
  }

  if (
    v.includes("master") ||
    v.includes("postgrad") ||
    v.includes("post-graduate")
  ) {
    return 6;
  }

  if (v.includes("honours") || v.includes("honors")) {
    return 5;
  }

  if (
    v.includes("degree") ||
    v.includes("bachelor") ||
    v.includes("bsc") ||
    v.includes("ba ") ||
    v.includes("bcom")
  ) {
    return 4;
  }

  if (
    v.includes("diploma") ||
    v.includes("national diploma")
  ) {
    return 3;
  }

  if (
    v.includes("certificate") ||
    v.includes("n6") ||
    v.includes("n5") ||
    v.includes("n4")
  ) {
    return 2;
  }

  if (
    v.includes("matric") ||
    v.includes("grade 12") ||
    v.includes("grade12")
  ) {
    return 1;
  }

  return 0;
}

// ============================================================
// NORMALISE TEXT
// ============================================================

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SKILLS
// ============================================================

function getSkills(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((skill) => normaliseText(skill))
      .filter(Boolean);
  }

  return String(value)
    .split(/[,;\n|]/)
    .map((skill) => normaliseText(skill))
    .filter(Boolean);
}

// ============================================================
// AI MATCHING
// ============================================================

function calculateMatch(internship, applicant) {
  const internshipQualification = getQualificationLevel(
    internship?.qualification
  );

  const applicantQualification = getQualificationLevel(
    applicant?.qualification
  );

  let qualificationScore = 0;

  if (internshipQualification === 0) {
    qualificationScore = 35;
  } else if (
    applicantQualification >= internshipQualification
  ) {
    qualificationScore = 35;
  } else if (
    applicantQualification === internshipQualification - 1
  ) {
    qualificationScore = 15;
  }

  // ----------------------------------------------------------
  // FIELD OF STUDY
  // ----------------------------------------------------------

  const requiredField = normaliseText(
    internship?.field_of_study
  );

  const applicantField = normaliseText(
    applicant?.field_of_study
  );

  let fieldScore = 0;

  if (!requiredField) {
    fieldScore = 35;
  } else if (!applicantField) {
    fieldScore = 0;
  } else if (
    applicantField.includes(requiredField) ||
    requiredField.includes(applicantField)
  ) {
    fieldScore = 35;
  } else {
    const requiredWords = requiredField.split(" ");
    const applicantWords = applicantField.split(" ");

    const matchedWords = requiredWords.filter((word) =>
      word.length > 2 &&
      applicantWords.some((appWord) =>
        appWord.includes(word) || word.includes(appWord)
      )
    );

    if (matchedWords.length > 0) {
      fieldScore = Math.min(
        35,
        Math.round(
          (matchedWords.length / requiredWords.length) * 35
        )
      );
    }
  }

  // ----------------------------------------------------------
  // SKILLS
  // ----------------------------------------------------------

  const requiredSkills = getSkills(internship?.skills);
  const applicantSkills = getSkills(applicant?.skills);

  let skillScore = 0;
  let matchedSkills = [];
  let missingSkills = [];

  if (requiredSkills.length === 0) {
    skillScore = 30;
  } else {
    matchedSkills = requiredSkills.filter((requiredSkill) =>
      applicantSkills.some(
        (applicantSkill) =>
          applicantSkill.includes(requiredSkill) ||
          requiredSkill.includes(applicantSkill)
      )
    );

    missingSkills = requiredSkills.filter(
      (requiredSkill) => !matchedSkills.includes(requiredSkill)
    );

    skillScore = Math.round(
      (matchedSkills.length / requiredSkills.length) * 30
    );
  }

  const totalScore = Math.max(
    0,
    Math.min(
      100,
      qualificationScore + fieldScore + skillScore
    )
  );

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
    strengths.push("Qualification meets the requirement");
  }

  if (fieldScore >= 35) {
    strengths.push("Field of study matches");
  }

  if (matchedSkills.length > 0) {
    strengths.push(
      `${matchedSkills.length} required skill${
        matchedSkills.length === 1 ? "" : "s"
      } matched`
    );
  }

  const improvements = [];

  if (
    internshipQualification > 0 &&
    applicantQualification < internshipQualification
  ) {
    improvements.push(
      "Qualification level is below the internship requirement"
    );
  }

  if (fieldScore < 35 && requiredField) {
    improvements.push(
      "Field of study does not fully match"
    );
  }

  if (missingSkills.length > 0) {
    improvements.push(
      `Missing skills: ${missingSkills.join(", ")}`
    );
  }

  let summary = "Limited match for this internship.";

  if (totalScore >= 85) {
    summary =
      "Applicant appears to be a strong match based on the available profile information.";
  } else if (totalScore >= 70) {
    summary =
      "Applicant appears to be a good match with several relevant qualifications or skills.";
  } else if (totalScore >= 40) {
    summary =
      "Applicant has some relevant information but may require further review.";
  }

  return {
    totalScore,
    label,
    qualificationScore,
    fieldScore,
    skillScore,
    matchedSkills,
    missingSkills,
    strengths,
    improvements,
    summary,
  };
}

// ============================================================
// SCORE DISPLAY
// ============================================================

function getScoreClass(score) {
  if (score >= 85) return "score-strong";
  if (score >= 70) return "score-good";
  if (score >= 40) return "score-possible";
  return "score-weak";
}

// ============================================================
// COMPANY DASHBOARD
// ============================================================

export default function CompanyDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedInternship, setSelectedInternship] =
    useState(null);

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [message, setMessage] = useState("");

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
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // ------------------------------------------------------
      // LOAD COMPANY
      // ------------------------------------------------------

      const { data: company, error: companyError } =
        await supabase
          .from("companies")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

      if (companyError) {
        console.error(companyError);
        setError("Unable to load company profile.");
        return;
      }

      if (!company) {
        setError(
          "Company profile could not be found. Please complete your company profile first."
        );
        return;
      }

      setCompanyData(company);

      // ------------------------------------------------------
      // LOAD INTERNSHIPS
      // ------------------------------------------------------

      const { data: internshipData, error: internshipError } =
        await supabase
          .from("internships")
          .select("*")
          .eq("company_name", company.company_name)
          .order("created_at", {
            ascending: false,
          });

      if (internshipError) {
        console.error(internshipError);
        setError("Unable to load your internships.");
        return;
      }

      setInternships(internshipData || []);

    } catch (err) {
      console.error(err);
      setError("Something went wrong loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // LOAD APPLICATIONS FOR INTERNSHIP
  // ==========================================================

  async function loadApplications(internship) {
    try {
      setSelectedInternship(internship);
      setSelectedApplication(null);
      setLoadingApplications(true);
      setMessage("");

      const { data, error: applicationError } =
        await supabase
          .from("applications")
          .select("*")
          .eq("internship_id", internship.id)
          .order("created_at", {
            ascending: false,
          });

      if (applicationError) {
        console.error(applicationError);
        setMessage("Unable to load applications.");
        return;
      }

      const applicationRows = data || [];

      // ------------------------------------------------------
      // LOAD GRADUATE PROFILES
      // ------------------------------------------------------

      const graduateIds = [
        ...new Set(
          applicationRows
            .map((application) => application.graduate_id)
            .filter(Boolean)
        ),
      ];

      let graduates = [];

      if (graduateIds.length > 0) {
        const { data: graduateData, error: graduateError } =
          await supabase
            .from("graduates")
            .select("*")
            .in("id", graduateIds);

        if (graduateError) {
          console.error(graduateError);
        } else {
          graduates = graduateData || [];
        }
      }

      // ------------------------------------------------------
      // MERGE PROFILE INFORMATION + AI SCORE
      // ------------------------------------------------------

      const enrichedApplications = applicationRows.map(
        (application) => {
          const graduate = graduates.find(
            (item) => item.id === application.graduate_id
          );

          const mergedApplicant = {
            ...graduate,
            ...application,
          };

          const analysis = calculateMatch(
            internship,
            mergedApplicant
          );

          return {
            ...mergedApplicant,
            analysis,
          };
        }
      );

      enrichedApplications.sort(
        (a, b) =>
          b.analysis.totalScore -
          a.analysis.totalScore
      );

      setApplications(enrichedApplications);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong loading applications.");
    } finally {
      setLoadingApplications(false);
    }
  }

  // ==========================================================
  // UPDATE APPLICATION STATUS
  // ==========================================================

  async function updateApplicationStatus(
    applicationId,
    status
  ) {
    try {
      setMessage("");

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error(updateError);
        setMessage("Unable to update application status.");
        return;
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status,
              }
            : application
        )
      );

      if (
        selectedApplication &&
        selectedApplication.id === applicationId
      ) {
        setSelectedApplication({
          ...selectedApplication,
          status,
        });
      }

      setMessage(
        status === "shortlisted"
          ? "Applicant shortlisted successfully."
          : status === "rejected"
          ? "Applicant rejected."
          : "Application status reset."
      );
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong.");
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function handleLogout() {
    await supabase.auth.signOut();

    localStorage.removeItem("gradlink_profile");

    router.push("/login");
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="dashboard-loading">
        <div className="loading-card">
          <div className="loading-spinner"></div>

          <h2>Loading Company Dashboard</h2>

          <p>
            Please wait while we load your company
            information.
          </p>
        </div>

        <style jsx>{`
          .dashboard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f5f8fc;
            font-family: Arial, sans-serif;
          }

          .loading-card {
            width: 100%;
            max-width: 460px;
            background: white;
            border-radius: 20px;
            padding: 40px 28px;
            text-align: center;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
          }

          .loading-spinner {
            width: 42px;
            height: 42px;
            margin: 0 auto 20px;
            border: 4px solid #dbe7f5;
            border-top-color: #1769aa;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .loading-card h2 {
            margin: 0 0 8px;
            color: #102a43;
          }

          .loading-card p {
            margin: 0;
            color: #627d98;
            line-height: 1.6;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  // ==========================================================
  // MAIN DASHBOARD
  // ==========================================================

  return (
    <main className="dashboard-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="dashboard-header">
        <div className="header-inner">

          <Link
            href="/"
            className="brand"
          >
            <div className="brand-mark">
              G
            </div>

            <div>
              <div className="brand-name">
                GRADLINK SA
              </div>

              <div className="brand-subtitle">
                RECRUITMENT PORTAL
              </div>
            </div>
          </Link>

          <div className="header-actions">

            <Link
              href="/"
              className="header-button"
            >
              Home
            </Link>

            <Link
              href="/company"
              className="header-button"
            >
              Company Profile
            </Link>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="dashboard-content">

        <div className="welcome-section">

          <div>
            <div className="eyebrow">
              COMPANY DASHBOARD
            </div>

            <h1>
              Welcome back
              {companyData?.company_name
                ? `, ${companyData.company_name}`
                : ""}
            </h1>

            <p>
              Manage your internship opportunities and
              review applicants from one place.
            </p>
          </div>

          <Link
            href="/internships"
            className="post-button"
          >
            <span>＋</span>
            Post Internship
          </Link>

        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              💼
            </div>

            <div>
              <div className="stat-number">
                {internships.length}
              </div>

              <div className="stat-label">
                Internship Listings
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              👥
            </div>

            <div>
              <div className="stat-number">
                {selectedInternship
                  ? applications.length
                  : "—"}
              </div>

              <div className="stat-label">
                Applications
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ⭐
            </div>

            <div>
              <div className="stat-number">
                {selectedInternship &&
                applications.length > 0
                  ? Math.round(
                      applications.reduce(
                        (total, application) =>
                          total +
                          application.analysis.totalScore,
                        0
                      ) / applications.length
                    )
                  : "—"}
              </div>

              <div className="stat-label">
                Average Match
              </div>
            </div>
          </div>

        </div>

        {/* ===================================================
            INTERNSHIPS
        =================================================== */}

        <section className="section">

          <div className="section-heading">
            <div>
              <div className="eyebrow">
                YOUR OPPORTUNITIES
              </div>

              <h2>
                Internship Listings
              </h2>

              <p>
                Select an internship to view its
                applicants.
              </p>
            </div>
          </div>

          {internships.length === 0 ? (
            <div className="empty-card">

              <div className="empty-icon">
                💼
              </div>

              <h3>
                No internship listings yet
              </h3>

              <p>
                Create your first internship opportunity
                and start receiving applications.
              </p>

              <Link
                href="/internships"
                className="empty-button"
              >
                Post Your First Internship
              </Link>

            </div>
          ) : (
            <div className="internship-grid">

              {internships.map((internship) => (
                <article
                  key={internship.id}
                  className={`internship-card ${
                    selectedInternship?.id === internship.id
                      ? "selected"
                      : ""
                  }`}
                >

                  <div className="card-top">

                    <div className="company-badge">
                      {(
                        internship.company_name ||
                        companyData?.company_name ||
                        "C"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="card-status">
                      Active
                    </div>

                  </div>

                  <h3>
                    {internship.job_title ||
                      "Internship Opportunity"}
                  </h3>

                  <p className="company-name">
                    {internship.company_name}
                  </p>

                  <div className="details-list">

                    {internship.location && (
                      <div className="detail">
                        <span>📍</span>
                        <span>
                          {internship.location}
                        </span>
                      </div>
                    )}

                    {internship.province && (
                      <div className="detail">
                        <span>🗺️</span>
                        <span>
                          {internship.province}
                        </span>
                      </div>
                    )}

                    {internship.internship_type && (
                      <div className="detail">
                        <span>🏢</span>
                        <span>
                          {internship.internship_type}
                        </span>
                      </div>
                    )}

                    {internship.stipend && (
                      <div className="detail">
                        <span>💰</span>
                        <span>
                          {internship.stipend}
                        </span>
                      </div>
                    )}

                  </div>

                  <div className="card-actions">

                    <Link
                      href={`/internships/${internship.id}`}
                      className="view-button"
                    >
                      View Details
                    </Link>

                    <button
                      type="button"
                      className="applicants-button"
                      onClick={() =>
                        loadApplications(internship)
                      }
                    >
                      View Applicants
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* ===================================================
            APPLICATIONS
        =================================================== */}

        {selectedInternship && (
          <section className="section applications-section">

            <div className="section-heading">

              <div>
                <div className="eyebrow">
                  APPLICANTS
                </div>

                <h2>
                  {selectedInternship.job_title}
                </h2>

                <p>
                  Review applicants for this specific
                  internship.
                </p>
              </div>

              <button
                type="button"
                className="close-selection"
                onClick={() => {
                  setSelectedInternship(null);
                  setApplications([]);
                  setSelectedApplication(null);
                }}
              >
                Close
              </button>

            </div>

            {loadingApplications ? (
              <div className="loading-applications">
                <div className="small-spinner"></div>
                <p>
                  Loading applications...
                </p>
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-card">

                <div className="empty-icon">
                  👥
                </div>

                <h3>
                  No applications yet
                </h3>

                <p>
                  Applications for this internship
                  will appear here when graduates apply.
                </p>

              </div>
            ) : (
              <div className="applications-layout">

                <div className="applications-list">

                  {applications.map((application) => {
                    const score =
                      application.analysis.totalScore;

                    return (
                      <button
                        type="button"
                        key={application.id}
                        className={`application-card ${
                          selectedApplication?.id ===
                          application.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedApplication(
                            application
                          )
                        }
                      >

                        <div className="applicant-avatar">
                          {(
                            application.full_name ||
                            "A"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="applicant-main">

                          <div className="applicant-name">
                            {application.full_name ||
                              "Applicant"}
                          </div>

                          <div className="applicant-field">
                            {application.field_of_study ||
                              "Field not provided"}
                          </div>

                          <div className="applicant-status">
                            {application.status ||
                              "pending"}
                          </div>

                        </div>

                        <div
                          className={`match-score ${getScoreClass(
                            score
                          )}`}
                        >
                          <strong>
                            {score}%
                          </strong>

                          <span>
                            {application.analysis.label}
                          </span>
                        </div>

                      </button>
                    );
                  })}

                </div>
                
                                <div className="application-details">

                  {!selectedApplication ? (
                    <div className="details-placeholder">

                      <div className="placeholder-icon">
                        👤
                      </div>

                      <h3>
                        Select an applicant
                      </h3>

                      <p>
                        Choose an applicant from the list
                        to view their profile, match
                        analysis and application details.
                      </p>

                    </div>
                  ) : (
                    <>
                      {/* =====================================
                          APPLICANT HEADER
                      ====================================== */}

                      <div className="applicant-detail-header">

                        <div className="large-avatar">
                          {(
                            selectedApplication.full_name ||
                            "A"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="detail-header-info">

                          <div className="eyebrow">
                            APPLICANT
                          </div>

                          <h2>
                            {selectedApplication.full_name ||
                              "Applicant"}
                          </h2>

                          <p>
                            {selectedApplication.email ||
                              "Email not provided"}
                          </p>

                        </div>

                        <div
                          className={`large-score ${getScoreClass(
                            selectedApplication.analysis
                              .totalScore
                          )}`}
                        >
                          <strong>
                            {
                              selectedApplication.analysis
                                .totalScore
                            }%
                          </strong>

                          <span>
                            {
                              selectedApplication.analysis
                                .label
                            } Match
                          </span>
                        </div>

                      </div>

                      {/* =====================================
                          APPLICATION STATUS
                      ====================================== */}

                      <div className="status-section">

                        <div className="status-title">
                          Application Status
                        </div>

                        <div className="status-buttons">

                          <button
                            type="button"
                            className={`status-button shortlist ${
                              selectedApplication.status ===
                              "shortlisted"
                                ? "current"
                                : ""
                            }`}
                            onClick={() =>
                              updateApplicationStatus(
                                selectedApplication.id,
                                "shortlisted"
                              )
                            }
                          >
                            ✓ Shortlist
                          </button>

                          <button
                            type="button"
                            className={`status-button reject ${
                              selectedApplication.status ===
                              "rejected"
                                ? "current"
                                : ""
                            }`}
                            onClick={() =>
                              updateApplicationStatus(
                                selectedApplication.id,
                                "rejected"
                              )
                            }
                          >
                            ✕ Reject
                          </button>

                          <button
                            type="button"
                            className={`status-button reset ${
                              !selectedApplication.status ||
                              selectedApplication.status ===
                                "pending"
                                ? "current"
                                : ""
                            }`}
                            onClick={() =>
                              updateApplicationStatus(
                                selectedApplication.id,
                                "pending"
                              )
                            }
                          >
                            Reset
                          </button>

                        </div>

                      </div>

                      {/* =====================================
                          BASIC INFORMATION
                      ====================================== */}

                      <div className="detail-section">

                        <div className="detail-section-title">
                          Applicant Information
                        </div>

                        <div className="info-grid">

                          <div className="info-box">
                            <span>
                              Full Name
                            </span>

                            <strong>
                              {selectedApplication.full_name ||
                                "Not provided"}
                            </strong>
                          </div>

                          <div className="info-box">
                            <span>
                              Email
                            </span>

                            <strong>
                              {selectedApplication.email ||
                                "Not provided"}
                            </strong>
                          </div>

                          <div className="info-box">
                            <span>
                              Phone
                            </span>

                            <strong>
                              {selectedApplication.phone ||
                                "Not provided"}
                            </strong>
                          </div>

                          <div className="info-box">
                            <span>
                              Qualification
                            </span>

                            <strong>
                              {selectedApplication.qualification ||
                                "Not provided"}
                            </strong>
                          </div>

                          <div className="info-box">
                            <span>
                              Field of Study
                            </span>

                            <strong>
                              {selectedApplication.field_of_study ||
                                "Not provided"}
                            </strong>
                          </div>

                        </div>

                      </div>

                      {/* =====================================
                          SKILLS
                      ====================================== */}

                      <div className="detail-section">

                        <div className="detail-section-title">
                          Skills
                        </div>

                        {getSkills(
                          selectedApplication.skills
                        ).length > 0 ? (
                          <div className="skills-list">

                            {getSkills(
                              selectedApplication.skills
                            ).map((skill, index) => (
                              <span
                                className="skill-tag"
                                key={`${skill}-${index}`}
                              >
                                {skill}
                              </span>
                            ))}

                          </div>
                        ) : (
                          <p className="muted">
                            No skills provided.
                          </p>
                        )}

                      </div>

                      {/* =====================================
                          AI MATCH ANALYSIS
                      ====================================== */}

                      <div className="match-analysis">

                        <div className="analysis-header">

                          <div>
                            <div className="eyebrow">
                              GRADLINK AI
                            </div>

                            <h3>
                              Match Analysis
                            </h3>
                          </div>

                          <div
                            className={`analysis-score ${getScoreClass(
                              selectedApplication.analysis
                                .totalScore
                            )}`}
                          >
                            {
                              selectedApplication.analysis
                                .totalScore
                            }%
                          </div>

                        </div>

                        <p className="analysis-summary">
                          {
                            selectedApplication.analysis
                              .summary
                          }
                        </p>

                        <div className="score-breakdown">

                          <div className="score-row">

                            <div>
                              <span>
                                Qualification
                              </span>

                              <small>
                                Maximum 35%
                              </small>
                            </div>

                            <strong>
                              {
                                selectedApplication.analysis
                                  .qualificationScore
                              }%
                            </strong>

                          </div>

                          <div className="score-track">
                            <div
                              className="score-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (selectedApplication
                                    .analysis
                                    .qualificationScore /
                                    35) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="score-row">

                            <div>
                              <span>
                                Field of Study
                              </span>

                              <small>
                                Maximum 35%
                              </small>
                            </div>

                            <strong>
                              {
                                selectedApplication.analysis
                                  .fieldScore
                              }%
                            </strong>

                          </div>

                          <div className="score-track">
                            <div
                              className="score-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (selectedApplication
                                    .analysis
                                    .fieldScore /
                                    35) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="score-row">

                            <div>
                              <span>
                                Skills
                              </span>

                              <small>
                                Maximum 30%
                              </small>
                            </div>

                            <strong>
                              {
                                selectedApplication.analysis
                                  .skillScore
                              }%
                            </strong>

                          </div>

                          <div className="score-track">
                            <div
                              className="score-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (selectedApplication
                                    .analysis
                                    .skillScore /
                                    30) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                        {/* MATCHED SKILLS */}

                        {selectedApplication.analysis
                          .matchedSkills.length > 0 && (
                          <div className="analysis-block">

                            <h4>
                              Matched Skills
                            </h4>

                            <div className="analysis-tags">

                              {selectedApplication.analysis.matchedSkills.map(
                                (skill, index) => (
                                  <span
                                    className="matched-tag"
                                    key={`${skill}-${index}`}
                                  >
                                    ✓ {skill}
                                  </span>
                                )
                              )}

                            </div>

                          </div>
                        )}

                        {/* MISSING SKILLS */}

                        {selectedApplication.analysis
                          .missingSkills.length > 0 && (
                          <div className="analysis-block">

                            <h4>
                              Skills to Consider
                            </h4>

                            <div className="analysis-tags">

                              {selectedApplication.analysis.missingSkills.map(
                                (skill, index) => (
                                  <span
                                    className="missing-tag"
                                    key={`${skill}-${index}`}
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                            </div>

                          </div>
                        )}

                        {/* STRENGTHS */}

                        {selectedApplication.analysis
                          .strengths.length > 0 && (
                          <div className="analysis-block">

                            <h4>
                              Strengths
                            </h4>

                            <ul className="analysis-list">

                              {selectedApplication.analysis.strengths.map(
                                (item, index) => (
                                  <li key={index}>
                                    ✓ {item}
                                  </li>
                                )
                              )}

                            </ul>

                          </div>
                        )}

                        {/* IMPROVEMENTS */}

                        {selectedApplication.analysis
                          .improvements.length > 0 && (
                          <div className="analysis-block">

                            <h4>
                              Areas to Review
                            </h4>

                            <ul className="analysis-list">

                              {selectedApplication.analysis.improvements.map(
                                (item, index) => (
                                  <li key={index}>
                                    • {item}
                                  </li>
                                )
                              )}

                            </ul>

                          </div>
                        )}

                      </div>

                      {/* =====================================
                          DOCUMENTS
                      ====================================== */}

                      <div className="detail-section">

                        <div className="detail-section-title">
                          Documents
                        </div>

                        <div className="document-grid">

                          <button
                            type="button"
                            className="document-button"
                            onClick={async () => {
                              if (
                                !selectedApplication.cv_url
                              ) {
                                alert(
                                  "No CV has been uploaded for this applicant."
                                );
                                return;
                              }

                              try {
                                const newWindow =
                                  window.open(
                                    "",
                                    "_blank"
                                  );

                                const {
                                  data,
                                  error:
                                    signedUrlError,
                                } =
                                  await supabase.storage
                                    .from("documents")
                                    .createSignedUrl(
                                      selectedApplication.cv_url,
                                      600
                                    );

                                if (
                                  signedUrlError ||
                                  !data?.signedUrl
                                ) {
                                  if (newWindow) {
                                    newWindow.close();
                                  }

                                  alert(
                                    "Unable to open the CV."
                                  );

                                  return;
                                }

                                if (newWindow) {
                                  newWindow.location.href =
                                    data.signedUrl;
                                } else {
                                  window.location.href =
                                    data.signedUrl;
                                }
                              } catch (err) {
                                console.error(err);

                                alert(
                                  "Unable to open the CV."
                                );
                              }
                            }}
                          >
                            <span className="document-icon">
                              📄
                            </span>

                            <span>
                              <strong>
                                Review CV
                              </strong>

                              <small>
                                View uploaded CV
                              </small>
                            </span>

                            <span className="document-arrow">
                              →
                            </span>
                          </button>

                          <button
                            type="button"
                            className="document-button"
                            onClick={async () => {
                              if (
                                !selectedApplication
                                  .qualification_url
                              ) {
                                alert(
                                  "No qualification document has been uploaded for this applicant."
                                );
                                return;
                              }

                              try {
                                const newWindow =
                                  window.open(
                                    "",
                                    "_blank"
                                  );

                                const {
                                  data,
                                  error:
                                    signedUrlError,
                                } =
                                  await supabase.storage
                                    .from("documents")
                                    .createSignedUrl(
                                      selectedApplication.qualification_url,
                                      600
                                    );

                                if (
                                  signedUrlError ||
                                  !data?.signedUrl
                                ) {
                                  if (newWindow) {
                                    newWindow.close();
                                  }

                                  alert(
                                    "Unable to open the qualification document."
                                  );

                                  return;
                                }

                                if (newWindow) {
                                  newWindow.location.href =
                                    data.signedUrl;
                                } else {
                                  window.location.href =
                                    data.signedUrl;
                                }
                              } catch (err) {
                                console.error(err);

                                alert(
                                  "Unable to open the qualification document."
                                );
                              }
                            }}
                          >
                            <span className="document-icon">
                              🎓
                            </span>

                            <span>
                              <strong>
                                Review Qualification
                              </strong>

                              <small>
                                View qualification document
                              </small>
                            </span>

                            <span className="document-arrow">
                              →
                            </span>
                          </button>

                        </div>

                      </div>

                    </>
                  )}

                </div>

              </div>
            )}

          </section>
        )}

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="dashboard-footer">
        <div>
          <strong>GRADLINK SA</strong>
          <span>
            Connecting South African graduates with
            internship opportunities.
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} GradLink SA
        </span>
      </footer>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .dashboard-page {
          min-height: 100vh;
          background: #f5f8fc;
          color: #102a43;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ================================================
           HEADER
        ================================================= */

        .dashboard-header {
          background: #ffffff;
          border-bottom: 1px solid #e6edf5;
        }

        .header-inner {
          width: min(1400px, calc(100% - 40px));
          margin: 0 auto;
          min-height: 78px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;

          text-decoration: none;
          color: inherit;

          min-width: 0;
        }

        .brand-mark {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 12px;

          background: #1769aa;
          color: #ffffff;

          font-size: 21px;
          font-weight: 800;

          box-shadow:
            0 7px 16px rgba(23, 105, 170, 0.22);
        }

        .brand-name {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #102a43;
        }

        .brand-subtitle {
          margin-top: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #829ab1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .header-button,
        .logout-button {
          min-height: 40px;
          padding: 0 15px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          font-size: 13px;
          font-weight: 700;

          text-decoration: none;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .header-button {
          background: #ffffff;
          color: #1769aa;
          border: 1px solid #cbd9e8;
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.04);
        }

        .header-button:hover {
          transform: translateY(-1px);
          background: #f7fbff;
          border-color: #1769aa;
          box-shadow: 0 5px 12px rgba(15, 23, 42, 0.07);
        }

        .logout-button {
          border: 1px solid #d7e0ea;
          background: #f7f9fc;
          color: #52667a;
        }

        .logout-button:hover {
          background: #eef3f8;
          transform: translateY(-1px);
        }

        /* ================================================
           CONTENT
        ================================================= */

        .dashboard-content {
          width: min(1400px, calc(100% - 40px));
          margin: 0 auto;
          padding: 42px 0 70px;
        }

        .welcome-section {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: #1769aa;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.7px;
          margin-bottom: 8px;
        }

        .welcome-section h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.12;
          letter-spacing: -1px;
          color: #102a43;
        }

        .welcome-section p {
          margin: 10px 0 0;
          max-width: 680px;
          color: #627d98;
          font-size: 15px;
          line-height: 1.6;
        }

        .post-button {
          min-height: 46px;
          padding: 0 19px;

          flex-shrink: 0;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border-radius: 10px;

          background: #1769aa;
          color: #ffffff;

          text-decoration: none;
          font-size: 13px;
          font-weight: 800;

          box-shadow:
            0 8px 18px rgba(23, 105, 170, 0.18);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .post-button:hover {
          transform: translateY(-2px);
          background: #12598f;
          box-shadow:
            0 12px 24px rgba(23, 105, 170, 0.22);
        }

        .post-button span {
          font-size: 19px;
          line-height: 1;
        }

        /* ================================================
           MESSAGES
        ================================================= */

        .error-message,
        .success-message {
          padding: 14px 16px;
          margin-bottom: 20px;

          border-radius: 10px;

          font-size: 13px;
          line-height: 1.5;
        }

        .error-message {
          background: #fff4f4;
          border: 1px solid #f1c7c7;
          color: #a33a3a;
        }

        .success-message {
          background: #f1faf5;
          border: 1px solid #c8ead7;
          color: #24734a;
        }

        /* ================================================
           STATS
        ================================================= */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 42px;
        }

        .stat-card {
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 15px;

          padding: 20px;

          background: #ffffff;
          border: 1px solid #e3ebf4;
          border-radius: 14px;

          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.045);
        }

        .stat-icon {
          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 11px;
          background: #edf6ff;

          font-size: 20px;
        }

        .stat-number {
          font-size: 25px;
          font-weight: 800;
          color: #102a43;
          line-height: 1.1;
        }

        .stat-label {
          margin-top: 5px;
          color: #829ab1;
          font-size: 12px;
          font-weight: 600;
        }

        /* ================================================
           SECTIONS
        ================================================= */

        .section {
          margin-bottom: 42px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;

          margin-bottom: 20px;
        }

        .section-heading h2 {
          margin: 0;
          color: #102a43;
          font-size: 25px;
          letter-spacing: -0.4px;
        }

        .section-heading p {
          margin: 7px 0 0;
          color: #829ab1;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ================================================
           INTERNSHIPS
        ================================================= */

        .internship-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .internship-card {
          min-width: 0;

          background: #ffffff;
          border: 1px solid #e2eaf3;
          border-radius: 15px;

          padding: 21px;

          box-shadow:
            0 6px 20px rgba(15, 23, 42, 0.045);

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .internship-card:hover {
          transform: translateY(-2px);
          border-color: #c9d9e9;
          box-shadow:
            0 10px 26px rgba(15, 23, 42, 0.07);
        }

        .internship-card.selected {
          border-color: #1769aa;
          box-shadow:
            0 0 0 2px rgba(23, 105, 170, 0.08),
            0 10px 25px rgba(15, 23, 42, 0.07);
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          margin-bottom: 17px;
        }

        .company-badge {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: #edf6ff;
          color: #1769aa;

          font-size: 17px;
          font-weight: 800;
        }

        .card-status {
          padding: 6px 9px;
          border-radius: 20px;

          background: #eef9f3;
          color: #287a50;

          font-size: 10px;
          font-weight: 800;
        }

        .internship-card h3 {
          margin: 0;

          color: #102a43;

          font-size: 18px;
          line-height: 1.35;
        }

        .company-name {
          margin: 5px 0 17px;

          color: #627d98;
          font-size: 12px;
          font-weight: 600;
        }

        .details-list {
          display: flex;
          flex-direction: column;
          gap: 9px;

          padding: 14px 0;

          border-top: 1px solid #edf1f5;
          border-bottom: 1px solid #edf1f5;
        }

        .detail {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #52667a;

          font-size: 12px;
          line-height: 1.4;
        }

        .detail span:first-child {
          width: 20px;
          flex-shrink: 0;
        }

        .card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;

          margin-top: 16px;
        }

        .view-button,
        .applicants-button {
          min-height: 40px;
          padding: 8px 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          font-size: 11px;
          font-weight: 800;

          text-align: center;
          text-decoration: none;

          cursor: pointer;

          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
        }

        .view-button {
          border: 1px solid #cbd9e8;
          background: #ffffff;
          color: #1769aa;
        }

        .view-button:hover {
          background: #f5faff;
          border-color: #1769aa;
        }

        .applicants-button {
          border: 1px solid #1769aa;
          background: #1769aa;
          color: #ffffff;
        }

        .applicants-button:hover {
          background: #12598f;
          border-color: #12598f;
          transform: translateY(-1px);
        }

        /* ================================================
           EMPTY
        ================================================= */

        .empty-card {
          padding: 45px 25px;

          background: #ffffff;
          border: 1px solid #e3ebf4;
          border-radius: 15px;

          text-align: center;

          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .empty-icon {
          width: 54px;
          height: 54px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 0 auto 15px;

          border-radius: 14px;
          background: #edf6ff;

          font-size: 23px;
        }

        .empty-card h3 {
          margin: 0;
          color: #102a43;
          font-size: 18px;
        }

        .empty-card p {
          max-width: 520px;
          margin: 8px auto 20px;

          color: #829ab1;
          font-size: 13px;
          line-height: 1.6;
        }

        .empty-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 40px;
          padding: 0 15px;

          border-radius: 8px;

          background: #1769aa;
          color: white;

          text-decoration: none;

          font-size: 12px;
          font-weight: 800;
        }

        /* ================================================
           APPLICATIONS
        ================================================= */

        .applications-section {
          scroll-margin-top: 20px;
        }

        .close-selection {
          min-height: 38px;
          padding: 0 14px;

          border: 1px solid #d4dfeb;
          border-radius: 8px;

          background: #ffffff;
          color: #52667a;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;
        }

        .close-selection:hover {
          background: #f5f8fc;
        }

        .applications-layout {
          display: grid;
          grid-template-columns:
            minmax(290px, 0.8fr)
            minmax(0, 1.7fr);

          gap: 18px;

          align-items: start;
        }

        .applications-list {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .application-card {
          width: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 13px;

          border: 1px solid #e2eaf3;
          border-radius: 11px;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          box-shadow:
            0 3px 10px rgba(15, 23, 42, 0.035);

          transition:
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .application-card:hover {
          border-color: #b9cee1;
          background: #fbfdff;
        }

        .application-card.active {
          border-color: #1769aa;
          background: #f5faff;
        }

        .applicant-avatar {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 11px;

          background: #edf6ff;
          color: #1769aa;

          font-size: 15px;
          font-weight: 800;
        }

        .applicant-main {
          min-width: 0;
          flex: 1;
        }

        .applicant-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #102a43;
          font-size: 13px;
          font-weight: 800;
        }

        .applicant-field {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          margin-top: 3px;

          color: #829ab1;
          font-size: 11px;
        }

        .applicant-status {
          display: inline-block;

          margin-top: 6px;

          color: #627d98;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .match-score {
          min-width: 53px;

          display: flex;
          flex-direction: column;
          align-items: center;

          flex-shrink: 0;
        }

        .match-score strong {
          font-size: 15px;
        }

        .match-score span {
          margin-top: 2px;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .score-strong {
          color: #218553;
        }

        .score-good {
          color: #2875a9;
        }

        .score-possible {
          color: #a4771d;
        }

        .score-weak {
          color: #a34b4b;
        }

        /* ================================================
           APPLICATION DETAILS
        ================================================= */

        .application-details {
          min-width: 0;

          background: #ffffff;
          border: 1px solid #e2eaf3;
          border-radius: 15px;

          padding: 22px;

          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.045);
        }

        .details-placeholder {
          min-height: 430px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 30px;

          text-align: center;
        }

        .placeholder-icon {
          width: 58px;
          height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 15px;

          border-radius: 15px;
          background: #edf6ff;

          font-size: 24px;
        }

        .details-placeholder h3 {
          margin: 0;
          color: #102a43;
          font-size: 18px;
        }

        .details-placeholder p {
          max-width: 390px;

          margin: 8px 0 0;

          color: #829ab1;
          font-size: 13px;
          line-height: 1.6;
        }

        .applicant-detail-header {
          display: flex;
          align-items: center;
          gap: 15px;

          padding-bottom: 20px;

          border-bottom: 1px solid #edf1f5;
        }

        .large-avatar {
          width: 58px;
          height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 15px;

          background: #edf6ff;
          color: #1769aa;

          font-size: 22px;
          font-weight: 800;
        }

        .detail-header-info {
          min-width: 0;
          flex: 1;
        }

        .detail-header-info .eyebrow {
          margin-bottom: 4px;
        }

        .detail-header-info h2 {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          margin: 0;

          color: #102a43;
          font-size: 21px;
        }

        .detail-header-info p {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          margin: 4px 0 0;

          color: #829ab1;
          font-size: 12px;
        }

        .large-score {
          min-width: 75px;

          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 9px;

          border-radius: 10px;
          background: #f7f9fc;
        }

        .large-score strong {
          font-size: 21px;
        }

        .large-score span {
          margin-top: 2px;

          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        /* ================================================
           STATUS
        ================================================= */

        .status-section {
          padding: 18px 0;

          border-bottom: 1px solid #edf1f5;
        }

        .status-title {
          margin-bottom: 9px;

          color: #52667a;

          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .status-button {
          min-height: 36px;
          padding: 0 13px;

          border-radius: 8px;

          font-size: 11px;
          font-weight: 800;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .status-button:hover {
          transform: translateY(-1px);
        }

        .status-button.shortlist {
          border: 1px solid #a9d7bd;
          background: #f5fcf8;
          color: #287a50;
        }

        .status-button.shortlist.current {
          background: #dff3e8;
        }

        .status-button.reject {
          border: 1px solid #e6bcbc;
          background: #fff8f8;
          color: #a33a3a;
        }

        .status-button.reject.current {
          background: #f8e3e3;
        }

        .status-button.reset {
          border: 1px solid #d4dfeb;
          background: #ffffff;
          color: #627d98;
        }

        .status-button.reset.current {
          background: #eef3f8;
        }

        /* ================================================
           DETAIL SECTIONS
        ================================================= */

        .detail-section {
          padding: 19px 0;

          border-bottom: 1px solid #edf1f5;
        }

        .detail-section-title {
          margin-bottom: 13px;

          color: #102a43;

          font-size: 13px;
          font-weight: 800;
        }

        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .info-box {
          min-width: 0;

          padding: 11px 12px;

          border: 1px solid #edf1f5;
          border-radius: 9px;

          background: #fbfcfe;
        }

        .info-box span {
          display: block;

          margin-bottom: 5px;

          color: #829ab1;

          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .info-box strong {
          display: block;

          overflow-wrap: anywhere;

          color: #334e68;

          font-size: 11px;
          line-height: 1.4;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .skill-tag {
          padding: 6px 9px;

          border-radius: 20px;

          background: #edf6ff;
          color: #1769aa;

          font-size: 10px;
          font-weight: 700;
        }

        .muted {
          margin: 0;
          color: #829ab1;
          font-size: 12px;
        }

        /* ================================================
           AI ANALYSIS
        ================================================= */

        .match-analysis {
          margin: 19px 0;

          padding: 18px;

          border: 1px solid #dbe7f2;
          border-radius: 12px;

          background: #f8fbfe;
        }

        .analysis-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .analysis-header .eyebrow {
          margin-bottom: 3px;
        }

        .analysis-header h3 {
          margin: 0;

          color: #102a43;
          font-size: 18px;
        }

        .analysis-score {
          min-width: 62px;
          height: 62px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #ffffff;

          font-size: 18px;
          font-weight: 900;

          box-shadow:
            inset 0 0 0 4px #edf2f7;
        }

        .analysis-summary {
          margin: 12px 0 17px;

          color: #52667a;

          font-size: 12px;
          line-height: 1.6;
        }

        .score-breakdown {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .score-row div {
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .score-row span {
          color: #52667a;
          font-size: 11px;
          font-weight: 700;
        }

        .score-row small {
          margin-top: 2px;
          color: #9aaabd;
          font-size: 8px;
        }

        .score-row strong {
          flex-shrink: 0;

          color: #334e68;
          font-size: 11px;
        }

        .score-track {
          height: 5px;

          overflow: hidden;

          border-radius: 10px;

          background: #e7eef5;

          margin-bottom: 7px;
        }

        .score-fill {
          height: 100%;

          border-radius: inherit;

          background: #1769aa;
        }

        .analysis-block {
          margin-top: 17px;
        }

        .analysis-block h4 {
          margin: 0 0 8px;

          color: #334e68;
          font-size: 11px;
        }

        .analysis-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .matched-tag,
        .missing-tag {
          padding: 6px 8px;

          border-radius: 7px;

          font-size: 9px;
          font-weight: 700;
        }

        .matched-tag {
          background: #eaf8f0;
          color: #287a50;
        }

        .missing-tag {
          background: #fff7e7;
          color: #936b1d;
        }

        .analysis-list {
          display: flex;
          flex-direction: column;
          gap: 5px;

          margin: 0;
          padding: 0;

          list-style: none;

          color: #627d98;

          font-size: 10px;
          line-height: 1.5;
        }

        /* ================================================
           DOCUMENTS
        ================================================= */

        .document-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .document-button {
          width: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 12px;

          border: 1px solid #dce6ef;
          border-radius: 9px;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition:
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .document-button:hover {
          border-color: #1769aa;
          background: #f7fbff;
        }

        .document-icon {
          width: 35px;
          height: 35px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 8px;
          background: #edf6ff;

          font-size: 16px;
        }

        .document-button > span:nth-child(2) {
          min-width: 0;
          flex: 1;
        }

        .document-button strong {
          display: block;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #334e68;
          font-size: 10px;
        }

        .document-button small {
          display: block;

          margin-top: 3px;

          color: #829ab1;
          font-size: 8px;
        }

        .document-arrow {
          flex-shrink: 0;

          color: #1769aa;

          font-size: 15px;
          font-weight: 800;
        }

        /* ================================================
           LOADING
        ================================================= */

        .loading-applications {
          min-height: 260px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          background: #ffffff;
          border: 1px solid #e3ebf4;
          border-radius: 15px;
        }

        .small-spinner {
          width: 32px;
          height: 32px;

          margin-bottom: 12px;

          border: 3px solid #dbe7f5;
          border-top-color: #1769aa;

          border-radius: 50%;

          animation: spin 0.8s linear infinite;
        }

        .loading-applications p {
          margin: 0;

          color: #829ab1;
          font-size: 12px;
        }

        /* ================================================
           FOOTER
        ================================================= */

        .dashboard-footer {
          width: min(1400px, calc(100% - 40px));
          margin: 0 auto;

          padding: 25px 0;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          border-top: 1px solid #e1e9f1;

          color: #829ab1;
          font-size: 10px;
        }

        .dashboard-footer div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dashboard-footer strong {
          color: #52667a;
          font-size: 10px;
          letter-spacing: 0.6px;
        }

        /* ================================================
           TABLET
        ================================================= */

        @media (max-width: 1050px) {

          .internship-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .applications-layout {
            grid-template-columns:
              1fr;
          }

          .application-details {
            margin-top: 2px;
          }

        }

        /* ================================================
           MOBILE
        ================================================= */

        @media (max-width: 720px) {

          .header-inner,
          .dashboard-content,
          .dashboard-footer {
            width: min(100% - 24px, 1400px);
          }

          .header-inner {
            min-height: 70px;

            align-items: flex-start;
            padding: 13px 0;

            flex-direction: column;
            gap: 11px;
          }

          .header-actions {
            width: 100%;

            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));

            gap: 7px;
          }

          .header-button,
          .logout-button {
            width: 100%;
            min-height: 38px;
            padding: 0 7px;

            font-size: 10px;
          }

          .dashboard-content {
            padding-top: 28px;
          }

          .welcome-section {
            flex-direction: column;
            align-items: stretch;
            gap: 17px;
          }

          .welcome-section h1 {
            font-size: 29px;
          }

          .welcome-section p {
            font-size: 13px;
          }

          .post-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 9px;

            margin-bottom: 32px;
          }

          .stat-card {
            padding: 15px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-heading h2 {
            font-size: 21px;
          }

          .internship-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .internship-card {
            padding: 17px;
          }

          .card-actions {
            grid-template-columns: 1fr;
          }

          .applications-layout {
            grid-template-columns: 1fr;
          }

          .application-details {
            padding: 16px;
          }

          .applicant-detail-header {
            align-items: flex-start;
          }

          .large-score {
            min-width: 62px;
          }

          .large-score strong {
            font-size: 17px;
          }

          .detail-header-info h2 {
            font-size: 17px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .document-grid {
            grid-template-columns: 1fr;
          }

          .status-buttons {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .status-button {
            padding: 0 5px;
            font-size: 9px;
          }

          .dashboard-footer {
            align-items: flex-start;
            flex-direction: column;
          }

        }

        /* ================================================
           SMALL PHONES
        ================================================= */

        @media (max-width: 420px) {

          .brand-name {
            font-size: 13px;
          }

          .brand-subtitle {
            font-size: 8px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
          }

          .welcome-section h1 {
            font-size: 26px;
          }

          .application-card {
            padding: 10px;
            gap: 8px;
          }

          .applicant-avatar {
            width: 37px;
            height: 37px;
          }

          .match-score {
            min-width: 44px;
          }

          .match-score strong {
            font-size: 13px;
          }

          .match-score span {
            font-size: 7px;
          }

          .application-details {
            padding: 13px;
          }

          .applicant-detail-header {
            gap: 10px;
          }

          .large-avatar {
            width: 48px;
            height: 48px;
            font-size: 18px;
          }

          .large-score {
            min-width: 55px;
            padding: 7px;
          }

          .large-score strong {
            font-size: 15px;
          }

          .status-button {
            min-height: 34px;
          }

        }

      `}</style>

    </main>
  );
}