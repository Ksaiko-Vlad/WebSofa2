import type { CreateProductDto } from '@/server/validations/product'
import type { ProductVariantForAdmin, ProductVariantForUserDto } from './productvariants'

export interface ProductForUserDto extends Omit<CreateProductDto, 'materials'> {
  id: number
  variants: ProductVariantForUserDto[]
}

export interface Product {
  id: number
  name: string
  description: string
  category: string
  width_mm: number
  height_mm: number
  depth_mm: number
  active: boolean
  variants: ProductVariantForAdmin[]
}

export interface ProductModalProps {
  product: ProductForUserDto
  selectedSku: string
  setSelectedSku: (sku: string) => void
  selectedVariant?: ProductForUserDto['variants'][0]
  onAddToCart: () => void
  onClose: () => void
}