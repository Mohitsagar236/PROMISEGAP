import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "./password";
import { prisma } from "./prisma";

const sessionCookie = "promisegap_session";
export { hashPassword, verifyPassword };

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
}

export async function currentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookie)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
