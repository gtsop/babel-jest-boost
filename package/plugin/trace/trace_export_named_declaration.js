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
          state.match = {
            name: specifierName,
            source: codeFilePath,
            file: codeFilePath,
          };
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
              // export { specifier } from './original';
              const source = resolve(path.node.source.value, nodepath.dirname(codeFilePath));
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
