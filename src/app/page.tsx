import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { HomeDashboard } from "@/components/home/home-dashboard"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HomeDashboard />
      </SidebarInset>
    </SidebarProvider>
  )
}
