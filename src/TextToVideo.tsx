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

  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<VideoHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoadingHistory(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setHistory([])
      setLoadingHistory(false)
      return
    }

    const { data, error } = await supabase
      .from('video_generations')
      .select(
        'id, prompt, duration, quality, style, video_url, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      setMessage(error.message)
      setHistory([])
    } else {
      setHistory((data || []) as VideoHistory[])
    }

    setLoadingHistory(false)
  }

  async function generateVideo() {
    if (!prompt.trim()) {
      setMessage('Please enter a video description.')
      return
    }

    setGenerating(true)
    setMessage('')
    setVideoUrl('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Please login first.')
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration,
          quality,
          style,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Video generation failed.'
        )
      }

      if (!data.videoUrl) {
        throw new Error(
          'Video was generated but no video URL was returned.'
        )
      }

      setVideoUrl(data.videoUrl)
      setMessage('Video generated successfully!')

      await loadHistory()
    } catch (error: any) {
      setMessage(
        error?.message ||
          'Something went wrong while generating the video.'
      )
    } finally {
      setGenerating(false)
    }
  }

  function downloadVideo(url: string) {
    const link = document.createElement('a')

    link.href = url
    link.download = 'toolmaster-video.mp4'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function deleteVideo(id: string) {
    const confirmed = window.confirm(
      'Delete this video from your history?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('video_generations')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setHistory((current) =>
      current.filter((video) => video.id !== id)
    )

    setMessage('Video deleted.')
  }

  async function clearHistory() {
    const confirmed = window.confirm(
      'Delete all your video history?'
    )

    if (!confirmed) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('video_generations')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setHistory([])
    setMessage('Video history cleared.')
  }

  return (
    <div className="video-page">
      <div className="video-container">

        <div className="video-header">
          <div className="video-icon">🎬</div>

          <h1>Text to Video AI</h1>

          <p>
            Turn your text into stunning AI videos
          </p>
        </div>

        <div className="video-generator">

          <div className="video-create-card">
            <h2>✨ Create Your Video</h2>

            <label>Video Prompt</label>

            <textarea
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value)
              }
              placeholder="Example: A beautiful sunset over mountains, cinematic camera movement, realistic clouds..."
              rows={7}
            />

            <div className="video-options">

              <div>
                <label>Duration</label>

                <select
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
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
                <label>Quality</label>

                <select
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
                <label>Style</label>

                <select
                  value={style}
                  onChange={(e) =>
                    setStyle(e.target.value)
                  }
                >
                  <option>Cinematic</option>
                  <option>Realistic</option>
                  <option>Anime</option>
                  <option>3D Animation</option>
                  <option>Cartoon</option>
                  <option>Documentary</option>
                </select>
              </div>

            </div>

            <button
              className="generate-video-button"
              onClick={generateVideo}
              disabled={generating}
            >
              {generating
                ? '⏳ Generating Video...'
                : '🎬 Generate Video'}
            </button>

            {message && (
              <div className="video-message">
                {message}
              </div>
            )}
          </div>

          <div className="video-preview-card">
            <h2>🎥 Preview</h2>

            {generating ? (
              <div className="video-empty">
                <div className="loading-video-icon">
                  ⚙️
                </div>

                <h3>
                  Creating your video...
                </h3>

                <p>
                  AI is processing your prompt.
                  Please wait.
                </p>
              </div>
            ) : videoUrl ? (
              <div>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    background: '#000',
                  }}
                />

                <button
                  className="download-video-button"
                  onClick={() =>
                    downloadVideo(videoUrl)
                  }
                >
                  ⬇️ Download Video
                </button>
              </div>
            ) : (
              <div className="video-empty">
                <div className="video-placeholder-icon">
                  🎞️
                </div>

                <p>
                  Your generated video will
                  appear here.
                </p>
              </div>
            )}
          </div>

        </div>

        <section className="video-history">

          <div className="video-history-header">
            <div>
              <h2>📜 My Videos</h2>

              <p>
                Your generated video history
              </p>
            </div>

            {history.length > 0 && (
              <button
                className="clear-history-button"
                onClick={clearHistory}
              >
                🗑️ Clear History
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="history-empty">
              <h3>Loading history...</h3>
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <div>🎞️</div>

              <h3>No videos yet</h3>

              <p>
                Generate your first AI video above.
              </p>
            </div>
          ) : (
            <div className="video-history-grid">

              {history.map((video) => (
                <div
                  className="history-card"
                  key={video.id}
                >

                  <video
                    src={video.video_url}
                    controls
                    preload="metadata"
                  />

                  <p className="history-prompt">
                    {video.prompt}
                  </p>

                  <div className="video-tags">
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
                    {new Date(
                      video.created_at
                    ).toLocaleString()}
                  </small>

                  <div className="history-actions">

                    <button
                      className="history-download"
                      onClick={() =>
                        downloadVideo(
                          video.video_url
                        )
                      }
                    >
                      ⬇️ Download
                    </button>

                    <button
                      className="history-delete"
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

      </div>
    </div>
  )
}
