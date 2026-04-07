"use client";

import { ChevronDown, Folder, Table2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight">ploy</span>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Folder className="h-3.5 w-3.5" />
                All Tables
                <ChevronDown className="h-3 w-3" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="flex items-center gap-1.5 text-sm text-foreground">
                <Table2 className="h-3.5 w-3.5" />
                Sales Pipeline
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <div className="flex items-center gap-2 pl-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              SC
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex sm:flex-col">
            <span className="text-xs font-medium leading-none">Sofia Carter</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">Stackline</span>
          </div>
        </div>
      </div>
    </header>
  );
}
