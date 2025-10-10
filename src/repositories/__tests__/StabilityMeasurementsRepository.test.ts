import { Database } from '../../config/database';
import { TestDatabase } from '../../config/testDatabase';
import { StabilityMeasurements } from '../../types/domain';
import { StabilityMeasurementsRepository } from '../StabilityMeasurementsRepository';

describe('StabilityMeasurementsRepository', () => {
    let repository: StabilityMeasurementsRepository;
    let mockMeasurements: StabilityMeasurements[];
    let testDb: Database;

    beforeEach(() => {
        testDb = TestDatabase.getInstance() as unknown as Database;
        repository = new StabilityMeasurementsRepository(testDb);
        mockMeasurements = [{
            id: '1',
            timestamp: new Date(),
            sessionId: 'test-session',
            vehicleId: 'test-vehicle',
            lateralAcc: 0.5,
            longitudinalAcc: 0.5,
            verticalAcc: 0.5,
            roll: 10,
            pitch: 5,
            yaw: 2,
            loadDistribution: {
                frontLeft: 0.25,
                frontRight: 0.25,
                rearLeft: 0.25,
                rearRight: 0.25
            },
            trackWidth: 1.8,
            cgHeight: 0.8
        }];
    });

    describe('processFile', () => {
        it('should process valid CSV file successfully', async () => {
            const mockFile = {
                buffer: Buffer.from('id,timestamp,sessionId,vehicleId,lateralAcc,longitudinalAcc,verticalAcc,roll,pitch,yaw,frontLeft,frontRight,rearLeft,rearRight,trackWidth,cgHeight\n' +
                    '1,2024-01-01T00:00:00Z,test-session,test-vehicle,0.5,0.5,0.5,10,5,2,0.25,0.25,0.25,0.25,1.8,0.8')
            };

            const result = await repository.processFile(mockFile as Express.Multer.File);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '1',
                sessionId: 'test-session',
                vehicleId: 'test-vehicle',
                lateralAcc: 0.5,
                longitudinalAcc: 0.5,
                verticalAcc: 0.5,
                roll: 10,
                pitch: 5,
                yaw: 2,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                trackWidth: 1.8,
                cgHeight: 0.8
            });
        });

        it('should throw error for invalid file format', async () => {
            const mockFile = {
                buffer: Buffer.from('invalid,csv,format')
            };

            await expect(repository.processFile(mockFile as Express.Multer.File))
                .rejects.toThrow('Invalid file format');
        });
    });

    describe('saveBatch', () => {
        it('should save batch of measurements successfully', async () => {
            const result = await repository.saveBatch(mockMeasurements);

            expect(result).toBe(true);
        });

        it('should throw error when database query fails', async () => {
            jest.spyOn(testDb, 'transaction').mockRejectedValueOnce(new Error('Database error'));

            await expect(repository.saveBatch(mockMeasurements))
                .rejects.toThrow('Database error');
        });
    });

    describe('findBySession', () => {
        it('should find measurements by session ID', async () => {
            await repository.saveBatch(mockMeasurements);

            const result = await repository.findBySession('test-session');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                sessionId: 'test-session',
                vehicleId: 'test-vehicle'
            });
        });

        it('should return empty array when no measurements found', async () => {
            const result = await repository.findBySession('non-existent-session');

            expect(result).toHaveLength(0);
        });

        it('should throw error when database query fails', async () => {
            jest.spyOn(testDb, 'query').mockRejectedValueOnce(new Error('Database error'));

            await expect(repository.findBySession('test-session'))
                .rejects.toThrow('Database error');
        });
    });

    describe('deleteBySession', () => {
        it('should delete measurements by session ID', async () => {
            await repository.saveBatch(mockMeasurements);

            const result = await repository.deleteBySession('test-session');

            expect(result).toBe(true);
            const measurements = await repository.findBySession('test-session');
            expect(measurements).toHaveLength(0);
        });

        it('should throw error when database query fails', async () => {
            jest.spyOn(testDb, 'run').mockRejectedValueOnce(new Error('Database error'));

            await expect(repository.deleteBySession('test-session'))
                .rejects.toThrow('Database error');
        });
    });
}); 