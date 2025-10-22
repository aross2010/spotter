import { View, Dimensions } from 'react-native'
import React, { useMemo } from 'react'
import { ActivityCalendar as ActivityCalendarType } from '../utils/types'
import { CalendarList } from 'react-native-calendars'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import tw from '../tw'

type ActivityCalendarProps = {
  data: ActivityCalendarType
}

const ActivityCalendar = ({ data }: ActivityCalendarProps) => {
  const { theme, colorScheme } = useTheme()

  // Get current date in local timezone (YYYY-MM-DD)
  const todayDate = new Date()
  const todayString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

  const screenWidth = Dimensions.get('window').width

  // Get min and max dates from activity data
  const { minDate, maxDate, pastScrollRange } = useMemo(() => {
    const dates = Object.keys(data)
    if (dates.length === 0) {
      return { minDate: todayString, maxDate: todayString, pastScrollRange: 0 }
    }

    const sortedMinDate = dates.sort()[0]

    // Calculate months between minDate and today
    const minDateObj = new Date(sortedMinDate)
    const todayDateObj = new Date(todayString)

    const pastMonthsDiff =
      (todayDateObj.getFullYear() - minDateObj.getFullYear()) * 12 +
      (todayDateObj.getMonth() - minDateObj.getMonth())

    return {
      minDate: sortedMinDate,
      maxDate: todayString,
      pastScrollRange: Math.max(0, pastMonthsDiff),
    }
  }, [data, todayString])

  // Transform activity data into marked dates for the calendar
  const markedDates = useMemo(() => {
    const marked: any = {}
    // Get today's date in local timezone (YYYY-MM-DD)
    const todayDate = new Date()
    const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

    Object.entries(data).forEach(([date, dayData]) => {
      // Determine the color based on workout status priority
      // Priority: active > completed > planned
      let backgroundColor = 'transparent'
      let hasActive = false
      let hasCompleted = false
      let hasPlanned = false

      dayData.workouts.forEach((workout) => {
        if (workout.status === 'active') hasActive = true
        else if (workout.status === 'completed') hasCompleted = true
        else if (workout.status === 'planned') hasPlanned = true
      })

      if (hasActive) {
        backgroundColor = Colors.secondary
      } else if (hasCompleted) {
        backgroundColor = Colors.primary
      } else if (hasPlanned) {
        backgroundColor = 'rgba(139, 92, 246, 0.25)' // primary/25
      }

      const isToday = date === today
      const isPast = date < today

      // Determine text color
      let textColor = theme.text
      if (hasActive || hasCompleted) {
        textColor = Colors.dark.text
      } else if (isPast) {
        textColor = theme.text
      }

      marked[date] = {
        customStyles: {
          container: {
            backgroundColor,
            borderRadius: 12,
          },
          text: {
            color: textColor,
            fontFamily: isToday ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
          },
        },
      }

      // Add dot for today
      if (isToday) {
        marked[date].marked = true
        marked[date].dotColor = Colors.primary
      }
    })

    // If today has no workouts, still add it with dot
    if (!marked[today]) {
      marked[today] = {
        marked: true,
        dotColor: Colors.primary,
        customStyles: {
          text: {
            fontFamily: 'Poppins_600SemiBold',
            color: Colors.primary,
          },
        },
      }
    }

    return marked
  }, [data, theme])

  return (
    <View style={tw`rounded-xl overflow-hidden`}>
      <CalendarList
        horizontal={true}
        pagingEnabled={true}
        calendarWidth={screenWidth - 32}
        minDate={minDate}
        maxDate={maxDate}
        current={todayString}
        pastScrollRange={pastScrollRange}
        futureScrollRange={0}
        markingType="custom"
        markedDates={markedDates}
        theme={{
          calendarBackground:
            colorScheme === 'dark' ? theme.grayPrimary : 'white',
          textSectionTitleColor: theme.text,
          textSectionTitleDisabledColor: theme.graySecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.dark.text,
          todayTextColor: Colors.primary,
          todayDotColor: Colors.primary,
          dayTextColor: theme.text,
          textDisabledColor: theme.grayTertiary,
          monthTextColor: theme.text,
          textMonthFontFamily: 'Poppins_600SemiBold',
          textDayFontFamily: 'Poppins_400Regular',
          textDayHeaderFontFamily: 'Poppins_600SemiBold',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
          arrowColor: Colors.primary,
        }}
        calendarStyle={{
          paddingLeft: 4,
          paddingRight: 4,
        }}
        style={{
          borderRadius: 24,
        }}
      />
    </View>
  )
}

export default ActivityCalendar
