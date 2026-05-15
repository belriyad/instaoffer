'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';

const AUTO_TRACKED_EVENTS = ['click', 'submit', 'change'] as const;

function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function compactClassName(value: string): string {
  const topClasses = value.split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  return truncate(topClasses);
}

function getElementDetails(target: EventTarget | null): Record<string, string> | null {
  if (!(target instanceof Element)) return null;

  const node = target.closest('a,button,input,select,textarea,form,[data-analytics-event]');
  if (!node) return null;

  const details: Record<string, string> = {
    elementTag: node.tagName.toLowerCase(),
  };

  const analyticsName = node.getAttribute('data-analytics-event');
  if (analyticsName) details.analyticsName = truncate(analyticsName);

  if (node.id) details.elementId = truncate(node.id);
  const elementName = node.getAttribute('name');
  if (elementName) details.elementName = truncate(elementName);
  if (node.className) details.elementClass = compactClassName(node.className);

  if (node instanceof HTMLAnchorElement) {
    const href = node.getAttribute('href');
    if (href) details.href = truncate(href);
  }

  if (node instanceof HTMLFormElement) {
    const action = node.getAttribute('action');
    if (action) details.formAction = truncate(action);
  }

  return details;
}

export default function AnalyticsInstrumentation() {
  const pathname = usePathname();
  const path = pathname ?? '/';
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    track('Page View', {
      path,
      pathname: pathname ?? '/',
    });
  }, [path, pathname]);

  useEffect(() => {
    const capture = (event: Event) => {
      const elementDetails = getElementDetails(event.target);
      if (!elementDetails) return;

      track('Frontend Event', {
        eventType: event.type,
        path: pathRef.current,
        ...elementDetails,
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
  }, []);

  return null;
}
