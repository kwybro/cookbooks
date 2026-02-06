import { useEffect, useState } from 'react';
import { useIndexImage } from './useIndexImages';

interface UseProcessingStatusOptions {
  pollingInterval?: number;
}

export function useProcessingStatus(
  indexImageId: string,
  options: UseProcessingStatusOptions = {}
) {
  const { pollingInterval = 2000 } = options;
  const [shouldPoll, setShouldPoll] = useState(false);

  const {
    data: indexImage,
    isLoading,
    error,
  } = useIndexImage(indexImageId, {
    refetchInterval: shouldPoll ? pollingInterval : undefined,
  });

  const status = indexImage?.status;

  useEffect(() => {
    // Start polling when status is 'processing'
    if (status === 'processing') {
      setShouldPoll(true);
    }
    // Stop polling when status is 'completed' or 'failed'
    if (status === 'completed' || status === 'failed') {
      setShouldPoll(false);
    }
  }, [status]);

  const startPolling = () => setShouldPoll(true);
  const stopPolling = () => setShouldPoll(false);

  return {
    status,
    isLoading,
    error,
    isPolling: shouldPoll,
    startPolling,
    stopPolling,
  };
}
