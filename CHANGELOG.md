# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-21

**Initial Beta Release** 🎉

This is the first public release of the Toqan AI n8n Community Node. The node is fully functional but marked as beta (0.x) to allow for community feedback and potential API adjustments.

### Added

#### Core Operations
- **Create Conversation** - Start new AI conversations
- **Continue Conversation** - Add messages to existing conversations
- **Get Answer** - Retrieve AI responses manually
- **Upload File** - Upload files for use in conversations
- **Find Conversation** - Retrieve conversation history

#### Auto-Polling Feature
- **Automatic Response Waiting** - Enable via "Aguardar até Resposta" checkbox
- **Configurable Polling Interval** - Set check frequency (default: 2 seconds)
- **Configurable Timeout** - Set maximum wait time (default: 60 seconds)
- **Smart Status Detection** - Automatically detects finished/in_progress/error states

#### Multiple Outputs
- **Finished Output** - Routes successful responses
- **Error Output** - Routes API errors and failures
- **Timeout Output** - Routes timeout scenarios
- **Dynamic Output Configuration** - Outputs adjust based on auto-polling setting

#### Developer Experience
- **TypeScript Support** - Full TypeScript implementation
- **ESLint Configuration** - Code quality enforcement
- **Build Pipeline** - Automated build with TypeScript and Gulp
- **Icon Support** - Custom Toqan AI icon

#### Documentation
- **README.md** - Comprehensive usage guide
- **QUICK_START.md** - Quick start guide with examples
- **FEATURES.md** - Detailed feature documentation
- **SETUP_GUIDE.md** - Installation and setup instructions
- **LOCAL_TESTING_GUIDE.md** - Local development guide

### Implementation Details

#### Technical Features
- **Dynamic Output Configuration** - Uses `configuredOutputs` function pattern from n8n Switch node
- **Polling Logic** - Intelligent polling with exponential backoff support
- **Error Handling** - Comprehensive error handling for all API operations
- **File Upload Support** - Binary file handling with FormData
- **Credential Management** - Secure API key storage via n8n credentials

#### Code Quality
- **Linting** - ESLint with n8n-nodes-base plugin
- **Type Safety** - Full TypeScript with strict mode
- **Code Formatting** - Prettier configuration
- **Build Process** - Automated compilation and icon building

### Dependencies

#### Runtime
- `form-data` ^4.0.0 - File upload support

#### Development
- `n8n-workflow` ^1.0.0 - n8n node development
- `typescript` ^5.0.4 - TypeScript compiler
- `gulp` ^4.0.2 - Build automation
- `eslint` ^8.40.0 - Code linting
- `prettier` ^2.8.8 - Code formatting

### Known Limitations

- Polling interval minimum is 1 second (API rate limiting consideration)
- Maximum timeout is determined by n8n workflow timeout settings
- File upload size limited by Toqan AI API restrictions

### Breaking Changes

None - Initial release.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT © João Leite
