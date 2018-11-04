/*

https://github.com/markdown-it/markdown-it/blob/master/docs/development.md
https://markdown-it.github.io/markdown-it/

*/

const { readFileSync } = require('fs');

const mdi = require('markdown-it')({
  html: true, // allow writing html (security is OK, because no user input)
  breaks: true, // line breaks = <br>
  typographer: true,
  highlight: function (str, lang, args='src', env) {
    lang; //?
    args; //?
    env; //?
    return '<pre class="hljs"><code>' + mdi.utils.escapeHtml(str) + '</code></pre>';
  }
});

const unescapeAll     = require('markdown-it/lib/common/utils').unescapeAll;
// const escapeHtml      = require('markdown-it/lib/common/utils').escapeHtml;

mdi.renderer.rules.fence = function (tokens, idx, options, env) {

  let token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : '',
      langName = info ? info.split(/\s+/g, 1)[0] : '',
      argsMatch = null,
      viewArgs = info ?
        (argsMatch = info.match(/\[(.+)\]/)) ?
          argsMatch[1].split(/,\s*/g) :
          '' :
        '';

  return options.highlight(token.content, langName, viewArgs, env);
  // if (info) {
  //   // langName = info.split(/\s+/g, 1)[0];
  //   // let argsMatch = info.match(/\[(.+)\]/);
  //   // viewArgs = (argsMatch && argsMatch[1].split(/,\s*/g)) || ['src'];
  // }

  // return options.highlight ?
  //   options.highlight(token.content, langName, viewArgs, env) || escapeHtml(token.content) :
  //   escapeHtml(token.content);
};

mdi.render(
  readFileSync(__dirname + '/markdown-it-fence.md', 'utf8'),
  { filename: __filename }); //?
