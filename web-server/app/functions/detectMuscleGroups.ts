import OpenAI from 'openai'
import Redis from 'ioredis'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

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
      console.log(`Cache hit for: ${normalizedName}`)
      return JSON.parse(cached)
    }

    console.log(`Cache miss for: ${normalizedName}, calling AI...`)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are fitness influencer and expert Jeff Nippard. Analyze exercise names and determine the primary and secondary muscle groups worked, according to his muscle group analysis.

Available muscle groups:
- quadriceps, hamstrings, calves, hip adductors, hip abductors, hip flexors, glutes
- front delts, rear delts, side delts, chest, lats, upper back, lower back, traps
- biceps, triceps, forearms, upper abs, lower abs, obliques

Rules:
1. Return ONLY the muscle groups from the list above
2. Identify the PRIMARY muscle group (most worked)
3. Identify SECONDARY muscle groups (also worked but less) if there are any
4. If you cannot determine muscle groups, return null for primary and empty array for secondary
5. Return in JSON format: {"primaryMuscleGroup": "muscle_group_name", "secondaryMuscleGroups": ["muscle1", "muscle2"]}

Examples:
- "Bench Press" → {"primaryMuscleGroup": "chest", "secondaryMuscleGroups": ["front delts", "triceps"]}
- "Squat" → {"primaryMuscleGroup": "quadriceps", "secondaryMuscleGroups": ["glutes"]}
- "Pull-ups" → {"primaryMuscleGroup": "lats", "secondaryMuscleGroups": ["biceps", "upper back"]}
- "Unknown Exercise" → {"primaryMuscleGroup": null, "secondaryMuscleGroups": []}`,
        },
        {
          role: 'user',
          content: `Analyze this exercise: "${exerciseName}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
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

    console.log(`Cached result for: ${normalizedName}`)
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
