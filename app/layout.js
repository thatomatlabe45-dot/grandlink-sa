export const metadata = {
  title: "GradLink SA",
  description: "Connecting South African graduates with internship opportunities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}