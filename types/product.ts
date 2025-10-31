import type { CreateProductDto } from '@/server/validations/product'

export interface ProductVariantDto {
  sku: string
  price: number
  material: {
    id?: number
    name: string
  }
}

export interface ProductDto extends Omit<CreateProductDto, 'materials'> {
  id: number
  variants: ProductVariantDto[]
}
