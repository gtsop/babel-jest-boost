const nodepath = require("path");

function trace_export_named_declaration(
  state,
  specifierName,
  codeFilePath,
  resolve,
) {
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

          state.match = match;
          // return;
        }
      }

      if (path.node.specifiers?.length) {
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
              const source = resolve(
                path.node.source.value,
                nodepath.dirname(codeFilePath),
              );

              if (expSpecifier.local?.name === "default") {
                // export { default as specifier } from './original';
                state.traces.unshift({
                  name: "default",
                  source,
                  file: codeFilePath,
                });
              } else if (expSpecifier.type === "ExportNamespaceSpecifier") {
                // export * as specifier from './original';
                state.match = {
                  name: "*",
                  source,
                  file: codeFilePath,
                };
              } else {
                // export { specifier } from './original';
                state.traces.unshift({
                  name: expSpecifier.local.name,
                  source,
                  file: codeFilePath,
                });
              }
            }
          }
          if (specifierName === expSpecifier.exported.value) {
            // export { one as 'specifier' };
            state.match = {
              name: specifierName,
              source: codeFilePath,
              file: codeFilePath,
            };
          }
        });
      }

      if (path?.node?.declaration?.declarations) {
        path.node.declaration.declarations.forEach((decl) => {
          if (specifierName === decl.id.name) {
            // export const specifier = () => {}
            state.match = {
              name: specifierName,
              source: codeFilePath,
              file: codeFilePath,
            };
          }
          if (decl.id.properties?.length) {
            decl.id.properties.forEach((prop) => {
              if (prop.value?.name === specifierName) {
                // export const { specifier: rename } = someObject;
                state.match = {
                  name: specifierName,
                  source: codeFilePath,
                  file: codeFilePath,
                };
              } else if (prop.key?.name === specifierName) {
                // export const { specifier } = someObject;
                state.match = {
                  name: specifierName,
                  source: codeFilePath,
                  file: codeFilePath,
                };
              }
            });
          }
          if (decl.id.elements?.length) {
            // export const [ specifier, specifier2 ] = somearray
            decl.id.elements.forEach((element) => {
              if (element.name === specifierName) {
                state.match = {
                  name: specifierName,
                  source: codeFilePath,
                  file: codeFilePath,
                };
              }
            });
          }
        });
      }
    },
  };
}

module.exports = { trace_export_named_declaration };
