"use client";

import { useEffect, useState } from "react";
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

  if (text.includes("honours") || text.includes("honors")) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor") ||
    text.includes("bsc") ||
    text.includes("ba ") ||
    text.includes("bcom") ||
    text.includes("bed")
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
    text.includes("n4") ||
    text.includes("n5") ||
    text.includes("n6")
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
// TEXT NORMALIZATION
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SKILLS
// ============================================================

function parseSkills(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return String(value)
    .split(/[,;\n|]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

// ============================================================
// QUALIFICATION MATCH
// ============================================================

function qualificationMatches(
  applicantQualification,
  requiredQualification
) {
  const applicantLevel =
    getQualificationLevel(applicantQualification);

  const requiredLevel =
    getQualificationLevel(requiredQualification);

  if (!requiredQualification) {
    return true;
  }

  if (!applicantQualification) {
    return false;
  }

  if (requiredLevel === 0) {
    return normalizeText(
      applicantQualification
    ).includes(
      normalizeText(requiredQualification)
    );
  }

  return applicantLevel >= requiredLevel;
}

// ============================================================
// MATCH CALCULATION
// ============================================================

function calculateMatch(application, internship) {
  const applicantQualification =
    application?.qualification || "";

  const requiredQualification =
    internship?.qualification || "";

  const applicantField =
    normalizeText(application?.field_of_study);

  const requiredField =
    normalizeText(internship?.field_of_study);

  const applicantSkills =
    parseSkills(application?.skills);

  const requiredSkills =
    parseSkills(internship?.skills);

  // ----------------------------------------------------------
  // Qualification - 35%
  // ----------------------------------------------------------

  const qualificationMatch =
    qualificationMatches(
      applicantQualification,
      requiredQualification
    );

  const qualificationScore =
    qualificationMatch ? 35 : 0;

  // ----------------------------------------------------------
  // Field of study - 35%
  // ----------------------------------------------------------

  let fieldScore = 0;

  if (!requiredField) {
    fieldScore = 35;
  } else if (!applicantField) {
    fieldScore = 0;
  } else if (
    applicantField === requiredField
  ) {
    fieldScore = 35;
  } else if (
    applicantField.includes(requiredField) ||
    requiredField.includes(applicantField)
  ) {
    fieldScore = 28;
  } else {
    const requiredWords =
      requiredField.split(" ");

    const applicantWords =
      applicantField.split(" ");

    const overlap =
      requiredWords.filter((word) =>
        word.length > 2 &&
        applicantWords.includes(word)
      );

    if (overlap.length > 0) {
      fieldScore = 20;
    }
  }

  // ----------------------------------------------------------
  // Skills - 30%
  // ----------------------------------------------------------

  let skillsScore = 0;
  const matchedSkills = [];
  const missingSkills = [];

  if (requiredSkills.length === 0) {
    skillsScore = 30;
  } else {
    requiredSkills.forEach((requiredSkill) => {
      const matched =
        applicantSkills.some(
          (applicantSkill) =>
            applicantSkill === requiredSkill ||
            applicantSkill.includes(requiredSkill) ||
            requiredSkill.includes(applicantSkill)
        );

      if (matched) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    });

    skillsScore =
      Math.round(
        (matchedSkills.length /
          requiredSkills.length) *
          30
      );
  }

  // ----------------------------------------------------------
  // Total
  // ----------------------------------------------------------

  const score = Math.min(
    100,
    Math.round(
      qualificationScore +
        fieldScore +
        skillsScore
    )
  );

  let label = "Weak";

  if (score >= 85) {
    label = "Strong";
  } else if (score >= 70) {
    label = "Good";
  } else if (score >= 40) {
    label = "Possible";
  }

  // ----------------------------------------------------------
  // Strengths
  // ----------------------------------------------------------

  const strengths = [];
  const improvements = [];

  if (qualificationMatch) {
    strengths.push(
      "Meets or exceeds the required qualification."
    );
  } else {
    improvements.push(
      "Does not meet the minimum qualification requirement."
    );
  }

  if (fieldScore >= 28) {
    strengths.push(
      "Strong field-of-study alignment."
    );
  } else if (fieldScore >= 20) {
    strengths.push(
      "Some field-of-study alignment."
    );
  } else {
    improvements.push(
      "Field of study has limited alignment with the internship."
    );
  }

  if (matchedSkills.length > 0) {
    strengths.push(
      `Matches ${matchedSkills.length} required skill${
        matchedSkills.length === 1 ? "" : "s"
      }.`
    );
  }

  if (missingSkills.length > 0) {
    improvements.push(
      `Missing ${missingSkills.length} required skill${
        missingSkills.length === 1 ? "" : "s"
      }.`
    );
  }

  let summary =
    "The applicant has limited alignment with this internship.";

  if (score >= 85) {
    summary =
      "The applicant shows strong overall alignment with this internship.";
  } else if (score >= 70) {
    summary =
      "The applicant shows good overall alignment with this internship.";
  } else if (score >= 40) {
    summary =
      "The applicant shows some relevant alignment with this internship.";
  }

  return {
    score,
    label,
    qualificationScore,
    fieldScore,
    skillsScore,
    qualificationMatch,
    matchedSkills,
    missingSkills,
    strengths,
    improvements,
    summary,
  };
}

// ============================================================
// STORAGE PATH
// ============================================================

function getStoragePath(value) {
  if (!value) return null;

  let path = String(value).trim();

  if (!path) return null;

  // Full Supabase storage URL
  if (path.includes("/storage/v1/object/")) {
    const marker =
      "/storage/v1/object/";

    path =
      path.split(marker)[1] || "";

    path = path
      .replace(/^sign\/documents\//, "")
      .replace(/^public\/documents\//, "")
      .replace(/^authenticated\/documents\//, "")
      .replace(/^documents\//, "");
  }

  // Another possible full URL format
  if (path.includes("/documents/")) {
    path =
      path.split("/documents/")[1] || path;
  }

  // Remove leading slash
  path = path.replace(/^\/+/, "");

  // Remove bucket name if it is still present
  path = path.replace(/^documents\//, "");

  return path || null;
}

// ============================================================
// FIND CV
// ============================================================

function findCV(application) {
  if (!application) return null;

  return (
    application.cv_url ||
    application.cv ||
    application.resume_url ||
    application.resume ||
    application.document_url ||
    application.cvUrl ||
    application.resumeUrl ||
    null
  );
}

// ============================================================
// FIND QUALIFICATION DOCUMENT
// ============================================================

function findQualificationDocument(application) {
  if (!application) return null;

  return (
    application.qualification_url ||
    application.qualification_document_url ||
    application.qualification_document ||
    application.qualification_file ||
    application.qualificationUrl ||
    application.certificate_url ||
    application.certificate ||
    application.academic_record_url ||
    application.academic_record ||
    null
  );
}

// ============================================================
// OPEN SUPABASE DOCUMENT
// ============================================================

async function openStorageDocument(
  value,
  documentName
) {
  if (!value) {
    alert(
      `This applicant has not uploaded a ${documentName}.`
    );
    return;
  }

  const cleanPath =
    getStoragePath(value);

  if (!cleanPath) {
    alert(
      `The ${documentName} file path could not be found.`
    );
    return;
  }

  try {
    console.log(
      `${documentName} storage path:`,
      cleanPath
    );

    const {
      data,
      error,
    } = await supabase.storage
      .from("documents")
      .createSignedUrl(
        cleanPath,
        600
      );

    if (error) {
      console.error(
        "Supabase signed URL error:",
        error
      );

      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error(
        `Could not create a secure link for this ${documentName}.`
      );
    }

    console.log(
      `${documentName} signed URL created successfully`
    );

    // Safari/iPhone friendly:
    // navigate directly to the signed file.
    window.location.href =
      data.signedUrl;

  } catch (error) {
    console.error(
      `${documentName} opening error:`,
      error
    );

    alert(
      error?.message ||
        `Could not open the ${documentName}.`
    );
  }
}

// ============================================================
// PAGE
// ============================================================

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId =
    params?.id;

  const [
    internship,
    setInternship,
  ] = useState(null);

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    company,
    setCompany,
  ] = useState(null);

  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    premiumLoading,
    setPremiumLoading,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  // ==========================================================
  // LOAD PAGE
  // ==========================================================

  useEffect(() => {
    if (!internshipId) return;

    let cancelled = false;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage("");

        // ------------------------------------------------------
        // AUTH
        // ------------------------------------------------------

        const {
          data: {
            user,
          },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // ------------------------------------------------------
        // COMPANY
        // ------------------------------------------------------

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!companyData) {
          throw new Error(
            "Company profile could not be found."
          );
        }

        if (cancelled) return;

        setCompany(companyData);

        // ------------------------------------------------------
        // SUBSCRIPTION
        // ------------------------------------------------------

        const {
          data: subscriptionData,
          error: subscriptionError,
        } = await supabase
          .from("subscriptions")
          .select("*")
          .eq(
            "company_id",
            companyData.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (
          subscriptionError &&
          subscriptionError.code !== "PGRST116"
        ) {
          console.error(
            "Subscription error:",
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
            "Internship could not be found."
          );
        }

        // Security check:
        // Make sure this internship belongs
        // to the logged-in company.
        if (
          internshipData.company_name !==
          companyData.company_name
        ) {
          throw new Error(
            "You do not have permission to view these applicants."
          );
        }

        if (cancelled) return;

        setInternship(
          internshipData
        );

        // ------------------------------------------------------
        // APPLICATIONS
        // ------------------------------------------------------

        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select("*")
          .eq(
            "internship_id",
            internshipId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (applicationError) {
          throw applicationError;
        }

        const rawApplications =
          applicationData || [];

        // ------------------------------------------------------
        // LOAD GRADUATE PROFILES
        // ------------------------------------------------------

        const graduateIds =
          [
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
            .in(
              "user_id",
              graduateIds
            );

          if (graduateError) {
            console.error(
              "Graduate profile error:",
              graduateError
            );
          } else {
            graduates =
              graduateData || [];
          }
        }

        // ------------------------------------------------------
        // MERGE APPLICATION + PROFILE
        // ------------------------------------------------------

        const mergedApplications =
          rawApplications.map(
            (application) => {
              const graduate =
                graduates.find(
                  (item) =>
                    item.user_id ===
                    application.graduate_id
                );

              const merged = {
                ...graduate,
                ...application,
              };

              // Keep document paths from either
              // the application or graduate profile.
              if (
                !merged.cv_url &&
                graduate?.cv_url
              ) {
                merged.cv_url =
                  graduate.cv_url;
              }

              if (
                !merged.qualification_url &&
                graduate?.qualification_url
              ) {
                merged.qualification_url =
                  graduate.qualification_url;
              }

              const match =
                calculateMatch(
                  merged,
                  internshipData
                );

              return {
                ...merged,
                matchScore:
                  match.score,
                matchLabel:
                  match.label,
                matchDetails:
                  match,
              };
            }
          );

        // Highest match first
        mergedApplications.sort(
          (a, b) =>
            (b.matchScore || 0) -
            (a.matchScore || 0)
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
          setPremiumLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [
    internshipId,
    router,
  ]);

  // ==========================================================
  // PREMIUM STATUS
  // ==========================================================

  const isPremium =
    subscription?.status ===
      "active" ||
    subscription?.status ===
      "trialing"
      ? [
          "premium",
          "pro",
          "professional",
        ].includes(
          String(
            subscription?.plan || ""
          ).toLowerCase()
        )
      : false;

  // ==========================================================
  // UPDATE APPLICATION STATUS
  // ==========================================================

  async function updateStatus(
    applicationId,
    status
  ) {
    try {
      const {
        error,
      } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq(
          "id",
          applicationId
        );

      if (error) {
        throw error;
      }

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              applicationId
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
    }
  }

  // ==========================================================
  // REVIEW CV
  // ==========================================================

  async function reviewCV(
    application
  ) {
    const cv =
      findCV(application);

    await openStorageDocument(
      cv,
      "CV"
    );
  }

  // ==========================================================
  // VIEW QUALIFICATION
  // ==========================================================

  async function viewQualification(
    application
  ) {
    const qualification =
      findQualificationDocument(
        application
      );

    await openStorageDocument(
      qualification,
      "qualification document"
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "#f4f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(15, 23, 42, 0.08)",
            width: "100%",
            maxWidth: 420,
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 14,
            }}
          >
            👥
          </div>

          <h2
            style={{
              margin: 0,
              color: "#102a43",
              fontSize: 22,
            }}
          >
            Loading applicants
          </h2>

          <p
            style={{
              margin:
                "10px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Please wait while we load the
            applications for this internship.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "#f4f7fb",
          padding: 20,
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin:
              "60px auto",
            background: "#ffffff",
            borderRadius: 22,
            padding: 30,
            boxShadow:
              "0 10px 30px rgba(15, 23, 42, 0.08)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              margin:
                "0 0 10px",
              color: "#102a43",
            }}
          >
            Could not load applicants
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {errorMessage}
          </p>

          <Link
            href="/company-dashboard"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              minHeight: 46,
              padding:
                "0 20px",
              borderRadius: 10,
              background:
                "#174ea6",
              color: "#ffffff",
              textDecoration:
                "none",
              fontWeight: 700,
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const totalApplicants =
    applications.length;

  const shortlisted =
    applications.filter(
      (application) =>
        String(
          application.status || ""
        ).toLowerCase() ===
        "shortlisted"
    ).length;

  const rejected =
    applications.filter(
      (application) =>
        String(
          application.status || ""
        ).toLowerCase() ===
        "rejected"
    ).length;

  const pending =
    totalApplicants -
    shortlisted -
    rejected;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "#f4f7fb",
        fontFamily:
          "Arial, sans-serif",
        color: "#102a43",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          background:
            "#ffffff",
          borderBottom:
            "1px solid #e5eaf0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding:
              "18px 20px",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: 16,
            flexWrap:
              "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing:
                  "1.5px",
                color: "#174ea6",
                marginBottom: 5,
              }}
            >
              GRADLINK SA
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(22px, 5vw, 32px)",
                lineHeight: 1.15,
              }}
            >
              Internship Applicants
            </h1>
          </div>

          <Link
            href="/company-dashboard"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              minHeight: 44,
              padding:
                "0 17px",
              border:
                "1px solid #d7e0eb",
              borderRadius: 10,
              background:
                "#ffffff",
              color: "#174ea6",
              textDecoration:
                "none",
              fontWeight: 700,
              boxShadow:
                "0 2px 6px rgba(15, 23, 42, 0.04)",
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding:
            "24px 20px 60px",
        }}
      >
        {/* ====================================================
            INTERNSHIP TITLE
        ==================================================== */}

        <section
          style={{
            background:
              "linear-gradient(135deg, #174ea6 0%, #0d3b7d 100%)",
            borderRadius: 22,
            padding:
              "28px 24px",
            color: "#ffffff",
            marginBottom: 20,
            boxShadow:
              "0 12px 30px rgba(23, 78, 166, 0.18)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing:
                "1.2px",
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            APPLICATIONS FOR
          </div>

          <h2
            style={{
              margin: 0,
              fontSize:
                "clamp(24px, 5vw, 34px)",
              lineHeight: 1.15,
            }}
          >
            {internship?.job_title ||
              "Internship"}
          </h2>

          <p
            style={{
              margin:
                "10px 0 0",
              opacity: 0.9,
              fontSize: 15,
            }}
          >
            {company?.company_name ||
              internship?.company_name ||
              "Company"}
          </p>
        </section>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard
            icon="👥"
            title="Applicants"
            value={
              totalApplicants
            }
          />

          <SummaryCard
            icon="⏳"
            title="Pending"
            value={pending}
          />

          <SummaryCard
            icon="⭐"
            title="Shortlisted"
            value={shortlisted}
          />

          <SummaryCard
            icon="✕"
            title="Rejected"
            value={rejected}
          />
        </section>

        {/* ====================================================
            INTERNSHIP DETAILS
        ==================================================== */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e4eaf1",
            borderRadius: 20,
            padding: 22,
            marginBottom: 24,
            boxShadow:
              "0 5px 18px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h3
            style={{
              margin:
                "0 0 18px",
              fontSize: 20,
            }}
          >
            Internship Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <Detail
              label="Location"
              value={
                internship?.location
              }
            />

            <Detail
              label="Province"
              value={
                internship?.province
              }
            />

            <Detail
              label="Type"
              value={
                internship?.internship_type
              }
            />

            <Detail
              label="Stipend"
              value={
                internship?.stipend
              }
            />

            <Detail
              label="Qualification"
              value={
                internship?.qualification
              }
            />

            <Detail
              label="Field of Study"
              value={
                internship?.field_of_study
              }
            />

            <Detail
              label="Deadline"
              value={
                internship?.deadline
              }
            />
          </div>
        </section>

        {/* ====================================================
            PREMIUM
        ==================================================== */}

        <PremiumFeature
          isPremium={isPremium}
          premiumLoading={
            premiumLoading
          }
          onUpgrade={() =>
            router.push(
              "/company/subscription"
            )
          }
        />

        {/* ====================================================
            APPLICANTS
        ==================================================== */}

        <section>
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                }}
              >
                Applicants
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#64748b",
                }}
              >
                Review candidates who applied
                directly to this internship.
              </p>
            </div>
          </div>

          {applications.length ===
          0 ? (
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e4eaf1",
                borderRadius: 20,
                padding: 40,
                textAlign:
                  "center",
                boxShadow:
                  "0 5px 18px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 46,
                  marginBottom: 12,
                }}
              >
                📭
              </div>

              <h3
                style={{
                  margin:
                    "0 0 8px",
                }}
              >
                No applications yet
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                Applications for this internship
                will appear here when graduates
                apply.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 18,
              }}
            >
              {applications.map(
                (
                  application,
                  index
                ) => (
                  <ApplicantCard
                    key={
                      application.id
                    }
                    application={
                      application
                    }
                    index={index}
                    internshipId={
                      internshipId
                    }
                    onStatusChange={
                      updateStatus
                    }
                    onReviewCV={
                      reviewCV
                    }
                    onViewQualification={
                      viewQualification
                    }
                    isPremium={
                      isPremium
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ============================================================
// APPLICANT CARD
// ============================================================

function ApplicantCard({
  application,
  index,
  internshipId,
  onStatusChange,
  onReviewCV,
  onViewQualification,
  isPremium,
}) {
  const matchDetails =
    application?.matchDetails || {};

  const score =
    application?.matchScore ?? 0;

  const matchLabel =
    application?.matchLabel ||
    "Weak";

  const status =
    String(
      application?.status || "pending"
    ).toLowerCase();

  const cv =
    findCV(application);

  const qualification =
    findQualificationDocument(
      application
    );

  const hasCV =
    Boolean(cv);

  const hasQualification =
    Boolean(qualification);

  const fullName =
    application?.full_name ||
    application?.name ||
    "Graduate Applicant";

  const email =
    application?.email ||
    "No email provided";

  const phone =
    application?.phone ||
    "No phone provided";

  const qualificationText =
    application?.qualification ||
    "Not provided";

  const fieldOfStudy =
    application?.field_of_study ||
    "Not provided";

  const skills =
    parseSkills(
      application?.skills
    );

  const statusConfig =
    getStatusConfig(status);

  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow:
          "0 7px 22px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* ======================================================
          CARD HEADER
      ====================================================== */}

      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom:
            "1px solid #edf1f5",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #174ea6, #3978cf)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {getInitials(fullName)}
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 800,
                  letterSpacing:
                    "0.8px",
                  marginBottom: 4,
                }}
              >
                APPLICANT #{index + 1}
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#102a43",
                  fontSize: 21,
                  lineHeight: 1.2,
                  overflowWrap:
                    "anywhere",
                }}
              >
                {fullName}
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#64748b",
                  fontSize: 14,
                  overflowWrap:
                    "anywhere",
                }}
              >
                {email}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent:
                  "flex-end",
              }}
            >
              <span
                style={{
                  padding:
                    "6px 10px",
                  borderRadius: 999,
                  background:
                    statusConfig.background,
                  color:
                    statusConfig.color,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform:
                    "capitalize",
                }}
              >
                {status}
              </span>

              <span
                style={{
                  padding:
                    "6px 10px",
                  borderRadius: 999,
                  background:
                    getMatchBackground(
                      score
                    ),
                  color:
                    getMatchColor(
                      score
                    ),
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {matchLabel}
              </span>
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color:
                  getMatchColor(
                    score
                  ),
                lineHeight: 1,
              }}
            >
              {score}%
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              AI Match
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          APPLICANT INFORMATION
      ====================================================== */}

      <div
        style={{
          padding: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <InfoBox
            label="Phone"
            value={phone}
            icon="📱"
          />

          <InfoBox
            label="Qualification"
            value={
              qualificationText
            }
            icon="🎓"
          />

          <InfoBox
            label="Field of Study"
            value={
              fieldOfStudy
            }
            icon="📚"
          />

          <InfoBox
            label="Applied"
            value={
              formatDate(
                application?.created_at
              )
            }
            icon="📅"
          />
        </div>

        {/* ====================================================
            SKILLS
        ==================================================== */}

        <div
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.6px",
              marginBottom: 9,
            }}
          >
            Skills
          </div>

          {skills.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
              }}
            >
              {skills.map(
                (
                  skill,
                  skillIndex
                ) => (
                  <span
                    key={`${skill}-${skillIndex}`}
                    style={{
                      background:
                        "#eef5ff",
                      color:
                        "#174ea6",
                      border:
                        "1px solid #d7e7ff",
                      borderRadius:
                        999,
                      padding:
                        "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No skills provided
            </span>
          )}
        </div>

        {/* ====================================================
            AI MATCH ANALYSIS
        ==================================================== */}

        <div
          style={{
            background:
              "#f8fafc",
            border:
              "1px solid #e8edf3",
            borderRadius: 15,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 12,
              marginBottom: 12,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color:
                    "#102a43",
                }}
              >
                🤖 AI Match Analysis
              </div>

              <div
                style={{
                  marginTop: 3,
                  color:
                    "#64748b",
                  fontSize: 12,
                }}
              >
                Based on qualification,
                field and skills
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color:
                  getMatchColor(
                    score
                  ),
              }}
            >
              {score}/100
            </div>
          </div>

          {/* Match bar */}

          <div
            style={{
              height: 8,
              background:
                "#e2e8f0",
              borderRadius: 999,
              overflow:
                "hidden",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    score
                  )
                )}%`,
                height: "100%",
                background:
                  getMatchColor(
                    score
                  ),
                borderRadius:
                  999,
                transition:
                  "width 0.3s ease",
              }}
            />
          </div>

          <p
            style={{
              margin:
                "0 0 14px",
              color:
                "#475569",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {matchDetails.summary ||
              "No match summary available."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <MatchScore
              label="Qualification"
              value={
                matchDetails
                  .qualificationScore ??
                0
              }
              maximum={35}
            />

            <MatchScore
              label="Field of Study"
              value={
                matchDetails
                  .fieldScore ??
                0
              }
              maximum={35}
            />

            <MatchScore
              label="Skills"
              value={
                matchDetails
                  .skillsScore ??
                0
              }
              maximum={30}
            />
          </div>

          {matchDetails
            .matchedSkills
            ?.length > 0 && (
            <div
              style={{
                marginTop: 15,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color:
                    "#15803d",
                  textTransform:
                    "uppercase",
                  marginBottom: 7,
                }}
              >
                Matched Skills
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: 6,
                }}
              >
                {matchDetails.matchedSkills.map(
                  (
                    skill,
                    skillIndex
                  ) => (
                    <span
                      key={`matched-${skill}-${skillIndex}`}
                      style={{
                        padding:
                          "5px 9px",
                        borderRadius:
                          999,
                        background:
                          "#ecfdf3",
                        color:
                          "#15803d",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      ✓ {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {matchDetails
            .missingSkills
            ?.length > 0 && (
            <div
              style={{
                marginTop: 15,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color:
                    "#b45309",
                  textTransform:
                    "uppercase",
                  marginBottom: 7,
                }}
              >
                Skills To Improve
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: 6,
                }}
              >
                {matchDetails.missingSkills.map(
                  (
                    skill,
                    skillIndex
                  ) => (
                    <span
                      key={`missing-${skill}-${skillIndex}`}
                      style={{
                        padding:
                          "5px 9px",
                        borderRadius:
                          999,
                        background:
                          "#fff7ed",
                        color:
                          "#b45309",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            DOCUMENTS
        ==================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {/* --------------------------------------------------
              REVIEW CV
          -------------------------------------------------- */}

          <button
            type="button"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();

              if (!hasCV) {
                alert(
                  "This applicant has not uploaded a CV."
                );
                return;
              }

              await onReviewCV(
                application
              );
            }}
            disabled={!hasCV}
            style={{
              ...actionButton(
                hasCV
                  ? "#174ea6"
                  : "#9aa5b1"
              ),
              cursor: hasCV
                ? "pointer"
                : "not-allowed",
              opacity: hasCV
                ? 1
                : 0.7,
            }}
          >
            📄 Review CV
          </button>

          {/* --------------------------------------------------
              QUALIFICATION
          -------------------------------------------------- */}

          <button
            type="button"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();

              if (
                !hasQualification
              ) {
                alert(
                  "This applicant has not uploaded a qualification document."
                );
                return;
              }

              await onViewQualification(
                application
              );
            }}
            disabled={
              !hasQualification
            }
            style={{
              ...actionButton(
                hasQualification
                  ? "#6b46c1"
                  : "#9aa5b1"
              ),
              cursor:
                hasQualification
                  ? "pointer"
                  : "not-allowed",
              opacity:
                hasQualification
                  ? 1
                  : 0.7,
            }}
          >
            🎓 View Qualification
          </button>

          {/* --------------------------------------------------
              FULL APPLICATION
          -------------------------------------------------- */}

          <Link
            href={`/company/internships/${internshipId}/applicants/${application.id}`}
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              ...actionButton(
                "#0f766e"
              ),
              textDecoration:
                "none",
            }}
          >
            👤 Full Application
          </Link>
        </div>

        {/* ====================================================
            PREMIUM DOCUMENT VERIFICATION
        ==================================================== */}

        <div
          style={{
            marginBottom: 18,
          }}
        >
          {isPremium ? (
            <div
              style={{
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                borderRadius: 13,
                padding: 12,
                display: "flex",
                alignItems:
                  "flex-start",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                }}
              >
                ✨
              </span>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color:
                      "#166534",
                  }}
                >
                  Premium document verification
                </div>

                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color:
                      "#15803d",
                  }}
                >
                  AI document verification can
                  be enabled for this applicant
                  when the verification feature
                  is connected.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius: 13,
                padding: 12,
                display: "flex",
                alignItems:
                  "flex-start",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                }}
              >
                🔒
              </span>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color:
                      "#334155",
                  }}
                >
                  Premium verification
                </div>

                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color:
                      "#64748b",
                  }}
                >
                  Upgrade to access future
                  advanced candidate verification
                  tools.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            STATUS ACTIONS
        ==================================================== */}

        <div
          style={{
            borderTop:
              "1px solid #edf1f5",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color:
                "#94a3b8",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.7px",
              marginBottom: 9,
            }}
          >
            Application Status
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 9,
            }}
          >
            <button
              type="button"
              onClick={() =>
                onStatusChange(
                  application.id,
                  "shortlisted"
                )
              }
              style={{
                ...actionButton(
                  status ===
                    "shortlisted"
                    ? "#15803d"
                    : "#ffffff"
                ),
                color:
                  status ===
                  "shortlisted"
                    ? "#ffffff"
                    : "#15803d",
                border:
                  "1px solid #15803d",
              }}
            >
              ✓ Shortlist
            </button>

            <button
              type="button"
              onClick={() =>
                onStatusChange(
                  application.id,
                  "rejected"
                )
              }
              style={{
                ...actionButton(
                  status ===
                    "rejected"
                    ? "#b91c1c"
                    : "#ffffff"
                ),
                color:
                  status ===
                  "rejected"
                    ? "#ffffff"
                    : "#b91c1c",
                border:
                  "1px solid #b91c1c",
              }}
            >
              ✕ Reject
            </button>

            <button
              type="button"
              onClick={() =>
                onStatusChange(
                  application.id,
                  "pending"
                )
              }
              style={{
                ...actionButton(
                  "#ffffff"
                ),
                color:
                  "#475569",
                border:
                  "1px solid #cbd5e1",
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function SummaryCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #e4eaf1",
        borderRadius: 17,
        padding: 18,
        boxShadow:
          "0 5px 18px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              color:
                "#64748b",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color:
                "#102a43",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background:
              "#eef5ff",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 800,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.6px",
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#334155",
          fontSize: 14,
          lineHeight: 1.5,
          overflowWrap:
            "anywhere",
        }}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background:
          "#f8fafc",
        border:
          "1px solid #e8edf3",
        borderRadius: 13,
        padding: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: 7,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 14,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color:
              "#94a3b8",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.5px",
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          color:
            "#334155",
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.45,
          overflowWrap:
            "anywhere",
        }}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

function MatchScore({
  label,
  value,
  maximum,
}) {
  const percentage =
    maximum > 0
      ? Math.round(
          (value / maximum) *
            100
        )
      : 0;

  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #e2e8f0",
        borderRadius: 11,
        padding: 11,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color:
              "#64748b",
            fontWeight: 700,
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontSize: 11,
            color:
              "#174ea6",
            fontWeight: 800,
          }}
        >
          {value}/{maximum}
        </span>
      </div>

      <div
        style={{
          height: 5,
          background:
            "#e2e8f0",
          borderRadius: 999,
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                percentage
              )
            )}%`,
            height: "100%",
            background:
              "#174ea6",
            borderRadius:
              999,
          }}
        />
      </div>
    </div>
  );
}

