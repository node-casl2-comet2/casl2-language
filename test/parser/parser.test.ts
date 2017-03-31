"use strict";

import * as Parsimmon from "parsimmon";
import {
    grP, labelP, literalP, instructionLineP, operandP, syntaxKindToStr,
    commentLineP, Parser, printAST
} from "../../src/parser/parser";
import * as util from "util";
import * as fs from "fs";


suite("Parser", () => {
    test("operand parser", () => {
        const p = operandP();
        const r = p.parse("GR1");
        console.log(r);
    });

    test("literal parser", () => {
        const p = literalP();
        const r = p.parse("=123");
        console.log(r);
    });

    test("instruction line parser", () => {
        const p = instructionLineP();

        const lines = [
            "CASL START   "
        ];

        for (const l of lines) {
            const r = p.parse(l);
            if (r.status) {
                console.log(printAST(r.value));
            }
        }
    });

    test("comment line parser", () => {
        const p = commentLineP();

        const r1 = p.parse("   ");
        const r2 = p.parse("   ;hello");
        const r3 = p.parse("");
        console.log(r1);

    });

    test("parse source", () => {
        const path = "./test/baseline/basic/simple.cas";
        const source = fs.readFileSync(path).toString();
        const parser = new Parser();
        const result = parser.parseSource(path, source);
        fs.writeFileSync("./AST.json", printAST(result.sourceFile));
    });
});
