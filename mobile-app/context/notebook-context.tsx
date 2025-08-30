import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Alert } from 'react-native'
import { NotebookEntry } from '../utils/types'
import { useAuth } from './auth-context'
import { useUserStore } from '../stores/user-store'
import { BASE_URL } from '../constants/auth'
import { Tag } from '../utils/types'

type NotebookEntryData = Omit<
  NotebookEntry,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'pinned'
>

type NotebookContextType = {
  currentNotebookEntries: NotebookEntry[]
  isLoading: boolean
  isLoadingMore: boolean
  hasLoaded: boolean
  hasMore: boolean
  initializeNotebook: () => Promise<void>
  refreshEntries: () => Promise<void>
  loadMoreEntries: () => Promise<void>
  updateEntry: (entryId: string, entryToUpdate: NotebookEntryData) => void
  deleteEntry: (entryId: string) => void
  addEntry: (newEntry: NotebookEntryData) => Promise<void>
  pinEntry: (entryId: string) => Promise<void>
  unpinEntry: (entryId: string) => Promise<void>
  fetchTags: () => Promise<(Tag & { used: number })[]>
  applyFiltersAndSort: (tags: Tag[], order: 'asc' | 'desc') => Promise<void>
  tagFilters: Tag[]
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
}

// filters: by tags
// sort by: date (asc, desc)

const NotebookContext = createContext<NotebookContextType | undefined>(
  undefined
)

type NotebookProviderProps = {
  children: ReactNode
}

export const NotebookProvider = ({ children }: NotebookProviderProps) => {
  const { user } = useUserStore()
  const { fetchWithAuth, authUser } = useAuth()
  const [currentNotebookEntries, setCurrentNotebookEntries] = useState<
    NotebookEntry[]
  >([]) // the entries displayed after optional filtering/sorting
  const [isLoading, setIsLoading] = useState(false) // fetching new set of entries
  const [isLoadingMore, setIsLoadingMore] = useState(false) // fetching more entries from scroll
  const [hasLoaded, setHasLoaded] = useState(false) // has the initial data loaded
  const [hasMore, setHasMore] = useState(true) // from pagination data, whether there are more entries to load
  const [currentPage, setCurrentPage] = useState(1) // current page number from pagination data
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // date desc or asc
  const [tagFilters, setTagFilters] = useState<Tag[]>([]) // active tag filters

  const PAGE_SIZE = 25

  const buildQueryParams = (
    page: number,
    tags: Tag[] = tagFilters,
    order: 'asc' | 'desc' = sortOrder,
    resetFilters: boolean = false
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: PAGE_SIZE.toString(),
      sortBy: 'date',
      sortOrder: order,
    })

    if (!resetFilters && tags.length > 0) {
      const tagNames = tags.map((tag) => tag.name)
      params.append('tags', JSON.stringify(tagNames))
    }

    return params.toString()
  }

  const fetchEntries = async (
    page: number = 1,
    append: boolean = false,
    tags: Tag[] = tagFilters,
    order: 'asc' | 'desc' = sortOrder
  ) => {
    if (!user) return

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const queryParams = buildQueryParams(page, tags, order)
      const response = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/user/${user.id}?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (append) {
        setCurrentNotebookEntries((prev) => [...prev, ...data.entries])
      } else {
        setCurrentNotebookEntries(data.entries)
      }

      setHasMore(data.pagination.hasNextPage)
      setCurrentPage(data.pagination.page)
      setHasLoaded(true)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMoreEntries = async () => {
    if (!hasMore || isLoadingMore) return
    await fetchEntries(currentPage + 1, true)
  }

  const fetchTags = async () => {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/notebookEntries/tags/${authUser?.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    const tags = (await response.json()) as (Tag & { used: number })[]
    return tags
  }

  const applyFiltersAndSort = async (tags: Tag[], order: 'asc' | 'desc') => {
    setTagFilters(tags)
    setSortOrder(order)
    setCurrentPage(1)
    setHasMore(true)
    await fetchEntries(1, false, tags, order)
  }

  const initializeNotebook = async () => {
    if (!hasLoaded && !isLoading) {
      await fetchEntries(1, false)
    }
  }

  const refreshEntries = async () => {
    setCurrentPage(1)
    setHasMore(true)
    await fetchEntries(1, false)
  }

  const updateCurrentEntries = (
    entryId: string,
    updates: Partial<NotebookEntry>
  ) => {
    setCurrentNotebookEntries((prev) => {
      const updatedEntries = prev.map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      )

      // Sort: pinned first, then by date according to current sort order
      return updatedEntries.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1

        // Both have same pinned status, sort by date
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })
    })
  }

  const updateEntry = async (
    entryId: string,
    entryToUpdate: NotebookEntryData
  ) => {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/notebookEntries/${entryId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entryToUpdate,
          tags: entryToUpdate.tags.map((tag) => tag.name),
        }),
      }
    )
    const updatedEntry = (await response.json()) as NotebookEntry

    setCurrentNotebookEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, ...updatedEntry } : entry
      )
    )
  }

  const deleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          setIsLoading(true)
          try {
            const response = await fetchWithAuth(
              `${BASE_URL}/api/notebookEntries/${entryId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
            if (response.ok) {
              setCurrentNotebookEntries((prev) =>
                prev.filter((entry) => entry.id !== entryId)
              )
            }
          } catch (error: any) {
            Alert.alert('Error', error.message)
          } finally {
            setIsLoading(false)
          }
        },
        style: 'destructive',
      },
    ])
  }

  const addEntry = async (newEntry: NotebookEntryData) => {
    const response = await fetchWithAuth(`${BASE_URL}/api/notebookEntries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newEntry,
        tags: newEntry.tags.map((tag) => tag.name),
      }),
    })
    await refreshEntries()
  }

  const pinEntry = async (entryId: string) => {
    try {
      await fetchWithAuth(`${BASE_URL}/api/notebookEntries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned: true }),
      })

      updateCurrentEntries(entryId, { pinned: true })
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const unpinEntry = async (entryId: string) => {
    try {
      await fetchWithAuth(`${BASE_URL}/api/notebookEntries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned: false }),
      })

      updateCurrentEntries(entryId, { pinned: false })
    } catch (error) {
      Alert.alert('Error', 'Failed to unpin entry')
    }
  }

  const value: NotebookContextType = {
    currentNotebookEntries,
    isLoading,
    isLoadingMore,
    hasLoaded,
    hasMore,
    initializeNotebook,
    refreshEntries,
    loadMoreEntries,
    updateEntry,
    deleteEntry,
    addEntry,
    pinEntry,
    unpinEntry,
    fetchTags,
    applyFiltersAndSort,
    tagFilters,
    sortOrder,
    setSortOrder,
  }

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  )
}

export const useNotebook = () => {
  const context = useContext(NotebookContext)
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider')
  }
  return context
}
