import { FacebookPagePublishingWorker } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.worker';
describe('FacebookPagePublishingWorker',()=>{
 const config={metaAppId:'app-id'} as never;const due=[{id:'post-1',user_id:'user-1'}] as never;
 it('claims and publishes due posts once, then records the Page post id',async()=>{
  const posts={recoverStalePosts:jest.fn(),claimDuePosts:jest.fn().mockResolvedValue(due),markPublished:jest.fn(),markFailed:jest.fn(),markNeedsReview:jest.fn()};
  const publishing={publish:jest.fn().mockResolvedValue('page-post-1')};
  const worker=new FacebookPagePublishingWorker(config,posts as never,publishing as never);
  await worker.processDuePosts();expect(posts.claimDuePosts).toHaveBeenCalledWith(5);expect(publishing.publish).toHaveBeenCalledWith('user-1',due[0]);expect(posts.markPublished).toHaveBeenCalledWith('post-1','page-post-1');
 });
 it('moves ambiguous network failures to manual review instead of retrying',async()=>{
  const posts={recoverStalePosts:jest.fn(),claimDuePosts:jest.fn().mockResolvedValue(due),markPublished:jest.fn(),markFailed:jest.fn(),markNeedsReview:jest.fn()};
  const publishing={publish:jest.fn().mockRejectedValue(new Error('network timeout'))};
  const worker=new FacebookPagePublishingWorker(config,posts as never,publishing as never);
  await worker.processDuePosts();expect(posts.markNeedsReview).toHaveBeenCalledWith('post-1','FACEBOOK_PUBLISH_FAILED');expect(posts.markFailed).not.toHaveBeenCalled();
 });
});
