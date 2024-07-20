const {RuleTester} = require("eslint");
const dereferenceRequiresRule = require('./dereferenceLocalRequires');

const ruleTester = new RuleTester();

ruleTester.run(
  "Derefence local requires",
  dereferenceRequiresRule,
  {
    valid: [
      {
        code: "const {foo} = require('../bar.js')",
      },
      {
        code: "const { foo } = require('../bar.js')",
      },
      {
        code: "const {foo,biz} = require('../bar.js')",
      },
      {
        code: "const { foo, biz } = require('../bar.js')",
      },
      {
        code: "const {foo} = require('./bar.js')",
      },
      {
        code: "const { foo } = require('./bar.js')",
      },
      {
        code: "const {foo,biz} = require('./bar.js')",
      },
      {
        code: "const { foo, biz } = require('./bar.js')",
      },
      {
        code: 'const { foo } = require("./bar.js")',
      },
      {
        code: 'const { foo } = require("bar")',
      },
      {
        code: 'const foo = require("bar")',
      },
      {
        code: "const foo = require('bar')",
      },
    ],
    invalid: [
      {
        code: "const foo = require('../bar.js')",
        errors: 1
      },
      {
        code: "const foo = require('./bar.js')",
        errors: 1
      },
      {
        code: 'const foo = require("./bar.js")',
        errors: 1
      },
      {
        code: 'const foo = require("../bar.js")',
        errors: 1
      },
      {
        code: 'const foo = require("./biz/bar.js")',
        errors: 1
      },
      {
        code: 'const foo = require("../biz/bar.js")',
        errors: 1
      },
    ]
  }
);