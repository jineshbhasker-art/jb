/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RRVLogo } from './RRVLogo';

interface ScentAndSoulLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'screen';
  showText?: boolean;
  animated?: boolean;
  lightMode?: boolean;
  subtitle?: string;
  onAnimationComplete?: () => void;
}

/**
 * Rebranded ScentAndSoulLogo component now proxies directly to RRVLogo
 * for seamless platform-wide branding consistency:
 * RRV PERFUME - A Division of RRV TRADING LLC
 */
export const ScentAndSoulLogo: React.FC<ScentAndSoulLogoProps> = (props) => {
  return <RRVLogo {...props} />;
};

export default ScentAndSoulLogo;
