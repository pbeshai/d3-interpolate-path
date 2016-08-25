module.exports = {
  "extends": "eslint-config-airbnb-base",
  "parser": "babel-eslint",
  "env": {
    "browser": true
  },
  "rules": {
    "no-shadow": 0,
    "no-param-reassign": 0,
    "no-console": 0,
    "no-eval": 0,
    "import/default": 0,
    "import/no-duplicates": 0,
    "import/named": 0,
    "import/namespace": 0,
    "import/no-unresolved": 0,
    "import/no-named-as-default": 2,
    // breaks on importing d3
    "import/no-extraneous-dependencies": 0,
  },
  "plugins": [
    "import"
  ]
};
