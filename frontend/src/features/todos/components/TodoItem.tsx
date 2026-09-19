import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Todo } from "../api/todos";

interface TodoItemProps {
  todo: Todo;
  selected: boolean;
  onSelect: (todoId: string, selected: boolean) => void;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TodoItem({
  todo,
  selected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}: TodoItemProps) {
  // Older cached responses may predate the optional Tag extension. Rendering
  // an untagged Todo must remain safe during a rolling frontend/backend deploy.
  const tags = todo.tags ?? [];

  return (
    <div
      data-testid="todo-item"
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <Checkbox
          id={`select-todo-${todo.id}`}
          checked={selected}
          aria-label="Select for bulk action"
          onCheckedChange={(isSelected) => onSelect(todo.id, isSelected === true)}
        />
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <label
          htmlFor={`todo-${todo.id}`}
          className={`text-sm font-medium cursor-pointer ${
            todo.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.title}
        </label>
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {todo.description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Todo tags">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  borderColor: tag.color || "#94a3b8",
                  color: tag.color || "#475569",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color || "#64748b" }}
                  aria-hidden="true"
                />
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Edit ${todo.title}`}
          onClick={() => onEdit(todo)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          aria-label={`Delete ${todo.title}`}
          onClick={() => onDelete(todo)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
