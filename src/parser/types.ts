"use strict";

import { getLineOfPosition } from "./parser";

export enum SyntaxKind {
    Unknwon,
    Label,
    InstructionCode,
    Operands,
    Operand,
    GR,
    Literal,
    DecLiteral,
    HexLiteral,
    Constant,
    DecConstant,
    HexConstant,
    StringConstant,
    Comment,

    InstructionLine,
    CommentLine,

    SourceFile
}

export interface TextRange {
    start: number;
    end: number;
}

export interface Node extends TextRange {
    kind: SyntaxKind;
}

export class NodeObject implements Node {
    public kind: SyntaxKind;
    public start: number;
    public end: number;

    constructor(kind: SyntaxKind, start: number, end: number) {
        this.kind = kind;
        this.start = start;
        this.end = end;
    }
}

export interface RawValueNode extends Node {
    raw: string;
}

export interface LabelNode extends RawValueNode {
    kind: SyntaxKind.Label;
}

export interface InstructionCodeNode extends RawValueNode {
    kind: SyntaxKind.InstructionCode;
}

export interface OperandsNode extends Node {
    kind: SyntaxKind.Operands;
    operands: OperandNode[];
}

export interface OperandNode extends Node {
    kind: SyntaxKind.Operand;
    op: Node;
}

export interface GRNode extends RawValueNode {
    kind: SyntaxKind.GR;
}

export interface LiteralNode extends Node {
    kind: SyntaxKind.Literal;
    literal: Node;
}

export interface DecLiteralNode extends RawValueNode {
    kind: SyntaxKind.DecLiteral;
}

export interface HexLiteralNode extends RawValueNode {
    kind: SyntaxKind.HexLiteral;
}

export interface ConstantNode extends Node {
    kind: SyntaxKind.Constant;
    const: Node;
}

export interface DecConstantNode extends RawValueNode {
    kind: SyntaxKind.DecConstant;
}

export interface HexConstantNode extends RawValueNode {
    kind: SyntaxKind.HexConstant;
}

export interface StringConstantNode extends RawValueNode {
    kind: SyntaxKind.StringConstant;
}

export interface CommentNode extends RawValueNode {
    kind: SyntaxKind.Comment;
}

export interface InstructionLineNode extends Node {
    kind: SyntaxKind.InstructionLine;
    label?: LabelNode;
    instructionCode: InstructionCodeNode;
    operands?: OperandsNode;
    comment?: CommentNode;
}

export interface CommentLineNode extends Node {
    kind: SyntaxKind.CommentLine;
    comment?: CommentNode;
}

export type LineNode = InstructionLineNode | CommentLineNode;

export interface SourceFile extends Node {
    kind: SyntaxKind.SourceFile;
    text: string;
    filePath: string;
    lines: LineNode[];
    getLineAndCharacterOfPosition(pos: number): LineAndCharacter;
    getLineStarts(): number[];
}

export interface LineAndCharacter {
    line: number;
    character: number;
}

export class SourceFileObject extends NodeObject implements SourceFile {
    public kind: SyntaxKind.SourceFile;
    public filePath: string;
    public text: string;
    public lines: LineNode[];

    private lineStarts: number[];

    constructor(kind: SyntaxKind, start: number, end: number, filePath: string, text: string, lineStarts: number[]) {
        super(kind, start, end);
        this.filePath = filePath;
        this.text = text;
        this.lineStarts = lineStarts;
    }

    /**
     * Get line and character of position
     * @param pos Position
     */
    public getLineAndCharacterOfPosition(pos: number): LineAndCharacter {
        const line = getLineOfPosition(pos, this.lineStarts);
        const character = pos - this.lineStarts[line];
        return { line, character };
    }

    public getLineStarts(): number[] {
        return this.lineStarts;
    }
}
