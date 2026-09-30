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
// MATCHING HELPERS
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function splitSkills(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateMatch(internship, graduate) {
  if (!internship || !graduate) {
    return {
      score: 0,
      qualificationScore: 0,
      fieldScore: 0,
      skillsScore: 0,
      label: "Weak",
      matchedSkills: [],
    };
  }

  const qualificationRequired = normalizeText(internship.qualification);
  const qualificationGraduate = normalizeText(graduate.qualification);

  const fieldRequired = normalizeText(internship.field_of_study);
  const fieldGraduate = normalizeText(graduate.field_of_study);

  const requiredSkills = splitSkills(internship.skills).map(normalizeText);
  const graduateSkills = splitSkills(graduate.skills).map(normalizeText);

  let qualificationScore = 0;
  let fieldScore = 0;
  let skillsScore = 0;

  if (
    qualificationRequired &&
    qualificationGraduate &&
    (
      qualificationGraduate.includes(qualificationRequired) ||
      qualificationRequired.includes(qualificationGraduate)
    )
  ) {
    qualificationScore = 35;
  }

  if (
    fieldRequired &&
    fieldGraduate &&
    (
      fieldGraduate.includes(fieldRequired) ||
      fieldRequired.includes(fieldGraduate)
    )
  ) {
    fieldScore = 35;
  }

  const matchedSkills = [];

  if (requiredSkills.length > 0) {
    requiredSkills.forEach((requiredSkill) => {
      const found = graduateSkills.some(
        (graduateSkill) =>
          graduateSkill.includes(requiredSkill) ||
          requiredSkill.includes(graduateSkill)
      );

      if (found) {
        matchedSkills.push(requiredSkill);
      }
    });

    skillsScore = Math.round(
      (matchedSkills.length / requiredSkills.length) * 30
    );
  }

  const score = Math.min(
    100,
    qualificationScore + fieldScore + skillsScore
  );

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
    qualificationScore,
    fieldScore,
    skillsScore,
    label,
    matchedSkills,
  };
}

function getMatchClass(score) {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 40) return "possible";
  return "weak";
}

// ============================================================
// DOCUMENT PATH HELPERS
// ============================================================

function cleanStoragePath(documentPath) {
  if (!documentPath) return "";

  let filePath = String(documentPath).trim();

  if (!filePath) return "";

  try {
    filePath = decodeURIComponent(filePath);
  } catch (error) {
    console.log("Document decode warning:", error);
  }

  /*
   * If this is already a normal storage path such as:
   *
   * cv/123/example.pdf
   *
   * or:
   *
   * qualifications/123/example.pdf
   *
   * keep it.
   */

  // Supabase storage URL
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    try {
      const parsedUrl = new URL(filePath);

      const pathname = parsedUrl.pathname;

      /*
       * Examples:
       *
       * /storage/v1/object/sign/documents/cv/file.pdf
       * /storage/v1/object/public/documents/cv/file.pdf
       * /storage/v1/object/authenticated/documents/cv/file.pdf
       */

      const storageMatch = pathname.match(
        /\/storage\/v1\/object\/(?:sign|public|authenticated)\/(.+)$/i
      );

      if (storageMatch?.[1]) {
        filePath = storageMatch[1];
      } else {
        const documentsMatch = pathname.match(
          /\/documents\/(.+)$/i
        );

        if (documentsMatch?.[1]) {
          filePath = documentsMatch[1];
        } else {
          /*
           * If this is not a Supabase storage URL, return the
           * original URL. The caller can open it directly.
           */
          return filePath;
        }
      }
    } catch (error) {
      console.log("URL parsing warning:", error);
    }
  }

  filePath = filePath.replace(/^\/+/, "");
  filePath = filePath.replace(/^documents\//i, "");

  filePath = filePath.split("?")[0];
  filePath = filePath.split("#")[0];

  return filePath.trim();
}

// ============================================================
// DOCUMENT VALUE COLLECTION
// ============================================================

function getDocumentValues(application, graduate, type) {
  const values = [];

  if (type === "cv") {
    values.push(application?.cv_url);
    values.push(application?.cv_path);
    values.push(graduate?.cv_url);
    values.push(graduate?.cv_path);
  }

  if (type === "qualification") {
    values.push(application?.qualification_url);
    values.push(application?.qualification_path);
    values.push(graduate?.qualification_url);
    values.push(graduate?.qualification_path);
  }

  return [...new Set(values.filter(Boolean))];
}

// ============================================================
// OPEN DOCUMENT
// ============================================================

