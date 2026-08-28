"use server";

import { revalidatePath } from "next/cache";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserActive,
  updateUser,
} from "@/lib/services";
import { ApiError, userMessage } from "@/lib/api/errors";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/types";

export interface TeamActionState {
  status: "idle" | "error" | "success";
  message?: string;
  memberName?: string;
  allottedChurchId?: string;
  allottedChurchName?: string;
  otherChurch?: boolean;
}

export async function createTeamMemberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Your session has expired. Sign in again." };

  const requestedRole = String(formData.get("role") ?? "CHURCH_STAFF") as Role;
  const requestedChurchId = String(formData.get("churchId") ?? "") || null;
  const churchId =
    session.currentRole === "SUPER_ADMIN"
      ? requestedChurchId
      : requestedChurchId && session.assignedChurches.some((c) => c.id === requestedChurchId)
        ? requestedChurchId
        : session.currentChurch?.id ?? null;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) return { status: "error", message: "Enter the person's full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address for the account." };
  }
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "The two passwords do not match." };
  }
  if (session.currentRole !== "SUPER_ADMIN" && requestedRole === "SUPER_ADMIN") {
    return { status: "error", message: "Only the platform can create platform administrators." };
  }
  if (session.currentRole === "SUPER_ADMIN" && requestedRole !== "SUPER_ADMIN" && !churchId) {
    return { status: "error", message: "Name the church this account belongs to." };
  }

  const result = await createUser(
    { name, email, phone, role: requestedRole, churchId, password, confirmPassword },
    { role: session.currentRole, churchId: session.currentChurch?.id ?? null },
  );

  if (!result.ok) return { status: "error", message: result.error };

  revalidatePath("/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/churches", "layout");

  const allottedChurchName =
    session.assignedChurches.find((c) => c.id === churchId)?.name ??
    session.currentChurch?.name ??
    "the parish";
  const otherChurch = Boolean(churchId && churchId !== session.currentChurch?.id);

  return {
    status: "success",
    memberName: name,
    allottedChurchId: churchId ?? undefined,
    allottedChurchName,
    otherChurch,
    message: otherChurch
      ? `${name} was added as ${requestedRole === "CHURCH_ADMIN" ? "Church Admin" : "Church Staff"} at ${allottedChurchName}. They are not on this church's Team list — switch parish to see them.`
      : `${name} was added to the team at ${allottedChurchName}.`,
  };
}

export async function setTeamMemberActiveAction(
  userId: string,
  isActive: boolean,
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Your session has expired." };

  if (session.currentRole === "CHURCH_STAFF") {
    return { status: "error", message: "You are not able to change team accounts." };
  }
  if (userId === session.currentUser.id) {
    return { status: "error", message: "You cannot deactivate your own account." };
  }

  try {
    await setUserActive(userId, isActive);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/churches", "layout");
  return {
    status: "success",
    message: isActive ? "Account activated." : "Account deactivated.",
  };
}

export async function updateTeamMemberRoleAction(
  userId: string,
  role: Role,
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Your session has expired." };
  if (session.currentRole === "CHURCH_STAFF") {
    return { status: "error", message: "You are not able to change roles." };
  }
  if (role === "SUPER_ADMIN" && session.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only the platform can grant platform administration." };
  }

  try {
    await updateUser(userId, { role });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/churches", "layout");
  return { status: "success", message: "Role updated." };
}

export async function resetUserPasswordAction(
  userId: string,
  password: string,
  confirmPassword: string,
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Your session has expired." };
  if (session.currentRole === "CHURCH_STAFF") {
    return { status: "error", message: "You are not able to reset passwords." };
  }
  if (userId === session.currentUser.id) {
    return { status: "error", message: "Use Change Password for your own account." };
  }
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "The two passwords do not match." };
  }
  try {
    await resetUserPassword(userId, password, confirmPassword);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/churches", "layout");
  return {
    status: "success",
    message: "The password was reset. They must sign in and choose a new password.",
  };
}

export async function deleteTeamMemberAction(userId: string): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Your session has expired." };
  if (session.currentRole === "CHURCH_STAFF") {
    return { status: "error", message: "You are not able to delete accounts." };
  }
  if (userId === session.currentUser.id) {
    return { status: "error", message: "You cannot delete your own account." };
  }
  try {
    await deleteUser(userId);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/churches", "layout");
  return { status: "success", message: "The account has been deleted." };
}
