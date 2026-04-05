"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type NavItem = "Overview" | "Ploys" | "Sites" | "Records"

interface NavContextValue {
  activeNav: NavItem
  setActiveNav: (item: NavItem) => void
}

const NavContext = createContext<NavContextValue>({
  activeNav: "Overview",
  setActiveNav: () => {},
})

export function NavProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavItem>("Overview")
  return (
    <NavContext.Provider value={{ activeNav, setActiveNav }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  return useContext(NavContext)
}
