import { useEffect, useState } from 'react'
import { fetchShabbatTimes, type ShabbatTimesData } from '../lib/shabbatTimes'
import { CandleIcon } from './icons/UiIcons'
import './ShabbatTimes.css'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: ShabbatTimesData }

const dayFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
  timeZone: 'Asia/Jerusalem',
})

const timeFormatter = new Intl.DateTimeFormat('he-IL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jerusalem',
})

export function ShabbatTimes() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    fetchShabbatTimes()
      .then((data) => {
        if (active) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <section className="shabbat shabbat--loading" aria-hidden>
        <div className="shabbat__card">
          <span className="sk" style={{ width: 46, height: 46, borderRadius: '50%', flex: 'none' }} />
          <span className="shabbat__body">
            <span className="sk sk--line sk--w60" />
            <span className="sk sk--line sk--w40" style={{ marginTop: 8 }} />
          </span>
        </div>
      </section>
    )
  }

  if (state.status === 'error') {
    return <p className="shabbat__fallback">לא ניתן לטעון כרגע את זמני השבת</p>
  }

  const { candleLighting, havdalah, parashaHebrew } = state.data

  return (
    <section className="shabbat" aria-label="זמני שבת בחיפה">
      <div className="shabbat__card">
        <span className="shabbat__icon" aria-hidden>
          <CandleIcon width={22} height={22} />
        </span>
        <div className="shabbat__body">
          <p className="shabbat__title">כניסת שבת בחיפה</p>
          {parashaHebrew && <p className="shabbat__parasha">{parashaHebrew}</p>}
          <p className="shabbat__row">
            <span>{dayFormatter.format(candleLighting)}</span>
            <span className="ltr-num">{timeFormatter.format(candleLighting)}</span>
          </p>
          {havdalah && (
            <p className="shabbat__row shabbat__row--havdalah">
              <span>צאת השבת</span>
              <span className="ltr-num">{timeFormatter.format(havdalah)}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
