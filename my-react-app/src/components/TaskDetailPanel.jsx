import { useState, useEffect } from "react";
import { User, Calendar, Clock, X, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { TaskStatus } from "../types/task";

const statusColors = {
  [TaskStatus.TODO]: "bg-slate-100 text-slate-700",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [TaskStatus.DONE]: "bg-green-100 text-green-700",
};

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskDetailPanel({ task, onClose, onUpdateTask, projectMembers = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("Media");
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssignee(task.assignee || "");
      setPriority(task.priority || "Media");
      setEstimatedHours(task.estimatedHours || 0);
      setHasChanges(false);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const changed =
      title !== task.title ||
      description !== (task.description || "") ||
      assignee !== (task.assignee || "") ||
      priority !== (task.priority || "Media") ||
      estimatedHours !== (task.estimatedHours || 0);
    setHasChanges(changed);
  }, [title, description, assignee, priority, estimatedHours, task]);

  const handleSave = () => {
    if (!task || !hasChanges) return;
    onUpdateTask(task.id, { title, description, assignee, priority, estimatedHours });
    setHasChanges(false);
  };

  if (!task) {
    return (
      <div className="w-full lg:w-96 border-l border-border bg-card rounded-r-lg flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Selecciona una tarea para ver sus detalles</p>
      </div>
    );
  }

  const safeTimeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
  const safeStatusHistory = Array.isArray(task.statusHistory) ? task.statusHistory : [];

  return (
    <div className="w-full lg:w-96 border-l border-border bg-card rounded-r-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Detalles de la Tarea</h3>
        <div className="flex items-center gap-1">
          {hasChanges && (
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 px-2 gap-1 text-xs">
              <Save className="w-3.5 h-3.5" />
              Guardar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Responsable</Label>
              <Select value={assignee ? String(assignee) : "none"} onValueChange={(val) => setAssignee(val === "none" ? null : Number(val))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {projectMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Estado</Label>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || ""}`}>
                {task.status === TaskStatus.TODO ? "Por Hacer" : task.status === TaskStatus.IN_PROGRESS ? "En Progreso" : "Hecho"}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Horas Estimadas</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Creada</Label>
            <p className="text-sm text-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {formatDate(task.createdAt)}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Historial de Estado</Label>
            <div className="space-y-2">
              {safeStatusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin historial</p>
              ) : (
                safeStatusHistory.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {entry.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      por {entry.changedBy} — {formatDate(entry.changedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Tiempo Registrado</Label>
            <div className="space-y-2">
              {safeTimeEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin tiempo registrado</p>
              ) : (
                safeTimeEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                      {entry.hours}h
                    </Badge>
                    <span className="text-muted-foreground">
                      {entry.loggedBy}
                      {entry.note && <> — "{entry.note}"</>}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}