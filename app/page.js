import Link from "next/link";

export default function Home() {
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
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <h2
          style={{
            color: "#0057B8",
            margin: 0,
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

      {/* Hero */}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "90px 25px",
          background:
            "linear-gradient(135deg,#0057B8 0%, #0d7cff 100%)",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            marginBottom: "20px",
          }}
        >
          Connecting Graduates With Opportunity
        </h1>

        <p
          style={{
            fontSize: "22px",
            maxWidth: "850px",
            lineHeight: 1.7,
          }}
        >
          GradLink SA helps South African graduates connect with
          companies offering internships, graduate programmes and
          entry-level careers.
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "40px",
            flexWrap: "wrap",
            justifyContent: "center",
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
                fontSize: "17px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🎓 Join as Graduate
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
                fontSize: "17px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🏢 Hire Graduates
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}

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
            marginBottom: "50px",
            fontSize: "38px",
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
            <h3>🤖 AI Candidate Matching</h3>

            <p>
              Smart matching helps employers discover graduates whose
              qualifications align with internship requirements.
            </p>
          </div>

          <div style={card}>
            <h3>🎓 Verified Graduate Profiles</h3>

            <p>
              Graduates upload their CVs and qualifications so employers
              can review verified information.
            </p>
          </div>

          <div style={card}>
            <h3>🏢 Trusted Employers</h3>

            <p>
              Companies can create professional profiles, advertise
              internships and manage applications.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}

      <section
        style={{
          background: "#0057B8",
          color: "white",
          padding: "70px 30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            textAlign: "center",
            gap: "30px",
          }}
        >
          <div>
            <h1>1000+</h1>
            <p>Graduates</p>
          </div>

          <div>
            <h1>200+</h1>
            <p>Companies</p>
          </div>

          <div>
            <h1>500+</h1>
            <p>Internships</p>
          </div>
        </div>
      </section>

      {/* Footer */}

      <footer
        style={{
          background: "#0d1b2a",
          color: "white",
          textAlign: "center",
          padding: "35px",
        }}
      >
        <h2>GradLink SA</h2>

        <p>
          Connecting South African graduates with internship
          opportunities.
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
};