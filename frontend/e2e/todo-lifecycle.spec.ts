import process from "node:process";

import { expect, test } from "@playwright/test";

const password = "E2eTodo@123";

function testRunId(): string {
  return (process.env.E2E_RUN_ID ?? Date.now().toString(36))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 24);
}

test("registers, logs in, and completes the Todo lifecycle", async ({
  page,
  request,
}, testInfo) => {
  const healthResponse = await request.get("http://127.0.0.1:8000/health");
  expect(
    healthResponse.ok(),
    "Start the backend on http://127.0.0.1:8000 before running Journey 1",
  ).toBeTruthy();

  const runId = testRunId();
  const email = `journey1-${runId}-${testInfo.workerIndex}-${testInfo.retry}@example.com`;
  const initialTitle = `Journey 1 Todo ${runId}`;
  const initialDescription = "Created by the Playwright lifecycle journey";
  const updatedTitle = `${initialTitle} updated`;
  const updatedDescription = "Edited before marking the Todo complete";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/register") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create Account" }).click();
  expect((await registerResponsePromise).status()).toBe(201);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Todo App" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign In" }).click();
  expect((await loginResponsePromise).status()).toBe(200);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Add Todo" }).click();
  const createDialog = page.getByRole("dialog", { name: "Create Todo" });
  await createDialog.getByLabel("Title").fill(initialTitle);
  await createDialog
    .getByLabel("Description (optional)")
    .fill(initialDescription);

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/todos") &&
      response.request().method() === "POST",
  );
  await createDialog.getByRole("button", { name: "Create" }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const createdTodoResponse = (await createResponse.json()) as { id: string };

  const createdTodo = page
    .getByTestId("todo-item")
    .filter({ hasText: initialTitle });
  await expect(createdTodo).toContainText(initialDescription);

  await createdTodo
    .getByRole("button", { name: `Edit ${initialTitle}` })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Edit Todo" });
  await editDialog.getByLabel("Title").fill(updatedTitle);
  await editDialog
    .getByLabel("Description (optional)")
    .fill(updatedDescription);

  const editResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/todos/") &&
      response.request().method() === "PUT",
  );
  await editDialog.getByRole("button", { name: "Save" }).click();
  expect((await editResponsePromise).status()).toBe(200);

  const updatedTodo = page
    .getByTestId("todo-item")
    .filter({ hasText: updatedTitle });
  await expect(updatedTodo).toContainText(updatedDescription);
  await expect(page.getByText(initialTitle, { exact: true })).toHaveCount(0);

  const completedCheckbox = updatedTodo.getByRole("checkbox", {
    name: updatedTitle,
  });
  const completeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/todos/") &&
      response.request().method() === "PUT",
  );
  await completedCheckbox.click();
  expect((await completeResponsePromise).status()).toBe(200);
  await expect(completedCheckbox).toBeChecked();

  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/todos/") &&
      response.request().method() === "DELETE",
  );
  await updatedTodo
    .getByRole("button", { name: `Delete ${updatedTitle}` })
    .click();
  expect((await deleteResponsePromise).status()).toBe(204);

  await expect(updatedTodo).toHaveCount(0);
  await expect(page.getByText("No todos yet")).toBeVisible();

  const accessToken = await page.evaluate(() =>
    localStorage.getItem("access_token"),
  );
  expect(accessToken).not.toBeNull();
  const deletedTodoResponse = await request.get(
    `http://127.0.0.1:8000/api/v1/todos/${createdTodoResponse.id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  expect(deletedTodoResponse.status()).toBe(404);

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        accessToken: localStorage.getItem("access_token"),
        refreshToken: localStorage.getItem("refresh_token"),
      })),
    )
    .toEqual({ accessToken: null, refreshToken: null });
});
