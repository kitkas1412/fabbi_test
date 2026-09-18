import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEFAULT_TODO_PAGE_SIZE,
  todoKeys,
} from "../src/features/todos/api/queryKeys.js";
import { shouldClearSessionForUnauthorized } from "../src/lib/authErrorHandling.js";
import { clearUserSession } from "../src/lib/sessionCleanup.js";

test("todo list keys are isolated by user and pagination", () => {
  const firstPage = todoKeys.list("user-a", 1, 20);

  assert.notDeepEqual(firstPage, todoKeys.list("user-b", 1, 20));
  assert.notDeepEqual(firstPage, todoKeys.list("user-a", 2, 20));
  assert.notDeepEqual(firstPage, todoKeys.list("user-a", 1, 50));
});

test("default Todo page size is bounded by the API limit", () => {
  assert.equal(DEFAULT_TODO_PAGE_SIZE, 100);
});

test("Todo rows use their stable entity ID as the React key", () => {
  const todoListSource = readFileSync(
    "src/features/todos/components/TodoList.tsx",
    "utf8",
  );

  assert.match(todoListSource, /key=\{todo\.id\}/);
  assert.doesNotMatch(todoListSource, /key=\{index\}/);
});

test("clearing a session removes tokens and all cached queries", () => {
  const removedKeys: string[] = [];
  let removeQueriesCalls = 0;

  clearUserSession(
    {
      removeItem: (key) => removedKeys.push(key),
    },
    {
      removeQueries: () => {
        removeQueriesCalls += 1;
      },
    }
  );

  assert.deepEqual(removedKeys, ["access_token", "refresh_token"]);
  assert.equal(removeQueriesCalls, 1);
});

test("login 401 stays with the form while protected requests clear the session", () => {
  assert.equal(shouldClearSessionForUnauthorized(401, "/auth/login"), false);
  assert.equal(
    shouldClearSessionForUnauthorized(401, "/auth/login?next=%2F"),
    false,
  );
  assert.equal(shouldClearSessionForUnauthorized(401, "/todos"), true);
  assert.equal(shouldClearSessionForUnauthorized(400, "/auth/login"), false);
});
