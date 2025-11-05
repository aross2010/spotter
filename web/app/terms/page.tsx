import React from 'react'

export default function TermsPage() {
  const effectiveDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-700 mb-6">Effective date: {effectiveDate}</p>

      <p className="mb-4">
        By using Spotter (“<strong>Spotter</strong>,” “we,” “our,” or “us”), you
        agree to these Terms of Service (“Terms”) and our Privacy Policy. If you
        do not agree, you may not use the app or related services.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Use of Spotter</h2>
      <p className="mb-4">
        Spotter provides tools to track, record, and manage workout information.
        You are responsible for ensuring the accuracy of any data you submit and
        for using the app in a lawful and respectful manner.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Accounts</h2>
      <p className="mb-4">
        To use Spotter, you must sign in using Apple or Google authentication.
        You are responsible for maintaining control of your account and device
        access. We do not store your third-party login credentials.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Subscriptions</h2>
      <p className="mb-4">
        Spotter is currently free to use. We may introduce optional premium
        features in the future. If subscriptions are offered, they will renew
        automatically unless canceled through your App Store or device settings.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. User Content</h2>
      <p className="mb-4">
        You retain all rights to the workout data, exercises, and notes you
        create. By using Spotter, you grant us permission to store and process
        this information solely to provide app functionality, such as syncing
        and data recovery.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Prohibited Conduct</h2>
      <ol className="list-decimal ml-6 space-y-2 mb-4">
        <li>Attempting to disrupt, hack, or misuse the service.</li>
        <li>Reverse engineering or modifying the app code.</li>
        <li>Using Spotter for unlawful or misleading purposes.</li>
        <li>Uploading or sharing content that violates others’ rights.</li>
      </ol>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Termination</h2>
      <p className="mb-4">
        You may delete your account at any time through the app. We reserve the
        right to suspend or terminate accounts that violate these Terms or are
        used abusively. Termination will result in deletion of stored data.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Disclaimer</h2>
      <p className="mb-4">
        Spotter does not provide medical or professional fitness advice. Always
        consult a qualified health professional before beginning any exercise
        program. Use the app at your own risk.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        8. Limitation of Liability
      </h2>
      <p className="mb-4">
        To the maximum extent permitted by law, Spotter and its developers are
        not liable for any injuries, losses, or damages resulting from your use
        of the app or reliance on its data. The app is provided “as is” without
        warranties of any kind.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        9. Changes to These Terms
      </h2>
      <p className="mb-4">
        We may update these Terms periodically. Updated versions will be posted
        within the app or on our website, with a new effective date. Continued
        use of the app after updates constitutes acceptance of the revised
        Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
      <p className="mb-4">
        For questions about these Terms or your account, please contact us at:{' '}
        <a
          className="text-blue-600 underline"
          href="mailto:support@spotterapp.com"
        >
          support@spotterapp.com
        </a>
      </p>
    </main>
  )
}
