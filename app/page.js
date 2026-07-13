import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "Arial", margin: 0 }}>
      <section
        style={{
          background: "#0b5ed7",
          color: "white",
          minHeight: "100vh",
          padding: "30px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "42px", marginTop: "80px" }}>
          GradLink SA
        </h1>

        <h2 style={{ fontSize: "28px", marginTop: "40px" }}>
          Connecting South African graduates with opportunities.
        </h2>

        <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
          Build your graduate profile, discover internships and connect with
          companies looking for emerging talent.
        </p>

        <Link href="/graduate">
          <button
            style={{
              marginTop: "30px",
              padding: "16px 28px",
              borderRadius: "8px",
              border: "none",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Join as a Graduate
          </button>
        </Link>

        <br />

        <Link href="/company">
          <button
            style={{
              marginTop: "15px",
              padding: "16px 28px",
              borderRadius: "8px",
              border: "2px solid white",
              background: "transparent",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Join as a Company
          </button>
        </Link>
      </section>
    </main>
  );
}