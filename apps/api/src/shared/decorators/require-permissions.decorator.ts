import { SetMetadata } from '@nestjs/common';

import type { AppPermission } from '../constants/permissions.js';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
