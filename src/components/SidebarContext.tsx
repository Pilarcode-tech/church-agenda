'use client'

import { createContext, useContext } from 'react'

type SidebarContextValue = {
  toggle: () => void
  isOpen: boolean
} | null

const SidebarContext = createContext<SidebarContextValue>(null)

export const SidebarProvider = SidebarContext.Provider

export function useSidebar() {
  return useContext(SidebarContext)
}
