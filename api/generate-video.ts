import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const { prompt, duration, quality, style } = req.body

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: 'Video prompt is required',
      })
    }

    const apiKey = process.env.FAL_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'FAL_KEY is not configured in Vercel',
      })
    }

    fal.config({
      credentials: apiKey,
    })

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error:
          'Supabase environment variables are not configured.',
      })
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    const finalPrompt = `${prompt}. Visual style: ${
      style || 'Cinematic'
    }. Video quality: ${quality || '720p'}.`

    const result = await fal.subscribe(
      'fal-ai/kling-video/v3/standard/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: duration || '5',
          aspect_ratio: '16:9',
        },
        logs: true,
      }
    )

    const videoUrl = result.data?.video?.url

    if (!videoUrl) {
      return res.status(500).json({
        error:
          'Video was generated but no video URL was returned.',
      })
    }

    const { error: databaseError } = await supabase
      .from('video_generations')
      .insert({
        prompt: prompt.trim(),
        duration: duration || '5',
        quality: quality || '720p',
        style: style || 'Cinematic',
        video_url: videoUrl,
      })

    if (databaseError) {
      console.error(
        'Supabase history error:',
        databaseError
      )

      return res.status(200).json({
        success: true,
        videoUrl,
        historySaved: false,
      })
    }

    return res.status(200).json({
      success: true,
      videoUrl,
      historySaved: true,
    })
  } catch (error: any) {
    console.error(
      'Video generation error:',
      error
    )

    return res.status(500).json({
      error:
        error?.message ||
        'Something went wrong while generating the video.',
    })
  }
}
