import { APP_SCHEME, BASE_URL } from '@/app/libs/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const incomingParams = new URLSearchParams(request.url.split('?')[1])
  const combinedPlatformAndState = incomingParams.get('state')

  if (!combinedPlatformAndState) {
    return NextResponse.json(
      { error: 'Missing state parameter' },
      { status: 400 }
    )
  }

  const platform = combinedPlatformAndState.split('|')[0]
  const state = combinedPlatformAndState.split('|')[1]

  const outgoingParams = new URLSearchParams({
    code: incomingParams.get('code')?.toString() || '',
    state,
  })

  console.log('Outgoing params: ', outgoingParams.toString())

  return NextResponse.redirect(
    (platform === 'web' ? BASE_URL : APP_SCHEME) +
      '?' +
      outgoingParams.toString()
  )
}
