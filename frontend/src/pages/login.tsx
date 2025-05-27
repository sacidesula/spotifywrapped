import React from "react";
import spotifyLogo from "../assets/spotify-logo.svg"; // Logo yolunu kontrol et

const Login = () => {
  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:3001/api/auth/login";
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-2xl shadow-2xl px-12 py-14 flex flex-col items-center w-full max-w-sm">
        <img src={spotifyLogo} alt="Spotify" className="w-16 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Spotify Wrapped</h1>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow transition"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <circle cx="12" cy="12" r="12" fill="#1ED760" />
            <path
              d="M17.6 16.2c-.2 0-.3 0-.5-.1-3.2-2-7.2-2.4-11.1-1.2-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 4.2-1.3 8.6-.9 12.1 1.3.4.2.5.7.3 1-.1.2-.3.4-.4.4zm1.3-3c-.2 0-.3 0-.5-.1-3.7-2.3-9.3-3-13.6-1.5-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 4.7-1.6 10.7-.8 14.8 1.7.4.2.5.7.3 1-.1.2-.3.3-.6.3zm1.4-3c-.2 0-.3 0-.5-.1-4.2-2.5-11.1-2.7-15.1-1.4-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 4.4-1.4 11.7-1.2 16.3 1.5.4.2.5.7.3 1-.1.2-.3.4-.6.4z"
              fill="#fff"
            />
          </svg>
          Spotify ile Giriş Yap
        </button>
      </div>
    </div>
  );
};

export default Login;