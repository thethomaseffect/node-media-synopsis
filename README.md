Media Synopsis
==============

Media Synopsis lets you get a synopsis for books, movies, video games, anime and more.

Installation
------------

`npm install media-synopsis`

Usage
-----

```javascript
var synopsis = require('media-synopsis').synopsis;

synopsis('beyblade', ['anime', 'Japanese animated'], function(err, text) {
    if (err) {
        console.log(err);
        return;
    }
    console.log(text.title +
        '\n=======================================\n\n' +
        text.content);
});
```


Prints:

```markdown
Beyblade
=======================================

Beyblade, known in Japan as Explosive Shoot Beyblade ( Bakuten Shūto Beiburēdo?), is a Japanese manga series written and illustrated by Takao Aoki in order to promote sales of spinning tops called "Beyblades". Originally serialized in CoroCoro Comic from January, 2000 to December, 2003, the individual chapters were collected and published in 14 tankōbon by Shogakukan. The series focuses on a group of kids who form teams with which they battle one another using Beyblades.

The manga is licensed for English language release in North America by Viz Media. An anime adaptation, also titled Beyblade and spanning 51 episodes, aired in Japan on TV Tokyo from January 8, 2001 to December 24, 2001. The second, Beyblade V-Force, ran for another 51 episodes from January 7, 2002 until December 30, 2002. Beyblade G-Revolution, the third and final adaptation, also spanned 52 episodes (the last two episodes were released together as a double-length special in Japan) and aired from January 6, 2003, until its conclusion on December 28, 2003. Nelvana licensed the anime for an English-language release. Takara Tomy also developed the Beyblade toy line.

Source: [Wikipedia](http://en.wikipedia.org/wiki/Beyblade)

```
How it works?
-------------

Media Synopsis takes the first Google result for mediaTitle + first provided mediaType + site:wikipedia.org. So for the example above it gets the first Google result for 'beyblade anime site:wikipedia.org'.

It then visits the Wikipedia page and attempts to get a synopsis for the media types you provided. Since the Wikipedia page may not be just the media you're looking for, it checks the first 4 paragraphs for your media types. If none of them are found, or you didn't provide any then only the first paragraph is returned. If they are found, then every paragraph from the first to the one where they were found inclusive will be returned.

This library was written to be used for generating placeholder text on a media collector's site before being replaced with real content. Linking back to Wikipedia as the source makes it nice and legal too so you might mind it useful if you want to try and provide feedback to the user that the title they're typing for a piece of media is correct.

This library has one other use: Auto-correcting media names based on the title of the Wikipedia article. This may be of limited usefulness but it's useful for getting widely accepted titles for Japanese Anime (e.g. 'mahouka' returns 'The Irregular at Magic High School').

API
---

###`synopsis(mediaTitle, [mediaTypes], callback)`

mediaTitle is a string, mediaTypes is an array of strings, or if there is only one a string can be provided. Callback is a function that should take two params: error and response.

Returns an object with a `title` and `content` property. The `title` is a cleaned up Wikipedia title for the page, with things like ' - Wikipedia, the free encyclopedia' and '(film)' removed. The content is the synopsis of the media based on 1 - 4 of the first paragraphs on the media's Wikipedia page. It removes things like links to sources and Asian pronunciations (quite basic right now).

Contributing
------------

Only real-world use can help improve the code that cleans up the content removing the irrelevant and making sure the title doesn't have anything extra included. If you spot unexpected output then please create an issue or submit a pull request and I'll try to fix.

Tests?
------

Eheheheh yeah, this library is like one big side effect. Tests this early for stuff like the content and title clean ups would have to be updated with every change and not help all that much. I'm usually super pro-testing so if the library ever goes >150 lines I'll start breaking out functions and writing tests for the pure parts. Right now though linking to source wikipedia page and to the output and explaining what should be different in an issue is good enough.
