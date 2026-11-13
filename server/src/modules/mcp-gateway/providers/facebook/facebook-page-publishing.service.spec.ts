import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FacebookPagePublishingService } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service';
describe('FacebookPagePublishingService',()=>{
 const post={id:'draft-1',user_id:'user-1',page_id:'page-1',media_type:'text',message:'Hello Page',media_url:null} as never;
 const make=(api:Record<string,unknown>)=>new FacebookPagePublishingService({getProviderCredential:jest.fn().mockResolvedValue({kind:'oauth',accessToken:'user-token',tokenType:'Bearer'})} as never,api as never);
 it('publishes text to a managed Page using its Page token',async()=>{
  const api={get:jest.fn().mockResolvedValue({data:[{id:'page-1',tasks:['CREATE_CONTENT'],access_token:'page-secret'}]}),post:jest.fn().mockResolvedValue({id:'page-1_123'})};
  const result=await make(api).publish('user-1',post);
  expect(api.post).toHaveBeenCalledWith('page-secret','page-1/feed',{message:'Hello Page'});expect(result).toBe('page-1_123');
 });
 it('rejects a Page the user does not manage',async()=>{
  const api={get:jest.fn().mockResolvedValue({data:[]}),post:jest.fn()};
  await expect(make(api).publish('user-1',post)).rejects.toBeInstanceOf(NotFoundException);expect(api.post).not.toHaveBeenCalled();
 });
 it('rejects a managed Page without content creation task',async()=>{
  const api={get:jest.fn().mockResolvedValue({data:[{id:'page-1',tasks:['MODERATE'],access_token:'page-secret'}]}),post:jest.fn()};
  await expect(make(api).publish('user-1',post)).rejects.toBeInstanceOf(ForbiddenException);expect(api.post).not.toHaveBeenCalled();
 });
 it('publishes an image through the Page photos edge',async()=>{
  const api={get:jest.fn().mockResolvedValue({data:[{id:'page-1',tasks:['MANAGE'],access_token:'page-secret'}]}),post:jest.fn().mockResolvedValue({post_id:'photo-post'})};
  await make(api).publish('user-1',{...post,media_type:'image',media_url:'https://cdn.example.com/image.jpg'} as never);
  expect(api.post).toHaveBeenCalledWith('page-secret','page-1/photos',{url:'https://cdn.example.com/image.jpg',caption:'Hello Page',published:'true'});
 });
 it('publishes a video through the Page videos edge',async()=>{
  const api={get:jest.fn().mockResolvedValue({data:[{id:'page-1',tasks:['CREATE_CONTENT'],access_token:'page-secret'}]}),post:jest.fn().mockResolvedValue({id:'video-post'})};
  await make(api).publish('user-1',{...post,media_type:'video',media_url:'https://cdn.example.com/video.mp4'} as never);
  expect(api.post).toHaveBeenCalledWith('page-secret','page-1/videos',{file_url:'https://cdn.example.com/video.mp4',description:'Hello Page',published:'true'});
 });
 it('rejects non-HTTPS media URLs before contacting Meta',async()=>{
  const api={get:jest.fn(),post:jest.fn()};
  await expect(make(api).publish('user-1',{...post,media_type:'image',media_url:'http://example.com/image.jpg'} as never)).rejects.toThrow('public HTTPS');
  expect(api.get).not.toHaveBeenCalled();
 });
});
