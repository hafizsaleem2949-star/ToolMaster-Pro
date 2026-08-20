import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    // -----------------------------------
    // GET REQUEST DATA
    // -----------------------------------

    const {
      prompt,
      duration = '5',
      quality = '720p',
      style = 'Cinematic',
    } = req.body || {}

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Video prompt is required.',
      })
    }

    // -----------------------------------
    // FAL AI
    // -----------------------------------

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      console.error('FAL_KEY is missing')

      return res.status(500).json({
        success: false,
        error: 'FAL_KEY is not configured in Vercel.',
      })
    }

    // Configure fal.ai
    fal.config({
      credentials: falKey,
    })

    // -----------------------------------
    // SUPABASE
    // -----------------------------------

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('SUPABASE_URL is missing')

      return res.status(500).json({
        success: false,
        error: 'SUPABASE_URL is not configured in Vercel.',
      })
    }

    if (!supabaseKey) {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY is missing'
      )

      return res.status(500).json({
        success: false,
        error:
          'SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel.',
      })
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    // -----------------------------------
    // BUILD VIDEO PROMPT
    // -----------------------------------

    const finalPrompt = `
${prompt.trim()}.
Visual style: ${style}.
High quality ${quality} video.
Cinematic camera movement.
Detailed environment.
Natural lighting.
Smooth realistic motion.
`.trim()

    console.log('Starting video generation...')

    // -----------------------------------
    // GENERATE VIDEO WITH FAL
    // -----------------------------------

    const result = await fal.subscribe(
      'fal-ai/kling-video/v3/turbo/standard/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: duration,
          aspect_ratio: '16:9',
        },

        logs: true,

        onQueueUpdate(update: any) {
          if (update.status === 'IN_PROGRESS') {
            console.log('FAL video generation in progress...')
          }

          if (update.status === 'IN_QUEUE') {
            console.log('FAL video generation queued...')
          }
        },
      }
    )

    console.log('FAL generation completed.')

    // -----------------------------------
    // GET VIDEO URL
    // -----------------------------------

    const videoUrl = result?.data?.video?.url

    if (!videoUrl) {
      console.error(
        'FAL response did not contain video URL:',
        result?.data
      )

      return res.status(500).json({
        success: false,
        error:
          'Video was generated but no video URL was returned by FAL.',
      })
    }

    console.log('Video URL received.')

    // -----------------------------------
    // SAVE HISTORY TO SUPABASE
    // -----------------------------------

    let historySaved = false

    try {
      const { error: databaseError } =
        await supabase
          .from('video_generations')
          .insert({
            prompt: prompt.trim(),
            duration: duration,
            quality: quality,
            style: style,
            video_url: videoUrl,
          })

      if (databaseError) {
        console.error(
          'Supabase history error:',
          databaseError
        )
      } else {
        historySaved = true
      }
    } catch (supabaseError) {
      console.error(
        'Supabase unexpected error:',
        supabaseError
      )
    }

    // -----------------------------------
    // SUCCESS
    // -----------------------------------

    return res.status(200).json({
      success: true,
      videoUrl,
      historySaved,
    })
  } catch (error: any) {
    console.error(
      'Video generation error:',
      error
    )

    // -----------------------------------
    // FAL AUTH ERROR
    // -----------------------------------

    if (error?.status === 401) {
      return res.status(401).json({
        success: false,
        error:
          'FAL authentication failed. Please check your FAL_KEY and FAL account/model access.',
      })
    }

    // -----------------------------------
    // FAL FORBIDDEN ERROR
    // -----------------------------------

    if (error?.status === 403) {
      return res.status(403).json({
        success: false,
        error:
          'FAL access was forbidden. Your FAL account or API key may not have access to this video model.',
      })
    }

    // -----------------------------------
    // OTHER ERRORS
    // -----------------------------------

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        'Something went wrong while generating the video.',
    })
  }
}
