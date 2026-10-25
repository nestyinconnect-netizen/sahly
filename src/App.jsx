import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Baby, BadgeCheck, Banknote, Check, ChevronDown,
  CircleCheck, Heart, IndianRupee, MapPin, Menu, PackageCheck,
  Search, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react'
import products from './data/products'

const categories = ['All', 'Strollers', 'Toys', 'High Chairs', 'Carriers', 'Travel', 'Other']
const areas = ['Bengaluru', 'HSR Layout', 'Koramangala', 'Bellandur', 'Indiranagar', 'Whitefield']

const money = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0))
const getRoute = () => {
  const [page, id] = (window.location.hash.replace(/^#\/?/, '') || 'home').split('/')
  return { page, id }
}

async function postSubmission(payload) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  let data = {}
  try { data = await response.json() } catch { /* non-json body */ }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'We couldn’t send your request. Please try again.')
  }
  return data
}

async function postRentMessage(payload) {
  const response = await fetch('https://sahly.nestyinconnect.workers.dev/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
  })
  let data = {}
  try { data = await response.json() } catch { /* non-json body */ }
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }
  return data
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const update = () => { setRoute(getRoute()); setMenuOpen(false); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = (page) => { window.location.hash = page }
  return <div className="app-shell">
    <Header navigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    <main>
      {route.page === 'home' && <Home products={products} navigate={navigate} />}
      {route.page === 'browse' && <Browse products={products} navigate={navigate} />}
      {route.page === 'product' && <ProductDetail product={products.find((item) => item.id === route.id)} navigate={navigate} />}
      {route.page === 'sell' && <ListProduct navigate={navigate} />}
      {route.page === 'contact' && <ContactPage />}
      {!['home', 'browse', 'product', 'sell', 'contact'].includes(route.page) && <NotFound navigate={navigate} />}
    </main>
    <Footer navigate={navigate} />
  </div>
}

function Header({ navigate, menuOpen, setMenuOpen }) {
  return <header className="site-header">
    <button className="brand" onClick={() => navigate('home')} aria-label="Sahly home"><span className="brand-mark"><Baby /></span><span>Sahly</span></button>
    <nav className={menuOpen ? 'main-nav open' : 'main-nav'}><button onClick={() => navigate('browse')}>Browse</button><button onClick={() => navigate('sell')}>Sell</button><button onClick={() => navigate('contact')}>Contact</button></nav>
    <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
  </header>
}

function Home({ products, navigate }) {
  return <>
    <section className="hero">
      <div className="hero-copy reveal"><div className="eyebrow"><Sparkles /> Baby products deserve a second story</div><h1>Your baby outgrew it.<br /><em>Someone else’s</em> baby needs it.</h1><p>Buy, sell or rent trusted, pre-loved baby products from parents near you.</p><div className="hero-actions"><button className="button primary" onClick={() => navigate('browse')}>Browse products <ArrowRight /></button><button className="button secondary" onClick={() => navigate('sell')}>Sell your product</button></div></div>
      <div className="hero-visual reveal delay-one"><img src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=85" alt="A joyful collection of children's toys" /><div className="floating-note top"><BadgeCheck /> Parent-listed, platform-verified</div><div className="floating-note bottom"><span>Up to</span><strong>60% less</strong><span>than buying new</span></div></div>
    </section>
    <section className="trust-strip"><TrustItem icon={<Banknote />} title="Save money" text="Quality for less" /><TrustItem icon={<ShieldCheck />} title="Verified products" text="Checked with care" /><TrustItem icon={<MapPin />} title="Local transactions" text="Find products nearby" /><TrustItem icon={<Sparkles />} title="Earn from clutter" text="Turn outgrown into income" /></section>
    <section className="section recent-section"><SectionHeading eyebrow="Fresh finds" title="Recently listed" action={products.length ? () => navigate('browse') : null} />{products.length ? <div className="product-grid">{products.slice(0, 3).map((item) => <ProductCard key={item.id} product={item} navigate={navigate} />)}</div> : <div className="empty-listings"><div className="empty-art"><PackageCheck /></div><div><h3>The first finds are on their way</h3><p>Every listing is reviewed before it appears here. Have something ready for its next family?</p></div><button className="button dark" onClick={() => navigate('sell')}>List a product</button></div>}</section>
    <section className="how-it-works"><SectionHeading eyebrow="Simple by design" title="Good things, kept in motion." /><div className="steps"><Step number="01" icon={<Search />} title="Find a trusted product" text="Search by what you need, where you live, and whether you want to buy or rent." /><Step number="02" icon={<BadgeCheck />} title="Check every detail" text="See condition, usage, age, photos, and verification before you enquire." /><Step number="03" icon={<Heart />} title="Give it a second story" text="Send a request. We connect you with the parent and help take it from there." /></div></section>
    <section className="cta-band"><div><span className="eyebrow light">Clear the cupboard</span><h2>Outgrown doesn’t mean<br />out of use.</h2></div><button className="button cream" onClick={() => navigate('sell')}>Start selling <ArrowRight /></button></section>
  </>
}

