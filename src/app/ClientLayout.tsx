'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import Header from './header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <Header />
      {children}
      <span className="credits">
        Created by <a href="https://hugofolloni.com">@hugofolloni</a>
      </span>
    </Provider>
  );
}