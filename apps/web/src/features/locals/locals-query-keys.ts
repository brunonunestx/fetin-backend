const localsQueryKeys = {
  all: ['locals'] as const,
  detail: (locationId: string) => [...localsQueryKeys.details(), locationId] as const,
  details: () => [...localsQueryKeys.all, 'detail'] as const,
  list: () => [...localsQueryKeys.all, 'list'] as const,
};

export { localsQueryKeys };
