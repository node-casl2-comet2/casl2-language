"use strict";

import {
    Node, SyntaxKind, OperandNode, OperandsNode, ConstantNode, InstructionLineNode, CommentLineNode,
    SourceFile
} from "./parser/types";

export type NodeVisitor = (node: Node) => void;

export function forEachChild<T>(node: Node, visitor: NodeVisitor) {
    function optForEachChild(node: Node | undefined, visitor: NodeVisitor) {
        if (node) {
            forEachChild(node, visitor);
        }
    }

    // どの種類のノードでも，そのノード自身に訪問(visit)する
    visitNode(node, visitor);

    switch (node.kind) {
        case SyntaxKind.Unknwon:
        case SyntaxKind.Label:
        case SyntaxKind.InstructionCode:
        case SyntaxKind.GR:
        case SyntaxKind.Literal:
        case SyntaxKind.DecLiteral:
        case SyntaxKind.HexLiteral:
        case SyntaxKind.DecConstant:
        case SyntaxKind.HexConstant:
        case SyntaxKind.StringConstant:
        case SyntaxKind.Comment:
            break;

        case SyntaxKind.Operand:
            const operandN = <OperandNode>node;
            forEachChild(operandN.op, visitor);
            break;

        case SyntaxKind.Operands:
            (<OperandsNode>node).operands.forEach(x => forEachChild(x, visitor));
            break;

        case SyntaxKind.Constant:
            forEachChild((<ConstantNode>node).const, visitor);
            break;

        case SyntaxKind.InstructionLine:
            const iln = <InstructionLineNode>node;
            optForEachChild(iln.label, visitor);
            forEachChild(iln.instructionCode, visitor);
            optForEachChild(iln.operands, visitor);
            optForEachChild(iln.comment, visitor);
            break;

        case SyntaxKind.CommentLine:
            const cln = <CommentLineNode>node;
            optForEachChild(cln.comment, visitor);
            break;

        case SyntaxKind.SourceFile:
            const sf = <SourceFile>node;
            sf.lines.forEach(x => forEachChild(x, visitor));
    }
}

function visitNode(node: Node, visitor: NodeVisitor) {
    visitor(node);
}
