import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { supabaseAnon } from '../config/database';

// Mock the database module
vi.mock('../config/database', () => ({
  supabaseAnon: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock response
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  it('should return 401 when Authorization header is missing', async () => {
    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authorization header is required',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not use Bearer scheme', async () => {
    mockRequest.headers = { authorization: 'Basic token123' };

    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authorization header must use Bearer scheme',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is empty', async () => {
    mockRequest.headers = { authorization: 'Bearer ' };

    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Token is required',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };

    vi.mocked(supabaseAnon.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token', name: 'AuthError', status: 401 },
    } as any);

    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid or expired token',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user to request and call next when token is valid', async () => {
    const validToken = 'valid-token-123';
    mockRequest.headers = { authorization: `Bearer ${validToken}` };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    vi.mocked(supabaseAnon.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(supabaseAnon.auth.getUser).toHaveBeenCalledWith(validToken);
    expect((mockRequest as any).user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
    });
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    vi.mocked(supabaseAnon.auth.getUser).mockRejectedValue(new Error('Network error'));

    await verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authentication failed',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
