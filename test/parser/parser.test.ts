"use strict";

import * as Parsimmon from "parsimmon";
import {
    grP, labelP, literalP, instructionLineP, operandP, syntaxKindToStr,
    commentLineP, Parser, printAST
} from "../../src/parser/parser";
import * as util from "util";
import * as fs from "fs";
import * as assert from "assert";
import * as _ from "lodash";


suite("Parser", () => {
    test("parse source", () => {
        const path = "./test/baseline/basic/all.cas";
        const source = fs.readFileSync(path).toString();
        const parser = new Parser();
        const result = parser.parseSource(path, source);

        const actual = printAST(result.sourceFile);
        const expected = fs.readFileSync("./test/baseline/basic/all.AST.json").toString();
        assert.equal(actual, expected);
    });
});
