/**
 * Frontend Submitter Geolocation Service
 * 10/10 Production Standard: Fast, Non-blocking Hybrid capture (GPS with silent IP fallback)
 */

export const captureSubmitterLocation = async (timeoutMs = 9000) => {
  if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
    return { type: 'IP', reason: 'Geolocation API unsupported' };
  }

  return new Promise((resolve) => {
    let finished = false;

    // Safety timeout (9s): Gives browser/OS time to get high-accuracy Wi-Fi/GPS fix
    const safetyTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve({ type: 'IP', reason: 'Timeout' });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimer);

        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const rawAcc = pos.coords.accuracy;
          const accuracyStr = rawAcc ? `±${Math.round(rawAcc)}m` : '';

          let address = '';
          let city = '';
          let state = '';
          let country = '';
          let postalCode = '';

          // Fast reverse-geocoding with 2.5s timeout
          try {
            const controller = new AbortController();
            const revTimer = setTimeout(() => controller.abort(), 2500);

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
              {
                headers: { 'Accept-Language': 'en' },
                signal: controller.signal,
              }
            );
            clearTimeout(revTimer);

            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const a = data.address;
                city = a.city || a.town || a.village || a.suburb || a.county || '';
                state = a.state || '';
                country = a.country || '';
                postalCode = a.postcode || '';

                const parts = [
                  a.road || a.neighbourhood || a.suburb,
                  city,
                  state,
                  postalCode,
                ].filter(Boolean);

                address = parts.join(', ') || data.display_name || '';
              }
            }
          } catch (_) {
            // Reverse geocode non-fatal fallback
          }

          if (!address) {
            address = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          }

          resolve({
            type: 'GPS',
            latitude: lat,
            longitude: lng,
            accuracy: accuracyStr,
            address,
            city,
            state,
            country,
            postalCode,
            mapsUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
            capturedAt: new Date().toISOString(),
          });
        } catch (_) {
          resolve({ type: 'IP', reason: 'GPS coordinate parse error' });
        }
      },
      (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimer);

        const reason =
          err.code === 1
            ? 'Permission Denied'
            : err.code === 2
            ? 'Position Unavailable'
            : 'Timeout';

        resolve({ type: 'IP', reason });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Generates an accurate Google Maps URL for the submitter's actual location at ticket creation.
 * NEVER points to organization or company name - strictly submitter's physical location.
 */
export const getGoogleMapsUrl = (location) => {
  if (location) {
    // 1. Exact physical GPS coordinates of submitter (Pins exact building/street)
    if (location.latitude && location.longitude) {
      return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }
    if (location.mapsUrl && String(location.mapsUrl).startsWith('http') && !location.mapsUrl.includes('q=undefined')) {
      return location.mapsUrl;
    }
    // 2. Physical Submitter Address or City (Only real locations, not localhost text)
    const cleanAddr = (location.address || '').replace(/Local \/ Development Network/gi, '').trim();
    if (cleanAddr && !cleanAddr.startsWith('Coordinates: null')) {
      return `https://www.google.com/maps?q=${encodeURIComponent(cleanAddr)}`;
    }
    const cityState = [location.city, location.state, location.country].filter(Boolean).join(', ');
    if (cityState) {
      return `https://www.google.com/maps?q=${encodeURIComponent(cityState)}`;
    }
  }

  // 3. If local development test (::1), open user's current device location on Google Maps
  return 'https://www.google.com/maps/@?api=1&map_action=map';
};
