"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InternshipPage() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileType, setProfileType] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadInternship();
      checkProfile();
    }
  }, [id]);

  // ============================================================
  // LOAD INTERNSHIP
  // ============================================================

  async function loadInternship() {
    setLoading(true);

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setJob(data);
    setLoading(false);
  }

  // ============================================================
  // CHECK USER PROFILE TYPE
  // ============================================================

  async function checkProfile() {
    setCheckingProfile(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfileType(null);
      setCheckingProfile(false);
      return;
    }

    // First check local profile selection
    const savedProfile = localStorage.getItem("gradlink_profile");

    if (savedProfile) {
      setProfileType(savedProfile.toLowerCase());
      setCheckingProfile(false);
      return;
    }

    // If localStorage is unavailable, check database profiles
    const { data: graduate } = await supabase
      .from("graduates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (graduate) {
      setProfileType("graduate");
      setCheckingProfile(false);
      return;
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (company) {
      setProfileType("company");
      setCheckingProfile(false);
      return;
    }

    setProfileType(null);
    setCheckingProfile(false);
  }

  // ============================================================
  // APPLY
  // ============================================================

  async function handleApply() {
    setApplying(true);
    setMessage("");

    // ------------------------------------------------------------
    // CHECK LOGIN
    // ------------------------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please log in before applying.");
      setApplying(false);
      return;
    }

    // ------------------------------------------------------------
    // SECURITY CHECK
    // COMPANY USERS CANNOT APPLY
    // ------------------------------------------------------------

    const savedProfile = localStorage.getItem("gradlink_profile");

    if (savedProfile && savedProfile.toLowerCase() === "company") {
      setMessage("Company accounts cannot apply for internships.");
      setApplying(false);
      return;
    }

    // ------------------------------------------------------------
    // CHECK COMPANY PROFILE DIRECTLY
    // This prevents bypassing the button.
    // ------------------------------------------------------------

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (company) {
      setMessage("Company accounts cannot apply for internships.");
      setApplying(false);
      return;
    }

    // ------------------------------------------------------------
    // GET GRADUATE PROFILE
    // ------------------------------------------------------------

    const { data: graduate, error: graduateError } = await supabase
      .from("graduates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (graduateError || !graduate) {
      setMessage("Please complete your graduate profile first.");
      setApplying(false);
      return;
    }

    // ------------------------------------------------------------
    // DUPLICATE APPLICATION CHECK
    // ------------------------------------------------------------

    const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select("id")
      .eq("graduate_id", graduate.id)
      .eq("internship_id", job.id)
      .maybeSingle();

    if (existingError) {
      setMessage("Unable to check your previous applications.");
      setApplying(false);
      return;
    }

    if (existing) {
      setMessage("You have already applied for this internship.");
      setApplying(false);
      return;
    }

    // ------------------------------------------------------------
    // SAVE APPLICATION
    // ------------------------------------------------------------

    const { error } = await supabase
      .from("applications")
      .insert([
        {
          internship_id: job.id,
          graduate_id: graduate.id,
          full_name: graduate.full_name,
          email: graduate.email,
          phone: graduate.phone,
          qualification: graduate.qualification,
          field_of_study: graduate.field_of_study,
          skills: graduate.skills,
          status: "Pending",
          ai_score: 0,
        },
      ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("🎉 Application submitted successfully!");
    }

    setApplying(false);
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading || checkingProfile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
          color: "#0057B8",
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        Loading internship...
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!job) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f9ff",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Internship Not Found
          </h2>

          <p style={{ color: "#666" }}>
            This internship may have been removed.
          </p>

          <Link href="/jobs">
            <button
              style={{
                marginTop: "20px",
                background: "#0057B8",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Back to Jobs
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              color: "#0057B8",
              fontSize: "38px",
            }}
          >
            {job.job_title}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: "15px",
              marginTop: "25px",
            }}
          >
            <p>
              <strong>🏢 Company:</strong>{" "}
              {job.company_name}
            </p>

            <p>
              <strong>📍 Location:</strong>{" "}
              {job.location}
            </p>

            <p>
              <strong>💰 Stipend:</strong>{" "}
              {job.stipend || "Not specified"}
            </p>

            <p>
              <strong>🎓 Qualification:</strong>{" "}
              {job.qualification}
            </p>

            <p>
              <strong>🕒 Internship Type:</strong>{" "}
              {job.internship_type}
            </p>

            <p>
              <strong>📅 Closing Date:</strong>{" "}
              {job.deadline}
            </p>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Internship Description
          </h2>

          <p
            style={{
              lineHeight: "1.9",
              color: "#555",
            }}
          >
            {job.description ||
              "No description has been provided."}
          </p>
        </div>

        {/* SKILLS */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#0057B8" }}>
            Skills Required
          </h2>

          <p
            style={{
              lineHeight: "1.8",
              color: "#555",
            }}
          >
            {job.skills || "No skills listed."}
          </p>
        </div>

        {/* ======================================================
            GRADUATE APPLY SECTION
            ====================================================== */}

        {profileType === "graduate" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "35px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            }}
          >
            <h2
              style={{
                color: "#0057B8",
              }}
            >
              Ready to Apply?
            </h2>

            <p
              style={{
                color: "#666",
                marginBottom: "25px",
              }}
            >
              Submit your application and take the next
              step in your career.
            </p>

            <button
              onClick={handleApply}
              disabled={applying}
              style={{
                background: "#0057B8",
                color: "#fff",
                border: "none",
                padding: "16px 30px",
                borderRadius: "12px",
                fontSize: "17px",
                fontWeight: "600",
                cursor: applying
                  ? "not-allowed"
                  : "pointer",
                opacity: applying ? 0.7 : 1,
              }}
            >
              {applying
                ? "Applying..."
                : "Apply Now"}
            </button>

            {message && (
              <p
                style={{
                  marginTop: "20px",
                  color: "#0057B8",
                  fontWeight: "bold",
                }}
              >
                {message}
              </p>
            )}
          </div>
        )}

        {/* ======================================================
            COMPANY MESSAGE
            ====================================================== */}

        {profileType === "company" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "35px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,.08)",
              border: "1px solid #e4eefc",
            }}
          >
            <div
              style={{
                fontSize: "45px",
                marginBottom: "15px",
              }}
            >
              🏢
            </div>

            <h2
              style={{
                color: "#0057B8",
                marginBottom: "10px",
              }}
            >
              Company Account
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.7",
                marginBottom: "25px",
              }}
            >
              You are viewing this internship as a
              company. Company accounts can view
              internship opportunities but cannot apply
              for them.
            </p>

            <Link
              href="/jobs"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  background: "#0057B8",
                  color: "#fff",
                  border: "none",
                  padding: "14px 25px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Back to Internships
              </button>
            </Link>
          </div>
        )}

        {/* ======================================================
            NOT LOGGED IN
            ====================================================== */}

        {!profileType && (
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "35px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            }}
          >
            <h2
              style={{
                color: "#0057B8",
              }}
            >
              Interested in this internship?
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.7",
                marginBottom: "25px",
              }}
            >
              Log in as a graduate to apply for this
              opportunity.
            </p>

            <Link
              href="/login"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  background: "#0057B8",
                  color: "#fff",
                  border: "none",
                  padding: "14px 25px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Log In
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}