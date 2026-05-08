import { createContext, useContext, useEffect, useState } from 'react'

type UIContextType = {
  showValues: boolean
  toggleShowValues: () => void
  isBottomNavVisible: boolean
  setBottomNavVisible: (visible: boolean) => void
  isAddOpen: boolean
  setIsAddOpen: (open: boolean) => void
  addType: 'income' | 'expense' | 'investment'
  setAddType: (type: 'income' | 'expense' | 'investment') => void
}

const UIContext = createContext<UIContextType>({
  showValues: false,
  toggleShowValues: () => {},
  isBottomNavVisible: true,
  setBottomNavVisible: () => {},
  isAddOpen: false,
  setIsAddOpen: () => {},
  addType: 'expense',
  setAddType: () => {},
})

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isBottomNavVisible, setBottomNavVisible] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addType, setAddType] = useState<'income' | 'expense' | 'investment'>('expense')
  const [showValues, setShowValues] = useState<boolean>(() => {
    const saved = localStorage.getItem('ui_show_values')
    return saved !== null ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('ui_show_values', JSON.stringify(showValues))
  }, [showValues])

  const toggleShowValues = () => setShowValues(prev => !prev)

  return (
    <UIContext.Provider value={{ 
      showValues, 
      toggleShowValues, 
      isBottomNavVisible, 
      setBottomNavVisible,
      isAddOpen,
      setIsAddOpen,
      addType,
      setAddType
    }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
