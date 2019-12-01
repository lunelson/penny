(function(socket) {
  const SHOW_OSD_EVENT = 'penny:osd:show';
  const HIDE_OSD_EVENT = 'penny:osd:hide';
  const OSD_ELEM_CLASS = 'penny-osd';

  const styles = {
    '.penny-osd': [
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

    '.penny-osd__wrapper': [
      'background-color: rgb(202, 6, 18)',
      'color: white',
      'top: 0',
      'left: 0',
      'opacity: 0.98',
      'padding: 1rem',
      'height: 100vh',
      'box-sizing: border-box',
    ],

    '.penny-osd__header': [
      'font-family: "helvetica neue", helvetica, sans-serif',
      'box-sizing: border-box',
    ],

    '.penny-osd__content': ['font-family: Consolas, monaco, monospace', 'box-sizing: border-box'],
  };

  // function removeMessage(ctx) {
  //   const el = document.getElementById(OSD_ELEMENT_ID);
  //   if (el) ctx.removeChild(el);
  // }

  // function createMessage(data) {
  //   /** Append CSS */

  //   const style = data.styles || styles;

  //   const sheet = (function() {
  //     const style = document.createElement('style');
  //     style.appendChild(document.createTextNode(''));
  //     document.head.appendChild(style);
  //     return style.sheet;
  //   })();

  //   Object.keys(style).forEach(function(ruleName) {
  //     const rule = `${ruleName}{${style[ruleName].join(';')}}`;
  //     sheet.insertRule(rule, 0);
  //   });

  //   /** Append HTML * */

  //   const el = document.createElement('div');
  //   el.id = OSD_ELEMENT_ID;
  //   el.style = style[`.${OSD_ELEMENT_ID}`].join(';');

  //   let html = [
  //     '<div class="penny-osd__wrapper">',
  //     '<h1 class="penny-osd__header">%s</h1>',
  //     '<div class="penny-osd__content" style="white-space:pre-line;">%s</div>',
  //     '</div>',
  //   ].join('');

  //   html = html
  //     .replace('%s', data.title || 'Message from Browsersync')
  //     .replace('%s', data.body || 'Something happened; Check the console');

  //   el.innerHTML = html;

  //   return el;
  // }

  /* NEW VERSION */

  const osdTemplate = `
    <div className="penny-osd__wrapper">
      <h1 className="penny-osd__heading">%s</h1>
      <div className="penny-osd__message">%s</div>
    </div>
  `;

  let osdVisible = false;

  const osdElement = document.createElement('div');
  osdElement.className = OSD_ELEM_CLASS;

  const osdStyles = {};

  socket.on(HIDE_OSD_EVENT, function() {
    document.body.removeChild(osdElement);
    osdVisible = false;
  });

  socket.on(SHOW_OSD_EVENT, function(data) {
    osdElement.innerHTML = osdTemplate
      .replace('%s', data.heading || 'A message from Penny')
      .replace('%s', data.message || 'Something happened; Check the console');
    if (osdVisible) return;
    document.body.appendChild(osdElement);
    osdVisible = true;
  });
})(window.___browserSync___.socket);
