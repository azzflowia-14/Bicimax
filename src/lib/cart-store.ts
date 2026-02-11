"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagen: string
  stock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "cantidad">) => void
  removeItem: (productoId: string) => void
  updateQuantity: (productoId: string, cantidad: number) => void
  clearCart: () => void
  getTotal: () => number
  getCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productoId === item.productoId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, cantidad: 1 }] }
        })
      },

      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productoId !== productoId),
        }))
      },

      updateQuantity: (productoId, cantidad) => {
        set((state) => ({
          items:
            cantidad <= 0
              ? state.items.filter((i) => i.productoId !== productoId)
              : state.items.map((i) =>
                  i.productoId === productoId
                    ? { ...i, cantidad: Math.min(cantidad, i.stock) }
                    : i
                ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.precio * item.cantidad,
          0
        )
      },

      getCount: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },
    }),
    { name: "bicimax-cart" }
  )
)
