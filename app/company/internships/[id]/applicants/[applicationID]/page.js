"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  if (!requiredQualification || requiredLevel === 0) {
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
  // FIELD - 35%
  // ----------------------------------------------------------

  let fieldScore = 0;

  if (!requiredField) {
    fieldScore = 35;
  } else if (!applicantField) {
    fieldScore = 0;
  } else if (applicantField === requiredField) {
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
    internshipSkills.forEach((requiredSkill) => {
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
    });

    skillsScore =
      (matchedSkills.length /
        internshipSkills.length) *
      30;
  }

  const score = Math.round(
    qualificationScore +
      fieldScore +
      skillsScore
  );

  let label = "Weak";

  if (score >= 85) {
    label = "Strong";
  } else if (score >= 70) {
    label = "Good";
  } else if (score >= 40) {
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

  return {
    score,
    label,
    matchedSkills,
    missingSkills,
    strengths,
    improvements,
  };
}

// ============================================================
// CLEAN SUPABASE STORAGE PATH
// ============================================================

function cleanStoragePath(value) {
  if (!value) return "";

  let path = String(value).trim();

  if (!path) return "";

  // ----------------------------------------------------------
  // FULL EXTERNAL URL
  // ----------------------------------------------------------

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    try {
      const parsed = new URL(path);

      // Supabase storage URL
      if (
        parsed.pathname.includes("/storage/v1/object/")
      ) {
        const marker = "/documents/";

        const markerIndex =
          parsed.pathname.indexOf(marker);

        if (markerIndex !== -1) {
          return decodeURIComponent(
            parsed.pathname.slice(
              markerIndex + marker.length
            )
          );
        }
      }

      // Other external URL
      return path;
    } catch {
      return path;
    }
  }

  // ----------------------------------------------------------
  // REMOVE QUERY / HASH
  // ----------------------------------------------------------

  path = path.split("?")[0];
  path = path.split("#")[0];

  // ----------------------------------------------------------
  // DECODE
  // ----------------------------------------------------------

  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep original path if decoding fails.
  }

  // ----------------------------------------------------------
  // REMOVE LEADING SLASHES
  // ----------------------------------------------------------

  path = path.replace(/^\/+/, "");

  // ----------------------------------------------------------
  // REMOVE STORAGE PREFIXES
  // ----------------------------------------------------------

  path = path.replace(
    /^storage\/v1\/object\/(?:public|sign)\/documents\//,
    ""
  );

  path = path.replace(
    /^storage\/v1\/object\/documents\//,
    ""
  );

  path = path.replace(
    /^documents\//,
    ""
  );

  return path;
}

// ============================================================
// DOCUMENT VALUE HELPERS
// ============================================================

function getDocumentCandidates(application, type) {
  if (!application) return [];

  if (type === "cv") {
    return [
      application.cv_url,
      application.cv_path,
      application.cv,
      application.resume_url,
      application.resume_path,
    ].filter(Boolean);
  }

  return [
    application.qualification_url,
    application.qualification_path,
    application.qualification_document_url,
    application.qualification_document_path,
    application.qualification_file_url,
    application.qualification_file_path,
  ].filter(Boolean);
}

