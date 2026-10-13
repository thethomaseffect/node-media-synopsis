// Trailing disambiguator, such as " (film)" or " (manga)".
const TRAILING_DISAMBIGUATION = /\s+\([^)]*\)$/;

export interface Synopsis {
    content: string;
    title: string;
}

export interface LeadPage {
    extract: string;
    title: string;
    url: string;
}

function escapeRegExp(value: string): string {
    // Characters that would otherwise change the meaning of a regular expression.
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getMediaTitle(fullLinkText: string): string {
    const withoutSite = fullLinkText.split('- Wikipedia')[0].trim();
    // "List of Naruto episodes" keeps "Naruto".
    const seriesName = /List of (.*) episodes/i.exec(withoutSite)?.[1]?.trim();
    if (seriesName) {
        return seriesName;
    }
    return withoutSite.replace(TRAILING_DISAMBIGUATION, '').trim();
}

export function getContentText(text: string, mediaTypes: readonly string[]): string {
    const paragraphs = text
        // One or more newlines separate paragraphs.
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    const opening = paragraphs[0];
    if (opening === undefined) {
        return '';
    }

    const needles = mediaTypes
        .map((type) => type.trim())
        .filter(Boolean);
    if (needles.length === 0) {
        return opening;
    }

    const pattern = needles.map(escapeRegExp).join('|');
    // Case-insensitive whole word or phrase for any supplied media type.
    const mediaTypePattern = new RegExp(`\\b(?:${pattern})\\b`, 'i');
    const limit = Math.min(4, paragraphs.length);
    for (let index = 0; index < limit; index += 1) {
        const paragraph = paragraphs[index];
        if (paragraph !== undefined && mediaTypePattern.test(paragraph)) {
            return paragraphs.slice(0, index + 1).join('\n\n');
        }
    }
    return opening;
}

export function removeUnwantedChars(text: string, title: string): string {
    // Parenthetical immediately after the title. `.` stops at a newline.
    const titlePronunciation = new RegExp(`${escapeRegExp(title)}\\s*\\(.+?\\)`, 'i');
    // Japanese or Hepburn pronunciation, including when it follows the original name. Stays on one line.
    const namedPronunciation = /\s*\([^)\n]*(?:Japanese:|Hepburn:|[\u3040-\u30ff\u3400-\u9fff])[^)\n]*\)/g;

    return text
        .replace(namedPronunciation, '')
        .replace(titlePronunciation, title)
        // Citation markers such as [1].
        .replace(/\[.*?\]/g, '')
        // Runs of spaces or tabs left by the removals above.
        .replace(/[ \t]{2,}/g, ' ')
        // A space before punctuation, such as " ," or " .".
        .replace(/[ \t]+([,.;:])/g, '$1')
        .trim();
}

export function buildSynopsis(page: LeadPage, mediaTypes: readonly string[]): Synopsis {
    const title = getMediaTitle(page.title);
    const relevantParagraphs = getContentText(page.extract, mediaTypes);
    const content = removeUnwantedChars(relevantParagraphs, title);
    if (!content) {
        throw new Error('No synopsis text found on the Wikipedia page');
    }
    return {
        content: `${content}\n\nSource: [Wikipedia](${page.url})`,
        title
    };
}
