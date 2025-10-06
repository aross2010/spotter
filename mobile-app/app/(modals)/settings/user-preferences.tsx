import SafeView from '../../../components/safe-view'
import Button from '../../../components/button'
import Txt from '../../../components/text'
import useTheme from '../../hooks/theme'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import { View, Animated, Pressable } from 'react-native'
import { useState, useRef, useEffect } from 'react'
import Selector from '../../../components/selector'

const preferenceOptions = [
  {
    title: 'Theme',
    subtitle: null,
    options: [
      {
        value: 'light',
        label: 'Light',
      },
      {
        value: 'dark',
        label: 'Dark',
      },
      {
        value: 'system',
        label: 'System',
      },
    ],
    type: 'colorScheme',
  },
  {
    title: 'Weight Unit',
    subtitle: null,
    options: [
      {
        value: 'lbs',
        label: 'Lbs.',
      },
      {
        value: 'kgs',
        label: 'Kgs.',
      },
    ],
    type: 'weightMetric',
  },
  {
    title: 'Intensity Unit',
    subtitle: null,
    options: [
      {
        value: 'rir',
        label: 'RIR',
      },
      {
        value: 'rpe',
        label: 'RPE',
      },
    ],
    type: 'intensityMetric',
  },
]

type PreferenceKey = 'colorScheme' | 'weightMetric' | 'intensityMetric'

const UserPreferences = () => {
  const { theme, colorScheme, setColorSchemePreference } = useTheme()
  const { preferences, setPreferences } = useUserStore()
  const [localPreferences, setLocalPreferences] = useState({
    colorScheme: preferences?.colorScheme || 'system',
    weightMetric: preferences?.weightMetric || 'lbs',
    intensityMetric: preferences?.intensityMetric || 'rir',
  })

  const handleSelect = (type: PreferenceKey, value: string) => {
    // Update local state immediately for instant feedback
    setLocalPreferences((prev) => ({
      ...prev,
      [type]: value,
    }))

    // Then update the actual preferences
    if (type === 'colorScheme') {
      setColorSchemePreference(value as 'light' | 'dark' | 'system')
    } else if (type === 'weightMetric' && preferences) {
      setPreferences({
        ...preferences,
        weightMetric: value as 'lbs' | 'kgs',
      })
    } else if (type === 'intensityMetric' && preferences) {
      setPreferences({
        ...preferences,
        intensityMetric: value as 'rir' | 'rpe',
      })
    }
  }

  const renderedPreferenceOptions = preferenceOptions.map(
    ({ title, subtitle, options, type }) => {
      return (
        <View
          key={type}
          style={tw`flex-row items-center gap-4 justify-between`}
        >
          <Txt>{title}</Txt>

          <Selector
            options={options}
            selectedValue={localPreferences[type as PreferenceKey]}
            onSelect={(value) => {
              handleSelect(type as PreferenceKey, value)
            }}
          />
        </View>
      )
    }
  )

  return (
    <SafeView twcnContentView="gap-4">
      {renderedPreferenceOptions}
      <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText mt-2">
        Weight units can be changed on a per-workout basis. When viewed,
        workouts will be converted to your preferred unit.
      </Txt>
      <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
        RIR: Reps in Reserves – how many more full reps you could have
        performed. RPE: Rate of Perceived Exertion – a scale from 1-10 to rate
        the difficulty of a set.
      </Txt>
    </SafeView>
  )
}

export default UserPreferences