// ============================================================
// PAGE
// ============================================================

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const internshipId =
    params?.id;

  const applicationId =
    params?.applicationID ||
    params?.applicationId ||
    params?.applicationid ||
    params?.application_id;

  const [internship, setInternship] =
    useState(null);

  const [application, setApplication] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [openingDocument, setOpeningDocument] =
    useState("");

  // ==========================================================
  // LOAD APPLICATION
  // ==========================================================

  useEffect(() => {
    if (!internshipId || !applicationId) {
      setLoading(false);

      setErrorMessage(
        "The application could not be identified. Please return to the applicant list and try again."
      );

      return;
    }

    let cancelled = false;

    async function loadApplication() {
      setLoading(true);
      setErrorMessage("");

      try {
        // ----------------------------------------------------
        // GET USER
        // ----------------------------------------------------

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // ----------------------------------------------------
        // GET COMPANY
        // ----------------------------------------------------

        const {
          data: company,
          error: companyError,
        } =
          await supabase
            .from("companies")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!company) {
          throw new Error(
            "Company profile could not be found."
          );
        }

        // ----------------------------------------------------
        // GET INTERNSHIP
        // ----------------------------------------------------

        const {
          data: internshipData,
          error: internshipError,
        } =
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

        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------

        if (
          internshipData.company_name !==
          company.company_name
        ) {
          throw new Error(
            "You do not have permission to view this application."
          );
        }

        if (cancelled) return;

        setInternship(internshipData);

        // ----------------------------------------------------
        // GET APPLICATION
        // ----------------------------------------------------

        const {
          data: applicationData,
          error: applicationError,
        } =
          await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .eq("internship_id", internshipId)
            .maybeSingle();

        if (applicationError) {
          throw applicationError;
        }

        if (!applicationData) {
          throw new Error(
            "This application could not be found."
          );
        }

        // ----------------------------------------------------
        // START WITH APPLICATION DATA
        // ----------------------------------------------------

        let combined = {
          ...applicationData,
        };

        // ----------------------------------------------------
        // OPTIONAL GRADUATE PROFILE
        // ----------------------------------------------------

        if (applicationData.graduate_id) {
          try {
            const {
              data: graduateData,
              error: graduateError,
            } =
              await supabase
                .from("graduates")
                .select("*")
                .eq(
                  "id",
                  applicationData.graduate_id
                )
                .maybeSingle();

            if (
              !graduateError &&
              graduateData
            ) {
              combined = {
                ...combined,
                ...graduateData,

                full_name:
                  applicationData.full_name ||
                  graduateData.full_name,

                email:
                  applicationData.email ||
                  graduateData.email,

                phone:
                  applicationData.phone ||
                  graduateData.phone,

                qualification:
                  applicationData.qualification ||
                  graduateData.qualification,

                field_of_study:
                  applicationData.field_of_study ||
                  graduateData.field_of_study,

                skills:
                  applicationData.skills ||
                  graduateData.skills,

                career_goals:
                  applicationData.career_goals ||
                  graduateData.career_goals,

                // Preserve application document paths.
                cv_url:
                  applicationData.cv_url ||
                  graduateData.cv_url,

                qualification_url:
                  applicationData.qualification_url ||
                  graduateData.qualification_url,
              };
            }
          } catch (graduateError) {
            console.log(
              "Graduate profile could not be loaded. Using application data.",
              graduateError
            );
          }
        }

        // ----------------------------------------------------
        // AI MATCH
        // ----------------------------------------------------

        const match =
          calculateMatch(
            combined,
            internshipData
          );

        const finalApplication = {
          ...combined,

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

        if (cancelled) return;

        setApplication(
          finalApplication
        );
      } catch (error) {
        console.error(
          "Application details error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error?.message ||
              "Could not load this application."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [
    internshipId,
    applicationId,
    router,
  ]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(status) {
    if (!application?.id) {
      return;
    }

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
          application.id
        );

      if (error) {
        throw error;
      }

      setApplication(
        (current) => ({
          ...current,
          status,
        })
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
  // OPEN DOCUMENT
  // ==========================================================

  async function openDocument(
    documentValues,
    label
  ) {
    const candidates = Array.isArray(
      documentValues
    )
      ? documentValues.filter(Boolean)
      : [documentValues].filter(Boolean);

    if (candidates.length === 0) {
      alert(
        `This applicant has not uploaded a ${label}.`
      );
      return;
    }

    setOpeningDocument(label);

    try {
      for (const candidate of candidates) {
        const value = String(candidate).trim();

        if (!value) continue;

        // ----------------------------------------------------
        // ALREADY A COMPLETE EXTERNAL URL
        // ----------------------------------------------------

        if (
          value.startsWith("http://") ||
          value.startsWith("https://")
        ) {
          try {
            const parsed = new URL(value);

            // If this is already a normal signed/public URL,
            // open it directly.
            if (
              !parsed.pathname.includes(
                "/storage/v1/object/"
              )
            ) {
              window.location.assign(value);
              return;
            }
          } catch {
            // Continue with storage-path handling.
          }
        }

        // ----------------------------------------------------
        // SUPABASE STORAGE PATH
        // ----------------------------------------------------

        const cleanPath =
          cleanStoragePath(value);

        if (!cleanPath) continue;

        // If cleanStoragePath returned an external URL,
        // navigate directly.
        if (
          cleanPath.startsWith("http://") ||
          cleanPath.startsWith("https://")
        ) {
          window.location.assign(cleanPath);
          return;
        }

        const {
          data,
          error,
        } =
          await supabase.storage
            .from("documents")
            .createSignedUrl(
              cleanPath,
              3600
            );

        if (error) {
          console.error(
            `Could not create ${label} signed URL for ${cleanPath}:`,
            error
          );

          continue;
        }

        if (data?.signedUrl) {
          // --------------------------------------------------
          // IMPORTANT:
          // Use location.assign instead of window.open.
          // This works much better on iPhone/Safari.
          // --------------------------------------------------

          window.location.assign(
            data.signedUrl
          );

          return;
        }
      }

      throw new Error(
        `Could not find or open the applicant's ${label}.`
      );
    } catch (error) {
      console.error(
        `${label} review error:`,
        error
      );

      alert(
        error?.message ||
          `Could not open the ${label}.`
      );
    } finally {
      setOpeningDocument("");
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingShell}>
          <div style={loadingIcon}>
            ⏳
          </div>

          <h2 style={loadingTitle}>
            Loading application
          </h2>

          <p style={loadingText}>
            Preparing the applicant profile...
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
      <main style={pageStyle}>
        <div style={errorBox}>
          <div style={errorIcon}>
            ⚠️
          </div>

          <div style={eyebrow}>
            APPLICATION REVIEW
          </div>

          <h1 style={errorTitle}>
            Unable to load application
          </h1>

          <p style={errorText}>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={primaryButton}
          >
            ← Back to Applicants
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // SAFETY
  // ==========================================================

  if (
    !application ||
    !internship
  ) {
    return (
      <main style={pageStyle}>
        <div style={errorBox}>
          <div style={errorIcon}>
            ⚠️
          </div>

          <div style={eyebrow}>
            APPLICATION REVIEW
          </div>

          <h1 style={errorTitle}>
            Application unavailable
          </h1>

          <p style={errorText}>
            The application could not be displayed.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={primaryButton}
          >
            ← Back to Applicants
          </button>
        </div>
      </main>
    );
  }

  const score =
    application.matchScore || 0;

  const cvCandidates =
    getDocumentCandidates(
      application,
      "cv"
    );

  const qualificationCandidates =
    getDocumentCandidates(
      application,
      "qualification"
    );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>

        {/* ==================================================
            TOP NAVIGATION
        ================================================== */}

        <div style={topBar}>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/company/internships/${internshipId}/applicants`
              )
            }
            style={topBackButton}
          >
            ← Applicants
          </button>

          <div style={topBrand}>
            <span style={brandMark}>
              GL
            </span>

            <span>
              GradLink SA
            </span>
          </div>
        </div>

        {/* ==================================================
            HERO
        ================================================== */}

        <section style={heroStyle}>
          <div style={heroContent}>
            <div style={eyebrowLight}>
              APPLICATION REVIEW
            </div>

            <h1 style={heroTitle}>
              {application.full_name ||
                "Graduate Applicant"}
            </h1>

            <p style={heroSubtitle}>
              Applicant for{" "}
              <strong>
                {internship.job_title ||
                  "Internship"}
              </strong>
            </p>

            <div style={heroMeta}>
              <span style={heroMetaItem}>
                📍{" "}
                {internship.location ||
                  internship.province ||
                  "South Africa"}
              </span>

              <span style={heroMetaItem}>
                📅{" "}
                {formatDate(
                  application.created_at
                )}
              </span>
            </div>
          </div>

          <div style={scoreCard}>
            <div style={scoreLabel}>
              MATCH SCORE
            </div>

            <div style={scoreNumber}>
              {score}%
            </div>

            <div style={scoreMatch}>
              {application.matchLabel}
            </div>
          </div>
        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section style={quickActions}>
          <div>
            <div style={quickEyebrow}>
              DOCUMENTS
            </div>

            <h2 style={quickTitle}>
              Review applicant documents
            </h2>

            <p style={quickText}>
              Open the applicant's uploaded
              documents using secure temporary
              links.
            </p>
          </div>

          <div style={documentActions}>
            <button
              type="button"
              disabled={
                openingDocument === "CV"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                openDocument(
                  cvCandidates,
                  "CV"
                );
              }}
              style={{
                ...documentButton,
                opacity:
                  openingDocument === "CV"
                    ? 0.65
                    : 1,
              }}
            >
              {openingDocument === "CV"
                ? "Opening CV..."
                : "📄 View CV"}
            </button>

            <button
              type="button"
              disabled={
                openingDocument ===
                "qualification"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                openDocument(
                  qualificationCandidates,
                  "qualification document"
                );
              }}
              style={{
                ...documentButtonSecondary,
                opacity:
                  openingDocument ===
                  "qualification"
                    ? 0.65
                    : 1,
              }}
            >
              {openingDocument ===
              "qualification"
                ? "Opening..."
                : "🎓 View Qualification"}
            </button>
          </div>
        </section>

        {/* ==================================================
            STATUS
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                APPLICATION
              </div>

              <h2 style={sectionTitle}>
                Application Status
              </h2>

              <p style={sectionSubtitle}>
                Update the applicant's progress
                through your recruitment process.
              </p>
            </div>

            <StatusBadge
              status={
                application.status ||
                "pending"
              }
            />
          </div>

          <div style={statusActions}>
            <button
              type="button"
              onClick={() =>
                updateStatus(
                  "shortlisted"
                )
              }
              style={statusButton(
                "#16803c"
              )}
            >
              ⭐ Shortlist
            </button>

            <button
              type="button"
              onClick={() =>
                updateStatus(
                  "rejected"
                )
              }
              style={statusButton(
                "#c62828"
              )}
            >
              ✕ Reject
            </button>

            <button
              type="button"
              onClick={() =>
                updateStatus(
                  "pending"
                )
              }
              style={statusButton(
                "#667085"
              )}
            >
              ↺ Pending
            </button>
          </div>
        </section>

        {/* ==================================================
            APPLICANT INFORMATION
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                PROFILE
              </div>

              <h2 style={sectionTitle}>
                Applicant Information
              </h2>

              <p style={sectionSubtitle}>
                Key details supplied with this
                application.
              </p>
            </div>
          </div>

          <div style={gridStyle}>
            <Info
              label="Full Name"
              value={
                application.full_name ||
                "Not provided"
              }
            />

            <Info
              label="Email"
              value={
                application.email ||
                "Not provided"
              }
            />

            <Info
              label="Phone"
              value={
                application.phone ||
                "Not provided"
              }
            />

            <Info
              label="Province"
              value={
                application.province ||
                "Not provided"
              }
            />

            <Info
              label="Institution"
              value={
                application.institution ||
                "Not provided"
              }
            />

            <Info
              label="Qualification"
              value={
                application.qualification ||
                "Not provided"
              }
            />

            <Info
              label="Field of Study"
              value={
                application.field_of_study ||
                "Not provided"
              }
            />

            <Info
              label="Application Date"
              value={formatDate(
                application.created_at
              )}
            />
          </div>
        </section>

        {/* ==================================================
            SKILLS
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                CAPABILITIES
              </div>

              <h2 style={sectionTitle}>
                Skills
              </h2>
            </div>
          </div>

          {getSkillsArray(
            application.skills
          ).length > 0 ? (
            <div style={skillsWrap}>
              {getSkillsArray(
                application.skills
              ).map(
                (skill, index) => (
                  <span
                    key={index}
                    style={skillBadge}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <p style={mutedText}>
              No skills were provided.
            </p>
          )}
        </section>

        {/* ==================================================
            CAREER GOALS
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                CAREER DIRECTION
              </div>

              <h2 style={sectionTitle}>
                Career Goals
              </h2>
            </div>
          </div>

          <div style={textBox}>
            {application.career_goals ||
              "No career goals were provided."}
          </div>
        </section>
        
                {/* ==================================================
            AI MATCH ANALYSIS
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                GRADLINK INTELLIGENCE
              </div>

              <h2 style={sectionTitle}>
                AI Match Analysis
              </h2>

              <p style={sectionSubtitle}>
                Compatibility analysis based on the
                requirements of this specific internship.
              </p>
            </div>

            <div
              style={{
                ...analysisScore,
                color:
                  score >= 85
                    ? "#16803c"
                    : score >= 70
                    ? "#0057B8"
                    : score >= 40
                    ? "#9a6700"
                    : "#c62828",
              }}
            >
              {score}%
            </div>
          </div>

          <div style={analysisGrid}>
            <div
              style={{
                ...analysisCard,
                background: "#f4fbf6",
                borderColor: "#ccebd7",
              }}
            >
              <div style={analysisIcon}>
                🎓
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#16803c",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    marginBottom: "8px",
                  }}
                >
                  Qualification
                </div>

                <p style={analysisText}>
                  <strong>Required:</strong>{" "}
                  {internship.qualification ||
                    "Any qualification"}
                </p>

                <p style={analysisText}>
                  <strong>Applicant:</strong>{" "}
                  {application.qualification ||
                    "Not provided"}
                </p>
              </div>
            </div>

            <div
              style={{
                ...analysisCard,
                background: "#f4f8ff",
                borderColor: "#c9dcf5",
              }}
            >
              <div style={analysisIcon}>
                🎯
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#0057B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    marginBottom: "8px",
                  }}
                >
                  Field of Study
                </div>

                <p style={analysisText}>
                  <strong>Required:</strong>{" "}
                  {internship.field_of_study ||
                    "Any field"}
                </p>

                <p style={analysisText}>
                  <strong>Applicant:</strong>{" "}
                  {application.field_of_study ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {application.strengths?.length > 0 && (
            <div style={strengthBox}>
              <div style={analysisSectionTitle}>
                <span>✓</span>
                Strengths
              </div>

              <ul style={analysisList}>
                {application.strengths.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {application.matchedSkills?.length > 0 && (
            <div style={analysisSubSection}>
              <div
                style={{
                  ...analysisSectionTitle,
                  color: "#16803c",
                }}
              >
                <span>✓</span>
                Matched Skills
              </div>

              <div style={skillsWrap}>
                {application.matchedSkills.map(
                  (skill, index) => (
                    <span
                      key={index}
                      style={matchedSkillBadge}
                    >
                      ✓ {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {application.missingSkills?.length > 0 && (
            <div style={missingBox}>
              <div
                style={{
                  ...analysisSectionTitle,
                  color: "#9a6700",
                }}
              >
                <span>!</span>
                Skills to Improve
              </div>

              <div style={skillsWrap}>
                {application.missingSkills.map(
                  (skill, index) => (
                    <span
                      key={index}
                      style={missingSkillBadge}
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {application.improvements?.length > 0 && (
            <div style={considerationBox}>
              <div
                style={{
                  ...analysisSectionTitle,
                  color: "#9a6700",
                }}
              >
                <span>💡</span>
                Considerations
              </div>

              <ul style={analysisList}>
                {application.improvements.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </section>

        {/* ==================================================
            DOCUMENTS
        ================================================== */}

        <section style={documentSection}>
          <div style={documentSectionTop}>
            <div>
              <div style={sectionEyebrow}>
                SECURE DOCUMENT REVIEW
              </div>

              <h2 style={documentTitle}>
                Applicant Documents
              </h2>

              <p style={documentDescription}>
                Review the applicant's submitted
                documents using secure temporary
                access links.
              </p>
            </div>

            <div style={secureBadge}>
              🔒 Secure
            </div>
          </div>

          <div style={documentGrid}>
            <button
              type="button"
              disabled={
                openingDocument === "CV"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                openDocument(
                  cvCandidates,
                  "CV"
                );
              }}
              style={{
                ...largeDocumentButton,
                opacity:
                  openingDocument === "CV"
                    ? 0.65
                    : 1,
              }}
            >
              <span style={documentButtonIcon}>
                📄
              </span>

              <span>
                <strong>
                  {openingDocument === "CV"
                    ? "Opening CV..."
                    : "View CV"}
                </strong>

                <small>
                  Review applicant CV
                </small>
              </span>

              <span style={documentArrow}>
                →
              </span>
            </button>

            <button
              type="button"
              disabled={
                openingDocument ===
                "qualification"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                openDocument(
                  qualificationCandidates,
                  "qualification document"
                );
              }}
              style={{
                ...largeDocumentButton,
                opacity:
                  openingDocument ===
                  "qualification"
                    ? 0.65
                    : 1,
              }}
            >
              <span style={documentButtonIcon}>
                🎓
              </span>

              <span>
                <strong>
                  {openingDocument ===
                  "qualification"
                    ? "Opening..."
                    : "View Qualification"}
                </strong>

                <small>
                  Review qualification document
                </small>
              </span>

              <span style={documentArrow}>
                →
              </span>
            </button>
          </div>
        </section>

        {/* ==================================================
            INTERNSHIP
        ================================================== */}

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <div style={sectionEyebrow}>
                OPPORTUNITY
              </div>

              <h2 style={sectionTitle}>
                Internship Applied For
              </h2>

              <p style={sectionSubtitle}>
                Details of the position associated
                with this application.
              </p>
            </div>
          </div>

          <div style={gridStyle}>
            <Info
              label="Position"
              value={
                internship.job_title ||
                "—"
              }
            />

            <Info
              label="Company"
              value={
                internship.company_name ||
                "—"
              }
            />

            <Info
              label="Location"
              value={
                internship.location ||
                "—"
              }
            />

            <Info
              label="Province"
              value={
                internship.province ||
                "—"
              }
            />

            <Info
              label="Internship Type"
              value={
                internship.internship_type ||
                "—"
              }
            />

            <Info
              label="Stipend"
              value={
                internship.stipend ||
                "Not specified"
              }
            />
          </div>
        </section>

        {/* ==================================================
            FINAL ACTION AREA
        ================================================== */}

        <section style={finalAction}>
          <div style={finalActionContent}>
            <div style={finalIcon}>
              ✓
            </div>

            <div>
              <div style={finalEyebrow}>
                APPLICATION DECISION
              </div>

              <h2 style={finalTitle}>
                Ready to make a decision?
              </h2>

              <p style={finalText}>
                Update this applicant's status or
                return to the full applicant list.
              </p>
            </div>
          </div>

          <div style={finalActions}>
            <button
              type="button"
              onClick={() =>
                updateStatus(
                  "shortlisted"
                )
              }
              style={finalGreenButton}
            >
              ⭐ Shortlist Applicant
            </button>

            <button
              type="button"
              onClick={() =>
                updateStatus(
                  "rejected"
                )
              }
              style={finalRedButton}
            >
              ✕ Reject Applicant
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/company/internships/${internshipId}/applicants`
                )
              }
              style={finalWhiteButton}
            >
              ← Back to Applicants
            </button>
          </div>
        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div style={footerStyle}>
          <div style={footerBrand}>
            <span style={footerMark}>
              GL
            </span>

            <strong>
              GradLink SA
            </strong>
          </div>

          <span>
            Connecting South African graduates
            with opportunity.
          </span>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// INFO COMPONENT
// ============================================================

function Info({
  label,
  value,
}) {
  return (
    <div style={infoCard}>
      <div style={infoLabel}>
        {label}
      </div>

      <div style={infoValue}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status || "pending"
    ).toLowerCase();

  let background = "#f1f3f5";
  let color = "#667085";
  let text = "Pending";

  if (
    normalized === "shortlisted"
  ) {
    background = "#e8f7ee";
    color = "#16803c";
    text = "⭐ Shortlisted";
  }

  if (
    normalized === "rejected"
  ) {
    background = "#fff0f0";
    color = "#c62828";
    text = "✕ Rejected";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        color,
        padding: "10px 15px",
        borderRadius: "999px",
        fontWeight: "800",
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
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
        month: "long",
        year: "numeric",
      }
    );
  } catch {
    return String(value);
  }
}

// ============================================================
// PAGE STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #eef5fc 0%, #f7faff 45%, #f4f7fb 100%)",
  padding:
    "18px 16px 60px",
  color: "#172033",
};

const containerStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "16px",
  padding: "4px 2px",
};

const topBackButton = {
  background: "#ffffff",
  color: "#0057B8",
  border: "1px solid #d7e4f2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const topBrand = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#0057B8",
  fontWeight: "800",
  fontSize: "15px",
};

const brandMark = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "31px",
  height: "31px",
  borderRadius: "9px",
  background:
    "linear-gradient(135deg, #0057B8, #0077d9)",
  color: "#fff",
  fontSize: "11px",
  fontWeight: "900",
};

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "24px",
  flexWrap: "wrap",
  background:
    "linear-gradient(135deg, #004b9b 0%, #0057B8 48%, #0077d9 100%)",
  color: "#fff",
  borderRadius: "24px",
  padding: "30px",
  marginBottom: "18px",
  boxShadow:
    "0 15px 40px rgba(0,87,184,0.20)",
};

