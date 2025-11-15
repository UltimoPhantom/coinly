import './globals.css'

export const metadata = {
  title: 'Expense Tracker',
  description: 'Track expenses with friends',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}