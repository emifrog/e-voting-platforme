# 🔐 Guide de Sécurité Avancée

**Version**: 1.0.0

**Date**: 14 Novembre 2025

---

## 🎯 Vue d'ensemble

Ce document détaille toutes les mesures de sécurité à implémenter pour protéger la plateforme de vote électronique.

---

## 🔒 Chiffrement

### AES-256 pour votes secrets

**Implementation**

```tsx
// lib/services/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';  // GCM mode for authenticated encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;  // Must be 32 bytes

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encryptVote(
  voteData: any,
  electionId: string
): EncryptedData {
  // Derive election-specific key using HKDF
  const salt = Buffer.from(electionId, 'utf8');
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    100000,  // iterations
    32,      // key length
    'sha256'
  );
  
  // Generate random IV (never reuse!)
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt
  const plaintext = JSON.stringify(voteData);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += [cipher.final](http://cipher.final)('hex');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptVote(
  encryptedData: string,
  iv: string,
  authTag: string,
  electionId: string
): any {
  // Derive same key
  const salt = Buffer.from(electionId, 'utf8');
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    100000,
    32,
    'sha256'
  );
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  
  // Set auth tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += [decipher.final](http://decipher.final)('utf8');
  
  return JSON.parse(decrypted);
}
```

**Bonnes pratiques**

- ✅ Utiliser AES-256-GCM (authenticated encryption)
- ✅ Générer IV aléatoire pour chaque vote
- ✅ Utiliser PBKDF2 pour dériver clés spécifiques
- ✅ Stocker authTag pour vérifier intégrité
- ❌ Ne JAMAIS réutiliser un IV
- ❌ Ne JAMAIS stocker la clé en base de données

### Hash pour vérification

```tsx
export function generateVoteHash(voteData: any): string {
  const content = JSON.stringify({
    ...voteData,
    timestamp: [Date.now](http://Date.now)(),
    nonce: crypto.randomBytes(16).toString('hex'),
  });
  
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

export function verifyVoteHash(
  voteData: any,
  hash: string
): boolean {
  const computed = generateVoteHash(voteData);
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(hash)
  );
}
```

---

## 🛡️ Protection contre les attaques

### 1. SQL Injection

**✅ Parameterized queries (Supabase fait ça automatiquement)**

```tsx
// ✅ SAFE - Parameterized
await supabase
  .from('elections')
  .select('*')
  .eq('id', userInput);  // Safe

// ❌ DANGER - Never do this
await supabase.rpc('unsafe_query', {
  query: `SELECT * FROM elections WHERE id = '${userInput}'`  // DANGEROUS!
});
```

### 2. XSS (Cross-Site Scripting)

**React échappe automatiquement, mais attention aux cas spéciaux**

```tsx
import DOMPurify from 'isomorphic-dompurify';

// Pour descriptions riches
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  });
}

// Usage
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(election.description) 
}} />
```

### 3. CSRF (Cross-Site Request Forgery)

**Next.js protège automatiquement, mais vérifier l'origine**

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verify origin for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (!origin) {
      return NextResponse.json(
        { error: 'Missing origin header' },
        { status: 403 }
      );
    }
    
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }
  }
  
  return [NextResponse.next](http://NextResponse.next)();
}
```

### 4. Clickjacking

**Headers de sécurité**

```tsx
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' [https://*.supabase.co](https://*.supabase.co) wss://*.[supabase.co](http://supabase.co)",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

### 5. Rate Limiting détaillé

```tsx
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different limiters for different endpoints
const limiters = {
  // Very strict for auth
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  // Moderate for voting
  vote: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
    prefix: 'ratelimit:vote',
  }),
  
  // Generous for API
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  
  // Very strict for password reset
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:password-reset',
  }),
};

export async function rateLimit(
  request: NextRequest,
  type: keyof typeof limiters = 'api'
): Promise<NextResponse | null> {
  const limiter = limiters[type];
  
  // Use IP + user-agent as identifier
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const identifier = `${ip}:${userAgent.slice(0, 50)}`;
  
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', reset.toString());
  
  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((reset - [Date.now](http://Date.now)()) / 1000),
      },
      { status: 429, headers }
    );
  }
  
  return null;
}

// Usage in API route
export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await rateLimit(request, 'auth');
  if (rateLimitResponse) return rateLimitResponse;
  
  // Continue with request...
}
```

