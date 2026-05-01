import { createContext, useContext, useEffect, useState } from 'react'

type UIContextType = {
  showValues: boolean
  toggleShowValues: () => void
}

const UIContext = createContext<UIContextType>({
  showValues: false,
  toggleShowValues: () => {},
})

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [showValues, setShowValues] = useState<boolean>(() => {
    const saved = localStorage.getItem('ui_show_values')
    return saved !== null ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('ui_show_values', JSON.stringify(showValues))
  }, [showValues])

  const toggleShowValues = () => setShowValues(prev => !prev)

  return (
    <UIContext.Provider value={{ showValues, toggleShowValues }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
