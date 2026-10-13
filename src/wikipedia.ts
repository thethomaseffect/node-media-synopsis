import pkg from '../package.json' with { type: 'json' };
import type { LeadPage } from './text.js';

const API_URL = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = `media-synopsis/${pkg.version} (https://github.com/thethomaseffect/node-media-synopsis; thethomaseffect@gmail.com)`;

interface WikiPage {
    extract?: string;
    fullurl?: string;
    missing?: boolean;
    title?: string;
}

interface WikiBody {
    error?: { info?: string };
    query?: { pages?: WikiPage[] };
}

export function searchQuery(mediaTitle: string, mediaTypes: readonly string[]): string {
    const hint = mediaTypes
        .map((type) => type.trim())
        .find((type) => type !== '');
    if (!hint) {
        return mediaTitle;
    }
    return `${mediaTitle} ${hint}`;
}

function pageUrl(page: WikiPage): string {
    if (typeof page.fullurl === 'string' && page.fullurl) {
        return page.fullurl;
    }
    const slug = encodeURIComponent((page.title ?? '').replace(/ /g, '_'));
    return `https://en.wikipedia.org/wiki/${slug}`;
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function isWikiBody(value: unknown): value is WikiBody {
    return typeof value === 'object' && value !== null;
}

function failureMessage(response: Response, body: unknown): string {
    if (isWikiBody(body) && typeof body.error?.info === 'string') {
        return body.error.info;
    }
    return `Wikipedia request failed with status ${response.status}`;
}

export async function fetchWikipediaLead(
    mediaTitle: string,
    mediaTypes: readonly string[]
): Promise<LeadPage> {
    const params = new URLSearchParams({
        action: 'query',
        explaintext: '1',
        exintro: '1',
        format: 'json',
        formatversion: '2',
        generator: 'search',
        gsrlimit: '1',
        gsrsearch: searchQuery(mediaTitle, mediaTypes),
        inprop: 'url',
        prop: 'extracts|info',
        redirects: '1'
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
            Accept: 'application/json',
            'User-Agent': USER_AGENT
        },
        signal: AbortSignal.timeout(15000)
    });
    const body = await readJson(response);
    if (!response.ok || (isWikiBody(body) && body.error)) {
        throw new Error(failureMessage(response, body));
    }
    if (!isWikiBody(body)) {
        throw new Error('Wikipedia returned a response that was not JSON');
    }

    const page = body.query?.pages?.[0];
    if (!page || page.missing === true || typeof page.title !== 'string' || typeof page.extract !== 'string' || page.extract.trim() === '') {
        throw new Error('No Wikipedia results found for that media title and media type');
    }

    return {
        extract: page.extract,
        title: page.title,
        url: pageUrl(page)
    };
}
