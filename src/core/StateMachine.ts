/**
 * Game state management using a simple state machine
 */
export enum GameState {
  EXPLORING = 'exploring',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory'
}

export class StateMachine {
  private currentState: GameState = GameState.EXPLORING;
  private stateChangeListeners: Map<GameState, Array<() => void>> = new Map();

  getCurrentState(): GameState {
    return this.currentState;
  }

  setState(newState: GameState): void {
    if (this.currentState !== newState) {
      const oldState = this.currentState;
      this.currentState = newState;
      this.notifyStateChange(newState);
      console.log(`State changed: ${oldState} -> ${newState}`);
    }
  }

  onStateChange(state: GameState, callback: () => void): void {
    if (!this.stateChangeListeners.has(state)) {
      this.stateChangeListeners.set(state, []);
    }
    this.stateChangeListeners.get(state)!.push(callback);
  }

  private notifyStateChange(newState: GameState): void {
    const listeners = this.stateChangeListeners.get(newState);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }

  canTransitionTo(state: GameState): boolean {
    // Define valid state transitions
    const transitions: Record<GameState, GameState[]> = {
      [GameState.EXPLORING]: [GameState.PAUSED, GameState.GAME_OVER, GameState.VICTORY],
      [GameState.PAUSED]: [GameState.EXPLORING, GameState.GAME_OVER],
      [GameState.GAME_OVER]: [GameState.EXPLORING],
      [GameState.VICTORY]: [GameState.EXPLORING]
    };

    return transitions[this.currentState].includes(state);
  }
}
