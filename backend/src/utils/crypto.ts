import bcrypt from 'bcryptjs';
import { logger } from './logger';

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error('Error al hashear contraseña', { error });
        throw new Error('Error al hashear contraseña');
    }
};

export const comparePasswords = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        logger.error('Error al comparar contraseñas', { error });
        throw new Error('Error al comparar contraseñas');
    }
};
