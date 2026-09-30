"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* =========================================================
   HELPERS
========================================================= */

function normalise(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStoragePath(value) {
  if (!value) return "";

  let path = String(value).trim();

  if (!path) return "";

  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep original value if decoding fails.
  }

  // Remove query string and hash.
  path = path.split("?")[0].split("#")[0];

  // Handle complete Supabase storage URLs.
  path = path.replace(
    /^https?:\/\/[^/]+\/storage\/v1\/object\/(?:sign|public|authenticated)\//i,
    ""
  );

  // Remove storage path prefixes.
  path = path.replace(
    /^\/?storage\/v1\/object\/(?:sign|public|authenticated)\//i,
    ""
  );

  // Remove bucket name if included.
  path = path.replace(/^\/?documents\//i, "");

  // Remove leading slash.
  path = path.replace(/^\/+/, "");

  return path.trim();
}

function findCV(application) {
  if (!application) return "";

  const possibleValues = [
    application.cv_url,
    application.cv,
    application.resume_url,
    application.resume,
    application.document_url,
    application.cvUrl,
    application.resumeUrl,

    application.graduate?.cv_url,
    application.graduate?.cv,
    application.graduate?.resume_url,
    application.graduate?.resume,

    application.profile?.cv_url,
    application.profile?.cv,
    application.profile?.resume_url,
    application.profile?.resume,
  ];

  return (
    possibleValues.find(
      (value) => String(value || "").trim().length > 0
    ) || ""
  );
}

function findQualificationDocument(application) {
  if (!application) return "";

  const possibleValues = [
    application.qualification_url,
    application.qualification_document_url,
    application.qualification_document,
    application.qualification_file,
    application.qualificationUrl,
    application.certificate_url,
    application.certificate,
    application.academic_record_url,
    application.academic_record,

    application.graduate?.qualification_url,
    application.graduate?.qualification_document_url,
    application.graduate?.qualification_document,
    application.graduate?.qualification_file,
    application.graduate?.certificate_url,
    application.graduate?.certificate,
    application.graduate?.academic_record_url,
    application.graduate?.academic_record,

    application.profile?.qualification_url,
    application.profile?.qualification_document_url,
    application.profile?.qualification_document,
    application.profile?.qualification_file,
    application.profile?.certificate_url,
    application.profile?.certificate,
    application.profile?.academic_record_url,
    application.profile?.academic_record,
  ];

  return (
    possibleValues.find(
      (value) => String(value || "").trim().length > 0
    ) || ""
  );
}

function getMatchLabel(score) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 40) return "Possible";
  return "Weak";
}

function getMatchScore(application, internship) {
  if (!application || !internship) return 0;

  const graduate =
    application.graduate ||
    application.profile ||
    application;

  const qualification = normalise(
    graduate.qualification
  );

  const internshipQualification = normalise(
    internship.qualification
  );

  const field = normalise(
    graduate.field_of_study
  );

  const internshipField = normalise(
    internship.field_of_study
  );

  const graduateSkills = String(
    graduate.skills || ""
  )
    .split(",")
    .map((skill) => normalise(skill))
    .filter(Boolean);

  const internshipSkills = String(
    internship.skills || ""
  )
    .split(",")
    .map((skill) => normalise(skill))
    .filter(Boolean);

  let qualificationScore = 0;
  let fieldScore = 0;
  let skillsScore = 0;

  if (
    qualification &&
    internshipQualification &&
    (
      qualification === internshipQualification ||
      qualification.includes(internshipQualification) ||
      internshipQualification.includes(qualification)
    )
  ) {
    qualificationScore = 35;
  }

  if (
    field &&
    internshipField &&
    (
      field === internshipField ||
      field.includes(internshipField) ||
      internshipField.includes(field)
    )
  ) {
    fieldScore = 35;
  }

  if (
    graduateSkills.length > 0 &&
    internshipSkills.length > 0
  ) {
    const matchedSkills = internshipSkills.filter(
      (internshipSkill) =>
        graduateSkills.some(
          (graduateSkill) =>
            graduateSkill.includes(internshipSkill) ||
            internshipSkill.includes(graduateSkill)
        )
    );

    skillsScore = Math.round(
      (matchedSkills.length /
        internshipSkills.length) *
        30
    );
  }

  return qualificationScore + fieldScore + skillsScore;
}

/* =========================================================
   BUTTON STYLE
========================================================= */

