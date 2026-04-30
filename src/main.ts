import './style.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failure should not block app usage.
    })
  })
}

type MeasureType = 'net' | 'kanat' | 'cita' | 'conta'
type OrderType = 'plise' | 'surme'
type MeasureInput = {
  widthCm: number
  heightCm: number
  quantity: number
  measureType: MeasureType
}

const measureAdds: Record<MeasureType, number> = {
  net: 0,
  kanat: 1,
  cita: 3,
  conta: 7
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Uygulama konteyneri bulunamadi.')
}

app.innerHTML = `
  <div id="intro-overlay" class="intro-overlay">
    <div class="intro-content">
      <img src="/file.jpg" alt="Eryildiz Aluminyum Logo" class="intro-logo" />
      <div class="intro-title">Eryildiz Aluminyum</div>
      <div class="intro-subtitle">Sozunde Er Kalitede Yildiz</div>
    </div>
  </div>
  <main class="container">
    <h1>Eryildiz Aluminyum Sozunde Er Kalitede Yildiz</h1>
    

    <form id="calc-form" class="grid">
      <label class="full">
        Siparis tipi
        <select id="orderType">
          <option value="plise">Plise</option>
          <option value="surme">Surme</option>
        </select>
      </label>

      <label class="full" id="price-group">
        Fiyat
        <input id="price" type="number" min="0" step="0.01" value="" required />
      </label>

      <label class="full hidden" id="multiplier-group">
        Fiyat
        <input id="multiplier" type="number" min="0" step="0.01" value="" />
      </label>

      <section class="full measures" id="measures">
        <h2>Olculer</h2>
        <div id="measure-list"></div>
        <button type="button" id="add-measure" class="secondary-btn">+ Olcu Ekle</button>
      </section>

      <div class="full total-price" id="total-price">
        Toplam Fiyat: 0
      </div>

      <button type="submit" class="full">Hesapla</button>
    </form>

    <section class="result" id="result"></section>
  </main>
`

const form = document.querySelector<HTMLFormElement>('#calc-form')
const result = document.querySelector<HTMLElement>('#result')
const totalPrice = document.querySelector<HTMLElement>('#total-price')
const orderTypeSelect = document.querySelector<HTMLSelectElement>('#orderType')
const priceGroup = document.querySelector<HTMLElement>('#price-group')
const multiplierGroup = document.querySelector<HTMLElement>('#multiplier-group')
const priceInput = document.querySelector<HTMLInputElement>('#price')
const multiplierInput = document.querySelector<HTMLInputElement>('#multiplier')

if (
  !form ||
  !result ||
  !totalPrice ||
  !orderTypeSelect ||
  !priceGroup ||
  !multiplierGroup ||
  !priceInput ||
  !multiplierInput
) {
  throw new Error('Form elementleri bulunamadi.')
}
const introOverlay = document.getElementById('intro-overlay')

if (introOverlay) {
  requestAnimationFrame(() => {
    introOverlay.classList.add('show')
  })

  window.setTimeout(() => {
    introOverlay.classList.add('hide')
  }, 2400)

  window.setTimeout(() => {
    introOverlay.remove()
  }, 2900)
}

const getNumber = (id: string): number => Number((document.getElementById(id) as HTMLInputElement).value || 0)
const round2 = (value: number): number => Math.round(value * 100) / 100
const measureList = document.querySelector<HTMLDivElement>('#measure-list')
const addMeasureButton = document.querySelector<HTMLButtonElement>('#add-measure')

if (!measureList || !addMeasureButton) {
  throw new Error('Olcu listesi elementleri bulunamadi.')
}

const createMeasureRow = (defaults?: Partial<MeasureInput>): HTMLDivElement => {
  const row = document.createElement('div')
  row.className = 'measure-row'
  row.innerHTML = `
    <div class="inline-field type-field">
      <span class="mini-label"><span class="measure-index">1</span> Tip</span>
      <div class="width-input-row">
        <select class="measure-type">
          <option value="net" ${defaults?.measureType === 'net' ? 'selected' : ''}>Net (0)</option>
          <option value="kanat" ${defaults?.measureType === 'kanat' ? 'selected' : ''}>Kanat (1)</option>
          <option value="cita" ${defaults?.measureType === 'cita' ? 'selected' : ''}>Cita (3)</option>
          <option value="conta" ${defaults?.measureType === 'conta' ? 'selected' : ''}>Conta (7)</option>
        </select>
      </div>
    </div>
    <div class="inline-field en-field">
      <span class="mini-label">En (cm)</span>
      <input class="measure-width" type="number" min="1" value="${defaults?.widthCm ?? ''}" required />
    </div>
    <div class="inline-field boy-field">
      <span class="mini-label">Boy (cm)</span>
      <input class="measure-height" type="number" min="1" value="${defaults?.heightCm ?? ''}" required />
    </div>
    <div class="inline-field adet-field">
      <span class="mini-label">Adet</span>
      <input class="measure-quantity" type="number" min="1" step="1" value="${defaults?.quantity ?? ''}" required />
    </div>
    <button type="button" class="remove-btn" aria-label="Olcuyu sil" title="Olcuyu sil">×</button>
    <div class="measure-price">Toplam: 0</div>
  `

  const removeButton = row.querySelector<HTMLButtonElement>('.remove-btn')

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (measureList.children.length === 1) {
        return
      }
      row.remove()
      refreshMeasureTitles()
    })
  }

  return row
}