function PremiumFeature({
  isPremium,
  premiumLoading,
  onUpgrade,
}) {
  if (premiumLoading) {
    return null;
  }

  if (isPremium) {
    return (
      <section
        style={{
          background:
            "linear-gradient(135deg, #eff6ff, #f5f3ff)",
          border:
            "1px solid #dbe5f5",
          borderRadius: 18,
          padding: 18,
          marginBottom: 24,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: 16,
          flexWrap:
            "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background:
                "#ffffff",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize: 21,
              boxShadow:
                "0 3px 10px rgba(15,23,42,0.05)",
            }}
          >
            ✨
          </div>

          <div>
            <div
              style={{
                fontWeight: 900,
                color:
                  "#102a43",
                fontSize: 15,
              }}
            >
              Premium Company Account
            </div>

            <div
              style={{
                color:
                  "#64748b",
                fontSize: 12,
                marginTop: 3,
              }}
            >
              Advanced applicant tools are
              available for your company.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #102a43, #174ea6)",
        borderRadius: 18,
        padding: 20,
        marginBottom: 24,
        color: "#ffffff",
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        gap: 18,
        flexWrap:
          "wrap",
        boxShadow:
          "0 10px 25px rgba(23,78,166,0.14)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: 13,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background:
              "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          ⭐
        </div>

        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            Upgrade to Premium
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              lineHeight: 1.5,
              opacity: 0.85,
            }}
          >
            Unlock advanced tools for managing
            and evaluating applicants.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onUpgrade}
        style={{
          border: "none",
          background:
            "#ffffff",
          color:
            "#174ea6",
          minHeight: 44,
          padding:
            "0 18px",
          borderRadius: 10,
          fontWeight: 900,
          cursor:
            "pointer",
          whiteSpace:
            "nowrap",
        }}
      >
        Upgrade
      </button>
    </section>
  );
}