const heroContent = {
  flex: "1 1 520px",
  minWidth: 0,
};

const eyebrowLight = {
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "1.4px",
  opacity: 0.78,
  marginBottom: "9px",
};

const heroTitle = {
  margin: "0 0 8px",
  fontSize: "clamp(28px, 5vw, 40px)",
  lineHeight: "1.12",
  letterSpacing: "-0.7px",
};

const heroSubtitle = {
  margin: 0,
  fontSize: "16px",
  lineHeight: "1.6",
  opacity: 0.92,
};

const heroMeta = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "20px",
};

const heroMetaItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background:
    "rgba(255,255,255,0.13)",
  border:
    "1px solid rgba(255,255,255,0.22)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "700",
};

const scoreCard = {
  width: "165px",
  minHeight: "150px",
  flex: "0 0 165px",
  background:
    "rgba(255,255,255,0.13)",
  border:
    "1px solid rgba(255,255,255,0.25)",
  borderRadius: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  backdropFilter: "blur(8px)",
};

const scoreLabel = {
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  opacity: 0.75,
};

const scoreNumber = {
  fontSize: "44px",
  lineHeight: "1",
  fontWeight: "900",
  margin: "10px 0 7px",
};

const scoreMatch = {
  fontSize: "13px",
  fontWeight: "800",
};

