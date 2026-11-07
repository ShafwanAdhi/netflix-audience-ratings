import { useSectionNavigation } from "./useSectionNavigation";
import { useWorkspaceMotion } from "./useWorkspaceMotion";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  Link,
} from "react-router";
import { DatasetPage } from "../components/Dataset";
import { OverviewPage } from "../features/task-03/Overview";
import { PredictPage } from "../features/task-03/Predict";
import { EvaluationPage } from "../features/task-03/Evaluation";
import { MethodologyPage } from "../features/task-03/Methodology";

export function App() {
  const location = useLocation();
  const sectionNavRef = useSectionNavigation(location.pathname);
  const mainRef = useWorkspaceMotion(location.pathname);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="masthead">
        <Link
          className="brand"
          to="/overview"
          aria-label="Netflix ML Lab, Task 3: Audience Rating Classification"
        >
          <span className="brand-mark" aria-hidden="true">
            03
          </span>
          <span>
            NETFLIX / ML LAB<small>Audience Rating Classification</small>
          </span>
        </Link>
        <div className="masthead-meta">
          <strong>TASK 03 / INDEPENDENT PROJECT</strong>
          <span>CATALOG SNAPSHOT / 25 SEP 2021</span>
        </div>
      </header>
      <div className="workspace">
        <nav
          ref={sectionNavRef}
          className="section-nav"
          aria-label="Project sections"
        >
          {[
            ["overview", "Overview"],
            ["dataset", "About Dataset"],
            ["predict", "Predict"],
            ["evaluation", "Evaluation"],
            ["methodology", "Methodology"],
          ].map(([path, label], i) => (
            <NavLink key={path} to={`/${path}${location.search}`}>
              <small aria-hidden="true">{String(i + 1).padStart(2, "0")}</small>
              {label}
            </NavLink>
          ))}
        </nav>
        <main
          ref={mainRef}
          id="main"
          tabIndex={-1}
          key={location.pathname}
          className="page-enter"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route
              path="*"
              element={
                <div className="not-found">
                  <p className="eyebrow">404 / UNKNOWN SECTION</p>
                  <h1>Page not found</h1>
                  <Link to="/overview">Return to project</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer>
          <span>TASK 03 / Audience Rating Classification</span>
          <span>
            Independent internship project. Not affiliated with Netflix.
          </span>
          <Link className="footer-index" to="/dataset">
            Dataset &amp; decisions
          </Link>
        </footer>
      </div>
    </>
  );
}
