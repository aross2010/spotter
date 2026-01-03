import { Alert, Keyboard, ScrollView } from 'react-native'
import React, { Fragment, useEffect, useState } from 'react'
import Txt from '../../components/text'
import { TagWithCount } from '../../utils/types'
import { useNotebook } from '../../context/notebook-context'
import { Pressable, View } from 'react-native'
import tw from '../../tw'
import Spinner from '../../components/activity-indicator'
import TagView from '../../components/tag'
import SafeView from '../../components/safe-view'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'
import SFIcon from '../../components/sf-icon'

// search and select tags feature

const NotebookFilters = () => {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [selectedTags, setSelectedTags] = useState<TagWithCount[]>([])
  const [resultTags, setResultTags] = useState<TagWithCount[]>([])
  const { q } = useLocalSearchParams()
  const query = (q as string) || ''
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
            <View style={tw`flex-row items-center gap-4 px-2`}>
              <Button
                hitSlop={8}
                onPress={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                accessibilityLabel="toggle sort order"
              >
                <SFIcon
                  name={
                    sortOrder === 'desc'
                      ? 'calendar.badge.minus'
                      : 'calendar.badge.plus'
                  }
                  size={26}
                  color={Colors.primary}
                />
              </Button>
              <Button
                hitSlop={8}
                onPress={handleResetAll}
                accessibilityLabel="reset all filters"
              >
                <SFIcon
                  name="arrow.counterclockwise"
                  size={26}
                  color={Colors.primary}
                />
              </Button>
              {isLoading && changesExist ? (
                <Spinner
                  twcn="w-9"
                  fullScreen={false}
                />
              ) : (
                <Button
                  onPress={changesExist ? handleApplyFiltersAndSort : undefined}
                  hitSlop={8}
                  accessibilityLabel="apply filters and sort method"
                  disabled={!changesExist || isLoading}
                >
                  <SFIcon
                    name="checkmark"
                    size={26}
                    color={
                      changesExist && !isLoading
                        ? Colors.primary
                        : theme.grayText
                    }
                  />
                </Button>
              )}
            </View>
          )
        )
      },
      headerLeft: () => (
        <Button
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="close notebook filters"
        >
          <SFIcon
            name="xmark"
            size={26}
            color={theme.text}
          />
        </Button>
      ),
    })
  }, [navigation, selectedTags, sortOrder, initialState, isLoading, tags])

  useEffect(() => {
    if (query) {
      const filtered = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query.toLowerCase()) &&
          !selectedTags.some((t) => t.id === tag.id)
      )
      setResultTags(filtered)
    } else {
      const filtered = tags.filter((tag) =>
        selectedTags.every((t) => t.id !== tag.id)
      )
      setResultTags(filtered)
    }
  }, [query, tags, selectedTags])

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
          <TagView
            canDelete
            tag={{ id, name, userId }}
          />
        </Pressable>
      )
    }
  )

  return loading ? (
    <Spinner />
  ) : (
    <SafeView
      scroll={false}
      keyboardAvoiding
      twcnContentView="mb-0"
    >
      {tags.length > 0 ? (
        <Fragment>
          {/* Sticky Header */}
          <View style={tw`pb-2 bg-light-background dark:bg-dark-background`}>
            {selectedTags.length > 0 && (
              <View
                style={tw`flex-row flex-wrap -mx-4 border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 px-4 items-center gap-1`}
              >
                {renderedSelectedTags}
              </View>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={tw`flex-1 -mx-4`}
            contentContainerStyle={tw`flex-grow pb-12`}
          >
            {renderedResultTags}
          </ScrollView>
        </Fragment>
      ) : (
        <View style={tw`items-center mx-4 mt-4 justify-center h-48 p-4`}>
          <Txt twcn="text-center text-xl font-semibold mb-4">No tags found</Txt>
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
