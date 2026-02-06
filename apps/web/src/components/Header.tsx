import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">Cookbooks</span>
        </Link>
      </div>
    </header>
  )
}
