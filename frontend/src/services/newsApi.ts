
import { NewsItem } from '../types';
import fetchClient from './fetchClient';

// News API endpoints
export const newsApi = {
    getNews: async (): Promise<NewsItem[]> => {
      const response = await fetchClient.get<NewsItem[]>('/news/');
      return response.data;
    },
  }; 
  