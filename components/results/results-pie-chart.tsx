'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface PieChartCandidate {
  candidate: {
    id: string
    name: string
  }
  vote_count: number
  percentage: number
  is_winner: boolean
}

interface ResultsPieChartProps {
  candidates: PieChartCandidate[]
}

const COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
]

export function ResultsPieChart({ candidates }: ResultsPieChartProps) {
  const data = candidates.map((result) => ({
    name: result.candidate.name.length > 20
      ? result.candidate.name.substring(0, 20) + '...'
      : result.candidate.name,
    fullName: result.candidate.name,
    value: result.vote_count,
    percentage: result.percentage,
    isWinner: result.is_winner,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {payload[0].payload.fullName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Votes : <span className="font-medium">{payload[0].value}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pourcentage : <span className="font-medium">{payload[0].payload.percentage.toFixed(1)}%</span>
          </p>
          {payload[0].payload.isWinner && (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
              🏆 Vainqueur
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`
  }

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderLabel}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={entry.isWinner ? '#22c55e' : undefined}
                strokeWidth={entry.isWinner ? 3 : 0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {entry.payload.fullName} {entry.payload.isWinner ? '🏆' : ''}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