function TrustItem({ icon, title, text }) { return <div>{icon}<span><strong>{title}</strong>{text}</span></div> }
function Step({ number, icon, title, text }) { return <article><span>{number}</span>{icon}<h3>{title}</h3><p>{text}</p></article> }
function SectionHeading({ eyebrow, title, action }) { return <div className="section-heading"><div><span className="eyebrow plain">{eyebrow}</span><h2>{title}</h2></div>{action && <button className="text-link" onClick={action}>View all <ArrowRight /></button>}</div> }

function threeMonthPlan(product) { return product.advert?.plans.find((plan) => plan.highlight) }

function ProductCard({ product, navigate }) {
  return <article className="product-card" onClick={() => navigate(`product/${product.id}`)}><div className="product-image">{product.image ? <img src={product.image} alt={product.title} /> : <div className="image-placeholder"><Baby /></div>}{!product.reused && <span className="new-tag">Brand new · Not reused</span>}<span className="verified-pill"><BadgeCheck /> Verified</span></div><div className="product-card-body"><div className="product-meta"><span>{product.category}</span><span><MapPin /> {product.location}</span></div><h3>{product.title}</h3><p>{product.condition} condition</p><div className="price-row">{product.originalPrice && <span className="mrp">Original <s>₹{money(product.originalPrice)}</s></span>}<span><strong>₹{money(product.rentalPrice)}</strong> / month</span>{threeMonthPlan(product) && <span><strong>₹{money(threeMonthPlan(product).price)}</strong> / 3 months</span>}</div></div></article>
}

function Browse({ products, navigate }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('Bengaluru')
  const [wantedOpen, setWantedOpen] = useState(false)
  const filtered = products.filter((item) => `${item.title} ${item.brand}`.toLowerCase().includes(search.toLowerCase()) && (category === 'All' || item.category === category) && item.mode !== 'sell' && (location === 'Bengaluru' || item.location === location))
  return <div className="browse-page page-wrap"><div className="browse-intro"><span className="eyebrow plain">Verified nearby</span><h1>Baby products,<br /><em>ready for another round.</em></h1></div><div className="filter-panel"><label className="search-field"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands..." /></label><div className="filter-row"><div className="filter-group"><span>Category</span><div className="chips">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div><label className="filter-group compact"><span>Location</span><div className="select-wrap"><MapPin /><select value={location} onChange={(event) => setLocation(event.target.value)}>{areas.map((area) => <option key={area}>{area}</option>)}</select><ChevronDown /></div></label></div></div><div className="results-bar"><p><strong>{filtered.length}</strong> {filtered.length === 1 ? 'product' : 'products'} found</p><span>Reviewed before listing</span></div>{filtered.length ? <div className="product-grid browse-grid">{filtered.map((item) => <ProductCard key={item.id} product={item} navigate={navigate} />)}</div> : <div className="demand-empty"><div className="empty-art"><Search /></div><h2>Can’t find what you’re looking for?</h2><p>Tell us what you need. We’ll notify you when a matching product is listed nearby.</p><button className="button primary" onClick={() => setWantedOpen(true)}>I want this product</button></div>}{wantedOpen && <WantedModal initialProduct={search} onClose={() => setWantedOpen(false)} onSubmit={() => setWantedOpen(false)} />}</div>
}

