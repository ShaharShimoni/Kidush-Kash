import type { Contribution } from '../types'
import { FoodIcon } from './icons/FoodIcons'
import { TrashIcon } from './icons/UiIcons'

interface Props {
  item: Contribution
  onEdit: (item: Contribution) => void
  onQuantityChange: (item: Contribution, next: number) => void
  onDelete: (item: Contribution) => void
}

export function AdminItemRow({ item, onEdit, onQuantityChange, onDelete }: Props) {
  const filled = item.registeredFamilies.length
  const total = item.quantityRequired
  const families = filled > 0 ? item.registeredFamilies.join(', ') : 'אין נרשמים'

  return (
    <li className="admin-row">
      <button
        type="button"
        className="admin-row__main"
        onClick={() => onEdit(item)}
        aria-label={`עריכת ${item.title}`}
      >
        <span className={`row__icon row__icon--${item.tint}`} aria-hidden>
          <FoodIcon name={item.icon} width={28} height={28} />
        </span>
        <span className="row__text">
          <span className="row__title">{item.title}</span>
          <span className="row__families">{families}</span>
        </span>
      </button>

      <div className="admin-row__controls">
        <div className="qty-step" role="group" aria-label={`כמות דרושה עבור ${item.title}`}>
          <button
            type="button"
            className="qty-step__btn"
            onClick={() => onQuantityChange(item, Math.max(1, total - 1))}
            disabled={total <= 1}
            aria-label="הפחתת כמות"
          >
            −
          </button>
          <span className="qty-step__value ltr-num">{total}</span>
          <button
            type="button"
            className="qty-step__btn"
            onClick={() => onQuantityChange(item, Math.min(50, total + 1))}
            disabled={total >= 50}
            aria-label="הוספת כמות"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="admin-row__delete"
          onClick={() => onDelete(item)}
          aria-label={`מחיקת ${item.title}`}
        >
          <TrashIcon width={18} height={18} />
        </button>
      </div>
    </li>
  )
}
