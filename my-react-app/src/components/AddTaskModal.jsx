import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Check, User, AlertTriangle } from "lucide-react";

const priorities = [
  { value: "Alta", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "Media", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "Baja", color: "bg-green-100 text-green-700 border-green-200" },
];

const avatarColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function AddTaskModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Media");
  const [assignee, setAssignee] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    onSave({
      title: title.trim(),
      priority,
      assignee: assignee.trim() || "Sin asignar",
      avatarColor: randomColor,
    });
    setTitle("");
    setPriority("Media");
    setAssignee("");
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Agregar Tarea</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Completa los datos de la nueva tarea</p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">Nombre de la Tarea</Label>
            <Input
              id="task-title"
              placeholder="ej. Diseñar interfaz de usuario"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority" className="text-sm font-medium">Prioridad</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="task-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${p.color}`}>
                        {p.value}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-assignee" className="text-sm font-medium">Asignado a</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="task-assignee"
                className="pl-9"
                placeholder="Nombre de la persona"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="gap-2">
            <Check className="size-4" />
            Crear Tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTaskModal;