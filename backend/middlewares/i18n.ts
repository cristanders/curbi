import { Request, Response, NextFunction } from 'express';
import i18n from 'i18n';
import path from 'path';

export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt', 'sd', 'kaq'];

i18n.configure({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'es',
  cookie: 'lang',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  queryParameter: 'lang',
  autoReload: false,
  updateFiles: false,
  syncFiles: false
});

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  i18n.init(req, res);

  const queryLang = (req.query?.lang as string)?.toLowerCase();
  const cookieLang = (req.cookies?.lang as string)?.toLowerCase();

  if (queryLang && SUPPORTED_LOCALES.includes(queryLang)) {
    req.setLocale(queryLang);
    res.cookie('lang', queryLang, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 año persistente
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    });
  } else if (cookieLang && SUPPORTED_LOCALES.includes(cookieLang)) {
    req.setLocale(cookieLang);
  } else {
    req.setLocale('es');
  }

  next();
};

export { i18n };