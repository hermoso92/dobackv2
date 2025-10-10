import { del, get, post } from './api';

interface ApiResponse<T> {
    ok: boolean;
    data: T;
    error?: string;
}

export class FileService {
    private static instance: FileService;
    private readonly basePath: string;

    private constructor() {
        this.basePath = '/api/data';
    }

    public static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    public async saveData<T>(filename: string, data: T): Promise<void> {
        try {
            await post<void>(`${this.basePath}/${filename}`, data);
        } catch (error) {
            console.error(`Error saving data to ${filename}:`, error);
            throw new Error(`Failed to save data to ${filename}`);
        }
    }

    public async loadData<T>(filename: string): Promise<T> {
        try {
            return await get<T>(`${this.basePath}/${filename}`);
        } catch (error) {
            console.error(`Error loading data from ${filename}:`, error);
            throw new Error(`Failed to load data from ${filename}`);
        }
    }

    public async fileExists(filename: string): Promise<boolean> {
        try {
            await get<void>(`${this.basePath}/${filename}`);
            return true;
        } catch {
            return false;
        }
    }

    public async deleteFile(filename: string): Promise<void> {
        try {
            await del<void>(`${this.basePath}/${filename}`);
        } catch (error) {
            console.error(`Error deleting file ${filename}:`, error);
            throw new Error(`Failed to delete file ${filename}`);
        }
    }
} 