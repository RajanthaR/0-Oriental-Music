import "@testing-library/jest-dom";

// Mock Web Audio API for unit tests
class MockAudioNode {
  connect() {}
  disconnect() {}
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
}

class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = {
    value: 440,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  detune = {
    value: 0,
    setValueAtTime: () => {},
  };
  start() {}
  stop() {}
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();

  createGain() {
    return new MockGainNode();
  }
  createOscillator() {
    return new MockOscillatorNode();
  }
  createAnalyser() {
    return {
      fftSize: 2048,
      getFloatTimeDomainData: () => {},
      connect: () => {},
      disconnect: () => {},
    };
  }
  createMediaStreamSource() {
    return new MockAudioNode();
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

if (typeof window !== "undefined") {
  (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
  (window as unknown as { webkitAudioContext: typeof MockAudioContext }).webkitAudioContext = MockAudioContext;
}
