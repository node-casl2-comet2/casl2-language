"use strict";

import * as Parsimmon from "parsimmon";
import {
    NodeObject, SyntaxKind,
    Node, RawValueNode, GRNode, LabelNode, InstructionCodeNode, DecConstantNode, HexConstantNode, StringConstantNode, ConstantNode,
    LiteralNode, DecLiteralNode, HexLiteralNode,
    OperandNode, OperandsNode, CommentNode, InstructionLineNode, CommentLineNode, LineNode, SourceFile, SourceFileObject
} from "./types";

import { NodeVisitor, forEachChild, visitNode } from "../api";

function map<TNode extends RawValueNode>(p: Parsimmon.Parser<string>, desc: string, kind: SyntaxKind): Parsimmon.Parser<TNode> {
    return p.mark()
        .desc(desc)
        .map(mark => {
            const node = <TNode>createNode(kind, mark.start.offset, mark.end.offset);
            node.raw = mark.value;
            return node;
        });
}

// ラベル
export function labelP() {
    const first = Parsimmon.regex(/[A-Z]/);
    const remaining = Parsimmon.regex(/[0-9A-Z]/).many();
    const f = (x: string, y: string[]) => x + y.join("");
    const p = Parsimmon.seqMap(first, remaining, f);
    return map<LabelNode>(p, "ラベル", SyntaxKind.Label);
}

// 命令コード
export function instructionCodeP() {
    const instructions = [
        "START", "END", "DS", "DC", "NOP", "LD", "ST", "LAD",
        "ADDA", "ADDL", "SUBA", "SUBL", "AND", "OR", "XOR", "CPA",
        "CPL", "SRA", "SLA", "SLL", "SRL", "JMI", "JNZ", "JZE",
        "JUMP", "JPL", "JOV", "PUSH", "POP", "CALL", "RET",
        "SVC", "IN", "OUT", "RPUSH", "RPOP"
    ];

    const p = instructions
        .map(x => Parsimmon.string(x))
        .reduce((a, b) => a.or(b));
    return map<InstructionCodeNode>(p, "命令コード", SyntaxKind.InstructionCode);
}

// GR
export function grP() {
    const pre = Parsimmon.string("GR");
    const n = Parsimmon.regex(/[0-8]/);
    const p = Parsimmon.seqMap(pre, n, (x, y) => x + y);
    return map<GRNode>(p, "GR", SyntaxKind.GR);
}

// 10進定数
export function decConstantP() {
    const minus = Parsimmon.regex(/-?/);
    const digits = Parsimmon.regex(/[0-9]+/);
    const f = (x: string, y: string) => x + y;
    const p = Parsimmon.seqMap(minus, digits, f);
    return map<DecConstantNode>(p, "10進定数", SyntaxKind.DecConstant);
}

// 16進定数
export function hexConstantP() {
    const sharp = Parsimmon.string("#");
    const remaining = Parsimmon.regex(/[0-9a-fA-F]+/);
    const f = (x: string, y: string) => x + y;
    const p = Parsimmon.seqMap(sharp, remaining, f);
    return map<HexConstantNode>(p, "16進定数", SyntaxKind.HexConstant);
}

// 文字定数
export function stringConstantP() {
    const quote = Parsimmon.string("'");
    const content = Parsimmon.any.atLeast(1);
    const f = (x: string, y: string[], z: string) => y.join("");
    const p = Parsimmon.seqMap(quote, content, quote, f);
    return map<StringConstantNode>(p, "文字定数", SyntaxKind.StringConstant);
}

// 定数
export function constantP() {
    const dec = decConstantP();
    const hex = hexConstantP();
    const str = stringConstantP();
    const label = labelP();
    const p = dec.or(hex).or(str).or(label);
    return p
        .desc("定数")
        .map(node => {
            const n = <ConstantNode>cloneNode(node, SyntaxKind.Constant);
            n.const = node;
            return n;
        });
}

// リテラル
export function literalP() {
    const dec = decLiteralP();
    const hex = hexLiteralP();
    const p = dec.or(hex);
    return p
        .desc("リテラル")
        .map(node => {
            const n = <LiteralNode>cloneNode(node, SyntaxKind.Literal);
            n.literal = node;
            return n;
        });
}

