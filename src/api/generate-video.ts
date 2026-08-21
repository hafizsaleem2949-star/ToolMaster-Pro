import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

type RequestBody = {
  prompt?: string
  duration?: string
  quality?: string
  style?: string
}

type WanDuration = '5' | '10'

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const body = (req.body || {}) as RequestBody

    const prompt = body.prompt?.trim()
    const duration = body.duration || '5'
    const quality = body.quality || '720p'
    const style = body.style || 'Cinematic'

    if (!prompt) {
      return res.status(400).json({
        error: 'Video prompt is required.',
      })
    }

    // -----------------------------
    // FAL
    // -----------------------------

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      return res.status(500).json({
        error: 'FAL_KEY is not configured.',
      })
    }

    fal.config({
      credentials: falKey,
    })

    // -----------------------------
    // SUPABASE
    // -----------------------------

    const supabaseUrl =
      process.env.SUPABASE_URL

    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !supabaseServiceKey
    ) {
      return res.status(500).json({
        error:
          'Supabase server environment variables are missing.',
      })
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // -----------------------------
    // FINAL PROMPT
    // -----------------------------

    const finalPrompt = [
      prompt,
      `Visual style: ${style}.`,
      `Quality target: ${quality}.`,
      'Cinematic composition.',
      'Smooth camera movement.',
      'Detailed realistic motion.',
    ].join(' ')

    // -----------------------------
    // VIDEO GENERATION
    // -----------------------------

    const safeDuration: WanDuration =
      duration === '10' ? '10' : '5'

    const result = await fal.subscribe(
      'fal-ai/wan-25-preview/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: safeDuration,
          resolution:
  quality === '1080p'
    ? '1080p'
    : '720p',
        },
        logs: true,
      }
    )

    const video =
      (result as any)?.data?.video

    const videoUrl = video?.url

    if (!videoUrl) {
      console.error(
        'FAL response:',
        JSON.stringify(result)
      )

      return res.status(500).json({
        error:
          'Video generated but no video URL was returned.',
      })
    }

    // -----------------------------
    // SAVE TO SUPABASE
    // -----------------------------

    const {
      data: insertedVideo,
      error: databaseError,
    } = await supabase
      .from('video_generations')
      .insert({
        prompt,
        duration: safeDuration,
        quality,
        style,
        video_url: videoUrl,
      })
      .select()
      .single()

    if (databaseError) {
      console.error(
        'Supabase insert error:',
        databaseError
      )

      return res.status(200).json({
        success: true,
        videoUrl,
        historySaved: false,
        warning:
          'Video generated but history could not be saved.',
      })
    }

    return res.status(200).json({
      success: true,
      videoUrl,
      historySaved: true,
      video: insertedVideo,
    })
  } catch (error: any) {
    console.error(
      'Generate video error:',
      error
    )

    return res.status(500).json({
      error:
        error?.message ||
        'Something went wrong while generating the video.',
    })
  }
}
