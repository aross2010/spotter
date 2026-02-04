import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import useTheme from '../../hooks/theme'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import { Alert, View } from 'react-native'
import { JSX, ReactNode, useEffect, useRef, useState } from 'react'
import SFIcon from '../../../components/sf-icon'
import { ContextMenu, Host, Picker, Switch } from '@expo/ui/swift-ui'
import { toTitleCase } from '../../../functions/utils'
import Button from '../../../components/button'
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import MyBottomSheet from '../../../components/bottom-sheet'
import { router } from 'expo-router'
const preferencesOptions = [
  {
    title: 'Appearance',
    preferences: [
      {
        title: 'Color Scheme',
        subtitle: null,
        options: [
          {
            label: 'Light',
            value: 'light',
          },
          {
            label: 'Dark',
            value: 'dark',
          },
          {
            label: 'System',
            value: 'system',
          },
        ],
        iconName: 'sun.max.fill',
        type: 'select',
        preference: 'colorScheme',
        canChange: false,
      },
      {
        title: 'Haptic Feedback',
        subtitle: 'Vibrate on certain actions in the app',
        iconName: 'hand.tap.fill',
        onValue: 'enabled',
        offValue: 'disabled',
        type: 'toggle',
        preference: 'hapticFeedback',
        canChange: false,
      },
    ],
  },
  {
    title: 'Workout Logging',
    preferences: [
      {
        title: 'Weight Unit',
        subtitle: null,
        options: [
          {
            label: 'Lbs.',
            value: 'lbs',
          },
          {
            label: 'Kg.',
            value: 'kgs',
          },
        ],
        iconName: 'scalemass.fill',
        type: 'select',
        canChange: true,
        preference: 'weightMetric',
      },
      {
        title: 'Intensity Unit',
        subtitle: null,
        options: [
          {
            label: 'RIR',
            value: 'rir',
          },
          {
            label: 'RPE',
            value: 'rpe',
          },
        ],
        iconName: 'flame.fill',
        type: 'select',
        canChange: false,
        preference: 'intensityMetric',
      },
      {
        title: 'Sync Unilateral Sets',
        subtitle: 'Log same reps for both sides automatically',
        iconName: 'arrow.left.arrow.right',
        type: 'toggle',
        canChange: true,
        preference: 'unilateralLogging',
        onValue: 'sync',
        offValue: 'separate',
      },
      {
        title: 'Autosave Active Workouts',
        subtitle:
          "When the workout status is 'active', workouts are autosaved after input",
        iconName: 'bolt.fill',
        type: 'toggle',
        canChange: false,
        preference: 'autosaveActiveWorkouts',
        onValue: 'enabled',
        offValue: 'disabled',
      },
      {
        title: 'Default Location',
        subtitle: 'New workouts will use this location by default',
        iconName: 'mappin.and.ellipse',
        type: 'input',
        canChange: true,
        preference: 'location',
      },
    ],
  },
] as const

type PreferenceKey =
  | 'colorScheme'
  | 'weightMetric'
  | 'intensityMetric'
  | 'unilateralLogging'
  | 'hapticFeedback'
  | 'distanceMetric'
  | 'location'
  | 'autosaveActiveWorkouts'

