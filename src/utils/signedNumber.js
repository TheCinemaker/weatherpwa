// Előjeles számmező segédfüggvényei (lásd components/SignedNumberInput.jsx).

// A szöveges érték elejére teszi / leveszi a "-"-t. Üres mezőnél "-"-t ad.
export function toggleSign(value) {
  const v = String(value ?? '').trim();
  if (v === '') return '-';
  return v.startsWith('-') ? v.slice(1) : `-${v}`;
}

// Magyar billentyűzeten a tizedesvessző "," — ezt pontra váltjuk (a parseFloat a
// "3,5"-ből 3-at csinálna), és csak szám, egy tizedespont és egy vezető "-" maradhat.
export function sanitizeSignedNumber(raw) {
  let v = String(raw ?? '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const neg = v.startsWith('-');
  v = v.replace(/-/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
  return neg ? `-${v}` : v;
}
