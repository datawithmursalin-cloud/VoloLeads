import LegacyPage from '../components/LegacyPage';
import { getLegacyPage } from '../lib/legacy-pages';

export default function NotFound() {
  return <LegacyPage page={getLegacyPage('404.html')} />;
}
