import { NextRequest, NextResponse } from 'next/server'

interface TelegramMessage {
  text: string
  riskLevel?: number
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TelegramMessage = await request.json()
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const userId = process.env.TELEGRAM_USER_ID

    if (!botToken || !userId) {
      console.error('Telegram configuration missing: bot token or user ID not found')
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      )
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    // Format the message - just alarm emoji + message text
    const formattedMessage = `🚨 ${body.text}`

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId,
        text: formattedMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Telegram API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to send Telegram message', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Telegram notification sent successfully:', data.message_id)
    
    return NextResponse.json({ 
      success: true, 
      messageId: data.message_id 
    })

  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 