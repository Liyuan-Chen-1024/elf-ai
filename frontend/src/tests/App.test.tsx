import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the components that might cause issues in tests
jest.mock('../features/chat/ChatPage', () => () => <div data-testid="chat-page">Chat Page</div>);
jest.mock('../features/profile/ProfilePage', () => () => <div data-testid="profile-page">Profile Page</div>);
jest.mock('../shared/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>
}));

describe('App component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Basic assertion that the app renders
    expect(document.body).toBeInTheDocument();
  });
}); 