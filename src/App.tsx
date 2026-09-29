import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { ShabbatTimes } from './components/ShabbatTimes'
import { ContributionPanel } from './components/ContributionPanel'
import { RegistrationDialog } from './components/RegistrationDialog'
import { AddItemDialog } from './components/AddItemDialog'
import { ResetDialog } from './components/ResetDialog'
import { Toast, type ToastMessage } from './components/Toast'
import { contributionsRepo } from './lib/contributionsRepo'
import { toHebrewError } from './lib/errors'
import type { Contribution } from './types'
import './App.css'

type DialogState =
  | { kind: 'none' }
  | { kind: 'item'; item: Contribution }
  | { kind: 'add' }
  | { kind: 'reset' }

export default function App() {
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
  }, [reloadKey])

  /* החלונית הפתוחה מתעדכנת בזמן אמת כשהנתונים משתנים */
  const openItem = useMemo(() => {
    if (dialog.kind !== 'item') return null
    return items.find((c) => c.id === dialog.item.id) ?? dialog.item
  }, [dialog, items])

  const closeDialog = useCallback(() => setDialog({ kind: 'none' }), [])

  const handleRegister = useCallback(
    async (id: string, familyName: string) => {
      try {
        await contributionsRepo.register(id, familyName)
        showToast(`${familyName} נרשמה בהצלחה. תודה!`, 'success')
      } catch (error) {
        const message = toHebrewError(error)
        showToast(message, 'error')
        throw new Error(message)
      }
    },
    [showToast],
  )

  const handleUnregister = useCallback(
    async (id: string, familyName: string) => {
      try {
        await contributionsRepo.unregister(id, familyName)
        showToast(`ההרשמה של ${familyName} בוטלה`, 'success')
      } catch (error) {
        showToast(toHebrewError(error), 'error')
      }
    },
    [showToast],
  )

  const handleAddCustom = useCallback(
    async (title: string, familyName: string) => {
      try {
        await contributionsRepo.addCustom(title, familyName)
        showToast(`${title} נוסף לרשימה על ידי ${familyName}`, 'success')
      } catch (error) {
        const message = toHebrewError(error)
        showToast(message, 'error')
        throw new Error(message)
      }
    },
    [showToast],
  )

  const handleReset = useCallback(async () => {
    try {
      await contributionsRepo.reset()
      showToast('הרשימה אופסה. כל ההרשמות נמחקו.', 'success')
    } catch (error) {
      const message = toHebrewError(error)
      showToast(message, 'error')
      throw new Error(message)
    }
  }, [showToast])

  return (
    <div className="app" dir="rtl">
      <main className="app__main">
        <Hero />
        <ShabbatTimes />
        <ContributionPanel
          items={items}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onOpenItem={(item) => setDialog({ kind: 'item', item })}
          onOpenOther={() => setDialog({ kind: 'add' })}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </main>

      <footer className="app__footer">
        {/* לחיצה כפולה על הברכה פותחת את חלונית האיפוס */}
        <p
          className="app__footer-title"
          onDoubleClick={() => setDialog({ kind: 'reset' })}
          title="לחיצה כפולה לאיפוס הרשימה"
        >
          שבת שלום ומבורכת
        </p>
        <p className="app__footer-text">תודה לכל המשפחות שלוקחות חלק בהכנת הקידוש.</p>
      </footer>

      <RegistrationDialog
        item={openItem}
        onClose={closeDialog}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
      />

      <AddItemDialog
        open={dialog.kind === 'add'}
        existingTitles={items.map((c) => c.title)}
        onClose={closeDialog}
        onAdd={handleAddCustom}
      />

      <ResetDialog open={dialog.kind === 'reset'} onClose={closeDialog} onConfirm={handleReset} />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
