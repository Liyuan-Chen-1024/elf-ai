# Contributing to elfai Media Platform

Thank you for your interest in contributing to elfai Media Platform! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project follows a Code of Conduct that all contributors are expected to adhere to. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/elfai-media.git
   cd elfai-media
   ```
3. Set up development environment:
   ```bash
   make setup
   make dev
   ```

## 💻 Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write clean, maintainable code
   - Follow the coding standards
   - Add/update tests as needed
   - Update documentation

3. Test your changes:
   ```bash
   make test        # Run all tests
   make lint        # Check code style
   make format      # Format code
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## 🔄 Pull Request Process

1. Update your branch with latest main:
   ```bash
   git remote add upstream https://github.com/original/elfai-media.git
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request:
   - Use a clear title and description
   - Reference any related issues
   - Add labels as appropriate
   - Request review from maintainers

4. Address review feedback:
   - Make requested changes
   - Push updates to your branch
   - Mark conversations as resolved

## 📝 Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Maximum line length: 88 characters (Black default)
- Sort imports with isort
- Use docstrings for functions and classes

### TypeScript (Frontend)

- Follow ESLint configuration
- Use TypeScript strict mode
- Use functional components with hooks
- Follow Material-UI best practices
- Use CSS-in-JS with Emotion

## ✅ Testing Guidelines

### Backend Tests

- Write unit tests with pytest
- Maintain 80%+ coverage
- Test both success and error cases
- Use fixtures and factories
- Mock external services

### Frontend Tests

- Write unit tests with Jest
- Use React Testing Library
- Test component behavior
- Write integration tests
- Add E2E tests for critical paths

## 📚 Documentation

- Update README.md for major changes
- Document new features
- Add JSDoc comments
- Update API documentation
- Include examples

## 🏗 Project Structure

```
elfai-media/
├── apps/                # Applications
│   ├── api/            # Django Backend
│   └── web/            # React Frontend
├── packages/           # Shared Libraries
├── infrastructure/     # DevOps & Deploy
├── .dx/                # Developer Experience
└── qa/                # Quality Assurance
```

## 🔍 Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] Changes are tested locally
- [ ] CI/CD pipeline passes
- [ ] Security considerations addressed
- [ ] Performance impact considered

## 🚨 Reporting Issues

- Use the issue tracker
- Follow the issue template
- Include reproduction steps
- Add relevant labels
- Be respectful and constructive

## 📈 Performance Considerations

- Run load tests for API changes
- Profile database queries
- Optimize frontend bundles
- Monitor memory usage
- Consider caching strategies

## 🔒 Security Guidelines

- Never commit secrets
- Use environment variables
- Follow OWASP guidelines
- Validate all inputs
- Use prepared statements
- Implement rate limiting

## 📦 Release Process

1. Version bump following semver
2. Update CHANGELOG.md
3. Create release PR
4. Deploy to staging
5. Run smoke tests
6. Deploy to production

## 🙏 Thank You

Your contributions make this project better for everyone. Thank you for being part of our community!
