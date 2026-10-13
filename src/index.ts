import { buildSynopsis, type Synopsis } from './text.js';
import { fetchWikipediaLead } from './wikipedia.js';

export type { Synopsis };

function mediaTypeList(mediaTypes: readonly string[]): string[] {
    return [...mediaTypes];
}

/**
 * Look up a short synopsis for a movie, book, anime, game, or other media.
 * Only the first non-empty media type is added to the Wikipedia search.
 * Every non-empty type is used when choosing lead paragraphs.
 */
export async function synopsis(
    mediaTitle: string,
    mediaTypes: readonly string[] = []
): Promise<Synopsis> {
    const types = mediaTypeList(mediaTypes);
    const page = await fetchWikipediaLead(mediaTitle.trim(), types);
    return buildSynopsis(page, types);
}
