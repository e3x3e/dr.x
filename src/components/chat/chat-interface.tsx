'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Bot, User, Settings, X, Zap, Brain, Sparkles, Download, ExternalLink, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
  tool_used?: string
  tool_result?: any
}

interface AIProvider {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

const aiProviders: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-green-400'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-blue-400'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-purple-400'
  },
  {
    id: 'github',
    name: 'GitHub Models',
    icon: <Bot className="w-4 h-4" />,
    color: 'text-orange-400'
  }
]

// Tool Result Component
function ToolResult({ tool_used, tool_result }: { tool_used?: string; tool_result?: any }) {
  if (!tool_used || !tool_result) return null

  const renderCloneWebsiteResult = () => {
    if (tool_used !== 'clone_website') return null

    return (
      <div className="mt-3 p-3 bg-black/40 border border-cyan-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium">Website Clone Result</span>
          {tool_result.success ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-cyan-600">URL:</span>
            <a 
              href={tool_result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {tool_result.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex justify-between">
            <span className="text-cyan-600">Format:</span>
            <span className="text-cyan-400">{tool_result.output_format}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-cyan-600">Assets:</span>
            <span className="text-cyan-400">{tool_result.include_external_assets ? 'Included' : 'Excluded'}</span>
          </div>
          
          {tool_result.success && tool_result.result && (
            <div className="mt-2 p-2 bg-cyan-900/20 rounded border border-cyan-500/20">
              <p className="text-cyan-600 mb-1">Result:</p>
              <pre className="text-cyan-400 text-xs overflow-x-auto whitespace-pre-wrap">
                {typeof tool_result.result === 'string' 
                  ? tool_result.result.substring(0, 200) + (tool_result.result.length > 200 ? '...' : '')
                  : JSON.stringify(tool_result.result, null, 2).substring(0, 200) + '...'
                }
              </pre>
            </div>
          )}
          
          {!tool_result.success && tool_result.error && (
            <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-500/20">
              <p className="text-red-400">Error: {tool_result.error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {tool_used === 'clone_website' && renderCloneWebsiteResult()}
      {/* Add more tool result renderers here as needed */}
    </div>
  )
}

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          provider: selectedProvider,
          history: messages.slice(-10) // Send last 10 messages for context
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          provider: selectedProvider,
          tool_used: data.tool_used,
          tool_result: data.tool_result
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
        provider: selectedProvider
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const currentProvider = aiProviders.find(p => p.id === selectedProvider)

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-black/95 border border-cyan-500/50 rounded-lg shadow-2xl z-50 flex flex-col"
         style={{ boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)' }}>
      
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-cyan-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-cyan-400 text-lg">CYBER CHAT</CardTitle>
            <Badge variant="outline" className={`border-current ${currentProvider?.color}`}>
              {currentProvider?.icon}
              <span className="ml-1 text-xs">{currentProvider?.name}</span>
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-cyan-400 hover:text-cyan-300 h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-cyan-400 hover:text-cyan-300 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Provider Selection */}
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="bg-black/50 border-cyan-500/30 text-cyan-400 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/95 border-cyan-500/30">
            {aiProviders.map(provider => (
              <SelectItem 
                key={provider.id} 
                value={provider.id}
                className="text-cyan-400 hover:bg-cyan-900/30"
              >
                <div className="flex items-center gap-2">
                  {provider.icon}
                  <span>{provider.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[440px] p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-cyan-600">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">مرحباً! أنا مساعدك السيبراني</p>
              <p className="text-xs mt-1">كيف يمكنني مساعدتك اليوم؟</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0`}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' 
                        : 'bg-black/60 border border-cyan-500/30 text-cyan-300'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <ToolResult tool_used={message.tool_used} tool_result={message.tool_result} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-cyan-700">
                        {message.timestamp.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.provider && (
                        <Badge variant="outline" className="text-xs border-current opacity-60">
                          {aiProviders.find(p => p.id === message.provider)?.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-black/60 border border-cyan-500/30 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="p-4 border-t border-cyan-500/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-black/50 border-cyan-500/30 text-cyan-400 placeholder-cyan-600 focus:border-pink-500 focus:ring-pink-500/20"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}