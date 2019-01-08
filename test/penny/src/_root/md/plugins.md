---
title: Plugin Testing
layout: _layout.pug
---
# Plugins

## Using PrismJS

This is a non-index page.

::: figure
## something
:::

```js
setTimeout(() => {
  console.log('hello city');
}, 200);

import './_hide/import-test';
```

```scss
$settings: 'kern' 1, 'ss01' on;
.test {
  font-feature-settings: $settings;
  font-feature-settings: var(--font-feature-settings);
  --font-feature-settings: #{inspect($settings)};
  --font-family: #{inspect(('Hack', monospace))};
}
```

```html
<!DOCTYPE html>
<html>

<head>
  <title>My Site</title>
  <script src="/javascripts/jquery.js"></script>
  <script src="/javascripts/app.js"></script>
</head>

<body>
  <h1>My Site</h1>
  <p>Welcome to my super lame site.</p>
  <footer id="footer">
    <p>Copyright (c) foobar</p>
  </footer>
</body>

</html>
```
