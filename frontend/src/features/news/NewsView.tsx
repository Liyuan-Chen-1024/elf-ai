import React from 'react';
import { Box, Typography, Paper, Card, CardContent, CardMedia, Grid, Skeleton } from '@mui/material';
import { useNews } from '../../hooks/useNews';
import { NewsItem } from '../../types';

function NewsView() {
  const { news, isLoading } = useNews();

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          News & Updates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay informed about the latest developments in AI and ElfAI features.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {isLoading ? (
          // Loading skeletons
          Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={40} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : news.length === 0 ? (
          // No news state
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No news available at the moment.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for updates!
              </Typography>
            </Paper>
          </Grid>
        ) : (
          // Actual news cards
          news.map((item: NewsItem) => (
            <Grid item xs={12} md={4} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.imageUrl}
                    alt={item.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.summary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(item.publishedAt).toLocaleDateString()} • {item.source}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}

export default NewsView; 