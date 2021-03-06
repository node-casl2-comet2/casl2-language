"use strict";

import {
    Node, SyntaxKind, OperandNode, OperandsNode, ConstantNode, InstructionLineNode, CommentLineNode,
    LiteralNode, SourceFile
} from "./parser/types";
import { Parser } from "./parser/parser";

export type NodeVisitor = (node: Node) => void;

/**
 * Visit all child nodes.
 * @param node Node to traverse its children
 * @param visitor Visitor function
 */
export function forEachChild<T>(node: Node, visitor: NodeVisitor) {
    switch (node.kind) {
        case SyntaxKind.Unknwon:
        case SyntaxKind.Label:
        case SyntaxKind.InstructionCode:
        case SyntaxKind.GR:
        case SyntaxKind.DecLiteral:
        case SyntaxKind.HexLiteral:
        case SyntaxKind.DecConstant:
        case SyntaxKind.HexConstant:
        case SyntaxKind.StringConstant:
        case SyntaxKind.Comment:
            break;

        case SyntaxKind.Literal:
            visitNode((<LiteralNode>node).literal, visitor);
            break;

        case SyntaxKind.Operand:
            const operandN = <OperandNode>node;
            visitNode(operandN.op, visitor);
            break;

        case SyntaxKind.Operands:
            visitNodes((<OperandsNode>node).operands, visitor);
            break;

        case SyntaxKind.Constant:
            const cn = (<ConstantNode>node);
            visitNode(cn.const, visitor);
            break;

        case SyntaxKind.InstructionLine:
            const iln = <InstructionLineNode>node;
            visitNode(iln.label, visitor);
            visitNode(iln.instructionCode, visitor);
            visitNode(iln.operands, visitor);
            visitNode(iln.comment, visitor);
            break;

        case SyntaxKind.CommentLine:
            const cln = <CommentLineNode>node;
            visitNode(cln.comment, visitor);
            break;

        case SyntaxKind.SourceFile:
            const sf = <SourceFile>node;
            visitNodes(sf.lines, visitor);
    }
}

export function visitNode(node: Node | undefined, visitor: NodeVisitor) {
    if (node) {
        visitor(node);
    }
}

export function visitNodes(nodes: Node[] | undefined, visitor: NodeVisitor) {
    if (nodes) {
        for (const node of nodes) {
            visitNode(node, visitor);
        }
    }
}

export function createSourceFile(filepath: string, source: string) {
    const parser = new Parser();
    const result = parser.parseSource(filepath, source);
    return result.sourceFile;
}
