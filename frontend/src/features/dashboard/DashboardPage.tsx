import {
    Box,
    Card,
    Container,
    Grid,
    Paper,
    Typography
} from '@mui/material';

export const DashboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the ElfAI management dashboard. This is a placeholder for future functionality.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Conversations
            </Typography>
            <Typography variant="h3" color="primary">
              0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total conversations
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Messages
            </Typography>
            <Typography variant="h3" color="primary">
              0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total messages
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Users
            </Typography>
            <Typography variant="h3" color="primary">
              1
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active users
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Card sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography variant="body1" color="success.main">
            All systems operational
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}; 