import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 md:px-8 px-4 py-8 sm:py-10 md:py-12 mt-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div>
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Spotter. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-0">
          <Link
            href={'/terms'}
            className="text-xs sm:text-sm font-semibold hover:underline sm:mx-4 mx-2 text-[#807BCF]"
          >
            Terms
          </Link>
          <Link
            href={'/privacy'}
            className="text-xs sm:text-sm font-semibold hover:underline sm:mx-4 mx-2 text-[#807BCF]"
          >
            Privacy
          </Link>
          <Link
            href={'mailto:spotterapphelp@gmail.com'}
            className="text-xs sm:text-sm font-semibold hover:underline sm:mx-4 mx-2 text-[#807BCF]"
          >
            Support
          </Link>
          <Link
            href={'/app-store'}
            className="text-xs sm:text-sm font-semibold hover:underline sm:mx-4 mx-2 text-[#807BCF]"
          >
            Download
          </Link>
        </div>
      </div>
    </footer>
  )
}
