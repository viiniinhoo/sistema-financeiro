import { createContext, useContext, useEffect, useState } from 'react'

type UIContextType = {
  showValues: boolean
  toggleShowValues: () => void
  isBottomNavVisible: boolean
  setBottomNavVisible: (visible: boolean) => void
}

const UIContext = createContext<UIContextType>({
  showValues: false,
  toggleShowValues: () => {},
  isBottomNavVisible: true,
  setBottomNavVisible: () => {},
})

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isBottomNavVisible, setBottomNavVisible] = useState(true)
  const [showValues, setShowValues] = useState<boolean>(() => {
    const saved = localStorage.getItem('ui_show_values')
    return saved !== null ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('ui_show_values', JSON.stringify(showValues))
  }, [showValues])

  const toggleShowValues = () => setShowValues(prev => !prev)

  return (
    <UIContext.Provider value={{ showValues, toggleShowValues, isBottomNavVisible, setBottomNavVisible }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
