# Media Synopsis

Media Synopsis returns a short synopsis for a movie, book, anime, video game, or other media title. It reads the lead section of the matching English Wikipedia article and cleans it up for display.

Requires Node.js 20 or newer.

## Installation

```bash
npm install media-synopsis
```

## Usage

The package is an ES module.

```javascript
import { synopsis } from 'media-synopsis';

const text = await synopsis('beyblade', ['anime', 'Japanese animated']);
console.log(text.title +
    '\n=======================================\n\n' +
    text.content);
```

Prints something like:

```markdown
Beyblade
=======================================

Beyblade, known in Japan as Bakuten Shoot Beyblade, is a Japanese manga series written and illustrated by Takao Aoki, created to promote Takara's Beyblade spinning tops. The series focuses on a group of kids who form teams, which battle one another using Beyblades. It was serialized in Shogakukan's children's manga magazine CoroCoro Comic from August 1999 to June 2004, with its chapters collected and published in 14 tankōbon volumes. It was licensed for English release in North America by Viz Media and in Singapore, Australia and New Zealand by Chuang Yi.

An anime adaptation by Madhouse aired in Japan on TV Tokyo from January to December 2001 and was followed by two sequel series, Beyblade V-Force and Beyblade G-Revolution, and the 2002 film Beyblade: Fierce Battle all three by Nippon Animedia, a partnership between Nippon Animation, Takara, Agatsuma and Epoch. Nelvana licensed and produced English-language adaptations of the anime series and the film.

Source: [Wikipedia](https://en.wikipedia.org/wiki/Beyblade_(manga))
```

The wording comes from the current Wikipedia article, so it will change as that article changes.

## How it works

`synopsis` searches the English Wikipedia API for the media title plus the first media type you passed. For the example above, the search is `beyblade anime`. It takes the first result and reads that page's lead section as plain text.

The lead is split into paragraphs. The first four are checked for any of the media types you provided. If one of those paragraphs mentions a type, every paragraph from the start through that one is kept. If none of them match, or you did not pass any types, only the first paragraph is kept.

The page title is cleaned up for use as a display name. A Wikipedia suffix is removed, `List of X episodes` becomes `X`, and a trailing disambiguator such as `(film)` or `(manga)` is removed. That last part is what turns a loose query such as `mahouka` into `The Irregular at Magic High School`.

The synopsis text drops Japanese and Hepburn pronunciation parentheses, and bracketed citation markers such as `[1]`. A Markdown link to the Wikipedia article is appended. Linking back to Wikipedia is what makes the placeholder text reasonable to show while a real description is still missing.

## API

### `synopsis(mediaTitle, [mediaTypes])`

`mediaTitle` is a string.

`mediaTypes` is an optional array of strings. Only the first non-empty type is added to the Wikipedia search. All of them are used when choosing paragraphs.

The returned Promise resolves to an object with:

- `title` — the cleaned Wikipedia title
- `content` — the synopsis, including a `Source: [Wikipedia](...)` line

The Promise rejects with an `Error` when Wikipedia has no matching page or the request fails.

## Contributing

The cleanup rules are deliberately small. If a real title comes back with a pronunciation, citation, or disambiguator still attached, open an issue with the query, the Wikipedia URL, and what the title or synopsis should have been.

```bash
npm test
npm run lint
```

Vitest covers title cleanup, paragraph selection, pronunciation stripping, and the Wikipedia client with a stand-in for `fetch`. The tests do not call Wikipedia.
