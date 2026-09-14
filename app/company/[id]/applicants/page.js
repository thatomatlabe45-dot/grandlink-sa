"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [internship, setInternship] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ==========================================================
  // LOAD INTERNSHIP + APPLICANTS
  // ==========================================================

  useEffect(() => {
    if (!id) return;

    loadApplicants();
  }, [id]);

  async function loadApplicants() {
    setLoading(true);
    setMessage("");

    try {
      // ------------------------------------------------------
      // CHECK LOGGED-IN COMPANY
      // ------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ------------------------------------------------------
      // GET COMPANY
      // ------------------------------------------------------

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        setMessage("Company profile not found.");
        setLoading(false);
        return;
      }

      // ------------------------------------------------------
      // GET INTERNSHIP
      // ------------------------------------------------------

      const { data: internshipData, error: internshipError } =
        await supabase
          .from("internships")
          .select("*")
          .eq("id", id)
          .maybeSingle();

      if (internshipError) {
        throw internshipError;
      }

      if (!internshipData) {
        setMessage("Internship not found.");
        setLoading(false);
        return;
      }

      // ------------------------------------------------------
      // SECURITY CHECK
      // Company can only see applicants for its own internship
      // ------------------------------------------------------

      if (
        internshipData.company_name &&
        companyData.company_name &&
        internshipData.company_name !== companyData.company_name
      ) {
        setMessage("You are not authorized to view these applicants.");
        setLoading(false);
        return;
      }

      setInternship(internshipData);

      // ------------------------------------------------------
      // GET APPLICATIONS
      // ------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabase
          .from("applications")
          .select("*")
          .eq("internship_id", id)
          .order("created_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      // ------------------------------------------------------
      // GET GRADUATE PROFILES
      // ------------------------------------------------------

      const graduateIds = [
        ...new Set(
          (applicationData || [])
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

        if (!graduateError && graduateData) {
          graduates = graduateData;
        }
      }

      // ------------------------------------------------------
      // MERGE APPLICATION + GRADUATE INFORMATION
      // ------------------------------------------------------

      const mergedApplications = (applicationData || []).map(
        (application) => {
          const graduate = graduates.find(
            (item) => String(item.id) === String(application.graduate_id)
          );

          return {
            ...application,
            graduateProfile: graduate || null,
          };
        }
      );

      // Highest AI score first
      mergedApplications.sort(
        (a, b) =>
          Number(b.ai_score || 0) - Number(a.ai_score || 0)
      );

      setApplications(mergedApplications);
    } catch (error) {
      console.error("Applicants page error:", error);
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // UPDATE APPLICATION STATUS
  // ==========================================================

  async function updateStatus(applicationId, status) {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) {
        throw error;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status }
            : application
        )
      );
    } catch (error) {
      console.error(error);
      alert("Could not update application status.");
    }
  }

  // ==========================================================
  // AI SCORE LABEL
  // ==========================================================

  function getScoreLabel(score) {
    const value = Number(score || 0);

    if (value >= 85) return "Strong Match";
    if (value >= 70) return "Good Match";
    if (value >= 40) return "Possible Match";
    return "Weak Match";
  }

  function getScoreClass(score) {
    const value = Number(score || 0);

    if (value >= 85) return "strong";
    if (value >= 70) return "good";
    if (value >= 40) return "possible";
    return "weak";
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <h2>Loading applicants...</h2>
          <p>Please wait while we retrieve the applications.</p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (message) {
    return (
      <main style={styles.page}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>!</div>
          <h2>Unable to load applicants</h2>
          <p>{message}</p>

          <Link href="/company" style={styles.primaryButton}>
            Back to Company Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <header style={styles.header}>
          <div>
            <Link href="/company" style={styles.backLink}>
              ← Company Dashboard
            </Link>

            <div style={styles.badge}>
              APPLICATIONS
            </div>

            <h1 style={styles.title}>
              {internship?.job_title || "Internship"}
            </h1>

            <p style={styles.subtitle}>
              {internship?.company_name || "Company"} •{" "}
              {internship?.location || internship?.province || "South Africa"}
            </p>
          </div>

          <div style={styles.countCard}>
            <strong>{applications.length}</strong>
            <span>
              {applications.length === 1
                ? "Applicant"
                : "Applicants"}
            </span>
          </div>
        </header>

        {/* INTERNSHIP SUMMARY */}
        <section style={styles.summary}>
          <div>
            <span style={styles.summaryLabel}>Internship Type</span>
            <strong>
              {internship?.internship_type || "Not specified"}
            </strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Province</span>
            <strong>
              {internship?.province || "Not specified"}
            </strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Deadline</span>
            <strong>
              {internship?.deadline || "Not specified"}
            </strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Stipend</span>
            <strong>
              {internship?.stipend || "Not specified"}
            </strong>
          </div>
        </section>

        {/* NO APPLICATIONS */}
        {applications.length === 0 ? (
          <section style={styles.empty}>
            <div style={styles.emptyIcon}>📋</div>

            <h2>No applications yet</h2>

            <p>
              Applicants who apply for this internship will appear
              here automatically.
            </p>

            <Link href="/company" style={styles.primaryButton}>
              Back to Dashboard
            </Link>
          </section>
        ) : (
          <>
            {/* APPLICANTS */}
            <div style={styles.sectionHeading}>
              <div>
                <h2>Applicants</h2>
                <p>
                  Review candidates who applied for this specific
                  internship.
                </p>
              </div>
            </div>

            <section style={styles.applicantList}>
              {applications.map((application, index) => {
                const graduate = application.graduateProfile;

                const name =
                  application.full_name ||
                  graduate?.full_name ||
                  "Applicant";

                const email =
                  application.email ||
                  graduate?.email ||
                  "Email not available";

                const phone =
                  application.phone ||
                  graduate?.phone ||
                  "Phone not available";

                const qualification =
                  application.qualification ||
                  graduate?.qualification ||
                  "Not specified";

                const field =
                  application.field_of_study ||
                  graduate?.field_of_study ||
                  "Not specified";

                const skills =
                  application.skills ||
                  graduate?.skills ||
                  "Not specified";

                const score = Number(application.ai_score || 0);

                return (
                  <article
                    key={application.id}
                    style={styles.applicantCard}
                  >
                    {/* NUMBER */}
                    <div style={styles.rank}>
                      #{index + 1}
                    </div>

                    {/* MAIN INFORMATION */}
                    <div style={styles.applicantMain}>
                      <div style={styles.nameRow}>
                        <div>
                          <h3>{name}</h3>

                          <p style={styles.email}>
                            {email}
                          </p>
                        </div>

                        <div
                          style={{
                            ...styles.score,
                            ...(score >= 85
                              ? styles.scoreStrong
                              : score >= 70
                              ? styles.scoreGood
                              : score >= 40
                              ? styles.scorePossible
                              : styles.scoreWeak),
                          }}
                        >
                          <strong>{score}%</strong>
                          <span>
                            {getScoreLabel(score)}
                          </span>
                        </div>
                      </div>

                      <div style={styles.infoGrid}>
                        <div>
                          <span>Qualification</span>
                          <strong>{qualification}</strong>
                        </div>

                        <div>
                          <span>Field of Study</span>
                          <strong>{field}</strong>
                        </div>

                        <div>
                          <span>Phone</span>
                          <strong>{phone}</strong>
                        </div>

                        <div>
                          <span>Application Status</span>
                          <strong
                            style={{
                              textTransform: "capitalize",
                            }}
                          >
                            {application.status || "Pending"}
                          </strong>
                        </div>
                      </div>

                      <div style={styles.skills}>
                        <span>Skills</span>
                        <p>{skills}</p>
                      </div>

                      {/* ACTIONS */}
                      <div style={styles.actions}>

                        <button
                          onClick={() =>
                            updateStatus(
                              application.id,
                              "shortlisted"
                            )
                          }
                          style={styles.shortlistButton}
                        >
                          ✓ Shortlist
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              application.id,
                              "rejected"
                            )
                          }
                          style={styles.rejectButton}
                        >
                          ✕ Reject
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              application.id,
                              "pending"
                            )
                          }
                          style={styles.resetButton}
                        >
                          Reset
                        </button>

                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .dummy {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f7faff 0%, #eef5ff 100%)",
    padding: "30px 16px 70px",
    color: "#172033",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "25px",
    marginBottom: "30px",
  },

  backLink: {
    display: "inline-block",
    color: "#1769e0",
    textDecoration: "none",
    fontWeight: "700",
    marginBottom: "18px",
  },

  badge: {
    display: "inline-block",
    background: "#e7f0ff",
    color: "#1769e0",
    padding: "7px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "10px",
  },

  title: {
    fontSize: "clamp(28px, 5vw, 44px)",
    margin: "0 0 8px",
    fontWeight: "850",
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "16px",
  },

  countCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px 25px",
    minWidth: "120px",
    textAlign: "center",
    boxShadow: "0 10px 35px rgba(20, 60, 120, 0.08)",
    border: "1px solid #e5edf8",
  },

  countCardNumber: {
    fontSize: "32px",
  },

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "35px",
  },

  summaryLabel: {
    display: "block",
    fontSize: "12px",
    color: "#718096",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: ".5px",
  },

  summaryItem: {
    background: "#ffffff",
  },

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "40px",
  },

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "40px",
  },

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "40px",
  },

  empty: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "70px 25px",
    textAlign: "center",
    boxShadow: "0 15px 45px rgba(20, 60, 120, 0.08)",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  sectionHeading: {
    marginBottom: "18px",
  },

  applicantList: {
    display: "grid",
    gap: "18px",
  },

  applicantCard: {
    position: "relative",
    display: "flex",
    gap: "18px",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "25px",
    boxShadow: "0 12px 40px rgba(20, 60, 120, 0.08)",
    border: "1px solid #e6edf7",
  },

  rank: {
    color: "#1769e0",
    fontWeight: "900",
    fontSize: "14px",
    minWidth: "35px",
  },

  applicantMain: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  name: {
    margin: 0,
  },

  email: {
    margin: "5px 0 0",
    color: "#718096",
    wordBreak: "break-word",
  },

  score: {
    minWidth: "115px",
    padding: "12px",
    borderRadius: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  scoreStrong: {
    background: "#dcfce7",
    color: "#166534",
  },

  scoreGood: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  scorePossible: {
    background: "#fef3c7",
    color: "#92400e",
  },

  scoreWeak: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "18px",
  },

  infoGridItem: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
  },

  skills: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "15px",
    marginBottom: "20px",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  shortlistButton: {
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 17px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  rejectButton: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "11px 17px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  resetButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    padding: "11px 17px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButton: {
    display: "inline-block",
    marginTop: "20px",
    background: "#1769e0",
    color: "#ffffff",
    textDecoration: "none",
    padding: "13px 20px",
    borderRadius: "11px",
    fontWeight: "800",
  },

  loadingBox: {
    maxWidth: "600px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "50px 25px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 15px 45px rgba(20, 60, 120, 0.08)",
  },

  errorBox: {
    maxWidth: "600px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "50px 25px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 15px 45px rgba(20, 60, 120, 0.08)",
  },

  errorIcon: {
    width: "50px",
    height: "50px",
    lineHeight: "50px",
    borderRadius: "50%",
    margin: "0 auto 15px",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: "900",
    fontSize: "25px",
  },

  spinner: {
    width: "35px",
    height: "35px",
    border: "4px solid #dbeafe",
    borderTop: "4px solid #1769e0",
    borderRadius: "50%",
    margin: "0 auto 20px",
  },
};
