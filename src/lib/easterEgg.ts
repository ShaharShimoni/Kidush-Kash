/**
 * שמירה קלת-דעת בלבד — לא חלק מהלוגיקה העסקית, בשביל הצחוקים.
 * בכוונה בלי תחילית 'kidush.' כדי שלא יימחק על ידי הניקוי ב-legacyStorage.ts.
 */
const STORAGE_KEY = 'amran-warning-acks'

export function recordAmranAck(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const acks: string[] = raw ? JSON.parse(raw) : []
    acks.push(new Date().toISOString())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(acks))
  } catch {
    // אחסון חסום — לא נורא, זה רק בשביל הצחוקים
  }
}
