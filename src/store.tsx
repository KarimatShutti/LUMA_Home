import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { categorySeed, productSeed, type CartLine, type Category, type Product } from './catalog'
import { isConfigured, supabase } from './supabase'

export type Profile = { id: string; name: string; email: string; avatar_url: string | null; is_admin: boolean }
type Result = { error?: string }
type StoreContextType = {
  products: Product[]; adminProducts: Product[]; categories: Category[]; cart: CartLine[]; wishlist: string[]; profile: Profile | null
  user: User | null; loading: boolean; configured: boolean; catalogError: boolean; toast: string; setToast: (value: string) => void
  addToCart: (product: Product, quantity?: number) => Promise<Result>; setQuantity: (productId: string, quantity: number) => Promise<Result>
  removeFromCart: (productId: string) => Promise<void>; toggleWishlist: (product: Product) => Promise<Result>
  signIn: (email: string, password: string) => Promise<Result>; signUp: (name: string, email: string, password: string) => Promise<Result>
  signInGoogle: () => Promise<Result>; signOut: () => Promise<void>; updateProfile: (name: string) => Promise<Result>
  subscribe: (email: string) => Promise<Result>; reload: () => Promise<void>; clearCart: () => Promise<void>
}
const StoreContext = createContext<StoreContextType | null>(null)
const CART_KEY = 'luma-preview-cart'
const WISH_KEY = 'luma-preview-wishlist'
const readLocal = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}

