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
const [loadingHistory, setLoadingHistory] = useState(true)

const [videoUrl, setVideoUrl] = useState('')
const [message, setMessage] = useState('')
const [history, setHistory] = useState<VideoHistory[]>([])

useEffect(() => {
loadHistory()
}, [])

async function loadHistory() {
setLoadingHistory(true)

```
try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error(userError)
    setHistory([])
    return
  }

  if (!user) {
    setHistory([])
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
    console.error('History load error:', error)
    setMessage('Unable to load your video history.')
    setHistory([])
    return
  }

  setHistory((data || []) as VideoHistory[])
} finally {
  setLoadingHistory(false)
}
```

}

async function generateVideo() {
const cleanPrompt = prompt.trim()

```
if (!cleanPrompt) {
  setMessage('Please enter a video description.')
  return
}

if (cleanPrompt.length < 3) {
  setMessage('Please enter a more detailed prompt.')
  return
}

setGenerating(true)
setMessage('⏳ AI is creating your video. Please wait...')
setVideoUrl('')

try {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  if (!session) {
    throw new Error(
      'Your session has expired. Please login again.'
    )
  }

  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt: cleanPrompt,
      duration,
      quality,
      style,
    }),
  })

  let data: any = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(
      data?.error || 'Video generation failed.'
    )
  }

  if (!data?.videoUrl) {
    throw new Error(
      'Video was generated but no video URL was returned.'
    )
  }

  setVideoUrl(data.videoUrl)

  await loadHistory()

  setMessage('🎉 Video generated successfully!')
} catch (error: any) {
  console.error('Video generation error:', error)

  setMessage(
    error?.message ||
      'Something went wrong while generating the video.'
  )
} finally {
  setGenerating(false)
}
```

}

function downloadVideo(url: string) {
if (!url) return

```
const link = document.createElement('a')

link.href = url
link.download = 'toolmaster-ai-video.mp4'
link.target = '_blank'
link.rel = 'noopener noreferrer'

document.body.appendChild(link)
link.click()
document.body.removeChild(link)
```

}

async function deleteVideo(id: string) {
const confirmed = window.confirm(
'Are you sure you want to delete this video from your history?'
)

```
if (!confirmed) return

setMessage('Deleting video...')

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  setMessage('Please login again.')
  return
}

const { error } = await supabase
  .from('video_generations')
  .delete()
  .eq('id', id)
  .eq('user_id', user.id)

if (error) {
  console.error('Delete video error:', error)
  setMessage('Unable to delete this video.')
  return
}

setHistory((previous) =>
  previous.filter((video) => video.id !== id)
)

setMessage('Video deleted successfully.')
```

}

async function clearHistory() {
if (history.length === 0) return

```
const confirmed = window.confirm(
  'Are you sure you want to clear all your video history?'
)

if (!confirmed) return

setMessage('Clearing video history...')

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  setMessage('Please login again.')
  return
}

const { error } = await supabase
  .from('video_generations')
  .delete()
  .eq('user_id', user.id)

if (error) {
  console.error('Clear history error:', error)
  setMessage('Unable to clear your history.')
  return
}

setHistory([])
setMessage('Video history cleared successfully.')
```

}

return ( <div className="ttv-page"> <div className="ttv-container"> <div className="ttv-header"> <div className="ttv-icon">🎬</div>

```
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
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: A cinematic drone shot flying over snowy mountains at sunrise, realistic clouds, golden sunlight, smooth camera movement..."
          rows={7}
          disabled={generating}
        />

        <div className="ttv-options">
          <div>
            <label htmlFor="videoDuration">
              Duration
            </label>

            <select
              id="videoDuration"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
              disabled={generating}
            >
              <option value="5">5 Seconds</option>
              <option value="10">10 Seconds</option>
            </select>
          </div>

          <div>
            <label htmlFor="videoQuality">
              Quality
            </label>

            <select
              id="videoQuality"
              value={quality}
              onChange={(e) =>
                setQuality(e.target.value)
              }
              disabled={generating}
            >
              <option value="480p">480p</option>
              <option value="720p">720p HD</option>
              <option value="1080p">1080p</option>
            </select>
          </div>

          <div>
            <label htmlFor="videoStyle">
              Style
            </label>

            <select
              id="videoStyle"
              value={style}
              onChange={(e) =>
                setStyle(e.target.value)
              }
              disabled={generating}
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

            <h3>Creating your video...</h3>

            <p>
              AI is processing your prompt.
              Please don't close this page.
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
            disabled={loadingHistory}
          >
            🗑️ Clear History
          </button>
        )}
      </div>

      {loadingHistory ? (
        <div className="ttv-no-history">
          <div>⏳</div>

          <p>
            Loading your video history...
          </p>
        </div>
      ) : history.length === 0 ? (
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
                src={video.video_url}
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
      🔒 Your video history is securely stored
      in your Supabase account.
    </div>
  </div>
</div>
```

)
}
