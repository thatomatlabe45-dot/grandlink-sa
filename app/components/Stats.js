"use client";

export default function Stats({ stats }) {
  return (
    <section
      style={{
        padding: "60px 40px",
        background: "#ffffff",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#0057b8",
          marginBottom: "40px",
          fontSize: "36px",
        }}
      >
        GradLink SA in Numbers
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "25px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <StatCard
          number={stats.graduates}
          label="🎓 Registered Graduates"
        />

        <StatCard
          number={stats.companies}
          label="🏢 Registered Companies"
        />

        <StatCard
          number={stats.internships}
          label="💼 Available Internships"
        />

        <div
          style={{
            background: "#0057b8",
            color: "white",
            borderRadius: "15px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
            100%
          </h1>

          <p>Free for Graduates</p>
        </div>
      </div>
    </section>
  );
}

function StatCard({ number, label }) {
  return (
    <div
      style={{
        background: "#f5f9ff",
        borderRadius: "15px",
        padding: "30px",
        textAlign: "center",
        transition: "0.3s",
      }}
    >
      <h1
        style={{
          color: "#0057b8",
          fontSize: "42px",
          marginBottom: "10px",
        }}
      >
        {number}
      </h1>

      <p>{label}</p>
    </div>
  );
}
