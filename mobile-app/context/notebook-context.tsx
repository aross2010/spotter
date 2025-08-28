import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Alert } from 'react-native'
import { NotebookEntry } from '../utils/types'
import { useAuth } from './auth-context'
import { useUserStore } from '../stores/user-store'
import { BASE_URL } from '../constants/auth'

type NotebookContextType = {
  notebookEntries: NotebookEntry[]
  isLoading: boolean
  hasLoaded: boolean
  initializeNotebook: () => Promise<void>
  refreshEntries: () => Promise<void>
  updateEntry: (entryId: string, updatedEntry: Partial<NotebookEntry>) => void
  deleteEntry: (entryId: string) => void
  addEntry: (newEntry: NotebookEntry) => void
  pinEntry: (entryId: string) => Promise<void>
  unpinEntry: (entryId: string) => Promise<void>
}

const NotebookContext = createContext<NotebookContextType | undefined>(
  undefined
)

type NotebookProviderProps = {
  children: ReactNode
}

export const NotebookProvider = ({ children }: NotebookProviderProps) => {
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Helper function to sort entries: pinned first, then by date (newest first)
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
      setNotebookEntries(sortEntries(entries))
      setHasLoaded(true)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
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

  const updateEntry = (
    entryId: string,
    updatedEntry: Partial<NotebookEntry>
  ) => {
    console.log(updatedEntry, 'ewfew')
    setNotebookEntries((prev) => {
      const updatedEntries = prev.map((entry) =>
        entry.id === entryId ? { ...entry, ...updatedEntry } : entry
      )
      if ('pinned' in updatedEntry) {
        return sortEntries(updatedEntries)
      }

      console.log('Updated entries: ', updatedEntry) // --- IGNORE ---

      return updatedEntries
    })
  }

  const deleteEntry = (entryId: string) => {
    setNotebookEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const addEntry = (newEntry: NotebookEntry) => {
    setNotebookEntries((prev) => sortEntries([...prev, newEntry]))
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
      updateEntry(entryId, { pinned: true })
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

      if (response.ok) {
        updateEntry(entryId, { pinned: false })
      }
    } catch (error) {
      console.error('Error unpinning entry:', error)
      Alert.alert('Error', 'Failed to unpin entry')
    }
  }

  const value: NotebookContextType = {
    notebookEntries,
    isLoading,
    hasLoaded,
    initializeNotebook,
    refreshEntries,
    updateEntry,
    deleteEntry,
    addEntry,
    pinEntry,
    unpinEntry,
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
