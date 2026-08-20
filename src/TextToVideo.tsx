import { useEffect, useState } from 'react'

type VideoHistory = {
  id: string
  prompt: string
  duration: string
  quality: string
  style: string
  videoUrl: string
  createdAt: string
}

export default function TextToVideo() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [quality, setQuality] = useState('720p')
  const [style, setStyle] = useState('Cinematic')

  const [generating, setGenerating] =
    useState(false)

  const [videoUrl, setVideoUrl] = useState('')

  const [message, setMessage] = useState('')

  const [history, setHistory] =
    useState<VideoHistory[]>([])

  // -----------------------------
  // LOAD LOCAL HISTORY
  // -----------------------------

  useEffect(() => {
    const saved = localStorage.getItem(
      'toolmaster_video_history'
    )

    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        setHistory(parsed)
      }
    } catch {
      setHistory([])
    }
  }, [])

  // -----------------------------
  // SAVE HISTORY
  // -----------------------------

  function saveHistory(
    item: VideoHistory
  ) {
    setHistory((previous) => {
      const updated = [
        item,
        ...previous,
      ]

      localStorage.setItem(
        'toolmaster_video_history',
        JSON.stringify(updated)
      )

      return updated
    })
  }

  // -----------------------------
  // GENERATE VIDEO
  // -----------------------------

  async function generateVideo() {
    const cleanPrompt = prompt.trim()

    if (!cleanPrompt) {
      setMessage(
        'Please enter a video description.'
      )
      return
    }

    setGenerating(true)
    setMessage(
      'AI is creating your video. Please wait...'
    )
    setVideoUrl('')

    try {
      const response = await fetch(
        '/api/generate-video',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            prompt: cleanPrompt,
            duration,
            quality,
            style,
          }),
        }
      )

      let data: any = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

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

      setVideoUrl(data.videoUrl)

      const historyItem: VideoHistory = {
        id: Date.now().toString(),
        prompt: cleanPrompt,
        duration,
        quality,
        style,
        videoUrl: data.videoUrl,
        createdAt:
          new Date().toLocaleString(),
      }

      saveHistory(historyItem)

      setMessage(
        '🎉 Video generated successfully!'
      )
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

  // -----------------------------
  // DOWNLOAD
  // -----------------------------

  function downloadVideo(
    url: string
  ) {
    const link =
      document.createElement('a')

    link.href = url
    link.download =
      'toolmaster-ai-video.mp4'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // -----------------------------
  // DELETE
  // -----------------------------

  function deleteVideo(
    id: string
  ) {
    const updated =
      history.filter(
        (video) =>
          video.id !== id
      )

    setHistory(updated)

    localStorage.setItem(
      'toolmaster_video_history',
      JSON.stringify(updated)
    )
  }

  // -----------------------------
  // CLEAR
  // -----------------------------

  function clearHistory() {
    const confirmed =
      window.confirm(
        'Clear all video history?'
      )

    if (!confirmed) return

    setHistory([])

    localStorage.removeItem(
      'toolmaster_video_history'
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
            Turn your text into stunning
            AI videos
          </p>
        </div>

        {/* GENERATOR */}

        <div className="ttv-generator">

          {/* CREATE */}

          <section className="ttv-card">

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
              rows={7}
            />

            <div className="ttv-options">

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
                  <option value="5">
                    5 Seconds
                  </option>

                  <option value="10">
                    10 Seconds
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
              className="ttv-generate"
              onClick={generateVideo}
              disabled={generating}
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
                  AI is processing your
                  prompt.
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

            {history.length > 0 && (
              <button
                className="ttv-clear"
                onClick={
                  clearHistory
                }
              >
                🗑️ Clear History
              </button>
            )}

          </div>

          {history.length === 0 ? (
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
                        video.videoUrl
                      }
                      controls
                      playsInline
                      className="ttv-history-video"
                    />

                    <p className="ttv-prompt">
                      {video.prompt}
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
                      {
                        video.createdAt
                      }
                    </small>

                    <div className="ttv-card-actions">

                      <button
                        className="ttv-download-small"
                        onClick={() =>
                          downloadVideo(
                            video.videoUrl
                          )
                        }
                      >
                        ⬇️ Download
                      </button>

                      <button
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
          🔒 Video history is saved
          in this browser.
        </div>

      </div>
    </div>
  )
}
