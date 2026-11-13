import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
export type FacebookPagePostStatus='draft'|'scheduled'|'publishing'|'published'|'failed'|'needs_review';
export type FacebookPageMediaType='text'|'image'|'video';
export type FacebookPagePostRow={id:string;user_id:string;page_id:string;media_type:FacebookPageMediaType;message:string;media_url:string|null;status:FacebookPagePostStatus;scheduled_at:string|null;approved_at:string|null;external_post_id:string|null;last_error_code:string|null;lease_expires_at:string|null;attempt_count:number;published_at:string|null;created_at:string;updated_at:string};
@Injectable()
export class FacebookPagePostRepository {
 constructor(private readonly supabase:SupabaseService){}
 async createDraft(input:{userId:string;pageId:string;mediaType:FacebookPageMediaType;message:string;mediaUrl?:string}):Promise<FacebookPagePostRow>{
  const {data,error}=await this.supabase.createServiceRoleClient().from('facebook_page_posts').insert({user_id:input.userId,page_id:input.pageId,media_type:input.mediaType,message:input.message,media_url:input.mediaUrl??null}).select('*').single<FacebookPagePostRow>();
  if(error||!data) throw new ServiceUnavailableException({code:'FACEBOOK_POST_STORAGE_UNAVAILABLE',message:'Could not save Facebook Page post draft'});return data;
 }
 async approveDraft(userId:string,draftId:string,scheduledAt:string):Promise<FacebookPagePostRow>{
  const now=new Date().toISOString();
  const {data,error}=await this.supabase.createServiceRoleClient().from('facebook_page_posts').update({status:'scheduled',approved_at:now,scheduled_at:scheduledAt,updated_at:now,last_error_code:null}).eq('id',draftId).eq('user_id',userId).eq('status','draft').select('*').maybeSingle<FacebookPagePostRow>();
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_STORAGE_UNAVAILABLE',message:'Could not approve Facebook Page post draft'});
  if(!data) throw new ConflictException({code:'FACEBOOK_DRAFT_NOT_APPROVABLE',message:'Draft was not found or is no longer awaiting approval'});return data;
 }
 async listPosts(userId:string,options:{status?:FacebookPagePostStatus;limit:number}):Promise<FacebookPagePostRow[]>{
  let query=this.supabase.createServiceRoleClient().from('facebook_page_posts').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(options.limit);
  if(options.status) query=query.eq('status',options.status);
  const {data,error}=await query.returns<FacebookPagePostRow[]>();
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_STORAGE_UNAVAILABLE',message:'Could not list Facebook Page posts'});return data??[];
 }
 async claimDuePosts(limit:number):Promise<FacebookPagePostRow[]>{
  const {data,error}=await this.supabase.createServiceRoleClient().rpc('claim_due_facebook_page_posts',{p_limit:limit}).returns<FacebookPagePostRow[]>();
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_QUEUE_UNAVAILABLE',message:'Could not claim scheduled Facebook Page posts'});return data??[];
 }
 async recoverStalePosts():Promise<void>{
  const {error}=await this.supabase.createServiceRoleClient().rpc('recover_stale_facebook_page_posts');
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_QUEUE_UNAVAILABLE',message:'Could not recover stale Facebook Page publishing jobs'});
 }
 async markPublished(id:string,externalPostId:string):Promise<void>{
  const now=new Date().toISOString();
  const {error}=await this.supabase.createServiceRoleClient().from('facebook_page_posts').update({status:'published',external_post_id:externalPostId,published_at:now,lease_expires_at:null,last_error_code:null,updated_at:now}).eq('id',id).eq('status','publishing');
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_STORAGE_UNAVAILABLE',message:'Facebook post was sent but its result could not be saved'});
 }
 async markFailed(id:string,errorCode:string):Promise<void>{await this.updatePublishingRow(id,'failed',errorCode);}
 async markNeedsReview(id:string,errorCode:string):Promise<void>{await this.updatePublishingRow(id,'needs_review',errorCode);}
 private async updatePublishingRow(id:string,status:'failed'|'needs_review',errorCode:string):Promise<void>{
  const {error}=await this.supabase.createServiceRoleClient().from('facebook_page_posts').update({status,last_error_code:errorCode,lease_expires_at:null,updated_at:new Date().toISOString()}).eq('id',id).eq('status','publishing');
  if(error) throw new ServiceUnavailableException({code:'FACEBOOK_POST_STORAGE_UNAVAILABLE',message:'Could not update Facebook Page post status'});
 }
}
