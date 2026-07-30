"use client";

import Link from "next/link";

export default function FeaturedInternships({ internships }) {
  return (
    <section style={{ padding: "40px" }}>
      <h2
        style={{
          textAlign: "center",
          color: "#0057b8",
          marginBottom: "30px",
          fontSize: "36px",
        }}
      >
        Featured Internships
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "20px",
        }}
      >
        {internships.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              gridColumn: "1 / -1",
              color: "#666",
            }}
          >
            No internships available yet.
          </p>
        ) : (
          internships.map((job) => (
            <div
              key={job.id}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{job.job_title}</h3>

              <p>🏢 {job.company_name}</p>
              <p>📍 {job.location}</p>
              <p>🎓 {job.qualification}</p>

              <Link href="/jobs">
                <button
                  style={{
                    marginTop: "15px",
                    background: "#0057b8",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
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
    </section>
  );
}
