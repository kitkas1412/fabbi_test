import { useState } from "react";
import { ListFilter, Plus, Tags, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTodos } from "../api/todos";
import {
  DEFAULT_TODO_FILTERS,
  type TodoFilters,
} from "../api/queryKeys";
import { useTags } from "@/features/tags/api/tags";
import { TagManagerDialog } from "@/features/tags/components/TagManagerDialog";
import { TodoBulkActions } from "./TodoBulkActions";
import { TodoFilterBar } from "./TodoFilterBar";
import { TodoList } from "./TodoList";
import { TodoForm } from "./TodoForm";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function TodoPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [filters, setFilters] = useState<Required<TodoFilters>>(DEFAULT_TODO_FILTERS);
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const { data, isLoading, error } = useTodos(user?.id, 1, undefined, filters);
  const { data: tags = [] } = useTags(user?.id);

  const applyFilters = (nextFilters: Required<TodoFilters>) => {
    setFilters(nextFilters);
    setSelectedTodoIds([]);
  };

  const visibleSelectedTodoIds = selectedTodoIds.filter((todoId) =>
    data?.items.some((todo) => todo.id === todoId),
  );

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Todo App</h1>
            {user && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Todos</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep the next piece of work visible.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTagManager(true)}>
                <Tags className="h-4 w-4" />
                Manage tags
              </Button>
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                Add Todo
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListFilter className="h-4 w-4" />
              Focus the list
            </div>
            <TodoFilterBar filters={filters} tags={tags} onApply={applyFilters} />

            {user && (
              <TodoBulkActions
                selectedTodoIds={visibleSelectedTodoIds}
                userId={user.id}
                onComplete={() => setSelectedTodoIds([])}
              />
            )}

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                Loading todos...
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-destructive">
                Failed to load todos. Please try again.
              </div>
            )}

            {data && (
              <TodoList
                todos={data.items}
                selectedTodoIds={visibleSelectedTodoIds}
                onSelectionChange={setSelectedTodoIds}
              />
            )}

            {data && data.total > 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Showing {data.items.length} of {data.total} todos
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Todo Dialog */}
      <TodoForm
        mode="create"
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
      <TagManagerDialog
        open={showTagManager}
        onClose={() => setShowTagManager(false)}
        userId={user?.id}
      />
    </div>
  );
}
