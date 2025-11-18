'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface QRCodeInvitationProps {
  electionId: string
  electionTitle: string
}

export function QRCodeInvitation({ electionId, electionTitle }: QRCodeInvitationProps) {
  const [showQR, setShowQR] = useState(false)

  // Generate registration URL
  const registrationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/elections/${electionId}/register`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registrationUrl)
    toast.success('Lien copié!', {
      description: 'Le lien d\'inscription a été copié dans le presse-papier',
    })
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `qr-code-${electionId}.png`
      downloadLink.href = pngFile
      downloadLink.click()

      toast.success('QR Code téléchargé!', {
        description: 'Le QR code a été sauvegardé',
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription via Lien ou QR Code</CardTitle>
        <CardDescription>
          Partagez le lien ou le QR code pour permettre aux électeurs de s'inscrire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registration Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Lien d'inscription</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={registrationUrl}
              readOnly
              className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button onClick={copyToClipboard} variant="outline">
              Copier
            </Button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowQR(!showQR)}
            variant={showQR ? 'default' : 'outline'}
          >
            {showQR ? 'Masquer' : 'Afficher'} le QR Code
          </Button>
          {showQR && (
            <Button onClick={downloadQR} variant="outline">
              Télécharger QR Code
            </Button>
          )}
        </div>

        {/* QR Code Display */}
        {showQR && (
          <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg border">
            <QRCodeSVG
              id="qr-code-svg"
              value={registrationUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
            <p className="text-sm text-center text-muted-foreground">
              Scannez ce QR code pour vous inscrire à:<br />
              <strong>{electionTitle}</strong>
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t">
          <p className="font-medium">Comment ça marche ?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Partagez le lien par email, SMS ou réseaux sociaux</li>
            <li>Affichez le QR code lors d'événements en personne</li>
            <li>Les électeurs s'inscrivent automatiquement en suivant le lien</li>
            <li>Vous recevrez une notification pour chaque inscription</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
