import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleUserRound, CreditCard, Heart, Instagram, Leaf, LockKeyhole, Menu, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, UserRound, X } from 'lucide-react'
import type { CartLine, Category, Product } from './catalog'
import { useStore } from './store'
import { supabase } from './supabase'

const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
const deliveryFor = (subtotal: number) => subtotal >= 100000 ? 0 : subtotal > 0 ? 5000 : 0
const stockLabel = (stock: number) => stock === 0 ? 'Out of Stock' : stock <= 5 ? `Only ${stock} left` : 'In Stock'
const stockClass = (stock: number) => stock === 0 ? 'stock-out' : stock <= 5 ? 'stock-low' : 'stock-ok'
const heroImage = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2200&q=90'

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`brand ${inverse ? 'brand-inverse' : ''}`} aria-label="LUMA HOME home">
    <svg className="brand-symbol" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M5 20 22 5l17 15v19H5z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M14 24v-6h6v6m5 0v-6h6v6" fill="none" stroke="var(--gold)" strokeWidth="2" />
      <path d="M24 37c1-9 7-15 15-18-1 9-5 15-15 18Zm0 0c-1-4-3-6-6-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
    <span className="brand-wording"><span className="brand-name">LUMA</span><span className="brand-home"><i />HOME<i /></span></span>
  </Link>
}

function Header() {
  const { cart, profile, configured } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const search = (e: FormEvent) => { e.preventDefault(); navigate(`/shop${searchText.trim() ? `?q=${encodeURIComponent(searchText.trim())}` : ''}`); setSearchOpen(false); setMobileOpen(false) }
  useEffect(() => { setMobileOpen(false); setSearchOpen(false) }, [location.pathname])
  return <>
    {!configured && <div className="preview-ribbon"><span><Sparkles size={14} /> Store preview</span><span>Connect Supabase to enable accounts, saved carts and checkout.</span></div>}
    <header className="site-header">
      <div className="header-main wrap">
        <button className="icon-button mobile-menu-toggle" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X /> : <Menu />}</button>
        <BrandMark />
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink><NavLink to="/shop">Shop</NavLink><NavLink to="/shop?sort=newest">New Arrivals</NavLink><NavLink to="/shop?view=collections">Collections</NavLink><NavLink to="/about">About</NavLink>
        </nav>
        <div className="header-actions">
          {searchOpen ? <form className="header-search" onSubmit={search}><label className="sr-only" htmlFor="header-search">Search pieces</label><input id="header-search" autoFocus placeholder="Search pieces" value={searchText} onChange={e => setSearchText(e.target.value)} /><button className="icon-button" aria-label="Submit search"><Search size={18} /></button></form> : <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={19} /></button>}
          <Link className="icon-button account-shortcut" to={configured && profile ? '/account' : '/login'} aria-label={profile ? 'My account' : 'Sign in'}><UserRound size={19} /></Link>
          <Link className="icon-button cart-shortcut" to="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={19} /><span className="cart-count">{count}</span></Link>
        </div>
      </div>
      {mobileOpen && <div className="mobile-menu"><nav aria-label="Mobile navigation"><NavLink to="/">Home</NavLink><NavLink to="/shop">Shop all</NavLink><NavLink to="/shop?sort=newest">New arrivals</NavLink><NavLink to="/shop?view=collections">Collections</NavLink><NavLink to="/about">About Luma</NavLink><NavLink to="/account">My account</NavLink></nav><form onSubmit={search} className="mobile-search"><input aria-label="Search products" placeholder="Search products" value={searchText} onChange={e => setSearchText(e.target.value)} /><button className="button button-dark">Search</button></form></div>}
    </header>
  </>
}

function Footer() {
  const { subscribe, setToast } = useStore()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); const result = await subscribe(email); setBusy(false)
    if (result.error) setToast(result.error); else { setEmail(''); setToast('You’re on the list. A little LUMA inspiration is headed your way.') }
  }
  return <footer className="site-footer">
    <div className="footer-newsletter wrap"><div><p className="eyebrow">A note from LUMA</p><h2>Make space for<br /><em>beautiful things.</em></h2><p>Sign up for new arrivals, styling inspiration and special offers.</p></div><form className="newsletter-form" onSubmit={submit}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} /><button type="submit" className="button button-gold" disabled={busy}>{busy ? 'Joining…' : 'Join LUMA'} <ArrowRight size={16} /></button><small>By subscribing, you agree to receive thoughtful notes from LUMA HOME.</small></form></div>
    <div className="footer-lower"><div className="wrap footer-grid"><div><BrandMark inverse /><p className="footer-tagline">Simple pieces. Beautiful spaces.</p></div><div><strong>Explore</strong><Link to="/shop">Shop all</Link><Link to="/shop?sort=newest">New arrivals</Link><Link to="/about">Our story</Link></div><div><strong>Help</strong><Link to="/account/orders">My orders</Link><Link to="/cart">Shopping bag</Link><a href="mailto:hello@lumahome.example">Contact us</a></div><div className="footer-social"><strong>Follow along</strong><a aria-label="LUMA HOME on Instagram" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={18} /> @luma.home</a><p>Thoughtful finds for the everyday home.</p></div></div><div className="wrap copyright"><span>© {new Date().getFullYear()} LUMA HOME · Fictional training project</span><span>Made for living well, every day.</span></div></div>
  </footer>
}

