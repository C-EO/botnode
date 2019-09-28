import {Guild} from "discord.js";
import ytdl from "ytdl-core";
import {PlayerObserver} from "./PlayerObserver";

export class MusicPlayer {

  private get voiceConnection() {
    if (this.guild.voiceConnection) {
      return this.guild.voiceConnection;
    }
    throw new Error("There is no active voice connection.");
  }

  private get dispatcher() {
    if (this.voiceConnection.dispatcher) {
      return this.voiceConnection.dispatcher;
    }
    throw new Error("There isn't any song playing");
  }

  private observers: PlayerObserver[] = [];

  constructor(private guild: Guild) {
  }

  public register(observer: PlayerObserver) {
    this.observers.push(observer);
  }

  public play(url: string) {
    const stream = ytdl(url, {filter: "audioonly", quality: "highestaudio"});
    const dispatcher = this.voiceConnection.playStream(stream);
    dispatcher.on("debug", (information: string) => this.forObservers(observer => observer.onDebug(information)));
    dispatcher.on("end", (reason: string) => this.forObservers(observer => observer.onEnd(reason)));
    dispatcher.on("error", (err: Error) => this.forObservers(observer => observer.onError(err)));
    dispatcher.on("speaking", (value: boolean) => this.forObservers(observer => observer.onSpeaking(value)));
    dispatcher.on("start", () => this.forObservers(observer => observer.onStart()));
    dispatcher.on("volumeChange", (oldVolume: number, newVolume: number) =>
      this.forObservers(observer => observer.onVolumeChange(oldVolume, newVolume)));

  }

  public pause() {
    this.dispatcher.pause();
  }

  public resume() {
    this.dispatcher.resume();
  }

  private forObservers(func: (observer: PlayerObserver) => void) {
    for (const observer of this.observers) {
      func(observer);
    }
  }
}
