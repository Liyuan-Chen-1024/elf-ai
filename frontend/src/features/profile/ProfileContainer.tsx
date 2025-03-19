import React from 'react';
import { ProfilePage } from './ProfilePage';
import { useAuthStore } from '../auth/store';

export const ProfileContainer = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null as string | null);
  const [successMessage, setSuccessMessage] = React.useState(null as string | null);
  const user = useAuthStore(state => state.user);

  React.useEffect(() => {
    if (user) {
      setEmail(user.email);
      setIsLoading(false);
    }
  }, [user]);

  const handleEmailChange = async (newEmail: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implement email change API call
      setEmail(newEmail);
      setSuccessMessage('Email updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProfilePage
      username={user?.name || ''}
      email={email}
      onEmailChange={handleEmailChange}
      onChangePassword={async (currentPassword: string, newPassword: string) => {
        try {
          // TODO: Implement password change API call
          return Promise.resolve();
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : 'Failed to change password');
        }
      }}
      error={error}
      successMessage={successMessage}
      isLoading={isLoading}
    />
  );
}; 