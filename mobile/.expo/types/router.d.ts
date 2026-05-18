/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(auth)/register` | `/(tabs)` | `/(tabs)/chat` | `/(tabs)/create` | `/(tabs)/feed` | `/(tabs)/my-orders` | `/(tabs)/profile` | `/_sitemap` | `/chat` | `/create` | `/feed` | `/login` | `/my-orders` | `/notifications` | `/profile` | `/provider` | `/register` | `/wallet`;
      DynamicRoutes: `/orders/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/orders/[id]`;
    }
  }
}
