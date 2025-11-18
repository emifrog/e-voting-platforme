'use client'

/**
 * Sélecteur de templates d'élections
 * Permet de créer une élection à partir d'un template prédéfini
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  electionTemplates,
  templateCategories,
  type ElectionTemplate,
} from '@/lib/templates/election-templates'
import { Check } from 'lucide-react'

interface TemplateSelectorProps {
  onSelect: (template: ElectionTemplate) => void
  onCancel?: () => void
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const filteredTemplates =
    selectedCategory === 'all'
      ? electionTemplates
      : electionTemplates.filter((t) => t.category === selectedCategory)

  const handleSelectTemplate = () => {
    const template = electionTemplates.find((t) => t.id === selectedTemplate)
    if (template) {
      onSelect(template)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Choisir un template</h2>
        <p className="text-muted-foreground mt-1">
          Créez rapidement une élection à partir d'un modèle prédéfini
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          📑 Tous
        </Button>
        {templateCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            size="sm"
          >
            {category.icon} {category.label}
          </Button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{template.icon}</div>
                  {isSelected && (
                    <div className="rounded-full bg-primary p-1">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Template specs */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {template.config.vote_type === 'simple'
                      ? 'Vote simple'
                      : template.config.vote_type === 'approval'
                      ? 'Approbation'
                      : 'Classement'}
                  </Badge>
                  {template.config.is_secret && (
                    <Badge variant="secondary" className="text-xs">
                      🔒 Secret
                    </Badge>
                  )}
                  {template.config.quorum_type !== 'none' && (
                    <Badge variant="secondary" className="text-xs">
                      Quorum {template.config.quorum_value}%
                    </Badge>
                  )}
                </div>

                {/* Candidates preview */}
                {template.candidates && template.candidates.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {template.candidates.length} option(s) prédéfinie(s)
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button
          onClick={handleSelectTemplate}
          disabled={!selectedTemplate}
          className="min-w-32"
        >
          {selectedTemplate ? 'Utiliser ce template' : 'Sélectionner un template'}
        </Button>
      </div>
    </div>
  )
}
