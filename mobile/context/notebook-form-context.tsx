import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { Tag, TagWithCount } from '../utils/types'
import { registerContextResetter } from '../utils/context-manager'
import { useNotebook } from './notebook-context'
import { Alert } from 'react-native'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'

type NotebookFormData = {
  date: Date
  title: string
  body: string
  tags: Tag[]
}

type NotebookFormContextType = {
  notebookFormData: NotebookFormData
  setNotebookFormData: React.Dispatch<React.SetStateAction<NotebookFormData>>
  updateNotebookFormData: (updates: Partial<NotebookFormData>) => void
  resetNotebookFormContext: () => void
  getNotebookData: (entryId: string) => Promise<void>
  userNotebookTags: TagWithCount[]
  setUserNotebookTags: React.Dispatch<React.SetStateAction<TagWithCount[]>>
  isLoading: boolean
}

const NotebookFormContext = createContext<NotebookFormContextType | undefined>(
  undefined
)

type NotebookFormProviderProps = {
  children: ReactNode
}

const getInitialNotebookFormData = (): NotebookFormData => ({
  date: new Date(),
  title: '',
  body: '',
  tags: [],
})

export const NotebookFormProvider = ({
  children,
}: NotebookFormProviderProps) => {
  const [notebookFormData, setNotebookFormData] = useState<NotebookFormData>(
    getInitialNotebookFormData
  )
  const [userNotebookTags, setUserNotebookTags] = useState<TagWithCount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { fetchWithAuth } = useAuth()

  const updateNotebookFormData = (updates: Partial<NotebookFormData>) => {
    setNotebookFormData((prev) => ({ ...prev, ...updates }))
  }

  const resetNotebookFormContext = () => {
    setNotebookFormData(getInitialNotebookFormData())
  }

  const getNotebookData = async (entryId: string) => {
    setIsLoading(true)
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/${entryId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const { title, id, body, tags, date } = await res.json()
      console.log('Fetched notebook entryyyyy:', {
        title,
        id,
        body,
        tags,
        date,
      })
      setNotebookFormData({
        date: new Date(date),
        title,
        body,
        tags,
      })
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    registerContextResetter(
      'resetNotebookFormContext',
      resetNotebookFormContext
    )
  }, [])

  const value = {
    notebookFormData,
    setNotebookFormData,
    updateNotebookFormData,
    resetNotebookFormContext,
    userNotebookTags,
    getNotebookData,
    setUserNotebookTags,
    isLoading,
  }

  return (
    <NotebookFormContext.Provider value={value}>
      {children}
    </NotebookFormContext.Provider>
  )
}

export const useNotebookForm = () => {
  const context = useContext(NotebookFormContext)
  if (!context) {
    throw new Error(
      'useNotebookForm must be used within a NotebookFormProvider'
    )
  }
  return context
}

export type { NotebookFormData }