function ProductDetail({ product, navigate }) {
  const [enquiry, setEnquiry] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  if (!product) return <NotFound navigate={navigate} message="This product isn’t available." />
  const gallery = product.images?.length ? product.images : product.image ? [product.image] : []
  return <div className="detail-page page-wrap"><button className="back-link" onClick={() => navigate('browse')}><ArrowLeft /> Back to browse</button><div className="detail-layout"><div className="detail-image">{gallery.length ? <img src={gallery[activeImage] || gallery[0]} alt={product.title} /> : <div className="image-placeholder"><Baby /></div>}{!product.reused && <span className="new-tag">Brand new · Not reused</span>}<span className="verified-pill"><BadgeCheck /> Photos verified</span>{gallery.length > 1 && <div className="thumb-row">{gallery.map((src, index) => <button key={src} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`Photo ${index + 1}`}><img src={src} alt="" /></button>)}</div>}</div><div className="detail-info"><span className="category-label">{product.category}</span><h1>{product.title}</h1><p className="brand-line">by {product.brand || 'Independent seller'} <span>•</span> <MapPin /> {product.location}</p><div className="condition-line"><span className="stars">★★★★<i>★</i></span><strong>{product.condition} condition</strong></div><div className="detail-prices">{product.originalPrice && <p className="mrp">Original price <s>₹{money(product.originalPrice)}</s></p>}<div><span>Rent it for</span><strong>₹{money(product.rentalPrice)}<small>/month</small></strong>{product.securityDeposit && <small>+ ₹{money(product.securityDeposit)} refundable deposit</small>}</div>{threeMonthPlan(product) && <><span className="or">or</span><div><span>3-month package</span><strong>₹{money(threeMonthPlan(product).price)}<small>/3 months</small></strong></div></>}</div><div className="detail-actions"><button className="button primary" onClick={() => setEnquiry('rent')}>I want to rent <ArrowRight /></button></div><p className="manual-note"><ShieldCheck /> No payment yet. We’ll contact you to arrange the next step.</p></div></div>{product.advert && <Advert advert={product.advert} originalPrice={product.originalPrice} />}<div className="detail-lower"><section><span className="eyebrow plain">The details</span><h2>Know before it goes home.</h2><p>{product.description || 'A well-cared-for baby product, ready to be useful to another family.'}</p>{product.about?.length > 0 && <div className="about-item"><h3>About this item</h3><ul>{product.about.map((point) => <li key={point}>{point}</li>)}</ul></div>}<dl className="spec-grid">{product.originalPrice && <Spec term="Original price" value={`₹${money(product.originalPrice)}`} />}<Spec term="Location" value={product.location} />{product.ageRange && <Spec term="Suitable age" value={product.ageRange} />}{product.securityDeposit && <Spec term="Security deposit" value={`₹${money(product.securityDeposit)} refundable`} />}</dl></section><aside className="trust-card"><ShieldCheck /><h3>Checked with care</h3><ul><li><CircleCheck /> Seller details verified</li><li><CircleCheck /> Product details reviewed</li><li><CircleCheck /> Photos checked for clarity</li></ul><p>Every approved listing is manually reviewed by our team.</p></aside></div>{enquiry && <EnquiryModal product={product} initialIntent={enquiry} onClose={() => setEnquiry(null)} onSubmit={() => setEnquiry(null)} />}</div>
}
function Spec({ term, value }) { return <div><dt>{term}</dt><dd>{value}</dd></div> }
function Advert({ advert, originalPrice }) { return <section className="advert-card"><span className="eyebrow plain">Rental offer</span><h2>{advert.headline}</h2>{advert.lines.map((line) => <p key={line}>{line}</p>)}<p><strong>₹{money(advert.deposit)} refundable security deposit.</strong></p><ul className="plan-list">{originalPrice && <li><span>Original price</span><strong>₹{money(originalPrice)}</strong></li>}{advert.plans.map((plan) => <li key={plan.label} className={plan.highlight ? 'highlight' : ''}><span>{plan.label}</span><strong className={plan.struck ? 'struck' : ''}>₹{money(plan.price)}</strong>{plan.badge && <em>{plan.badge}</em>}</li>)}<li><span>Security deposit</span><strong>₹{money(advert.deposit)} refundable</strong></li></ul></section> }

