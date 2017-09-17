/** @flow */

import { parse } from 'babylon';
import { transform } from 'babel-standalone';

export type ParseError = {
  type: 'SyntaxError',
  line: number,
  column: number,
} | {
  type: 'InvalidJSXExpression',
};

export type ParseResult = {
  transformedCode: string,
} | {
  error: ParseError,
};

const invalidJSXExpressionResult: ParseResult = {
  error: {
    type: 'InvalidJSXExpression',
  },
};

export default function parseCode(
  code: string,
): ParseResult {
  try {
    const ast = parse(code, {
      sourceType: 'script',
      plugins: ['jsx'],
    });

    const body = ast.program.body;
    if (body.length !== 1) {
      return invalidJSXExpressionResult;
    }

    const block = body[0];
    if (block.type !== 'ExpressionStatement') {
      return invalidJSXExpressionResult;
    }

    const expression = block.expression;
    if (expression.type !== 'JSXElement') {
      return invalidJSXExpressionResult;
    }

    const transformedCode = transform(code, {
      babelrc: false,
      presets:['react'],
    }).code;

    return {
      transformedCode,
    };

  } catch (e) {
    if (e instanceof SyntaxError) {
      return {
        error: {
          type: 'SyntaxError',
          line: e.lineNumber,
          column: e.columnNumber,
        },
      };
    }
    // Don't know what this is otherwise
    throw e;
  }
}
