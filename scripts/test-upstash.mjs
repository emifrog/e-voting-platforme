import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Redis } from '@upstash/redis'

function loadEnv(envFile = '.env') {
  const envPath = path.resolve(process.cwd(), envFile)

  if (!fs.existsSync(envPath)) {
    console.warn(`[Upstash test] Aucun fichier ${envFile} trouvé, utilisation des variables d'environnement existantes.`)
    return
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  loadEnv()

  const requiredVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
  const missing = requiredVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`[Upstash test] Variables d'environnement manquantes: ${missing.join(', ')}`)
    process.exit(1)
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const testKey = `upstash:test:${Date.now()}`
  const payload = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  }

  console.log("[Upstash test] ➜ Écriture d'une clé temporaire...")
  await redis.set(testKey, JSON.stringify(payload), { ex: 60 })

  console.log('[Upstash test] ➜ Lecture de la clé...')
  const storedValue = await redis.get<string>(testKey)
  const parsedValue = typeof storedValue === 'string' ? JSON.parse(storedValue) : storedValue

  console.log('[Upstash test] ➜ Suppression de la clé temporaire...')
  await redis.del(testKey)

  console.log('[Upstash test] ✅ Succès! Valeur lue:', parsedValue)
}

main().catch((error) => {
  console.error('[Upstash test] ❌ Échec lors du test Upstash:', error)
  process.exit(1)
})
