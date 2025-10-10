import fs from 'fs/promises';
import path from 'path';

export class FileService {
    private static instance: FileService;
    private readonly basePath: string;

    private constructor() {
        this.basePath = path.join(process.cwd(), 'data');
    }

    public static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    public async saveData<T>(filename: string, data: T): Promise<void> {
        try {
            const filePath = path.join(this.basePath, filename);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Error saving data to ${filename}:`, error);
            throw new Error(`Failed to save data to ${filename}`);
        }
    }

    public async loadData<T>(filename: string): Promise<T> {
        try {
            const filePath = path.join(this.basePath, filename);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as T;
        } catch (error) {
            console.error(`Error loading data from ${filename}:`, error);
            throw new Error(`Failed to load data from ${filename}`);
        }
    }

    public async fileExists(filename: string): Promise<boolean> {
        try {
            const filePath = path.join(this.basePath, filename);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async deleteFile(filename: string): Promise<void> {
        try {
            const filePath = path.join(this.basePath, filename);
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`Error deleting file ${filename}:`, error);
            throw new Error(`Failed to delete file ${filename}`);
        }
    }
} 