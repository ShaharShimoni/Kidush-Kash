# תכנון: חיבור אמיתי ל-Firebase RTDB + ניקוי אחסון מקומי תקוע

> קובץ תכנון בלבד. לא בוצע עדיין שום שינוי בקוד, ולא נגעתי בכתובת ה-DB.

---

## 1. הרקע — מה באמת קרה

הדיווח: משפחות שנרשמו להביא אוכל לקידוש לא ראו זו את זו — כל אחת ראתה רק את עצמה.

**שורש הבעיה, מאומת מתוך הבאנדל שרץ עכשיו בפרודקשן**
(`https://kidush-kash.vercel.app/assets/index-kiU-oZyI.js`):

```js
const Q = "".replace(/\/$/,""), ee = Q.length > 0;   // dbUrl = ""  →  isDbConfigured = false
```

בזמן ה-build של Vercel המשתנה `VITE_RTDB_URL` הוגדר כ**מחרוזת ריקה**.
ב-`src/lib/realtimeDb.ts:12` הנפילה־לברירת־מחדל נעשית עם `??`, שמתפסת רק `null`/`undefined` —
מחרוזת ריקה עוברת דרכה בשלום. השרשרת שנוצרה:

| שלב | קובץ:שורה | תוצאה |
|---|---|---|
| `dbUrl = ('' ?? DEFAULT_URL)` | `realtimeDb.ts:12` | `dbUrl = ''` |
| `isDbConfigured = dbUrl.length > 0` | `realtimeDb.ts:14` | `false` |
| `isDbConfigured ? createRemoteRepo() : createLocalRepo()` | `contributionsRepo.ts:198` | **נבחר המאגר המקומי** |

לכן כל מכשיר ניהל רשימה נפרדת לגמרי. `DEFAULT_URL` (`kidush-kash-b0eb9-...`)
אפילו לא נכנס לבאנדל — אין בו אף מחרוזת `https://...firebasedatabase.app`.

### עדויות תומכות

- `GET https://kidush-kash-b0eb9-default-rtdb.europe-west1.firebasedatabase.app/contributions.json` → `null`.
  האפליקציה מעולם לא כתבה ל-DB. ב-DB יש רק `test-probe` — שארית מבדיקת חיבור.
- ה-DB עצמו חי ונגיש לקריאה (`GET /.json` → 200), כלומר הכתובת ב-`realtimeDb.ts:9` **תקינה**.
- אותה מלכודת בדיוק קיימת ב-`.github/workflows/pages.yml:37` —
  `VITE_RTDB_URL: ${{ vars.VITE_RTDB_URL }}`, וכשהמשתנה לא מוגדר GitHub מזריק מחרוזת ריקה.

### איפה נשמר המצב המקומי

| מפתח | מצב |
|---|---|
| `kidush.contributions.v2` | `contributionsRepo.ts:6`. בקוד הנוכחי רק נמחק, ורק אם `isDbConfigured` — כלומר בפרודקשן **לא נמחק** |
| `kidush.contributions.v1` | מהקומיטים הראשונים. אף פעם לא נוקה. עדיין יושב על מכשירים |

אין `sessionStorage`, אין `indexedDB`, אין service worker.

### התוצאה המבוקשת

האפליקציה תמיד מדברת עם ה-RTDB הקיים (הכתובת ב-`realtimeDb.ts:9` **לא משתנה**),
כל המשפחות רואות מצב משותף בזמן אמת, וכל מכשיר שכבר שמר מצב מקומי מנקה אותו בטעינה הבאה.

---

## 2. שינויי קוד

### 2.1 `src/lib/realtimeDb.ts` — לא לתת למחרוזת ריקה לנצח

**אל תיגע ב-`DEFAULT_URL` (שורה 9).** להחליף רק את שורות 12–14:

```ts
/** דריסה בזמן בנייה. מחרוזת ריקה או רווחים = "לא הוגדר", ולכן חוזרים לברירת המחדל. */
const override = import.meta.env.VITE_RTDB_URL?.trim()

export const dbUrl = (override || DEFAULT_URL).replace(/\/$/, '')
```

להסיר את `isDbConfigured` (שורה 14) — הוא כבר לא יכול להיות `false`,
וכל השימושים בו נעלמים בשלב 2.2. `dbUrl` תמיד תקין, ולכן `endpoint()` לעולם לא בונה URL יחסי
(מה שקורה היום: הבקשות נשלחות ל-origin של האתר במקום ל-Firebase).

