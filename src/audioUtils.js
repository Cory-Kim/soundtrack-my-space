export const getFadeVolume = (remainingSeconds, fadeOut, fadeSeconds) => {
  if (!fadeOut) return 1
  if (remainingSeconds <= 0) return 0
  if (!Number.isFinite(fadeSeconds) || fadeSeconds <= 0 || remainingSeconds > fadeSeconds) return 1
  return Math.min(1, remainingSeconds / fadeSeconds)
}
