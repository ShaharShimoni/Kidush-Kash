/**
 * גישה ל-Firebase Realtime Database דרך ה-REST API, בלי ה-SDK.
 *
 * הבסיס פתוח לקריאה ולכתיבה, ולכן אין צורך במפתח API או באתחול SDK —
 * מה שחוסך כ-334KB מהחבילה. עדכונים בזמן אמת מגיעים דרך זרם ה-SSE
 * שה-REST API של RTDB חושף, ולכן EventSource מספיק.
 */

const DEFAULT_URL = 'https://kidush-kash-b0eb9-default-rtdb.europe-west1.firebasedatabase.app'

/**
 * כתובת הבסיס. ניתנת לדריסה בזמן בנייה דרך VITE_RTDB_URL.
 * מחרוזת ריקה או רווחים בלבד נחשבת "לא הוגדר" וחוזרת לברירת המחדל —
 * כך שהגדרה ריקה בסביבת ה-CI לא מנתקת בשקט מה-DB המשותף.
 */
const override = import.meta.env.VITE_RTDB_URL?.trim()

export const dbUrl = (override || DEFAULT_URL).replace(/\/$/, '')

function endpoint(path: string) {
  return `${dbUrl}/${path.replace(/^\//, '')}.json`
}

export async function dbGet<T>(path: string): Promise<T | null> {
  const res = await fetch(endpoint(path), { cache: 'no-store' })
  if (!res.ok) throw { code: httpToCode(res.status), status: res.status }
  return (await res.json()) as T | null
}

export async function dbPut<T>(path: string, value: T): Promise<void> {
  const res = await fetch(endpoint(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw { code: httpToCode(res.status), status: res.status }
}

export async function dbDelete(path: string): Promise<void> {
  const res = await fetch(endpoint(path), { method: 'DELETE' })
  if (!res.ok) throw { code: httpToCode(res.status), status: res.status }
}

/**
 * קריאה עם ETag וכתיבה מותנית בו.
 *
 * זו הדרך של RTDB למנוע דריסה הדדית: אם משפחה אחרת עדכנה את אותו פריט
 * בין הקריאה לכתיבה, ה-ETag כבר לא תואם והשרת מחזיר 412. במקרה כזה
 * מנסים שוב עם הערך המעודכן, כך ששתי משפחות לא תופסות את אותו מקום.
 */
export async function dbUpdateWithRetry<T>(
  path: string,
  mutate: (current: T | null) => T,
  attempts = 4,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(endpoint(path), {
      cache: 'no-store',
      headers: { 'X-Firebase-ETag': 'true' },
    })
    if (!res.ok) throw { code: httpToCode(res.status), status: res.status }
    const etag = res.headers.get('ETag') ?? 'null_etag'
    const current = (await res.json()) as T | null

    const next = mutate(current)

    const write = await fetch(endpoint(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'if-match': etag },
      body: JSON.stringify(next),
    })
    if (write.ok) return
    if (write.status !== 412) throw { code: httpToCode(write.status), status: write.status }
    // 412 — מישהו הקדים אותנו; חוזרים עם הערך העדכני
  }
  throw { code: 'aborted' }
}

/**
 * מנוי לשינויים. RTDB שולח אירועי put/patch דרך SSE.
 * מכיוון שהרשימה קטנה, כל אירוע מפעיל קריאה מחדש של כל האוסף —
 * פשוט יותר ובטוח יותר מאשר למזג patch-ים חלקיים בעצמנו.
 */
export function dbSubscribe(
  path: string,
  onChange: () => void,
  onError: (error: unknown) => void,
): () => void {
  let source: EventSource | null = null
  let closed = false
  let retry: ReturnType<typeof setTimeout> | undefined

  const connect = () => {
    if (closed) return
    source = new EventSource(endpoint(path))

    const handle = () => onChange()
    source.addEventListener('put', handle)
    source.addEventListener('patch', handle)

    source.addEventListener('cancel', () => onError({ code: 'permission-denied' }))
    source.addEventListener('auth_revoked', () => onError({ code: 'unauthenticated' }))

    source.onerror = () => {
      // EventSource מנסה להתחבר מחדש מעצמו, אך לא אחרי סגירה מפורשת
      if (closed || !source) return
      source.close()
      source = null
      retry = setTimeout(connect, 4000)
    }
  }

  connect()

  return () => {
    closed = true
    if (retry) clearTimeout(retry)
    source?.close()
    source = null
  }
}

function httpToCode(status: number): string {
  if (status === 401 || status === 403) return 'permission-denied'
  if (status === 404) return 'not-found'
  if (status === 412) return 'aborted'
  if (status === 429) return 'resource-exhausted'
  if (status >= 500) return 'unavailable'
  return 'internal'
}
