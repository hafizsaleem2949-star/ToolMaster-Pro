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

    if (
      !allowedDurations.includes(
        selectedDuration
      )
    ) {
      return res.status(400).json({
        error:
          'Invalid duration. Please select between 3 and 15 seconds.',
      })
    }

    const falKey = process.env.FAL_KEY

    if (!falKey) {
      return res.status(500).json({
        error: 'FAL_KEY is missing on the server.',
      })
    }

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

    fal.config({
      credentials: falKey,
    })

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // --------------------------------
    // GET USER
    // --------------------------------

    const authHeader =
      req.headers?.authorization ||
      req.headers?.Authorization

    let userId: string | null = null

    if (
      authHeader &&
      authHeader.startsWith('Bearer ')
    ) {
      const token =
        authHeader.substring(7)

      const {
        data,
        error,
      } = await supabase.auth.getUser(token)

      if (!error && data.user) {
        userId = data.user.id
      }
    }

    // --------------------------------
    // FINAL PROMPT
    // --------------------------------

    const finalPrompt = `
${prompt.trim()}

Visual style: ${style || 'Cinematic'}.
Quality preference: ${quality || '720p'}.
Create smooth cinematic motion, detailed visuals,
natural camera movement and coherent scene continuity.
`.trim()

    console.log(
      'Generating video...',
      {
        userId,
        duration: selectedDuration,
        style,
        quality,
      }
    )

    // --------------------------------
    // FAL AI
    // --------------------------------

    const result = await fal.subscribe(
      'fal-ai/kling-video/v3/standard/text-to-video',
      {
        input: {
          prompt: finalPrompt,
          duration: selectedDuration,
          aspect_ratio: '16:9',
          generate_audio: true,
        },

        logs: true,

        onQueueUpdate(update: any) {
          if (
            update.status ===
            'IN_PROGRESS'
          ) {
            console.log(
              'FAL generation in progress...'
            )

            if (update.logs) {
              update.logs.forEach(
                (log: any) => {
                  console.log(
                    log.message
                  )
                }
              )
            }
          }
        },
      }
    )

    const videoUrl =
      result?.data?.video?.url

    if (!videoUrl) {
      console.error(
        'Invalid FAL response:',
        result
      )

      return res.status(500).json({
        error:
          'Video generated but video URL was not returned.',
      })
    }

    // --------------------------------
    // SUPABASE HISTORY
    // --------------------------------

    const historyRecord: Record<
      string,
      any
    > = {
      prompt: prompt.trim(),
      duration: selectedDuration,
      quality: quality || '720p',
      style: style || 'Cinematic',
      video_url: videoUrl,
    }

    if (userId) {
      historyRecord.user_id = userId
    }

    const {
      error: databaseError,
    } = await supabase
      .from('video_generations')
      .insert(historyRecord)

    if (databaseError) {
      console.error(
        'History save failed:',
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
      'Generate video error:',
      error
    )

    return res.status(500).json({
      error:
        error?.message ||
        'Video generation failed.',
    })
  }
}
