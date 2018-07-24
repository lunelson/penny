## howto

- md files require a layout file
  - must be srcDir absolute e.g. /...
  - must have a `block content`
-

## FAQs

- what are the advantages
  - on-the-fly, on-demand build, smart caching/deps-tracking

## recipes

- localisation
  - use symlinks, to generate i18n folder structure
  - keep a /translation subfolder in /data, with YML locale files
  ```
  _i18n/
    foo/ [link to foo]
    bar/ [link to bar]
    baz/ [link to baz]
  foo/
  bar/
  baz/
  de/ [ link to _i18n ]
  fr/ [ link to _i18n ]
  ```

  - will chokidar watch these files, and/or
    - do I need to filter and/or pass-on file events ??
  - will connect serve these files as they are?
  - will my build command build them?
