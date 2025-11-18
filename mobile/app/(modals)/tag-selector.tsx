import React, { useCallback, useEffect, useState } from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import Input from '../../components/input'
import { useAuth } from '../../context/auth-context'
import { Tag, TagWithCount } from '../../utils/types'
import Button from '../../components/button'
import { View } from 'react-native'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router'
import TagView from '../../components/tag'
import { Search, X } from 'lucide-react-native'
import { useWorkoutForm } from '../../context/workout-form-context'
import { useNotebookForm } from '../../context/notebook-form-context'

const TagSelector = () => {
  const {
    workoutData,
    setWorkoutData,
    userTags: userWorkoutTags,
    setUserTags: setUserWorkoutTags,
  } = useWorkoutForm()
  const workoutTags = workoutData.tags

  const {
    notebookFormData,
    setNotebookFormData,
    userNotebookTags,
    setUserNotebookTags,
  } = useNotebookForm()
  const notebookTags = notebookFormData.tags

  const { type } = useLocalSearchParams()
  const isWorkoutTags = type === 'workout'
  const isNotebookTags = type === 'notebook'

  const formTags = isWorkoutTags ? workoutTags : notebookTags
  const setFormTags = isWorkoutTags
    ? (tag: Tag) =>
        setWorkoutData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }))
    : (tag: Tag) =>
        setNotebookFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }))

  const removeFormTag = isWorkoutTags
    ? (tag: Tag) =>
        setWorkoutData((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tag.id),
        }))
    : (tag: Tag) =>
        setNotebookFormData((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tag.id),
        }))
  const userTags = isWorkoutTags ? userWorkoutTags : userNotebookTags
  const setUserTags = isWorkoutTags ? setUserWorkoutTags : setUserNotebookTags

  const [tagResults, setTagResults] = useState<TagWithCount[]>([])
  const [removedTags, setRemovedTags] = useState<TagWithCount[]>([])
  const [initiallySelectedTags, setInitiallySelectedTags] = useState<Tag[]>([])
  const [query, setQuery] = useState('')
  const { authUser } = useAuth()
  const navigation = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    const tags = formTags.map((tag) => {
      return {
        id: tag.id,
        name: tag.name,
        userId: tag.userId,
      }
    })
    setInitiallySelectedTags(tags)
  }, [])

  useEffect(() => {
    if (!userTags) return
    const filteredQueryResults = userTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase()) &&
        !formTags.find((t) => t.name === tag.name)
    )
    setTagResults(filteredQueryResults)
  }, [query])

  useEffect(() => {
    if (!userTags) return
    const filteredTags = userTags.filter(
      (tag) =>
        !formTags.find((t) => t.name === tag.name) &&
        tag.name.toLowerCase().includes(query.toLowerCase())
    )
    setTagResults(filteredTags)
  }, [formTags, query])

  useEffect(() => {
    if (userTags) {
      const filteredTags = userTags.filter(
        (tag) => !formTags.find((t) => t.name === tag.name)
      )
      setTagResults(filteredTags)
    }
  }, [])

  const handleSelectTag = (tagName: string) => {
    // remove from tags so it cant be searched and add to removed in case it gets deselected
    setUserTags((prev) => prev.filter((tag) => tag.name !== tagName))
    setTagResults((prev) => prev.filter((tag) => tag.name !== tagName))
    setRemovedTags((prev) => [
      ...prev,
      userTags.find((tag) => tag.name === tagName)!,
    ])
    const tag = userTags.find((tag) => tag.name === tagName)!
    if (tag) setFormTags(tag)
    setQuery('')
  }

  const handleCreateNewTag = () => {
    if (
      query.trim() === '' ||
      formTags.find((tag) => tag.name === query.trim()) ||
      userTags.find((tag) => tag.name === query.trim()) ||
      removedTags.find((tag) => tag.name === query.trim())
    ) {
      setQuery('')
      return
    }

    // create new tag to selected tags
    const newTag = {
      id: Date.now().toString(),
      name: query.trim(),
      userId: authUser?.id ?? '',
    } // dummy id to match type
    setFormTags(newTag)
    // do not add to tags (those are tags from database)
    setQuery('')
  }

  const handleDeselectTag = (tagName: string) => {
    // remove from selected tags, and add back to tags (find in removedTags)
    const tag = formTags.find((tag) => tag.name === tagName)
    if (tag) removeFormTag(tag)
    const removedTag = removedTags.find((tag) => tag.name === tagName)

    if (removedTag) {
      setUserTags((prev) =>
        [...prev, removedTag].sort((a, b) => a.name.localeCompare(b.name))
      )
    } else {
    }
  }

  const renderedResults = tagResults.map(({ id, name, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder justify-between flex-row px-4 py-3 items-center`}
        key={id}
        onPress={() => handleSelectTag(name)}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  const renderedSelectedTags = formTags.map(({ id, name, userId }) => {
    return (
      <Button
        key={id}
        onPress={() => handleDeselectTag(name)}
        hitSlop={12}
      >
        <TagView tag={{ id, name, userId }} />
      </Button>
    )
  })

  return (
    <SafeView twcnContentView="px-0">
      <View
        style={tw`px-3 mx-4 mb-2 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white dark:bg-dark-grayPrimary`}
      >
        <Search
          size={16}
          color={theme.grayText}
        />
        <Input
          autoCorrect={false}
          twcnInput="flex-1"
          autoCapitalize="none"
          placeholder={
            userTags.length === 0 ? 'Add tags...' : 'Search or add tags...'
          }
          value={query}
          onChange={(e) => setQuery(e.nativeEvent.text)}
          returnKeyType="done"
          onSubmitEditing={handleCreateNewTag}
          maxLength={50}
          autoFocus
        />
        <Button onPress={() => setQuery('')}>
          <X
            size={16}
            color={theme.grayText}
          />
        </Button>
      </View>

      {formTags.length > 0 && (
        <View
          style={tw`flex-row flex-wrap border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 items-center gap-1 pt-2 px-4`}
        >
          {renderedSelectedTags}
        </View>
      )}
      <View>{renderedResults}</View>
    </SafeView>
  )
}

export default TagSelector
