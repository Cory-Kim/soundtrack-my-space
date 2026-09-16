import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import audioCatalog from './data/audioCatalog.json'
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
    variants: audioCatalog.rain,
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    icon: '☕',
    variants: audioCatalog.coffee,
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: '⌨',
    variants: audioCatalog.keyboard,
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    icon: '♨',
    variants: audioCatalog.fireplace,
  },
  {
    id: 'traffic',
    name: 'City Ambience',
    icon: '▥',
    variants: audioCatalog.traffic,
  },
  {
    id: 'synth',
    name: 'Synth Hum',
    icon: '≋',
    variants: audioCatalog.synth,
  },
  {
    id: 'thunder',
    name: 'Thunder',
    icon: '↯',
    variants: audioCatalog.thunder,
  },
  {
    id: 'pages',
    name: 'Page Turns',
    icon: '▤',
    variants: audioCatalog.pages,
  },
  {
    id: 'room',
    name: 'Room Tone',
    icon: '◦',
    variants: audioCatalog.room,
  },
  {
    id: 'engine',
    name: 'Engine Hum',
    icon: '◉',
    variants: audioCatalog.engine,
  },
  {
    id: 'beeps',
    name: 'Soft Beeps',
    icon: '⌁',
    variants: audioCatalog.beeps,
  },
  {
    id: 'wind',
    name: 'Wind Drone',
    icon: '≋',
    variants: audioCatalog.wind,
  },
]

const AUDIO_BASE_PATH = '/assets/audio/'
const FADE_SECONDS = 30

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const getAudioSource = (layer, variantId) => {
  const variant = layer.variants.find((item) => item.id === variantId) ?? layer.variants[0]
  // Vite's public-file lookup expects literal commas in these filenames.
  return `${AUDIO_BASE_PATH}${encodeURIComponent(variant.sourceFile).replaceAll('%2C', ',')}`
}

const playbackErrorMessage = (layer, error) => {
  if (error.name === 'NotAllowedError') return `${layer.name}: press Play to allow audio playback.`
  if (error.name === 'NotSupportedError') return `${layer.name}: the audio file could not be loaded. Try another variation.`
  return `${layer.name} could not play. Try again or choose another variation.`
}

const getTimestamp = () => Date.now()

const createMix = (preset) => Object.fromEntries(soundLayers.map((layer) => [
  layer.id,
  { volume: preset.layers[layer.id] ?? 40, enabled: (preset.layers[layer.id] ?? 0) > 0 },
]))

