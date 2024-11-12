const nodepath = require("path");
const {
  initializeHelpers,
  resolve,
  isPathWhitelisted,
  traceSpecifierOrigin,
} = require("./helpers");
const { removeItemsByIndexesInPlace, getNewImport } = require("./utils");
const { rewriteMocks } = require("./codemods/jest-mock/rewrite-mocks");

function resolveBabelPath(babelPath, babelState) {
  return resolve(
    babelPath.node.source.value,
    nodepath.dirname(babelState.file.opts.filename),
  );
}

module.exports = function babelPlugin(babel, options) {
  initializeHelpers({
    modulePaths: options.jestConfig?.modulePaths || [],
    moduleNameMapper: options.jestConfig?.moduleNameMapper || {},
    ignoreNodeModules: options.ignoreNodeModules || false,
    importWhiteList: options.importIgnorePatterns || [],
  });

  function usingResolvedPath(babelPath, babelState, callback) {
    const resolved = resolveBabelPath(babelPath, babelState);
    callback(resolved);
  }

  return {
    visitor: {
      Program(path, state) {
        const comments = path.parent.comments || [];
        const skipProgramComment = comments.find((comment) => {
          return comment.value.trim() === "@babel-jest-boost no-boost";
        });
        const skipLines = comments
          .filter((comment) => {
            return comment.value.trim() === "@babel-jest-boost no-boost-next";
          })
          .map((comment) => {
            return comment?.loc?.end?.line + 1;
          });

        state.skipParsing = Boolean(skipProgramComment);
        state.skipLines = skipLines;
      },
      CallExpression(path, state) {
        if (state.skipParsing) {
          // no-boost
          return;
        }
        if (state.skipLines.includes(path?.node?.loc?.start?.line)) {
          // no-boost-next
          return;
        }
        rewriteMocks(path, state);
      },
      ImportDeclaration(path, state) {
        if (state.skipParsing) {
          // no-boost
          return;
        }
        if (state.skipLines.includes(path?.node?.loc?.start?.line)) {
          // no-boost-next
          return;
        }

        if (isPathWhitelisted(path.node.source.value)) {
          // file is in `importIgnorePatterns`
          return;
        }

        usingResolvedPath(path, state, function (resolved) {
          // import 'some-raw-file.css'
          if (path.node.specifiers.length === 0) {
            if (resolved !== path.node.source.value) {
              path.replaceWith(
                babel.types.importDeclaration(
                  [],
                  babel.types.stringLiteral(resolved),
                ),
              );
            }
            return;
          }

          const toRemove = [];
          path.node.specifiers.forEach((specifier, index) => {
            // import * as Something from './somewhere';
            if (babel.types.isImportNamespaceSpecifier(specifier)) {
              if (resolved !== path.node.source.value) {
                path.insertBefore(
                  babel.types.importDeclaration(
                    [babel.types.importNamespaceSpecifier(specifier.local)],
                    babel.types.stringLiteral(resolved),
                  ),
                );

                if (path.node.specifiers.length === 1) {
                  // import * as Something from './somewhere';
                  path.remove();
                } else if (path.node.specifiers.length > 1) {
                  // import defaultSpecifier, * as Something from './somewhere';
                  toRemove.push(index);
                }
              }
              return;
            }

            const isDefaultImport =
              babel.types.isImportDefaultSpecifier(specifier);

            let specifierOrigin = null;

            try {
              specifierOrigin = traceSpecifierOrigin(
                isDefaultImport ? "default" : specifier.imported.name,
                resolved,
              );
            } catch (e) {
              console.log(
                "failed to trace",
                path.node.source.value,
                resolved,
                e.message,
              );
              return;
            }

            if (!specifierOrigin) {
              // For whatever reason, the specifier was not traced. We will
              // just replace the resolved path in the import statement
              path.node.source = babel.types.stringLiteral(resolved);
              return;
            }

            // Transform the import statement
            // If this is a single specifier, as
            // import { foo } from './foo.js'
            // then just replace the source

            if (path.node.specifiers.length === 1) {
              if (specifier.local.name === specifierOrigin.name) {
                // just replace the import path;
                path.node.source = babel.types.stringLiteral(
                  specifierOrigin.source,
                );
                return;
              }

              const newImport = getNewImport(specifierOrigin, specifier);

              path.replaceWith(newImport);
              path.skip();
              return;
            }
            // If this is a multiple specifier, as
            // import { foo, bar } from './foo.js'
            // then remove the current specifier and create a new import
            if (path.node.specifiers.length > 1) {
              const newImport = getNewImport(specifierOrigin, specifier);

              path.insertBefore([newImport]);
              toRemove.push(index);
            }
          });
          if (
            toRemove.length > 1 &&
            toRemove.length === path.node.specifiers.length
          ) {
            path.remove();
          } else if (toRemove.length > 0) {
            removeItemsByIndexesInPlace(toRemove, path.node.specifiers);
          }
        });
        // } catch (e) {
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ', e);
        // }
      },
    },
  };
};
