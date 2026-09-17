export const getFadeVolume = (remainingSeconds, fadeOut, fadeSeconds) => {
  if (!fadeOut || remainingSeconds > fadeSeconds) return 1
  return Math.min(1, Math.max(0, remainingSeconds / fadeSeconds))
}
