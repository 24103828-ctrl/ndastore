export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            categories: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string | null
                    price: number
                    product_id: string | null
                    quantity: number
                    color: string | null
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    price: number
                    product_id?: string | null
                    quantity: number
                    color?: string | null
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    price?: number
                    product_id?: string | null
                    quantity?: number
                    color?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    address: string
                    created_at: string
                    full_name: string
                    id: string
                    payment_method: string | null
                    phone: string
                    status: string | null
                    total_amount: number
                    user_id: string | null
                }
                Insert: {
                    address: string
                    created_at?: string
                    full_name: string
                    id?: string
                    payment_method?: string | null
                    phone: string
                    status?: string | null
                    total_amount: number
                    user_id?: string | null
                }
                Update: {
                    address?: string
                    created_at?: string
                    full_name?: string
                    id?: string
                    payment_method?: string | null
                    phone?: string
                    status?: string | null
                    total_amount?: number
                    user_id?: string | null
                }
                Relationships: []
            }
            products: {
                Row: {
                    category_id: string | null
                    created_at: string
                    description: string | null
                    id: string
                    images: string[] | null
                    name: string
                    price: number
                    sale_price: number | null
                    stock: number | null
                    colors: string[] | null
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    images?: string[] | null
                    name: string
                    price: number
                    sale_price?: number | null
                    stock?: number | null
                    colors?: string[] | null
                }
                Update: {
                    category_id?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    images?: string[] | null
                    name?: string
                    price?: number
                    sale_price?: number | null
                    stock?: number | null
                    colors?: string[] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    address: string | null
                    avatar_url: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    phone: string | null
                    role: string | null
                }
                Insert: {
                    address?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    phone?: string | null
                    role?: string | null
                }
                Update: {
                    address?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    role?: string | null
                }
                Relationships: []
            }
            reviews: {
                Row: {
                    comment: string | null
                    created_at: string
                    id: string
                    product_id: string
                    rating: number
                    user_id: string
                    order_id: string
                }
                Insert: {
                    comment?: string | null
                    created_at?: string
                    id?: string
                    product_id: string
                    rating: number
                    user_id: string
                    order_id: string
                }
                Update: {
                    comment?: string | null
                    created_at?: string
                    id?: string
                    product_id?: string
                    rating?: number
                    user_id?: string
                    order_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            site_settings: {
                Row: {
                    id: string
                    key: string
                    value: any
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: any
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key: string
                    value?: any
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