function App() {
  const [activePresetId, setActivePresetId] = useState('cyberpunk-night')
  const [mix, setMix] = useState(() => createMix(presets[1]))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [audioError, setAudioError] = useState('')
  const [masterVolume, setMasterVolume] = useState(72)
  const [sleepMinutes, setSleepMinutes] = useState(30)
  const [sleepEnabled, setSleepEnabled] = useState(true)
  const [fadeOut, setFadeOut] = useState(true)
  const [sleepRemaining, setSleepRemaining] = useState(30 * 60)
  const [variantByLayer, setVariantByLayer] = useState(() =>
    Object.fromEntries(soundLayers.map((layer) => [layer.id, layer.variants[0].id])),
  )
  const audioByLayerRef = useRef(new Map())
  const audioSourceByLayerRef = useRef(new Map())
  const sleepStartedAtRef = useRef(null)
  const fadeVolumeRef = useRef(1)

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId) ?? presets[0],
    [activePresetId],
  )

  const getLayerVolume = useCallback((layerId, forcePlaying = isPlaying) => {
    const layerMix = mix[layerId]
    if (!layerMix?.enabled || !forcePlaying) return 0
    return (layerMix.volume / 100) * (masterVolume / 100) * fadeVolumeRef.current
  }, [isPlaying, masterVolume, mix])

  const ensureLayerAudio = useCallback((layer) => {
    let audio = audioByLayerRef.current.get(layer.id)

    if (!audio) {
      audio = new Audio()
      audio.loop = true
      audio.preload = 'auto'
      audioByLayerRef.current.set(layer.id, audio)
    }

    const nextSource = getAudioSource(layer, variantByLayer[layer.id])
    if (audioSourceByLayerRef.current.get(layer.id) !== nextSource) {
      const wasPlaying = !audio.paused
      audio.pause()
      audio.src = nextSource
      audio.load()
      audioSourceByLayerRef.current.set(layer.id, nextSource)

      if (wasPlaying && isPlaying && mix[layer.id]?.enabled) {
        audio.play().catch(() => {
          setAudioError(`${layer.name} could not restart. Try another variation.`)
        })
      }
    }

    return audio
  }, [isPlaying, mix, variantByLayer])

  const syncAudio = useCallback(() => {
    soundLayers.forEach((layer) => {
      const audio = ensureLayerAudio(layer)

      audio.volume = getLayerVolume(layer.id)
      if (!isPlaying || !mix[layer.id]?.enabled || audio.volume <= 0) {
        audio.pause()
        return
      }

      if (audio.paused) {
        audio.play().catch(() => {
          setAudioError(`${layer.name} could not start. Try another variation.`)
        })
      }
    })
  }, [ensureLayerAudio, getLayerVolume, isPlaying, mix])

  function selectPreset(id) {
    const preset = presets.find((item) => item.id === id)
    if (!preset) return
    setActivePresetId(id)
    setAudioError('')
    if (id === 'custom-space') return
    setMix(createMix(preset))
    setVariantByLayer(Object.fromEntries(soundLayers.map((layer) => [layer.id, layer.variants[0].id])))
  }

  function updateLayer(id, changes) {
    setActivePresetId('custom-space')
    setAudioError('')
    setMix((current) => ({ ...current, [id]: { ...current[id], ...changes } }))
  }

  function playLayerFromClick(layer, nextEnabled = true) {
    if (!isPlaying || !nextEnabled) return

    const audio = ensureLayerAudio(layer)
    const nextVolume = (mix[layer.id].volume / 100) * (masterVolume / 100) * fadeVolumeRef.current
    audio.volume = nextVolume

    if (nextVolume > 0) {
      audio.play().catch(() => {
        setAudioError(`${layer.name} could not start. Try another variation.`)
      })
    }
  }

  function toggleLayer(layer) {
    const nextEnabled = !mix[layer.id].enabled
    updateLayer(layer.id, { enabled: nextEnabled })

    if (nextEnabled) {
      playLayerFromClick(layer, true)
    } else {
      audioByLayerRef.current.get(layer.id)?.pause()
    }
  }

  function changeLayerVariant(layer, variantId) {
    if (variantByLayer[layer.id] === variantId) return
    setActivePresetId('custom-space')
    setAudioError('')
    setVariantByLayer((current) => ({
      ...current,
      [layer.id]: variantId,
    }))

    if (!isPlaying || !mix[layer.id]?.enabled) return

    const audio = audioByLayerRef.current.get(layer.id) ?? ensureLayerAudio(layer)
    const nextSource = getAudioSource(layer, variantId)
    audio.pause()
    audio.src = nextSource
    audio.load()
    audioSourceByLayerRef.current.set(layer.id, nextSource)
    audio.volume = getLayerVolume(layer.id, true)
    audio.play().catch(() => {
      setAudioError(`${layer.name} could not start. Try another variation.`)
    })
  }

  function resetMix() {
    setMix(createMix(activePreset))
    setVariantByLayer(Object.fromEntries(soundLayers.map((layer) => [layer.id, layer.variants[0].id])))
  }

  async function togglePlayback() {
    setAudioError('')

    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    soundLayers.forEach((layer) => ensureLayerAudio(layer))
    setIsAudioReady(true)

    fadeVolumeRef.current = 1
    sleepStartedAtRef.current = sleepEnabled ? getTimestamp() : null
    setSleepRemaining(sleepMinutes * 60)

    const activeLayers = soundLayers.filter((layer) => mix[layer.id]?.enabled)
    const results = await Promise.allSettled(activeLayers.map(async (layer) => {
      const audio = ensureLayerAudio(layer)
      audio.volume = getLayerVolume(layer.id, true)
      await audio.play()
    }))

    const rejectedCount = results.filter((result) => result.status === 'rejected').length
    if (activeLayers.length === 0) {
      setAudioError('Turn on at least one layer to start the mix.')
      return
    }

    if (rejectedCount === activeLayers.length) {
      setAudioError(results.map((result, index) => playbackErrorMessage(activeLayers[index], result.reason)).join(' '))
      setIsPlaying(false)
    } else {
      setAudioError(rejectedCount > 0 ? 'Some layers could not start. Try their dropdown variations.' : '')
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    syncAudio()
  }, [syncAudio])

  useEffect(() => () => {
    audioByLayerRef.current.forEach((audio) => {
      audio.pause()
      audio.src = ''
    })
    audioByLayerRef.current.clear()
    audioSourceByLayerRef.current.clear()
  }, [])

  useEffect(() => {
    if (!isPlaying || !sleepEnabled) return undefined

    const intervalId = window.setInterval(() => {
      const startedAt = sleepStartedAtRef.current ?? getTimestamp()
      const totalSeconds = sleepMinutes * 60
      const elapsedSeconds = (getTimestamp() - startedAt) / 1000
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

      if (fadeOut && remainingSeconds <= FADE_SECONDS) {
        fadeVolumeRef.current = Math.max(0, remainingSeconds / FADE_SECONDS)
        syncAudio()
      }

      setSleepRemaining(remainingSeconds)

      if (remainingSeconds <= 0) {
        setIsPlaying(false)
        fadeVolumeRef.current = 1
        sleepStartedAtRef.current = null
      }
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [fadeOut, isPlaying, sleepEnabled, sleepMinutes, syncAudio])

  function toggleSleepMode() {
    const nextValue = !sleepEnabled
    if (nextValue && isPlaying) {
      sleepStartedAtRef.current = getTimestamp()
      fadeVolumeRef.current = 1
    } else {
      sleepStartedAtRef.current = null
    }
    setSleepRemaining(sleepMinutes * 60)
    setSleepEnabled(nextValue)
  }

  function chooseSleepMinutes(minutes) {
    setSleepMinutes(minutes)
    setSleepRemaining(minutes * 60)
    if (isPlaying && sleepEnabled) {
      sleepStartedAtRef.current = getTimestamp()
      fadeVolumeRef.current = 1
    }
  }

  const visibleLayers = soundLayers.map((layer) => ({ ...layer, ...mix[layer.id] }))
  const activeLayerCount = visibleLayers.filter((layer) => layer.enabled).length
  const countdownLabel = sleepEnabled && isPlaying ? formatClock(sleepRemaining) : formatClock(sleepMinutes * 60)
  const playbackStatus = audioError || (
    isPlaying
      ? `${activeLayerCount} layers playing`
      : isAudioReady
        ? 'Paused. Your mix is ready.'
        : 'Ready when you press play.'
  )

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
            onClick={togglePlayback}
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
            <small className={audioError ? 'playback-status warning' : 'playback-status'}>{playbackStatus}</small>
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
              onClick={toggleSleepMode}
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
                onClick={() => chooseSleepMinutes(minutes)}
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
            <span>{countdownLabel}</span>
            <small>
              {sleepEnabled
                ? isPlaying
                  ? fadeOut
                    ? `Fade starts in ${formatClock(Math.max(0, sleepRemaining - FADE_SECONDS))}`
                    : 'Sleep timer is running.'
                  : 'Ready when you press play.'
                : 'Sleep mode is paused.'}
            </small>
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
                <button className={`mini-switch ${layer.enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={layer.enabled} aria-label={`Toggle ${layer.name}`} onClick={() => toggleLayer(layer)}>
                  <span />
                </button>
              </div>

              <label>
                <span>{layer.name}</span>
                <select
                  value={variantByLayer[layer.id]}
                  onChange={(event) => changeLayerVariant(layer, event.target.value)}
                >
                  {layer.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label}
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
