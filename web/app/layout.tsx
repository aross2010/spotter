import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Spotter',
  description: 'Mobile app to assist your daily lifts.',
}

// #807BCF #cf807b #1a1a1a #f0f0f0

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} min-h-screen bg-[#f0f0f0] text-[#1a1a1a] flex flex-col`}
      >
        {children}
      </body>
    </html>
  )
}
