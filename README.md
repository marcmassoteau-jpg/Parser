# Visual Parser Module

A powerful, visual parser module that can easily integrate into any application. Parse and map data from CSV, Fixed Width, SWIFT FIN, ISO 20022, and custom formats with an intuitive, best-in-class UI/UX.

**[Live Demo](https://marcmassoteau-jpg.github.io/Parser)**

![Visual Parser](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![License](https://img.shields.io/badge/License-MIT-green)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://marcmassoteau-jpg.github.io/Parser)

## Features

### Supported Formats
- **CSV** - Comma, semicolon, tab, or pipe-separated values
- **Fixed Width** - Positional data with configurable field definitions
- **SWIFT FIN** - MT messages (103, 202, 940, etc.)
- **ISO 20022** - pain, camt, pacs XML messages
- **Custom** - Pattern-based or custom parsing logic

### Visual Interface
- Hierarchical node-based visualization
- Header, transaction, and data nodes
- Interactive drag-and-drop canvas
- Real-time parsing preview

### Data Mapping
- Map source fields to target schema
- Built-in transformations (uppercase, trim, date format, etc.)
- Auto-mapping with similar field detection
- Export/import mapping configurations

### Configuration
- Auto-detect file format and delimiter
- Configurable field definitions for fixed-width
- Custom regex patterns for custom formats
- Validation with error highlighting

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

## Usage

1. **Upload a file** - Drag and drop or click to browse (CSV, Fixed Width, FIN, ISO 20022)
2. **Auto-detection** - The parser automatically detects the format and parses the data
3. **Configure** - Adjust settings in the right panel if needed
4. **Map fields** - Use the mapping tab to transform data to your target schema
5. **Export** - Export your configuration for reuse

## Architecture

```
src/
├── components/
│   ├── Canvas/        # React Flow canvas and nodes
│   ├── Config/        # Configuration panel
│   ├── Layout/        # Header and sidebar
│   ├── Mapping/       # Field mapping interface
│   └── Preview/       # Data preview table
├── parsers/           # Parser engines
│   ├── csvParser.ts
│   ├── fixedWidthParser.ts
│   ├── finParser.ts
│   ├── iso20022Parser.ts
│   └── customParser.ts
├── store/             # Zustand state management
└── types/             # TypeScript types
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **Feature branches** (`feature/**`, `claude/**`) - Build and test on push
- **Main branch** - Build, test, and deploy to GitHub Pages
- **Pull requests** - Build and test before merge

### Workflow

1. Push changes to feature branch
2. CI runs linting and tests
3. If tests pass, create PR to main
4. On merge to main, deploy to GitHub Pages

## API

### Parser Configuration

```typescript
interface ParserConfig {
  type: 'csv' | 'fixed-width' | 'fin' | 'iso20022' | 'custom'
  name: string
  // CSV options
  delimiter?: string
  hasHeader?: boolean
  quoteChar?: string
  // Fixed width options
  fieldDefinitions?: FieldDefinition[]
  // Custom options
  customPattern?: string
}
```

### Parsed Data

```typescript
interface ParsedData {
  records: ParsedRecord[]
  headers: string[]
  metadata: {
    totalRecords: number
    validRecords: number
    invalidRecords: number
    parseTime: number
  }
}
```

### Field Mapping

```typescript
interface FieldMapping {
  sourceField: string
  targetField: string
  transformation?: TransformationType
  defaultValue?: string
}
```

## License

MIT