const quickActions = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
  background: "#ffffff",
  border:
    "1px solid #dce7f2",
  borderRadius: "18px",
  padding: "20px 22px",
  marginBottom: "18px",
  boxShadow:
    "0 7px 24px rgba(15,55,90,0.06)",
};

const quickEyebrow = {
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  color: "#0057B8",
  marginBottom: "5px",
};

const quickTitle = {
  margin: "0 0 5px",
  fontSize: "18px",
  color: "#172033",
};

const quickText = {
  margin: 0,
  color: "#667085",
  fontSize: "13px",
  lineHeight: "1.5",
};

const documentActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
};

const sectionStyle = {
  background: "#ffffff",
  border:
    "1px solid #e1eaf3",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "18px",
  boxShadow:
    "0 7px 25px rgba(15,55,90,0.055)",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionEyebrow = {
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  color: "#0057B8",
  marginBottom: "6px",
};

const sectionTitle = {
  color: "#172033",
  margin: 0,
  fontSize: "22px",
  letterSpacing: "-0.25px",
};

const sectionSubtitle = {
  color: "#667085",
  margin: "7px 0 0",
  lineHeight: "1.55",
  fontSize: "14px",
};

const statusActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "12px",
};

const infoCard = {
  background:
    "linear-gradient(180deg, #f8fafc, #f4f7fb)",
  border:
    "1px solid #e5ebf2",
  borderRadius: "12px",
  padding: "15px",
  minWidth: 0,
};

