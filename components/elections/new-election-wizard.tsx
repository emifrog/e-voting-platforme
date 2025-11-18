'use client'

/**
 * Wizard de création d'élection
 * Permet de choisir entre template ou création from scratch
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from './template-selector'
import type { ElectionTemplate } from '@/lib/templates/election-templates'
import { Sparkles, FileEdit } from 'lucide-react'

interface NewElectionWizardProps {
  onTemplateSelect: (template: ElectionTemplate) => void
  onFromScratch: () => void
}

export function NewElectionWizard({ onTemplateSelect, onFromScratch }: NewElectionWizardProps) {
  const [step, setStep] = useState<'choice' | 'template'>('choice')

  if (step === 'template') {
    return (
      <TemplateSelector
        onSelect={onTemplateSelect}
        onCancel={() => setStep('choice')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Créer une élection</h1>
        <p className="text-muted-foreground mt-2">
          Comment souhaitez-vous commencer ?
        </p>
      </div>

      {/* Choice cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Template option */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2"
          onClick={() => setStep('template')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Utiliser un template</CardTitle>
            <CardDescription className="text-base mt-2">
              Créez rapidement une élection à partir de modèles prédéfinis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Configuration automatique</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Candidats prédefinis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Quorums standards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Gain de temps</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setStep('template')}>
              Choisir un template
            </Button>
          </CardContent>
        </Card>

        {/* From scratch option */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2"
          onClick={onFromScratch}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
              <FileEdit className="w-10 h-10 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl">Créer de zéro</CardTitle>
            <CardDescription className="text-base mt-2">
              Configurez entièrement votre élection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Contrôle total</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Options avancées</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Configuration personnalisée</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Flexibilité maximale</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={onFromScratch}>
              Créer de zéro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Popular templates preview */}
      <div className="max-w-4xl mx-auto pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4">Templates populaires</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setStep('template')}>
            <div className="text-3xl mb-1">📊</div>
            <div className="text-sm font-medium">Sondage Simple</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setStep('template')}>
            <div className="text-3xl mb-1">🏛️</div>
            <div className="text-sm font-medium">Élection AGO</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setStep('template')}>
            <div className="text-3xl mb-1">👔</div>
            <div className="text-sm font-medium">Conseil Admin</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setStep('template')}>
            <div className="text-3xl mb-1">🎓</div>
            <div className="text-sm font-medium">Délégué Classe</div>
          </div>
        </div>
      </div>
    </div>
  )
}
