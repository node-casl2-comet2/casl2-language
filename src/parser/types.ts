"use strict";

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

export interface LiteralNode extends RawValueNode {
    kind: SyntaxKind.Literal;
}

export interface DecLiteralNode extends RawValueNode {
    kind: SyntaxKind.DecLiteral;
}

export interface HexLiteralNode extends Node {
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
    filePath: string;
    lines: Array<LineNode>;
}