const infoLabel = {
  fontSize: "10px",
  color: "#7b8798",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  fontWeight: "800",
};

const infoValue = {
  color: "#202939",
  fontWeight: "650",
  lineHeight: "1.5",
  wordBreak: "break-word",
  fontSize: "14px",
};

const skillsWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const skillBadge = {
  background: "#eef5ff",
  color: "#0057B8",
  border:
    "1px solid #cfe0f5",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "700",
};

const matchedSkillBadge = {
  background: "#e9f8ef",
  color: "#16803c",
  border:
    "1px solid #bce4ca",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "700",
};

const missingSkillBadge = {
  background: "#fffaf0",
  color: "#8a6500",
  border:
    "1px solid #e5d49c",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "700",
};

const textBox = {
  background:
    "linear-gradient(180deg, #f8fafc, #f4f7fb)",
  border:
    "1px solid #e5ebf2",
  borderRadius: "13px",
  padding: "18px",
  color: "#4b5565",
  lineHeight: "1.8",
  whiteSpace: "pre-wrap",
  fontSize: "14px",
};

const mutedText = {
  color: "#7b8798",
  fontSize: "14px",
};

const analysisScore = {
  fontSize: "32px",
  fontWeight: "900",
};

const analysisGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(250px,1fr))",
  gap: "12px",
};

