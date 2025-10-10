import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';

export class UserController {
    constructor(private readonly userService: UserService) {}

    public getUsers = async (req: Request, res: Response) => {
        try {
            const { page, limit, search, role, status } = req.query;
            const users = await this.userService.getUsers({
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                search: search as string,
                role: role as string,
                status: status as string
            });

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            logger.error('Error getting users', { error });
            throw error;
        }
    };

    public getUserById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error getting user by id', { error });
            throw error;
        }
    };

    public createUser = async (req: Request, res: Response) => {
        try {
            const userData = req.body;
            const user = await this.userService.createUser(userData);

            res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error creating user', { error });
            throw error;
        }
    };

    public updateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userData = req.body;
            const user = await this.userService.updateUser(id, userData);

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error updating user', { error });
            throw error;
        }
    };

    public deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.userService.deleteUser(id);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting user', { error });
            throw error;
        }
    };

    public activateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.userService.activateUser(id);

            res.json({
                success: true,
                message: 'User activated successfully'
            });
        } catch (error) {
            logger.error('Error activating user', { error });
            throw error;
        }
    };

    public deactivateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.userService.deactivateUser(id);

            res.json({
                success: true,
                message: 'User deactivated successfully'
            });
        } catch (error) {
            logger.error('Error deactivating user', { error });
            throw error;
        }
    };

    public resetUserPassword = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;
            await this.userService.resetUserPassword(id, newPassword);

            res.json({
                success: true,
                message: 'User password reset successfully'
            });
        } catch (error) {
            logger.error('Error resetting user password', { error });
            throw error;
        }
    };

    public getRoles = async (_req: Request, res: Response) => {
        try {
            const roles = await this.userService.getRoles();

            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            logger.error('Error getting roles', { error });
            throw error;
        }
    };

    public createRole = async (req: Request, res: Response) => {
        try {
            const roleData = req.body;
            const role = await this.userService.createRole(roleData);

            res.status(201).json({
                success: true,
                data: role
            });
        } catch (error) {
            logger.error('Error creating role', { error });
            throw error;
        }
    };

    public updateRole = async (req: Request, res: Response) => {
        try {
            const { roleId } = req.params;
            const roleData = req.body;
            const role = await this.userService.updateRole(roleId, roleData);

            res.json({
                success: true,
                data: role
            });
        } catch (error) {
            logger.error('Error updating role', { error });
            throw error;
        }
    };

    public deleteRole = async (req: Request, res: Response) => {
        try {
            const { roleId } = req.params;
            await this.userService.deleteRole(roleId);

            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting role', { error });
            throw error;
        }
    };

    public getRolePermissions = async (req: Request, res: Response) => {
        try {
            const { roleId } = req.params;
            const permissions = await this.userService.getRolePermissions(roleId);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting role permissions', { error });
            throw error;
        }
    };

    public updateRolePermissions = async (req: Request, res: Response) => {
        try {
            const { roleId } = req.params;
            const { permissions } = req.body;
            await this.userService.updateRolePermissions(roleId, permissions);

            res.json({
                success: true,
                message: 'Role permissions updated successfully'
            });
        } catch (error) {
            logger.error('Error updating role permissions', { error });
            throw error;
        }
    };

    public getPermissions = async (_req: Request, res: Response) => {
        try {
            const permissions = await this.userService.getPermissions();

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting permissions', { error });
            throw error;
        }
    };

    public createPermission = async (req: Request, res: Response) => {
        try {
            const permissionData = req.body;
            const permission = await this.userService.createPermission(permissionData);

            res.status(201).json({
                success: true,
                data: permission
            });
        } catch (error) {
            logger.error('Error creating permission', { error });
            throw error;
        }
    };

    public updatePermission = async (req: Request, res: Response) => {
        try {
            const { permissionId } = req.params;
            const permissionData = req.body;
            const permission = await this.userService.updatePermission(
                permissionId,
                permissionData
            );

            res.json({
                success: true,
                data: permission
            });
        } catch (error) {
            logger.error('Error updating permission', { error });
            throw error;
        }
    };

    public deletePermission = async (req: Request, res: Response) => {
        try {
            const { permissionId } = req.params;
            await this.userService.deletePermission(permissionId);

            res.json({
                success: true,
                message: 'Permission deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting permission', { error });
            throw error;
        }
    };

    public getUserActivity = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const activity = await this.userService.getUserActivity(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: activity
            });
        } catch (error) {
            logger.error('Error getting user activity', { error });
            throw error;
        }
    };

    public getUserSessions = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const sessions = await this.userService.getUserSessions(id);

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            logger.error('Error getting user sessions', { error });
            throw error;
        }
    };

    public getUserPermissions = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const permissions = await this.userService.getUserPermissions(id);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting user permissions', { error });
            throw error;
        }
    };
}
