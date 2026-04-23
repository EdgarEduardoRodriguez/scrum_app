import { createContext, useContext, useState, useMemo } from "react";

const ProjectContext = createContext(null);

// Proyectos de ejemplo (mock) — luego se reemplaza por llamadas al backend
const MOCK_PROJECTS = [
  {
    id: "1",
    name: "Sistema de Biblioteca Universitaria",
    description: "Desarrollo de sistema para gestión de préstamos y catálogo",
    color: "#007BFF",
    sprintCount: 12,
    tasksTotal: 182,
    tasksCompleted: 124,
    createdAt: "2024-01-15",
    role: "Scrum Master",
  },
  {
    id: "2",
    name: "App Móvil de Pagos",
    description: "Aplicación de pagos en línea para estudiantes universitarios",
    color: "#7C3AED",
    sprintCount: 6,
    tasksTotal: 95,
    tasksCompleted: 40,
    createdAt: "2024-03-10",
    role: "Developer",
  },
];

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState(null);

  const createProject = (data) => {
    const newProject = {
      id: `${Date.now()}`,
      name: data.name,
      description: data.description || "",
      color: data.color || "#007BFF",
      sprintCount: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
      createdAt: new Date().toISOString().split("T")[0],
      role: "Scrum Master",
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const selectProject = (project) => {
    setActiveProject(project);
  };

  const clearProject = () => {
    setActiveProject(null);
  };

  const value = useMemo(
    () => ({ projects, activeProject, createProject, selectProject, clearProject }),
    [projects, activeProject]
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