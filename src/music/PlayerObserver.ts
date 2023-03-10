export interface PlayerObserver {
  onDebug(information: string): void;

  onEnd(): void;

  onError(err: Error): void;

  onSpeaking(value: boolean): void;

  onStart(): void;

  onTogglePause(value: boolean): void;

  onSeek(): void;

  onVolumeChange(): void;
}
