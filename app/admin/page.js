"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [graduates, setGraduates] = useState([]);

  useEffect(() => {
    getGraduates();
  }, []);

  async function getGraduates() {
    const { data, error } = await supabase
      .from("graduates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setGraduates(data);
    }
  }

  async function openDocument(path) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60);

    if (data) {
      window.open(data.signedUrl, "_blank");
    }
  }

  return (
    <main style={{ padding: "30px" }}>
      <h1>GradLink SA Admin Dashboard</h1>

      <h2>Graduate Profiles</h2>

      {graduates.map((person) => (
        <div
          key={person.id}
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            margin: "15px 0",
          }}
        >
          <h3>{person.full_name}</h3>

          <p>Email: {person.email}</p>
          <p>Phone: {person.phone}</p>
          <p>
            Qualification: {person.qualification}
          </p>
          <p>
            Institution: {person.institution}
          </p>

          <button onClick={() => openDocument(person.cv_url)}>
            View CV
          </button>

          {" "}

          <button
            onClick={() =>
              openDocument(person.qualification_url)
            }
          >
            View Qualification
          </button>
        </div>
      ))}
    </main>
  );
}