'use client'

import { useState, useMemo } from 'react'
import type { ProductDto } from '@/types/product'
import ProductModal from './ProductModal'
import s from './CatalogPage.module.css'

export default function ProductCard({ product }: { product: ProductDto }) {
  const variants = product.variants ?? []
  const [selectedSku, setSelectedSku] = useState<string>(variants[0]?.sku ?? '')
  const [isOpen, setIsOpen] = useState(false)

  const selectedVariant = useMemo(
    () => variants.find((v) => v.sku === selectedSku),
    [variants, selectedSku]
  )

  const handleAddToCart = () => {
    if (!selectedVariant) return
    console.log('🛒 Добавлено в корзину:', {
      id: product.id,
      name: product.name,
      material: selectedVariant.material.name,
      price: selectedVariant.price,
    })
  }

  return (
    <>
      <div className={s.card} onClick={() => setIsOpen(true)}>
        <h3 className={s.productTitle}>{product.name}</h3>
        <p className={s.muted}>{product.category}</p>
        <p className={s.desc}>{product.description}</p>

        <div className={s.dimensions}>
          {product.width_mm}×{product.height_mm}×{product.depth_mm} мм
        </div>

        <div className={s.price}>
          {selectedVariant?.price.toLocaleString('ru-RU')} BYN
        </div>
      </div>

      {isOpen && (
        <ProductModal
          product={product}
          selectedSku={selectedSku}
          setSelectedSku={setSelectedSku}
          selectedVariant={selectedVariant}
          onClose={() => setIsOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  )
}
