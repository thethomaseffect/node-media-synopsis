# CLAUDE.md

Notes for an assistant working on media-synopsis 1.0.0.

## Package

`media-synopsis` is an ES module written in TypeScript. It has no runtime dependencies and needs Node.js 20 or newer.

```ts
import { synopsis } from 'media-synopsis';

const result = await synopsis(mediaTitle, mediaTypes);
```

`result` is `{ title: string, content: string }`. `mediaTitle` is a string. `mediaTypes` is a `readonly string[]`, and it defaults to `[]`. Neither argument is checked again at runtime. Callers use the synopsis as a short sourced description. The cleaned title also turns a loose query such as `mahouka` into `The Irregular at Magic High School`.

Source is `src/`. `npm run build` compiles it to `dist/`, which is what npm publishes. The public entry exports `synopsis` and the `Synopsis` type.

## Commands

- `npm test` typechecks, compiles, and runs Vitest
- `npm run lint` runs ESLint
- `npm run build` writes `dist/`
- `prepublishOnly` lints and tests before `npm publish`

## Layout

- `src/index.ts` exports the public function
- `src/wikipedia.ts` requests the English Wikipedia lead
- `src/text.ts` cleans the title and chooses paragraphs
- `test/` covers those modules and stubs the global `fetch`

## Lookup

Request `https://en.wikipedia.org/w/api.php` with:

- `action=query`
- `generator=search`
- `gsrlimit=1`
- `prop=extracts|info`
- `inprop=url`
- `explaintext=1`
- `exintro=1`
- `redirects=1`
- `format=json` and `formatversion=2`

The search string is the trimmed title plus the first non-empty media type. Send a User-Agent that names `media-synopsis` and links to this repository.

Reject with an `Error` when Wikipedia returns no page or the request fails.

## Text rules

Title, in this order:

1. Drop a ` - Wikipedia...` suffix
2. Turn `List of X episodes` into `X`
3. Drop one trailing parenthetical, such as `(film)` or `(manga)`

Paragraphs: split the lead on newlines, drop empty lines, and read the first four. If a media type appears as a whole word or phrase, keep every paragraph from the start through that match. Otherwise keep the first paragraph. Escape media types before they go into the regular expression.

Content:

- Remove a parenthetical that contains `Japanese:`, `Hepburn:`, or CJK characters
- Remove a parenthetical that follows the cleaned title. `.` in that expression does not match a newline, and a test covers a break inside the parentheses
- Remove bracketed citation markers such as `[1]`
- Append a blank line and `Source: [Wikipedia](url)`

## Tests

Vitest runs `test/**/*.test.ts`. Update those files when the cleanup or the request changes. Stub `fetch`. The suite does not call Wikipedia.

## Publishing

`.github/workflows/publish.yml` runs when a `vX.Y.Z` tag is pushed and `X.Y.Z` matches `version` in `package.json`. It publishes with npm trusted publishing from a GitHub-hosted runner. Do not put an npm token in the repo or the workflow.

The trusted publisher on npmjs.com is:

- user `thethomaseffect`
- repository `node-media-synopsis`
- workflow filename `publish.yml`

Turn on direct `npm publish` for that publisher. Otherwise a new publisher can only run `npm stage publish`. Create the publisher when the tag is about to be pushed. npm expires a publisher that has not published within two days.

The publish job uses Node 24. `.github/workflows/ci.yml` tests Node 20, 22, and 24.

`repository.url` is `git+https://github.com/thethomaseffect/node-media-synopsis.git`.

## Changes

Keep the package dependency-free. Keep the result shape `{ title, content }` and the title and paragraph rules above. Changing either one needs a new major version.
