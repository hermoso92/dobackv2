import { Request, Response } from 'express';

export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
    headers: {},
    body: {},
    params: {},
    query: {},
    file: undefined,
    files: undefined,
    user: undefined,
    ...overrides
});

export const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
}; 