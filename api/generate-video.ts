import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const {
      prompt,
      duration = '5',
      quality = '720p',
      style = 'Cinematic',
    } = req.body || {}

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: 'Video prompt is required.',
      })
    }

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      return res.status(500).json({
        error: 'FAL_KEY is missing from environment variables.',
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error:
          'Supabase server environment variables are missing.',
      })
    }

    fal.config({
      credentials: falKey,
    })

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const allowedDurations = [
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
    ]

    const selectedDuration = allowedDurations.includes(
      String(duration)
    )
      ? String(duration)
      : '5'

    const finalPrompt = `${prompt.trim()}

Visual style: ${style}.
Requested quality: ${quality}.
High quality, detailed visuals, smooth motion, cinematic composition.`

    const result = await fal.subscribe(
      'fal-ai/kling-video/v3/standard/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: selectedDuration,
          aspect_ratio: '16:9',
          generate_audio: true,
          shot_type: 'customize',
        },
        logs: true,
      }
    )

    const videoUrl = result.data?.video?.url

    if (!videoUrl) {
      return res.status(500).json({
        error:
          'Video generation completed but no video URL was returned.',
      })
    }

    const { error: historyError } = await supabase
      .from('video_generations')
      .insert({
        prompt: prompt.trim(),
        duration: selectedDuration,
        quality,
        style,
        video_url: videoUrl,
      })

    if (historyError) {
      console.error(
        'Video history save failed:',
        historyError
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
    console.error('Generate video error:', error)

    return res.status(500).json({
      error:
        error?.message ||
        'Something went wrong while generating the video.',
    })
  }
}
