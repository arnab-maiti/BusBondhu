import { prisma } from "../config/database.js";

export async function createOperator({ name, description, contact }) {
  return await prisma.operator.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      contact: contact?.trim() || null,
    },
  });
}

export async function getOperators() {
  return await prisma.operator.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          buses: true,
        },
      },
    },
  });
}

export async function getOperatorById(operatorId) {
  return await prisma.operator.findUnique({
    where: {
      id: operatorId,
    },
    include: {
      buses: {
        orderBy: {
          busNumber: "asc",
        },
        select: {
          id: true,
          busNumber: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function updateOperator(operatorId, { name, description, contact }) {
  const existingOperator = await prisma.operator.findUnique({
    where: { id: operatorId },
  });

  if (!existingOperator) {
    return null;
  }

  return await prisma.operator.update({
    where: { id: operatorId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && {
        description: description?.trim() || null,
      }),
      ...(contact !== undefined && {
        contact: contact?.trim() || null,
      }),
    },
  });
}

export default {
  createOperator,
  getOperators,
  getOperatorById,
  updateOperator,
};
