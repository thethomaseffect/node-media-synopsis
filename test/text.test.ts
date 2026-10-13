import { describe, expect, it } from 'vitest';
import { buildSynopsis, getContentText, getMediaTitle, removeUnwantedChars } from '../src/text.js';

describe('getMediaTitle', () => {
    it('drops a Wikipedia suffix and a trailing disambiguator', () => {
        expect(getMediaTitle('Beyblade (manga) - Wikipedia, the free encyclopedia')).toBe('Beyblade');
        expect(getMediaTitle('Spirited Away (film)')).toBe('Spirited Away');
    });

    it('uses the series name from an episode-list title', () => {
        expect(getMediaTitle('List of Hamatora episodes')).toBe('Hamatora');
    });

    it('leaves an ordinary title alone', () => {
        expect(getMediaTitle('The Irregular at Magic High School')).toBe('The Irregular at Magic High School');
    });
});

describe('getContentText', () => {
    const article = [
        'First paragraph about a manga.',
        'Second paragraph mentions an anime adaptation.',
        'Third paragraph.',
        'Fourth paragraph about a video game.',
        'Fifth paragraph should stay unused.'
    ].join('\n');

    it('returns the first paragraph when no media type is given', () => {
        expect(getContentText(article, [])).toBe('First paragraph about a manga.');
    });

    it('returns only the opening paragraph when the type is already there', () => {
        expect(getContentText(article, ['manga'])).toBe('First paragraph about a manga.');
    });

    it('keeps paragraphs through the first media-type mention, up to four', () => {
        expect(getContentText(article, ['anime'])).toBe(
            'First paragraph about a manga.\n\nSecond paragraph mentions an anime adaptation.'
        );
        expect(getContentText(article, ['video game']).split('\n\n')).toEqual([
            'First paragraph about a manga.',
            'Second paragraph mentions an anime adaptation.',
            'Third paragraph.',
            'Fourth paragraph about a video game.'
        ]);
    });

    it('ignores a match past the fourth paragraph', () => {
        const late = 'One.\nTwo.\nThree.\nFour.\nFive mentions anime.';
        expect(getContentText(late, ['anime'])).toBe('One.');
    });

    it('treats a string of regex metacharacters as literal text', () => {
        expect(getContentText('C++ is a language.\nMore.', ['*'])).toBe('C++ is a language.');
    });

    it('does not crash when the article is shorter than four paragraphs', () => {
        expect(getContentText('Only one.', ['anime'])).toBe('Only one.');
    });
});

describe('removeUnwantedChars', () => {
    it('removes a Japanese pronunciation parenthetical and citation markers', () => {
        const source = 'Beyblade, known in Japan as Bakuten Shoot Beyblade (Japanese: 爆転シュートベイブレード, Hepburn: Bakuten Shūto Beiburēdo; lit. \'Explosive-Spin Shoot Beyblade\'), is a Japanese manga series[1].';
        expect(removeUnwantedChars(source, 'Beyblade')).toBe(
            'Beyblade, known in Japan as Bakuten Shoot Beyblade, is a Japanese manga series.'
        );
    });

    it('removes a parenthetical that starts with the original title', () => {
        const source = 'Now and Then, Here and There (今、そこにいる僕, Ima, Soko ni Iru Boku) is a Japanese anime television series[2].';
        expect(removeUnwantedChars(source, 'Now and Then, Here and There')).toBe(
            'Now and Then, Here and There is a Japanese anime television series.'
        );
    });

    it('escapes titles that contain regex metacharacters', () => {
        expect(removeUnwantedChars('a+b (see note) continues', 'a+b')).toBe('a+b continues');
    });

    it('does not treat a newline inside parentheses as part of the match', () => {
        const source = 'Example (line one\nline two) continues';
        expect(removeUnwantedChars(source, 'Example')).toMatch(/line two/);
    });
});

describe('buildSynopsis', () => {
    it('returns a cleaned title, synopsis, and source link', () => {
        const page = {
            extract: 'Hamatora (ハマトラ; lit. \'Yokohama Troubleshooter\') is a Japanese mixed-media project.\n\nAn anime television series followed.',
            title: 'Hamatora',
            url: 'https://en.wikipedia.org/wiki/Hamatora'
        };
        expect(buildSynopsis(page, ['anime'])).toEqual({
            content: 'Hamatora is a Japanese mixed-media project.\n\nAn anime television series followed.\n\nSource: [Wikipedia](https://en.wikipedia.org/wiki/Hamatora)',
            title: 'Hamatora'
        });
    });
});
