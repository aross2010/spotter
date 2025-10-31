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
  const { theme } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

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

    console.log('first date no parese:', dates[0], firstDate)
    console.log('last date no parse:', dates[dates.length - 1], lastDate)
    console.log('first date parsed:', parseDate(dates[0]))
    console.log('last date parsed:', parseDate(dates[dates.length - 1]))
    console.log('All data keys:', dates)
    console.log('Sample data entry:', dates[0], data[dates[0]])

    // Start from the Monday before the first date
    const startDate = new Date(firstDate)
    const dayOfWeek = startDate.getDay()
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want to go back to Monday, so: if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday)

    // End on the Sunday after the last date
    const endDate = new Date(lastDate)
    const endDayOfWeek = endDate.getDay()
    // If it's Sunday (0), we're already at the end; otherwise add days to get to Sunday
    const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + daysToSunday)

    const weeks: {
      days: {
        date: string
        status: 'none' | 'planned' | 'completed' | 'active'
      }[]
    }[] = []

    const monthLabels: { label: string; weekIndex: number }[] = []
    let currentMonth = -1

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
      if (month !== currentMonth && currentDate.getDay() === 1) {
        currentMonth = month
        const year = currentDate.getFullYear().toString().slice(-2) // Get last 2 digits of year
        const label =
          month === 0 ? `${monthNames[month]} '${year}` : monthNames[month]
        monthLabels.push({
          label,
          weekIndex: weeks.length,
        })
      }

      // Determine status
      let status: 'none' | 'planned' | 'completed' | 'active' = 'none'
      const dayData = data[dateString]

      // Debug: log when we find data
      if (dayData && dayData.workouts.length > 0) {
        console.log(
          'Found workout data for dateString:',
          dateString,
          'Data:',
          dayData
        )
      }
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

    // Calculate how many weeks we can fit on screen
    // Width minus padding (48px), minus day labels (12px), minus gaps, divided by (12px square + 4px gap)
    const availableWidth = width - 48 - 12
    const weeksNeeded = Math.floor(availableWidth / 16)

    // Add future weeks to fill the screen if needed
    let futureDate = new Date(endDate)
    futureDate.setDate(futureDate.getDate() + 1) // Start from day after endDate

    while (weeks.length < weeksNeeded) {
      let futureWeek: {
        date: string
        status: 'none' | 'planned' | 'completed' | 'active'
      }[] = []

      // Create a full week of future dates
      for (let i = 0; i < 7; i++) {
        const dateString = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`

        // Check for month label on Monday
        const month = futureDate.getMonth()
        if (month !== currentMonth && futureDate.getDay() === 1) {
          currentMonth = month
          const year = futureDate.getFullYear().toString().slice(-2) // Get last 2 digits of year
          const label =
            month === 0 ? `${monthNames[month]} '${year}` : monthNames[month]
          monthLabels.push({
            label,
            weekIndex: weeks.length,
          })
        }

        futureWeek.push({ date: dateString, status: 'none' })
        futureDate.setDate(futureDate.getDate() + 1)
      }

      weeks.push({ days: futureWeek })
    }

    return { weeks, monthLabels }
  }, [data, width])

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
        return theme.grayPrimary
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
          <View style={tw`gap-1`}>
            {dayLabels.map((day, index) => (
              <View
                key={index}
                style={tw`w-3 h-3 items-center justify-center`}
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
          contentContainerStyle={tw`pr-4`}
        >
          <View>
            {/* Month labels */}
            <View style={tw`flex-row mb-2 h-4`}>
              {monthLabels.map(({ label, weekIndex }) => {
                const isJanuaryWithYear = label.includes("'")
                return (
                  <View
                    key={`${label}-${weekIndex}`}
                    style={[tw`absolute`, { left: weekIndex * 16 }]}
                  >
                    <Txt
                      twcn={`text-xs text-light-grayText dark:text-dark-grayText ${isJanuaryWithYear ? 'font-poppinsSemiBold' : ''}`}
                    >
                      {label}
                    </Txt>
                  </View>
                )
              })}
            </View>

            {/* Activity grid */}
            <View style={tw`flex-row gap-1`}>
              {weeks.map((week, weekIndex) => (
                <View
                  key={weekIndex}
                  style={tw`gap-1`}
                >
                  {week.days.map((day, dayIndex) => (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        tw`w-3 h-3 rounded-sm`,
                        {
                          backgroundColor: getColorForStatus(day.status),
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={tw`flex-row items-center gap-3 mt-2`}>
        <View style={tw`flex-row gap-1 items-center`}>
          <View
            style={[
              tw`w-3 h-3 rounded-sm`,
              { backgroundColor: Colors.primary },
            ]}
          />
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            Workout
          </Txt>
        </View>
        <View style={tw`flex-row gap-1 items-center`}>
          <View
            style={[
              tw`w-3 h-3 rounded-sm`,
              { backgroundColor: Colors.secondary },
            ]}
          />
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            Planned
          </Txt>
        </View>
        <View style={tw`flex-row gap-1 items-center`}>
          <View
            style={[tw`w-3 h-3 rounded-sm`, { backgroundColor: Colors.blue }]}
          />
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            Active
          </Txt>
        </View>
      </View>
    </View>
  )
}

export default ActivityMap
