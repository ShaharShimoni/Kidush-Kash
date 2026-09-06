import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminPasswordGate, AUTH_KEY } from './components/AdminPasswordGate'
import { AdminItemRow } from './components/AdminItemRow'
import { AdminItemDialog } from './components/AdminItemDialog'
import { Toast, type ToastMessage } from './components/Toast'
import { CupcakeIcon, PlusIcon } from './components/icons/UiIcons'
import { contributionsRepo } from './lib/contributionsRepo'
import * as adminRepo from './lib/adminRepo'
import type { AdminItemInput } from './lib/adminRepo'
import { toHebrewError } from './lib/errors'
import type { Contribution } from './types'
import './components/AdminPanel.css'

type DialogState = { kind: 'none' } | { kind: 'edit'; item: Contribution } | { kind: 'add' }

function readInitialAuth(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export default function ControlApp() {
  const [authorized, setAuthorized] = useState(readInitialAuth)
  const [items, setItems] = useState<Contribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' })
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const toastId = useRef(0)

  const showToast = useCallback((text: string, tone: ToastMessage['tone']) => {
    toastId.current += 1
    setToast({ id: toastId.current, text, tone })
  }, [])

  useEffect(() => {
    if (!authorized) return
    setIsLoading(true)
    setErrorMessage(null)

    const unsubscribe = contributionsRepo.subscribe(
      (next) => {
        setItems(next)
        setIsLoading(false)
      },
      (error) => {
        setErrorMessage(toHebrewError(error))
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [authorized, reloadKey])

  const closeDialog = useCallback(() => setDialog({ kind: 'none' }), [])

  const deleteItemWithToast = useCallback(
    async (item: Contribution) => {
      try {
        await adminRepo.deleteItem(item.id)
        showToast(`"${item.title}" נמחק`, 'success')
      } catch (error) {
        const message = toHebrewError(error)
        showToast(message, 'error')
        throw new Error(message)
      }
    },
    [showToast],
  )

  const handleRowDelete = useCallback(
    (item: Contribution) => {
      if (!window.confirm(`למחוק את "${item.title}"? הפעולה בלתי הפיכה.`)) return
      deleteItemWithToast(item).catch(() => {
        /* השגיאה כבר הוצגה ב-toast */
      })
    },
    [deleteItemWithToast],
  )

  const handleQuantityStep = useCallback(
    async (item: Contribution, next: number) => {
      try {
        await adminRepo.updateItem(item.id, { quantityRequired: next })
      } catch (error) {
        showToast(toHebrewError(error), 'error')
      }
    },
    [showToast],
  )

  const handleUpdateItem = useCallback(
    async (id: string, input: AdminItemInput) => {
      try {
        await adminRepo.updateItem(id, input)
        showToast(`"${input.title}" עודכן`, 'success')
      } catch (error) {
        const message = toHebrewError(error)
        showToast(message, 'error')
        throw new Error(message)
      }
    },
    [showToast],
  )

  const handleAddItem = useCallback(
    async (input: AdminItemInput) => {
      try {
        const order = items.reduce((max, it) => Math.max(max, it.order ?? 0), 0) + 1
        await adminRepo.addItem(input, order)
        showToast(`"${input.title}" נוסף לרשימה`, 'success')
      } catch (error) {
        const message = toHebrewError(error)
        showToast(message, 'error')
        throw new Error(message)
      }
    },
    [items, showToast],
  )

  if (!authorized) {
    return <AdminPasswordGate onSuccess={() => setAuthorized(true)} />
  }

  return (
    <div className="control-page" dir="rtl">
      <header className="control-header">
        <p className="control-header__pill">
          <CupcakeIcon width={14} height={14} />
          מערכת ניהול
        </p>
        <h1 className="control-header__title">ניהול רשימת הפריטים</h1>
        <p className="control-header__subtitle">בחסות משפחת שמעוני</p>
      </header>

      {errorMessage ? (
        <div className="panel__state panel__state--error" role="alert">
          <p className="panel__state-title">{errorMessage}</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            נסו שוב
          </button>
        </div>
      ) : isLoading ? (
        <p className="panel__loading" role="status">
          טוען את רשימת הפריטים...
        </p>
      ) : (
        <ul className="control-list">
          {items.map((item) => (
            <AdminItemRow
              key={item.id}
              item={item}
              onEdit={(it) => setDialog({ kind: 'edit', item: it })}
              onQuantityChange={(it, next) => void handleQuantityStep(it, next)}
              onDelete={handleRowDelete}
            />
          ))}

          <li className="admin-add">
            <button
              type="button"
              className="admin-add__btn"
              onClick={() => setDialog({ kind: 'add' })}
            >
              <span className="row__icon row__icon--add" aria-hidden>
                <PlusIcon width={24} height={24} />
              </span>
              <span className="row__text">
                <span className="row__title">הוספת פריט</span>
                <span className="row__families">פריט חדש שאינו ברשימה</span>
              </span>
            </button>
          </li>
        </ul>
      )}

      <AdminItemDialog
        open={dialog.kind === 'edit' || dialog.kind === 'add'}
        mode={dialog.kind === 'edit' ? 'edit' : 'add'}
        item={dialog.kind === 'edit' ? dialog.item : null}
        existingTitles={items.map((c) => c.title)}
        onClose={closeDialog}
        onSubmit={
          dialog.kind === 'edit'
            ? (input) => handleUpdateItem(dialog.item.id, input)
            : handleAddItem
        }
        onDelete={dialog.kind === 'edit' ? () => deleteItemWithToast(dialog.item) : undefined}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
