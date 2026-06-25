import { createFileRoute } from '@tanstack/react-router';

import { HomeView } from '@/features/home/views/home-view';

export const Route = createFileRoute('/')({
  component: HomeView,
});
