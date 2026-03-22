import { createBrowserRouter } from 'react-router-dom';
import { BrowsePage } from '../pages/BrowsePage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <BrowsePage /> },
  { path: '/clips/:clipId', element: <BrowsePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
