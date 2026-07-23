"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInternships();
  }, []);

  async function fetchInternships() {
    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInternships(data);
      setFilteredInternships(data);
    }
  }

  function handleSearch(value) {
    setSearch(value);

    const results = internships.filter((job) => {
      return (
        job.job_title?.toLowerCase().includes(value.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(value.toLowerCase()) ||
        job.location?.toLowerCase().includes(value.toLowerCase())
      );
    });

    setFilteredInternships(results);
  }

  return (
  
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f5f9ff",
        minHeight: "100vh",
      }}
    >
      {/* Navigation */}

      <nav
        style={{
          background: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 40px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <h2
          style={{
            color: "#0057B8",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          GradLink SA
        </h2>

        <div style={{ display: "flex", gap: "15px" }}>
          <Link href="/login">
            <button
              style={{
                background: "white",
                color: "#0057B8",
                border: "2px solid #0057B8",
                padding: "10px 22px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Login
            </button>
          </Link>

          <Link href="/signup">
            <button
              style={{
                background: "#0057B8",
                color: "white",
                border: "none",
                padding: "10px 22px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Sign Up
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}

      <section
        style={{
          background: "linear-gradient(135deg,#0057B8,#1f8bff)",
          color: "white",
          padding: "100px 30px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "58px",
            marginBottom: "20px",
          }}
        >
          Connecting South African Graduates
          <br />
          with Internship Opportunities
        </h1>

        <p
          style={{
            fontSize: "22px",
            maxWidth: "850px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Discover internships, graduate programmes and entry-level careers.
          GradLink SA connects talented graduates with trusted South African
          employers using smart AI-powered matching.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "45px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/graduate">
            <button
              style={{
                background: "white",
                color: "#0057B8",
                border: "none",
                padding: "18px 35px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "17px",
                cursor: "pointer",
              }}
            >
              🔍 Find Internships
            </button>
          </Link>

          <Link href="/company">
            <button
              style={{
                background: "transparent",
                color: "white",
                border: "2px solid white",
                padding: "18px 35px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "17px",
                cursor: "pointer",
              }}
            >
              🏢 For Companies
            </button>
          </Link>
        </div>
        <div
  style={{
    marginTop: "60px",
    maxWidth: "700px",
    marginInline: "auto",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>
  <input
    type="text"
    placeholder="Search internships..."
    value={search}
    onChange={(e) => handleSearch(e.target.value)}
    style={{
      flex: 1,
      minWidth: "280px",
      padding: "18px",
      borderRadius: "12px",
      border: "none",
      fontSize: "16px",
    }}
  />

  <button
    style={{
      background: "#0d1b2a",
      color: "white",
      border: "none",
      padding: "18px 30px",
      borderRadius: "12px",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    Search
  </button>
</div>
      </section>

      {/* Statistics */}

      <section
        style={{
          maxWidth: "1200px",
          margin: "-45px auto 60px",
          padding: "0 25px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
          }}
        >
          <div style={card}>
            <h1 style={{ color: "#0057B8", marginBottom: "10px" }}>
              10,000+
            </h1>
            <p>Graduates</p>
          </div>

          <div style={card}>
            <h1 style={{ color: "#0057B8", marginBottom: "10px" }}>
              500+
            </h1>
            <p>Companies</p>
          </div>

          <div style={card}>
            <h1 style={{ color: "#0057B8", marginBottom: "10px" }}>
              AI
            </h1>
            <p>Smart Matching</p>
          </div>
        </div>
      </section>

      {/* How It Works */}

      <section
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "70px 30px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057B8",
            fontSize: "40px",
            marginBottom: "50px",
          }}
        >
          How It Works
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "25px",
          }}
        >
          <div style={card}>
            <h2>🎓 Create Profile</h2>

            <p>
              Sign up, upload your CV and build a professional graduate profile
              that showcases your education and skills.
            </p>
          </div>

          <div style={card}>
            <h2>📄 Apply for Internships</h2>

            <p>
              Browse internship opportunities across South Africa and apply
              quickly with your GradLink profile.
            </p>
          </div>

          <div style={card}>
            <h2>🏢 Companies Hire</h2>

            <p>
              Employers discover talented graduates through AI-powered matching
              and invite the best candidates to interview.
            </p>
          </div>
        </div>
      </section>
            {/* Why Choose GradLink SA */}

      <section
        style={{
          padding: "80px 30px",
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057B8",
            fontSize: "40px",
            marginBottom: "50px",
          }}
        >
          Why Choose GradLink SA?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "25px",
          }}
        >
          <div style={card}>
            <h2>🤖 AI Matching</h2>

            <p>
              Our intelligent matching system helps connect graduates with
              internship opportunities that align with their qualifications,
              skills and career goals.
            </p>
          </div>

          <div style={card}>
            <h2>🎓 Verified Profiles</h2>

            <p>
              Build a professional graduate profile with your CV, qualifications
              and achievements so employers can easily discover your talent.
            </p>
          </div>

          <div style={card}>
            <h2>🏢 Trusted Companies</h2>

            <p>
              South African employers can advertise internships, manage
              applications and recruit promising graduates from one platform.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Internships */}

      <section
        style={{
          background: "#eef5ff",
          padding: "80px 30px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057B8",
            fontSize: "40px",
            marginBottom: "50px",
          }}
        >
          Featured Internships
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "25px",
            maxWidth: "1200px",
            margin: "auto",
          }}
        >
          <div style={card}>
            <h3>💻 Software Developer</h3>
            <p>Johannesburg</p>
            <p>Full-Time Internship</p>
          </div>

          {filteredInternships.length === 0 ? (
  <div
    style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      background: "white",
      padding: "40px",
      borderRadius: "15px",
    }}
  >
    <h2>No internships found</h2>
    <p>Companies haven't posted internships yet.</p>
  </div>
) : (
  filteredInternships.slice(0, 6).map((job) => (
    <div key={job.id} style={card}>
      <h3 style={{ color: "#0057B8" }}>
        {job.job_title}
      </h3>

      <p>🏢 {job.company_name}</p>

      <p>📍 {job.location}</p>

      <p>🎓 {job.qualification}</p>

      <p>💰 {job.stipend || "Negotiable"}</p>

      <Link href="/jobs">
        <button
          style={{
            marginTop: "15px",
            background: "#0057B8",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
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

      {/* Ready to Start */}

      <section
        style={{
          padding: "90px 30px",
          textAlign: "center",
          background: "white",
        }}
      >
        <h2
          style={{
            color: "#0057B8",
            fontSize: "44px",
            marginBottom: "20px",
          }}
        >
          Ready to Start?
        </h2>

        <p
          style={{
            fontSize: "20px",
            maxWidth: "700px",
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Join thousands of South African graduates and companies using
          GradLink SA to discover opportunities and build successful careers.
        </p>

        <Link href="/signup">
          <button
            style={{
              background: "#0057B8",
              color: "white",
              border: "none",
              padding: "18px 40px",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </Link>
      </section>

      {/* Footer */}

      <footer
        style={{
          background: "#0d1b2a",
          color: "white",
          textAlign: "center",
          padding: "45px 25px",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>GradLink SA</h2>

        <p style={{ maxWidth: "700px", margin: "0 auto 20px" }}>
          Connecting South African graduates with internship opportunities
          through innovative technology and trusted employer partnerships.
        </p>

        <p style={{ opacity: 0.8 }}>
          © 2026 GradLink SA. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

const card = {
  background: "white",
  borderRadius: "16px",
  padding: "30px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  textAlign: "center",
  transition: "0.3s",
};