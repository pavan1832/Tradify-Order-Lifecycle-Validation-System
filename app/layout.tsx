import type { Metadata } from 'next'
import './globals.css'
import { ReduxProvider } from '@/components/ReduxProvider'

export const metadata: Metadata = {
  title: 'TradeFlow Simulator | Order Lifecycle & Validation',
  description: 'Derivatives order lifecycle and risk validation simulator for quant trading',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  )
}
