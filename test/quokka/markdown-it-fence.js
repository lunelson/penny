const { readFileSync } = require('fs');

const mdi = require('markdown-it')({
  html: true, // allow writing html (security is OK, because no user input)
  breaks: true, // line breaks = <br>
  typographer: true,
  highlight: function (str, lang, opts='src') {
    lang; //?
    opts; //?
    return '<pre class="hljs"><code>' + mdi.utils.escapeHtml(str) + '</code></pre>';
  }
});

const assign          = require('markdown-it/lib/common/utils').assign;
const unescapeAll     = require('markdown-it/lib/common/utils').unescapeAll;
const escapeHtml      = require('markdown-it/lib/common/utils').escapeHtml;

mdi.renderer.rules.fence = function (tokens, idx, options, env, slf) {
  var token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : '',
      langName = '',
      langOpts = '',
      highlighted, i, tmpAttrs, tmpToken;

  if (info) {
    langName = info.split(/\s+/g, 1)[0];
    langOpts = info.match(/\[(.+)\]/)[1].split(/,\s*/g); //?
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName, langOpts) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  }

  // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .clone() for token and simplify this part, but
  // now we prefer to keep things local.
  if (info) {
    i        = token.attrIndex('class');
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push([ 'class', options.langPrefix + langName ]);
    } else {
      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
    }

    // Fake token just to render attributes
    tmpToken = {
      attrs: tmpAttrs
    };

    return  '<pre><code' + slf.renderAttrs(tmpToken) + '>'
          + highlighted
          + '</code></pre>\n';
  }


  return  '<pre><code' + slf.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
};
mdi.render(readFileSync(__dirname + '/markdown-it-fence.md', 'utf8')); //?
