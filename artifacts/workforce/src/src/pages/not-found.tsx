import { useLanguage } from '@/i18n/LanguageProvider';

export default function NotFound() {
  const { t, dir } = useLanguage();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground" dir={dir}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">{t('noData')}</p>
        <a href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {dir === 'rtl' ? 'العودة للرئيسية' : 'Go Home'}
        </a>
      </div>
    </div>
  );
}