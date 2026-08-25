export interface Category {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string
  category_name?: string
  name: string
  description?: string
  price_cop: number
  image_url?: string
  is_available: boolean
  allow_dine_in: boolean
  allow_takeaway: boolean
  is_active?: boolean
}

export interface CafeTable {
  id: string
  name: string
  number: number
  public_code: string
  status: string
  is_active: boolean
  qr_url?: string
  active_order?: any
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  public_code: string
  customer_name: string
  table_id?: string
  table_number?: number
  table_name?: string
  order_type: string
  status: string
  subtotal_cop: number
  total_cop: number
  created_at: string
  paid_at?: string
  delivered_at?: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  product_id?: string
  product_name: string
  unit_price_cop: number
  quantity: number
  subtotal_cop: number
}