function localCart(): CartLine[] {
  const saved = readLocal<Record<string, number>>(CART_KEY, {})
  return Object.entries(saved).map(([id, quantity]) => {
    const product = productSeed.find(p => p.id === id)
    return product ? { id: `preview-${id}`, product_id: id, quantity, product } : null
  }).filter((x): x is CartLine => Boolean(x))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(() => isConfigured ? [] : productSeed)
  const [adminProducts, setAdminProducts] = useState(() => isConfigured ? [] : productSeed)
  const [categories, setCategories] = useState(() => isConfigured ? [] : categorySeed)
  const [cart, setCart] = useState<CartLine[]>(() => localCart())
  const [wishlist, setWishlist] = useState<string[]>(() => readLocal(WISH_KEY, []))
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState(false)
  const [toast, setToast] = useState('')

  const loadCatalog = useCallback(async () => {
    if (!supabase) { setProducts(productSeed); setAdminProducts(productSeed); setCategories(categorySeed); setCatalogError(false); return }
    const [catResult, productResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])
    if (catResult.error) console.error('Category query failed', catResult.error)
    if (productResult.error) console.error('Product query failed', productResult.error)
    setCatalogError(Boolean(catResult.error || productResult.error))
    const cats = (catResult.data ?? []) as Category[]
    setCategories(cats)
    const mapped = ((productResult.data ?? []) as Omit<Product, 'category'>[]).map(p => ({ ...p, category: cats.find(c => c.id === p.category_id)?.name ?? 'Home' }))
    setAdminProducts(mapped)
    setProducts(mapped.filter(p => p.is_active))
  }, [])

  const loadUserData = useCallback(async (session: Session | null) => {
    const current = session?.user ?? null
    setUser(current)
    if (!supabase || !current) {
      setProfile(null)
      if (!isConfigured) { setCart(localCart()); setWishlist(readLocal(WISH_KEY, [])) }
      else { setCart([]); setWishlist([]) }
      return
    }
    const [profileRes, cartRes, wishesRes] = await Promise.all([
      supabase.from('profiles').select('id,name,email,avatar_url,is_admin').eq('id', current.id).maybeSingle(),
      supabase.rpc('ensure_my_cart'),
      supabase.from('wishlist_items').select('product_id').eq('user_id', current.id),
    ])
    if (profileRes.error) console.error('Profile query failed', profileRes.error)
    setProfile(profileRes.data as Profile | null)
    await loadCatalog()
    if (cartRes.error) console.error('Cart setup failed', cartRes.error)
    if (cartRes.data) {
      const lines = await supabase.from('cart_items').select('id,product_id,quantity,product:products(*)').eq('cart_id', cartRes.data)
      if (lines.error) console.error('Cart query failed', lines.error)
      const raw = (lines.data ?? []) as unknown as Array<{ id: string; product_id: string; quantity: number; product: Product }>
      const categoryMap = new Map((await supabase.from('categories').select('id,name')).data?.map(c => [c.id, c.name]))
      setCart(raw.filter(l => l.product).map(l => ({ ...l, product: { ...l.product, category: categoryMap.get(l.product.category_id) ?? 'Home' } })))
    }
    if (wishesRes.error) console.error('Wishlist query failed', wishesRes.error)
    setWishlist((wishesRes.data ?? []).map(x => x.product_id))
  }, [loadCatalog])

  const reload = useCallback(async () => { await loadCatalog(); if (supabase) { const { data } = await supabase.auth.getSession(); await loadUserData(data.session) } }, [loadCatalog, loadUserData])

  useEffect(() => {
    let alive = true
    const start = async () => {
      await loadCatalog()
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (alive) await loadUserData(data.session)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          queueMicrotask(() => { if (alive) void loadUserData(session) })
        })
        if (alive) setLoading(false)
        return () => listener.subscription.unsubscribe()
      }
      if (alive) setLoading(false)
    }
    let unsubscribe: (() => void) | undefined
    void start().then(cleanup => { unsubscribe = cleanup })
    return () => { alive = false; unsubscribe?.() }
  }, [loadCatalog, loadUserData])

  useEffect(() => { if (!isConfigured) localStorage.setItem(CART_KEY, JSON.stringify(Object.fromEntries(cart.map(l => [l.product_id, l.quantity])))) }, [cart])
  useEffect(() => { if (!isConfigured) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer) }, [toast])

  const addToCart = async (product: Product, quantity = 1): Promise<Result> => {
    if (product.stock_quantity < quantity) return { error: 'That quantity is not available.' }
    if (supabase && !user) return { error: 'Sign in to add pieces to your saved cart.' }
    if (!supabase) {
      setCart(prev => {
        const line = prev.find(l => l.product_id === product.id)
        const next = line ? prev.map(l => l.product_id === product.id ? { ...l, quantity: Math.min(product.stock_quantity, l.quantity + quantity) } : l) : [...prev, { id: `preview-${product.id}`, product_id: product.id, quantity, product }]
        return next
      })
      return {}
    }
    const { data: cartId, error: cartError } = await supabase.rpc('ensure_my_cart')
    if (cartError || !cartId) return { error: 'We could not update your cart. Please try again.' }
    const existing = cart.find(l => l.product_id === product.id)
    const newQuantity = (existing?.quantity ?? 0) + quantity
    if (newQuantity > product.stock_quantity) return { error: `Only ${product.stock_quantity} available.` }
    const result = existing
      ? await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', existing.id)
      : await supabase.from('cart_items').insert({ cart_id: cartId, product_id: product.id, quantity })
    if (result.error) return { error: result.error.message.includes('Only') ? result.error.message : 'We could not update your cart. Please try again.' }
    await reload()
    return {}
  }

  const setQuantity = async (productId: string, quantity: number): Promise<Result> => {
    const line = cart.find(l => l.product_id === productId)
    if (!line) return {}
    if (quantity <= 0) { await removeFromCart(productId); return {} }
    if (quantity > line.product.stock_quantity) return { error: `Only ${line.product.stock_quantity} available.` }
    if (!supabase) { setCart(prev => prev.map(l => l.product_id === productId ? { ...l, quantity } : l)); return {} }
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', line.id)
    if (error) return { error: 'We could not update your cart. Please try again.' }
    await reload(); return {}
  }

  const removeFromCart = async (productId: string) => {
    const line = cart.find(l => l.product_id === productId)
    if (supabase && line) {
      const { error } = await supabase.from('cart_items').delete().eq('id', line.id)
      if (error) { setToast('We could not update your cart. Please try again.'); return }
    }
    setCart(prev => prev.filter(l => l.product_id !== productId))
    if (supabase) await reload()
  }

  const clearCart = async () => {
    setCart([])
    if (!supabase) return
    const { data: cartId } = await supabase.rpc('ensure_my_cart')
    if (cartId) await supabase.from('cart_items').delete().eq('cart_id', cartId)
  }

  const toggleWishlist = async (product: Product): Promise<Result> => {
    if (supabase && !user) return { error: 'Sign in to save your favourites.' }
    const exists = wishlist.includes(product.id)
    if (!supabase) { setWishlist(prev => exists ? prev.filter(id => id !== product.id) : [...prev, product.id]); return {} }
    const result = exists
      ? await supabase.from('wishlist_items').delete().eq('user_id', user!.id).eq('product_id', product.id)
      : await supabase.from('wishlist_items').insert({ user_id: user!.id, product_id: product.id })
    if (result.error) return { error: 'We could not update your wishlist. Please try again.' }
    setWishlist(prev => exists ? prev.filter(id => id !== product.id) : [...prev, product.id])
    return {}
  }

  const signIn = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Add your Supabase settings to .env to enable accounts.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: 'Those details could not be verified. Please try again.' } : {}
  }
  const signUp = async (name: string, email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Add your Supabase settings to .env to enable accounts.' }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } })
    return error ? { error: error.message.includes('already') ? 'An account already exists for this email.' : 'We could not create your account. Please try again.' } : {}
  }
  const signInGoogle = async (): Promise<Result> => {
    if (!supabase) return { error: 'Add your Supabase settings to .env to enable Google sign-in.' }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account` } })
    return error ? { error: 'Google sign-in could not be started. Please try again.' } : {}
  }
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setUser(null); setProfile(null); setCart(isConfigured ? [] : localCart()) }
  const updateProfile = async (name: string): Promise<Result> => {
    if (!supabase || !user) return { error: 'Sign in to update your details.' }
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    if (error) return { error: 'We could not update your details. Please try again.' }
    setProfile(p => p ? { ...p, name: name.trim() } : p); return {}
  }
  const subscribe = async (email: string): Promise<Result> => {
    if (!supabase) return { error: 'Newsletter sign-up is available after Supabase is connected.' }
    const { error } = await supabase.rpc('submit_newsletter', { p_email: email })
    return error ? { error: error.message.includes('valid email') ? 'Please enter a valid email address.' : 'We could not add you just now. Please try again.' } : {}
  }

  const value = useMemo(() => ({ products, adminProducts, categories, cart, wishlist, profile, user, loading, configured: isConfigured, catalogError, toast, setToast, addToCart, setQuantity, removeFromCart, toggleWishlist, signIn, signUp, signInGoogle, signOut, updateProfile, subscribe, reload, clearCart }), [products,adminProducts,categories,cart,wishlist,profile,user,loading,catalogError,toast,reload])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
