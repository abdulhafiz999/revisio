import { Request, Response, NextFunction } from 'express';
import { ApiSuccessResponse } from '../models/types';
import { getUserProfile, updateUserProfile } from '../services/users.service';
import { UpdateProfileRequest } from '../models/types';

export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const profile = await getUserProfile(user.id, user.email);

    const response: ApiSuccessResponse<typeof profile> = {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const body = req.body as UpdateProfileRequest;
    const profile = await updateUserProfile(user.id, user.email, body);

    const response: ApiSuccessResponse<typeof profile> = {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
