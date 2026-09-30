"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    return 5;
  }

  if (
    text.includes("master") ||
    text.includes("masters") ||
    text.includes("mba") ||
    text.includes("m.sc") ||
    text.includes("msc")
  ) {
    return 4;
  }

  if (
    text.includes("honours") ||
    text.includes("honors") ||
    text.includes("postgraduate diploma") ||
    text.includes("pgdip")
  ) {
    return 3;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bachelors") ||
    text.includes("bsc") ||
    text.includes("ba ") ||
    text === "ba" ||
    text.includes("bcom") ||
    text.includes("llb")
  ) {
    return 2;
  }

  if (
    text.includes("diploma") ||
    text.includes("higher certificate")
  ) {
    return 1;
  }

  return 0;
}

// ============================================================
// TEXT HELPERS
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSkills(value) {
  if (Array.isArray(value)) {
    return value
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[,;\n|]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

// ============================================================
// QUALIFICATION MATCH
// ============================================================

function qualificationMatches(applicantQualification, jobQualification) {
  const applicant = normalizeText(applicantQualification);
  const job = normalizeText(jobQualification);

  if (!applicant || !job) return false;

  if (applicant === job) return true;

  if (applicant.includes(job) || job.includes(applicant)) {
    return true;
  }

  const applicantLevel = getQualificationLevel(applicant);
  const jobLevel = getQualificationLevel(job);

  if (applicantLevel > 0 && jobLevel > 0) {
    return applicantLevel >= jobLevel;
  }

  return false;
}

// ============================================================
// MATCH SCORE
// Qualification = 35
// Field = 35
// Skills = 30
// ============================================================

function calculateMatch(applicant, internship) {
  let score = 0;

  const applicantQualification =
    applicant?.qualification || "";

  const jobQualification =
    internship?.qualification || "";

  const qualificationMatch = qualificationMatches(
    applicantQualification,
    jobQualification
  );

  if (qualificationMatch) {
    score += 35;
  }

  const applicantField = normalizeText(
    applicant?.field_of_study || ""
  );

  const jobField = normalizeText(
    internship?.field_of_study || ""
  );

  let fieldMatch = false;

  if (applicantField && jobField) {
    fieldMatch =
      applicantField === jobField ||
      applicantField.includes(jobField) ||
      jobField.includes(applicantField);
  }

  if (fieldMatch) {
    score += 35;
  }

  const applicantSkills = parseSkills(applicant?.skills)
    .map(normalizeText)
    .filter(Boolean);

  const jobSkills = parseSkills(internship?.skills)
    .map(normalizeText)
    .filter(Boolean);

  let matchingSkills = [];

  if (applicantSkills.length && jobSkills.length) {
    matchingSkills = applicantSkills.filter((applicantSkill) =>
      jobSkills.some(
        (jobSkill) =>
          applicantSkill === jobSkill ||
          applicantSkill.includes(jobSkill) ||
          jobSkill.includes(applicantSkill)
      )
    );
  }

  let skillScore = 0;

  if (jobSkills.length > 0 && matchingSkills.length > 0) {
    skillScore =
      (matchingSkills.length / jobSkills.length) * 30;
  }

  score += Math.min(30, Math.round(skillScore));

  let label = "Weak";

  if (score >= 85) {
    label = "Strong";
  } else if (score >= 70) {
    label = "Good";
  } else if (score >= 40) {
    label = "Possible";
  }

  return {
    score,
    label,
    qualificationMatch,
    fieldMatch,
    matchingSkills,
  };
}

// ============================================================
// STORAGE PATH HELPER
// ============================================================

function getStoragePath(value) {
  if (!value) return null;

  let path = String(value).trim();

  if (!path) return null;

  try {
    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      const url = new URL(path);
      path = url.pathname;
    }
  } catch {
    // Keep original value if it is not a valid URL.
  }

  path = path.split("?")[0];
  path = path.split("#")[0];

  path = path.replace(/^\/+/, "");

  path = path.replace(
    /^storage\/v1\/object\/(public|sign|authenticated)\//i,
    ""
  );

  path = path.replace(/^documents\//i, "");

  return path || null;
}

// ============================================================
// DOCUMENT FINDERS
// ============================================================

function findCV(application, graduate) {
  const possibleValues = [
    application?.cv_url,
    application?.cv,
    application?.resume_url,
    application?.resume,
    graduate?.cv_url,
    graduate?.cv,
    graduate?.resume_url,
    graduate?.resume,
  ];

  for (const value of possibleValues) {
    if (value) {
      const path = getStoragePath(value);

      if (path) {
        return path;
      }
    }
  }

  return null;
}

function findQualificationDocument(application, graduate) {
  const possibleValues = [
    application?.qualification_url,
    application?.qualification,
    application?.qualification_document,
    graduate?.qualification_url,
    graduate?.qualification_document,
    graduate?.qualification_file,
  ];

  for (const value of possibleValues) {
    if (value) {
      const path = getStoragePath(value);

      if (path) {
        return path;
      }
    }
  }

  return null;
}

// ============================================================
// OPEN SUPABASE DOCUMENT
// ============================================================

async function openStorageDocument(path, label = "document") {
  if (!path) {
    alert(`No ${label} was uploaded for this application.`);
    return;
  }

  const cleanPath = getStoragePath(path);

  if (!cleanPath) {
    alert(`The ${label} file path is invalid.`);
    return;
  }

  const documentWindow = window.open(
    "",
    "_blank"
  );

  if (!documentWindow) {
    alert(
      "Your browser blocked the document window. Please allow pop-ups for GradLink SA."
    );
    return;
  }

  documentWindow.document.write(`
    <html>
      <head>
        <title>Opening ${label}...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="
        font-family: Arial, sans-serif;
        padding: 30px;
        text-align: center;
        color: #1e293b;
      ">
        <h3>Opening ${label}...</h3>
        <p>Please wait.</p>
      </body>
    </html>
  `);

  try {
    const candidates = [];

    if (cleanPath) {
      candidates.push(cleanPath);
    }

    if (
      cleanPath &&
      cleanPath.startsWith("cv/")
    ) {
      candidates.push(cleanPath);
    }

    if (
      cleanPath &&
      cleanPath.startsWith("qualifications/")
    ) {
      candidates.push(cleanPath);
    }

    let signedUrl = null;
    let lastError = null;

    for (const candidate of [
      ...new Set(candidates),
    ]) {
      const { data, error } =
        await supabase.storage
          .from("documents")
          .createSignedUrl(candidate, 3600);

      if (!error && data?.signedUrl) {
        signedUrl = data.signedUrl;
        break;
      }

      lastError = error;
    }

    if (!signedUrl) {
      console.error(
        `Could not open ${label}:`,
        lastError
      );

      documentWindow.close();

      alert(
        `Could not open the ${label}. Please check that the uploaded file exists.`
      );

      return;
    }

    documentWindow.location.replace(signedUrl);
  } catch (error) {
    console.error(
      `Error opening ${label}:`,
      error
    );

    documentWindow.close();

    alert(
      `Could not open the ${label}. Please try again.`
    );
  }
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getStatusLabel(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "shortlisted") {
    return "Shortlisted";
  }

  if (value === "rejected") {
    return "Rejected";
  }

  if (value === "accepted") {
    return "Accepted";
  }

  return "Pending";
}

function getStatusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "shortlisted") {
    return "status-shortlisted";
  }

  if (value === "rejected") {
    return "status-rejected";
  }

  if (value === "accepted") {
    return "status-accepted";
  }

  return "status-pending";
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId = params?.id;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [user, setUser] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [internship, setInternship] = useState(null);

  const [applications, setApplications] = useState([]);

  const [subscription, setSubscription] = useState(null);
  const [premiumLoading, setPremiumLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: {
            user: authUser,
          },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authUser) {
          router.push("/login");
          return;
        }

        if (cancelled) return;

        setUser(authUser);

        // ------------------------------------------------------
        // COMPANY
        // ------------------------------------------------------

        const {
          data: company,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (companyError) {
          console.error(
            "Company profile error:",
            companyError
          );
        }

        if (!company) {
          throw new Error(
            "Your company profile could not be found."
          );
        }

        if (cancelled) return;

        setCompanyData(company);

        // ------------------------------------------------------
        // SUBSCRIPTION
        // company_id = auth user id
        // ------------------------------------------------------

        const {
          data: subscriptionData,
          error: subscriptionError,
        } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", authUser.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Company subscription error:",
            subscriptionError
          );
        }

        if (!cancelled) {
          setSubscription(
            subscriptionData || null
          );
        }

        setPremiumLoading(false);

        // ------------------------------------------------------
        // INTERNSHIP
        // ------------------------------------------------------

        const {
          data: internshipData,
          error: internshipError,
        } = await supabase
          .from("internships")
          .select("*")
          .eq("id", internshipId)
          .maybeSingle();

        if (internshipError) {
          throw internshipError;
        }

        if (!internshipData) {
          throw new Error(
            "This internship could not be found."
          );
        }

        // ------------------------------------------------------
        // SECURITY CHECK
        // Make sure this internship belongs to the company.
        // ------------------------------------------------------

        const companyName = normalizeText(
          company.company_name
        );

        const internshipCompanyName =
          normalizeText(
            internshipData.company_name
          );

        if (
          companyName &&
          internshipCompanyName &&
          companyName !== internshipCompanyName
        ) {
          throw new Error(
            "You do not have permission to view these applicants."
          );
        }

        if (cancelled) return;

        setInternship(internshipData);

        // ------------------------------------------------------
        // APPLICATIONS
        // ------------------------------------------------------

        const {
          data: applicationData,
          error: applicationsError,
        } = await supabase
          .from("applications")
          .select("*")
          .eq("internship_id", internshipId)
          .order("created_at", {
            ascending: false,
          });

        if (applicationsError) {
          throw applicationsError;
        }

        const rawApplications =
          applicationData || [];

        // ------------------------------------------------------
        // GRADUATE IDS
        // ------------------------------------------------------

        const graduateIds = [
          ...new Set(
            rawApplications
              .map(
                (application) =>
                  application.graduate_id
              )
              .filter(Boolean)
          ),
        ];

        let graduates = [];

        if (graduateIds.length > 0) {
          const {
            data: graduateData,
            error: graduateError,
          } = await supabase
            .from("graduates")
            .select("*")
            .in("id", graduateIds);

          if (graduateError) {
            console.error(
              "Graduate profile error:",
              graduateError
            );
          }

          graduates = graduateData || [];
        }

        // ------------------------------------------------------
        // MERGE APPLICATION + GRADUATE
        // ------------------------------------------------------

        const graduateMap = new Map(
          graduates.map((graduate) => [
            graduate.id,
            graduate,
          ])
        );

        const mergedApplications =
          rawApplications.map((application) => {
            const graduate =
              graduateMap.get(
                application.graduate_id
              ) || {};

            const applicant = {
              ...graduate,
              ...application,
              graduate,
            };

            const match = calculateMatch(
              applicant,
              internshipData
            );

            return {
              ...application,
              graduate,
              applicant,
              match,
            };
          });

        // ------------------------------------------------------
        // SORT BY MATCH SCORE
        // ------------------------------------------------------

        mergedApplications.sort(
          (a, b) =>
            (b.match?.score || 0) -
            (a.match?.score || 0)
        );

        if (!cancelled) {
          setApplications(
            mergedApplications
          );
        }
      } catch (error) {
        console.error(
          "Applicants page error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error?.message ||
              "Could not load applicants."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (internshipId) {
      loadPage();
    }

    return () => {
      cancelled = true;
    };
  }, [internshipId, router]);

  // ==========================================================
  // PREMIUM
  // ==========================================================

  const subscriptionStatus =
    String(
      subscription?.status || ""
    ).toLowerCase();

  const subscriptionPlan =
    String(
      subscription?.plan || ""
    ).toLowerCase();

  const isPremium =
    subscriptionStatus === "active" &&
    [
      "professional",
      "premium",
      "pro",
      "enterprise",
    ].includes(subscriptionPlan);

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = useMemo(() => {
    const total = applications.length;

    const shortlisted =
      applications.filter(
        (application) =>
          String(
            application.status || ""
          ).toLowerCase() === "shortlisted"
      ).length;

    const rejected =
      applications.filter(
        (application) =>
          String(
            application.status || ""
          ).toLowerCase() === "rejected"
      ).length;

    const strongMatches =
      applications.filter(
        (application) =>
          (application.match?.score || 0) >= 85
      ).length;

    return {
      total,
      shortlisted,
      rejected,
      strongMatches,
    };
  }, [applications]);

  // ==========================================================
  // UPDATE APPLICATION STATUS
  // ==========================================================

  async function updateStatus(
    applicationId,
    status
  ) {
    if (!applicationId) {
      alert("Application ID is missing.");
      return;
    }

    setActionLoading(
      `${applicationId}-${status}`
    );

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) {
        console.error(
          "Application status error:",
          error
        );

        alert(
          error.message ||
            "Could not update application status."
        );

        return;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status,
              }
            : application
        )
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error?.message ||
          "Could not update application status."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ==========================================================
  // DOCUMENT ACTIONS
  // ==========================================================

  async function handleCV(application) {
    const path = findCV(
      application,
      application?.graduate
    );

    await openStorageDocument(
      path,
      "CV"
    );
  }

  async function handleQualification(
    application
  ) {
    const path =
      findQualificationDocument(
        application,
        application?.graduate
      );

    await openStorageDocument(
      path,
      "qualification"
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .loading-box {
            text-align: center;
          }

          .spinner {
            width: 42px;
            height: 42px;
            border: 4px solid #dbeafe;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 18px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
          }

          .loading-text {
            color: #64748b;
            font-size: 14px;
          }
        `}</style>

        <main className="loading-page">
          <div className="loading-box">
            <div className="spinner" />
            <div className="loading-title">
              Loading applicants
            </div>
            <div className="loading-text">
              Please wait...
            </div>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (errorMessage) {
    return (
      <>
        <style jsx>{`
          .error-page {
            min-height: 100vh;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .error-box {
            width: 100%;
            max-width: 560px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 32px;
            text-align: center;
            box-shadow:
              0 15px 40px rgba(
                15,
                23,
                42,
                0.08
              );
          }

          .error-icon {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            background: #fee2e2;
            color: #dc2626;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 18px;
            font-size: 25px;
            font-weight: 900;
          }

          .error-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 10px;
          }

          .error-message {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 24px;
          }

          .back-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 20px;
            border-radius: 10px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            font-weight: 800;
          }
        `}</style>

        <main className="error-page">
          <div className="error-box">
            <div className="error-icon">
              !
            </div>

            <div className="error-title">
              Could not load applicants
            </div>

            <div className="error-message">
              {errorMessage}
            </div>

            <Link
              href="/company-dashboard"
              className="back-button"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f8fafc;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #0f172a;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        .page {
          min-height: 100vh;
          background:
            linear-gradient(
              180deg,
              #eff6ff 0,
              #f8fafc 260px
            );
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(
            255,
            255,
            255,
            0.96
          );
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8f0;
        }

        .topbar-inner {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .brand-area {
          min-width: 0;
        }

        .brand {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0f3b82;
        }

        .brand-subtitle {
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .nav-button {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .nav-secondary {
          color: #334155;
          background: white;
          border: 1px solid #cbd5e1;
        }

        .nav-primary {
          color: white;
          background: #2563eb;
          border: 1px solid #2563eb;
        }

        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px 24px 60px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #2563eb;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .hero-copy {
          min-width: 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 10px;
        }

        .title {
          margin: 0;
          font-size: clamp(
            28px,
            4vw,
            42px
          );
          line-height: 1.08;
          letter-spacing: -1.2px;
          color: #0f172a;
        }

        .subtitle {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.6;
          max-width: 760px;
        }

        .subscription-badge {
          flex-shrink: 0;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          border-radius: 14px;
          padding: 13px 15px;
          min-width: 190px;
        }

        .subscription-label {
          font-size: 10px;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .subscription-value {
          margin-top: 4px;
          font-size: 16px;
          font-weight: 900;
          color: #1d4ed8;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          padding: 18px;
        }

        .stat-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .stat-value {
          margin-top: 7px;
          font-size: 27px;
          font-weight: 900;
          color: #0f172a;
        }

        .stat-blue {
          color: #2563eb;
        }

        .stat-green {
          color: #059669;
        }

        .stat-red {
          color: #dc2626;
        }

        .stat-purple {
          color: #7c3aed;
        }

        .premium-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background: linear-gradient(
            135deg,
            #0f3b82,
            #2563eb
          );
          color: white;
          border-radius: 17px;
          padding: 20px 22px;
          margin-bottom: 24px;
          box-shadow:
            0 12px 30px rgba(
              37,
              99,
              235,
              0.16
            );
        }

        .premium-copy {
          min-width: 0;
        }

        .premium-title {
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 5px;
        }

        .premium-text {
          font-size: 13px;
          line-height: 1.5;
          color: #dbeafe;
        }

        .premium-button {
          flex-shrink: 0;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 9px;
          background: white;
          color: #1d4ed8;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .table-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
        }

        .section-header {
          padding: 20px 22px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .section-count {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .empty {
          padding: 60px 24px;
          text-align: center;
        }

        .empty-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: 900;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 900;
          margin-bottom: 7px;
        }

        .empty-text {
          color: #64748b;
          font-size: 14px;
        }

        .applicant-list {
          width: 100%;
        }

        .applicant {
          padding: 22px;
          border-bottom: 1px solid #e2e8f0;
        }

        .applicant:last-child {
          border-bottom: 0;
        }

        .applicant-main {
          display: grid;
          grid-template-columns:
            minmax(240px, 1.25fr)
            minmax(190px, 1fr)
            minmax(180px, 0.8fr)
            minmax(300px, 1.5fr);
          gap: 20px;
          align-items: start;
        }

        .candidate-name {
          font-size: 17px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 5px;
        }

        .candidate-email {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }

        .candidate-meta {
          margin-top: 12px;
          display: grid;
          gap: 6px;
        }

        .meta-row {
          font-size: 12px;
          color: #475569;
          line-height: 1.45;
        }

        .meta-label {
          color: #94a3b8;
          font-weight: 800;
        }

        .match-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 14px;
        }

        .match-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .match-score {
          font-size: 25px;
          font-weight: 900;
          color: #2563eb;
        }

        .match-label {
          font-size: 11px;
          font-weight: 900;
          padding: 5px 8px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
        }

        .match-details {
          margin-top: 10px;
          display: grid;
          gap: 6px;
        }

        .match-detail {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }

        .skills {
          margin-top: 9px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .skill {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 7px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
        }

        .actions-column {
          min-width: 0;
        }

        .status-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .status-title {
          font-size: 11px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 27px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-shortlisted {
          background: #dcfce7;
          color: #166534;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-accepted {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .button-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .action-button {
          min-height: 40px;
          border-radius: 9px;
          padding: 7px 10px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .action-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .button-blue {
          color: #1d4ed8;
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .button-green {
          color: #047857;
          background: #ecfdf5;
          border-color: #a7f3d0;
        }

        .button-red {
          color: #b91c1c;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .button-gray {
          color: #475569;
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .button-full {
          grid-column: 1 / -1;
        }

        .document-note {
          margin-top: 9px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.4;
        }

        @media (max-width: 1150px) {
          .applicant-main {
            grid-template-columns:
              minmax(220px, 1fr)
              minmax(220px, 1fr);
          }

          .actions-column {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 760px) {
          .topbar-inner {
            padding: 12px 15px;
            align-items: flex-start;
          }

          .brand {
            font-size: 18px;
          }

          .brand-subtitle {
            display: none;
          }

          .top-actions {
            gap: 6px;
          }

          .nav-button {
            min-height: 38px;
            padding: 0 10px;
            font-size: 11px;
          }

          .container {
            padding: 22px 15px 45px;
          }

          .hero {
            display: block;
          }

          .subscription-badge {
            margin-top: 15px;
            min-width: 0;
          }

          .stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .premium-banner {
            display: block;
          }

          .premium-button {
            margin-top: 14px;
          }

          .section-header {
            padding: 17px 15px;
          }

          .applicant {
            padding: 17px 15px;
          }

          .applicant-main {
            display: block;
          }

          .match-box {
            margin-top: 15px;
          }

          .actions-column {
            margin-top: 15px;
          }

          .button-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 430px) {
          .top-actions .dashboard-link {
            display: none;
          }

          .title {
            font-size: 28px;
          }

          .stats {
            gap: 9px;
          }

          .stat {
            padding: 14px;
          }

          .stat-value {
            font-size: 23px;
          }

          .button-grid {
            grid-template-columns: 1fr;
          }

          .button-full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="page">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand-area">
              <div className="brand">
                GradLink SA
              </div>

              <div className="brand-subtitle">
                Applicant Management
              </div>
            </div>

            <div className="top-actions">
              <Link
                href="/company-dashboard"
                className="nav-button nav-secondary dashboard-link"
              >
                Dashboard
              </Link>

              <Link
                href="/company-pricing"
                className="nav-button nav-primary"
              >
                View Plans
              </Link>
            </div>
          </div>
        </header>

        <main className="container">
          <Link
            href="/company-dashboard"
            className="back-link"
          >
            ← Back to Dashboard
          </Link>

          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                Applicant Management
              </div>

              <h1 className="title">
                {internship?.job_title ||
                  "Internship Applicants"}
              </h1>

              <p className="subtitle">
                Review applicants, compare their
                qualifications and skills, and
                manage application status from one
                place.
              </p>
            </div>

            <div className="subscription-badge">
              <div className="subscription-label">
                Company Plan
              </div>

              <div className="subscription-value">
                {premiumLoading
                  ? "Checking..."
                  : subscription
                    ? `${
                        subscription.plan
                          ? String(
                              subscription.plan
                            )
                              .charAt(0)
                              .toUpperCase() +
                            String(
                              subscription.plan
                            ).slice(1)
                          : "Plan"
                      } • ${
                        subscriptionStatus ||
                        "inactive"
                      }`
                    : "No active plan"}
              </div>
            </div>
          </section>

          <section className="stats">
            <div className="stat">
              <div className="stat-label">
                Total Applicants
              </div>

              <div className="stat-value stat-blue">
                {stats.total}
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                Shortlisted
              </div>

              <div className="stat-value stat-green">
                {stats.shortlisted}
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                Rejected
              </div>

              <div className="stat-value stat-red">
                {stats.rejected}
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">
                Strong Matches
              </div>

              <div className="stat-value stat-purple">
                {stats.strongMatches}
              </div>
            </div>
          </section>

          {!isPremium && (
            <section className="premium-banner">
              <div className="premium-copy">
                <div className="premium-title">
                  Unlock advanced applicant tools
                </div>

                <div className="premium-text">
                  Professional and Enterprise
                  plans can support advanced
                  applicant screening and document
                  verification features.
                </div>
              </div>

              <Link
                href="/company-pricing"
                className="premium-button"
              >
                View Plans
              </Link>
            </section>
          )}

          <section className="table-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  Applicants
                </h2>

                <div className="section-count">
                  {stats.total}{" "}
                  {stats.total === 1
                    ? "application"
                    : "applications"}
                </div>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">
                  ✓
                </div>

                <div className="empty-title">
                  No applicants yet
                </div>

                <div className="empty-text">
                  Applications for this internship
                  will appear here when graduates
                  apply.
                </div>
              </div>
            ) : (
              <div className="applicant-list">
                {applications.map(
                  (application, index) => {
                    const applicant =
                      application.applicant ||
                      application.graduate ||
                      {};

                    const graduate =
                      application.graduate ||
                      {};

                    const match =
                      application.match || {
                        score: 0,
                        label: "Weak",
                        qualificationMatch: false,
                        fieldMatch: false,
                        matchingSkills: [],
                      };

                    const status =
                      application.status ||
                      "pending";

                    const candidateName =
                      graduate.full_name ||
                      applicant.full_name ||
                      `Applicant ${
                        index + 1
                      }`;

                    const email =
                      graduate.email ||
                      applicant.email ||
                      "Email not available";

                    const qualification =
                      graduate.qualification ||
                      applicant.qualification ||
                      "Not provided";

                    const field =
                      graduate.field_of_study ||
                      applicant.field_of_study ||
                      "Not provided";

                    const institution =
                      graduate.institution ||
                      applicant.institution ||
                      "Not provided";

                    const province =
                      graduate.province ||
                      applicant.province ||
                      "";

                    const skills =
                      parseSkills(
                        graduate.skills ||
                          applicant.skills
                      );

                    return (
                      <article
                        className="applicant"
                        key={
                          application.id ||
                          `${candidateName}-${index}`
                        }
                      >
                        <div className="applicant-main">
                          <div>
                            <div className="candidate-name">
                              {candidateName}
                            </div>

                            <div className="candidate-email">
                              {email}
                            </div>

                            <div className="candidate-meta">
                              <div className="meta-row">
                                <span className="meta-label">
                                  Qualification:
                                </span>{" "}
                                {qualification}
                              </div>

                              <div className="meta-row">
                                <span className="meta-label">
                                  Field:
                                </span>{" "}
                                {field}
                              </div>

                              <div className="meta-row">
                                <span className="meta-label">
                                  Institution:
                                </span>{" "}
                                {institution}
                              </div>

                              {province && (
                                <div className="meta-row">
                                  <span className="meta-label">
                                    Province:
                                  </span>{" "}
                                  {province}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="match-box">
                            <div className="match-top">
                              <div className="match-score">
                                {match.score}%
                              </div>

                              <div className="match-label">
                                {match.label}
                              </div>
                            </div>

                            <div className="match-details">
                              <div className="match-detail">
                                Qualification:{" "}
                                {match.qualificationMatch
                                  ? "Matched"
                                  : "Not matched"}
                              </div>

                              <div className="match-detail">
                                Field:{" "}
                                {match.fieldMatch
                                  ? "Matched"
                                  : "Not matched"}
                              </div>

                              <div className="match-detail">
                                Skills:{" "}
                                {match.matchingSkills
                                  ?.length ||
                                  0}{" "}
                                matched
                              </div>
                            </div>

                            {match.matchingSkills
                              ?.length > 0 && (
                              <div className="skills">
                                {match.matchingSkills
                                  .slice(0, 6)
                                  .map(
                                    (
                                      skill,
                                      skillIndex
                                    ) => (
                                      <span
                                        className="skill"
                                        key={`${skill}-${skillIndex}`}
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="candidate-meta">
                              <div className="meta-row">
                                <span className="meta-label">
                                  Application:
                                </span>{" "}
                                {getStatusLabel(
                                  status
                                )}
                              </div>

                              {application.created_at && (
                                <div className="meta-row">
                                  <span className="meta-label">
                                    Applied:
                                  </span>{" "}
                                  {new Date(
                                    application.created_at
                                  ).toLocaleDateString(
                                    "en-ZA",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="actions-column">
                            <div className="status-line">
                              <span className="status-title">
                                Status
                              </span>

                              <span
                                className={`status ${getStatusClass(
                                  status
                                )}`}
                              >
                                {getStatusLabel(
                                  status
                                )}
                              </span>
                            </div>

                            <div className="button-grid">
                              <button
                                type="button"
                                className="action-button button-blue"
                                onClick={() =>
                                  handleCV(
                                    application
                                  )
                                }
                              >
                                Review CV
                              </button>

                              <button
                                type="button"
                                className="action-button button-blue"
                                onClick={() =>
                                  handleQualification(
                                    application
                                  )
                                }
                              >
                                View Qualification
                              </button>

                              <Link
                                href={`/company/internships/${internshipId}/applicants/${application.id}`}
                                className="action-button button-gray button-full"
                              >
                                Full Application
                              </Link>

                              <button
                                type="button"
                                className="action-button button-green"
                                disabled={
                                  actionLoading !==
                                  null
                                }
                                onClick={() =>
                                  updateStatus(
                                    application.id,
                                    "shortlisted"
                                  )
                                }
                              >
                                {actionLoading ===
                                `${application.id}-shortlisted`
                                  ? "Saving..."
                                  : "Shortlist"}
                              </button>

                              <button
                                type="button"
                                className="action-button button-red"
                                disabled={
                                  actionLoading !==
                                  null
                                }
                                onClick={() =>
                                  updateStatus(
                                    application.id,
                                    "rejected"
                                  )
                                }
                              >
                                {actionLoading ===
                                `${application.id}-rejected`
                                  ? "Saving..."
                                  : "Reject"}
                              </button>

                              <button
                                type="button"
                                className="action-button button-gray button-full"
                                disabled={
                                  actionLoading !==
                                  null
                                }
                                onClick={() =>
                                  updateStatus(
                                    application.id,
                                    "pending"
                                  )
                                }
                              >
                                {actionLoading ===
                                `${application.id}-pending`
                                  ? "Saving..."
                                  : "Reset to Pending"}
                              </button>
                            </div>

                            <div className="document-note">
                              Documents open through
                              secure signed Supabase
                              storage links.
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}