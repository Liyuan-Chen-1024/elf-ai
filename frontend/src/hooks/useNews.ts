import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/chatApi';

export const NEWS_QUERY_KEYS = {
  all: ['news'],
};

export function useNews() {
  const {
    data: news = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: NEWS_QUERY_KEYS.all,
    queryFn: newsApi.getNews,
  });

  return {
    news,
    isLoading,
    error,
    refetch,
  };
} 