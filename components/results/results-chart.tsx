'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface ChartCandidate {
  candidate: {
    id: string
    name: string
  }
  vote_count: number
  percentage: number
  is_winner: boolean
}

interface ResultsChartProps {
  candidates: ChartCandidate[]
}

export function ResultsChart({ candidates }: ResultsChartProps) {
  const data = candidates.map((result) => ({
    name: result.candidate.name.length > 20
      ? result.candidate.name.substring(0, 20) + '...'
      : result.candidate.name,
    votes: result.vote_count,
    percentage: result.percentage,
    isWinner: result.is_winner,
  }))

  const COLORS = {
    winner: '#22c55e', // green
    regular: '#3b82f6', // blue
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === 'votes') return [value, 'Votes']
              return [value, name]
            }}
          />
          <Legend />
          <Bar dataKey="votes" name="Nombre de votes" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isWinner ? COLORS.winner : COLORS.regular}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
