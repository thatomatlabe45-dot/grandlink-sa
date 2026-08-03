"use client";

import Link from "next/link";

export default function FeaturedCompanies({ companies = [] }) {
  return (
    <section
      style={{
        padding: "70px 20px",
        background: "#f8fbff",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057b8",
            fontSize: "38px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          🏢 Featured Companies
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "18px",
            maxWidth: "650px",
            margin: "0 auto 50px",
            lineHeight: "28px",
          }}
        >
          Discover companies actively recruiting talented South African graduates.
        </p>

        {companies.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "50px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "60px",
                marginBottom: "15px",
              }}
            >
              🏢
            </div>

            <h3
              style={{
                color: "#0057b8",
              }}
            >
              No Companies Yet
            </h3>

            <p
              style={{
                color: "#666",
              }}
            >
              Companies that register on GradLink SA will automatically appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
            }}
          >
            {companies.map((company) => (
              <div
                key={company.id}
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  padding: "25px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  border: "1px solid #e5eefb",
                  transition: "0.3s",
                }}
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    background: "#0057b8",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "bold",
                    marginBottom: "20px",
                  }}
                >
                  {(company.company_name || "?").charAt(0).toUpperCase()}
                </div>

                <h3
                  style={{
                    color: "#003b7a",
                    marginBottom: "15px",
                    fontSize: "24px",
                  }}
                >
                  {company.company_name}
                </h3>

                <p style={{ color: "#555", marginBottom: "10px" }}>
                  📍 <strong>Location:</strong>{" "}
                  {company.location || company.province || "South Africa"}
                </p>

                <p style={{ color: "#555", marginBottom: "10px" }}>
                  💼 <strong>Industry:</strong>{" "}
                  {company.industry || "Not specified"}
                </p>

                <p
                  style={{
                    color: "#555",
                    marginBottom: "10px",
                    wordBreak: "break-word",
                  }}
                >
                  🌐 <strong>Website:</strong>{" "}
                  {company.website || "Coming soon"}
                </p>

                {company.email && (
                  <p
                    style={{
                      color: "#555",
                      marginBottom: "20px",
                      wordBreak: "break-word",
                    }}
                  >
                    📧 <strong>Email:</strong> {company.email}
                  </p>
                )}

                <Link href="/company">
                  <button
                    style={{
                      width: "100%",
                      background: "#0057b8",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "10px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    View Company
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}