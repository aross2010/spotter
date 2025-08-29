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
  hasLoaded: boolean
  initializeNotebook: () => Promise<void>
  refreshEntries: () => Promise<void>
  updateEntry: (entryId: string, entryToUpdate: NotebookEntryData) => void
  deleteEntry: (entryId: string) => void
  addEntry: (newEntry: NotebookEntryData) => Promise<void>
  pinEntry: (entryId: string) => Promise<void>
  unpinEntry: (entryId: string) => Promise<void>
  fetchTags: () => Promise<(Tag & { used: number })[]>
  applyTagFilters: (tags: Tag[]) => void
  tagFilters: Tag[]
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
  const [allNotebookEntries, setAllNotebookEntries] = useState<NotebookEntry[]>(
    []
  ) // Store all entries
  const [currentNotebookEntries, setCurrentNotebookEntries] = useState<
    NotebookEntry[]
  >([]) // Filtered/displayed entries
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [sortDateOrder, setSortDateOrder] = useState<'asc' | 'desc'>('desc')
  const [tagFilters, setTagFilters] = useState<Tag[]>([])

  const sortEntries = (entries: NotebookEntry[]): NotebookEntry[] => {
    return entries.sort((a, b) => {
      // Pinned entries always come first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

      // Both pinned or both unpinned - sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }

  const fetchEntries = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/user/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const entries = (await response.json()) as NotebookEntry[]
      console.log('Fetched notebook entries:', entries)
      const sortedEntries = sortEntries(entries)
      setAllNotebookEntries(sortedEntries)
      setCurrentNotebookEntries(sortedEntries)
      setHasLoaded(true)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
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

  const applyTagFilters = (tags: Tag[]) => {
    setTagFilters(tags)
    console.log('Applying tag filters in applyTagFilters:', tags)

    if (tags.length === 0) {
      // No filters - show all entries
      setCurrentNotebookEntries(allNotebookEntries)
    } else {
      // Apply filters to the original data
      const tagNames = tags.map((tag) => tag.name)
      const filteredNotebookEntries = allNotebookEntries.filter((entry) =>
        entry.tags.some((tag) => tagNames.includes(tag.name))
      )
      console.log('Filtered notebook entries:', filteredNotebookEntries)
      setCurrentNotebookEntries(filteredNotebookEntries)
    }
  }

  const initializeNotebook = async () => {
    // prevent unnecessary fetches
    if (!hasLoaded && !isLoading) {
      await fetchEntries()
    }
  }

  const refreshEntries = async () => {
    await fetchEntries()
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

    // Update both the full list and filtered list
    setAllNotebookEntries((prev) => {
      const updatedEntries = prev.map((entry) =>
        entry.id === entryId ? { ...entry, ...updatedEntry } : entry
      )
      if ('pinned' in updatedEntry) {
        return sortEntries(updatedEntries)
      }
      return updatedEntries
    })

    setCurrentNotebookEntries((prev) => {
      const updatedEntries = prev.map((entry) =>
        entry.id === entryId ? { ...entry, ...updatedEntry } : entry
      )
      if ('pinned' in updatedEntry) {
        return sortEntries(updatedEntries)
      }
      return updatedEntries
    })
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
            // Only remove from UI if API call was successful
            if (response.ok) {
              setAllNotebookEntries((prev) =>
                prev.filter((entry) => entry.id !== entryId)
              )
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
    const notebookEntry = (await response.json()) as NotebookEntry
    const newEntries = sortEntries([...allNotebookEntries, notebookEntry])
    setAllNotebookEntries(newEntries)

    // Apply current filters to decide if the new entry should be shown
    if (tagFilters.length === 0) {
      setCurrentNotebookEntries(newEntries)
    } else {
      const tagNames = tagFilters.map((tag) => tag.name)
      if (notebookEntry.tags.some((tag) => tagNames.includes(tag.name))) {
        setCurrentNotebookEntries((prev) =>
          sortEntries([...prev, notebookEntry])
        )
      }
    }
  }

  const pinEntry = async (entryId: string) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/${entryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pinned: true }),
        }
      )
      setAllNotebookEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, pinned: true } : entry
        )
      )
      setCurrentNotebookEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, pinned: true } : entry
        )
      )
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const unpinEntry = async (entryId: string) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/${entryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pinned: false }),
        }
      )
      setAllNotebookEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, pinned: false } : entry
        )
      )
      setCurrentNotebookEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, pinned: false } : entry
        )
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to unpin entry')
    }
  }

  const value: NotebookContextType = {
    currentNotebookEntries,
    isLoading,
    hasLoaded,
    initializeNotebook,
    refreshEntries,
    updateEntry,
    deleteEntry,
    addEntry,
    pinEntry,
    unpinEntry,
    fetchTags,
    applyTagFilters,
    tagFilters,
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
