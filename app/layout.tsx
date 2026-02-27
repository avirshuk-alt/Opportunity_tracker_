import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { AppLayout } from "@/components/app-layout"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Value Capture Architect",
  description:
    "Enterprise procurement and category strategy platform for authoring strategies, managing suppliers, tracking risks, and governing execution.",
}

export const viewport: Viewport = {
  themeColor: "#1a1f2e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