function Toast() {
  const { toast, setToast } = useStore()
  if (!toast) return null
  return <div role="status" aria-live="polite" className="toast"><CheckCircle2 size={18} /><span>{toast}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setToast('')}><X size={16} /></button></div>
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWishlist, wishlist, setToast, configured, user } = useStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const add = async () => {
    if (configured && !user) { setToast('Sign in to save a piece to your cart.'); navigate('/login'); return }
    setBusy(true); const result = await addToCart(product); setBusy(false)
    if (result.error) setToast(result.error); else setToast('Beautiful choice. Added to your cart.')
  }
  const favorite = async () => {
    if (configured && !user) { setToast('Sign in to save your favourites.'); navigate('/login'); return }
    const result = await toggleWishlist(product); if (result.error) setToast(result.error); else setToast(wishlist.includes(product.id) ? 'Removed from your wishlist.' : 'Saved to your wishlist.')
  }
  return <article className="product-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
    <div className="product-image-wrap"><Link to={`/products/${product.slug}`} aria-label={`View ${product.name}`}><img src={product.image_url} alt={`${product.name} in a warm, natural interior`} loading={index > 3 ? 'lazy' : 'eager'} /></Link><button className={`wishlist-button ${wishlist.includes(product.id) ? 'is-saved' : ''}`} aria-label={wishlist.includes(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={favorite}><Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /></button>{product.stock_quantity === 0 && <span className="product-overlay-label">Out of stock</span>}</div>
    <div className="product-info"><Link to={`/products/${product.slug}`} className="product-category">{product.category}</Link><Link to={`/products/${product.slug}`} className="product-title">{product.name}</Link><div className="product-meta"><strong>{money(product.price)}</strong><span className={stockClass(product.stock_quantity)}>{stockLabel(product.stock_quantity)}</span></div><button className="add-button" onClick={add} disabled={busy || product.stock_quantity === 0}>{busy ? 'Adding…' : 'Add to cart'} <Plus size={15} /></button></div>
  </article>
}

function ProductGrid({ products, limit }: { products: Product[]; limit?: number }) {
  const { loading } = useStore()
  const list = limit ? products.slice(0, limit) : products
  if (loading) return <div className="product-grid" aria-label="Loading pieces" aria-busy="true">{Array.from({length:4},(_,i)=><div className="product-skeleton" key={i}><span/><i/><i/><i/></div>)}</div>
  if (!list.length) return <EmptyState icon={<Search />} title="We couldn't find that piece." text="Try another search or explore our collections." action={<Link className="button button-dark" to="/shop">Explore the collection</Link>} />
  return <div className="product-grid">{list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
}

function StoreErrorState(){const{reload}=useStore();return <div className="store-error"><div className="empty-icon"><PackageCheck/></div><h2>Something went wrong.</h2><p>We couldn’t load the collection. Please try again.</p><button className="button button-outline" onClick={()=>void reload()}>Try again <ArrowRight size={15}/></button></div>}

function SectionHeading({ eyebrow, title, text, link }: { eyebrow: string; title: string; text?: string; link?: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{text && <p className="section-description">{text}</p>}</div>{link && <Link to={link} className="text-link">Shop all <ArrowRight size={16} /></Link>}</div>
}

function HomePage() {
  const { products, categories, catalogError } = useStore()
  if(catalogError)return <main className="page-main"><StoreErrorState/></main>
  const bySlug = (slug: string) => products.find(p => p.slug === slug)
  const newIds = ['lumi-table-lamp','luma-minimal-mirror','terra-botanical-art','haven-storage-basket']
  const bestIds = ['solis-throw-pillow','alba-ceramic-vase','luna-bedside-lamp','oakley-serving-tray']
  return <main>
    <section className="hero" style={{ backgroundImage: `url('${heroImage}')` }}><div className="hero-veil"></div><div className="wrap hero-content"><p className="eyebrow">Thoughtfully chosen for home</p><h1>Beautiful spaces begin with <em>simple pieces.</em></h1><p>Thoughtfully selected home décor designed to bring warmth, character and comfort into your everyday spaces.</p><div className="hero-actions"><Link className="button button-dark" to="/shop">Shop the collection <ArrowRight size={16} /></Link><Link className="button button-outline" to="/shop?sort=newest">Explore new arrivals</Link></div><div className="hero-note"><span /> Considered details, made for everyday living</div></div><span className="hero-index">01 / 04 — LIVING, SOFTER</span></section>
    <div className="promise-strip"><div><Leaf size={16} /> Thoughtfully selected</div><span></span><div><Truck size={17} /> Complimentary delivery over ₦100,000</div><span></span><div><ShieldCheck size={16} /> A little lovelier, every day</div></div>
    <section className="section wrap category-section"><SectionHeading eyebrow="Find your feeling" title="A room for every rhythm." text="Small changes, considered carefully, can make a space feel like yours." link="/shop" /><div className="category-grid">{categories.map((category, i) => <CategoryTile category={category} index={i} key={category.id} />)}</div></section>
    <section className="section section-soft"><div className="wrap"><SectionHeading eyebrow="Just arrived" title="New to LUMA." text="Fresh finds to bring a little warmth to the everyday." link="/shop?sort=newest" /><ProductGrid products={newIds.map(bySlug).filter((x): x is Product => !!x)} /></div></section>
    <BrandStatement />
    <section className="section wrap"><SectionHeading eyebrow="Loved at home" title="A few favourites." text="Pieces our customers keep coming back to." link="/shop?sort=featured" /><ProductGrid products={bestIds.map(bySlug).filter((x): x is Product => !!x)} /></section>
    <SpacesSection />
    <WhyLuma />
    <QuoteSection />
  </main>
}

function CategoryTile({ category, index }: { category: Category; index: number }) {
  return <Link className={`category-tile category-tile-${index + 1}`} to={`/collections/${category.slug}`}><img src={category.image_url} alt={`A considered ${category.name.toLowerCase()} interior`} loading="lazy" /><span className="tile-shade"></span><span className="category-copy"><small>COLLECTION 0{index + 1}</small><strong>{category.name}</strong><span>Explore <ArrowUpRight size={16} /></span></span></Link>
}

function BrandStatement() {
  return <section className="brand-statement"><div className="wrap statement-inner"><p className="eyebrow">The LUMA approach</p><h2>Your home doesn't need<br />more things. It needs<br /><em>the right things.</em></h2><div className="statement-rule"><span /><Leaf size={19} /><span /></div><p>We curate simple, beautiful pieces that work together naturally — so creating a space you love feels effortless.</p><Link to="/about" className="text-link">Get to know us <ArrowRight size={16} /></Link></div><div className="statement-side"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85" alt="A calm living room with natural materials" loading="lazy" /></div></section>
}

function SpacesSection() {
  const spaces = [
    ['Living room','living-room','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85'],
    ['Bedroom','bedroom','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=85'],
    ['Dining','dining','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85'],
    ['Home office','storage','https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85'],
    ['Entryway','wall-decor','https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=900&q=85'],
  ]
  return <section className="section spaces-section"><div className="wrap"><SectionHeading eyebrow="Made for your moments" title="Shop by space." text="Find the right finishing touch, wherever life happens." /><div className="spaces-row">{spaces.map(([name, slug, image]) => <Link to={`/collections/${slug}`} className="space-card" key={name}><img src={image} alt={`${name} interior`} loading="lazy" /><span>{name}<ArrowUpRight size={17} /></span></Link>)}</div></div></section>
}

function WhyLuma() {
  const points = [
    ['01','Thoughtfully selected','Pieces chosen with style and everyday living in mind.',<Leaf />],
    ['02','Beautiful design','Modern designs that complement your space.',<Sparkles />],
    ['03','Accessible prices','Beautiful doesn’t have to mean excessive.',<Heart />],
    ['04','Simple shopping','An easy experience from discovery to checkout.',<ShoppingBag />],
  ] as const
  return <section className="why-section"><div className="wrap"><SectionHeading eyebrow="The details matter" title="A little more thought, in every piece." /><div className="benefit-grid">{points.map(([num,title,text,icon]) => <article className="benefit-card" key={num}><div className="benefit-top"><span>{num}</span>{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
}

function QuoteSection() {
  return <section className="quote-section"><div className="wrap"><Leaf size={21} /><p>“The rooms we love are the ones that let us feel <em>at home.</em>”</p><span>A thought from LUMA</span></div></section>
}

function ShopPage({ categorySlug }: { categorySlug?: string }) {
  const { products, categories, catalogError } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = categorySlug ? categories.find(c => c.slug === categorySlug)?.id ?? '' : searchParams.get('category') ?? ''
  const [category, setCategory] = useState(initialCategory)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [available, setAvailable] = useState(false)
  const query = searchParams.get('q') ?? ''
  const sort = searchParams.get('sort') ?? 'featured'
  const view = searchParams.get('view') ?? 'products'
  useEffect(() => { setCategory(categorySlug ? categories.find(c => c.slug === categorySlug)?.id ?? '' : searchParams.get('category') ?? '') }, [categorySlug, categories, searchParams])
  const selectedCategory = categories.find(c => c.slug === categorySlug || c.id === category)
  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const term = query.trim().toLowerCase()
      const matchesQuery = !term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term)
      return matchesQuery && (!category || p.category_id === category || p.category.toLowerCase() === categories.find(c => c.id === category)?.name.toLowerCase()) && (!available || p.stock_quantity > 0) && (!minPrice || p.price >= Number(minPrice)) && (!maxPrice || p.price <= Number(maxPrice))
    })
    if (sort === 'newest') result = [...result].sort((a,b) => b.created_at.localeCompare(a.created_at))
    if (sort === 'low') result = [...result].sort((a,b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a,b) => b.price - a.price)
    if (sort === 'name') result = [...result].sort((a,b) => a.name.localeCompare(b.name))
    if (sort === 'featured') result = [...result].sort((a,b) => Number(b.featured) - Number(a.featured))
    return result
  }, [products, query, category, available, minPrice, maxPrice, sort, categories])
  const changeSort = (value: string) => { const next = new URLSearchParams(searchParams); next.set('sort', value); setSearchParams(next) }
  const clearFilters = () => { setCategory(''); setMinPrice(''); setMaxPrice(''); setAvailable(false); const next = new URLSearchParams(searchParams); next.delete('category'); setSearchParams(next) }
  return <main className="page-main">
    <div className="shop-hero"><div className="wrap"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><span>{selectedCategory?.name ?? 'Shop'}</span></div><p className="eyebrow">The LUMA edit</p><h1>{selectedCategory?.name ?? (query ? `Search for “${query}”` : view === 'collections' ? 'Collections' : 'Pieces for living well.')}</h1><p>{selectedCategory?.description ?? 'Thoughtful home décor for the everyday moments that make a house feel like home.'}</p></div></div>
    {view === 'collections' && !categorySlug && <div className="wrap collection-directory"><div className="category-grid">{categories.map((c,i) => <CategoryTile key={c.id} category={c} index={i} />)}</div></div>}
    {catalogError?<StoreErrorState/>:<div className="wrap shop-layout"><aside className="filters"><div className="filter-heading"><h2>Refine</h2><button className="filter-reset" onClick={clearFilters}>Clear all</button></div><label className="filter-label" htmlFor="filter-category">Category</label><select id="filter-category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select><div className="filter-label filter-label-spaced">Price range (₦)</div><div className="price-fields"><label><span className="sr-only">Minimum price</span><input type="number" min="0" placeholder="From" value={minPrice} onChange={e => setMinPrice(e.target.value)} /></label><span>—</span><label><span className="sr-only">Maximum price</span><input type="number" min="0" placeholder="To" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></label></div><label className="check-label"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} /><span>In stock only</span></label><div className="filter-note"><Leaf size={16} /> Considered pieces for the everyday home.</div></aside>
      <section className="shop-results"><div className="results-bar"><p><strong>{filtered.length}</strong> pieces{query && <span> for “{query}”</span>}</p><label>Sort by <select value={sort} onChange={e => changeSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name: A–Z</option></select></label></div><ProductGrid products={filtered} /></section></div>}
  </main>
}

function ProductPage() {
  const { slug } = useParams()
  const { products, categories, addToCart, toggleWishlist, wishlist, configured, user, loading, catalogError, setToast } = useStore()
  const navigate = useNavigate()
  const product = products.find(p => p.slug === slug)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setQuantity(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [slug])
  if (!product && loading) return <main className="page-main"><div className="loading-page"><span className="spinner"/> Finding your piece…</div></main>
  if (!product && catalogError) return <main className="page-main"><StoreErrorState/></main>
  if (!product) return <main className="page-main"><EmptyState icon={<Search />} title="That piece has moved on." text="Try another search or browse the full collection." action={<Link className="button button-dark" to="/shop">Explore the collection</Link>} /></main>
  const related = products.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0,4)
  const categoryPath = `/collections/${categories.find(c => c.id === product.category_id)?.slug ?? product.category_id}`
  const add = async () => {
    if (configured && !user) { navigate('/login'); setToast('Sign in to save a piece to your cart.'); return }
    setBusy(true); const res = await addToCart(product, quantity); setBusy(false); if (res.error) setToast(res.error); else setToast('Beautiful choice. Added to your cart.')
  }
  const favorite = async () => {
    if (configured && !user) { navigate('/login'); setToast('Sign in to save your favourites.'); return }
    const res = await toggleWishlist(product); if (res.error) setToast(res.error); else setToast(wishlist.includes(product.id) ? 'Removed from your wishlist.' : 'Saved to your wishlist.')
  }
  return <main className="page-main"><div className="wrap product-detail"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><Link to={categoryPath}>{product.category}</Link><ChevronRight size={14} /><span>{product.name}</span></div><div className="product-detail-grid"><div className="product-detail-photo"><img src={product.image_url} alt={`${product.name}, ${product.colour}`} /></div><div className="product-detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-description">{product.description}</p><p className={`detail-stock ${stockClass(product.stock_quantity)}`}><span />{stockLabel(product.stock_quantity)}</p><div className="detail-buy"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(v => Math.max(1,v-1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(v => Math.min(product.stock_quantity, v+1))} disabled={quantity >= product.stock_quantity}><Plus size={15} /></button></div><button className="button button-dark" onClick={add} disabled={busy || product.stock_quantity === 0}>{busy ? 'Adding…' : 'Add to cart'} <ShoppingBag size={17} /></button></div><button className={`detail-wishlist ${wishlist.includes(product.id) ? 'is-saved' : ''}`} onClick={favorite}><Heart size={17} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /> {wishlist.includes(product.id) ? 'Saved to wishlist' : 'Add to wishlist'}</button><div className="detail-divider" /><div className="product-attributes"><DetailRow label="Material" value={product.material} /><DetailRow label="Dimensions" value={product.dimensions} /><DetailRow label="Colour" value={product.colour} /><DetailRow label="Care" value={product.care_instructions} /></div><div className="detail-promise"><PackageCheck size={19} /><span>Carefully packed, ready for a new home.</span></div></div></div></div><section className="section section-soft"><div className="wrap"><SectionHeading eyebrow="A considered pairing" title="You may also like." link={categoryPath} /><ProductGrid products={related} /></div></section></main>
}

function DetailRow({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div> }

function CartPage() {
  const { cart, setQuantity, removeFromCart, setToast, configured, user, loading } = useStore()
  const subtotal = cart.reduce((sum,line) => sum + line.product.price * line.quantity,0)
  const delivery = deliveryFor(subtotal)
  const [busyId, setBusyId] = useState('')
  const update = async (line: CartLine, quantity: number) => { setBusyId(line.product_id); const result = await setQuantity(line.product_id, quantity); setBusyId(''); if (result.error) setToast(result.error) }
  if (loading) return <main className="page-main"><div className="loading-page"><span className="spinner"/> Gathering your bag…</div></main>
  if (cart.length === 0) return <main className="page-main"><EmptyState icon={<ShoppingBag />} title="Your cart is waiting for something beautiful." text="Take your time. The right piece is just around the corner." action={<Link className="button button-dark" to="/shop">Explore the collection <ArrowRight size={16} /></Link>} /></main>
  return <main className="page-main wrap cart-page"><div className="page-title-row"><div><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><span>Your bag</span></div><p className="eyebrow">A good choice</p><h1>Your shopping bag</h1></div><Link className="text-link" to="/shop"><ArrowLeft size={15} /> Continue shopping</Link></div><div className="cart-layout"><div className="cart-lines"><div className="cart-label-row"><span>Piece</span><span>Price</span><span>Quantity</span><span>Total</span></div>{cart.map(line => <article className="cart-line" key={line.product_id}><Link to={`/products/${line.product.slug}`} className="cart-line-image"><img src={line.product.image_url} alt={line.product.name} /></Link><div className="cart-line-product"><Link to={`/products/${line.product.slug}`}>{line.product.name}</Link><small>{line.product.category}</small><span className={stockClass(line.product.stock_quantity)}>{stockLabel(line.product.stock_quantity)}</span><button className="remove-link" onClick={() => void removeFromCart(line.product_id)}>Remove</button></div><span className="cart-line-price">{money(line.product.price)}</span><div className="quantity-control cart-quantity"><button aria-label={`Remove one ${line.product.name}`} disabled={busyId === line.product_id} onClick={() => void update(line,line.quantity-1)}><Minus size={14} /></button><span>{line.quantity}</span><button aria-label={`Add one ${line.product.name}`} disabled={busyId === line.product_id || line.quantity >= line.product.stock_quantity} onClick={() => void update(line,line.quantity+1)}><Plus size={14} /></button></div><strong className="cart-line-total">{money(line.product.price * line.quantity)}</strong></article>)}</div><aside className="order-summary"><p className="eyebrow">Your total</p><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>{delivery === 0 ? 'Complimentary' : money(delivery)}</span></div>{delivery > 0 && <p className="delivery-hint">Add {money(100000 - subtotal)} for complimentary delivery.</p>}<div className="summary-total"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div><Link to={configured && !user ? '/login' : '/checkout'} className="button button-dark button-full">Continue to checkout <ArrowRight size={16} /></Link><p className="secure-note"><LockKeyhole size={14} /> No payment is collected in this training project.</p><div className="summary-perks"><span><Truck size={15} /> Delivery is free over ₦100,000</span><span><ShieldCheck size={15} /> Secure, private account access</span></div></aside></div></main>
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{text}</p>{action}</div>
}

function AboutPage() {
  return <main className="page-main about-page"><section className="about-hero" style={{backgroundImage:`url('${heroImage}')`}}><div className="about-hero-overlay"></div><div className="wrap"><p className="eyebrow">A home, more you</p><h1>Simple pieces.<br /><em>Beautiful spaces.</em></h1></div></section><section className="section wrap about-copy"><div className="about-lead"><p className="eyebrow">Our little philosophy</p><h2>Thoughtful living, made <em>simple.</em></h2></div><div><p>LUMA HOME is a modern home décor brand created for the everyday spaces we return to. We believe a room doesn't need more things — it needs pieces chosen with care, that feel good to live with and easy to make your own.</p><p>Our edit brings together warm materials, calm shapes and considered details at accessible prices. Each piece is selected to work naturally with the things you already love.</p><Link to="/shop" className="button button-dark">Explore the collection <ArrowRight size={16} /></Link></div></section><section className="about-values"><div className="wrap"><div><Leaf /><h3>Warm by nature</h3><p>Natural textures and softer tones, selected to make a space feel calm.</p></div><div><Sparkles /><h3>Made to belong</h3><p>Pieces that work together without asking your home to become someone else's.</p></div><div><Heart /><h3>Everyday lovely</h3><p>Beautiful design can be approachable, useful and quietly special.</p></div></div></section></main>
}

function CheckoutPage() {
  const { cart, user, profile, configured, reload, loading } = useStore()
  const [step,setStep] = useState(1)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [placed,setPlaced] = useState(false)
  const [form,setForm] = useState({firstName:'',lastName:'',email:'',phone:'',address:'',city:'',state:'',country:'Nigeria'})
  useEffect(()=>{if(profile?.email&&!form.email)setForm(prev=>({...prev,email:profile.email}))},[profile?.email,form.email])
  const subtotal=cart.reduce((sum,line)=>sum+line.product.price*line.quantity,0), delivery=deliveryFor(subtotal)
  const change = (key: keyof typeof form, value: string) => setForm(prev=>({...prev,[key]:value}))
  const validStep = () => {
    if (step===1 && (!form.firstName.trim() || !form.lastName.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.phone.trim().length<6)) return 'Please complete your name, email and phone number.'
    if (step===2 && [form.address,form.city,form.state,form.country].some(v=>v.trim().length<2)) return 'Please complete all delivery details.'
    return ''
  }
  const next = () => { const message=validStep(); if(message){setError(message); return} setError(''); setStep(v=>Math.min(3,v+1)); window.scrollTo({top:0,behavior:'smooth'}) }
  const placeOrder = async () => {
    if (!supabase || !user || !configured) { setError('Connect Supabase and sign in to place an order.'); return }
    if (!cart.length || placed) return
    setBusy(true); setError('')
    const { data, error: rpcError } = await supabase.rpc('create_order', {
      p_customer_name: `${form.firstName.trim()} ${form.lastName.trim()}`, p_customer_email: form.email.trim(), p_phone: form.phone.trim(),
      p_delivery_address: form.address.trim(), p_city: form.city.trim(), p_state: form.state.trim(), p_country: form.country.trim(),
    })
    if (rpcError || !data?.id) { console.error('Order creation failed',rpcError); setError(rpcError?.message.includes('Only') ? rpcError.message : 'Something went wrong. We couldn’t complete that request. Please try again.'); setBusy(false); return }
    setPlaced(true)
    const { error: mailError } = await supabase.functions.invoke('order-confirmation', { body: { order_id: data.id } })
    if (mailError) console.error('Order saved, confirmation email could not be sent',mailError)
    await reload(); setBusy(false); window.location.assign(`/order-confirmation/${data.id}`)
  }
  if (loading) return <main className="page-main"><div className="loading-page"><span className="spinner"/> Preparing checkout…</div></main>
  if (configured && !user) return <main className="page-main"><EmptyState icon={<LockKeyhole />} title="Sign in to continue." text="Your cart and order history stay safely connected to your account." action={<Link className="button button-dark" to="/login">Sign in to your account</Link>} /></main>
  if (!cart.length && !placed) return <main className="page-main"><EmptyState icon={<ShoppingBag />} title="Your cart is waiting for something beautiful." text="Add a piece to your bag before checking out." action={<Link className="button button-dark" to="/shop">Explore the collection</Link>} /></main>
  return <main className="page-main checkout-page wrap"><div className="checkout-header"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><Link to="/cart">Your bag</Link><ChevronRight size={14} /><span>Checkout</span></div><p className="eyebrow">A few details, then we’ll take it from here</p><h1>Checkout</h1><div className="checkout-steps">{['Your details','Delivery','Review'].map((label,i)=><div className={step===i+1?'active':step>i+1?'complete':''} key={label}><span>{step>i+1?<Check size={15}/>:`0${i+1}`}</span>{label}</div>)}</div></div><div className="checkout-layout"><section className="checkout-form-panel">
    {step===1&&<div><h2>Customer information</h2><p>Where should we send your order updates?</p><div className="form-grid"><FormField label="First name" value={form.firstName} onChange={v=>change('firstName',v)} autoComplete="given-name" /><FormField label="Last name" value={form.lastName} onChange={v=>change('lastName',v)} autoComplete="family-name" /><FormField label="Email address" type="email" value={form.email || profile?.email || ''} onChange={v=>change('email',v)} autoComplete="email" /><FormField label="Phone number" type="tel" value={form.phone} onChange={v=>change('phone',v)} autoComplete="tel" /></div></div>}
    {step===2&&<div><h2>Delivery details</h2><p>Tell us where this little piece is going.</p><div className="form-grid"><FormField className="form-span" label="Street address" value={form.address} onChange={v=>change('address',v)} autoComplete="street-address" /><FormField label="City" value={form.city} onChange={v=>change('city',v)} autoComplete="address-level2" /><FormField label="State" value={form.state} onChange={v=>change('state',v)} autoComplete="address-level1" /><FormField label="Country" value={form.country} onChange={v=>change('country',v)} autoComplete="country-name" /></div></div>}
    {step===3&&<div><h2>Review your order</h2><p>Take a last look. We’ll save your order once you place it.</p><div className="review-items">{cart.map(line=><div className="review-line" key={line.product_id}><img src={line.product.image_url} alt="" /><div><strong>{line.product.name}</strong><span>Qty {line.quantity} · {money(line.product.price)} each</span></div><b>{money(line.product.price*line.quantity)}</b></div>)}</div><div className="delivery-address-review"><div><strong>Customer</strong><span>{form.firstName} {form.lastName}<br />{form.email} · {form.phone}</span></div><button onClick={()=>setStep(1)}>Edit</button><div><strong>Delivery to</strong><span>{form.address}<br />{form.city}, {form.state}, {form.country}</span></div><button onClick={()=>setStep(2)}>Edit</button></div></div>}
    {error&&<p className="form-error" role="alert">{error}</p>}{!configured&&<div className="inline-notice"><LockKeyhole size={17}/><span>Preview mode: connect Supabase to save your order and enable checkout.</span></div>}<div className="checkout-buttons">{step>1&&<button className="button button-outline" onClick={()=>setStep(v=>v-1)}><ArrowLeft size={16}/> Back</button>}{step<3?<button className="button button-dark" onClick={next}>Continue <ArrowRight size={16}/></button>:<button className="button button-dark" onClick={()=>void placeOrder()} disabled={!configured||busy||placed}>{busy?'Placing your order…':'Place order'} <ArrowRight size={16}/></button>}</div><small className="checkout-payment-note"><LockKeyhole size={13}/> No payment is taken. “Place order” records a training order.</small>
    </section><aside className="order-summary checkout-summary"><p className="eyebrow">{cart.length} {cart.length===1?'piece':'pieces'}</p><h2>Your order</h2>{cart.map(line=><div className="checkout-mini-item" key={line.product_id}><img src={line.product.image_url} alt=""/><div><strong>{line.product.name}</strong><span>Qty {line.quantity}</span></div><b>{money(line.product.price*line.quantity)}</b></div>)}<div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>{delivery===0?'Complimentary':money(delivery)}</span></div><div className="summary-total"><span>Total</span><strong>{money(subtotal+delivery)}</strong></div></aside></div></main>
}

function FormField({ label, value, onChange, type='text', autoComplete, className='' }: { label:string; value:string; onChange:(value:string)=>void; type?:string; autoComplete?:string; className?:string }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g,'-')}`
  return <label className={`form-field ${className}`} htmlFor={id}><span>{label}</span><input id={id} type={type} value={value} autoComplete={autoComplete} onChange={e=>onChange(e.target.value)} required /></label>
}

function LoginPage({ signup=false }: { signup?:boolean }) {
  const { signIn, signUp, signInGoogle, configured, setToast } = useStore()
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false)
  const navigate=useNavigate()
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');setBusy(true);const result=signup?await signUp(name,email,password):await signIn(email,password);setBusy(false);if(result.error)setError(result.error);else if(signup){setSent(true);setToast('Check your inbox to confirm your LUMA HOME account.')}else navigate('/account')}
  const google=async()=>{const result=await signInGoogle();if(result.error)setError(result.error)}
  return <main className="page-main auth-page"><div className="auth-art"><img src={heroImage} alt="Warm, light-filled home interior"/><div><BrandMark inverse/><p>Simple pieces.<br/><em>Beautiful spaces.</em></p></div></div><div className="auth-panel"><div className="auth-inner"><p className="eyebrow">Welcome to LUMA</p><h1>{signup?'Create your LUMA HOME account':'Welcome back'}</h1><p className="auth-lead">{signup?'Save your favourites and make your next thoughtful find feel effortless.':'Sign in to find your saved pieces and order updates.'}</p>{!configured&&<div className="inline-notice"><LockKeyhole size={16}/> Account features are ready when Supabase is connected.</div>}{sent?<div className="auth-success"><CheckCircle2/><h2>One last little step.</h2><p>We’ve sent a confirmation link to <strong>{email}</strong>. Open it to finish creating your account.</p><Link to="/login" className="text-link">Back to sign in <ArrowRight size={15}/></Link></div>:<><button className="google-button" onClick={()=>void google()} disabled={!configured||busy}><GoogleGlyph/> Continue with Google</button><div className="auth-divider"><span>or use your email</span></div><form onSubmit={submit} className="auth-form">{signup&&<FormField label="Your name" value={name} onChange={setName} autoComplete="name"/>}<FormField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email"/><FormField label="Password" type="password" value={password} onChange={setPassword} autoComplete={signup?'new-password':'current-password'}/>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-full" disabled={!configured||busy}>{busy?'Just a moment…':signup?'Create account':'Sign in'} <ArrowRight size={16}/></button></form></>}<p className="auth-switch">{signup?'Already have an account?':'New to LUMA?'} <Link to={signup?'/login':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p><p className="auth-privacy"><LockKeyhole size={13}/> Your password is handled securely by Supabase Auth.</p></div></div></main>
}
function GoogleGlyph(){return <svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.251-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.876 2.684-6.613Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.182l-2.909-2.258c-.806.54-1.835.86-3.047.86-2.344 0-4.328-1.583-5.038-3.71H.955v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.962 10.71A5.41 5.41 0 0 1 3.68 9c0-.594.102-1.172.282-1.71V4.96H.955A9 9 0 0 0 0 9c0 1.45.347 2.827.955 4.04l3.007-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.322 0 2.508.454 3.443 1.346l2.582-2.582C13.463.892 11.426 0 9 0A9 9 0 0 0 .955 4.96l3.007 2.33C4.672 5.163 6.656 3.58 9 3.58Z"/></svg>}

function AccountPage() {
  const { profile,user,configured,loading,signOut,updateProfile,setToast }=useStore()
  const [orders,setOrders]=useState<Array<Record<string,unknown>>>([])
  const [name,setName]=useState(profile?.name??'')
  const [saving,setSaving]=useState(false)
  const [loadingOrders,setLoadingOrders]=useState(true)
  useEffect(()=>{setName(profile?.name??'')},[profile?.name])
  useEffect(()=>{let live=true;const load=async()=>{if(!supabase||!user){setLoadingOrders(false);return}setLoadingOrders(true);const{data,error}=await supabase.from('orders').select('id,order_number,status,total,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(3);if(error)console.error(error);if(live)setOrders((data??[]) as Array<Record<string,unknown>>);setLoadingOrders(false)};void load();return()=>{live=false}},[user])
  const save=async(e:FormEvent)=>{e.preventDefault();setSaving(true);const result=await updateProfile(name);setSaving(false);setToast(result.error??'Your details have been updated.')}
  if(loading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Opening your account…</div></main>
  if(!configured)return <main className="page-main"><EmptyState icon={<UserRound/>} title="Your account, when you’re ready." text="Connect Supabase to create an account, save favourites and keep track of orders." action={<Link to="/shop" className="button button-dark">Browse the collection</Link>} /></main>
  if(!user)return <main className="page-main"><EmptyState icon={<LockKeyhole/>} title="Sign in to your account." text="Your LUMA HOME account keeps your details and orders together." action={<Link to="/login" className="button button-dark">Sign in</Link>} /></main>
  return <main className="page-main wrap account-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14}/><span>My account</span></div><div className="account-heading"><div><p className="eyebrow">Your LUMA HOME</p><h1>Hello{name?`, ${name.split(' ')[0]}`:''}.</h1><p>A little space to keep your details, favourites and orders.</p></div><button className="text-link" onClick={()=>void signOut()}>Sign out <ArrowRight size={16}/></button></div><div className="account-grid"><nav className="account-nav"><NavLink to="/account" end><UserRound size={17}/> Profile</NavLink><NavLink to="/account/orders"><PackageCheck size={17}/> My orders</NavLink><NavLink to="/account/wishlist"><Heart size={17}/> Wishlist</NavLink>{profile?.is_admin&&<NavLink to="/admin"><ShieldCheck size={17}/> Admin studio</NavLink>}</nav><div className="account-content"><section className="account-card"><div className="account-card-heading"><div><p className="eyebrow">A little about you</p><h2>Profile details</h2></div><CircleUserRound size={24}/></div><form className="profile-form" onSubmit={save}><FormField label="Name" value={name} onChange={setName} autoComplete="name"/><FormField label="Email address" type="email" value={profile?.email??user.email??''} onChange={()=>{}}/><p className="field-note">Email changes are managed through your sign-in provider.</p><button className="button button-dark" disabled={saving}>{saving?'Saving…':'Save changes'} <Check size={15}/></button></form></section><section className="account-card"><div className="account-card-heading"><div><p className="eyebrow">A little update</p><h2>Recent orders</h2></div><Link to="/account/orders" className="text-link">View all <ArrowRight size={15}/></Link></div>{loadingOrders?<LoadingRows/>:orders.length?<OrderTable orders={orders}/>:<div className="account-empty"><p>Your LUMA HOME journey starts here.</p><Link className="button button-outline" to="/shop">Start shopping <ArrowRight size={15}/></Link></div>}</section></div></div></main>
}

function LoadingRows(){return <div className="loading-list"><span/><span/><span/></div>}

function OrderTable({orders}: {orders:Array<Record<string,unknown>>}){
  return <div className="table-scroll"><table><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr></thead><tbody>{orders.map(o=><tr key={String(o.id)}><td><strong>{String(o.order_number)}</strong></td><td>{new Date(String(o.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</td><td><StatusPill status={String(o.status)}/></td><td>{money(Number(o.total))}</td><td><Link className="table-link" to={`/account/orders/${o.id}`}>View <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>
}
function StatusPill({status}:{status:string}){return <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>}

function OrdersPage(){
 const {user,configured,loading:sessionLoading}=useStore();const[orders,setOrders]=useState<Array<Record<string,unknown>>>([]);const[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;const load=async()=>{if(sessionLoading)return;if(!supabase||!user){setLoading(false);return}const{data,error}=await supabase.from('orders').select('id,order_number,status,total,created_at').eq('user_id',user.id).order('created_at',{ascending:false});if(error)console.error(error);if(active)setOrders((data??[]) as Array<Record<string,unknown>>);setLoading(false)};void load();return()=>{active=false}},[user,sessionLoading])
 if(sessionLoading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Finding your orders…</div></main>
 if(!configured||!user)return <main className="page-main"><EmptyState icon={<PackageCheck/>} title="Your LUMA HOME journey starts here." text="Sign in to keep all your order updates in one place." action={<Link className="button button-dark" to="/login">Sign in</Link>}/></main>
 return <AccountSubpage eyebrow="Made for you" title="My orders">{loading?<LoadingRows/>:orders.length?<OrderTable orders={orders}/>:<div className="account-empty"><p>Your LUMA HOME journey starts here.</p><Link className="button button-dark" to="/shop">Start shopping <ArrowRight size={15}/></Link></div>}</AccountSubpage>
}

function AccountSubpage({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}){const{profile,signOut}=useStore();return <main className="page-main wrap account-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14}/><Link to="/account">My account</Link><ChevronRight size={14}/><span>{title}</span></div><div className="account-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><button className="text-link" onClick={()=>void signOut()}>Sign out <ArrowRight size={16}/></button></div><div className="account-grid"><nav className="account-nav"><NavLink to="/account"><UserRound size={17}/> Profile</NavLink><NavLink to="/account/orders"><PackageCheck size={17}/> My orders</NavLink><NavLink to="/account/wishlist"><Heart size={17}/> Wishlist</NavLink>{profile?.is_admin&&<NavLink to="/admin"><ShieldCheck size={17}/> Admin studio</NavLink>}</nav><div className="account-content"><section className="account-card">{children}</section></div></div></main>}

function WishlistPage(){const{products,wishlist,configured,user,loading}=useStore();const items=products.filter(p=>wishlist.includes(p.id));if(loading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Gathering your favourites…</div></main>;if(!configured||!user)return <main className="page-main"><EmptyState icon={<Heart/>} title="Keep your favourites close." text="Sign in to save the pieces you love." action={<Link className="button button-dark" to="/login">Sign in</Link>}/></main>;return <AccountSubpage eyebrow="The pieces you love" title="Wishlist">{items.length?<ProductGrid products={items}/>:<div className="account-empty"><p>Your wishlist is ready for something beautiful.</p><Link className="button button-outline" to="/shop">Explore the collection <ArrowRight size={15}/></Link></div>}</AccountSubpage>}

function OrderConfirmationPage(){const{id}=useParams();const[order,setOrder]=useState<Record<string,unknown>|null>(null);const[items,setItems]=useState<Array<Record<string,unknown>>>([]);const[loading,setLoading]=useState(true);const{configured,user,loading:sessionLoading}=useStore()
 useEffect(()=>{let active=true;const load=async()=>{if(!supabase||!id||!user){setLoading(false);return}setLoading(true);const[{data,error},{data:lines,error:lineError}]=await Promise.all([supabase.from('orders').select('*').eq('id',id).maybeSingle(),supabase.from('order_items').select('*').eq('order_id',id)]);if(error||lineError)console.error(error??lineError);if(active){setOrder(data as Record<string,unknown>|null);setItems((lines??[]) as Array<Record<string,unknown>>);setLoading(false)}};void load();return()=>{active=false}},[id,user])
 if(loading||sessionLoading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Gathering your order details…</div></main>
 if(!configured||!order)return <main className="page-main"><EmptyState icon={<PackageCheck/>} title="Your order details are private." text="Sign in to view your order, or return to the collection." action={<Link className="button button-dark" to="/shop">Continue shopping</Link>}/></main>
 return <main className="page-main confirmation-page wrap"><div className="confirmation-icon"><Check size={26}/></div><p className="eyebrow">A lovely choice</p><h1>Order Confirmed <span>✦</span></h1><p className="confirmation-copy">Thank you for shopping with LUMA HOME. Your order has been received and is being prepared.</p><div className="confirmation-number"><span>Order number</span><strong>{String(order.order_number)}</strong><small>Placed {new Date(String(order.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</small></div><div className="confirmation-card"><div className="confirmation-customer"><div><span>Customer</span><strong>{String(order.customer_name)}</strong><small>{String(order.customer_email)}</small><small>{String(order.phone)}</small></div><div><span>Delivering to</span><strong>{String(order.delivery_address)}</strong><small>{String(order.city)}, {String(order.state)}</small><small>{String(order.country)}</small></div></div><div className="confirmation-items">{items.map(item=><div key={String(item.id)}><span>{String(item.product_name)} <small>× {String(item.quantity)}</small></span><strong>{money(Number(item.subtotal))}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><span>{money(Number(order.subtotal))}</span></div><div className="summary-line"><span>Delivery</span><span>{Number(order.delivery_fee)===0?'Complimentary':money(Number(order.delivery_fee))}</span></div><div className="summary-total"><span>Total</span><strong>{money(Number(order.total))}</strong></div><div className="confirmation-status"><StatusPill status={String(order.status)}/><span>We’ll keep your order updates in your account.</span></div></div><Link className="button button-dark" to="/shop">Continue shopping <ArrowRight size={16}/></Link><p className="confirmation-tagline">LUMA HOME · Simple pieces. Beautiful spaces.</p></main>
}

const nextOrderStatuses=(status:string)=>status==='Pending'?['Confirmed','Cancelled']:status==='Confirmed'?['Processing','Cancelled']:status==='Processing'?['Shipped','Cancelled']:status==='Shipped'?['Delivered']:[status]
function AdminShell({children}:{children:ReactNode}){
 const {profile,configured,user,loading}=useStore()
 if(loading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Opening the LUMA studio…</div></main>
 if(!configured||!user)return <main className="page-main"><EmptyState icon={<LockKeyhole/>} title="The LUMA studio is private." text="Connect Supabase and sign in with an assigned administrator account to continue." action={<Link to="/login" className="button button-dark">Sign in</Link>}/></main>
 if(!profile?.is_admin)return <main className="page-main"><EmptyState icon={<ShieldCheck/>} title="This space is for the LUMA team." text="Your account does not have administrator access." action={<Link to="/account" className="button button-outline">Return to your account</Link>}/></main>
 return <main className="page-main admin-page"><div className="admin-shell"><aside className="admin-sidebar"><BrandMark/><p className="eyebrow">Store studio</p><nav aria-label="Admin navigation"><NavLink to="/admin" end><ArrowUpRight size={16}/> Overview</NavLink><NavLink to="/admin/products"><ShoppingBag size={16}/> Products</NavLink><NavLink to="/admin/categories"><PackageCheck size={16}/> Categories</NavLink><NavLink to="/admin/orders"><Truck size={16}/> Orders</NavLink><NavLink to="/admin/customers"><UserRound size={16}/> Customers</NavLink></nav><Link to="/" className="admin-back"><ArrowLeft size={15}/> Back to storefront</Link></aside><section className="admin-workspace">{children}</section></div></main>
}

function AdminHome(){
 const{user,profile,loading:sessionLoading}=useStore()
 const[stats,setStats]=useState({products:0,orders:0,customers:0,revenue:0,low:0})
 const[recent,setRecent]=useState<Array<Record<string,unknown>>>([])
 const[loading,setLoading]=useState(true)
 useEffect(()=>{
  if(sessionLoading)return
  if(!supabase||!user||!profile?.is_admin){setLoading(false);return}
  const client=supabase
  let active=true
  const load=async()=>{
   setLoading(true)
   const[p,o,c,l,orders]=await Promise.all([
    client.from('products').select('id',{count:'exact',head:true}),
    client.from('orders').select('id',{count:'exact',head:true}),
    client.from('profiles').select('id',{count:'exact',head:true}),
    client.from('products').select('id',{count:'exact',head:true}).lte('stock_quantity',5).eq('is_active',true),
    client.from('orders').select('id,order_number,customer_name,created_at,total,status').order('created_at',{ascending:false}).limit(6),
   ])
   for(const result of[p,o,c,l,orders])if(result.error)console.error(result.error)
   const allOrdersRevenue=await client.from('orders').select('total').neq('status','Cancelled')
   if(allOrdersRevenue.error)console.error(allOrdersRevenue.error)
   const revenue=(allOrdersRevenue.data??[]).reduce((sum,row)=>sum+Number(row.total),0)
   if(active){setStats({products:p.count??0,orders:o.count??0,customers:c.count??0,revenue,low:l.count??0});setRecent((orders.data??[]) as Array<Record<string,unknown>>);setLoading(false)}
  }
  void load()
  return()=>{active=false}
 },[user,profile?.is_admin,sessionLoading])
 return <AdminShell><div className="admin-heading"><div><p className="eyebrow">The LUMA studio</p><h1>Good morning.</h1><p>Here’s a little look at the store today.</p></div><span className="admin-date">{new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'})}</span></div>{loading?<LoadingRows/>:<><div className="admin-metrics"><Metric label="Total products" value={String(stats.products)} icon={<ShoppingBag/>}/><Metric label="Total orders" value={String(stats.orders)} icon={<PackageCheck/>}/><Metric label="Customers" value={String(stats.customers)} icon={<UserRound/>}/><Metric label="Revenue" value={money(stats.revenue)} icon={<CreditCard/>}/></div><div className="admin-low-stock"><div><span className="low-dot"/><strong>{stats.low}</strong> low stock pieces</div><Link to="/admin/products">Review inventory <ArrowRight size={15}/></Link></div><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">A fresh look</p><h2>Recent orders</h2></div><Link to="/admin/orders" className="text-link">All orders <ArrowRight size={15}/></Link></div>{recent.length?<div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{recent.map(o=><tr key={String(o.id)}><td><strong>{String(o.order_number)}</strong></td><td>{String(o.customer_name)}</td><td>{new Date(String(o.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}</td><td>{money(Number(o.total))}</td><td><StatusPill status={String(o.status)}/></td><td><Link to={`/admin/orders/${o.id}`} className="table-link">View <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>:<p className="admin-empty">No orders to show just yet.</p>}</section></>}</AdminShell>
}
function Metric({label,value,icon}:{label:string;value:string;icon:ReactNode}){return <div className="metric-card"><div>{icon}</div><span>{label}</span><strong>{value}</strong></div>}

type ProductDraft={name:string;slug:string;category_id:string;description:string;price:string;stock_quantity:string;material:string;dimensions:string;colour:string;care_instructions:string;image_url:string;featured:boolean;is_active:boolean}
const emptyDraft:ProductDraft={name:'',slug:'',category_id:'',description:'',price:'',stock_quantity:'0',material:'',dimensions:'',colour:'',care_instructions:'',image_url:'',featured:false,is_active:true}
const slugify=(v:string)=>v.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
function AdminProducts(){
 const{adminProducts:products,categories,reload,setToast}=useStore();const[editing,setEditing]=useState<Product|null>(null);const[creating,setCreating]=useState(false);const[query,setQuery]=useState('');const[busy,setBusy]=useState(false);const[file,setFile]=useState<File|null>(null);const[draft,setDraft]=useState<ProductDraft>(emptyDraft)
 const openNew=()=>{setEditing(null);setCreating(true);setFile(null);setDraft({...emptyDraft,category_id:categories[0]?.id??''})}
 const openEdit=(p:Product)=>{setEditing(p);setCreating(true);setFile(null);setDraft({name:p.name,slug:p.slug,category_id:p.category_id,description:p.description,price:String(p.price),stock_quantity:String(p.stock_quantity),material:p.material,dimensions:p.dimensions,colour:p.colour,care_instructions:p.care_instructions,image_url:p.image_url,featured:p.featured,is_active:p.is_active})}
 const change=(key:keyof ProductDraft,value:string|boolean)=>setDraft(d=>({...d,[key]:value,...(key==='name'&&!editing?{slug:slugify(String(value))}:{})}))
 const save=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);let imageUrl=draft.image_url.trim();if(file){const path=`${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const upload=await supabase.storage.from('product-images').upload(path,file,{upsert:true,contentType:file.type});if(upload.error){console.error(upload.error);setToast('We could not upload that image. Check the product image bucket setup.');setBusy(false);return}imageUrl=supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl}
  const values={name:draft.name.trim(),slug:slugify(draft.slug||draft.name),category_id:draft.category_id,description:draft.description.trim(),price:Number(draft.price),stock_quantity:Number(draft.stock_quantity),material:draft.material.trim(),dimensions:draft.dimensions.trim(),colour:draft.colour.trim(),care_instructions:draft.care_instructions.trim(),image_url:imageUrl,featured:draft.featured,is_active:draft.is_active}
  const result=editing?await supabase.from('products').update(values).eq('id',editing.id):await supabase.from('products').insert(values)
  if(result.error){console.error(result.error);setToast('We could not save this product. Check the details and try again.')}else{setCreating(false);setToast(editing?'Product details updated.':'A new piece has been added.');await reload()}setBusy(false)
 }
 const deactivate=async(p:Product)=>{if(!supabase)return;const {error}=await supabase.from('products').update({is_active:false}).eq('id',p.id);if(error){console.error(error);setToast('We could not update that product.')}else{setToast('Product moved out of the active collection.');await reload()}}
 const filtered=products.filter(p=>`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
 return <AdminShell><div className="admin-heading"><div><p className="eyebrow">The assortment</p><h1>Products</h1><p>Keep each piece, price and available quantity up to date.</p></div><button className="button button-dark" onClick={openNew}><Plus size={16}/> Add a product</button></div>{creating&&<div className="admin-card admin-form-card"><div className="admin-card-heading"><div><p className="eyebrow">{editing?'Thoughtful adjustments':'A new find'}</p><h2>{editing?'Edit product':'Add a product'}</h2></div><button className="icon-button" aria-label="Close product form" onClick={()=>setCreating(false)}><X/></button></div><form className="admin-product-form" onSubmit={e=>void save(e)}><label className="form-field"><span>Product name</span><input required value={draft.name} onChange={e=>change('name',e.target.value)}/></label><label className="form-field"><span>URL slug</span><input required value={draft.slug} onChange={e=>change('slug',e.target.value)}/></label><label className="form-field"><span>Category</span><select required value={draft.category_id} onChange={e=>change('category_id',e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="form-field"><span>Price (₦)</span><input required min="0" type="number" value={draft.price} onChange={e=>change('price',e.target.value)}/></label><label className="form-field"><span>Stock quantity</span><input required min="0" type="number" value={draft.stock_quantity} onChange={e=>change('stock_quantity',e.target.value)}/></label><label className="form-field"><span>Material</span><input value={draft.material} onChange={e=>change('material',e.target.value)}/></label><label className="form-field"><span>Dimensions</span><input value={draft.dimensions} onChange={e=>change('dimensions',e.target.value)}/></label><label className="form-field"><span>Colour</span><input value={draft.colour} onChange={e=>change('colour',e.target.value)}/></label><label className="form-field form-span"><span>Description</span><textarea required rows={3} value={draft.description} onChange={e=>change('description',e.target.value)}/></label><label className="form-field form-span"><span>Care instructions</span><input value={draft.care_instructions} onChange={e=>change('care_instructions',e.target.value)}/></label><label className="form-field form-span"><span>Image URL</span><input value={draft.image_url} onChange={e=>change('image_url',e.target.value)} placeholder="https://…"/><small>Or select an image file to upload to Supabase Storage.</small></label><label className="form-field form-span"><span>Upload a product image</span><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><label className="check-label"><input type="checkbox" checked={draft.featured} onChange={e=>change('featured',e.target.checked)}/><span>Feature this piece</span></label><label className="check-label"><input type="checkbox" checked={draft.is_active} onChange={e=>change('is_active',e.target.checked)}/><span>Active in the shop</span></label><div className="form-span admin-form-actions"><button type="button" className="button button-outline" onClick={()=>setCreating(false)}>Cancel</button><button className="button button-dark" disabled={busy}>{busy?'Saving…':'Save product'} <Check size={15}/></button></div></form></div>}
 <div className="admin-card"><div className="admin-list-toolbar"><label className="admin-search"><Search size={17}/><input placeholder="Find a product" value={query} onChange={e=>setQuery(e.target.value)}/></label><span>{filtered.length} products</span></div><div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="admin-product-cell"><img src={p.image_url} alt=""/><div><strong>{p.name}</strong>{p.featured&&<small>Featured</small>}</div></div></td><td>{p.category}</td><td>{money(p.price)}</td><td><span className={stockClass(p.stock_quantity)}>{stockLabel(p.stock_quantity)}</span></td><td>{p.is_active?'Active':'Inactive'}</td><td><div className="table-actions"><button onClick={()=>openEdit(p)}>Edit</button>{p.is_active&&<button onClick={()=>void deactivate(p)}>Deactivate</button>}</div></td></tr>)}</tbody></table></div></div></AdminShell>
}

function AdminCategories(){const{categories,reload,setToast}=useStore();const[rows,setRows]=useState<Array<Category&{edited?:boolean}>>([]);const[busy,setBusy]=useState(false);const[adding,setAdding]=useState(false);const[form,setForm]=useState({name:'',slug:'',description:'',image_url:''});useEffect(()=>setRows(categories.map(c=>({...c}))),[categories]);const save=async(id:string)=>{if(!supabase)return;const row=rows.find(r=>r.id===id);if(!row)return;const{error}=await supabase.from('categories').update({name:row.name,slug:slugify(row.slug||row.name),description:row.description,image_url:row.image_url}).eq('id',id);if(error){console.error(error);setToast('We could not save that collection.')}else{setToast('Collection details updated.');await reload()}};const add=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);const{error}=await supabase.from('categories').insert({name:form.name,slug:slugify(form.slug||form.name),description:form.description,image_url:form.image_url});if(error){console.error(error);setToast('We could not add that collection.')}else{setForm({name:'',slug:'',description:'',image_url:''});setAdding(false);setToast('Collection added.');await reload()}setBusy(false)};return <AdminShell><div className="admin-heading"><div><p className="eyebrow">The store structure</p><h1>Categories</h1><p>Shape the collections that help people find their next favourite piece.</p></div><button className="button button-dark" onClick={()=>setAdding(v=>!v)}><Plus size={16}/> Add a category</button></div>{adding&&<form className="admin-card category-add-form" onSubmit={e=>void add(e)}><h2>New category</h2><div className="admin-form-grid"><FormField label="Category name" value={form.name} onChange={v=>setForm(f=>({...f,name:v,slug:slugify(v)}))}/><FormField label="Slug" value={form.slug} onChange={v=>setForm(f=>({...f,slug:v}))}/><FormField label="Image URL" value={form.image_url} onChange={v=>setForm(f=>({...f,image_url:v}))}/><FormField label="Short description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))}/></div><button className="button button-dark" disabled={busy}>{busy?'Saving…':'Save category'} <Check size={15}/></button></form>}<div className="admin-category-grid">{rows.map(c=><article className="admin-card category-edit-card" key={c.id}><img src={c.image_url} alt=""/><div className="category-edit-fields"><label className="form-field"><span>Name</span><input value={c.name} onChange={e=>setRows(v=>v.map(r=>r.id===c.id?{...r,name:e.target.value}:r))}/></label><label className="form-field"><span>Slug</span><input value={c.slug} onChange={e=>setRows(v=>v.map(r=>r.id===c.id?{...r,slug:e.target.value}:r))}/></label><label className="form-field"><span>Description</span><textarea rows={2} value={c.description} onChange={e=>setRows(v=>v.map(r=>r.id===c.id?{...r,description:e.target.value}:r))}/></label><label className="form-field"><span>Image URL</span><input value={c.image_url} onChange={e=>setRows(v=>v.map(r=>r.id===c.id?{...r,image_url:e.target.value}:r))}/></label><button className="button button-outline" onClick={()=>void save(c.id)}>Save changes <Check size={15}/></button></div></article>)}</div></AdminShell>}

function AdminOrders(){
 const{user,profile,loading:sessionLoading}=useStore()
 const[orders,setOrders]=useState<Array<Record<string,unknown>>>([])
 const[loading,setLoading]=useState(true)
 useEffect(()=>{
  if(sessionLoading)return
  if(!supabase||!user||!profile?.is_admin){setLoading(false);return}
  const client=supabase
  let active=true
  const load=async()=>{setLoading(true);const{data,error}=await client.from('orders').select('id,order_number,customer_name,customer_email,created_at,total,status').order('created_at',{ascending:false});if(error)console.error(error);if(active){setOrders((data??[]) as Array<Record<string,unknown>>);setLoading(false)}}
  void load();return()=>{active=false}
 },[user,profile?.is_admin,sessionLoading])
 return <AdminShell><div className="admin-heading"><div><p className="eyebrow">Every thoughtful delivery</p><h1>Orders</h1><p>Follow each order from a first hello to its new home.</p></div><span className="admin-heading-count">{orders.length} orders</span></div><div className="admin-card">{loading?<LoadingRows/>:orders.length?<div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{orders.map(o=><tr key={String(o.id)}><td><strong>{String(o.order_number)}</strong></td><td><span>{String(o.customer_name)}</span><small className="table-secondary">{String(o.customer_email)}</small></td><td>{new Date(String(o.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</td><td>{money(Number(o.total))}</td><td><StatusPill status={String(o.status)}/></td><td><Link to={`/admin/orders/${o.id}`} className="table-link">Open <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>:<p className="admin-empty">No orders to show just yet.</p>}</div></AdminShell>
}

function AdminOrderDetail(){const{id}=useParams();const[order,setOrder]=useState<Record<string,unknown>|null>(null);const[items,setItems]=useState<Array<Record<string,unknown>>>([]);const[loading,setLoading]=useState(true);const{setToast,user,profile,loading:sessionLoading}=useStore();useEffect(()=>{if(sessionLoading)return;if(!supabase||!id||!user||!profile?.is_admin){setLoading(false);return}const client=supabase;let active=true;const load=async()=>{setLoading(true);const[{data,error},{data:lines,error:lineError}]=await Promise.all([client.from('orders').select('*').eq('id',id).maybeSingle(),client.from('order_items').select('*').eq('order_id',id)]);if(error||lineError)console.error(error??lineError);if(active){setOrder(data as Record<string,unknown>|null);setItems((lines??[]) as Array<Record<string,unknown>>);setLoading(false)}};void load();return()=>{active=false}},[id,user,profile?.is_admin,sessionLoading]);const update=async(status:string)=>{if(!supabase||!id)return;const{error}=await supabase.from('orders').update({status}).eq('id',id);if(error){console.error(error);setToast('We could not update this order.')}else{setOrder(o=>o?{...o,status}:o);setToast(`Order status updated to ${status}.`)}};return <AdminShell><div className="admin-heading"><div><p className="eyebrow">Order details</p><h1>{loading?'Opening order…':String(order?.order_number??'Order not found')}</h1><p>Review the customer, delivery and pieces in this order.</p></div><Link to="/admin/orders" className="text-link"><ArrowLeft size={15}/> All orders</Link></div>{loading?<LoadingRows/>:!order?<p className="admin-empty">This order isn’t available.</p>:<div className="admin-order-grid"><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Current progress</p><h2>Status</h2></div><StatusPill status={String(order.status)}/></div><label className="form-field status-selector"><span>Update order status</span><select value={String(order.status)} onChange={e=>void update(e.target.value)}>{nextOrderStatuses(String(order.status)).map(s=><option key={s}>{s}</option>)}</select></label><h2 className="admin-subheading">Items</h2><div className="admin-order-items">{items.map(item=><div key={String(item.id)}><span>{String(item.product_name)} <small>× {String(item.quantity)}</small></span><strong>{money(Number(item.subtotal))}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><span>{money(Number(order.subtotal))}</span></div><div className="summary-line"><span>Delivery</span><span>{Number(order.delivery_fee)===0?'Complimentary':money(Number(order.delivery_fee))}</span></div><div className="summary-total"><span>Total</span><strong>{money(Number(order.total))}</strong></div></section><aside className="admin-card admin-customer-card"><p className="eyebrow">Customer</p><h2>{String(order.customer_name)}</h2><a href={`mailto:${String(order.customer_email)}`}>{String(order.customer_email)}</a><p>{String(order.phone)}</p><hr/><p className="eyebrow">Delivery address</p><p>{String(order.delivery_address)}<br/>{String(order.city)}, {String(order.state)}<br/>{String(order.country)}</p><hr/><p className="eyebrow">Placed</p><p>{new Date(String(order.created_at)).toLocaleString('en-NG')}</p></aside></div>}</AdminShell>}

function AdminCustomers(){
 const{user,profile,loading:sessionLoading}=useStore()
 const[customers,setCustomers]=useState<Array<Record<string,unknown>>>([])
 const[loading,setLoading]=useState(true)
 useEffect(()=>{
  if(sessionLoading)return
  if(!supabase||!user||!profile?.is_admin){setLoading(false);return}
  const client=supabase
  let active=true
  const load=async()=>{setLoading(true);const{data,error}=await client.from('profiles').select('id,name,email,auth_provider,created_at').order('created_at',{ascending:false});if(error)console.error(error);if(active){setCustomers((data??[]) as Array<Record<string,unknown>>);setLoading(false)}}
  void load();return()=>{active=false}
 },[user,profile?.is_admin,sessionLoading])
 return <AdminShell><div className="admin-heading"><div><p className="eyebrow">A growing community</p><h1>Customers</h1><p>People who have made a little room for LUMA.</p></div><span className="admin-heading-count">{customers.length} customers</span></div><div className="admin-card">{loading?<LoadingRows/>:customers.length?<div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Sign-in method</th></tr></thead><tbody>{customers.map(c=><tr key={String(c.id)}><td><strong>{String(c.name||'LUMA customer')}</strong></td><td>{String(c.email)}</td><td>{new Date(String(c.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</td><td>{String(c.auth_provider)}</td></tr>)}</tbody></table></div>:<p className="admin-empty">No customer accounts yet.</p>}</div></AdminShell>
}

function NotFound(){return <main className="page-main"><EmptyState icon={<Search/>} title="This page has wandered off." text="Let’s find something lovely instead." action={<Link className="button button-dark" to="/">Back home <ArrowRight size={15}/></Link>}/></main>}

export default function App(){
 const location=useLocation()
 const {products,categories}=useStore()
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant' as ScrollBehavior})},[location.pathname])
 useEffect(()=>{
  const slug=location.pathname.split('/').filter(Boolean).at(-1)
  const product=location.pathname.startsWith('/products/')?products.find(p=>p.slug===slug):undefined
  const category=location.pathname.startsWith('/collections/')?categories.find(c=>c.slug===slug):undefined
  const title=product?`${product.name} | LUMA HOME`:category?`${category.name} Décor | LUMA HOME`:location.pathname==='/shop'?'Shop Home Décor | LUMA HOME':location.pathname==='/about'?'About LUMA HOME | Simple pieces. Beautiful spaces.':location.pathname==='/login'?'Welcome back | LUMA HOME':location.pathname==='/signup'?'Create your LUMA HOME account':'LUMA HOME | Simple pieces. Beautiful spaces.'
  const description=product?product.description:category?category.description:'Thoughtfully selected home décor designed to bring warmth, character and comfort into your everyday spaces.'
  document.title=title
  document.querySelector('meta[name="description"]')?.setAttribute('content',description)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content',title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content',description)
 },[location.pathname,products,categories])
 return <><Header/><Routes><Route path="/" element={<HomePage/>}/><Route path="/shop" element={<ShopPage/>}/><Route path="/collections/:slug" element={<CollectionRoute/>}/><Route path="/products/:slug" element={<ProductPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<LoginPage signup/>}/><Route path="/account" element={<AccountPage/>}/><Route path="/account/orders" element={<OrdersPage/>}/><Route path="/account/orders/:id" element={<CustomerOrderDetail/>}/><Route path="/account/wishlist" element={<WishlistPage/>}/><Route path="/order-confirmation/:id" element={<OrderConfirmationPage/>}/><Route path="/admin" element={<AdminHome/>}/><Route path="/admin/products" element={<AdminProducts/>}/><Route path="/admin/categories" element={<AdminCategories/>}/><Route path="/admin/orders" element={<AdminOrders/>}/><Route path="/admin/orders/:id" element={<AdminOrderDetail/>}/><Route path="/admin/customers" element={<AdminCustomers/>}/><Route path="*" element={<NotFound/>}/></Routes><Footer/><Toast/></>
}
function CollectionRoute(){const{slug}=useParams();return <ShopPage categorySlug={slug}/>}
function CustomerOrderDetail(){
 const{id}=useParams()
 const{user,configured,loading:sessionLoading}=useStore()
 const[order,setOrder]=useState<Record<string,unknown>|null>(null)
 const[items,setItems]=useState<Array<Record<string,unknown>>>([])
 const[loading,setLoading]=useState(true)
 useEffect(()=>{
  if(sessionLoading)return
  if(!supabase||!user||!id){setLoading(false);return}
  const client=supabase
  let active=true
  const load=async()=>{setLoading(true);const[{data,error},{data:lines,error:lineError}]=await Promise.all([client.from('orders').select('*').eq('id',id).eq('user_id',user.id).maybeSingle(),client.from('order_items').select('*').eq('order_id',id)]);if(error||lineError)console.error(error??lineError);if(active){setOrder(data as Record<string,unknown>|null);setItems((lines??[]) as Array<Record<string,unknown>>);setLoading(false)}}
  void load();return()=>{active=false}
 },[id,user,sessionLoading])
 if(sessionLoading)return <main className="page-main"><div className="loading-page"><span className="spinner"/> Finding your order…</div></main>
 if(!configured||!user)return <main className="page-main"><EmptyState icon={<LockKeyhole/>} title="Sign in to view this order." text="Order details are only available to the account that placed them." action={<Link className="button button-dark" to="/login">Sign in</Link>}/></main>
 return <AccountSubpage eyebrow="A little more detail" title="Order details">{loading?<LoadingRows/>:!order?<p>This order is not available on your account.</p>:<div className="customer-order-detail"><div className="customer-order-top"><div><strong>{String(order.order_number)}</strong><span>{new Date(String(order.created_at)).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</span></div><StatusPill status={String(order.status)}/></div><div className="confirmation-items">{items.map(item=><div key={String(item.id)}><span>{String(item.product_name)} <small>× {String(item.quantity)} · {money(Number(item.unit_price))}</small></span><strong>{money(Number(item.subtotal))}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><span>{money(Number(order.subtotal))}</span></div><div className="summary-line"><span>Delivery</span><span>{Number(order.delivery_fee)===0?'Complimentary':money(Number(order.delivery_fee))}</span></div><div className="summary-total"><span>Total</span><strong>{money(Number(order.total))}</strong></div><div className="detail-address"><strong>Delivery address</strong><span>{String(order.delivery_address)}<br/>{String(order.city)}, {String(order.state)}, {String(order.country)}</span></div></div>}</AccountSubpage>
}
