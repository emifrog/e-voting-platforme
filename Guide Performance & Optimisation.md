# ⚡ Guide Performance & Optimisation

**Version**: 1.0.0

**Date**: 14 Novembre 2025

---

## 🎯 Objectifs Performance

### Métriques cibles

**Core Web Vitals**

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 200ms

**Lighthouse Score**

- Performance: > 90
- Accessibility: 100
- Best Practices: > 95
- SEO: > 90

---

## 🚀 Next.js Optimizations

### 1. Server Components (priorité maximale)

```tsx
// ✅ Server Component par défaut
// Pas de 'use client' = Server Component
export default async function ElectionPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Data fetching sur le serveur
  const election = await getElection([params.id](http://params.id));
  
  return (
    <div>
      {/* Server Component - pas de JS au client */}
      <ElectionHeader election={election} />
      
      {/* Client Component seulement quand nécessaire */}
      <VoteButton electionId={[election.id](http://election.id)} />
    </div>
  );
}

// ✅ Client Component uniquement pour interactivité
'use client';

export function VoteButton({ electionId }: { electionId: string }) {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button onClick={handleVote} disabled={loading}>
      Vote Now
    </Button>
  );
}
```

**Règle**: Server Component par défaut, Client Component seulement si :

- useState / useEffect
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Custom hooks qui utilisent les hooks ci-dessus

### 2. Streaming & Suspense

```tsx
import { Suspense } from 'react';

export default function ElectionPage() {
  return (
    <div>
      {/* Partie rapide: rendu immédiat */}
      <ElectionHeader />
      
      {/* Partie lente: streaming */}
      <Suspense fallback={<ResultsSkeleton />}>
        <ElectionResults />
      </Suspense>
      
      {/* Autre partie lente: streaming indépendant */}
      <Suspense fallback={<VotersSkeleton />}>
        <VotersList />
      </Suspense>
    </div>
  );
}

// Component qui fetch des données
async function ElectionResults() {
  const results = await getResults();  // Peut être lent
  
  return <ResultsChart data={results} />;
}
```

### 3. Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ResultsChart = dynamic(
  () => import('@/components/results/chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,  // Ne pas render côté serveur
  }
);

// Lazy load modals (chargés seulement à l'ouverture)
const ExportDialog = dynamic(
  () => import('@/components/export-dialog')
);

// Lazy load avec preload
const HeavyComponent = dynamic(
  () => import('@/components/heavy'),
  {
    loading: () => <Skeleton />,
  }
);

function MyPage() {
  const [showExport, setShowExport] = useState(false);
  
  return (
    <div>
      <Button 
        onClick={() => setShowExport(true)}
        // Preload on hover
        onMouseEnter={() => import('@/components/export-dialog')}
      >
        Export
      </Button>
      
      {showExport && <ExportDialog />}
    </div>
  );
}
```

### 4. Caching Strategy

**Fetch avec cache**

```tsx
import { unstable_cache } from 'next/cache';

// Cache election data
const getElection = unstable_cache(
  async (id: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  },
  ['election'],  // Cache key
  {
    revalidate: 60,  // Revalidate every 60s
    tags: ['elections'],  // Tag for manual revalidation
  }
);

// Revalidate manuellement
import { revalidateTag } from 'next/cache';

await updateElection(id, data);
revalidateTag('elections');  // Invalide le cache
```

**Request Memoization**

```tsx
import { cache } from 'react';

// Même requête appelée plusieurs fois = 1 seule DB query
export const getElection = cache(async (id: string) => {
  const supabase = await createClient();
  return await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .single();
});

// Dans components
async function Component1() {
  const election = await getElection('123');  // DB query
}

async function Component2() {
  const election = await getElection('123');  // Cache (même request)
}
```

---

## 🗄️ Database Performance

### 1. Indexes stratégiques

```sql
-- Composite index pour queries communes
CREATE INDEX idx_voters_election_voted 
ON voters(election_id, has_voted)
WHERE has_voted = false;

-- Partial index pour filtres spécifiques
CREATE INDEX idx_elections_active 
ON elections(created_at DESC) 
WHERE status = 'active';

-- Index pour full-text search
CREATE INDEX idx_elections_search 
ON elections USING GIN(search_vector);

-- Covering index (include)
CREATE INDEX idx_elections_with_title 
ON elections(creator_id, created_at DESC) 
INCLUDE (title, status);
```

### 2. Query Optimization

**❌ Bad: N+1 queries**

```tsx
// Fetch elections
const { data: elections } = await supabase
  .from('elections')
  .select('*');

// N+1: One query per election
for (const election of elections) {
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('election_id', [election.id](http://election.id));
}
```

**✅ Good: Single query with join**

```tsx
const { data: elections } = await supabase
  .from('elections')
  .select(`
    *,
    candidates (*),
    voters:voters(count)
  `);
```

**Select only needed columns**

```tsx
// ❌ Bad: Select all
await supabase.from('elections').select('*');

// ✅ Good: Select only needed
await supabase
  .from('elections')
  .select('id, title, status, created_at');
```

### 3. Pagination

```tsx
export async function getElectionsPaginated({
  userId,
  page = 1,
  limit = 20,
  status,
}: {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}) {
  const supabase = await createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  let query = supabase
    .from('elections')
    .select('*, candidates(count)', { count: 'exact' })
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, count, error } = await query.range(from, to);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      hasNext: to < (count || 0) - 1,
      hasPrev: page > 1,
    },
  };
}
```

### 4. Connection Pooling

**Supabase gère automatiquement, mais pour optimiser :**

```tsx
// Utiliser un pool de connexions
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  [process.env.NEXT](http://process.env.NEXT)_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,  // Server-side: pas de session
    },
    global: {
      headers: {
        // Connection pooling via Supavisor
        'x-connection-mode': 'transaction',
      },
    },
  }
);
```

---

## 💾 Redis Caching

### Setup Upstash Redis

```tsx
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCached<T>(
  key: string,
  ttl?: number
): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached as T | null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = 3600  // 1 hour default
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidateCache(
  pattern: string
): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}
```

### Stratégie de cache

```tsx
// lib/db/queries/elections.ts
import { getCached, setCache, invalidateCache } from '@/lib/cache/redis';

