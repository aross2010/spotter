import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import tw from '../../../tw'
import useTheme from '../../hooks/theme'
import Accordion from '../../../components/accordion'
import { useLocalSearchParams } from 'expo-router'

type FAQItem = {
  id: number
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // Workouts
  {
    id: 2,
    question: 'What are workout statuses?',
    answer:
      'There are three workout statuses: Completed (finished workouts), Planned (future workouts you want to schedule), and Active (workouts currently in progress). Only completed workouts contribute to your activity stats and history.',
    category: 'Workouts',
  },
  {
    id: 4,
    question: 'Can I clone or copy a workout?',
    answer:
      'Yes! Open a workout, tap the three-dot menu, and select "Clone". This creates a copy of the workout with all exercises and sets, which you can then modify as needed.',
    category: 'Workouts',
  },
  {
    id: 3123,
    question: 'What are workout tags used for?',
    answer:
      'Workout tags help you categorize and organize your workouts. Use tags to remember the time of day, who you workout with, the training block, or any other context.',
    category: 'Workouts',
  },
  {
    id: 90,
    question: 'How can I filter my workouts?',
    answer:
      'You can filter workouts by tags, workout names, exercises, locations, and status (completed, planned, active). The combinations are endless to help you find the workout you are looking for. Tap the filter icon in the Workouts tab to select your desired filters.',
    category: 'Workouts',
  },
  {
    id: 1,
    question: 'Can I share a workout with others?',
    answer:
      'Yes! From the workout details page, tap the share icon in the header. You can share your workout results to social media or with friends via messaging apps. You may also tap the camera screenshot icon to take a screenshot of your entire workout to share.',
    category: 'Workouts',
  },

  // Exercises
  {
    id: 6,
    question: 'How do I create an exercise?',
    answer:
      'When creating or editing a workout, simply type in the exercise in the exercise field. Once the workout is saved, the exercise will be added to your Exercises tab.',
    category: 'Exercises',
  },
  {
    id: 7,
    question: 'Can I edit exercise information?',
    answer:
      'Yes, from the exercises tab, tap any exercise to view its details. You can press the edit button in the header to change the name, muscle groups, workout type, and add a description.',
    category: 'Exercises',
  },
  {
    id: 35,
    question: 'How do I delete an exercise?',
    answer:
      'As of now, you cannot delete an exercise. An exercise will disappear from your Exercises tab if it has not been used in any workouts.',
    category: 'Exercises',
  },
  {
    id: 8,
    question: 'How are exercise muscle groups determined?',
    answer:
      'When an exercise is created, AI will analyze the name and assign the exercise muscle groups. The accuracy of assigned muscle groups varies. You can easily edit muscle groups from the exercise details page if needed.',
    category: 'Exercises',
  },
  {
    id: 9,
    question:
      'What is the difference between a bilateral and unilateral exercise?',
    answer:
      'Bilateral exercises work both sides of the body simultaneously (e.g., squats), while unilateral exercises target one side at a time (e.g., single-arm rows). You can toggle this attribute when creating or editing an exercise.',
    category: 'Exercises',
  },
  {
    id: 3,
    question: 'How is exercise progression tracked?',
    answer:
      'For each workout, the app records your best set, which is then translated into an estimated one-rep max (1RM). The progression graph tracks how your 1RM has changed over time, giving you an accurate insight into how your are progressing that exercise.',
    category: 'Exercises',
  },
  {
    id: 434,
    question: 'How is the estimated one-rep max (1RM) calculated?',
    answer:
      'The algorithm takes your most recent top set, and takes into account the number of reps, weight, and intensity (if applicable) to estimate your one-rep max.',
    category: 'Exercises',
  },
  {
    id: 16,
    question: 'Can I share an exercise with others?',
    answer:
      'Yes! From the exercise details page, tap the share icon in the header. You can share your exercise progress and stats to social media or with friends via messaging apps.',
    category: 'Exercises',
  },

  // Sets & Reps
  {
    id: 10,
    question: 'What are supersets?',
    answer:
      'Supersets are two or more exercises performed back-to-back with no rest. Tap the superset icon when logging sets to group them. Supersets are indicated by colored circles on the timeline.',
    category: 'Sets & Reps',
  },
  {
    id: 11,
    question: 'What are dropsets?',
    answer:
      'Dropsets are sets where you reduce the weight mid-set and continue to failure. Tap the dropset icon when logging a set. Dropsets are highlighted with a colored background.',
    category: 'Sets & Reps',
  },
  {
    id: 12,
    question: 'How do I log unilateral exercises?',
    answer:
      'When adding sets for unilateral exercises (like single-arm rows), tap the sync/separate icon. You can log left and right sides separately or sync them to enter the same values for both.',
    category: 'Sets & Reps',
  },
  {
    id: 13,
    question: 'Can I set my default unilateral logging preference?',
    answer:
      'Yes! Go to Settings > User Preferences and toggle "Unilateral Logging". Choose "Sync" to automatically sync left/right values or "Separate" to log them independently by default.',
    category: 'Sets & Reps',
  },
  {
    id: 14,
    question: 'How do I mark reps as partial reps?',
    answer:
      'When logging a set, fill in the "Part." field to indicate partial reps.',
    category: 'Sets & Reps',
  },
  {
    id: 5,
    question: 'How do I track my sets in kilograms (kg)?',
    answer:
      'You can change the weight units in Settings > User Preferences. Toggle "Weight Units" to switch between pounds (lbs) and kilograms (kg). All your logged weights will automatically convert to the selected unit. If you only need to convert specific workouts, tap the three-dot menu in Exercise section to toggle the correct unit.',
    category: 'Sets & Reps',
  },
  {
    id: 20,
    question: 'What is RIR?',
    answer:
      'RIR stands for "Reps In Reserve" and indicates how many more reps you could have performed before reaching failure. For example, if you complete a set of 10 reps with 2 RIR, it means you could have done 2 more reps before failing.',
    category: 'Sets & Reps',
  },
  {
    id: 19,
    question: 'What is RPE?',
    answer:
      'RPE stands for "Rate of Perceived Exertion". It is a subjective measure of how hard a set felt on a scale from 1 to 10, with 10 being maximum effort.',
    category: 'Sets & Reps',
  },

  // Body Weight Tracking
  {
    id: 26,
    question: 'How do I track my body weight?',
    answer:
      'Tap the "+" icon on the home screen and select "Weight Entry". You can log your current weight in your preferred unit.',
    category: 'Body Weight Tracking',
  },
  {
    id: 27,
    question: 'Can I log my body weight more than once per day?',
    answer:
      'No, you may only log your body weight once per day. If you try to log a second entry on the same day, the new entry will overwrite the previous one.',
    category: 'Body Weight Tracking',
  },
  {
    id: 28,
    question: 'Can I delete or edit a body weight entry?',
    answer:
      'Yes, to delete a body weight entry, go to the body weight form, select the day you wish to delete, and tap the trash icon. To modify an entry, simply log a new weight for the same day and it will overwrite the previous entry.',
    category: 'Body Weight Tracking',
  },

  // Notebook
  {
    id: 15,
    question: 'What is the Notebook for?',
    answer:
      'The Notebook is your training journal for everything outside of your sets. Use it to track injuries, progress, warm-up routines, stretching, diet notes, weight, and more.',
    category: 'Notebook',
  },
  {
    id: 18,
    question: 'What are notebook tags used for?',
    answer:
      'Notebook tags are used to categorize and organize your entries. You can create custom tags for different topics, making it easier to find related notes later.',
    category: 'Notebook',
  },
  {
    id: 17,
    question: 'Can I filter notebook entries by tags?',
    answer:
      'Yes! Tap the filter icon in the Notebook tab and select one or more tags. Only entries with those tags will be displayed.',
    category: 'Notebook',
  },

  // Account & Settings
  {
    id: 21,
    question: 'How do I change my profile information?',
    answer:
      'Go to Settings and tap on your profile section. You can update your name, email, and other personal information.',
    category: 'Account & Settings',
  },
  {
    id: 22,
    question: 'Can I use the app in dark mode?',
    answer:
      "Yes! The app automatically follows your system theme settings. You can change your device's appearance settings to switch between light and dark mode.",
    category: 'Account & Settings',
  },
  {
    id: 23,
    question: 'How do I change measurement units?',
    answer:
      'Go to Settings > User Preferences and toggle "Weight Units" to switch between pounds (lbs) and kilograms (kg). The app will automatically convert all your data.',
    category: 'Account & Settings',
  },
  {
    id: 24,
    question: 'Can I link my Google or Apple account?',
    answer:
      'Yes! Go to Settings > Linked Accounts to connect your Google or Apple account for easier sign-in.',
    category: 'Account & Settings',
  },
  {
    id: 25,
    question: 'How do I delete my account?',
    answer:
      'Go to Settings, scroll to the bottom, and tap "Delete Account". Warning: This permanently deletes all your data and cannot be undone.',
    category: 'Account & Settings',
  },

  // Tips & Tricks
  {
    id: 27,
    question: 'How do I quickly repeat a previous workout?',
    answer:
      'Find the workout in your history, tap the three-dot menu, and select "Clone". The date will be set to today. All you need to do is adjust your sets as needed.',
    category: 'Tips & Tricks',
  },
  {
    id: 28,
    question: 'Can I reorder exercises in a workout?',
    answer:
      'Yes! When editing a workout, press on the exercise number to trigger the input. You can then change the number to reorder the exercises as desired.',
    category: 'Tips & Tricks',
  },
  {
    id: 29,
    question: 'Can I save a workout without exiting it?',
    answer:
      'Yes! Set the workout status to "active". Now, every save you make will keep you in the workout form. Additionally, any changes you make will be quickly auto-saved for you. ',
    category: 'Tips & Tricks',
  },
  {
    id: 39,
    question: 'Is there anyway to turn off auto-saving?',
    answer:
      'Yes, go to Settings > User Preferences and toggle off "Auto-Save Workouts". With this off, you will need to manually save your workouts, but it will prevent any unwanted saves while editing.',
    category: 'Tips & Tricks',
  },
]