`dbDelete` (שורה 35) הוא export שאף אחד לא משתמש בו — להשאיר, יידרש אם ירצו בעתיד מחיקת פריט.

### 2.2 `src/lib/contributionsRepo.ts` — למחוק את המצב המקומי

מוחקים את ה-fallback לגמרי, כך שאי אפשר יותר ליפול בשקט למצב פר־מכשיר.

- למחוק את `createLocalRepo()` (שורות 69–119) ואת כותרת המקטע (65–67)
- למחוק את `STORAGE_KEY` (שורה 6) ואת בלוק תופעת־הלוואי ברמת המודול (204–213) —
  הניקוי עובר ל-`legacyStorage.ts` (2.3)
- למחוק את `dataSource` (שורה 202) — לא נצרך באף מקום
- להחליף את שורות 198–200 ב:
  ```ts
  export const contributionsRepo: ContributionsRepo = createRemoteRepo()
  ```
- לעדכן את ה-import בשורה 1: להסיר `isDbConfigured`

`initialContributions` ו-`customTints` נשארים בשימוש (`seedMap`, `makeCustom`) —
לא לגעת ב-`src/data/contributions.ts`.

מה שנשאר הוא בדיוק ההתנהגות המשותפת שכבר כתובה ועובדת:

- seed חד־פעמי אם הענף ריק — `seedIfEmpty()`, שורות 127–131
- טעינה מלאה — `load()`, שורות 133–136
- SSE דרך `dbSubscribe` שמפעיל טעינה מחדש בכל אירוע — שורות 149–155
- הרשמה/ביטול עם ETag + `if-match` דרך `dbUpdateWithRetry` — שורות 164, 174.
  זה מה שמונע ששתי משפחות שנרשמות בו-זמנית ידרסו זו את זו

כשה-DB לא זמין המשתמש יראה שגיאה בעברית דרך `toHebrewError` (`src/lib/errors.ts`)
וכפתור "נסו שוב" (`App.tsx:120`) — כישלון רועש במקום מצב מקומי שקט שנראה כאילו עובד.

### 2.3 `src/lib/legacyStorage.ts` (קובץ חדש) — ניקוי בכל טעינה

פונקציה אחת, `purgeLegacyLocalState()`, שמנקה כל מפתח בתחילית `kidush.` —
כך היא מכסה גם את `v1`, גם את `v2` וגם כל וריאנט עתידי, בלי לתחזק רשימה:

- לעבור על `Object.keys(localStorage)`, לאסוף את המפתחות שמתחילים ב-`kidush.`,
  ורק אחר כך `removeItem` על כל אחד —
  מחיקה בתוך איטרציה על אינדקסים מדלגת על מפתחות
- אותו טיפול על `sessionStorage`, לשלמות
- הכול בתוך `try/catch` — בדפדפן שחוסם אחסון (Safari פרטי) הגישה עצמה זורקת
- **בלי דגל "כבר בוצע"**: הפונקציה רצה בכל טעינה. היא זולה, אידמפוטנטית,
  ואין יותר שום מצב אפליקציה ב-localStorage — כך כל מי שנכנס לקישור מתנקה בוודאות,
  גם אם הוא נכנס עם באנדל מהקאש

### 2.4 `src/main.tsx` — לקרוא לניקוי לפני העלייה

לייבא את `purgeLegacyLocalState` ולקרוא לה לפני `createRoot(...).render(...)`.
זו נקודת הכניסה היחידה, היא רצה בדיוק פעם אחת, ולא תלויה בסדר ייבוא מודולים —
בשונה מתופעת הלוואי שהייתה ב-`contributionsRepo.ts`.

### 2.5 היגיינת הגדרות — שהבאג לא יחזור

- **`.env.example`** — כרגע מצביע על פרויקט אחר לגמרי
  (`kidush-kash-default-rtdb.firebaseio.com`) וגם מבטיח
  "השאירו ריק כדי לרוץ על localStorage". שתי האמירות הופכות שגויות.
  לעדכן לכתובת האמיתית מ-`realtimeDb.ts:9`, ולהערה: השארה ריקה = שימוש בברירת המחדל.
