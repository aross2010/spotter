import { Alert } from 'react-native'
import React, { Fragment, useEffect, useState } from 'react'
import Txt from '../../components/text'
import { TagWithCount } from '../../utils/types'
import { useNotebook } from '../../context/notebook-context'
import Input from '../../components/input'
import { Pressable, View } from 'react-native'
import tw from '../../tw'
import Spinner from '../../components/activity-indicator'
import TagView from '../../components/tag'
import SafeView from '../../components/safe-view'
import { router, useNavigation } from 'expo-router'
import Button from '../../components/button'
import {
  CalendarArrowDown,
  CalendarArrowUp,
  RotateCcw,
  Search,
  X,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'

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
  const {
    applyFiltersAndSort,
    tagFilters,
    setSortOrder,
    sortOrder,
    isLoading,
  } = useNotebook() // use notebook entries to show the length, results will be on notebook page
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
          tags.length > 0 && (
            <Button
              onPress={changesExist ? handleApplyFiltersAndSort : undefined}
              hitSlop={12}
              accessibilityLabel="apply filters and sort method"
              twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
              text={isLoading ? 'Applying...' : 'Apply'}
              disabled={!changesExist || isLoading}
            />
          )
        )
      },
    })
  }, [navigation, selectedTags, sortOrder, initialState, isLoading, tags])

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

  const handleSelectTag = (tag: TagWithCount) => {
    setSelectedTags((prev) => [...prev, tag])
    setResultTags((prev) => prev.filter((t) => t.id !== tag.id))
  }

  const handleDeselectTag = (tag: TagWithCount) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))
    // Find the correct position in tags to maintain order
    setResultTags((prev) => {
      const newResults = [...prev, tag]
      // Sort by original tags order
      return newResults.sort(
        (a, b) =>
          tags.findIndex((t) => t.id === a.id) -
          tags.findIndex((t) => t.id === b.id)
      )
    })
  }

  const handleApplyFiltersAndSort = () => {
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
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder justify-between flex-row px-4 py-3 items-center`}
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
    <SafeView twcnContentView="px-0">
      {tags.length > 0 ? (
        <Fragment>
          <View
            style={tw`flex-row justify-between items-center px-4 gap-4 mb-2`}
          >
            <View
              style={tw`px-3 flex-1 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white`}
            >
              <Search
                size={16}
                color={theme.grayText}
              />
              <Input
                autoCorrect={false}
                twcnInput="flex-1"
                autoCapitalize="none"
                placeholder={'Search tags...'}
                value={query}
                onChange={(e) => setQuery(e.nativeEvent.text)}
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
            <View style={tw`flex-row items-center gap-2`}>
              <Button
                hitSlop={12}
                onPress={handleResetAll}
                twcn="bg-primary/10 rounded-xl p-2"
              >
                <RotateCcw
                  size={16}
                  color={Colors.primary}
                />
              </Button>
              <Button
                hitSlop={12}
                twcn="bg-primary/10 rounded-xl p-2"
                onPress={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'desc' ? (
                  <CalendarArrowDown
                    size={16}
                    color={Colors.primary}
                  />
                ) : (
                  <CalendarArrowUp
                    size={24}
                    color={Colors.primary}
                  />
                )}
              </Button>
            </View>
          </View>
          {selectedTags.length > 0 && (
            <View
              style={tw`flex-row flex-wrap border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 items-center gap-1 pt-2 px-4`}
            >
              {renderedSelectedTags}
            </View>
          )}
          <View>{renderedResultTags}</View>
        </Fragment>
      ) : (
        <View style={tw`items-center mx-4 mt-4 justify-center h-48 p-4`}>
          <Txt twcn="text-center text-xl font-poppinsSemiBold mb-4">
            No tags found
          </Txt>
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-center">
            Start tagging your entries to organize and filter them more
            effectively.
          </Txt>
        </View>
      )}
    </SafeView>
  )
}

export default NotebookFilters