// 10進リテラル
export function decLiteralP() {
    const equal = Parsimmon.string("=");
    const dec = decConstantP();
    const f = (x: string, y: DecConstantNode) => x + y.raw;
    const p = Parsimmon.seqMap(equal, dec, f);
    return map<DecLiteralNode>(p, "10進リテラル", SyntaxKind.DecLiteral);
}

// 16進リテラル
export function hexLiteralP() {
    const equal = Parsimmon.string("=");
    const hex = hexConstantP();
    const f = (x: string, y: HexConstantNode) => x + y.raw;
    const p = Parsimmon.seqMap(equal, hex, f);
    return map<HexLiteralNode>(p, "16進リテラル", SyntaxKind.HexLiteral);
}

// オペランド
export function operandP() {
    const p = grP().or(labelP()).or(literalP()).or(constantP());
    return p
        .desc("オペランド")
        .map(node => {
            const n = <OperandNode>cloneNode(node, SyntaxKind.Operand);
            n.op = node;
            return n;
        });
}

// オペランド列
export function operandsP() {
    const comma = Parsimmon.regex(/,\s*/);
    const p = Parsimmon.sepBy(operandP(), comma).mark();
    return p
        .desc("オペランド列")
        .map(mark => {
            const n = <OperandsNode>createNode(SyntaxKind.Operands, mark.start.offset, mark.end.offset);
            n.operands = [];
            mark.value.forEach(x => n.operands.push(x));
            return n;
        });
}

// コメント
export function commentP() {
    const semicolon = Parsimmon.string(";");
    const f = (x: string, y: string[]) => x + y.join("");
    const p = Parsimmon.seqMap(semicolon, Parsimmon.any.many(), f);
    return map<CommentNode>(p, "コメント", SyntaxKind.Comment);
}

function getFirstElement(x: any[]) {
    return x.length > 0 ? x[0] : undefined;
}

// 命令行
export function instructionLineP() {
    function label() {
        const label = labelP().atMost(1);
        const f = (x: LabelNode[], y: string) => getFirstElement(x);
        return Parsimmon.seqMap(label, Parsimmon.whitespace, f);
    }

    function instruction() {
        return instructionCodeP();
    }

    function operands() {
        return Parsimmon.seqMap(
            Parsimmon.whitespace, operandsP(), (x, y) => y).atMost(1)
            .map(x => {
                if (x.length == 0) return undefined;
                const first = x[0];
                return first.operands.length > 0 ? first : undefined
            });
    }

    function comment() {
        const f = (x: string, y: string[], z: string) => y.join("");
        return Parsimmon.seqMap(
            Parsimmon.optWhitespace, commentP(), Parsimmon.optWhitespace,
            (x, y, z) => y).atMost(1).map(getFirstElement);
    }

    const p = Parsimmon.seq(
        label(), instruction(), operands(), comment()
    );

    return p
        .mark()
        .desc("命令行")
        .map(mark => {
            const [label, instructionCode, operands, comment] = mark.value;
            const node = <InstructionLineNode>createNode(SyntaxKind.InstructionLine, mark.start.offset, mark.end.offset);
            node.label = label;
            node.instructionCode = instructionCode;
            node.operands = operands;
            node.comment = comment;

            return node;
        });
}

// コメント行
export function commentLineP() {
    const eol = Parsimmon.regex(/$/);
    const p = Parsimmon.seqMap(Parsimmon.optWhitespace, commentP().atMost(1), eol, (x, y, z) => y[0]);
    return p
        .mark()
        .desc("コメント行")
        .map(mark => {
            const node = <CommentLineNode>createNode(SyntaxKind.CommentLine, mark.start.offset, mark.end.offset);
            node.comment = mark.value;

            return node;
        });
}

// 命令行またはコメント行
export function instructionOrCommentLine() {
    const p = instructionLineP().or(commentLineP());
    return p;
}

export type ParseResult = ParseResultSuccess | ParseResultFailure;

export interface ParseResultBase {
    success: boolean;

    /**
     * SourceFileノード
     */
    sourceFile: SourceFile;

    /**
     * 行の始まる文字の位置の配列
     */
    lineStarts: number[];
}

