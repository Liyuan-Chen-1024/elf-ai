import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Skeleton,
  useTheme,
  Tabs,
  Tab,
  Chip,
  Fade,
  Paper,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Types
interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  category: 'stocks' | 'jobs' | 'top' | 'ai';
  tags?: string[];
  highlight?: boolean;
}

type TabValue = 'all' | 'stocks' | 'jobs' | 'ai';

// Mock data
const mockNews: Record<string, NewsItem[]> = {
  top: [
    {
      id: '1',
      title: 'ElfAI Launches Revolutionary Chat Features',
      description: "New capabilities include advanced context understanding, real-time learning, and personalized responses that adapt to each user's preferences and needs.",
      imageUrl: 'https://source.unsplash.com/random/800x400?ai-robot',
      date: '2024-03-20',
      category: 'top',
      tags: ['AI', 'Technology', 'Innovation'],
      highlight: true,
    },
    {
      id: '2',
      title: 'Tech Industry Embraces AI Assistants',
      description: 'Major companies are integrating AI assistants into their workflows, leading to significant productivity gains.',
      imageUrl: 'https://source.unsplash.com/random/800x400?office-tech',
      date: '2024-03-19',
      category: 'top',
      tags: ['Industry', 'Technology'],
    },
  ],
  stocks: [
    {
      id: '3',
      title: 'AI Stocks Surge on New Developments',
      description: 'Tech stocks see significant gains as AI companies report breakthrough achievements in natural language processing.',
      imageUrl: 'https://source.unsplash.com/random/800x400?stock-market',
      date: '2024-03-20',
      category: 'stocks',
      tags: ['Finance', 'Markets'],
      highlight: true,
    },
    {
      id: '4',
      title: 'Investment in AI Startups Reaches New Heights',
      description: 'Venture capital funding for AI startups hits record levels in Q1 2024.',
      imageUrl: 'https://source.unsplash.com/random/800x400?startup',
      date: '2024-03-19',
      category: 'stocks',
      tags: ['Startups', 'Investment'],
    },
  ],
  jobs: [
    {
      id: '5',
      title: 'AI Engineers in High Demand',
      description: 'Companies scramble to hire AI specialists as the industry continues to grow. Average salaries see significant increase.',
      imageUrl: 'https://source.unsplash.com/random/800x400?engineer',
      date: '2024-03-20',
      category: 'jobs',
      tags: ['Careers', 'Technology'],
      highlight: true,
    },
    {
      id: '6',
      title: 'Remote Work Opportunities Expand in Tech',
      description: 'Tech companies embrace permanent remote work policies, opening up new opportunities for global talent.',
      imageUrl: 'https://source.unsplash.com/random/800x400?remote-work',
      date: '2024-03-19',
      category: 'jobs',
      tags: ['Remote Work', 'Jobs'],
    },
  ],
  ai: [
    {
      id: '7',
      title: 'Breakthrough in Natural Language Processing',
      description: 'Researchers achieve new milestone in language understanding, paving the way for more sophisticated AI assistants.',
      imageUrl: 'https://source.unsplash.com/random/800x400?artificial-intelligence',
      date: '2024-03-20',
      category: 'ai',
      tags: ['Research', 'NLP'],
      highlight: true,
    },
    {
      id: '8',
      title: 'AI Ethics Guidelines Updated',
      description: 'Leading tech organizations collaborate to establish new ethical guidelines for AI development.',
      imageUrl: 'https://source.unsplash.com/random/800x400?ethics',
      date: '2024-03-19',
      category: 'ai',
      tags: ['Ethics', 'Guidelines'],
    },
  ],
};

// Components
const NewsCard = ({ item }: { item: NewsItem }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={500}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
          },
          ...(item.highlight && {
            border: `2px solid ${theme.palette.primary.main}`,
          }),
        }}
      >
        <CardMedia
          component="img"
          height={item.highlight ? "250" : "200"}
          image={item.imageUrl}
          alt={item.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2 }}>
            {item.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
                color={item.highlight ? "primary" : "default"}
              />
            ))}
          </Box>
          <Typography 
            gutterBottom 
            variant={item.highlight ? "h5" : "h6"} 
            component="h2"
            sx={{ 
              fontWeight: item.highlight ? 'bold' : 'normal',
              color: theme.palette.text.primary,
            }}
          >
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {item.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(item.date).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
};

const NewsCardSkeleton = () => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="rectangular" height={200} />
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" height={24} width={60} sx={{ mr: 1, display: 'inline-block' }} />
        <Skeleton variant="rectangular" height={24} width={60} sx={{ display: 'inline-block' }} />
      </Box>
      <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} width="100%" />
      <Skeleton variant="text" height={20} width="90%" />
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="text" height={16} width="30%" />
      </Box>
    </CardContent>
  </Card>
);

// Main component
export const NewsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (_: unknown, newValue: TabValue) => {
    setIsLoading(true);
    setActiveTab(newValue);
    setTimeout(() => setIsLoading(false), 800);
  };

  const getFilteredNews = () => {
    if (activeTab === 'all') {
      return Object.values(mockNews).flat();
    }
    return mockNews[activeTab] || [];
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, minHeight: '100vh' }}>
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 'bold',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <NewspaperIcon fontSize="large" color="primary" />
          News & Updates
        </Typography>

        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<LocalFireDepartmentIcon />} 
              iconPosition="start" 
              label="All News" 
              value="all"
            />
            <Tab 
              icon={<TrendingUpIcon />} 
              iconPosition="start" 
              label="Stock Market" 
              value="stocks"
            />
            <Tab 
              icon={<WorkIcon />} 
              iconPosition="start" 
              label="Jobs" 
              value="jobs"
            />
            <Tab 
              icon={<NewspaperIcon />} 
              iconPosition="start" 
              label="AI News" 
              value="ai"
            />
          </Tabs>
        </Paper>

        <Grid container spacing={4}>
          {isLoading
            ? Array.from(new Array(6)).map((_, index) => (
                <Grid item key={index} xs={12} sm={6} md={4}>
                  <NewsCardSkeleton />
                </Grid>
              ))
            : getFilteredNews().map((item) => (
                <Grid 
                  item 
                  key={item.id} 
                  xs={12} 
                  sm={item.highlight ? 12 : 6} 
                  md={item.highlight ? 8 : 4}
                >
                  <NewsCard item={item} />
                </Grid>
              ))}
        </Grid>
      </Box>
    </Container>
  );
}; 