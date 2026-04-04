"use client"

import * as React from "react"
import {
  Bell,
  BookOpen,
  FileText,
  Globe,
  House,
  Image,
  Moon,
  Palette,
  Rows3,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { NavMain } from "@/components/nav-main"
import { NavResources } from "@/components/nav-resources"
import { NavUser } from "@/components/nav-user"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { Separator } from "@/components/ui/separator"
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
  workspaces: [
    { name: "My Workspace", plan: "Pro" },
  ],
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: House,
      isActive: true,
    },
    {
      title: "Ploys",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Sites",
      url: "#",
      icon: Globe,
    },
    {
      title: "Records",
      url: "#",
      icon: Rows3,
    },
  ],
  resources: [
    {
      name: "Design System",
      url: "#",
      icon: Palette,
    },
    {
      name: "Assets",
      url: "#",
      icon: Image,
    },
    {
      name: "Documents",
      url: "#",
      icon: FileText,
    },
    {
      name: "Ploybooks",
      url: "#",
      icon: BookOpen,
    },
  ],
}

function SidebarNotifications() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Notifications">
          <Bell />
          <span>Notifications</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
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

function SidebarSettings() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Settings">
          <Settings />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={data.workspaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavResources resources={data.resources} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotifications />
        <SidebarThemeToggle />
        <SidebarSettings />
        <Separator className="mx-2 w-auto" />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
