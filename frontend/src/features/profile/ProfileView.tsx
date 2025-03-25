import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

function ProfileView() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading user profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account and preferences
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Avatar
                src={user.avatar}
                alt={user.username}
                sx={{ width: 100, height: 100, mb: 2 }}
              />
              <Typography variant="h5">{user.name || user.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                size="small"
              >
                Change Avatar
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Username" secondary={user.username} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Member Since" secondary="Apr 1, 2023" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Last Login" secondary="Today" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Profile Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  defaultValue={user.name?.split(' ')[0]}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  defaultValue={user.name?.split(' ')[1] || ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={user.email}
                  type="email"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary">
                  Save Changes
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Email notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Show read receipts"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch />}
                  label="Display online status"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProfileView; 