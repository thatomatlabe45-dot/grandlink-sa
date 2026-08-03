"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0057b8",
        color: "#fff",
        padding: "60px 20px 30px",
        marginTop: "60px",
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          {/* Brand */}
          <div>
            <h2
              style={{
                marginBottom: "15px",
                fontSize: "30px",
              }}
            >
              GradLink SA
            </h2>

            <p
              style={{
                lineHeight: "1.8",
                opacity: 0.9,
              }}
            >
              Connecting South African graduates with internship
              opportunities and helping companies discover future talent.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ marginBottom: "20px" }}>Quick Links</h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <Link href="/" style={linkStyle}>Home</Link>
              <Link href="/jobs" style={linkStyle}>Internships</Link>
              <Link href="/graduate" style={linkStyle}>Graduates</Link>
              <Link href="/company" style={linkStyle}>Companies</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ marginBottom: "20px" }}>Contact</h3>

            <p>📧 support@gradlinksa.co.za</p>
            <p>📍 South Africa</p>
            <p>🌐 www.gradlinksa.co.za</p>
          </div>
        </div>

        <hr
          style={{
            border: 0,
            borderTop: "1px solid rgba(255,255,255,.2)",
            margin: "30px 0",
          }}
        />

        <div
          style={{
            textAlign: "center",
            opacity: 0.85,
            fontSize: "15px",
          }}
        >
          © {new Date().getFullYear()} GradLink SA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  opacity: 0.9,
};