function actionButton(background) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 46,
    padding: "11px 14px",
    border: "none",
    borderRadius: 10,
    background,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
    userSelect: "none",
    WebkitUserSelect: "none",
    textDecoration: "none",
  };
}

/* =========================================================
   DOCUMENT OPENING
========================================================= */

async function openStorageDocument(
  value,
  documentName
) {
  const cleanPath = getStoragePath(value);

  console.log(
    `${documentName} original value:`,
    value
  );

  console.log(
    `${documentName} cleaned storage path:`,
    cleanPath
  );

  if (!cleanPath) {
    alert(
      `This applicant has not uploaded a ${documentName}.`
    );
    return;
  }

  // Open immediately so Safari/iPhone does not treat
  // the later signed URL as an unwanted popup.
  const documentWindow = window.open(
    "",
    "_blank"
  );

  if (!documentWindow) {
    alert(
      "Your browser blocked the document window. Please allow pop-ups and try again."
    );
    return;
  }

  try {
    documentWindow.document.write(`
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
              background: #f8fafc;
              color: #0f172a;
            }
            .box {
              text-align: center;
              padding: 30px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .text {
              font-size: 14px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="title">
              Opening ${documentName}...
            </div>
            <div class="text">
              Please wait.
            </div>
          </div>
        </body>
      </html>
    `);
    documentWindow.document.close();

    const {
      data,
      error,
    } = await supabase.storage
      .from("documents")
      .createSignedUrl(
        cleanPath,
        3600
      );

    if (error) {
      console.error(
        `Could not create ${documentName} signed URL:`,
        error
      );

      throw new Error(
        error.message ||
          `Could not create a secure link for this ${documentName}.`
      );
    }

    if (!data?.signedUrl) {
      throw new Error(
        `Could not create a secure link for this ${documentName}.`
      );
    }

    console.log(
      `${documentName} signed URL created successfully`
    );

    documentWindow.location.href =
      data.signedUrl;
  } catch (error) {
    console.error(
      `Could not open ${documentName}:`,
      error
    );

    if (
      documentWindow &&
      !documentWindow.closed
    ) {
      documentWindow.close();
    }

    alert(
      error?.message ||
        `Could not open the ${documentName}.`
    );
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ApplicantsPage({
  params,
}) {
  const [internshipId, setInternshipId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [internship, setInternship] =
    useState(null);

  const [company, setCompany] =
    useState(null);

  const [applications, setApplications] =
    useState([]);

  const [subscription, setSubscription] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  useEffect(() => {
    let active = true;

    async function loadParams() {
      try {
        const resolvedParams =
          await params;

        if (active) {
          setInternshipId(
            resolvedParams?.id
          );
        }
      } catch (err) {
        console.error(
          "Could not read route parameters:",
          err
        );
        setError(
          "Could not load this internship."
        );
        setLoading(false);
      }
    }

    loadParams();

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!internshipId) return;

    loadApplicants(internshipId);
  }, [internshipId]);

  async function loadApplicants(id) {
    try {
      setLoading(true);
      setError("");

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href =
          `/login?redirect=/company/internships/${id}/applicants`;
        return;
      }

      /* =================================================
         COMPANY
      ================================================= */

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
          "Company profile not found."
        );
      }

      setCompany(companyData);

      /* =================================================
         SUBSCRIPTION
      ================================================= */

      const {
        data: subscriptionData,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (
        subscriptionError &&
        subscriptionError.code !==
          "PGRST116"
      ) {
        console.warn(
          "Subscription lookup warning:",
          subscriptionError
        );
      }

      setSubscription(
        subscriptionData || null
      );

      /* =================================================
         INTERNSHIP
      ================================================= */

      const {
        data: internshipData,
        error: internshipError,
      } = await supabase
        .from("internships")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (internshipError) {
        throw internshipError;
      }

      if (!internshipData) {
        throw new Error(
          "Internship not found."
        );
      }

      if (
        normalise(
          internshipData.company_name
        ) !==
        normalise(
          companyData.company_name
        )
      ) {
        throw new Error(
          "You do not have access to these applicants."
        );
      }

      setInternship(internshipData);

      /* =================================================
         APPLICATIONS
      ================================================= */

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select("*")
        .eq("internship_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (applicationError) {
        throw applicationError;
      }

      const rawApplications =
        applicationData || [];

      /* =================================================
         GRADUATE PROFILES
      ================================================= */

      const graduateIds =
        rawApplications
          .map(
            (application) =>
              application.graduate_id
          )
          .filter(Boolean);

      let graduateProfiles = [];

      if (graduateIds.length > 0) {
        const {
          data: graduatesData,
          error: graduatesError,
        } = await supabase
          .from("graduates")
          .select("*")
          .in(
            "user_id",
            graduateIds
          );

        if (graduatesError) {
          console.warn(
            "Graduate lookup warning:",
            graduatesError
          );
        } else {
          graduateProfiles =
            graduatesData || [];
        }
      }

      /* =================================================
         MERGE APPLICATION + GRADUATE
      ================================================= */

      const mergedApplications =
        rawApplications.map(
          (application) => {
            const graduate =
              graduateProfiles.find(
                (profile) =>
                  profile.user_id ===
                  application.graduate_id
              ) || null;

            const merged = {
              ...application,
              graduate,
              profile: graduate,
            };

            // Graduate table fallback for
            // document fields.
            if (
              graduate?.cv_url &&
              !merged.cv_url
            ) {
              merged.cv_url =
                graduate.cv_url;
            }

            if (
              graduate?.qualification_url &&
              !merged.qualification_url
            ) {
              merged.qualification_url =
                graduate.qualification_url;
            }

            return {
              ...merged,
              matchScore:
                getMatchScore(
                  merged,
                  internshipData
                ),
            };
          }
        );

      mergedApplications.sort(
        (a, b) =>
          (b.matchScore || 0) -
          (a.matchScore || 0)
      );

      if (
        typeof window !== "undefined"
      ) {
        console.log(
          "APPLICATION DOCUMENT DEBUG:",
          mergedApplications.map(
            (application) => ({
              id: application.id,
              graduate_id:
                application.graduate_id,
              cv_url:
                application.cv_url,
              qualification_url:
                application.qualification_url,
              graduate_cv:
                application.graduate
                  ?.cv_url,
              graduate_qualification:
                application.graduate
                  ?.qualification_url,
            })
          )
        );
      }

      setApplications(
        mergedApplications
      );
    } catch (err) {
      console.error(
        "Applicants page error:",
        err
      );

      setError(
        err?.message ||
          "Could not load applicants."
      );
    } finally {
      setLoading(false);
    }
  }

  async function reviewCV(application) {
    const cv = findCV(application);

    console.log(
      "REVIEW CV:",
      application
    );

    console.log(
      "CV VALUE FOUND:",
      cv
    );

    await openStorageDocument(
      cv,
      "CV"
    );
  }

  async function viewQualification(
    application
  ) {
    const qualification =
      findQualificationDocument(
        application
      );

    console.log(
      "VIEW QUALIFICATION:",
      application
    );

    console.log(
      "QUALIFICATION VALUE FOUND:",
      qualification
    );

    await openStorageDocument(
      qualification,
      "qualification document"
    );
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg,#eff6ff,#ffffff)",
          padding: 24,
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            textAlign: "center",
            paddingTop: 80,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Loading applicants...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg,#eff6ff,#ffffff)",
          padding: 24,
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            paddingTop: 60,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow:
                "0 10px 30px rgba(15,23,42,0.08)",
            }}
          >
            <h1
              style={{
                marginTop: 0,
                color: "#991b1b",
              }}
            >
              Could not load applicants
            </h1>

            <p
              style={{
                color: "#475569",
              }}
            >
              {error}
            </p>

            <Link
              href="/company-dashboard"
              style={{
                ...actionButton(
                  "#174ea6"
                ),
                maxWidth: 220,
                textDecoration: "none",
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const filteredApplications =
    applications.filter(
      (application) => {
        const graduate =
          application.graduate ||
          application.profile ||
          application;

        const searchText =
          [
            graduate.full_name,
            graduate.email,
            graduate.phone,
            graduate.qualification,
            graduate.field_of_study,
            graduate.institution,
            graduate.province,
            graduate.skills,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          !search.trim() ||
          searchText.includes(
            search.trim().toLowerCase()
          );

        const matchesStatus =
          statusFilter === "all" ||
          normalise(
            application.status
          ) ===
            normalise(statusFilter);

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eff6ff 0%,#ffffff 45%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#0f172a",
        paddingBottom: 50,
      }}
    >
      {/* HEADER */}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background:
            "rgba(255,255,255,0.96)",
          backdropFilter:
            "blur(12px)",
          borderBottom:
            "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto",
            padding:
              "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
                textTransform:
                  "uppercase",
                letterSpacing: 0.7,
              }}
            >
              GradLink SA
            </div>

            <h1
              style={{
                margin:
                  "3px 0 0",
                fontSize:
                  "clamp(20px,5vw,28px)",
              }}
            >
              Applicants
            </h1>
          </div>

          <Link
            href="/company-dashboard"
            style={{
              ...actionButton(
                "#174ea6"
              ),
              width: "auto",
              minWidth: 130,
              textDecoration:
                "none",
            }}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding:
            "24px 16px",
        }}
      >
        {/* INTERNSHIP INFO */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
            boxShadow:
              "0 10px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent:
                "space-between",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: "#174ea6",
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 5,
                }}
              >
                {company?.company_name ||
                  "Company"}
              </div>

              <h2
                style={{
                  margin:
                    "0 0 8px",
                  fontSize:
                    "clamp(22px,5vw,32px)",
                }}
              >
                {internship?.job_title ||
                  "Internship"}
              </h2>

              <div
                style={{
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                {internship?.province ||
                  ""}
                {internship?.location
                  ? ` • ${internship.location}`
                  : ""}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                minWidth: 100,
                minHeight: 76,
                padding: 12,
                borderRadius: 14,
                background:
                  "#eff6ff",
                color: "#174ea6",
              }}
            >
              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                  }}
                >
                  {applications.length}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Applications
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 16,
            marginBottom: 18,
            boxShadow:
              "0 8px 25px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) minmax(150px,200px)",
              gap: 12,
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search applicants..."
              style={{
                width: "100%",
                minHeight: 46,
                boxSizing:
                  "border-box",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 10,
                padding:
                  "0 14px",
                fontSize: 14,
                outline: "none",
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                minHeight: 46,
                boxSizing:
                  "border-box",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 10,
                padding:
                  "0 12px",
                fontSize: 14,
                background:
                  "#ffffff",
              }}
            >
              <option value="all">
                All statuses
              </option>
              <option value="pending">
                Pending
              </option>
              <option value="shortlisted">
                Shortlisted
              </option>
              <option value="rejected">
                Rejected
              </option>
              <option value="accepted">
                Accepted
              </option>
            </select>
          </div>
        </section>

        {/* APPLICANTS */}

        <section>
          {filteredApplications.length ===
          0 ? (
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 35,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No applicants found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              {filteredApplications.map(
                (application) => (
                  <ApplicantCard
                    key={
                      application.id
                    }
                    application={
                      application
                    }
                    internshipId={
                      internshipId
                    }
                    onReviewCV={
                      reviewCV
                    }
                    onViewQualification={
                      viewQualification
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

function ApplicantCard({
  application,
  internshipId,
  onReviewCV,
  onViewQualification,
}) {
  const graduate =
    application.graduate ||
    application.profile ||
    application;

  const score =
    Number(application.matchScore) || 0;

  const label =
    getMatchLabel(score);

  const cv =
    findCV(application);

  const qualification =
    findQualificationDocument(
      application
    );

  const status =
    application.status ||
    "pending";

  const statusText =
    String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );

  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        boxShadow:
          "0 8px 25px rgba(15,23,42,0.06)",
        overflow: "hidden",
      }}
    >
      {/* ==================================================
          APPLICANT HEADER
      ================================================== */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: "1 1 250px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
              wordBreak: "break-word",
            }}
          >
            {graduate.full_name ||
              "Applicant"}
          </div>

          {graduate.email && (
            <div
              style={{
                marginTop: 5,
                color: "#64748b",
                fontSize: 14,
                wordBreak: "break-word",
              }}
            >
              {graduate.email}
            </div>
          )}

          {graduate.phone && (
            <div
              style={{
                marginTop: 3,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {graduate.phone}
            </div>
          )}
        </div>

        {/* MATCH SCORE */}

        <div
          style={{
            flexShrink: 0,
            minWidth: 92,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#174ea6",
              lineHeight: 1,
            }}
          >
            {score}%
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 12,
              fontWeight: 800,
              color: "#475569",
            }}
          >
            {label} Match
          </div>
        </div>
      </div>

      {/* ==================================================
          STATUS
      ================================================== */}

      <div
        style={{
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 30,
            padding: "5px 11px",
            borderRadius: 999,
            background:
              normalise(status) ===
              "shortlisted"
                ? "#ecfdf5"
                : normalise(status) ===
                  "rejected"
                ? "#fef2f2"
                : "#f1f5f9",
            color:
              normalise(status) ===
              "shortlisted"
                ? "#047857"
                : normalise(status) ===
                  "rejected"
                ? "#b91c1c"
                : "#475569",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {statusText}
        </span>
      </div>

      {/* ==================================================
          PROFILE INFORMATION
      ================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <InfoBox
          label="Qualification"
          value={
            graduate.qualification
          }
        />

        <InfoBox
          label="Field of Study"
          value={
            graduate.field_of_study
          }
        />

        <InfoBox
          label="Institution"
          value={
            graduate.institution
          }
        />

        <InfoBox
          label="Province"
          value={
            graduate.province
          }
        />
      </div>

      {/* ==================================================
          SKILLS
      ================================================== */}

      {graduate.skills && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 12,
            background: "#f8fafc",
            border:
              "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#64748b",
              marginBottom: 6,
              textTransform:
                "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Skills
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#334155",
              wordBreak: "break-word",
            }}
          >
            {graduate.skills}
          </div>
        </div>
      )}

      {/* ==================================================
          DOCUMENTS
      ================================================== */}

      <div
        style={{
          borderTop:
            "1px solid #e2e8f0",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#334155",
            marginBottom: 10,
          }}
        >
          Applicant Documents
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 10,
          }}
        >
          {/* ==================================================
              REVIEW CV
          ================================================== */}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              console.log(
                "================================"
              );
              console.log(
                "REVIEW CV BUTTON PRESSED"
              );
              console.log(
                "Application:",
                application
              );
              console.log(
                "CV:",
                cv
              );
              console.log(
                "================================"
              );

              onReviewCV(
                application
              );
            }}
            style={{
              ...actionButton(
                "#174ea6"
              ),
              cursor: "pointer",
              pointerEvents: "auto",
              WebkitTapHighlightColor:
                "transparent",
              touchAction:
                "manipulation",
              userSelect: "none",
              WebkitUserSelect:
                "none",
              position: "relative",
              zIndex: 5,
            }}
          >
            📄 Review CV
          </button>

          {/* ==================================================
              VIEW QUALIFICATION
          ================================================== */}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              console.log(
                "================================"
              );
              console.log(
                "QUALIFICATION BUTTON PRESSED"
              );
              console.log(
                "Application:",
                application
              );
              console.log(
                "Qualification:",
                qualification
              );
              console.log(
                "================================"
              );

              onViewQualification(
                application
              );
            }}
            style={{
              ...actionButton(
                "#6b46c1"
              ),
              cursor: "pointer",
              pointerEvents: "auto",
              WebkitTapHighlightColor:
                "transparent",
              touchAction:
                "manipulation",
              userSelect: "none",
              WebkitUserSelect:
                "none",
              position: "relative",
              zIndex: 5,
            }}
          >
            🎓 View Qualification
          </button>

          {/* ==================================================
              FULL APPLICATION
          ================================================== */}

          <Link
            href={`/company/internships/${internshipId}/applicants/${application.id}`}
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              ...actionButton(
                "#0f766e"
              ),
              cursor: "pointer",
              pointerEvents: "auto",
              textDecoration:
                "none",
              position: "relative",
              zIndex: 5,
            }}
          >
            👤 Full Application
          </Link>
        </div>

        {/* DOCUMENT STATUS */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
          }}
        >
          <DocumentStatus
            label="CV"
            available={Boolean(cv)}
          />

          <DocumentStatus
            label="Qualification"
            available={Boolean(
              qualification
            )}
          />
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: 13,
        borderRadius: 12,
        background: "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#64748b",
          textTransform:
            "uppercase",
          letterSpacing: 0.45,
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#1e293b",
          wordBreak:
            "break-word",
        }}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT STATUS
========================================================= */

function DocumentStatus({
  label,
  available,
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        minHeight: 28,
        padding: "4px 9px",
        borderRadius: 999,
        background: available
          ? "#ecfdf5"
          : "#fef2f2",
        color: available
          ? "#047857"
          : "#b91c1c",
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      <span>
        {available ? "✓" : "!"}
      </span>

      <span>
        {label}:{" "}
        {available
          ? "Available"
          : "Not found"}
      </span>
    </span>
  );
}