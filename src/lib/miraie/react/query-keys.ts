// TanStack Query keys for MirAIe data. One status query per AC, so a push for one AC re-renders
// only the components that read that AC (CHILL-002).

export const queryKeys = {
  all: ['miraie'] as const,
  home: ['miraie', 'home'] as const,
  statuses: ['miraie', 'ac'] as const,
  status: (deviceId: string) => ['miraie', 'ac', deviceId, 'status'] as const,
};