export async function getElection(id: string) {
  const cacheKey = `election:${id}`;
  
  // Try cache first
  const cached = await getCached<Election>(cacheKey);
  if (cached) return cached;
  
  // Cache miss: fetch from DB
  const supabase = await createClient();
  const { data: election } = await supabase
    .from('elections')
    .select('*, candidates(*)')
    .eq('id', id)
    .single();
  
  // Cache for 5 minutes
  if (election) {
    await setCache(cacheKey, election, 300);
  }
  
  return election;
}

// Invalidate on update
export async function updateElection(id: string, data: any) {
  await supabase
    .from('elections')
    .update(data)
    .eq('id', id);
  
  // Invalidate cache
  await invalidateCache(`election:${id}`);
}
```

**Cache results**

```tsx
export async function getElectionResults(electionId: string) {
  const cacheKey = `results:${electionId}`;
  
  // Results rarely change after closing
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  const results = await calculateResults(electionId);
  
  // Cache for 1 hour
  await setCache(cacheKey, results, 3600);
  
  return results;
}
```

---

## 🖼️ Image Optimization

```tsx
import Image from 'next/image';

// ✅ Use Next.js Image
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Pour LCP
  placeholder="blur"  // Blur while loading
  quality={85}  // Balance qualité/taille
/>

// ✅ Responsive images
<Image
  src="/hero.png"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

**Avatar optimization**

```tsx
// Supabase Storage avec transform
const avatarUrl = [supabase.storage](http://supabase.storage)
  .from('avatars')
  .getPublicUrl(`${userId}.png`, {
    transform: {
      width: 200,
      height: 200,
      quality: 80,
    },
  });
```

---

## 📦 Bundle Optimization

### Analyze bundle

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Configure
# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});

# Run analysis
ANALYZE=true npm run build
```

### Tree shaking

```jsx
// next.config.js
module.exports = {
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
};
```

**Import only what you need**

```tsx
// ❌ Bad: Import entire library
import * as dateFns from 'date-fns';

// ✅ Good: Import specific functions
import { format, addDays } from 'date-fns';
```

---

## 🎭 React Performance

### Memoization

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memo component
export const ElectionCard = memo(function ElectionCard({ 
  election 
}: { 
  election: Election 
}) {
  return (
    <Card>
      <h3>{election.title}</h3>
    </Card>
  );
});

// useMemo pour calculs coûteux
function ElectionResults({ votes }: { votes: Vote[] }) {
  const results = useMemo(() => {
    // Calcul coûteux
    return calculateResults(votes);
  }, [votes]);  // Recalcule seulement si votes change
  
  return <ResultsChart data={results} />;
}

// useCallback pour fonctions
function VoterList({ voters }: { voters: Voter[] }) {
  const handleDelete = useCallback((id: string) => {
    deleteVoter(id);
  }, []);  // Fonction stable
  
  return (
    <>
      {[voters.map](http://voters.map)(voter => (
        <VoterRow 
          key={[voter.id](http://voter.id)} 
          voter={voter}
          onDelete={handleDelete}  // Même référence
        />
      ))}
    </>
  );
}
```

### Virtual Scrolling

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VoterList({ voters }: { voters: Voter[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: voters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,  // Hauteur estimée par item
    overscan: 5,  // Render 5 items en dehors du viewport
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${item.size}px`,
              transform: `translateY(${item.start}px)`,
            }}
          >
            <VoterRow voter={voters[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Monitoring Performance

### Vercel Speed Insights

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Tracking

```tsx
// lib/performance.ts
export function measurePerformance(
  metricName: string,
  fn: () => Promise<any>
) {
  const start = [performance.now](http://performance.now)();
  
  return fn().finally(() => {
    const duration = [performance.now](http://performance.now)() - start;
    
    // Log to analytics
    console.log(`[PERF] ${metricName}: ${duration.toFixed(2)}ms`);
    
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      window.gtag?.('event', 'timing_complete', {
        name: metricName,
        value: Math.round(duration),
      });
    }
  });
}

// Usage
await measurePerformance('fetch-elections', async () => {
  return await getElections();
});
```

---

## ✅ Performance Checklist

**Server Components**

- [ ]  Utiliser Server Components par défaut
- [ ]  Client Components seulement pour interactivité
- [ ]  Streaming avec Suspense

**Database**

- [ ]  Indexes créés pour queries fréquentes
- [ ]  Pagination implémentée
- [ ]  Select seulement colonnes nécessaires
- [ ]  Éviter N+1 queries

**Caching**

- [ ]  unstable_cache pour data fetching
- [ ]  Redis pour données volatiles
- [ ]  Revalidation strategy définie

**Bundle**

- [ ]  Dynamic imports pour code lourd
- [ ]  Tree shaking configuré
- [ ]  Bundle size < 200KB (initial)

**Images**

- [ ]  next/image utilisé partout
- [ ]  Formats WebP/AVIF
- [ ]  Lazy loading

**React**

- [ ]  memo pour components stables
- [ ]  useMemo pour calculs coûteux
- [ ]  Virtual scrolling pour listes longues

**Monitoring**

- [ ]  Vercel Analytics activé
- [ ]  Core Web Vitals trackés
- [ ]  Error tracking (Sentry)