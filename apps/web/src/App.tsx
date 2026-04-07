import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { initializeAnalytics, trackPageView } from './app/analytics';
import { router } from './app/router';
import { AppProviders } from './app/providers';

export default function App() {
  useEffect(() => {
    initializeAnalytics();

    return router.subscribe((state) => {
      trackPageView(`${state.location.pathname}${state.location.search}`);
    });
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
