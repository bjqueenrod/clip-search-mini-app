import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchClip, fetchClips } from './api';
import { ClipQueryState } from './types';

export function useClipSearch(queryState: ClipQueryState) {
  const normalized = useMemo(() => queryState, [queryState]);
  return useQuery({
    queryKey: ['clips', normalized],
    queryFn: () => fetchClips(normalized),
  });
}

export function useClipDetail(clipId?: string) {
  return useQuery({
    queryKey: ['clip', clipId],
    queryFn: () => fetchClip(clipId!),
    enabled: Boolean(clipId),
  });
}
