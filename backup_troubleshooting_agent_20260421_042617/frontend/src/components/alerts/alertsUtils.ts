import { AlertRule } from './alertsTypes';

export function evaluateRule(
  operator: AlertRule['operator'],
  prev: number | undefined,
  current: number,
  target: number
) {
  switch (operator) {
    case '>':
      return current > target;
    case '<':
      return current < target;
    case '>=':
      return current >= target;
    case '<=':
      return current <= target;
    case 'crosses_above':
      return prev !== undefined && prev <= target && current > target;
    case 'crosses_below':
      return prev !== undefined && prev >= target && current < target;
    default:
      return false;
  }
}

export function shouldTriggerRule(
  rule: AlertRule,
  prev: number | undefined,
  current: number,
  now = Date.now()
) {
  if (!rule.enabled) return false;
  if (rule.triggerOnceUntilReset && rule.lastTriggeredAt) return false;
  if (rule.cooldownMs > 0 && rule.lastTriggeredAt && now - rule.lastTriggeredAt < rule.cooldownMs) {
    return false;
  }
  return evaluateRule(rule.operator, prev, current, rule.value);
}

export function sendDesktopNotification(message: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(message);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          new Notification(message);
        }
      })
      .catch(() => undefined);
  }
}

export async function sendPushoverRuntime(message: string) {
  try {
    await fetch('/notify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    console.error('Pushover send failed', e);
  }
}
