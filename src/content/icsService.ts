import { ICSParser } from './icsParser';

async function fetchICSString(ics_url: string): Promise<Response> {
  const ics_string: Response = await fetch(ics_url);
  return ics_string;
}

const parser = new ICSParser();

export async function fetchAndParseICS(ics_url: string): Promise<Record<string, { Date: string | null, Class: string }>> {
  try {
      const response = await fetchICSString(ics_url);
      const text = await response.text();
      return parser.parse(text);
  } catch (error) {
      console.error('Error fetching or parsing ICS:', error);
      return {};
  }
}