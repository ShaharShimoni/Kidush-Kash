# קידוש משותף, באופן מתוק

מערכת מתנדבים לקידוש — כל משפחה בוחרת מה להביא ורושמת את עצמה.
ממשק בעברית מלאה, RTL מקצה לקצה, מותאם למובייל ולמחשב.

**האתר החי:** https://netanelshimoni0.github.io/kidush-kash/

בנוי מתוך עיצוב ייחוס ויזואלי ב-React + TypeScript + Vite, עם Firebase Realtime Database כמקור נתונים.

הצבעים והמידות לא נאמדו בעין: הם חולצו מקובץ העיצוב באמצעות בדיקת פיקסלים
על canvas, והקישוטים בראש העמוד הם חיתוכים של האיור המקורי שעברו נרמול רקע
והחלקת קצוות (`public/decor/`). הסולם מוגדר ב-`clamp()` כך שברוחב 863px —
רוחב הרינדור של קובץ המקור — התוצאה מתלכדת עם העיצוב.

---

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה עולה בכתובת `http://localhost:5173`.

האפליקציה מתחברת תמיד ל-Realtime Database — הכתובת מוגדרת כברירת מחדל בקוד
(`src/lib/realtimeDb.ts`), כך שאין צורך בהגדרת סביבה כדי להריץ מקומית מול
הנתונים החיים. אין מצב "מקומי בלבד" — כל המשפחות תמיד רואות את אותו מצב.

## פקודות

| פקודה | תיאור |
| --- | --- |
| `npm run dev` | שרת פיתוח |
| `npm run build` | בנייה לייצור (`dist/`) |
| `npm run preview` | תצוגה מקדימה של הבנייה |
| `npm run typecheck` | בדיקת טיפוסים |
| `npm run audit:rtl` | אודיט עברית/RTL — נכשל אם יש טקסט באנגלית בממשק |
| `npm run verify` | כל הבדיקות ברצף |

---

## Firebase Realtime Database

הנתונים מסונכרנים בין כל המשפחות דרך Realtime Database, **בלי ה-SDK** —
רק ה-REST API וזרם ה-SSE שהוא חושף. זה חוסך כ-334KB מהחבילה ומוותר על
הצורך במפתח API בכלל.

| פעולה | איך |
| --- | --- |
| קריאה | `GET /contributions.json` |
| עדכון חי | `EventSource` על אותה כתובת (אירועי `put` / `patch`) |
| רישום | קריאה עם `X-Firebase-ETag` וכתיבה עם `if-match` |
| הוספת פריט | `PUT /contributions/<id>.json` |
| איפוס | `PUT /contributions.json` עם מצב הפתיחה |

הכתיבה המותנית ב-ETag היא מה שמונע משתי משפחות לתפוס את אותו מקום: אם
מישהו הקדים, השרת מחזיר 412 והפעולה חוזרת עם הערך העדכני.

הכתובת נמצאת ב-`src/lib/realtimeDb.ts` וניתנת לדריסה דרך `VITE_RTDB_URL`.
`VITE_RTDB_URL` ריק, לא מוגדר, או מרווחים בלבד — כולם נופלים חזרה לברירת
המחדל שבקוד, כדי שסביבת CI עם משתנה ריק לא תנתק בשקט מה-DB המשותף.

### חוקי אבטחה

`database.rules.json` מגביל את מבנה הנתונים ומונע כתיבה מחוץ ל-`contributions`.
לפרסום:

```bash
npx firebase-tools login
npx firebase-tools use kidush-kash
npx firebase-tools deploy --only database
```

> **הבסיס פתוח כרגע לכתיבה מכל מקום.** כל מי שמגיע לכתובת יכול לשנות או
> למחוק את הרשימה. פרסום החוקים מצמצם את זה למבנה תקין בלבד, אבל לא מגביל
> *מי* כותב — לשם כך נדרש Firebase Auth.

---

## ~~חיבור Firebase (תוכנית Spark – חינם)~~ (הוחלף במקטע שמעל)

