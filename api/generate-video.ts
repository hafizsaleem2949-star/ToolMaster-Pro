import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  // --------------------------------
  // METHOD CHECK
  // --------------------------------

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    // --------------------------------
    // REQUEST DATA
    // --------------------------------

    const {
      prompt,
      duration = '5',
      quality = '720p',
      style = 'Cinematic',
    } = req.body || {}

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        error: 'Video prompt is required.',
      })
    }

    // --------------------------------
    // VALIDATE DURATION
    // Kling V3 supports 3-15 seconds
    // --------------------------------

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

    const selectedDuration = String(duration)

    if (!allowedDurations.includes(selectedDuration)) {
      return res.status(400).json({
        error: 'Invalid video duration. Use 3-15 seconds.',
      })
    }

    // --------------------------------
    // FAL KEY
    // --------------------------------

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      return res.status(500).json({
        error: 'FAL_KEY is not configured.',
      })
    }

    fal.config({
      credentials: falKey,
    })

    // --------------------------------
    // SUPABASE CONFIG
    // --------------------------------

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

    // --------------------------------
    // GET LOGGED-IN USER
    // --------------------------------

    const authHeader =
      req.headers?.authorization ||
      req.headers?.Authorization

    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.replace(
        'Bearer ',
        ''
      )

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(accessToken)

      if (userError) {
        console.error(
          'Supabase user error:',
          userError
        )
      }

      userId = user?.id || null
    }

    // --------------------------------
    // FINAL PROMPT
    // --------------------------------

    const finalPrompt = [
      prompt.trim(),
      `Visual style: ${style || 'Cinematic'}.`,
      `Quality preference: ${quality || '720p'}.`,
      'Create a coherent cinematic video with smooth motion, detailed visuals and natural camera movement.',
    ].join(' ')

    // --------------------------------
    // FAL AI VIDEO GENERATION
    // --------------------------------

    console.log(
      'Starting video generation...',
      {
        duration: selectedDuration,
        quality,
        style,
      }
    )

    const result = await fal.subscribe(
      'fal-ai/kling-video/v3/standard/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: selectedDuration,
          aspect_ratio: '16:9',
        },

        logs: true,

        onQueueUpdate(update: any) {
          if (update.status === 'IN_PROGRESS') {
            console.log(
              'Video generation in progress...'
            )

            if (update.logs) {
              update.logs.forEach((log: any) => {
                console.log(log.message)
              })
            }
          }
        },
      }
    )

    // --------------------------------
    // GET VIDEO URL
    // --------------------------------

    const videoUrl =
      result?.data?.video?.url

    if (!videoUrl) {
      console.error(
        'FAL response:',
        result
      )

      return res.status(500).json({
        error:
          'Video was generated but no video URL was returned.',
      })
    }

    console.log(
      'Video generated successfully:',
      videoUrl
    )

    // --------------------------------
    // SAVE TO SUPABASE
    // --------------------------------

    const historyData: Record<string, any> = {
      prompt: prompt.trim(),
      duration: selectedDuration,
      quality: quality || '720p',
      style: style || 'Cinematic',
      video_url: videoUrl,
    }

    // If your video_generations table has user_id,
    // save the logged-in user's ID.
    if (userId) {
      historyData.user_id = userId
    }

    const {
      error: databaseError,
    } = await supabase
      .from('video_generations')
      .insert(historyData)

    // --------------------------------
    // DATABASE ERROR
    // --------------------------------

    if (databaseError) {
      console.error(
        'Supabase history error:',
        databaseError
      )

      // Video already generated.
      // Don't make user lose the video.
      return res.status(200).json({
        success: true,
        videoUrl,
        historySaved: false,
        databaseError: databaseError.message,
      })
    }

    // --------------------------------
    // SUCCESS
    // --------------------------------

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
