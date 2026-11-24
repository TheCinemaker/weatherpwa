// Kliensoldali API-hívó az önálló /api/snow-forecast végponthoz.
// Nem érinti a meglévő weather.js / smartmixin / metnet API hívásokat.

export async function fetchSnowForecast({ refresh = false, signal } = {}) {
  const url = refresh ? '/api/snow-forecast?refresh=1' : '/api/snow-forecast';
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `A /api/snow-forecast végpont nem JSON választ adott (HTTP ${res.status}). Ellenőrizd, hogy fut-e a backend függvény.`
    );
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Hóelőrejelzés lekérdezési hiba (HTTP ${res.status})`);
  }

  return data;
}

