import { useEffect, useMemo, useState } from 'react'
import type { Contribution, FoodIconName, IconTint } from '../types'
import type { AdminItemInput } from '../lib/adminRepo'
import { Modal } from './Modal'
import { FoodIcon } from './icons/FoodIcons'
import { CheckIcon } from './icons/UiIcons'
import './AdminPanel.css'

const ICON_OPTIONS: FoodIconName[] = [
  'cake',
  'cookie',
  'croissant',
  'muffin',
  'candy',
  'carrot',
  'apple',
  'kugel',
  'icedCoffee',
  'dish',
]

const ICON_LABELS: Record<FoodIconName, string> = {
  cake: 'עוגה',
  cookie: 'עוגייה',
  croissant: 'מאפה מתוק',
  muffin: 'מאפה מלוח',
  candy: 'חטיף',
  carrot: 'ירק',
  apple: 'פרי',
  kugel: 'קוגל',
  icedCoffee: 'קפה קר',
  dish: 'צלחת',
}

const TINT_OPTIONS: IconTint[] = ['pink', 'peach', 'apricot', 'lavender', 'teal']

const TINT_LABELS: Record<IconTint, string> = {
  pink: 'ורוד',
  peach: 'אפרסק',
  apricot: 'משמש',
  lavender: 'לבנדר',
  teal: 'טורקיז',
}

interface Props {
  open: boolean
  mode: 'add' | 'edit'
  item: Contribution | null
  existingTitles: string[]
  onClose: () => void
  onSubmit: (input: AdminItemInput) => Promise<void>
  onDelete?: () => Promise<void>
}

export function AdminItemDialog({
  open,
  mode,
  item,
  existingTitles,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<FoodIconName>('dish')
  const [tint, setTint] = useState<IconTint>('pink')
  const [quantity, setQuantity] = useState(1)
  const [touched, setTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? '')
    setIcon(item?.icon ?? 'dish')
    setTint(item?.tint ?? 'pink')
    setQuantity(item?.quantityRequired ?? 1)
    setTouched(false)
    setFormError(null)
    setIsSaving(false)
    setIsDeleting(false)
  }, [open, item])

  const titleError = useMemo(() => {
    const value = title.trim()
    if (value.length === 0) return 'יש להזין שם לפריט'
    if (value.length > 80) return 'שם הפריט ארוך מדי'
    const others = existingTitles.filter((t) => t !== item?.title)
    if (others.some((t) => t.trim() === value)) return 'פריט בשם הזה כבר קיים ברשימה'
    return null
  }, [title, existingTitles, item])

  const submit = async () => {
    setTouched(true)
    if (titleError) return
    setIsSaving(true)
    setFormError(null)
    try {
      await onSubmit({ title: title.trim(), icon, tint, quantityRequired: quantity })
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
      setIsSaving(false)
    }
  }

  const remove = async () => {
    if (!onDelete || !item) return
    if (!window.confirm(`למחוק את "${item.title}"? הפעולה בלתי הפיכה.`)) return
    setIsDeleting(true)
    setFormError(null)
    try {
      await onDelete()
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'הוספת פריט חדש' : 'עריכת פריט'}
      subtitle={mode === 'add' ? 'בחרו שם, אייקון, גוון וכמות דרושה' : undefined}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? 'שומר...' : 'שמירה'}
          </button>
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={remove}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? 'מוחק...' : 'מחיקה'}
            </button>
          )}
        </>
      }
    >
      <div className="field">
        <label className="field__label" htmlFor="admin-item-title">
          שם הפריט
        </label>
        <input
          id="admin-item-title"
          className={`field__input${touched && titleError ? ' field__input--invalid' : ''}`}
          type="text"
          dir="rtl"
          placeholder="לדוגמה: עוגות"
          value={title}
          aria-invalid={touched && titleError ? true : undefined}
          aria-describedby={touched && titleError ? 'admin-item-title-error' : undefined}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {touched && titleError && (
          <span className="field__error" id="admin-item-title-error" role="alert">
            {titleError}
          </span>
        )}
      </div>

      <div className="field">
        <span className="field__label">אייקון</span>
        <div className="icon-picker" role="radiogroup" aria-label="בחירת אייקון">
          {ICON_OPTIONS.map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={icon === name}
              aria-label={ICON_LABELS[name]}
              className={`icon-picker__btn${icon === name ? ' icon-picker__btn--selected' : ''}`}
              style={{
                background: `var(--t-${tint}-bg)`,
                color: `var(--t-${tint}-fg)`,
              }}
              onClick={() => setIcon(name)}
            >
              <FoodIcon name={name} width={22} height={22} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">גוון</span>
        <div className="tint-picker" role="radiogroup" aria-label="בחירת גוון">
          {TINT_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tint === t}
              aria-label={`גוון ${TINT_LABELS[t]}`}
              className={`tint-picker__swatch tint-picker__swatch--${t}${
                tint === t ? ' tint-picker__swatch--selected' : ''
              }`}
              onClick={() => setTint(t)}
            >
              {tint === t && <CheckIcon width={14} height={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="admin-item-qty">
          כמות דרושה
        </label>
        <input
          id="admin-item-qty"
          className="field__input ltr-num"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => {
            const n = Number(e.target.value)
            setQuantity(Number.isFinite(n) ? Math.min(50, Math.max(1, Math.round(n))) : 1)
          }}
        />
      </div>

      {formError && (
        <p className="field__error" role="alert">
          {formError}
        </p>
      )}
    </Modal>
  )
}