const refreshMeasureTitles = (): void => {
  const rows = Array.from(measureList.querySelectorAll<HTMLDivElement>('.measure-row'))
  rows.forEach((row, index) => {
    const indexElement = row.querySelector<HTMLElement>('.measure-index')
    if (indexElement) {
      indexElement.textContent = String(index + 1)
    }
  })
}

const collectMeasures = (): MeasureInput[] => {
  const rows = Array.from(measureList.querySelectorAll<HTMLDivElement>('.measure-row'))
  return rows.map((row) => {
    const widthCm = Number((row.querySelector('.measure-width') as HTMLInputElement).value || 0)
    const heightCm = Number((row.querySelector('.measure-height') as HTMLInputElement).value || 0)
    const quantity = Number((row.querySelector('.measure-quantity') as HTMLInputElement).value || 0)
    const measureType = ((row.querySelector('.measure-type') as HTMLSelectElement).value || 'net') as MeasureType
    return { widthCm, heightCm, quantity, measureType }
  })
}

const applyOrderTypeUI = (orderType: OrderType): void => {
  const isSurme = orderType === 'surme'
  priceGroup.classList.toggle('hidden', isSurme)
  multiplierGroup.classList.toggle('hidden', !isSurme)
  priceInput.required = !isSurme
  multiplierInput.required = isSurme

  const rows = Array.from(measureList.querySelectorAll<HTMLDivElement>('.measure-row'))
  rows.forEach((row) => {
    const typeField = row.querySelector<HTMLElement>('.type-field')
    row.classList.toggle('surme-mode', isSurme)
    typeField?.classList.toggle('hidden', isSurme)
  })
}

const addMeasure = (defaults?: Partial<MeasureInput>): void => {
  measureList.appendChild(createMeasureRow(defaults))
  refreshMeasureTitles()
  applyOrderTypeUI(orderTypeSelect.value as OrderType)
}

addMeasure()
addMeasureButton.addEventListener('click', () => addMeasure())
orderTypeSelect.addEventListener('change', () => applyOrderTypeUI(orderTypeSelect.value as OrderType))

const calculatePliseUnitPrice = (
  widthCm: number,
  heightCm: number,
  price: number,
  addCm: number
): { unitPrice: number; adjustedWidthCm: number; adjustedHeightCm: number } => {
  const adjustedWidthCm = widthCm + addCm
  const adjustedHeightCm = heightCm + addCm
  const enM = adjustedWidthCm / 100
  const boyM = adjustedHeightCm / 100
  return {
    unitPrice: (enM + boyM) * 2 * price,
    adjustedWidthCm,
    adjustedHeightCm
  }
}

const calculateSurmeUnitPrice = (
  widthCm: number,
  heightCm: number,
  multiplier: number
): number => {
  const a = heightCm
  const b = widthCm
  const x = a
  const y = b / 2
  return ((a + b + x + y) * 2 * multiplier) / 100
}

applyOrderTypeUI(orderTypeSelect.value as OrderType)

form.addEventListener('submit', (event) => {
  event.preventDefault()

  const orderType = orderTypeSelect.value as OrderType
  const price = getNumber('price')
  const multiplier = getNumber('multiplier')
  const measures = collectMeasures()

  if (measures.length === 0 || (orderType === 'plise' && price < 0) || (orderType === 'surme' && multiplier < 0)) {
    result.textContent = 'Lutfen fiyat/carpan ve olcu bilgilerini gecerli girin.'
    totalPrice.textContent = 'Toplam Fiyat: 0'
    return
  }

  let hasInvalidMeasure = false
  let grandTotal = 0
  const rows = Array.from(measureList.querySelectorAll<HTMLDivElement>('.measure-row'))

  measures.forEach((measure, index) => {
      const row = rows[index]
      const rowPrice = row?.querySelector<HTMLElement>('.measure-price')
      if (measure.widthCm <= 0 || measure.heightCm <= 0 || measure.quantity <= 0) {
        hasInvalidMeasure = true
        if (rowPrice) {
          rowPrice.textContent = 'Toplam: 0'
        }
        return
      }

      let unitPrice = 0
      if (orderType === 'plise') {
        const addCm = measureAdds[measure.measureType] ?? 0
        const calculation = calculatePliseUnitPrice(measure.widthCm, measure.heightCm, price, addCm)
        unitPrice = calculation.unitPrice
      } else {
        unitPrice = calculateSurmeUnitPrice(measure.widthCm, measure.heightCm, multiplier)
      }

      const lineTotal = unitPrice * measure.quantity
      grandTotal += lineTotal

      if (rowPrice) {
        rowPrice.textContent = `Toplam: ${round2(lineTotal)}`
      }
    })

  if (hasInvalidMeasure) {
    result.textContent = 'Lutfen tum olculerde en, boy ve adet degerlerini gecerli girin.'
    totalPrice.textContent = 'Toplam Fiyat: 0'
    return
  }

  totalPrice.textContent = `Toplam Fiyat: ${round2(grandTotal)}`
  result.innerHTML = ''
})
