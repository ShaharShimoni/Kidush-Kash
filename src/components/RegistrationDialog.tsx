import { useEffect, useMemo, useState } from 'react'
import type { Contribution } from '../types'
import { Modal } from './Modal'
import { ProgressBar } from './ProgressBar'
import { FoodIcon } from './icons/FoodIcons'
import { recordAmranAck } from '../lib/easterEgg'

interface Props {
  item: Contribution | null
  onClose: () => void
  onRegister: (id: string, familyName: string) => Promise<void>
  onUnregister: (id: string, familyName: string) => Promise<void>
}

export function RegistrationDialog({ item, onClose, onRegister, onUnregister }: Props) {
  const [familyName, setFamilyName] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [amranWarningOpen, setAmranWarningOpen] = useState(false)

  useEffect(() => {
    setFamilyName('')
    setTouched(false)
    setFormError(null)
    setIsSaving(false)
    setAmranWarningOpen(false)
  }, [item?.id])

  const filled = item?.registeredFamilies.length ?? 0
  const total = item?.quantityRequired ?? 0
  const isFull = filled >= total

  const validationError = useMemo(() => {
    const value = familyName.trim()
    if (value.length === 0) return 'יש להזין את שם המשפחה'
    if (value.length < 2) return 'שם המשפחה קצר מדי'
    if (value.length > 40) return 'שם המשפחה ארוך מדי'
    if (item?.registeredFamilies.some((f) => f === value || f === `משפחת ${value}`)) {
      return 'המשפחה כבר רשומה לפריט הזה'
    }
    return null
  }, [familyName, item])

  if (!item) return null

  const doRegister = async () => {
    setIsSaving(true)
    setFormError(null)
    try {
      const value = familyName.trim()
      await onRegister(item.id, value.startsWith('משפחת') ? value : `משפחת ${value}`)
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
      setIsSaving(false)
    }
  }

  const submit = async () => {
    setTouched(true)
    if (validationError) return
    const normalized = familyName.trim().replace(/^משפחת\s+/, '').trim()
    if (normalized === 'עמרן') {
      setAmranWarningOpen(true)
      return
    }
    await doRegister()
  }

  const showError = touched && validationError

  if (amranWarningOpen) {
    return (
      <Modal
        open
        title="אזהרה!"
        onClose={onClose}
        footer={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              recordAmranAck()
              setAmranWarningOpen(false)
              void doRegister()
            }}
          >
            אישור
          </button>
        }
      >
        <p className="reset-warning">
          זוהית כחבר מקלט ולא כחבר מניין, בבקשה ממך אל תביא קרקרים אתה לא כמו החברים שלך.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      title={item.title}
      subtitle={
        isFull
          ? 'הפריט הזה כבר מאויש במלואו. תודה לכל מי שנרשם!'
          : 'בחרו את הפריט ורשמו את שם המשפחה שלכם'
      }
      onClose={onClose}
      footer={
        /* בממשק RTL כפתור הפעולה הראשי יושב בקצה הימני */
        <>
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={isSaving || isFull}
          >
            {isSaving ? 'שומר...' : 'שמירה'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ביטול
          </button>
        </>
      }
    >
      <div className="dlg__meter">
        <span className={`row__icon row__icon--${item.tint}`} aria-hidden>
          <FoodIcon name={item.icon} width={26} height={26} />
        </span>
        <span className="dlg__meter-text">
          <span className="dlg__meter-title">מצב ההרשמה</span>
          <ProgressBar filled={filled} total={total} />
        </span>
        <span className="dlg__meter-count ltr-num" aria-hidden>
          {filled}/{total}
        </span>
      </div>

      <h3 className="dlg__section-title">משפחות שנרשמו</h3>
      {filled === 0 ? (
        <p className="dlg__empty">עדיין לא נרשמה אף משפחה. תוכלו להיות הראשונים!</p>
      ) : (
        <ul className="fam-list">
          {item.registeredFamilies.map((name) => (
            <li className="fam" key={name}>
              <span className="fam__avatar" aria-hidden>
                {name.replace('משפחת ', '').charAt(0)}
              </span>
              <span className="fam__name">{name}</span>
              <button
                type="button"
                className="fam__remove"
                aria-label={`ביטול ההרשמה של ${name}`}
                onClick={() => void onUnregister(item.id, name)}
              >
                ביטול הרשמה
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isFull && (
        <>
          <h3 className="dlg__section-title">הרשמה חדשה</h3>
          <div className="field">
            <label className="field__label" htmlFor="family-name">
              שם המשפחה
            </label>
            <input
              id="family-name"
              className={`field__input${showError ? ' field__input--invalid' : ''}`}
              type="text"
              inputMode="text"
              dir="rtl"
              placeholder="לדוגמה: כהן"
              autoComplete="family-name"
              value={familyName}
              aria-invalid={showError ? true : undefined}
              aria-describedby={showError ? 'family-name-error' : undefined}
              onChange={(e) => setFamilyName(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
            {showError && (
              <span className="field__error" id="family-name-error" role="alert">
                {validationError}
              </span>
            )}
          </div>
        </>
      )}

      {formError && (
        <p className="field__error" role="alert">
          {formError}
        </p>
      )}
    </Modal>
  )
}
