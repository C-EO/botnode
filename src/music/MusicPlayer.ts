import {Guild, StreamDispatcher} from "discord.js";
import {PlayerObserver} from "./PlayerObserver";
import {YoutubeService} from "./YoutubeService";

export class MusicPlayer {

  private get voiceConnection() {
    if (this.guild.voice && this.guild.voice.connection) {
      return this.guild.voice.connection;
    }
    throw new Error("Voice not connected. Add the Bot to a voice channel.");
  }

  private get dispatcher() {
    if (this.voiceConnection.dispatcher) {
      return this.voiceConnection.dispatcher;
    }
    throw new Error("There isn't any song playing");
  }

  private observers: PlayerObserver[] = [];

  private url: string = null;
  private startingSeconds: number = 0;
  private volume: number = 20;

  constructor(private guild: Guild) {
    if (process.env.DEFAULT_VOLUME != null) {
      this.setVolume(parseInt(process.env.DEFAULT_VOLUME, 10));
    }
  }

  public register(observer: PlayerObserver) {
    this.observers.push(observer);
  }

  public play(url: string) {
    this.stop();
    this.url = url;
    const stream = YoutubeService.getInstance().getStream(url);
    this.startingSeconds = 0;
    const dispatcher = this.voiceConnection.play(stream, {highWaterMark: 1, volume: this.getVolumeInternal()});
    this.registerListeners(dispatcher);
  }

  public seek(seconds: number): void {
    if (this.url != null) {
      this.startingSeconds = seconds;
      const stream = YoutubeService.getInstance().getStream(this.url + '&start=' + seconds);
      if (this.isCurrentlyPlaying()) {
        this.dispatcher.removeAllListeners();
        this.dispatcher.end();
      }
      const dispatcher = this.voiceConnection.play(stream, {
        highWaterMark: 1,
        seek: seconds,
        volume: this.getVolumeInternal()
      });
      this.forObservers(observer => observer.onSeek())
      this.registerListeners(dispatcher);
    }
  }

  private registerListeners(dispatcher: StreamDispatcher): void {
    dispatcher.on("debug", (information: string) => this.forObservers(observer => observer.onDebug(information)));
    dispatcher.on("start", () => this.forObservers(observer => observer.onStart()));
    dispatcher.on("finish", () => this.forObservers(observer => observer.onEnd()));
    dispatcher.on("error", (err: Error) => this.forObservers(observer => observer.onError(err)));
    dispatcher.on("speaking", (value: boolean) => this.forObservers(observer => observer.onSpeaking(value)));
  }

  public pause() {
    if (this.isCurrentlyPlaying()) {
      this.dispatcher.pause();
    }
    this.forObservers(observer => observer.onTogglePause(this.isPaused()));
  }

  public resume() {
    if (this.isCurrentlyPlaying()) {
      this.dispatcher.resume();
    }
    this.forObservers(observer => observer.onTogglePause(this.isPaused()));
  }

  public isPaused(): boolean {
    if (this.isCurrentlyPlaying()) {
      return this.dispatcher.paused;
    }
    return true;
  }

  public isCurrentlyPlaying() {
    return this.isConnected() && this.guild.voice.connection.dispatcher && !this.dispatcher.writableEnded;
  }

  public isConnected() {
    return this.guild && this.guild.voice && this.guild.voice.connection;
  }

  public getPosition(): number {
    return Math.floor(this.dispatcher.streamTime / 1000) + this.startingSeconds;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(volume: number): void {
    volume = Math.min(150, Math.abs(volume));
    if (!isNaN(volume)) {
      this.volume = volume;
      if (this.isCurrentlyPlaying() && this.dispatcher.volumeEditable) {
        this.dispatcher.setVolume(this.getVolumeInternal());
      }
      this.forObservers(observer => observer.onVolumeChange())
    } else {
      console.error(`Volume ${volume} couldn't be applied.`);
    }
  }

  private getVolumeInternal() {
    return this.volume / 100;
  }

  public stop() {
    this.url = null;
    if (this.isCurrentlyPlaying()) {
      this.dispatcher.end();
      this.dispatcher.removeAllListeners();
    }
  }

  private forObservers(func: (observer: PlayerObserver) => void) {
    for (const observer of this.observers) {
      func(observer);
    }
  }

  public validateCurrentlyPlaying() {
    return !!!this.dispatcher;
  }
}