export interface ParseResultSuccess extends ParseResultBase {
    success: true;
}

export interface ParseResultFailure extends ParseResultBase {
    success: false;
    failures: Parsimmon.Failure[];
}

function resolveSyntaxPosOffset(node: Node, offset: number) {
    const visitor: NodeVisitor = (node: Node) => {
        node.start += offset;
        node.end += offset;

        forEachChild(node, visitor);
    };

    visitNode(node, visitor);
}

export function lineP() {
    return Parsimmon.regex(/.*/);
}

export function mySepBy<T1, T2>(content: Parsimmon.Parser<T1>, sep: Parsimmon.Parser<T2>) {
    const remaining = Parsimmon.seq(sep, content);
    const p = Parsimmon.seqMap(content, remaining.many(), (x, y) => {
        const results: [T1, T2 | undefined][] = [];
        results.push([x, y[0][0]]);

        for (let i = 0; i < y.length - 1; i++) {
            results.push([y[i][1], y[i + 1][0]]);
        }

        results.push([y[y.length - 1][1], undefined]);

        return results;
    });
    return p;
}

export function linesP() {
    const eol = Parsimmon.regex(/(\r\n|\r|\n)/);
    return mySepBy(lineP(), eol);
}

export class Parser {
    private _lineParser: Parsimmon.Parser<LineNode>;

    constructor() {
        this._lineParser = instructionOrCommentLine();
    }

    /**
     * Parse a line of code
     * @param line Line to parse.
     * @param Offset of the line starts.
     */
    public parseLine(line: string, offset: number) {
        const result = this._lineParser.parse(line);
        if (result.status) {
            resolveSyntaxPosOffset(result.value, offset);
        } else {
            result.index.column += offset;
            result.index.offset += offset;
        }
        return result;
    }

    public parseSource(filePath: string, source: string): ParseResult {
        const lp = lineP();

        const linesResult = linesP().parse(source);
        if (!linesResult.status) throw new Error();

        const lineStarts: number[] = [];
        const sourceFile = new SourceFileObject(SyntaxKind.SourceFile, 0, source.length, filePath, lineStarts);
        sourceFile.lines = [];
        const failures: Parsimmon.Failure[] = [];

        let offset = 0;
        for (const l of linesResult.value) {
            lineStarts.push(offset);

            const [line, eol] = l;
            const length = line.length + (eol ? eol.length : 0);

            const result = this.parseLine(line, offset);
            if (result.status == true) {
                // パース成功の場合
                sourceFile.lines.push(result.value);
            } else {
                // パース失敗の場合
                failures.push(result);
            }

            offset += length;
        }

        if (failures.length == 0) {
            const success: ParseResultSuccess = {
                success: true,
                sourceFile,
                lineStarts
            };

            return success;
        } else {
            const failure: ParseResultFailure = {
                success: false,
                sourceFile,
                failures,
                lineStarts
            };

            return failure;
        }
    }
}


export function createNode(kind: SyntaxKind, start: number, end: number): Node {
    return new NodeObject(kind, start, end);
}

export function cloneNode(node: Node, kind: SyntaxKind) {
    return createNode(kind, node.start, node.end);
}

export function syntaxKindToStr(kind: SyntaxKind): string {
    return SyntaxKind[kind];
}

export function printAST(sourceFile: Node) {
    const replacer = (key: string, value: any) => {
        if (key === "kind") {
            return syntaxKindToStr(value);
        }

        return value;
    };

    return JSON.stringify(sourceFile, replacer, "    ");
}

/**
 * Get line
 * @param pos Poistion to get line
 * @param lineStarts Array of line starts
 */
export function getLineOfPosition(pos: number, lineStarts: number[]) {
    function binarySearch(start: number, end: number): number {
        const range = end - start;
        const mid = start + range / 2;
        const v = lineStarts[mid];
        if (range == 0) {
            return pos < v ? mid - 1 : mid;
        }

        if (v == pos) {
            return mid;
        }
        else if (v > pos) {
            return binarySearch(start, mid - 1);
        } else {
            return binarySearch(mid + 1, end);
        }
    }

    return binarySearch(0, lineStarts.length - 1);
}
