import { dbDelete, dbPatch, dbPut } from './realtimeDb'
import type { FoodIconName, IconTint } from '../types'

const PATH = 'contributions'

export interface AdminItemInput {
  title: string
  icon: FoodIconName
  tint: IconTint
  quantityRequired: number
}

export async function updateItem(id: string, patch: Partial<AdminItemInput>): Promise<void> {
  await dbPatch(`${PATH}/${id}`, patch)
}

export async function addItem(input: AdminItemInput, order: number): Promise<void> {
  const id = `admin-${Date.now()}`
  await dbPut(`${PATH}/${id}`, { ...input, order, isCustom: false })
}

export async function deleteItem(id: string): Promise<void> {
  await dbDelete(`${PATH}/${id}`)
}
