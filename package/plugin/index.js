const fs = require('fs');
const nodepath = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { get: getRootDir } = require('app-root-dir');
const { resolve } = require('../resolve');
const { withCache } = require('../cache');
const { matchAnyRegex, removeItemsByIndexesInPlace } = require('./utils');

let modulePaths = null;
let moduleNameMapper = null;

let importWhiteList = [];

// eslint-disable-next-line
const isPathWhitelisted = withCache(function actualIsPathWhitelisted(path) {
  return matchAnyRegex(importWhiteList, path);
});


// eslint-disable-next-line
const bjbResolve = withCache(function resolveWithWhitelist(path, basedir) {
  if (isPathWhitelisted(path)) {
    return path;
  }
  return resolve(path, basedir, moduleNameMapper, modulePaths);
});

function resolveImportFile(importDeclarationNode, from) {
  return bjbResolve(importDeclarationNode.source.value, from);
}

const parserConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'tsx', 'typescript', 'decorators-legacy'],
};

function babelParse(code) {
  return babelParser.parse(code, parserConfig);
}

const readCodeAsAST = function actualReadCodeAsAST(codeFilePath) {
  const resolvedPath = bjbResolve(codeFilePath);

  const code = fs.readFileSync(resolvedPath, 'utf-8');

  return babelParse(code);
};

const traceSpecifierOrigin = withCache(function actualTraceSpecifierOrigin(specifierName, codeFilePath) {
  const ast = readCodeAsAST(codeFilePath);

  if (!ast) {
    return false;
  }

  let match = false;

  const traces = [];

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      if (specifierName === 'default') {
        match = {
          name: 'default',
          source: codeFilePath,
          file: codeFilePath,
        };
      }
    },
    ExportNamedDeclaration(path) {
      // single declaration export
      // declaration and export within this file
      if (path?.node?.declaration?.id?.name) {
        if (specifierName === path.node.declaration.id.name) {
          match = {
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
              match = {
                name: specifierName,
                source: codeFilePath,
                file: codeFilePath,
              };
            } else {
              const source = resolveImportFile(path.node, nodepath.dirname(codeFilePath));
              const isDefault = expSpecifier.local.name === 'default';
              const name = isDefault ? 'default' : specifierName;
              const trace = {
                name,
                source,
                file: codeFilePath,
              };
              traces.push(trace);
            }
          }
        });
      }

      // Freaking stupid const declarations
      // export const foo = () => {}
      if (path?.node?.declaration?.declarations) {
        path.node.declaration.declarations.forEach((decl) => {
          if (specifierName === decl.id.name) {
            match = {
              name: specifierName,
              source: codeFilePath,
              file: codeFilePath,
            };
          }
        });
      }
    },
    ExportAllDeclaration(path) {
      // export all lie
      // export * from './foo.js'
      const trace = {
        name: specifierName,
        source: resolveImportFile(path.node, nodepath.dirname(codeFilePath)),
        file: codeFilePath,
      };
      traces.push(trace);
    },
  });

  let result;
  if (traces.length) {
    result = traces.find((trace) => actualTraceSpecifierOrigin(trace.name, trace.source));
  } else if (match) {
    result = match;
  } else {
    result = false;
  }

  return result;
});

module.exports = function babelPlugin(babel) {
  return {
    visitor: {
      Program(path, state) {
        // setup config
        moduleNameMapper = state.opts.jestConfig.moduleNameMapper || {};
        modulePaths = state.opts.jestConfig.modulePaths || [];
        importWhiteList = state.opts.importIgnorePatterns || [];

        const comments = path.parent.comments || [];
        const skipProgramComment = comments.find((comment) =>
          comment.value.trim().includes('@babel-jest-boost no-boost'),
        );

        state.skipParsing = Boolean(skipProgramComment);
      },
      CallExpression(path, state) {
        if (state.skipParsing) {
          // Skip parsing of ImportDeclaration if flag is true
          return;
        }
        if (path.node.callee?.property?.name === 'mock') {
          const mockedPath = path.node.arguments[0].value;
          const resolved = bjbResolve(mockedPath, nodepath.dirname(state.file.opts.filename));
          if (isPathWhitelisted(resolved)) {
            return;
          }
          path.node.arguments[0].value = resolved;
        }
      },
      ImportDeclaration(path, state) {
        if (state.skipParsing) {
          // Skip parsing of ImportDeclaration if flag is true
          return;
        }
        const toRemove = [];
        if (isPathWhitelisted(path.node.source.value)) {
          return;
        }
        // import 'some-raw-file.css'
        if (path.node.specifiers.length === 0) {
          const resolved = bjbResolve(path.node.source.value, nodepath.dirname(state.file.opts.filename));
          if (resolved !== path.node.source.value) {
            path.replaceWith(babel.types.importDeclaration([], babel.types.stringLiteral(resolved)));
          }
          return;
        }
        path?.node?.specifiers?.forEach((specifier, index) => {
          // import * as Something from './somewhere';
          if (babel.types.isImportNamespaceSpecifier(specifier)) {
            const resolved = bjbResolve(path.node.source.value, nodepath.dirname(state.file.opts.filename));
            if (resolved !== path.node.source.value) {
              path.insertBefore(
                babel.types.importDeclaration(
                  [babel.types.importNamespaceSpecifier(specifier.local)],
                  babel.types.stringLiteral(resolved),
                ),
              );
              path.remove();
            }
            return;
          }
          if (!specifier?.imported?.name) return;
          const importedFrom = resolveImportFile(path.node, nodepath.dirname(state.file.opts.filename));

          if (importedFrom) {
            const specifierOrigin = traceSpecifierOrigin(specifier.imported.name, importedFrom);
            if (specifierOrigin) {
              // Transform the import statement
              // If this is a single specifier, as
              // import { foo } from './foo.js'
              // then just replace the source
              if (path.node.specifiers.length === 1) {
                path.insertBefore([
                  babel.types.importDeclaration(
                    [
                      babel.types.importSpecifier(
                        babel.types.identifier(specifier.local.name),
                        babel.types.stringLiteral(specifierOrigin.name),
                      ),
                    ],
                    babel.types.stringLiteral(specifierOrigin.source),
                  ),
                ]);
                path.remove();
                return;
              }
              // If this is a multiple specifier, as
              // import { foo, bar } from './foo.js'
              // then remove the current specifier and create a new import
              if (path.node.specifiers.length > 1) {
                path.insertBefore([
                  babel.types.importDeclaration(
                    [
                      babel.types.importSpecifier(
                        babel.types.identifier(specifier.local.name),
                        babel.types.stringLiteral(specifierOrigin.name),
                      ),
                    ],
                    babel.types.stringLiteral(specifierOrigin.source),
                  ),
                ]);
                toRemove.push(index);
              }
            }
          }
        });
        if (toRemove.length > 1 && toRemove.length === path.node.specifiers.length) {
          path.remove();
        } else if (toRemove.length > 0) {
          removeItemsByIndexesInPlace(toRemove, path.node.specifiers);
        }
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
