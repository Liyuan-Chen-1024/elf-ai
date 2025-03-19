import PersonIcon from '@mui/icons-material/Person';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState, FormEvent } from 'react';

interface ProfilePageProps {
  username: string;
  email: string;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onEmailChange: (newEmail: string) => Promise<void>;
  error?: string | null;
  successMessage?: string | null;
  isLoading?: boolean;
}

export const ProfilePage = ({ 
  username, 
  email, 
  onChangePassword, 
  onEmailChange, 
  error, 
  successMessage, 
  isLoading = false 
}: ProfilePageProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);

  const handlePasswordChange = async (e: any) => {
    e.preventDefault();
    setPasswordError(null);
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    // Submit password change
    try {
      await onChangePassword(currentPassword, newPassword);
      
      // Clear form on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error handling is done in the container component
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* User info card */}
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}
            >
              <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h6">{username}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {email}
              </Typography>
              <Button variant="outlined" size="small">
                Change Avatar
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Username" fullWidth value={username} disabled sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email" fullWidth value={email} disabled sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12}>
                <Box component="form" onSubmit={handlePasswordChange}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField 
                        label="Current Password" 
                        type="password" 
                        fullWidth 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        sx={{ mb: 2 }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="New Password" 
                        type="password" 
                        fullWidth 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mb: 2 }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Confirm New Password" 
                        type="password" 
                        fullWidth 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={!!passwordError}
                        helperText={passwordError}
                        sx={{ mb: 3 }} 
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                      >
                        {isLoading ? 'Processing...' : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
