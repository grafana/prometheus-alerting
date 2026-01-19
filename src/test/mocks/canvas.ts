/**
 * Mock for HTMLCanvasElement.getContext
 * Required for @grafana/ui components like Combobox that use measureText
 */

export function mockCanvasContext() {
  HTMLCanvasElement.prototype.getContext = jest.fn(
    () =>
      ({
        measureText: jest.fn(() => ({ width: 100 })),
        fillText: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(() => ({ data: [] })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => []),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        rect: jest.fn(),
        clip: jest.fn(),
      }) as unknown as CanvasRenderingContext2D
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
