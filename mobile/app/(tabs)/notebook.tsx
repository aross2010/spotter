import { View, FlatList } from 'react-native'
import React, { useEffect } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { PenLine, ListFilter, Plus, BookOpen } from 'lucide-react-native'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import Button from '../../components/button'
import { router, useNavigation } from 'expo-router'
import Spinner from '../../components/activity-indicator'
import NotebookEntryView from '../../components/notebook-entry'
import { useNotebook } from '../../context/notebook-context'
import { NotebookEntry } from '../../utils/types'
import { MONTHS } from '../../constants/data'

const Notebook = () => {
  const {
    currentNotebookEntries,
    isLoading,
    isLoadingMore,
    hasMore,
    initializeNotebook,
    loadMoreEntries,
    tagFilters,
    sortOrder,
  } = useNotebook()
  const navigation = useNavigation()
  const hasEntries = currentNotebookEntries.length > 0
  const noResults = currentNotebookEntries.length === 0 && tagFilters.length > 0

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const numFilters = tagFilters.length + (sortOrder !== 'desc' ? 1 : 0)
        return (
          <View style={tw`flex-row items-center gap-2 mr-4`}>
            {(hasEntries || noResults) && (
              <View style={tw`relative`}>
                <Link
                  href="/notebook-filters"
                  style={tw` bg-primary/10 rounded-2xl p-2`}
                >
                  <ListFilter
                    size={20}
                    color={Colors.primary}
                  />
                </Link>
                {numFilters > 0 && (
                  <View
                    style={tw.style(
                      'absolute -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center bg-primary',
                      { pointerEvents: 'none' }
                    )}
                  >
                    <Txt twcn="text-xs font-poppinsMedium text-white">
                      {numFilters}
                    </Txt>
                  </View>
                )}
              </View>
            )}

            <Link
              href="/notebook-entry-form"
              style={tw`bg-primary/10 rounded-2xl p-2`}
            >
              <Plus
                size={20}
                color={Colors.primary}
              />
            </Link>
          </View>
        )
      },
    })
  }, [navigation, tagFilters, sortOrder, currentNotebookEntries])

  useEffect(() => {
    initializeNotebook()
  }, [])

  const pinnedTitle = (
    <View style={tw`flex-row items-center gap-1 mb-4`}>
      <Txt twcn="font-poppinsSemiBold text-base">📌 Pinned</Txt>
    </View>
  )

  const renderEntry = ({
    item,
    index,
  }: {
    item: NotebookEntry
    index: number
  }) => {
    let addMonth = false
    let lastInMonth = false
    let roundTop = false
    let roundBottom = false
    const { date, pinned, id } = item

    // Parse date in local timezone to avoid UTC shifts
    const [year, monthNum, day] = date.split('-').map(Number)
    const localDate = new Date(year, monthNum - 1, day)
    const month = localDate.toLocaleString('default', {
      month: 'numeric',
      year: 'numeric',
    })

    if (index === 0) {
      const nextEntry = currentNotebookEntries[index + 1]
      let nextMonth = null
      if (nextEntry) {
        const [nextYear, nextMonthNum, nextDay] = nextEntry.date
          .split('-')
          .map(Number)
        const nextLocalDate = new Date(nextYear, nextMonthNum - 1, nextDay)
        nextMonth = nextLocalDate.toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        })
      }

      if (nextMonth && month !== nextMonth && !pinned) {
        lastInMonth = true
      }
    }

    // Check if we need to show month header
    if (index > 0) {
      const prevEntry = currentNotebookEntries[index - 1]
      const [prevYear, prevMonthNum, prevDay] = prevEntry.date
        .split('-')
        .map(Number)
      const prevLocalDate = new Date(prevYear, prevMonthNum - 1, prevDay)
      const prevMonth = prevLocalDate.toLocaleString('default', {
        month: 'numeric',
        year: 'numeric',
      })

      const nextEntry = currentNotebookEntries[index + 1]
      let nextMonth = null
      if (nextEntry) {
        const [nextYear, nextMonthNum, nextDay] = nextEntry.date
          .split('-')
          .map(Number)
        const nextLocalDate = new Date(nextYear, nextMonthNum - 1, nextDay)
        nextMonth = nextLocalDate.toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        })
      }

      if (nextMonth && month !== nextMonth && !pinned) {
        lastInMonth = true
      }

      if (
        !pinned &&
        (prevEntry.pinned || (month !== prevMonth && !prevEntry.pinned))
      ) {
        addMonth = true
      }

      // Handle pinned entries rounding
      if (pinned && !prevEntry.pinned) {
        roundTop = true
      }
      if (pinned && nextEntry && !nextEntry.pinned) {
        roundBottom = true
      }
    } else if (!pinned) {
      addMonth = true
    } else if (pinned) {
      // First entry and it's pinned
      roundTop = true
    }

    // Check if this is the last pinned entry
    if (pinned) {
      const nextEntry = currentNotebookEntries[index + 1]
      if (!nextEntry || !nextEntry.pinned) {
        roundBottom = true
      }
    }

    const [displayMonthNum, displayYear] = month.split('/')

    const monthTitle = addMonth && (
      <View
        style={tw`flex-row items-center gap-2 ${index === 0 ? 'mb-4' : 'my-4'}}`}
      >
        <Txt twcn="font-poppinsSemiBold text-base">
          {MONTHS.get(displayMonthNum)} {displayYear}
        </Txt>
      </View>
    )

    const showPinnedHeader = index === 0 && pinned
    if (index === currentNotebookEntries.length - 1) {
      lastInMonth = true
      if (pinned) roundBottom = true
    }

    return (
      <View>
        {showPinnedHeader && pinnedTitle}
        {monthTitle}
        <NotebookEntryView
          entry={item}
          roundBottom={pinned ? roundBottom : lastInMonth}
          roundTop={pinned ? roundTop : addMonth}
        />
      </View>
    )
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMoreEntries()
    }
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return <Spinner />
  }

  const notebookPrompt = (
    <SafeView
      hasTabBar
      scroll={false}
    >
      <View style={tw`flex-1 items-center justify-center px-16`}>
        <BookOpen
          color={Colors.primary}
          strokeWidth={1}
          size={64}
        />
        <Txt twcn="text-xl font-poppinsMedium text-center mt-6 mb-3">
          Your Notebook
        </Txt>
        <Txt twcn="text-center text-sm text-light-grayText dark:text-dark-grayText">
          Capture everything beyond your workouts
        </Txt>
        <Button
          onPress={() => router.push('/notebook-entry-form')}
          text="Start Writing"
          twcn="mt-6 py-4 w-full items-center flex-row justify-center rounded-full bg-primary"
          twcnText="font-poppinsMedium text-dark-text"
        >
          <PenLine
            color={Colors.dark.text}
            size={16}
            style={tw`ml-2`}
          />
        </Button>
      </View>
    </SafeView>
  )

  const notebookView = noResults ? (
    <SafeView>
      <View style={tw`flex-1 items-center justify-center`}>
        <Txt twcn="text-center text-xl mb-4 font-poppinsSemiBold">
          No results found
        </Txt>
        <Txt twcn="text-center px-8 text-sm text-light-grayText dark:text-dark-grayText mt-2">
          Try adjusting your filters or sort method to find what you're looking
          for.
        </Txt>
      </View>
    </SafeView>
  ) : (
    <View style={tw`flex-1`}>
      <FlatList
        data={currentNotebookEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        disableVirtualization={true}
        initialNumToRender={currentNotebookEntries.length}
        maxToRenderPerBatch={currentNotebookEntries.length}
      />
    </View>
  )

  return isLoading ? (
    <Spinner />
  ) : hasEntries || noResults ? (
    notebookView
  ) : (
    notebookPrompt
  )
}

export default Notebook
