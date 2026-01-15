import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import useTheme from '../../hooks/theme'
import {
  useUserStore,
  type WeightMetric,
  type IntensityMetric,
  type UnilateralLogging,
  type HapticFeedback,
  type DistanceMetric,
} from '../../../stores/user-store'
import tw from '../../../tw'
import { View } from 'react-native'
import { useEffect, useState } from 'react'
import Selector from '../../../components/selector'
import Input from '../../../components/input'

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
    category: 'Appearance',
  },
  {
    title: 'Haptic Feedback',
    subtitle: 'Vibrate on various actions in the app',
    options: [
      {
        value: 'enabled',
        label: 'Enabled',
      },
      {
        value: 'disabled',
        label: 'Disabled',
      },
    ],
    type: 'hapticFeedback',
    category: 'Appearance',
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
    category: 'Workouts',
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
    category: 'Workouts',
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
    category: 'Workouts',
  },
  {
    title: 'Default Location',
    subtitle: 'Set a default location for new workouts',
    type: 'location',
    category: 'Workouts',
    isInput: true,
  },
]

type PreferenceKey =
  | 'colorScheme'
  | 'weightMetric'
  | 'intensityMetric'
  | 'unilateralLogging'
  | 'hapticFeedback'
  | 'distanceMetric'
  | 'location'

const UserPreferences = () => {
  const { setColorSchemePreference } = useTheme()
  const { preferences, setPreferences } = useUserStore()
  const [localPreferences, setLocalPreferences] = useState({
    colorScheme: preferences?.colorScheme || 'system',
    weightMetric: preferences?.weightMetric || 'lbs',
    intensityMetric: preferences?.intensityMetric || 'rir',
    unilateralLogging: preferences?.unilateralLogging || 'sync',
    hapticFeedback: preferences?.hapticFeedback || 'enabled',
    distanceMetric: preferences?.distanceMetric || 'miles',
    location: preferences?.location || '',
  })

  // Sync local state when preferences rehydrate
  useEffect(() => {
    if (preferences) {
      const newLocal = {
        colorScheme: preferences.colorScheme || 'system',
        weightMetric: preferences.weightMetric || 'lbs',
        intensityMetric: preferences.intensityMetric || 'rir',
        unilateralLogging: preferences.unilateralLogging || 'sync',
        hapticFeedback: preferences.hapticFeedback || 'enabled',
        distanceMetric: preferences.distanceMetric || 'miles',
        location: preferences.location || '',
      }

      setLocalPreferences(newLocal)
    }
  }, [preferences])

  const handleSelect = (type: PreferenceKey, value: string) => {
    // Guard: Skip if value hasn't changed
    if (localPreferences[type] === value) {
      return
    }

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
    } else if (type === 'hapticFeedback' && preferences) {
      setPreferences({
        ...preferences,
        hapticFeedback: value as 'enabled' | 'disabled',
      })
    } else if (type === 'distanceMetric' && preferences) {
      setPreferences({
        ...preferences,
        distanceMetric: value as 'km' | 'mi',
      })
    } else if (type === 'location' && preferences) {
      setPreferences({
        ...preferences,
        location: value,
      })
    }
  }

  const handleLocationChange = (text: string) => {
    // Update local state immediately
    setLocalPreferences((prev) => ({
      ...prev,
      location: text,
    }))
  }

  const handleLocationBlur = () => {
    // Save to preferences on blur with trimmed value
    if (preferences) {
      setPreferences({
        ...preferences,
        location: localPreferences.location.trim(),
      })
    }
  }

  // Group preferences by category
  const groupedPreferences = preferenceOptions.reduce(
    (acc, preference) => {
      const category = preference.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(preference)
      return acc
    },
    {} as Record<string, typeof preferenceOptions>
  )

  const renderedPreferenceCategories = Object.entries(groupedPreferences).map(
    ([category, preferences]) => {
      return (
        <View
          key={category}
          style={tw`gap-2`}
        >
          <Txt twcn="text-lg font-semibold text-light-text dark:text-dark-text">
            {category}
          </Txt>
          <View style={tw`gap-6`}>
            {preferences.map(({ title, subtitle, options, type, isInput }) => (
              <View key={type}>
                {isInput ? (
                  <View style={tw`gap-2`}>
                    <View>
                      <Txt twcn="">{title}</Txt>
                      {subtitle && (
                        <Txt twcn="text-xs mt-1 text-light-grayText dark:text-dark-grayText">
                          {subtitle}
                        </Txt>
                      )}
                    </View>
                    <Input
                      value={localPreferences[type as PreferenceKey] as string}
                      onChangeText={handleLocationChange}
                      onBlur={handleLocationBlur}
                      placeholder="24 Hour Fitness, LA Fitness, Home, etc."
                      maxLength={100}
                      fullBorder
                      twcnInput="text-light-text dark:text-dark-text flex-row"
                    />
                  </View>
                ) : (
                  <View style={tw`flex-row items-center gap-6 justify-between`}>
                    <View style={tw`flex-1`}>
                      <Txt twcn="">{title}</Txt>
                      {subtitle && (
                        <Txt twcn="text-xs mt-1 text-light-grayText dark:text-dark-grayText">
                          {subtitle}
                        </Txt>
                      )}
                    </View>

                    <Selector
                      options={options || []}
                      selectedValue={localPreferences[type as PreferenceKey]}
                      onSelect={(value) => {
                        handleSelect(type as PreferenceKey, value)
                      }}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )
    }
  )

  return (
    <SafeView
      keyboardAvoiding
      twcnContentView="gap-8"
    >
      {renderedPreferenceCategories}
    </SafeView>
  )
}

export default UserPreferences
