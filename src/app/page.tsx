'use client'

import { useState, useEffect } from 'react'
import { Search, Zap, Globe, Cpu, Wifi, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface SearchResult {
  url: string
  name: string
  snippet: string
  host_name: string
  rank: number
  date: string
  favicon: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 200)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setResults([])
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await response.json()
      setResults(data.results || [])
      
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 overflow-hidden relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-move 10s linear infinite'
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className={`inline-block mb-6 ${isGlitching ? 'animate-pulse' : ''}`}>
            <img
              src="/cybersearch-logo.png"
              alt="CyberSearch Logo"
              className="w-32 h-32 md:w-40 md:h-40 mx-auto object-contain filter drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}>
            CYBER<span className="text-pink-500">SEARCH</span>
          </h1>
          <p className="text-cyan-300 text-lg md:text-xl mb-2">NEURAL INTERFACE ACTIVATED</p>
          <div className="flex justify-center gap-4 text-sm mb-6">
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              <Cpu className="w-3 h-3 mr-1" /> ONLINE
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-400">
              <Wifi className="w-3 h-3 mr-1" /> CONNECTED
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              <Globe className="w-3 h-3 mr-1" /> GLOBAL
            </Badge>
          </div>
          
          {/* Chat Navigation Button */}
          <div className="flex justify-center">
            <Link href="/chat">
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                CHAT WITH AI
              </Button>
            </Link>
          </div>
        </header>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex gap-2">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ENTER SEARCH QUERY..."
                className="flex-1 bg-black/80 border-cyan-500 text-cyan-400 placeholder-cyan-600 text-lg px-6 py-4 rounded-lg focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    SCANNING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    SEARCH
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Search History */}
        {searchHistory.length > 0 && !results.length && (
          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-cyan-600 text-sm mb-2">RECENT QUERIES:</p>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 bg-purple-900/30 border border-purple-500/50 rounded-full text-cyan-300 text-sm hover:bg-purple-800/50 transition-colors duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-cyan-400">SEARCH RESULTS</h2>
              <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                {results.length} RESULTS FOUND
              </Badge>
            </div>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card 
                  key={index} 
                  className="bg-black/60 border-cyan-500/30 hover:border-pink-500/60 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                            #{result.rank}
                          </Badge>
                          <span className="text-cyan-600 text-sm">{result.host_name}</span>
                        </div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2 hover:text-pink-400 transition-colors duration-200">
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            {result.name}
                          </a>
                        </h3>
                        <p className="text-cyan-600 mb-2 line-clamp-2">{result.snippet}</p>
                        <div className="flex items-center gap-4 text-xs text-cyan-700">
                          <span>{result.url}</span>
                          <span>•</span>
                          <span>{result.date}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="bg-black/60 border-cyan-500/30">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 bg-cyan-900/30 mb-2" />
                    <Skeleton className="h-4 w-full bg-cyan-900/20 mb-1" />
                    <Skeleton className="h-4 w-2/3 bg-cyan-900/20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results.length && !isLoading && (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-black/60 border border-cyan-500/30 rounded-lg">
              <Search className="w-16 h-16 mx-auto mb-4 text-cyan-600" />
              <p className="text-cyan-600 text-lg">INITIATE SEARCH TO ACCESS THE NET</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}