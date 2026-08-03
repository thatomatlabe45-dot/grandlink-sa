"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg,#0057b8 0%,#0a84ff 100%)",
        color: "#fff",
        padding: "70px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "50px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              padding: "8px 18px",
              borderRadius: "999px",
              marginBottom: "20px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            🇿🇦 South Africa's Graduate Internship Platform
          </div>

          <h1
            style={{
              fontSize: "clamp(2.3rem,6vw,4.2rem)",
              lineHeight: 1.1,
              marginBottom: "20px",
              fontWeight: 800,
            }}
          >
            Launch Your Career
            <br />
            With Confidence.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem,2.5vw,1.25rem)",
              lineHeight: 1.7,
              opacity: 0.95,
              maxWidth: "600px",
            }}
          >
            Discover internships from trusted South African companies,
            create your graduate profile, and get matched with opportunities
            that fit your qualifications.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              marginTop: "35px",
            }}
          >
            <Link href="/jobs">
              <button
                style={{
                  background: "#fff",
                  color: "#0057b8",
                  border: "none",
                  padding: "16px 28px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Find Internships
              </button>
            </Link>

            <Link href="/company">
              <button
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "2px solid #fff",
                  padding: "16px 28px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                For Companies
              </button>
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "18px",
              marginTop: "35px",
              fontWeight: 600,
            }}
          >
            <span>✔ Free for Graduates</span>
            <span>✔ Verified Companies</span>
            <span>✔ AI Matching</span>
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: "22px",
            padding: "30px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 style={{ marginBottom: "25px" }}>Platform Highlights</h2>

          <div style={{ marginBottom: "20px" }}>
            <h3>🎓 Graduate Profiles</h3>
            <p>Create a professional profile and upload your CV.</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>🏢 Company Dashboard</h3>
            <p>Post internships and manage applications in one place.</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>🤖 Smart Matching</h3>
            <p>Help employers find graduates based on skills and qualifications.</p>
          </div>

          <div
            style={{
              marginTop: "30px",
              background: "#fff",
              color: "#0057b8",
              padding: "18px",
              borderRadius: "14px",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            🚀 Your future starts with GradLink SA
          </div>
        </div>
      </div>
    </section>
  );
}