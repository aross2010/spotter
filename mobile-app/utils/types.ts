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

export type Tag = {
  id: string
  name: string
  userId: string
}

// for tag selector results
export type UsedTags = {
  id: string
  name: string
  used: number
}

export type NotebookEntry = {
  id: string
  userId: string
  title?: string
  body: string
  date: string
  createdAt: string
  updatedAt?: string
  pinned: boolean
  tags: Tag[]
}
