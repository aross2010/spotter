import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useState } from 'react'
import { View, ScrollView } from 'react-native'
import tw from '../../../tw'
import Input from '../../../components/input'
import { Search, X } from 'lucide-react-native'
import useTheme from '../../hooks/theme'
import Button from '../../../components/button'
import Accordion from '../../../components/accordion'

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
      'Yes! From the workout details page, tap the share icon in the header. You can share your workout results to social media or with friends via messaging apps.',
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
      'For each workout, the app records your top set, which is the set with the heaviest weight. This set is placed into the progression chart. Do not expect to see growth with every workout; progression will happen over long periods of consistent training.',
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
      'Yes! Set the workout to "Active" status. This saves your progress without closing the workout, allowing you to log sets as you go.',
    category: 'Tips & Tricks',
  },
]

const FAQ = () => {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<number[]>([])

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

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
    {} as Record<string, FAQItem[]>
  )

  const categories = Object.keys(groupedFAQs)

  return (
    <SafeView
      twcnContentView="px-0"
      scroll
    >
      <View style={tw`px-4 mb-4`}>
        <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText mb-4">
          Search for topics or browse through common questions
        </Txt>

        {/* Search Bar */}
        <View
          style={tw`px-3 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white dark:bg-dark-grayPrimary`}
        >
          <Search
            size={16}
            color={theme.grayText}
          />
          <Input
            twcnInput="flex-1"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Button onPress={() => setSearchQuery('')}>
            <X
              size={16}
              color={theme.grayText}
            />
          </Button>
        </View>
      </View>

      <ScrollView style={tw`flex-1`}>
        <View style={tw`px-4 pb-8`}>
          {filteredFAQs.length === 0 ? (
            <View style={tw`py-8 items-center`}>
              <Txt twcn="text-light-grayText dark:text-dark-grayText">
                No results found
              </Txt>
            </View>
          ) : (
            categories.map((category) => (
              <View
                key={category}
                style={tw`mb-4`}
              >
                <Txt twcn="mb-2 font-poppinsMedium">{category}</Txt>
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
                            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                              {faq.answer}
                            </Txt>
                          </View>
                        </Accordion>
                      </View>
                    )
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeView>
  )
}

export default FAQ
