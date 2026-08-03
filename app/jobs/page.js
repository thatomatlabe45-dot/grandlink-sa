"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data);
    }

    setLoading(false);
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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#0057B8",
            fontSize: "42px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Available Internships
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "40px",
          }}
        >
          Explore internship opportunities from companies across South Africa.
        </p>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#0057B8",
              fontSize: "22px",
            }}
          >
            Loading internships...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: "25px",
            }}
          >
                      {jobs.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#666",
                  fontSize: "18px",
                }}
              >
                No internships available yet.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: "#fff",
                    borderRadius: "18px",
                    padding: "25px",
                    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        color: "#0057B8",
                        marginTop: 0,
                        marginBottom: "15px",
                      }}
                    >
                      {job.job_title}
                    </h2>

                    <p><strong>🏢 Company:</strong> {job.company_name}</p>
                    <p><strong>📍 Location:</strong> {job.location}</p>
                    <p><strong>💼 Type:</strong> {job.internship_type}</p>
                    <p><strong>🎓 Qualification:</strong> {job.qualification}</p>
                    <p><strong>💰 Stipend:</strong> {job.stipend || "Not specified"}</p>

                    <p
                      style={{
                        color: "#555",
                        marginTop: "15px",
                        lineHeight: "1.6",
                      }}
                    >
                      {job.description?.length > 120
                        ? job.description.substring(0, 120) + "..."
                        : job.description}
                    </p>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    style={{
                      marginTop: "20px",
                      textDecoration: "none",
                    }}
                  >
                    <button
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "#0057B8",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "16px",
                        fontWeight: "600",
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
        )}
      </div>
    </main>
  );
}