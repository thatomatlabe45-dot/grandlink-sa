"use client";

import Link from "next/link";

export default function FeaturedInternships({ internships = [] }) {
  return (
    <section
      style={{
        padding: "80px 20px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "55px",
          }}
        >
          <h2
            style={{
              color: "#0057b8",
              fontSize: "clamp(2rem,5vw,2.8rem)",
              marginBottom: "15px",
            }}
          >
            🔥 Featured Internships
          </h2>

          <p
            style={{
              color: "#666",
              maxWidth: "650px",
              margin: "0 auto",
              lineHeight: "1.8",
              fontSize: "17px",
            }}
          >
            Explore internship opportunities from companies actively looking
            for talented South African graduates.
          </p>
        </div>

        {internships.length === 0 ? (
          <div
            style={{
              background: "#f8fbff",
              padding: "60px",
              borderRadius: "20px",
              textAlign: "center",
              border: "1px solid #e4eefc",
            }}
          >
            <div
              style={{
                fontSize: "70px",
                marginBottom: "20px",
              }}
            >
              🎓
            </div>

            <h3
              style={{
                color: "#0057b8",
              }}
            >
              No Internships Available
            </h3>

            <p
              style={{
                color: "#666",
              }}
            >
              Companies will appear here once internships are posted.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: "30px",
            }}
          >
            {internships.map((job) => (
              <div
                key={job.id}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "28px",
                  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                  border: "1px solid #e7eef8",
                }}
              >
                {/* Company */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      width: "65px",
                      height: "65px",
                      borderRadius: "50%",
                      background: "#0057b8",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "26px",
                    }}
                  >
                    {(job.company_name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#003b7a",
                      }}
                    >
                      {job.company_name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#777",
                      }}
                    >
                      {job.location || "South Africa"}
                    </p>
                  </div>
                </div>

                <h2
                  style={{
                    color: "#0057b8",
                    fontSize: "24px",
                  }}
                >
                  {job.job_title}
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    margin: "18px 0",
                  }}
                >
                  <Badge text={job.internship_type || "Internship"} />

                  <Badge
                    text={job.qualification || "Any Qualification"}
                  />

                  {job.stipend && (
                    <Badge
                      text={`💰 ${job.stipend}`}
                      color="#e8fff1"
                      textColor="#008a3b"
                    />
                  )}
                </div>

                <p
                  style={{
                    color: "#666",
                    lineHeight: "1.7",
                    minHeight: "70px",
                  }}
                >
                  {job.description?.slice(0, 120) || "No description available."}
                  ...
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "25px",
                  }}
                >
                  <Link
                    href="/jobs"
                    style={{
                      flex: 1,
                    }}
                  >
                    <button
                      style={primaryButton}
                    >
                      View Details
                    </button>
                  </Link>

                  <Link
                    href="/jobs"
                    style={{
                      flex: 1,
                    }}
                  >
                    <button
                      style={secondaryButton}
                    >
                      Apply
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Badge({
  text,
  color = "#eef5ff",
  textColor = "#0057b8",
}) {
  return (
    <span
      style={{
        background: color,
        color: textColor,
        padding: "8px 14px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: "600",
      }}
    >
      {text}
    </span>
  );
}

const primaryButton = {
  width: "100%",
  background: "#0057b8",
  color: "#fff",
  border: "none",
  padding: "14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const secondaryButton = {
  width: "100%",
  background: "#eef5ff",
  color: "#0057b8",
  border: "none",
  padding: "14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};