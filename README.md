## casl2-language

casl2-languageはCASL2の言語解析機能を持つライブラリです。

## Features

### AST
ASTを生成します。
API: `createSourceFile`

```typescript
import * as casl2 from "@maxfield/casl2-language";

// SourceFileはASTのトップノードです。
const sourceFile = casl2.createSourceFile(path, src);

// 例
// [LAD     GR2, 3] の場合
{
    "kind": "InstructionLine",
    "start": 39,
    "end": 61,
    "instructionCode": {
        "kind": "InstructionCode",
        "start": 47,
        "end": 50,
        "raw": "LAD"
    },
    "operands": {
        "kind": "Operands",
        "start": 55,
        "end": 61,
        "operands": [
            {
                "kind": "Operand",
                "start": 55,
                "end": 58,
                "op": {
                    "kind": "GR",
                    "start": 55,
                    "end": 58,
                    "raw": "GR2"
                }
            },
            {
                "kind": "Operand",
                "start": 60,
                "end": 61,
                "op": {
                    "kind": "Constant",
                    "start": 60,
                    "end": 61,
                    "const": {
                        "kind": "DecConstant",
                        "start": 60,
                        "end": 61,
                        "raw": "3"
                    }
                }
            }
        ]
    }
}
```

## Author
[Maxfield Walker](https://github.com/MaxfieldWalker)

## License
MIT
