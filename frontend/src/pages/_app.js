import "../styles/globals.css";
import { ThemeProvider } from "../store/theme";
import { AuthProvider } from "../store/auth";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}
