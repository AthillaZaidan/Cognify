import { Redirect } from 'expo-router';

// This file is only reachable when the Stack is mounted, which only happens
// when the user is authenticated (see app/_layout.tsx RootApp).
// Send them straight to the tab navigator.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
