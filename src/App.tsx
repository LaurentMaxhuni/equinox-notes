import { useEffect, useState } from 'react'
import './App.css'
import Notes from './components/Notes'
import Weather from './components/Weather'
import FallingLeaves from './components/FallingLeaves'

type Theme = 'warm' | 'chilly' | 'neutral'

export default function App() {
  const [theme, setTheme] = useState<Theme>('neutral')
  const [isDay, setIsDay] = useState(true)

  useEffect(() => {
    const h = new Date().getHours()
    setIsDay(h >= 6 && h < 20)
  }, [])

  function handleMood(s: { mood: Theme; isDay: boolean }) {
    setTheme(s.mood || 'neutral')
    setIsDay(s.isDay ?? true)
  }

  const bgClass = theme === 'warm' ? 'bg-gradient-warm' : theme === 'chilly' ? 'bg-gradient-chilly' : 'bg-gradient-neutral'

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} transition-colors duration-700`}>
      <FallingLeaves />
      <header className="flex items-center justify-between p-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-extrabold text-slate-900">Equinox Notes</h1>
        <Weather onMood={handleMood} />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Notes />
      </main>

      <footer className="p-4 text-center text-sm text-slate-800/70">Made with cozy vibes — Sept leaves & notes.</footer>
    </div>
  )
}

