import type { Contribution } from '../types'

/**
 * מצב הפתיחה של המערכת: רשימת הפריטים בלבד, ללא שיוך למשפחות.
 * זהו גם המצב שאליו חוזרים אחרי איפוס.
 *
 * מספר המתנדבים הדרוש מופיע בפס ההתקדמות בלבד, ולכן הוא אינו חלק מהכותרת.
 */
export const initialContributions: Contribution[] = [
  { id: 'cakes',            title: 'עוגות',          icon: 'cake',       tint: 'pink',     quantityRequired: 4, registeredFamilies: [] },
  { id: 'cookies',          title: 'עוגיות',         icon: 'cookie',     tint: 'peach',    quantityRequired: 6, registeredFamilies: [] },
  { id: 'sweet-pastries',   title: 'מאפים מתוקים',   icon: 'croissant',  tint: 'lavender', quantityRequired: 4, registeredFamilies: [] },
  { id: 'savory-pastries',  title: 'מאפים מלוחים',   icon: 'muffin',     tint: 'teal',     quantityRequired: 4, registeredFamilies: [] },
  { id: 'snacks',           title: 'חטיפים + ופלים', icon: 'candy',      tint: 'pink',     quantityRequired: 4, registeredFamilies: [] },
  { id: 'cut-vegetables',   title: 'ירקות חתוכים',   icon: 'carrot',     tint: 'apricot',  quantityRequired: 3, registeredFamilies: [] },
  { id: 'cut-fruits',       title: 'פירות חתוכים',   icon: 'apple',      tint: 'pink',     quantityRequired: 3, registeredFamilies: [] },
  { id: 'kugel',            title: 'קיגל',           icon: 'kugel',      tint: 'lavender', quantityRequired: 3, registeredFamilies: [] },
  { id: 'iced-coffee',      title: 'קפה קר',         icon: 'icedCoffee', tint: 'pink',     quantityRequired: 3, registeredFamilies: [] },
  { id: 'iced-coffee',      title: '3 שתיה',         icon: 'icedCoffee', tint: 'teal',     quantityRequired: 4, registeredFamilies: [] },
]

/** גוונים מתחלפים לפריטים שמשפחות מוסיפות דרך כרטיס "אחר" */
export const customTints = ['pink', 'lavender', 'teal', 'apricot', 'peach'] as const
