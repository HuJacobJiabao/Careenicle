import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import { AuthProvider } from "@/lib/auth-context"
import AuthGuard from "@/components/AuthGuard"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Careenicle",
  description:
    "Track your job applications, interviews, and career progress with our comprehensive job search management platform.",
  generator: "JobTracker",
  keywords: ["job search", "career", "applications", "interviews", "job tracker"],
  authors: [{ name: "Jiabao Hu" }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans antialiased">
        <AuthProvider>
          <AuthGuard>
            <Header />
            <main className="relative">{children}</main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
