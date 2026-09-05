import LegacyRuntime from './LegacyRuntime';

export default function LegacyPage({ page }) {
  const rootClassName = page.bodyClass.replace(/\bsite-preload\b/g, '').trim();

  return (
    <>
      {page.headStyles ? <style dangerouslySetInnerHTML={{ __html: page.headStyles }} /> : null}
      <div
        id="legacy-root"
        className={rootClassName}
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
      <LegacyRuntime bodyClass={page.bodyClass} />
    </>
  );
}
