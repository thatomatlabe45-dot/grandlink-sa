"use client";

export default function Contact() {
  return (
    <section
      style={{
        background: "linear-gradient(to bottom, #ffffff, #f5f9ff)",
        padding: "90px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: "50px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          <span
            style={{
              display: "inline-block",
              background: "#e8f1ff",
              color: "#0057b8",
              padding: "8px 18px",
              borderRadius: "999px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Get in Touch
          </span>

          <h2
            style={{
              color: "#0057b8",
              fontSize: "42px",
              marginBottom: "20px",
            }}
          >
            We'd Love to Hear From You
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: "1.8",
              fontSize: "17px",
              marginBottom: "35px",
            }}
          >
            Whether you're a graduate searching for opportunities or a
            company looking for talented interns, our team is here to help.
          </p>

          <div style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "#003b7a" }}>📧 Email</h3>
            <p style={{ color: "#666" }}>
              support@gradlinksa.co.za
            </p>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "#003b7a" }}>📞 Phone</h3>
            <p style={{ color: "#666" }}>
              +27 XX XXX XXXX
            </p>
          </div>

          <div>
            <h3 style={{ color: "#003b7a" }}>📍 Location</h3>
            <p style={{ color: "#666" }}>
              South Africa
            </p>
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "20px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
            border: "1px solid #e8eef7",
          }}
        >
          <h3
            style={{
              color: "#0057b8",
              marginBottom: "25px",
              fontSize: "28px",
            }}
          >
            Send a Message
          </h3>

          <form>
            <input
              type="text"
              placeholder="Your Name"
              style={inputStyle}
            />

            <input
              type="email"
              placeholder="Email Address"
              style={inputStyle}
            />

            <textarea
              rows="6"
              placeholder="How can we help you?"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px",
                background: "#0057b8",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Send Message →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "18px",
  borderRadius: "12px",
  border: "1px solid #d9e4f2",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};