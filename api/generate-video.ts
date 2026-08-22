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

    if (
      !prompt ||
      typeof prompt !== 'string' ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        error: 'Video prompt is required.',
      })
    }

    const selectedDuration = String(duration)

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

    if (!allowedDurations.includes(selectedDuration)) {
      return res.status(400).json({
        error: 'Invalid duration. Please select 3-15 seconds.',
      })
    }

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      return res.status(500).json({
        error: 'FAL_KEY is missing in Vercel Environment Variables.',
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL

    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error:
          'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.',
      })
    }

    fal.config({
      credentials: falKey,
    })

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // -----------------------------
    // GET USER FROM ACCESS TOKEN
    // -----------------------------

    const authHeader =
      req.headers?.authorization ||
      req.headers?.Authorization

    let userId: string | null = null

    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      const token = authHeader.substring(7)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error) {
        console.error(
          'Supabase auth error:',
          error
        )
      }

      if (user) {
        userId = user.id
      }
    }

    // -----------------------------
    // FINAL PROMPT
    // -----------------------------

    const finalPrompt = [
      prompt.trim(),
      `Visual style: ${style || 'Cinematic'}.`,
      `Quality: ${quality || '720p'}.`,
      'Create a high quality cinematic video with smooth natural motion, detailed visuals, realistic lighting and professional camera movement.',
    ].join(' ')

    console.log('Starting FAL video generation')

    // -----------------------------
    // FAL AI
    // -----------------------------

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
              'FAL video generation in progress...'
            )

            if (Array.isArray(update.logs)) {
              update.logs.forEach((log: any) => {
                console.log(
                  log?.message || log
                )
              })
            }
          }
        },
      }
    )

    // -----------------------------
    // GET VIDEO URL
    // -----------------------------

    const videoUrl =
      result?.data?.video?.url

    if (!videoUrl) {
      console.error(
        'FAL returned no video URL:',
        result
      )

      return res.status(500).json({
        error:
          'Video generation completed but no video URL was returned.',
      })
    }

    console.log(
      'Video generated:',
      videoUrl
    )

    // -----------------------------
    // SAVE HISTORY
    // -----------------------------

    const historyData: Record<string, any> = {
      prompt: prompt.trim(),
      duration: selectedDuration,
      quality: quality || '720p',
      style: style || 'Cinematic',
      video_url: videoUrl,
    }

    if (userId) {
      historyData.user_id = userId
    }

    const { error: databaseError } =
      await supabase
        .from('video_generations')
        .insert(historyData)

    if (databaseError) {
      console.error(
        'Supabase history error:',
        databaseError
      )

      // Video successfully generated.
      // Database failure should not hide the video.
      return res.status(200).json({
        success: true,
        videoUrl,
        historySaved: false,
        databaseError:
          databaseError.message,
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