function ContactPage() {
  const [status, setStatus] = useState('form')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return
    setError('')
    setStatus('sending')
    try {
      const result = await postRentMessage({ messageType: 'contact', ...form })
      setReference(result.reference)
      setStatus('done')
    } catch (err) {
      setError(err.message || 'We could not send your message. Please try again.')
      setStatus('form')
    }
  }

  return <div className="contact-page page-wrap"><section className="contact-intro"><span className="eyebrow light">We’re here to help</span><h1>Let’s talk.</h1><p>Questions about a listing, renting, or getting started? Send us a note and our team will get back to you.</p><div className="contact-promise"><ShieldCheck /><span><strong>A real person reads every message.</strong> We usually reply within two business days.</span></div></section><section className="contact-form-wrap">{status === 'done' ? <div className="contact-success"><div className="success-icon"><Check /></div><span className="eyebrow plain">Message sent</span><h2>Thanks for reaching out.</h2><p>Your message is on its way to our team. We’ll reply to the email address you provided.</p>{reference && <p className="reference-code">Reference <strong>{reference}</strong></p>}</div> : <form className="contact-form" onSubmit={submit}><div className="form-header"><span>Contact Sahly</span><h2>How can we help?</h2></div><div className="form-grid"><Field label="Your name" required><input required autoComplete="name" value={form.name} onChange={(event) => setField('name', event.target.value)} /></Field><Field label="Email" required><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="you@example.com" /></Field></div><Field label="Phone"><input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="Optional" /></Field><Field label="Subject" required><input required maxLength="120" value={form.subject} onChange={(event) => setField('subject', event.target.value)} placeholder="What is this about?" /></Field><Field label="Message" required><textarea required rows="6" maxLength="2000" value={form.message} onChange={(event) => setField('message', event.target.value)} placeholder="Write your message..." /></Field>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary submit-button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight /></button></form>}</section></div>
}

