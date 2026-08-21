import { Request, Response } from 'express';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const projects = await Project.find({
    $or: [{ owner: new mongoose.Types.ObjectId(userId) }, { members: new mongoose.Types.ObjectId(userId) }],
    isActive: true,
  }).select('name description slug createdAt').lean();
  res.json({ projects });
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json({ project });
};
