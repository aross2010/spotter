import { Alert, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { CustomData } from '../../../utils/types'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import Txt from '../../../components/text'
import tw from '../../../tw'
import Button from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import Colors from '../../../constants/colors'
import SafeView from '../../../components/safe-view'
import Input from '../../../components/input'
import { router, useNavigation } from 'expo-router'
import useTheme from '../../hooks/theme'

type NotebookDataToSend = {
  tags?: {
    prevName: string
    newName?: string
    delete?: boolean
  }[]
}

type NotebookData = CustomData['notebooks']

const NotebookData = () => {
  const [loading, setLoading] = useState(true)
  const [notebookData, setNotebookData] = useState<NotebookData | null>(null)
  const [initialNotebookData, setInitialNotebookData] =
    useState<NotebookData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { fetchWithAuth, authUser } = useAuth()
  const navigation = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={tw`flex-row items-center justify-center`}>
            {isSaving ? (
              <Spinner
                twcn="w-9"
                fullScreen={false}
              />
            ) : (
              <Button
                onPress={handleSubmitChange}
                hitSlop={12}
                accessibilityLabel="Save Notebook Data"
                disabled={isSaving || !hasChanges}
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="checkmark"
                  size={26}
                  color={hasChanges ? Colors.primary : theme.grayText}
                />
              </Button>
            )}
          </View>
        )
      },
    })
  }, [hasChanges, isSaving])

  const getNotebookData = async () => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/users/notebookData/${authUser?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const data = await res.json()
      console.log('Fetched notebook data:', JSON.stringify(data, null, 2))
      setNotebookData(data)
      setInitialNotebookData(JSON.parse(JSON.stringify(data)))
    } catch (error: any) {
      console.error('Error fetching notebook data:', error.message)
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getNotebookData()
  }, [])

  useEffect(() => {
    // check if notebookData differs from initialNotebookData
    const changesExist =
      JSON.stringify(notebookData) !== JSON.stringify(initialNotebookData)
    setHasChanges(changesExist)
  }, [notebookData, initialNotebookData])

  const getDataToSend = (): NotebookDataToSend => {
    if (!notebookData || !initialNotebookData) return {}

    const result: NotebookDataToSend = {}

    // Check tags for changes
    const changedTags = notebookData.tags
      .map((item, index) => {
        const initial = initialNotebookData.tags[index]
        if (initial && item.name !== initial.name) {
          return { prevName: initial.name, newName: item.name }
        }
        return null
      })
      .filter(
        (item): item is { prevName: string; newName: string } => item !== null,
      )

    if (changedTags.length > 0) {
      result.tags = changedTags
    }

    return result
  }

  const handleSubmitChange = async () => {
    try {
      setIsSaving(true)
      const data: NotebookDataToSend = getDataToSend()
      const res = await fetchWithAuth(
        `${BASE_URL}/api/users/notebookData/${authUser?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagChange = (index: number, text: string) => {
    if (!notebookData) return

    setNotebookData({
      ...notebookData,
      tags: notebookData.tags.map((item, i) =>
        i === index ? { ...item, name: text } : item,
      ),
    })
  }

  if (loading) return <Spinner />

  if (!notebookData) {
    return (
      <SafeView twcnContentView="items-center justify-center mt-12">
        <Txt twcn="text-center text-base text-light-grayText dark:text-dark-grayText">
          No notebook tags found. Add tags to notebook entries to be able to
          modify them here.
        </Txt>
      </SafeView>
    )
  }

  const renderedNotebookData = (
    <View>
      <Txt twcn="font-semibold text-base mb-2">
        Tags ({notebookData.tags.length})
      </Txt>
      <View style={tw`gap-3`}>
        {notebookData.tags.map((item, index) => {
          const name = item.name
          return (
            <View
              key={`tag-item-${index}`}
              style={tw`flex-row justify-between items-center gap-2`}
            >
              <Input
                value={name}
                onChangeText={(text) => handleTagChange(index, text)}
                maxLength={50}
                fullBorder
                twcnInput="flex-1"
              />
              <View style={tw`items-end w-6`}>
                <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs">
                  {item.used}
                </Txt>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )

  return (
    <SafeView
      scroll
      style={tw`pb-8`}
      keyboardAvoiding
    >
      <Txt twcn="text-light-grayText dark:text-dark-grayText mb-6">
        Modify the names of your notebook tags across all notebook entries using
        them.
      </Txt>
      <View style={tw`gap-6`}>{renderedNotebookData}</View>
    </SafeView>
  )
}

export default NotebookData

const styles = StyleSheet.create({})
