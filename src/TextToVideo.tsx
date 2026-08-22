import { useEffect, useState } from 'react'
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
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [quality, setQuality] = useState('720p')
  const [style, setStyle] = useState('Cinematic')

  const [generating, setGenerating] =
    useState(false)

  const [videoUrl, setVideoUrl] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [history, setHistory] =
    useState<VideoHistory[]>([])

  const [historyLoading, setHistoryLoading] =
    useState(true)

  // --------------------------------
  // LOAD USER VIDEO HISTORY
  // --------------------------------

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setHistoryLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setHistory([])
        return
      }

      const { data, error } =
        await supabase
          .from('video_generations')
          .select(
            'id, prompt, duration, quality, style, video_url, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          })

      if (error) {
        console.error(
          'History error:',
          error
        )

        setMessage(
          'Could not load video history.'
        )

        setHistory([])
        return
      }

      setHistory(
        (data || []) as VideoHistory[]
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  // --------------------------------
  // GENERATE VIDEO
  // --------------------------------

  async function generateVideo() {
    const cleanPrompt =
      prompt.trim()

    if (!cleanPrompt) {
      setMessage(
        'Please enter a video description.'
      )
      return
    }

    setGenerating(true)
    setVideoUrl('')
    setMessage(
      '⏳ AI is creating your video. Please wait...'
    )

    try {
      // -----------------------------
      // GET CURRENT SESSION
      // -----------------------------

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error(
          'Your login session has expired. Please login again.'
        )
      }

      // -----------------------------
      // API REQUEST
      // -----------------------------

      const response = await fetch(
        '/api/generate-video',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            prompt: cleanPrompt,
            duration,
            quality,
            style,
          }),
        }
      )

      // -----------------------------
      // READ RESPONSE
      // -----------------------------

      let data: {
        success?: boolean
        videoUrl?: string
        error?: string
        historySaved?: boolean
        databaseError?: string
      } = {}

      try {
        data = await response.json()
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}).`
        )
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Video generation failed (${response.status}).`
        )
      }

      if (!data.videoUrl) {
        throw new Error(
          data.error ||
            'No video URL was returned from the server.'
        )
      }

      // -----------------------------
      // SHOW VIDEO
      // -----------------------------

      setVideoUrl(
        data.videoUrl
      )

      if (
        data.historySaved === false
      ) {
        setMessage(
          '🎉 Video generated! History could not be saved.'
        )
      } else {
        setMessage(
          '🎉 Video generated successfully!'
        )
      }

      // Refresh history from Supabase
      await loadHistory()
    } catch (error: unknown) {
      console.error(
        'Generate video error:',
        error
      )

      if (
        error instanceof Error
      ) {
        setMessage(
          `❌ ${error.message}`
        )
      } else {
        setMessage(
          '❌ Something went wrong while generating the video.'
        )
      }
    } finally {
      setGenerating(false)
    }
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
      'toolmaster-ai-video.mp4'
    link.target = '_blank'
    link.rel =
      'noopener noreferrer'

    document.body.appendChild(
      link
    )

    link.click()

    document.body.removeChild(
      link
    )
  }

  // --------------------------------
  // DELETE HISTORY
  // --------------------------------

  async function deleteVideo(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this video history?'
      )

    if (!confirmed) {
      return
    }

    const {
      error,
    } = await supabase
      .from('video_generations')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(
        `❌ ${error.message}`
      )
      return
    }

    setHistory(
      (previous) =>
        previous.filter(
          (video) =>
            video.id !== id
        )
    )

    setMessage(
      'Video history deleted.'
    )
  }

  // --------------------------------
  // CLEAR HISTORY
  // --------------------------------

  async function clearHistory() {
    const confirmed =
      window.confirm(
        'Clear all your video history?'
      )

    if (!confirmed) {
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    const {
      error,
    } = await supabase
      .from('video_generations')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      setMessage(
        `❌ ${error.message}`
      )
      return
    }

    setHistory([])

    setMessage(
      'All video history cleared.'
    )
  }

  return (
    <div className="ttv-page">
      <div className="ttv-container">

        {/* HEADER */}

        <div className="ttv-header">
          <div className="ttv-icon">
            🎬
          </div>

          <h1>
            Text to Video AI
          </h1>

          <p>
            Turn your text into
            stunning AI videos
          </p>
        </div>

        {/* GENERATOR + PREVIEW */}

        <div className="ttv-generator">

          {/* GENERATOR */}

          <section className="ttv-card">

            <h2>
              ✨ Create Your Video
            </h2>

            <label htmlFor="videoPrompt">
              Video Prompt
            </label>

            <textarea
              id="videoPrompt"
              value={prompt}
              onChange={(e) =>
                setPrompt(
                  e.target.value
                )
              }
              placeholder="Example: A beautiful sunset over mountains, cinematic camera movement, realistic clouds..."
              rows={7}
              disabled={generating}
            />

            <div className="ttv-options">

              {/* DURATION */}

              <div>
                <label htmlFor="duration">
                  Duration
                </label>

                <select
                  id="duration"
                  value={duration}
                  onChange={(e) =>
                    setDuration(
                      e.target.value
                    )
                  }
                  disabled={
                    generating
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

              {/* QUALITY */}

              <div>
                <label htmlFor="quality">
                  Quality
                </label>

                <select
                  id="quality"
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      e.target.value
                    )
                  }
                  disabled={
                    generating
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

              {/* STYLE */}

              <div>
                <label htmlFor="style">
                  Style
                </label>

                <select
                  id="style"
                  value={style}
                  onChange={(e) =>
                    setStyle(
                      e.target.value
                    )
                  }
                  disabled={
                    generating
                  }
                >
                  <option value="Cinematic">
                    Cinematic
                  </option>

                  <option value="Realistic">
                    Realistic
                  </option>

                  <option value="Anime">
                    Anime
                  </option>

                  <option value="3D Animation">
                    3D Animation
                  </option>

                  <option value="Cartoon">
                    Cartoon
                  </option>

                  <option value="Documentary">
                    Documentary
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="ttv-generate"
              onClick={
                generateVideo
              }
              disabled={
                generating ||
                !prompt.trim()
              }
            >
              {generating
                ? '⏳ Generating Video...'
                : '🎬 Generate Video'}
            </button>

            {message && (
              <div className="ttv-message">
                {message}
              </div>
            )}
          </section>

          {/* PREVIEW */}

          <section className="ttv-card">

            <h2>
              🎥 Preview
            </h2>

            {generating ? (
              <div className="ttv-empty">

                <div className="ttv-loading-icon">
                  ⚙️
                </div>

                <h3>
                  Creating your video...
                </h3>

                <p>
                  This can take a
                  little while.
                </p>

                <p>
                  Please don't close
                  this page.
                </p>
              </div>
            ) : videoUrl ? (
              <div>

                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="ttv-video"
                />

                <button
                  type="button"
                  className="ttv-download"
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
              <div className="ttv-empty">

                <div className="ttv-empty-icon">
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

        <section className="ttv-history">

          <div className="ttv-history-header">

            <div>
              <h2>
                📜 My Videos
              </h2>

              <p>
                Your generated video
                history
              </p>
            </div>

            {history.length >
              0 && (
              <button
                type="button"
                className="ttv-clear"
                onClick={
                  clearHistory
                }
              >
                🗑️ Clear History
              </button>
            )}
          </div>

          {historyLoading ? (
            <div className="ttv-no-history">
              <div>⏳</div>

              <p>
                Loading your videos...
              </p>
            </div>
          ) : history.length ===
            0 ? (
            <div className="ttv-no-history">

              <div>
                🎞️
              </div>

              <p>
                You haven't generated
                any videos yet.
              </p>
            </div>
          ) : (
            <div className="ttv-history-grid">

              {history.map(
                (video) => (
                  <div
                    key={video.id}
                    className="ttv-history-card"
                  >

                    <video
                      src={
                        video.video_url
                      }
                      controls
                      playsInline
                      className="ttv-history-video"
                    />

                    <p className="ttv-prompt">
                      {
                        video.prompt
                      }
                    </p>

                    <div className="ttv-tags">

                      <span>
                        ⏱️{' '}
                        {
                          video.duration
                        }s
                      </span>

                      <span>
                        🎥{' '}
                        {
                          video.quality
                        }
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

                    <div className="ttv-card-actions">

                      <button
                        type="button"
                        className="ttv-download-small"
                        onClick={() =>
                          downloadVideo(
                            video.video_url
                          )
                        }
                      >
                        ⬇️ Download
                      </button>

                      <button
                        type="button"
                        className="ttv-delete"
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

        <div className="ttv-footer">
          🔒 Your video history is
          securely saved to your
          account.
        </div>

      </div>
    </div>
  )
}
