import { ScrollView, View, useWindowDimensions } from 'react-native'
import React, { useMemo, useRef, useEffect } from 'react'
import { ActivityCalendar } from '../utils/types'
import tw from '../tw'
import Colors from '../constants/colors'
import Txt from './text'
import useTheme from '../app/hooks/theme'

type ActivityMapProps = {
  data: ActivityCalendar
}

// show the year too '25
const ActivityMap = ({ data }: ActivityMapProps) => {
  const { width } = useWindowDimensions()
  const { theme, colorScheme } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

  // Calculate square size dynamically based on view width to fit exactly 20 columns
  const visibleWeeks = useMemo(() => {
    const dayLabelsWidth = 12 // Width of the day labels (w-3)
    const dayLabelsMargin = 8 // mr-2 = 8px
    const safeViewPadding = 32 // 16px padding on each side of SafeView (px-4)
    const wrapperPadding = 32 // 16px padding on each side of wrapper View (p-4)
    const availableWidth =
      width -
      dayLabelsWidth -
      dayLabelsMargin -
      safeViewPadding -
      wrapperPadding

    const targetWeeks = 20
    const gapSize = 2 // Minimal gap between squares

    // Calculate square width to fill available width: (width - all gaps) / columns
    const squareWidth =
      (availableWidth - gapSize * (targetWeeks - 1)) / targetWeeks

    return { count: targetWeeks, gap: gapSize, squareWidth }
  }, [width])

  // Generate the activity map data
  const { weeks, monthLabels } = useMemo(() => {
    const dates = Object.keys(data).sort()
    if (dates.length === 0) {
      return { weeks: [], monthLabels: [] }
    }

    // Parse date string in local timezone to avoid timezone shifts
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const firstDate = parseDate(dates[0])
    const lastDate = parseDate(dates[dates.length - 1])

    // Start from the Monday before the first date
    const startDate = new Date(firstDate)
    const dayOfWeek = startDate.getDay()
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want to go back to Monday, so: if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday)

    // End on the Sunday after the last date, but ensure at least 20 weeks are shown
    const endDate = new Date(lastDate)
    const endDayOfWeek = endDate.getDay()
    // If it's Sunday (0), we're already at the end; otherwise add days to get to Sunday
    const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + daysToSunday)

    // Calculate minimum end date to show at least 20 weeks
    const minEndDate = new Date(startDate)
    minEndDate.setDate(minEndDate.getDate() + 20 * 7 - 1) // 20 weeks from start

    // Use the later of the two dates
    if (endDate < minEndDate) {
      endDate.setTime(minEndDate.getTime())
    }

    const weeks: {
      days: {
        date: string
        status: 'none' | 'planned' | 'completed' | 'active'
      }[]
    }[] = []

    const monthLabels: { label: string; weekIndex: number }[] = []
    let currentMonth = -1
    let currentYear = -1

    let currentWeek: {
      date: string
      status: 'none' | 'planned' | 'completed' | 'active'
    }[] = []

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

      // Check if we're at the start of a new month (on a Monday, which starts a new week)
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()

      if (month !== currentMonth && currentDate.getDay() === 1) {
        currentMonth = month

        // Show year if it's January OR if year changed from previous label
        const yearChanged = currentYear !== -1 && year !== currentYear
        const isJanuary = month === 0
        const showYear = isJanuary || yearChanged

        currentYear = year
        const yearSuffix = showYear ? ` '${year.toString().slice(-2)}` : ''
        const label = `${monthNames[month]}${yearSuffix}`

        monthLabels.push({
          label,
          weekIndex: weeks.length,
        })
      }

      // Determine status
      let status: 'none' | 'planned' | 'completed' | 'active' = 'none'
      const dayData = data[dateString]

      if (dayData) {
        const hasActive = dayData.workouts.some((w) => w.status === 'active')
        const hasCompleted = dayData.workouts.some(
          (w) => w.status === 'completed'
        )
        const hasPlanned = dayData.workouts.some((w) => w.status === 'planned')

        if (hasActive) status = 'active'
        else if (hasCompleted) status = 'completed'
        else if (hasPlanned) status = 'planned'
      }

      currentWeek.push({ date: dateString, status })

      // If it's Sunday (0) or we've reached the end, push the week
      if (currentDate.getDay() === 0 || currentDate >= endDate) {
        // Fill remaining days if needed (for incomplete weeks)
        while (currentWeek.length < 7) {
          currentWeek.push({ date: '', status: 'none' })
        }
        weeks.push({ days: currentWeek })
        currentWeek = []
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Filter out first/last month labels if they only have 1 week
    const filteredMonthLabels = monthLabels
      .filter((label, index) => {
        const isFirst = index === 0
        const isLast = index === monthLabels.length - 1

        if (isFirst) {
          // Check if first month only has 1 week
          const nextLabel = monthLabels[index + 1]
          const weeksInFirstMonth = nextLabel
            ? nextLabel.weekIndex - label.weekIndex
            : weeks.length - label.weekIndex
          if (weeksInFirstMonth === 1) return false
        }

        if (isLast) {
          // Check if last month only has 1 week
          const weeksInLastMonth = weeks.length - label.weekIndex
          if (weeksInLastMonth === 1) return false
        }

        return true
      })
      .map((label, index, array) => {
        // Remove year ONLY from first/last month labels if they have less than 3 weeks
        const isFirstMonth = index === 0
        const isLastMonth = index === array.length - 1

        if (isFirstMonth && label.label.includes("'")) {
          // Calculate weeks in first month
          const nextLabel = array[index + 1]
          const weeksInFirstMonth = nextLabel
            ? nextLabel.weekIndex - label.weekIndex
            : weeks.length - label.weekIndex
          if (weeksInFirstMonth < 3) {
            return {
              ...label,
              label: label.label.split("'")[0].trim(),
            }
          }
        }

        if (isLastMonth && label.label.includes("'")) {
          // Calculate weeks in last month
          const weeksInLastMonth = weeks.length - label.weekIndex
          if (weeksInLastMonth < 3) {
            return {
              ...label,
              label: label.label.split("'")[0].trim(),
            }
          }
        }

        return label
      })

    return { weeks, monthLabels: filteredMonthLabels }
  }, [data])

  // Scroll to the end when component mounts or data changes
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
  }, [weeks])

  const getColorForStatus = (
    status: 'none' | 'planned' | 'completed' | 'active'
  ) => {
    switch (status) {
      case 'active':
        return Colors.blue
      case 'completed':
        return Colors.primary
      case 'planned':
        return Colors.secondary
      default:
        return colorScheme === 'dark'
          ? Colors.dark.grayBorder
          : Colors.light.grayPrimary
    }
  }

  if (weeks.length === 0) {
    return (
      <View style={tw`items-center py-8`}>
        <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
          No activity yet
        </Txt>
      </View>
    )
  }

  // Day labels starting from Monday to match the calendar grid
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <View>
      <View style={tw`flex-row`}>
        {/* Day labels on the left */}
        <View style={tw`mr-2`}>
          <View style={tw`h-4 mb-2`} />
          <View style={{ gap: visibleWeeks.gap }}>
            {dayLabels.map((day, index) => (
              <View
                key={index}
                style={{
                  width: 12,
                  height: visibleWeeks.squareWidth,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt twcn="text-[10px] text-light-grayText dark:text-dark-grayText">
                  {day}
                </Txt>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 0 }}
        >
          <View>
            {/* Month labels */}
            <View style={tw`flex-row mb-2 h-4`}>
              {monthLabels.map(({ label, weekIndex }) => {
                // Calculate position based on square width + gap
                const columnWidth = visibleWeeks.squareWidth + visibleWeeks.gap
                const left = weekIndex * columnWidth
                return (
                  <View
                    key={`${label}-${weekIndex}`}
                    style={[tw`absolute`, { left }]}
                  >
                    <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                      {label}
                    </Txt>
                  </View>
                )
              })}
            </View>

            {/* Activity grid */}
            <View style={{ flexDirection: 'row', gap: visibleWeeks.gap }}>
              {weeks.map((week, weekIndex) => (
                <View
                  key={weekIndex}
                  style={{ gap: visibleWeeks.gap }}
                >
                  {week.days.map((day, dayIndex) => (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={{
                        width: visibleWeeks.squareWidth,
                        height: visibleWeeks.squareWidth,
                        borderRadius: 4,
                        backgroundColor: getColorForStatus(day.status),
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default ActivityMap
