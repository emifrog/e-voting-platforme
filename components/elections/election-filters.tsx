'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useTransition } from 'react'

interface ElectionFiltersProps {
  initialSearch?: string
  initialStatus?: string
  initialVoteType?: string
}

export function ElectionFilters({ initialSearch, initialStatus, initialVoteType }: ElectionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch || '')
  const [status, setStatus] = useState(initialStatus || 'all')
  const [voteType, setVoteType] = useState(initialVoteType || 'all')

  const updateFilters = (newSearch: string, newStatus: string, newVoteType: string) => {
    const params = new URLSearchParams(searchParams)

    if (newSearch) {
      params.set('search', newSearch)
    } else {
      params.delete('search')
    }

    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }

    if (newVoteType && newVoteType !== 'all') {
      params.set('voteType', newVoteType)
    } else {
      params.delete('voteType')
    }

    startTransition(() => {
      router.push(`/elections?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateFilters(value, status, voteType)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateFilters(search, value, voteType)
  }

  const handleVoteTypeChange = (value: string) => {
    setVoteType(value)
    updateFilters(search, status, value)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setVoteType('all')
    router.push('/elections')
  }

  const hasActiveFilters = search || (status && status !== 'all') || (voteType && voteType !== 'all')

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher</Label>
            <Input
              id="search"
              placeholder="Titre ou description..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={isPending ? 'opacity-50' : ''}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">📝 Brouillon</option>
              <option value="scheduled">📅 Planifié</option>
              <option value="active">✅ En cours</option>
              <option value="closed">🔒 Terminé</option>
              <option value="archived">📦 Archivé</option>
            </select>
          </div>

          {/* Vote Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="voteType">Type de vote</Label>
            <select
              id="voteType"
              value={voteType}
              onChange={(e) => handleVoteTypeChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">Tous les types</option>
              <option value="simple">Vote simple</option>
              <option value="approval">Vote par approbation</option>
              <option value="ranked">Vote par classement</option>
              <option value="list">Vote de liste</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
