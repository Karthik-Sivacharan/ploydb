import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { HomeDashboard } from "@/components/home/home-dashboard"

export default function Page() {
  return (
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <HomeDashboard />
      </SidebarInset>
    </SidebarProvider>
  )
}
