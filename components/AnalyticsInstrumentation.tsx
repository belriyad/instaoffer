'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';

const AUTO_TRACKED_EVENTS = ['click', 'submit', 'change'] as const;

function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function getElementDetails(target: EventTarget | null): Record<string, string> {
  if (!(target instanceof Element)) return {};

  const node = target.closest('a,button,input,select,textarea,form,[data-analytics-event]') ?? target;
  const details: Record<string, string> = {
    elementTag: node.tagName.toLowerCase(),
  };

  const analyticsName = node.getAttribute('data-analytics-event');
  if (analyticsName) details.analyticsName = truncate(analyticsName);

  if (node.id) details.elementId = truncate(node.id);
  if (node.getAttribute('name')) details.elementName = truncate(node.getAttribute('name') || '');
  if (node.className && typeof node.className === 'string') details.elementClass = truncate(node.className);

  if (node instanceof HTMLAnchorElement && node.getAttribute('href')) {
    details.href = truncate(node.getAttribute('href') || '');
  }

  if (node instanceof HTMLFormElement && node.getAttribute('action')) {
    details.formAction = truncate(node.getAttribute('action') || '');
  }

  return details;
}

export default function AnalyticsInstrumentation() {
  const pathname = usePathname();
  const path = pathname ?? '/';

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    track('Page View', {
      path: `${path}${search}`,
      pathname: pathname ?? '/',
    });
  }, [path, pathname]);

  useEffect(() => {
    const capture = (event: Event) => {
      track('Frontend Event', {
        eventType: event.type,
        path,
        ...getElementDetails(event.target),
      });
    };

    for (const eventType of AUTO_TRACKED_EVENTS) {
      document.addEventListener(eventType, capture, true);
    }

    return () => {
      for (const eventType of AUTO_TRACKED_EVENTS) {
        document.removeEventListener(eventType, capture, true);
      }
    };
  }, [path]);

  return null;
}
