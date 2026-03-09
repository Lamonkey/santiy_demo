import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

type PostWithTranslation = {
  _id: string
  _updatedAt: string
  title: string
  syncStatus: string | null
  zhTranslation: {
    _id: string
    _updatedAt: string
    translationStatus: string
    syncStatus: string | null
  } | null
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron or a trusted caller
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const posts: PostWithTranslation[] = await client.fetch(`
    *[_type == "post" && language == "en" && defined(slug.current)] {
      _id,
      _updatedAt,
      title,
      syncStatus,
      "zhTranslation": *[
        _type == "post" &&
        translationOf._ref == ^._id &&
        language == "zh"
      ][0] {
        _id,
        _updatedAt,
        translationStatus,
        syncStatus
      }
    }
  `)

  const outOfSync: { enId: string; zhId: string; title: string; enUpdated: string; zhUpdated: string }[] = []
  const nowSynced: { enId: string; zhId: string }[] = []

  for (const post of posts) {
    const zh = post.zhTranslation
    if (!zh) continue

    // Only check approved translations — pending ones are intentionally behind
    if (zh.translationStatus !== 'approved') continue

    const enUpdated = new Date(post._updatedAt)
    const zhUpdated = new Date(zh._updatedAt)
    const isOutOfSync = enUpdated > zhUpdated

    if (isOutOfSync && post.syncStatus !== 'out_of_sync') {
      outOfSync.push({
        enId: post._id,
        zhId: zh._id,
        title: post.title,
        enUpdated: post._updatedAt,
        zhUpdated: zh._updatedAt,
      })
    } else if (!isOutOfSync && (post.syncStatus === 'out_of_sync' || zh.syncStatus === 'out_of_sync')) {
      nowSynced.push({ enId: post._id, zhId: zh._id })
    }
  }

  // Patch out-of-sync pairs
  if (outOfSync.length > 0) {
    const tx = client.transaction()
    for (const pair of outOfSync) {
      tx.patch(pair.enId, (p) => p.set({ syncStatus: 'out_of_sync' }))
      tx.patch(pair.zhId, (p) => p.set({ syncStatus: 'out_of_sync' }))
    }
    await tx.commit()
  }

  // Clear sync flag for pairs that are now in sync
  if (nowSynced.length > 0) {
    const tx = client.transaction()
    for (const pair of nowSynced) {
      tx.patch(pair.enId, (p) => p.set({ syncStatus: 'synced' }))
      tx.patch(pair.zhId, (p) => p.set({ syncStatus: 'synced' }))
    }
    await tx.commit()
  }

  // Notify via webhook if any pairs are out of sync
  if (outOfSync.length > 0 && process.env.REVIEW_WEBHOOK_URL) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const list = outOfSync
      .map((p) => `• "${p.title}" — EN updated ${p.enUpdated}, ZH last synced ${p.zhUpdated}`)
      .join('\n')

    await fetch(process.env.REVIEW_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔄 ${outOfSync.length} post(s) have drifted out of sync:\n${list}\n\nUse the "Re-translate" action in Studio to update them.\n${siteUrl}/studio/structure/post`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({
    checked: posts.filter((p) => p.zhTranslation?.translationStatus === 'approved').length,
    outOfSync: outOfSync.length,
    resynced: nowSynced.length,
    details: outOfSync,
  })
}