const FAQ = () => {
  const { theme } = useTheme()
  const { q } = useLocalSearchParams()
  const searchQuery = (q as string) || ''
  const [expandedIds, setExpandedIds] = useState<number[]>([])

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  // Auto-expand all FAQs when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedIds(filteredFAQs.map((faq) => faq.id))
    } else {
      setExpandedIds([])
    }
  }, [searchQuery])

  const filteredFAQs = faqData.filter((faq) => {
    if (!searchQuery.trim()) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower) ||
      faq.category.toLowerCase().includes(searchLower)
    )
  })

  // Group FAQs by category
  const groupedFAQs = filteredFAQs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = []
      }
      acc[faq.category].push(faq)
      return acc
    },
    {} as Record<string, FAQItem[]>,
  )

  const categories = Object.keys(groupedFAQs)

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return (
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
          {text}
        </Txt>
      )
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <Text style={tw`text-xs text-light-grayText dark:text-dark-grayText`}>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text
              key={index}
              style={tw`bg-primary/50`}
            >
              {part}
            </Text>
          ) : (
            part
          ),
        )}
      </Text>
    )
  }

  return (
    <SafeView twcnContentView="px-0">
      <View style={tw`px-4`}>
        {filteredFAQs.length === 0 ? (
          <View style={tw`py-8 items-center`}>
            <Txt twcn="text-light-grayText dark:text-dark-grayText">
              No results found
            </Txt>
          </View>
        ) : (
          <View style={tw`flex-col gap-6`}>
            {categories.map((category) => (
              <View
                key={category}
                style={tw``}
              >
                <Txt twcn="mb-2 font-semibold text-lg">{category}</Txt>
                <View
                  style={tw`bg-white dark:bg-dark-grayPrimary rounded-xl overflow-hidden`}
                >
                  {groupedFAQs[category].map((faq, index) => {
                    const isLast = index === groupedFAQs[category].length - 1
                    return (
                      <View
                        key={faq.id}
                        style={tw`${!isLast ? 'border-b border-light-grayBorder dark:border-dark-grayBorder' : ''}`}
                      >
                        <Accordion
                          title={faq.question}
                          isExpanded={expandedIds.includes(faq.id)}
                          onToggle={() => toggleExpanded(faq.id)}
                        >
                          <View style={tw`px-4 pb-4`}>
                            {highlightText(faq.answer, searchQuery)}
                          </View>
                        </Accordion>
                      </View>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeView>
  )
}

export default FAQ
