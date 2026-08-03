"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CompanyProfilePage() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCompany();
    }
  }, [id]);

  async function loadCompany() {
    setLoading(true);

    const { data: companyData, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !companyData) {
      setLoading(false);
      return;
    }

    setCompany(companyData);

    const { data: internshipData } = await supabase
      .from("internships")
      .select("*")
      .eq("company_name", companyData.company_name)
      .order("created_at", { ascending: false });

    setInternships(internshipData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "22px",
          color: "#0057B8",
          fontWeight: "bold",
          background: "#f5f9ff",
        }}
      >
        Loading company...
      </div>
    );
  }

  if (!company) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Company Not Found
          </h2>

          <p style={{ color: "#666" }}>
            The company you're looking for doesn't exist or has been removed.
          </p>

          <Link href="/">
            <button
              style={{
                marginTop: "20px",
                padding: "12px 20px",
                background: "#0057B8",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Back Home
            </button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Company Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "25px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: "#0057B8",
                color: "#fff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "34px",
                fontWeight: "bold",
              }}
            >
              {company.company_name?.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  color: "#0057B8",
                  fontSize: "36px",
                }}
              >
                {company.company_name}
              </h1>

              <p style={{ color: "#555", marginTop: "12px" }}>
                📍 {company.location || "South Africa"}
              </p>

              <p style={{ color: "#555" }}>
                💼 {company.industry || "Industry not specified"}
              </p>

              {company.website && (
                <p style={{ color: "#555" }}>
                  🌐 {company.website}
                </p>
              )}

              {company.email && (
                <p style={{ color: "#555" }}>
                  📧 {company.email}
                </p>
              )}

              {company.phone && (
                <p style={{ color: "#555" }}>
                  📞 {company.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "35px",
          }}
        >
          <h2
            style={{
              color: "#0057B8",
              marginBottom: "20px",
            }}
          >
            About the Company
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: "1.8",
            }}
          >
            {company.description ||
              "This company has not added a description yet."}
          </p>
        </div>

        {/* Internships */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              color: "#0057B8",
              marginBottom: "25px",
            }}
          >
            Current Internship Opportunities
          </h2>

          {internships.length === 0 ? (
            <p style={{ color: "#777" }}>
              No internships have been posted yet.
            </p>
          ) : (
            internships.map((job) => (
              <div
                key={job.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: "14px",
                  padding: "20px",
                  marginBottom: "18px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    color: "#003b7a",
                  }}
                >
                  {job.job_title}
                </h3>

                <p>📍 {job.location}</p>

                <p>🎓 {job.qualification}</p>

                <p>💰 {job.stipend}</p>

                <Link href="/jobs">
                  <button
                    style={{
                      marginTop: "15px",
                      background: "#0057B8",
                      color: "#fff",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                  >
                    View Internship
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}