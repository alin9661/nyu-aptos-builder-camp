"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  user: {
    name: "Wallet User",
    email: "Connect wallet to view",
    avatar: "/avatars/default.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Treasury",
      url: "/treasury",
      icon: IconDatabase,
    },
    {
      title: "Governance",
      url: "/governance",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
  ],
  navClouds: [
    {
      title: "Proposals",
      icon: IconFileDescription,
      isActive: true,
      url: "/governance",
      items: [
        {
          title: "Active Proposals",
          url: "/governance?tab=proposals",
        },
        {
          title: "Create Proposal",
          url: "/governance/create",
        },
      ],
    },
    {
      title: "Elections",
      icon: IconUsers,
      url: "/governance",
      items: [
        {
          title: "Active Elections",
          url: "/governance?tab=elections",
        },
        {
          title: "Past Elections",
          url: "/governance?tab=past",
        },
      ],
    },
    {
      title: "Reimbursements",
      icon: IconReport,
      url: "/treasury",
      items: [
        {
          title: "Submit Request",
          url: "/treasury?tab=submit",
        },
        {
          title: "Pending Approvals",
          url: "/treasury?tab=pending",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Documentation",
      url: "#",
      icon: IconHelp,
    },
  ],
  documents: [
    {
      name: "Blockchain Explorer",
      url: "https://explorer.aptoslabs.com",
      icon: IconSearch,
    },
    {
      name: "Contract Address",
      url: "#",
      icon: IconFileAi,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Nexus</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
