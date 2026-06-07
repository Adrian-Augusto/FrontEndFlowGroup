import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function AppLayout() {
  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
