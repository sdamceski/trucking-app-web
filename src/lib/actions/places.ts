'use server';

import { requireSession } from '@/lib/auth/dal';

export interface AddressSuggestion {
  description: string;
  mainText: string;
  secondaryText: string;
}

interface GooglePlaceText {
  text?: string;
}
interface GooglePlacePrediction {
  placePrediction?: {
    text?: GooglePlaceText;
    structuredFormat?: {
      mainText?: GooglePlaceText;
      secondaryText?: GooglePlaceText;
    };
  };
}
interface GoogleAutocompleteResponse {
  suggestions?: GooglePlacePrediction[];
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  await requireSession();

  const q = query.trim();
  if (q.length < 3) return [];

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ['us', 'ca'],
      }),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as GoogleAutocompleteResponse;
    return (data.suggestions ?? [])
      .map((s): AddressSuggestion | null => {
        const p = s.placePrediction;
        if (!p?.text?.text) return null;
        return {
          description: p.text.text,
          mainText: p.structuredFormat?.mainText?.text ?? p.text.text,
          secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
        };
      })
      .filter((x): x is AddressSuggestion => x !== null);
  } catch {
    return [];
  }
}