### 6. Protection double vote

```sql
-- Database constraint
CONSTRAINT unique_vote_per_voter UNIQUE(election_id, voter_id)

-- + Transaction atomique
BEGIN;
  -- Check if already voted
  SELECT has_voted FROM voters WHERE id = voter_id FOR UPDATE;
  
  -- If not voted, insert vote
  INSERT INTO votes (election_id, voter_id, ...) VALUES (...);
  
  -- Update voter
  UPDATE voters SET has_voted = true, voted_at = NOW() WHERE id = voter_id;
COMMIT;
```

**Implementation TypeScript**

```tsx
// lib/services/vote.ts
export async function castVote({
  token,
  voteData,
}: {
  token: string;
  voteData: any;
}) {
  const supabase = await createAdminClient();  // Service role
  
  // Start transaction
  const { data: voter, error: voterError } = await supabase
    .from('voters')
    .select('*, elections(*)')
    .eq('token', token)
    .single();
  
  if (voterError || !voter) {
    throw new Error('Invalid token');
  }
  
  // Check if already voted (race condition safe)
  if (voter.has_voted) {
    throw new Error('Already voted');
  }
  
  // Check election status
  if (voter.elections.status !== 'active') {
    throw new Error('Election is not active');
  }
  
  // Encrypt vote
  const encrypted = encryptVote(voteData, voter.election_id);
  const voteHash = generateVoteHash(voteData);
  
  // Insert vote using RPC (atomic transaction)
  const { error: voteError } = await supabase.rpc('cast_vote_atomic', {
    p_election_id: voter.election_id,
    p_voter_id: [voter.id](http://voter.id),
    p_encrypted_vote: encrypted.encrypted,
    p_vote_hash: voteHash,
    p_ip: '...',
    p_user_agent: '...',
  });
  
  if (voteError) {
    throw voteError;
  }
  
  return { success: true, voteHash };
}
```

**Stored procedure SQL**

```sql
-- supabase/migrations/xxx_cast_vote_function.sql
CREATE OR REPLACE FUNCTION cast_vote_atomic(
  p_election_id UUID,
  p_voter_id UUID,
  p_encrypted_vote TEXT,
  p_vote_hash TEXT,
  p_ip INET,
  p_user_agent TEXT
) RETURNS void AS $$
DECLARE
  v_has_voted BOOLEAN;
BEGIN
  -- Lock voter row
  SELECT has_voted INTO v_has_voted
  FROM voters
  WHERE id = p_voter_id
  FOR UPDATE;
  
  -- Check if already voted
  IF v_has_voted THEN
    RAISE EXCEPTION 'Already voted';
  END IF;
  
  -- Insert vote
  INSERT INTO votes (
    election_id,
    voter_id,
    encrypted_vote,
    vote_hash,
    ip_address,
    user_agent
  ) VALUES (
    p_election_id,
    p_voter_id,
    p_encrypted_vote,
    p_vote_hash,
    p_ip,
    p_user_agent
  );
  
  -- Update voter
  UPDATE voters
  SET has_voted = true, voted_at = NOW()
  WHERE id = p_voter_id;
  
  -- Create audit log
  INSERT INTO audit_logs (election_id, action, details)
  VALUES (p_election_id, 'vote.cast', jsonb_build_object('voter_id', p_voter_id));
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 Authentification 2FA

### Implementation TOTP

```tsx
// lib/services/2fa.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export async function generate2FASecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `E-Voting (${userEmail})`,
    length: 32,
  });
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  
  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    backupCodes,
  };
}

export function verify2FAToken(
  token: string,
  secret: string
): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,  // Allow ±60 seconds
  });
}

