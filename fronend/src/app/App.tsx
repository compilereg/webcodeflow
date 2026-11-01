import { HashRouter, Route, Routes } from "react-router-dom";

import { PrivateRoute, PublicRoute, AuthCatchAll } from "./RouteGuards";
import { ContestBrandProvider } from "features/contest-brand";
import { WebSocketProvider } from "features/contest-realtime";
import { ProductTour } from "features/product-tour";
import { ThemeProvider } from "features/theme";
import { ContestLayout } from "shared/ui";

import Login from "pages/login";
import Home from "pages/home";
import Clarifications from "pages/clarifications";
import Judgments from "pages/judgments";
import Scoreboard from "pages/scoreboard";
import Tutorials from "pages/tutorials";

function App() {
  return (
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <ContestBrandProvider>
          <WebSocketProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                element={
                  <PrivateRoute>
                    <ContestLayout />
                  </PrivateRoute>
                }
              >
                <Route path="/home" element={<Home />} />
                <Route path="/clarifications" element={<Clarifications />} />
                <Route path="/judgments" element={<Judgments />} />
                <Route path="/scoreboard" element={<Scoreboard />} />
                <Route path="/tutorials" element={<Tutorials />} />
              </Route>
              <Route path="*" element={<AuthCatchAll />} />
            </Routes>
            <ProductTour />
          </WebSocketProvider>
        </ContestBrandProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
