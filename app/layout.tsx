import type { Metadata } from "next";
import PortfolioAnalyticsScript from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.matrixloop.app"),
  title: {
    default: "MatrixLoop | Meta Advertising Performance Workspace",
    template: "%s | MatrixLoop",
  },
  description:
    "MatrixLoop is an early-stage workspace for connecting Meta advertising accounts and reviewing campaigns, performance metrics, and account recommendations.",
  applicationName: "MatrixLoop",
  alternates: { canonical: "https://www.matrixloop.app/" },
  openGraph: {
    type: "website",
    url: "https://www.matrixloop.app/",
    siteName: "MatrixLoop",
    title: "MatrixLoop | Meta Advertising Performance Workspace",
    description:
      "An early-stage workspace for reviewing connected Meta ad accounts, campaigns, and performance metrics.",
  },
  twitter: {
    card: "summary",
    title: "MatrixLoop | Meta Advertising Performance Workspace",
    description:
      "An early-stage workspace for reviewing connected Meta ad accounts, campaigns, and performance metrics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PortfolioAnalyticsScript id="portfolio-analytics-v1" src="https://isaiahdupreeapps.com/assets/portfolio-analytics-v1.js" data-site="matrixloop-app" strategy="afterInteractive" />
      </body>
    </html>
  );
}
