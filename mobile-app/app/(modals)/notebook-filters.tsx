import { Alert } from 'react-native'
import React, { Fragment, useEffect, useState } from 'react'
import Txt from '../../components/text'
import { Tag } from '../../utils/types'
import { useNotebook } from '../../context/notebook-context'
import Input from '../../components/input'
import { Pressable, View } from 'react-native'
import tw from '../../tw'
import Spinner from '../../components/activity-indicator'
import TagView from '../../components/tag'
import SafeView from '../../components/safe-view'
import { router, useNavigation } from 'expo-router'
import Button from '../../components/button'
import { CalendarArrowDown, CalendarArrowUp } from 'lucide-react-native'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'

type TagWithCount = Tag & { used: number }

// search and select tags feature

const NotebookFilters = () => {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [selectedTags, setSelectedTags] = useState<TagWithCount[]>([])
  const [resultTags, setResultTags] = useState<TagWithCount[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [initialState, setInitialState] = useState<{
    selectedTags: TagWithCount[]
    sortOrder: 'asc' | 'desc'
  }>({
    selectedTags: [],
    sortOrder: 'desc',
  })
  const { applyFiltersAndSort, tagFilters, setSortOrder, sortOrder } =
    useNotebook() // use notebook entries to show the length, results will be on notebook page
  const { fetchTags } = useNotebook()
  const navigation = useNavigation()
  const { theme } = useTheme()

  // Check if any changes have been made
  const hasChanges = () => {
    const tagsChanged =
      selectedTags.length !== initialState.selectedTags.length ||
      selectedTags.some(
        (tag) =>
          !initialState.selectedTags.some((initial) => initial.id === tag.id)
      )
    const sortOrderChanged = sortOrder !== initialState.sortOrder
    return tagsChanged || sortOrderChanged
  }

  useEffect(() => {
    const changesExist = hasChanges()
    navigation.setOptions({
      headerRight: () => {
        return (
          <Button
            onPress={changesExist ? handleApplyFiltersAndSort : undefined}
            hitSlop={12}
            accessibilityLabel="apply filters and sort method"
            twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
            text="Apply"
            disabled={!changesExist}
          />
        )
      },
    })
  }, [navigation, selectedTags, sortOrder, initialState])

  useEffect(() => {
    const getTags = async () => {
      try {
        const tags = await fetchTags()
        setTags(tags)

        if (tagFilters) {
          const tagFiltersWithUsed = tags.filter((tag) =>
            tagFilters.some((t) => t.id === tag.id)
          )
          setSelectedTags(tagFiltersWithUsed)
          setInitialState({
            selectedTags: tagFiltersWithUsed,
            sortOrder: sortOrder,
          })
        } else {
          setInitialState({
            selectedTags: [],
            sortOrder: sortOrder,
          })
        }
        // remove tags that are in tagFilters and set to results
        const filteredResultTags = tags.filter((tag) =>
          tagFilters.every((t) => t.id !== tag.id)
        )
        setResultTags(filteredResultTags)
      } catch (error: any) {
        console.error('Error fetching tags:', error)
        Alert.alert('Error', error.message)
      } finally {
        setLoading(false)
      }
    }
    getTags()
    if (tagFilters.length > 0) {
      // get the active filter tags from tags, and set them as selectedTags
      const activeTags = tags.filter((tag) =>
        tagFilters.some((t) => t.id === tag.id)
      )
      setSelectedTags(activeTags)
    }
  }, [])

  const handleChange = (text: string) => {
    setQuery(text)
    const filteredResults = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(text.toLowerCase()) &&
        !selectedTags.includes(tag)
    )
    setResultTags(filteredResults)
  }

  const handleSelectTag = (tag: TagWithCount) => {
    setSelectedTags((prev) => [...prev, tag])
    setResultTags((prev) => prev.filter((t) => t.id !== tag.id))
  }

  const handleDeselectTag = (tag: TagWithCount) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))
    setResultTags((prev) => [...prev, tag])
  }

  const handleApplyFiltersAndSort = () => {
    console.log('applying filters and sort:', selectedTags, sortOrder)
    applyFiltersAndSort(selectedTags, sortOrder)
    router.back()
  }

  const handleResetAll = () => {
    setSelectedTags([])
    setSortOrder('desc')
    setResultTags(tags)
  }

  const renderedResultTags = resultTags.map(({ id, name, used, userId }) => {
    return (
      <Pressable
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
        key={id}
        onPress={() => handleSelectTag({ id, name, userId, used })}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Pressable>
    )
  })

  const renderedSelectedTags = selectedTags.map(
    ({ id, name, userId, used }) => {
      return (
        <Pressable
          key={id}
          onPress={() => handleDeselectTag({ id, name, userId, used })}
          hitSlop={12}
        >
          <TagView tag={{ id, name, userId }} />
        </Pressable>
      )
    }
  )

  return loading ? (
    <Spinner />
  ) : (
    <SafeView>
      <View style={tw`flex-row justify-end gap-4 items-center mb-2`}>
        <Button
          hitSlop={12}
          onPress={handleResetAll}
        >
          <Txt twcn="text-light-grayText dark:text-dark-grayText">
            Reset All
          </Txt>
        </Button>

        <Button
          hitSlop={12}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'desc' ? (
            <CalendarArrowDown
              size={24}
              strokeWidth={1.5}
              color={theme.grayText}
            />
          ) : (
            <CalendarArrowUp
              size={24}
              strokeWidth={1.5}
              color={Colors.primary}
            />
          )}
        </Button>
      </View>
      {tags.length > 0 ? (
        <Fragment>
          <Input
            autoCorrect={false}
            autoCapitalize="none"
            noBorder
            placeholder="Filter by tags..."
            value={query}
            onChange={(e) => handleChange(e.nativeEvent.text)}
          />
          {selectedTags.length > 0 && (
            <View style={tw`flex-row flex-wrap items-center gap-1 pt-2`}>
              {renderedSelectedTags}
            </View>
          )}
          <View
            style={tw`flex-col mt-2 border-t border-light-grayTertiary dark:border-dark-grayTertiary`}
          >
            {renderedResultTags}
          </View>
        </Fragment>
      ) : (
        <View
          style={tw`flex-row items-center mt-4 justify-center h-48 p-4 border border-dashed border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg`}
        >
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-center">
            No tags found. Start tagging your entries to organize and filter
            them more effectively.
          </Txt>
        </View>
      )}
    </SafeView>
  )
}

export default NotebookFilters
