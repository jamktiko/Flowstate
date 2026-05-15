import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly vapidPublicKey = environment.vapidPublicKey;

  /**
   * Checks if this browser supports push notifications.
   * Call this on settings load — hide the toggle if false.
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Checks if the user already has an active push subscription.
   * Use this on settings page load to set the toggle's initial state.
   */
  async hasActiveSubscription(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  }

  /**
   * Requests browser permission, creates a push subscription,
   * and saves it to the backend.
   * Called when the user toggles notifications ON.
   * Returns true if successful, false if permission was denied.
   */
  async enableNotifications(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Browser requires Uint8Array — plain string won't work
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
    });

    // Auth interceptor automatically attaches the Bearer token
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/push/subscribe`, subscription));

    return true;
  }

  /**
   * Unsubscribes from push in the browser and removes from backend.
   * Called when the user toggles notifications OFF.
   */
  async disableNotifications(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    // Unsubscribe from browser push service
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from backend regardless — cleans up even if browser
    // subscription was already gone
    await firstValueFrom(this.http.delete(`${environment.apiBaseUrl}/push/subscribe`));
  }

  /**
   * Converts the VAPID public key from URL-safe Base64 to Uint8Array.
   * Required by pushManager.subscribe() — the browser API won't accept a plain string.
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }
}
