import React, { createContext, useContext, useEffect, useState } from 'react'
import { ExtensionState } from '../../types/extension'
import { getExtensionState, updateExtensionState } from '../utils/messaging'

interface ExtensionContextType {
  extensionState: ExtensionState | null
  updateState: (updates: Partial<ExtensionState>) => Promise<void>
  activateExtension: () => Promise<void>
  deactivateExtension: () => Promise<void>
  loading: boolean
  error: string | null
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined)

export const useExtension = () => {
  const context = useContext(ExtensionContext)
  if (context === undefined) {
    throw new Error('useExtension must be used within an ExtensionProvider')
  }
  return context
}

interface ExtensionProviderProps {
  children: React.ReactNode
}

export const ExtensionProvider: React.FC<ExtensionProviderProps> = ({ children }) => {
  const [extensionState, setExtensionState] = useState<ExtensionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load initial extension state
    const loadExtensionState = async () => {
      try {
        const state = await getExtensionState()
        setExtensionState(state || {
          isActive: false,
          selectedElement: null,
          modifications: [],
          chatHistory: []
        })
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load extension state')
        setLoading(false)
      }
    }

    loadExtensionState()
  }, [])

  const updateState = async (updates: Partial<ExtensionState>) => {
    if (!extensionState) return

    try {
      const newState = { ...extensionState, ...updates }
      await updateExtensionState(newState)
      setExtensionState(newState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update extension state')
    }
  }

  const activateExtension = async () => {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Send activation message to content script
      await chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_EXTENSION' })
      
      // Update extension state
      await updateState({ isActive: true })
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate extension')
    }
  }

  const deactivateExtension = async () => {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab.id) {
        // Send deactivation message to content script
        await chrome.tabs.sendMessage(tab.id, { type: 'DEACTIVATE_EXTENSION' })
      }
      
      // Update extension state
      await updateState({ 
        isActive: false, 
        selectedElement: null, 
        modifications: [] 
      })
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate extension')
    }
  }

  const value: ExtensionContextType = {
    extensionState,
    updateState,
    activateExtension,
    deactivateExtension,
    loading,
    error
  }

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  )
}