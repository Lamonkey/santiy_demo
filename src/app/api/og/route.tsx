import { ImageResponse } from 'next/og'
import { client } from '@/sanity/lib/client'

export const runtime = 'edge'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const data = await client.fetch(`*[_id == $id][0]{ title }`, { id })

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      <h1
        style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {data?.title || 'Portfolio'}
      </h1>
    </div>,
    { width: 1200, height: 630 }
  )
}
