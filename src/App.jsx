import { useMemo, useState } from 'react'
import './App.css'

const presets = [
  {
    id: 'rainy-cafe',
    name: 'Rainy Cafe',
    tagline: 'Warm drinks. Softer thoughts.',
    icon: '☕',
    background: '/assets/backgrounds/rainy-cafe.png',
    accent: '#f6b75f',
    layers: {
      rain: 72,
      coffee: 44,
      keyboard: 28,
      fireplace: 26,
    },
  },
  {
    id: 'cyberpunk-night',
    name: 'Cyberpunk Night',
    tagline: 'Neon lights. Deeper focus.',
    icon: '▥',
    background: '/assets/backgrounds/cyberpunk-night.png',
    accent: '#35d9ff',
    layers: {
      rain: 58,
      traffic: 52,
      synth: 42,
      thunder: 20,
    },
  },
  {
    id: 'quiet-library',
    name: 'Quiet Library',
    tagline: 'A calmer, brighter you.',
    icon: '▤',
    background: '/assets/backgrounds/quiet-library.png',
    accent: '#caa861',
    layers: {
      pages: 46,
      room: 55,
      keyboard: 22,
      fireplace: 18,
    },
  },
  {
    id: 'space-station',
    name: 'Space Station',
    tagline: 'Far away. Right here.',
    icon: '◌',
    background: '/assets/backgrounds/space-station.png',
    accent: '#9fd8ff',
    layers: {
      engine: 54,
      beeps: 30,
      wind: 38,
      synth: 24,
    },
  },
  {
    id: 'custom-space',
    name: 'Custom Space',
    tagline: 'Your mix, your atmosphere.',
    icon: '✦',
    background: '/assets/backgrounds/custom-space.png',
    accent: '#8fe6da',
    layers: {
      rain: 44,
      synth: 32,
      wind: 26,
    },
  },
]

const soundLayers = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '☔',
    variants: ['Window Rain', 'Soft Rain', 'Gentle Drops', 'Distant Rain'],
  },
  {
    id: 'coffee',
    name: 'Cafe Chatter',
    icon: '☕',
    variants: ['Muffled Cafe', 'Quiet Tables', 'Morning Cafe', 'Soft Crowd'],
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: '⌨',
    variants: ['Gentle Typing', 'Creamy Keys', 'Soft Mechanical', 'Light Work'],
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    icon: '♨',
    variants: ['Soft Crackle', 'Warm Hearth', 'Low Embers', 'Cozy Fire'],
  },
  {
    id: 'traffic',
    name: 'City Ambience',
    icon: '▥',
    variants: ['Muffled Traffic', 'Wet Streets', 'Distant City', 'Night Drive'],
  },
  {
    id: 'synth',
    name: 'Synth Hum',
    icon: '≋',
    variants: ['Analog Hum', 'Neon Drone', 'Deep Pad', 'Low Signal'],
  },
  {
    id: 'thunder',
    name: 'Thunder',
    icon: '↯',
    variants: ['Distant Rumble', 'Soft Roll', 'Far Storm'],
  },
  {
    id: 'pages',
    name: 'Page Turns',
    icon: '▤',
    variants: ['Soft Paper', 'Gentle Rustle', 'Slow Reading', 'Library Pages'],
  },
  {
    id: 'room',
    name: 'Room Tone',
    icon: '◦',
    variants: ['Quiet Room', 'Warm Air', 'Studio Tone', 'Still Space'],
  },
  {
    id: 'engine',
    name: 'Engine Hum',
    icon: '◉',
    variants: ['Space Engine', 'Reactor Hum', 'Ship Interior', 'Deep Idle'],
  },
  {
    id: 'beeps',
    name: 'Soft Beeps',
    icon: '⌁',
    variants: ['Minimal Beeps', 'Calm Console', 'Distant Signals', 'Soft Chimes'],
  },
  {
    id: 'wind',
    name: 'Wind Drone',
    icon: '≋',
    variants: ['Smooth Wind', 'Airflow Drone', 'Glass Wind', 'Soft Draft'],
  },
]

const formatTime = (minutes) => `${minutes}:00`

const createMix = (preset) => Object.fromEntries(soundLayers.map((layer) => [
  layer.id,
  { volume: preset.layers[layer.id] ?? 40, enabled: (preset.layers[layer.id] ?? 0) > 0 },
]))

