"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ChooseProfilePage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("gradlink_profile");
    router.push("/login");
  }

  // ----------------------------------------
  // GRADUATE
  // ----------------------------------------

  async function handleGraduate() {
    localStorage.setItem("gradlink_profile", "graduate");
    router.push("/graduate");
  }

  // ----------------------------------------
  // COMPANY
  // ----------------------------------------

  async function handleCompany() {
    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Remember that this account is a company
      localStorage.setItem("gradlink_profile", "company");

      // Check whether the company already exists
      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error(
          "Company check error:",
          companyError
        );

        alert(
          "Could not check your company profile. Please try again."
        );

        return;
      }

      // ----------------------------------------
      // EXISTING COMPANY
      // ----------------------------------------

      if (company) {
        router.push("/company-dashboard");
        return;
      }

      // ----------------------------------------
      // NEW COMPANY
      // ----------------------------------------

      router.push("/company");

    } catch (error) {
      console.error("Company selection error:", error);

      alert(
        "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        fontFamily: "Arial, sans-serif",
        padding: "30px 20px 60px",
      }}
    >
      {/* Top Bar */}

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff",
          padding: "15px 20px",
          borderRadius: "14px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            color: "#0057B8",
            fontSize: "24px",
            fontWeight: "800",
          }}
        >
          GradLink SA
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
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
          {/* GRADUATE */}

          <div
            onClick={handleGraduate}
            style={{
              width: "320px",
              background: "#fff",
              borderRadius: "18px",
              padding: "40px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "60px" }}>
              🎓
            </div>

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
              Create your graduate profile, upload your CV,
              and apply for internships.
            </p>
          </div>

          {/* COMPANY */}

          <div
            onClick={handleCompany}
            style={{
              width: "320px",
              background: "#fff",
              borderRadius: "18px",
              padding: "40px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "60px" }}>
              🏢
            </div>

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
              Create a company profile, post internships,
              and discover talented graduates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}