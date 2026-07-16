"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setJobs(data);
    }
  }

  return (
    <div
      style={{
        background: "#f4f7fb",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "auto" }}>
        <h1 style={{ color: "#0057B8" }}>
          Available Internships
        </h1>

        <p style={{ color: "#666", marginBottom: "30px" }}>
          Discover internship opportunities across South Africa.
        </p>

        {jobs.length === 0 ? (
          <p>No internships available yet.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              style={{
                background: "#fff",
                padding: "25px",
                borderRadius: "14px",
                marginBottom: "20px",
                boxShadow: "0 5px 15px rgba(0,0,0,.08)",
              }}
            >
              <h2>{job.job_title}</h2>

              <p>
                <strong>Company:</strong> {job.company_name}
              </p>

              <p>
                <strong>Location:</strong> {job.location}
              </p>

              <p>
                <strong>Type:</strong> {job.internship_type}
              </p>

              <p>
                <strong>Qualification:</strong> {job.qualification}
              </p>

              <p>
                <strong>Field:</strong> {job.field_of_study}
              </p>

              <p>
                <strong>Stipend:</strong> {job.stipend}
              </p>

              <p>{job.description}</p>

              <button
                style={{
                  marginTop: "15px",
                  padding: "12px 24px",
                  background: "#0057B8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Apply Now
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
