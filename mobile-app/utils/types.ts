export type Providers = 'apple' | 'google'

export type Provider = {
  id: string
  name: Providers
  email: string
}

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
  providers: Provider[]
}

export type UsedTags = {
  id: string
  name: string
  used: number
}
