"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const [application, setApplication] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    field_of_study: "",
    skills: "",
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setJobs(data);
  }

  function handleChange(e) {
    setApplication({
      ...application,
      [e.target.name]: e.target.value,
    });
  }

  async function apply() {
    const { error } = await supabase.from("applications").insert([
      {
        internship_id: selectedJob.id,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        qualification: application.qualification,
        field_of_study: application.field_of_study,
        skills: application.skills,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("🎉 Application submitted successfully!");

    setSelectedJob(null);

    setApplication({
      full_name: "",
      email: "",
      phone: "",
      qualification: "",
      field_of_study: "",
      skills: "",
    });
  }

  return (
    <div style={{ background:"#f4f7fb", minHeight:"100vh", padding:"40px 20px" }}>
      <div style={{ maxWidth:"1000px", margin:"auto" }}>
        <h1 style={{ color:"#0057B8" }}>Available Internships</h1>

        {jobs.map(job => (
          <div
            key={job.id}
            style={{
              background:"#fff",
              padding:"25px",
              borderRadius:"14px",
              marginBottom:"20px",
              boxShadow:"0 5px 15px rgba(0,0,0,.08)"
            }}
          >
            <h2>{job.job_title}</h2>

            <p><b>Company:</b> {job.company_name}</p>
            <p><b>Location:</b> {job.location}</p>
            <p><b>Type:</b> {job.internship_type}</p>
            <p><b>Qualification:</b> {job.qualification}</p>
            <p><b>Field:</b> {job.field_of_study}</p>
            <p><b>Stipend:</b> {job.stipend}</p>

            <p>{job.description}</p>

            <button
              onClick={() => setSelectedJob(job)}
              style={{
                marginTop:15,
                padding:"12px 25px",
                background:"#0057B8",
                color:"#fff",
                border:"none",
                borderRadius:"8px",
                cursor:"pointer"
              }}
            >
              Apply Now
            </button>
          </div>
        ))}

        {selectedJob && (
          <div
            style={{
              marginTop:"30px",
              background:"#fff",
              padding:"25px",
              borderRadius:"14px",
              boxShadow:"0 5px 15px rgba(0,0,0,.08)"
            }}
          >
            <h2>Apply for {selectedJob.job_title}</h2>

            <input name="full_name" placeholder="Full Name" value={application.full_name} onChange={handleChange} style={inputStyle} />
            <input name="email" placeholder="Email" value={application.email} onChange={handleChange} style={inputStyle} />
            <input name="phone" placeholder="Phone" value={application.phone} onChange={handleChange} style={inputStyle} />
            <input name="qualification" placeholder="Qualification" value={application.qualification} onChange={handleChange} style={inputStyle} />
            <input name="field_of_study" placeholder="Field of Study" value={application.field_of_study} onChange={handleChange} style={inputStyle} />

            <textarea
              name="skills"
              placeholder="Skills"
              rows={4}
              value={application.skills}
              onChange={handleChange}
              style={inputStyle}
            />

            <button
              onClick={apply}
              style={{
                width:"100%",
                padding:"14px",
                background:"#0057B8",
                color:"#fff",
                border:"none",
                borderRadius:"10px",
                fontSize:"16px",
                cursor:"pointer"
              }}
            >
              Submit Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%",
  padding:"14px",
  marginBottom:"15px",
  border:"1px solid #ccc",
  borderRadius:"10px",
  fontSize:"16px",
  boxSizing:"border-box"
};