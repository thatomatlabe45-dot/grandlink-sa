"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GraduateDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------------------------
  // LOAD DASHBOARD
  // ----------------------------------------

  useEffect(() => {
  loadDashboard();
}, [router]);

  async function loadDashboard() {
  setLoading(true);

  try {
    // ----------------------------------------
    // GET LOGGED-IN USER
    // ----------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User error:", userError);

      router.push("/login");
      return;
    }

    setUser(user);

    // ----------------------------------------
    // GET GRADUATE PROFILE
    // ----------------------------------------

    const {
      data: graduate,
      error: graduateError,
    } = await supabase
      .from("graduates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (graduateError) {
      console.error(
        "Graduate profile error:",
        graduateError
      );

      setApplications([]);
      return;
    }

    if (!graduate) {
      console.log("No graduate profile found.");

      setApplications([]);
      return;
    }

    console.log("Graduate ID:", graduate.id);

    // ----------------------------------------
    // GET APPLICATIONS
    // ----------------------------------------

    const {
      data: applicationData,
      error: applicationError,
    } = await supabase
      .from("applications")
      .select("*")
      .eq("graduate_id", graduate.id)
      .order("created_at", {
        ascending: false,
      });

    if (applicationError) {
      console.error(
        "Applications error:",
        applicationError
      );

      setApplications([]);
      return;
    }

    console.log(
      "Applications found:",
      applicationData
    );

    setApplications(applicationData || []);

  } catch (error) {
    console.error(
      "Dashboard loading error:",
      error
    );

    setApplications([]);

  } finally {
    // 🔥 VERY IMPORTANT
    // Always stop loading
    setLoading(false);
  }
}

  // ----------------------------------------
  // REFRESH
  // ----------------------------------------

  async function handleRefresh() {
    setRefreshing(true);

    await loadDashboard();

    setRefreshing(false);
  }

  // ----------------------------------------
  // COUNTS
  // ----------------------------------------

  const totalApplications = applications.length;

  const shortlistedApplications =
    applications.filter(
      (application) =>
        application.status === "Shortlisted"
    ).length;

  const pendingApplications =
    applications.filter(
      (application) =>
        !application.status ||
        application.status === "Pending"
    ).length;

  const rejectedApplications =
    applications.filter(
      (application) =>
        application.status === "Rejected"
    ).length;

  // ----------------------------------------
  // STATUS STYLE
  // ----------------------------------------

  function getStatusStyle(status) {
    if (status === "Shortlisted") {
      return {
        background: "#e8f7ee",
        color: "#16803c",
        icon: "🟢",
      };
    }

    if (status === "Rejected") {
      return {
        background: "#fff0f0",
        color: "#c62828",
        icon: "🔴",
      };
    }

    return {
      background: "#fff7e6",
      color: "#b26a00",
      icon: "🟡",
    };
  }

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <>
        <Navbar />

        <main
          style={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f5f9ff",
            color: "#0057B8",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Loading your dashboard...
        </main>
      </>
    );
  }

  // ----------------------------------------
  // DASHBOARD
  // ----------------------------------------

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          background: "#f5f9ff",
          padding: "30px 20px 60px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              background:
                "linear-gradient(135deg,#0057B8,#0a84ff)",
              color: "#fff",
              borderRadius: "20px",
              padding: "35px",
              marginBottom: "25px",
            }}
          >
            <h1
              style={{
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              🎓 Graduate Dashboard
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "17px",
                lineHeight: "1.6",
              }}
            >
              Track your internship applications
              and recruitment status.
            </p>
          </div>

          {/* STATISTICS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: "18px",
              marginBottom: "30px",
            }}
          >
            {/* APPLICATIONS */}

            <div style={statCard}>
              <div style={{ fontSize: "32px" }}>
                📋
              </div>

              <h2>{totalApplications}</h2>

              <p>Applications</p>
            </div>

            {/* SHORTLISTED */}

            <div style={statCard}>
              <div style={{ fontSize: "32px" }}>
                🟢
              </div>

              <h2
                style={{
                  color: "#16803c",
                }}
              >
                {shortlistedApplications}
              </h2>

              <p>Shortlisted</p>
            </div>

            {/* PENDING */}

            <div style={statCard}>
              <div style={{ fontSize: "32px" }}>
                🟡
              </div>

              <h2
                style={{
                  color: "#b26a00",
                }}
              >
                {pendingApplications}
              </h2>

              <p>Pending</p>
            </div>

            {/* REJECTED */}

            <div style={statCard}>
              <div style={{ fontSize: "32px" }}>
                🔴
              </div>

              <h2
                style={{
                  color: "#c62828",
                }}
              >
                {rejectedApplications}
              </h2>

              <p>Rejected</p>
            </div>
          </div>

          {/* APPLICATIONS */}

          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "30px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,.08)",
            }}
          >
            {/* TITLE + REFRESH */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  color: "#0057B8",
                  margin: 0,
                }}
              >
                📋 My Applications
              </h2>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  background: "#eef5ff",
                  color: "#0057B8",
                  border:
                    "1px solid #0057B8",
                  padding: "10px 16px",
                  borderRadius: "9px",
                  fontWeight: "bold",
                  cursor: refreshing
                    ? "default"
                    : "pointer",
                  opacity: refreshing
                    ? 0.6
                    : 1,
                }}
              >
                {refreshing
                  ? "🔄 Refreshing..."
                  : "🔄 Refresh"}
              </button>
            </div>

            {/* NO APPLICATIONS */}

            {applications.length === 0 ? (
              <div
                style={{
                  padding: "45px 15px",
                  textAlign: "center",
                  color: "#777",
                }}
              >
                <div
                  style={{
                    fontSize: "50px",
                  }}
                >
                  📭
                </div>

                <h3
                  style={{
                    color: "#333",
                  }}
                >
                  No applications yet
                </h3>

                <p>
                  You haven't applied for any
                  internships yet.
                </p>

                <button
                  onClick={() =>
                    router.push("/jobs")
                  }
                  style={{
                    marginTop: "10px",
                    background: "#0057B8",
                    color: "#fff",
                    border: "none",
                    padding: "13px 22px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  🔎 Browse Internships
                </button>
              </div>
            ) : (
              <>
                {/* APPLICATION CARDS */}

                {applications.map(
                  (application, index) => {
                    const statusStyle =
                      getStatusStyle(
                        application.status
                      );

                    return (
                      <div
                        key={application.id}
                        style={{
                          border:
                            "1px solid #e1e7ef",
                          borderRadius: "14px",
                          padding: "22px",
                          marginBottom:
                            "18px",
                        }}
                      >
                        {/* TOP */}

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "15px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize:
                                  "13px",
                                color:
                                  "#888",
                                marginBottom:
                                  "6px",
                              }}
                            >
                              Application #
                              {index + 1}
                            </div>

                            <h3
                              style={{
                                margin:
                                  "0 0 7px",
                                color:
                                  "#003b7a",
                              }}
                            >
                              {application.job_title ||
                                "Internship"}
                            </h3>
                          </div>

                          {/* STATUS */}

                          <div
                            style={{
                              background:
                                statusStyle.background,
                              color:
                                statusStyle.color,
                              padding:
                                "9px 14px",
                              borderRadius:
                                "20px",
                              fontWeight:
                                "bold",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              statusStyle.icon
                            }{" "}
                            {application.status ||
                              "Pending"}
                          </div>
                        </div>

                        <hr
                          style={{
                            border: "none",
                            borderTop:
                              "1px solid #eee",
                            margin:
                              "18px 0",
                          }}
                        />

                        {/* DETAILS */}

                        <p
                          style={{
                            margin:
                              "8px 0",
                          }}
                        >
                          <strong>
                            🎓 Qualification:
                          </strong>{" "}
                          {application.qualification ||
                            "Not provided"}
                        </p>

                        <p
                          style={{
                            margin:
                              "8px 0",
                          }}
                        >
                          <strong>
                            💻 Field of Study:
                          </strong>{" "}
                          {application.field_of_study ||
                            "Not provided"}
                        </p>

                        <p
                          style={{
                            margin:
                              "8px 0",
                          }}
                        >
                          <strong>
                            🛠️ Skills:
                          </strong>{" "}
                          {application.skills ||
                            "Not provided"}
                        </p>

                        {/* AI SCORE */}

                        {application.ai_score !==
                          null &&
                          application.ai_score !==
                            undefined && (
                            <div
                              style={{
                                marginTop:
                                  "18px",
                                background:
                                  "#eef6ff",
                                borderRadius:
                                  "12px",
                                padding:
                                  "15px",
                                color:
                                  "#0057B8",
                                fontWeight:
                                  "bold",
                              }}
                            >
                              🎯 AI Match Score:{" "}
                              {
                                application.ai_score
                              }
                              %
                            </div>
                          )}

                        {/* APPLIED DATE */}

                        <p
                          style={{
                            color:
                              "#888",
                            fontSize:
                              "14px",
                            marginTop:
                              "18px",
                            marginBottom: 0,
                          }}
                        >
                          Applied:{" "}
                          {application.created_at
                            ? new Date(
                                application.created_at
                              ).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    );
                  }
                )}
              </>
            )}
          </div>

          {/* BROWSE BUTTON */}

          {applications.length > 0 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "25px",
              }}
            >
              <button
                onClick={() =>
                  router.push("/jobs")
                }
                style={{
                  background: "#0057B8",
                  color: "#fff",
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🔎 Browse More Internships
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const statCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "25px",
  textAlign: "center",
  boxShadow:
    "0 10px 25px rgba(0,0,0,.07)",
};
