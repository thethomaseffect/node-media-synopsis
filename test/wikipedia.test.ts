import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWikipediaLead, searchQuery } from '../src/wikipedia.js';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

function userAgent(headers: RequestInit['headers']): string {
    if (!headers || headers instanceof Headers || Array.isArray(headers)) {
        return '';
    }
    return headers['User-Agent'] ?? '';
}

describe('searchQuery', () => {
    it('adds only the first non-empty media type', () => {
        expect(searchQuery('beyblade', ['anime', 'Japanese animated'])).toBe('beyblade anime');
        expect(searchQuery('beyblade', ['', 'anime'])).toBe('beyblade anime');
        expect(searchQuery('beyblade', [])).toBe('beyblade');
    });
});

describe('fetchWikipediaLead', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('requests the first Wikipedia lead and returns plain text', async () => {
        const calls: { init?: RequestInit; url: string }[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            calls.push({ init, url });
            return jsonResponse({
                query: {
                    pages: [{
                        extract: 'Beyblade is a manga.\nAn anime adaptation followed.',
                        fullurl: 'https://en.wikipedia.org/wiki/Beyblade_(manga)',
                        title: 'Beyblade (manga)'
                    }]
                }
            });
        });

        const page = await fetchWikipediaLead('beyblade', ['anime', 'manga']);
        const requested = calls[0];
        expect(requested).toBeDefined();
        const url = new URL(requested?.url ?? '');
        expect(url.origin + url.pathname).toBe('https://en.wikipedia.org/w/api.php');
        expect(url.searchParams.get('gsrsearch')).toBe('beyblade anime');
        expect(url.searchParams.get('gsrlimit')).toBe('1');
        expect(url.searchParams.get('explaintext')).toBe('1');
        expect(url.searchParams.get('exintro')).toBe('1');
        expect(url.searchParams.get('generator')).toBe('search');
        expect(userAgent(requested?.init?.headers)).toMatch(/^media-synopsis\//);
        expect(page.title).toBe('Beyblade (manga)');
        expect(page.url).toBe('https://en.wikipedia.org/wiki/Beyblade_(manga)');
        expect(page.extract).toMatch(/manga/);
    });

    it('throws when Wikipedia has no page', async () => {
        vi.stubGlobal('fetch', () => jsonResponse({ query: { pages: [] } }));
        await expect(fetchWikipediaLead('nothing', [])).rejects.toThrow(/No Wikipedia results found/);
    });

    it('throws when the response is an error', async () => {
        vi.stubGlobal('fetch', () => jsonResponse({
            error: { info: 'Too many requests' }
        }, 429));
        await expect(fetchWikipediaLead('beyblade', [])).rejects.toThrow(/Too many requests/);
    });

    it('throws when the body is not JSON', async () => {
        vi.stubGlobal('fetch', () => new Response('not-json', { status: 200 }));
        await expect(fetchWikipediaLead('beyblade', [])).rejects.toThrow(/not JSON/);
    });

    it('builds a URL when the API omits fullurl', async () => {
        vi.stubGlobal('fetch', () => jsonResponse({
            query: {
                pages: [{
                    extract: 'A page.',
                    title: 'Spirited Away'
                }]
            }
        }));
        const page = await fetchWikipediaLead('spirited away', ['film']);
        expect(page.url).toBe('https://en.wikipedia.org/wiki/Spirited_Away');
    });
});
