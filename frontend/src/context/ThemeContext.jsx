import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        setTheme(newTheme)
      })
    } else {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
