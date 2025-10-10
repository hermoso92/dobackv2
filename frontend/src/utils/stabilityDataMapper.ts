import { StabilityDataPoint } from '../types/stability';
interface DatabaseStabilityData {
    timestamp: string;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    timeantwifi: number;
    usciclo1: number;
    usciclo2: number;
    usciclo3: number;
    usciclo4: number;
    usciclo5: number;
    si: number;
    accmag: number;
    microsds: number;
}

export const mapDatabaseToStabilityDataPoint = (data: DatabaseStabilityData): StabilityDataPoint => {
    return {
        timestamp: data.timestamp,
        time: new Date(data.timestamp).getTime(),
        ax: data.ax,
        ay: data.ay,
        az: data.az,
        gx: data.gx,
        gy: data.gy,
        gz: data.gz,
        roll: data.roll,
        pitch: data.pitch,
        yaw: data.yaw,
        timeantwifi: data.timeantwifi,
        usciclo1: data.usciclo1,
        usciclo2: data.usciclo2,
        usciclo3: data.usciclo3,
        usciclo4: data.usciclo4,
        usciclo5: data.usciclo5,
        si: data.si,
        accmag: data.accmag,
        microsds: data.microsds
    };
};

export const mapDatabaseArrayToStabilityDataPoints = (dataArray: DatabaseStabilityData[]): StabilityDataPoint[] => {
    return dataArray.map(mapDatabaseToStabilityDataPoint);
}; 