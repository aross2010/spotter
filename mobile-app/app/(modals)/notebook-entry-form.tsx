import { Alert, KeyboardAvoidingView, Platform } from 'react-native'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formatDate } from '../../functions/formatted-date'
import Input from '../../components/input'
import { View } from 'react-native'
import Txt from '../../components/text'
import tw from '../../tw'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { ArrowRight, Plus } from 'lucide-react-native'
import Colors from '../../constants/colors'
import { useColorScheme } from 'react-native'
import { useState, useEffect } from 'react'
import { Tag } from '../../utils/types'
import DatePicker from 'react-native-date-picker'
import { useNotebook } from '../../context/notebook-context'
import TagView from '../../components/tag'
import { Tag as TagIcon } from 'lucide-react-native'

const NotebookEntryForm = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const { addEntry, updateEntry } = useNotebook()

  const { tags, entryId, entryTitle, entryBody, entryDate, entryTags } =
    useLocalSearchParams()
  const isEditing = !!entryId

  const [data, setData] = useState({
    date: entryDate
      ? (() => {
          const [year, month, day] = (entryDate as string)
            .split('-')
            .map(Number)
          return new Date(year, month - 1, day)
        })()
      : new Date(),
    title: (entryTitle as string) || '',
    body: (entryBody as string) || '',
    tags: entryTags
      ? (JSON.parse(entryTags as string) as Tag[])
      : ([] as Tag[]),
  })
  const [initialState, setInitialState] = useState<{
    date: Date
    title: string
    body: string
    tags: Tag[]
  } | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [maxHeight, setMaxHeight] = useState<number | null>(null)
  const navigation = useNavigation()
  const selectedTags = tags ? JSON.parse(tags as string) : []

  useEffect(() => {
    setInitialState({ ...data })
  }, []) // Only run once on mount
  const hasChanges = () => {
    if (!isEditing || !initialState) return true // For new entries or before initial state is set, always allow saving if body is not empty

    const dateChanged = data.date.getTime() !== initialState.date.getTime()
    const titleChanged = data.title.trim() !== initialState.title.trim()
    const bodyChanged = data.body.trim() !== initialState.body.trim()
    const tagsChanged =
      data.tags.length !== initialState.tags.length ||
      data.tags.some(
        (tag) =>
          !initialState.tags.some((initial: Tag) => initial.id === tag.id)
      )

    return dateChanged || titleChanged || bodyChanged || tagsChanged
  }

  const canSave = () => {
    const hasContent = data.body.trim().length > 0
    const hasValidChanges = hasChanges()
    return hasContent && hasValidChanges && !isSaving
  }

  useEffect(() => {
    const saveEnabled = canSave()
    navigation.setOptions({
      headerTitle: isEditing ? 'Edit Entry' : 'New Entry',
      headerRight: () => (
        <Button
          onPress={saveEnabled ? handleSubmitEntry : undefined}
          hitSlop={12}
          accessibilityLabel="submit notebook entry"
          twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text="Save"
          disabled={!saveEnabled}
        />
      ),
    })
  }, [navigation, isSaving, data, initialState])

  useEffect(() => {
    if (tags) {
      setData((prevData) => ({ ...prevData, tags: selectedTags }))
      // If this is the first time setting tags (initial load), update initial state too
      if (!isEditing && initialState) {
        setInitialState({ ...initialState, tags: selectedTags })
      }
    }
  }, [tags, isEditing])

  const handleSubmitEntry = async () => {
    setIsSaving(true)
    try {
      if (isEditing) {
        await updateEntry(entryId as string, {
          ...data,
          date: data.date.toISOString(),
        })
      } else {
        await addEntry({
          ...data,
          date: data.date.toISOString(),
        })
      }

      router.replace('/notebook')
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const renderedTags = data.tags.map(({ id, name, userId }, index) => {
    return (
      <TagView
        key={id}
        tag={{ id, name, userId }}
      />
    )
  })

  return (
    <SafeView
      keyboardAvoiding
      scroll={false}
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
            twcnInput="text-base h-10"
          />
        </View>

        <Input
          editable={!isSaving}
          value={data.body}
          onChange={(e) => setData({ ...data, body: e.nativeEvent.text })}
          placeholder="Anything on your mind..."
          noBorder
          autoFocus
          numberOfLines={2}
          multiline
          maxLength={500}
          twcnInput={`flex-1 mb-2 h-full flex-1`}
          textAlignVertical="top"
          scrollEnabled
        />
      </View>
      <View>
        {data.tags.length == 0 && (
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText self-end mb-2">
            {data.body.length} / {500}
          </Txt>
        )}

        <View>
          {data.tags.length > 0 ? (
            <View
              style={tw`flex-row items-center justify-between border-b pb-2 border-light-grayTertiary dark:border-dark-grayTertiary`}
            >
              <Button
                onPress={() => {
                  router.push({
                    pathname: '/tag-selector',
                    params: { existingTags: JSON.stringify(data.tags) },
                  })
                }}
                style={tw`flex-row gap-2 flex-1 flex-wrap items-center`}
              >
                <TagIcon
                  color={Colors.primary}
                  size={12}
                  strokeWidth={1.5}
                />
                {renderedTags}
              </Button>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText self-end">
                {data.body.length} / {500}
              </Txt>
            </View>
          ) : (
            <View style={tw`gap-4`}>
              <Button
                onPress={() => {
                  router.push({
                    pathname: '/tag-selector',
                    params: { existingTags: JSON.stringify(data.tags) },
                  })
                }}
                twcn="flex-row items-center gap-2 justify-center p-4 border border-dashed border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg"
                twcnText="text-light-grayText dark:text-dark-grayText text-sm "
                text="Add tags"
              >
                <ArrowRight
                  size={16}
                  color={theme.grayText}
                  strokeWidth={1.5}
                />
              </Button>
            </View>
          )}
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
