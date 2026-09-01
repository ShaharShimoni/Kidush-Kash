import { dbGet, dbPut, dbSubscribe, dbUpdateWithRetry, isDbConfigured } from './realtimeDb'
import { customTints, initialContributions } from '../data/contributions'
import type { Contribution } from '../types'

const PATH = 'contributions'
const STORAGE_KEY = 'kidush.contributions.v2'

/** צורת הרשומה כפי שהיא נשמרת. RTDB משמיט מערכים ריקים, ולכן families אופציונלי. */
type StoredItem = Omit<Contribution, 'id' | 'registeredFamilies'> & {
  registeredFamilies?: string[] | null
}

export interface ContributionsRepo {
  subscribe(
    onData: (items: Contribution[]) => void,
    onError: (error: unknown) => void,
  ): () => void
  register(contributionId: string, familyName: string): Promise<void>
  unregister(contributionId: string, familyName: string): Promise<void>
  addCustom(title: string, familyName: string): Promise<void>
  reset(): Promise<void>
}

function makeCustom(title: string, familyName: string, index: number): Contribution {
  return {
    id: `custom-${Date.now()}-${index}`,
    title,
    icon: 'dish',
    tint: customTints[index % customTints.length],
    quantityRequired: 1,
    registeredFamilies: [familyName],
    isCustom: true,
    order: 1000 + index,
  }
}

/** ממיר את המפה שמגיעה מ-RTDB לרשימה ממוינת */
function toList(map: Record<string, StoredItem> | null): Contribution[] {
  if (!map) return []
  return Object.entries(map)
    .map(([id, v]) => ({
      id,
      title: v.title,
      icon: v.icon,
      tint: v.tint,
      quantityRequired: v.quantityRequired,
      registeredFamilies: v.registeredFamilies ?? [],
      isCustom: v.isCustom ?? false,
      order: v.order ?? 0,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** מצב הפתיחה כמפה, מוכן לכתיבה יחידה */
function seedMap(): Record<string, StoredItem> {
  const map: Record<string, StoredItem> = {}
  initialContributions.forEach((item, index) => {
    const { id, registeredFamilies, ...rest } = item
    void registeredFamilies
    map[id] = { ...rest, order: index, isCustom: false }
  })
  return map
}

/* ------------------------------------------------------------------ */
/* מימוש מקומי — נכנס לפעולה רק אם אין כתובת בסיס נתונים               */
/* ------------------------------------------------------------------ */

function createLocalRepo(): ContributionsRepo {
  // Do not persist selections in local mode to avoid per-device "last
  // selection" state. Keep data only in-memory so different phones don't
  // carry stale cached selections across sessions during development.
  let items = initialContributions
  const listeners = new Set<(items: Contribution[]) => void>()

  const emit = () => {
    listeners.forEach((fn) => fn(items))
  }

  return {
    subscribe(onData) {
      listeners.add(onData)
      const t = setTimeout(() => onData(items), 200)
      return () => {
        clearTimeout(t)
        listeners.delete(onData)
      }
    },
    async register(id, familyName) {
      const target = items.find((c) => c.id === id)
      if (!target) throw { code: 'not-found' }
      if (target.registeredFamilies.includes(familyName)) throw { code: 'already-exists' }
      if (target.registeredFamilies.length >= target.quantityRequired) {
        throw { code: 'failed-precondition' }
      }
      items = items.map((c) =>
        c.id === id ? { ...c, registeredFamilies: [...c.registeredFamilies, familyName] } : c,
      )
      emit()
    },
    async unregister(id, familyName) {
      items = items.map((c) =>
        c.id === id
          ? { ...c, registeredFamilies: c.registeredFamilies.filter((f) => f !== familyName) }
          : c,
      )
      emit()
    },
    async addCustom(title, familyName) {
      if (items.some((c) => c.title.trim() === title.trim())) throw { code: 'already-exists' }
      items = [...items, makeCustom(title, familyName, items.length)]
      emit()
    },
    async reset() {
      items = initialContributions.map((c) => ({ ...c, registeredFamilies: [] }))
      emit()
    },
  }
}

/* ------------------------------------------------------------------ */
/* מימוש Realtime Database                                             */
/* ------------------------------------------------------------------ */

function createRemoteRepo(): ContributionsRepo {
  /** זריעה חד-פעמית אם הענף ריק */
  async function seedIfEmpty() {
    const current = await dbGet<Record<string, StoredItem>>(PATH)
    if (current && Object.keys(current).length > 0) return
    await dbPut(PATH, seedMap())
  }

  const load = async (onData: (items: Contribution[]) => void) => {
    const map = await dbGet<Record<string, StoredItem>>(PATH)
    onData(toList(map))
  }

  return {
    subscribe(onData, onError) {
      let active = true
      const push = (items: Contribution[]) => {
        if (active) onData(items)
      }

      seedIfEmpty()
        .then(() => load(push))
        .catch(onError)

      const stop = dbSubscribe(
        PATH,
        () => {
          load(push).catch(onError)
        },
        onError,
      )

      return () => {
        active = false
        stop()
      }
    },

    async register(id, familyName) {
      await dbUpdateWithRetry<StoredItem>(`${PATH}/${id}`, (item) => {
        if (!item) throw { code: 'not-found' }
        const families = item.registeredFamilies ?? []
        if (families.includes(familyName)) throw { code: 'already-exists' }
        if (families.length >= item.quantityRequired) throw { code: 'failed-precondition' }
        return { ...item, registeredFamilies: [...families, familyName] }
      })
    },

    async unregister(id, familyName) {
      await dbUpdateWithRetry<StoredItem>(`${PATH}/${id}`, (item) => {
        if (!item) throw { code: 'not-found' }
        const families = (item.registeredFamilies ?? []).filter((f) => f !== familyName)
        // RTDB מוחק מפתח שערכו מערך ריק, וזה בדיוק ההתנהגות הרצויה
        return { ...item, registeredFamilies: families.length ? families : null }
      })
    },

    async addCustom(title, familyName) {
      const map = await dbGet<Record<string, StoredItem>>(PATH)
      const existing = map ? Object.values(map) : []
      if (existing.some((c) => c.title?.trim() === title.trim())) throw { code: 'already-exists' }
      const item = makeCustom(title, familyName, existing.length)
      const { id, ...rest } = item
      await dbPut(`${PATH}/${id}`, rest)
    },

    async reset() {
      // כתיבה יחידה של מצב הפתיחה מוחקת גם את הפריטים שנוספו ידנית
      await dbPut(PATH, seedMap())
    },
  }
}

export const contributionsRepo: ContributionsRepo = isDbConfigured
  ? createRemoteRepo()
  : createLocalRepo()

export const dataSource: 'remote' | 'local' = isDbConfigured ? 'remote' : 'local'

// If the app is running against the remote Realtime Database, clear any
// legacy local storage that could hold stale per-device selections so
// users see the live shared state instead of a cached "last selection".
if (isDbConfigured) {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors (e.g. localStorage disabled)
  }
}

