"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InternshipPage() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInternship();
    }
  }, [id]);

  async function loadInternship() {
    setLoading(true);

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setJob(data);
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
          background: "#f5f9ff",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        Loading internship...
      </div>
    );
  }

  if (!job) {
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
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Internship Not Found
          </h2>

          <p style={{ color: "#666" }}>
            This internship may have been removed.
          </p>

          <Link href="/jobs">
            <button
              style={{
                marginTop: "20px",
                background: "#0057B8",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Back to Jobs
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
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              color: "#0057B8",
              fontSize: "38px",
            }}
          >
            {job.job_title}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: "15px",
              marginTop: "25px",
            }}
          >
            <p><strong>🏢 Company:</strong> {job.company_name}</p>
            <p><strong>📍 Location:</strong> {job.location}</p>
            <p><strong>💰 Stipend:</strong> {job.stipend || "Not specified"}</p>
            <p><strong>🎓 Qualification:</strong> {job.qualification}</p>
            <p><strong>🕒 Internship Type:</strong> {job.internship_type}</p>
            <p><strong>📅 Closing Date:</strong> {job.deadline}</p>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Internship Description
          </h2>

          <p
            style={{
              lineHeight: "1.9",
              color: "#555",
            }}
          >
            {job.description || "No description has been provided."}
          </p>
        </div>

        {/* Skills */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Skills Required
          </h2>

          <p
            style={{
              lineHeight: "1.8",
              color: "#555",
            }}
          >
            {job.skills || "No skills listed."}
          </p>
        </div>

        {/* Apply */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              color: "#0057B8",
            }}
          >
            Ready to Apply?
          </h2>

          <p
            style={{
              color: "#666",
              marginBottom: "25px",
            }}
          >
            Submit your application and take the next step in your career.
          </p>

          <Link href="/graduate">
            <button
              style={{
                background: "#0057B8",
                color: "#fff",
                border: "none",
                padding: "16px 30px",
                borderRadius: "12px",
                fontSize: "17px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Apply Now
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
