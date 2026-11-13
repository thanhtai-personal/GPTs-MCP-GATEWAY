import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import { FacebookGraphApiClient } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-graph-api.client';
import type { FacebookPagePostRow } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-post.repository';
type ManagedPage={accessToken:string};
@Injectable()
export class FacebookPagePublishingService {
 constructor(private readonly api:FacebookGraphApiClient){}
 async validatePageAccess(userAccessToken:string,pageId:string):Promise<void>{await this.resolveManagedPage(userAccessToken,pageId);}
 validateMediaUrl(mediaType:'text'|'image'|'video',mediaUrl?:string):void{
  if(mediaType==='text'&&mediaUrl) throw new BadRequestException({code:'FACEBOOK_MEDIA_URL_INVALID',message:'Text posts do not use mediaUrl'});
  if(mediaType!=='text') this.requirePublicHttpsUrl(mediaUrl??null);
 }
 async publish(userAccessToken:string,post:FacebookPagePostRow):Promise<string>{
  const mediaUrl=post.media_type==='text'?null:this.requirePublicHttpsUrl(post.media_url);
  const page=await this.resolveManagedPage(userAccessToken,post.page_id);
  const path=encodeURIComponent(post.page_id);let result;
  if(post.media_type==='text') result=await this.api.post(page.accessToken,path+'/feed',{message:post.message});
  else if(post.media_type==='image') result=await this.api.post(page.accessToken,path+'/photos',{url:mediaUrl!,caption:post.message,published:'true'});
  else result=await this.api.post(page.accessToken,path+'/videos',{file_url:mediaUrl!,description:post.message,published:'true'});
  const postId=(typeof result.post_id==='string'&&result.post_id)||(typeof result.id==='string'&&result.id);
  if(!postId) throw new BadGatewayException({code:'FACEBOOK_PUBLISH_RESULT_MISSING_ID',message:'Meta may have accepted the publish request but did not return a post identifier'});
  return postId;
 }
 private async resolveManagedPage(userToken:string,pageId:string):Promise<ManagedPage>{
  const response=await this.api.get(userToken,'/me/accounts',{fields:'id,name,tasks,access_token',limit:'100'});
  const rows=Array.isArray(response.data)?response.data:[];
  const page=rows.find((item):item is import('@server/root/modules/mcp-gateway/providers/mcp-provider.types').JsonObject=>isJsonObject(item)&&item.id===pageId);
  if(!page) throw new NotFoundException({code:'FACEBOOK_PAGE_NOT_MANAGED',message:'The connected Facebook account does not manage this Page'});
  const tasks=Array.isArray(page.tasks)?page.tasks.filter((task):task is string=>typeof task==='string'):[];
  if(!tasks.includes('CREATE_CONTENT')&&!tasks.includes('MANAGE')) throw new ForbiddenException({code:'FACEBOOK_PAGE_CREATE_CONTENT_REQUIRED',message:'The connected account lacks the Page CREATE_CONTENT or MANAGE task'});
  if(typeof page.access_token!=='string'||!page.access_token) throw new ForbiddenException({code:'FACEBOOK_PAGE_ACCESS_TOKEN_MISSING',message:'Meta did not return a Page access token for this Page'});
  return {accessToken:page.access_token};
 }
 private requirePublicHttpsUrl(value:string|null):string{
  if(!value) throw new BadRequestException({code:'FACEBOOK_MEDIA_URL_REQUIRED',message:'A public HTTPS media URL is required'});
  let url:URL;try{url=new URL(value);}catch{throw new BadRequestException({code:'FACEBOOK_MEDIA_URL_INVALID',message:'Media URL must be a valid public HTTPS URL'});}
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password) throw new BadRequestException({code:'FACEBOOK_MEDIA_URL_INVALID',message:'Media URL must be a valid public HTTPS URL'});
  return url.toString();
 }
}