1. פתחו פרויקט חדש ב-[Firebase Console](https://console.firebase.google.com).
2. **Build → Firestore Database → Create database** במצב Production.
3. **Project settings → General → Your apps → Web (`</>`)** — צרו אפליקציית Web
   והעתיקו את אובייקט ה-config.
4. צרו קובץ `.env.local` לפי `.env.example` ומלאו את הערכים.
5. פרסמו את חוקי האבטחה:

```bash
npx firebase-tools login
npx firebase-tools use --add          # בוחר פרויקט ויוצר .firebaserc
npx firebase-tools deploy --only firestore:rules
```

> אין בריפו `.firebaserc` בכוונה. הפקודה `use --add` היא שיוצרת אותו עם
> מזהה הפרויקט האמיתי; קובץ עם מזהה פלייסהולדר גורם לכל פקודת Firebase
> בתיקייה להיכשל עוד לפני שהיא מתחילה.

באתחול הראשון, אם אוסף `contributions` ריק, האפליקציה זורעת אותו אוטומטית
ברשימת הפריטים מהעיצוב.

### חוקי האבטחה

`firestore.rules` מגדיר:

- קריאה פתוחה לכולם (הרשימה ציבורית לקהילה).
- כתיבה מוגבלת לשדה `registeredFamilies` בלבד.
- מספר המשפחות הרשומות לעולם לא יעבור את `quantityRequired`.
- מחיקה חסומה לחלוטין.

> אין בפרויקט שכבת הזדהות. אם תרצו להגביל את הרישום למתפללי בית הכנסת בלבד,
> יש להוסיף Firebase Auth ולעדכן את החוקים בהתאם.

---

## פריסה ל-Vercel

**דרך א׳ — חיבור הרפוזיטורי (מומלץ):**

1. [vercel.com/new](https://vercel.com/new) → Import של הרפוזיטורי.
2. Vercel מזהה Vite אוטומטית (`vercel.json` כבר בפרויקט).
3. **Settings → Environment Variables** — אופציונלי: `VITE_RTDB_URL` אם
   רוצים לדרוס את כתובת ה-Realtime Database המוגדרת כברירת מחדל בקוד.
4. Deploy. כל push ל-`main` יפרוס אוטומטית.

**דרך ב׳ — פריסה דרך GitHub Actions:**

הוסיפו ב-**GitHub → Settings → Secrets and variables → Actions** את הסודות:

| Secret | מאיפה |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` אחרי `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` אחרי `vercel link` |
| `VITE_RTDB_URL` | אופציונלי — דריסת כתובת ה-Realtime Database |

`.github/workflows/deploy.yml` מדלג על הפריסה בשקט כל עוד הסודות חסרים,
כך שה-CI לעולם לא נכשל בגללם.

---

## CI

`.github/workflows/ci.yml` רץ על כל push ו-PR ל-`main`:

- **Typecheck & build** — `tsc --noEmit` ובנייה מלאה.
- **Hebrew / RTL audit** — מוודא ש-`index.html` נושא `lang="he"` ו-`dir="rtl"`,
  ש-`direction: rtl` נאכף ב-CSS, ושאין טקסט באנגלית בממשק.

---

## איך המערכת עובדת

- **מצב פתיחה** — רשימת הפריטים בלבד, ללא שיוך לאף משפחה. מספר המתנדבים
  הדרוש מוצג בפס ההתקדמות ולא בכותרת הפריט.
- **הרשמה** — לחיצה על פריט פותחת חלונית שבה רושמים את שם המשפחה.
  המילה "משפחת" נוספת אוטומטית אם היא חסרה.
- **כרטיס "אחר"** — הוספת פריט שאינו ברשימה, בשיוך למשפחה שהוסיפה אותו.
- **איפוס** — לחיצה כפולה על "שבת שלום ומבורכת" בתחתית העמוד פותחת חלונית
  סיסמה. איפוס מוחק את כל ההרשמות ואת הפריטים שנוספו ידנית, ומחזיר את
  הרשימה למצב הפתיחה.

> הסיסמה נבדקת בצד הלקוח (`src/components/ResetDialog.tsx`) ולכן היא חסם
> נוחות בלבד — מי שפותח את קוד המקור בדפדפן יוכל לראות אותה. להגנה אמיתית
> יש להעביר את האיפוס לפונקציית שרת עם הזדהות.

---

## מבנה הפרויקט

```
src/
├─ components/
│  ├─ Hero.tsx              אזור הפתיחה + קישוטים
│  ├─ ContributionPanel.tsx פאנל "מה מביאים?" + מצבי טעינה/שגיאה/ריק
│  ├─ ContributionRow.tsx   כרטיס פריט בודד
│  ├─ Modal.tsx             בסיס לחלוניות (מלכודת פוקוס, Esc, נעילת גלילה)
│  ├─ RegistrationDialog.tsx הרשמת משפחה לפריט
│  ├─ AddItemDialog.tsx     הוספת פריט דרך כרטיס "אחר"
│  ├─ ResetDialog.tsx       איפוס הרשימה מאחורי סיסמה
│  ├─ Toast.tsx
│  └─ icons/                אייקוני מזון וממשק (SVG פנימיים)
├─ lib/
│  ├─ realtimeDb.ts         גישה ל-Realtime Database דרך REST API + SSE
│  ├─ contributionsRepo.ts  לוגיקת הרשמה/ביטול/איפוס מול ה-DB המשותף
│  ├─ legacyStorage.ts      ניקוי שאריות localStorage מגרסאות קודמות
│  └─ errors.ts             תרגום שגיאות טכניות לעברית
├─ data/contributions.ts    רשימת הפריטים מהעיצוב
└─ styles/
   ├─ tokens.css            טוקנים שחולצו מהעיצוב
   └─ global.css            איפוס + אכיפת RTL
```

---

## עברית ו-RTL

- `<html lang="he" dir="rtl">` ב-`index.html`, ונאכף שוב ב-`main.tsx`.
- `direction: rtl` על `html`, `body`, `#root` ועל מכולת האפליקציה.
- מונים כמו `2/4` עטופים ב-`.ltr-num` כדי שלא יתהפכו.
- פסי ההתקדמות מתמלאים **משמאל לימין**, כפי שנמדד בפיקסלים על קובץ העיצוב
  (`ContributionPanel.css` → `.bar`). זו הנקודה היחידה שבה נאמנות לעיצוב
  גוברת על מוסכמת RTL; להיפוך יש לשנות שם `direction` ל-`rtl`.
- החלוניות נפתחות מלמטה במובייל וממורכזות במחשב; כפתור הסגירה בקצה השמאלי
  וכפתור הפעולה הראשי בקצה הימני.
- הצ׳בון מצביע שמאלה — כיוון ה"קדימה" בממשק RTL.
- כל שגיאה טכנית מתורגמת לעברית לפני שהיא מוצגת (`src/lib/errors.ts`).