function App() {
  const [activePresetId, setActivePresetId] = useState('cyberpunk-night')
  const [mix, setMix] = useState(() => createMix(presets[1]))
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterVolume, setMasterVolume] = useState(72)
  const [sleepMinutes, setSleepMinutes] = useState(30)
  const [sleepEnabled, setSleepEnabled] = useState(true)
  const [fadeOut, setFadeOut] = useState(true)
  const [variantByLayer, setVariantByLayer] = useState(() =>
    Object.fromEntries(soundLayers.map((layer) => [layer.id, layer.variants[0]])),
  )

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId) ?? presets[0],
    [activePresetId],
  )

  function selectPreset(id) {
    const preset = presets.find((item) => item.id === id)
    if (!preset) return
    setActivePresetId(id)
    setMix(createMix(preset))
  }

  function updateLayer(id, changes) {
    setMix((current) => ({ ...current, [id]: { ...current[id], ...changes } }))
  }

  function resetMix() {
    setMix(createMix(activePreset))
    setVariantByLayer(Object.fromEntries(soundLayers.map((layer) => [layer.id, layer.variants[0]])))
  }

  const visibleLayers = soundLayers.map((layer) => ({ ...layer, ...mix[layer.id] }))

  return (
    <main
      className="app-shell"
      style={{
        '--accent': activePreset.accent,
        '--background-image': `url(${activePreset.background})`,
      }}
    >
      <div className="scene" aria-hidden="true" />
      <div className="ambient-wash" aria-hidden="true" />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark">≋</span>
          <span>
            Soundtrack <strong>My Space</strong>
          </span>
        </div>

        <div className="master-controls" aria-label="Master audio controls">
          <button
            className="play-button"
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            aria-label={isPlaying ? 'Pause ambience' : 'Play ambience'}
          >
            {isPlaying ? 'Ⅱ' : '▶'}
          </button>
          <label className="volume-control">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(event) => setMasterVolume(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="top-actions">
          <button className="install-button" type="button">
            Install App
          </button>
          <div className="daypart">
            <span>☾</span>
            Good evening
          </div>
        </div>
      </header>

      <section className="hero-space" aria-labelledby="preset-heading">
        <p className="side-quote">DIFFERENT SOUNDS. BRIGHTER SPACES.</p>

        <div className="preset-stage">
          <div className="active-copy">
            <p>Now playing</p>
            <h1 id="preset-heading">{activePreset.name}</h1>
            <span>{activePreset.tagline}</span>
          </div>

          <div className="preset-grid" aria-label="Soundscape presets">
            {presets.map((preset) => (
              <button
                className={`preset-card ${preset.id === activePreset.id ? 'active' : ''}`}
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                style={{ '--card-image': `url(${preset.background})`, '--card-accent': preset.accent }}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-name">{preset.name}</span>
                <span className="preset-tagline">{preset.tagline}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="sleep-panel" aria-label="Sleep mode">
          <div className="panel-heading">
            <div>
              <span className="moon">☾</span>
              <h2>Sleep Mode</h2>
              <p>Let the sounds carry you.</p>
            </div>
            <button
              className={`switch ${sleepEnabled ? 'on' : ''}`}
              type="button"
              onClick={() => setSleepEnabled((value) => !value)}
              aria-label="Toggle sleep mode"
            >
              <span />
            </button>
          </div>

          <div className="timer-ring">
            <span>{sleepMinutes}</span>
            <small>minutes</small>
          </div>

          <div className="timer-options">
            {[15, 30, 45, 60].map((minutes) => (
              <button
                className={sleepMinutes === minutes ? 'selected' : ''}
                key={minutes}
                type="button"
                onClick={() => setSleepMinutes(minutes)}
              >
                {minutes}
              </button>
            ))}
          </div>

          <div className="fade-row">
            <div>
              <strong>Fade out</strong>
              <p>Gradually lower the volume at the end.</p>
            </div>
            <button
              className={`switch ${fadeOut ? 'on' : ''}`}
              type="button"
              onClick={() => setFadeOut((value) => !value)}
              aria-label="Toggle fade out"
            >
              <span />
            </button>
          </div>

          <div className="countdown">
            <span>{formatTime(sleepMinutes)}</span>
            <small>{sleepEnabled ? 'Ready when you press play.' : 'Sleep mode is paused.'}</small>
          </div>

          <button className="share-button" type="button">
            Share Vibe
          </button>
        </aside>
      </section>

      <section className="mixer-panel" aria-label="Sound layers">
        <div className="mixer-header">
          <div>
            <h2>Sound Layers</h2>
            <p>Mix your atmosphere</p>
          </div>
          <div className="mix-actions">
            <select aria-label="Soundscape preset" value={activePresetId} onChange={(event) => selectPreset(event.target.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} Mix
                </option>
              ))}
            </select>
            <button type="button" onClick={resetMix}>Reset Mix</button>
          </div>
        </div>

        <div className="layer-grid">
          {visibleLayers.map((layer) => (
            <article className={`layer-card ${layer.enabled ? 'enabled' : 'muted'}`} key={layer.id}>
              <div className="layer-topline">
                <span className="layer-icon">{layer.icon}</span>
                <button className={`mini-switch ${layer.enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={layer.enabled} aria-label={`Toggle ${layer.name}`} onClick={() => updateLayer(layer.id, { enabled: !layer.enabled })}>
                  <span />
                </button>
              </div>

              <label>
                <span>{layer.name}</span>
                <select
                  value={variantByLayer[layer.id]}
                  onChange={(event) =>
                    setVariantByLayer((current) => ({
                      ...current,
                      [layer.id]: event.target.value,
                    }))
                  }
                >
                  {layer.variants.map((variant) => (
                    <option key={variant} value={variant}>
                      {variant}
                    </option>
                  ))}
                </select>
              </label>

              <div className="layer-volume">
                <input type="range" min="0" max="100" aria-label={`${layer.name} volume`} value={layer.volume} onChange={(event) => updateLayer(layer.id, { volume: Number(event.target.value) })} />
                <span>{layer.volume}%</span>
              </div>
            </article>
          ))}

          <button className="add-layer" type="button">
            <span>＋</span>
            Add Layer
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
