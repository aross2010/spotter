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
    subtitle: 'How sets are logged by default and viewed',
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
    subtitle: 'RIR: Reps in Reserves, RPE: Rate of Perceived Exertion',
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
  {
    title: 'Unilateral Sets',
    subtitle: 'Unilateral sets are synced or logged separately',
    options: [
      {
        value: 'sync',
        label: 'Sync',
      },
      {
        value: 'separate',
        label: 'Separate',
      },
    ],
    type: 'unilateralLogging',
  },
]

type PreferenceKey =
  | 'colorScheme'
  | 'weightMetric'
  | 'intensityMetric'
  | 'unilateralLogging'

const UserPreferences = () => {
  const { theme, colorScheme, setColorSchemePreference } = useTheme()
  const { preferences, setPreferences } = useUserStore()
  const [localPreferences, setLocalPreferences] = useState({
    colorScheme: preferences?.colorScheme || 'system',
    weightMetric: preferences?.weightMetric || 'lbs',
    intensityMetric: preferences?.intensityMetric || 'rir',
    unilateralLogging: preferences?.unilateralLogging || 'sync',
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
    } else if (type === 'unilateralLogging' && preferences) {
      setPreferences({
        ...preferences,
        unilateralLogging: value as 'sync' | 'separate',
      })
    }
  }

  const renderedPreferenceOptions = preferenceOptions.map(
    ({ title, subtitle, options, type }) => {
      return (
        <View
          key={type}
          style={tw`flex-row items-center gap-6 justify-between`}
        >
          <View style={tw`flex-1`}>
            <Txt twcn="font-poppinsMedium">{title}</Txt>
            {subtitle && (
              <Txt twcn="text-xs mt-1 text-light-grayText dark:text-dark-grayText">
                {subtitle}
              </Txt>
            )}
          </View>

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
    <SafeView twcnContentView="gap-6">{renderedPreferenceOptions}</SafeView>
  )
}

export default UserPreferences
