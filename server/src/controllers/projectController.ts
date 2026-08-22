import { Request, Response } from 'express';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    // Retrieve projects owned, joined as member, or default demo projects
    const projects = await Project.find({
      $or: [
        { owner: new mongoose.Types.ObjectId(userId) },
        { members: new mongoose.Types.ObjectId(userId) },
        { slug: 'ecommerce-demo' },
      ],
      isActive: true,
    })
      .select('name description slug createdAt collections registeredFunctions')
      .lean();

    res.json({ projects });
  } catch (error) {
    throw error;
  }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let projectObjId: mongoose.Types.ObjectId;
    try {
      projectObjId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    const project = await Project.findOne({
      _id: projectObjId,
      isActive: true,
      $or: [
        { owner: new mongoose.Types.ObjectId(userId) },
        { members: new mongoose.Types.ObjectId(userId) },
        { slug: 'ecommerce-demo' },
      ],
    }).lean();

    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }
    res.json({ project });
  } catch (error) {
    throw error;
  }
};
