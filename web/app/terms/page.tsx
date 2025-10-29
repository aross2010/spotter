import React from 'react'

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-700 mb-4">
        Last updated: {new Date().getFullYear()}
      </p>

      <p className="mb-4">
        By using Spotter, you agree to these Terms of Service (“Terms”) and our
        Privacy Policy. If you do not agree, you may not use the app.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Use of Spotter</h2>
      <p className="mb-4">
        Spotter provides tools to track and manage workout information. You are
        responsible for the accuracy and content of all data you submit.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Accounts</h2>
      <p className="mb-4">
        You must sign in using Apple or Google to use Spotter. You are
        responsible for maintaining access to your account through these
        providers.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Subscriptions</h2>
      <p className="mb-4">
        Spotter is currently free to use. We may offer optional premium
        subscription features in the future. If implemented, subscriptions will
        auto-renew unless canceled through the App Store or your device account
        settings.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">User Content</h2>
      <p className="mb-4">
        You retain all rights to the workout data you create or upload. By using
        Spotter, you grant us permission to store and process that data solely
        to provide app functionality.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Prohibited Conduct</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>Attempting to disrupt or misuse the service</li>
        <li>Reverse engineering or modifying the app</li>
        <li>Using Spotter for unlawful purposes</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Termination</h2>
      <p className="mb-4">
        You may delete your account at any time. We may suspend or terminate
        access for violations of these Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Disclaimer</h2>
      <p className="mb-4">
        Spotter does not provide medical or fitness advice. Consult a qualified
        professional before beginning any exercise program.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Limitation of Liability
      </h2>
      <p className="mb-4">
        To the maximum extent permitted by law, Spotter is not liable for any
        injuries, losses, or damages arising from your use of the app.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Changes to These Terms
      </h2>
      <p className="mb-4">
        We may modify these Terms at any time. Continued use of the app
        indicates acceptance of the updated Terms.
      </p>
    </main>
  )
}