function ListProduct() {
  const mode = 'sell'
  const [submitted, setSubmitted] = useState(false)
  const [image, setImage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', brand: '', category: 'Strollers', purchaseDate: '', usedFor: '', originalPrice: '', condition: 'Excellent', salePrice: '', rentalPrice: '', location: '', name: '', email: '', phone: '', description: '' })
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const addImage = (file) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setImage(reader.result); reader.readAsDataURL(file) }
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const result = await postSubmission({ type: 'listing', mode, image, ...form })
      setReference(result.reference)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  if (submitted) return <SuccessState reference={reference} />
  return <div className="list-page"><section className="list-intro"><span className="eyebrow light">Pass it forward</span><h1>Have baby products<br />your child has <em>outgrown?</em></h1><p>Turn unused products into money, and help another parent find what they need.</p><div className="list-promise"><span><Check /> Free to list</span><span><Check /> Reviewed by a real person</span><span><Check /> You stay in control</span></div></section><section className="form-section"><form className="listing-form" onSubmit={submit}><div className="form-header"><span>List your product</span><h2>Sell your product</h2></div><div className="form-grid"><Field label="Product name" required><input required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. R for Rabbit stroller" /></Field><Field label="Brand"><input value={form.brand} onChange={(event) => setField('brand', event.target.value)} placeholder="Brand name" /></Field><Field label="Category"><select value={form.category} onChange={(event) => setField('category', event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="When did you buy it?"><input type="month" value={form.purchaseDate} onChange={(event) => setField('purchaseDate', event.target.value)} /></Field><Field label="Original price" required><MoneyInput value={form.originalPrice} onChange={(value) => setField('originalPrice', value)} placeholder="10,000" required /></Field><Field label="How long was it used?"><input value={form.usedFor} onChange={(event) => setField('usedFor', event.target.value)} placeholder="e.g. 8 months" /></Field></div><Field label="Condition" required><div className="condition-options">{['Like new', 'Excellent', 'Good'].map((item) => <label key={item} className={form.condition === item ? 'active' : ''}><input type="radio" name="condition" checked={form.condition === item} onChange={() => setField('condition', item)} /><span><CircleCheck />{item}</span></label>)}</div></Field><div className="form-grid"><Field label="Expected selling price" required><MoneyInput value={form.salePrice} onChange={(value) => setField('salePrice', value)} placeholder="5,500" required /></Field></div><Field label="Upload a clear photo" required><label className={image ? 'upload-zone has-image' : 'upload-zone'}>{image ? <img src={image} alt="Product preview" /> : <><Upload /><strong>Add product photo</strong><span>JPG or PNG, up to 5 MB</span></>}<input required={!image} type="file" accept="image/*" onChange={(event) => addImage(event.target.files[0])} /></label></Field><Field label="A short description"><textarea value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Anything another parent should know?" rows="4" /></Field><div className="form-grid"><Field label="Your name" required><input required value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="How should we address you?" /></Field><Field label="Email" required><input required type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="you@example.com" /></Field></div><div className="form-grid"><Field label="Your area" required><input required value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="e.g. HSR Layout" /></Field><Field label="Phone / WhatsApp" required><input required type="tel" pattern="[0-9+ ]{10,15}" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+91 98765 43210" /></Field></div>{error && <p className="form-error">{error}</p>}<button className="button primary submit-button" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Submit for review'} <ArrowRight /></button><p className="form-footnote">By submitting, you confirm these details are accurate and the product is yours to list.</p></form></section></div>
}

function Field({ label, required, hint, children }) { return <label className="field"><span>{label}{required && <b>*</b>}</span>{hint && <small className="field-hint">{hint}</small>}{children}</label> }
function MoneyInput({ value, onChange, placeholder, required }) { return <div className="money-input"><IndianRupee /><input required={required} type="number" min="1" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div> }
function SuccessState({ reference }) { return <div className="success-page page-wrap"><div className="success-icon"><Check /></div><span className="eyebrow plain">Submitted</span><h1>Thanks! We’ll take it<br />from here.</h1><p>We’ve emailed a confirmation and will reply personally.</p>{reference && <p className="reference-code">Reference <strong>{reference}</strong></p>}<button className="button primary" onClick={() => { window.location.hash = 'home' }}>Back to home</button></div> }

function EnquiryModal({ product, initialIntent, onClose }) {
  const [status, setStatus] = useState('form')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', type: 'rent', offer: '', message: '' })
  const submit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return
    setError('')
    setStatus('sending')
    try {
      const result = await postRentMessage({ messageType: 'rent', ...form, subject: `Rental enquiry: ${product.title}`, productId: product.id, productTitle: product.title, salePrice: product.salePrice, rentalPrice: product.rentalPrice, location: product.location })
      setReference(result.reference)
      setStatus('done')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('form')
    }
  }
  return <Modal onClose={onClose}>{status === 'done' ? <ModalSuccess text="Request sent. We’ll email you shortly." reference={reference} /> : <><ModalHeading eyebrow="Send request to rent" title={product.title} text="No payment needed. Tell us how to reach you." /><form className="modal-form" onSubmit={submit}><Field label="Name" required><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Email" required><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field><Field label="Phone" required><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Address" required hint="Rentals are available in Bangalore only."><textarea required rows="2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="House / flat no., street, area, Bangalore" /></Field><Field label="Your offer (optional)"><MoneyInput value={form.offer} onChange={(offer) => setForm({ ...form, offer })} placeholder={form.type === 'rent' ? String(product.rentalPrice || '') : String(product.salePrice || '')} /></Field><Field label="Message"><textarea rows="3" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Hi, I’d like to know more..." /></Field>{error && <p className="form-error">{error}</p>}<button className="button primary" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send request'} <ArrowRight /></button></form></>}</Modal>
}

function WantedModal({ initialProduct, onClose, onSubmit }) {
  const [status, setStatus] = useState('form')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [form, setForm] = useState({ product: initialProduct, type: 'buy', budget: '', area: 'HSR Layout', name: '', email: '', phone: '' })
  const submit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return
    setError('')
    setStatus('sending')
    try {
      const result = await postSubmission({ type: 'wanted', ...form })
      setReference(result.reference)
      setStatus('done')
      if (onSubmit) onSubmit(result)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('form')
    }
  }
  return <Modal onClose={onClose}>{status === 'done' ? <ModalSuccess text="We’ll email you as soon as we find a match." reference={reference} /> : <><ModalHeading eyebrow="Tell us what you need" title="We’ll keep an eye out." text="Your request helps us find the products parents actually want." /><form className="modal-form" onSubmit={submit}><Field label="Product" required><input required value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} placeholder="BabyBjörn carrier" /></Field><Field label="I want to"><Segmented value={form.type} onChange={(type) => setForm({ ...form, type })} /></Field><div className="form-grid"><Field label="Budget"><MoneyInput value={form.budget} onChange={(budget) => setForm({ ...form, budget })} /></Field><Field label="Area"><select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })}>{areas.slice(1).map((area) => <option key={area}>{area}</option>)}</select></Field></div><div className="form-grid"><Field label="Name" required><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Email" required><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field></div><Field label="Phone"><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Optional" /></Field>{error && <p className="form-error">{error}</p>}<button className="button primary" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Notify me'} <ArrowRight /></button></form></>}</Modal>
}

function Segmented({ value, onChange }) { return <div className="segmented wide"><button type="button" className={value === 'buy' ? 'active' : ''} onClick={() => onChange('buy')}>Buy</button><button type="button" className={value === 'rent' ? 'active' : ''} onClick={() => onChange('rent')}>Rent</button></div> }
function ModalHeading({ eyebrow, title, text }) { return <div className="modal-heading"><span className="eyebrow plain">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div> }
function Modal({ children, onClose }) { return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>{children}</div></div> }
function ModalSuccess({ text, reference }) { return <div className="modal-success"><div className="success-icon"><Check /></div><h2>All done.</h2><p>{text}</p>{reference && <p className="reference-code">Reference <strong>{reference}</strong></p>}</div> }

function NotFound({ navigate, message = 'We couldn’t find that page.' }) { return <div className="success-page page-wrap"><span className="eyebrow plain">404</span><h1>{message}</h1><button className="button primary" onClick={() => navigate('home')}>Back to home</button></div> }
function Footer({ navigate }) { return <footer><button className="brand footer-brand" onClick={() => navigate('home')}><span className="brand-mark"><Baby /></span><span>Sahly</span></button><p>Baby products have a short life. Give them a second one.</p><div><button onClick={() => navigate('browse')}>Browse</button><button onClick={() => navigate('sell')}>Sell</button><button onClick={() => navigate('contact')}>Contact</button></div><small>© 2026 Sahly · Bengaluru</small></footer> }