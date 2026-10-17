// Variant picker for the product page: matches the chosen option pills to a variant,
// then updates the hidden variant id, price, button state and URL.
export function initProduct() {
  const root = document.querySelector('[data-product]')
  const json = root?.querySelector('[data-product-json]')
  if (!root || !json) return
  const product = JSON.parse(json.textContent)
  const idInput = root.querySelector('[data-variant-id]')
  const btn = root.querySelector('[data-atc]')
  const price = root.querySelector('[data-price]')
  const money = (c) => new Intl.NumberFormat(window.nz?.locale === 'en' ? 'en-IN' : window.nz?.locale, { style: 'currency', currency: window.nz?.currency || 'INR', maximumFractionDigits: 0 }).format(c / 100)

  root.addEventListener('change', (e) => {
    if (!e.target.matches('[data-option-index]')) return
    const chosen = [...root.querySelectorAll('[data-option-index]:checked')].sort((a, b) => a.dataset.optionIndex - b.dataset.optionIndex).map((i) => i.value)
    const v = product.variants.find((x) => chosen.every((val, i) => x.options[i] === val))
    if (!v) { btn.disabled = true; btn.textContent = 'unavailable'; return }
    idInput.value = v.id
    btn.disabled = !v.available
    btn.textContent = v.available ? 'add to bag ✧' : 'sold out'
    price.innerHTML = (v.compare_at_price > v.price ? `<s>${money(v.compare_at_price)}</s> ` : '') + money(v.price)
    history.replaceState(null, '', `?variant=${v.id}`)
  })
}
