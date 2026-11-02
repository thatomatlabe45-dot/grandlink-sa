"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ChooseProfilePage() {
  const router = useRouter();

  // ----------------------------------------
  // JOB SEEKER
  // Existing database profile: graduate
  // ----------------------------------------

  async function handleGraduate() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Check whether this account already has a company
      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company check error:", companyError);
        alert("Could not check your account. Please try again.");
        return;
      }

      // Existing company account
      if (company) {
        localStorage.setItem("gradlink_profile", "company");
        router.push("/company-dashboard");
        return;
      }

      // Check whether job seeker profile already exists
      const {
        data: graduate,
        error: graduateError,
      } = await supabase
        .from("graduates")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (graduateError) {
        console.error("Job seeker check error:", graduateError);
        alert("Could not check your job seeker profile.");
        return;
      }

      // Keep existing internal profile value
      localStorage.setItem("gradlink_profile", "graduate");

      // Existing or new job seeker
      router.push("/graduate");

    } catch (error) {
      console.error("Job seeker selection error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  // ----------------------------------------
  // COMPANY
  // ----------------------------------------

  async function handleCompany() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Check whether company already exists
      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company check error:", companyError);

        alert(
          "Could not check your company profile. Please try again."
        );

        return;
      }

      localStorage.setItem("gradlink_profile", "company");

      // Existing company
      if (company) {
        router.push("/company-dashboard");
        return;
      }

      // New company
      router.push("/company");

    } catch (error) {
      console.error("Company selection error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f4f8fc, #eaf2ff)",
        fontFamily: "Arial, sans-serif",
        padding: "25px 16px 60px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto 40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#ffffff",
          padding: "18px 20px",
          borderRadius: "14px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            color: "#0057B8",
            fontSize: "25px",
            fontWeight: "800",
            letterSpacing: "-0.5px",
          }}
        >
          GradLink SA
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#dbeafe",
            color: "#0057B8",
            padding: "8px 16px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "15px",
          }}
        >
          YOUR CAREER. YOUR OPPORTUNITY.
        </div>

        <h1
          style={{
            color: "#0057B8",
            fontSize: "clamp(28px, 5vw, 42px)",
            marginBottom: "15px",
            lineHeight: "1.2",
          }}
        >
          Welcome to GradLink SA
        </h1>

        <p
          style={{
            color: "#555",
            fontSize: "17px",
            lineHeight: "1.7",
            maxWidth: "650px",
            margin: "0 auto 15px",
          }}
        >
          Connecting South African job seekers with opportunities
          and employers with talented people.
        </p>

        <p
          style={{
            color: "#0057B8",
            fontSize: "15px",
            fontWeight: "700",
            marginBottom: "40px",
          }}
        >
          Minimum qualification: Grade 12 (Matric)
        </p>

        {/* PROFILE CARDS */}

        <div
          style={{
            display: "flex",
            gap: "25px",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          {/* JOB SEEKER */}

          <div
            onClick={handleGraduate}
            style={{
              flex: "1 1 280px",
              maxWidth: "380px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "30px 25px",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(0,87,184,0.12)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "55px",
                marginBottom: "15px",
              }}
            >
              🎓
            </div>

            <h2
              style={{
                color: "#0057B8",
                fontSize: "25px",
                marginBottom: "15px",
              }}
            >
              Job Seeker
            </h2>

            <p
              style={{
                color: "#555",
                lineHeight: "1.7",
                fontSize: "15px",
                marginBottom: "20px",
              }}
            >
              Have Grade 12 (Matric) or higher and looking for
              your next opportunity?
            </p>

            <div
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: "1.9",
                textAlign: "left",
                marginBottom: "25px",
              }}
            >
              <div>✓ Jobs and employment</div>
              <div>✓ Internships</div>
              <div>✓ Learnerships</div>
              <div>✓ Graduate programmes</div>
            </div>

            <div
              style={{
                background: "#0057B8",
                color: "#ffffff",
                padding: "14px 20px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "15px",
              }}
            >
              Continue as Job Seeker →
            </div>
          </div>

          {/* EMPLOYER */}

          <div
            onClick={handleCompany}
            style={{
              flex: "1 1 280px",
              maxWidth: "380px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "30px 25px",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(0,87,184,0.12)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "55px",
                marginBottom: "15px",
              }}
            >
              🏢
            </div>

            <h2
              style={{
                color: "#0057B8",
                fontSize: "25px",
                marginBottom: "15px",
              }}
            >
              Employer / Company
            </h2>

            <p
              style={{
                color: "#555",
                lineHeight: "1.7",
                fontSize: "15px",
                marginBottom: "20px",
              }}
            >
              Looking to recruit talented people and advertise
              opportunities at your organisation?
            </p>

            <div
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: "1.9",
                textAlign: "left",
                marginBottom: "25px",
              }}
            >
              <div>✓ Post job opportunities</div>
              <div>✓ Advertise internships</div>
              <div>✓ Recruit qualified candidates</div>
              <div>✓ Discover emerging talent</div>
            </div>

            <div
              style={{
                background: "#0f172a",
                color: "#ffffff",
                padding: "14px 20px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "15px",
              }}
            >
              Continue as Employer →
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <p
          style={{
            color: "#777",
            fontSize: "13px",
            marginTop: "40px",
            lineHeight: "1.6",
          }}
        >
          GradLink SA — Empowering South African talent.
        </p>
      </div>
    </div>
  );
}