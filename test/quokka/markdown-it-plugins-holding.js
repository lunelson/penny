var hljs = require('highlight.js'); // https://highlightjs.org/

// Actual default values
var md = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

.use(mdiContainer, 'section', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'section';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'aside', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'aside';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'nav', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'nav';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'div', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'div';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'minimal', {
    render: function(tokens, idx, _options, env, self) {
      /*
      METHODS / PROPS
        token.type = container_${name}_open/_close
        token.info = raw params
        token.tag = div
        token.attrs = []
        token.block = true
        token.hidden = false
        token.content = ''
        token.attrPush(name, value)
        self.renderToken(tokens, idx, _options, env, self)
      */
      const token = tokens[idx];
      token.tag = 'minimal';
      setOpeningToken(token, (name, args) => {
        token.attrPush(['data-name', name]);
      });
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'spoiler', {
    marker: '/',
    render: function(tokens, idx, _options, env, self) {
      const token = tokens[idx];
      var m = token.info.trim().match(/^spoiler\s+(.*)$/);
      // token.attrs;//?
      // self.renderAttrs.toString() //?
      // token.attrs && self.renderAttrs(token); //?
      // console.log(Object.getPrototypeOf(self));
      return token.nesting > 0 ?
        `<details${self.renderAttrs(token)}><summary>${mdi.utils.escapeHtml(m[1])}</summary>\n` :
          // content goes here
        '</details>\n';
    },
  })
