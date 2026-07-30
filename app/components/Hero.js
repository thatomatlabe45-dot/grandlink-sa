"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0057b8 0%, #0088ff 100%)",
        color: "white",
        padding: "80px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(350px,1fr))",
          gap: "50px",
          alignItems: "center",
        }}
      >
        {/* Left Side */}
        <div>
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
            }}
          >
            🇿🇦 South Africa's Graduate Internship Platform
          </span>

          <h1
            style={{
              fontSize: "56px",
              lineHeight: "1.1",
              marginTop: "25px",
              marginBottom: "20px",
            }}
          >
            Connecting Graduates
            <br />
            with Opportunities.
          </h1>

          <p
            style={{
              fontSize: "20px",
              opacity: 0.95,
              maxWidth: "600px",
              lineHeight: "1.6",
            }}
          >
            Discover internships, connect with verified companies,
            and launch your career with GradLink SA.
          </p>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "35px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/jobs">
              <button
                style={{
                  background: "#ffffff",
                  color: "#0057b8",
                  border: "none",
                  padding: "16px 30px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                Find Internships
              </button>
            </Link>

            <Link href="/company">
              <button
                style={{
                  background: "transparent",
                  color: "white",
                  border: "2px solid white",
                  padding: "16px 30px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                Register Company
              </button>
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: "25px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            <span>✔ Verified Companies</span>
            <span>✔ Free for Graduates</span>
            <span>✔ AI Matching</span>
          </div>
        </div>

        {/* Right Side */}
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: "20px",
            padding: "35px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 style={{ marginBottom: "25px" }}>
            Why Choose GradLink SA?
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <h3>🎓 Graduates</h3>
            <p>Create your profile and apply for internships.</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>🏢 Companies</h3>
            <p>Find talented graduates across South Africa.</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>🤖 Smart Matching</h3>
            <p>
              Connect graduates with internships based on skills and
              qualifications.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              color: "#0057b8",
              borderRadius: "12px",
              padding: "15px",
              marginTop: "30px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            🚀 Launch Your Career Today
          </div>
        </div>
      </div>
    </section>
  );
}
