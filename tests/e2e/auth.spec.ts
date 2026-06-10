import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("exibe a página de login", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
  });

  test("redireciona para login quando não autenticado", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("exibe erro para credenciais inválidas", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill("invalido@teste.com");
    await page.getByLabel(/senha/i).fill("senhaerrada");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
