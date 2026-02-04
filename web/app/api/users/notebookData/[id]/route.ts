import { NextResponse } from 'next/server'
import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { notebookTags, notebookEntryTagLinks } from '@/src/db/schema'
import { and, eq, sql } from 'drizzle-orm'

type NotebookDataToChange = {
  tags?: {
    prevName: string
    newName?: string
    delete?: boolean
  }[]
}

export type NotebookData = {
  tags: {
    name: string
    used: number
  }[]
}

export const GET = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() // Extract user ID from the URL

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized access to user data' },
      { status: 403 },
    )
  }

  try {
    // Notebook tags with usage count
    const notebookTagsResult = await db
      .select({
        name: notebookTags.name,
        used: sql<number>`count(${notebookEntryTagLinks.entryId})::int`,
      })
      .from(notebookTags)
      .leftJoin(
        notebookEntryTagLinks,
        eq(notebookTags.id, notebookEntryTagLinks.tagId),
      )
      .where(eq(notebookTags.userId, id))
      .groupBy(notebookTags.id, notebookTags.name)
      .orderBy(sql`count(${notebookEntryTagLinks.entryId}) desc`)
      .having(sql`count(${notebookEntryTagLinks.entryId}) > 0`)

    // If user has no notebook tags, return null
    if (notebookTagsResult.length === 0) {
      return NextResponse.json(null, { status: 200 })
    }

    const notebookData: NotebookData = {
      tags: notebookTagsResult,
    }

    return NextResponse.json(notebookData, { status: 200 })
  } catch (error) {
    console.error('Error fetching notebook data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook data' },
      { status: 500 },
    )
  }
})

export const PATCH = withAuth(async (req, user) => {
  const id = req.url.split('/').pop()

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized access to user data' },
      { status: 403 },
    )
  }

  try {
    const body: NotebookDataToChange = await req.json()

    // Handle tag changes
    if (body.tags && body.tags.length > 0) {
      for (const tagChange of body.tags) {
        if (tagChange.delete) {
          // Delete the tag (notebookEntryTagLinks cascade will remove associations, but NOT delete entries)
          await db
            .delete(notebookTags)
            .where(
              and(
                eq(notebookTags.userId, id),
                eq(notebookTags.name, tagChange.prevName),
              ),
            )
        } else {
          // Check if a tag with the new name already exists for this user
          const existingTag = await db
            .select()
            .from(notebookTags)
            .where(
              and(
                eq(notebookTags.userId, id),
                eq(notebookTags.name, tagChange.newName!),
              ),
            )
            .limit(1)

          if (existingTag.length > 0) {
            return NextResponse.json(
              {
                error: `A tag with the name "${tagChange.newName}" already exists`,
              },
              { status: 400 },
            )
          }

          // Update the tag name
          await db
            .update(notebookTags)
            .set({ name: tagChange.newName! })
            .where(
              and(
                eq(notebookTags.userId, id),
                eq(notebookTags.name, tagChange.prevName),
              ),
            )
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error updating notebook data:', error)
    return NextResponse.json(
      { error: 'Failed to update notebook data' },
      { status: 500 },
    )
  }
})
