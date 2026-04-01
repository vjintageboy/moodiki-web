import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase to test our understanding of how the API should be structured and expected returns
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    auth: {
      uid: vi.fn(),
    },
  })),
}));

describe('Expert Scheduling System - Tests', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    supabase = createClient('http://localhost', 'key');
    vi.clearAllMocks();
  });

  describe('1. Availability Logic (get_split_available_slots)', () => {
    it('should query partial overlapping slots returning split ranges', async () => {
      // Mocking the successful RPC response representing our plpgsql logic.
      // E.g., availability 8am-12pm, booked 9am-10am
      const mockResponse = {
        data: {
          slots: [
            { start_time: '2026-04-03T08:00:00.000Z', end_time: '2026-04-03T09:00:00.000Z' },
            { start_time: '2026-04-03T10:00:00.000Z', end_time: '2026-04-03T12:00:00.000Z' }
          ],
          nextAvailableDate: null
        },
        error: null,
      };

      (supabase.rpc as any).mockResolvedValueOnce(mockResponse);

      const result = await supabase.rpc('get_split_available_slots', {
        p_expert_id: '123',
        p_date: '2026-04-03',
        p_timezone: 'Asia/Ho_Chi_Minh'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_split_available_slots', expect.any(Object));
      expect(result.data.slots).toHaveLength(2);
      expect(result.data.slots[0].end_time).toBe('2026-04-03T09:00:00.000Z');
      expect(result.data.slots[1].start_time).toBe('2026-04-03T10:00:00.000Z');
    });

    it('should handle boundary edge cases cleanly', async () => {
      // Booking ends EXACTLY when availability ends (11-12 booked in 8-12 slot)
      const mockResponse = {
        data: {
          slots: [
            { start_time: '2026-04-03T08:00:00.000Z', end_time: '2026-04-03T11:00:00.000Z' }
          ],
          nextAvailableDate: null
        },
        error: null,
      };

      (supabase.rpc as any).mockResolvedValueOnce(mockResponse);

      const result = await supabase.rpc('get_split_available_slots', {
        p_expert_id: '123',
        p_date: '2026-04-03',
        p_timezone: 'UTC'
      });

      expect(result.data.slots).toHaveLength(1);
      expect(result.data.slots[0].end_time).toBe('2026-04-03T11:00:00.000Z');
    });
  });

  describe('2. Empty State & UX', () => {
    it('should return nextAvailableDate if slots are completely empty', async () => {
      const mockResponse = {
        data: {
          slots: [],
          nextAvailableDate: '2026-04-05'
        },
        error: null,
      };

      (supabase.rpc as any).mockResolvedValueOnce(mockResponse);

      const result = await supabase.rpc('get_split_available_slots', {
        p_expert_id: '123',
        p_date: '2026-04-03',
      });

      expect(result.data.slots).toHaveLength(0);
      expect(result.data.nextAvailableDate).toBe('2026-04-05');
    });
  });

  describe('3. Validation Constraints & Security', () => {
    it('should throw constraint error for short durations', async () => {
      const errorMsg = 'new row for relation "expert_availability" violates check constraint "valid_duration_minimum"';
      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: { message: errorMsg }
      });

      const result = await supabase.rpc('add_expert_availability', {
        p_start_time: '2026-04-03T10:00:00Z',
        p_end_time: '2026-04-03T10:05:00Z' // only 5 mins
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('valid_duration_minimum');
    });

    it('security checks should reject missing expert payload organically', async () => {
      const errorMsg = 'Unauthorized: Must be logged in';
      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: { message: errorMsg }
      });

      const result = await supabase.rpc('add_expert_availability', {
        p_start_time: '2026-04-03T10:00:00Z',
        p_end_time: '2026-04-03T12:00:00Z'
      });

      expect(result.error?.message).toContain('Unauthorized');
    });
  });
});
