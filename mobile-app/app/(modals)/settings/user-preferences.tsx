import SafeView from '../../../components/safe-view'
import Button from '../../../components/button'
import Txt from '../../../components/text'
import useTheme from '../../hooks/theme'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import { View, Animated, Pressable } from 'react-native'
import { useState, useRef, useEffect } from 'react'

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
    title: 'Weight Metric',
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
    title: 'Intensity Metric',
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
] as const

const UserPreferences = () => {
  const { theme, colorScheme, setColorSchemePreference } = useTheme()
  const { preferences, setPreferences } = useUserStore()

  // Local state for immediate UI feedback
  const [localPreferences, setLocalPreferences] = useState({
    colorScheme: preferences?.colorScheme || 'system',
    weightMetric: preferences?.weightMetric || 'lbs',
    intensityMetric: preferences?.intensityMetric || 'rir',
  })

  console.log('Current Preferences:', preferences)

  const renderedPreferenceOptions = preferenceOptions.map((pref) => {
    return (
      <View
        key={pref.type}
        style={tw`gap-4`}
      >
        <View>
          <Txt twcn="text-base font-poppinsMedium">{pref.title}</Txt>
          {pref.subtitle && (
            <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText mt-1">
              {pref.subtitle}
            </Txt>
          )}
        </View>
        <View style={tw`flex-row justify-between gap-3`}>
          {pref.options.map((option) => {
            const isSelected = localPreferences[pref.type] === option.value

            return (
              <Button
                key={option.value}
                text={option.label}
                onPress={() => {
                  // Update local state immediately for instant feedback
                  setLocalPreferences((prev) => ({
                    ...prev,
                    [pref.type]: option.value,
                  }))

                  // Then update the actual preferences
                  if (pref.type === 'colorScheme') {
                    setColorSchemePreference(
                      option.value as 'light' | 'dark' | 'system'
                    )
                  } else if (pref.type === 'weightMetric' && preferences) {
                    setPreferences({
                      ...preferences,
                      weightMetric: option.value as 'lbs' | 'kgs',
                    })
                  } else if (pref.type === 'intensityMetric' && preferences) {
                    setPreferences({
                      ...preferences,
                      intensityMetric: option.value as 'rir' | 'rpe',
                    })
                  }
                }}
                twcn={`flex-1 items-center justify-center p-2 rounded-full ${
                  isSelected
                    ? 'bg-primary'
                    : 'bg-light-grayPrimary dark:bg-dark-grayPrimary'
                }`}
                twcnText={`text-center text-sm ${isSelected ? 'text-white font-poppinsSemiBold' : ''}`}
              />
            )
          })}
        </View>
      </View>
    )
  })

  return <SafeView twcnInnerView="gap-8">{renderedPreferenceOptions}</SafeView>
}

export default UserPreferences