const analysisCard = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
  border: "1px solid",
  borderRadius: "14px",
  padding: "18px",
};

const analysisIcon = {
  width: "42px",
  height: "42px",
  flex: "0 0 42px",
  borderRadius: "12px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.05)",
};

const analysisText = {
  color: "#505b6b",
  lineHeight: "1.6",
  margin: "7px 0 0",
  fontSize: "13px",
};

const analysisSectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "900",
  fontSize: "15px",
  marginBottom: "11px",
};

const analysisList = {
  margin: 0,
  paddingLeft: "21px",
  color: "#505b6b",
  lineHeight: "1.8",
  fontSize: "13px",
};

const strengthBox = {
  background: "#f4fbf6",
  border:
    "1px solid #ccebd7",
  borderRadius: "14px",
  padding: "17px",
  marginTop: "16px",
};

const analysisSubSection = {
  marginTop: "18px",
};

const missingBox = {
  background: "#fffaf0",
  border:
    "1px solid #f0dfb2",
  borderRadius: "14px",
  padding: "17px",
  marginTop: "16px",
};

const considerationBox = {
  background: "#fffaf0",
  border:
    "1px solid #f0dfb2",
  borderRadius: "14px",
  padding: "17px",
  marginTop: "16px",
};

const documentSection = {
  background:
    "linear-gradient(135deg, #ffffff 0%, #f6faff 100%)",
  border:
    "1px solid #cfe0f3",
  borderRadius: "20px",
  padding: "25px",
  marginBottom: "18px",
  boxShadow:
    "0 9px 28px rgba(0,87,184,0.08)",
};

const documentSectionTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const documentTitle = {
  margin: 0,
  fontSize: "22px",
  color: "#172033",
};

const documentDescription = {
  margin: "7px 0 0",
  color: "#667085",
  lineHeight: "1.55",
  fontSize: "14px",
};

const secureBadge = {
  background: "#eaf3ff",
  color: "#0057B8",
  border:
    "1px solid #c9dcf5",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "800",
};

const documentGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(250px,1fr))",
  gap: "11px",
};

const documentButton = {
  background:
    "linear-gradient(135deg, #0057B8, #0077d9)",
  color: "#fff",
  border: "none",
  borderRadius: "11px",
  padding: "13px 17px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow:
    "0 5px 15px rgba(0,87,184,0.16)",
};

const documentButtonSecondary = {
  background: "#ffffff",
  color: "#0057B8",
  border:
    "1px solid #c9dcf5",
  borderRadius: "11px",
  padding: "13px 17px",
  fontWeight: "800",
  cursor: "pointer",
};

const largeDocumentButton = {
  display: "grid",
  gridTemplateColumns:
    "45px 1fr auto",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  textAlign: "left",
  background: "#ffffff",
  color: "#172033",
  border:
    "1px solid #d8e5f2",
  borderRadius: "14px",
  padding: "14px",
  cursor: "pointer",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.04)",
};

