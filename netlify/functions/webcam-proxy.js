export async function handler(event, context) {
  const camId = event.queryStringParameters.cam;
  
  if (!camId || !/^[a-zA-Z0-9_]+$/.test(camId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid camera ID format' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const ALLOWED_CAMS = new Set(['hepi', 'microweb9730', 'ha1kyy', 'ha1kyy3', 'eszenyi1']);
  if (!ALLOWED_CAMS.has(camId)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Camera ID not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  try {
    // 1. Fetch the webcam page from Időkép
    const pageUrl = `https://www.idokep.hu/webkamera/${camId}`;
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': userAgent }
    });

    if (!pageRes.ok) {
      throw new Error(`Failed to fetch page: ${pageRes.statusText}`);
    }

    const html = await pageRes.text();

    // 2. Search for the token in the page content
    const tokenMatch = html.match(/token=([a-f0-9]{32})/i);
    let targetImgUrl;

    if (tokenMatch && tokenMatch[1]) {
      const token = tokenMatch[1];
      targetImgUrl = `https://cam.idokep.hu/kamera.php?user=${camId}&token=${token}&t=${Date.now()}`;
    } else {
      // Fallback to static thumbnail
      targetImgUrl = `https://cam.idokep.hu/${camId}/thumbnail.jpg`;
    }

    // 3. Fetch the webcam image binary using the Referer header
    const imgRes = await fetch(targetImgUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.idokep.hu/'
      }
    });

    if (!imgRes.ok) {
      throw new Error(`Failed to fetch image from ${targetImgUrl}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
        'Access-Control-Allow-Origin': '*' // Enable CORS for client fetching
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error(`Webcam Proxy Error for cam ${camId}:`, error);

    // Fallback: Attempt to fetch the static thumbnail without token
    try {
      const fallbackUrl = `https://cam.idokep.hu/${camId}/thumbnail.jpg`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': userAgent,
          'Referer': 'https://www.idokep.hu/'
        }
      });

      if (fallbackRes.ok) {
        const arrayBuffer = await fallbackRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*'
          },
          body: buffer.toString('base64'),
          isBase64Encoded: true
        };
      }
    } catch (fallbackError) {
      console.error(`Fallback failed for ${camId}:`, fallbackError);
    }

    // Ultimate fallback: 302 Redirect to static thumbnail URL directly
    return {
      statusCode: 302,
      headers: {
        'Location': `https://cam.idokep.hu/${camId}/thumbnail.jpg`
      }
    };
  }
}
