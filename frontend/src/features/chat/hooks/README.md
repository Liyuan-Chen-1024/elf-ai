# Chat Feature Architecture

This directory contains the hooks used by the chat feature. We follow a layered architecture to maintain clean separation of concerns.

## Hook Directory Structure

```
/hooks
  ├── conversations/           # Conversation-related hooks
  │   ├── useConversations.ts  # Data fetching only
  │   └── useConversationActions.ts  # Business logic
  │
  ├── messages/               # Message-related hooks
  │   ├── useMessages.ts      # Data fetching only
  │   ├── useMessageActions.ts # Business logic
  │   └── useMessageUI.ts     # UI-related concerns
  │
  └── constants.ts            # Shared constants
```

## Layer Separation Guidelines

We organize hooks into three clear layers:

### 1. Data Layer Hooks

- Focus solely on data fetching and persistence
- Communicate directly with APIs and local storage
- Return raw data and loading/error states
- Examples: `useConversations`, `useMessages`

### 2. Business Logic Layer Hooks

- Implement business rules and workflows
- Consume data layer hooks
- Handle navigation side effects
- Handle error handling logic
- Examples: `useConversationActions`, `useMessageActions`

### 3. UI Layer Hooks

- Manage UI-specific concerns
- Handle animations, scrolling, and DOM manipulation
- No business logic or data fetching
- Examples: `useMessageUI`

## Shared UI Components

The chat feature also includes reusable UI components that provide consistent styling across the application:

### Layout Components

- `ContentLayout` - Standardized layout container with support for centered content
- `InputBar` - Consistent styling for the message input area

### Feedback Components

- `ErrorAlert` - Standardized error display component
- `EmptyState` - Consistent empty state display

### Action Components

- `PrimaryButton` - Button with loading state and standard styling

## Using Hooks in Components

Components should import hooks according to their needs:

```typescript
// Presentational components should use UI hooks only
import { useMessageUI } from '../hooks/messages';

// Container components should use business logic hooks
import { useMessageActions } from '../hooks/messages';

// Or preferably, use the context which provides access to all hooks
import { useChatContext } from '../context';
```

## Best Practices

1. **Don't mix concerns**: Keep each hook focused on one layer
2. **Prefer the context**: For complex components, use `useChatContext`
3. **No redundant logic**: Don't duplicate hook logic in components
4. **Clear naming**: Names should reflect the layer (`Data`, `Actions`, `UI`)
5. **Use shared components**: Leverage shared UI components for consistency

For detailed migration information, see the [MIGRATION.md](../MIGRATION.md) file.
