import { Geist_Mono, Paytone_One, Raleway } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { hasUnreadNotificationsForUser } from "@/lib/notifications/notifications";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const paytoneOne = Paytone_One({
  variable: "--font-paytone-one",
  weight: "400",
  style: "normal",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  weight: "variable",
  style: "normal",
  subsets: ["latin"],
});

export const metadata = {
  title: "Narabi",
  description: "Next.js server-side boilerplate with Firebase Auth",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const hasUnreadNotifications = user ? await hasUnreadNotificationsForUser(user.uid) : false;
  const canAccessDashboard = profile?.user_type === "admin" || profile?.user_type === "fanbase";

  return (
    <html
      lang="es"
      className={`${geistMono.variable} ${paytoneOne.variable} ${raleway.variable} dark`}
    >
      <body className="flex  flex-col  antialiased">
        <FavoritesProvider enabled={Boolean(user)}>
          <Navbar
            canAccessDashboard={canAccessDashboard}
            hasUnreadNotifications={hasUnreadNotifications}
            profile={profile}
            user={user}
          />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}
