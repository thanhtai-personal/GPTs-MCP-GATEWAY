import { HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { FacebookPagePostRepository } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-post.repository';
import { FacebookPagePublishingService } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service';
@Injectable()
export class FacebookPagePublishingWorker implements OnModuleInit,OnModuleDestroy {
 private readonly logger=new Logger(FacebookPagePublishingWorker.name);private timer?:ReturnType<typeof setInterval>;private running=false;
 constructor(private readonly config:AppConfigService,private readonly posts:FacebookPagePostRepository,private readonly publishing:FacebookPagePublishingService){}
 onModuleInit():void{if(process.env.META_PAGE_PUBLISHING_WORKER_ENABLED!=='true'){this.logger.log('Facebook Page publishing worker is disabled');return;}this.timer=setInterval(()=>void this.processDuePosts(),15_000);void this.processDuePosts();}
 onModuleDestroy():void{if(this.timer) clearInterval(this.timer);}
 async processDuePosts():Promise<void>{
  if(this.running||!this.config.metaAppId)return;this.running=true;
  try{await this.posts.recoverStalePosts();const due=await this.posts.claimDuePosts(5);
   for(const post of due){let externalPostId:string;
    try{externalPostId=await this.publishing.publish(post.user_id,post);}
    catch(error){const status=error instanceof HttpException?error.getStatus():503;const response=error instanceof HttpException?error.getResponse():undefined;
     const code=typeof response==='object'&&response!==null&&'code'in response&&typeof response.code==='string'?response.code:'FACEBOOK_PUBLISH_FAILED';
     if(status>=500) await this.posts.markNeedsReview(post.id,code);else await this.posts.markFailed(post.id,code);continue;}
    await this.posts.markPublished(post.id,externalPostId);
   }
  }catch(error){this.logger.error('Facebook Page publishing worker cycle failed',error instanceof Error?error.name:'unknown_error');}
  finally{this.running=false;}
 }
}
