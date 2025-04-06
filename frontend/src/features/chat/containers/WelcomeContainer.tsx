import React, { SyntheticEvent } from 'react';
import WelcomeScreen from "../components/WelcomeScreen";
import { useChatContext } from "../context";

/**
 * WelcomeContainer is a container component that renders the welcome screen
 * and connects it with the ChatContext.
 */
const WelcomeContainer: React.FC = () => {
  const {
    createConversation,
    conversationError,
    clearConversationError,
    isCreatingConversation
  } = useChatContext();
  
  const handleClearError = (event: SyntheticEvent<Element, Event>) => {
    clearConversationError();
  };
  
  return (
    <WelcomeScreen
      onNewChat={createConversation}
      isCreating={isCreatingConversation}
      error={conversationError}
      onClearError={handleClearError}
    />
  );
};

export default WelcomeContainer; 