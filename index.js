var extractor = require('unfluff');
var request = require('request');
var google = require('google');

exports.synopsis = function(mediaTitle, mediaType, callback) {
    if (mediaType === null || mediaType === undefined) {
        mediaType = '';
    }
    // Allow providing a string for mediaType but convert it to array
    // to simplify code
    if (typeof mediaType === 'string'){
        mediaType = [mediaType];
    }
    google(mediaTitle + ' ' + mediaType[0] + ' site:wikipedia.org',
        function(err, next, links){
            if (err) {
                callback(err);
                return;
            }
            if (!links[0]) {
                callback("No Wikipedia Results found for that mediaTitle and mediaType");
                return;
            }
            // Sometimes this will be 'List of x Episodes' for TV shows. Example: 're hamatora'
            var title = getMediaTitle(links[0].title);
            request(links[0].link, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                data = extractor(body);
                var releventParagraphs = getParagraphsUntilMediaMention(data.text, mediaType[0]);
                callback(undefined,
                {
                    title: title,
                    content: releventParagraphs.replace(/(\[.+\])/g,'') // Remove annotations
                });
        } else {
            callback(error);
        }
    });
    });
};


function getMediaTitle(fullLinkText) {
    var title = fullLinkText.split('- Wikipedia')[0];
    var listOfEpsRegex = /.*List of (.*) episodes/.exec(title);
    if(listOfEpsRegex) {
        return listOfEpsRegex[1];
    }
    var filmRegex = /(.*) \(film\)/.exec(title);
    if(filmRegex) {
        return filmRegex[1];
    }
    return title;
}

/**
Three possible return scenarios:

1. First paragraph contains the mediaType, return it
2. First paragraph does not contain the mediaType but the forth down
or less does, return 0 - paragraph containing media term
3. First 4 paragraphs do not contain mediaType, return first paragraph
*/
function getParagraphsUntilMediaMention(text, mediaType) {
    paragraphs = text.split('\n');
    var re = new RegExp('\\b' + mediaType + '\\b', 'i');
    var output = [];
    var index = 0;
    while(index <= paragraphs.length) {
        if(re.test(paragraphs[index]) || mediaType === ''){
            // If there's already stuff in there make a new line,
            // otherwise just return the current paragraph
            return output.length > 0 ?
            output.join('\n') + paragraphs[index] :
            paragraphs[index];
        }
        output.push(paragraphs[index]); // Add whatever was found to output buffer
        index += 1;
    }
    // Word anime wasn't found, return falsey value
    return '';
}