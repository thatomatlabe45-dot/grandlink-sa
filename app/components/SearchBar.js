"use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchBar() {
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");
  const [qualification, setQualification] = useState("");

  function handleSearch(e) {
    e.preventDefault();

    const params = new URLSearchParams();

    if (keyword) params.append("search", keyword);
    if (province) params.append("province", province);
    if (qualification) params.append("qualification", qualification);

    window.location.href = `/jobs?${params.toString()}`;
  }

  return (
    <section
      style={{
        background: "#ffffff",
        padding: "50px 30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "#f5f9ff",
          padding: "35px",
          borderRadius: "18px",
          boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057b8",
            marginBottom: "10px",
            fontSize: "36px",
          }}
        >
          🔍 Find Your Dream Internship
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Search internships from companies across South Africa.
        </p>

        <form
          onSubmit={handleSearch}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Job title or keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={inputStyle}
          />

          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Provinces</option>
            <option>Gauteng</option>
            <option>Western Cape</option>
            <option>KwaZulu-Natal</option>
            <option>Eastern Cape</option>
            <option>Free State</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>North West</option>
            <option>Northern Cape</option>
          </select>

          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            style={inputStyle}
          >
            <option value="">Any Qualification</option>
            <option>Matric</option>
            <option>Diploma</option>
            <option>Degree</option>
            <option>Honours</option>
            <option>Masters</option>
          </select>

          <button
            type="submit"
            style={{
              background: "#0057b8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Search
          </button>
        </form>

        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
          }}
        >
          <Link
            href="/jobs"
            style={{
              color: "#0057b8",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            View All Internships →
          </Link>
        </div>
      </div>
    </section>
  );
}

const inputStyle = {
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "15px",
  width: "100%",
  boxSizing: "border-box",
};
