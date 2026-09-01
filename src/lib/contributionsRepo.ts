import { dbGet, dbPut, dbSubscribe, dbUpdateWithRetry } from './realtimeDb'
import { customTints, initialContributions } from '../data/contributions'
import type { Contribution } from '../types'

const PATH = 'contributions'

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

export const contributionsRepo: ContributionsRepo = createRemoteRepo()

