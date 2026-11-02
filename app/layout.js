import "./globals.css";

export const metadata = {
  title: "GradLink SA",
  description:
    "Connecting South Africans who have completed Matric with internships, jobs, graduate programmes and career opportunities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}