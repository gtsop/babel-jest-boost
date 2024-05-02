const nodepath = require('path');

function trace_export_named_declaration(state, specifierName, codeFilePath, resolve) {
  if (specifierName === 'default') {
    return {};
  }

  return {
    ExportNamedDeclaration(path) {
      // single declaration export
      // declaration and export within this file
      //
      // export const specifier = 1;
      if (path?.node?.declaration?.id?.name) {
        if (specifierName === path.node.declaration.id.name) {
          const match = {
            name: specifierName,
            source: codeFilePath,
            file: codeFilePath,
          };

          state.match = match
          // return;
        }
      }

      // export specifiers, being imported from somewhere else
      if (path.node.specifiers) {
        path.node.specifiers.forEach((expSpecifier) => {
          if (specifierName === expSpecifier.exported.name) {
            // import { specifier } from './original';
            //
            // export { specifier }'
            if (!path.node?.source?.value) {
              state.match = {
                name: specifierName,
                source: codeFilePath,
                file: codeFilePath,
              };
            } else {
              const source = resolve(path.node.source.value, nodepath.dirname(codeFilePath));

              if (expSpecifier.local?.name === 'default') {
                // export { default as specifier } from './original';
                state.traces.push({
                  name: 'default',
                  source,
                  file: codeFilePath
                })
              } else if (expSpecifier.type === "ExportNamespaceSpecifier") {
                // export * as specifier from './original';
                state.match = {
                  name: expSpecifier.exported.name,
                  source: codeFilePath,
                  file: codeFilePath
                }
              } else {
                // export { specifier } from './original';
                state.traces.push({
                  name: expSpecifier.local.name,
                  source,
                  file: codeFilePath,
                });
              }
            }
          }
        });
      }

      // export const specifier = () => {}
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

module.exports = { trace_export_named_declaration };
