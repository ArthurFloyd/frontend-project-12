import React from 'react';
import { Provider } from 'react-redux';
import { io } from 'socket.io-client';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import LeoProfanity from 'leo-profanity';

import App from './App.jsx';
import resources from './locales/index.js';
import store from './store/index.js';
import AuthProvider from './context/auth/AuthProvider.jsx';
import SocketProvider from './context/socket/SocketProvider.jsx';

const userLanguage = localStorage.getItem('userLanguage');
const DEFAULT_LANGUAGE = userLanguage ?? 'ru';

const init = async () => {
  const socket = io();

  const i18n = i18next.createInstance();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: DEFAULT_LANGUAGE,
      fallbackLng: ['en', 'ru'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
    });

  const profanityFilter = LeoProfanity;

  profanityFilter
    .add(profanityFilter.getDictionary('ru'), profanityFilter.getDictionary('en'));

  return (
    <Provider store={store}>
      <React.StrictMode>
        <I18nextProvider i18n={i18n}>
          <SocketProvider socket={socket}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SocketProvider>
        </I18nextProvider>
      </React.StrictMode>
    </Provider>
  );
};

export default init;
