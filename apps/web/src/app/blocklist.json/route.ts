import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const candidates = [
    path.join(process.cwd(), 'blocklist.json'),
    path.join(process.cwd(), '..', '..', 'blocklist.json'),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, 'utf8');
      return new Response(content, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    } catch {
      // Try the next known workspace location.
    }
  }

  return Response.json(
    { error: 'Blocklist file is unavailable.' },
    { status: 503 },
  );
}
