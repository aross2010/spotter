import {
  Alert,
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formatDate, toLocalDateString } from '../../functions/formatted-date'
import Input from '../../components/input'
import Txt from '../../components/text'
import tw from '../../tw'
import { Link, router, useLocalSearchParams, useNavigation } from 'expo-router'
import Colors from '../../constants/colors'
import { useState, useEffect, useCallback } from 'react'
import { Tag } from '../../utils/types'
import { useNotebook } from '../../context/notebook-context'
import TagView from '../../components/tag'
import { Calendar, MapPin, Tag as TagIcon } from 'lucide-react-native'
import { useNotebookForm } from '../../context/notebook-form-context'
import Spinner from '../../components/activity-indicator'
import DateTimePicker from '@react-native-community/datetimepicker'

const NotebookEntryForm = () => {
  const { addEntry, updateEntry, fetchTags } = useNotebook()
  const { entryId } = useLocalSearchParams() // tags = sent back from tag selector, entryTags = existing tags for entry to edit
  const isEditing = !!entryId
  const {
    notebookFormData,
    setNotebookFormData,
    getNotebookData,
    isLoading,
    setUserNotebookTags,
    resetNotebookFormContext,
  } = useNotebookForm()
  const [initialState, setInitialState] = useState<{
    date: Date
    title: string
    body: string
    tags: Tag[]
  } | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    const getTags = async () => {
      try {
        const tags = await fetchTags()
        setUserNotebookTags(tags)
      } catch (error: any) {
        Alert.alert('Error', error.message)
      }
    }
    getTags()
  }, [])

  useEffect(() => {
    setInitialState({ ...notebookFormData })
  }, [])

  useEffect(() => {
    if (isEditing && entryId) {
      getNotebookData(entryId as string).then(() => {
        setInitialState({ ...notebookFormData })
      })
    }
  }, [entryId])

  const hasChanges = () => {
    if (!isEditing || !initialState) return true // For new entries or before initial state is set, always allow saving if body is not empty

    const dateChanged =
      notebookFormData.date.getTime() !== initialState.date.getTime()
    const titleChanged =
      notebookFormData.title.trim() !== initialState.title.trim()
    const bodyChanged =
      notebookFormData.body.trim() !== initialState.body.trim()
    const tagsChanged =
      notebookFormData.tags.length !== initialState.tags.length ||
      notebookFormData.tags.some(
        (tag) =>
          !initialState.tags.some((initial: Tag) => initial.id === tag.id)
      )

    return dateChanged || titleChanged || bodyChanged || tagsChanged
  }

  const canSave = () => {
    const hasContent = notebookFormData.body.trim().length > 0
    const hasValidChanges = hasChanges()
    return hasContent && hasValidChanges && !isSaving
  }

  const handleCancelForm = useCallback(() => {
    resetNotebookFormContext()
    router.back()
  }, [resetNotebookFormContext])

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
          text={
            isEditing && isSaving
              ? 'Updating...'
              : isEditing
                ? 'Update'
                : isSaving
                  ? 'Saving...'
                  : 'Save'
          }
          disabled={!saveEnabled}
        />
      ),
      headerLeft: () => (
        <Button
          onPress={handleCancelForm}
          hitSlop={12}
          accessibilityLabel="cancel notebook entry"
          twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
          text="Cancel"
          disabled={isSaving}
        />
      ),
    })
  }, [navigation, isSaving, notebookFormData, initialState, handleCancelForm])

  const handleSubmitEntry = async () => {
    setIsSaving(true)
    try {
      if (isEditing) {
        await updateEntry(entryId as string, {
          ...notebookFormData,
          date: toLocalDateString(notebookFormData.date), // Send local date (YYYY-MM-DD)
        })
      } else {
        await addEntry({
          ...notebookFormData,
          date: toLocalDateString(notebookFormData.date), // Send local date (YYYY-MM-DD)
        })
      }

      router.replace('/notebook')
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const renderedTags = notebookFormData.tags.map(
    ({ id, name, userId }, index) => {
      return (
        <TagView
          key={id}
          tag={{ id, name, userId }}
        />
      )
    }
  )

  if (isLoading) return <Spinner />

  return (
    <SafeView
      keyboardAvoiding
      scroll={false}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Button
            text={formatDate(notebookFormData.date)}
            onPress={() => {
              setIsDatePickerOpen(true)
            }}
            hitSlop={12}
            twcn="flex-row-reverse items-center gap-1"
            twcnText="text-xs font-poppinsSemiBold text-primary dark:text-primary uppercase"
          >
            <Calendar
              size={16}
              color={Colors.primary}
            />
          </Button>
        </View>

        <View style={tw`mb-4`}>
          <Input
            editable={!isSaving}
            value={notebookFormData.title}
            onChange={(e) =>
              setNotebookFormData({
                ...notebookFormData,
                title: e.nativeEvent.text,
              })
            }
            placeholder="Entry title (optional)"
            twcnInput="text-base h-10 font-poppinsMedium text-base"
          />
        </View>

        <Input
          editable={!isSaving}
          value={notebookFormData.body}
          onChange={(e) =>
            setNotebookFormData({
              ...notebookFormData,
              body: e.nativeEvent.text,
            })
          }
          placeholder="Anything on your mind..."
          autoFocus
          numberOfLines={2}
          multiline
          maxLength={500}
          twcnInput={`flex-1 mb-2 h-full flex-1`}
          textAlignVertical="top"
          scrollEnabled
        />
      </View>

      {notebookFormData.tags.length > 0 ? (
        <View style={tw`flex-row justify-between items-center`}>
          <Link href={'/tag-selector?type=notebook'}>
            <View style={tw`flex-row gap-2 flex-1 flex-wrap items-center`}>
              <TagIcon
                color={Colors.primary}
                size={16}
              />
              {renderedTags}
            </View>
          </Link>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText self-end">
            {notebookFormData.body.length} / {500}
          </Txt>
        </View>
      ) : (
        <View style={tw`flex-row justify-between items-center`}>
          <Button
            onPress={() => router.push('/tag-selector?type=notebook')}
            style={tw`mr-auto flex-row-reverse items-center gap-1`}
          >
            <Txt twcn="font-poppinsSemiBold text-primary dark:text-primary">
              Add tags
            </Txt>
            <TagIcon
              color={Colors.primary}
              size={16}
            />
          </Button>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            {notebookFormData.body.length} / {500}
          </Txt>
        </View>
      )}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
      >
        <Pressable
          style={tw`flex-1 justify-center items-center bg-black/50`}
          onPress={() => setIsDatePickerOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View
              style={tw`bg-light-background dark:bg-dark-background rounded-2xl p-3 shadow-lg`}
            >
              <DateTimePicker
                value={notebookFormData.date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setNotebookFormData({
                      ...notebookFormData,
                      date: selectedDate,
                    })
                  }

                  if (Platform.OS === 'android') {
                    setIsDatePickerOpen(false)
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <Button
                  text="Done"
                  onPress={() => setIsDatePickerOpen(false)}
                  twcn="mt-2 bg-primary rounded-xl p-3"
                  twcnText="text-center font-poppinsSemiBold text-dark-text"
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </SafeView>
  )
}

export default NotebookEntryForm