async function openStorageDocument(documentValues, label = "Document") {
  const values = Array.isArray(documentValues)
    ? documentValues
    : [documentValues];

  const cleanedCandidates = [];

  for (const rawValue of values) {
    if (!rawValue) continue;

    const value = String(rawValue).trim();

    if (!value) continue;

    /*
     * Keep external URLs as direct candidates.
     */
    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      const cleaned = cleanStoragePath(value);

      /*
       * If cleanStoragePath returned a storage path, use that.
       * Otherwise keep the original external URL.
       */
      if (
        cleaned &&
        !cleaned.startsWith("http://") &&
        !cleaned.startsWith("https://")
      ) {
        cleanedCandidates.push({
          type: "storage",
          value: cleaned,
        });
      } else {
        cleanedCandidates.push({
          type: "external",
          value,
        });
      }

      continue;
    }

    const cleaned = cleanStoragePath(value);

    if (cleaned) {
      cleanedCandidates.push({
        type: "storage",
        value: cleaned,
      });
    }
  }

  const uniqueCandidates = [];
  const seen = new Set();

  for (const candidate of cleanedCandidates) {
    const key = `${candidate.type}:${candidate.value}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueCandidates.push(candidate);
    }
  }

  if (uniqueCandidates.length === 0) {
    alert(`No ${label} was uploaded for this application.`);
    return;
  }

  let lastError = null;

  try {
    /*
     * IMPORTANT:
     *
     * We do NOT use window.open() here.
     *
     * The old code opened a blank tab and then waited for Supabase.
     * That can cause problems on iPhone/Safari.
     *
     * We first obtain the secure URL and then navigate directly.
     */

    for (const candidate of uniqueCandidates) {
      if (candidate.type === "external") {
        window.location.assign(candidate.value);
        return;
      }

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(candidate.value, 3600);

      if (!error && data?.signedUrl) {
        window.location.assign(data.signedUrl);
        return;
      }

      lastError = error;
    }

    console.error(
      `Could not open ${label}:`,
      lastError
    );

    const errorMessage =
      lastError?.message ||
      `The ${label} file could not be opened.`;

    alert(
      `Could not open the ${label}.\n\n${errorMessage}\n\nPlease check that the uploaded file still exists.`
    );
  } catch (error) {
    console.error(
      `Error opening ${label}:`,
      error
    );

    alert(
      `Could not open the ${label}.\n\n${
        error?.message || "Unknown error."
      }`
    );
  }
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getStatusLabel(status) {
  const value = normalizeText(status);

  if (value === "shortlisted") return "Shortlisted";
  if (value === "rejected") return "Rejected";
  if (value === "reviewed") return "Reviewed";
  if (value === "hired") return "Hired";

  return "Applied";
}

function getStatusClass(status) {
  const value = normalizeText(status);

  if (value === "shortlisted") return "shortlisted";
  if (value === "rejected") return "rejected";
  if (value === "reviewed") return "reviewed";
  if (value === "hired") return "hired";

  return "applied";
}

// ============================================================
// PAGE
// ============================================================

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [openingDocument, setOpeningDocument] = useState("");

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [internship, setInternship] = useState(null);
  const [applications, setApplications] = useState([]);

  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("match");

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD PAGE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          router.push(
            `/login?redirect=/company/internships/${internshipId}/applicants`
          );
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        // ------------------------------------------------------
        // COMPANY
        // ------------------------------------------------------

        const { data: companyData, error: companyError } =
          await supabase
            .from("companies")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (companyError) {
          console.log(
            "Company lookup warning:",
            companyError
          );
        }

        if (mounted) {
          setCompany(companyData || null);
        }

        // ------------------------------------------------------
        // INTERNSHIP
        // ------------------------------------------------------

        const { data: internshipData, error: internshipError } =
          await supabase
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

        /*
         * Verify that this internship belongs to the logged-in
         * company.
         *
         * Existing GradLink internships use company_name, so
         * keep that compatibility here.
         */

        const companyName =
          companyData?.company_name ||
          currentUser.user_metadata?.company_name ||
          "";

        if (
          companyName &&
          internshipData.company_name &&
          normalizeText(internshipData.company_name) !==
            normalizeText(companyName)
        ) {
          throw new Error(
            "You do not have permission to view these applicants."
          );
        }

        if (mounted) {
          setInternship(internshipData);
        }

        // ------------------------------------------------------
        // APPLICATIONS
        // ------------------------------------------------------

        const { data: applicationData, error: applicationError } =
          await supabase
            .from("applications")
            .select("*")
            .eq("internship_id", internshipId)
            .order("created_at", {
              ascending: false,
            });

        if (applicationError) {
          throw applicationError;
        }

        const applicationRows = applicationData || [];

        // ------------------------------------------------------
        // GRADUATES
        // ------------------------------------------------------

        const graduateIds = [
          ...new Set(
            applicationRows
              .map((application) => application.graduate_id)
              .filter(Boolean)
          ),
        ];

        let graduateRows = [];

        if (graduateIds.length > 0) {
          const { data: graduatesData, error: graduatesError } =
            await supabase
              .from("graduates")
              .select("*")
              .in("id", graduateIds);

          if (graduatesError) {
            console.log(
              "Graduate lookup warning:",
              graduatesError
            );
          } else {
            graduateRows = graduatesData || [];
          }
        }

        const graduateMap = new Map(
          graduateRows.map((graduate) => [
            String(graduate.id),
            graduate,
          ])
        );

        // ------------------------------------------------------
        // COMBINE APPLICATION + GRADUATE DATA
        // ------------------------------------------------------

        const combinedApplications = applicationRows.map(
          (application) => {
            const graduate =
              graduateMap.get(
                String(application.graduate_id)
              ) || {};

            const match = calculateMatch(
              internshipData,
              graduate
            );

            return {
              ...application,
              graduate,
              match,
            };
          }
        );

        if (mounted) {
          setApplications(combinedApplications);
        }

        // ------------------------------------------------------
        // COMPANY SUBSCRIPTION
        // ------------------------------------------------------

        const { data: subscriptionData, error: subscriptionError } =
          await supabase
            .from("company_subscriptions")
            .select("*")
            .eq("company_id", currentUser.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (subscriptionError) {
          console.log(
            "Subscription lookup warning:",
            subscriptionError
          );
        }

        if (mounted) {
          setSubscription(subscriptionData || null);
        }
      } catch (pageError) {
        console.error(
          "Applicants page error:",
          pageError
        );

        if (mounted) {
          setError(
            pageError?.message ||
              "Something went wrong while loading applicants."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setSubscriptionLoading(false);
        }
      }
    }

    if (internshipId) {
      loadPage();
    }

    return () => {
      mounted = false;
    };
  }, [internshipId, router]);

  // ==========================================================
  // PAGE SHOW RESET
  // ==========================================================

  useEffect(() => {
    const handlePageShow = () => {
      setOpeningDocument("");
      setSaving("");
    };

    window.addEventListener(
      "pageshow",
      handlePageShow
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        handlePageShow
      );
    };
  }, []);

  // ==========================================================
  // SUBSCRIPTION STATUS
  // ==========================================================

  const subscriptionStatus = normalizeText(
    subscription?.status
  );

  const hasActiveSubscription =
    subscriptionStatus === "active";

  const planName =
    subscription?.plan
      ? String(subscription.plan)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          )
      : "No active plan";

  // ==========================================================
  // FILTERED APPLICATIONS
  // ==========================================================

  const filteredApplications = useMemo(() => {
    let rows = [...applications];

    const searchValue = normalizeText(search);

    if (searchValue) {
      rows = rows.filter((application) => {
        const graduate = application.graduate || {};

        const searchable = [
          graduate.full_name,
          graduate.email,
          graduate.phone,
          graduate.qualification,
          graduate.field_of_study,
          graduate.institution,
          graduate.province,
          graduate.career_goals,
          graduate.skills,
          application.status,
        ]
          .map(normalizeText)
          .join(" ");

        return searchable.includes(searchValue);
      });
    }

    if (statusFilter !== "all") {
      rows = rows.filter(
        (application) =>
          normalizeText(application.status) ===
          normalizeText(statusFilter)
      );
    }

    if (sortBy === "match") {
      rows.sort(
        (a, b) =>
          (b.match?.score || 0) -
          (a.match?.score || 0)
      );
    }

    if (sortBy === "newest") {
      rows.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    if (sortBy === "name") {
      rows.sort((a, b) =>
        String(
          a.graduate?.full_name || ""
        ).localeCompare(
          String(
            b.graduate?.full_name || ""
          )
        )
      );
    }

    return rows;
  }, [
    applications,
    search,
    statusFilter,
    sortBy,
  ]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalApplications = applications.length;

  const shortlistedCount = applications.filter(
    (application) =>
      normalizeText(application.status) ===
      "shortlisted"
  ).length;

  const reviewedCount = applications.filter(
    (application) =>
      normalizeText(application.status) ===
      "reviewed"
  ).length;

  const strongMatches = applications.filter(
    (application) =>
      (application.match?.score || 0) >= 85
  ).length;

  // ==========================================================
  // PART 2 STARTS HERE
  // ================================================
  
    // ==========================================================
  // DOCUMENT HANDLERS
  // ==========================================================

  async function handleCV(application) {
    const graduate = application?.graduate || {};

    const values = getDocumentValues(
      application,
      graduate,
      "cv"
    );

    setOpeningDocument(
      `cv-${application?.id || "document"}`
    );

    try {
      await openStorageDocument(
        values,
        "CV"
      );
    } finally {
      setOpeningDocument("");
    }
  }

  async function handleQualification(application) {
    const graduate = application?.graduate || {};

    const values = getDocumentValues(
      application,
      graduate,
      "qualification"
    );

    setOpeningDocument(
      `qualification-${application?.id || "document"}`
    );

    try {
      await openStorageDocument(
        values,
        "qualification document"
      );
    } finally {
      setOpeningDocument("");
    }
  }

  // ==========================================================
  // UPDATE APPLICATION STATUS
  // ==========================================================

  async function updateApplicationStatus(
    applicationId,
    status
  ) {
    if (!applicationId) return;

    setSaving(
      `${applicationId}-${status}`
    );

    try {
      const { error: updateError } =
        await supabase
          .from("applications")
          .update({
            status,
          })
          .eq("id", applicationId);

      if (updateError) {
        throw updateError;
      }

      setApplications((current) =>
        current.map((application) =>
          String(application.id) ===
          String(applicationId)
            ? {
                ...application,
                status,
              }
            : application
        )
      );
    } catch (updateError) {
      console.error(
        "Status update error:",
        updateError
      );

      alert(
        updateError?.message ||
          "Could not update the application status."
      );
    } finally {
      setSaving("");
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <div className="page-shell loading-page">
          <div className="loading-card">
            <div className="loading-logo">
              GL
            </div>

            <div className="spinner" />

            <h2>Loading applicants</h2>

            <p>
              Preparing your applicant dashboard...
            </p>
          </div>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          html,
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

          body {
            min-height: 100vh;
          }

          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background:
              radial-gradient(
                circle at top right,
                rgba(37, 99, 235, 0.1),
                transparent 32%
              ),
              linear-gradient(
                135deg,
                #f8fbff 0%,
                #eef5ff 100%
              );
          }

          .loading-card {
            width: 100%;
            max-width: 430px;
            text-align: center;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid #e1eaf5;
            border-radius: 24px;
            padding: 42px 26px;
            box-shadow:
              0 24px 70px rgba(15, 35, 63, 0.1);
          }

          .loading-logo {
            width: 58px;
            height: 58px;
            margin: 0 auto 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            background: linear-gradient(
              135deg,
              #0759d8,
              #1d8cff
            );
            color: white;
            font-size: 19px;
            font-weight: 900;
            letter-spacing: -1px;
            box-shadow:
              0 12px 28px rgba(7, 89, 216, 0.24);
          }

          .spinner {
            width: 34px;
            height: 34px;
            margin: 0 auto 20px;
            border: 3px solid #dce8f7;
            border-top-color: #0969e8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-card h2 {
            margin: 0 0 8px;
            font-size: 22px;
            letter-spacing: -0.4px;
          }

          .loading-card p {
            margin: 0;
            color: #6b7b91;
            font-size: 14px;
          }
        `}</style>
      </>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <>
        <div className="page-shell error-page">
          <div className="error-card">
            <div className="error-icon">
              !
            </div>

            <h2>We couldn't load this page</h2>

            <p>{error}</p>

            <div className="error-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>

              <Link
                href="/company-dashboard"
                className="secondary-button"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          html,
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

          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .error-card {
            width: 100%;
            max-width: 520px;
            padding: 42px 28px;
            text-align: center;
            background: white;
            border: 1px solid #e3ebf5;
            border-radius: 24px;
            box-shadow:
              0 24px 70px rgba(15, 35, 63, 0.1);
          }

          .error-icon {
            width: 58px;
            height: 58px;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #fff1f1;
            color: #d32f2f;
            font-size: 26px;
            font-weight: 900;
          }

          .error-card h2 {
            margin: 0 0 10px;
            font-size: 23px;
          }

          .error-card p {
            margin: 0 auto 24px;
            max-width: 420px;
            color: #68788d;
            line-height: 1.6;
            font-size: 14px;
          }

          .error-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .primary-button,
          .secondary-button {
            min-height: 44px;
            padding: 0 18px;
            border-radius: 11px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
          }

          .primary-button {
            border: 0;
            background: #0868e8;
            color: white;
          }

          .secondary-button {
            border: 1px solid #d8e2ef;
            background: white;
            color: #193454;
          }
        `}</style>
      </>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <>
      <div className="page-shell">

        {/* ====================================================
            TOP NAVIGATION
        ==================================================== */}

        <header className="topbar">
          <div className="topbar-inner">

            <Link
              href="/company-dashboard"
              className="brand"
            >
              <span className="brand-mark">
                GL
              </span>

              <span className="brand-text">
                <strong>GradLink</strong>
                <small>Company Portal</small>
              </span>
            </Link>

            <nav className="top-actions">
              <Link
                href="/company-dashboard"
                className="nav-link"
              >
                Dashboard
              </Link>

              <Link
                href="/company-pricing"
                className="nav-link"
              >
                Plans
              </Link>

              <Link
                href="/company"
                className="nav-link"
              >
                Company Profile
              </Link>
            </nav>
          </div>
        </header>

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <main className="main-content">

          {/* HERO */}

          <section className="hero-section">

            <div className="hero-copy">

              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Applicant Management
              </div>

              <h1>
                Applicants for{" "}
                <span>
                  {internship?.job_title ||
                    "this internship"}
                </span>
              </h1>

              <p>
                Review candidates, compare match scores,
                access submitted documents and manage
                application statuses from one place.
              </p>

              <div className="hero-meta">
                <span>
                  📍{" "}
                  {internship?.location ||
                    internship?.province ||
                    "South Africa"}
                </span>

                <span>
                  💼{" "}
                  {internship?.internship_type ||
                    "Internship"}
                </span>

                {internship?.deadline && (
                  <span>
                    📅 Deadline{" "}
                    {new Date(
                      internship.deadline
                    ).toLocaleDateString("en-ZA")}
                  </span>
                )}
              </div>
            </div>

            <div className="hero-actions">

              <Link
                href={`/company/internships/${internshipId}`}
                className="hero-secondary"
              >
                ← Internship
              </Link>

              <Link
                href="/company-dashboard"
                className="hero-primary"
              >
                Dashboard
              </Link>
            </div>
          </section>

          {/* ==================================================
              SUBSCRIPTION STRIP
          ================================================== */}

          <section className="subscription-strip">

            <div className="subscription-left">

              <div className="subscription-icon">
                ✦
              </div>

              <div>
                <span className="subscription-label">
                  Current company plan
                </span>

                <strong>
                  {subscriptionLoading
                    ? "Checking plan..."
                    : hasActiveSubscription
                    ? planName
                    : "No active plan"}
                </strong>
              </div>
            </div>

            <div className="subscription-right">

              <span
                className={
                  hasActiveSubscription
                    ? "status-pill active"
                    : "status-pill inactive"
                }
              >
                <span className="status-dot" />
                {hasActiveSubscription
                  ? "Active"
                  : "Inactive"}
              </span>

              <Link
                href="/company-pricing"
                className="upgrade-link"
              >
                {hasActiveSubscription
                  ? "View Plans"
                  : "Choose a Plan"}
                <span>→</span>
              </Link>
            </div>
          </section>

          {/* ==================================================
              STATS
          ================================================== */}

          <section className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon blue">
                👥
              </div>

              <div>
                <span>Total Applicants</span>
                <strong>
                  {totalApplications}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                ★
              </div>

              <div>
                <span>Strong Matches</span>
                <strong>
                  {strongMatches}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>Shortlisted</span>
                <strong>
                  {shortlistedCount}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                ◷
              </div>

              <div>
                <span>Reviewed</span>
                <strong>
                  {reviewedCount}
                </strong>
              </div>
            </div>

          </section>

          {/* ==================================================
              PREMIUM FEATURE BANNER
          ================================================== */}

          <section className="premium-banner">

            <div className="premium-symbol">
              ✦
            </div>

            <div className="premium-copy">
              <div className="premium-title">
                Smart applicant matching
                <span>PRO</span>
              </div>

              <p>
                GradLink compares qualifications,
                fields of study and skills to help
                you quickly identify relevant
                candidates.
              </p>
            </div>

            <div className="premium-score">
              <strong>
                35 / 35 / 30
              </strong>

              <span>
                Qualification · Field · Skills
              </span>
            </div>

          </section>

          {/* ==================================================
              TOOLBAR
          ================================================== */}

          <section className="toolbar">

            <div className="toolbar-heading">
              <div>
                <h2>Candidate applications</h2>

                <p>
                  {filteredApplications.length}{" "}
                  candidate
                  {filteredApplications.length === 1
                    ? ""
                    : "s"} shown
                </p>
              </div>
            </div>

            <div className="toolbar-controls">

              <div className="search-box">
                <span>⌕</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search applicants..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="filter-select"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="applied">
                  Applied
                </option>

                <option value="reviewed">
                  Reviewed
                </option>

                <option value="shortlisted">
                  Shortlisted
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="hired">
                  Hired
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="filter-select"
              >
                <option value="match">
                  Best match
                </option>

                <option value="newest">
                  Newest
                </option>

                <option value="name">
                  Name
                </option>
              </select>

            </div>
          </section>

          {/* ==================================================
              APPLICANTS
          ================================================== */}

          <section className="applicants-section">

            {filteredApplications.length === 0 ? (
              <div className="empty-state">

                <div className="empty-icon">
                  👥
                </div>

                <h3>
                  No applicants found
                </h3>

                <p>
                  {applications.length === 0
                    ? "There are currently no applications for this internship."
                    : "Try changing your search or filter."}
                </p>

                {search ||
                statusFilter !== "all" ? (
                  <button
                    type="button"
                    className="clear-button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}

              </div>
            ) : (
              <div className="applicant-list">

                {filteredApplications.map(
                  (application, index) => {

                    const graduate =
                      application.graduate || {};

                    const match =
                      application.match || {};

                    const score =
                      match.score || 0;

                    const matchClass =
                      getMatchClass(score);

                    const status =
                      application.status ||
                      "applied";

                    const candidateName =
                      graduate.full_name ||
                      "Applicant";

                    const initials =
                      candidateName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(
                          (name) =>
                            name[0]?.toUpperCase()
                        )
                        .join("") || "A";

                    const cvOpening =
                      openingDocument ===
                      `cv-${application.id}`;

                    const qualificationOpening =
                      openingDocument ===
                      `qualification-${application.id}`;

                    const shortlistSaving =
                      saving ===
                      `${application.id}-shortlisted`;

                    const rejectSaving =
                      saving ===
                      `${application.id}-rejected`;

                    const resetSaving =
                      saving ===
                      `${application.id}-applied`;

                    return (
                      <article
                        className="applicant-card"
                        key={application.id}
                      >

                        {/* CARD HEADER */}

                        <div className="candidate-top">

                          <div className="candidate-identity">

                            <div className="avatar">
                              {initials}
                            </div>

                            <div className="candidate-info">

                              <div className="candidate-name-row">
                                <h3>
                                  {candidateName}
                                </h3>

                                <span
                                  className={`status-badge ${getStatusClass(
                                    status
                                  )}`}
                                >
                                  {getStatusLabel(
                                    status
                                  )}
                                </span>
                              </div>

                              <p className="candidate-email">
                                {graduate.email ||
                                  "Email not provided"}
                              </p>

                              <div className="candidate-details">

                                {graduate.phone && (
                                  <span>
                                    ☎{" "}
                                    {graduate.phone}
                                  </span>
                                )}

                                {graduate.province && (
                                  <span>
                                    📍{" "}
                                    {graduate.province}
                                  </span>
                                )}

                                {graduate.institution && (
                                  <span>
                                    🎓{" "}
                                    {
                                      graduate.institution
                                    }
                                  </span>
                                )}

                              </div>
                            </div>
                          </div>

                          {/* MATCH SCORE */}

                          <div
                            className={`match-box ${matchClass}`}
                          >
                            <span>
                              Match
                            </span>

                            <strong>
                              {score}%
                            </strong>

                            <small>
                              {match.label ||
                                "Weak"}
                            </small>
                          </div>

                        </div>

                        {/* CANDIDATE DATA */}

                        <div className="candidate-grid">

                          <div className="candidate-field">
                            <span>
                              Qualification
                            </span>

                            <strong>
                              {graduate.qualification ||
                                "Not provided"}
                            </strong>

                            {match.qualificationScore >
                              0 && (
                              <em>
                                Matched
                              </em>
                            )}
                          </div>

                          <div className="candidate-field">
                            <span>
                              Field of study
                            </span>

                            <strong>
                              {graduate.field_of_study ||
                                "Not provided"}
                            </strong>

                            {match.fieldScore >
                              0 && (
                              <em>
                                Matched
                              </em>
                            )}
                          </div>

                          <div className="candidate-field">
                            <span>
                              Skills
                            </span>

                            <strong>
                              {graduate.skills
                                ? splitSkills(
                                    graduate.skills
                                  )
                                    .slice(0, 4)
                                    .join(", ")
                                : "Not provided"}
                            </strong>

                            {match.matchedSkills
                              ?.length > 0 && (
                              <em>
                                {
                                  match
                                    .matchedSkills
                                    .length
                                }{" "}
                                matched
                              </em>
                            )}
                          </div>

                        </div>

                        {/* MATCH BREAKDOWN */}

                        <div className="match-breakdown">

                          <div className="breakdown-title">
                            Match breakdown
                          </div>

                          <div className="breakdown-items">

                            <div>
                              <span>
                                Qualification
                              </span>

                              <strong>
                                {match.qualificationScore ||
                                  0}
                                /35
                              </strong>
                            </div>

                            <div>
                              <span>
                                Field
                              </span>

                              <strong>
                                {match.fieldScore ||
                                  0}
                                /35
                              </strong>
                            </div>

                            <div>
                              <span>
                                Skills
                              </span>

                              <strong>
                                {match.skillsScore ||
                                  0}
                                /30
                              </strong>
                            </div>

                          </div>

                          <div className="progress-track">
                            <div
                              className={`progress-fill ${matchClass}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  score
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                        {/* DOCUMENTS */}

                        <div className="document-row">

                          <button
                            type="button"
                            className="document-button"
                            onClick={() =>
                              handleCV(
                                application
                              )
                            }
                            disabled={
                              cvOpening ||
                              qualificationOpening
                            }
                          >
                            <span className="document-icon">
                              {cvOpening
                                ? "…"
                                : "📄"}
                            </span>

                            <span>
                              {cvOpening
                                ? "Opening CV..."
                                : "View CV"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="document-button"
                            onClick={() =>
                              handleQualification(
                                application
                              )
                            }
                            disabled={
                              qualificationOpening ||
                              cvOpening
                            }
                          >
                            <span className="document-icon">
                              {qualificationOpening
                                ? "…"
                                : "🎓"}
                            </span>

                            <span>
                              {qualificationOpening
                                ? "Opening..."
                                : "View Qualification"}
                            </span>
                          </button>

                          <Link
                            href={`/company/internships/${internshipId}/applicants/${application.id}`}
                            className="document-button primary-document"
                          >
                            <span className="document-icon">
                              ↗
                            </span>

                            <span>
                              Full Application
                            </span>
                          </Link>

                        </div>

                        {/* ACTIONS */}

                        <div className="candidate-actions">

                          <div className="action-label">
                            Application status
                          </div>

                          <div className="status-actions">

                            <button
                              type="button"
                              className="shortlist-button"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "shortlisted"
                                )
                              }
                              disabled={
                                saving !== ""
                              }
                            >
                              {shortlistSaving
                                ? "Saving..."
                                : "✓ Shortlist"}
                            </button>

                            <button
                              type="button"
                              className="reject-button"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "rejected"
                                )
                              }
                              disabled={
                                saving !== ""
                              }
                            >
                              {rejectSaving
                                ? "Saving..."
                                : "Reject"}
                            </button>

                            {normalizeText(
                              status
                            ) !== "applied" && (
                              <button
                                type="button"
                                className="reset-button"
                                onClick={() =>
                                  updateApplicationStatus(
                                    application.id,
                                    "applied"
                                  )
                                }
                                disabled={
                                  saving !== ""
                                }
                              >
                                {resetSaving
                                  ? "Saving..."
                                  : "Reset"}
                              </button>
                            )}

                          </div>
                        </div>

                        {/* APPLICATION DATE */}

                        <div className="application-footer">
                          <span>
                            Application #
                            {index + 1}
                          </span>

                          {application.created_at && (
                            <span>
                              Submitted{" "}
                              {new Date(
                                application.created_at
                              ).toLocaleDateString(
                                "en-ZA",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          )}
                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

          </section>

        </main>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="page-footer">
          <div>
            <strong>GradLink SA</strong>
            <span>
              Connecting South African graduates
              with opportunity.
            </span>
          </div>

          <span>
            © {new Date().getFullYear()} GradLink SA
          </span>
        </footer>

      </div>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html {
          margin: 0;
          padding: 0;
          background: #f4f7fb;
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background: #f4f7fb;
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

        button,
        input,
        select {
          font: inherit;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .page-shell {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 85% 0%,
              rgba(30, 117, 236, 0.07),
              transparent 26%
            ),
            #f4f7fb;
        }

        /* =====================================================
           TOPBAR
        ===================================================== */

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(
            255,
            255,
            255,
            0.94
          );
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid #e4ebf4;
        }

        .topbar-inner {
          width: min(
            1240px,
            calc(100% - 36px)
          );
          min-height: 72px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          color: #10233f;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #0759d8,
              #1e8cff
            );
          color: white;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.5px;
          box-shadow:
            0 8px 22px
              rgba(
                7,
                89,
                216,
                0.2
              );
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }

        .brand-text strong {
          font-size: 16px;
          letter-spacing: -0.4px;
        }

        .brand-text small {
          margin-top: 4px;
          color: #8491a3;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .nav-link {
          padding: 9px 12px;
          border-radius: 9px;
          text-decoration: none;
          color: #53647b;
          font-size: 13px;
          font-weight: 700;
        }

        .nav-link:hover {
          background: #f0f5fb;
          color: #075fd5;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .main-content {
          width: min(
            1240px,
            calc(100% - 36px)
          );
          margin: 0 auto;
          padding: 34px 0 70px;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero-section {
          position: relative;
          overflow: hidden;
          min-height: 260px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          padding: 40px;
          border-radius: 28px;
          background:
            radial-gradient(
              circle at 85% 15%,
              rgba(
                93,
                170,
                255,
                0.28
              ),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #062e68,
              #075ed5 58%,
              #1385ec
            );
          box-shadow:
            0 25px 60px
              rgba(
                13,
                75,
                151,
                0.18
              );
        }

        .hero-section::after {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          right: -100px;
          top: -130px;
          border: 1px solid
            rgba(255, 255, 255, 0.12);
          border-radius: 50%;
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          max-width: 780px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 13px;
          color: #cfe6ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #70c3ff;
          box-shadow:
            0 0 0 5px
              rgba(
                112,
                195,
                255,
                0.12
              );
        }

        .hero-section h1 {
          margin: 0;
          color: white;
          font-size: clamp(
            28px,
            4vw,
            43px
          );
          line-height: 1.08;
          letter-spacing: -1.6px;
        }

        .hero-section h1 span {
          color: #9ed5ff;
        }

        .hero-section p {
          max-width: 690px;
          margin: 15px 0 18px;
          color: #d7e9fb;
          font-size: 14px;
          line-height: 1.65;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .hero-meta span {
          padding: 7px 10px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
          border-radius: 8px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
          color: #e6f2ff;
          font-size: 11px;
          font-weight: 700;
        }

        .hero-actions {
          position: relative;
          z-index: 2;
          display: flex;
          flex-shrink: 0;
          gap: 9px;
        }

        .hero-primary,
        .hero-secondary {
          min-height: 42px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
        }

        .hero-primary {
          background: white;
          color: #075ed1;
          box-shadow:
            0 8px 20px
              rgba(0, 0, 0, 0.12);
        }

        .hero-secondary {
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.24
            );
          background: rgba(
            255,
            255,
            255,
            0.08
          );
          color: white;
        }

        /* =====================================================
           SUBSCRIPTION
        ===================================================== */

        .subscription-strip {
          margin-top: 18px;
          min-height: 76px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border: 1px solid #dfe8f3;
          border-radius: 17px;
          background: white;
          box-shadow:
            0 8px 25px
              rgba(
                18,
                48,
                84,
                0.05
              );
        }

        .subscription-left,
        .subscription-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .subscription-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #edf5ff;
          color: #0869e8;
          font-size: 20px;
        }

        .subscription-left div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .subscription-label {
          color: #8390a1;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .subscription-left strong {
          font-size: 14px;
          color: #173252;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .status-pill.active {
          background: #eaf9f0;
          color: #18834b;
        }

        .status-pill.inactive {
          background: #fff3e8;
          color: #b86614;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .upgrade-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0869e8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 18px;
        }

        .stat-card {
          min-height: 104px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          border: 1px solid #e1e9f3;
          border-radius: 17px;
          background: white;
          box-shadow:
            0 7px 22px
              rgba(
                18,
                48,
                84,
                0.045
              );
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 900;
        }

        .stat-icon.blue {
          background: #eaf3ff;
          color: #0869e8;
        }

        .stat-icon.purple {
          background: #f2edff;
          color: #7650db;
        }

        .stat-icon.green {
          background: #eaf9f0;
          color: #16844b;
        }

        .stat-icon.orange {
          background: #fff3e7;
          color: #c76b16;
        }

        .stat-card div:last-child {
          display: flex;
          flex-direction: column;
        }

        .stat-card span {
          color: #7b899b;
          font-size: 11px;
          font-weight: 700;
        }

        .stat-card strong {
          margin-top: 4px;
          color: #112b4b;
          font-size: 25px;
          letter-spacing: -0.8px;
        }

        /* =====================================================
           PREMIUM BANNER
        ===================================================== */

        .premium-banner {
          margin-top: 18px;
          min-height: 88px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid #d8e6f8;
          border-radius: 17px;
          background:
            linear-gradient(
              100deg,
              #f7fbff,
              #edf6ff
            );
        }

        .premium-symbol {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #0a68dd;
          color: white;
          font-size: 20px;
          box-shadow:
            0 8px 20px
              rgba(
                10,
                104,
                221,
                0.18
              );
        }

        .premium-copy {
          flex: 1;
        }

        .premium-title {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #14375f;
          font-size: 13px;
          font-weight: 900;
        }

        .premium-title span {
          padding: 3px 6px;
          border-radius: 5px;
          background: #dbeaff;
          color: #0867dc;
          font-size: 8px;
          letter-spacing: 0.5px;
        }

        .premium-copy p {
          margin: 5px 0 0;
          color: #718197;
          font-size: 11px;
          line-height: 1.5;
        }

        .premium-score {
          padding-left: 18px;
          border-left: 1px solid #d9e5f2;
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .premium-score strong {
          color: #0969df;
          font-size: 14px;
        }

        .premium-score span {
          margin-top: 4px;
          color: #8a98aa;
          font-size: 9px;
          white-space: nowrap;
        }

        /* =====================================================
           TOOLBAR
        ===================================================== */

        .toolbar {
          margin-top: 32px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
        }

        .toolbar-heading h2 {
          margin: 0;
          color: #102c4c;
          font-size: 22px;
          letter-spacing: -0.6px;
        }

        .toolbar-heading p {
          margin: 5px 0 0;
          color: #8491a2;
          font-size: 11px;
        }

        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-box {
          width: 230px;
          height: 40px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 11px;
          border: 1px solid #dce5ef;
          border-radius: 9px;
          background: white;
        }

        .search-box span {
          color: #8a98aa;
          font-size: 18px;
        }

        .search-box input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #183453;
          font-size: 12px;
        }

        .search-box input::placeholder {
          color: #a1adbb;
        }

        .filter-select {
          height: 40px;
          padding: 0 30px 0 10px;
          border: 1px solid #dce5ef;
          border-radius: 9px;
          outline: 0;
          background: white;
          color: #304760;
          font-size: 11px;
          font-weight: 700;
        }

        /* =====================================================
           APPLICANT LIST
        ===================================================== */

        .applicants-section {
          margin-top: 15px;
        }

        .applicant-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .applicant-card {
          overflow: hidden;
          border: 1px solid #dfe7f1;
          border-radius: 19px;
          background: white;
          box-shadow:
            0 9px 28px
              rgba(
                18,
                48,
                84,
                0.055
              );
        }

        .candidate-top {
          padding: 21px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          border-bottom: 1px solid #edf1f6;
        }

        .candidate-identity {
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .avatar {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #e8f2ff,
              #d7e9ff
            );
          color: #0865d9;
          font-size: 14px;
          font-weight: 900;
        }

        .candidate-info {
          min-width: 0;
        }

        .candidate-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .candidate-name-row h3 {
          margin: 0;
          color: #122e4f;
          font-size: 16px;
          letter-spacing: -0.3px;
        }

        .candidate-email {
          margin: 4px 0 8px;
          color: #75859a;
          font-size: 11px;
        }

        .candidate-details {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .candidate-details span {
          padding: 5px 7px;
          border-radius: 6px;
          background: #f5f8fb;
          color: #697b91;
          font-size: 9px;
          font-weight: 700;
        }

        .status-badge {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .status-badge.applied {
          background: #edf4ff;
          color: #216bc8;
        }

        .status-badge.reviewed {
          background: #f1efff;
          color: #6651c9;
        }

        .status-badge.shortlisted {
          background: #eaf9f0;
          color: #16834b;
        }

        .status-badge.rejected {
          background: #fff0f0;
          color: #c53939;
        }

        .status-badge.hired {
          background: #e6f8f8;
          color: #087d80;
        }

        .match-box {
          min-width: 92px;
          padding: 11px 13px;
          flex: 0 0 auto;
          text-align: center;
          border-radius: 13px;
        }

        .match-box span,
        .match-box small {
          display: block;
        }

        .match-box span {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .match-box strong {
          display: block;
          margin: 1px 0;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .match-box small {
          font-size: 9px;
          font-weight: 900;
        }

        .match-box.strong {
          background: #eaf9f0;
          color: #16834b;
        }

        .match-box.good {
          background: #eef7ed;
          color: #4f7e30;
        }

        .match-box.possible {
          background: #fff5e9;
          color: #bd7019;
        }

        .match-box.weak {
          background: #f1f4f7;
          color: #718095;
        }

        /* =====================================================
           CANDIDATE GRID
        ===================================================== */

        .candidate-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          border-bottom: 1px solid #edf1f6;
        }

        .candidate-field {
          min-width: 0;
          padding: 17px 20px;
          border-right: 1px solid #edf1f6;
        }

        .candidate-field:last-child {
          border-right: 0;
        }

        .candidate-field span {
          display: block;
          margin-bottom: 6px;
          color: #8b98a9;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.55px;
        }

        .candidate-field strong {
          display: block;
          overflow: hidden;
          color: #304760;
          font-size: 11px;
          line-height: 1.5;
          font-weight: 750;
          text-overflow: ellipsis;
        }

        .candidate-field em {
          display: inline-block;
          margin-top: 5px;
          color: #16834b;
          font-size: 9px;
          font-style: normal;
          font-weight: 800;
        }

        /* =====================================================
           MATCH BREAKDOWN
        ===================================================== */

        .match-breakdown {
          padding: 14px 20px;
          background: #fbfcfe;
          border-bottom: 1px solid #edf1f6;
        }

        .breakdown-title {
          margin-bottom: 8px;
          color: #718198;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.55px;
        }

        .breakdown-items {
          display: flex;
          gap: 25px;
          margin-bottom: 9px;
        }

        .breakdown-items div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .breakdown-items span {
          color: #8491a2;
          font-size: 9px;
        }

        .breakdown-items strong {
          color: #2c4663;
          font-size: 9px;
        }

        .progress-track {
          width: 100%;
          height: 5px;
          overflow: hidden;
          border-radius: 99px;
          background: #e6edf5;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width 0.35s ease;
        }

        .progress-fill.strong {
          background: #1e9b5c;
        }

        .progress-fill.good {
          background: #5e9b3d;
        }

        .progress-fill.possible {
          background: #d78624;
        }

        .progress-fill.weak {
          background: #8a98a9;
        }

        /* =====================================================
           DOCUMENT BUTTONS
        ===================================================== */

        .document-row {
          padding: 15px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          border-bottom: 1px solid #edf1f6;
        }

        .document-button {
          min-height: 39px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dbe4ee;
          border-radius: 9px;
          background: white;
          color: #36506c;
          text-decoration: none;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            transform 0.15s ease;
        }

        .document-button:hover {
          border-color: #a9c7e8;
          background: #f5faff;
        }

        .document-button:active {
          transform: translateY(1px);
        }

        .primary-document {
          border-color: #cfe0f4;
          background: #f2f7fd;
          color: #075fd2;
        }

        .document-icon {
          font-size: 13px;
        }

        /* =====================================================
           ACTIONS
        ===================================================== */

        .candidate-actions {
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .action-label {
          color: #8795a7;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .shortlist-button,
        .reject-button,
        .reset-button {
          min-height: 34px;
          padding: 0 11px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .shortlist-button {
          border: 1px solid #bde4cc;
          background: #effbf3;
          color: #17834b;
        }

        .reject-button {
          border: 1px solid #f1c8c8;
          background: #fff5f5;
          color: #c43a3a;
        }

        .reset-button {
          border: 1px solid #dbe3ed;
          background: white;
          color: #687a90;
        }

        /* =====================================================
           CARD FOOTER
        ===================================================== */

        .application-footer {
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: #fafbfd;
          color: #a0aab8;
          font-size: 9px;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .empty-state {
          padding: 70px 25px;
          text-align: center;
          border: 1px solid #dfe7f1;
          border-radius: 19px;
          background: white;
        }

        .empty-icon {
          width: 62px;
          height: 62px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: #edf4fc;
          font-size: 25px;
        }

        .empty-state h3 {
          margin: 0 0 7px;
          color: #183454;
          font-size: 18px;
        }

        .empty-state p {
          margin: 0 0 17px;
          color: #8491a2;
          font-size: 12px;
        }

        .clear-button {
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid #d5e1ef;
          border-radius: 9px;
          background: white;
          color: #0869e8;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .page-footer {
          width: min(
            1240px,
            calc(100% - 36px)
          );
          margin: 0 auto;
          padding: 22px 0 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #8a97a8;
          font-size: 10px;
        }

        .page-footer div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-footer strong {
          color: #48617c;
          font-size: 11px;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 950px) {

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .toolbar-controls {
            width: 100%;
          }

          .search-box {
            flex: 1;
            width: auto;
          }

        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .topbar-inner {
            width: min(
              100% - 24px,
              1240px
            );
            min-height: 64px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
            border-radius: 11px;
          }

          .brand-text small {
            display: none;
          }

          .top-actions {
            gap: 2px;
          }

          .nav-link {
            padding: 7px;
            font-size: 10px;
          }

          .main-content {
            width: min(
              100% - 24px,
              1240px
            );
            padding-top: 18px;
          }

          .hero-section {
            min-height: auto;
            padding: 26px 20px;
            flex-direction: column;
            align-items: stretch;
            border-radius: 21px;
          }

          .hero-section h1 {
            font-size: 29px;
            letter-spacing: -1px;
          }

          .hero-section p {
            font-size: 12px;
          }

          .hero-actions {
            width: 100%;
          }

          .hero-primary,
          .hero-secondary {
            flex: 1;
          }

          .subscription-strip {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px;
          }

          .subscription-right {
            width: 100%;
            justify-content: space-between;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
            gap: 9px;
          }

          .stat-card {
            min-height: 90px;
            padding: 13px;
            gap: 9px;
          }

          .stat-icon {
            width: 37px;
            height: 37px;
            flex-basis: 37px;
            font-size: 15px;
          }

          .stat-card span {
            font-size: 9px;
          }

          .stat-card strong {
            font-size: 21px;
          }

          .premium-banner {
            align-items: flex-start;
            padding: 15px;
          }

          .premium-symbol {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
          }

          .premium-score {
            display: none;
          }

          .toolbar-controls {
            align-items: stretch;
            flex-wrap: wrap;
          }

          .search-box {
            flex-basis: 100%;
          }

          .filter-select {
            flex: 1;
            min-width: 0;
          }

          .candidate-top {
            padding: 16px;
            flex-direction: column;
          }

          .candidate-identity {
            width: 100%;
          }

          .match-box {
            width: 100%;
            min-width: 0;
            display: grid;
            grid-template-columns:
              auto auto auto;
            align-items: center;
            justify-content: space-between;
            text-align: left;
          }

          .match-box span,
          .match-box small {
            display: block;
          }

          .match-box strong {
            margin: 0;
            font-size: 20px;
          }

          .candidate-grid {
            grid-template-columns: 1fr;
          }

          .candidate-field {
            padding: 13px 16px;
            border-right: 0;
            border-bottom: 1px solid #edf1f6;
          }

          .candidate-field:last-child {
            border-bottom: 0;
          }

          .match-breakdown {
            padding: 13px 16px;
          }

          .breakdown-items {
            justify-content: space-between;
            gap: 8px;
          }

          .document-row {
            padding: 13px 16px;
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .document-button {
            width: 100%;
            padding: 0 8px;
            font-size: 9px;
          }

          .primary-document {
            grid-column: 1 / -1;
          }

          .candidate-actions {
            padding: 13px 16px;
            align-items: flex-start;
            flex-direction: column;
          }

          .status-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .shortlist-button,
          .reject-button,
          .reset-button {
            flex: 1;
          }

          .application-footer {
            padding: 9px 16px;
          }

          .page-footer {
            width: min(
              100% - 24px,
              1240px
            );
            align-items: flex-start;
            flex-direction: column;
          }
        }

        /* =====================================================
           SMALL PHONE
        ===================================================== */

        @media (max-width: 420px) {

          .top-actions .nav-link:nth-child(3) {
            display: none;
          }

          .hero-meta {
            display: grid;
            grid-template-columns: 1fr;
          }

          .hero-meta span {
            width: 100%;
          }

          .stats-grid {
            gap: 7px;
          }

          .stat-card {
            padding: 11px;
          }

          .stat-card strong {
            font-size: 19px;
          }

          .document-row {
            grid-template-columns: 1fr;
          }

          .primary-document {
            grid-column: auto;
          }

          .status-actions {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .reset-button {
            grid-column: 1 / -1;
          }

          .candidate-name-row h3 {
            font-size: 15px;
          }
        }

      `}</style>
    </>
  );
}