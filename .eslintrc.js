module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 11
    },
    "globals": {
        "SplitsBrowser": "writable",
        "d3": "readonly",
        "$": "readonly"
    },
    "rules": {
        "indent": [
            "error",
            4,
            {"MemberExpression": "off"}
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "double",
            {"avoidEscape": true}
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-trailing-spaces": "error",
        "no-constant-condition": [
            "error",
            {"checkLoops": false}
        ],
        "no-plusplus": "error",
        "eqeqeq": "error",
        "camelcase": "error",
        "curly": "error"
    }
};
