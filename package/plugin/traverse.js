const nodepath = require('path');
const traverse = require('@babel/traverse').default;

class Tracer {
  construct(resolve, codeToAst) {
    this.resolve = resolve;
    this.codeToAst = codeToAst;
  }

  traceOriginalExport(specifierName, codeFilePath) {
    const ast = this.codeToAst(codeFilePath);

    if (!ast) {
      return false;
    }

    let state = {
      match: false,
      traces: []
    }

    traverse(ast, {
      ...traverse_export_default(state, specifierName, codeFilePath),
      ...traverse_export_named_declaration(state, specifierName, codeFilePath, this.resolve),
      ...traverse_export_all_declaration(state, specifierName, codeFilePath, this.resolve),
    });

    let result;
    if (state.traces.length) {
      result = state.traces.find((trace) => this.traceOriginalExport(trace.name, trace.source));
    } else if (state.match) {
      result = state.match;
    } else {
      result = false;
    }

    return result;
  }


}
function traverse_export_default(state, specifierName, codeFilePath) {
  if (specifierName !== 'default') {
    return {};
  }

  return {
    ExportDefaultDeclaration() {
      state.match = {
        name: 'default',
        source: codeFilePath,
        file: codeFilePath,
      };
    }
  }
}

function traverse_export_named_declaration(state, specifierName, codeFilePath, resolve) {
  return {
    ExportNamedDeclaration(path) {
      // single declaration export
      // declaration and export within this file
      if (path?.node?.declaration?.id?.name) {
        if (specifierName === path.node.declaration.id.name) {
          state.match = {
            name: specifierName,
            source: codeFilePath,
            file: codeFilePath,
          };
        }
      }

      // export specifiers, being imported from somewhere else
      // eg export { foo } from './foo';
      if (path.node.specifiers) {
        path.node.specifiers.forEach((expSpecifier) => {
          if (specifierName === expSpecifier.exported.name) {
            // const foo = () => {}
            // export { foo }'
            if (!path.node?.source?.value) {
              state.match = {
                name: specifierName,
                source: codeFilePath,
                file: codeFilePath,
              };
            } else {
              const source = resolve(path.node, nodepath.dirname(codeFilePath));
              const isDefault = expSpecifier.local.name === 'default';
              const name = isDefault ? 'default' : specifierName;
              const trace = {
                name,
                source,
                file: codeFilePath,
              };
              state.traces.push(trace);
            }
          }
        });
      }

      // Freaking stupid const declarations
      // export const foo = () => {}
      if (path?.node?.declaration?.declarations) {
        path.node.declaration.declarations.forEach((decl) => {
          if (specifierName === decl.id.name) {
            state.match = {
              name: specifierName,
              source: codeFilePath,
              file: codeFilePath,
            };
          }
        });
      }
    },
  }
}

function traverse_export_all_declaration(state, specifierName, codeFilePath, resolve) {
  return {
    ExportAllDeclaration(path) {
      // export all lie
      // export * from './foo.js'
      state.traces.push({
        name: specifierName,
        source: resolve(path.node, nodepath.dirname(codeFilePath)),
        file: codeFilePath,
      })
    }
  }
}

module.exports = {
  traverse_export_default,
  traverse_export_named_declaration,
  traverse_export_all_declaration,
  Tracer
};