const documentButtonIcon = {
  width: "45px",
  height: "45px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  background: "#eef5ff",
  color: "#0057B8",
  fontSize: "20px",
};

const documentArrow = {
  color: "#0057B8",
  fontSize: "21px",
  fontWeight: "900",
};

const finalAction = {
  background:
    "linear-gradient(135deg, #063f82 0%, #0057B8 55%, #0077d9 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "25px",
  marginTop: "4px",
  boxShadow:
    "0 14px 35px rgba(0,87,184,0.18)",
};

const finalActionContent = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "21px",
};

const finalIcon = {
  width: "48px",
  height: "48px",
  flex: "0 0 48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  background:
    "rgba(255,255,255,0.14)",
  border:
    "1px solid rgba(255,255,255,0.2)",
  fontSize: "22px",
};

const finalEyebrow = {
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "1.2px",
  opacity: 0.72,
  marginBottom: "5px",
};

const finalTitle = {
  margin: 0,
  fontSize: "22px",
};

const finalText = {
  margin: "5px 0 0",
  opacity: 0.84,
  fontSize: "13px",
  lineHeight: "1.5",
};

const finalActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
};

const finalGreenButton = {
  background: "#16803c",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "800",
  cursor: "pointer",
};

const finalRedButton = {
  background: "#c62828",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "800",
  cursor: "pointer",
};

const finalWhiteButton = {
  background: "#fff",
  color: "#0057B8",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "800",
  cursor: "pointer",
};

const loadingShell = {
  maxWidth: "500px",
  margin: "80px auto",
  background: "#fff",
  border:
    "1px solid #dce7f2",
  borderRadius: "20px",
  padding: "45px 25px",
  textAlign: "center",
  boxShadow:
    "0 12px 35px rgba(0,0,0,0.07)",
};

const loadingIcon = {
  fontSize: "38px",
  marginBottom: "12px",
};

const loadingTitle = {
  color: "#0057B8",
  margin: 0,
};

const loadingText = {
  color: "#667085",
  margin: "8px 0 0",
};

const errorBox = {
  maxWidth: "650px",
  margin: "70px auto",
  background: "#fff",
  border:
    "1px solid #e1e8f0",
  borderRadius: "20px",
  padding: "40px 25px",
  textAlign: "center",
  boxShadow:
    "0 12px 35px rgba(0,0,0,0.07)",
};

const errorIcon = {
  fontSize: "45px",
  marginBottom: "12px",
};

const errorTitle = {
  color: "#172033",
  margin: "6px 0 10px",
};

const errorText = {
  color: "#667085",
  lineHeight: "1.7",
  marginBottom: "22px",
};

const primaryButton = {
  background:
    "linear-gradient(135deg, #0057B8, #0077d9)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  fontWeight: "800",
  cursor: "pointer",
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  padding: "22px 4px 0",
  color: "#8793a5",
  fontSize: "12px",
};

const footerBrand = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#0057B8",
};

const footerMark = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "25px",
  height: "25px",
  borderRadius: "7px",
  background: "#0057B8",
  color: "#fff",
  fontSize: "9px",
  fontWeight: "900",
};

function statusButton(background) {
  return {
    background,
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "11px 16px",
    fontWeight: "800",
    cursor: "pointer",
  };
}