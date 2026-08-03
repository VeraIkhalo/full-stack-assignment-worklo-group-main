import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Block destructive mutations when demo mode is enabled.
 * Returns a NextResponse to return early, or null when the action is allowed.
 */
export function checkDemoModeForDestructiveAction(actionName: string): NextResponse | null {
  if (!config.demo.enabled) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'This action is disabled in demo mode',
      action: actionName,
    },
    { status: 403 },
  );
}