// ============================================================
// STATUS CONFIG
// ============================================================

function getStatusConfig(status) {
  if (
    status === "shortlisted"
  ) {
    return {
      background:
        "#ecfdf3",
      color:
        "#15803d",
    };
  }

  if (
    status === "rejected"
  ) {
    return {
      background:
        "#fef2f2",
      color:
        "#b91c1c",
    };
  }

  return {
    background:
      "#fff7ed",
    color:
      "#c2410c",
  };
}

// ============================================================
// MATCH COLORS
// ============================================================

function getMatchColor(score) {
  if (score >= 85) {
    return "#15803d";
  }

  if (score >= 70) {
    return "#2563eb";
  }

  if (score >= 40) {
    return "#c2410c";
  }

  return "#b91c1c";
}

function getMatchBackground(score) {
  if (score >= 85) {
    return "#ecfdf3";
  }

  if (score >= 70) {
    return "#eff6ff";
  }

  if (score >= 40) {
    return "#fff7ed";
  }

  return "#fef2f2";
}

// ============================================================
// BUTTON STYLE
// ============================================================

function actionButton(
  background
) {
  return {
    minHeight: 44,
    width: "100%",
    padding:
      "0 13px",
    borderRadius: 10,
    border:
      background === "#ffffff"
        ? "1px solid #cbd5e1"
        : "none",
    background,
    color:
      background === "#ffffff"
        ? "#334155"
        : "#ffffff",
    fontSize: 13,
    fontWeight: 800,
    display: "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign: "center",
    cursor: "pointer",
    transition:
      "all 0.15s ease",
    boxSizing:
      "border-box",
  };
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {
  const words =
    String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length === 0) {
    return "G";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

// ============================================================
// DATE
// ============================================================

function formatDate(value) {
  if (!value) {
    return "Not provided";
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "Not provided";
  }
}