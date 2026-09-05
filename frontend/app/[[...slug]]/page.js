import { notFound } from 'next/navigation';
import LegacyPage from '../../components/LegacyPage';
import { getLegacyPage, legacyRouteParams } from '../../lib/legacy-pages';

export function generateStaticParams() {
  return [{ slug: [] }, ...legacyRouteParams];
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const route = (resolvedParams.slug || []).join('/');
  const page = getLegacyPage(route);
  if (!page) return {};

  return {
    title: page.title,
    description: page.description || undefined
  };
}

export default async function LegacyRoute({ params }) {
  const resolvedParams = await params;
  const route = (resolvedParams.slug || []).join('/');
  const page = getLegacyPage(route);
  if (!page) notFound();

  return <LegacyPage page={page} />;
}
