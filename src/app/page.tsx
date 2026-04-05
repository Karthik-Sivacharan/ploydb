import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { HomeDashboard } from "@/components/home/home-dashboard"
import { NavProvider } from "@/components/nav-context"

export default function Page() {
  return (
    <NavProvider>
      <SidebarProvider className="h-svh !min-h-0">
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <HomeDashboard />
        </SidebarInset>
      </SidebarProvider>
    </NavProvider>
  )
}
