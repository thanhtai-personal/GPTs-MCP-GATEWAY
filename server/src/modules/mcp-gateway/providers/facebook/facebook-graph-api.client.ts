import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type { JsonObject } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
@Injectable()
export class FacebookGraphApiClient {
 constructor(private readonly config:AppConfigService){}
 get(accessToken:string,path:string,query?:Record<string,string>){const url=this.url(path);for(const [key,value] of Object.entries(query??{}))url.searchParams.set(key,value);return this.request(url,accessToken,{method:'GET'});}
 post(accessToken:string,path:string,body:Record<string,string>){return this.request(this.url(path),accessToken,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});}
 private url(path:string):URL{return new URL('https://graph.facebook.com/'+this.config.metaGraphApiVersion+'/'+path.replace(/^\/+/,''));}
 private async request(url:URL,accessToken:string,init:RequestInit):Promise<JsonObject>{
  let response:Response;
  try{response=await fetch(url,{...init,headers:{...Object.fromEntries(new Headers(init.headers).entries()),Authorization:'Bearer '+accessToken,Accept:'application/json'},signal:AbortSignal.timeout(this.config.upstreamTimeoutMs)});}
  catch(error){throw new ServiceUnavailableException({code:'FACEBOOK_GRAPH_API_UNAVAILABLE',message:'Meta Graph API is unavailable',details:{cause:error instanceof Error?error.name:'network_error'}});}
  let payload:unknown;try{payload=await response.json();}catch{payload=null;}
  if(!response.ok){
   const graphError=isJsonObject(payload)&&isJsonObject(payload.error)?payload.error:{};
   const graphCode=typeof graphError.code==='number'?graphError.code:undefined;
   const message=typeof graphError.message==='string'?graphError.message:'Meta Graph API request failed';
   if(response.status===401||graphCode===190)throw new UnauthorizedException({code:'FACEBOOK_RECONNECT_REQUIRED',message:'Facebook authorization must be reconnected'});
   if(response.status===403)throw new ForbiddenException({code:'FACEBOOK_PERMISSION_DENIED',message:'The connected Facebook account lacks permission for this operation'});
   if(response.status===400)throw new BadRequestException({code:'FACEBOOK_REQUEST_INVALID',message:'Meta Graph API rejected the request',details:{upstreamMessage:message.slice(0,240)}});
   throw new BadGatewayException({code:'FACEBOOK_GRAPH_API_FAILED',message:'Meta Graph API request failed',details:{status:response.status}});
  }
  if(!isJsonObject(payload))throw new BadGatewayException({code:'FACEBOOK_GRAPH_API_INVALID_RESPONSE',message:'Meta Graph API returned an unexpected response'});
  return payload;
 }
}
