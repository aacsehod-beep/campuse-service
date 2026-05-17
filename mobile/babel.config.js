module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
      // Transform `import.meta` -> `({})` so Metro's non-ESM web bundle
      // doesn't throw "Cannot use 'import.meta' outside a module" (e.g. zustand).
      // Using `{}` instead of `undefined` so `import.meta.env` → `{}.env` === undefined
      // rather than `undefined.env` which would throw a TypeError.
      function importMetaTransform() {
        return {
          visitor: {
            MetaProperty(path) {
              if (
                path.node.meta &&
                path.node.meta.name === 'import' &&
                path.node.property &&
                path.node.property.name === 'meta'
              ) {
                path.replaceWith({ type: 'ObjectExpression', properties: [] });
              }
            },
          },
        };
      },
    ],
  };
};

