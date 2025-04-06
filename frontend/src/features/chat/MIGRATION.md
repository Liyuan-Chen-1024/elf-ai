# Chat Feature Hooks Migration Guide

## Overview

We've restructured the chat hooks to be more feature-focused and to follow a better separation of concerns. This guide helps developers update their code to use the new hooks.

## Old Structure vs. New Structure

### Old (Deprecated/Removed)
```
/src/hooks/
  ├── useChat.ts         // Had useConversations and useMessage
  └── useConversationActions.ts
```

### New (Feature-Focused)
```
/src/features/chat/hooks/
  ├── conversations/
  │   ├── useConversations.ts          // Data fetching only
  │   └── useConversationActions.ts    // Business logic/actions
  │
  ├── messages/
  │   ├── useMessages.ts               // Data fetching only
  │   ├── useMessageActions.ts         // Business logic/actions
  │   └── useMessageUI.ts              // UI-specific concerns (scrolling, etc.)
  │
  └── constants.ts                     // Shared constants
```

## Migration Map

When updating your components, use this map to find the new hook that replaces the old one:

| Old Hook                      | New Hook(s)                                  |
|-------------------------------|----------------------------------------------|
| `useConversations()`          | `useConversations()` from `../hooks/conversations` |
| `useMessage(conversationId)`  | `useMessages(conversationId)` from `../hooks/messages` |
| `useConversationActions()`    | `useConversationActions()` from `../hooks/conversations` |

Alternatively, you can use the context which provides all these hooks:

```typescript
// Instead of importing individual hooks
import { useChatContext } from '../context';

// Then in your component:
const {
  conversations,
  messages,
  createConversation,
  sendMessage,
  // ... more properties
} = useChatContext();
```

## Benefits of the New Structure

1. **Clearer Separation of Concerns**:
   - Data fetching hooks handle API interactions only
   - Action hooks handle business logic
   - UI hooks handle presentation concerns

2. **Feature Cohesion**:
   - All chat hooks are grouped with the feature they support

3. **Better Testability**:
   - Each hook has a more focused responsibility
   - Easier to mock for tests

4. **Improved Maintainability**:
   - Changes to business logic don't affect data fetching
   - New actions can be added without changing data hooks