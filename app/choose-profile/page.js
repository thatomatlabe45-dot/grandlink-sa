"use client";

import { useRouter } from "next/navigation";

export default function ChooseProfilePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#0057B8",
            fontSize: "40px",
            marginBottom: "10px",
          }}
        >
          Welcome to GradLink SA
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
            marginBottom: "50px",
          }}
        >
          Select how you want to use GradLink SA.
        </p>

        <div
          style={{
            display: "flex",
            gap: "30px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => router.push("/graduate")}
            style={{
              width: "320px",
              background: "#fff",
              borderRadius: "18px",
              padding: "40px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              transition: "0.3s",
            }}
          >
            <div style={{ fontSize: "60px" }}>🎓</div>

            <h2
              style={{
                color: "#0057B8",
                marginTop: "20px",
              }}
            >
              Graduate
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.6",
              }}
            >
              Create your graduate profile, upload your CV, and apply for internships.
            </p>
          </div>

          <div
            onClick={() => router.push("/company")}
            style={{
              width: "320px",
              background: "#fff",
              borderRadius: "18px",
              padding: "40px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              transition: "0.3s",
            }}
          >
            <div style={{ fontSize: "60px" }}>🏢</div>

            <h2
              style={{
                color: "#0057B8",
                marginTop: "20px",
              }}
            >
              Company
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.6",
              }}
            >
              Create a company profile, post internships, and discover talented graduates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