export function verifyBackupCode(
  code: string,
  backupCodes: string[]
): boolean {
  return backupCodes.includes(code.toUpperCase());
}
```

### Flow complet

```tsx
// app/api/auth/2fa/enable/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Generate secret
  const { secret, qrCode, backupCodes } = await generate2FASecret([user.email](http://user.email)!);
  
  // Store secret (NOT yet enabled)
  await supabase
    .from('profiles')
    .update({
      two_fa_secret: secret,
      backup_codes: backupCodes,
      two_fa_enabled: false,  // Not enabled until verified
    })
    .eq('id', [user.id](http://user.id));
  
  return NextResponse.json({
    qrCode,
    secret,
    backupCodes,
  });
}

// app/api/auth/2fa/verify/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { token } = await request.json();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('two_fa_secret')
    .eq('id', [user.id](http://user.id))
    .single();
  
  // Verify token
  const valid = verify2FAToken(token, profile.two_fa_secret);
  
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 400 }
    );
  }
  
  // Enable 2FA
  await supabase
    .from('profiles')
    .update({ two_fa_enabled: true })
    .eq('id', [user.id](http://user.id));
  
  return NextResponse.json({ success: true });
}
```

---

## 🔍 Audit Trail

### Implementation blockchain-like

```tsx
// lib/services/audit.ts
import crypto from 'crypto';

interface AuditEntry {
  electionId: string | null;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  actorIp: string | null;
  details: any;
}

export async function createAuditLog(entry: AuditEntry) {
  const supabase = await createAdminClient();
  
  // Get previous hash
  const { data: lastLog } = await supabase
    .from('audit_logs')
    .select('current_hash')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const previousHash = lastLog?.current_hash || 'genesis';
  
  // Generate current hash
  const currentHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        ...entry,
        previousHash,
        timestamp: [Date.now](http://Date.now)(),
      })
    )
    .digest('hex');
  
  // Insert log
  await supabase.from('audit_logs').insert({
    election_id: entry.electionId,
    action: entry.action,
    actor_id: entry.actorId,
    actor_email: entry.actorEmail,
    actor_ip: entry.actorIp,
    details: entry.details,
    previous_hash: previousHash,
    current_hash: currentHash,
  });
}

// Verify chain integrity
export async function verifyAuditChain(): Promise<boolean> {
  const supabase = await createAdminClient();
  
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (!logs || logs.length === 0) return true;
  
  for (let i = 1; i < logs.length; i++) {
    const log = logs[i];
    const prevLog = logs[i - 1];
    
    if (log.previous_hash !== prevLog.current_hash) {
      console.error(`Chain broken at log ${[log.id](http://log.id)}`);
      return false;
    }
  }
  
  return true;
}
```

---

## 🛡️ Checklist Sécurité

### Avant Production

**Infrastructure**

- [ ]  HTTPS uniquement (redirections HTTP → HTTPS)
- [ ]  Headers de sécurité configurés
- [ ]  Environnement variables sécurisées (Vercel)
- [ ]  Secrets rotation policy
- [ ]  Firewall Supabase configuré

**Application**

- [ ]  Validation input (Zod) partout
- [ ]  Sanitization HTML (DOMPurify)
- [ ]  Rate limiting actif
- [ ]  CSRF protection
- [ ]  XSS prevention
- [ ]  SQL injection impossible (RLS)

**Authentication**

- [ ]  2FA disponible
- [ ]  Password strength enforced
- [ ]  Account lockout après 5 tentatives
- [ ]  Session timeout (24h)
- [ ]  Secure password reset flow

**Data**

- [ ]  Votes chiffrés (AES-256-GCM)
- [ ]  Backups automatiques
- [ ]  RLS policies testées
- [ ]  Audit trail actif
- [ ]  GDPR compliant

**Monitoring**

- [ ]  Sentry error tracking
- [ ]  Alerts sur échecs auth
- [ ]  Logs centralisés
- [ ]  Uptime monitoring

---

## 🚨 Incident Response

### Procédure en cas de breach

**1. Détection**

- Monitoring alerts
- Anomalies dans logs
- Report utilisateur

**2. Containment**

```bash
# Disable compromised accounts
supabase db sql "UPDATE profiles SET enabled = false WHERE id = '...'"

# Rotate secrets
vercel env rm ENCRYPTION_KEY
vercel env add ENCRYPTION_KEY

# Force password reset
supabase db sql "UPDATE auth.users SET encrypted_password = NULL"
```

**3. Investigation**

- Analyser audit logs
- Vérifier intégrité chaîne
- Identifier scope du breach

**4. Recovery**

- Patcher vulnérabilité
- Restore from backup si nécessaire
- Re-enable services

**5. Post-mortem**

- Documentation incident
- Améliorer monitoring
- Mettre à jour runbook