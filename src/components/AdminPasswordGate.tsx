import { useState } from 'react'
import './AdminPanel.css'

/*
  הסיסמה נבדקת בצד הלקוח בלבד ולכן היא חסם נוחות, לא אבטחה — בדיוק כמו
  ב-ResetDialog. קבוע נפרד ולא משותף איתו, כדי לא לגעת בקובץ הקיים.
*/
const ADMIN_PASSWORD = 'שמעוני'

/** בלי תחילית 'kidush.' בכוונה — legacyStorage.ts מנקה כל מפתח כזה בכל טעינה. */
export const AUTH_KEY = 'control-auth'

interface Props {
  onSuccess: () => void
}

export function AdminPasswordGate({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (password.trim() !== ADMIN_PASSWORD) {
      setError('סיסמה שגויה')
      return
    }
    try {
      sessionStorage.setItem(AUTH_KEY, '1')
    } catch {
      // אחסון חסום — ההזדהות פשוט לא תישמר בין רענונים
    }
    onSuccess()
  }

  return (
    <div className="control-gate">
      <div className="control-gate__card dlg" dir="rtl">
        <header className="dlg__head">
          <div className="dlg__heading">
            <h1 className="dlg__title">שלום, הגעתם למערכת ניהול</h1>
            <p className="dlg__subtitle">בחסות משפחת שמעוני</p>
          </div>
        </header>

        <div className="dlg__body">
          <div className="field">
            <label className="field__label" htmlFor="control-password">
              אנא הקש סיסמא
            </label>
            <input
              id="control-password"
              className={`field__input${error ? ' field__input--invalid' : ''}`}
              type="password"
              dir="rtl"
              autoFocus
              autoComplete="off"
              value={password}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'control-password-error' : undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            {error && (
              <span className="field__error" id="control-password-error" role="alert">
                {error}
              </span>
            )}
          </div>
        </div>

        <footer className="dlg__foot">
          <button type="button" className="btn btn--primary" onClick={submit}>
            כניסה
          </button>
        </footer>
      </div>
    </div>
  )
}
