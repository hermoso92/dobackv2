export const ALARM_THRESHOLDS = {
    speed: {
        warning: 100, // km/h
        critical: 120 // km/h
    },
    rpm: {
        warning: 6000, // RPM
        critical: 7000 // RPM
    },
    temperature: {
        warning: 80, // °C
        critical: 90 // °C
    },
    fuel: {
        warning: 20, // %
        critical: 10 // %
    },
    battery: {
        warning: 30, // %
        critical: 20 // %
    },
    oil_pressure: {
        warning: 20, // PSI
        critical: 15 // PSI
    },
    brake_pad: {
        warning: 30, // %
        critical: 20 // %
    },
    tire_pressure: {
        warning: 25, // PSI
        critical: 20 // PSI
    },
    roll_angle: {
        warning: 15, // degrees
        critical: 25 // degrees
    },
    pitch_angle: {
        warning: 15, // degrees
        critical: 25 // degrees
    }
}; 