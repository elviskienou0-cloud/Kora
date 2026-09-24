let audioContext = null

const STORAGE_KEY = "kora_notification_sound_enabled"

function getAudioContext() {
  if (typeof window === "undefined") {
    return null
  }

  const AudioContext =
    window.AudioContext || window.webkitAudioContext

  if (!AudioContext) {
    console.warn("AudioContext n'est pas supporté par ce navigateur.")
    return null
  }

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

export function isNotificationSoundEnabled() {
  if (typeof window === "undefined") {
    return true
  }

  const stored = localStorage.getItem(STORAGE_KEY)

  return stored !== "false"
}

export function setNotificationSoundEnabled(enabled) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(STORAGE_KEY, String(enabled))
}

export async function enableNotificationSound() {
  const context = getAudioContext()

  if (!context) {
    return false
  }

  try {
    if (context.state === "suspended") {
      await context.resume()
    }

    return context.state === "running"
  } catch (error) {
    console.warn(
      "Impossible d'activer le son des notifications :",
      error
    )

    return false
  }
}

export async function playNotificationSound() {
  if (!isNotificationSoundEnabled()) {
    return
  }

  const context = getAudioContext()

  if (!context) {
    return
  }

  try {
    if (context.state === "suspended") {
      await context.resume()
    }

    if (context.state !== "running") {
      console.warn(
        "Le son est bloqué par le navigateur. Cliquez d'abord sur la page."
      )
      return
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.type = "sine"

    const now = context.currentTime

    oscillator.frequency.setValueAtTime(880, now)

    oscillator.frequency.exponentialRampToValueAtTime(
      660,
      now + 0.12
    )

    gainNode.gain.setValueAtTime(0.0001, now)

    gainNode.gain.exponentialRampToValueAtTime(
      0.15,
      now + 0.01
    )

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.2
    )

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.2)

    oscillator.addEventListener("ended", () => {
      oscillator.disconnect()
      gainNode.disconnect()
    })
  } catch (error) {
    console.warn(
      "Impossible de jouer le son de notification :",
      error
    )
  }
}

export async function testNotificationSound() {
  await enableNotificationSound()
  await playNotificationSound()
}