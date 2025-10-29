import React from 'react'
import SpotterSvgLogo from '@/public/spotter-text-logo.svg'
import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <div className="relative flex justify-between items-center h-16 sm:h-18 bg-[#807BCF] md:px-8 px-4 overflow-hidden">
        <SpotterSvgLogo className="h-7 sm:h-8 md:h-10 text-[#f0f0f0]" />
        <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white/50 rounded-full absolute -right-6 sm:-right-8 -top-6 sm:-top-8" />
        <div className="h-4 w-4 sm:h-6 sm:w-6 bg-white/50 rounded-full absolute -left-2 sm:-left-4 -bottom-1 sm:-bottom-2" />
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={'/app-store'}
            className="text-sm font-semibold text-[#f0f0f0] hover:underline md:hidden block"
          >
            Download
          </Link>
          <Link
            href={'/app-store'}
            className="text-sm font-semibold text-[#f0f0f0] hover:underline md:block hidden"
          >
            iOS Download
          </Link>
          <Link
            href={'/terms'}
            className="text-sm font-semibold text-[#f0f0f0] hover:underline md:block hidden"
          >
            Terms
          </Link>
          <Link
            href={'/privacy'}
            className="text-sm font-semibold text-[#f0f0f0] hover:underline md:block hidden"
          >
            Privacy
          </Link>
        </div>
      </div>
    </nav>
  )
}
