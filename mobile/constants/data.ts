export const MUSCLE_GROUPS = [
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Hip Adductors',
  'Hip Abductors',
  'Hip Flexors',
  'Glutes',
  'Front Delts',
  'Rear Delts',
  'Side Delts',
  'Chest',
  'Lats',
  'Upper Back',
  'Lower Back',
  'Traps',
  'Biceps',
  'Triceps',
  'Forearms',
  'Upper Abs',
  'Lower Abs',
  'Obliques',
]

export const MONTHS: Map<string, string> = new Map([
  ['1', '❄️ January'],
  ['2', '❤️ February'],
  ['3', '🍀 March'],
  ['4', '🐣 April'],
  ['5', '🌸 May'],
  ['6', '🌞 June'],
  ['7', '🎆 July'],
  ['8', '☀️ August'],
  ['9', '🍂 September'],
  ['10', '🎃 October'],
  ['11', '🦃 November'],
  ['12', '🎄 December'],
])

export const APP_ID = '6754656428'

export const cardioMachines = [
  {
    name: 'Treadmill',
    iconName: 'figure.run.treadmill',
    fields: [
      {
        label: 'Duration',
        name: 'duration',
      },
      {
        label: 'Distance',
        name: 'distance',
      },
      {
        label: 'Speed',
        name: 'speed',
      },
      {
        label: 'Incline',
        name: 'incline',
      },
      {
        label: 'Calories Burned',
        name: 'caloriesBurned',
      },
    ],
  },
  {
    name: 'Stair Climber',
    iconName: 'figure.stair.stepper',
    fields: [
      {
        label: 'Duration',
        name: 'duration',
      },
      {
        label: 'Level',
        name: 'level',
      },
      {
        label: 'Steps Climbed',
        name: 'stepsClimbed',
      },
      {
        label: 'Calories Burned',
        name: 'caloriesBurned',
      },
    ],
  },
  {
    name: 'Stationary Bike',
    iconName: 'figure.indoor.cycle',
    fields: [
      {
        label: 'Duration',
        name: 'duration',
      },
      {
        label: 'Distance',
        name: 'distance',
      },
      {
        label: 'Speed',
        name: 'speed',
      },
      {
        label: 'Resistance Level',
        name: 'resistanceLevel',
      },
      {
        label: 'Calories Burned',
        name: 'caloriesBurned',
      },
    ],
  },
] as const
