'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { initiate2FA, enable2FA, disable2FA, regenerateBackupCodes } from '@/lib/actions/two-factor'
import Image from 'next/image'

interface TwoFactorSetupProps {
  userEmail: string
  isEnabled: boolean
}

export function TwoFactorSetup({ userEmail, isEnabled }: TwoFactorSetupProps) {
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInitiate2FA = async () => {
    setIsLoading(true)
    setError(null)

    const result = await initiate2FA()

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setQrCode(result.qrCode!)
    setSecret(result.secret!)
    setBackupCodes(result.backupCodes!)
    setStep('qr')
    setIsSetupDialogOpen(true)
    setIsLoading(false)
  }

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await enable2FA(verificationCode)

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setStep('backup')
    setIsLoading(false)
  }

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await disable2FA(verificationCode)

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setIsDisableDialogOpen(false)
    setVerificationCode('')
    setIsLoading(false)
    window.location.reload()
  }

  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true)
    setError(null)

    const result = await regenerateBackupCodes()

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setBackupCodes(result.backupCodes!)
    setIsLoading(false)
  }

  const handleFinishSetup = () => {
    setIsSetupDialogOpen(false)
    setStep('qr')
    setVerificationCode('')
    setQrCode(null)
    setSecret(null)
    setBackupCodes([])
    window.location.reload()
  }

  const downloadBackupCodes = () => {
    const content = `E-Voting Platform - Codes de secours 2FA
Généré le: ${new Date().toLocaleString('fr-FR')}
Email: ${userEmail}

GARDEZ CES CODES EN SÉCURITÉ !
Chaque code ne peut être utilisé qu'une seule fois.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

⚠️ Ne partagez jamais ces codes avec qui que ce soit.
⚠️ Stockez-les dans un endroit sûr, comme un gestionnaire de mots de passe.
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {!isEnabled ? (
        <>
          <p className="text-sm text-muted-foreground">
            L'authentification à deux facteurs (2FA) ajoute une couche de sécurité
            supplémentaire en exigeant un code temporaire en plus de votre mot de passe.
          </p>
          <Button onClick={handleInitiate2FA} disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Activer le 2FA'}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            ✓ Le 2FA est activé sur votre compte. Vous devrez entrer un code de votre
            application d'authentification à chaque connexion.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsRegenerateDialogOpen(true)}
            >
              Régénérer les codes de secours
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDisableDialogOpen(true)}
            >
              Désactiver le 2FA
            </Button>
          </div>
        </>
      )}

      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 'qr' && 'Scanner le QR Code'}
              {step === 'verify' && 'Vérifier le code'}
              {step === 'backup' && 'Codes de secours'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' &&
                'Utilisez une application d\'authentification (Google Authenticator, Authy, etc.)'}
              {step === 'verify' &&
                'Entrez le code à 6 chiffres de votre application'}
              {step === 'backup' &&
                'Sauvegardez ces codes dans un endroit sûr'}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && qrCode && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Image
                  src={qrCode}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="border rounded-lg"
                />
              </div>

              <div>
                <Label>Ou entrez ce code manuellement</Label>
                <Input
                  value={secret || ''}
                  readOnly
                  className="font-mono text-sm mt-2"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}

              <Button onClick={() => setStep('verify')} className="w-full">
                Suivant
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                  }
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('qr')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Vérification...' : 'Vérifier'}
                </Button>
              </div>
            </div>
          )}

          {step === 'backup' && backupCodes.length > 0 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Importante : Sauvegardez ces codes maintenant !
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Vous ne pourrez plus les voir après avoir fermé cette fenêtre.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span className="font-medium">{code}</span>
                  </div>
                ))}
              </div>

              <Button onClick={downloadBackupCodes} variant="outline" className="w-full">
                📥 Télécharger les codes
              </Button>

              <Button onClick={handleFinishSetup} className="w-full">
                J'ai sauvegardé les codes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver le 2FA</DialogTitle>
            <DialogDescription>
              Entrez un code de vérification pour désactiver le 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-code">Code de vérification</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ''))
                }
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}

            <Button
              onClick={handleDisable2FA}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? 'Désactivation...' : 'Désactiver le 2FA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Régénérer les codes de secours</DialogTitle>
            <DialogDescription>
              Les anciens codes seront invalidés
            </DialogDescription>
          </DialogHeader>

          {backupCodes.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cela générera 10 nouveaux codes de secours. Les anciens codes ne
                fonctionneront plus.
              </p>

              <Button onClick={handleRegenerateBackupCodes} disabled={isLoading} className="w-full">
                {isLoading ? 'Génération...' : 'Générer de nouveaux codes'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Nouveaux codes générés !
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span className="font-medium">{code}</span>
                  </div>
                ))}
              </div>

              <Button onClick={downloadBackupCodes} variant="outline" className="w-full">
                📥 Télécharger les codes
              </Button>

              <Button
                onClick={() => {
                  setBackupCodes([])
                  setIsRegenerateDialogOpen(false)
                }}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
