import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import {
  notebookEntries,
  notebookEntryTagLinks,
  notebookTags,
} from '@/src/db/schema'
import { desc, asc, eq, and, inArray, sql } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // query params
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 50)
  const sortBy = url.searchParams.get('sortBy') || 'date'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  const tags = url.searchParams.get('tags') // string of tag names

  if (page < 1 || limit < 1) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters. Page and limit must be >= 1.' },
      { status: 400 }
    )
  }

  if (!['date'].includes(sortBy)) {
    return NextResponse.json(
      { error: 'Invalid sortBy parameter. Allowed values: date' },
      { status: 400 }
    )
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return NextResponse.json(
      { error: 'Invalid sortOrder parameter. Allowed values: asc, desc' },
      { status: 400 }
    )
  }

  try {
    const offset = (page - 1) * limit
    let tagIds: string[] = []

    // Parse and validate tag filters
    if (tags) {
      try {
        const tagNames = JSON.parse(tags) as string[]
        if (Array.isArray(tagNames) && tagNames.length > 0) {
          const tagRecords = await db
            .select({ id: notebookTags.id })
            .from(notebookTags)
            .where(
              and(
                eq(notebookTags.userId, userId),
                inArray(notebookTags.name, tagNames)
              )
            )
          tagIds = tagRecords.map((tag) => tag.id)

          // If no tags found and the user is filtering by tags
          if (tagIds.length === 0) {
            return NextResponse.json(
              {
                entries: [],
                pagination: {
                  page,
                  limit,
                  totalPages: 0,
                  totalEntries: 0,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
              },
              { status: 200 }
            )
          }
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Invalid tags parameter. Must be a JSON array of tag names.',
          },
          { status: 400 }
        )
      }
    }

    // no filters or specified sort method
    const useDefaultSort =
      sortBy === 'date' && sortOrder === 'desc' && tagIds.length === 0

    // Build queries
    let entriesQuery
    let countQuery

    if (tagIds.length > 0) {
      // query with tags
      const baseConditions = and(
        eq(notebookEntries.userId, userId),
        inArray(notebookEntryTagLinks.tagId, tagIds)
      )

      entriesQuery = db
        .selectDistinct({
          id: notebookEntries.id,
          userId: notebookEntries.userId,
          title: notebookEntries.title,
          body: notebookEntries.body,
          date: notebookEntries.date,
          createdAt: notebookEntries.createdAt,
          updatedAt: notebookEntries.updatedAt,
          pinned: notebookEntries.pinned,
        })
        .from(notebookEntries)
        .innerJoin(
          notebookEntryTagLinks,
          eq(notebookEntries.id, notebookEntryTagLinks.entryId)
        )
        .where(baseConditions)
        .orderBy(
          ...[
            desc(notebookEntries.pinned),
            sortOrder === 'desc'
              ? desc(notebookEntries.date)
              : asc(notebookEntries.date),
          ]
        )

        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(distinct ${notebookEntries.id})` })
        .from(notebookEntries)
        .innerJoin(
          notebookEntryTagLinks,
          eq(notebookEntries.id, notebookEntryTagLinks.entryId)
        )
        .where(baseConditions)
    } else {
      // no tags
      const orderBy = useDefaultSort
        ? [desc(notebookEntries.pinned), desc(notebookEntries.date)]
        : [
            desc(notebookEntries.pinned),
            sortOrder === 'desc'
              ? desc(notebookEntries.date)
              : asc(notebookEntries.date),
          ]

      entriesQuery = db
        .select()
        .from(notebookEntries)
        .where(eq(notebookEntries.userId, userId))
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(notebookEntries)
        .where(eq(notebookEntries.userId, userId))
    }

    // count and entries in parallel
    const [entries, countResult] = await Promise.all([entriesQuery, countQuery])

    const totalEntries = Number(countResult[0]?.count) || 0

    const entryIds = entries.map((entry) => entry.id)
    const entryTags =
      entryIds.length > 0
        ? await db
            .select({
              entryId: notebookEntryTagLinks.entryId,
              tagId: notebookTags.id,
              tagName: notebookTags.name,
            })
            .from(notebookEntryTagLinks)
            .innerJoin(
              notebookTags,
              eq(notebookEntryTagLinks.tagId, notebookTags.id)
            )
            .where(inArray(notebookEntryTagLinks.entryId, entryIds))
        : []

    // Group tags by entry ID
    const tagsByEntry: Record<
      string,
      Array<{ id: string; name: string; userId: string }>
    > = {}
    entryTags.forEach(({ entryId, tagId, tagName }) => {
      if (!tagsByEntry[entryId]) {
        tagsByEntry[entryId] = []
      }
      tagsByEntry[entryId].push({
        id: tagId,
        name: tagName,
        userId: userId,
      })
    })

    // Combine entries with their tags
    const completeEntries = entries.map((entry) => ({
      ...entry,
      tags: tagsByEntry[entry.id] || [],
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalEntries / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json(
      {
        entries: completeEntries,
        pagination: {
          page,
          limit,
          totalPages,
          totalEntries,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching notebook entries:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
