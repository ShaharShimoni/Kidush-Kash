/**
 * זמני שבת עבור חיפה, דרך ה-REST API הציבורי של Hebcal (CORS פתוח, בלי מפתח).
 * בלי פרמטרי תאריך השרת מחזיר אוטומטית את השבת/החג הקרובים ביותר מהיום.
 */
const HAIFA_GEONAME_ID = 294801

interface HebcalItem {
  category: string
  date: string
  hebrew?: string
}

export interface ShabbatTimesData {
  candleLighting: Date
  havdalah: Date | null
  parashaHebrew: string | null
}

export async function fetchShabbatTimes(): Promise<ShabbatTimesData> {
  const res = await fetch(
    `https://www.hebcal.com/shabbat?cfg=json&geonameid=${HAIFA_GEONAME_ID}&M=on`,
  )
  if (!res.ok) throw new Error('hebcal-unavailable')
  const data = (await res.json()) as { items?: HebcalItem[] }
  const items = data.items ?? []

  const candles = items.find((it) => it.category === 'candles')
  if (!candles) throw new Error('hebcal-no-candles')

  const havdalah = items.find((it) => it.category === 'havdalah')
  const parasha = items.find((it) => it.category === 'parashat')

  return {
    candleLighting: new Date(candles.date),
    havdalah: havdalah ? new Date(havdalah.date) : null,
    parashaHebrew: parasha?.hebrew ?? null,
  }
}
