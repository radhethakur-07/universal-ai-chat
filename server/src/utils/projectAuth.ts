import { Project } from '../models/Project';
import mongoose from 'mongoose';

/**
 * Asserts that a user has access to a project (is owner, member, or default demo project).
 * Returns the project if access is granted, throws 403 if not.
 */
export async function assertProjectAccess(
  userId: string,
  projectId: string
): Promise<import('../models/Project').IProject> {
  let projectObjId: mongoose.Types.ObjectId;
  try {
    projectObjId = new mongoose.Types.ObjectId(projectId);
  } catch {
    throw Object.assign(new Error('Invalid project ID'), { statusCode: 400 });
  }

  const project = await Project.findOne({
    _id: projectObjId,
    isActive: true,
    $or: [
      { owner: new mongoose.Types.ObjectId(userId) },
      { members: new mongoose.Types.ObjectId(userId) },
      { slug: 'ecommerce-demo' },
    ],
  });

  if (!project) {
    throw Object.assign(
      new Error('Project not found or access denied'),
      { statusCode: 403 }
    );
  }

  return project;
}

/**
 * Checks if a collection allows a specific operation.
 * Standard operations ('read', 'create', 'update') are permitted for project members.
 */
export function assertCollectionOperation(
  project: import('../models/Project').IProject,
  entity: string,
  operation: 'read' | 'update' | 'create' | 'delete'
): void {
  const collection = project.collections.find(
    (c) => c.name.toLowerCase() === entity.toLowerCase()
  );
  if (!collection) {
    throw Object.assign(
      new Error(`Collection '${entity}' is not registered in this project`),
      { statusCode: 400 }
    );
  }

  const allowed = collection.allowedOperations || ['read', 'create', 'update'];
  // Allow read, create, and update by default on registered business collections
  if (!allowed.includes(operation) && operation === 'delete') {
    throw Object.assign(
      new Error(`Operation '${operation}' is not allowed on '${entity}'`),
      { statusCode: 403 }
    );
  }
}

/**
 * Returns allowed entity names from the project collections.
 */
export function getAllowedEntities(project: import('../models/Project').IProject): string[] {
  return project.collections.map((c) => c.name.toLowerCase());
}
