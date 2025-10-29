import React from 'react'

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-700 mb-4">
        Last updated: {new Date().getFullYear()}
      </p>

      <p className="mb-4">
        Spotter (“we”, “our”, or “us”) is committed to protecting your privacy.
        This Privacy Policy explains how Spotter handles your information when
        you use our mobile app and companion website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Information We Collect
      </h2>
      <p className="mb-4">
        We use Apple and Google authentication to create and manage your
        account. We may collect your name if your authentication provider does
        not provide one. We do not collect passwords.
      </p>
      <p className="mb-4">
        We store your workout data, exercise logs, and related information in
        our secure cloud database to sync across your devices.
      </p>
      <p className="mb-4">
        We store certain non-personal preferences locally on your device to
        improve usability and navigation speed.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How We Use Your Data</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>To provide and improve Spotter features</li>
        <li>To sync your training and workout history</li>
        <li>To personalize your experience</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Third-Party Services</h2>
      <p className="mb-4">
        We do not sell or share your personal information with advertisers or
        third parties for marketing. We use the OpenAI API to interpret exercise
        names and assign muscle group metadata. Only the necessary data is sent,
        and it is never used for advertising or profile building.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Children’s Privacy</h2>
      <p className="mb-4">
        Spotter is intended for users 13 years of age or older. We do not
        knowingly collect information from children under 13.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Deletion</h2>
      <p className="mb-4">
        You may delete your account at any time from within the app. This will
        permanently remove your account and all associated workout data from our
        database.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Security</h2>
      <p className="mb-4">
        We implement appropriate technical and organizational measures to
        protect your information. However, no method of transmission or
        electronic storage is completely secure.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Changes to This Policy
      </h2>
      <p className="mb-4">
        We may update this Privacy Policy as our practices evolve. We will
        notify you of significant changes by updating this page.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="mb-4">
        If you have questions about this Privacy Policy, please contact us using
        the in-app support form or through our website.
      </p>
    </main>
  )
}
