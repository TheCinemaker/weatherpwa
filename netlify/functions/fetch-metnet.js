export async function handler(event, context) {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const url = 'https://www.metnet.hu/online-allomasok?sub=showosdata&ostid=1155';

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch MetNet page: ${res.statusText}`);
    }

    const html = await res.text();

    // Parse the table rows
    // Row pattern: <tr> ... </tr> containing a date matching cell
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

    const rows = [];
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const rowContent = match[1];
      if (rowContent.includes('table2') || rowContent.includes('table3')) {
        // Extract cells
        const cells = [];
        let cellMatch;
        // Reset cell regex lastIndex
        cellRegex.lastIndex = 0;
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          cells.push(cellMatch[1].trim());
        }

        // We expect at least 8 cells
        if (cells.length >= 8) {
          rows.push(cells);
        }
      }
    }

    // Helper functions for parsing
    function parseBudapestDate(str) {
      const parts = str.match(/(\d+)/g);
      if (!parts) return null;
      const [y, m, d, hr, min, sec] = parts.map(Number);
      const testDate = new Date(Date.UTC(y, m - 1, d, hr, min, sec));
      
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Budapest',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        });
        const formatted = formatter.format(testDate);
        const fParts = formatted.match(/(\d+)/g);
        if (fParts) {
          const [fMonth, fDay, fYear, fHr, fMin, fSec] = fParts.map(Number);
          const formattedUtc = Date.UTC(fYear, fMonth - 1, fDay, fHr, fMin, fSec);
          const diffMs = testDate.getTime() - formattedUtc;
          return Math.floor((Date.UTC(y, m - 1, d, hr, min, sec) + diffMs) / 1000);
        }
      } catch (e) {
        console.error('Intl formatting failed:', e);
      }

      // Fallback
      const isSummer = (m > 3 && m < 11);
      const offsetHours = isSummer ? 2 : 1;
      return Math.floor((Date.UTC(y, m - 1, d, hr, min, sec) - offsetHours * 3600000) / 1000);
    }

    function parseTemp(str) {
      const clean = str.replace(/<[^>]*>/g, '').replace('°C', '').trim();
      return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
    }

    // Dew point parsing if needed (column index 2)
    
    function parseHumidity(str) {
      const clean = str.replace('%', '').trim();
      return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
    }

    // WD / WS is column index 4, e.g. "11° / 2 km/h" or "-- / 1 km/h"
    function parseWindSpeed(str) {
      const parts = str.split('/');
      if (parts.length < 2) return null;
      const speedPart = parts[1].replace('km/h', '').trim();
      return isNaN(parseFloat(speedPart)) ? null : parseFloat(speedPart);
    }

    function parsePressure(str) {
      const clean = str.replace('hPa', '').trim();
      return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
    }

    function parsePrecipitation(str) {
      const clean = str.replace('mm', '').trim();
      return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
    }

    function calculateHeatIndex(T, rh, WS_kmh) {
      if (T === null || rh === null) return null;
      const ws = (WS_kmh || 0) / 3.6; // convert to m/s
      const e = (rh / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
      const AT = T + 0.33 * e - 0.7 * ws - 4.0;
      return Math.round(AT * 10) / 10;
    }

    function calculateHumidex(T, rh) {
      if (T === null || rh === null) return null;
      const e = 6.112 * Math.pow(10, (7.5 * T) / (237.7 + T)) * (rh / 100);
      const h = T + (5 / 9) * (e - 10);
      return Math.round(h * 10) / 10;
    }

    // Process parsed rows in chronological order (MetNet is reverse-chronological, so we reverse it)
    const reversedRows = rows.reverse();
    const timestamps = [];
    const T_arr = [];
    const U_arr = [];
    const FF_arr = [];
    const FXY_arr = [];
    const SLP_arr = [];
    const RR_1H_arr = [];
    const HEAT_INDEX_arr = [];
    const HUMIDEX_arr = [];

    for (const r of reversedRows) {
      const ts = parseBudapestDate(r[0]);
      if (!ts) continue;

      const T = parseTemp(r[1]);
      const U = parseHumidity(r[3]);
      const FF = parseWindSpeed(r[4]);
      const SLP = parsePressure(r[5]);
      const RR_1H = parsePrecipitation(r[6]);
      const HEAT_INDEX = calculateHeatIndex(T, U, FF);
      const HUMIDEX = calculateHumidex(T, U);

      timestamps.push(ts);
      T_arr.push(T);
      U_arr.push(U);
      FF_arr.push(FF);
      FXY_arr.push(FF); // MetNet table doesn't have gusts, fallback to wind speed
      SLP_arr.push(SLP);
      RR_1H_arr.push(RR_1H);
      HEAT_INDEX_arr.push(HEAT_INDEX);
      HUMIDEX_arr.push(HUMIDEX);
    }

    const history = {
      T: { ts: timestamps, data: T_arr },
      U: { ts: timestamps, data: U_arr },
      FF: { ts: timestamps, data: FF_arr },
      FXY: { ts: timestamps, data: FXY_arr },
      SLP: { ts: timestamps, data: SLP_arr },
      RR_1H: { ts: timestamps, data: RR_1H_arr },
      HEAT_INDEX: { ts: timestamps, data: HEAT_INDEX_arr },
      HUMIDEX: { ts: timestamps, data: HUMIDEX_arr }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(history)
    };

  } catch (error) {
    console.error('MetNet backup fetch error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}
