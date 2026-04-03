"use client"

import * as React from "react"
import {
  Bot,
  Database,
  Globe,
  Hexagon,
  House,
  Moon,
  Plug,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Karthik",
    email: "karthik@ploy.app",
    avatar: "",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: House,
      isActive: true,
      items: [],
    },
    {
      title: "Agents",
      url: "#",
      icon: Bot,
      items: [
        { title: "Web Designer", url: "#" },
        { title: "Data Studio", url: "#" },
      ],
    },
    {
      title: "Connected Apps",
      url: "#",
      icon: Plug,
      items: [],
    },
  ],
  ploybooks: [
    {
      name: "Web Design Audit",
      url: "#",
      icon: Globe,
    },
    {
      name: "Client Health Assessment",
      url: "#",
      icon: Database,
    },
    {
      name: "Lead Prioritization",
      url: "#",
      icon: Database,
    },
    {
      name: "Deal Pipeline Review",
      url: "#",
      icon: Database,
    },
  ],
}

function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={mounted ? (isDark ? "Light mode" : "Dark mode") : "Toggle theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted ? (isDark ? <Sun /> : <Moon />) : <Sun />}
          <span>{mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Hexagon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ploy</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.ploybooks} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarThemeToggle />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
