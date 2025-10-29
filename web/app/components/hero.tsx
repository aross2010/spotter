import React from 'react'
import iosAppIcon from '@/public/ios-light.png'
import AppStoreIcon from '@/public/app-store.svg'
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="flex flex-col items-center lg:mt-16 md:mt-10 mt-6 w-full h-full px-4">
      <Image
        src={iosAppIcon}
        alt="iOS App Icon"
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl shadow-lg"
      />
      <div className="max-w-[700px] flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center leading-tight sm:leading-snug md:leading-18">
          Your Workouts, Your Way
        </h1>
        <h2 className="text-base sm:text-lg md:text-xl text-center text-gray-600 mt-4 sm:mt-6 md:mt-8 w-full max-w-[500px] px-4">
          A simple, powerful workout tracker designed for weightlifters
        </h2>
        <Link
          href="/app-store"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 sm:mt-8"
        >
          <AppStoreIcon className="h-10 sm:h-12 md:h-auto hover:opacity-80 transition-opacity cursor-pointer" />
        </Link>

        <span className="text-xs text-gray-500 mt-2">
          Coming soon to Google Play
        </span>
      </div>
    </section>
  )
}
