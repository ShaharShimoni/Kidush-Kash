/**
 * ניקוי גרסאות ישנות של האפליקציה ששמרו מצב פר-מכשיר ב-localStorage/sessionStorage
 * (למשל 'kidush.contributions.v1', 'kidush.contributions.v2'). האפליקציה כיום
 * לא שומרת שום דבר מקומית — כל המצב חי ב-Realtime Database המשותף — ולכן כל
 * מפתח בתחילית 'kidush.' הוא שארית שצריך להיעלם כדי שהמכשיר יראה את המצב האמיתי.
 */
const PREFIX = 'kidush.'

function purgeStorage(storage: Storage) {
  try {
    const staleKeys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(PREFIX)) staleKeys.push(key)
    }
    staleKeys.forEach((key) => storage.removeItem(key))
  } catch {
    // אחסון חסום בדפדפן (למשל מצב פרטי) — אין מה לנקות
  }
}

export function purgeLegacyLocalState(): void {
  purgeStorage(localStorage)
  purgeStorage(sessionStorage)
}
