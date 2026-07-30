"use client";

import Link from "next/link";

export default function FeaturedCompanies({ companies }) {
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
        Featured Companies
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "20px",
        }}
      >
        {companies.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              gridColumn: "1 / -1",
              color: "#666",
            }}
          >
            No companies available yet.
          </p>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{company.company_name}</h3>

              <p>📍 {company.location}</p>
              <p>💼 {company.industry}</p>
              <p>🌐 {company.website}</p>

              <Link href="/company">
                <button
                  style={{
                    marginTop: "15px",
                    background: "#0057b8",
                    color: "#fff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  View Company
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
