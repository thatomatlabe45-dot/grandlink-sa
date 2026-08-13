"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GraduateDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("graduate_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }

  function getStatusStyle(status) {
    const currentStatus = (
      status || "Pending"
    ).toLowerCase();

    if (currentStatus === "shortlisted") {
      return {
        background: "#e8f7ee",
        color: "#16803c",
        border: "1px solid #16803c",
        icon: "🟢",
      };
    }

    if (currentStatus === "rejected") {
      return {
        background: "#fff0f0",
        color: "#c62828",
        border: "1px solid #c62828",
        icon: "🔴",
      };
    }

    return {
      background: "#fff7e6",
      color: "#b26a00",
      border: "1px solid #f0b429",
      icon: "🟡",
    };
  }

  function getStatusMessage(status) {
    const currentStatus = (
      status || "Pending"
    ).toLowerCase();

    if (currentStatus === "shortlisted") {
      return "Congratulations! You have been shortlisted by the company.";
    }

    if (currentStatus === "rejected") {
      return "Unfortunately, your application was not selected this time.";
    }

    return "Your application is currently being reviewed.";
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Loading your applications...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "25px 15px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
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
            padding: "30px 25px",
            marginBottom: "25px",
            boxShadow:
              "0 10px 30px rgba(0,87,184,.2)",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            🎓 Graduate Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              opacity: 0.95,
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
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div style={statCard}>
            <div style={{ fontSize: "30px" }}>
              📋
            </div>

            <h2
              style={{
                margin: "8px 0 3px",
                color: "#0057B8",
              }}
            >
              {applications.length}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Applications
            </p>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: "30px" }}>
              🟢
            </div>

            <h2
              style={{
                margin: "8px 0 3px",
                color: "#16803c",
              }}
            >
              {
                applications.filter(
                  (application) =>
                    (
                      application.status ||
                      "Pending"
                    ).toLowerCase() ===
                    "shortlisted"
                ).length
              }
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Shortlisted
            </p>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: "30px" }}>
              🟡
            </div>

            <h2
              style={{
                margin: "8px 0 3px",
                color: "#b26a00",
              }}
            >
              {
                applications.filter(
                  (application) =>
                    (
                      application.status ||
                      "Pending"
                    ).toLowerCase() ===
                    "pending"
                ).length
              }
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Pending
            </p>
          </div>
        </div>

        {/* APPLICATIONS */}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "25px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
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
              onClick={loadDashboard}
              style={{
                background: "#eef5ff",
                color: "#0057B8",
                border: "1px solid #0057B8",
                padding: "9px 14px",
                borderRadius: "9px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {applications.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 15px",
                color: "#777",
              }}
            >
              <div
                style={{
                  fontSize: "50px",
                  marginBottom: "10px",
                }}
              >
                📭
              </div>

              <h3
                style={{
                  color: "#555",
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
                style={actionButton}
              >
                🔎 Browse Internships
              </button>
            </div>
          ) : (
            applications.map((application) => {
              const statusStyle =
                getStatusStyle(
                  application.status
                );

              const status =
                application.status ||
                "Pending";

              return (
                <div
                  key={application.id}
                  style={{
                    border:
                      "1px solid #e1e7ef",
                    borderRadius: "15px",
                    padding: "20px",
                    marginBottom: "18px",
                  }}
                >

                  {/* TITLE + STATUS */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "flex-start",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: "7px",
                          color: "#003b7a",
                        }}
                      >
                        {application.job_title ||
                          application.internship_title ||
                          "Internship"}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: "#666",
                        }}
                      >
                        🏢{" "}
                        {application.company_name ||
                          "Company"}
                      </p>
                    </div>

                    {/* STATUS */}

                    <div
                      style={{
                        background:
                          statusStyle.background,
                        color:
                          statusStyle.color,
                        border:
                          statusStyle.border,
                        padding:
                          "9px 14px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {statusStyle.icon}{" "}
                      {status}
                    </div>
                  </div>

                  <hr
                    style={{
                      border: "none",
                      borderTop:
                        "1px solid #eee",
                      margin: "18px 0",
                    }}
                  />

                  {/* APPLICATION DETAILS */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(200px,1fr))",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong>
                        🆔 Application ID
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                          color: "#666",
                          wordBreak:
                            "break-all",
                          fontSize: "14px",
                        }}
                      >
                        {application.id}
                      </p>
                    </div>

                    <div>
                      <strong>
                        🎓 Qualification
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                          color: "#666",
                        }}
                      >
                        {application.qualification ||
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <strong>
                        💻 Field of Study
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                          color: "#666",
                        }}
                      >
                        {application.field_of_study ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* STATUS MESSAGE */}

                  <div
                    style={{
                      marginTop: "18px",
                      padding: "16px",
                      background:
                        statusStyle.background,
                      borderRadius: "12px",
                      color:
                        statusStyle.color,
                    }}
                  >
                    <strong>
                      {status ===
                      "Shortlisted"
                        ? "🎉 Great news!"
                        : status ===
                          "Rejected"
                        ? "Application Update"
                        : "Application Status"}
                    </strong>

                    <p
                      style={{
                        margin:
                          "7px 0 0",
                      }}
                    >
                      {getStatusMessage(
                        status
                      )}
                    </p>
                  </div>

                  {/* APPLIED DATE */}

                  <p
                    style={{
                      color: "#777",
                      fontSize: "14px",
                      marginBottom: 0,
                      marginTop: "18px",
                    }}
                  >
                    📅 Applied:{" "}
                    {application.created_at
                      ? new Date(
                          application.created_at
                        ).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* BROWSE BUTTON */}

        {applications.length > 0 && (
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
            }}
          >
            <button
              onClick={() =>
                router.push("/jobs")
              }
              style={actionButton}
            >
              🔎 Browse More Internships
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const statCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center",
  boxShadow:
    "0 8px 22px rgba(0,0,0,.06)",
};

const actionButton = {
  background: "#0057B8",
  color: "#fff",
  border: "none",
  padding: "13px 20px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};
