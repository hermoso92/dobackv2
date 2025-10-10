import { Request, Response } from 'express';
import { OrganizationService } from '../services/OrganizationService';
import { logger } from '../utils/logger';

export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    public getOrganizations = async (req: Request, res: Response) => {
        try {
            const { page, limit, search } = req.query;
            const organizations = await this.organizationService.getOrganizations({
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                search: search as string
            });

            res.json({
                success: true,
                data: organizations
            });
        } catch (error) {
            logger.error('Error getting organizations', { error });
            throw error;
        }
    };

    public getOrganizationById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organization = await this.organizationService.getOrganizationById(id);

            res.json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error getting organization by id', { error });
            throw error;
        }
    };

    public createOrganization = async (req: Request, res: Response) => {
        try {
            const organizationData = req.body;
            const organization = await this.organizationService.createOrganization(
                organizationData
            );

            res.status(201).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error creating organization', { error });
            throw error;
        }
    };

    public updateOrganization = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationData = req.body;
            const organization = await this.organizationService.updateOrganization(
                id,
                organizationData
            );

            res.json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error updating organization', { error });
            throw error;
        }
    };

    public deleteOrganization = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.organizationService.deleteOrganization(id);

            res.json({
                success: true,
                message: 'Organization deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting organization', { error });
            throw error;
        }
    };

    public getOrganizationConfig = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const config = await this.organizationService.getOrganizationConfig(id);

            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            logger.error('Error getting organization config', { error });
            throw error;
        }
    };

    public updateOrganizationConfig = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const config = req.body;
            await this.organizationService.updateOrganizationConfig(id, config);

            res.json({
                success: true,
                message: 'Organization configuration updated successfully'
            });
        } catch (error) {
            logger.error('Error updating organization config', { error });
            throw error;
        }
    };

    public getOrganizationUsers = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const users = await this.organizationService.getOrganizationUsers(id);

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            logger.error('Error getting organization users', { error });
            throw error;
        }
    };

    public addOrganizationUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userData = req.body;
            const user = await this.organizationService.addOrganizationUser(id, userData);

            res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error adding organization user', { error });
            throw error;
        }
    };

    public removeOrganizationUser = async (req: Request, res: Response) => {
        try {
            const { id, userId } = req.params;
            await this.organizationService.removeOrganizationUser(id, userId);

            res.json({
                success: true,
                message: 'User removed from organization successfully'
            });
        } catch (error) {
            logger.error('Error removing organization user', { error });
            throw error;
        }
    };

    public getOrganizationVehicles = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const vehicles = await this.organizationService.getOrganizationVehicles(id);

            res.json({
                success: true,
                data: vehicles
            });
        } catch (error) {
            logger.error('Error getting organization vehicles', { error });
            throw error;
        }
    };

    public getOrganizationVehicleStats = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const stats = await this.organizationService.getOrganizationVehicleStats(id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting organization vehicle stats', { error });
            throw error;
        }
    };

    public getOrganizationEvents = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate, type, severity } = req.query;
            const events = await this.organizationService.getOrganizationEvents(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                type: type as string,
                severity: severity as string
            });

            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error('Error getting organization events', { error });
            throw error;
        }
    };

    public getOrganizationEventStats = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const stats = await this.organizationService.getOrganizationEventStats(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting organization event stats', { error });
            throw error;
        }
    };

    public getOrganizationStabilityReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const report = await this.organizationService.getOrganizationStabilityReport(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting organization stability report', { error });
            throw error;
        }
    };

    public getOrganizationPerformanceReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const report = await this.organizationService.getOrganizationPerformanceReport(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting organization performance report', { error });
            throw error;
        }
    };

    public getOrganizationMaintenanceReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const report = await this.organizationService.getOrganizationMaintenanceReport(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting organization maintenance report', { error });
            throw error;
        }
    };

    public getOrganizationCustomReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate, metrics } = req.query;
            const report = await this.organizationService.getOrganizationCustomReport(id, {
                startDate: new Date(startDate as string),
                endDate: new Date(endDate as string),
                metrics: (metrics as string).split(',')
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting organization custom report', { error });
            throw error;
        }
    };

    public getOrganizationBilling = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const billing = await this.organizationService.getOrganizationBilling(id);

            res.json({
                success: true,
                data: billing
            });
        } catch (error) {
            logger.error('Error getting organization billing', { error });
            throw error;
        }
    };

    public getOrganizationInvoices = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const invoices = await this.organizationService.getOrganizationInvoices(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: invoices
            });
        } catch (error) {
            logger.error('Error getting organization invoices', { error });
            throw error;
        }
    };

    public getOrganizationUsage = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const usage = await this.organizationService.getOrganizationUsage(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: usage
            });
        } catch (error) {
            logger.error('Error getting organization usage', { error });
            throw error;
        }
    };
}
