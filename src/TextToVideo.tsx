import { import TextToVideo from './TextToVideo'
  useEffect,
  useState,
} from 'react'

import { supabase } from './supabase'

type VideoHistory = {
  id: string
  prompt: string
  duration: string
  quality: string
  style: string
  video_url: string
  created_at: string
}

export default function TextToVideo() {
  const [prompt, setPrompt] =
    useState('')

  const [duration, setDuration] =
    useState('5')

  const [quality, setQuality] =
    useState('720p')

  const [style, setStyle] =
    useState('Cinematic')

  const [generating, setGenerating] =
    useState(false)

  const [videoUrl, setVideoUrl] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [history, setHistory] =
    useState<VideoHistory[]>([])

  // --------------------------------
  // LOAD USER VIDEO HISTORY
  // --------------------------------

  async function loadHistory() {
    const {
      data: sessionData,
    } = await supabase.auth.getSession()

    const user =
      sessionData.session?.user

    if (!user) {
      setHistory([])
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from('video_generations')
      .select(
        'id, prompt, duration, quality, style, video_url, created_at'
      )
      .eq('user_id', user.id)
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (error) {
      console.error(error)

      setMessage(
        'Unable to load video history.'
      )

      return
    }

    setHistory(
      (data || []) as VideoHistory[]
    )
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // --------------------------------
  // GENERATE VIDEO
  // --------------------------------

  async function generateVideo() {
    if (!prompt.trim()) {
      setMessage(
        'Please enter a video description.'
      )

      return
    }

    setGenerating(true)
    setMessage('')
    setVideoUrl('')

    try {
      const {
        data: sessionData,
      } =
        await supabase.auth.getSession()

      const accessToken =
        sessionData.session?.access_token

      if (!accessToken) {
        throw new Error(
          'Please login before generating a video.'
        )
      }

      const response = await fetch(
        '/api/generate-video',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            prompt,
            duration,
            quality,
            style,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Video generation failed.'
        )
      }

      if (!data.videoUrl) {
        throw new Error(
          'No video URL was returned.'
        )
      }

      setVideoUrl(
        data.videoUrl
      )

      setMessage(
        data.historySaved
          ? 'Video generated and saved successfully! 🎉'
          : 'Video generated successfully!'
      )

      await loadHistory()
    } catch (error: any) {
      console.error(error)

      setMessage(
        error?.message ||
          'Something went wrong.'
      )
    } finally {
      setGenerating(false)
    }
  }

  // --------------------------------
  // DELETE HISTORY
  // --------------------------------

  async function deleteVideo(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Delete this video from your history?'
      )

    if (!confirmed) return

    const {
      error,
    } = await supabase
      .from('video_generations')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setHistory(
      history.filter(
        (video) =>
          video.id !== id
      )
    )

    setMessage(
      'Video deleted successfully.'
    )
  }

  // --------------------------------
  // CLEAR HISTORY
  // --------------------------------

  async function clearHistory() {
    const confirmed =
      window.confirm(
        'Delete all your video history?'
      )

    if (!confirmed) return

    const {
      data: sessionData,
    } =
      await supabase.auth.getSession()

    const user =
      sessionData.session?.user

    if (!user) return

    const {
      error,
    } = await supabase
      .from('video_generations')
      .delete()
      .eq(
        'user_id',
        user.id
      )

    if (error) {
      setMessage(error.message)
      return
    }

    setHistory([])

    setMessage(
      'Video history cleared.'
    )
  }

  // --------------------------------
  // DOWNLOAD
  // --------------------------------

  function downloadVideo(
    url: string
  ) {
    const link =
      document.createElement(
        'a'
      )

    link.href = url
    link.download =
      'toolmaster-video.mp4'
    link.target = '_blank'

    document.body.appendChild(
      link
    )

    link.click()

    document.body.removeChild(
      link
    )
  }

  return (
    <div className="text-video-page">
      <div className="text-video-container">

        <div className="text-video-header">
          <div className="text-video-icon">
            🎬
          </div>

          <h1>
            Text to Video AI
          </h1>

          <p>
            Turn your text into stunning
            AI videos
          </p>
        </div>

        <div className="video-generator-grid">

          {/* CREATE */}

          <section className="video-panel">

            <h2>
              ✨ Create Your Video
            </h2>

            <label>
              Video Prompt
            </label>

            <textarea
              value={prompt}
              onChange={(e) =>
                setPrompt(
                  e.target.value
                )
              }
              placeholder="Example: A beautiful sunset over mountains, cinematic camera movement, realistic clouds..."
              rows={8}
            />

            <div className="video-options">

              <div>
                <label>
                  Duration
                </label>

                <select
                  value={duration}
                  onChange={(e) =>
                    setDuration(
                      e.target.value
                    )
                  }
                >
                  <option value="3">
                    3 Seconds
                  </option>

                  <option value="5">
                    5 Seconds
                  </option>

                  <option value="10">
                    10 Seconds
                  </option>

                  <option value="15">
                    15 Seconds
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Quality
                </label>

                <select
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      e.target.value
                    )
                  }
                >
                  <option value="480p">
                    480p
                  </option>

                  <option value="720p">
                    720p HD
                  </option>

                  <option value="1080p">
                    1080p
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Style
                </label>

                <select
                  value={style}
                  onChange={(e) =>
                    setStyle(
                      e.target.value
                    )
                  }
                >
                  <option>
                    Cinematic
                  </option>

                  <option>
                    Realistic
                  </option>

                  <option>
                    Anime
                  </option>

                  <option>
                    3D Animation
                  </option>

                  <option>
                    Cartoon
                  </option>

                  <option>
                    Documentary
                  </option>
                </select>
              </div>

            </div>

            <button
              className="generate-video-button"
              onClick={
                generateVideo
              }
              disabled={
                generating
              }
            >
              {generating
                ? '⏳ Generating...'
                : '🎬 Generate Video'}
            </button>

            {message && (
              <div className="video-message">
                {message}
              </div>
            )}

          </section>

          {/* PREVIEW */}

          <section className="video-panel">

            <h2>
              🎥 Preview
            </h2>

            {generating ? (
              <div className="video-loading">
                <div className="loading-icon">
                  ⚙️
                </div>

                <h3>
                  Creating your video...
                </h3>

                <p>
                  AI is processing
                  your prompt.
                </p>
              </div>
            ) : videoUrl ? (
              <div>

                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="generated-video"
                />

                <button
                  className="download-video-button"
                  onClick={() =>
                    downloadVideo(
                      videoUrl
                    )
                  }
                >
                  ⬇️ Download Video
                </button>

              </div>
            ) : (
              <div className="video-empty">
                <div>
                  🎞️
                </div>

                <p>
                  Your generated video
                  will appear here.
                </p>
              </div>
            )}

          </section>

        </div>

        {/* HISTORY */}

        <section className="video-history">

          <div className="history-header">

            <div>
              <h2>
                📜 My Videos
              </h2>

              <p>
                Your generated video history
              </p>
            </div>

            {history.length > 0 && (
              <button
                className="clear-history-button"
                onClick={
                  clearHistory
                }
              >
                🗑️ Clear History
              </button>
            )}

          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              <div>
                🎞️
              </div>

              <p>
                You haven't generated
                any videos yet.
              </p>
            </div>
          ) : (
            <div className="history-grid">

              {history.map(
                (video) => (
                  <div
                    key={video.id}
                    className="history-card"
                  >

                    <video
                      src={
                        video.video_url
                      }
                      controls
                      playsInline
                    />

                    <p>
                      {video.prompt}
                    </p>

                    <div className="video-tags">

                      <span>
                        ⏱️{' '}
                        {video.duration}s
                      </span>

                      <span>
                        🎥{' '}
                        {video.quality}
                      </span>

                      <span>
                        🎨{' '}
                        {video.style}
                      </span>

                    </div>

                    <small>
                      {new Date(
                        video.created_at
                      ).toLocaleString()}
                    </small>

                    <div className="history-actions">

                      <button
                        onClick={() =>
                          downloadVideo(
                            video.video_url
                          )
                        }
                      >
                        ⬇️ Download
                      </button>

                      <button
                        onClick={() =>
                          deleteVideo(
                            video.id
                          )
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </div>
  )
}
