import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { notebookTags, notebookEntryTagLinks } from '@/src/db/schema'
import { eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (req, user) => {
  const userId = req.url.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const tagsWithUsageCount = await db
      .select({
        id: notebookTags.id,
        name: notebookTags.name,
        used: sql<number>`COALESCE(COUNT(${notebookEntryTagLinks.tagId}), 0)`,
      })
      .from(notebookTags)
      .leftJoin(
        notebookEntryTagLinks,
        eq(notebookTags.id, notebookEntryTagLinks.tagId)
      )
      .where(eq(notebookTags.userId, userId))
      .groupBy(notebookTags.id, notebookTags.name)
      .orderBy(
        sql`COUNT(${notebookEntryTagLinks.tagId}) DESC, ${notebookTags.name} ASC`
      )

    return NextResponse.json(tagsWithUsageCount, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching notebook tags:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
