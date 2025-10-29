import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Tool execution functions
async function executeCloneWebsite(argumentsString: string) {
  try {
    const args = JSON.parse(argumentsString)
    const { url, output_format, include_external_assets } = args
    
    // Validate URL
    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        error: 'Invalid URL provided'
      }
    }
    
    // Use ZAI SDK to invoke the clone_website function
    const zai = await ZAI.create()
    
    const result = await zai.functions.invoke("clone_website", {
      url: url,
      output_format: output_format || 'HTML',
      include_external_assets: include_external_assets || false
    })
    
    return {
      success: true,
      url: url,
      output_format: output_format,
      include_external_assets: include_external_assets,
      result: result,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Clone website tool error:', error)
    return {
      success: false,
      error: error.message || 'Failed to clone website',
      timestamp: new Date().toISOString()
    }
  }
}

// AI Provider configurations
const AI_PROVIDERS = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    systemPrompt: 'أنت مساعد ذكاء اصطناعي سيبراني محترف. أجب باللغة العربية بطريقة احترافية ومفيدة. لديك القدرة على استخدام أدوات متقدمة مثل نسخ المواقع الإلكترونية.'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    systemPrompt: 'أنت مساعد ذكاء اصطناعي متقدم من DeepSeek. أجب باللغة العربية بدقة واحترافية. لديك أدوات متقدمة للمساعدة في المهام التقنية.'
  },
  gemini: {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    model: 'gemini-pro',
    systemPrompt: 'أنت مساعد ذكاء اصطناعي من Google Gemini. أجب باللغة العربية بطريقة واضحة ومفيدة. يمكنك استخدام أدوات متقدمة للمساعدة.'
  },
  github: {
    apiKey: process.env.GITHUB_API_KEY,
    model: 'gpt-4',
    systemPrompt: 'أنت مساعد ذكاء اصطناعي من GitHub Models. أجب باللغة العربية بطريقة احترافية. لديك وصول لأدوات متقدمة للمطورين.'
  }
}

// Available AI Tools
const AI_TOOLS = [
  {
    "name": "clone_website",
    "description": "Fetch all content from a web link and redesign the website to replicate it exactly.",
    "strict": true,
    "parameters": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The web link to fetch and clone"
        },
        "output_format": {
          "type": "string",
          "description": "Requested format for redesigned website output, such as 'HTML', 'ZIP', or 'directory'"
        },
        "include_external_assets": {
          "type": "boolean",
          "description": "Whether to include linked external assets like scripts, fonts, and images"
        }
      },
      "required": [
        "url",
        "output_format",
        "include_external_assets"
      ],
      "additionalProperties": false
    }
  }
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  provider: string
  history: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, provider, history }: ChatRequest = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'Invalid AI provider' },
        { status: 400 }
      )
    }

    // Use ZAI SDK for all providers
    const zai = await ZAI.create()
    
    // Build messages array with system prompt and history
    const messages = [
      {
        role: 'system',
        content: providerConfig.systemPrompt
      },
      ...(history || []),
      {
        role: 'user',
        content: message
      }
    ]

    try {
      const completion = await zai.chat.completions.create({
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        tools: AI_TOOLS,
        tool_choice: "auto"
      })

      const choice = completion.choices[0]
      
      // Check if the assistant wants to use a tool
      if (choice?.message?.tool_calls) {
        const toolCall = choice.message.tool_calls[0]
        
        if (toolCall.function.name === 'clone_website') {
          // Execute the clone_website tool
          const toolResult = await executeCloneWebsite(toolCall.function.arguments)
          
          // Send the tool result back to get a final response
          const followUpMessages = [
            ...messages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(toolResult)
            }
          ]
          
          const followUpCompletion = await zai.chat.completions.create({
            messages: followUpMessages,
            temperature: 0.7,
            max_tokens: 1000
          })
          
          const response = followUpCompletion.choices[0]?.message?.content || 'تم تنفيذ أداة نسخ الموقع بنجاح.'
          
          return NextResponse.json({
            success: true,
            response: response,
            provider: provider,
            tool_used: toolCall.function.name,
            tool_result: toolResult,
            timestamp: new Date().toISOString()
          })
        }
      }

      const response = choice?.message?.content || 'عذراً، لم أتمكن من توليد استجابة مناسبة.'

      return NextResponse.json({
        success: true,
        response: response,
        provider: provider,
        timestamp: new Date().toISOString()
      })

    } catch (zaiError: any) {
      console.error(`ZAI Error with ${provider}:`, zaiError)
      
      // Fallback response
      const fallbackResponses = {
        openai: 'عذراً، حدث خطأ في الاتصال بـ OpenAI. يرجى المحاولة مرة أخرى لاحقاً.',
        deepseek: 'عذراً، حدث خطأ في الاتصال بـ DeepSeek. يرجى المحاولة مرة أخرى لاحقاً.',
        gemini: 'عذراً، حدث خطأ في الاتصال بـ Google Gemini. يرجى المحاولة مرة أخرى لاحقاً.',
        github: 'عذراً، حدث خطأ في الاتصال بـ GitHub Models. يرجى المحاولة مرة أخرى لاحقاً.'
      }

      return NextResponse.json({
        success: true,
        response: fallbackResponses[provider as keyof typeof fallbackResponses] || 'عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي.',
        provider: provider,
        error: true,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Chat service unavailable',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Health check for different providers
export async function GET() {
  const providers = Object.keys(AI_PROVIDERS)
  const status: Record<string, { available: boolean; error?: string }> = {}

  for (const provider of providers) {
    const config = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
    status[provider] = {
      available: !!config.apiKey,
      error: !config.apiKey ? 'API key not configured' : undefined
    }
  }

  return NextResponse.json({
    providers: status,
    timestamp: new Date().toISOString()
  })
}