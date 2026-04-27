import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../auth/AuthContext";

const ProjectContext = createContext(null);

// Map backend snake_case to frontend camelCase
const mapBackendToFrontend = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description || "",
  color: project.color || "#007BFF",
  sprintCount: project.sprint_count || 0,
  tasksTotal: project.tasks_total || 0,
  tasksCompleted: project.tasks_completed || 0,
  createdAt: project.created_at,
  role: project.my_role || "Developer",
});

// Map frontend to backend
const mapFrontendToBackend = (data) => ({
  name: data.name,
  description: data.description || "",
  color: data.color || "#007BFF",
});

export function ProjectProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([]);
      setActiveProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/auth/projects/");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.map(mapBackendToFrontend));
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, user?.id]);

  useEffect(() => {
    const handler = () => loadProjects();
    window.addEventListener("projects:refresh", handler);
    return () => window.removeEventListener("projects:refresh", handler);
  }, [loadProjects]);

  const createProject = async (data) => {
    try {
      const res = await apiFetch("/api/auth/projects/", {
        method: "POST",
        body: JSON.stringify(mapFrontendToBackend(data)),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error creating project");
      }
      const newProject = await res.json();
      const mappedProject = mapBackendToFrontend(newProject);
      setProjects((prev) => [...prev, mappedProject]);
      return mappedProject;
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  };

  const selectProject = (project) => {
    setActiveProject(project);
  };

  const clearProject = () => {
    setActiveProject(null);
  };

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      loading,
      error,
      createProject,
      selectProject,
      clearProject,
    }),
    [projects, activeProject, loading, error]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject debe usarse dentro de <ProjectProvider>");
  return ctx;
}