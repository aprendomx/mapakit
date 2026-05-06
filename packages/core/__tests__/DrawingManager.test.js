import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrawingManager } from '../src/DrawingManager.js';

describe('DrawingManager', () => {
  let manager;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      on: vi.fn(),
      off: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
      getSource: vi.fn(() => null),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      getLayer: vi.fn(() => null)
    };
    const mockRenderer = { map: mockMap };
    manager = new DrawingManager(mockRenderer);
  });

  it('sets mode and attaches listeners', () => {
    manager.setMode('point');
    expect(manager.mode).toBe('point');
    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('toggles mode off when same mode clicked', () => {
    manager.setMode('point');
    manager.setMode('point');
    expect(manager.mode).toBeNull();
  });

  it('creates point feature on click in point mode', () => {
    const handler = vi.fn();
    manager.on('featureCreated', handler);
    manager.setMode('point');
    
    const clickHandler = mockMap.on.mock.calls.find(c => c[0] === 'click')[1];
    clickHandler({ lngLat: { lng: -99, lat: 19 }, preventDefault: vi.fn() });
    
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      feature: expect.objectContaining({
        geometry: expect.objectContaining({ type: 'Point', coordinates: [-99, 19] })
      })
    }));
    expect(manager.mode).toBeNull();
  });

  it('accumulates vertices in line mode', () => {
    // Return a source object after addSource is called so _updatePreview can call setData
    mockMap.addSource.mockImplementation(() => {
      mockMap.getSource.mockReturnValue({ setData: vi.fn() });
    });
    manager.setMode('line');
    const clickHandler = mockMap.on.mock.calls.find(c => c[0] === 'click')[1];
    clickHandler({ lngLat: { lng: 0, lat: 0 }, preventDefault: vi.fn() });
    clickHandler({ lngLat: { lng: 1, lat: 1 }, preventDefault: vi.fn() });
    expect(manager.vertices).toHaveLength(2);
  });

  it('finishes line on Enter with 2+ vertices', () => {
    const handler = vi.fn();
    manager.on('featureCreated', handler);
    manager.setMode('line');
    manager.vertices = [[0, 0], [1, 1]];

    // Simulate Enter directly
    manager._onKeyDown({ key: 'Enter' });

    expect(handler).toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    manager.setMode('line');
    manager.vertices = [[0, 0]];
    manager._onKeyDown({ key: 'Escape' });
    expect(manager.mode).toBeNull();
    expect(manager.vertices).toEqual([]);
  });

  it('cleans up on destroy', () => {
    manager.setMode('point');
    manager.destroy();
    expect(manager.mode).toBeNull();
    expect(mockMap.off).toHaveBeenCalled();
  });
});
