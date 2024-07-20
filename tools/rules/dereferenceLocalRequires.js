module.exports = {
  meta: {
      type: "problem",
      docs: {
          description: "Local requires must be dereferenced to build correctly",
      },
      fixable: "code",
      schema: []
  },
  create(context) {
      return {
        VariableDeclarator(node) {
          if(node.parent.kind === "const"){
            // Check if a `const` variable declaration
            // console.log(node.init.callee.name);
            if(node.init.callee && node.init.callee.name === "require"){
              // Check if it's a local require
              // console.log("require arguments: ", node.init.arguments[0].value);
              if(node.init.arguments.length > 0 && node.init.arguments[0].value.match(/^\.\.?\/.+(.js)?/g)){
                // console.log("id type: ", node.id.type);
                if(node.id.type !== "ObjectPattern"){
                  context.report({
                    node,
                    message: 'Local require has not been dereferenced',
                  });
                }
              }
            }
          }
        }
      };
  }
};