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
    const saved = localStorage.getItem('toolmaster_video_history')

    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {
        setHistory([])
      }
    }
  }, [])

  function saveHistory(item: VideoHistory) {
    const updated = [item, ...history]

    setHistory(updated)

    localStorage.setItem(
      'toolmaster_video_history',
      JSON.stringify(updated)
    )
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
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
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

      const historyItem: VideoHistory = {
        id: Date.now().toString(),
        prompt,
        duration,
        quality,
        style,
        videoUrl: data.videoUrl,
        createdAt: new Date().toLocaleString(),
      }

      saveHistory(historyItem)

      setMessage('Video generated successfully!')
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
    setHistory([])
    localStorage.removeItem('toolmaster_video_history')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '35px 20px',
        background:
          'linear-gradient(135deg, #07111f, #101b35, #16213e)',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: 'auto',
        }}
      >

        {/* HEADER */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '35px',
          }}
        >
          <div style={{ fontSize: '52px' }}>🎬</div>

          <h1
            style={{
              fontSize: '42px',
              margin: '8px 0',
            }}
          >
            Text to Video AI
          </h1>

          <p style={{ color: '#aab7cf' }}>
            Turn your text into stunning AI videos
          </p>
        </div>

        {/* GENERATOR */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1.4fr) minmax(300px, 0.6fr)',
            gap: '24px',
          }}
        >

          {/* CREATE */}

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border:
                '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h2>✨ Create Your Video</h2>

            <label>Video Prompt</label>

            <textarea
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value)
              }
              placeholder="Example: A beautiful sunset over mountains, cinematic camera movement, realistic clouds..."
              rows={7}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '8px',
                padding: '16px',
                borderRadius: '12px',
                border:
                  '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                resize: 'vertical',
                fontSize: '15px',
              }}
            />

            {/* OPTIONS */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: '14px',
                marginTop: '20px',
              }}
            >

              <div>
                <label>Duration</label>

                <select
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="5">
                    5 Seconds
                  </option>
                  <option value="10">
                    10 Seconds
                  </option>
                  <option value="15">
                    15 Seconds
                  </option>
                  <option value="30">
                    30 Seconds
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
                  style={selectStyle}
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
                  style={selectStyle}
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

            {/* GENERATE */}

            <button
              onClick={generateVideo}
              disabled={generating}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '16px',
                border: 0,
                borderRadius: '12px',
                background: generating
                  ? '#475569'
                  : 'linear-gradient(90deg,#2563eb,#7c3aed)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 700,
                cursor: generating
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {generating
                ? '⏳ Generating Video...'
                : '🎬 Generate Video'}
            </button>

            {message && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '12px',
                  borderRadius: '10px',
                  background:
                    'rgba(34,197,94,0.12)',
                  color: '#86efac',
                  textAlign: 'center',
                }}
              >
                {message}
              </div>
            )}
          </div>

          {/* PREVIEW */}

          <div
            style={{
              background:
                'rgba(255,255,255,0.06)',
              border:
                '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '24px',
            }}
          >
            <h2>🎥 Preview</h2>

            {generating ? (
              <div
                style={{
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#aab7cf',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '50px',
                    }}
                  >
                    ⚙️
                  </div>

                  <h3>
                    Creating your video...
                  </h3>

                  <p>
                    AI is processing your prompt.
                  </p>
                </div>
              </div>
            ) : videoUrl ? (
              <div>

                <video
                  src={videoUrl}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    background: '#000',
                  }}
                />

                <button
                  onClick={() =>
                    downloadVideo(videoUrl)
                  }
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '14px',
                    border: 0,
                    borderRadius: '10px',
                    background: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  ⬇️ Download Video
                </button>

              </div>
            ) : (
              <div
                style={{
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#718096',
                }}
              >
                <div>
                  <div
                    style={{ fontSize: '55px' }}
                  >
                    🎞️
                  </div>

                  <p>
                    Your generated video will
                    appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* HISTORY */}

        <section
          style={{
            marginTop: '45px',
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '15px',
            }}
          >

            <div>
              <h2
                style={{
                  marginBottom: '5px',
                }}
              >
                📜 My Videos
              </h2>

              <p
                style={{
                  color: '#9ca9bf',
                  margin: 0,
                }}
              >
                Your generated video history
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  padding: '10px 15px',
                  borderRadius: '9px',
                  border:
                    '1px solid rgba(239,68,68,0.4)',
                  background:
                    'rgba(239,68,68,0.12)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                🗑️ Clear History
              </button>
            )}

          </div>

          {history.length === 0 ? (
            <div
              style={{
                padding: '45px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                background:
                  'rgba(255,255,255,0.05)',
                border:
                  '1px solid rgba(255,255,255,0.1)',
                color: '#718096',
              }}
            >
              <div
                style={{
                  fontSize: '50px',
                }}
              >
                🎞️
              </div>

              <p>
                You haven't generated any videos
                yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(280px,1fr))',
                gap: '20px',
              }}
            >

              {history.map((video) => (
                <div
                  key={video.id}
                  style={{
                    background:
                      'rgba(255,255,255,0.06)',
                    border:
                      '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    padding: '15px',
                  }}
                >

                  <video
                    src={video.videoUrl}
                    controls
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      background: '#000',
                    }}
                  />

                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.5,
                      marginTop: '12px',
                    }}
                  >
                    {video.prompt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '7px',
                      marginBottom: '12px',
                    }}
                  >

                    <span style={tagStyle}>
                      ⏱️ {video.duration}s
                    </span>

                    <span style={tagStyle}>
                      🎥 {video.quality}
                    </span>

                    <span style={tagStyle}>
                      🎨 {video.style}
                    </span>

                  </div>

                  <small
                    style={{
                      color: '#718096',
                    }}
                  >
                    {video.createdAt}
                  </small>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '8px',
                      marginTop: '12px',
                    }}
                  >

                    <button
                      onClick={() =>
                        downloadVideo(
                          video.videoUrl
                        )
                      }
                      style={downloadStyle}
                    >
                      ⬇️ Download
                    </button>

                    <button
                      onClick={() =>
                        deleteVideo(video.id)
                      }
                      style={deleteStyle}
                    >
                      🗑️ Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* FOOTER NOTE */}

        <div
          style={{
            marginTop: '40px',
            padding: '18px',
            textAlign: 'center',
            borderRadius: '12px',
            background:
              'rgba(59,130,246,0.08)',
            color: '#93c5fd',
          }}
        >
          🔒 Your video history is saved in
          this browser.
        </div>

      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '7px',
  borderRadius: '9px',
  border:
    '1px solid rgba(255,255,255,0.15)',
  background: '#111827',
  color: '#fff',
  fontSize: '14px',
}

const tagStyle = {
  padding: '5px 8px',
  borderRadius: '7px',
  background: 'rgba(255,255,255,0.07)',
  color: '#cbd5e1',
  fontSize: '12px',
}

const downloadStyle = {
  padding: '10px',
  border: 0,
  borderRadius: '8px',
  background: '#16a34a',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const deleteStyle = {
  padding: '10px',
  border: 0,
  borderRadius: '8px',
  background: '#991b1b',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}
