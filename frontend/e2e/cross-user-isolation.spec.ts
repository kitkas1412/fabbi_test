import process from "node:process";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const apiBaseURL = "http://127.0.0.1:8000";
const password = "E2eIsolation@123";

interface TokenResponse {
  access_token: string;
}

interface TodoResponse {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
}

function testRunId(): string {
  return (process.env.E2E_RUN_ID ?? Date.now().toString(36))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 24);
}

async function registerUser(
  request: APIRequestContext,
  email: string,
): Promise<TokenResponse> {
  const response = await request.post(`${apiBaseURL}/api/v1/auth/register`, {
    data: { email, password },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as TokenResponse;
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/login") &&
      response.request().method() === "POST",
  );
  const listResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/todos?") &&
      response.request().method() === "GET",
  );

  await page.getByRole("button", { name: "Sign In" }).click();
  expect((await loginResponsePromise).status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(email)).toBeVisible();

  return listResponsePromise;
}

test("prevents user B from viewing or mutating user A's Todo", async ({
  baseURL,
  browser,
  request,
}, testInfo) => {
  if (!baseURL) {
    throw new Error("Playwright baseURL must be configured for Journey 2");
  }

  const healthResponse = await request.get(`${apiBaseURL}/health`);
  expect(
    healthResponse.ok(),
    `Start the backend on ${apiBaseURL} before running Journey 2`,
  ).toBeTruthy();

  const runId = testRunId();
  const accountSuffix = `${runId}-${testInfo.workerIndex}-${testInfo.retry}`;
  const userAEmail = `journey2-a-${accountSuffix}@example.com`;
  const userBEmail = `journey2-b-${accountSuffix}@example.com`;
  const todoTitle = `User A private Todo ${runId}`;
  const todoDescription = "This Todo must remain private to user A";

  const [userATokens] = await Promise.all([
    registerUser(request, userAEmail),
    registerUser(request, userBEmail),
  ]);

  const [userAContext, userBContext] = await Promise.all([
    browser.newContext({ baseURL }),
    browser.newContext({ baseURL }),
  ]);
  const userAPage = await userAContext.newPage();
  const userBPage = await userBContext.newPage();

  let todoId: string | undefined;

  try {
    await login(userAPage, userAEmail);

    await userAPage.getByRole("button", { name: "Add Todo" }).click();
    const createDialog = userAPage.getByRole("dialog", {
      name: "Create Todo",
    });
    await createDialog.getByLabel("Title").fill(todoTitle);
    await createDialog
      .getByLabel("Description (optional)")
      .fill(todoDescription);

    const createResponsePromise = userAPage.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/todos") &&
        response.request().method() === "POST",
    );
    await createDialog.getByRole("button", { name: "Create" }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    const createdTodo = (await createResponse.json()) as TodoResponse;
    todoId = createdTodo.id;

    const userATodo = userAPage
      .getByTestId("todo-item")
      .filter({ hasText: todoTitle });
    await expect(userATodo).toContainText(todoDescription);

    const userBListResponse = await login(userBPage, userBEmail);
    expect(userBListResponse.status()).toBe(200);
    const userBList = (await userBListResponse.json()) as {
      items: TodoResponse[];
    };
    expect(userBList.items).not.toContainEqual(
      expect.objectContaining({ id: todoId }),
    );
    await expect(userBPage.getByText(todoTitle, { exact: true })).toHaveCount(
      0,
    );
    await expect(userBPage.getByText("No todos yet")).toBeVisible();

    const userBAccessToken = await userBPage.evaluate(() =>
      localStorage.getItem("access_token"),
    );
    expect(userBAccessToken).not.toBeNull();
    const userBHeaders = {
      Authorization: `Bearer ${userBAccessToken}`,
    };

    const forbiddenRead = await request.get(
      `${apiBaseURL}/api/v1/todos/${todoId}`,
      { headers: userBHeaders },
    );
    expect(forbiddenRead.status()).toBe(404);

    const forbiddenUpdate = await request.put(
      `${apiBaseURL}/api/v1/todos/${todoId}`,
      {
        headers: userBHeaders,
        data: { title: "Compromised by user B", completed: true },
      },
    );
    expect(forbiddenUpdate.status()).toBe(404);

    const forbiddenDelete = await request.delete(
      `${apiBaseURL}/api/v1/todos/${todoId}`,
      { headers: userBHeaders },
    );
    expect(forbiddenDelete.status()).toBe(404);

    const ownerRead = await request.get(
      `${apiBaseURL}/api/v1/todos/${todoId}`,
      {
        headers: { Authorization: `Bearer ${userATokens.access_token}` },
      },
    );
    expect(ownerRead.status()).toBe(200);
    expect((await ownerRead.json()) as TodoResponse).toMatchObject({
      id: todoId,
      title: todoTitle,
      description: todoDescription,
      completed: false,
    });

    await userAPage.reload();
    const unchangedUserATodo = userAPage
      .getByTestId("todo-item")
      .filter({ hasText: todoTitle });
    await expect(unchangedUserATodo).toContainText(todoDescription);
    await expect(
      unchangedUserATodo.getByRole("checkbox", { name: todoTitle }),
    ).not.toBeChecked();
  } finally {
    if (todoId) {
      await request.delete(`${apiBaseURL}/api/v1/todos/${todoId}`, {
        headers: { Authorization: `Bearer ${userATokens.access_token}` },
      });
    }
    await Promise.all([userAContext.close(), userBContext.close()]);
  }
});
