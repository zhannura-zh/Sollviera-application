import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useApp } from '@/context/app-store';

// Pull-to-refresh for a screen's main ScrollView: re-syncs everything from the API.
export function usePullRefresh() {
  const { refreshData } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch {
      // refreshData already falls back to cached data; the spinner just stops.
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
}
