import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
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
import { useWorkoutForm } from '../../context/workout-form-context'
import { useNotebookForm } from '../../context/notebook-form-context'
import SFIcon from '../../components/sf-icon'
import Colors from '../../constants/colors'

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
  const searchBarRef = useRef(null)
  const { type, q } = useLocalSearchParams()
  const query = (q as string) || ''
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
    router.setParams({ q: '' })
    // @ts-ignore
    searchBarRef?.current?.setText('')
  }

  const handleCreateNewTag = () => {
    if (
      query.trim() === '' ||
      formTags.find((tag) => tag.name === query.trim()) ||
      userTags.find((tag) => tag.name === query.trim()) ||
      removedTags.find((tag) => tag.name === query.trim())
    ) {
      router.setParams({ q: '' })
      // @ts-ignore
      searchBarRef?.current?.setText('')
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
    router.setParams({ q: '' })
    // @ts-ignore
    searchBarRef?.current?.setText('')
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
        style={tw`border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 justify-between flex-row px-4 py-3 items-center`}
        key={id}
        onPress={() => handleSelectTag(name)}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  const showCreateOption =
    query.trim() !== '' &&
    !formTags.find((tag) => tag.name === query.trim()) &&
    !userTags.find((tag) => tag.name === query.trim()) &&
    !removedTags.find((tag) => tag.name === query.trim())

  const renderedSelectedTags = formTags.map(({ id, name, userId }) => {
    return (
      <Button
        key={id}
        onPress={() => handleDeselectTag(name)}
        hitSlop={12}
      >
        <TagView
          canDelete
          tag={{ id, name, userId }}
        />
      </Button>
    )
  })

  return (
    <SafeView twcnContentView="px-0">
      {showCreateOption && (
        <Button
          style={tw`border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 flex-row gap-2 px-4 py-3 items-center`}
          onPress={handleCreateNewTag}
        >
          <SFIcon
            name="plus.circle"
            size={18}
            color={Colors.green}
          />
          <Txt twcn="font-poppinsSemiBold">Create "{query.trim()}"</Txt>
        </Button>
      )}
      {formTags.length > 0 && (
        <View
          style={tw`flex-row flex-wrap border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 py-3 items-center gap-1 px-4`}
        >
          {renderedSelectedTags}
        </View>
      )}
      <View>{renderedResults}</View>
    </SafeView>
  )
}

export default TagSelector
