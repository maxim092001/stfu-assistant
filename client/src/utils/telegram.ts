interface TelegramMessage {
  text: string
  riskLevel?: number
  timestamp: Date
}

/**
 * Client-side function to trigger Telegram notification
 * This makes a request to our API endpoint for secure server-side handling
 */
export async function triggerTelegramNotification(message: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...message,
        timestamp: message.timestamp.toISOString(), // Convert Date to string
      }),
    })

    if (!response.ok) {
      console.error('Failed to trigger Telegram notification')
      return false
    }

    return true
  } catch (error) {
    console.error('Error triggering Telegram notification:', error)
    return false
  }
} 