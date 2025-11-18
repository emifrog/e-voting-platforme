/**
 * Lazy loading des composants lourds pour optimiser les performances
 */

import dynamic from 'next/dynamic'

// Composants de graphiques (recharts est lourd)
export const ResultsChart = dynamic(
  () => import('@/components/results/results-chart').then(mod => ({ default: mod.ResultsChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
)

export const ResultsPieChart = dynamic(
  () => import('@/components/results/results-pie-chart').then(mod => ({ default: mod.ResultsPieChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
)

// Export buttons (PDF/CSV/Excel sont lourds)
export const ExportButtons = dynamic(
  () => import('@/components/results/export-buttons').then(mod => ({ default: mod.ExportButtons })),
  {
    loading: () => (
      <div className="flex gap-3">
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>
      </div>
    ),
  }
)

// Statistiques avancées
export const AdvancedStatistics = dynamic(
  () => import('@/components/results/advanced-statistics').then(mod => ({ default: mod.AdvancedStatistics })),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    ),
  }
)

// Badge temps réel
export const RealtimeBadge = dynamic(
  () => import('@/components/realtime/realtime-badge').then(mod => ({ default: mod.RealtimeBadge })),
  {
    loading: () => (
      <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-full"></div>
    ),
  }
)
