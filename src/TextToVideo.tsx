import { useState } from 'react'

type Plan = {
  name: string
  price: string
  credits: number
  description: string
  icon: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    credits: 5,
    description: 'Try text-to-video generation',
    icon: '🆓',
  },
  {
    name: 'Basic',
    price: '$9.99/mo',
    credits: 50,
    description: 'More generations with HD quality',
    icon: '🔵',
  },
  {
    name: 'Popular',
    price: '$19.99/mo',
    credits: 150,
    description: 'More credits with HD/1080p',
    icon: '⭐',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$39.99/mo',
    credits: 500,
    description: 'Highest limits and premium features',
    icon: '👑',
  },
]

export default function TextToVideo() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [quality, setQuality] = useState('720p')
  const [style, setStyle] = useState('Cinematic')
  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [credits, setCredits] = useState(5)
  const [selectedPlan, setSelectedPlan] = useState('Free')
  const [message, setMessage] = useState('')

  async function generateVideo() {
    if (!prompt.trim()) {
      setMessage('Please enter a video description.')
      return
    }

    if (credits <= 0) {
      setMessage('You have no credits remaining. Please upgrade your plan.')
      return
    }

    setGenerating(true)
    setMessage('')
    setVideoUrl('')

    /*
      DEMO MODE

      یہاں بعد میں اصل Text-to-Video API connect کی جائے گی۔
      فی الحال UI generation process دکھائے گا۔
    */

    await new Promise((resolve) => setTimeout(resolve, 3000))

    setCredits((current) => current - 1)

    /*
      Demo video.
      API connect ہونے کے بعد اس URL کو generated video URL سے replace کیا جائے گا۔
    */
    setVideoUrl(
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    )

    setGenerating(false)
    setMessage('Video generated successfully!')
  }

  function selectPlan(plan: Plan) {
    setSelectedPlan(plan.name)
    setCredits(plan.credits)

    setMessage(
      `${plan.name} plan selected. ${plan.credits} credits available.`
    )
  }

  function downloadVideo() {
    if (!videoUrl) return

    const link = document.createElement('a')
    link.href = videoUrl
    link.download = 'toolmaster-generated-video.mp4'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 20px',
        background:
          'linear-gradient(135deg, #07111f 0%, #101b35 50%, #16213e 100%)',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              marginBottom: '10px',
            }}
          >
            🎬
          </div>

          <h1
            style={{
              fontSize: '42px',
              margin: 0,
              fontWeight: 800,
            }}
          >
            Text to Video AI
          </h1>

          <p
            style={{
              color: '#aab7cf',
              fontSize: '17px',
              marginTop: '12px',
            }}
          >
            Turn your text into stunning videos with AI
          </p>
        </div>

        {/* MAIN GENERATOR */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 0.6fr',
            gap: '24px',
            marginBottom: '50px',
          }}
        >
          {/* PROMPT */}

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '28px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              ✨ Create Your Video
            </h2>

            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              Video Prompt
            </label>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: A beautiful sunset over the mountains, cinematic camera movement, realistic clouds..."
              rows={7}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                resize: 'vertical',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginTop: '20px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                  }}
                >
                  Duration
                </label>

                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={selectStyle}
                >
                  <option value="5">5 Seconds</option>
                  <option value="10">10 Seconds</option>
                  <option value="15">15 Seconds</option>
                  <option value="30">30 Seconds</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                  }}
                >
                  Quality
                </label>

                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  style={selectStyle}
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                  }}
                >
                  Style
                </label>

                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <span>
                💳 Credits remaining:{' '}
                <strong>{credits}</strong>
              </span>

              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(80,150,255,0.18)',
                  color: '#8ec5ff',
                  fontSize: '13px',
                }}
              >
                {selectedPlan} Plan
              </span>
            </div>

            <button
              onClick={generateVideo}
              disabled={generating}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '16px',
                border: 0,
                borderRadius: '12px',
                background: generating
                  ? '#475569'
                  : 'linear-gradient(90deg, #2563eb, #7c3aed)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 700,
                cursor: generating ? 'not-allowed' : 'pointer',
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
                  background: 'rgba(34,197,94,0.12)',
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
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '24px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🎥 Preview
            </h2>

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
                      fontSize: '48px',
                      marginBottom: '15px',
                    }}
                  >
                    ⚙️
                  </div>

                  <strong>Creating your video...</strong>

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
                  onClick={downloadVideo}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '13px',
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
                  <div style={{ fontSize: '55px' }}>
                    🎞️
                  </div>

                  <p>
                    Your generated video will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PLANS */}

        <section>
          <div
            style={{
              textAlign: 'center',
              marginBottom: '30px',
            }}
          >
            <h2
              style={{
                fontSize: '32px',
                marginBottom: '8px',
              }}
            >
              Choose Your Plan
            </h2>

            <p style={{ color: '#9ca9bf' }}>
              Upgrade your plan and create more AI videos.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  position: 'relative',
                  padding: '24px',
                  borderRadius: '18px',
                  background:
                    selectedPlan === plan.name
                      ? 'rgba(37,99,235,0.18)'
                      : 'rgba(255,255,255,0.05)',
                  border:
                    selectedPlan === plan.name
                      ? '2px solid #3b82f6'
                      : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '18px',
                      background: '#f59e0b',
                      color: '#111827',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div style={{ fontSize: '35px' }}>
                  {plan.icon}
                </div>

                <h3
                  style={{
                    fontSize: '23px',
                    marginBottom: '8px',
                  }}
                >
                  {plan.name}
                </h3>

                <div
                  style={{
                    fontSize: '25px',
                    fontWeight: 800,
                    marginBottom: '10px',
                  }}
                >
                  {plan.price}
                </div>

                <p
                  style={{
                    color: '#9ca9bf',
                    minHeight: '42px',
                  }}
                >
                  {plan.description}
                </p>

                <div
                  style={{
                    margin: '18px 0',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  🎬 <strong>{plan.credits}</strong> video credits
                </div>

                <button
                  onClick={() => selectPlan(plan)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background:
                      selectedPlan === plan.name
                        ? '#2563eb'
                        : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {selectedPlan === plan.name
                    ? '✓ Current Plan'
                    : plan.name === 'Free'
                      ? 'Select Free'
                      : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* NOTE */}

        <div
          style={{
            marginTop: '35px',
            padding: '18px',
            borderRadius: '12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#fcd34d',
            textAlign: 'center',
          }}
        >
          ⚡ Video generation is currently in demo mode.
          The real AI video API will be connected next.
        </div>
      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '9px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: '#111827',
  color: '#fff',
  fontSize: '14px',
}
