type DeviceDescriptor = {
  maxTouchPoints: number;
  platform: string;
  userAgent: string;
};

function isIosDevice({ maxTouchPoints, platform, userAgent }: DeviceDescriptor) {
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function isStandaloneApp(displayModeStandalone: boolean, navigatorStandalone?: boolean) {
  return displayModeStandalone || navigatorStandalone === true;
}

export { isIosDevice, isStandaloneApp };
export type { DeviceDescriptor };