const UserPreferences = () => {
  const { setColorSchemePreference, theme } = useTheme()
  const { preferences, setPreferences } = useUserStore()
  const [localPreferences, setLocalPreferences] = useState({
    colorScheme: preferences?.colorScheme || 'system',
    weightMetric: preferences?.weightMetric || 'lbs',
    intensityMetric: preferences?.intensityMetric || 'rir',
    unilateralLogging: preferences?.unilateralLogging || 'sync',
    hapticFeedback: preferences?.hapticFeedback || 'enabled',
    distanceMetric: preferences?.distanceMetric || 'miles',
    location: preferences?.location || '',
    autosaveActiveWorkouts: preferences?.autosaveActiveWorkouts || 'enabled',
  })

  const ref = useRef<BottomSheetModal>(null)
  const workoutsDataRef = useRef<BottomSheetModal>(null)
  const notebookDataRef = useRef<BottomSheetModal>(null)
  // Store the preference key being edited instead of static ReactNode
  const [activePreference, setActivePreference] = useState<{
    preference: PreferenceKey
    options?: readonly string[]
    type: 'select' | 'input'
  } | null>(null)

  // Sync local state when preferences rehydrate
  useEffect(() => {
    if (preferences) {
      setLocalPreferences((prev) => ({
        ...prev,
        colorScheme: preferences.colorScheme || 'system',
        weightMetric: preferences.weightMetric || 'lbs',
        intensityMetric: preferences.intensityMetric || 'rir',
        unilateralLogging: preferences.unilateralLogging || 'sync',
        hapticFeedback: preferences.hapticFeedback || 'enabled',
        distanceMetric: preferences.distanceMetric || 'miles',
        autosaveActiveWorkouts: preferences.autosaveActiveWorkouts || 'enabled',
        // Don't sync location here - it's managed locally and saved on blur
        // to avoid race conditions causing flickering
      }))
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
    } else if (type === 'autosaveActiveWorkouts' && preferences) {
      setPreferences({
        ...preferences,
        autosaveActiveWorkouts: value as 'enabled' | 'disabled',
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

  const renderedPreferencesOptions = preferencesOptions.map((pref) => {
    return (
      <View key={pref.title}>
        <Txt twcn="text-lg font-semibold mb-2">{pref.title}</Txt>
        <View style={tw`rounded-2xl bg-white dark:bg-dark-grayPrimary`}>
          {pref.preferences.map((option, index) => {
            const content = (
              <View
                key={option.title}
                style={tw`${index === pref.preferences.length - 1 ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'} min-h-14 py-2 justify-center`}
              >
                <View style={tw`flex-row items-center justify-between px-4`}>
                  <View style={tw`flex-row items-center gap-4 flex-1 mr-3`}>
                    <SFIcon
                      name={option.iconName}
                      size={20}
                      color={theme.text}
                    />
                    <View style={tw`flex-1`}>
                      <Txt twcn="text-base">
                        {option.title}
                        <Txt twcn="text-light-grayText dark:text-dark-grayText text-sm">
                          {option.canChange && '\u00A0*'}
                        </Txt>
                      </Txt>
                      {option.subtitle && (
                        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                          {option.subtitle}
                        </Txt>
                      )}
                    </View>
                  </View>
                  <View style={tw`shrink-0`}>
                    {option.type === 'select' ? (
                      <View style={tw`flex-row items-center gap-1`}>
                        <Txt twcn="text-light-grayText dark:text-dark-grayText">
                          {option.options.find(
                            (opt) =>
                              opt.value ===
                              localPreferences[
                                option.preference as keyof typeof localPreferences
                              ],
                          )?.label || ''}
                        </Txt>
                        <SFIcon
                          name="chevron.right"
                          size={12}
                          color={theme.grayText}
                        />
                      </View>
                    ) : option.type === 'input' ? (
                      <View
                        style={tw`flex-row items-center gap-1 overflow-hidden`}
                      >
                        <Txt
                          numberOfLines={1}
                          twcn="text-light-grayText dark:text-dark-grayText"
                        >
                          {toTitleCase(localPreferences[option.preference])}
                        </Txt>
                        <SFIcon
                          name="chevron.right"
                          size={12}
                          color={theme.grayText}
                        />
                      </View>
                    ) : (
                      <Host matchContents>
                        <Switch
                          value={['enabled', 'sync'].includes(
                            localPreferences[
                              option.preference as keyof typeof localPreferences
                            ] as string,
                          )}
                          variant="switch"
                          onValueChange={(checked) => {
                            handleSelect(
                              option.preference as PreferenceKey,
                              checked ? option.onValue : option.offValue,
                            )
                          }}
                        />
                      </Host>
                    )}
                  </View>
                </View>
              </View>
            )

            return option.type === 'select' || option.type === 'input' ? (
              <Button
                onPress={() => {
                  setActivePreference({
                    preference: option.preference as PreferenceKey,
                    options:
                      option.type === 'select'
                        ? option.options.map((opt) => opt.value)
                        : undefined,
                    type: option.type,
                  })
                  ref.current?.present()
                }}
                key={option.title}
              >
                {content}
              </Button>
            ) : (
              content
            )
          })}
        </View>
      </View>
    )
  })

  // Render modal content dynamically based on activePreference
  const renderModalContent = () => {
    if (!activePreference) return null

    if (activePreference.type === 'select' && activePreference.options) {
      return (
        <View style={tw`items-center justify-center`}>
          <Host
            style={{
              width: 175,
              height: 125,
            }}
          >
            <Picker
              label={localPreferences[activePreference.preference] as string}
              options={activePreference.options.map((opt) => toTitleCase(opt))}
              variant="inline"
              selectedIndex={activePreference.options.indexOf(
                localPreferences[activePreference.preference] as string,
              )}
              onOptionSelected={({ nativeEvent }) =>
                handleSelect(
                  activePreference.preference,
                  activePreference.options![nativeEvent.index] as string,
                )
              }
            />
          </Host>
        </View>
      )
    }

    if (activePreference.type === 'input') {
      return (
        <View style={tw`pb-6`}>
          <Txt twcn="text-base font-semibold mb-2">
            Default Workout Location
          </Txt>
          <BottomSheetTextInput
            defaultValue={
              localPreferences[activePreference.preference] as string
            }
            onChangeText={(text) => handleLocationChange(text)}
            onBlur={handleLocationBlur}
            maxLength={100}
            autoFocus
            style={tw`text-light-text dark:text-dark-text flex-row rounded-full bg-white dark:bg-dark-grayPrimary p-3`}
          />
        </View>
      )
    }

    // Input type (location)
    return (
      <View style={tw`pb-6`}>
        <Txt twcn="text-base font-semibold mb-2">Default Workout Location</Txt>
        <BottomSheetTextInput
          defaultValue={localPreferences[activePreference.preference] as string}
          onChangeText={(text) => handleLocationChange(text)}
          onBlur={handleLocationBlur}
          maxLength={100}
          autoFocus
          style={tw`text-light-text dark:text-dark-text flex-row rounded-full bg-white dark:bg-dark-grayPrimary p-3`}
        />
      </View>
    )
  }

  const customDataSection = (
    <View>
      <Txt twcn="text-lg font-semibold mb-2">User Metadata</Txt>
      <View style={tw`rounded-2xl bg-white dark:bg-dark-grayPrimary`}>
        <Button onPress={() => router.push('/settings/workout-data')}>
          <View
            style={tw`min-h-14 py-2 flex-row items-center justify-between border-b border-light-grayBorder dark:border-dark-grayBorder px-4`}
          >
            <View style={tw`flex-row items-center gap-4`}>
              <SFIcon
                name="figure.strengthtraining.traditional"
                size={20}
                color={theme.text}
              />
              <Txt twcn="text-base">Workouts</Txt>
            </View>
            <SFIcon
              name="chevron.right"
              size={12}
              color={theme.grayText}
            />
          </View>
        </Button>
        <Button onPress={() => router.push('/settings/notebook-data')}>
          <View
            style={tw`min-h-14 py-2 flex-row items-center justify-between px-4`}
          >
            <View style={tw`flex-row items-center gap-4`}>
              <SFIcon
                name="book.pages.fill"
                size={20}
                color={theme.text}
              />
              <Txt twcn="text-base">Notebook</Txt>
            </View>
            <SFIcon
              name="chevron.right"
              size={12}
              color={theme.grayText}
            />
          </View>
        </Button>
      </View>
    </View>
  )

  return (
    <>
      <SafeView
        keyboardAvoiding
        twcnContentView="gap-6"
      >
        {renderedPreferencesOptions}
        {customDataSection}
      </SafeView>
      <MyBottomSheet
        usesKeyboard
        ref={ref}
        onDismiss={handleLocationBlur}
      >
        {renderModalContent()}
      </MyBottomSheet>
    </>
  )
}

// {localPreferences[option.preference]}
export default UserPreferences
