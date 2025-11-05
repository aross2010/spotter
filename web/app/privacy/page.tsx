import React from 'react'

export default function PrivacyPolicyPage() {
  const effectiveDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-700 mb-6">Effective date: {effectiveDate}</p>

      <p className="mb-4">
        Spotter (“<strong>Spotter</strong>,” “we,” “our,” or “us”) provides a
        mobile app and companion website for tracking weightlifting workouts.
        This Privacy Policy explains what information we collect, how we use it,
        how it’s shared, and your choices. This policy applies when you use our
        app, website, or contact us.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        1. Information We Collect
      </h2>
      <ol className="list-decimal ml-6 space-y-2 mb-4">
        <li>
          <strong>Account & Authentication:</strong> We use Apple Sign-In and
          Google Sign-In to create and manage your account. These providers
          supply basic identifiers (e.g., name, email). We do not collect or
          store your password.
        </li>
        <li>
          <strong>Workout Content You Provide:</strong> Exercises, sets/reps,
          weights, RPE/RIR, tags, notes, and other training data you log.
        </li>
        <li>
          <strong>App Preferences:</strong> Theme, units (lbs/kg), intensity
          units (RPE/RIR), and other local settings to improve usability.
        </li>
        <li>
          <strong>Device & Usage Data:</strong> Basic diagnostic data (e.g., app
          version, device type) and performance data to keep Spotter reliable.
        </li>
        <li>
          <strong>Optional Location Metadata:</strong> If you record where a
          workout occurred, that text is stored with your workout entry.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        2. How We Use Information
      </h2>
      <ol className="list-decimal ml-6 space-y-2 mb-4">
        <li>To provide, maintain, and improve Spotter’s features.</li>
        <li>To sync your workouts and preferences across devices.</li>
        <li>To personalize your experience (e.g., defaults, recent items).</li>
        <li>To secure accounts and prevent fraud or abuse.</li>
        <li>
          To respond to support requests and communicate important updates.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Processing Basis</h2>
      <p className="mb-4">
        Where applicable (e.g., EU/UK), we process your information based on:
        (i) <strong>contractual necessity</strong> (to provide the app), (ii){' '}
        <strong>legitimate interests</strong> (app security, improvement), and
        (iii) <strong>your consent</strong> where required (e.g., optional
        features). You can withdraw consent at any time in the app settings (if
        applicable) or by contacting us.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        4. Data Storage & Retention
      </h2>
      <p className="mb-4">
        Workout data and account information are stored in our secure cloud
        database to enable sync across your devices. We retain your information
        while your account is active. If you delete your account, we permanently
        delete your profile and associated workout data from our primary systems
        within a reasonable period, subject to any legal obligations.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        5. Third-Party Services
      </h2>
      <p className="mb-4">
        We do not sell or share your personal information with advertisers. We
        use trusted processors solely to operate and improve Spotter:
      </p>
      <ol className="list-decimal ml-6 space-y-2 mb-4">
        <li>
          <strong>Authentication:</strong> Apple Sign-In and Google Sign-In
          (receive basic identifiers to create your account).
        </li>
        <li>
          <strong>Model/Classification:</strong> We use an API service to
          interpret exercise names and assign muscle-group metadata. Only the
          minimal text necessary for classification is sent; we do not include
          user identifiers in these requests.
        </li>
        <li>
          <strong>Cloud Database/Hosting:</strong> A reputable cloud provider
          stores your workout data for sync and backup.
        </li>
      </ol>
      <p className="mb-4">
        Each provider processes data on our behalf and is contractually limited
        to using it only to provide their service to Spotter. Refer to their
        respective privacy policies for more details.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        6. International Transfers
      </h2>
      <p className="mb-4">
        If data is transferred outside your country or region, we use
        appropriate safeguards (e.g., standard contractual clauses) where
        required by law to protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        7. Your Rights & Choices
      </h2>
      <ol className="list-decimal ml-6 space-y-2 mb-4">
        <li>
          <strong>Access & Portability:</strong> Request a copy of your data.
        </li>
        <li>
          <strong>Correction:</strong> Update or correct inaccurate information.
        </li>
        <li>
          <strong>Deletion:</strong> Delete your account in-app to remove your
          workout data from our database.
        </li>
        <li>
          <strong>Objection/Restriction:</strong> Where applicable, object to or
          request restriction of certain processing.
        </li>
      </ol>
      <p className="mb-4">
        To exercise any of these rights, use the in-app support form or contact
        us at the email below. We may need to verify your identity before
        fulfilling a request.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Children’s Privacy</h2>
      <p className="mb-4">
        Spotter is intended for users aged 13 and above. We do not knowingly
        collect personal information from children under 13. If you believe a
        child has provided us personal information, contact us to request
        deletion.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Security</h2>
      <p className="mb-4">
        We implement technical and organizational measures designed to protect
        your information. No method of transmission or storage is 100% secure,
        but we work to continuously improve safeguards.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        10. California Privacy Notice
      </h2>
      <p className="mb-4">
        If you are a California resident, you may have rights under the
        CCPA/CPRA, including the rights to know, delete, correct, and opt out of
        certain sharing. Spotter does not sell personal information. To exercise
        your rights, contact us using the details below.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        11. Changes to This Policy
      </h2>
      <p className="mb-4">
        We may update this Privacy Policy to reflect changes to our practices.
        We will post the updated policy here with a new effective date. Material
        changes may also be communicated in-app.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact</h2>
      <p className="mb-1">
        For questions or requests about this Privacy Policy, contact:
      </p>
      <p className="mb-6">
        <strong>Email:</strong>{' '}
        <a
          className="text-blue-600 underline"
          href="mailto:support@spotterapp.com"
        >
          support@spotterapp.com
        </a>
      </p>

      <hr className="my-8" />
    </main>
  )
}
