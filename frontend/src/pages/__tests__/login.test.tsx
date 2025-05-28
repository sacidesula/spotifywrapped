import { render, screen } from '@testing-library/react';
import Login from '../login';

describe('Login component', () => {
  test('Başlık doğru şekilde görünmeli', () => {
    render(<Login />);
    const heading = screen.getByText(/Spotify Wrapped/i);
    expect(heading).not.toBeNull(); // toBeInTheDocument yerine
  });

  test('Spotify ile Giriş Yap butonu görünmeli', () => {
    render(<Login />);
    const button = screen.getByText(/Spotify ile Giriş Yap/i);
    expect(button).not.toBeNull(); // aynı şekilde
  });
});
