"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Find the logged-in company's profile
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError || !companyData) {
      setLoading(false);
      return;
    }

    setCompany(companyData);

    // Find internships belonging to this company
    const { data: internships, error: internshipError } = await supabase
      .from("internships")
      .select("id, job_title, company_name")
      .eq("company_name", companyData.company_name);

    if (internshipError || !internships || internships.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const internshipIds = internships.map((internship) => internship.id);

    // Find applications for those internships
    const { data: applicationData, error: applicationError } =
      await supabase
        .from("applications")
        .select("*")
        .in("internship_id", internshipIds)
        .order("created_at", { ascending: false });

    if (!applicationError) {
      const applicationsWithJobs = (applicationData || []).map((application) => {
        const internship = internships.find(
          (job) => job.id === application.internship_id
        );

        return {
          ...application,
          job_title: internship?.job_title || "Internship",
        };
      });

      setApplications(applicationsWithJobs);
    }

    setLoading(false);
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
        }}
      >
        Loading company dashboard...
      </main>
    );
  }

  if (!company) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            textAlign: "center",
            maxWidth: "500px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Company Profile Required
          </h2>

          <p style={{ color: "#666", lineHeight: "1.6" }}>
            Please complete your company profile before accessing the
            dashboard.
          </p>

          <button
            onClick={() => router.push("/company")}
            style={{
              marginTop: "15px",
              background: "#0057B8",
              color: "#fff",
              border: "none",
              padding: "13px 22px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Complete Company Profile
          </button>
        </div>
      </main>
    );
  }

  return (
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
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#0057B8,#0a84ff)",
            color: "#fff",
            borderRadius: "20px",
            padding: "35px",
            marginBottom: "25px",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            🏢 Company Dashboard
          </h1>

          <p style={{ marginBottom: 0, fontSize: "18px" }}>
            Welcome, {company.company_name}
          </p>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={statCard}>
            <div style={{ fontSize: "32px" }}>📋</div>
            <h2>{applications.length}</h2>
            <p>Total Applications</p>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: "32px" }}>👥</div>
            <h2>
              {
                new Set(
                  applications.map((application) => application.graduate_id)
                ).size
              }
            </h2>
            <p>Applicants</p>
          </div>
        </div>

        {/* Applicants */}
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2 style={{ color: "#0057B8", marginTop: 0 }}>
            👥 Applicants
          </h2>

          {applications.length === 0 ? (
            <div
              style={{
                padding: "30px 10px",
                textAlign: "center",
                color: "#777",
              }}
            >
              <div style={{ fontSize: "45px" }}>📭</div>

              <h3>No applications yet</h3>

              <p>
                When graduates apply for your internships, their
                applications will appear here.
              </p>
            </div>
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                style={{
                  border: "1px solid #e1e7ef",
                  borderRadius: "14px",
                  padding: "22px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: "6px",
                        color: "#003b7a",
                      }}
                    >
                      {application.full_name}
                    </h3>

                    <p style={{ margin: "5px 0", color: "#666" }}>
                      💼 {application.job_title}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#eef5ff",
                      color: "#0057B8",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      height: "fit-content",
                      fontWeight: "bold",
                    }}
                  >
                    {application.status || "Pending"}
                  </div>
                </div>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #eee",
                    margin: "18px 0",
                  }}
                />

                <p>
                  <strong>📧 Email:</strong> {application.email}
                </p>

                <p>
                  <strong>📱 Phone:</strong> {application.phone}
                </p>

                <p>
                  <strong>🎓 Qualification:</strong>{" "}
                  {application.qualification}
                </p>

                <p>
                  <strong>💻 Field of Study:</strong>{" "}
                  {application.field_of_study}
                </p>

                <p>
                  <strong>🛠️ Skills:</strong>{" "}
                  {application.skills || "Not provided"}
                </p>

                <p>
                  <strong>🎯 AI Score:</strong>{" "}
                  {application.ai_score ?? 0}
                </p>

                <p
                  style={{
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  Applied:{" "}
                  {application.created_at
                    ? new Date(application.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "25px",
          }}
        >
          <button
            onClick={() => router.push("/internship")}
            style={actionButton}
          >
            🚀 Post Internship
          </button>

          <button
            onClick={() => router.push("/company")}
            style={secondaryButton}
          >
            ⚙️ Edit Company Profile
          </button>
        </div>
      </div>
    </main>
  );
}

const statCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "25px",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,.07)",
};

const actionButton = {
  background: "#0057B8",
  color: "#fff",
  border: "none",
  padding: "14px 20px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  background: "#fff",
  color: "#0057B8",
  border: "2px solid #0057B8",
  padding: "12px 20px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};
