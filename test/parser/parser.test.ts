"use strict";

import * as Parsimmon from "parsimmon";
import {
    grP, labelP, literalP, instructionLineP, operandP, syntaxKindToStr,
    commentLineP, Parser, printAST
} from "../../src/parser/parser";
import * as os from "os";
import * as util from "util";
import * as fs from "fs";
import * as assert from "assert";
import * as _ from "lodash";


suite("Parser", () => {
    test("parse source", () => {
        const path = "./test/baseline/basic/all.cas";
        // 改行コードが異なるとパース結果が変わってしまうので
        // 改行コードを\r\nに揃える
        const source = fs.readFileSync(path).toString().replace(new RegExp(os.EOL, "g"), "\r\n");
        const parser = new Parser();
        const result = parser.parseSource(path, source);

        const actual = printAST(result.sourceFile);
        const expected = fs.readFileSync("./test/baseline/basic/all.AST.json").toString();
        assert.equal(actual, expected);
    });
});
