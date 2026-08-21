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

  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<VideoHistory[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(
      'toolmaster_video_history'
    )

    if (!saved) return

    try {
      const parsed: unknown = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        setHistory(parsed as VideoHistory[])
      }
    } catch {
      setHistory([])
    }
  }, [])

  function saveHistory(item: VideoHistory) {
    setHistory((previous) => {
      const updated = [item, ...previous]

      localStorage.setItem(
        'toolmaster_video_history',
        JSON.stringify(updated)
      )

      return updated
    })
  }

  async function generateVideo() {
    const cleanPrompt = prompt.trim()

    if (!cleanPrompt) {
      setMessage('Please enter a video description.')
      return
    }

    setGenerating(true)
    setMessage('AI is creating your video. Please wait...')
    setVideoUrl('')

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          duration,
          quality,
          style,
        }),
      })

      let data: {
        videoUrl?: string
        error?: string
      } = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data.error || 'Video generation failed.'
        )
      }

      if (!data.videoUrl) {
        throw new Error('No video URL was returned.')
      }

      setVideoUrl(data.videoUrl)

      const historyItem: VideoHistory = {
        id: Date.now().toString(),
        prompt: cleanPrompt,
        duration,
        quality,
        style,
        videoUrl: data.videoUrl,
        createdAt: new Date().toLocaleString(),
      }

      saveHistory(historyItem)

      setMessage('🎉 Video generated successfully!')
    } catch (error: unknown) {
      console.error(error)

      if (error instanceof Error) {
        setMessage(error.message)
      } else {
        setMessage('Something went wrong.')
      }
    } finally {
      setGenerating(false)
    }
  }

  function downloadVideo(url: string) {
    const link = document.createElement('a')

    link.href = url
    link.download = 'toolmaster-ai-video.mp4'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function deleteVideo(id: string) {
    const updated = history.filter(
      (video) => video.id !== id
    )

    setHistory(updated)

    localStorage.setItem(
      'toolmaster_video_history',
      JSON.stringify(updated)
    )
  }

  function clearHistory() {
    const confirmed = window.confirm(
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
        <div className="ttv-header">
          <div className="ttv-icon">🎬</div>

          <h1>Text to Video AI</h1>

          <p>
            Turn your text into stunning AI videos
          </p>
        </div>

        <div className="ttv-generator">
          <section className="ttv-card">
            <h2>✨ Create Your Video</h2>

            <label htmlFor="videoPrompt">
              Video Prompt
            </label>

            <textarea
              id="videoPrompt"
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value)
              }
              placeholder="Example: A beautiful sunset over mountains, cinematic camera movement, realistic clouds..."
              rows={7}
            />

            <div className="ttv-options">
              <div>
                <label htmlFor="duration">
                  Duration
                </label>

                <select
                  id="duration"
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
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
                <label htmlFor="quality">
                  Quality
                </label>

                <select
                  id="quality"
                  value={quality}
                  onChange={(e) =>
                    setQuality(e.target.value)
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
                <label htmlFor="style">
                  Style
                </label>

                <select
                  id="style"
                  value={style}
                  onChange={(e) =>
                    setStyle(e.target.value)
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

          <section className="ttv-card">
            <h2>🎥 Preview</h2>

            {generating ? (
              <div className="ttv-empty">
                <div className="ttv-loading-icon">
                  ⚙️
                </div>

                <h3>
                  Creating your video...
                </h3>

                <p>
                  AI is processing your prompt.
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
                    downloadVideo(videoUrl)
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
                  Your generated video will appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="ttv-history">
          <div className="ttv-history-header">
            <div>
              <h2>📜 My Videos</h2>

              <p>
                Your generated video history
              </p>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                className="ttv-clear"
                onClick={clearHistory}
              >
                🗑️ Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="ttv-no-history">
              <div>🎞️</div>

              <p>
                You haven't generated any videos yet.
              </p>
            </div>
          ) : (
            <div className="ttv-history-grid">
              {history.map((video) => (
                <div
                  key={video.id}
                  className="ttv-history-card"
                >
                  <video
                    src={video.videoUrl}
                    controls
                    playsInline
                    className="ttv-history-video"
                  />

                  <p className="ttv-prompt">
                    {video.prompt}
                  </p>

                  <div className="ttv-tags">
                    <span>
                      ⏱️ {video.duration}s
                    </span>

                    <span>
                      🎥 {video.quality}
                    </span>

                    <span>
                      🎨 {video.style}
                    </span>
                  </div>

                  <small>
                    {video.createdAt}
                  </small>

                  <div className="ttv-card-actions">
                    <button
                      type="button"
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
                      type="button"
                      className="ttv-delete"
                      onClick={() =>
                        deleteVideo(video.id)
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="ttv-footer">
          🔒 Video history is saved in this browser.
        </div>
      </div>
    </div>
  )
}
