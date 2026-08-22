const profileQueryKeys = {
  all: ['profiles'] as const,
  own: () => [...profileQueryKeys.all, 'own'] as const,
  public: (userId: string) => [...profileQueryKeys.all, 'public', userId] as const,
};

export { profileQueryKeys };
