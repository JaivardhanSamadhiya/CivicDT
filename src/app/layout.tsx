import type { Metadata } from "next";
import { WorkspaceProvider } from "@/lib/workspace";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata:Metadata={title:"CivicDT | Evidence-aware urban planning",description:"Compare infrastructure scenarios with transparent costs, editable assumptions, and traceable decision briefs."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><WorkspaceProvider><Shell>{children}</Shell></WorkspaceProvider></body></html>;}
