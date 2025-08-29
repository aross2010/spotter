import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import { notebookEntries } from '@/src/db/schema'
import { desc } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const userId = req.url.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const entries = await db.query.notebookEntries.findMany({
      where: (notebookEntry, { eq }) => eq(notebookEntry.userId, userId),
      orderBy: [desc(notebookEntries.pinned), desc(notebookEntries.date)],
    })

    const completeNotebookEntries = []

    for (const entry of entries) {
      const entryTags = []
      const tagLinks = await db.query.notebookEntryTagLinks.findMany({
        where: (notebookEntryTagLinks, { eq }) =>
          eq(notebookEntryTagLinks.entryId, entry.id),
      })
      const tags = []
      for (const link of tagLinks) {
        const tag = await db.query.notebookTags.findFirst({
          where: (notebookTags, { eq }) => eq(notebookTags.id, link.tagId),
        })
        if (tag) {
          entryTags.push(tag)
        }
      }
      completeNotebookEntries.push({ ...entry, tags: entryTags })
    }

    return NextResponse.json(completeNotebookEntries, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching notebook entries:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
