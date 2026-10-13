import { afterEach, describe, expect, it, vi } from 'vitest';
import { synopsis } from '../src/index.js';

interface FetchResponse {
    json: () => Promise<unknown>;
    ok: boolean;
    status: number;
}

function pageResponse(): FetchResponse {
    return {
        json: () => Promise.resolve({
            query: {
                pages: [{
                    extract: 'Beyblade, known in Japan as Bakuten Shoot Beyblade (Japanese: 爆転シュートベイブレード, Hepburn: Bakuten Shūto Beiburēdo), is a Japanese manga series.\nAn anime adaptation followed.',
                    fullurl: 'https://en.wikipedia.org/wiki/Beyblade_(manga)',
                    title: 'Beyblade (manga)'
                }]
            }
        }),
        ok: true,
        status: 200
    };
}

describe('synopsis', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns a promise of the cleaned page', async () => {
        vi.stubGlobal('fetch', () => pageResponse());
        const result = await synopsis('beyblade', ['anime', 'Japanese animated']);
        expect(result.title).toBe('Beyblade');
        expect(result.content).toMatch(/^Beyblade, known in Japan as Bakuten Shoot Beyblade, is a Japanese manga series\./);
        expect(result.content).toMatch(/An anime adaptation followed\./);
        expect(result.content).toMatch(/Source: \[Wikipedia\]\(https:\/\/en\.wikipedia\.org\/wiki\/Beyblade_\(manga\)\)/);
        expect(result.content).not.toMatch(/爆転/);
    });

    it('adds the first media type to the Wikipedia search', async () => {
        let query: string | null = null;
        vi.stubGlobal('fetch', (url: string) => {
            query = new URL(url).searchParams.get('gsrsearch');
            return pageResponse();
        });
        await synopsis('mahouka', ['anime']);
        expect(query).toBe('mahouka anime');
    });
});
