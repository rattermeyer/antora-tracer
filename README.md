# Antora Requirements Traceability Extension

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D14-brightgreen)](https://nodejs.org/)

**Requirements traceability extensions for Antora/AsciiDoc** - Similar to Sphinx Needs but designed for the Antora/AsciiDoc ecosystem.

## 🚀 Quick Start

### Installation

```bash
npm install antora-requirements-traceability
```

### Basic Usage

```bash
# Process a single file
npx antora-req-trace process -i requirements.adoc -o output/

# Generate traceability matrix
npx antora-req-trace matrix -t req-impl

# Validate requirements
npx antora-req-trace validate
```

## 📋 Features

### Planned Features (Implementation in Progress)

- ✅ **Development Environment Setup** (Task 1 - Complete)
- ⏳ **AsciiDoc Processor Plugin** (Task 2 - Pending)
- ⏳ **Traceability Graph** (Task 3 - Pending)
- ⏳ **Matrix Generation** (Task 4 - Pending)
- ⏳ **Test Suite** (Task 5 - Pending)

### Future Features

- Requirement definition with `[req]` block macro
- Traceability linking with inline macros
- Multiple matrix types (Req→Impl, Req→Test, Full)
- Antora extension for UI integration
- Comprehensive error handling
- Performance optimization

## 📖 Documentation

### Syntax Examples

#### Requirement Definition

```asciidoc
[req, id=REQ-001, status=approved]
====
.Requirement: User Authentication
The system shall require user authentication.
====
```

#### Implementation Linking

```asciidoc
[imp, id=IMP-001]
====
.Implementation: Authentication Service
Implements req:REQ-001[] and req:REQ-002[].
====
```

#### Test Linking

```asciidoc
[test, id=TEST-001]
====
.Test: Successful Authentication
Verifies req:REQ-001[].
====
```

## 🔧 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/antora-requirements-traceability.git
cd antora-requirements-traceability

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
.
├── src/                  # Source code
├── lib/                  # Built code (generated)
├── test/                 # Test files
├── examples/             # Example usage
├── docs/                 # Documentation
├── scripts/              # Build scripts
└── package.json
```

## 🎯 Roadmap

### Phase 1: Core Processing (MVP)
- [x] Task 1: Set Up Development Environment ✅
- [ ] Task 2: Implement Basic AsciiDoc Processor Plugin
- [ ] Task 3: Implement Traceability Graph
- [ ] Task 4: Implement Basic Matrix Generation
- [ ] Task 5: Create Test Suite

### Phase 2: Enhanced Features
- [ ] Task 6: Add Additional Macros
- [ ] Task 7: Enhance Matrix Generation
- [ ] Task 8: Add Error Handling
- [ ] Task 9: Performance Optimization

### Phase 3: Antora Integration
- [ ] Task 10: Create Antora Extension Skeleton
- [ ] Task 11: Implement UI Integration
- [ ] Task 12: Integrate Matrix Generation

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Sphinx Needs
- Built for the Antora/AsciiDoc ecosystem
- Thanks to all contributors and users!