const Ejs = require('ejs');

const configEjs = require('../../lib/config-ejs');

const depFiles = [];

const { ejsOptions, ejsLocals } = configEjs({
  srcFile: __filename,
  depFiles,
  options: {
    isDev: true,
    srcDir: __dirname
  }
});

const ejsString = `
<!DOCTYPE html>
<html lang="en">
<body class="container">
<% include ./test-file %>
</body>
</html>
`;

let template = Ejs.compile(ejsString, ejsOptions);

depFiles.length = 0;
depFiles.push(...template.dependencies);

template(ejsLocals);

depFiles;
