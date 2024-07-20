const dereferenceRequires = require("./dereferenceLocalRequires");

const plugin = { rules: { "derefence-local-requires": dereferenceRequires}};
module.exports = plugin;