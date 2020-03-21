import express, {NextFunction, Response, Router} from "express";
import {Bot} from "./Bot";
import {YoutubeService} from "./music/YoutubeService";

export class WebRouter {

    private readonly router: Router;
    private readonly bot: Bot;

    constructor() {
        this.router = express.Router();
        this.bot = Bot.getInstance();
    }

    public setup(): Router {
        this.router.get("/:guildId/queue/:url", (req: any, res: any, next: any) => {
            this.handleResponse(this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).queue(req.params.url), res);
        });
        this.router.get("/:guildId/next/:url", (req: any, res: any, next: any) => {
            this.handleResponse(this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).playNext(req.params.url), res);
        });
        this.router.get("/:guildId/now/:url", (req: any, res: any, next: any) => {
            this.handleResponse(this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).playNow(req.params.url), res);
        });
        this.router.get("/:guildId/skip", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).skip(), res);
        });
        this.router.get("/:guildId/skipBack", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).skipBack(), res);
        });
        this.router.get("/:guildId/togglePause", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).togglePause(), res);
        });
        this.router.get("/:guildId/volumeUp", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).increseVolume(), res);
        });
        this.router.get("/:guildId/volumeDown", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).decreseVolume(), res);
        });
        this.router.get("/:guildId/remove/:id", (req: any, res: any, next: any) => {
            this.handleResponse(() => this.bot.getGuildMusicManagerByIdIfExists(req.params.guildId).removeTrackById(req.params.id), res);
        });
        this.router.get("/youtube/key", (req: any, res: any, next: any) => {
            res.send({key: YoutubeService.getKey()});
        });
        return this.router;
    }

    private handleResponse(promise: (() => void) | Promise<any>, res: Response) {
        if (promise instanceof Promise) {
            promise.then(() => this.ok(res)).catch(err => this.error(err, res));
        } else {
            try {
                promise();
                this.ok(res);
            } catch
                (e) {
                this.error(e, res);
            }
        }
    }

    private ok(res: Response) {
        res.status(200).send({status: 200, message: "OK"});
    }

    private error(err: any, res: Response) {
        console.error(err);
        res.status(500).send({status: 500, message: err});
    }
}
