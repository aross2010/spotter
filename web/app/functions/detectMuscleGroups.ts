import OpenAI from 'openai'
import Redis from 'ioredis'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

const redis = new Redis(process.env.REDIS_DB_URL as string)

type MuscleGroup =
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'hip adductors'
  | 'hip abductors'
  | 'hip flexors'
  | 'glutes'
  | 'front delts'
  | 'rear delts'
  | 'side delts'
  | 'chest'
  | 'lats'
  | 'upper back'
  | 'lower back'
  | 'traps'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'upper abs'
  | 'lower abs'
  | 'obliques'

const ALLOWED_MUSCLE_GROUPS = [
  'quadriceps',
  'hamstrings',
  'calves',
  'hip adductors',
  'hip abductors',
  'hip flexors',
  'glutes',
  'front delts',
  'rear delts',
  'side delts',
  'chest',
  'lats',
  'upper back',
  'lower back',
  'traps',
  'biceps',
  'triceps',
  'forearms',
  'upper abs',
  'lower abs',
  'obliques',
] as const

export async function detectMuscleGroups(exerciseName: string): Promise<{
  primaryMuscleGroup: MuscleGroup | null
  secondaryMuscleGroups: MuscleGroup[]
}> {
  const normalizedName = exerciseName.toLowerCase().trim()
  const cacheKey = normalizedName // Simple key: just the exercise name

  try {
    // Check Redis cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 80,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'exercise_muscle_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              primaryMuscleGroup: {
                type: ['string', 'null'],
                enum: [null, ...ALLOWED_MUSCLE_GROUPS],
                nullable: true,
              },
              secondaryMuscleGroups: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ALLOWED_MUSCLE_GROUPS as unknown as string[],
                },
                maxItems: 3,
              },
            },
            required: ['primaryMuscleGroup', 'secondaryMuscleGroups'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Classify the exercise into muscle groups from the allowed list only. If uncertain, use null and [].',
        },
        {
          role: 'user',
          content: `Exercise: ${exerciseName}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(content)

    // Validate the response structure
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid response format')
    }

    const finalResult = {
      primaryMuscleGroup: result.primaryMuscleGroup || null,
      secondaryMuscleGroups: Array.isArray(result.secondaryMuscleGroups)
        ? result.secondaryMuscleGroups
        : [],
    }

    // Cache the result permanently (no expiration)
    await redis.set(cacheKey, JSON.stringify(finalResult))
    return finalResult
  } catch (error) {
    console.error('Error detecting muscle groups:', error)

    // Return null values if AI detection fails
    return {
      primaryMuscleGroup: null,
      secondaryMuscleGroups: [],
    }
  }
}