- **`.github/workflows/pages.yml:36-37`** — ההערה
  "the code falls back to the project's public RTDB URL" תהיה סוף־סוף נכונה אחרי 2.1.
  אין צורך בשינוי פונקציונלי.
- **`README.md`** — מזכיר `VITE_FIREBASE_*` ו-Firestore שלא קיימים בקוד
  (אין תלות ב-Firebase SDK ב-`package.json`), ומתאר התמדה ב-localStorage.
  לעדכן את מקטע הסביבה בהתאם.

---

## 3. מה קורה מחוץ לקוד

- **Vercel** — אחרי 2.1 הערך הריק לא מזיק יותר. עדיין מומלץ למחוק את `VITE_RTDB_URL`
  מ-Project Settings → Environment Variables (Production), כדי לא להשאיר מלכודת.
  מי שמעדיף להשאיר — לתת לו את הכתובת מ-`realtimeDb.ts:9`.
- **מחיקת `test-probe`** (אושר) — `curl -X DELETE ".../test-probe.json"`.
  המחיקה הזו היא גם בדיקת הכתיבה: אם היא מחזירה 200, הכתיבה ל-DB פתוחה.
- **חוקי אבטחה — בדיקה ודיווח בלבד** (אושר, בלי פריסה).
  העובדה שיש `test-probe` בשורש מעידה שהחוקים החיים אינם `database.rules.json` שבריפו
  (שם `.write` בשורש הוא `false`) — כלומר החוקים בקונסולה פתוחים לגמרי, קרוב לוודאי "מצב בדיקה".
  אבדוק ואדווח. אם מדובר בחוקים עם תאריך תפוגה — זו פצצת זמן שתשבית את המערכת ביום שהם יפוגו,
  וכדאי לפרוס את `database.rules.json` דרך הקונסולה או `npx firebase deploy --only database`.

---

## 4. אימות מקצה לקצה

1. `npm run typecheck && npm run build`
2. לאמת שהכתובת נכנסה לבאנדל — זה בדיוק מה שנשבר:
   - `grep -o "https://kidush-kash-b0eb9[^\"]*" dist/assets/index-*.js` → **חייב** להחזיר התאמה
   - `grep -o '"".replace' dist/assets/index-*.js` → **חייב** לחזור ריק
3. `npm run dev`, ובקונסולה:
   ```js
   localStorage.setItem('kidush.contributions.v2','[]')
   localStorage.setItem('kidush.contributions.v1','[]')
   ```
   רענון, ואז `Object.keys(localStorage).filter(k => k.startsWith('kidush'))` → מערך ריק.
4. **שיתופיות אמיתית** — לפתוח את האפליקציה בשני חלונות (עדיף שני פרופילים או שני מכשירים),
   להירשם עם משפחה בחלון אחד. הרישום צריך להופיע בשני **בלי רענון**, דרך ה-SSE.
5. לאמת שהנתונים באמת בענן: `curl ".../contributions.json"` —
   צריך להחזיר את הפריטים עם ה-`registeredFamilies` שהוזן.
6. בדיקת ה-ETag: להירשם לאותו פריט משני חלונות כמעט במקביל —
   שני השמות צריכים להיכנס, או שהשני יקבל "המקום נתפס", בלי דריסה.
7. ב-Network tab לוודא שיש בקשות ל-`kidush-kash-b0eb9-default-rtdb.europe-west1.firebasedatabase.app`
   ולא ל-origin של האתר.
8. אחרי דיפלוי: רענון קשה (Ctrl+Shift+R) ב-`https://kidush-kash.vercel.app`,
   וחזרה על סעיפים 3, 4 ו-7 מול הפרודקשן.

---

## 5. הערה חשובה לשחרור

הרשימה שכל המשפחות יראו תיווצר בטעינה הראשונה (`seedIfEmpty`) מ-`src/data/contributions.ts`.

מהרגע שהמערכת מחוברת — **לחיצה כפולה על "שבת שלום ומבורכת" בפוטר**
פותחת חלונית איפוס שמוחקת את **כל** ההרשמות של **כולם**
(`contributionsRepo.reset()` → `dbPut(PATH, seedMap())`), כולל פריטים שהוסיפו ידנית.
עד היום זה היה מקומי ולכן לא מזיק; מעכשיו זה גלובלי.
שווה לשקול בהמשך הגנה על הפעולה הזו — מחוץ לתחום השינוי הזה.
