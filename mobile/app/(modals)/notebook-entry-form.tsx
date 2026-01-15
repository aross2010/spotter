import { Alert, Platform, View } from 'react-native'
import {
  EnrichedTextInput,
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formatDate, toLocalDateString } from '../../functions/formatted-date'
import Input from '../../components/input'
import Txt from '../../components/text'
import tw from '../../tw'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import Colors from '../../constants/colors'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Tag } from '../../utils/types'
import { useNotebook } from '../../context/notebook-context'
import { useNotebookForm } from '../../context/notebook-form-context'
import Spinner from '../../components/activity-indicator'
import {
  DefaultKeyboardToolbarTheme,
  KeyboardToolbar,
} from 'react-native-keyboard-controller'
import useTheme from '../hooks/theme'
import SFIcon from '../../components/sf-icon'
import { ContextMenu, Host, Button as SwiftButton } from '@expo/ui/swift-ui'
import MyDatePicker from '../../components/date-picker'

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
  const [isFocused, setIsFocused] = useState(false)
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(
    null
  )
  const bodyInputRef = useRef<EnrichedTextInputInstance>(null)
  const isInitialLoadRef = useRef(false)
  const hasSetInitialStateRef = useRef(false)
  const navigation = useNavigation()
  const { theme, colorScheme } = useTheme()

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
      getNotebookData(entryId as string)
    }
  }, [entryId, isEditing])

  // Set the body content after data is loaded
  useEffect(() => {
    if (
      isEditing &&
      notebookFormData.body &&
      bodyInputRef.current &&
      !isInitialLoadRef.current
    ) {
      isInitialLoadRef.current = true
      // Pass HTML to the editor, which will trigger onChangeText with plain text
      bodyInputRef.current?.setValue(notebookFormData.body)
    }
  }, [notebookFormData.body])

  // Set initial state after the body has been converted to plain text by onChangeText
  useEffect(() => {
    if (
      isEditing &&
      !notebookFormData.body.includes('<') &&
      notebookFormData.body.trim() &&
      !hasSetInitialStateRef.current
    ) {
      // Body is now plain text (no HTML tags), safe to set as initial state
      hasSetInitialStateRef.current = true
      setInitialState({ ...notebookFormData })
    }
  }, [notebookFormData.body])

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
    if (hasChanges()) {
      Alert.alert(
        'Are you sure you want to exit?',
        'Your changes will be lost.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              resetNotebookFormContext()
              router.back()
            },
          },
        ]
      )
    } else {
      resetNotebookFormContext()
      router.back()
    }
  }, [resetNotebookFormContext])

  useEffect(() => {
    const saveEnabled = canSave()
    navigation.setOptions({
      headerRight: () => (
        <View style={tw`flex-row items-center gap-6 px-2`}>
          <Host style={{ width: 26, height: 26 }}>
            <ContextMenu>
              <ContextMenu.Items>
                <SwiftButton
                  systemImage="calendar"
                  onPress={() => setIsDatePickerOpen(true)}
                >
                  {formatDate(notebookFormData.date)}
                </SwiftButton>
                <SwiftButton
                  systemImage="tag"
                  onPress={() =>
                    router.push({
                      pathname: '/tag-selector',
                      params: {
                        type: 'notebook',
                      },
                    })
                  }
                >
                  {notebookFormData.tags.length > 0
                    ? notebookFormData.tags.map((tag) => tag.name).join(', ')
                    : 'Add Tags'}
                </SwiftButton>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <SFIcon
                  name="info.circle"
                  color={Colors.primary}
                  size={26}
                />
              </ContextMenu.Trigger>
            </ContextMenu>
          </Host>
          <Button
            onPress={handleSubmitEntry}
            hitSlop={12}
            accessibilityLabel="Save Notebook Entry"
            disabled={isSaving || !saveEnabled}
            twcn="w-9 flex-row items-center justify-center h-full"
          >
            {isSaving ? (
              <Spinner fullScreen={false} />
            ) : (
              <SFIcon
                name="checkmark"
                size={26}
                color={saveEnabled ? Colors.primary : theme.grayText}
              />
            )}
          </Button>
        </View>
      ),
      headerLeft: () => (
        <Button
          onPress={handleCancelForm}
          hitSlop={12}
          accessibilityLabel="close notebook entry form"
          twcn="w-9 flex-row items-center justify-center h-full"
          disabled={isSaving}
        >
          <SFIcon
            name="xmark"
            size={26}
            color={theme.text}
          />
        </Button>
      ),
    })
  }, [navigation, isSaving, notebookFormData, initialState, handleCancelForm])

  const handleSubmitEntry = async () => {
    setIsSaving(true)
    try {
      const htmlBody = await bodyInputRef.current?.getHTML()
      if (isEditing) {
        await updateEntry(entryId as string, {
          ...notebookFormData,
          body: htmlBody || notebookFormData.body,
          date: toLocalDateString(notebookFormData.date), // Send local date (YYYY-MM-DD)
        })
      } else {
        await addEntry({
          ...notebookFormData,
          body: htmlBody || notebookFormData.body,
          date: toLocalDateString(notebookFormData.date), // Send local date (YYYY-MM-DD)
        })
      }

      router.replace('/notebook')
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
      resetNotebookFormContext()
    }
  }

  if (isLoading) return <Spinner />

  return (
    <>
      <SafeView
        keyboardAvoiding
        scroll={false}
        keyboardVerticalOffset={75}
      >
        <View style={tw`flex-1`}>
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
              placeholder="Notebook Entry Title"
              twcnInput="text-base h-14 font-semibold text-2xl"
              autoFocus={!isEditing}
            />
          </View>

          <EnrichedTextInput
            ref={bodyInputRef}
            editable={!isSaving}
            onChangeState={(e) => setStylesState(e.nativeEvent)}
            onChangeText={(e) => {
              const newValue = e.nativeEvent.value
              if (newValue.trim().length <= 1000) {
                setNotebookFormData({
                  ...notebookFormData,
                  body: newValue,
                })
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Entry Content..."
            placeholderTextColor={
              colorScheme === 'dark'
                ? 'rgba(186, 186, 186, 0.75)'
                : 'rgba(116, 116, 116, 0.75)'
            }
            style={tw`dark:text-dark-text text-base flex-1 leading-[18] h-full`}
            htmlStyle={{
              ul: {
                bulletColor: theme.text,
                gapWidth: 20,
              },
              ol: {
                gapWidth: 20,
              },
              a: {
                color: Colors.primary,
              },
            }}
          />
        </View>
        <MyDatePicker
          isOpen={isDatePickerOpen}
          closePicker={() => setIsDatePickerOpen(false)}
          value={notebookFormData.date}
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
      </SafeView>
      <View
        collapsable={false}
        pointerEvents={isFocused ? 'auto' : 'none'}
        style={!isFocused ? { height: 0, opacity: 0 } : undefined}
      >
        <KeyboardToolbar
          theme={{
            ...DefaultKeyboardToolbarTheme,
            dark: {
              ...DefaultKeyboardToolbarTheme.dark,
              primary: Colors.dark.text,
              background: Colors.dark.background,
            },
            light: {
              ...DefaultKeyboardToolbarTheme.light,
              primary: Colors.light.text,
              background: Colors.light.background,
            },
          }}
        >
          <KeyboardToolbar.Content>
            <View
              style={tw`flex-row items-center justify-center gap-3 px-2 bg-white dark:bg-dark-grayPrimary rounded-full border border-light-grayBorder dark:border-dark-grayBorder`}
            >
              <View style={tw`flex-row items-center gap-4`}>
                <Button
                  onPress={() => bodyInputRef.current?.toggleBold()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="bold"
                    size={24}
                    color={stylesState?.isBold ? Colors.primary : theme.text}
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleItalic()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="italic"
                    size={24}
                    color={stylesState?.isItalic ? Colors.primary : theme.text}
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleUnderline()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="underline"
                    size={24}
                    color={
                      stylesState?.isUnderline ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleOrderedList()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="list.number"
                    size={24}
                    color={
                      stylesState?.isOrderedList ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleUnorderedList()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="list.bullet"
                    size={24}
                    color={
                      stylesState?.isUnorderedList ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <View style={tw`w-16`}>
                  <Txt
                    twcn={`text-xs ${
                      notebookFormData.body.trim().length >= 1000
                        ? 'text-red'
                        : 'dark:text-dark-grayText text-grayText'
                    }`}
                  >
                    {notebookFormData.body.trim().length} / 1000
                  </Txt>
                </View>
              </View>
            </View>
          </KeyboardToolbar.Content>
        </KeyboardToolbar>
      </View>
    </>
  )
}

export default NotebookEntryForm
