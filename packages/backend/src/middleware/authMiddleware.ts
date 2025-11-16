import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Request, Response, NextFunction } from 'express';
import User, { IUserModel } from '../models/User';

interface DecodedToken {
    id: string;
    iat: number;
    exp: number;
}

// Augment Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: IUserModel;
        }
    }
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
            
            req.user = await User.findById(decoded.id).select('-password');
            
            if(!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export const admin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

export const supportManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Support Manager')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as a manager or admin');
    }
}