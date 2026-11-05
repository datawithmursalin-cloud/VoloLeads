import { notFound } from 'next/navigation';
import LegacyPage from '../../components/LegacyPage';
import { getLegacyPage, legacyRouteParams } from '../../lib/legacy-pages';

export function generateStaticParams() {
  return [{ slug: [] }, ...legacyRouteParams];
}

export async function generateMetadata({ params }, parent) {
  const resolvedParams = await params;
  const route = (resolvedParams.slug || []).join('/');
  const page = getLegacyPage(route);
  if (!page) return {};
  const inherited = await parent;
  const images = page.ogImage ? [{ url: page.ogImage }] : inherited.openGraph?.images;

  return {
    title: page.title,
    alternates: { canonical: page.canonical },
    description: page.description || undefined,
    robots: page.robots,
    openGraph: {
      ...inherited.openGraph,
      title: page.title,
      description: page.description || undefined,
      url: page.canonical,
      images
    },
    twitter: {
      ...inherited.twitter,
      title: page.title,
      description: page.description || undefined,
      ...(page.ogImage ? { images: [page.ogImage] } : {})
    }
  };
}

export default async function LegacyRoute({ params }) {
  const resolvedParams = await params;
  const route = (resolvedParams.slug || []).join('/');
  const page = getLegacyPage(route);
  if (!page) notFound();

  return <LegacyPage page={page} />;
}
