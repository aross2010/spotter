export type Providers = 'apple' | 'google'

export type UserProviders = {
  provider: Providers
  providerId: string
  userId: string
}[]

export type User = {
  id: string
  firstName: string
  lastName?: string
  email: string
}

export type CompleteUser = {
  id: string
  firstName: string
  lastName?: string
  email: string
  providers: UserProviders
}
