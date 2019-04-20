(function(socket) {
  const SHOW_MESSAGE_EVENT = 'osd:show';
  const HIDE_MESSAGE_EVENT = 'osd:hide';
  const MESSAGE_ID = 'bsync-osd';

  const styles = {
    '.bsync-osd': [
      'width: 100%',
      'height: 100%',
      'display: table',
      'background-color: white',
      'color: white',
      'position: absolute',
      'font-family: Consolas',
      'top: 0',
      'left: 0',
      'opacity: 0.98',
      'box-sizing: border-box',
      'z-index: 2147483647',
    ],

    '.bsync-osd__wrapper': [
      'background-color: rgb(202, 6, 18)',
      'color: white',
      'top: 0',
      'left: 0',
      'opacity: 0.98',
      'padding: 1rem',
      'height: 100vh',
      'box-sizing: border-box',
    ],

    '.bsync-osd__header': ['font-family: "helvetica neue", helvetica, sans-serif', 'box-sizing: border-box'],

    '.bsync-osd__content': ['font-family: Consolas, monaco, monospace', 'box-sizing: border-box'],
  };

  function removeMessage(ctx) {
    const el = document.getElementById(MESSAGE_ID);
    if (el) ctx.removeChild(el);
  }

  function createMessage(data) {
    /** Append CSS */

    const style = data.styles || styles;

    const sheet = (function() {
      const style = document.createElement('style');
      style.appendChild(document.createTextNode(''));
      document.head.appendChild(style);
      return style.sheet;
    })();

    Object.keys(style).forEach(function(ruleName) {
      const rule = `${ruleName}{${style[ruleName].join(';')}}`;
      sheet.insertRule(rule, 0);
    });

    /** Append HTML * */

    const el = document.createElement('div');
    el.id = MESSAGE_ID;
    el.style = style[`.${MESSAGE_ID}`].join(';');

    let html = [
      '<div class="bsync-osd__wrapper">',
      '<h1 class="bsync-osd__header">%s</h1>',
      '<div class="bsync-osd__content" style="white-space:pre-line;">%s</div>',
      '</div>',
    ].join('');

    html = html
      .replace('%s', data.title || 'Message from Browsersync')
      .replace('%s', data.body || 'Something happened; Check the console');

    el.innerHTML = html;

    return el;
  }

  // function closeOnEsc(event) {
  //   if (event.keyCode === 27) removeMessage(body);
  // }

  var body = document.getElementsByTagName('body')[0];

  socket.on(HIDE_MESSAGE_EVENT, function() {
    removeMessage(body);
    // window.document.removeEventListener('keydown', closeOnEsc);
  });

  socket.on(SHOW_MESSAGE_EVENT, function(data) {
    removeMessage(body);
    body.appendChild(createMessage(data));
    // window.document.addEventListener('keydown', closeOnEsc);
  });
})(window.___browserSync___.socket);
