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

  if (
    text.includes("honours") ||
    text.includes("honors")
  ) {
    return 5;
  }

  if (
    text.includes("degree") ||
    text.includes("bachelor")
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
    text.includes("n6") ||
    text.includes("n5") ||
    text.includes("n4")
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

  if (
    !requiredQualification ||
    requiredLevel === 0
  ) {
    return true;
  }

  if (applicantLevel === 0) {
    return false;
  }

  return applicantLevel >= requiredLevel;
}

// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SKILLS
// ============================================================

function getSkillsArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// ============================================================
// CALCULATE MATCH
// ============================================================

function calculateMatch(application, internship) {
  const applicantQualification =
    application.qualification || "";

  const requiredQualification =
    internship.qualification || "";

  const applicantField =
    normalizeText(application.field_of_study);

  const requiredField =
    normalizeText(internship.field_of_study);

  const applicantSkills =
    getSkillsArray(application.skills);

  const internshipSkills =
    getSkillsArray(internship.skills);

  // ----------------------------------------------------------
  // QUALIFICATION - 35%
  // ----------------------------------------------------------

  let qualificationScore = 0;

  if (!requiredQualification) {
    qualificationScore = 35;
  } else if (
    qualificationMatches(
      applicantQualification,
      requiredQualification
    )
  ) {
    qualificationScore = 35;
  }

  // ----------------------------------------------------------
  // FIELD OF STUDY - 35%
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
    fieldScore = 30;
  } else {
    const applicantWords =
      applicantField.split(" ");

    const requiredWords =
      requiredField.split(" ");

    const overlap =
      applicantWords.filter((word) =>
        requiredWords.includes(word)
      );

    if (overlap.length > 0) {
      fieldScore = 20;
    }
  }

  // ----------------------------------------------------------
  // SKILLS - 30%
  // ----------------------------------------------------------

  let skillsScore = 0;

  const matchedSkills = [];
  const missingSkills = [];

  if (internshipSkills.length === 0) {
    skillsScore = 30;
  } else {
    internshipSkills.forEach(
      (requiredSkill) => {
        const required =
          normalizeText(requiredSkill);

        const found =
          applicantSkills.some((skill) => {
            const applicant =
              normalizeText(skill);

            return (
              applicant === required ||
              applicant.includes(required) ||
              required.includes(applicant)
            );
          });

        if (found) {
          matchedSkills.push(requiredSkill);
        } else {
          missingSkills.push(requiredSkill);
        }
      }
    );

    skillsScore =
      (matchedSkills.length /
        internshipSkills.length) *
      30;
  }

  const totalScore = Math.min(
    100,
    Math.round(
      qualificationScore +
        fieldScore +
        skillsScore
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
  const improvements = [];

  if (qualificationScore === 35) {
    strengths.push(
      "Meets or exceeds the required qualification."
    );
  } else {
    improvements.push(
      "Qualification does not meet the internship requirement."
    );
  }

  if (fieldScore >= 30) {
    strengths.push(
      "Field of study closely matches the internship."
    );
  } else if (fieldScore > 0) {
    strengths.push(
      "Some relevance to the required field of study."
    );
  } else {
    improvements.push(
      "Field of study does not closely match."
    );
  }

  if (matchedSkills.length > 0) {
    strengths.push(
      `Matches ${matchedSkills.length} required skill${
        matchedSkills.length === 1
          ? ""
          : "s"
      }.`
    );
  }

  if (missingSkills.length > 0) {
    improvements.push(
      `Missing ${missingSkills.length} required skill${
        missingSkills.length === 1
          ? ""
          : "s"
      }.`
    );
  }

  return {
    score: totalScore,
    label,
    matchedSkills,
    missingSkills,
    strengths,
    improvements,
  };
}

// ============================================================
// DOCUMENT PATH HELPER
// ============================================================

function getStoragePath(value) {
  if (!value) return null;

  let valueString = String(value).trim();

  if (!valueString) {
    return null;
  }

  // ----------------------------------------------------------
  // Supabase public/storage URL
  // ----------------------------------------------------------

  if (
    valueString.includes("/storage/v1/object/")
  ) {
    const marker =
      "/storage/v1/object/";

    const markerIndex =
      valueString.indexOf(marker);

    if (markerIndex !== -1) {
      let path =
        valueString.substring(
          markerIndex + marker.length
        );

      path = path
        .replace(/^sign\/documents\//, "")
        .replace(/^public\/documents\//, "")
        .replace(/^authenticated\/documents\//, "")
        .replace(/^documents\//, "")
        .replace(/^\/+/, "");

      return path || null;
    }
  }

  // ----------------------------------------------------------
  // Full URL containing /documents/
  // ----------------------------------------------------------

  if (
    valueString.includes("/documents/")
  ) {
    const parts =
      valueString.split("/documents/");

    if (parts.length > 1) {
      return parts[parts.length - 1]
        .split("?")[0]
        .replace(/^\/+/, "");
    }
  }

  // ----------------------------------------------------------
  // Already a storage path
  // ----------------------------------------------------------

  return valueString
    .replace(/^\/+/, "")
    .replace(/^documents\//, "");
}

// ============================================================
// FIND DOCUMENT VALUE
// ============================================================

function findCV(application) {
  return (
    application?.cv_url ||
    application?.cv ||
    application?.resume_url ||
    application?.resume ||
    application?.document_url ||
    application?.cvUrl ||
    application?.resumeUrl ||
    null
  );
}

function findQualificationDocument(
  application
) {
  return (
    application?.qualification_url ||
    application?.qualification_document_url ||
    application?.qualification_document ||
    application?.qualification_file ||
    application?.qualificationUrl ||
    application?.certificate_url ||
    application?.certificate ||
    application?.academic_record_url ||
    application?.academic_record ||
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

  // ----------------------------------------------------------
  // Open window immediately.
  // This prevents Safari from blocking the popup.
  // ----------------------------------------------------------

  const newWindow = window.open(
    "",
    "_blank"
  );

  if (!newWindow) {
    alert(
      "Please allow pop-ups in Safari to view this document."
    );
    return;
  }

  try {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Opening ${documentName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: #f4f8fc;
              color: #0057B8;
              text-align: center;
            }

            .box {
              background: white;
              padding: 35px;
              border-radius: 18px;
              box-shadow: 0 10px 35px rgba(0,0,0,0.08);
              max-width: 420px;
              margin: 20px;
            }

            .icon {
              font-size: 45px;
              margin-bottom: 15px;
            }

            h2 {
              margin: 0 0 10px;
            }

            p {
              color: #666;
              line-height: 1.5;
            }
          </style>
        </head>

        <body>
          <div class="box">
            <div class="icon">📄</div>
            <h2>Opening document...</h2>
            <p>
              Please wait while GradLink SA securely
              prepares the document.
            </p>
          </div>
        </body>
      </html>
    `);

    const cleanPath =
      getStoragePath(value);

    if (!cleanPath) {
      throw new Error(
        `The ${documentName} file path could not be found.`
      );
    }

    console.log(
      `${documentName} storage path:`,
      cleanPath
    );

    // --------------------------------------------------------
    // CREATE SECURE SIGNED URL
    // --------------------------------------------------------

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
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error(
        `Could not create a secure ${documentName} link.`
      );
    }

    // --------------------------------------------------------
    // SEND DOCUMENT TO NEW WINDOW
    // --------------------------------------------------------

    newWindow.location.href =
      data.signedUrl;
  } catch (error) {
    console.error(
      `${documentName} opening error:`,
      error
    );

    try {
      newWindow.close();
    } catch {
      // Ignore close error
    }

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

  const internshipId = params?.id;

  const [internship, setInternship] =
    useState(null);

  const [applications, setApplications] =
    useState([]);

  const [company, setCompany] =
    useState(null);

  // ----------------------------------------------------------
  // PREMIUM
  // ----------------------------------------------------------

  const [subscription, setSubscription] =
    useState(null);

  const [premiumLoading, setPremiumLoading] =
    useState(true);

  // ----------------------------------------------------------
  // PAGE STATE
  // ----------------------------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (!internshipId) return;

    async function loadApplicants() {
      setLoading(true);
      setErrorMessage("");
      setPremiumLoading(true);

      try {
        // ----------------------------------------------------
        // GET USER
        // ----------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // ----------------------------------------------------
        // GET COMPANY
        // ----------------------------------------------------

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
          setErrorMessage(
            "Company profile could not be found."
          );

          setLoading(false);
          setPremiumLoading(false);
          return;
        }

        setCompany(companyData);

        // ----------------------------------------------------
        // GET SUBSCRIPTION
        // ----------------------------------------------------

        try {
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
            setSubscription(
              subscriptionData || null
            );
          }
        } catch (subscriptionError) {
          console.error(
            "Subscription loading error:",
            subscriptionError
          );

          setSubscription(null);
        } finally {
          setPremiumLoading(false);
        }

        // ----------------------------------------------------
        // GET INTERNSHIP
        // ----------------------------------------------------

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
          setErrorMessage(
            "This internship could not be found."
          );

          setLoading(false);
          return;
        }

        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------

        if (
          internshipData.company_name !==
          companyData.company_name
        ) {
          setErrorMessage(
            "You do not have permission to view applicants for this internship."
          );

          setLoading(false);
          return;
        }

        setInternship(
          internshipData
        );

        // ----------------------------------------------------
        // GET APPLICATIONS
        // ----------------------------------------------------

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
          .order("created_at", {
            ascending: false,
          });

        if (applicationError) {
          throw applicationError;
        }

        // ----------------------------------------------------
        // GET GRADUATE IDS
        // ----------------------------------------------------

        const graduateIds = [
          ...new Set(
            (applicationData || [])
              .map(
                (application) =>
                  application.graduate_id
              )
              .filter(Boolean)
          ),
        ];

        let graduates = [];

        // ----------------------------------------------------
        // GET GRADUATE PROFILES
        // ----------------------------------------------------

        if (graduateIds.length > 0) {
          const {
            data: graduateData,
            error: graduateError,
          } = await supabase
            .from("graduates")
            .select("*")
            .in(
              "id",
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

        // ----------------------------------------------------
        // MERGE APPLICATION + GRADUATE
        // ----------------------------------------------------

        const mergedApplications =
          (applicationData || []).map(
            (application) => {
              const graduate =
                graduates.find(
                  (item) =>
                    String(item.id) ===
                    String(
                      application.graduate_id
                    )
                );

              /*
               * Application data is spread LAST.
               *
               * This means if the application contains
               * a newer CV/qualification URL, that value
               * takes priority over the graduate profile.
               */

              const combined = {
                ...(graduate || {}),
                ...application,
              };

              // ------------------------------------------------
              // DOCUMENT FALLBACKS
              // ------------------------------------------------

              const cvUrl =
                findCV(application) ||
                findCV(graduate);

              const qualificationUrl =
                findQualificationDocument(
                  application
                ) ||
                findQualificationDocument(
                  graduate
                );

              const applicationWithDocuments = {
                ...combined,
                cv_url:
                  cvUrl ||
                  combined.cv_url ||
                  null,

                qualification_url:
                  qualificationUrl ||
                  combined.qualification_url ||
                  null,
              };

              // ------------------------------------------------
              // CALCULATE AI MATCH
              // ------------------------------------------------

              const match =
                calculateMatch(
                  applicationWithDocuments,
                  internshipData
                );

              return {
                ...applicationWithDocuments,

                matchScore:
                  match.score,

                matchLabel:
                  match.label,

                matchedSkills:
                  match.matchedSkills,

                missingSkills:
                  match.missingSkills,

                strengths:
                  match.strengths,

                improvements:
                  match.improvements,
              };
            }
          );

        // ----------------------------------------------------
        // SORT BY MATCH SCORE
        // ----------------------------------------------------

        mergedApplications.sort(
          (a, b) =>
            b.matchScore -
            a.matchScore
        );

        setApplications(
          mergedApplications
        );
      } catch (error) {
        console.error(
          "Applicants page error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Could not load applicants."
        );

        setPremiumLoading(false);
      } finally {
        setLoading(false);
      }
    }

    loadApplicants();
  }, [internshipId, router]);

  // ==========================================================
  // PREMIUM STATUS
  // ==========================================================

  const isPremium =
    subscription &&
    (
      String(
        subscription.plan || ""
      ).toLowerCase() ===
        "premium" ||
      String(
        subscription.plan || ""
      ).toLowerCase() ===
        "pro" ||
      String(
        subscription.plan || ""
      ).toLowerCase() ===
        "professional"
    ) &&
    (
      String(
        subscription.status || ""
      ).toLowerCase() ===
        "active" ||
      String(
        subscription.status || ""
      ).toLowerCase() ===
        "trialing"
    );

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(
    applicationId,
    status
  ) {
    try {
      const { error } =
        await supabase
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
    const cvUrl =
      findCV(application);

    await openStorageDocument(
      cvUrl,
      "CV"
    );
  }

  // ==========================================================
  // VIEW QUALIFICATION
  // ==========================================================

  async function viewQualification(
    application
  ) {
    const qualificationUrl =
      findQualificationDocument(
        application
      );

    await openStorageDocument(
      qualificationUrl,
      "qualification document"
    );
  }

  // ==========================================================
  // UPGRADE
  // ==========================================================

  function goToPremium() {
    router.push(
      "/company/subscription"
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
          background: "#f4f8fc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Loading applicants...
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
          background: "#f4f8fc",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "18px",
            padding: "35px",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              color: "#c62828",
              marginBottom: "15px",
            }}
          >
            Unable to load applicants
          </h1>

          <p
            style={{
              color: "#555",
              lineHeight: "1.6",
            }}
          >
            {errorMessage}
          </p>

          <button
            onClick={() =>
              router.push(
                "/company-dashboard"
              )
            }
            style={{
              marginTop: "20px",
              padding: "13px 20px",
              border: "none",
              borderRadius: "10px",
              background: "#0057B8",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ← Back to Company Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE START
  // ==========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        padding: "25px 15px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #0057B8 0%, #0077d9 100%)",
            color: "#fff",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "22px",
            boxShadow:
              "0 12px 35px rgba(0,87,184,0.18)",
          }}
        >
          <button
            onClick={() =>
              router.push(
                "/company-dashboard"
              )
            }
            style={{
              background:
                "rgba(255,255,255,0.14)",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.35)",
              borderRadius: "9px",
              padding: "10px 14px",
              cursor: "pointer",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </button>

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
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing:
                    "1.5px",
                  opacity: 0.8,
                  marginBottom: "8px",
                }}
              >
                GRADLINK SA • RECRUITMENT
              </div>

              <h1
                style={{
                  margin:
                    "0 0 8px",
                  fontSize:
                    "clamp(26px,5vw,36px)",
                  lineHeight: "1.15",
                }}
              >
                👥 Internship Applicants
              </h1>

              <h2
                style={{
                  margin:
                    "0 0 8px",
                  fontSize: "21px",
                  fontWeight: "600",
                }}
              >
                {internship?.job_title ||
                  "Internship"}
              </h2>

              <p
                style={{
                  margin: 0,
                  opacity: 0.9,
                  lineHeight: "1.6",
                }}
              >
                Review, compare and manage
                graduates who applied for
                this opportunity.
              </p>
            </div>

            <div
              style={{
                background:
                  "rgba(255,255,255,0.13)",
                border:
                  "1px solid rgba(255,255,255,0.25)",
                borderRadius: "14px",
                padding: "14px 18px",
                minWidth: "150px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.8,
                  marginBottom: "5px",
                }}
              >
                COMPANY
              </div>

              <div
                style={{
                  fontWeight: "800",
                  fontSize: "15px",
                }}
              >
                {company?.company_name ||
                  "Your Company"}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            PREMIUM RECRUITMENT SECTION
        ==================================================== */}

        {!premiumLoading && (
          <div
            style={{
              background: isPremium
                ? "linear-gradient(135deg,#111827,#243b64)"
                : "#ffffff",
              color: isPremium
                ? "#fff"
                : "#222",
              borderRadius: "18px",
              padding: "22px",
              marginBottom: "22px",
              boxShadow:
                "0 7px 25px rgba(0,0,0,0.07)",
              border: isPremium
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid #e4eaf1",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: "1 1 400px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing:
                      "1px",
                    marginBottom: "7px",
                    color: isPremium
                      ? "#9ecbff"
                      : "#0057B8",
                  }}
                >
                  {isPremium
                    ? "✦ PREMIUM RECRUITMENT"
                    : "GRADLINK SA PREMIUM"}
                </div>

                <h2
                  style={{
                    margin:
                      "0 0 7px",
                    fontSize: "21px",
                  }}
                >
                  {isPremium
                    ? "Premium recruitment is active"
                    : "Upgrade your recruitment tools"}
                </h2>

                <p
                  style={{
                    margin: 0,
                    lineHeight: "1.6",
                    color: isPremium
                      ? "rgba(255,255,255,0.78)"
                      : "#666",
                  }}
                >
                  {isPremium
                    ? "Your company has access to the enhanced GradLink SA recruitment experience."
                    : "Unlock enhanced recruitment tools designed to help your company manage and review applicants more efficiently."}
                </p>
              </div>

              <div>
                {isPremium ? (
                  <div
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: "8px",
                      background:
                        "rgba(255,255,255,0.12)",
                      border:
                        "1px solid rgba(255,255,255,0.2)",
                      borderRadius:
                        "10px",
                      padding:
                        "11px 15px",
                      fontWeight:
                        "700",
                    }}
                  >
                    ✦ Premium Active
                  </div>
                ) : (
                  <button
                    onClick={
                      goToPremium
                    }
                    style={{
                      background:
                        "#0057B8",
                      color: "#fff",
                      border: "none",
                      borderRadius:
                        "10px",
                      padding:
                        "12px 18px",
                      fontWeight:
                        "800",
                      cursor:
                        "pointer",
                      boxShadow:
                        "0 5px 15px rgba(0,87,184,0.2)",
                    }}
                  >
                    Upgrade to Premium →
                  </button>
                )}
              </div>
            </div>

            {isPremium && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(180px,1fr))",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >
                <PremiumFeature
                  icon="🤖"
                  title="Smart Matching"
                  text="Applicant matching insights"
                  active
                />

                <PremiumFeature
                  icon="📄"
                  title="Document Review"
                  text="Review applicant documents"
                  active
                />

                <PremiumFeature
                  icon="📊"
                  title="Recruitment Insights"
                  text="Better applicant visibility"
                  active
                />
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: "15px",
            marginBottom: "22px",
          }}
        >
          <SummaryCard
            icon="👥"
            number={
              applications.length
            }
            label="Total Applicants"
          />

          <SummaryCard
            icon="⭐"
            number={
              applications.filter(
                (item) =>
                  item.matchScore >=
                  85
              ).length
            }
            label="Strong Matches"
          />

          <SummaryCard
            icon="📋"
            number={
              applications.filter(
                (item) =>
                  String(
                    item.status ||
                      ""
                  ).toLowerCase() ===
                  "shortlisted"
              ).length
            }
            label="Shortlisted"
          />

          <SummaryCard
            icon="📄"
            number={
              applications.filter(
                (item) =>
                  !!findCV(item)
              ).length
            }
            label="CVs Available"
          />
        </div>

        {/* ====================================================
            INTERNSHIP DETAILS
        ==================================================== */}

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "22px",
            boxShadow:
              "0 6px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0057B8",
              }}
            >
              Internship Details
            </h2>

            <span
              style={{
                background: "#eef5ff",
                color: "#0057B8",
                padding:
                  "7px 11px",
                borderRadius:
                  "20px",
                fontSize: "12px",
                fontWeight:
                  "700",
              }}
            >
              {applications.length}{" "}
              applicant
              {applications.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "13px",
            }}
          >
            <Detail
              label="Company"
              value={
                internship?.company_name ||
                "—"
              }
            />

            <Detail
              label="Province"
              value={
                internship?.province ||
                "—"
              }
            />

            <Detail
              label="Location"
              value={
                internship?.location ||
                "—"
              }
            />

            <Detail
              label="Internship Type"
              value={
                internship?.internship_type ||
                "—"
              }
            />

            <Detail
              label="Qualification"
              value={
                internship?.qualification ||
                "Any"
              }
            />

            <Detail
              label="Field of Study"
              value={
                internship?.field_of_study ||
                "Any"
              }
            />

            <Detail
              label="Stipend"
              value={
                internship?.stipend ||
                "Not specified"
              }
            />

            <Detail
              label="Deadline"
              value={
                internship?.deadline ||
                "Not specified"
              }
            />
          </div>
        </div>

        {/* ====================================================
            APPLICANTS
        ==================================================== */}

        {applications.length ===
        0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding:
                "55px 25px",
              textAlign: "center",
              boxShadow:
                "0 6px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "55px",
                marginBottom:
                  "15px",
              }}
            >
              📭
            </div>

            <h2
              style={{
                color: "#0057B8",
                marginBottom:
                  "8px",
              }}
            >
              No applicants yet
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              Applications for this
              internship will appear
              here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "18px",
            }}
          >
            {applications.map(
              (
                application,
                index
              ) => (
                <ApplicantCard
                  key={
                    application.id ||
                    application.graduate_id ||
                    index
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
  const score =
    Number(application.matchScore) || 0;

  const status =
    String(
      application.status || "pending"
    ).toLowerCase();

  const hasCV =
    !!findCV(application);

  const hasQualification =
    !!findQualificationDocument(
      application
    );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "24px",
        boxShadow:
          "0 7px 25px rgba(0,0,0,0.07)",
        border:
          score >= 85
            ? "2px solid #b7e4c7"
            : "1px solid #e5eaf0",
      }}
    >
      {/* ====================================================
          APPLICANT HEADER
      ==================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            flex: "1 1 300px",
          }}
        >
          <div
            style={{
              color: "#777",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "5px",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.5px",
            }}
          >
            Applicant #{index + 1}
          </div>

          <h2
            style={{
              margin:
                "0 0 7px",
              color: "#222",
              fontSize:
                "clamp(20px,4vw,25px)",
            }}
          >
            {application.full_name ||
              "Graduate Applicant"}
          </h2>

          <div
            style={{
              color: "#555",
              lineHeight: "1.8",
              fontSize: "14px",
            }}
          >
            📧{" "}
            {application.email ||
              "Email not provided"}
            <br />

            📱{" "}
            {application.phone ||
              "Phone not provided"}
          </div>
        </div>

        {/* ==================================================
            MATCH SCORE
        ================================================== */}

        <div
          style={{
            minWidth: "125px",
            textAlign: "center",
            padding:
              "14px 16px",
            borderRadius: "14px",
            background:
              score >= 85
                ? "#e8f7ee"
                : score >= 70
                ? "#eef5ff"
                : score >= 40
                ? "#fff8e6"
                : "#fff0f0",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color:
                score >= 85
                  ? "#16803c"
                  : score >= 70
                  ? "#0057B8"
                  : score >= 40
                  ? "#a66a00"
                  : "#c62828",
            }}
          >
            {score}%
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: "#555",
            }}
          >
            {application.matchLabel ||
              "Weak Match"}
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#777",
              marginTop: "3px",
            }}
          >
            AI Match
          </div>
        </div>
      </div>

      {/* ====================================================
          STATUS
      ==================================================== */}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          background:
            status === "shortlisted"
              ? "#e8f7ee"
              : status === "rejected"
              ? "#fff0f0"
              : "#f3f5f8",
          color:
            status === "shortlisted"
              ? "#16803c"
              : status === "rejected"
              ? "#c62828"
              : "#666",
          padding:
            "7px 11px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "800",
          marginBottom: "18px",
        }}
      >
        <span>
          {status === "shortlisted"
            ? "⭐"
            : status === "rejected"
            ? "✕"
            : "●"}
        </span>

        {status === "shortlisted"
          ? "Shortlisted"
          : status === "rejected"
          ? "Rejected"
          : "Pending Review"}
      </div>

      {/* ====================================================
          APPLICANT DETAILS
      ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(210px,1fr))",
          gap: "13px",
          marginBottom: "18px",
        }}
      >
        <InfoBox
          label="Qualification"
          value={
            application.qualification ||
            "Not provided"
          }
        />

        <InfoBox
          label="Field of Study"
          value={
            application.field_of_study ||
            "Not provided"
          }
        />

        <InfoBox
          label="Institution"
          value={
            application.institution ||
            "Not provided"
          }
        />

        <InfoBox
          label="Province"
          value={
            application.province ||
            "Not provided"
          }
        />

        <InfoBox
          label="Skills"
          value={
            application.skills ||
            "Not provided"
          }
        />

        <InfoBox
          label="Application Status"
          value={
            status === "shortlisted"
              ? "Shortlisted"
              : status === "rejected"
              ? "Rejected"
              : "Pending"
          }
        />
      </div>

      {/* ====================================================
          DOCUMENT STATUS
      ==================================================== */}

      <div
        style={{
          background: "#f8fafc",
          border:
            "1px solid #e5eaf0",
          borderRadius: "13px",
          padding: "15px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "800",
            color: "#555",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.5px",
            marginBottom: "11px",
          }}
        >
          Applicant Documents
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "9px",
          }}
        >
          <DocumentStatus
            icon="📄"
            label="CV"
            available={hasCV}
          />

          <DocumentStatus
            icon="🎓"
            label="Qualification"
            available={
              hasQualification
            }
          />
        </div>
      </div>

      {/* ====================================================
          STRENGTHS
      ==================================================== */}

      {application.strengths?.length >
        0 && (
        <div
          style={{
            background: "#f4fbf6",
            border:
              "1px solid #ccebd7",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "14px",
          }}
        >
          <strong
            style={{
              color: "#16803c",
              fontSize: "14px",
            }}
          >
            ✅ Match Strengths
          </strong>

          <ul
            style={{
              margin:
                "9px 0 0",
              paddingLeft:
                "20px",
              color: "#444",
              lineHeight: "1.7",
              fontSize: "14px",
            }}
          >
            {application.strengths.map(
              (item, i) => (
                <li key={i}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* ====================================================
          IMPROVEMENTS
      ==================================================== */}

      {application.improvements?.length >
        0 && (
        <div
          style={{
            background: "#fffaf0",
            border:
              "1px solid #f0dfb2",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "14px",
          }}
        >
          <strong
            style={{
              color: "#9a6700",
              fontSize: "14px",
            }}
          >
            ⚠️ Review Areas
          </strong>

          <ul
            style={{
              margin:
                "9px 0 0",
              paddingLeft:
                "20px",
              color: "#555",
              lineHeight: "1.7",
              fontSize: "14px",
            }}
          >
            {application.improvements.map(
              (item, i) => (
                <li key={i}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* ====================================================
          MATCHED SKILLS
      ==================================================== */}

      {application.matchedSkills?.length >
        0 && (
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#555",
              marginBottom: "8px",
            }}
          >
            MATCHED SKILLS
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "7px",
            }}
          >
            {application.matchedSkills.map(
              (skill, i) => (
                <span
                  key={i}
                  style={{
                    background:
                      "#e8f7ee",
                    color:
                      "#16803c",
                    border:
                      "1px solid #ccebd7",
                    padding:
                      "6px 10px",
                    borderRadius:
                      "20px",
                    fontSize:
                      "12px",
                    fontWeight:
                      "700",
                  }}
                >
                  ✓ {skill}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          ACTIONS
      ==================================================== */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "9px",
          paddingTop: "17px",
          borderTop:
            "1px solid #edf0f4",
        }}
      >
        {/* FULL APPLICATION */}

        <Link
          href={`/company/internships/${internshipId}/applicants/${application.id}`}
          style={{
            ...actionButton(
              "#0057B8"
            ),
            textDecoration: "none",
            display:
              "inline-flex",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          👤 Full Application
        </Link>

        {/* CV */}

        <button
          type="button"
          onClick={() =>
            onReviewCV(
              application
            )
          }
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

        {/* QUALIFICATION */}

        <button
          type="button"
          onClick={() =>
            onViewQualification(
              application
            )
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

        {/* SHORTLIST */}

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
              "#16803c"
            ),
          }}
        >
          ⭐ Shortlist
        </button>

        {/* REJECT */}

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
              "#c62828"
            ),
          }}
        >
          ✕ Reject
        </button>

        {/* RESET */}

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
              "#777"
            ),
          }}
        >
          ↺ Reset
        </button>
      </div>

      {/* ====================================================
          PREMIUM INFORMATION
      ==================================================== */}

      {isPremium && (
        <div
          style={{
            marginTop: "16px",
            padding:
              "11px 13px",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg,#f5f0ff,#eef5ff)",
            border:
              "1px solid #ddd3f5",
            color: "#57417c",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          ✦ Premium recruitment tools are
          enabled for this company.
        </div>
      )}
    </div>
  );
}

// ============================================================
// DOCUMENT STATUS
// ============================================================

function DocumentStatus({
  icon,
  label,
  available,
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding:
          "8px 11px",
        borderRadius: "9px",
        background:
          available
            ? "#e8f7ee"
            : "#f1f3f5",
        color:
          available
            ? "#16803c"
            : "#777",
        border:
          available
            ? "1px solid #ccebd7"
            : "1px solid #e1e5e9",
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      <span>
        {icon}
      </span>

      <span>
        {label}
      </span>

      <span>
        {available
          ? "✓"
          : "—"}
      </span>
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
  active,
}) {
  return (
    <div
      style={{
        background:
          active
            ? "rgba(255,255,255,0.08)"
            : "#f7f9fc",
        border:
          active
            ? "1px solid rgba(255,255,255,0.12)"
            : "1px solid #e5eaf0",
        borderRadius: "11px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          marginBottom: "5px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontWeight: "800",
          fontSize: "13px",
          color: active
            ? "#fff"
            : "#222",
          marginBottom: "3px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "11px",
          lineHeight: "1.4",
          color: active
            ? "rgba(255,255,255,0.65)"
            : "#777",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon,
  number,
  label,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        boxShadow:
          "0 5px 20px rgba(0,0,0,0.06)",
        border:
          "1px solid #edf0f4",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background:
            "#eef5ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "800",
            color: "#0057B8",
            lineHeight: "1",
            marginBottom: "5px",
          }}
        >
          {number}
        </div>

        <div
          style={{
            color: "#666",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL COMPONENT
// ============================================================

function Detail({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#f7f9fc",
        borderRadius:
          "10px",
        padding:
          "13px",
        border:
          "1px solid #edf0f4",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#777",
          marginBottom:
            "5px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.5px",
          fontWeight:
            "700",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight:
            "600",
          color: "#222",
          lineHeight:
            "1.5",
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#f7f9fc",
        borderRadius:
          "10px",
        padding:
          "13px",
        border:
          "1px solid #edf0f4",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#777",
          marginBottom:
            "5px",
          fontWeight:
            "700",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#333",
          lineHeight:
            "1.5",
          wordBreak:
            "break-word",
          fontSize:
            "14px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// ACTION BUTTON
// ============================================================

function actionButton(
  background
) {
  return {
    background,
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding:
      "10px 13px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    minHeight: "40px",
    boxShadow:
      "0 2px 6px rgba(0,0,0,0.08)",
  };
}