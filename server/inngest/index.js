import { Inngest } from "inngest";
import { prisma } from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

export const inngest = new Inngest({
  id: "Group13-Project",
  eventKey: process.env.INNGEST_EVENT_KEY,
});




// CREATE USER
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", triggers: [{ event: "clerk/user.created" }] },
  async ({ event }) => {
    const { data } = event;

    const email = data?.email_addresses?.[0]?.email_address || "";

    await prisma.user.upsert({
      where: { email }, // ✅ FIX: use email instead of id
      update: {
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        image: data?.image_url || "",
      },
      create: {
        id: data.id,
        email,
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        image: data?.image_url || "",
      },
    });

    return { success: true };
  }
);

// DELETE USER
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: { id: data.id },
    });

    return { success: true };
  }
);

// UPDATE USER
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const { data } = event;

    const email = data?.email_addresses?.[0]?.email_address || "";

    await prisma.user.upsert({
      where: { email }, // ✅ FIX
      update: {
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        image: data?.image_url || "",
      },
      create: {
        id: data.id,
        email,
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        image: data?.image_url || "",
      },
    });

    return { success: true };
  }
);




// CREATE WORKSPACE
const syncWorkspaceCreation = inngest.createFunction(
  { id: "sync-workspace-from-clerk", triggers: [{ event: "clerk/organization.created" }] },
  async ({ event }) => {
    const { data } = event;

    // Ensure USER exists FIRST
    await prisma.user.upsert({
      where: { id: data.created_by },
      update: {},
      create: {
        id: data.created_by,
         email: `temp-${data.created_by}@temp.com`,
        name: "",
        image: "",
      },
    });

    //  UPSERT workspace (no crash)
    await prisma.workspace.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
      create: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    //  SAFE membership
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: data.created_by,
          workspaceId: data.id,
        },
      },
      update: {},
      create: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });

    return { success: true };
  }
);


// UPDATE WORKSPACE
const syncWorkspaceUpdation = inngest.createFunction(
  { id: "update-workspace-from-clerk", triggers: [{ event: "clerk/organization.updated" }] },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
      create: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    return { success: true };
  }
);


// DELETE WORKSPACE
const syncWorkspaceDeletion = inngest.createFunction(
  { id: "delete-workspace-with-clerk", triggers: [{ event: "clerk/organization.deleted" }] },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.delete({
      where: { id: data.id },
    });

    return { success: true };
  }
);




const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: "sync-workspace-member-from-clerk",
    triggers: [{ event: "clerk/organizationMembership.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    const userId =
      data?.user?.id ??
      data?.user_id ??
      data?.userId ??
      data?.user?.user_id;

    const workspaceId =
      data?.organization?.id ??
      data?.organization_id ??
      data?.organizationId;

    const role = (data?.role || "org:member")
      .replace("org:", "")
      .toUpperCase();

    if (!userId || !workspaceId) {
      throw new Error("Invalid membership payload");
    }

    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      update: {},
      create: {
        userId,
        workspaceId,
        role,
      },
    });

    return { success: true };
  }
);


//send mail
const sendTaskAssignmentEmail = inngest.createFunction(
  {
    id: "send-task-assignment-mail",
    triggers: [{ event: "app/task.assigned" }],
  },
  async ({ event, step }) => {
    try {
      const { taskId, origin } = event.data;

      const task = await step.run("fetch-task", async () => {
        return await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        });
      });

      if (!task) {
        throw new Error("Task not found");
      }

      if (!task.assignee?.email) {
        return { skipped: "No email for assignee" };
      }

      await step.run("send-email", async () => {
        await sendEmail({
          to: task.assignee.email,
          subject: `New task assignment in ${task.project.name}`,
          body: `
            <h3>Hi ${task.assignee.name},</h3>
            <p>You have been assigned a new task.</p>
            <p><strong>Task Title:</strong> ${task.title}</p>
            <p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
            <a href="${origin}">View Task</a>
          `
        });
      });

      return { success: true };

    } catch (err) {
      console.error("Email function error:", err);
      throw err;
    }
  }
);
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceUpdation,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail
];