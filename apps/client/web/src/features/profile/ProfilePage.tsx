import PersonIcon from '@mui/icons-material/Person';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Grid,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

interface ProfilePageProps {
  username: string;
  email: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ username, email }) => {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        My Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* User info card */}
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Avatar 
                sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2 }}
              >
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
                <TextField
                  label="Username"
                  fullWidth
                  value={username}
                  disabled
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  disabled
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button variant="contained" color="primary">
                  Update Password
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 