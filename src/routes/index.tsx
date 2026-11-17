import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, Check, Clock3, ExternalLink, Globe2, Info, Landmark, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })
type Rate = { value?: number; checked?: Date; date?: string; error?: boolean; source?: string }
type Rates = Record<string, Rate>
const initialRates: Rates = { EUR: {}, USD: {}, USDT: {} }
const format = (value: number) => value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatCross = (value: number) => value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
function parseAmount(text: string): number | undefined {
  const clean = text.trim().replace(/\s/g, '')
  if (!clean) return undefined
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean
  const number = Number(normalized)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}
const time = (date: Date) => date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas', hour12: false })
async function getJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(18000) })
  if (!response.ok) throw new Error('Fuente no disponible')
  return response.json()
}
function valid(value: unknown): number {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error('Tasa no válida')
  return number
}
async function fetchRate(currency: string): Promise<Rate> {
  if (currency === 'USDT') {
    const data = await getJson('https://usdt-venezuela.elv77.workers.dev/')
    if (!data.success) throw new Error('Fuente no disponible')
    return { value: valid(data.precio), checked: new Date(), source: 'Binance P2P · vía Worker' }
  }
  if (currency === 'USD') {
    try {
      const data = await getJson('https://api.exchangerate.host/latest?base=USD&symbols=VES')
      return { value: valid(data.rates?.VES), checked: new Date(), date: data.date, source: 'exchangerate.host' }
    } catch { /* La fuente alternativa no requiere clave de acceso. */ }
  }
  const data = await getJson(`https://open.er-api.com/v6/latest/${currency}`)
  return { value: valid(data.rates?.VES), checked: new Date(), date: data.time_last_update_utc, source: 'ExchangeRate-API' }
}
const currencies = [
  { code: 'EUR', name: 'Tasa euro', label: 'EURO / BOLÍVAR', symbol: '€', description: 'Referencia internacional', className: 'euro' },
  { code: 'USD', name: 'Tasa dólar BCV', label: 'DÓLAR / BOLÍVAR', symbol: '$', description: 'Referencia cambiaria*', className: 'dollar' },
  { code: 'USDT', name: 'Tasa USDT', label: 'TETHER / BOLÍVAR', symbol: '₮', description: 'Binance P2P', className: 'tether' },
]
function Home() {
  const [rates, setRates] = useState<Rates>(initialRates)
  const [loading, setLoading] = useState(true)
  const [today, setToday] = useState('Venezuela')
  const [cross, setCross] = useState({ from: 'USD', amount: '1' })
  const [zelleInput, setZelleRate] = useState<string | undefined>(undefined)
  const mounted = useRef(false)
  const busy = useRef(false)
  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    await Promise.all(currencies.map(async ({ code }) => {
      try {
        const rate = await fetchRate(code)
        if (mounted.current) setRates(previous => ({ ...previous, [code]: rate }))
      } catch {
        if (mounted.current) setRates(previous => ({ ...previous, [code]: { ...previous[code], error: true } }))
      }
    }))
    busy.current = false
    if (mounted.current) setLoading(false)
  }, [])
  useEffect(() => {
    mounted.current = true
    setToday(new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Caracas' }))
    void refresh()
    const timer = setInterval(() => void refresh(), 600000)
    return () => { mounted.current = false; clearInterval(timer) }
  }, [refresh])
  const eurRate = rates.EUR.value
  const usdtRate = rates.USDT.value
  const defaultZelle = eurRate && usdtRate ? eurRate + (usdtRate - eurRate) * 0.3 : undefined
  const zelleRate = zelleInput ?? (defaultZelle !== undefined && defaultZelle > 0 ? defaultZelle.toFixed(2).replace('.', ',') : '')
  const parsedZelle = parseAmount(zelleRate)
  const zelleValue = parsedZelle !== undefined && parsedZelle > 0 ? parsedZelle : undefined
  const rateOf = (code: string) => code === 'ZELLE' ? zelleValue : rates[code].value
  const crossAmount = parseAmount(cross.amount)
  const crossSource = cross.from === 'VES' ? 1 : rateOf(cross.from)
  const bolivars = crossAmount !== undefined && crossSource ? crossAmount * crossSource : undefined
  const crossValue = (code: string) => {
    if (code === cross.from) return cross.amount
    const target = rateOf(code)
    return bolivars !== undefined && target ? formatCross(bolivars / target) : ''
  }
  const bolivarValue = cross.from === 'VES' ? cross.amount : bolivars !== undefined ? format(bolivars) : ''
  const available = Object.values(rates).filter(item => item.value && !item.error).length

  return (
    <div className="app-shell">
      <header className="header"><a className="brand" href="/" aria-label="Tasa Venezuela, inicio"><span className="brand-mark"><ArrowDownUp size={21} /></span><span>tasa<span className="brand-light">venezuela</span><span className="brand-dot">.</span></span></a><div className="header-country"><span className="flag"><i /><i /><i /></span> Venezuela <span className="header-divider" /> VES</div></header>
      <main>
        <section className="intro"><div><div className="eyebrow"><span className="small-line" /> TU REFERENCIA CAMBIARIA</div><h1>Cuatro tasas.<br />Una sola mirada<span>.</span></h1><p>Euro, dólar, USDT y Zelle en bolívares.<br className="mobile-break" /> La información que necesitas, en un solo lugar.</p></div><div className="intro-meta"><div className="date"><Clock3 size={15} />{today}</div><span>Hora de Venezuela · UTC−4</span></div></section>
        <section className="rates-section" aria-label="Tasas de cambio"><div className="section-bar"><div className="section-title"><h2>El cambio de hoy</h2><span className="live-badge"><i className={loading ? 'pending-dot' : ''} />{loading ? 'Consultando' : available === 3 ? 'Actualizado' : 'Consulta finalizada'}</span></div><button className="refresh-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'spinning' : ''} /><span>{loading ? 'Actualizando' : 'Actualizar tasas'}</span></button></div>
        <div className="rate-grid">{currencies.map(item => {
          const current = rates[item.code]
          return <article key={item.code} className={`rate-card ${item.className}`} aria-busy={loading}>
            <div className="card-top"><span className="currency-icon">{item.symbol}</span><span className="currency-pair">{item.code}<span> / VES</span></span><span className="card-number">0{currencies.indexOf(item) + 1}</span></div>
            <div className="card-title"><h3>{item.name}</h3><span>{item.label}</span></div>
            <div className="rate-value" aria-live="polite">{current.value ? <><span className="bs">Bs.</span> {format(current.value)}</> : loading ? <span className="skeleton" aria-label="Cargando tasa" /> : <span className="unavailable">No disponible</span>}</div>
            <div className="per-unit">por 1 {item.code}<span>{item.description}</span></div>
            <div className="cross-field">
              <label htmlFor={`cross-${item.code}`}>Monto en {item.code}</label>
              <div className="cross-box"><input id={`cross-${item.code}`} type="text" inputMode="decimal" autoComplete="off" placeholder={current.value ? '0,00' : 'Sin tasa'} disabled={!current.value} value={crossValue(item.code)} onChange={event => setCross({ from: item.code, amount: event.target.value })} aria-describedby={`cross-note-${item.code}`} /><span>{item.code === 'USDT' ? '₮' : item.symbol}</span></div>
              <span className="cross-note" id={`cross-note-${item.code}`}>{!current.value ? 'Equivalente no disponible' : cross.from === item.code ? bolivars !== undefined ? `Equivale a Bs. ${format(bolivars)}` : 'Ingresa un monto válido' : bolivars !== undefined ? `Equivalente de Bs. ${format(bolivars)}` : 'Ingresa un monto válido'}</span>
            </div>
            <div className="card-bottom"><span><span className={`status-dot ${current.error ? 'error' : ''}`} />{current.error ? current.value ? 'Último valor · sin conexión' : 'Fuente no disponible' : current.checked ? `Consultado: ${time(current.checked)}` : 'Conectando con la fuente'}</span>{current.checked && !current.error && <Check size={14} />}</div>
          </article>
        })}
          <article className="rate-card zelle">
            <div className="card-top"><span className="currency-icon">Z</span><span className="currency-pair">ZELLE<span> / VES</span></span><span className="card-number">04</span></div>
            <div className="card-title"><h3>Tasa Zelle</h3><span>ZELLE / BOLÍVAR</span></div>
            <div className="zelle-rate-field">
              <label htmlFor="zelle-rate">Tasa en bolívares por 1 USD Zelle</label>
              <div className="zelle-rate-box"><span className="bs">Bs.</span><input id="zelle-rate" type="text" inputMode="decimal" autoComplete="off" placeholder="0,00" value={zelleRate} onChange={event => setZelleRate(event.target.value)} aria-describedby="zelle-rate-note" aria-invalid={zelleRate.trim() !== '' && zelleValue === undefined} /></div>
            </div>
            <div className="per-unit" id="zelle-rate-note">{zelleRate.trim() === '' ? 'Ingresa la tasa que te ofrecen' : zelleValue === undefined ? 'Ingresa una tasa mayor que cero' : 'por 1 USD Zelle'}<span>Tasa ingresada por ti</span></div>
            <div className="cross-field">
              <label htmlFor="cross-ZELLE">Monto en Zelle (USD)</label>
              <div className="cross-box"><input id="cross-ZELLE" type="text" inputMode="decimal" autoComplete="off" placeholder={zelleValue ? '0,00' : 'Sin tasa'} disabled={!zelleValue} value={crossValue('ZELLE')} onChange={event => setCross({ from: 'ZELLE', amount: event.target.value })} aria-describedby="cross-note-ZELLE" /><span>$</span></div>
              <span className="cross-note" id="cross-note-ZELLE">{!zelleValue ? 'Ingresa la tasa para calcular' : bolivars !== undefined ? `${cross.from === 'ZELLE' ? 'Equivale a' : 'Equivalente de'} Bs. ${format(bolivars)}` : 'Ingresa un monto válido'}</span>
            </div>
            <div className="card-bottom"><span><span className="status-dot manual" />Tasa manual · solo en esta sesión</span></div>
          </article>
        </div>
        <div className="auto-update"><RefreshCw size={13} /><span>Consulta automática cada 10 minutos</span><span className="auto-note">Todos los valores se expresan en bolívares (VES)</span></div></section>
        <section className="converter bolivar-converter"><div className="converter-intro"><span className="mini-label"><ArrowDownUp size={15} /> CONVERSOR EN BOLÍVARES</span><h2>Haz tus cuentas.</h2><p>Escribe un monto en bolívares y las tarjetas de arriba muestran su equivalente. Si escribes en una tarjeta, aquí aparece el monto en bolívares.</p></div><div className="bolivar-field"><label htmlFor="cross-VES">Monto en bolívares</label><div className="amount-box"><span className="bolivar-prefix">Bs.</span><input id="cross-VES" type="text" inputMode="decimal" autoComplete="off" placeholder="0,00" value={bolivarValue} onChange={event => setCross({ from: 'VES', amount: event.target.value })} aria-describedby="cross-note-VES" /><span>VES</span></div><span className="cross-note" id="cross-note-VES" aria-live="polite">{cross.from === 'VES' ? crossAmount !== undefined ? 'Las tarjetas muestran el equivalente en cada moneda' : 'Ingresa un monto válido' : bolivars !== undefined ? `Equivale a ${cross.amount} ${cross.from === 'ZELLE' ? 'USD Zelle' : cross.from}` : 'Equivalente no disponible'}</span></div></section>
        <section className="sources" id="fuentes"><div className="sources-heading"><span className="info-icon"><Info size={19} /></span><div><h2>Información clara, decisiones informadas.</h2><p>Conoce de dónde viene cada tasa.</p></div></div><div className="source-grid"><div><Globe2 size={18} /><h3>Euro y dólar</h3><p>*Las APIs proporcionadas ofrecen referencias internacionales. No son una consulta directa al BCV ni garantizan coincidir con su tasa oficial.</p><a href="https://www.bcv.org.ve/" target="_blank" rel="noreferrer">Consultar el BCV <ExternalLink size={12} /></a></div><div><Wallet size={18} /><h3>USDT en Binance P2P</h3><p>Referencia obtenida a través de la fuente P2P proporcionada. El precio puede variar según el anuncio, el monto y el método de pago.</p><a href="https://p2p.binance.com/" target="_blank" rel="noreferrer">Ver mercado P2P <ExternalLink size={12} /></a></div><div><ShieldCheck size={18} /><h3>Siempre con contexto</h3><p>La hora indica la última consulta exitosa, no la publicación de la tasa. Si una fuente falla, el último valor se conserva y se identifica.</p><span className="source-caption">Solo información de referencia <ArrowRight size={12} /></span></div></div><details><summary>Ver fuentes y fecha de publicación</summary><ul>{currencies.map(item => <li key={item.code}><strong>{item.code}:</strong> {rates[item.code].source || (item.code === 'USDT' ? 'Worker USDT Venezuela' : 'ExchangeRate-API / exchangerate.host')} · {rates[item.code].date ? `Publicación: ${rates[item.code].date}` : 'Fecha de publicación no disponible'}</li>)}</ul></details></section>
      </main><footer><a className="footer-brand" href="/">tasavenezuela<span>.</span></a><span>Tus monedas. Tu referencia.</span><span className="footer-end"><Landmark size={13} /> Hecho para Venezuela</span></footer>
    </div>
  )
}
