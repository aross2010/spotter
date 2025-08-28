import { Alert } from 'react-native'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formatDate } from '../../functions/formatted-date'
import Input from '../../components/input'
import { View } from 'react-native'
import Txt from '../../components/text'
import tw from '../../tw'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Plus } from 'lucide-react-native'
import Colors from '../../constants/colors'
import { useColorScheme, Pressable } from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { NotebookEntry, Tag } from '../../utils/types'
import DatePicker from 'react-native-date-picker'
import { useNotebook } from '../../context/notebook-context'

const NotebookEntryForm = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const { addEntry, updateEntry } = useNotebook()

  const { tags, entryId, entryTitle, entryBody, entryDate, entryTags } =
    useLocalSearchParams()
  const isEditing = !!entryId

  const [data, setData] = useState({
    date: entryDate ? new Date(entryDate as string) : new Date(),
    title: (entryTitle as string) || '',
    body: (entryBody as string) || '',
    tags: entryTags
      ? (JSON.parse(entryTags as string) as Tag[])
      : ([] as Tag[]),
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const { fetchWithAuth, authUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const navigation = useNavigation()
  const selectedTags = tags ? JSON.parse(tags as string) : []

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? 'Edit Entry' : 'New Entry',
      headerRight: () => (
        <Button
          onPress={handleSubmitEntry}
          hitSlop={12}
          accessibilityLabel="submit notebook entry"
          twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          text="Save"
          disabled={data.body.trim().length < 1 || isSaving}
        />
      ),
    })
  }, [navigation, isSaving, data])

  useEffect(() => {
    console.log('in tags dependednt use effect in form')
    console.log('Updating tags:', selectedTags)
    console.log('Current tags:', tags)
    if (tags) {
      console.log('Setting tags:', selectedTags)
      setData((prevData) => ({ ...prevData, tags: selectedTags }))
    }
  }, [tags])

  const handleSubmitEntry = async () => {
    setIsSaving(true)
    try {
      if (isEditing) {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/notebookEntries/${entryId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...data,
              tags: data.tags.map((tag) => tag.name),
            }),
          }
        )
        const updatedEntry = (await response.json()) as NotebookEntry
        updateEntry(entryId as string, updatedEntry)
      } else {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/notebookEntries`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...data,
              tags: data.tags.map((tag) => tag.name),
            }),
          }
        )
        const notebookEntry = (await response.json()) as NotebookEntry
        addEntry(notebookEntry)
      }
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const renderedTags = data.tags.map(({ id, name }, index) => {
    return (
      <View
        key={id}
        style={tw`bg-primary rounded-full px-2 py-0.5`}
      >
        <Txt twcn="text-xs text-light-background dark:text-light-background">
          {name}
        </Txt>
      </View>
    )
  })

  return (
    <SafeView
      noScroll
      inModal
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Button
            text={formatDate(data.date)}
            onPress={() => {
              setIsDatePickerOpen(true)
            }}
            hitSlop={12}
            twcnText="text-xs font-poppinsMedium text-primary uppercase"
          />
        </View>

        <View style={tw`mb-4`}>
          <Input
            editable={!isSaving}
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.nativeEvent.text })}
            placeholder="Entry title (optional)"
            noBorder
            twcnInput="text-base font-poppinsMedium h-10"
          />
        </View>

        <View style={tw`flex-1 mb-4`}>
          <Input
            editable={!isSaving}
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.nativeEvent.text })}
            placeholder="Anything on your mind..."
            multiline
            noBorder
            twcnInput="flex-1"
          />
        </View>

        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText mb-2 self-end">
          {data.body.length} / {500}
        </Txt>

        <View style={tw`mb-4`}>
          {data.tags.length > 0 ? (
            <>
              <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                Tags:
              </Txt>
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: '/tag-selector',
                    params: { existingTags: JSON.stringify(data.tags) },
                  })
                }}
                style={tw`flex-row gap-2 flex-wrap mb-2 py-4 border-b border-light-grayTertiary dark:border-dark-grayTertiary`}
              >
                {renderedTags}
              </Pressable>
            </>
          ) : (
            <View style={tw`gap-4`}>
              <Button
                onPress={() => {
                  router.push({
                    pathname: '/tag-selector',
                    params: { existingTags: JSON.stringify(data.tags) },
                  })
                }}
                twcn="flex-row items-center justify-center p-4 border border-dashed border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg"
                twcnText="text-light-grayText dark:text-dark-grayText text-sm "
                text="Add tags"
              >
                <Plus
                  size={16}
                  color={theme.grayText}
                  strokeWidth={1.5}
                />
              </Button>
            </View>
          )}
        </View>

        <View style={tw`flex-row gap-3`}>
          <Button
            text="Cancel"
            twcn="flex-1 border border-light-grayTertiary dark:border-dark-grayTertiary justify-center items-center rounded-full py-3"
            twcnText="text-light-grayText dark:text-dark-grayText font-poppinsMedium"
            onPress={() => router.back()}
            disabled={isSaving}
          />
          <Button
            text="Save"
            twcn="flex-1 bg-primary justify-center items-center rounded-full py-3"
            twcnText="text-light-background font-poppinsMedium"
            onPress={handleSubmitEntry}
            disabled={data.body.trim().length < 1 || isSaving}
            loading={isSaving}
            loadingText={isEditing ? 'Updating...' : 'Saving...'}
          />
        </View>
      </View>
      <DatePicker
        modal
        open={isDatePickerOpen}
        date={data.date}
        onConfirm={(date) => {
          setIsDatePickerOpen(false)
          setData({ ...data, date })
        }}
        mode="date"
        onCancel={() => {
          setIsDatePickerOpen(false)
        }}
      />
    </SafeView>
  )
}

export default NotebookEntryForm
