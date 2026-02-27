"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { categories, type Category } from "@/lib/data"

interface CategoryContextType {
  selectedCategory: Category
  setSelectedCategory: (cat: Category) => void
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0])
  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error("useCategory must be used within CategoryProvider")
  return ctx
}
