var extractor = require('unfluff');
var request = require('request');
var google = require('google');

exports.synopsis = function(mediaTitle, mediaType, callback) {
    if (mediaType === null || mediaType === undefined) {
        mediaType = [''];
    }
    // Allow providing a string for mediaType but convert it to array
    // to simplify code
    if (typeof mediaType === 'string'){
        mediaType = [mediaType];
    }
    // Only use first media type to keep things simple
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
            var title = getMediaTitle(links[0].title.trim());
            request(links[0].link, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                data = extractor(body);
                getContentText(data.text, mediaType);
                var releventParagraphs = getContentText(data.text, mediaType);
                callback(undefined,
                {
                    title: title,
                    content: removeUnwantedChars(releventParagraphs, title) +
                        '\n\nSource: [Wikipedia](' + links[0].link + ')'
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

getContentText = function(text, mediaTypes) {
    paragraphs = text.split('\n');
    // This will build an OR type regex for each media type
    var re = new RegExp('\\b' + mediaTypes.join('\\b|\\b') + '\\b', 'i');
    // Media type(s) is in first paragraph, return it
    if(re.test(paragraphs[0])) {
        return paragraphs[0];
    }
    // Media type(s) in in first 4 parapraphs, return all
    // paragraphs until it's mention
    for(var i = 1; i < 4; i++) {
        if(re.test(paragraphs[i])) {
            return paragraphs.slice(0, i + 1).join('\n');
        }
    }
    // Media type not found, return first paragraph
    return paragraphs[0];
};

function removeUnwantedChars(text, title) {
    // TODO: Replace [\s\S] with . once issue with unfluff is resolved
    var AsianPronunciationsRegex = new RegExp(title + '\\([\\s\\S]*?\\) ', 'i');
    return text
        .replace(AsianPronunciationsRegex, title) // Removes Asian pronunciations
        .replace(/(\[.*?\])/ig, ''); // Removes links to sources
}
