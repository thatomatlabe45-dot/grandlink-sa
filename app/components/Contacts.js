"use client";

export default function Contact() {
  return (
    <section
      style={{
        background: "#ffffff",
        padding: "80px 30px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(350px,1fr))",
          gap: "50px",
        }}
      >
        {/* Left Side */}
        <div>
          <h2
            style={{
              color: "#0057b8",
              fontSize: "40px",
              marginBottom: "20px",
            }}
          >
            Contact GradLink SA
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: "1.8",
              marginBottom: "35px",
            }}
          >
            Have questions? Need help? We'd love to hear from you.
            Send us a message and we'll get back to you as soon as
            possible.
          </p>

          <div style={{ marginBottom: "25px" }}>
            <h3>📧 Email</h3>
            <p>support@gradlinksa.co.za</p>
          </div>

          <div style={{ marginBottom: "25px" }}>
            <h3>📞 Phone</h3>
            <p>+27 XX XXX XXXX</p>
          </div>

          <div>
            <h3>📍 Location</h3>
            <p>South Africa</p>
          </div>
        </div>

        {/* Right Side */}
        <div
          style={{
            background: "#f5f9ff",
            padding: "30px",
            borderRadius: "16px",
          }}
        >
          <h3
            style={{
              color: "#0057b8",
              marginBottom: "25px",
            }}
          >
            Send us a Message
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
              placeholder="Your Message"
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
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Send Message
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
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "15px",
  boxSizing: "border-box",
};
