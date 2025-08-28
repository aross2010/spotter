import db from '@/src'
import {
  notebookEntries,
  notebookEntryTagLinks,
  notebookTags,
} from '@/src/db/schema'
import { NextResponse } from 'next/server'
import { isISO8601 } from 'validator'
import { withAuth } from '../middleware'

export const POST = withAuth(async (req, user) => {
  const data = await req.json()
  if (!data)
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const userId = user.id

  console.log(data)

  let { title, body, date, tags } = data
  if (!body || !date || !userId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // limit body to 3,000 characters
  if (body.length > 3000) {
    return NextResponse.json(
      { error: 'Body exceeds maximum length of 3000 characters' },
      { status: 400 }
    )
  }

  if (title && title.length > 100) {
    return NextResponse.json(
      { error: 'Title exceeds maximum length of 100 characters' },
      { status: 400 }
    )
  }

  if (!Array.isArray(tags)) {
    return NextResponse.json(
      { error: 'Tags must be an array of tags' },
      { status: 400 }
    )
  }

  // remove dup tags
  tags = Array.from(new Set(tags))

  if (tags.length > 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 tags allowed' },
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [notebookEntry] = await tx
        .insert(notebookEntries)
        .values({ title, body, date, userId })
        .returning()

      const tagsInEntry = []

      if (tags.length > 0) {
        for (const tag of tags) {
          const existingTag = await tx.query.notebookTags.findFirst({
            where: (notebookTags, { eq, and }) =>
              and(eq(notebookTags.name, tag), eq(notebookTags.userId, userId)),
          })

          if (!existingTag) {
            const [newTag] = await tx
              .insert(notebookTags)
              .values({ name: tag, userId })
              .returning()
            tagsInEntry.push(newTag)
          } else {
            tagsInEntry.push(existingTag)
          }
        }

        await tx.insert(notebookEntryTagLinks).values(
          tagsInEntry.map((tag) => ({
            entryId: notebookEntry.id,
            tagId: tag.id,
          }))
        )
      }

      const completeNotebookEntry = {
        ...notebookEntry,
        tags: tagsInEntry,
      }

      return completeNotebookEntry
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
