/**
 * Skip Link Component
 * Permet aux utilisateurs clavier d'accéder directement au contenu principal
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */

import Link from 'next/link'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({ href = '#main-content', children = 'Aller au contenu principal' }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className="skip-link absolute -top-16 left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:top-4 transition-all duration-200"
    >
      {children}
    </Link>
  )
}

export function SkipLinks() {
  return (
    <>
      <SkipLink href="#main-content">Aller au contenu principal</SkipLink>
      <SkipLink href="#main-navigation">Aller à la navigation</SkipLink>
    </>
  )
}
