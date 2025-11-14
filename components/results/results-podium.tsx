'use client'

interface PodiumCandidate {
  candidate: {
    id: string
    name: string
    description: string | null
  }
  vote_count: number
  percentage: number
  is_winner: boolean
}

interface ResultsPodiumProps {
  candidates: PodiumCandidate[]
}

export function ResultsPodium({ candidates }: ResultsPodiumProps) {
  if (candidates.length === 0) {
    return null
  }

  // Arrange podium: 2nd, 1st, 3rd
  const [first, second, third] = candidates
  const podiumOrder = [second, first, third].filter(Boolean)

  const getHeight = (index: number) => {
    if (index === 1) return 'h-48' // First place (center)
    if (index === 0) return 'h-40' // Second place (left)
    return 'h-32' // Third place (right)
  }

  const getColor = (index: number) => {
    if (index === 1) return 'bg-yellow-400' // Gold
    if (index === 0) return 'bg-gray-300' // Silver
    return 'bg-orange-300' // Bronze
  }

  const getMedal = (index: number) => {
    if (index === 1) return '🥇'
    if (index === 0) return '🥈'
    return '🥉'
  }

  return (
    <div className="bg-white rounded-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-8">🏆 Podium</h2>

      <div className="flex items-end justify-center gap-4 max-w-3xl mx-auto">
        {podiumOrder.map((candidate, displayIndex) => {
          if (!candidate) return null

          const actualIndex = displayIndex === 0 ? 1 : displayIndex === 1 ? 0 : 2
          const height = getHeight(displayIndex)
          const color = getColor(displayIndex)
          const medal = getMedal(displayIndex)

          return (
            <div key={candidate.candidate.id} className="flex-1 text-center">
              <div className="mb-4">
                <div className="text-4xl mb-2">{medal}</div>
                <div className="font-bold text-lg line-clamp-2 mb-1">
                  {candidate.candidate.name}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {candidate.vote_count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {candidate.percentage.toFixed(1)}%
                </div>
              </div>

              <div
                className={`${height} ${color} rounded-t-lg flex items-center justify-center font-bold text-white text-3xl transition-all`}
              >
                {actualIndex + 1}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
