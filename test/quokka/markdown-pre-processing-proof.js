const testStr = `
cat

[[[ +pugMixin({ foo: bar }).large.right ]]]

dog

[[[
  +pugMixin({ foo: bar })
  +pugMixin({ foo: bar })
]]]

dog

[[[ {% njkMacro('hello') %} ]]]

more markdown here
`;

// /\[\[\[([\s\S]+?)\]\]\]/gm.test(testStr); //?
// /\[\[\[([\s\S]+?)\]\]\]/gm.exec(testStr); //?
// testStr.match(/\[\[\[([\s\S]+?)\]\]\]/gm); //?

testStr.replace(/\[\[\[([\s\S]+?)\]\]\]/gm, (match, group, offset, src) => {
  console.log(match);
  console.log(group);
  return "\<h1>HTML HERE</h1>\n";
}); //?
